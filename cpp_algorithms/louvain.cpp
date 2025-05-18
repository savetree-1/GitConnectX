#include "graph.h"
#include <vector>
#include <unordered_map>
#include <cmath>
#include <algorithm>
#include <stdexcept>
#include <sstream>
#include <iomanip>

class Louvain {
private:
    struct Community {
        std::vector<size_t> nodes;
        double totalWeight;
        std::unordered_map<size_t, double> connections;
        
        Community() : totalWeight(0.0) {}
        
        void addNode(size_t node, const Graph& graph) {
            nodes.push_back(node);
            for (const auto& neighbor : graph.getNeighbors(static_cast<int>(node))) {
                connections[static_cast<size_t>(neighbor.first)] += neighbor.second;
                totalWeight += neighbor.second;
            }
        }
        
        void removeNode(size_t node, const Graph& graph) {
            nodes.erase(std::remove(nodes.begin(), nodes.end(), node), nodes.end());
            for (const auto& neighbor : graph.getNeighbors(static_cast<int>(node))) {
                connections[static_cast<size_t>(neighbor.first)] -= neighbor.second;
                if (connections[static_cast<size_t>(neighbor.first)] <= 0.0) {
                    connections.erase(static_cast<size_t>(neighbor.first));
                }
                totalWeight -= neighbor.second;
            }
        }
        
        bool hasNode(size_t node) const {
            return std::find(nodes.begin(), nodes.end(), node) != nodes.end();
        }
        
        size_t size() const { return nodes.size(); }
    };

    static double calculateModularity(
        const std::vector<Community>& communities,
        const Graph& graph,
        double totalWeight) {
        if (totalWeight <= 0.0) {
            throw std::invalid_argument("Total weight must be positive");
        }
        
        double modularity = 0.0;
        
        for (const auto& community : communities) {
            for (const size_t node : community.nodes) {
                for (const auto& neighbor : graph.getNeighbors(static_cast<int>(node))) {
                    if (community.hasNode(static_cast<size_t>(neighbor.first))) {
                        modularity += neighbor.second - 
                            (community.totalWeight * community.totalWeight) / 
                            (2.0 * totalWeight);
                    }
                }
            }
        }
        
        return modularity / (2.0 * totalWeight);
    }

    static double calculateDeltaModularity(
        size_t node,
        size_t community,
        const std::vector<Community>& communities,
        const Graph& graph,
        double totalWeight) {
        if (totalWeight <= 0.0) {
            throw std::invalid_argument("Total weight must be positive");
        }
        if (community >= communities.size()) {
            throw std::out_of_range("Invalid community index");
        }
        
        double ki = 0.0;
        double ki_in = 0.0;
        
        for (const auto& neighbor : graph.getNeighbors(static_cast<int>(node))) {
            ki += neighbor.second;
            if (communities[community].hasNode(static_cast<size_t>(neighbor.first))) {
                ki_in += neighbor.second;
            }
        }
        
        return ki_in - (ki * communities[community].totalWeight) / totalWeight;
    }

public:
    struct Result {
        std::vector<size_t> communities;
        size_t numCommunities;
        double modularity;
        size_t iterations;
        bool converged;
        
        Result(const std::vector<size_t>& comms, double mod, size_t iters, bool conv) 
            : communities(comms), modularity(mod), iterations(iters), converged(conv) {
            numCommunities = comms.empty() ? 0 :
                *std::max_element(comms.begin(), comms.end()) + 1;
        }
        
        std::string getSummary() const {
            std::ostringstream oss;
            oss << std::fixed << std::setprecision(6);
            
            oss << "Louvain Community Detection Results:\n";
            oss << "Number of communities: " << numCommunities << "\n";
            oss << "Modularity: " << modularity << "\n";
            oss << "Iterations: " << iterations;
            oss << (converged ? " (converged)" : " (max iterations reached)") << "\n\n";
            
            // ::::: Get community sizes
            std::vector<size_t> sizes(numCommunities, 0);
            for (size_t comm : communities) {
                sizes[comm]++;
            }
            
            oss << "Community sizes:\n";
            for (size_t i = 0; i < numCommunities; ++i) {
                oss << "Community " << i << ": " << sizes[i] << " nodes\n";
            }
            
            return oss.str();
        }
    };

