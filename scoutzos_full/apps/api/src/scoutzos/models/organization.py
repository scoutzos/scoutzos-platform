"""
SQLAlchemy models for organizations and user memberships.
"""

from sqlalchemy import Column, String
from sqlalchemy.orm import relationship

from .base import BaseModel


class Organization(BaseModel):
    """An organization groups users and resources under a common tenant."""

    name: str = Column(String(255), nullable=False)
    slug: str = Column(String(255), unique=True, nullable=False)

    # Relationships
    users = relationship("UserOrgRole", back_populates="organization")
    owners = relationship("Owner", back_populates="organization")
    properties = relationship("Property", back_populates="organization")
    units = relationship("Unit", back_populates="organization", viewonly=True)
    leads = relationship("Lead", viewonly=True)
    deals = relationship("Deal", viewonly=True)
    contacts = relationship("Contact", viewonly=True)
    tasks = relationship("Task", viewonly=True)
    documents = relationship("Document", viewonly=True)
    audit_logs = relationship("AuditLog", viewonly=True)