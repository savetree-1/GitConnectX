#include "graph.h"
#include <unordered_map>
#include <string>
#include <iostream>
#include <iomanip> // ::::: For setting precision

// ::::: calculate PageRank
void calculatePageRank(Graph& graph, int iterations, double dampingFactor = 0.85) {
    // ::::: Get adjacency list
    auto adjList = graph.getAdjList();

    // ::::: Initialize ranks for each node
    std::unordered_map<std::string, double> rank;
    for (const auto& node : adjList) {
        rank[node.first] = 1.0; // ::::: Initialize rank to 1.0
    }

    // ::::: PageRank iterations
    for (int i = 0; i < iterations; ++i) {
        std::unordered_map<std::string, double> newRank;

        // ::::: Calculate new ranks for each node
        for (const auto& node : adjList) {
            const std::string& nodeName = node.first;
            const std::vector<std::string>& neighbors = node.second;

            // ::::: Start with the base rank
            newRank[nodeName] = (1.0 - dampingFactor);

            // ::::: Add contributions from neighbors
            for (const auto& neighbor : neighbors) {
                if (adjList.find(neighbor) != adjList.end() && !adjList[neighbor].empty()) {
                    newRank[nodeName] += dampingFactor * (rank[neighbor] / adjList[neighbor].size());
                }
            }
        }

        // ::::: Update ranks
        rank = newRank;
    }

    // ::::: Print final ranks
    std::cout << std::fixed << std::setprecision(4); // Set precision for output
    for (const auto& node : rank) {
        std::cout << node.first << ": " << node.second << std::endl;
    }
}