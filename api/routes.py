from flask import Blueprint, request, jsonify, session
import logging
import os
import sys
from datetime import datetime
import json

# ::::: Add project root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ::::: Import backend modules
from backend.fetch_data import GitHubDataFetcher
from backend.process_data import DataProcessor
from backend.graph_service import GraphService
from api.auth import require_auth
import config

# ::::: Set up logging
logger = logging.getLogger(__name__)

# ::::: Create routes blueprint
routes_bp = Blueprint('routes', __name__)

# ::::: Initialize services
github_fetcher = GitHubDataFetcher(api_token=config.GITHUB_API_TOKEN)
data_processor = DataProcessor()
graph_service = GraphService()

# ::::: Health and status endpoints
@routes_bp.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': config.API_VERSION
    })

@routes_bp.route('/version', methods=['GET'])
def api_version():
    """API version information"""
    return jsonify({
        'version': config.API_VERSION,
        'release_date': config.RELEASE_DATE,
        'features': config.ENABLED_FEATURES
    })

# ::::: User data endpoints
@routes_bp.route('/users/<username>', methods=['GET'])
def fetch_user(username):
    """
    Fetch GitHub user data
    
    Args:
        username (str): GitHub username
        
    Returns:
        JSON with user data or error message
    """
    try:
        logger.info(f"Fetching data for user: {username}")
        user_data = github_fetcher.fetch_user_data(username)
        
        if not user_data:
            return jsonify({'error': f'User {username} not found'}), 404
            
        # ::::: Process fetched data
        processed_data = data_processor.process_user_data(user_data)
        
        return jsonify({
            'status': 'success',
            'data': processed_data
        })
        
    except Exception as e:
        logger.error(f"Error fetching user data: {str(e)}")
        return jsonify({'error': str(e)}), 500

