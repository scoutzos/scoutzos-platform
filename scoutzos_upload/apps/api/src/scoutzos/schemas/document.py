"""
Pydantic schemas for documents.
"""

from typing import Optional
from datetime import datetime

from .base import ORMBase


class DocumentBase(ORMBase):
    related_type: Optional[str] = None
    related_id: Optional[str] = None
    filename: str
    mime_type: str
    storage_key: str
    bytes: Optional[int] = None
    uploaded_by: Optional[str] = None


class DocumentCreate(DocumentBase):
    pass


class DocumentRead(DocumentBase):
    id: str
    created_at: datetime