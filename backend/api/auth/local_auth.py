"""Local authentication module using email/password"""

import os
import sys
import logging
import bcrypt
from flask import jsonify, request

# Add project root to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

from backend import config
from backend.database_mongo import MongoDBService
from backend.api.auth.jwt_auth import generate_token

logger = logging.getLogger(__name__)

# Initialize database service
db_service = MongoDBService()

def hash_password(password):
    """Hash a password for storage"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def check_password(password, password_hash):
    """Check a password against the stored hash"""
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

def register_user(username, email, password, github_username=None):
    """
    Register a new local user
    
    Args:
        username (str): Username for the new user
        email (str): Email for the new user
        password (str): Password for the new user
        github_username (str): Optional GitHub username to link accounts
        
    Returns:
        dict: Created user data or error message
    """
    try:
        # Check if user already exists
        existing_user = db_service.get_local_user(username=username)
        if existing_user:
            return {'error': 'Username already taken'}, 400
        
        existing_email = db_service.get_local_user(email=email)
        if existing_email:
            return {'error': 'Email already registered'}, 400
        
        # Create new user
        user_data = {
            'username': username,
            'email': email,
            'password_hash': hash_password(password),
            'is_active': True
        }
        
        if github_username:
            user_data['github_username'] = github_username
        
        # Save user to database
        saved_user = db_service.save_local_user(user_data)
        
        # Remove password hash from response
        if saved_user and 'password_hash' in saved_user:
            del saved_user['password_hash']
        
        return {'user': saved_user}, 201
        
    except Exception as e:
        logger.error(f"Error registering user: {str(e)}")
        return {'error': 'Registration failed'}, 500

def login_user(username_or_email, password):
    """
    Authenticate a local user
    
    Args:
        username_or_email (str): Username or email of the user
        password (str): User's password
        
    Returns:
        dict: User data and JWT token or error message
    """
    try:
        # Try to find user by username first
        user = db_service.get_local_user(username=username_or_email)
        
        # If not found, try by email
        if not user:
            user = db_service.get_local_user(email=username_or_email)
        
        if not user:
            return {'error': 'Invalid credentials'}, 401
        
        # Check password
        if not check_password(password, user['password_hash']):
            return {'error': 'Invalid credentials'}, 401
        
        # Remove password hash from response
        if 'password_hash' in user:
            del user['password_hash']
        
        # Generate JWT token
        token = generate_token({
            'id': str(user['_id']),
            'login': user['username'],
            'email': user['email']
        })
        
        return {
            'user': user,
            'token': token
        }, 200
        
    except Exception as e:
        logger.error(f"Error during login: {str(e)}")
        return {'error': 'Login failed'}, 500 