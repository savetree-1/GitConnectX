# backend/graph_service.py

import networkx as nx
import numpy as np
import subprocess
import tempfile
import json
import os
import logging
from typing import Dict, List, Optional, Any, Tuple, Set
import community as community_louvain

from backend import config

class GraphService:
    """Service for graph-based algorithms and analysis"""
    
    def __init__(self):
        """Initialize the graph service"""
        self.logger = logging.getLogger(__name__)
    
    def build_follow_graph(self, network_data: Dict[str, Any]) -> nx.DiGraph:
        """Build a directed graph representing the follow network
        
        Args:
            network_data: Network data with nodes and edges
            
        Returns:
            NetworkX DiGraph representing the follow network
        """
        G = nx.DiGraph()
        
        # Add nodes
        for node_id, node_data in network_data['nodes'].items():
            if node_data['type'] == 'user':
                G.add_node(node_id, **node_data['data'])
        
        # Add edges
        for edge in network_data['edges']:
            if edge['type'] == 'follows':
                source = edge['source']
                target = edge['target']
                # Check if both nodes exist in the graph
                if source in G and target in G:
                    G.add_edge(source, target)
        
        return G
    
    def build_commit_graph(self, network_data: Dict[str, Any]) -> nx.Graph:
        """Build an undirected bipartite graph representing the commit network
        
        Args:
            network_data: Network data with nodes and edges
            
        Returns:
            NetworkX Graph representing the commit network
        """
        G = nx.Graph()
        
        # Add nodes
        for node_id, node_data in network_data['nodes'].items():
            node_type = node_data['type']
            G.add_node(node_id, type=node_type, **node_data['data'])
        
        # Add edges
        for edge in network_data['edges']:
            if edge['type'] == 'owns' or edge['type'] == 'contributes':
                source = edge['source']
                target = edge['target']
                # Check if both nodes exist in the graph
                if source in G and target in G:
                    G.add_edge(source, target, type=edge['type'])
        
        return G
    
    def run_pagerank(self, graph: nx.DiGraph, damping: float = None, max_iterations: int = None) -> Dict[str, float]:
        """Calculate PageRank for nodes in the graph
        
        Args:
            graph: NetworkX DiGraph
            damping: Damping factor (default from config)
            max_iterations: Maximum number of iterations (default from config)
            
        Returns:
            Dictionary mapping node IDs to PageRank scores
        """
        try:
            damping = damping or config.PAGERANK_DAMPING
            max_iterations = max_iterations or config.PAGERANK_ITERATIONS
            
            # Check if we should use C++ implementation
            if os.path.exists(config.PAGERANK_BINARY):
                return self._run_cpp_pagerank(graph, damping, max_iterations)
            
            # Fall back to NetworkX implementation
            pagerank = nx.pagerank(graph, alpha=damping, max_iter=max_iterations)
            return pagerank
            
        except Exception as e:
            self.logger.error(f"Error calculating PageRank: {str(e)}")
            # Fall back to NetworkX if an error occurs
            try:
                return nx.pagerank(graph, alpha=config.PAGERANK_DAMPING)
            except:
                return {}
    
    def _run_cpp_pagerank(self, graph: nx.DiGraph, damping: float, max_iterations: int) -> Dict[str, float]:
        """Run the C++ implementation of PageRank
        
        Args:
            graph: NetworkX DiGraph
            damping: Damping factor
            max_iterations: Maximum number of iterations
            
        Returns:
            Dictionary mapping node IDs to PageRank scores
        """
        try:
            # Create temporary files for input and output
            with tempfile.NamedTemporaryFile(mode='w', delete=False) as input_file, \
                 tempfile.NamedTemporaryFile(mode='r', delete=False) as output_file:
                
                # Write graph to input file in format expected by C++ program
                input_file.write(f"{len(graph.nodes())} {len(graph.edges())}\n")
                # Create a mapping of node names to integers
                node_to_int = {node: i for i, node in enumerate(graph.nodes())}
                int_to_node = {i: node for node, i in node_to_int.items()}
                
                # Write edges
                for u, v in graph.edges():
                    input_file.write(f"{node_to_int[u]} {node_to_int[v]}\n")
                
                input_file.close()
                output_file.close()
                
                # Run C++ program
                subprocess.run([
                    config.PAGERANK_BINARY,
                    input_file.name,
                    output_file.name,
                    str(damping),
                    str(max_iterations)
                ], check=True)
                
                # Read results
                pagerank = {}
                with open(output_file.name, 'r') as f:
                    for line in f:
                        node_idx, score = line.strip().split()
                        node = int_to_node[int(node_idx)]
                        pagerank[node] = float(score)
                
                # Clean up temporary files
                os.unlink(input_file.name)
                os.unlink(output_file.name)
                
                return pagerank
                
        except Exception as e:
            self.logger.error(f"Error running C++ PageRank: {str(e)}")
            # Fall back to NetworkX implementation
            return nx.pagerank(graph, alpha=damping, max_iter=max_iterations)
    
    def run_hits(self, graph: nx.DiGraph, max_iterations: int = 100) -> Tuple[Dict[str, float], Dict[str, float]]:
        """Calculate HITS (Hubs and Authorities) scores for nodes in the graph
        
        Args:
            graph: NetworkX DiGraph
            max_iterations: Maximum number of iterations
            
        Returns:
            Tuple of (hubs, authorities) dictionaries mapping node IDs to scores
        """
        try:
            # Check if we should use C++ implementation
            if os.path.exists(config.HITS_BINARY):
                return self._run_cpp_hits(graph, max_iterations)
            
            # Fall back to NetworkX implementation
            hubs, authorities = nx.hits(graph, max_iter=max_iterations)
            return hubs, authorities
            
        except Exception as e:
            self.logger.error(f"Error calculating HITS: {str(e)}")
            try:
                return nx.hits(graph)
            except:
                return {}, {}
    
    def _run_cpp_hits(self, graph: nx.DiGraph, max_iterations: int) -> Tuple[Dict[str, float], Dict[str, float]]:
        """Run the C++ implementation of HITS
        
        Args:
            graph: NetworkX DiGraph
            max_iterations: Maximum number of iterations
            
        Returns:
            Tuple of (hubs, authorities) dictionaries mapping node IDs to scores
        """
        # Similar implementation to _run_cpp_pagerank, but for HITS algorithm
        # For now, fall back to NetworkX implementation
        return nx.hits(graph, max_iter=max_iterations)
    
    def detect_communities(self, network_data: Dict[str, Any], algorithm: str = 'louvain') -> Dict[str, Any]:
        """Detect communities in the network
        
        Args:
            network_data: Network data with nodes and edges
            algorithm: Community detection algorithm to use ('louvain' or 'kcore')
            
        Returns:
            Dictionary with community detection results
        """
        try:
            # Build the graph
            if algorithm == 'louvain':
                # Use the follow graph for Louvain clustering
                graph = self.build_follow_graph(network_data)
                
                # Convert to undirected graph for Louvain algorithm
                undirected_graph = graph.to_undirected()
                
                # Check if we should use C++ implementation
                if os.path.exists(config.LOUVAIN_BINARY):
                    communities = self._run_cpp_louvain(undirected_graph)
                else:
                    # Fall back to Python implementation
                    communities = community_louvain.best_partition(undirected_graph, resolution=config.LOUVAIN_RESOLUTION)
                
                # Organize nodes by community
                community_groups = {}
                for node, community_id in communities.items():
                    if community_id not in community_groups:
                        community_groups[community_id] = []
                    community_groups[community_id].append(node)
                
                return {
                    'algorithm': 'louvain',
                    'communities': communities,  # Node -> community ID mapping
                    'community_groups': community_groups  # Community ID -> list of nodes
                }
                
            elif algorithm == 'kcore':
                # Use the follow graph for k-core decomposition
                graph = self.build_follow_graph(network_data)
                undirected_graph = graph.to_undirected()
                
                # Calculate k-core decomposition
                cores = nx.core_number(undirected_graph)
                
                # Group nodes by core number
                core_groups = {}
                for node, core_num in cores.items():
                    if core_num not in core_groups:
                        core_groups[core_num] = []
                    core_groups[core_num].append(node)
                
                return {
                    'algorithm': 'kcore',
                    'cores': cores,  # Node -> core number mapping
                    'core_groups': core_groups  # Core number -> list of nodes
                }
                
            else:
                raise ValueError(f"Unknown community detection algorithm: {algorithm}")
                
        except Exception as e:
            self.logger.error(f"Error detecting communities: {str(e)}")
            return {'error': str(e)}
    
    def _run_cpp_louvain(self, graph: nx.Graph) -> Dict[str, int]:
        """Run the C++ implementation of the Louvain community detection algorithm
        
        Args:
            graph: NetworkX undirected Graph
            
        Returns:
            Dictionary mapping node IDs to community IDs
        """
        # Similar implementation to _run_cpp_pagerank, but for Louvain algorithm
        # For now, fall back to Python implementation
        return community_louvain.best_partition(graph, resolution=config.LOUVAIN_RESOLUTION)
    
    def find_shortest_path(self, network_data: Dict[str, Any], source: str, target: str) -> Dict[str, Any]:
        """Find the shortest path between two nodes in the network
        
        Args:
            network_data: Network data with nodes and edges
            source: Source node ID
            target: Target node ID
            
        Returns:
            Dictionary with path information
        """
        try:
            # Build the graph
            graph = self.build_follow_graph(network_data)
            
            # Check if both nodes exist in the graph
            if source not in graph or target not in graph:
                return {
                    'source': source,
                    'target': target,
                    'path_exists': False,
                    'error': 'One or both nodes do not exist in the graph'
                }
            
            # Check if a path exists between the nodes
            if not nx.has_path(graph, source, target):
                return {
                    'source': source,
                    'target': target,
                    'path_exists': False
                }
            
            # Find the shortest path
            if os.path.exists(config.DIJKSTRA_BINARY):
                path = self._run_cpp_dijkstra(graph, source, target)
            else:
                path = nx.shortest_path(graph, source, target)
            
            # Calculate path length
            path_length = len(path) - 1
            
            # Get node data for nodes in the path
            path_nodes = []
            for node in path:
                if node in network_data['nodes']:
                    path_nodes.append({
                        'id': node,
                        'data': network_data['nodes'][node]['data']
                    })
            
            return {
                'source': source,
                'target': target,
                'path_exists': True,
                'path': path,
                'path_length': path_length,
                'path_nodes': path_nodes
            }
            
        except Exception as e:
            self.logger.error(f"Error finding shortest path: {str(e)}")
            return {
                'source': source,
                'target': target,
                'path_exists': False,
                'error': str(e)
            }
    
    def _run_cpp_dijkstra(self, graph: nx.DiGraph, source: str, target: str) -> List[str]:
        """Run the C++ implementation of Dijkstra's algorithm
        
        Args:
            graph: NetworkX DiGraph
            source: Source node ID
            target: Target node ID
            
        Returns:
            List of node IDs in the shortest path
        """
        # Similar implementation to _run_cpp_pagerank, but for Dijkstra's algorithm
        # For now, fall back to NetworkX implementation
        return nx.shortest_path(graph, source, target) 