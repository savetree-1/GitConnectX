"""Network models for GitConnectX"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Float, ForeignKey, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

# Many-to-many relationship tables
user_follows = Table(
    'user_follows',
    Base.metadata,
    Column('follower_id', Integer, ForeignKey('github_users.id'), primary_key=True),
    Column('followed_id', Integer, ForeignKey('github_users.id'), primary_key=True),
    Column('created_at', DateTime, default=datetime.utcnow)
)

repo_contributors = Table(
    'repo_contributors',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('github_users.id'), primary_key=True),
    Column('repo_id', Integer, ForeignKey('github_repos.id'), primary_key=True),
    Column('commits_count', Integer, default=0),
    Column('created_at', DateTime, default=datetime.utcnow)
)

class GitHubUser(Base):
    """GitHub user model"""
    __tablename__ = 'github_users'
    
    id = Column(Integer, primary_key=True)
    github_id = Column(Integer, unique=True, nullable=False)
    login = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=True)
    avatar_url = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    company = Column(String(255), nullable=True)
    blog = Column(String(255), nullable=True)
    followers_count = Column(Integer, default=0)
    following_count = Column(Integer, default=0)
    public_repos_count = Column(Integer, default=0)
    created_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=True)
    fetched_at = Column(DateTime, default=datetime.utcnow)
    
    # PageRank score
    pagerank_score = Column(Float, default=0.0)
    
    # Authority score (HITS)
    authority_score = Column(Float, default=0.0)
    
    # Hub score (HITS)
    hub_score = Column(Float, default=0.0)
    
    # Community identifier (from Louvain algorithm)
    community_id = Column(Integer, nullable=True)
    
    # Relationships
    followers = relationship(
        'GitHubUser',
        secondary=user_follows,
        primaryjoin=(id == user_follows.c.followed_id),
        secondaryjoin=(id == user_follows.c.follower_id),
        backref='following'
    )
    
    repositories = relationship('GitHubRepo', backref='owner')
    
    contributed_repos = relationship(
        'GitHubRepo',
        secondary=repo_contributors,
        backref='contributors'
    )
    
    def to_dict(self, include_metrics=True):
        """Convert user to dictionary"""
        result = {
            'id': self.id,
            'github_id': self.github_id,
            'login': self.login,
            'name': self.name,
            'avatar_url': self.avatar_url,
            'bio': self.bio,
            'location': self.location,
            'company': self.company,
            'blog': self.blog,
            'followers_count': self.followers_count,
            'following_count': self.following_count,
            'public_repos_count': self.public_repos_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_metrics:
            result.update({
                'pagerank_score': self.pagerank_score,
                'authority_score': self.authority_score,
                'hub_score': self.hub_score,
                'community_id': self.community_id
            })
        
        return result

class GitHubRepo(Base):
    """GitHub repository model"""
    __tablename__ = 'github_repos'
    
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
    owner_id = Column(Integer, ForeignKey('github_users.id'), nullable=False)
    fetched_at = Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert repository to dictionary"""
        return {
            'id': self.id,
            'github_id': self.github_id,
            'name': self.name,
            'full_name': self.full_name,
            'description': self.description,
            'language': self.language,
            'stargazers_count': self.stargazers_count,
            'forks_count': self.forks_count,
            'watchers_count': self.watchers_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'url': self.url,
            'is_fork': self.is_fork,
            'owner_login': self.owner.login if self.owner else None
        } 