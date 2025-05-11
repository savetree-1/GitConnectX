#include "graph.h"
#include <queue>
#include <vector>
#include <limits>
#include <unordered_map>

class Dijkstra {
public:
    struct Result {
        std::vector<double> distances;
        std::vector<int> previous;
    };

    static Result shortestPath(const Graph& graph, int startVertex) {
        int n = graph.getNumVertices();
        std::vector<double> distances(n, std::numeric_limits<double>::infinity());
        std::vector<int> previous(n, -1);
        std::priority_queue<std::pair<double, int>,
                          std::vector<std::pair<double, int>>,
                          std::greater<std::pair<double, int>>> pq;

        distances[startVertex] = 0;
        pq.push({0, startVertex});

        while (!pq.empty()) {
            double currentDist = pq.top().first;
            int current = pq.top().second;
            pq.pop();

            if (currentDist > distances[current]) {
                continue;
            }

            for (const auto& neighbor : graph.getNeighbors(current)) {
                int next = neighbor.first;
                double weight = neighbor.second;
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
        std::vector<int> path;
        if (result.previous[endVertex] == -1 && endVertex != 0) {
            return path; // No path exists
        }

        for (int v = endVertex; v != -1; v = result.previous[v]) {
            path.push_back(v);
        }
        std::reverse(path.begin(), path.end());
        return path;
    }
}; 