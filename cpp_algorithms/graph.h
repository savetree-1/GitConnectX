#ifndef GRAPH_H
#define GRAPH_H

#include <vector>
#include <unordered_map>
#include <unordered_set>
#include <queue>
#include <stack>
#include <limits>
#include <algorithm>
#include <stdexcept>

class Graph {
private:
    std::unordered_map<int, std::vector<std::pair<int, double>>> adjList;
    std::unordered_set<int> vertices;
    int numVertices;
    bool isDirected;

public:
    Graph(bool directed = false) : numVertices(0), isDirected(directed) {}

    void addVertex(int vertex) {
        if (vertex < 0) {
            throw std::invalid_argument("Vertex ID cannot be negative");
        }
        vertices.insert(vertex);
        numVertices = std::max(numVertices, vertex + 1);
    }

    void addEdge(int from, int to, double weight = 1.0) {
        if (from < 0 || to < 0) {
            throw std::invalid_argument("Vertex IDs cannot be negative");
        }
        if (weight < 0) {
            throw std::invalid_argument("Weight cannot be negative");
        }

        addVertex(from);
        addVertex(to);

        // Check if edge already exists and update weight if it does
        auto& neighbors = adjList[from];
        auto it = std::find_if(neighbors.begin(), neighbors.end(),
                             [to](const auto& p) { return p.first == to; });
        
        if (it != neighbors.end()) {
            it->second = weight;
        } else {
            neighbors.push_back({to, weight});
        }

        if (!isDirected) {
            auto& toNeighbors = adjList[to];
            auto toIt = std::find_if(toNeighbors.begin(), toNeighbors.end(),
                                   [from](const auto& p) { return p.first == from; });
            
            if (toIt != toNeighbors.end()) {
                toIt->second = weight;
            } else {
                toNeighbors.push_back({from, weight});
            }
        }
    }

    const std::vector<std::pair<int, double>>& getNeighbors(int vertex) const {
        static const std::vector<std::pair<int, double>> empty;
        auto it = adjList.find(vertex);
        return it != adjList.end() ? it->second : empty;
    }

    bool hasVertex(int vertex) const {
        return vertices.find(vertex) != vertices.end();
    }

    bool hasEdge(int from, int to) const {
        auto it = adjList.find(from);
        if (it == adjList.end()) return false;
        
        const auto& neighbors = it->second;
        return std::find_if(neighbors.begin(), neighbors.end(),
                          [to](const auto& p) { return p.first == to; }) != neighbors.end();
    }

    double getEdgeWeight(int from, int to) const {
        auto it = adjList.find(from);
        if (it == adjList.end()) {
            throw std::invalid_argument("Source vertex not found");
        }

        const auto& neighbors = it->second;
        auto edgeIt = std::find_if(neighbors.begin(), neighbors.end(),
                                 [to](const auto& p) { return p.first == to; });
        
        if (edgeIt == neighbors.end()) {
            throw std::invalid_argument("Edge not found");
        }

        return edgeIt->second;
    }

    std::vector<int> getVertices() const {
        std::vector<int> result(vertices.begin(), vertices.end());
        std::sort(result.begin(), result.end());
        return result;
    }

    int getNumVertices() const { return vertices.size(); }
    int getNumEdges() const {
        int count = 0;
        for (const auto& [_, neighbors] : adjList) {
            count += neighbors.size();
        }
        return isDirected ? count : count / 2;
    }
    bool isDirectedGraph() const { return isDirected; }
};

#endif // GRAPH_H 