#include "graph.h"
#include <vector>
#include <queue>
#include <algorithm>
#include <stdexcept>
#include <sstream>
#include <unordered_map>
#include <unordered_set>

class KCore {
public:
    struct Result {
        std::vector<int> coreNumbers;
        int maxCoreNumber;
        std::unordered_map<int, int> coreSizes;

        Result(const std::vector<int>& cores) : coreNumbers(cores) {
            maxCoreNumber = cores.empty() ? 0 : *std::max_element(cores.begin(), cores.end());
            for (int core : cores) coreSizes[core]++;
        }

        std::string getSummary() const {
            std::ostringstream oss;
            oss << "K-Core Decomposition Results:\n";
            oss << "Maximum core number: " << maxCoreNumber << "\n\n";
            oss << "Core distribution:\n";
            for (int k = 0; k <= maxCoreNumber; ++k) {
                int size = coreSizes.count(k) ? coreSizes.at(k) : 0;
                oss << "k = " << k << ": " << size << " vertices\n";
            }
            return oss.str();
        }
    };

    static Result decompose(const Graph& graph) {
        int n = graph.getNumVertices();
        if (n == 0) throw std::invalid_argument("Graph is empty");

        // Build reverse adjacency list for efficient in-degree computation
        std::vector<std::unordered_set<int>> inNeighbors(n);
        for (int u = 0; u < n; ++u) {
            for (const auto& [v, _] : graph.getNeighbors(u)) {
                inNeighbors[v].insert(u);
            }
        }

        // Initialize degrees and core numbers
        std::vector<int> inDegrees(n), outDegrees(n), coreNumbers(n);
        for (int v = 0; v < n; ++v) {
            inDegrees[v] = inNeighbors[v].size();
            outDegrees[v] = graph.getNeighbors(v).size();
            coreNumbers[v] = std::min(inDegrees[v], outDegrees[v]);
        }

        // Process vertices in non-decreasing order of degree
        bool changed = true;
        while (changed) {
            changed = false;
            for (int v = 0; v < n; ++v) {
                int minDegree = std::min(inDegrees[v], outDegrees[v]);
                if (minDegree < coreNumbers[v]) {
                    coreNumbers[v] = minDegree;
                    changed = true;

                    // Update out-neighbors
                    for (const auto& [u, _] : graph.getNeighbors(v)) {
                        if (inDegrees[u] > minDegree) {
                            inDegrees[u]--;
                        }
                    }

                    // Update in-neighbors
                    for (int u : inNeighbors[v]) {
                        if (outDegrees[u] > minDegree) {
                            outDegrees[u]--;
                        }
                    }
                }
            }
        }

        return Result(coreNumbers);
    }

    static std::vector<std::vector<int>> getKCoreSubgraphs(const Graph& graph, const Result& result, int minK = 0) {
        if (minK < 0) throw std::invalid_argument("Minimum k must be non-negative");

        std::unordered_map<int, std::vector<int>> grouped;
        for (size_t i = 0; i < result.coreNumbers.size(); ++i)
            if (result.coreNumbers[i] >= minK)
                grouped[result.coreNumbers[i]].push_back(static_cast<int>(i));

        std::vector<int> cores;
        for (const auto& [k, _] : grouped) cores.push_back(k);
        std::sort(cores.begin(), cores.end());

        std::vector<std::vector<int>> res;
        for (int k : cores) res.push_back(grouped[k]);
        return res;
    }

    static std::vector<int> getLargestKCore(const Result& result) {
        std::vector<int> largestCore;
        for (size_t i = 0; i < result.coreNumbers.size(); ++i) {
            if (result.coreNumbers[i] == result.maxCoreNumber) {
                largestCore.push_back(static_cast<int>(i));
            }
        }
        return largestCore;
    }

    static std::vector<std::pair<int, int>> getKCoreHierarchy(const Result& result) {
        std::vector<std::pair<int, int>> hierarchy(result.coreSizes.begin(), result.coreSizes.end());
        std::sort(hierarchy.begin(), hierarchy.end());
        return hierarchy;
    }

    static bool isKCore(const Graph& graph, const std::vector<int>& vertices, int k) {
        if (k < 0) throw std::invalid_argument("k must be non-negative");
        
        std::unordered_set<int> vertexSet(vertices.begin(), vertices.end());
        for (int v : vertices) {
            if (!graph.hasVertex(v)) throw std::invalid_argument("Invalid vertex in subgraph");
            
            // Count both in-degree and out-degree in the subgraph
            int inDegree = 0, outDegree = 0;
            
            // Count out-degree
            for (const auto& [u, _] : graph.getNeighbors(v)) {
                if (vertexSet.count(u)) outDegree++;
            }
            
            // Count in-degree
            for (int u = 0; u < graph.getNumVertices(); ++u) {
                if (!vertexSet.count(u)) continue;
                for (const auto& [w, _] : graph.getNeighbors(u)) {
                    if (w == v) {
                        inDegree++;
                        break;
                    }
                }
            }
            
            if (std::min(inDegree, outDegree) < k) return false;
        }
        return true;
    }
};