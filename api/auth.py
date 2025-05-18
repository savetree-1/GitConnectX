from flask import Blueprint, request, redirect, session, url_for, jsonify, current_app
import requests
import os
import json
import secrets
import logging
import sys
from datetime import datetime, timedelta
from urllib.parse import urlencode

# ::::: Add project root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ::::: Import configuration
import config

# ::::: Set up logging
logger = logging.getLogger(__name__)

# ::::::::: Blueprint setup
auth_bp = Blueprint('auth', __name__)

# :::::::::::: GitHub OAuth URLs
GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize'
GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'
GITHUB_API_URL = 'https://api.github.com'

def get_github_auth_url():
    """
    Generate the GitHub OAuth authorization URL
    
    Returns:
        str: The authorization URL
    """
    # ::::: Generate random state parameter
    state = secrets.token_hex(16)
    session['oauth_state'] = state
    
    # ::::: Set session expiry
    session.permanent = True
    current_app.permanent_session_lifetime = timedelta(minutes=10)
    
    # ::::: Prepare parameters for auth
    params = {
        'client_id': config.GITHUB_CLIENT_ID,
        'redirect_uri': config.GITHUB_REDIRECT_URI,
        'scope': 'user repo read:org',  # Permissions needed
        'state': state,
        'allow_signup': 'true'
    }
    
    # ::::: Generate the authorization URL
    auth_url = f"{GITHUB_AUTH_URL}?{urlencode(params)}"
    logger.info(f"Generated GitHub auth URL with state {state[:4]}...")
    
    return auth_url

@auth_bp.route('/login', methods=['GET'])
def login():
    """
    Initiate GitHub OAuth flow
    
    Returns:
        Redirect to GitHub authorization page
    """
    auth_url = get_github_auth_url()
    return redirect(auth_url)

@auth_bp.route('/callback', methods=['GET'])
def callback():
    """
    Handle GitHub OAuth callback
    
    Returns:
        Redirect to frontend with token or error
    """
    # ::::: Get the code and state
    code = request.args.get('code')
    state = request.args.get('state')
    
    # ::::: Error handling
    if not code:
        error_msg = "No code provided by GitHub"
        logger.error(error_msg)
        return redirect(f"{config.FRONTEND_URL}/auth-error?error={error_msg}")
    
    # ::::: Validate state parameter
    if 'oauth_state' not in session or state != session['oauth_state']:
        error_msg = "Invalid state parameter"
        logger.error(error_msg)
        return redirect(f"{config.FRONTEND_URL}/auth-error?error={error_msg}")
    
    # ::::: Clear the state 
    session.pop('oauth_state', None)
    
    try:
        # ::::: Exchange code for access token
        token_data = exchange_code_for_token(code)
        
        if 'access_token' not in token_data:
            error_msg = token_data.get('error_description', 'Failed to obtain access token')
            logger.error(f"GitHub token exchange failed: {error_msg}")
            return redirect(f"{config.FRONTEND_URL}/auth-error?error={error_msg}")
        
        # ::::: Extract access token
        access_token = token_data['access_token']
        
        # ::::: Get user data 
        user_data = get_github_user(access_token)
        
        if not user_data or 'login' not in user_data:
            error_msg = "Failed to fetch user data from GitHub"
            logger.error(error_msg)
            return redirect(f"{config.FRONTEND_URL}/auth-error?error={error_msg}")
        
        # ::::: Store user data
        session['github_token'] = access_token
        session['username'] = user_data['login']
        session['user_id'] = user_data['id']
        session['avatar_url'] = user_data['avatar_url']
        session['auth_time'] = datetime.now().isoformat()
        
        # ::::: Set session expiry
        session.permanent = True
        current_app.permanent_session_lifetime = timedelta(days=7)  # ::::: valid for 7 days
        
        logger.info(f"User {user_data['login']} successfully authenticated")
        
        # ::::: Redirect to frontend
        return redirect(f"{config.FRONTEND_URL}/dashboard?auth=success")
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error during authentication: {error_msg}")
        return redirect(f"{config.FRONTEND_URL}/auth-error?error={error_msg}")

