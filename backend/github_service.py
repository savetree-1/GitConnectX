# backend/github_service.py

from github import Github, GithubException
import time
import logging
from typing import Dict, List, Optional, Any, Tuple
import pandas as pd

from backend import config

class GitHubDataFetcher:
    """Service for fetching data from GitHub API"""
    
    def __init__(self, api_token: Optional[str] = None):
        """Initialize the GitHub API client
        
        Args:
            api_token: GitHub API token for authentication
        """
        self.api_token = api_token or config.GITHUB_API_TOKEN
        self.client = Github(self.api_token)
        self.logger = logging.getLogger(__name__)
        
    def check_rate_limit(self) -> Dict[str, Any]:
        """Check the current rate limit status
        
        Returns:
            Dict with rate limit information
        """
        rate_limit = self.client.get_rate_limit()
        return {
            'core': {
                'limit': rate_limit.core.limit,
                'remaining': rate_limit.core.remaining,
                'reset': rate_limit.core.reset.timestamp()
            },
            'search': {
                'limit': rate_limit.search.limit,
                'remaining': rate_limit.search.remaining,
                'reset': rate_limit.search.reset.timestamp()
            }
        }
    
    def fetch_user_data(self, username: str) -> Optional[Dict[str, Any]]:
        """Fetch user data from GitHub
        
        Args:
            username: GitHub username
            
        Returns:
            Dictionary with user data or None if user not found
        """
        try:
            user = self.client.get_user(username)
            
            # Fetch basic user information
            user_data = {
                'login': user.login,
                'id': user.id,
                'name': user.name,
                'bio': user.bio,
                'avatar_url': user.avatar_url,
                'followers_count': user.followers,
                'following_count': user.following,
                'public_repos': user.public_repos,
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'updated_at': user.updated_at.isoformat() if user.updated_at else None,
                'email': user.email,
                'location': user.location,
                'company': user.company,
                'hireable': user.hireable,
                'blog': user.blog,
                'url': user.html_url
            }
            
            return user_data
            
        except GithubException as e:
            self.logger.error(f"Error fetching user data for {username}: {str(e)}")
            return None
        except Exception as e:
            self.logger.error(f"Unexpected error: {str(e)}")
            return None
    
    def fetch_user_followers(self, username: str, max_count: int = 100) -> List[Dict[str, Any]]:
        """Fetch followers of a GitHub user
        
        Args:
            username: GitHub username
            max_count: Maximum number of followers to fetch
            
        Returns:
            List of dictionaries with follower data
        """
        try:
            user = self.client.get_user(username)
            followers_data = []
            
            count = 0
            for follower in user.get_followers():
                if count >= max_count:
                    break
                    
                followers_data.append({
                    'login': follower.login,
                    'id': follower.id,
                    'avatar_url': follower.avatar_url,
                    'url': follower.html_url
                })
                
                count += 1
                
            return followers_data
            
        except GithubException as e:
            self.logger.error(f"Error fetching followers for {username}: {str(e)}")
            return []
        except Exception as e:
            self.logger.error(f"Unexpected error: {str(e)}")
            return []
    
    def fetch_user_following(self, username: str, max_count: int = 100) -> List[Dict[str, Any]]:
        """Fetch users followed by a GitHub user
        
        Args:
            username: GitHub username
            max_count: Maximum number of followed users to fetch
            
        Returns:
            List of dictionaries with following data
        """
        try:
            user = self.client.get_user(username)
            following_data = []
            
            count = 0
            for following in user.get_following():
                if count >= max_count:
                    break
                    
                following_data.append({
                    'login': following.login,
                    'id': following.id,
                    'avatar_url': following.avatar_url,
                    'url': following.html_url
                })
                
                count += 1
                
            return following_data
            
        except GithubException as e:
            self.logger.error(f"Error fetching following for {username}: {str(e)}")
            return []
        except Exception as e:
            self.logger.error(f"Unexpected error: {str(e)}")
            return []
    
    def fetch_user_repositories(self, username: str, max_count: int = 100) -> List[Dict[str, Any]]:
        """Fetch repositories owned by a GitHub user
        
        Args:
            username: GitHub username
            max_count: Maximum number of repositories to fetch
            
        Returns:
            List of dictionaries with repository data
        """
        try:
            user = self.client.get_user(username)
            repos_data = []
            
            count = 0
            for repo in user.get_repos():
                if count >= max_count:
                    break
                    
                repos_data.append({
                    'id': repo.id,
                    'name': repo.name,
                    'full_name': repo.full_name,
                    'description': repo.description,
                    'language': repo.language,
                    'stargazers_count': repo.stargazers_count,
                    'forks_count': repo.forks_count,
                    'watchers_count': repo.watchers_count,
                    'created_at': repo.created_at.isoformat() if repo.created_at else None,
                    'updated_at': repo.updated_at.isoformat() if repo.updated_at else None,
                    'url': repo.html_url,
                    'is_fork': repo.fork
                })
                
                count += 1
                
            return repos_data
            
        except GithubException as e:
            self.logger.error(f"Error fetching repositories for {username}: {str(e)}")
            return []
        except Exception as e:
            self.logger.error(f"Unexpected error: {str(e)}")
            return []
    
    def fetch_repository_contributors(self, owner: str, repo: str) -> List[Dict[str, Any]]:
        """Fetch contributors to a GitHub repository
        
        Args:
            owner: Owner of the repository
            repo: Repository name
            
        Returns:
            List of dictionaries with contributor data
        """
        try:
            repository = self.client.get_repo(f"{owner}/{repo}")
            contributors_data = []
            
            for contributor in repository.get_contributors():
                contributors_data.append({
                    'login': contributor.login,
                    'id': contributor.id,
                    'avatar_url': contributor.avatar_url,
                    'url': contributor.html_url,
                    'contributions': contributor.contributions
                })
                
            return contributors_data
            
        except GithubException as e:
            self.logger.error(f"Error fetching contributors for {owner}/{repo}: {str(e)}")
            return []
        except Exception as e:
            self.logger.error(f"Unexpected error: {str(e)}")
            return []
    
    def fetch_user_network(self, username: str, depth: int = 1, include_repositories: bool = True) -> Dict[str, Any]:
        """Fetch a user's network including followers, following, and repositories
        
        Args:
            username: GitHub username
            depth: How many levels of connections to fetch (1 = direct connections only)
            include_repositories: Whether to include repository data
            
        Returns:
            Dictionary with network data
        """
        try:
            # Initialize network data
            network = {
                'nodes': {},
                'edges': []
            }
            
            # Add root user
            user_data = self.fetch_user_data(username)
            if not user_data:
                return network
                
            network['nodes'][username] = {
                'type': 'user',
                'data': user_data
            }
            
            # Process direct connections (depth 1)
            self._process_user_connections(username, network, current_depth=1, max_depth=depth, include_repos=include_repositories)
            
            return network
            
        except Exception as e:
            self.logger.error(f"Error fetching network for {username}: {str(e)}")
            return {'nodes': {}, 'edges': []}
    
    def _process_user_connections(self, username: str, network: Dict[str, Any], current_depth: int, max_depth: int, include_repos: bool):
        """Process user connections recursively up to the specified depth
        
        Args:
            username: GitHub username
            network: Network data structure to update
            current_depth: Current depth in the network
            max_depth: Maximum depth to traverse
            include_repos: Whether to include repository data
        """
        if current_depth > max_depth:
            return
            
        # Fetch followers
        followers = self.fetch_user_followers(username)
        for follower in followers:
            follower_login = follower['login']
            
            # Add to network if not already present
            if follower_login not in network['nodes']:
                network['nodes'][follower_login] = {
                    'type': 'user',
                    'data': follower
                }
                
            # Add edge: follower -> user
            network['edges'].append({
                'source': follower_login,
                'target': username,
                'type': 'follows'
            })
            
            # Process next level if not at max depth
            if current_depth < max_depth:
                self._process_user_connections(follower_login, network, current_depth + 1, max_depth, include_repos)
        
        # Fetch following
        following = self.fetch_user_following(username)
        for follow in following:
            follow_login = follow['login']
            
            # Add to network if not already present
            if follow_login not in network['nodes']:
                network['nodes'][follow_login] = {
                    'type': 'user',
                    'data': follow
                }
                
            # Add edge: user -> follow
            network['edges'].append({
                'source': username,
                'target': follow_login,
                'type': 'follows'
            })
            
            # Process next level if not at max depth
            if current_depth < max_depth:
                self._process_user_connections(follow_login, network, current_depth + 1, max_depth, include_repos)
        
        # Fetch repositories if requested
        if include_repos:
            repositories = self.fetch_user_repositories(username)
            for repo in repositories:
                repo_name = repo['full_name']
                
                # Add to network if not already present
                if repo_name not in network['nodes']:
                    network['nodes'][repo_name] = {
                        'type': 'repository',
                        'data': repo
                    }
                    
                # Add edge: user -> repository (owns)
                network['edges'].append({
                    'source': username,
                    'target': repo_name,
                    'type': 'owns'
                }) 