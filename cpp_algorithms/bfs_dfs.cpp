#include "graph.h"
#include <queue>
#include <stack>
#include <vector>
#include <unordered_set>

class GraphTraversal {
public:
    // BFS implementation
    static std::vector<int> bfs(const Graph& graph, int startVertex) {
        std::vector<int> traversal;
        std::queue<int> q;
        std::unordered_set<int> visited;
        
        q.push(startVertex);
        visited.insert(startVertex);
        
        while (!q.empty()) {
            int current = q.front();
            q.pop();
            traversal.push_back(current);
            
            for (const auto& neighbor : graph.getNeighbors(current)) {
                if (visited.find(neighbor.first) == visited.end()) {
                    visited.insert(neighbor.first);
                    q.push(neighbor.first);
                }
            }
        }
        
        return traversal;
    }
    
    // DFS implementation (iterative)
    static std::vector<int> dfs(const Graph& graph, int startVertex) {
        std::vector<int> traversal;
        std::stack<int> s;
        std::unordered_set<int> visited;
        
        s.push(startVertex);
        
        while (!s.empty()) {
            int current = s.top();
            s.pop();
            
            if (visited.find(current) == visited.end()) {
                visited.insert(current);
                traversal.push_back(current);
                
                // Push neighbors in reverse order to maintain DFS order
                const auto& neighbors = graph.getNeighbors(current);
                for (auto it = neighbors.rbegin(); it != neighbors.rend(); ++it) {
                    if (visited.find(it->first) == visited.end()) {
                        s.push(it->first);
                    }
                }
            }
        }
        
        return traversal;
    }
    
    // DFS implementation (recursive)
    static void dfsRecursive(const Graph& graph, int vertex, 
                           std::unordered_set<int>& visited,
                           std::vector<int>& traversal) {
        visited.insert(vertex);
        traversal.push_back(vertex);
        
        for (const auto& neighbor : graph.getNeighbors(vertex)) {
            if (visited.find(neighbor.first) == visited.end()) {
                dfsRecursive(graph, neighbor.first, visited, traversal);
            }
        }
    }
    
    static std::vector<int> dfsRecursive(const Graph& graph, int startVertex) {
        std::vector<int> traversal;
        std::unordered_set<int> visited;
        dfsRecursive(graph, startVertex, visited, traversal);
        return traversal;
    }
}; 