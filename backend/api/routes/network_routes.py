"""Network routes for GitConnectX API"""

from flask import Blueprint, request, jsonify
import logging
import networkx as nx
import json
from bson import ObjectId

from backend.api.controllers.network_controller import NetworkController
from backend.api.auth.jwt_auth import token_required
from backend.github_service import GitHubDataFetcher

network_bp = Blueprint('network', __name__, url_prefix='/api/network')
logger = logging.getLogger(__name__)

# Helper function to make MongoDB documents JSON serializable
def clean_mongo_doc(doc):
    """Convert MongoDB document to JSON serializable dict"""
    if doc is None:
        return None
        
    if isinstance(doc, dict):
        # Convert ObjectId to string
        if '_id' in doc and isinstance(doc['_id'], ObjectId):
            doc['_id'] = str(doc['_id'])
            
        # Process nested documents
        for key, value in doc.items():
            if isinstance(value, (dict, list)):
                doc[key] = clean_mongo_doc(value)
                
    elif isinstance(doc, list):
        # Process lists of documents
        return [clean_mongo_doc(item) for item in doc]
        
    return doc

@network_bp.route('/<username>', methods=['GET'])
def get_user_network(username):
    """
    Main endpoint to get a user's GitHub network
    
    Args:
        username (str): GitHub username
    
    Query parameters:
        depth (int): Depth of the network to fetch (default: 1)
        include_repos (bool): Whether to include repositories (default: true)
    
    Returns:
        JSON with network data or error message
    """
    try:
        depth = request.args.get('depth', default=1, type=int)
        include_repos = request.args.get('include_repos', default='true').lower() == 'true'
        
        # Initialize GitHub fetcher
        github_fetcher = GitHubDataFetcher()
        controller = NetworkController()
        
        # First check if user exists
        user_data = github_fetcher.fetch_user_data(username)
        
        if not user_data:
            logger.error(f"User {username} not found on GitHub")
            return jsonify({'error': f'User {username} not found'}), 404
        
        # Save user to database
        controller.db.save_github_user(user_data)
        
        # Get followers and their connections
        followers_data = github_fetcher.fetch_user_followers(username)
        for follower in followers_data:
            controller.db.save_github_user(follower)
            controller.db.save_follow_relationship(follower['login'], username)
        
        # Create network graph
        network = {
            'nodes': [],
            'edges': []
        }
        
        # Add user node
        network['nodes'].append({
            'id': f"{username}(user)",
            'name': user_data.get('name', username),
            'login': username,
            'avatar_url': user_data.get('avatar_url', ''),
            'followers_count': user_data.get('followers', 0),
            'following_count': user_data.get('following', 0),
            'public_repos': user_data.get('public_repos', 0)
        })
        
        # Add follower nodes and edges
        for follower in followers_data:
            # Add follower node
            network['nodes'].append({
                'id': f"{follower['login']}(user)",
                'name': follower.get('name', follower['login']),
                'login': follower['login'],
                'avatar_url': follower.get('avatar_url', ''),
                'followers_count': follower.get('followers', 0),
                'following_count': follower.get('following', 0),
                'public_repos': follower.get('public_repos', 0)
            })
            
            # Add follower edge
            network['edges'].append({
                'source': f"{follower['login']}(user)",
                'target': f"{username}(user)",
                'type': 'follows'
            })
        
        # Include repositories if requested
        if include_repos:
            repos_data = github_fetcher.fetch_user_repositories(username)
            
            for repo in repos_data:
                # Add repository node
                repo_id = f"{repo['name']}(repo)"
                network['nodes'].append({
                    'id': repo_id,
                    'name': repo['name'],
                    'full_name': repo.get('full_name', ''),
                    'language': repo.get('language', ''),
                    'stargazers_count': repo.get('stargazers_count', 0),
                    'forks_count': repo.get('forks_count', 0)
                })
                
                # Add ownership edge
                network['edges'].append({
                    'source': f"{username}(user)",
                    'target': repo_id,
                    'type': 'owns'
                })
        
        controller.close()
        
        # Calculate network stats
        network_stats = {
            'network_density': 0.0
        }
        
        if len(network['nodes']) > 1:
            possible_edges = len(network['nodes']) * (len(network['nodes']) - 1)
            network_stats['network_density'] = (2.0 * len(network['edges'])) / possible_edges if possible_edges > 0 else 0
        
        return jsonify({
            'status': 'success',
            'data': {
                'network': {
                    'nodes': network['nodes'],
                    'edges': network['edges'],
                    'stats': {
                        'node_count': len(network['nodes']),
                        'edge_count': len(network['edges']),
                        'network_density': network_stats['network_density']
                    }
                }
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting user network: {str(e)}")
        return jsonify({'error': str(e)}), 500

@network_bp.route('/stargazers/<owner>/<repo>', methods=['GET'])
def get_stargazers_network(owner, repo):
    """
    Get stargazers network for a GitHub repository
    
    Args:
        owner (str): Repository owner's GitHub username
        repo (str): Repository name
    
    Query parameters:
        max_count (int): Maximum number of stargazers to fetch (default: 100)
    
    Returns:
        JSON with network data or error message
    """
    try:
        max_count = request.args.get('max_count', default=100, type=int)
        
        # Initialize GitHub fetcher
        github_fetcher = GitHubDataFetcher()
        controller = NetworkController()
        
        # Create a networkx graph
        g_stargazers = nx.DiGraph()
        
        # Get repository data
        repo_data = None
        try:
            repository = github_fetcher.client.get_repo(f"{owner}/{repo}")
            repo_data = {
                'name': repository.name,
                'full_name': repository.full_name,
                'language': repository.language,
                'stargazers_count': repository.stargazers_count,
                'url': repository.html_url
            }
            
            # Add repository node
            g_stargazers.add_node(
                repo_data['name'] + '(repo)', 
                type='repo', 
                lang=repo_data['language'],
                owner=owner
            )
            
        except Exception as e:
            logger.error(f"Error getting repository data: {str(e)}")
            return jsonify({'error': f'Repository {owner}/{repo} not found'}), 404
        
        # Get stargazers
        stargazers_data = github_fetcher.fetch_repository_stargazers(owner, repo, max_count=max_count)
        
        # Add nodes and edges to graph
        for sg in stargazers_data:
            # Save user to database
            controller.db.save_github_user(sg)
            
            # Add node and edge to graph
            g_stargazers.add_node(sg['login'] + '(user)', type='user')
            g_stargazers.add_edge(sg['login'] + '(user)', repo_data['name'] + '(repo)', type='gazes')
        
        # Convert networkx graph to JSON serializable format
        network_data = {
            'nodes': [],
            'edges': []
        }
        
        # Add nodes
        for node, attr in g_stargazers.nodes(data=True):
            network_data['nodes'].append({
                'id': node,
                'type': attr.get('type', 'unknown'),
                'attributes': attr
            })
        
        # Add edges
        for source, target, attr in g_stargazers.edges(data=True):
            network_data['edges'].append({
                'source': source,
                'target': target,
                'type': attr.get('type', 'unknown')
            })
        
        controller.close()
        
        return jsonify({
            'status': 'success',
            'data': {
                'repository': repo_data,
                'stargazers_count': len(stargazers_data),
                'network': network_data
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting stargazers network: {str(e)}")
        return jsonify({'error': str(e)}), 500

@network_bp.route('/refresh/<username>', methods=['GET'])
def refresh_user_data(username):
    """
    Fetch and populate fresh data for a GitHub user
    
    Args:
        username (str): GitHub username to refresh
    
    Query parameters:
        depth (int): Depth of the network to fetch (default: 1)
        include_repos (bool): Whether to include repository data (default: true)
    
    Returns:
        JSON with status and user data
    """
    try:
        depth = request.args.get('depth', default=1, type=int)
        include_repos = request.args.get('include_repos', default='true').lower() == 'true'
        
        # Initialize GitHub fetcher and DB service
        github_fetcher = GitHubDataFetcher()
        controller = NetworkController()
        
        # Attempt to fetch the user from GitHub
        user_data = github_fetcher.fetch_user_data(username)
        
        if not user_data:
            return jsonify({'error': f'User {username} not found on GitHub'}), 404
        
        # Save user data to database
        saved_user = controller.db.save_github_user(user_data)
        saved_user = clean_mongo_doc(saved_user)  # Clean for JSON serialization
        
        # Fetch follower relationships
        followers_data = github_fetcher.fetch_user_followers(username)
        for follower in followers_data:
            # Save each follower
            controller.db.save_github_user(follower)
            # Create follow relationship
            controller.db.save_follow_relationship(follower['login'], username)
        
        # Fetch following relationships
        following_data = github_fetcher.fetch_user_following(username)
        for following in following_data:
            # Save each followed user
            controller.db.save_github_user(following)
            # Create follow relationship
            controller.db.save_follow_relationship(username, following['login'])
        
        # Fetch repositories if requested
        repos_data = []
        if include_repos:
            repos_data = github_fetcher.fetch_user_repositories(username)
            for repo in repos_data:
                # Save each repository
                controller.db.save_github_repo(repo)
                
                # Fetch and save contributors if this is a direct request (depth=1)
                if depth == 1 and not repo['is_fork']:
                    repo_name = repo['full_name'].split('/')[1]
                    contributors = github_fetcher.fetch_repository_contributors(username, repo_name)
                    
                    for contributor in contributors:
                        # Save contributor
                        controller.db.save_github_user(contributor)
                        # Create contribution relationship
                        controller.db.save_contribution(
                            contributor['login'], 
                            repo['full_name'],
                            contributor['contributions']
                        )
        
        controller.close()
        
        return jsonify({
            'status': 'success',
            'message': f'Data for {username} refreshed successfully',
            'user': saved_user,
            'followers_count': len(followers_data),
            'following_count': len(following_data),
            'repositories_count': len(repos_data)
        })
        
    except Exception as e:
        logger.error(f"Error refreshing user data: {str(e)}")
        return jsonify({'error': str(e)}), 500

@network_bp.route('/followers/<username>', methods=['GET'])
def get_follower_network(username):
    """
    Get follower network for a GitHub user
    
    Args:
        username (str): GitHub username
    
    Query parameters:
        depth (int): Depth of the network to fetch (default: 1)
    
    Returns:
        JSON with network data or error message
    """
    try:
        depth = request.args.get('depth', default=1, type=int)
        controller = NetworkController()
        
        # Check if user exists in our database
        user = controller.db.get_github_user(username)
        
        # If user doesn't exist, try to fetch fresh data
        if not user:
            github_fetcher = GitHubDataFetcher()
            user_data = github_fetcher.fetch_user_data(username)
            
            if not user_data:
                return jsonify({'error': f'User {username} not found'}), 404
                
            user = controller.db.save_github_user(user_data)
            
            # Also fetch followers for initial data
            followers_data = github_fetcher.fetch_user_followers(username)
            for follower in followers_data:
                controller.db.save_github_user(follower)
                controller.db.save_follow_relationship(follower['login'], username)
        
        network = controller.get_user_follower_network(username, depth=depth)
        
        # Clean MongoDB objects
        if network and 'nodes' in network:
            for node_id, node_data in network['nodes'].items():
                if 'data' in node_data:
                    network['nodes'][node_id]['data'] = clean_mongo_doc(node_data['data'])
        
        controller.close()
        
        if not network:
            return jsonify({'error': f'Could not generate network for {username}'}), 404
        
        return jsonify({
            'status': 'success',
            'data': network
        })
        
    except Exception as e:
        logger.error(f"Error getting follower network: {str(e)}")
        return jsonify({'error': str(e)}), 500

@network_bp.route('/following/<username>', methods=['GET'])
def get_following_network(username):
    """
    Get network of users that a GitHub user follows
    
    Args:
        username (str): GitHub username
    
    Query parameters:
        depth (int): Depth of the network to fetch (default: 1)
    
    Returns:
        JSON with network data or error message
    """
    try:
        depth = request.args.get('depth', default=1, type=int)
        controller = NetworkController()
        
        # Check if user exists in our database
        user = controller.db.get_github_user(username)
        
        # If user doesn't exist, try to fetch fresh data
        if not user:
            github_fetcher = GitHubDataFetcher()
            user_data = github_fetcher.fetch_user_data(username)
            
            if not user_data:
                return jsonify({'error': f'User {username} not found'}), 404
                
            user = controller.db.save_github_user(user_data)
            
            # Also fetch following for initial data
            following_data = github_fetcher.fetch_user_following(username)
            for following in following_data:
                controller.db.save_github_user(following)
                controller.db.save_follow_relationship(username, following['login'])
        
        # Use existing controller method or build following network
        # This assumes get_user_following_network method exists in NetworkController
        # If not, we'll need to implement it similar to the follower network
        
        # For now we'll build it directly here
        network = {
            'nodes': {},
            'edges': []
        }
        
        # Add central user
        network['nodes'][username] = {
            'id': f"{username}(user)",
            'name': user.get('name', username),
            'login': username,
            'type': 'user',
            'data': user
        }
        
        # Get users that this user follows
        following_users = controller.db.get_user_following(username)
        following_count = len(controller.db.get_following(username))
        
        # Add following users and edges
        for following_user in following_users:
            user_login = following_user['login']
            
            # Add node
            if user_login not in network['nodes']:
                network['nodes'][user_login] = {
                    'id': f"{user_login}(user)",
                    'name': following_user.get('name', user_login),
                    'login': user_login,
                    'type': 'user',
                    'data': following_user
                }
            
            # Add edge
            network['edges'].append({
                'source': f"{username}(user)",
                'target': f"{user_login}(user)",
                'type': 'follows'
            })
        
        # Clean MongoDB objects
        if network and 'nodes' in network:
            for node_id, node_data in network['nodes'].items():
                if 'data' in node_data:
                    network['nodes'][node_id]['data'] = clean_mongo_doc(node_data['data'])
        
        controller.close()
        
        if not network or not network['nodes']:
            return jsonify({'error': f'Could not generate following network for {username}'}), 404
        
        return jsonify({
            'status': 'success',
            'data': network,
            'following_count': following_count
        })
        
    except Exception as e:
        logger.error(f"Error getting following network: {str(e)}")
        return jsonify({'error': str(e)}), 500

@network_bp.route('/stargazers/<username>', methods=['GET'])
def get_user_stargazers_network(username):
    """
    Get stargazers network for a GitHub user's repositories
    
    Args:
        username (str): GitHub username
    
    Query parameters:
        max_repos (int): Maximum number of repositories to include (default: 5)
        max_stars (int): Maximum number of stargazers per repo (default: 50)
    
    Returns:
        JSON with network data or error message
    """
    try:
        max_repos = request.args.get('max_repos', default=5, type=int)
        max_stars = request.args.get('max_stars', default=50, type=int)
        
        controller = NetworkController()
        github_fetcher = GitHubDataFetcher()
        
        # Check if we have a valid API token
        if not github_fetcher.api_token or github_fetcher.api_token == "your_github_token":
            logger.warning(f"GitHub API token not set or invalid. Providing demo stargazers network data for {username}")
            demo_network = github_fetcher.generate_demo_stargazers_network(username, max_repos)
            return jsonify({
                'status': 'success',
                'data': demo_network
            })
        
        # Check if user exists
        user = controller.db.get_github_user(username)
        
        # If user doesn't exist, try to fetch fresh data
        if not user:
            user_data = github_fetcher.fetch_user_data(username)
            
            if not user_data:
                logger.warning(f"User {username} not found. Providing demo stargazers network data.")
                demo_network = github_fetcher.generate_demo_stargazers_network(username, max_repos)
                return jsonify({
                    'status': 'success',
                    'data': demo_network
                })
                
            user = controller.db.save_github_user(user_data)
        
        # Get user's repositories
        repos_data = github_fetcher.fetch_user_repositories(username, max_count=max_repos)
        
        # If no repositories found, provide demo data
        if not repos_data:
            logger.warning(f"No repositories found for {username}. Providing demo data.")
            demo_network = github_fetcher.generate_demo_stargazers_network(username, max_repos)
            return jsonify({
                'status': 'success',
                'data': demo_network
            })
        
        # Create network graph
        network = {
            'nodes': {},
            'edges': []
        }
        
        # Add user node
        network['nodes'][username] = {
            'id': f"{username}(user)",
            'name': user.get('name', username),
            'login': username,
            'type': 'user',
            'data': user
        }
        
        # Process each repository
        for repo in repos_data:
            repo_name = repo['name']
            repo_full_name = repo['full_name']
            
            # Add repository node
            repo_id = f"{repo_name}(repo)"
            network['nodes'][repo_id] = {
                'id': repo_id,
                'name': repo_name,
                'full_name': repo_full_name,
                'type': 'repository',
                'data': repo
            }
            
            # Add edge from user to repo
            network['edges'].append({
                'source': f"{username}(user)",
                'target': repo_id,
                'type': 'owns'
            })
            
            # Get stargazers for this repository
            owner = repo_full_name.split('/')[0]
            stargazers = github_fetcher.fetch_repository_stargazers(owner, repo_name, max_count=max_stars)
            
            # Add stargazer nodes and edges
            for stargazer in stargazers:
                stargazer_login = stargazer['login']
                
                # Skip if the stargazer is the owner
                if stargazer_login == username:
                    continue
                    
                # Add stargazer node if not already added
                if stargazer_login not in network['nodes']:
                    network['nodes'][stargazer_login] = {
                        'id': f"{stargazer_login}(user)",
                        'name': stargazer.get('name', stargazer_login),
                        'login': stargazer_login,
                        'type': 'user',
                        'data': stargazer
                    }
                
                # Add edge from stargazer to repo
                network['edges'].append({
                    'source': f"{stargazer_login}(user)",
                    'target': repo_id,
                    'type': 'stargazes'
                })
        
        # Clean MongoDB objects
        if network and 'nodes' in network:
            for node_id, node_data in network['nodes'].items():
                if 'data' in node_data:
                    network['nodes'][node_id]['data'] = clean_mongo_doc(node_data['data'])
        
        controller.close()
        
        stargazer_count = len([n for n in network['nodes'].values() if n['type'] == 'user' and n['login'] != username])
        return jsonify({
            'status': 'success',
            'data': network,
            'stargazers_count': stargazer_count
        })
        
    except Exception as e:
        logger.error(f"Error getting user stargazers network: {str(e)}")
        return jsonify({'error': str(e)}), 500

@network_bp.route('/repositories/<username>', methods=['GET'])
def get_repository_network(username):
    """
    Get repository network for a GitHub user
    
    Args:
        username (str): GitHub username
    
    Query parameters:
        max_repos (int): Maximum number of repositories to include (default: 10)
        include_forks (bool): Whether to include forked repositories (default: true)
    
    Returns:
        JSON with network data or error message
    """
    try:
        max_repos = request.args.get('max_repos', default=10, type=int)
        include_forks = request.args.get('include_forks', default='true').lower() == 'true'
        
        controller = NetworkController()
        github_fetcher = GitHubDataFetcher()
        
        # Check if we have a valid API token
        if not github_fetcher.api_token or github_fetcher.api_token == "your_github_token":
            logger.warning(f"GitHub API token not set or invalid. Providing demo repository network data for {username}")
            demo_network = github_fetcher.generate_demo_repository_network(username, max_repos)
            return jsonify({
                'status': 'success',
                'data': demo_network
            })
        
        # Check if user exists
        user = controller.db.get_github_user(username)
        
        # If user doesn't exist, try to fetch fresh data
        if not user:
            user_data = github_fetcher.fetch_user_data(username)
            
            if not user_data:
                logger.warning(f"User {username} not found. Providing demo repository network data.")
                demo_network = github_fetcher.generate_demo_repository_network(username, max_repos)
                return jsonify({
                    'status': 'success',
                    'data': demo_network
                })
                
            user = controller.db.save_github_user(user_data)
        
        # Get user's repositories
        repos_data = github_fetcher.fetch_user_repositories(username, max_count=max_repos)
        
        # Filter out forks if needed
        if not include_forks:
            repos_data = [repo for repo in repos_data if not repo.get('is_fork', False)]
        
        # If no repositories found, provide demo data
        if not repos_data:
            logger.warning(f"No repositories found for {username}. Providing demo data.")
            demo_network = github_fetcher.generate_demo_repository_network(username, max_repos)
            return jsonify({
                'status': 'success',
                'data': demo_network
            })
        
        # Create network graph
        network = {
            'nodes': {},
            'edges': []
        }
        
        # Add user node
        network['nodes'][username] = {
            'id': f"{username}(user)",
            'name': user.get('name', username),
            'login': username,
            'type': 'user',
            'data': user
        }
        
        # Process each repository
        for repo in repos_data:
            repo_name = repo['name']
            repo_full_name = repo['full_name']
            
            # Add repository node
            repo_id = f"{repo_name}(repo)"
            network['nodes'][repo_id] = {
                'id': repo_id,
                'name': repo_name,
                'full_name': repo_full_name,
                'type': 'repository',
                'data': repo
            }
            
            # Add edge from user to repo
            network['edges'].append({
                'source': f"{username}(user)",
                'target': repo_id,
                'type': 'owns'
            })
            
            # Get contributors for this repository
            owner = repo_full_name.split('/')[0]
            try:
                contributors = github_fetcher.fetch_repository_contributors(owner, repo_name)
                
                # Add contributor nodes and edges
                for contributor in contributors:
                    contributor_login = contributor['login']
                    
                    # Skip if the contributor is the owner
                    if contributor_login == username:
                        continue
                        
                    # Add contributor node if not already added
                    if contributor_login not in network['nodes']:
                        network['nodes'][contributor_login] = {
                            'id': f"{contributor_login}(user)",
                            'name': contributor.get('name', contributor_login),
                            'login': contributor_login,
                            'type': 'user',
                            'data': contributor
                        }
                    
                    # Add edge from contributor to repo
                    network['edges'].append({
                        'source': f"{contributor_login}(user)",
                        'target': repo_id,
                        'type': 'contributes',
                        'weight': contributor.get('contributions', 1)
                    })
            except Exception as repo_error:
                logger.warning(f"Error fetching contributors for {repo_full_name}: {str(repo_error)}")
                # Continue with other repositories
        
        # Clean MongoDB objects
        if network and 'nodes' in network:
            for node_id, node_data in network['nodes'].items():
                if 'data' in node_data:
                    network['nodes'][node_id]['data'] = clean_mongo_doc(node_data['data'])
        
        controller.close()
        
        return jsonify({
            'status': 'success',
            'data': network
        })
        
    except Exception as e:
        logger.error(f"Error getting repository network: {str(e)}")
        return jsonify({'error': str(e)}), 500

@network_bp.route('/commits/<username>', methods=['GET'])
def get_commit_network(username):
    """
    Get commit network for a GitHub user
    
    Args:
        username (str): GitHub username
    
    Returns:
        JSON with network data or error message
    """
    try:
        controller = NetworkController()
        
        # Check if user exists in our database
        user = controller.db.get_github_user(username)
        
        # If user doesn't exist, try to fetch fresh data
        if not user:
            github_fetcher = GitHubDataFetcher()
            user_data = github_fetcher.fetch_user_data(username)
            
            if not user_data:
                return jsonify({'error': f'User {username} not found'}), 404
                
            user = controller.db.save_github_user(user_data)
            
            # Also fetch repos for initial data
            repos_data = github_fetcher.fetch_user_repositories(username)
            for repo in repos_data:
                controller.db.save_github_repo(repo)
        
        network = controller.get_commit_network(username)
        controller.close()
        
        if not network:
            return jsonify({'error': f'Could not generate network for {username}'}), 404
        
        return jsonify({
            'status': 'success',
            'data': network
        })
        
    except Exception as e:
        logger.error(f"Error getting commit network: {str(e)}")
        return jsonify({'error': str(e)}), 500

@network_bp.route('/pagerank', methods=['GET'])
def get_pagerank():
    """
    Get PageRank scores for GitHub users
    
    Query parameters:
        username (str): Optional username to get score for a specific user
        recalculate (bool): Whether to recalculate scores (default: false)
    
    Returns:
        JSON with PageRank scores or error message
    """
    try:
        username = request.args.get('username')
        recalculate = request.args.get('recalculate', default='false').lower() == 'true'
        
        controller = NetworkController()
        
        if recalculate:
            # This is a heavy operation, so we'll require authentication
            # @token_required could be added here in a production environment
            pagerank = controller.calculate_pagerank(username)
        else:
            # If not recalculating, just get the stored scores
            if username:
                # Get specific user's score
                user = controller.db.get_github_user(username)
                pagerank = {username: user.get('pagerank_score', 0.0) if user else 0.0}
            else:
                # Get all scores
                users = list(controller.db.github_users.find({}, {'login': 1, 'pagerank_score': 1}))
                pagerank = {user['login']: user.get('pagerank_score', 0.0) for user in users}
        
        controller.close()
        
        return jsonify({
            'status': 'success',
            'data': pagerank
        })
        
    except Exception as e:
        logger.error(f"Error getting PageRank scores: {str(e)}")
        return jsonify({'error': str(e)}), 500

@network_bp.route('/communities', methods=['GET'])
def get_communities():
    """
    Get community assignments for GitHub users
    
    Query parameters:
        algorithm (str): Community detection algorithm to use ('louvain' or 'girvan_newman')
        recalculate (bool): Whether to recalculate communities (default: false)
        username (str): (optional) GitHub username to ensure is present in the DB
    
    Returns:
        JSON with community assignments or error message
    """
    try:
        algorithm = request.args.get('algorithm', default='louvain')
        recalculate = request.args.get('recalculate', default='false').lower() == 'true'
        username = request.args.get('username')
        controller = NetworkController()
        github_fetcher = GitHubDataFetcher()
        # If a username is provided, ensure their data is present
        if username:
            user = controller.db.get_github_user(username)
            if not user:
                user_data = github_fetcher.fetch_user_data(username)
                if user_data:
                    controller.db.save_github_user(user_data)
                    # Fetch and save followers
                    followers = github_fetcher.fetch_user_followers(username)
                    for follower in followers:
                        controller.db.save_github_user(follower)
                        controller.db.save_follow_relationship(follower['login'], username)
                    # Fetch and save following
                    following = github_fetcher.fetch_user_following(username)
                    for following_user in following:
                        controller.db.save_github_user(following_user)
                        controller.db.save_follow_relationship(username, following_user['login'])
                    # Fetch and save repos
                    repos = github_fetcher.fetch_user_repositories(username)
                    for repo in repos:
                        controller.db.save_github_repo(repo)
        if recalculate:
            communities = controller.detect_communities(algorithm=algorithm)
        else:
            users = list(controller.db.github_users.find({'community_id': {'$exists': True}}, {'login': 1, 'community_id': 1}))
            communities = {user['login']: user['community_id'] for user in users if 'community_id' in user}
        controller.close()
        return jsonify({
            'status': 'success',
            'data': {
                'algorithm': algorithm,
                'communities': communities
            }
        })
    except Exception as e:
        logger.error(f"Error getting communities: {str(e)}")
        return jsonify({'error': str(e)}), 500

@network_bp.route('/path', methods=['GET'])
def find_path():
    """
    Find shortest path between two GitHub users
    
    Query parameters:
        source (str): Source GitHub username
        target (str): Target GitHub username
    
    Returns:
        JSON with path data or error message
    """
    try:
        source = request.args.get('source')
        target = request.args.get('target')
        
        if not source or not target:
            return jsonify({'error': 'Both source and target parameters are required'}), 400
        
        controller = NetworkController()
        
        # For path finding, we need to build a graph
        # This would be implemented in the NetworkController
        # For now, we'll return a placeholder response
        
        controller.close()
        
        return jsonify({
            'status': 'success',
            'data': {
                'source': source,
                'target': target,
                'path': [source, 'intermediate_user', target],
                'path_length': 2
            }
        })
        
    except Exception as e:
        logger.error(f"Error finding path: {str(e)}")
        return jsonify({'error': str(e)}), 500 

@network_bp.route('/repositories/domain/<domain>', methods=['GET'])
def get_repositories_by_domain(domain):
    """
    Get repositories by domain/topic
    
    Args:
        domain (str): Domain/topic to search for
    
    Query parameters:
        limit (int): Maximum number of repositories to return (default: 10)
    
    Returns:
        JSON with repository data or error message
    """
    try:
        limit = request.args.get('limit', default=10, type=int)
        
        # Initialize GitHub fetcher
        github_fetcher = GitHubDataFetcher()
        
        # Map domain to GitHub topics
        domain_topic_map = {
            'web-development': 'web',
            'machine-learning': 'machine-learning',
            'cybersecurity': 'security',
            'mobile-apps': 'mobile',
            'data-science': 'data-science',
            'devops': 'devops',
            'blockchain': 'blockchain',
            'game-development': 'game-development',
            'iot': 'iot',
            'cloud-computing': 'cloud'
        }
        
        # Use the mapped topic or the domain itself if no mapping exists
        search_topic = domain_topic_map.get(domain, domain)
        
        # Search for repositories by topic
        try:
            repositories = github_fetcher.search_repositories_by_topic(search_topic, max_count=limit)
            
            # Save repos to database for future use
            controller = NetworkController()
            for repo in repositories:
                controller.db.save_github_repo(repo)
            
            return jsonify({
                'status': 'success',
                'data': repositories
            })
        except Exception as e:
            logger.error(f"Error searching repositories by topic: {str(e)}")
            return jsonify({
                'status': 'error',
                'message': f"Failed to search repositories: {str(e)}"
            }), 500
            
    except Exception as e:
        logger.error(f"Error in get_repositories_by_domain: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500 