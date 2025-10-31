"""
SQLAlchemy model for documents.

Documents represent uploaded files attached to various entities.  Files are stored in
object storage and referenced by their storage key.
"""

from sqlalchemy import Column, ForeignKey, String, Integer, DateTime
from sqlalchemy.orm import relationship

from .base import BaseModel


class Document(BaseModel):
    """Represents a stored document or file."""

    org_id: str = Column(String(26), ForeignKey("organizations.id"), nullable=False)
    related_type: str = Column(String(50), nullable=True)
    related_id: str = Column(String(26), nullable=True)
    filename: str = Column(String(255), nullable=False)
    mime_type: str = Column(String(100), nullable=False)
    storage_key: str = Column(String(255), nullable=False)
    bytes: int = Column(Integer, nullable=True)
    uploaded_by: str = Column(String(26), ForeignKey("users.id"), nullable=True)

    # Relationships
    organization = relationship("Organization")
    property = relationship("Property", back_populates="documents", foreign_keys=[related_id], primaryjoin="Document.related_id == Property.id")
    uploader = relationship("User")