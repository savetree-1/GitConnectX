#include "graph.h"
#include <vector>
#include <cmath>
#include <unordered_map>

class PageRank {
public:
    static std::vector<double> calculate(const Graph& graph, 
                                       double dampingFactor = 0.85,
                                       int maxIterations = 100,
                                       double tolerance = 1e-10) {
        int n = graph.getNumVertices();
        std::vector<double> ranks(n, 1.0 / n);
        std::vector<double> newRanks(n);
        
        // Calculate out-degrees
        std::vector<int> outDegrees(n, 0);
        for (int i = 0; i < n; ++i) {
            outDegrees[i] = graph.getNeighbors(i).size();
        }
        
        for (int iter = 0; iter < maxIterations; ++iter) {
            // Initialize new ranks with damping factor
            double sum = 0.0;
            for (int i = 0; i < n; ++i) {
                newRanks[i] = (1.0 - dampingFactor) / n;
                sum += newRanks[i];
            }
            
            // Distribute PageRank
            for (int i = 0; i < n; ++i) {
                if (outDegrees[i] > 0) {
                    double share = ranks[i] * dampingFactor / outDegrees[i];
                    for (const auto& neighbor : graph.getNeighbors(i)) {
                        newRanks[neighbor.first] += share;
                    }
                } else {
                    // Handle dangling nodes
                    double share = ranks[i] * dampingFactor / n;
                    for (int j = 0; j < n; ++j) {
                        newRanks[j] += share;
                    }
                }
            }
            
            // Check convergence
            double diff = 0.0;
            for (int i = 0; i < n; ++i) {
                diff += std::abs(newRanks[i] - ranks[i]);
            }
            
            if (diff < tolerance) {
                break;
            }
            
            ranks = newRanks;
        }
        
        return ranks;
    }
    
    static std::vector<std::pair<int, double>> getTopNodes(
        const std::vector<double>& ranks, int k) {
        std::vector<std::pair<int, double>> nodes;
        for (int i = 0; i < ranks.size(); ++i) {
            nodes.push_back({i, ranks[i]});
        }
        
        std::partial_sort(nodes.begin(), 
                         nodes.begin() + std::min(k, (int)nodes.size()),
                         nodes.end(),
                         [](const auto& a, const auto& b) {
                             return a.second > b.second;
                         });
        
        return std::vector<std::pair<int, double>>(
            nodes.begin(),
            nodes.begin() + std::min(k, (int)nodes.size())
        );
    }
}; 