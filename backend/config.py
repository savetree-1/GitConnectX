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

# #!/usr/bin/env python3
# """
# config.py - Configuration settings for GitConnectX

# This module contains shared settings, API keys, and constants used throughout
# the application.
# """

# import os
# from typing import Dict, Any, List

# # GitHub API Configuration
# GITHUB_API_URL = "https://api.github.com"
# GITHUB_API_TOKEN = os.environ.get("GITHUB_API_TOKEN", "")
# GITHUB_API_VERSION = "2022-11-28"  # GitHub API version

# # API Request Configuration
# REQUEST_TIMEOUT = 10  # seconds
# MAX_RETRIES = 3
# RETRY_BACKOFF_FACTOR = 1.5
# RATE_LIMIT_PAUSE = 60  # seconds to wait when rate limited

# # Data Storage Configuration - using the existing project structure
# BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# DATASET_DIR = os.path.join(BASE_DIR, "dataset")
# PROCESSED_DATA_DIR = os.path.join(BASE_DIR, "processed_data")
# API_DIR = os.path.join(BASE_DIR, "api")
# DOCS_DIR = os.path.join(BASE_DIR, "docs")

# # Graph Configuration
# DEFAULT_EDGE_WEIGHT = 1.0
# MIN_EDGE_WEIGHT_THRESHOLD = 0.1
# MAX_GRAPH_SIZE = 10000  # Maximum number of nodes to process

# # Algorithm Configuration
# PAGERANK_DAMPING_FACTOR = 0.85
# PAGERANK_ITERATIONS = 100
# PAGERANK_TOLERANCE = 1.0e-6

# # Louvain Community Detection
# LOUVAIN_RESOLUTION = 1.0
# MIN_COMMUNITY_SIZE = 3

# # K-Core Decomposition
# MAX_K_CORE = 20

# # Logging Configuration
# LOG_LEVEL = "INFO"
# LOG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs", "gitconnectx.log")

# # Create necessary directories if they don't exist
# for directory in [DATA_DIR, RAW_DATA_DIR, PROCESSED_DATA_DIR, OUTPUT_DIR, 
#                  os.path.dirname(LOG_FILE)]:
#     if not os.path.exists(directory):
#         os.makedirs(directory)

# # GitHub API Endpoints
# API_ENDPOINTS = {
#     "user": "/users/{username}",
#     "user_repos": "/users/{username}/repos",
#     "repo": "/repos/{owner}/{repo}",
#     "repo_contributors": "/repos/{owner}/{repo}/contributors",
#     "user_followers": "/users/{username}/followers",
#     "user_following": "/users/{username}/following",
#     "repo_commits": "/repos/{owner}/{repo}/commits",
#     "search_users": "/search/users",
#     "search_repos": "/search/repositories"
# }

# # Data Schema Definitions
# USER_FIELDS = [
#     "id", "login", "name", "followers_count", "following_count", 
#     "public_repos", "location", "company", "created_at", "updated_at", "bio"
# ]

# REPOSITORY_FIELDS = [
#     "id", "name", "full_name", "owner_id", "owner_login", "description",
#     "language", "stargazers_count", "forks_count", "created_at", "updated_at", "topics"
# ]

# FOLLOW_EDGE_FIELDS = ["follower_id", "followed_id"]

# COLLABORATION_EDGE_FIELDS = ["user1_id", "user2_id", "repo_id", "weight"]

# # Database Configuration (for future use)
# DB_CONFIG = {
#     "dialect": "sqlite",
#     "database": os.path.join(DATA_DIR, "gitconnectx.db"),
#     "username": "",
#     "password": "",
#     "host": "",
#     "port": ""
# }

# # Web Application Configuration (for future use)
# WEB_CONFIG = {
#     "host": "0.0.0.0",
#     "port": 5000,
#     "debug": True,
#     "secret_key": os.environ.get("SECRET_KEY", "dev_key_change_in_production")
# }

# # Default visualization settings
# VIZ_CONFIG = {
#     "node_size_scale": 10,
#     "edge_width_scale": 2,
#     "color_scheme": "schemeCategory10",
#     "default_layout": "force-directed"
# }

# # Language colors (matching GitHub colors)
# LANGUAGE_COLORS = {
#     "JavaScript": "#f1e05a",
#     "Python": "#3572A5",
#     "Java": "#b07219",
#     "C++": "#f34b7d",
#     "TypeScript": "#2b7489",
#     "C#": "#178600",
#     "PHP": "#4F5D95",
#     "Ruby": "#701516",
#     "Go": "#00ADD8",
#     "Rust": "#dea584",
#     "Swift": "#ffac45",
#     "Kotlin": "#F18E33",
#     "Scala": "#c22d40",
#     "C": "#555555",
#     "Default": "#cccccc"  # For languages not in the list
# }

# def get_language_color(language: str) -> str:
#     """Get color for a programming language, defaulting if not found"""
#     if not language:
#         return LANGUAGE_COLORS["Default"]
#     return LANGUAGE_COLORS.get(language, LANGUAGE_COLORS["Default"])