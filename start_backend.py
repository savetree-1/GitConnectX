#!/usr/bin/env python3
"""
Simple script to start the GitConnectX backend
"""

import os
import sys
import subprocess

# Set environment variables properly 
os.environ["SECRET_KEY"] = "test_secret_key"
os.environ["MONGODB_URI"] = "mongodb://localhost:27017/gitconnectx"  # Note: no trailing space
os.environ["JWT_SECRET_KEY"] = "test_jwt_secret"

# If GitHub token is provided as command line argument, use it
if len(sys.argv) > 1:
    os.environ["GITHUB_API_TOKEN"] = sys.argv[1]

# Run the backend
print("Starting GitConnectX backend...")
print("MongoDB URI:", os.environ["MONGODB_URI"])

try:
    # Execute run_backend.py
    from run_backend import main
    
    if __name__ == "__main__":
        # Check if main function exists in run_backend.py
        if callable(main):
            main()
        else:
            # If no main function, just execute the file
            exec(open("run_backend.py").read())
except ImportError:
    # If import fails, use subprocess
    subprocess.run([sys.executable, "run_backend.py"]) 