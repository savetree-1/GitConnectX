"""GitHub OAuth Authentication for GitConnectX"""

import os
import sys
import requests
import secrets
import logging
from flask import request, redirect, session, jsonify, current_app, url_for
from urllib.parse import urlencode
from datetime import datetime, timedelta

# Add project root to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

from backend import config
from backend.api.auth.jwt_auth import generate_token

logger = logging.getLogger(__name__)

# GitHub OAuth URLs
GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize'
GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'
GITHUB_API_URL = 'https://api.github.com'

def get_github_auth_url(frontend_redirect=None):
    """
    Generate GitHub OAuth authorization URL
    
    Args:
        frontend_redirect (str): URL to redirect after authentication
        
    Returns:
        str: Authorization URL
    """
    # Generate state parameter for CSRF protection
    state = secrets.token_hex(16)
    session['oauth_state'] = state
    
    if frontend_redirect:
        session['frontend_redirect'] = frontend_redirect
    
    # Build OAuth parameters
    params = {
        'client_id': config.GITHUB_CLIENT_ID,
        'redirect_uri': config.GITHUB_REDIRECT_URI,
        'scope': 'user repo read:org',
        'state': state,
        'allow_signup': 'true'
    }
    
    auth_url = f"{GITHUB_AUTH_URL}?{urlencode(params)}"
    return auth_url

def exchange_code_for_token(code):
    """
    Exchange OAuth code for GitHub access token
    
    Args:
        code (str): OAuth code from GitHub
        
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
    Get GitHub user data using access token
    
    Args:
        access_token (str): GitHub OAuth access token
        
    Returns:
        dict: User data or None if failed
    """
    headers = {
        'Authorization': f'token {access_token}',
        'Accept': 'application/vnd.github.v3+json'
    }
    
    response = requests.get(f"{GITHUB_API_URL}/user", headers=headers)
    if response.status_code != 200:
        logger.error(f"Failed to get GitHub user. Status: {response.status_code}")
        return None
    
    return response.json()

def handle_oauth_callback(code, state):
    """
    Process GitHub OAuth callback
    
    Args:
        code (str): OAuth code
        state (str): State parameter for CSRF validation
        
    Returns:
        tuple: (user_data, access_token) or (None, None) if failed
    """
    # Verify state parameter
    if 'oauth_state' not in session or state != session['oauth_state']:
        logger.error("OAuth state mismatch")
        return None, None
    
    # Exchange code for token
    token_data = exchange_code_for_token(code)
    
    if 'access_token' not in token_data:
        logger.error(f"Failed to get access token: {token_data.get('error_description')}")
        return None, None
    
    access_token = token_data['access_token']
    
    # Get user data
    user_data = get_github_user(access_token)
    if not user_data:
        return None, None
    
    return user_data, access_token 