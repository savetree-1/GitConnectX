#include <iostream>
#include <vector>
#include <unordered_map>
#include <string>
#include <fstream>
#include <sstream>
#include <cmath>
#include <algorithm>
#include <stdexcept>
#include <iomanip>

struct Edge {
    int source;
    int target;
    
    Edge(int s, int t) : source(s), target(t) {
        if (s < 0 || t < 0) {
            throw std::invalid_argument("Node IDs cannot be negative");
        }
    }
};

class PageRank {
private:
    int num_nodes;
    int num_edges;
    std::vector<std::vector<int>> outgoing_links;
    std::vector<std::vector<int>> incoming_links;
    std::vector<double> scores;
    double damping_factor;
    int max_iterations;
    double convergence_threshold;
    bool computed;

public:
    PageRank(int nodes, int edges, double damping = 0.85, int iterations = 100, double threshold = 1e-6)
        : num_nodes(nodes), num_edges(edges), damping_factor(damping), 
          max_iterations(iterations), convergence_threshold(threshold), computed(false) {
        if (nodes <= 0) {
            throw std::invalid_argument("Number of nodes must be positive");
        }
        if (edges < 0) {
            throw std::invalid_argument("Number of edges cannot be negative");
        }
        if (damping <= 0.0 || damping >= 1.0) {
            throw std::invalid_argument("Damping factor must be between 0 and 1");
        }
        if (iterations <= 0) {
            throw std::invalid_argument("Maximum iterations must be positive");
        }
        if (threshold <= 0.0) {
            throw std::invalid_argument("Convergence threshold must be positive");
        }
        
        outgoing_links.resize(num_nodes);
        incoming_links.resize(num_nodes);
        scores.resize(num_nodes, 1.0 / num_nodes); // Initialize with equal probabilities
    }
    
    void add_edge(int source, int target) {
        if (source < 0 || source >= num_nodes) {
            throw std::out_of_range("Source node ID out of range");
        }
        if (target < 0 || target >= num_nodes) {
            throw std::out_of_range("Target node ID out of range");
        }
        
        // ::::: Check if edge already exists
        if (std::find(outgoing_links[source].begin(), outgoing_links[source].end(), target) 
            == outgoing_links[source].end()) {
            outgoing_links[source].push_back(target);
            incoming_links[target].push_back(source);
        }
    }
    
    void compute() {
        std::vector<double> new_scores(num_nodes, 0.0);
        double base_score = (1.0 - damping_factor) / num_nodes;
        int actual_iterations = 0;
        
        for (int iteration = 0; iteration < max_iterations; ++iteration) {
            // ::::: Reset new scores
            std::fill(new_scores.begin(), new_scores.end(), 0.0);
            
            // ::::: Calculate new scores
            for (int node = 0; node < num_nodes; ++node) {
                // ::::: Add base score
                new_scores[node] = base_score;
                
                // ::::: Add score from incoming links
                for (int incoming : incoming_links[node]) {
                    int out_degree = outgoing_links[incoming].size();
                    if (out_degree > 0) {
                        new_scores[node] += damping_factor * scores[incoming] / out_degree;
                    } else {
                        // ::::: Handle dangling nodes
                        new_scores[node] += damping_factor * scores[incoming] / num_nodes;
                    }
                }
            }
            
            // ::::: Check for convergence
            double diff = 0.0;
            for (int node = 0; node < num_nodes; ++node) {
                diff += std::abs(new_scores[node] - scores[node]);
            }
            
            // ::::: Update scores
            scores = new_scores;
            actual_iterations = iteration + 1;
            
            // ::::: If converged, stop early
            if (diff < convergence_threshold) {
                std::cout << "Converged after " << actual_iterations << " iterations." << std::endl;
                break;
            }
        }
        
        if (actual_iterations == max_iterations) {
            std::cout << "Warning: Maximum iterations reached without convergence." << std::endl;
        }
        
        // ::::: Normalize scores
        double sum = 0.0;
        for (double score : scores) {
            sum += score;
        }
        for (double& score : scores) {
            score /= sum;
        }
        
        computed = true;
    }
    
    std::vector<double> get_scores() const {
        if (!computed) {
            throw std::runtime_error("PageRank scores have not been computed yet");
        }
        return scores;
    }
    
