#!/usr/bin/env python3
"""
Simple script to directly run the GitConnectX API
"""

import os
import sys
import logging
from dotenv import load_dotenv
import json

# Ensure logs directory exists
os.makedirs("logs", exist_ok=True)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("logs/app_launcher.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

def set_environment():
    """Set environment variables"""
    # Load .env file if exists
    load_dotenv()
    
    # Set default environment variables if not already set
    defaults = {
        "SECRET_KEY": "test_secret_key",
        "JWT_SECRET_KEY": "test_jwt_secret",
        "MONGODB_URI": "mongodb://localhost:27017/gitconnectx",
        "DEBUG": "True",
    }
    
    for key, value in defaults.items():
        if not os.environ.get(key):
            os.environ[key] = value
            logger.info(f"Setting default {key}")
    
    # Strip any trailing spaces from MONGODB_URI
    if os.environ.get("MONGODB_URI"):
        os.environ["MONGODB_URI"] = os.environ["MONGODB_URI"].strip()
        logger.info(f"Using MongoDB URI: {os.environ['MONGODB_URI']}")
    
    # Set GitHub token from command line if provided
    if len(sys.argv) > 1:
        os.environ["GITHUB_API_TOKEN"] = sys.argv[1]
        logger.info("GitHub API token set from command line")

def run_app():
    """Run the Flask application directly"""
    logger.info("Starting GitConnectX API...")
    
    # Add current directory to path
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    
    try:
        # First check if MongoDB is working
        try:
            from pymongo import MongoClient
            mongodb_uri = os.environ.get("MONGODB_URI", "mongodb://localhost:27017/gitconnectx").strip()
            # Set a short timeout to avoid hanging
            client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=2000)
            # Test if MongoDB is running by issuing a command
            client.admin.command('ping')
            logger.info("MongoDB connection check successful")
            client.close()
        except Exception as mongo_error:
            logger.warning(f"MongoDB connection failed: {str(mongo_error)}")
            logger.warning("Starting API in fallback mode - some features will be limited")
            print(f"\nWARNING: Could not connect to MongoDB: {str(mongo_error)}")
            print("The API will start in fallback mode - some features will be limited.")
            # Set environment variable to enable fallback mode
            os.environ["MONGODB_FALLBACK"] = "true"
        
        # Import and run the app directly
        from backend.api.app import app
        
        host = os.environ.get("HOST", "0.0.0.0")
        port = int(os.environ.get("PORT", 5000))
        debug = os.environ.get("DEBUG", "True").lower() == "true"
        
        print(f"\n========================================")
        print(f"🚀 GitConnectX API is running!")
        print(f"📌 URL: http://{host}:{port}")
        print(f"📊 MongoDB: {os.environ.get('MONGODB_URI')}")
        print(f"🔑 GitHub API: {'Configured' if os.environ.get('GITHUB_API_TOKEN') else 'Not configured'}")
        print(f"========================================\n")
        
        app.run(host=host, port=port, debug=debug)
    except ImportError as e:
        logger.error(f"Error importing Flask application: {str(e)}")
        print(f"Error: {str(e)}")
        print("Make sure you're running this script from the project root directory.")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Error starting application: {str(e)}")
        print(f"Error: {str(e)}")
        if "An existing index has the same name" in str(e):
            print(f"\nTry dropping your MongoDB database with these steps:")
            print("1. Start MongoDB shell: mongo")
            print("2. Drop database: use gitconnectx; db.dropDatabase();")
            print("3. Try running the app again")
        sys.exit(1)

if __name__ == "__main__":
    set_environment()
    run_app() 