"""
Pydantic schemas for contacts.
"""

from typing import Optional
from datetime import datetime

from .base import ORMBase
from ..models.contact import ContactType


class ContactBase(ORMBase):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    type: ContactType
    notes: Optional[str] = None


class ContactCreate(ContactBase):
    pass


class ContactUpdate(ORMBase):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    type: Optional[ContactType] = None
    notes: Optional[str] = None


class ContactRead(ContactBase):
    id: str
    created_at: datetime
    updated_at: datetime