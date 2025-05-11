#!/usr/bin/env python3
"""
repository.py - Repository model for GitConnectX

This module defines the Repository model for representing GitHub repositories.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from datetime import datetime
import json

@dataclass
class Repository:
    """Represents a GitHub repository with relevant attributes."""
    
    id: int
    name: str
    full_name: str
    owner_id: int
    owner_login: str
    description: Optional[str] = None
    language: Optional[str] = None
    stargazers_count: int = 0
    forks_count: int = 0
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    topics: List[str] = field(default_factory=list)
    
    # Additional internal attributes for analysis
    pagerank_score: float = 0.0
    centrality: float = 0.0
    
    @classmethod
    def from_api_data(cls, data: Dict[str, Any]) -> 'Repository':
        """
        Create a Repository instance from GitHub API data
        
        Args:
            data: Raw repository data from GitHub API
            
        Returns:
            Repository instance
        """
        return cls(
            id=data.get('id', 0),
            name=data.get('name', ''),
            full_name=data.get('full_name', ''),
            owner_id=data.get('owner', {}).get('id', 0),
            owner_login=data.get('owner', {}).get('login', ''),
            description=data.get('description'),
            language=data.get('language'),
            stargazers_count=data.get('stargazers_count', 0),
            forks_count=data.get('forks_count', 0),
            created_at=data.get('created_at'),
            updated_at=data.get('updated_at'),
            topics=data.get('topics', [])
        )
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Repository':
        """
        Create a Repository instance from a dictionary
        
        Args:
            data: Dictionary with repository data
            
        Returns:
            Repository instance
        """
        return cls(**{k: v for k, v in data.items() if k in cls.__annotations__})
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert repository to dictionary
        
        Returns:
            Dictionary representation of the repository
        """
        return {
            "id": self.id,
            "name": self.name,
            "full_name": self.full_name,
            "owner_id": self.owner_id,
            "owner_login": self.owner_login,
            "description": self.description,
            "language": self.language,
            "stargazers_count": self.stargazers_count,
            "forks_count": self.forks_count,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "topics": self.topics,
            "pagerank_score": self.pagerank_score,
            "centrality": self.centrality
        }
    
    def to_json(self) -> str:
        """
        Convert repository to JSON string
        
        Returns:
            JSON string representation of the repository
        """
        return json.dumps(self.to_dict())