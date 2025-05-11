#include "graph.h"
#include <iostream>
#include <iomanip>

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

int main() {
    // Create a sample graph
    Graph graph(true);  // Directed graph
    
    // Add edges (example: a small social network)
    graph.addEdge(0, 1);  // User 0 follows User 1
    graph.addEdge(1, 2);
    graph.addEdge(2, 0);
    graph.addEdge(2, 3);
    graph.addEdge(3, 1);
    graph.addEdge(3, 4);
    graph.addEdge(4, 2);
    
    // Test BFS
    std::cout << "Testing BFS:\n";
    auto bfsResult = GraphTraversal::bfs(graph, 0);
    printVector(bfsResult, "BFS traversal");
    
    // Test DFS
    std::cout << "\nTesting DFS:\n";
    auto dfsResult = GraphTraversal::dfs(graph, 0);
    printVector(dfsResult, "DFS traversal");
    
    // Test Dijkstra's
    std::cout << "\nTesting Dijkstra's Algorithm:\n";
    auto dijkstraResult = Dijkstra::shortestPath(graph, 0);
    printVector(dijkstraResult.distances, "Distances");
    
    // Test PageRank
    std::cout << "\nTesting PageRank:\n";
    auto pagerankResult = PageRank::calculate(graph);
    printVector(pagerankResult, "PageRank scores");
    
    // Test HITS
    std::cout << "\nTesting HITS:\n";
    auto hitsResult = HITS::calculate(graph);
    printVector(hitsResult.hubScores, "Hub scores");
    printVector(hitsResult.authorityScores, "Authority scores");
    
    // Test K-Core
    std::cout << "\nTesting K-Core Decomposition:\n";
    auto kcoreResult = KCore::decompose(graph);
    printVector(kcoreResult, "K-Core numbers");
    
    // Test Louvain
    std::cout << "\nTesting Louvain Community Detection:\n";
    auto louvainResult = Louvain::detectCommunities(graph);
    printVector(louvainResult, "Community assignments");
    
    return 0;
} 