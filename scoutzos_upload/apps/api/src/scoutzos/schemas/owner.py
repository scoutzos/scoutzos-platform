"""
Pydantic schemas for owners.
"""

from typing import Optional

from .base import ORMBase


class OwnerBase(ORMBase):
    legal_name: str
    contact_email: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None


class OwnerCreate(OwnerBase):
    pass


class OwnerUpdate(ORMBase):
    legal_name: Optional[str] = None
    contact_email: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None


class OwnerRead(OwnerBase):
    id: str