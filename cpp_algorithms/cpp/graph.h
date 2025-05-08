#ifndef GRAPH_H
#define GRAPH_H

#include <unordered_map>
#include <vector>
#include <string>
#include <iostream>

class Graph {
private:
    std::unordered_map<std::string, std::vector<std::string>> adjList; // Adjacency List

public:
    void addEdge(const std::string& src, const std::string& dest); // Adds an edge to the graph
    void printGraph(); // Prints the graph
    std::unordered_map<std::string, std::vector<std::string>> getAdjList(); // Returns the adjacency list
};

#endif // GRAPH_H