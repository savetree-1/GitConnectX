#!/usr/bin/env python3


import os
import sys
import logging
from backend.api.app import app

# ::::: Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("logs/backend.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

if __name__ == "__main__":
    # ::::: Ensure logs directory exists
    os.makedirs("logs", exist_ok=True)
    
    # ::::: Check for required environment variables
    port = int(os.environ.get("PORT", 5000))
    host = os.environ.get("HOST", "0.0.0.0")
    debug = os.environ.get("DEBUG", "True").lower() == "true"
    
    logger.info(f"Starting GitConnectX backend on {host}:{port} (debug={debug})")
    
    try:
        app.run(host=host, port=port, debug=debug)
    except Exception as e:
        logger.error(f"Error starting server: {e}")
        sys.exit(1) 