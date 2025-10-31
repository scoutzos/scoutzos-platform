"""
Pydantic schemas for units.
"""

from typing import Optional
from datetime import datetime

from .base import ORMBase
from ..models.unit import UnitStatus


class UnitBase(ORMBase):
    property_id: str
    unit_label: str
    beds: Optional[int] = None
    baths: Optional[float] = None
    sqft: Optional[int] = None
    market_rent: Optional[int] = None
    status: UnitStatus = UnitStatus.vacant


class UnitCreate(UnitBase):
    pass


class UnitUpdate(ORMBase):
    property_id: Optional[str] = None
    unit_label: Optional[str] = None
    beds: Optional[int] = None
    baths: Optional[float] = None
    sqft: Optional[int] = None
    market_rent: Optional[int] = None
    status: Optional[UnitStatus] = None


class UnitRead(UnitBase):
    id: str
    created_at: datetime
    updated_at: datetime