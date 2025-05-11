#!/usr/bin/env python3
"""
graph.py - Graph model for GitConnectX

This module defines the Graph model for representing networks of GitHub users and repositories.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Set, Any, Union, Optional
import json
import os

# Import local models
from models.user import User
from models.repository import Repository
from models.edge import FollowEdge, CollaborationEdge, ContributionEdge

@dataclass
class Graph:
    """Represents a graph with nodes and edges."""
    
    nodes: Dict[int, Union[User, Repository]] = field(default_factory=dict)
    edges: List[Union[FollowEdge, CollaborationEdge, ContributionEdge]] = field(default_factory=list)
    adjacency_list: Dict[int, Set[int]] = field(default_factory=lambda: {})
    
    def add_node(self, node: Union[User, Repository]) -> None:
        """
        Add a node to the graph
        
        Args:
            node: User or Repository instance
        """
        self.nodes[node.id] = node
        if node.id not in self.adjacency_list:
            self.adjacency_list[node.id] = set()
    
    def add_edge(self, edge: Union[FollowEdge, CollaborationEdge, ContributionEdge]) -> None:
        """
        Add an edge to the graph
        
        Args:
            edge: FollowEdge, CollaborationEdge, or ContributionEdge instance
        """
        self.edges.append(edge)
        
        if isinstance(edge, FollowEdge):
            # Initialize nodes in adjacency list if they don't exist
            if edge.follower_id not in self.adjacency_list:
                self.adjacency_list[edge.follower_id] = set()
            if edge.followed_id not in self.adjacency_list:
                self.adjacency_list[edge.followed_id] = set()
            
            # Add the edge to the adjacency list
            self.adjacency_list[edge.follower_id].add(edge.followed_id)
        
        elif isinstance(edge, CollaborationEdge):
            # Initialize nodes in adjacency list if they don't exist
            if edge.user1_id not in self.adjacency_list:
                self.adjacency_list[edge.user1_id] = set()
            if edge.user2_id not in self.adjacency_list:
                self.adjacency_list[edge.user2_id] = set()
            
            # Add bidirectional edges for collaborations
            self.adjacency_list[edge.user1_id].add(edge.user2_id)
            self.adjacency_list[edge.user2_id].add(edge.user1_id)
            
        elif isinstance(edge, ContributionEdge):
            # Initialize nodes in adjacency list if they don't exist
            if edge.user_id not in self.adjacency_list:
                self.adjacency_list[edge.user_id] = set()
            if edge.repo_id not in self.adjacency_list:
                self.adjacency_list[edge.repo_id] = set()
            
            # Add the edge to the adjacency list
            self.adjacency_list[edge.user_id].add(edge.repo_id)
    
    def get_neighbors(self, node_id: int) -> Set[int]:
        """
        Get the neighbors of a node
        
        Args:
            node_id: ID of the node
            
        Returns:
            Set of neighbor node IDs
        """
        return self.adjacency_list.get(node_id, set())
    
    def node_count(self) -> int:
        """
        Get the number of nodes in the graph
        
        Returns:
            Number of nodes
        """
        return len(self.nodes)
    
    def edge_count(self) -> int:
        """
        Get the number of edges in the graph
        
        Returns:
            Number of edges
        """
        return len(self.edges)
    
    def export_to_json(self, filepath: str) -> None:
        """
        Export the graph to a JSON file
        
        Args:
            filepath: Path to save the JSON file
        """
        graph_dict = {
            "nodes": {str(k): v.to_dict() for k, v in self.nodes.items()},
            "edges": [e.to_tuple() for e in self.edges],
            "node_count": self.node_count(),
            "edge_count": self.edge_count()
        }
        
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, 'w') as f:
            json.dump(graph_dict, f, indent=2)
    
    def export_to_csv(self, nodes_path: str, edges_path: str) -> None:
        """
        Export the graph to CSV files
        
        Args:
            nodes_path: Path to save the nodes CSV
            edges_path: Path to save the edges CSV
        """
        import csv
        
        # Export nodes
        os.makedirs(os.path.dirname(nodes_path), exist_ok=True)
        with open(nodes_path, 'w', newline='') as f:
            if not self.nodes:
                return
                
            # Get the first node to determine fieldnames
            first_node = next(iter(self.nodes.values()))
            fieldnames = first_node.to_dict().keys()
            
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            
            for node in self.nodes.values():
                writer.writerow(node.to_dict())
        
        # Export edges
        os.makedirs(os.path.dirname(edges_path), exist_ok=True)
        with open(edges_path, 'w', newline='') as f:
            if not self.edges:
                return
                
            # Determine edge type and corresponding fieldnames
            first_edge = self.edges[0]
            if isinstance(first_edge, FollowEdge):
                fieldnames = ["follower_id", "followed_id"]
            elif isinstance(first_edge, CollaborationEdge):
                fieldnames = ["user1_id", "user2_id", "repo_id", "weight"]
            elif isinstance(first_edge, ContributionEdge):
                fieldnames = ["user_id", "repo_id", "contribution_count"]
            else:
                fieldnames = ["source", "target", "type", "weight"]
            
            writer = csv.writer(f)
            writer.writerow(fieldnames)
            
            for edge in self.edges:
                writer.writerow(edge.to_tuple())
    
    def get_subgraph(self, node_ids: Set[int]) -> 'Graph':
        """
        Get a subgraph containing only the specified nodes and their edges
        
        Args:
            node_ids: Set of node IDs to include in the subgraph
            
        Returns:
            A new Graph instance
        """
        subgraph = Graph()
        
        # Add specified nodes
        for node_id in node_ids:
            if node_id in self.nodes:
                subgraph.add_node(self.nodes[node_id])
        
        # Add edges that connect the specified nodes
        for edge in self.edges:
            if isinstance(edge, FollowEdge):
                if edge.follower_id in node_ids and edge.followed_id in node_ids:
                    subgraph.add_edge(edge)
            elif isinstance(edge, CollaborationEdge):
                if edge.user1_id in node_ids and edge.user2_id in node_ids:
                    subgraph.add_edge(edge)
            elif isinstance(edge, ContributionEdge):
                if edge.user_id in node_ids and edge.repo_id in node_ids:
                    subgraph.add_edge(edge)
        
        return subgraph