def exchange_code_for_token(code):
    """
    Exchange OAuth code for access token
    
    Args:
        code (str): The OAuth code from GitHub
        
    Returns:
        dict: Token response data
    """
    headers = {
        'Accept': 'application/json'
    }
    
    data = {
        'client_id': config.GITHUB_CLIENT_ID,
        'client_secret': config.GITHUB_CLIENT_SECRET,
        'code': code,
        'redirect_uri': config.GITHUB_REDIRECT_URI
    }
    
    response = requests.post(GITHUB_TOKEN_URL, headers=headers, data=data)
    return response.json()

def get_github_user(access_token):
    """
    Get GitHub user data using the access token
    
    Args:
        access_token (str): GitHub OAuth access token
        
    Returns:
        dict: User data from GitHub API
    """
    headers = {
        'Authorization': f'token {access_token}',
        'Accept': 'application/vnd.github.v3+json'
    }
    
    response = requests.get(f"{GITHUB_API_URL}/user", headers=headers)
    return response.json() if response.status_code == 200 else None

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """
    Log out the user by clearing their session
    
    Returns:
        JSON response indicating logout status
    """
    username = session.get('username')
    
    # ::::: Clear session data
    session.clear()
    
    if username:
        logger.info(f"User {username} logged out")
    
    return jsonify({
        'status': 'success',
        'message': 'Logged out successfully'
    })

@auth_bp.route('/user', methods=['GET'])
def get_user():
    """
    Get the currently authenticated user's information
    
    Returns:
        JSON with user data or error message
    """
    if 'username' not in session or 'github_token' not in session:
        return jsonify({
            'authenticated': False,
            'message': 'Not authenticated'
        }), 401
    
    return jsonify({
        'authenticated': True,
        'user': {
            'username': session['username'],
            'id': session['user_id'],
            'avatar_url': session['avatar_url'],
            'auth_time': session['auth_time']
        }
    })

@auth_bp.route('/refresh', methods=['POST'])
def refresh_token():
    """
    Refresh user data if token is still valid
    
    Returns:
        JSON with refreshed user data or error
    """
    if 'github_token' not in session:
        return jsonify({
            'status': 'error',
            'message': 'No active session'
        }), 401
    
    try:
        # :::: current access token
        user_data = get_github_user(session['github_token'])
        
        if not user_data or 'login' not in user_data:
            # ::::: Token expired or invalid
            session.clear()
            return jsonify({
                'status': 'error',
                'message': 'Session expired'
            }), 401
        
        # ::::: Update with new user data
        session['username'] = user_data['login']
        session['avatar_url'] = user_data['avatar_url']
        session['auth_time'] = datetime.now().isoformat()
        
        # ::::: extend session expiry
        session.permanent = True
        current_app.permanent_session_lifetime = timedelta(days=7)
        
        logger.info(f"Session refreshed for user {user_data['login']}")
        
        return jsonify({
            'status': 'success',
            'user': {
                'username': user_data['login'],
                'id': user_data['id'],
                'avatar_url': user_data['avatar_url'],
                'auth_time': session['auth_time']
            }
        })
        
    except Exception as e:
        logger.error(f"Error refreshing session: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

# ::::: Decorator for authentication 
def require_auth(f):
    """
    Decorator to require authentication for routes
    
    Usage:
        @app.route('/protected')
        @require_auth
        def protected_route():
            # This will only execute if user is authenticated
            return jsonify({'message': 'This is a protected route'})
    """
    from functools import wraps
    
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'github_token' not in session or 'username' not in session:
            return jsonify({
                'status': 'error',
                'message': 'Authentication required'
            }), 401
        return f(*args, **kwargs)
    
    return decorated_function

@auth_bp.route('/status', methods=['GET'])
def auth_status():
    """
    Check authentication status
    
    Returns:
        JSON with authentication status
    """
    is_authenticated = 'github_token' in session and 'username' in session
    
    return jsonify({
        'authenticated': is_authenticated,
        'user': {
            'username': session.get('username'),
            'avatar_url': session.get('avatar_url')
        } if is_authenticated else None
    })