#include "graph.h"
#include "bfs_dfs.cpp"
#include "dijkstra.cpp"
#include "louvain.cpp"
#include "kcore.cpp"
#include "hits.cpp"
#include <iostream>
#include <iomanip>
#include <vector>
#include <string>
#include <cassert>

// ::::: Helper functions for printing results
void printVector(const std::vector<int>& vec, const std::string& name) {
    std::cout << name << ": ";
    for (int val : vec) {
        std::cout << val << " ";
    }
    std::cout << "\n";
}

void printVector(const std::vector<double>& vec, const std::string& name) {
    std::cout << name << ": ";
    for (double val : vec) {
        std::cout << std::fixed << std::setprecision(4) << val << " ";
    }
    std::cout << "\n";
}

void printSeparator() {
    std::cout << "\n" << std::string(50, '-') << "\n\n";
}

// ::::: Test case verification functions
void verifyBFS(const Graph& graph, int startVertex, const std::vector<int>& expectedDistances) {
    auto [traversal, distances] = GraphTraversal::bfs(graph, startVertex);
    std::cout << "BFS Test from vertex " << startVertex << ":\n";
    printVector(traversal, "Traversal");
    printVector(distances, "Distances");
    assert(distances == expectedDistances && "BFS distances do not match expected values!");
    std::cout << "✓ BFS test passed\n";
}

void verifyDijkstra(const Graph& graph, int startVertex, const std::vector<double>& expectedDistances) {
    auto result = Dijkstra::shortestPath(graph, startVertex);
    std::cout << "\nDijkstra Test from vertex " << startVertex << ":\n";
    
    // ::::: Debug output
    std::cout << "Graph structure:\n";
    for (int v = 0; v < graph.getNumVertices(); ++v) {
        std::cout << "Vertex " << v << " edges: ";
        for (const auto& [u, w] : graph.getNeighbors(v)) {
            std::cout << v << "->" << u << "(" << std::fixed << std::setprecision(1) << w << ") ";
        }
        std::cout << "\n";
    }
    
    std::cout << "\nComputed distances:\n";
    for (size_t i = 0; i < result.distances.size(); ++i) {
        std::cout << "To vertex " << i << ": ";
        if (result.distances[i] == std::numeric_limits<double>::infinity()) {
            std::cout << "INFINITY";
        } else {
            std::cout << std::fixed << std::setprecision(6) << result.distances[i];
        }
        std::cout << " (Expected: ";
        if (expectedDistances[i] == std::numeric_limits<double>::infinity()) {
            std::cout << "INFINITY";
        } else {
            std::cout << std::fixed << std::setprecision(6) << expectedDistances[i];
        }
        std::cout << ")";
        
        if (std::abs(result.distances[i] - expectedDistances[i]) >= 1e-6) {
            std::cout << " *** MISMATCH ***";
        }
        std::cout << "\n";
        
        // Show the actual path if one exists
        if (result.distances[i] != std::numeric_limits<double>::infinity()) {
            std::vector<int> path;
            for (int v = i; v != -1; v = result.previous[v]) {
                path.push_back(v);
            }
            std::reverse(path.begin(), path.end());
            std::cout << "  Path: ";
            double totalWeight = 0.0;
            for (size_t j = 0; j < path.size(); ++j) {
                if (j > 0) {
                    double edgeWeight = graph.getEdgeWeight(path[j-1], path[j]);
                    totalWeight += edgeWeight;
                    std::cout << "-(" << std::fixed << std::setprecision(1) << edgeWeight << ")->";
                }
                std::cout << path[j];
            }
            std::cout << " (Total weight: " << std::fixed << std::setprecision(6) << totalWeight << ")\n";
        }
    }
    std::cout << "\n";
    
    assert(result.distances.size() == expectedDistances.size() && "Distance vector size mismatch!");
    for (size_t i = 0; i < result.distances.size(); ++i) {
        assert(std::abs(result.distances[i] - expectedDistances[i]) < 1e-6 && "Distance values do not match!");
    }
    std::cout << "✓ Dijkstra test passed\n";
}

