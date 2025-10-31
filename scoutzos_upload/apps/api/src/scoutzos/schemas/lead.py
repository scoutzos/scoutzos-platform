"""
Pydantic schemas for leads.
"""

from typing import Optional, List
from datetime import datetime

from .base import ORMBase
from ..models.lead import LeadSource, LeadStage


class LeadBase(ORMBase):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    source: Optional[LeadSource] = None
    tags: Optional[List[str]] = None
    stage: LeadStage = LeadStage.new
    assigned_to: Optional[str] = None
    notes: Optional[str] = None


class LeadCreate(LeadBase):
    pass


class LeadUpdate(ORMBase):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    source: Optional[LeadSource] = None
    tags: Optional[List[str]] = None
    stage: Optional[LeadStage] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None


class LeadRead(LeadBase):
    id: str
    created_at: datetime
    updated_at: datetime