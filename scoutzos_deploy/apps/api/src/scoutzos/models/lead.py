"""
SQLAlchemy model for leads.

A lead represents an inbound prospective tenant or investor contact.  Leads
belong to an organization and may progress through stages before becoming
a deal.
"""

import enum
from sqlalchemy import Column, ForeignKey, String, Text, Enum as PgEnum, Integer, JSON
from sqlalchemy.orm import relationship

from .base import BaseModel


class LeadSource(str, enum.Enum):
    zillow = "zillow"
    website = "website"
    referral = "referral"
    wholesale = "wholesale"
    agent = "agent"
    import_ = "import"
    other = "other"


class LeadStage(str, enum.Enum):
    new = "new"
    qualified = "qualified"
    toured = "toured"
    applied = "applied"
    won = "won"
    lost = "lost"


class Lead(BaseModel):
    """Represents a prospective tenant/investor."""

    org_id: str = Column(String(26), ForeignKey("organizations.id"), nullable=False)
    source: LeadSource = Column(PgEnum(LeadSource), nullable=True)
    name: str = Column(String(255), nullable=False)
    email: str = Column(String(255), nullable=True)
    phone: str = Column(String(50), nullable=True)
    # store tags as a JSON array of strings for portability across databases
    tags: list[str] = Column(JSON, nullable=True)
    stage: LeadStage = Column(PgEnum(LeadStage), default=LeadStage.new, nullable=False)
    assigned_to: str = Column(String(26), ForeignKey("users.id"), nullable=True)
    notes: str = Column(Text, nullable=True)

    # Relationships
    organization = relationship("Organization")
    assigned_user = relationship("User")
    deals = relationship("Deal", back_populates="lead")