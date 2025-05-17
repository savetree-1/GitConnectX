"""JWT Authentication module for GitConnectX"""

import jwt
import logging
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, current_app
import os
import sys

# Add project root to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

from backend import config

logger = logging.getLogger(__name__)

def generate_token(user_data):
    """
    Generate JWT token for authenticated user
    
    Args:
        user_data (dict): User information to encode in token
        
    Returns:
        str: JWT token
    """
    payload = {
        'user_id': user_data['id'],
        'username': user_data['login'],
        'exp': datetime.utcnow() + timedelta(seconds=config.JWT_EXPIRATION_DELTA)
    }
    
    token = jwt.encode(payload, config.JWT_SECRET_KEY, algorithm=config.JWT_ALGORITHM)
    return token

def decode_token(token):
    """
    Decode and validate JWT token
    
    Args:
        token (str): JWT token to decode
        
    Returns:
        dict: Decoded token payload or None if invalid
    """
    try:
        payload = jwt.decode(token, config.JWT_SECRET_KEY, algorithms=[config.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token expired")
        return None
    except jwt.InvalidTokenError:
        logger.warning("Invalid token")
        return None

def token_required(f):
    """
    Decorator to protect routes with JWT authentication
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from header
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'error': 'Authentication token is missing'}), 401
        
        # Validate token
        payload = decode_token(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Add decoded token to request context
        request.user = payload
        
        return f(*args, **kwargs)
    
    return decorated 