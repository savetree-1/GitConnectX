#!/usr/bin/env python3
"""
edge.py - Edge models for GitConnectX

This module defines the edge models for representing relationships between
GitHub users and repositories.
"""

from dataclasses import dataclass
from typing import Tuple

@dataclass
class FollowEdge:
    """Represents a follow relationship between two GitHub users."""
    
    follower_id: int
    followed_id: int
    
    @classmethod
    def from_tuple(cls, edge_tuple: tuple) -> 'FollowEdge':
        """
        Create a FollowEdge from a tuple
        
        Args:
            edge_tuple: Tuple of (follower_id, followed_id)
            
        Returns:
            FollowEdge instance
        """
        return cls(follower_id=edge_tuple[0], followed_id=edge_tuple[1])
    
    def to_tuple(self) -> tuple:
        """
        Convert to tuple representation
        
        Returns:
            Tuple of (follower_id, followed_id)
        """
        return (self.follower_id, self.followed_id)


@dataclass
class CollaborationEdge:
    """Represents a collaboration between two GitHub users on a repository."""
    
    user1_id: int
    user2_id: int
    repo_id: int
    weight: float = 1.0
    
    @classmethod
    def from_tuple(cls, edge_tuple: tuple) -> 'CollaborationEdge':
        """
        Create a CollaborationEdge from a tuple
        
        Args:
            edge_tuple: Tuple of (user1_id, user2_id, repo_id, weight)
            
        Returns:
            CollaborationEdge instance
        """
        if len(edge_tuple) == 4:
            return cls(
                user1_id=edge_tuple[0], 
                user2_id=edge_tuple[1],
                repo_id=edge_tuple[2],
                weight=edge_tuple[3]
            )
        else:
            return cls(
                user1_id=edge_tuple[0], 
                user2_id=edge_tuple[1],
                repo_id=edge_tuple[2]
            )
    
    def to_tuple(self) -> tuple:
        """
        Convert to tuple representation
        
        Returns:
            Tuple of (user1_id, user2_id, repo_id, weight)
        """
        return (self.user1_id, self.user2_id, self.repo_id, self.weight)


@dataclass
class ContributionEdge:
    """Represents a contribution from a user to a repository."""
    
    user_id: int
    repo_id: int
    contribution_count: int = 1
    
    @classmethod
    def from_tuple(cls, edge_tuple: tuple) -> 'ContributionEdge':
        """
        Create a ContributionEdge from a tuple
        
        Args:
            edge_tuple: Tuple of (user_id, repo_id, contribution_count)
            
        Returns:
            ContributionEdge instance
        """
        if len(edge_tuple) == 3:
            return cls(
                user_id=edge_tuple[0],
                repo_id=edge_tuple[1],
                contribution_count=edge_tuple[2]
            )
        else:
            return cls(
                user_id=edge_tuple[0],
                repo_id=edge_tuple[1]
            )
    
    def to_tuple(self) -> tuple:
        """
        Convert to tuple representation
        
        Returns:
            Tuple of (user_id, repo_id, contribution_count)
        """
        return (self.user_id, self.repo_id, self.contribution_count)