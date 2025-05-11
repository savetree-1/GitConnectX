import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# GitHub API Configuration
GITHUB_ACCESS_TOKEN = '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'
GITHUB_API_BASE_URL = "https://api.github.com"
API_REQUEST_DELAY = 1.0  # seconds between requests to avoid rate limiting

# Data Collection Parameters
MAX_FOLLOWERS_TO_FETCH = 500
MAX_FOLLOWING_TO_FETCH = 500
MAX_REPOS_TO_FETCH = 100
MAX_CONTRIBUTORS_TO_FETCH = 100
MAX_STARGAZERS_TO_FETCH = 100

# File Paths
DATA_DIR = "./data"
PROCESSED_DATA_DIR = "./processed_data"
LOG_DIR = "./logs"

# Graph Analysis Parameters
PAGERANK_DAMPING = 0.85
PAGERANK_MAX_ITERATIONS = 100
PAGERANK_TOLERANCE = 1e-6

# Ensure directories exist
for directory in [DATA_DIR, PROCESSED_DATA_DIR, LOG_DIR]:
    os.makedirs(directory, exist_ok=True)
