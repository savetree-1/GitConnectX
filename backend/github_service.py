# backend/github_service.py

from github import Github, GithubException
import time
import logging
from typing import Dict, List, Optional, Any, Tuple
import pandas as pd
import random
from datetime import datetime, timedelta

from backend import config

class GitHubDataFetcher:
    # ::::: GitHub Data Fetcher 
    
    def __init__(self, api_token: Optional[str] = None):
        # ::::: Initialize GitHub client
        self.api_token = api_token or config.GITHUB_API_TOKEN
        self.client = Github(self.api_token, per_page=100)  # Set per_page to 100 for efficiency
        self.logger = logging.getLogger(__name__)
        
    def check_rate_limit(self) -> Dict[str, Any]:
        # ::::: Check GitHub API rate limit
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
        # ::::: Fetch user data from GitHub
        try:
            user = self.client.get_user(username)
            
            # ::::: Ensure user ID exists
            if not user or not user.id:
                self.logger.error(f"Invalid user data for {username}: Missing ID")
                return None
            
            # ::::: Fetch basic user information
            user_data = {
                'login': user.login,
                'github_id': user.id,  # ::::: Ensure we use github_id for storage
                'id': user.id,  # ::::: Keep id for compatibility
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
                
                # ::::: Skip followers without ID
                if not follower.id:
                    continue
                    
                followers_data.append({
                    'login': follower.login,
                    'github_id': follower.id,  # ::::: Use github_id for storage
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
        # ::::: Fetch following users of a GitHub user
        try:
            user = self.client.get_user(username)
            following_data = []
            
            count = 0
            for following in user.get_following():
                if count >= max_count:
                    break
                
                # ::::: Skip following users without ID
                if not following.id:
                    continue
                    
                following_data.append({
                    'login': following.login,
                    'github_id': following.id,  # ::::: Use github_id for storage
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
        # ::::: Fetch repositories of a GitHub user
        try:
            user = self.client.get_user(username)
            repos_data = []
            
            count = 0
            for repo in user.get_repos():
                if count >= max_count:
                    break
                    
                repos_data.append({
                    'id': repo.id,
                    'github_id': repo.id,  # Use github_id for storage
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
    
    def fetch_repository_stargazers(self, owner: str, repo: str, max_count: int = 100) -> List[Dict[str, Any]]:
        # ::::: Fetch stargazers of a GitHub repository
        try:
            if not self.api_token or self.api_token == "your_github_token":
                self.logger.warning(f"GitHub API token not set or invalid. Providing demo stargazers data for {owner}/{repo}")
                return self._generate_demo_stargazers(owner, repo, max_count)
            
            repository = self.client.get_repo(f"{owner}/{repo}")
            stargazers_data = []
            
            count = 0
            for stargazer in repository.get_stargazers():
                if count >= max_count:
                    break
                
                # ::::: Skip users without ID
                if not stargazer.id:
                    continue
                
                stargazers_data.append({
                    'login': stargazer.login,
                    'github_id': stargazer.id,
                    'id': stargazer.id,
                    'avatar_url': stargazer.avatar_url,
                    'url': stargazer.html_url
                })
                
                count += 1
                
            self.logger.info(f"Fetched {len(stargazers_data)} stargazers for {owner}/{repo}")
            return stargazers_data
            
        except GithubException as e:
            self.logger.error(f"Error fetching stargazers for {owner}/{repo}: {str(e)}")
            return self._generate_demo_stargazers(owner, repo, max_count)
        except Exception as e:
            self.logger.error(f"Unexpected error: {str(e)}")
            return self._generate_demo_stargazers(owner, repo, max_count)
    
    def fetch_repository_contributors(self, owner: str, repo: str) -> List[Dict[str, Any]]:
        # ::::: Fetch contributors of a GitHub repository
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
        # ::::: Fetch user network data
        try:
            # ::::: Initialize network data
            network = {
                'nodes': {},
                'edges': []
            }
            
            # ::::: Add root user
            user_data = self.fetch_user_data(username)
            if not user_data:
                return network
                
            network['nodes'][username] = {
                'type': 'user',
                'data': user_data
            }
            
            # ::::: Process direct connections (depth 1)
            self._process_user_connections(username, network, current_depth=1, max_depth=depth, include_repos=include_repositories)
            
            return network
            
        except Exception as e:
            self.logger.error(f"Error fetching network for {username}: {str(e)}")
            return {'nodes': {}, 'edges': []}
    
    def _process_user_connections(self, username: str, network: Dict[str, Any], current_depth: int, max_depth: int, include_repos: bool):
        # ::::: process user connections
        if current_depth > max_depth:
            return
            
        # ::::: Fetch followers
        followers = self.fetch_user_followers(username)
        for follower in followers:
            follower_login = follower['login']
            
            # ::::: Add to network if not already present
            if follower_login not in network['nodes']:
                network['nodes'][follower_login] = {
                    'type': 'user',
                    'data': follower
                }
                
            # ::::: Add edge: follower -> user
            network['edges'].append({
                'source': follower_login,
                'target': username,
                'type': 'follows'
            })
            
            # ::::: Process next level if not at max depth
            if current_depth < max_depth:
                self._process_user_connections(follower_login, network, current_depth + 1, max_depth, include_repos)
        
        # ::::: Fetch following
        following = self.fetch_user_following(username)
        for follow in following:
            follow_login = follow['login']
            
            # ::::: Add to network if not already present
            if follow_login not in network['nodes']:
                network['nodes'][follow_login] = {
                    'type': 'user',
                    'data': follow
                }
                
            # ::::: Add edge: user -> follow
            network['edges'].append({
                'source': username,
                'target': follow_login,
                'type': 'follows'
            })
            
            # ::::: Process next level if not at max depth
            if current_depth < max_depth:
                self._process_user_connections(follow_login, network, current_depth + 1, max_depth, include_repos)
        
        # ::::: Fetch repositories if requested
        if include_repos:
            repositories = self.fetch_user_repositories(username)
            for repo in repositories:
                repo_name = repo['full_name']
                
                # ::::: Add to network if not already present
                if repo_name not in network['nodes']:
                    network['nodes'][repo_name] = {
                        'type': 'repository',
                        'data': repo
                    }
                    
                # ::::: Add edge: user -> repository (owns)
                network['edges'].append({
                    'source': username,
                    'target': repo_name,
                    'type': 'owns'
                })
    
    def search_repositories_by_topic(self, topic: str, max_count: int = 10, sort_by: str = 'stars') -> List[Dict[str, Any]]:
        """Search for repositories by topic
        
        Args:
            topic: GitHub topic to search for
            max_count: Maximum number of repositories to return
            sort_by: Field to sort results by ('stars', 'forks', 'updated')
            
        Returns:
            List of dictionaries with repository data
        """
        try:
            # Check if we have a valid API token
            if not self.api_token:
                self.logger.warning("GitHub API token not set. Providing demo data.")
                return self._generate_demo_repos_for_topic(topic, max_count)
                
            # Construct query with topic
            query = f"topic:{topic}"
            
            # Map sort parameters to GitHub API sort parameters
            sort_map = {
                'stars': 'stars',
                'forks': 'forks',
                'updated': 'updated'
            }
            
            # Get sort parameter or default to stars
            sort_param = sort_map.get(sort_by, 'stars')
            
            # Search for repositories
            repositories = self.client.search_repositories(query=query, sort=sort_param)
            
            # Format repository data
            repos_data = []
            count = 0
            
            for repo in repositories:
                if count >= max_count:
                    break
                    
                # Extract topics
                topics = []
                try:
                    topics = list(repo.get_topics())
                except:
                    pass
                
                # Format repository data
                repos_data.append({
                    'id': repo.id,
                    'github_id': repo.id,
                    'name': repo.name,
                    'full_name': repo.full_name,
                    'owner_login': repo.owner.login,
                    'description': repo.description,
                    'language': repo.language,
                    'stargazers_count': repo.stargazers_count,
                    'stars': repo.stargazers_count,  # For compatibility with frontend
                    'forks_count': repo.forks_count,
                    'forks': repo.forks_count,  # For compatibility with frontend
                    'watchers_count': repo.watchers_count,
                    'created_at': repo.created_at.isoformat() if repo.created_at else None,
                    'updated_at': repo.updated_at.isoformat() if repo.updated_at else None,
                    'url': repo.html_url,
                    'html_url': repo.html_url,  # For compatibility with frontend
                    'topics': topics,
                    'is_fork': repo.fork
                })
                
                count += 1
                
            if not repos_data:
                self.logger.warning(f"No repositories found for topic {topic}. Providing demo data.")
                return self._generate_demo_repos_for_topic(topic, max_count)
                
            return repos_data
            
        except GithubException as e:
            self.logger.error(f"GitHub API error searching repositories: {str(e)}")
            return self._generate_demo_repos_for_topic(topic, max_count)
        except Exception as e:
            self.logger.error(f"Unexpected error: {str(e)}")
            return self._generate_demo_repos_for_topic(topic, max_count)
            
    def _generate_demo_repos_for_topic(self, topic: str, max_count: int = 10) -> List[Dict[str, Any]]:
        """Generate demo repository data for a topic
        
        Args:
            topic: GitHub topic to generate data for
            max_count: Maximum number of repositories to generate
            
        Returns:
            List of dictionaries with repository data
        """
        # Map topics to specific sample repos based on domain
        topic_mapping = {
            'web': 'web-development',
            'machine-learning': 'machine-learning',
            'security': 'cybersecurity',
            'mobile': 'mobile-apps',
            'data-science': 'data-science',
            'devops': 'devops',
            'blockchain': 'blockchain',
            'game-development': 'game-development',
            'iot': 'iot',
            'cloud': 'cloud-computing'
        }
        
        # Get the normalized topic domain
        domain = topic
        for k, v in topic_mapping.items():
            if k in topic or v in topic:
                domain = v
                break
        
        # Common languages by domain
        domain_languages = {
            'web-development': ['JavaScript', 'TypeScript', 'HTML', 'CSS', 'Python', 'PHP'],
            'machine-learning': ['Python', 'R', 'C++', 'Java', 'Julia'],
            'cybersecurity': ['Python', 'Go', 'C', 'C++', 'Rust'],
            'mobile-apps': ['Kotlin', 'Swift', 'Java', 'Dart', 'Objective-C'],
            'data-science': ['Python', 'R', 'SQL', 'Julia', 'Scala'],
            'devops': ['Python', 'Go', 'YAML', 'Shell', 'PowerShell'],
            'blockchain': ['Solidity', 'JavaScript', 'Go', 'Rust', 'Python'],
            'game-development': ['C++', 'C#', 'JavaScript', 'Python', 'GDScript'],
            'iot': ['C', 'C++', 'Python', 'Arduino', 'Rust'],
            'cloud-computing': ['YAML', 'Python', 'Go', 'TypeScript', 'Shell']
        }
        
        # Get languages for the domain or default to common languages
        languages = domain_languages.get(domain, ['JavaScript', 'Python', 'Go', 'Java', 'TypeScript'])
        
        # Create demo repositories
        repos = []
        common_names = ['awesome', 'core', 'toolkit', 'framework', 'starter', 'boilerplate', 
                        'library', 'api', 'platform', 'tools', 'utils', 'examples', 'demo']
        
        organizations = ['microsoft', 'google', 'facebook', 'aws', 'netflix', 'apple',
                         'mozilla', 'twitter', 'uber', 'airbnb', 'stripe', 'github']
                         
        base_date = datetime.now()
        
        # Generate repositories
        for i in range(max_count):
            # Generate random components
            repo_name = f"{domain.lower().replace('-', '-')}-{random.choice(common_names)}"
            org_name = random.choice(organizations)
            language = random.choice(languages)
            stars = random.randint(500, 10000)
            forks = int(stars * random.uniform(0.1, 0.5))
            
            # Generate a random date within the last year
            days_ago = random.randint(0, 365)
            update_date = (base_date - timedelta(days=days_ago)).isoformat()
            
            # Generate topics
            topics = [domain.replace('-', '')]
            possible_topics = ['opensource', 'hacktoberfest', 'beginner-friendly', language.lower()]
            for _ in range(random.randint(1, 3)):
                topic = random.choice(possible_topics)
                if topic not in topics:
                    topics.append(topic)
            
            # Create the repository object
            repos.append({
                'id': f"demo-{domain}-{i}",
                'github_id': random.randint(10000, 99999),
                'name': repo_name,
                'full_name': f"{org_name}/{repo_name}",
                'owner_login': org_name,
                'description': f"A {language} {domain.replace('-', ' ')} {random.choice(common_names)} with extensive features and documentation.",
                'language': language,
                'stargazers_count': stars,
                'stars': stars,  # For compatibility with frontend
                'forks_count': forks,
                'forks': forks,  # For compatibility with frontend
                'watchers_count': int(stars * 0.8),
                'created_at': (base_date - timedelta(days=days_ago + 100)).isoformat(),
                'updated_at': update_date,
                'url': f"https://github.com/{org_name}/{repo_name}",
                'html_url': f"https://github.com/{org_name}/{repo_name}",  # For compatibility with frontend
                'topics': topics,
                'is_fork': random.choice([True, False, False, False])  # 25% chance of being a fork
            })
            
        return repos

    def _generate_demo_stargazers(self, owner: str, repo: str, max_count: int = 100) -> List[Dict[str, Any]]:
        """Generate demo stargazers data for a repository
        
        Args:
            owner: Repository owner
            repo: Repository name
            max_count: Maximum number of stargazers to generate
            
        Returns:
            List of dictionaries with stargazer data
        """
        self.logger.info(f"Generating demo stargazers for {owner}/{repo}")
        
        # Common usernames for tech users
        tech_usernames = ['devuser', 'coder', 'programmer', 'webdev', 'developer', 'engineer', 
                          'fullstack', 'frontend', 'backend', 'techie', 'hacker', 'datascientist',
                          'pythondev', 'jsdev', 'webmaster', 'sysadmin', 'devops', 'dataengineer',
                          'mlexpert', 'aiengineer', 'cloudarchitect', 'securityexpert']
        
        # Common tech companies
        companies = ['Google', 'Microsoft', 'Amazon', 'Facebook', 'Twitter', 'Netflix', 'Uber', 
                     'Airbnb', 'Apple', 'Shopify', 'Stripe', 'GitHub', 'GitLab', 'Atlassian', 
                     'Slack', 'Zoom', 'Twilio', 'Salesforce', 'Oracle']
                     
        # Generate stargazers
        stargazers = []
        for i in range(min(max_count, 50)):  # Cap at 50 for performance
            # Create username with company or random suffix
            if random.random() > 0.5:
                username = f"{random.choice(tech_usernames)}{random.randint(10, 999)}"
            else:
                username = f"{random.choice(tech_usernames)}_{random.choice(companies).lower()}"
            
            stargazers.append({
                'login': username,
                'github_id': i + 1000,  # Fake ID
                'id': i + 1000,
                'avatar_url': f"https://avatars.githubusercontent.com/u/{i+1000}?v=4",
                'url': f"https://github.com/{username}",
                'name': username.replace('_', ' ').title(),
                'followers_count': random.randint(5, 500),
                'following_count': random.randint(5, 200),
                'public_repos': random.randint(3, 50)
            })
        
        return stargazers

    def generate_demo_repository_network(self, username: str, max_repos: int = 10) -> Dict[str, Any]:
        """Generate demo repository network data
        
        Args:
            username: GitHub username
            max_repos: Maximum number of repositories to include
            
        Returns:
            Dictionary with network data (nodes and edges)
        """
        self.logger.info(f"Generating demo repository network for {username}")
        
        # Create network structure
        network = {
            'nodes': {},
            'edges': []
        }
        
        # Add user node
        network['nodes'][username] = {
            'id': f"{username}(user)",
            'name': username,
            'login': username,
            'type': 'user',
            'data': {
                'name': username,
                'login': username,
                'public_repos': max_repos,
                'followers': random.randint(50, 500),
                'following': random.randint(10, 200)
            }
        }
        
        # Generate repositories
        common_repo_names = ['portfolio', 'blog', 'api', 'app', 'website', 'dashboard', 
                            'backend', 'frontend', 'mobile', 'analytics', 'utils', 'tools']
                            
        languages = ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'C#', 'Ruby']
        
        # Generate contributors (reuse across repos)
        contributors = []
        for i in range(10):
            contributor_name = f"contributor{i}"
            contributors.append({
                'login': contributor_name,
                'name': f"Contributor {i}",
                'id': f"{contributor_name}",
                'avatar_url': f"https://avatars.githubusercontent.com/u/{i+5000}?v=4",
                'contributions': random.randint(5, 100)
            })
        
        # Create repositories
        for i in range(max_repos):
            # Generate repo name
            if i < len(common_repo_names):
                repo_name = f"{common_repo_names[i]}-{username}"
            else:
                repo_name = f"project-{i}-{username}"
            
            # Select language
            language = random.choice(languages)
            
            # Add repository node
            repo_id = f"{repo_name}(repo)"
            network['nodes'][repo_id] = {
                'id': repo_id,
                'name': repo_name,
                'full_name': f"{username}/{repo_name}",
                'type': 'repository',
                'language': language,
                'stargazers_count': random.randint(5, 500),
                'forks_count': random.randint(0, 100)
            }
            
            # Add ownership edge
            network['edges'].append({
                'source': f"{username}(user)",
                'target': repo_id,
                'type': 'owns'
            })
            
            # Add 2-4 contributors per repo
            for _ in range(random.randint(2, 4)):
                contributor = random.choice(contributors)
                contributor_login = contributor['login']
                
                # Add contributor node if not exists
                if contributor_login not in network['nodes']:
                    network['nodes'][contributor_login] = {
                        'id': f"{contributor_login}(user)",
                        'name': contributor['name'],
                        'login': contributor_login,
                        'type': 'user',
                        'data': contributor
                    }
                
                # Add contribution edge
                network['edges'].append({
                    'source': f"{contributor_login}(user)",
                    'target': repo_id,
                    'type': 'contributes',
                    'weight': contributor['contributions']
                })
        
        return network

    def generate_demo_stargazers_network(self, username: str, max_repos: int = 5) -> Dict[str, Any]:
        """Generate demo stargazers network data
        
        Args:
            username: GitHub username
            max_repos: Maximum number of repositories to include
            
        Returns:
            Dictionary with network data (nodes and edges)
        """
        self.logger.info(f"Generating demo stargazers network for {username}")
        
        # Create network structure
        network = {
            'nodes': {},
            'edges': []
        }
        
        # Add user node
        network['nodes'][username] = {
            'id': f"{username}(user)",
            'name': username,
            'login': username,
            'type': 'user',
            'data': {
                'name': username,
                'login': username,
                'public_repos': max_repos,
                'followers': random.randint(50, 500),
                'following': random.randint(10, 200)
            }
        }
        
        # Generate repositories with stargazers
        common_repo_names = ['awesome-project', 'popular-tool', 'viral-library', 'trending-app', 'star-framework']
        languages = ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go']
        
        # Create demo stargazers (reuse across repos)
        stargazers = self._generate_demo_stargazers("demouser", "demorepo", 20)
        
        # Create repositories
        for i in range(min(5, max_repos)):
            # Generate repo name
            repo_name = common_repo_names[i] if i < len(common_repo_names) else f"popular-repo-{i}"
            
            # Select language
            language = random.choice(languages)
            
            # Add repository node
            repo_id = f"{repo_name}(repo)"
            repo_stars = random.randint(20, 500)
            network['nodes'][repo_id] = {
                'id': repo_id,
                'name': repo_name,
                'full_name': f"{username}/{repo_name}",
                'type': 'repository',
                'language': language,
                'stargazers_count': repo_stars,
                'forks_count': int(repo_stars * 0.3)
            }
            
            # Add ownership edge
            network['edges'].append({
                'source': f"{username}(user)",
                'target': repo_id,
                'type': 'owns'
            })
            
            # Add 5-15 stargazers per repo
            for _ in range(random.randint(5, 15)):
                stargazer = random.choice(stargazers)
                stargazer_login = stargazer['login']
                
                # Skip if the stargazer is the owner
                if stargazer_login == username:
                    continue
                    
                # Add stargazer node if not exists
                if stargazer_login not in network['nodes']:
                    network['nodes'][stargazer_login] = {
                        'id': f"{stargazer_login}(user)",
                        'name': stargazer.get('name', stargazer_login),
                        'login': stargazer_login,
                        'type': 'user',
                        'data': stargazer
                    }
                
                # Add stargazer edge
                network['edges'].append({
                    'source': f"{stargazer_login}(user)",
                    'target': repo_id,
                    'type': 'stargazes'
                }) 