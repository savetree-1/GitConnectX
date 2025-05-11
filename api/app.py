from flask import Flask, request, jsonify, session
from flask_cors import CORS
import os
import sys
import json
import logging
from datetime import datetime

# Add project root to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import backend modules
from backend.fetch_data import GitHubDataFetcher
from backend.process_data import DataProcessor
from backend.graph_service import GraphService
import config

# Initialize Flask app
app = Flask(__name__)
app.secret_key = config.SECRET_KEY
app.config['JSON_SORT_KEYS'] = False

# Enable CORS for frontend integration
CORS(app, supports_credentials=True)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("api_server.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Initialize services
github_fetcher = GitHubDataFetcher(api_token=config.GITHUB_API_TOKEN)
data_processor = DataProcessor()
graph_service = GraphService()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': config.API_VERSION
    })

@app.route('/api/fetch-user/<username>', methods=['GET'])
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

@app.route('/api/fetch-network/<username>', methods=['GET'])
def fetch_network(username):
    """
    Fetch and process the entire network for a GitHub user
    
    Args:
        username (str): GitHub username
        
    Returns:
        JSON with network data or error message
    """
    try:
        depth = request.args.get('depth', default=1, type=int)
        include_repos = request.args.get('include_repos', default='true').lower() == 'true'
        
        logger.info(f"Fetching network for {username} with depth {depth}, include_repos={include_repos}")
        
        # Fetch user and their connections
        user_data = github_fetcher.fetch_user_data(username)
        if not user_data:
            return jsonify({'error': f'User {username} not found'}), 404
            
        # Fetch the network (followers, following, collaborators)
        network_data = github_fetcher.fetch_user_network(
            username, 
            depth=depth, 
            include_repositories=include_repos
        )
        
        # Process the network data into graph format
        processed_network = data_processor.process_network_data(network_data)
        
        return jsonify({
            'status': 'success',
            'data': {
                'user': user_data,
                'network': processed_network
            }
        })
        
    except Exception as e:
        logger.error(f"Error fetching network: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze/path', methods=['GET'])
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
        
        # Fetch data for both users if needed
        source_data = github_fetcher.fetch_user_data(source)
        target_data = github_fetcher.fetch_user_data(target)
        
        if not source_data:
            return jsonify({'error': f'Source user {source} not found'}), 404
        if not target_data:
            return jsonify({'error': f'Target user {target} not found'}), 404
            
        # Find the path using graph service
        path = graph_service.find_shortest_path(source, target)
        
        return jsonify({
            'status': 'success',
            'data': {
                'source': source,
                'target': target,
                'path': path
            }
        })
        
    except Exception as e:
        logger.error(f"Error finding path: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze/communities', methods=['GET'])
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
        
        # Fetch user network data
        network_data = github_fetcher.fetch_user_network(username, depth=2)
        
        # Process network data
        processed_network = data_processor.process_network_data(network_data)
        
        # Detect communities
        communities = graph_service.detect_communities(
            processed_network, 
            algorithm=algorithm
        )
        
        return jsonify({
            'status': 'success',
            'data': {
                'username': username,
                'algorithm': algorithm,
                'communities': communities
            }
        })
        
    except Exception as e:
        logger.error(f"Error detecting communities: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze/rank', methods=['GET'])
def rank_developers():
    """
    Rank developers in a network using PageRank or other algorithms
    
    Query parameters:
        username (str): Central GitHub username for network
        algorithm (str, optional): Ranking algorithm ('pagerank', 'hits')
        
    Returns:
        JSON with ranking results
    """
    try:
        username = request.args.get('username')
        algorithm = request.args.get('algorithm', default='pagerank')
        
        if not username:
            return jsonify({'error': 'Username parameter is required'}), 400
            
        logger.info(f"Ranking network for {username} using {algorithm}")
        
        # Fetch user network
        network_data = github_fetcher.fetch_user_network(username, depth=2)
        
        # Process network data
        processed_network = data_processor.process_network_data(network_data)
        
        # Rank developers
        rankings = graph_service.rank_nodes(
            processed_network,
            algorithm=algorithm
        )
        
        return jsonify({
            'status': 'success',
            'data': {
                'username': username,
                'algorithm': algorithm,
                'rankings': rankings
            }
        })
        
    except Exception as e:
        logger.error(f"Error ranking developers: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/repository/<owner>/<repo>', methods=['GET'])
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
        
        # Fetch repository data
        repo_data = github_fetcher.fetch_repository_data(owner, repo)
        
        if not repo_data:
            return jsonify({'error': f'Repository {owner}/{repo} not found'}), 404
            
        # Process repository data
        processed_repo = data_processor.process_repository_data(repo_data)
        
        return jsonify({
            'status': 'success',
            'data': processed_repo
        })
        
    except Exception as e:
        logger.error(f"Error fetching repository data: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Advanced data analysis endpoints
@app.route('/api/analyze/languages/<username>', methods=['GET'])
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
        
        # Fetch user repositories
        repos = github_fetcher.fetch_user_repositories(username)
        
        if not repos:
            return jsonify({'error': f'No repositories found for user {username}'}), 404
            
        # Analyze languages across all repositories
        language_stats = data_processor.analyze_languages(repos)
        
        return jsonify({
            'status': 'success',
            'data': {
                'username': username,
                'languages': language_stats
            }
        })
        
    except Exception as e:
        logger.error(f"Error analyzing languages: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Run the Flask app
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('FLASK_ENV', 'production') == 'development'
    
    logger.info(f"Starting GitConnectX API server on port {port}, debug={debug_mode}")
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
    
    '''
    from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import logging
from datetime import datetime
import os
import config
from backend.fetch_data import GitHubDataFetcher
from backend.process_data import DataProcessor
from backend.graph_service import GraphService

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', config.SECRET_KEY)
app.config['JSON_SORT_KEYS'] = False
CORS(app, supports_credentials=True)

# Initialize rate limiter
limiter = Limiter(get_remote_address, app=app)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# Initialize services
github_fetcher = GitHubDataFetcher(api_token=os.getenv('GITHUB_API_TOKEN', config.GITHUB_API_TOKEN))
data_processor = DataProcessor()
graph_service = GraphService()

# Helper function for error responses
def error_response(message, status_code=400):
    return jsonify({'error': message}), status_code


@app.route('/api/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': config.API_VERSION
    })


@app.route('/api/fetch-user/<username>', methods=['GET'])
@limiter.limit("10 per minute")
def fetch_user(username):
    """
    Fetch GitHub user data
    """
    try:
        logger.info(f"Fetching data for user: {username}")
        user_data = github_fetcher.fetch_user_data(username)
        if not user_data:
            return error_response(f'User {username} not found', 404)
        processed_data = data_processor.process_user_data(user_data)
        return jsonify({'status': 'success', 'data': processed_data})
    except Exception as e:
        logger.error(f"Error fetching user data: {str(e)}")
        return error_response(str(e), 500)


@app.route('/api/fetch-network/<username>', methods=['GET'])
@limiter.limit("5 per minute")
def fetch_network(username):
    """
    Fetch GitHub user's network including followers and repositories
    """
    try:
        depth = request.args.get('depth', default=1, type=int)
        include_repos = request.args.get('include_repos', default='true').lower() == 'true'

        logger.info(f"Fetching network for {username} with depth={depth}, include_repos={include_repos}")
        user_data = github_fetcher.fetch_user_data(username)
        if not user_data:
            return error_response(f'User {username} not found', 404)

        network_data = github_fetcher.fetch_user_network(username, depth=depth, include_repositories=include_repos)
        processed_network = data_processor.process_network_data(network_data)
        return jsonify({'status': 'success', 'data': {'user': user_data, 'network': processed_network}})
    except Exception as e:
        logger.error(f"Error fetching network: {str(e)}")
        return error_response(str(e), 500)


@app.route('/api/analyze/path', methods=['GET'])
@limiter.limit("5 per minute")
def find_path():
    """
    Find shortest path between two GitHub users
    """
    try:
        source = request.args.get('source')
        target = request.args.get('target')
        if not source or not target:
            return error_response('Both source and target parameters are required')

        logger.info(f"Finding path between {source} and {target}")
        path = graph_service.find_shortest_path(source, target)
        return jsonify({'status': 'success', 'data': {'source': source, 'target': target, 'path': path}})
    except Exception as e:
        logger.error(f"Error finding path: {str(e)}")
        return error_response(str(e), 500)


@app.route('/api/analyze/communities', methods=['GET'])
@limiter.limit("5 per minute")
def detect_communities():
    """
    Perform community detection on a user's network
    """
    try:
        username = request.args.get('username')
        algorithm = request.args.get('algorithm', default='louvain')
        if not username:
            return error_response('Username parameter is required')

        logger.info(f"Detecting communities for {username} using {algorithm}")
        network_data = github_fetcher.fetch_user_network(username, depth=2)
        processed_network = data_processor.process_network_data(network_data)
        communities = graph_service.detect_communities(processed_network, algorithm=algorithm)
        return jsonify({'status': 'success', 'data': {'username': username, 'algorithm': algorithm, 'communities': communities}})
    except Exception as e:
        logger.error(f"Error detecting communities: {str(e)}")
        return error_response(str(e), 500)


@app.route('/api/analyze/rank', methods=['GET'])
@limiter.limit("5 per minute")
def rank_developers():
    """
    Rank developers in a network using PageRank or similar algorithms
    """
    try:
        username = request.args.get('username')
        algorithm = request.args.get('algorithm', default='pagerank')
        if not username:
            return error_response('Username parameter is required')

        logger.info(f"Ranking developers in network for {username} using {algorithm}")
        network_data = github_fetcher.fetch_user_network(username, depth=2)
        processed_network = data_processor.process_network_data(network_data)
        rankings = graph_service.rank_nodes(processed_network, algorithm=algorithm)
        return jsonify({'status': 'success', 'data': {'username': username, 'algorithm': algorithm, 'rankings': rankings}})
    except Exception as e:
        logger.error(f"Error ranking developers: {str(e)}")
        return error_response(str(e), 500)


@app.route('/api/repository/<owner>/<repo>', methods=['GET'])
@limiter.limit("10 per minute")
def fetch_repository(owner, repo):
    """
    Fetch detailed information about a GitHub repository
    """
    try:
        logger.info(f"Fetching repository data for {owner}/{repo}")
        repo_data = github_fetcher.fetch_repository_data(owner, repo)
        if not repo_data:
            return error_response(f'Repository {owner}/{repo} not found', 404)
        processed_repo = data_processor.process_repository_data(repo_data)
        return jsonify({'status': 'success', 'data': processed_repo})
    except Exception as e:
        logger.error(f"Error fetching repository data: {str(e)}")
        return error_response(str(e), 500)


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug_mode = os.getenv('FLASK_ENV', 'production') == 'development'
    logger.info(f"Starting GitConnectX API server on port {port}, debug={debug_mode}")
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
    
    '''
    