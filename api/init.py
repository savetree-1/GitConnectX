from flask import Blueprint

# ::::: Import blueprints
from api.auth import auth_bp
from api.routes import routes_bp

# ::::: Create main API blueprint
api_bp = Blueprint('api', __name__)

# ::::: Register blueprints
api_bp.register_blueprint(auth_bp, url_prefix='/auth')
api_bp.register_blueprint(routes_bp)

# ::::: Route for GitHub OAuth login
__all__ = ['api_bp']

import os
import logging
from dotenv import load_dotenv

# ::::: Initialize environment variables
load_dotenv()

# ::::: Set up logging
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
    
    # ::::: Configure app settings
    app.config['JSON_SORT_KEYS'] = False
    
    logger.info("Application initialized")
    return app