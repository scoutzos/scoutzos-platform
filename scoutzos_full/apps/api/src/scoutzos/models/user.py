"""
SQLAlchemy model for users.
"""

from sqlalchemy import Column, String
from sqlalchemy.orm import relationship

from .base import BaseModel


class User(BaseModel):
    """Application user (authentication is external to this model)."""

    email: str = Column(String(255), unique=True, nullable=False)
    name: str = Column(String(255), nullable=True)

    # Relationships
    memberships = relationship("UserOrgRole", back_populates="user")