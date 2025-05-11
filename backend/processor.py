import pandas as pd
import networkx as nx
import json
import os

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
#!/usr/bin/env python3
# """
# graph.py - Graph model for GitConnectX

# This module defines the Graph model for representing networks of GitHub users and repositories.
# """

# from dataclasses import dataclass, field
# from typing import Dict, List, Set, Any, Union, Optional
# import json
# import os

# # Import local models
# from models.user import User
# from models.repository import Repository
# from models.edge import FollowEdge, CollaborationEdge, ContributionEdge

# @dataclass
# class Graph:
#     """Represents a graph with nodes and edges."""
    
#     nodes: Dict[int, Union[User, Repository]] = field(default_factory=dict)
#     edges: List[Union[FollowEdge, CollaborationEdge, ContributionEdge]] = field(default_factory=list)
#     adjacency_list: Dict[int, Set[int]] = field(default_factory=lambda: {})
    
#     def add_node(self, node: Union[User, Repository]) -> None:
#         """
#         Add a node to the graph
        
#         Args:
#             node: User or Repository instance
#         """
#         self.nodes[node.id] = node
#         if node.id not in self.adjacency_list:
#             self.adjacency_list[node.id] = set()
    
#     def add_edge(self, edge: Union[FollowEdge, CollaborationEdge, ContributionEdge]) -> None:
#         """
#         Add an edge to the graph
        
#         Args:
#             edge: FollowEdge, CollaborationEdge, or ContributionEdge instance
#         """
#         self.edges.append(edge)
        
#         if isinstance(edge, FollowEdge):
#             # Initialize nodes in adjacency list if they don'