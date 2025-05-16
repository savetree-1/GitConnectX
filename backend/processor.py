import pandas as pd
import networkx as nx
import json
import os
import logging
from typing import Dict, List, Any, Optional
import numpy as np
from datetime import datetime

from backend import config

def load_csv_data(directory="./"):
    """Load all CSV files into pandas DataFrames"""
    data = {}
    for filename in ["followers.csv", "stargazers.csv", "contributors.csv", "forks.csv"]:
        filepath = os.path.join(directory, filename)
        if os.path.exists(filepath):
            data[filename.replace(".csv", "")] = pd.read_csv(filepath)
    return data

def create_follow_network(data):
    """Create the Follow Network from followers data"""
    G = nx.DiGraph()
    if "followers" in data and not data["followers"].empty:
        for _, row in data["followers"].iterrows():
            # Direction: follower -> user
            G.add_edge(row["Target"], row["Source"])
    return G

def create_commit_network(data):
    """Create bipartite Commit Network from contributors data"""
    G = nx.Graph()
    if "contributors" in data and not data["contributors"].empty:
        for _, row in data["contributors"].iterrows():
            # Bipartite graph: repo -- contributor
            G.add_edge(row["Source"], row["Target"], type="contribution")
    return G

def enrich_networks(follow_network, commit_network, data):
    """Add additional relationship data to the networks"""
    if "stargazers" in data and not data["stargazers"].empty:
        for _, row in data["stargazers"].iterrows():
            commit_network.add_edge(row["Source"], row["Target"], type="star")

    if "forks" in data and not data["forks"].empty:
        for _, row in data["forks"].iterrows():
            commit_network.add_edge(row["Source"], row["Target"], type="fork")

    return follow_network, commit_network

def export_graph_data(follow_network, commit_network, output_dir="./processed_data"):
    """Export graph data in formats suitable for C++ processing"""
    os.makedirs(output_dir, exist_ok=True)

    # Export as adjacency lists
    with open(os.path.join(output_dir, "follow_network.adjlist"), "w") as f:
        for line in nx.generate_adjlist(follow_network):
            f.write(line + "\n")

    with open(os.path.join(output_dir, "commit_network.adjlist"), "w") as f:
        for line in nx.generate_adjlist(commit_network):
            f.write(line + "\n")

    # Export as JSON for web visualization
    follow_data = nx.node_link_data(follow_network)
    commit_data = nx.node_link_data(commit_network)

    with open(os.path.join(output_dir, "follow_network.json"), "w") as f:
        json.dump(follow_data, f)

    with open(os.path.join(output_dir, "commit_network.json"), "w") as f:
        json.dump(commit_data, f)

    print(f"✅ Graph data exported to {output_dir}")

def process_data():
    """Main function to process the GitHub data"""
    print("Loading data from CSVs...")
    data = load_csv_data()

    print("Creating Follow Network...")
    follow_network = create_follow_network(data)
    print(f"Follow Network created with {follow_network.number_of_nodes()} nodes and {follow_network.number_of_edges()} edges")

    print("Creating Commit Network...")
    commit_network = create_commit_network(data)
    print(f"Commit Network created with {commit_network.number_of_nodes()} nodes and {commit_network.number_of_edges()} edges")

    print("Enriching networks with additional relationship data...")
    follow_network, commit_network = enrich_networks(follow_network, commit_network, data)

    print("Exporting processed graph data...")
    export_graph_data(follow_network, commit_network)

    print("✅ Data processing completed!")

if __name__ == "__main__":
    process_data()

