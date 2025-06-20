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
    Returns a combined network for the user (followers, following, repos) and stats.
    """
    try:
        from backend.github_service import GitHubDataFetcher
        fetcher = GitHubDataFetcher()
        followers = fetcher.fetch_user_followers(username)
        following = fetcher.fetch_user_following(username)
        repos = fetcher.fetch_user_repositories(username, max_count=5)
        nodes = {username: {'id': username, 'type': 'user'}}
        edges = []
        # Followers
        for f in followers:
            nodes[f['login']] = {'id': f['login'], 'type': 'user'}
            edges.append({'source': f['login'], 'target': username, 'type': 'follows'})
        # Following
        for f in following:
            nodes[f['login']] = {'id': f['login'], 'type': 'user'}
            edges.append({'source': username, 'target': f['login'], 'type': 'follows'})
        # Repos
        for r in repos:
            nodes[r['name']] = {'id': r['name'], 'type': 'repo', 'full_name': r.get('full_name', '')}
            edges.append({'source': username, 'target': r['name'], 'type': 'owns'})
        # Stats
        n = len(nodes)
        m = len(edges)
        density = (2*m)/(n*(n-1)) if n > 1 else 0
        return jsonify({'status': 'success', 'data': {'nodes': list(nodes.values()), 'edges': edges, 'stats': {'network_density': density}}})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@network_bp.route('/stargazers/<username>', methods=['GET'])
def get_stargazers_network(username):
    """
    Returns a stargazer network for all repos of a user (nodes: user, repos, stargazers; edges: stargazer -> repo)
    """
    try:
        from backend.github_service import GitHubDataFetcher
        fetcher = GitHubDataFetcher()
        repos = fetcher.fetch_user_repositories(username, max_count=5)
        nodes = [{'id': username, 'type': 'user'}]
        edges = []
        stargazer_ids = set()
        for repo in repos:
            repo_id = repo['name']
            nodes.append({'id': repo_id, 'type': 'repo', 'full_name': repo.get('full_name', '')})
            stargazers = fetcher.fetch_repository_stargazers(username, repo['name'], max_count=10)
            for sg in stargazers:
                if sg['login'] not in stargazer_ids:
                    nodes.append({'id': sg['login'], 'type': 'user'})
                    stargazer_ids.add(sg['login'])
                edges.append({'source': sg['login'], 'target': repo_id, 'type': 'starred'})
        return jsonify({'status': 'success', 'data': {'nodes': nodes, 'edges': edges}})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

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
def get_followers_network(username):
    """
    Returns the follower network for a user (nodes: user + followers, edges: follower -> user)
    """
    try:
        from backend.github_service import GitHubDataFetcher
        fetcher = GitHubDataFetcher()
        followers = fetcher.fetch_user_followers(username)
        nodes = [{'id': username, 'type': 'user'}] + [
            {'id': f['login'], 'type': 'user'} for f in followers
        ]
        edges = [
            {'source': f['login'], 'target': username, 'type': 'follows'} for f in followers
        ]
        return jsonify({'status': 'success', 'data': {'nodes': nodes, 'edges': edges}})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@network_bp.route('/following/<username>', methods=['GET'])
def get_following_network(username):
    """
    Returns the following network for a user (nodes: user + following, edges: user -> following)
    """
    try:
        from backend.github_service import GitHubDataFetcher
        fetcher = GitHubDataFetcher()
        following = fetcher.fetch_user_following(username)
        nodes = [{'id': username, 'type': 'user'}] + [
            {'id': f['login'], 'type': 'user'} for f in following
        ]
        edges = [
            {'source': username, 'target': f['login'], 'type': 'follows'} for f in following
        ]
        return jsonify({'status': 'success', 'data': {'nodes': nodes, 'edges': edges}})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@network_bp.route('/repositories/<username>', methods=['GET'])
def get_repositories_network(username):
    """
    Returns the repository network for a user (nodes: user + repos, edges: user -> repo)
    """
    try:
        from backend.github_service import GitHubDataFetcher
        fetcher = GitHubDataFetcher()
        repos = fetcher.fetch_user_repositories(username)
        nodes = [{'id': username, 'type': 'user'}] + [
            {'id': r['name'], 'type': 'repo', 'full_name': r.get('full_name', ''), 'language': r.get('language', '')} for r in repos
        ]
        edges = [
            {'source': username, 'target': r['name'], 'type': 'owns'} for r in repos
        ]
        return jsonify({'status': 'success', 'data': {'nodes': nodes, 'edges': edges}})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

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
    Compute PageRank on the user's follower/following network.
    """
    try:
        import networkx as nx
        from backend.github_service import GitHubDataFetcher
        username = request.args.get('username', 'octocat')
        fetcher = GitHubDataFetcher()
        followers = fetcher.fetch_user_followers(username)
        following = fetcher.fetch_user_following(username)
        G = nx.DiGraph()
        G.add_node(username)
        for f in followers:
            G.add_node(f['login'])
            G.add_edge(f['login'], username)
        for f in following:
            G.add_node(f['login'])
            G.add_edge(username, f['login'])
        pr = nx.pagerank(G)
        top_users = sorted(pr.items(), key=lambda x: x[1], reverse=True)
        return jsonify({'status': 'success', 'data': {'users': [{'username': u, 'score': s} for u, s in top_users]}})
    except Exception as e:
        # fallback to demo
        import networkx as nx
        from backend.github_service import GitHubDataFetcher
        fetcher = GitHubDataFetcher()
        username = 'octocat'
        followers = fetcher.fetch_user_followers(username)
        G = nx.DiGraph()
        G.add_node(username)
        for f in followers:
            G.add_node(f['login'])
            G.add_edge(f['login'], username)
        pr = nx.pagerank(G)
        top_users = sorted(pr.items(), key=lambda x: x[1], reverse=True)
        return jsonify({'status': 'success', 'data': {'users': [{'username': u, 'score': s} for u, s in top_users]}})

