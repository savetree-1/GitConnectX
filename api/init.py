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