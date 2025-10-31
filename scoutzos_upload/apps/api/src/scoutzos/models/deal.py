"""
SQLAlchemy model for deals.

A deal represents a successful or potential transaction resulting from a lead.  It
may refer to a property/unit or just be an acquisition or lease without a specific
unit identified.
"""

import enum
from sqlalchemy import Column, Date, ForeignKey, Numeric, String, Enum as PgEnum
from sqlalchemy.orm import relationship

from .base import BaseModel


class DealType(str, enum.Enum):
    acquisition = "acquisition"
    lease = "lease"
    management = "management"


class DealStatus(str, enum.Enum):
    open = "open"
    won = "won"
    lost = "lost"


class Deal(BaseModel):
    """Represents a deal resulting from a lead."""

    org_id: str = Column(String(26), ForeignKey("organizations.id"), nullable=False)
    lead_id: str = Column(String(26), ForeignKey("leads.id"), nullable=False)
    property_id: str = Column(String(26), ForeignKey("properties.id"), nullable=True)
    unit_id: str = Column(String(26), ForeignKey("units.id"), nullable=True)
    type: DealType = Column(PgEnum(DealType), nullable=False)
    amount: float = Column(Numeric(12, 2), nullable=True)
    status: DealStatus = Column(PgEnum(DealStatus), default=DealStatus.open, nullable=False)
    close_date: Date = Column(Date, nullable=True)

    # Relationships
    organization = relationship("Organization")
    lead = relationship("Lead", back_populates="deals")
    property = relationship("Property")
    unit = relationship("Unit")