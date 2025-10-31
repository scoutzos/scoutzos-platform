"""
SQLAlchemy model for properties.

A property represents a building or parcel of real estate.  Properties
belong to organizations and may optionally be associated with an owner.
Each property can have multiple units (apartments) and documents.
"""

import enum
from sqlalchemy import Column, DateTime, Enum as PgEnum, Float, ForeignKey, Integer, Numeric, String, Text, Index
from sqlalchemy.orm import relationship

from .base import BaseModel


class PropertyType(str, enum.Enum):
    single_family = "single_family"
    townhome = "townhome"
    multi = "multi"
    apt = "apt"
    land = "land"


class PropertyStatus(str, enum.Enum):
    draft = "draft"
    active = "active"
    offmarket = "offmarket"


class Property(BaseModel):
    """Represents a real estate property."""

    org_id: str = Column(String(26), ForeignKey("organizations.id"), nullable=False)
    owner_id: str = Column(String(26), ForeignKey("owners.id"), nullable=True)
    address1: str = Column(String(255), nullable=False)
    address2: str = Column(String(255), nullable=True)
    city: str = Column(String(100), nullable=False)
    state: str = Column(String(100), nullable=False)
    postal_code: str = Column(String(20), nullable=False)
    county: str = Column(String(100), nullable=True)
    lat: float = Column(Float, nullable=True)
    lng: float = Column(Float, nullable=True)
    type: PropertyType = Column(PgEnum(PropertyType), nullable=False)
    year_built: int = Column(Integer, nullable=True)
    status: PropertyStatus = Column(PgEnum(PropertyStatus), default=PropertyStatus.draft, nullable=False)
    deleted_at: DateTime = Column(DateTime(timezone=True), nullable=True)
    search: str = Column(Text, nullable=True)

    # Relationships
    organization = relationship("Organization", back_populates="properties")
    owner = relationship("Owner", back_populates="properties")
    units = relationship("Unit", back_populates="property")
    documents = relationship("Document", back_populates="property")

    __table_args__ = (
        Index("idx_properties_org", "org_id"),
        Index("idx_properties_owner", "owner_id"),
    )