"""
SQLAlchemy model for tasks.

A task represents a to-do item associated with any entity (lead, deal, property, unit, contact).
"""

import enum
from sqlalchemy import Column, Date, ForeignKey, String, Enum as PgEnum, Text
from sqlalchemy.orm import relationship

from .base import BaseModel


class TaskStatus(str, enum.Enum):
    todo = "todo"
    in_progress = "in_progress"
    done = "done"


class RelatedType(str, enum.Enum):
    lead = "lead"
    deal = "deal"
    property = "property"
    unit = "unit"
    contact = "contact"


class Task(BaseModel):
    """Represents a task associated with any entity."""

    org_id: str = Column(String(26), ForeignKey("organizations.id"), nullable=False)
    title: str = Column(String(255), nullable=False)
    description: str = Column(Text, nullable=True)
    due_date: Date = Column(Date, nullable=True)
    status: TaskStatus = Column(PgEnum(TaskStatus), default=TaskStatus.todo, nullable=False)
    assigned_to: str = Column(String(26), ForeignKey("users.id"), nullable=True)
    related_type: RelatedType = Column(PgEnum(RelatedType), nullable=True)
    related_id: str = Column(String(26), nullable=True)

    # Relationships
    organization = relationship("Organization")
    assigned_user = relationship("User")