"""
Pydantic schemas for tasks.
"""

from typing import Optional
from datetime import date, datetime

from .base import ORMBase
from ..models.task import TaskStatus, RelatedType


class TaskBase(ORMBase):
    title: str
    description: Optional[str] = None
    due_date: Optional[date] = None
    status: TaskStatus = TaskStatus.todo
    assigned_to: Optional[str] = None
    related_type: Optional[RelatedType] = None
    related_id: Optional[str] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(ORMBase):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[date] = None
    status: Optional[TaskStatus] = None
    assigned_to: Optional[str] = None
    related_type: Optional[RelatedType] = None
    related_id: Optional[str] = None


class TaskRead(TaskBase):
    id: str
    created_at: datetime
    updated_at: datetime