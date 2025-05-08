#ifndef GRAPH_H
#define GRAPH_H

#include <vector>
#include <unordered_map>
#include <queue>
#include <stack>
#include <limits>
#include <algorithm>

class Graph {
private:
    std::unordered_map<int, std::vector<std::pair<int, double>>> adjList;
    int numVertices;
    bool isDirected;

public:
    Graph(bool directed = false) : numVertices(0), isDirected(directed) {}

    void addEdge(int from, int to, double weight = 1.0) {
        adjList[from].push_back({to, weight});
        if (!isDirected) {
            adjList[to].push_back({from, weight});
        }
        numVertices = std::max(numVertices, std::max(from, to) + 1);
    }

    const std::vector<std::pair<int, double>>& getNeighbors(int vertex) const {
        static const std::vector<std::pair<int, double>> empty;
        auto it = adjList.find(vertex);
        return it != adjList.end() ? it->second : empty;
    }

    int getNumVertices() const { return numVertices; }
    bool isDirectedGraph() const { return isDirected; }
};

#endif // GRAPH_H 