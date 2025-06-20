"""Main Flask application for GitConnectX backend"""

from flask import Flask, jsonify
from flask_cors import CORS
import logging
from datetime import datetime
import os
import sys
import json
from bson import ObjectId

# Add project root to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Import configuration
from backend import config

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("logs/api.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Custom JSON encoder to handle MongoDB ObjectId
class MongoJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

# Check for required GitHub API token
if not config.GITHUB_API_TOKEN:
    logger.warning("GitHub API token is not set. GitHub API operations will be limited.")

# Keep fallback service for when MongoDB fails
class DummyDBService:
    def __init__(self):
        self.client = None
        logger.warning("Using dummy DB service instead of MongoDB")
    
    def close(self):
        pass
    
    # Add basic methods to simulate MongoDB service
    def get_github_user(self, login):
        return None
        
    def get_followers(self, login):
        return []
        
    def get_following(self, login):
        return []
        
    def get_user_repos(self, login):
        return []
        
    def save_github_user(self, user_data):
        return user_data
        
    def save_github_repo(self, repo_data):
        return repo_data
        
    def save_follow_relationship(self, follower, followed):
        return True
        
    def save_contribution(self, user_login, repo_full_name, commits_count=1):
        return True
        
    def save_stargazer_relationship(self, user_login, repo_full_name):
        return True

# Initialize MongoDB service with fallback
db = None
try:
    # Check if we should use fallback mode
    if os.environ.get("MONGODB_FALLBACK") == "true":
        logger.warning("Starting in MongoDB fallback mode (as configured)")
        db = DummyDBService()
    else:
        # Import here to avoid errors if pymongo is not installed
        from backend.database_mongo import MongoDBService
        db = MongoDBService()
        logger.info("Successfully connected to MongoDB")
except Exception as e:
    logger.error(f"Failed to connect to MongoDB: {str(e)}")
    logger.warning("Falling back to dummy DB service")
    db = DummyDBService()

# Conditionally import blueprints based on available services
try:
    from backend.api.auth import auth_bp
    from backend.api.routes.network_routes import network_bp
    from backend.api.routes.user_routes import user_bp, recommendations_bp
    
    # Create Flask app
    app = Flask(__name__)
    app.secret_key = config.SECRET_KEY
    app.config['JSON_SORT_KEYS'] = False
    app.json_encoder = MongoJSONEncoder  # Use custom JSON encoder
    
    # Enable CORS
    CORS(app, supports_credentials=True)
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(network_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(recommendations_bp)
except Exception as e:
    logger.error(f"Error setting up blueprints: {str(e)}")
    # Create minimal Flask app if blueprints fail
    app = Flask(__name__)
    app.secret_key = config.SECRET_KEY
    app.config['JSON_SORT_KEYS'] = False
    app.json_encoder = MongoJSONEncoder  # Use custom JSON encoder
    CORS(app, supports_credentials=True)

# Root endpoint
@app.route('/', methods=['GET'])
def root():
    """Root endpoint"""
    db_status = "MongoDB Connected" if not isinstance(db, DummyDBService) else "MongoDB Disconnected (using fallback)"
    github_status = "Available" if config.GITHUB_API_TOKEN else "Not configured (set GITHUB_API_TOKEN)"
    
    return jsonify({
        'name': 'GitConnectX API',
        'version': config.API_VERSION,
        'status': 'online',
        'timestamp': datetime.now().isoformat(),
        'database': db_status,
        'github_api': github_status
    })

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    db_status = "connected"
    try:
        if not isinstance(db, DummyDBService):
            # Try to ping MongoDB
            db.client.admin.command('ping')
        else:
            db_status = "disconnected (using fallback)"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'database': db_status,
        'github_api': bool(config.GITHUB_API_TOKEN)
    })

# Error handlers
@app.errorhandler(404)
def not_found(error):
    """404 error handler"""
    return jsonify({
        'error': 'Not found',
        'status_code': 404
    }), 404

@app.errorhandler(500)
def server_error(error):
    """500 error handler"""
    logger.error(f"Server error: {str(error)}")
    return jsonify({
        'error': 'Internal server error',
        'status_code': 500
    }), 500

@app.teardown_appcontext
def close_db_connection(error):
    """Close database connection when app context ends"""
    if db:
        db.close()

if __name__ == '__main__':
    # Ensure log directory exists
    os.makedirs('logs', exist_ok=True)
    
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '0.0.0.0')
    debug = config.DEBUG
    
    logger.info(f"Starting GitConnectX API on {host}:{port} (debug={debug})")
    app.run(host=host, port=port, debug=debug) 