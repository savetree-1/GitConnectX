"""MongoDB database service for GitConnectX"""

import logging
from pymongo import MongoClient
from datetime import datetime
import os
import sys

# ::::: Add project root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend import config

logger = logging.getLogger(__name__)

class MongoDBService:
    # ::::: MongoDB connection
    
    def __init__(self):
        # ::::: Initialize MongoDB connection
        try:
            # ::::: MongoDB connection string
            mongodb_uri = config.MONGODB_URI.strip() if config.MONGODB_URI else "mongodb://localhost:27017/gitconnectx"
            
            self.client = MongoClient(mongodb_uri)
            self.db = self.client['gitconnectx']
            
            # ::::: Create collections
            self.local_users = self.db['local_users']
            self.github_users = self.db['github_users']
            self.github_repos = self.db['github_repos']
            self.follows = self.db['follows']
            self.contributions = self.db['contributions']
            self.stargazing = self.db['stargazing'] 
            
            # ::::: Drop existing indexes
            try:
                # ::::: Try to drop existing indexes
                self.github_users.drop_index("github_id_1")
                self.github_repos.drop_index("github_id_1")
                logger.info("Dropped existing indexes to avoid conflicts")
            except Exception as e:
                # ::::: Ignore errors 
                logger.debug(f"No indexes to drop or error dropping: {str(e)}")
            
            # ::::: Create indexes with explicit names
            self.local_users.create_index("username", unique=True, name="username_unique")
            self.local_users.create_index("email", unique=True, name="email_unique")
            self.github_users.create_index("login", unique=True, name="login_unique")
            self.github_users.create_index("github_id", unique=True, sparse=True, name="github_id_sparse_unique")
            self.github_repos.create_index("full_name", unique=True, name="full_name_unique")
            self.github_repos.create_index("github_id", unique=True, sparse=True, name="github_id_repo_sparse_unique")
            
            logger.info("MongoDB connection initialized")
        except Exception as e:
            logger.error(f"Error initializing MongoDB: {str(e)}")
            raise
    
    def close(self):
        """Close MongoDB connection"""
        self.client.close()
    
    # ::::: User methods
    
    def save_local_user(self, user_data):
        # ::::: Save or update local user
        try:
            # ::::: Add timestamps
            now = datetime.utcnow()
            if '_id' not in user_data:
                user_data['created_at'] = now
            user_data['updated_at'] = now
            
            # :::::Insert or update
            result = self.local_users.update_one(
                {"username": user_data['username']},
                {"$set": user_data},
                upsert=True
            )
            
            # ::::: Get the updated document
            saved_user = self.local_users.find_one({"username": user_data['username']})
            return saved_user
        except Exception as e:
            logger.error(f"Error saving local user: {str(e)}")
            raise
    
    def get_local_user(self, username=None, email=None):
        # ::::: Get local user by username or email
        try:
            if username:
                return self.local_users.find_one({"username": username})
            elif email:
                return self.local_users.find_one({"email": email})
            return None
        except Exception as e:
            logger.error(f"Error getting local user: {str(e)}")
            return None
    
    # ::::: GitHub user methods
    
    def save_github_user(self, user_data):
        # 
        try:
            # ::::: ensure login exists
            now = datetime.utcnow()
            if 'login' not in user_data:
                raise ValueError("GitHub user must have a login")
            
            # ::::: ensure github id exists 
            if 'github_id' not in user_data and 'id' in user_data:
                user_data['github_id'] = user_data['id']
            
            # ::::: skip if id is missing
            if not user_data.get('github_id'):
                logger.warning(f"Skipping user with missing github_id: {user_data.get('login')}")
                return None
                
            user_data['fetched_at'] = now
            
            # ::::: Insert or update
            result = self.github_users.update_one(
                {"login": user_data['login']},
                {"$set": user_data},
                upsert=True
            )
            
            # ::::: Get the updated document
            saved_user = self.github_users.find_one({"login": user_data['login']})
            return saved_user
        except Exception as e:
            logger.error(f"Error saving GitHub user: {str(e)}")
            raise
    
    def get_github_user(self, login):
        # ::::: Get GitHub user by login
        try:
            return self.github_users.find_one({"login": login})
        except Exception as e:
            logger.error(f"Error getting GitHub user: {str(e)}")
            return None
    
    # ::::: Repository methods
    
    def save_github_repo(self, repo_data):
        # ::::: Save or update GitHub repository
        try:
            # ::::: ensure full_name exists
            now = datetime.utcnow()
            if 'full_name' not in repo_data:
                raise ValueError("GitHub repo must have a full_name")
            
            # ::::: Ensure github_id exists
            if 'github_id' not in repo_data and 'id' in repo_data:
                repo_data['github_id'] = repo_data['id']
            
            repo_data['fetched_at'] = now
            
            # ::::: Insert or update
            result = self.github_repos.update_one(
                {"full_name": repo_data['full_name']},
                {"$set": repo_data},
                upsert=True
            )
            
            # ::::: Get the updated document
            saved_repo = self.github_repos.find_one({"full_name": repo_data['full_name']})
            return saved_repo
        except Exception as e:
            logger.error(f"Error saving GitHub repo: {str(e)}")
            raise
    
    def get_github_repo(self, full_name):
        # ::::: Get GitHub repository by full name
        try:
            return self.github_repos.find_one({"full_name": full_name})
        except Exception as e:
            logger.error(f"Error getting GitHub repo: {str(e)}")
            return None
    
    # ::::: Relationship methods
    
    def save_follow_relationship(self, follower, followed):
        # ::::: Save follow relationship between GitHub users
        try:
            now = datetime.utcnow()
            result = self.follows.update_one(
                {"follower": follower, "followed": followed},
                {"$set": {"created_at": now}},
                upsert=True
            )
            return True
        except Exception as e:
            logger.error(f"Error saving follow relationship: {str(e)}")
            return False
    
    def save_stargazer_relationship(self, user_login, repo_full_name):
        # ::::: Save stargazer relationship between GitHub user and repository
        try:
            now = datetime.utcnow()
            result = self.stargazing.update_one(
                {"user": user_login, "repository": repo_full_name},
                {"$set": {"created_at": now}},
                upsert=True
            )
            return True
        except Exception as e:
            logger.error(f"Error saving stargazer relationship: {str(e)}")
            return False
    
    def get_followers(self, login):
        # ::::: Get followers of a GitHub user
        try:
            cursor = self.follows.find({"followed": login})
            return [doc["follower"] for doc in cursor]
        except Exception as e:
            logger.error(f"Error getting followers: {str(e)}")
            return []
    
    def get_following(self, login):
        # ::::: Get users followed by a GitHub user
        try:
            cursor = self.follows.find({"follower": login})
            return [doc["followed"] for doc in cursor]
        except Exception as e:
            logger.error(f"Error getting following: {str(e)}")
            return []
    
    def save_contribution(self, user_login, repo_full_name, commits_count=1):
        # ::::: Save contribution of a GitHub user to a repository
        try:
            now = datetime.utcnow()
            result = self.contributions.update_one(
                {"user_login": user_login, "repo_full_name": repo_full_name},
                {"$set": {"commits_count": commits_count, "updated_at": now}},
                upsert=True
            )
            return True
        except Exception as e:
            logger.error(f"Error saving contribution: {str(e)}")
            return False
    
    def get_user_repos(self, login):
        # ::::: Get repositories owned by a GitHub user
        try:
            return list(self.github_repos.find({"owner_login": login}))
        except Exception as e:
            logger.error(f"Error getting user repos: {str(e)}")
            return []
    
    def get_repo_contributors(self, repo_full_name):
        # ::::: Get contributors to a GitHub repository
        try:
            cursor = self.contributions.find({"repo_full_name": repo_full_name})
            return [doc["user_login"] for doc in cursor]
        except Exception as e:
            logger.error(f"Error getting repo contributors: {str(e)}")
            return []
    
    def get_user_contributed_repos(self, login):
        # ::::: Get repositories contributed to by a GitHub user
        try:
            cursor = self.contributions.find({"user_login": login})
            return [doc["repo_full_name"] for doc in cursor]
        except Exception as e:
            logger.error(f"Error getting user contributed repos: {str(e)}")
            return [] 