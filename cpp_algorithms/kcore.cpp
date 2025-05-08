#include "graph.h"
#include <vector>
#include <queue>
#include <algorithm>

class KCore {
public:
    static std::vector<int> decompose(const Graph& graph) {
        int n = graph.getNumVertices();
        std::vector<int> degrees(n);
        std::vector<int> coreNumbers(n);
        std::vector<bool> removed(n, false);
        
        // Calculate initial degrees
        for (int i = 0; i < n; ++i) {
            degrees[i] = graph.getNeighbors(i).size();
        }
        
        // Find minimum degree
        int minDegree = *std::min_element(degrees.begin(), degrees.end());
        int k = minDegree;
        
        while (true) {
            std::queue<int> q;
            
            // Add all vertices with degree < k to the queue
            for (int i = 0; i < n; ++i) {
                if (!removed[i] && degrees[i] < k) {
                    q.push(i);
                }
            }
            
            // Process the queue
            while (!q.empty()) {
                int v = q.front();
                q.pop();
                
                if (removed[v]) continue;
                
                removed[v] = true;
                coreNumbers[v] = k - 1;
                
                // Update degrees of neighbors
                for (const auto& neighbor : graph.getNeighbors(v)) {
                    if (!removed[neighbor.first]) {
                        degrees[neighbor.first]--;
                        if (degrees[neighbor.first] < k) {
                            q.push(neighbor.first);
                        }
                    }
                }
            }
            
            // Check if all vertices are processed
            bool allProcessed = true;
            for (int i = 0; i < n; ++i) {
                if (!removed[i]) {
                    allProcessed = false;
                    break;
                }
            }
            
            if (allProcessed) break;
            
            k++;
        }
        
        return coreNumbers;
    }
    
    static std::vector<std::vector<int>> getKCoreSubgraphs(
        const Graph& graph, const std::vector<int>& coreNumbers) {
        int maxK = *std::max_element(coreNumbers.begin(), coreNumbers.end());
        std::vector<std::vector<int>> kCoreSubgraphs(maxK + 1);
        
        for (int i = 0; i < coreNumbers.size(); ++i) {
            kCoreSubgraphs[coreNumbers[i]].push_back(i);
        }
        
        return kCoreSubgraphs;
    }
    
    static std::vector<int> getLargestKCore(
        const Graph& graph, const std::vector<int>& coreNumbers) {
        int maxK = *std::max_element(coreNumbers.begin(), coreNumbers.end());
        std::vector<int> largestKCore;
        
        for (int i = 0; i < coreNumbers.size(); ++i) {
            if (coreNumbers[i] == maxK) {
                largestKCore.push_back(i);
            }
        }
        
        return largestKCore;
    }
}; 