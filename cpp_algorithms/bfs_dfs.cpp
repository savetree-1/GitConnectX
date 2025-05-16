#include "graph.h"
#include <queue>
#include <stack>
#include <vector>
#include <unordered_set>
#include <stdexcept>

class GraphTraversal {
private:
    static void dfsRecursiveForComponents(
        const Graph& graph,
        int vertex,
        std::unordered_set<int>& visited,
        std::vector<int>& component) {
        
        visited.insert(vertex);
        component.push_back(vertex);
        
        for (const auto& neighbor : graph.getNeighbors(vertex)) {
            if (visited.find(neighbor.first) == visited.end()) {
                dfsRecursiveForComponents(graph, neighbor.first, visited, component);
            }
        }
    }

public:
    // BFS implementation with distance tracking
    static std::pair<std::vector<int>, std::vector<int>> bfs(const Graph& graph, int startVertex) {
        if (!graph.hasVertex(startVertex)) {
            throw std::invalid_argument("Start vertex does not exist in the graph");
        }

        std::vector<int> traversal;
        std::vector<int> distances(graph.getNumVertices(), -1);
        std::queue<int> q;
        std::unordered_set<int> visited;
        
        q.push(startVertex);
        visited.insert(startVertex);
        distances[startVertex] = 0;
        
        while (!q.empty()) {
            int current = q.front();
            q.pop();
            traversal.push_back(current);
            
            for (const auto& neighbor : graph.getNeighbors(current)) {
                int nextVertex = neighbor.first;
                if (visited.find(nextVertex) == visited.end()) {
                    visited.insert(nextVertex);
                    distances[nextVertex] = distances[current] + 1;
                    q.push(nextVertex);
                }
            }
        }
        
        return {traversal, distances};
    }
    
    // DFS implementation (iterative) with discovery and finish times
    static std::tuple<std::vector<int>, std::vector<int>, std::vector<int>> 
    dfs(const Graph& graph, int startVertex) {
        if (!graph.hasVertex(startVertex)) {
            throw std::invalid_argument("Start vertex does not exist in the graph");
        }

        std::vector<int> traversal;
        std::vector<int> discoveryTime(graph.getNumVertices(), -1);
        std::vector<int> finishTime(graph.getNumVertices(), -1);
        std::stack<std::pair<int, bool>> s; // vertex and whether it's being discovered
        std::unordered_set<int> visited;
        int time = 0;
        
        s.push({startVertex, true});
        
        while (!s.empty()) {
            auto [current, isDiscovery] = s.top();
            s.pop();
            
            if (isDiscovery) {
                if (visited.find(current) == visited.end()) {
                    visited.insert(current);
                    traversal.push_back(current);
                    discoveryTime[current] = time++;
                    
                    s.push({current, false}); // Add finish time marker
                    
                    // Push neighbors in reverse order for DFS
                    const auto& neighbors = graph.getNeighbors(current);
                    for (auto it = neighbors.rbegin(); it != neighbors.rend(); ++it) {
                        if (visited.find(it->first) == visited.end()) {
                            s.push({it->first, true});
                        }
                    }
                }
            } else {
                finishTime[current] = time++;
            }
        }
        
        return {traversal, discoveryTime, finishTime};
    }
    
    // DFS implementation (recursive) with discovery and finish times
    static void dfsRecursive(const Graph& graph, int vertex, 
                           std::unordered_set<int>& visited,
                           std::vector<int>& traversal,
                           std::vector<int>& discoveryTime,
                           std::vector<int>& finishTime,
                           int& time) {
        visited.insert(vertex);
        traversal.push_back(vertex);
        discoveryTime[vertex] = time++;
        
        for (const auto& neighbor : graph.getNeighbors(vertex)) {
            if (visited.find(neighbor.first) == visited.end()) {
                dfsRecursive(graph, neighbor.first, visited, traversal, 
                            discoveryTime, finishTime, time);
            }
        }
        
        finishTime[vertex] = time++;
    }
    
    static std::tuple<std::vector<int>, std::vector<int>, std::vector<int>>
    dfsRecursive(const Graph& graph, int startVertex) {
        if (!graph.hasVertex(startVertex)) {
            throw std::invalid_argument("Start vertex does not exist in the graph");
        }

        std::vector<int> traversal;
        std::vector<int> discoveryTime(graph.getNumVertices(), -1);
        std::vector<int> finishTime(graph.getNumVertices(), -1);
        std::unordered_set<int> visited;
        int time = 0;
        
        dfsRecursive(graph, startVertex, visited, traversal, 
                     discoveryTime, finishTime, time);
        
        return {traversal, discoveryTime, finishTime};
    }
    
    // Find connected components using DFS
    static std::vector<std::vector<int>> findConnectedComponents(const Graph& graph) {
        std::vector<std::vector<int>> components;
        std::unordered_set<int> visited;
        
        for (int vertex : graph.getVertices()) {
            if (visited.find(vertex) == visited.end()) {
                std::vector<int> component;
                dfsRecursiveForComponents(graph, vertex, visited, component);
                components.push_back(component);
            }
        }
        
        return components;
    }
}; 