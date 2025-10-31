"""
SQLAlchemy model for audit logs.

Audit logs capture changes to entities for traceability and compliance.  Each log
records the actor, action, entity type, entity ID, and before/after state.
"""

from sqlalchemy import Column, ForeignKey, String, Text, JSON
from sqlalchemy.orm import relationship

from .base import BaseModel


class AuditLog(BaseModel):
    """Represents an audit log entry."""

    org_id: str = Column(String(26), ForeignKey("organizations.id"), nullable=False)
    actor_user_id: str = Column(String(26), ForeignKey("users.id"), nullable=True)
    action: str = Column(String(100), nullable=False)
    entity: str = Column(String(100), nullable=False)
    entity_id: str = Column(String(26), nullable=False)
    before: dict | None = Column(JSON, nullable=True)
    after: dict | None = Column(JSON, nullable=True)

    # Relationships
    organization = relationship("Organization")
    actor = relationship("User")