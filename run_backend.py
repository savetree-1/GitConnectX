#!/usr/bin/env python3
"""
Main entrypoint for GitConnectX backend
"""

import os
import sys
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def check_environment():
    """Check required environment variables"""
    # Check for required environment variables
    required_vars = [
        'SECRET_KEY',
        'JWT_SECRET_KEY'
    ]

    missing_vars = [var for var in required_vars if not os.environ.get(var)]
    if missing_vars:
        print("ERROR: Missing required environment variables in .env file:", file=sys.stderr)
        for var in missing_vars:
            print(f"  - {var}", file=sys.stderr)
        print("\nPlease create a .env file with the following variables:", file=sys.stderr)
        print("""
    # API Configuration
    SECRET_KEY=your_secret_key
    DEBUG=True

    # Database Configuration (MongoDB)
    MONGODB_URI=mongodb://localhost:27017/gitconnectx

    # JWT Configuration
    JWT_SECRET_KEY=your_jwt_secret
    JWT_ALGORITHM=HS256
    JWT_EXPIRATION_DELTA=86400

    # GitHub OAuth (required for GitHub login)
    GITHUB_CLIENT_ID=your_github_client_id
    GITHUB_CLIENT_SECRET=your_github_client_secret
    GITHUB_REDIRECT_URI=http://localhost:5000/api/auth/github/callback
    GITHUB_API_TOKEN=your_github_personal_access_token
        """, file=sys.stderr)
        sys.exit(1)

def setup_logging():
    """Setup logging configuration"""
    # Ensure logs directory exists
    os.makedirs("logs", exist_ok=True)
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler("logs/gitconnectx.log"),
            logging.StreamHandler()
        ]
    )
    
    return logging.getLogger(__name__)

def check_mongodb(logger):
    """Check if MongoDB is available"""
    try:
        # Check if MongoDB is available but continue if not
        from pymongo import MongoClient
        try:
            # Remove any potential trailing spaces in the URI
            mongodb_uri = os.environ.get("MONGODB_URI", "mongodb://localhost:27017/gitconnectx").strip() 
            client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=2000)
            client.admin.command('ping')
            logger.info("MongoDB connection successful")
            client.close()
            return True
        except Exception as e:
            logger.warning(f"MongoDB connection check failed: {str(e)}")
            print(f"\nWARNING: Could not connect to MongoDB: {str(e)}")
            print("The API will start but some features may not work.")
            print("Make sure MongoDB is running if you need full functionality.\n")
            return False
    except ImportError:
        logger.warning("pymongo not installed, skipping MongoDB check")
        return False

def main():
    """Main function to run the backend"""
    # Add the current directory to the path so we can import modules
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    
    # Check environment variables
    check_environment()
    
    # Setup logging
    logger = setup_logging()
    
    try:
        # Check MongoDB connection
        check_mongodb(logger)
        
        # Import and run the Flask application
        from backend.api.app import app
        
        port = int(os.environ.get("PORT", 5000))
        host = os.environ.get("HOST", "0.0.0.0")
        debug = os.environ.get("DEBUG", "True").lower() == "true"
        
        logger.info(f"Starting GitConnectX backend on {host}:{port} (debug={debug})")
        app.run(host=host, port=port, debug=debug)
        
    except Exception as e:
        logger.error(f"Error starting GitConnectX backend: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 