"""Network controller for GitConnectX"""

import os
import sys
import logging
import networkx as nx
import community as community_louvain
from datetime import datetime
import numpy as np

# Add project root to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

from backend import config
from backend.database_mongo import MongoDBService

logger = logging.getLogger(__name__)

class NetworkController:
    """Controller for network operations"""
    
    def __init__(self):
        """Initialize the network controller"""
        self.db = MongoDBService()
    
    def close(self):
        """Close database connection"""
        self.db.close()
    
    def get_user_follower_network(self, username, depth=1):
        """
        Get follower network for a GitHub user
        
        Args:
            username (str): GitHub username
            depth (int): Depth of the network to fetch
            
        Returns:
            dict: Network data with nodes and edges
        """
        try:
            # Get the user
            user = self.db.get_github_user(username)
            
            if not user:
                return None
            
            # Initialize network data
            network = {
                'nodes': {},
                'edges': []
            }
            
            # Add root user to network
            network['nodes'][user['login']] = {
                'id': user['login'],
                'label': user['login'],
                'type': 'user',
                'data': user
            }
            
            # Process network at requested depth
            self._process_user_network(user['login'], network, current_depth=0, max_depth=depth)
            
            return network
            
        except Exception as e:
            logger.error(f"Error fetching user follower network: {str(e)}")
            return None
    
    def _process_user_network(self, login, network, current_depth, max_depth):
        """
        Recursively process user network to the specified depth
        
        Args:
            login (str): GitHub login to process
            network (dict): Network data to update
            current_depth (int): Current depth in the network
            max_depth (int): Maximum depth to process
        """
        if current_depth >= max_depth:
            return
        
        # Get followers for this user
        followers = self.db.get_followers(login)
        
        # Process each follower
        for follower_login in followers:
            # Get follower data if not already in network
            if follower_login not in network['nodes']:
                follower = self.db.get_github_user(follower_login)
                if follower:
                    network['nodes'][follower_login] = {
                        'id': follower_login,
                        'label': follower_login,
                        'type': 'user',
                        'data': follower
                    }
            
            # Add edge
            edge = {
                'source': follower_login,
                'target': login,
                'type': 'follows'
            }
            
            # Check if edge already exists
            if edge not in network['edges']:
                network['edges'].append(edge)
            
            # Recursively process this follower's network
            if current_depth + 1 < max_depth:
                self._process_user_network(follower_login, network, current_depth + 1, max_depth)
    
    def calculate_pagerank(self, username=None):
        """
        Calculate PageRank scores for users
        
        Args:
            username (str): Optional username to calculate for a specific user
            
        Returns:
            dict: PageRank scores by username
        """
        try:
            # Build the graph
            G = nx.DiGraph()
            
            # Get all follow relationships
            follows_cursor = self.db.follows.find({})
            
            # Add edges to the graph
            for follow in follows_cursor:
                G.add_edge(follow['follower'], follow['followed'])
            
            # Calculate PageRank
            pagerank = nx.pagerank(G, alpha=config.PAGERANK_DAMPING)
            
            # If username specified, return just that score
            if username:
                return {username: pagerank.get(username, 0.0)}
            
            # Update database with PageRank scores
            for login, score in pagerank.items():
                self.db.github_users.update_one(
                    {"login": login},
                    {"$set": {"pagerank_score": score}}
                )
                
            return pagerank
            
        except Exception as e:
            logger.error(f"Error calculating PageRank: {str(e)}")
            return {}
    
    def detect_communities(self, algorithm='louvain'):
        """
        Detect communities in the follower network
        
        Args:
            algorithm (str): Community detection algorithm to use ('louvain' or 'girvan_newman')
            
        Returns:
            dict: Community assignments by username
        """
        try:
            # Build the graph (undirected for community detection)
            G = nx.Graph()
            
            # Get all follow relationships
            follows_cursor = self.db.follows.find({})
            
            # Add edges to the graph
            for follow in follows_cursor:
                G.add_edge(follow['follower'], follow['followed'])
            
            # Detect communities
            if algorithm == 'louvain':
                communities = community_louvain.best_partition(G, resolution=config.LOUVAIN_RESOLUTION)
            elif algorithm == 'girvan_newman':
                # For Girvan-Newman, we'll just take the first partitioning
                comp = nx.community.girvan_newman(G)
                communities = {}
                for i, community in enumerate(next(comp)):
                    for node in community:
                        communities[node] = i
            else:
                return {}
            
            # Update database with community assignments
            for login, community_id in communities.items():
                self.db.github_users.update_one(
                    {"login": login},
                    {"$set": {"community_id": community_id}}
                )
                
            return communities
            
        except Exception as e:
            logger.error(f"Error detecting communities: {str(e)}")
            return {}
    
    def get_commit_network(self, username):
        """
        Get commit network (bipartite graph) for a GitHub user
        
        Args:
            username (str): GitHub username
            
        Returns:
            dict: Network data with users, repos, and commit relationships
        """
        try:
            # Get the user
            user = self.db.get_github_user(username)
            
            if not user:
                return None
            
            # Initialize network
            network = {
                'nodes': {},
                'edges': []
            }
            
            # Add user to network
            network['nodes'][username] = {
                'id': username,
                'label': username,
                'type': 'user',
                'data': user
            }
            
            # Add user's repositories
            user_repos = self.db.get_user_repos(username)
            for repo in user_repos:
                repo_id = f"repo:{repo['full_name']}"
                
                # Add repo node
                network['nodes'][repo_id] = {
                    'id': repo_id,
                    'label': repo['name'],
                    'type': 'repository',
                    'data': repo
                }
                
                # Add ownership edge
                network['edges'].append({
                    'source': username,
                    'target': repo_id,
                    'type': 'owns'
                })
            
            # Add repositories user has contributed to
            contributed_repos = self.db.get_user_contributed_repos(username)
            for repo_full_name in contributed_repos:
                repo = self.db.get_github_repo(repo_full_name)
                if not repo:
                    continue
                    
                repo_id = f"repo:{repo_full_name}"
                
                # Add repo node if it doesn't exist
                if repo_id not in network['nodes']:
                    network['nodes'][repo_id] = {
                        'id': repo_id,
                        'label': repo['name'],
                        'type': 'repository',
                        'data': repo
                    }
                
                # Add contribution edge
                network['edges'].append({
                    'source': username,
                    'target': repo_id,
                    'type': 'contributes'
                })
                
                # Add repo owner if different from current user
                owner_login = repo.get('owner_login')
                if owner_login and owner_login != username:
                    owner = self.db.get_github_user(owner_login)
                    if owner:
                        # Add owner node if it doesn't exist
                        if owner_login not in network['nodes']:
                            network['nodes'][owner_login] = {
                                'id': owner_login,
                                'label': owner_login,
                                'type': 'user',
                                'data': owner
                            }
                        
                        # Add ownership edge
                        network['edges'].append({
                            'source': owner_login,
                            'target': repo_id,
                            'type': 'owns'
                        })
            
            return network
            
        except Exception as e:
            logger.error(f"Error fetching commit network: {str(e)}")
            return None 