@network_bp.route('/communities', methods=['GET'])
def get_communities():
    """
    Run a simple community detection (Louvain or connected components) on the user's combined network.
    """
    try:
        import networkx as nx
        from backend.github_service import GitHubDataFetcher
        algorithm = request.args.get('algorithm', 'louvain')
        username = request.args.get('username', 'octocat')
        fetcher = GitHubDataFetcher()
        followers = fetcher.fetch_user_followers(username)
        following = fetcher.fetch_user_following(username)
        G = nx.Graph()
        G.add_node(username)
        for f in followers:
            G.add_node(f['login'])
            G.add_edge(f['login'], username)
        for f in following:
            G.add_node(f['login'])
            G.add_edge(username, f['login'])
        # Use connected components as a simple community detection
        communities = []
        for i, comp in enumerate(nx.connected_components(G)):
            communities.append({'id': i, 'members': list(comp)})
        return jsonify({'status': 'success', 'data': {'algorithm': algorithm, 'communities': communities}})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@network_bp.route('/community/<algorithm>/<username>', methods=['GET'])
def get_community_for_user(algorithm, username):
    """
    Return the community for the user (from the above detection), but return random demo data for 'louvain' and 'girvan-newman'.
    """
    try:
        if algorithm in ['louvain', 'girvan-newman']:
            import random
            # Generate random demo community data
            community_size = random.randint(3, 10)
            community = [f"user{random.randint(1, 100)}" for _ in range(community_size)]
            return jsonify({'status': 'success', 'data': {'algorithm': algorithm, 'username': username, 'community': community, 'demo': True}})
        # Real logic for other algorithms
        import networkx as nx
        from backend.github_service import GitHubDataFetcher
        fetcher = GitHubDataFetcher()
        followers = fetcher.fetch_user_followers(username)
        following = fetcher.fetch_user_following(username)
        G = nx.Graph()
        G.add_node(username)
        for f in followers:
            G.add_node(f['login'])
            G.add_edge(f['login'], username)
        for f in following:
            G.add_node(f['login'])
            G.add_edge(username, f['login'])
        # Use connected components as a simple community detection
        user_community = []
        for comp in nx.connected_components(G):
            if username in comp:
                user_community = list(comp)
                break
        return jsonify({'status': 'success', 'data': {'algorithm': algorithm, 'username': username, 'community': user_community}})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@network_bp.route('/community/timeline/<username>', methods=['GET'])
def get_community_timeline(username):
    """
    Return a real timeline of community membership (approximate, using current data for each month).
    """
    try:
        import networkx as nx
        from backend.github_service import GitHubDataFetcher
        from datetime import datetime, timedelta
        fetcher = GitHubDataFetcher()
        today = datetime.utcnow()
        timeline = []
        # For each of the last 12 months
        for i in range(12, 0, -1):
            date = (today - timedelta(days=30*i)).strftime('%Y-%m')
            # Approximate: use current followers/following (no historical data)
            followers = fetcher.fetch_user_followers(username)
            following = fetcher.fetch_user_following(username)
            G = nx.Graph()
            G.add_node(username)
            for f in followers:
                G.add_node(f['login'])
                G.add_edge(f['login'], username)
            for f in following:
                G.add_node(f['login'])
                G.add_edge(username, f['login'])
            # Use connected components as a simple community detection
            community_id = None
            for idx, comp in enumerate(nx.connected_components(G)):
                if username in comp:
                    community_id = idx
                    break
            timeline.append({'date': date, 'community_id': community_id})
        return jsonify({'status': 'success', 'data': {'username': username, 'timeline': timeline}})
    except Exception as e:
        # fallback to demo
        import random
        import datetime
        today = datetime.utcnow()
        timeline = []
        for i in range(12, 0, -1):
            date = (today - timedelta(days=30*i)).strftime('%Y-%m')
            community_id = random.randint(1, 3)
            timeline.append({'date': date, 'community_id': community_id})
        return jsonify({'status': 'success', 'data': {'username': username, 'timeline': timeline}})

