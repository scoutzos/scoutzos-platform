"""
SQLAlchemy model for user roles within an organization.
"""

from enum import Enum
from sqlalchemy import Column, Enum as PgEnum, ForeignKey, String
from sqlalchemy.orm import relationship

from .base import BaseModel


class Role(str, Enum):
    owner = "owner"
    admin = "admin"
    agent = "agent"
    viewer = "viewer"


class UserOrgRole(BaseModel):
    """Associates a user with an organization and a role."""

    user_id: str = Column(String(26), ForeignKey("users.id"), nullable=False)
    org_id: str = Column(String(26), ForeignKey("organizations.id"), nullable=False)
    role: Role = Column(PgEnum(Role), default=Role.viewer, nullable=False)

    # Relationships
    user = relationship("User", back_populates="memberships")
    organization = relationship("Organization", back_populates="users")