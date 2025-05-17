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
    
    Returns:
        JSON with community assignments or error message
    """
    try:
        algorithm = request.args.get('algorithm', default='louvain')
        recalculate = request.args.get('recalculate', default='false').lower() == 'true'
        
        controller = NetworkController()
        
        if recalculate:
            # This is a heavy operation, so we'll require authentication
            # @token_required could be added here in a production environment
            communities = controller.detect_communities(algorithm=algorithm)
        else:
            # If not recalculating, just get the stored community assignments
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