    static Result detectCommunities(
        const Graph& graph,
        size_t maxIterations = 100) {
        if (maxIterations == 0) {
            throw std::invalid_argument("Maximum iterations must be positive");
        }
        
        size_t n = static_cast<size_t>(graph.getNumVertices());
        if (n == 0) {
            throw std::invalid_argument("Graph is empty");
        }
        
        std::vector<size_t> communities(n);
        std::vector<Community> communityStructs;
        
        // ::::: Initialize each node as its own community
        for (size_t i = 0; i < n; ++i) {
            communities[i] = i;
            Community c;
            c.addNode(i, graph);
            communityStructs.push_back(c);
        }
        
        // ::::: Calculate total weight
        double totalWeight = 0.0;
        for (const auto& community : communityStructs) {
            totalWeight += community.totalWeight;
        }
        totalWeight /= 2.0;  // ::::: Each edge is counted twice
        
        if (totalWeight <= 0.0) {
            throw std::runtime_error("Graph has no edges");
        }
        
        bool improved;
        size_t iteration = 0;
        double currentModularity = calculateModularity(communityStructs, graph, totalWeight);
        
        do {
            improved = false;
            
            // ::::: Try to move each node to a different community
            for (size_t node = 0; node < n; ++node) {
                size_t currentCommunity = communities[node];
                double bestDeltaModularity = 0.0;
                size_t bestCommunity = currentCommunity;
                
                // ::::: Try moving to each neighboring community
                for (const auto& neighbor : graph.getNeighbors(static_cast<int>(node))) {
                    size_t neighborCommunity = communities[static_cast<size_t>(neighbor.first)];
                    if (neighborCommunity != currentCommunity) {
                        double deltaModularity = calculateDeltaModularity(
                            node, neighborCommunity, communityStructs, graph, totalWeight);
                        
                        if (deltaModularity > bestDeltaModularity) {
                            bestDeltaModularity = deltaModularity;
                            bestCommunity = neighborCommunity;
                        }
                    }
                }
                
                // ::::: Move node if improvement found
                if (bestCommunity != currentCommunity) {
                    // ::::: Remove from current community
                    communityStructs[currentCommunity].removeNode(node, graph);
                    
                    // ::::: Add to new community
                    communityStructs[bestCommunity].addNode(node, graph);
                    communities[node] = bestCommunity;
                    
                    improved = true;
                }
            }
            
            iteration++;
            
            // ::::: Update modularity
            if (improved) {
                currentModularity = calculateModularity(communityStructs, graph, totalWeight);
            }
        } while (improved && iteration < maxIterations);
        
        return Result(communities, currentModularity, iteration, !improved);
    }
    
    static std::vector<std::vector<size_t>> getCommunityMembers(const Result& result) {
        if (result.communities.empty()) {
            return {};
        }
        
        std::vector<std::vector<size_t>> communityMembers(result.numCommunities);
        
        for (size_t i = 0; i < result.communities.size(); ++i) {
            communityMembers[result.communities[i]].push_back(i);
        }
        
        return communityMembers;
    }
    
    static std::vector<std::pair<size_t, size_t>> getCommunityEdges(
        const Graph& graph, const Result& result) {
        std::vector<std::pair<size_t, size_t>> edges;
        
        for (size_t i = 0; i < static_cast<size_t>(graph.getNumVertices()); ++i) {
            size_t sourceCommunity = result.communities[i];
            for (const auto& neighbor : graph.getNeighbors(static_cast<int>(i))) {
                size_t targetCommunity = result.communities[static_cast<size_t>(neighbor.first)];
                if (sourceCommunity < targetCommunity) {
                    edges.push_back({sourceCommunity, targetCommunity});
                }
            }
        }
        
        // ::::: Remove duplicates
        std::sort(edges.begin(), edges.end());
        edges.erase(std::unique(edges.begin(), edges.end()), edges.end());
        
        return edges;
    }
    
    static double calculateConductance(
        const Graph& graph, const std::vector<size_t>& community) {
        if (community.empty()) {
            throw std::invalid_argument("Community is empty");
        }
        
        double cutSize = 0.0;
        double volumeS = 0.0;
        double volumeTotal = 0.0;
        
        std::unordered_set<size_t> communitySet(community.begin(), community.end());
        
        for (size_t node = 0; node < static_cast<size_t>(graph.getNumVertices()); ++node) {
            bool inCommunity = communitySet.find(node) != communitySet.end();
            double nodeVolume = 0.0;
            
            for (const auto& neighbor : graph.getNeighbors(static_cast<int>(node))) {
                nodeVolume += neighbor.second;
                bool neighborInCommunity = communitySet.find(static_cast<size_t>(neighbor.first)) != communitySet.end();
                
                if (inCommunity && !neighborInCommunity) {
                    cutSize += neighbor.second;
                }
            }
            
            volumeTotal += nodeVolume;
            if (inCommunity) {
                volumeS += nodeVolume;
            }
        }
        
        double denominator = std::min(volumeS, volumeTotal - volumeS);
        return denominator > 0.0 ? cutSize / denominator : 1.0;
    }
}; 