@routes_bp.route('/users/<username>/repositories', methods=['GET'])
def fetch_user_repositories(username):
    """
    Fetch repositories for a GitHub user
    
    Args:
        username (str): GitHub username
        
    Query parameters:
        sort (str, optional): Sort field ('stars', 'updated', 'created')
        limit (int, optional): Maximum number of repositories to return
        
    Returns:
        JSON with repository data
    """
    try:
        sort_by = request.args.get('sort', 'updated')
        limit = request.args.get('limit', default=100, type=int)
        
        logger.info(f"Fetching repositories for user: {username}, sort={sort_by}, limit={limit}")
        
        repos = github_fetcher.fetch_user_repositories(username, sort=sort_by, limit=limit)
        
        if repos is None:  # ::::: User not found
            return jsonify({'error': f'User {username} not found'}), 404
            
        if not repos:  # ::::: No repositories
            return jsonify({
                'status': 'success',
                'data': {
                    'username': username,
                    'repository_count': 0,
                    'repositories': []
                }
            })
            
        # ::::: Process repositories
        processed_repos = data_processor.process_repositories(repos)
        
        return jsonify({
            'status': 'success',
            'data': {
                'username': username,
                'repository_count': len(processed_repos),
                'repositories': processed_repos
            }
        })
        
    except Exception as e:
        logger.error(f"Error fetching repositories: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ::::: Network endpoints
@routes_bp.route('/networks/<username>', methods=['GET'])
def fetch_network(username):
    """
    Fetch and process the entire network for a GitHub user
    
    Args:
        username (str): GitHub username
        
    Query parameters:
        depth (int, optional): Network depth (default=1)
        include_repos (bool, optional): Include repositories (default=true)
        
    Returns:
        JSON with network data or error message
    """
    try:
        depth = request.args.get('depth', default=1, type=int)
        include_repos = request.args.get('include_repos', default='true').lower() == 'true'
        max_connections = request.args.get('max_connections', default=100, type=int)
        
        # ::::: Limit depth for excessive API calls
        if depth > 3:
            depth = 3
            
        logger.info(f"Fetching network for {username} with depth {depth}, " 
                   f"include_repos={include_repos}, max_connections={max_connections}")
        
        # ::::: fetch user data
        user_data = github_fetcher.fetch_user_data(username)
        if not user_data:
            return jsonify({'error': f'User {username} not found'}), 404
            
        # ::::: Fetch the network
        network_data = github_fetcher.fetch_user_network(
            username, 
            depth=depth, 
            include_repositories=include_repos,
            max_connections=max_connections
        )
        
        # ::::: Process the data into graph format
        processed_network = data_processor.process_network_data(network_data)
        
        return jsonify({
            'status': 'success',
            'data': {
                'user': processed_network.get('user', {}),
                'network': {
                    'nodes': processed_network.get('nodes', []),
                    'edges': processed_network.get('edges', []),
                    'stats': {
                        'node_count': len(processed_network.get('nodes', [])),
                        'edge_count': len(processed_network.get('edges', [])),
                        'network_density': processed_network.get('network_stats', {}).get('density', 0)
                    }
                }
            }
        })
        
    except Exception as e:
        logger.error(f"Error fetching network: {str(e)}")
        return jsonify({'error': str(e)}), 500

@routes_bp.route('/networks/<username>/followers', methods=['GET'])
def fetch_followers(username):
    """
    Fetch followers for a GitHub user
    
    Args:
        username (str): GitHub username
        
    Query parameters:
        limit (int, optional): Maximum number of followers to return
        
    Returns:
        JSON with follower data
    """
    try:
        limit = request.args.get('limit', default=100, type=int)
        
        logger.info(f"Fetching followers for user: {username}, limit={limit}")
        
        followers = github_fetcher.fetch_user_followers(username, limit=limit)
        
        if followers is None:  # ::::: User not found
            return jsonify({'error': f'User {username} not found'}), 404
            
        # ::::: Process followers
        processed_followers = data_processor.process_users(followers)
        
        return jsonify({
            'status': 'success',
            'data': {
                'username': username,
                'follower_count': len(processed_followers),
                'followers': processed_followers
            }
        })
        
    except Exception as e:
        logger.error(f"Error fetching followers: {str(e)}")
        return jsonify({'error': str(e)}), 500

@routes_bp.route('/networks/<username>/following', methods=['GET'])
def fetch_following(username):
    """
    Fetch users followed by a GitHub user
    
    Args:
        username (str): GitHub username
        
    Query parameters:
        limit (int, optional): Maximum number of followed users to return
        
    Returns:
        JSON with following data
    """
    try:
        limit = request.args.get('limit', default=100, type=int)
        
        logger.info(f"Fetching users followed by: {username}, limit={limit}")
        
        following = github_fetcher.fetch_user_following(username, limit=limit)
        
        if following is None:  # ::::: User not found
            return jsonify({'error': f'User {username} not found'}), 404
            
        # ::::: Process following
        processed_following = data_processor.process_users(following)
        
        return jsonify({
            'status': 'success',
            'data': {
                'username': username,
                'following_count': len(processed_following),
                'following': processed_following
            }
        })
        
    except Exception as e:
        logger.error(f"Error fetching following: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ::::: Repo endpoints
@routes_bp.route('/repositories/<owner>/<repo>', methods=['GET'])
def fetch_repository(owner, repo):
    """
    Fetch detailed information about a specific repository
    
    Args:
        owner (str): Repository owner username
        repo (str): Repository name
        
    Returns:
        JSON with repository data
    """
    try:
        logger.info(f"Fetching repository data for {owner}/{repo}")
        
        # ::::: Fetch repo data
        repo_data = github_fetcher.fetch_repository_data(owner, repo)
        
        if not repo_data:
            return jsonify({'error': f'Repository {owner}/{repo} not found'}), 404
            
        # ::::: Process repo data
        processed_repo = data_processor.process_repository_data(repo_data)
        
        return jsonify({
            'status': 'success',
            'data': processed_repo
        })
        
    except Exception as e:
        logger.error(f"Error fetching repository data: {str(e)}")
        return jsonify({'error': str(e)}), 500

@routes_bp.route('/repositories/<owner>/<repo>/contributors', methods=['GET'])
def fetch_contributors(owner, repo):
    """
    Fetch contributors for a repository
    
    Args:
        owner (str): Repository owner username
        repo (str): Repository name
        
    Returns:
        JSON with contributor data
    """
    try:
        logger.info(f"Fetching contributors for repository {owner}/{repo}")
        
        # ::::: Fetch contributors
        contributors = github_fetcher.fetch_repository_contributors(owner, repo)
        
        if contributors is None:  # ::::: Repo not found
            return jsonify({'error': f'Repository {owner}/{repo} not found'}), 404
            
        # ::::: Process contributors
        processed_contributors = data_processor.process_contributors(contributors)
        
        return jsonify({
            'status': 'success',
            'data': {
                'repository': f"{owner}/{repo}",
                'contributor_count': len(processed_contributors),
                'contributors': processed_contributors
            }
        })
        
    except Exception as e:
        logger.error(f"Error fetching contributors: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ::::: Analysis endpoints
@routes_bp.route('/analysis/path', methods=['GET'])
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
            
        logger.info(f"Finding path between {source} and {target}")
        
        # ::::: Check if users exist
        source_data = github_fetcher.fetch_user_data(source)
        target_data = github_fetcher.fetch_user_data(target)
        
        if not source_data:
            return jsonify({'error': f'Source user {source} not found'}), 404
        if not target_data:
            return jsonify({'error': f'Target user {target} not found'}), 404
            
        # ::::: Find path using graph
        path_result = graph_service.find_shortest_path(source, target)
        
        return jsonify({
            'status': 'success',
            'data': {
                'source': source,
                'target': target,
                'path': path_result.get('path', []),
                'path_length': path_result.get('path_length', 0),
                'intermediate_nodes': path_result.get('path_length', 0) - 1,
                'connection_types': path_result.get('connection_types', [])
            }
        })
        
    except Exception as e:
        logger.error(f"Error finding path: {str(e)}")
        return jsonify({'error': str(e)}), 500

@routes_bp.route('/analysis/communities', methods=['GET'])
def detect_communities():
    """
    Perform community detection on a user's network
    
    Query parameters:
        username (str): GitHub username
        algorithm (str, optional): Community detection algorithm ('louvain', 'kcore')
        
    Returns:
        JSON with community detection results
    """
    try:
        username = request.args.get('username')
        algorithm = request.args.get('algorithm', default='louvain')
        
        if not username:
            return jsonify({'error': 'Username parameter is required'}), 400
            
        logger.info(f"Detecting communities for {username} using {algorithm}")
        
        # ::::: Fetch user network
        network_data = github_fetcher.fetch_user_network(username, depth=2)
        
        # ::::: Process network data
        processed_network = data_processor.process_network_data(network_data)
        
        # ::::: Detect communities
        communities = graph_service.detect_communities(
            processed_network, 
            algorithm=algorithm
        )
        
        return jsonify({
            'status': 'success',
            'data': {
                'username': username,
                'algorithm': algorithm,
                'community_count': len(communities.get('communities', [])),
                'communities': communities.get('communities', []),
                'modularity': communities.get('modularity', 0)
            }
        })
        
    except Exception as e:
        logger.error(f"Error detecting communities: {str(e)}")
        return jsonify({'error': str(e)}), 500

@routes_bp.route('/analysis/rank', methods=['GET'])
def rank_developers():
    """
    Rank developers in a network using PageRank or other algorithms
    
    Query parameters:
        username (str): Central GitHub username for network
        algorithm (str, optional): Ranking algorithm ('pagerank', 'hits')
        depth (int, optional): Network depth to include
        
    Returns:
        JSON with ranking results
    """
    try:
        username = request.args.get('username')
        algorithm = request.args.get('algorithm', default='pagerank')
        depth = request.args.get('depth', default=2, type=int)
        
        if not username:
            return jsonify({'error': 'Username parameter is required'}), 400
            
        # ::::: Limit depth for excessive API calls
        if depth > 3:
            depth = 3
            
        logger.info(f"Ranking network for {username} using {algorithm}, depth={depth}")
        
        # ::::: Fetch user network
        network_data = github_fetcher.fetch_user_network(username, depth=depth)
        
        # ::::: Process network data
        processed_network = data_processor.process_network_data(network_data)
        
        # ::::: Rank developers
        rankings = graph_service.rank_nodes(
            processed_network,
            algorithm=algorithm
        )
        
        # ::::: Format the rankings for API response
        formatted_rankings = []
        for i, (user, score) in enumerate(rankings.items()):
            formatted_rankings.append({
                'rank': i + 1,
                'username': user,
                'score': score,
                'percentile': 100 - (i * 100 / len(rankings)) if len(rankings) > 0 else 0
            })
        
        return jsonify({
            'status': 'success',
            'data': {
                'username': username,
                'algorithm': algorithm,
                'total_ranked': len(formatted_rankings),
                'rankings': formatted_rankings
            }
        })
        
    except Exception as e:
        logger.error(f"Error ranking developers: {str(e)}")
        return jsonify({'error': str(e)}), 500

@routes_bp.route('/analysis/languages/<username>', methods=['GET'])
def analyze_languages(username):
    """
    Analyze programming languages used by a GitHub user
    
    Args:
        username (str): GitHub username
        
    Returns:
        JSON with language statistics
    """
    try:
        logger.info(f"Analyzing languages for user {username}")
        
        # ::::: Fetch user repositories
        repos = github_fetcher.fetch_user_repositories(username)
        
        if repos is None:  # ::::: User not found
            return jsonify({'error': f'User {username} not found'}), 404
            
        if not repos:  # ::::: No repositories
            return jsonify({
                'status': 'success',
                'data': {
                    'username': username,
                    'languages': {},
                    'top_language': None,
                    'total_bytes': 0
                }
            })
            
        # ::::: Analyze languages
        language_stats = data_processor.analyze_languages(repos)
        
        # ::::: Find top language
        top_language = None
        max_bytes = 0
        total_bytes = sum(language_stats.values())
        
        for lang, bytes_used in language_stats.items():
            if bytes_used > max_bytes:
                max_bytes = bytes_used
                top_language = lang
        
        # ::::: Calculate language percentages
        language_percentages = {}
        for lang, bytes_used in language_stats.items():
            percentage = (bytes_used / total_bytes * 100) if total_bytes > 0 else 0
            language_percentages[lang] = round(percentage, 2)
        
        return jsonify({
            'status': 'success',
            'data': {
                'username': username,
                'languages': language_percentages,
                'top_language': top_language,
                'total_bytes': total_bytes,
                'raw_bytes': language_stats
            }
        })
        
    except Exception as e:
        logger.error(f"Error analyzing languages: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ::::: Protected routes requiring auth
@routes_bp.route('/me/starred', methods=['GET'])
@require_auth
def get_starred_repos():
    """
    Get repositories starred by the authenticated user
    
    Returns:
        JSON with starred repositories
    """
    try:
        username = session.get('username')
        token = session.get('github_token')
        
        logger.info(f"Fetching starred repositories for authenticated user {username}")
        
        # ::::: Fetch starred repositories
        starred = github_fetcher.fetch_user_starred(username, auth_token=token)
        
        # Process starred repositories
        processed_starred = data_processor.process_repositories(starred)
        
        return jsonify({
            'status': 'success',
            'data': {
                'username': username,
                'starred_count': len(processed_starred),
                'repositories': processed_starred
            }
        })
        
    except Exception as e:
        logger.error(f"Error fetching starred repositories: {str(e)}")
        return jsonify({'error': str(e)}), 500

@routes_bp.route('/me/recommendations', methods=['GET'])
@require_auth
def get_recommendations():
    """
    Get repository recommendations for the authenticated user
    
    Returns:
        JSON with recommended repositories
    """
    try:
        username = session.get('username')
        
        logger.info(f"Generating recommendations for authenticated user {username}")
        
        # ::::: Generate recommendations
        recommendations = graph_service.generate_recommendations(username)
        
        return jsonify({
            'status': 'success',
            'data': {
                'username': username,
                'recommendation_count': len(recommendations),
                'recommendations': recommendations
            }
        })
        
    except Exception as e:
        logger.error(f"Error generating recommendations: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ::::: Bulk data endpoints
@routes_bp.route('/bulk/users', methods=['POST'])
def bulk_fetch_users():
    """
    Fetch data for multiple GitHub users in one request
    
    Request body:
        {
            "usernames": ["user1", "user2", ...]
        }
        
    Returns:
        JSON with data for multiple users
    """
    try:
        data = request.get_json()
        
        if not data or 'usernames' not in data:
            return jsonify({'error': 'Request must include "usernames" list'}), 400
            
        usernames = data['usernames']
        
        if not isinstance(usernames, list):
            return jsonify({'error': '"usernames" must be a list'}), 400
            
        if len(usernames) > 100:
            return jsonify({'error': 'Maximum of 100 usernames allowed per request'}), 400
            
        logger.info(f"Bulk fetching data for {len(usernames)} users")
        
        # ::::: Fetch data users
        results = {}
        for username in usernames:
            user_data = github_fetcher.fetch_user_data(username)
            if user_data:
                results[username] = data_processor.process_user_data(user_data)
            else:
                results[username] = None
        
        return jsonify({
            'status': 'success',
            'data': results,
            'found_count': sum(1 for u in results.values() if u is not None),
            'not_found_count': sum(1 for u in results.values() if u is None)
        })
        
    except Exception as e:
        logger.error(f"Error in bulk user fetch: {str(e)}")
        return jsonify({'error': str(e)}), 500
    
    
    
    '''
    from flask import Blueprint, request, jsonify, session
import logging
import os
import sys
from datetime import datetime
import json

# Add project root to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import backend modules
from backend.fetch_data import GitHubDataFetcher
from backend.process_data import DataProcessor
from backend.graph_service import GraphService
from api.auth import require_auth
import config

# Set up logging
logger = logging.getLogger(__name__)

# Create routes blueprint
routes_bp = Blueprint('routes', __name__)

# Initialize services
github_fetcher = GitHubDataFetcher(api_token=config.GITHUB_API_TOKEN)
data_processor = DataProcessor()
graph_service = GraphService()

# Health and status endpoints
@routes_bp.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': config.API_VERSION
    })

@routes_bp.route('/version', methods=['GET'])
def api_version():
    """API version information"""
    return jsonify({
        'version': config.API_VERSION,
        'release_date': config.RELEASE_DATE,
        'features': config.ENABLED_FEATURES
    })

# User data endpoints
@routes_bp.route('/users/<username>', methods=['GET'])
def fetch_user(username):
    """
    Fetch GitHub user data
    
    Args:
        username (str): GitHub username
        
    Returns:
        JSON with user data or error message
    """
    try:
        logger.info(f"Fetching data for user: {username}")
        user_data = github_fetcher.fetch_user_data(username)
        
        if not user_data:
            return jsonify({'error': f'User {username} not found'}), 404
            
        # Process fetched data
        processed_data = data_processor.process_user_data(user_data)
        
        return jsonify({
            'status': 'success',
            'data': processed_data
        })
        
    except Exception as e:
        logger.error(f"Error fetching user data: {str(e)}")
        return jsonify({'error': str(e)}), 500

@routes_bp.route('/users/<username>/repositories', methods=['GET'])
def fetch_user_repositories(username):
    """
    Fetch repositories for a GitHub user
    
    Args:
        username (str): GitHub username
        
    Query parameters:
        sort (str, optional): Sort field ('stars', 'updated', 'created')
        limit (int, optional): Maximum number of repositories to return
        
    Returns:
        JSON with repository data
    """
    try:
        sort_by = request.args.get('sort', 'updated')
        limit = request.args.get('limit', default=100, type=int)
        
        logger.info(f"Fetching repositories for user: {username}, sort={sort_by}, limit={limit}")
        
        repos = github_fetcher.fetch_user_repositories(username, sort=sort_by, limit=limit)
        
        if repos is None:  # User not found
            return jsonify({'error': f'User {username} not found'}), 404
            
        if not repos:  # No repositories
            return jsonify({
                'status': 'success',
                'data': {
                    'username': username,
                    'repository_count': 0,
                    'repositories': []
                }
            })
            
        # Process repositories
        processed_repos = data_processor.process_repositories(repos)
        
        return jsonify({
            'status': 'success',
            'data': {
                'username': username,
                'repository_count': len(processed_repos),
                'repositories': processed_repos
            }
        })
        
    except Exception as e:
        logger.error(f"Error fetching repositories: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Analysis endpoints
@routes_bp.route('/analysis/path', methods=['GET'])
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
            
        logger.info(f"Finding path between {source} and {target}")
        
        # Check if users exist
        source_data = github_fetcher.fetch_user_data(source)
        target_data = github_fetcher.fetch_user_data(target)
        
        if not source_data:
            return jsonify({'error': f'Source user {source} not found'}), 404
        if not target_data:
            return jsonify({'error': f'Target user {target} not found'}), 404
            
        # Find the path using graph service
        path_result = graph_service.find_shortest_path(source, target)
        
        return jsonify({
            'status': 'success',
            'data': {
                'source': source,
                'target': target,
                'path': path_result.get('path', []),
                'path_length': path_result.get('path_length', 0),
                'intermediate_nodes': path_result.get('path_length', 0) - 1,
                'connection_types': path_result.get('connection_types', [])
            }
        })
        
    except Exception as e:
        logger.error(f"Error finding path: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Protected routes requiring authentication
@routes_bp.route('/me/starred', methods=['GET'])
@require_auth
def get_starred_repos():
    """
    Get repositories starred by the authenticated user
    
    Returns:
        JSON with starred repositories
    """
    try:
        username = session.get('username')
        token = session.get('github_token')
        
        logger.info(f"Fetching starred repositories for authenticated user {username}")
        
        # Fetch starred repositories using user's token
        starred = github_fetcher.fetch_user_starred(username, auth_token=token)
        
        # Process starred repositories
        processed_starred = data_processor.process_repositories(starred)
        
        return jsonify({
            'status': 'success',
            'data': {
                'username': username,
                'starred_count': len(processed_starred),
                'repositories': processed_starred
            }
        })
        
    except Exception as e:
        logger.error(f"Error fetching starred repositories: {str(e)}")
        return jsonify({'error': str(e)}), 500
    '''