class DataProcessor:
    """Service for processing GitHub data"""
    
    def __init__(self):
        """Initialize the data processor"""
        self.logger = logging.getLogger(__name__)
    
    def process_user_data(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process user data for API response
        
        Args:
            user_data: Raw user data from GitHub API or database
            
        Returns:
            Processed user data
        """
        try:
            # For now, just return the user data as is
            # In a real implementation, we might transform or enrich the data
            return user_data
            
        except Exception as e:
            self.logger.error(f"Error processing user data: {str(e)}")
            return user_data
    
    def process_repository_data(self, repo_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process repository data for API response
        
        Args:
            repo_data: Raw repository data from GitHub API or database
            
        Returns:
            Processed repository data
        """
        try:
            # For now, just return the repository data as is
            # In a real implementation, we might transform or enrich the data
            return repo_data
            
        except Exception as e:
            self.logger.error(f"Error processing repository data: {str(e)}")
            return repo_data
    
    def process_network_data(self, network_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process network data for visualization and analysis
        
        Args:
            network_data: Raw network data with nodes and edges
            
        Returns:
            Processed network data
        """
        try:
            # Calculate network statistics
            nodes_count = len(network_data['nodes'])
            edges_count = len(network_data['edges'])
            
            # Count node types
            user_count = sum(1 for node in network_data['nodes'].values() if node['type'] == 'user')
            repo_count = sum(1 for node in network_data['nodes'].values() if node['type'] == 'repository')
            
            # Count edge types
            follows_count = sum(1 for edge in network_data['edges'] if edge['type'] == 'follows')
            owns_count = sum(1 for edge in network_data['edges'] if edge['type'] == 'owns')
            contributes_count = sum(1 for edge in network_data['edges'] if edge['type'] == 'contributes')
            
            # Add statistics to network data
            network_data['statistics'] = {
                'nodes_count': nodes_count,
                'edges_count': edges_count,
                'user_count': user_count,
                'repo_count': repo_count,
                'follows_count': follows_count,
                'owns_count': owns_count,
                'contributes_count': contributes_count
            }
            
            # Process nodes data for visualization
            nodes_list = []
            for node_id, node_data in network_data['nodes'].items():
                node_type = node_data['type']
                node_obj = {
                    'id': node_id,
                    'type': node_type,
                    'label': node_id
                }
                
                # Add type-specific properties
                if node_type == 'user':
                    node_obj['displayName'] = node_data['data'].get('name', node_id)
                    node_obj['avatar'] = node_data['data'].get('avatar_url')
                    node_obj['followers'] = node_data['data'].get('followers_count', 0)
                    node_obj['group'] = 'user'
                elif node_type == 'repository':
                    node_obj['displayName'] = node_data['data'].get('name', node_id)
                    node_obj['language'] = node_data['data'].get('language')
                    node_obj['stars'] = node_data['data'].get('stargazers_count', 0)
                    node_obj['group'] = 'repository'
                
                nodes_list.append(node_obj)
            
            # Process edges data for visualization
            edges_list = []
            for i, edge in enumerate(network_data['edges']):
                edge_obj = {
                    'id': str(i),
                    'source': edge['source'],
                    'target': edge['target'],
                    'type': edge['type']
                }
                
                # Add type-specific properties
                if edge['type'] == 'follows':
                    edge_obj['label'] = 'follows'
                    edge_obj['color'] = '#0077B6'  # Blue
                elif edge['type'] == 'owns':
                    edge_obj['label'] = 'owns'
                    edge_obj['color'] = '#00B74A'  # Green
                elif edge['type'] == 'contributes':
                    edge_obj['label'] = 'contributes'
                    edge_obj['color'] = '#F93154'  # Red
                
                edges_list.append(edge_obj)
            
            # Replace nodes and edges with processed lists
            processed_network = {
                'statistics': network_data['statistics'],
                'raw': {
                    'nodes': network_data['nodes'],
                    'edges': network_data['edges']
                },
                'visualization': {
                    'nodes': nodes_list,
                    'edges': edges_list
                }
            }
            
            return processed_network
            
        except Exception as e:
            self.logger.error(f"Error processing network data: {str(e)}")
            return network_data
    
    def process_pagerank_results(self, pagerank_results: Dict[str, float], network_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process PageRank results for API response
        
        Args:
            pagerank_results: Dictionary mapping node IDs to PageRank scores
            network_data: Network data with nodes information
            
        Returns:
            Processed PageRank results
        """
        try:
            # Convert to list of dictionaries with node information
            results_list = []
            for node_id, score in pagerank_results.items():
                if node_id in network_data['nodes'] and network_data['nodes'][node_id]['type'] == 'user':
                    node_data = network_data['nodes'][node_id]['data']
                    results_list.append({
                        'id': node_id,
                        'score': score,
                        'name': node_data.get('name', node_id),
                        'login': node_data.get('login', node_id),
                        'avatar_url': node_data.get('avatar_url'),
                        'followers_count': node_data.get('followers_count', 0),
                        'following_count': node_data.get('following_count', 0)
                    })
            
            # Sort by score in descending order
            results_list.sort(key=lambda x: x['score'], reverse=True)
            
            return {
                'algorithm': 'pagerank',
                'description': 'PageRank measures the relative importance of nodes in the network',
                'scores': results_list
            }
            
        except Exception as e:
            self.logger.error(f"Error processing PageRank results: {str(e)}")
            return {
                'algorithm': 'pagerank',
                'error': str(e)
            }
    
    def process_hits_results(self, hits_results: tuple, network_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process HITS results for API response
        
        Args:
            hits_results: Tuple of (hubs, authorities) dictionaries
            network_data: Network data with nodes information
            
        Returns:
            Processed HITS results
        """
        try:
            hubs, authorities = hits_results
            
            # Process hubs scores
            hubs_list = []
            for node_id, score in hubs.items():
                if node_id in network_data['nodes'] and network_data['nodes'][node_id]['type'] == 'user':
                    node_data = network_data['nodes'][node_id]['data']
                    hubs_list.append({
                        'id': node_id,
                        'score': score,
                        'name': node_data.get('name', node_id),
                        'login': node_data.get('login', node_id),
                        'avatar_url': node_data.get('avatar_url')
                    })
            
            # Sort by score in descending order
            hubs_list.sort(key=lambda x: x['score'], reverse=True)
            
            # Process authorities scores
            authorities_list = []
            for node_id, score in authorities.items():
                if node_id in network_data['nodes'] and network_data['nodes'][node_id]['type'] == 'user':
                    node_data = network_data['nodes'][node_id]['data']
                    authorities_list.append({
                        'id': node_id,
                        'score': score,
                        'name': node_data.get('name', node_id),
                        'login': node_data.get('login', node_id),
                        'avatar_url': node_data.get('avatar_url')
                    })
            
            # Sort by score in descending order
            authorities_list.sort(key=lambda x: x['score'], reverse=True)
            
            return {
                'algorithm': 'hits',
                'description': 'HITS calculates hub and authority scores for nodes in the network',
                'hubs': hubs_list[:20],  # Limit to top 20
                'authorities': authorities_list[:20]  # Limit to top 20
            }
            
        except Exception as e:
            self.logger.error(f"Error processing HITS results: {str(e)}")
            return {
                'algorithm': 'hits',
                'error': str(e)
            }
    
    def process_community_results(self, community_results: Dict[str, Any], network_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process community detection results for API response
        
        Args:
            community_results: Dictionary with community detection results
            network_data: Network data with nodes information
            
        Returns:
            Processed community detection results
        """
        try:
            # Get algorithm and communities from results
            algorithm = community_results.get('algorithm', 'unknown')
            
            # Process based on algorithm type
            if algorithm == 'louvain':
                communities = community_results.get('community_groups', {})
                
                # Process communities
                communities_list = []
                for community_id, node_ids in communities.items():
                    community = {
                        'id': community_id,
                        'size': len(node_ids),
                        'members': []
                    }
                    
                    # Add node information to community members
                    for node_id in node_ids:
                        if node_id in network_data['nodes'] and network_data['nodes'][node_id]['type'] == 'user':
                            node_data = network_data['nodes'][node_id]['data']
                            community['members'].append({
                                'id': node_id,
                                'name': node_data.get('name', node_id),
                                'login': node_data.get('login', node_id),
                                'avatar_url': node_data.get('avatar_url')
                            })
                    
                    communities_list.append(community)
                
                # Sort communities by size in descending order
                communities_list.sort(key=lambda x: x['size'], reverse=True)
                
                return {
                    'algorithm': 'louvain',
                    'description': 'Louvain method for community detection based on modularity optimization',
                    'communities': communities_list
                }
                
            elif algorithm == 'kcore':
                cores = community_results.get('core_groups', {})
                
                # Process cores
                cores_list = []
                for core_num, node_ids in cores.items():
                    core = {
                        'core': int(core_num),
                        'size': len(node_ids),
                        'members': []
                    }
                    
                    # Add node information to core members
                    for node_id in node_ids:
                        if node_id in network_data['nodes'] and network_data['nodes'][node_id]['type'] == 'user':
                            node_data = network_data['nodes'][node_id]['data']
                            core['members'].append({
                                'id': node_id,
                                'name': node_data.get('name', node_id),
                                'login': node_data.get('login', node_id),
                                'avatar_url': node_data.get('avatar_url')
                            })
                    
                    cores_list.append(core)
                
                # Sort cores by core number in descending order
                cores_list.sort(key=lambda x: x['core'], reverse=True)
                
                return {
                    'algorithm': 'kcore',
                    'description': 'k-core decomposition identifies nested subgraphs of increasingly connected nodes',
                    'cores': cores_list
                }
                
            else:
                return community_results
                
        except Exception as e:
            self.logger.error(f"Error processing community results: {str(e)}")
            return {
                'algorithm': community_results.get('algorithm', 'unknown'),
                'error': str(e)
            }