void verifyHITS(const Graph& graph, double expectedMaxHub, double expectedMaxAuth) {
    auto result = HITS::calculate(graph);
    std::cout << "HITS Test:\n" << result.getSummary();
    double maxHub = *std::max_element(result.hubScores.begin(), result.hubScores.end());
    double maxAuth = *std::max_element(result.authorityScores.begin(), result.authorityScores.end());
    const double tolerance = 1e-3;
    assert(std::abs(maxHub - expectedMaxHub) < tolerance && "Max hub score does not match!");
    assert(std::abs(maxAuth - expectedMaxAuth) < tolerance && "Max authority score does not match!");
    std::cout << "✓ HITS test passed\n";
}

void verifyKCore(const Graph& graph, int expectedMaxCore) {
    auto result = KCore::decompose(graph);
    std::cout << "K-Core Test:\n" << result.getSummary();
    assert(result.maxCoreNumber == expectedMaxCore && "Max core number does not match!");
    std::cout << "✓ K-Core test passed\n";
}

void verifyLouvain(const Graph& graph, int expectedMinCommunities) {
    auto result = Louvain::detectCommunities(graph);
    std::cout << "Louvain Test:\n" << result.getSummary();
    auto communities = Louvain::getCommunityMembers(result);
    assert(communities.size() >= expectedMinCommunities && "Number of communities is less than expected!");
    std::cout << "✓ Louvain test passed\n";
}

int main() {
    try {
        std::cout << "Graph Algorithms Test Suite\n";
        printSeparator();

        // ::::: Test Case 1: Simple directed cycle
        std::cout << "Test Case 1: Simple directed cycle\n";
        Graph cyclicGraph(true);
        // ::::: Create a cycle: 0 -> 1 -> 2 -> 0
        cyclicGraph.addEdge(0, 1, 1.0);  
        cyclicGraph.addEdge(1, 2, 1.0); 
        cyclicGraph.addEdge(2, 0, 1.0); 
        
        verifyBFS(cyclicGraph, 0, {0, 1, 2});
        verifyDijkstra(cyclicGraph, 0, {0.0, 1.0, 2.0});
        verifyHITS(cyclicGraph, 0.5774, 0.5774);
        verifyKCore(cyclicGraph, 1);
        verifyLouvain(cyclicGraph, 1);
        printSeparator();

        // ::::: Test Case 2: Star graph (directed outward)
        std::cout << "Test Case 2: Star graph\n";
        Graph starGraph(true);-
        for (int i = 1; i < 5; ++i) {
            starGraph.addEdge(0, i, 1.0);  =
        }
        
        =
        verifyBFS(starGraph, 0, {0, 1, 1, 1, 1});
        verifyDijkstra(starGraph, 0, {0.0, 1.0, 1.0, 1.0, 1.0});
        verifyHITS(starGraph, 0.9999, 0.5);
        verifyKCore(starGraph, 0);
        verifyLouvain(starGraph, 1);
        printSeparator();

        // ::::: Test Case 3: Disconnected components
        std::cout << "Test Case 3: Disconnected components\n";
        Graph disconnectedGraph(true);
        disconnectedGraph.addEdge(0, 1, 1.0); 
        disconnectedGraph.addEdge(2, 3, 1.0); 

        verifyBFS(disconnectedGraph, 0, {0, 1, -1, -1});
        verifyDijkstra(disconnectedGraph, 0, {0.0, 1.0, std::numeric_limits<double>::infinity(), std::numeric_limits<double>::infinity()});
        verifyHITS(disconnectedGraph, 0.7071, 0.7071);
        verifyKCore(disconnectedGraph, 0);
        verifyLouvain(disconnectedGraph, 2);
        printSeparator();

        // ::::: Test Case 4: Strongly connected weighted graph
        std::cout << "Test Case 4: Strongly connected weighted graph\n";
        Graph weightedGraph(true);
        weightedGraph.addEdge(0, 1, 2.0);  
        weightedGraph.addEdge(1, 2, 3.0);  
        weightedGraph.addEdge(2, 0, 1.0);  
        weightedGraph.addEdge(0, 2, 10.0); =
        
        verifyDijkstra(weightedGraph, 0, {0.0, 2.0, 5.0});
        verifyHITS(weightedGraph, 0.8165, 0.7071);
        verifyKCore(weightedGraph, 1);
        verifyLouvain(weightedGraph, 1);
        printSeparator();

        std::cout << "All tests completed successfully!\n";
        return 0;
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << "\n";
        return 1;
    }
}
