"""Authentication module for GitConnectX API"""

from flask import Blueprint, request, jsonify, redirect, session, current_app
from datetime import datetime
import logging

from backend.api.auth.github_auth import get_github_auth_url, handle_oauth_callback
from backend.api.auth.jwt_auth import generate_token, decode_token, token_required
from backend.api.auth.local_auth import register_user, login_user
from backend import config

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
logger = logging.getLogger(__name__)

@auth_bp.route('/github/login', methods=['GET'])
def github_login():
    """
    Initiate GitHub OAuth login flow
    """
    # Get return URL from query params
    redirect_url = request.args.get('redirect_uri')
    
    # Generate GitHub authorization URL
    auth_url = get_github_auth_url(frontend_redirect=redirect_url)
    
    # Redirect to GitHub
    return redirect(auth_url)

@auth_bp.route('/github/callback', methods=['GET'])
def github_callback():
    """
    Handle GitHub OAuth callback
    """
    # Get code and state from GitHub
    code = request.args.get('code')
    state = request.args.get('state')
    
    if not code:
        return redirect(f"{config.FRONTEND_URL}/auth-error?error=No code provided")
    
    # Process OAuth callback
    user_data, github_token = handle_oauth_callback(code, state)
    
    if not user_data:
        return redirect(f"{config.FRONTEND_URL}/auth-error?error=Authentication failed")
    
    # Generate JWT token
    jwt_token = generate_token(user_data)
    
    # Get frontend redirect URL
    redirect_url = session.get('frontend_redirect', f"{config.FRONTEND_URL}/dashboard")
    
    # Clean up session
    session.pop('oauth_state', None)
    session.pop('frontend_redirect', None)
    
    # Append token to redirect URL
    separator = '?' if '?' not in redirect_url else '&'
    redirect_with_token = f"{redirect_url}{separator}token={jwt_token}"
    
    # Redirect to frontend with token
    return redirect(redirect_with_token)

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new local user
    """
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['username', 'email', 'password']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Extract fields
    username = data['username']
    email = data['email']
    password = data['password']
    github_username = data.get('github_username')
    
    # Register the user
    result, status_code = register_user(username, email, password, github_username)
    
    return jsonify(result), status_code

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Authenticate a local user
    """
    data = request.get_json()
    
    # Validate required fields
    if not data or 'username_or_email' not in data or 'password' not in data:
        return jsonify({'error': 'Missing credentials'}), 400
    
    # Extract fields
    username_or_email = data['username_or_email']
    password = data['password']
    
    # Authenticate the user
    result, status_code = login_user(username_or_email, password)
    
    return jsonify(result), status_code

@auth_bp.route('/status', methods=['GET'])
@token_required
def auth_status():
    """
    Check authentication status - requires valid token
    """
    return jsonify({
        'status': 'authenticated',
        'user': {
            'username': request.user['username'],
            'user_id': request.user['user_id']
        }
    })

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """
    Logout endpoint - for frontend use only
    JWT tokens can't be invalidated, but we can clear frontend storage
    """
    return jsonify({
        'status': 'success',
        'message': 'Logged out successfully'
    }) 