from flask import Flask, request, jsonify, session
from flask_cors import CORS
import os
import sys
import json
import logging
from datetime import datetime

# ::::: Add Root Path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ::::: backend modules
from backend.github_service import GitHubDataFetcher
from backend.processor import DataProcessor
from backend.graph_service import GraphService
from backend.database import DatabaseService
from backend import config

# ::::: Flask app
app = Flask(__name__)
app.secret_key = config.SECRET_KEY
app.config['JSON_SORT_KEYS'] = False

# ::::: frontend integration
CORS(app, supports_credentials=True)

# ::::: Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("api_server.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ::::: Initialize services
github_fetcher = GitHubDataFetcher(api_token=config.GITHUB_API_TOKEN)
data_processor = DataProcessor()
graph_service = GraphService()
db_service = DatabaseService()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': config.API_VERSION
    })

@app.route('/api/user/<username>', methods=['GET'])
def fetch_user(username):
    """Fetch GitHub user data
    
    Args:
        username (str): GitHub username
        
    Returns:
        JSON with user data or error message
    """
    try:
        logger.info(f"Fetching data for user: {username}")
        
        # ::::: Check database for user data
        cached_user = db_service.get_user(username)
        
        if cached_user:
            # ::::: if the data exists
            user_data = cached_user
            logger.info(f"Retrieved user {username} from database")
        else:
            # ::::: Fetch from GitHub API
            user_data = github_fetcher.fetch_user_data(username)
        
        if not user_data:
            return jsonify({'error': f'User {username} not found'}), 404
                
            # ::::: Save to database
            db_service.save_user(user_data)
            logger.info(f"Saved user {username} to database")
            
        # ::::: Process fetched data
        processed_data = data_processor.process_user_data(user_data)
        
        return jsonify({
            'status': 'success',
            'data': processed_data
        })
        
    except Exception as e:
        logger.error(f"Error fetching user data: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/network/<username>', methods=['GET'])
def fetch_network(username):
    """Fetch and process the network for a GitHub user
    
    Args:
        username (str): GitHub username
        
    Returns:
        JSON with network data or error message
    """
    try:
        depth = request.args.get('depth', default=1, type=int)
        include_repos = request.args.get('include_repos', default='true').lower() == 'true'
        use_cache = request.args.get('use_cache', default='true').lower() == 'true'
        
        logger.info(f"Fetching network for {username} with depth {depth}, include_repos={include_repos}, use_cache={use_cache}")
        
        # ::::: Check for cached network data
        if use_cache:
            cached_network = db_service.get_network(username)
            
            if cached_network and 'network_data' in cached_network:
                network_data = cached_network['network_data']
                logger.info(f"Retrieved network for {username} from database")
                
                # ::::: Process cached data
                processed_network = data_processor.process_network_data(network_data)
                
                return jsonify({
                    'status': 'success',
                    'data': {
                        'network': processed_network,
                        'source': 'cache'
                    }
                })
        
        # ::::: Fetch user data to verify existence
        user_data = github_fetcher.fetch_user_data(username)
        if not user_data:
            return jsonify({'error': f'User {username} not found'}), 404
            
        # :::: Fetch user network
        network_data = github_fetcher.fetch_user_network(
            username, 
            depth=depth, 
            include_repositories=include_repos
        )
        
        # ::::: Save to database
        db_service.save_network(username, network_data)
        logger.info(f"Saved network for {username} to database")
        
        # ::::: Process network data
        processed_network = data_processor.process_network_data(network_data)
        
        return jsonify({
            'status': 'success',
            'data': {
                'network': processed_network,
                'source': 'github'
            }
        })
        
    except Exception as e:
        logger.error(f"Error fetching network: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze/path', methods=['GET'])
def find_path():
    """Find shortest path between two GitHub users
    
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
        
        # ::::: Check for cached path data
        cached_network = db_service.get_network(source)
        
        if cached_network and 'network_data' in cached_network:
            network_data = cached_network['network_data']
        else:
            # :::: Fetch user data to verify existence
            network_data = github_fetcher.fetch_user_network(source, depth=2)
            
        # ::::: Find the path
        path_result = graph_service.find_shortest_path(network_data, source, target)
        
        return jsonify({
            'status': 'success',
            'data': path_result
        })
        
    except Exception as e:
        logger.error(f"Error finding path: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze/communities', methods=['GET'])
def detect_communities():
    """Perform community detection on a user's network
    
    Query parameters:
        username (str): GitHub username
        algorithm (str, optional): Community detection algorithm ('louvain', 'kcore')
        
    Returns:
        JSON with community detection results
    """
    try:
        username = request.args.get('username')
        algorithm = request.args.get('algorithm', default='louvain')
        use_cache = request.args.get('use_cache', default='true').lower() == 'true'
        
        if not username:
            return jsonify({'error': 'Username parameter is required'}), 400
            
        logger.info(f"Detecting communities for {username} using {algorithm}")
        
        # ::::: Check for cached results
        if use_cache:
            cached_result = db_service.get_graph_result(username, f'community_{algorithm}')
            
            if cached_result and 'result_data' in cached_result:
                logger.info(f"Retrieved community detection results for {username} from database")
                return jsonify({
                    'status': 'success',
                    'data': cached_result['result_data'],
                    'source': 'cache'
                })
        
        # ::::: Fetch user network
        cached_network = db_service.get_network(username)
        
        if cached_network and 'network_data' in cached_network:
            network_data = cached_network['network_data']
        else:
            # ::::: Fetch from GitHub API
            network_data = github_fetcher.fetch_user_network(username, depth=2)
            # ::::: Save to database
            db_service.save_network(username, network_data)
        
        # ::::: Detect communities
        communities = graph_service.detect_communities(network_data, algorithm=algorithm)
        
        # ::::: Process results
        processed_results = data_processor.process_community_results(communities, network_data)
        
        # ::::: Save results
        db_service.save_graph_result(username, f'community_{algorithm}', processed_results)
        
        return jsonify({
            'status': 'success',
            'data': processed_results,
            'source': 'computed'
        })
        
    except Exception as e:
        logger.error(f"Error detecting communities: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze/rank', methods=['GET'])
def rank_developers():
    """Rank developers in a network using PageRank or HITS
    
    Query parameters:
        username (str): GitHub username
        algorithm (str, optional): Ranking algorithm ('pagerank', 'hits')
        
    Returns:
        JSON with ranking results
    """
    try:
        username = request.args.get('username')
        algorithm = request.args.get('algorithm', default='pagerank')
        use_cache = request.args.get('use_cache', default='true').lower() == 'true'
        
        if not username:
            return jsonify({'error': 'Username parameter is required'}), 400
            
        logger.info(f"Ranking developers for {username} using {algorithm}")
        
        # ::::: Check for cached results
        if use_cache:
            cached_result = db_service.get_graph_result(username, algorithm)
            
            if cached_result and 'result_data' in cached_result:
                logger.info(f"Retrieved ranking results for {username} from database")
                return jsonify({
                    'status': 'success',
                    'data': cached_result['result_data'],
                    'source': 'cache'
                })
        
        # ::::: Fetch user network
        cached_network = db_service.get_network(username)
        
        if cached_network and 'network_data' in cached_network:
            network_data = cached_network['network_data']
        else:
            # ::::: Fetch from GitHub API
            network_data = github_fetcher.fetch_user_network(username, depth=2)
            # ::::: Save to database
            db_service.save_network(username, network_data)
        
        # ::::: Build the graph
        follow_graph = graph_service.build_follow_graph(network_data)
        
        # :::: Rank developers
        if algorithm == 'pagerank':
            result = graph_service.run_pagerank(follow_graph)
            processed_results = data_processor.process_pagerank_results(result, network_data)
        elif algorithm == 'hits':
            result = graph_service.run_hits(follow_graph)
            processed_results = data_processor.process_hits_results(result, network_data)
        else:
            return jsonify({'error': f'Unsupported algorithm: {algorithm}'}), 400
        
        # ::::: Save results
        db_service.save_graph_result(username, algorithm, processed_results)
        
        return jsonify({
            'status': 'success',
            'data': processed_results,
            'source': 'computed'
        })
        
    except Exception as e:
        logger.error(f"Error ranking developers: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/repository/<owner>/<repo>', methods=['GET'])
def fetch_repository(owner, repo):
    """Fetch GitHub repository data
    
    Args:
        owner (str): Repository owner username
        repo (str): Repository name
        
    Returns:
        JSON with repository data or error message
    """
    try:
        logger.info(f"Fetching repository data for {owner}/{repo}")
        
        # ::::: Check database for repository data
        full_name = f"{owner}/{repo}"
        cached_repo = db_service.get_repository(full_name)
        
        if cached_repo:
            # ::::: Use cached data
            repo_data = cached_repo
            logger.info(f"Retrieved repository {full_name} from database")
        else:
            # :::: Fetch from GitHub API
            user_data = github_fetcher.fetch_user_data(owner)
            if not user_data:
                return jsonify({'error': f'User {owner} not found'}), 404
        
        # ::::: Fetch repository data
            repository = github_fetcher.fetch_user_repositories(owner)
            repo_data = next((r for r in repository if r['name'] == repo), None)
        
        if not repo_data:
            return jsonify({'error': f'Repository {owner}/{repo} not found'}), 404
            
            # ::::: Save to database
            db_service.save_repository(repo_data, owner)
            logger.info(f"Saved repository {full_name} to database")
        
        # ::::: Fetch contributors
        contributors = github_fetcher.fetch_repository_contributors(owner, repo)
        
        # ::::: Process data
        processed_data = data_processor.process_repository_data(repo_data)
        processed_data['contributors'] = contributors
        
        return jsonify({
            'status': 'success',
            'data': processed_data
        })
        
    except Exception as e:
        logger.error(f"Error fetching repository data: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze/languages/<username>', methods=['GET'])
def analyze_languages(username):
    """Analyze programming languages used by a GitHub user
    
    Args:
        username (str): GitHub username
        
    Returns:
        JSON with language analysis results
    """
    try:
        logger.info(f"Analyzing languages for user: {username}")
        
        # ::::: Check database for user data
        user_data = github_fetcher.fetch_user_data(username)
        if not user_data:
            return jsonify({'error': f'User {username} not found'}), 404
            
        # :::: Fetch user repositories
        repositories = github_fetcher.fetch_user_repositories(username)
        
        # ::::: Analyze languages
        language_count = {}
        language_stars = {}
        language_repos = {}
        
        for repo in repositories:
            language = repo.get('language')
            if language:
                # ::::: Count repositories
                language_count[language] = language_count.get(language, 0) + 1
                
                # ::::: Count stars 
                stars = repo.get('stargazers_count', 0)
                language_stars[language] = language_stars.get(language, 0) + stars
                
                # ::::: Track repositories 
                if language not in language_repos:
                    language_repos[language] = []
                language_repos[language].append({
                    'name': repo.get('name'),
                    'full_name': repo.get('full_name'),
                    'stars': stars,
                    'url': repo.get('url')
                })
        
        # :::: Sort repositories 
        for language in language_repos:
            language_repos[language].sort(key=lambda x: x.get('stars', 0), reverse=True)
        
        # ::::: Prepare results
        languages = []
        for language, count in language_count.items():
            languages.append({
                'name': language,
                'repository_count': count,
                'star_count': language_stars.get(language, 0),
                'top_repositories': language_repos.get(language, [])[:5]  # ::::: Top 5 repos
            })
        
        # :::: Sort languages by repository count
        languages.sort(key=lambda x: x['repository_count'], reverse=True)
        
        return jsonify({
            'status': 'success',
            'data': {
                'username': username,
                'total_repositories': len(repositories),
                'languages': languages
            }
        })
        
    except Exception as e:
        logger.error(f"Error analyzing languages: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=config.DEBUG)
    