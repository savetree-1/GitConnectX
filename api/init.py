from flask import Blueprint

# Import blueprints from other modules
from api.auth import auth_bp
from api.routes import routes_bp

# Create the main API blueprint
api_bp = Blueprint('api', __name__)

# Register the imported blueprints
api_bp.register_blueprint(auth_bp, url_prefix='/auth')
api_bp.register_blueprint(routes_bp)

# Expose the main blueprint for use in app.py
__all__ = ['api_bp']

import os
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

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

def init_app():
    """Initialize the application"""
    from api.app import app
    
    # Configure app settings
    app.config['JSON_SORT_KEYS'] = False
    
    logger.info("Application initialized")
    return app