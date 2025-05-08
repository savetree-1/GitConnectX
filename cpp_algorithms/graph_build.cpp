#include "graph.h"
#include <vector>
#include <unordered_map>
#include <fstream>
#include <sstream>
#include <string>
#include <stdexcept>

class GraphBuilder {
public:
    // Build a graph from an edge list file
    static Graph buildFromEdgeList(const std::string& filename, bool directed = false) {
        Graph graph(directed);
        std::ifstream file(filename);
        
        if (!file.is_open()) {
            throw std::runtime_error("Could not open file: " + filename);
        }
        
        std::string line;
        while (std::getline(file, line)) {
            std::istringstream iss(line);
            int from, to;
            double weight = 1.0;
            
            if (iss >> from >> to) {
                iss >> weight; // Optional weight
                graph.addEdge(from, to, weight);
            }
        }
        
        return graph;
    }
    
    // Build a graph from an adjacency matrix
    static Graph buildFromAdjacencyMatrix(const std::vector<std::vector<double>>& matrix, bool directed = false) {
        Graph graph(directed);
        int n = matrix.size();
        
        for (int i = 0; i < n; ++i) {
            for (int j = 0; j < n; ++j) {
                if (matrix[i][j] > 0) {
                    graph.addEdge(i, j, matrix[i][j]);
                }
            }
        }
        
        return graph;
    }
    
    // Build a graph from an adjacency list
    static Graph buildFromAdjacencyList(const std::vector<std::vector<std::pair<int, double>>>& adjList, bool directed = false) {
        Graph graph(directed);
        
        for (int i = 0; i < adjList.size(); ++i) {
            for (const auto& edge : adjList[i]) {
                graph.addEdge(i, edge.first, edge.second);
            }
        }
        
        return graph;
    }
    
    // Create a complete graph
    static Graph createCompleteGraph(int n, double weight = 1.0, bool directed = false) {
        Graph graph(directed);
        
        for (int i = 0; i < n; ++i) {
            for (int j = 0; j < n; ++j) {
                if (i != j) {
                    graph.addEdge(i, j, weight);
                }
            }
        }
        
        return graph;
    }
    
    // Create a cycle graph
    static Graph createCycleGraph(int n, double weight = 1.0, bool directed = false) {
        Graph graph(directed);
        
        for (int i = 0; i < n; ++i) {
            graph.addEdge(i, (i + 1) % n, weight);
        }
        
        return graph;
    }
    
    // Create a star graph
    static Graph createStarGraph(int n, double weight = 1.0, bool directed = false) {
        Graph graph(directed);
        
        for (int i = 1; i < n; ++i) {
            graph.addEdge(0, i, weight);
        }
        
        return graph;
    }
    
    // Create a path graph
    static Graph createPathGraph(int n, double weight = 1.0, bool directed = false) {
        Graph graph(directed);
        
        for (int i = 0; i < n - 1; ++i) {
            graph.addEdge(i, i + 1, weight);
        }
        
        return graph;
    }
    
    // Create a grid graph
    static Graph createGridGraph(int rows, int cols, double weight = 1.0, bool directed = false) {
        Graph graph(directed);
        
        for (int i = 0; i < rows; ++i) {
            for (int j = 0; j < cols; ++j) {
                int current = i * cols + j;
                
                // Add right edge
                if (j < cols - 1) {
                    graph.addEdge(current, current + 1, weight);
                }
                
                // Add down edge
                if (i < rows - 1) {
                    graph.addEdge(current, current + cols, weight);
                }
            }
        }
        
        return graph;
    }
    
    // Create a random graph with given edge probability
    static Graph createRandomGraph(int n, double edgeProbability, double weight = 1.0, bool directed = false) {
        Graph graph(directed);
        
        for (int i = 0; i < n; ++i) {
            for (int j = 0; j < n; ++j) {
                if (i != j && (double)rand() / RAND_MAX < edgeProbability) {
                    graph.addEdge(i, j, weight);
                }
            }
        }
        
        return graph;
    }
};
