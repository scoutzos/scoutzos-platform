"""
Pydantic schemas for audit logs.
"""

from typing import Optional, Dict, Any
from datetime import datetime

from .base import ORMBase


class AuditLogBase(ORMBase):
    action: str
    entity: str
    entity_id: str
    before: Optional[Dict[str, Any]] = None
    after: Optional[Dict[str, Any]] = None


class AuditLogRead(AuditLogBase):
    id: str
    actor_user_id: Optional[str] = None
    created_at: datetime