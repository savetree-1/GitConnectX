# backend/database.py

import logging
from typing import Any, Dict, List, Optional
import json
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from pymongo import MongoClient
from datetime import datetime

from backend import config

# Setup logging
logger = logging.getLogger(__name__)

# SQLAlchemy setup for PostgreSQL
Base = declarative_base()

class User(Base):
    """User model for storing GitHub user data"""
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    login = Column(String(255), unique=True, nullable=False, index=True)
    github_id = Column(Integer, unique=True, nullable=False)
    name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String(255), nullable=True)
    followers_count = Column(Integer, default=0)
    following_count = Column(Integer, default=0)
    public_repos = Column(Integer, default=0)
    location = Column(String(255), nullable=True)
    company = Column(String(255), nullable=True)
    blog = Column(String(255), nullable=True)
    url = Column(String(255), nullable=True)
    created_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=True)
    last_fetched = Column(DateTime, default=datetime.utcnow)
    
    repositories = relationship('Repository', back_populates='owner')

class Repository(Base):
    """Repository model for storing GitHub repository data"""
    __tablename__ = 'repositories'
    
    id = Column(Integer, primary_key=True)
    github_id = Column(Integer, unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    full_name = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    language = Column(String(100), nullable=True)
    stargazers_count = Column(Integer, default=0)
    forks_count = Column(Integer, default=0)
    watchers_count = Column(Integer, default=0)
    created_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=True)
    url = Column(String(255), nullable=True)
    is_fork = Column(Boolean, default=False)
    owner_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    last_fetched = Column(DateTime, default=datetime.utcnow)
    
    owner = relationship('User', back_populates='repositories')

