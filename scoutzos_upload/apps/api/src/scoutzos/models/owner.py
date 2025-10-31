"""
SQLAlchemy model for property owners.

An owner represents the legal owner of one or more properties.  Each owner
belongs to a single organization (tenant) and may be referenced from
properties.
"""

from sqlalchemy import Column, ForeignKey, String
from sqlalchemy.orm import relationship

from .base import BaseModel


class Owner(BaseModel):
    """Represents a property owner within an organization."""

    org_id: str = Column(String(26), ForeignKey("organizations.id"), nullable=False)
    legal_name: str = Column(String(255), nullable=False)
    contact_email: str = Column(String(255), nullable=True)
    phone: str = Column(String(50), nullable=True)
    notes: str = Column(String, nullable=True)

    # Relationships
    organization = relationship("Organization", back_populates="owners")
    properties = relationship("Property", back_populates="owner")