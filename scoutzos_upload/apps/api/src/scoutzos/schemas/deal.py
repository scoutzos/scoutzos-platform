"""
Pydantic schemas for deals.
"""

from typing import Optional
from datetime import date, datetime

from .base import ORMBase
from ..models.deal import DealType, DealStatus


class DealBase(ORMBase):
    lead_id: str
    property_id: Optional[str] = None
    unit_id: Optional[str] = None
    type: DealType
    amount: Optional[float] = None
    status: DealStatus = DealStatus.open
    close_date: Optional[date] = None


class DealCreate(DealBase):
    pass


class DealUpdate(ORMBase):
    property_id: Optional[str] = None
    unit_id: Optional[str] = None
    type: Optional[DealType] = None
    amount: Optional[float] = None
    status: Optional[DealStatus] = None
    close_date: Optional[date] = None


class DealRead(DealBase):
    id: str
    created_at: datetime
    updated_at: datetime