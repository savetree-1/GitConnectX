#include "graph.h"
#include <vector>
#include <cmath>
#include <algorithm>

class HITS {
public:
    struct Scores {
        std::vector<double> hubScores;
        std::vector<double> authorityScores;
    };

    static Scores calculate(const Graph& graph,
                          int maxIterations = 100,
                          double tolerance = 1e-10) {
        int n = graph.getNumVertices();
        std::vector<double> hubScores(n, 1.0);
        std::vector<double> authScores(n, 1.0);
        std::vector<double> newHubScores(n);
        std::vector<double> newAuthScores(n);

        for (int iter = 0; iter < maxIterations; ++iter) {
            // Calculate authority scores
            for (int i = 0; i < n; ++i) {
                newAuthScores[i] = 0.0;
                for (const auto& neighbor : graph.getNeighbors(i)) {
                    newAuthScores[i] += hubScores[neighbor.first];
                }
            }

            // Calculate hub scores
            for (int i = 0; i < n; ++i) {
                newHubScores[i] = 0.0;
                for (const auto& neighbor : graph.getNeighbors(i)) {
                    newHubScores[i] += authScores[neighbor.first];
                }
            }

            // Normalize scores
            double authSum = 0.0, hubSum = 0.0;
            for (int i = 0; i < n; ++i) {
                authSum += newAuthScores[i] * newAuthScores[i];
                hubSum += newHubScores[i] * newHubScores[i];
            }
            authSum = std::sqrt(authSum);
            hubSum = std::sqrt(hubSum);

            for (int i = 0; i < n; ++i) {
                newAuthScores[i] /= authSum;
                newHubScores[i] /= hubSum;
            }

            // Check convergence
            double authDiff = 0.0, hubDiff = 0.0;
            for (int i = 0; i < n; ++i) {
                authDiff += std::abs(newAuthScores[i] - authScores[i]);
                hubDiff += std::abs(newHubScores[i] - hubScores[i]);
            }

            if (authDiff < tolerance && hubDiff < tolerance) {
                break;
            }

            authScores = newAuthScores;
            hubScores = newHubScores;
        }

        return {hubScores, authScores};
    }

    static std::vector<std::pair<int, double>> getTopHubs(
        const std::vector<double>& hubScores, int k) {
        std::vector<std::pair<int, double>> hubs;
        for (int i = 0; i < hubScores.size(); ++i) {
            hubs.push_back({i, hubScores[i]});
        }

        std::partial_sort(hubs.begin(),
                         hubs.begin() + std::min(k, (int)hubs.size()),
                         hubs.end(),
                         [](const auto& a, const auto& b) {
                             return a.second > b.second;
                         });

        return std::vector<std::pair<int, double>>(
            hubs.begin(),
            hubs.begin() + std::min(k, (int)hubs.size())
        );
    }

    static std::vector<std::pair<int, double>> getTopAuthorities(
        const std::vector<double>& authScores, int k) {
        std::vector<std::pair<int, double>> authorities;
        for (int i = 0; i < authScores.size(); ++i) {
            authorities.push_back({i, authScores[i]});
        }

        std::partial_sort(authorities.begin(),
                         authorities.begin() + std::min(k, (int)authorities.size()),
                         authorities.end(),
                         [](const auto& a, const auto& b) {
                             return a.second > b.second;
                         });

        return std::vector<std::pair<int, double>>(
            authorities.begin(),
            authorities.begin() + std::min(k, (int)authorities.size())
        );
    }
}; 