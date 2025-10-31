"""
SQLAlchemy model for units.

A unit represents a rentable space within a property (e.g., apartment).
Units belong to a property and organization.
"""

import enum
from sqlalchemy import Column, Float, ForeignKey, Integer, Numeric, String, Enum as PgEnum
from sqlalchemy.orm import relationship

from .base import BaseModel


class UnitStatus(str, enum.Enum):
    vacant = "vacant"
    occupied = "occupied"
    down = "down"


class Unit(BaseModel):
    """Represents a unit or apartment within a property."""

    org_id: str = Column(String(26), ForeignKey("organizations.id"), nullable=False)
    property_id: str = Column(String(26), ForeignKey("properties.id"), nullable=False)
    unit_label: str = Column(String(50), nullable=False)
    beds: int = Column(Integer, nullable=True)
    baths: float = Column(Numeric(3, 1), nullable=True)
    sqft: int = Column(Integer, nullable=True)
    market_rent: int = Column(Integer, nullable=True)
    status: UnitStatus = Column(PgEnum(UnitStatus), default=UnitStatus.vacant, nullable=False)

    # Relationships
    property = relationship("Property", back_populates="units")
    organization = relationship("Organization")