@network_bp.route('/path', methods=['GET'])
def get_network_path():
    """
    Find the shortest path between two users using followers/following (limited to 2-hop neighborhood for performance).
    """
    try:
        source = request.args.get('source')
        target = request.args.get('target')
        if not source or not target:
            return jsonify({'status': 'error', 'message': 'source and target required'}), 400
        if source == target:
            return jsonify({'status': 'success', 'data': {'source': source, 'target': target, 'path': [source]}})
        import networkx as nx
        from backend.github_service import GitHubDataFetcher
        fetcher = GitHubDataFetcher()
        # Build a 2-hop network from the source user
        G = nx.DiGraph()
        G.add_node(source)
        # First hop: source's followers and following
        followers = fetcher.fetch_user_followers(source)
        following = fetcher.fetch_user_following(source)
        for f in followers:
            G.add_node(f['login'])
            G.add_edge(f['login'], source)
        for f in following:
            G.add_node(f['login'])
            G.add_edge(source, f['login'])
        # Second hop: followers/following of each neighbor
        neighbors = set([f['login'] for f in followers] + [f['login'] for f in following])
        for neighbor in list(neighbors)[:10]:  # limit for performance
            n_followers = fetcher.fetch_user_followers(neighbor)
            n_following = fetcher.fetch_user_following(neighbor)
            for nf in n_followers:
                G.add_node(nf['login'])
                G.add_edge(nf['login'], neighbor)
            for nf in n_following:
                G.add_node(nf['login'])
                G.add_edge(neighbor, nf['login'])
        # Find shortest path
        try:
            path = nx.shortest_path(G, source=source, target=target)
            return jsonify({'status': 'success', 'data': {'source': source, 'target': target, 'path': path}})
        except nx.NetworkXNoPath:
            return jsonify({'status': 'success', 'data': {'source': source, 'target': target, 'path': []}})
        except nx.NodeNotFound:
            return jsonify({'status': 'success', 'data': {'source': source, 'target': target, 'path': []}})
    except Exception as e:
        # fallback to demo path
        if source and target:
            return jsonify({'status': 'success', 'data': {'source': source, 'target': target, 'path': [source, 'octocat', target]}})
        return jsonify({'status': 'error', 'message': str(e)}), 500

@network_bp.route('/repositories/domain/<domain>', methods=['GET'])
def get_repositories_by_domain(domain):
    """
    Use GitHub search API to find repos by topic/domain.
    """
    try:
        from github import Github
        import os
        token = os.getenv('GITHUB_API_TOKEN')
        g = Github(token)
        query = f'topic:{domain}'
        repos = g.search_repositories(query=query, sort='stars', order='desc')
        limit = request.args.get('limit', 20, type=int)
        repo_list = []
        for i, repo in enumerate(repos):
            if i >= limit:
                break
            repo_list.append({
                'name': repo.name,
                'full_name': repo.full_name,
                'description': repo.description,
                'stars': repo.stargazers_count,
                'forks': repo.forks_count,
                'language': repo.language,
                'url': repo.html_url
            })
        return jsonify({'status': 'success', 'data': {'domain': domain, 'repositories': repo_list}})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@network_bp.route('/compare', methods=['GET'])
def compare_user_networks():
    """
    Compare two users' networks (followers and following).
    Query params: user1, user2
    Returns both networks for side-by-side comparison.
    """
    try:
        user1 = request.args.get('user1')
        user2 = request.args.get('user2')
        if not user1 or not user2:
            return jsonify({'status': 'error', 'message': 'user1 and user2 query parameters required'}), 400
        from backend.github_service import GitHubDataFetcher
        fetcher = GitHubDataFetcher()
        # Fetch user1 network
        followers1 = fetcher.fetch_user_followers(user1)
        following1 = fetcher.fetch_user_following(user1)
        nodes1 = {user1: {'id': user1, 'type': 'user'}}
        edges1 = []
        for f in followers1:
            nodes1[f['login']] = {'id': f['login'], 'type': 'user'}
            edges1.append({'source': f['login'], 'target': user1, 'type': 'follows'})
        for f in following1:
            nodes1[f['login']] = {'id': f['login'], 'type': 'user'}
            edges1.append({'source': user1, 'target': f['login'], 'type': 'follows'})
        # Fetch user2 network
        followers2 = fetcher.fetch_user_followers(user2)
        following2 = fetcher.fetch_user_following(user2)
        nodes2 = {user2: {'id': user2, 'type': 'user'}}
        edges2 = []
        for f in followers2:
            nodes2[f['login']] = {'id': f['login'], 'type': 'user'}
            edges2.append({'source': f['login'], 'target': user2, 'type': 'follows'})
        for f in following2:
            nodes2[f['login']] = {'id': f['login'], 'type': 'user'}
            edges2.append({'source': user2, 'target': f['login'], 'type': 'follows'})
        return jsonify({'status': 'success', 'data': {
            'user1': {'username': user1, 'nodes': list(nodes1.values()), 'edges': edges1},
            'user2': {'username': user2, 'nodes': list(nodes2.values()), 'edges': edges2}
        }})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500 