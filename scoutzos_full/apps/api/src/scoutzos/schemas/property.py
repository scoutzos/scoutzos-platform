"""
Pydantic schemas for properties.
"""

from typing import Optional
from datetime import datetime

from .base import ORMBase
from ..models.property import PropertyType, PropertyStatus


class PropertyBase(ORMBase):
    address1: str
    address2: Optional[str] = None
    city: str
    state: str
    postal_code: str
    county: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    type: PropertyType
    year_built: Optional[int] = None
    status: PropertyStatus = PropertyStatus.draft


class PropertyCreate(PropertyBase):
    owner_id: Optional[str] = None


class PropertyUpdate(ORMBase):
    address1: Optional[str] = None
    address2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    county: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    type: Optional[PropertyType] = None
    year_built: Optional[int] = None
    status: Optional[PropertyStatus] = None
    owner_id: Optional[str] = None


class PropertyRead(PropertyBase):
    id: str
    owner_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime