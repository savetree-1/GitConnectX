#include "graph.h"
#include <queue>
#include <vector>
#include <limits>
#include <unordered_map>
#include <stdexcept>
#include <sstream>

class Dijkstra {
public:
    struct Result {
        std::vector<double> distances;
        std::vector<int> previous;
        
        bool hasPathTo(int vertex) const {
            return vertex >= 0 && static_cast<size_t>(vertex) < distances.size() && 
                   distances[vertex] != std::numeric_limits<double>::infinity();
        }
        
        double distanceTo(int vertex) const {
            if (!hasPathTo(vertex)) {
                throw std::runtime_error("No path exists to the target vertex");
            }
            return distances[vertex];
        }
    };

    static Result shortestPath(const Graph& graph, int startVertex) {
        if (!graph.hasVertex(startVertex)) {
            throw std::invalid_argument("Start vertex does not exist in the graph");
        }

        size_t n = static_cast<size_t>(graph.getNumVertices());
        std::vector<double> distances(n, std::numeric_limits<double>::infinity());
        std::vector<int> previous(n, -1);
        std::vector<bool> visited(n, false);
        std::priority_queue<std::pair<double, int>,
                          std::vector<std::pair<double, int>>,
                          std::greater<std::pair<double, int>>> pq;

        // ::::: Initialize distance to start vertex
        distances[startVertex] = 0.0;
        pq.push({0.0, startVertex});

        while (!pq.empty()) {
            int current = pq.top().second;
            double currentDist = pq.top().first;
            pq.pop();

            // ::::: Skip if we've found a better path already
            if (currentDist > distances[current]) continue;

            // ::::: Process all neighbors
            for (const auto& [next, weight] : graph.getNeighbors(current)) {
                if (weight < 0) {
                    throw std::runtime_error("Negative edge weights are not allowed in Dijkstra's algorithm");
                }

                double newDist = distances[current] + weight;
                if (newDist < distances[next]) {
                    distances[next] = newDist;
                    previous[next] = current;
                    pq.push({newDist, next});
                }
            }
        }

        return {distances, previous};
    }

    static std::vector<int> getPath(const Result& result, int endVertex) {
        if (endVertex < 0 || static_cast<size_t>(endVertex) >= result.distances.size()) {
            throw std::invalid_argument("Invalid end vertex");
        }

        std::vector<int> path;
        if (!result.hasPathTo(endVertex)) {
            return path; // ::::: No path exists
        }

        for (int v = endVertex; v != -1; v = result.previous[v]) {
            path.push_back(v);
        }
        std::reverse(path.begin(), path.end());
        return path;
    }
    
    static std::string getPathDescription(const Graph& graph, const Result& result, int endVertex) {
        std::vector<int> path = getPath(result, endVertex);
        if (path.empty()) {
            return "No path exists to the target vertex";
        }
        
        std::ostringstream oss;
        oss << "Path: ";
        double totalDistance = 0.0;
        
        for (size_t i = 0; i < path.size(); ++i) {
            oss << path[i];
            if (i < path.size() - 1) {
                double edgeWeight = graph.getEdgeWeight(path[i], path[i + 1]);
                totalDistance += edgeWeight;
                oss << " -(" << edgeWeight << ")-> ";
            }
        }
        
        oss << "\nTotal distance: " << result.distances[endVertex];
        return oss.str();
    }
    
    static std::vector<std::vector<int>> getAllShortestPaths(const Graph& graph, int startVertex) {
        Result result = shortestPath(graph, startVertex);
        std::vector<std::vector<int>> allPaths;
        
        for (int v = 0; v < graph.getNumVertices(); ++v) {
            if (v != startVertex && result.hasPathTo(v)) {
                allPaths.push_back(getPath(result, v));
            }
        }
        
        return allPaths;
    }
}; 