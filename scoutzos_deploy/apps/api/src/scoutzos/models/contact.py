"""
SQLAlchemy model for contacts.

A contact may represent an external person associated with the organization,
such as a vendor, investor, tenant, broker, or lender.
"""

import enum
from sqlalchemy import Column, ForeignKey, String, Enum as PgEnum, Text
from sqlalchemy.orm import relationship

from .base import BaseModel


class ContactType(str, enum.Enum):
    owner = "owner"
    vendor = "vendor"
    investor = "investor"
    tenant = "tenant"
    broker = "broker"
    lender = "lender"


class Contact(BaseModel):
    """Represents a contact record."""

    org_id: str = Column(String(26), ForeignKey("organizations.id"), nullable=False)
    name: str = Column(String(255), nullable=False)
    email: str = Column(String(255), nullable=True)
    phone: str = Column(String(50), nullable=True)
    company: str = Column(String(255), nullable=True)
    type: ContactType = Column(PgEnum(ContactType), nullable=False)
    notes: str = Column(Text, nullable=True)

    # Relationships
    organization = relationship("Organization")