    std::vector<std::pair<int, double>> get_top_nodes(int k) const {
        if (!computed) {
            throw std::runtime_error("PageRank scores have not been computed yet");
        }
        if (k <= 0) {
            throw std::invalid_argument("Number of top nodes must be positive");
        }
        
        std::vector<std::pair<int, double>> ranked_nodes;
        for (int i = 0; i < num_nodes; ++i) {
            ranked_nodes.push_back({i, scores[i]});
        }
        
        std::sort(ranked_nodes.begin(), ranked_nodes.end(),
                 [](const auto& a, const auto& b) { return a.second > b.second; });
        
        return std::vector<std::pair<int, double>>(
            ranked_nodes.begin(),
            ranked_nodes.begin() + std::min(k, num_nodes)
        );
    }
    
    double get_score(int node) const {
        if (!computed) {
            throw std::runtime_error("PageRank scores have not been computed yet");
        }
        if (node < 0 || node >= num_nodes) {
            throw std::out_of_range("Node ID out of range");
        }
        return scores[node];
    }
    
    int get_num_nodes() const { return num_nodes; }
    int get_num_edges() const { return num_edges; }
    double get_damping_factor() const { return damping_factor; }
    int get_max_iterations() const { return max_iterations; }
    double get_convergence_threshold() const { return convergence_threshold; }
};

bool read_graph_from_file(const std::string& filename, PageRank& pagerank) {
    std::ifstream file(filename);
    if (!file.is_open()) {
        throw std::runtime_error("Could not open file: " + filename);
    }
    
    // ::::: Skip header line
    std::string line;
    std::getline(file, line);
    
    // ::::: Read edges
    int line_number = 2;
    while (std::getline(file, line)) {
        std::istringstream iss(line);
        int source, target;
        if (!(iss >> source >> target)) {
            std::cerr << "Warning: Invalid edge format at line " << line_number << ": " << line << std::endl;
            continue;
        }
        try {
            pagerank.add_edge(source, target);
        } catch (const std::exception& e) {
            std::cerr << "Warning: " << e.what() << " at line " << line_number << std::endl;
        }
        line_number++;
    }
    
    file.close();
    return true;
}

bool write_results_to_file(const std::string& filename, const std::vector<double>& scores, int precision = 6) {
    std::ofstream file(filename);
    if (!file.is_open()) {
        throw std::runtime_error("Could not open output file: " + filename);
    }
    
    file << std::fixed << std::setprecision(precision);
    for (size_t i = 0; i < scores.size(); ++i) {
        file << i << " " << scores[i] << std::endl;
    }
    
    file.close();
    return true;
}

int main(int argc, char* argv[]) {
    try {
        // ::::: Check command line arguments
        if (argc < 3) {
            std::cerr << "Usage: " << argv[0] << " input_file output_file [damping_factor] [max_iterations] [convergence_threshold]" << std::endl;
            return 1;
        }
        
        std::string input_file = argv[1];
        std::string output_file = argv[2];
        
        // ::::: Parse optional parameters
        double damping_factor = 0.85;
        int max_iterations = 100;
        double convergence_threshold = 1e-6;
        
        if (argc > 3) damping_factor = std::stod(argv[3]);
        if (argc > 4) max_iterations = std::stoi(argv[4]);
        if (argc > 5) convergence_threshold = std::stod(argv[5]);
        
        // ::::: Read graph from file
        std::ifstream file(input_file);
        if (!file.is_open()) {
            throw std::runtime_error("Could not open input file: " + input_file);
        }
        
        int num_nodes, num_edges;
        std::string header_line;
        std::getline(file, header_line);
        std::istringstream iss(header_line);
        
        if (!(iss >> num_nodes >> num_edges)) {
            throw std::runtime_error("Invalid header format");
        }
        
        file.close();
        
        // ::::: Initialize PageRank
        PageRank pagerank(num_nodes, num_edges, damping_factor, max_iterations, convergence_threshold);
        
        // ::::: Read graph from file
        read_graph_from_file(input_file, pagerank);
        
        // ::::: Compute PageRank scores
        std::cout << "Computing PageRank for " << num_nodes << " nodes and " << num_edges << " edges" << std::endl;
        std::cout << "Parameters: damping_factor = " << damping_factor 
                  << ", max_iterations = " << max_iterations 
                  << ", convergence_threshold = " << convergence_threshold << std::endl;
        
        pagerank.compute();
        
        // ::::: Get and display top 10 nodes
        auto top_nodes = pagerank.get_top_nodes(10);
        std::cout << "\nTop 10 nodes by PageRank score:" << std::endl;
        for (const auto& [node, score] : top_nodes) {
            std::cout << "Node " << node << ": " << score << std::endl;
        }
        
        // ::::: Write all results to file
        write_results_to_file(output_file, pagerank.get_scores());
        std::cout << "\nResults written to " << output_file << std::endl;
        
        return 0;
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }
} 