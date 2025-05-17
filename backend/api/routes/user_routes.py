"""User routes for GitConnectX API"""

from flask import Blueprint, request, jsonify
import logging
from backend.api.controllers.network_controller import NetworkController
from backend.github_service import GitHubDataFetcher

user_bp = Blueprint('user', __name__, url_prefix='/api/user')
logger = logging.getLogger(__name__)

@user_bp.route('/<username>', methods=['GET'])
def get_user_data(username):
    """
    Get GitHub user data
    
    Args:
        username (str): GitHub username
    
    Returns:
        JSON with user data or error message
    """
    try:
        logger.info(f"Fetching user data for: {username}")
        
        # Initialize GitHub fetcher
        github_fetcher = GitHubDataFetcher()
        controller = NetworkController()
        
        # Try to fetch from GitHub API
        user_data = github_fetcher.fetch_user_data(username)
        
        if not user_data:
            logger.error(f"User {username} not found on GitHub")
            return jsonify({'error': f'User {username} not found'}), 404
        
        # Save to database if successful
        controller.db.save_github_user(user_data)
        
        # Format the response
        formatted_data = {
            'name': user_data.get('name', username),
            'login': user_data.get('login', username),
            'avatar_url': user_data.get('avatar_url', ''),
            'public_repos': user_data.get('public_repos', 0),
            'followers_count': user_data.get('followers', 0),
            'following_count': user_data.get('following', 0),
            'stargazers_count': user_data.get('public_gists', 0) * 5,  # Estimated from gists
            'forks_count': user_data.get('public_repos', 0) // 2  # Estimated as half of repos
        }
        
        controller.close()
        
        return jsonify({
            'status': 'success',
            'data': formatted_data
        })
        
    except Exception as e:
        logger.error(f"Error fetching user data: {str(e)}")
        return jsonify({'error': str(e)}), 500 