#include "graph.h"
#include <vector>
#include <unordered_map>
#include <cmath>
#include <algorithm>

class Louvain {
private:
    struct Community {
        std::vector<int> nodes;
        double totalWeight;
        std::unordered_map<int, double> connections;
    };

    static double calculateModularity(
        const std::vector<Community>& communities,
        const Graph& graph,
        double totalWeight) {
        double modularity = 0.0;
        
        for (const auto& community : communities) {
            for (int node : community.nodes) {
                for (const auto& neighbor : graph.getNeighbors(node)) {
                    if (std::find(community.nodes.begin(), 
                                community.nodes.end(), 
                                neighbor.first) != community.nodes.end()) {
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
        int node,
        int community,
        const std::vector<Community>& communities,
        const Graph& graph,
        double totalWeight) {
        double ki = 0.0;
        double ki_in = 0.0;
        
        for (const auto& neighbor : graph.getNeighbors(node)) {
            ki += neighbor.second;
            if (std::find(communities[community].nodes.begin(),
                         communities[community].nodes.end(),
                         neighbor.first) != communities[community].nodes.end()) {
                ki_in += neighbor.second;
            }
        }
        
        return ki_in - (ki * communities[community].totalWeight) / totalWeight;
    }

public:
    static std::vector<int> detectCommunities(
        const Graph& graph,
        int maxIterations = 100) {
        int n = graph.getNumVertices();
        std::vector<int> communities(n);
        std::vector<Community> communityStructs;
        
        // Initialize each node as its own community
        for (int i = 0; i < n; ++i) {
            communities[i] = i;
            Community c;
            c.nodes.push_back(i);
            c.totalWeight = 0.0;
            for (const auto& neighbor : graph.getNeighbors(i)) {
                c.totalWeight += neighbor.second;
                c.connections[neighbor.first] = neighbor.second;
            }
            communityStructs.push_back(c);
        }
        
        // Calculate total weight
        double totalWeight = 0.0;
        for (const auto& community : communityStructs) {
            totalWeight += community.totalWeight;
        }
        totalWeight /= 2.0;  // Each edge is counted twice
        
        bool improved;
        int iteration = 0;
        
        do {
            improved = false;
            
            // Try to move each node to a different community
            for (int node = 0; node < n; ++node) {
                int currentCommunity = communities[node];
                double bestDeltaModularity = 0.0;
                int bestCommunity = currentCommunity;
                
                // Try moving to each neighboring community
                for (const auto& neighbor : graph.getNeighbors(node)) {
                    int neighborCommunity = communities[neighbor.first];
                    if (neighborCommunity != currentCommunity) {
                        double deltaModularity = calculateDeltaModularity(
                            node, neighborCommunity, communityStructs, graph, totalWeight);
                        
                        if (deltaModularity > bestDeltaModularity) {
                            bestDeltaModularity = deltaModularity;
                            bestCommunity = neighborCommunity;
                        }
                    }
                }
                
                // Move node if improvement found
                if (bestCommunity != currentCommunity) {
                    // Remove from current community
                    auto& currentComm = communityStructs[currentCommunity];
                    currentComm.nodes.erase(
                        std::remove(currentComm.nodes.begin(),
                                  currentComm.nodes.end(),
                                  node),
                        currentComm.nodes.end());
                    
                    // Add to new community
                    communityStructs[bestCommunity].nodes.push_back(node);
                    communities[node] = bestCommunity;
                    
                    improved = true;
                }
            }
            
            iteration++;
        } while (improved && iteration < maxIterations);
        
        return communities;
    }
    
    static std::vector<std::vector<int>> getCommunityMembers(
        const std::vector<int>& communities) {
        std::unordered_map<int, std::vector<int>> communityMap;
        
        for (int i = 0; i < communities.size(); ++i) {
            communityMap[communities[i]].push_back(i);
        }
        
        std::vector<std::vector<int>> result;
        for (const auto& pair : communityMap) {
            result.push_back(pair.second);
        }
        
        return result;
    }
}; 