#include "graph.h"
#include <vector>
#include <cmath>
#include <algorithm>
#include <stdexcept>
#include <sstream>
#include <iomanip>

class HITS {
public:
    struct Scores {
        std::vector<double> hubScores;
        std::vector<double> authorityScores;
        int iterations;
        bool converged;
        
        Scores(const std::vector<double>& hubs, const std::vector<double>& auths, 
               int iters, bool conv) 
            : hubScores(hubs), authorityScores(auths), 
              iterations(iters), converged(conv) {}
              
        std::string getSummary(int topK = 5) const {
            std::ostringstream oss;
            oss << std::fixed << std::setprecision(6);
            
            oss << "HITS Results:\n";
            oss << "Iterations: " << iterations;
            oss << (converged ? " (converged)" : " (max iterations reached)") << "\n\n";
            
            // ::::: Top hubs
            oss << "Top " << topK << " Hubs:\n";
            auto topHubs = HITS::getTopHubs(hubScores, topK);
            for (const auto& [node, score] : topHubs) {
                oss << "Node " << node << ": " << score << "\n";
            }
            oss << "\n";
            
            // ::::: Top authorities
            oss << "Top " << topK << " Authorities:\n";
            auto topAuths = HITS::getTopAuthorities(authorityScores, topK);
            for (const auto& [node, score] : topAuths) {
                oss << "Node " << node << ": " << score << "\n";
            }
            
            return oss.str();
        }
    };

    static Scores calculate(const Graph& graph,
                          int maxIterations = 100,
                          double tolerance = 1e-10) {
        if (!graph.isDirectedGraph()) {
            throw std::invalid_argument("HITS algorithm requires a directed graph");
        }
        if (maxIterations <= 0) {
            throw std::invalid_argument("Maximum iterations must be positive");
        }
        if (tolerance <= 0.0) {
            throw std::invalid_argument("Tolerance must be positive");
        }

        int n = graph.getNumVertices();
        if (n == 0) {
            throw std::invalid_argument("Graph is empty");
        }

        std::vector<double> hubScores(n, 1.0);
        std::vector<double> authScores(n, 1.0);
        std::vector<double> newHubScores(n);
        std::vector<double> newAuthScores(n);
        bool converged = false;
        int actualIterations = 0;

        for (int iter = 0; iter < maxIterations; ++iter) {
            // ::::: Calculate authority scores
            std::fill(newAuthScores.begin(), newAuthScores.end(), 0.0);
            for (int i = 0; i < n; ++i) {
                for (const auto& neighbor : graph.getNeighbors(i)) {
                    newAuthScores[neighbor.first] += hubScores[i];
                }
            }

            // ::::: Calculate hub scores
            std::fill(newHubScores.begin(), newHubScores.end(), 0.0);
            for (int i = 0; i < n; ++i) {
                for (const auto& neighbor : graph.getNeighbors(i)) {
                    newHubScores[i] += authScores[neighbor.first];
                }
            }

            // ::::: Normalize scores
            double authSum = 0.0, hubSum = 0.0;
            for (int i = 0; i < n; ++i) {
                authSum += newAuthScores[i] * newAuthScores[i];
                hubSum += newHubScores[i] * newHubScores[i];
            }
            
            // ::::: Handle zero sums 
            if (authSum < std::numeric_limits<double>::epsilon()) {
                std::fill(newAuthScores.begin(), newAuthScores.end(), 1.0 / n);
            } else {
                authSum = std::sqrt(authSum);
                for (int i = 0; i < n; ++i) {
                    newAuthScores[i] /= authSum;
                }
            }
            
            if (hubSum < std::numeric_limits<double>::epsilon()) {
                std::fill(newHubScores.begin(), newHubScores.end(), 1.0 / n);
            } else {
                hubSum = std::sqrt(hubSum);
                for (int i = 0; i < n; ++i) {
                    newHubScores[i] /= hubSum;
                }
            }

            // ::::: Check convergence
            double authDiff = 0.0, hubDiff = 0.0;
            for (int i = 0; i < n; ++i) {
                authDiff += std::abs(newAuthScores[i] - authScores[i]);
                hubDiff += std::abs(newHubScores[i] - hubScores[i]);
            }

            actualIterations = iter + 1;
            if (authDiff < tolerance && hubDiff < tolerance) {
                converged = true;
                break;
            }

            authScores = newAuthScores;
            hubScores = newHubScores;
        }

        return Scores(hubScores, authScores, actualIterations, converged);
    }

    static std::vector<std::pair<int, double>> getTopHubs(
        const std::vector<double>& hubScores, int k) {
        if (k <= 0) {
            throw std::invalid_argument("k must be positive");
        }
        
        std::vector<std::pair<int, double>> ranked;
        for (size_t i = 0; i < hubScores.size(); ++i) {
            ranked.push_back({static_cast<int>(i), hubScores[i]});
        }
        
        std::sort(ranked.begin(), ranked.end(),
                 [](const auto& a, const auto& b) { return a.second > b.second; });
        
        size_t topK = std::min(static_cast<size_t>(k), ranked.size());
        return std::vector<std::pair<int, double>>(
            ranked.begin(),
            ranked.begin() + topK
        );
    }

    static std::vector<std::pair<int, double>> getTopAuthorities(
        const std::vector<double>& authScores, int k) {
        if (k <= 0) {
            throw std::invalid_argument("k must be positive");
        }
        
        std::vector<std::pair<int, double>> ranked;
        for (size_t i = 0; i < authScores.size(); ++i) {
            ranked.push_back({static_cast<int>(i), authScores[i]});
        }
        
        std::sort(ranked.begin(), ranked.end(),
                 [](const auto& a, const auto& b) { return a.second > b.second; });
        
        size_t topK = std::min(static_cast<size_t>(k), ranked.size());
        return std::vector<std::pair<int, double>>(
            ranked.begin(),
            ranked.begin() + topK
        );
    }
}; 