#include "graph.h"

// ::::: Add an edge between src and dest
void Graph::addEdge(const std::string& src, const std::string& dest) {
    adjList[src].push_back(dest); // ::::: Add edge from src to dest
}

// ::::: Print the graph
void Graph::printGraph() {
    for (const auto& pair : adjList) {
        std::cout << pair.first << " -> ";
        for (const auto& neighbor : pair.second) {
            std::cout << neighbor << " ";
        }
        std::cout << std::endl;
    }
}

// ::::: Retrieve the adjacency list
std::unordered_map<std::string, std::vector<std::string>> Graph::getAdjList() {
    return adjList;
}