class DatabaseService:
    """Service for handling database connections and operations"""
    
    def __init__(self):
        """Initialize database connections"""
        try:
            # Initialize PostgreSQL connection
            self.pg_engine = create_engine(config.POSTGRES_URI)
            Base.metadata.create_all(self.pg_engine)
            self.Session = sessionmaker(bind=self.pg_engine)
            
            # Initialize MongoDB connection
            self.mongo_client = MongoClient(config.MONGODB_URI)
            self.mongo_db = self.mongo_client['gitconnectx']
            
            # MongoDB collections
            self.networks_collection = self.mongo_db['networks']
            self.graph_results_collection = self.mongo_db['graph_results']
            
            logger.info("Database connections initialized")
            
        except Exception as e:
            logger.error(f"Error initializing database connections: {str(e)}")
            raise
    
    def close(self):
        """Close database connections"""
        try:
            self.mongo_client.close()
            logger.info("Database connections closed")
        except Exception as e:
            logger.error(f"Error closing database connections: {str(e)}")
    
    # PostgreSQL operations (users and repositories)
    
    def save_user(self, user_data: Dict[str, Any]) -> User:
        """Save or update a user in PostgreSQL
        
        Args:
            user_data: Dictionary with user data
            
        Returns:
            User model instance
        """
        try:
            session = self.Session()
            
            # Check if user already exists
            user = session.query(User).filter_by(login=user_data['login']).first()
            
            if user:
                # Update existing user
                for key, value in user_data.items():
                    if key in ['created_at', 'updated_at'] and value:
                        value = datetime.fromisoformat(value)
                    if hasattr(user, key):
                        setattr(user, key, value)
                user.last_fetched = datetime.utcnow()
            else:
                # Create new user
                user_dict = {}
                for key, value in user_data.items():
                    if key in ['created_at', 'updated_at'] and value:
                        value = datetime.fromisoformat(value)
                    user_dict[key] = value
                user = User(**user_dict)
                session.add(user)
            
            session.commit()
            result = user
            session.close()
            return result
            
        except Exception as e:
            logger.error(f"Error saving user: {str(e)}")
            session.rollback()
            session.close()
            raise
    
    def save_repository(self, repo_data: Dict[str, Any], owner_login: str) -> Repository:
        """Save or update a repository in PostgreSQL
        
        Args:
            repo_data: Dictionary with repository data
            owner_login: GitHub login of the repository owner
            
        Returns:
            Repository model instance
        """
        try:
            session = self.Session()
            
            # Get owner user
            owner = session.query(User).filter_by(login=owner_login).first()
            if not owner:
                session.close()
                raise ValueError(f"Owner user {owner_login} not found")
            
            # Check if repository already exists
            repo = session.query(Repository).filter_by(full_name=repo_data['full_name']).first()
            
            if repo:
                # Update existing repository
                for key, value in repo_data.items():
                    if key in ['created_at', 'updated_at'] and value:
                        value = datetime.fromisoformat(value)
                    if hasattr(repo, key):
                        setattr(repo, key, value)
                repo.last_fetched = datetime.utcnow()
            else:
                # Create new repository
                repo_dict = {}
                for key, value in repo_data.items():
                    if key in ['created_at', 'updated_at'] and value:
                        value = datetime.fromisoformat(value)
                    repo_dict[key] = value
                repo = Repository(**repo_dict, owner_id=owner.id)
                session.add(repo)
            
            session.commit()
            result = repo
            session.close()
            return result
            
        except Exception as e:
            logger.error(f"Error saving repository: {str(e)}")
            session.rollback()
            session.close()
            raise
    
    def get_user(self, login: str) -> Optional[Dict[str, Any]]:
        """Get user data from PostgreSQL
        
        Args:
            login: GitHub login username
            
        Returns:
            Dictionary with user data or None if not found
        """
        try:
            session = self.Session()
            user = session.query(User).filter_by(login=login).first()
            
            if not user:
                session.close()
                return None
            
            # Convert SQLAlchemy model to dictionary
            user_dict = {}
            for column in User.__table__.columns:
                value = getattr(user, column.name)
                if isinstance(value, datetime):
                    value = value.isoformat()
                user_dict[column.name] = value
            
            session.close()
            return user_dict
            
        except Exception as e:
            logger.error(f"Error getting user: {str(e)}")
            session.close()
            return None
    
    def get_repository(self, full_name: str) -> Optional[Dict[str, Any]]:
        """Get repository data from PostgreSQL
        
        Args:
            full_name: Full name of the repository (owner/repo)
            
        Returns:
            Dictionary with repository data or None if not found
        """
        try:
            session = self.Session()
            repo = session.query(Repository).filter_by(full_name=full_name).first()
            
            if not repo:
                session.close()
                return None
            
            # Convert SQLAlchemy model to dictionary
            repo_dict = {}
            for column in Repository.__table__.columns:
                value = getattr(repo, column.name)
                if isinstance(value, datetime):
                    value = value.isoformat()
                repo_dict[column.name] = value
            
            session.close()
            return repo_dict
            
        except Exception as e:
            logger.error(f"Error getting repository: {str(e)}")
            session.close()
            return None
    
    # MongoDB operations (networks and graph results)
    
    def save_network(self, username: str, network_data: Dict[str, Any]) -> str:
        """Save a network to MongoDB
        
        Args:
            username: GitHub username
            network_data: Network data with nodes and edges
            
        Returns:
            MongoDB document ID
        """
        try:
            # Prepare document
            document = {
                'username': username,
                'network_data': network_data,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            
            # Save to MongoDB
            result = self.networks_collection.update_one(
                {'username': username},
                {'$set': document},
                upsert=True
            )
            
            if result.upserted_id:
                return str(result.upserted_id)
            else:
                # Get the existing document ID
                doc = self.networks_collection.find_one({'username': username})
                return str(doc['_id'])
                
        except Exception as e:
            logger.error(f"Error saving network: {str(e)}")
            raise
    
    def get_network(self, username: str) -> Optional[Dict[str, Any]]:
        """Get a network from MongoDB
        
        Args:
            username: GitHub username
            
        Returns:
            Dictionary with network data or None if not found
        """
        try:
            document = self.networks_collection.find_one({'username': username})
            
            if not document:
                return None
                
            # Remove MongoDB _id from result
            if '_id' in document:
                document['_id'] = str(document['_id'])
                
            return document
            
        except Exception as e:
            logger.error(f"Error getting network: {str(e)}")
            return None
    
    def save_graph_result(self, username: str, algorithm: str, result_data: Dict[str, Any]) -> str:
        """Save graph algorithm results to MongoDB
        
        Args:
            username: GitHub username
            algorithm: Algorithm name (e.g., 'pagerank', 'louvain')
            result_data: Algorithm results
            
        Returns:
            MongoDB document ID
        """
        try:
            # Prepare document
            document = {
                'username': username,
                'algorithm': algorithm,
                'result_data': result_data,
                'created_at': datetime.utcnow()
            }
            
            # Save to MongoDB
            result = self.graph_results_collection.insert_one(document)
            return str(result.inserted_id)
                
        except Exception as e:
            logger.error(f"Error saving graph result: {str(e)}")
            raise
    
    def get_graph_result(self, username: str, algorithm: str) -> Optional[Dict[str, Any]]:
        """Get the latest graph algorithm result from MongoDB
        
        Args:
            username: GitHub username
            algorithm: Algorithm name (e.g., 'pagerank', 'louvain')
            
        Returns:
            Dictionary with algorithm results or None if not found
        """
        try:
            document = self.graph_results_collection.find_one(
                {'username': username, 'algorithm': algorithm},
                sort=[('created_at', -1)]
            )
            
            if not document:
                return None
                
            # Remove MongoDB _id from result
            if '_id' in document:
                document['_id'] = str(document['_id'])
                
            return document
            
        except Exception as e:
            logger.error(f"Error getting graph result: {str(e)}")
            return None 