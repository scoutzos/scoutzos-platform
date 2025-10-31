"""
Base model definitions and utility functions.

The `BaseModel` class provides an autogenerating ULID primary key and common
timestamp fields.  Models should inherit from this class to ensure
consistency across the database schema.
"""

import datetime as _dt
from typing import Any

import ulid
from sqlalchemy import Column, DateTime, String
from sqlalchemy.orm import declared_attr

from ..db import Base


class BaseModel(Base):
    """Declarative base model with a ULID primary key and timestamps."""

    __abstract__ = True

    id: str = Column(String(26), primary_key=True, default=lambda: ulid.new().str)
    created_at: _dt.datetime = Column(DateTime(timezone=True), default=_dt.datetime.utcnow)
    updated_at: _dt.datetime = Column(DateTime(timezone=True), default=_dt.datetime.utcnow, onupdate=_dt.datetime.utcnow)

    @declared_attr
    def __tablename__(cls) -> str:  # type: ignore[misc]
        # Convert CamelCase class names to snake_case table names
        name = cls.__name__
        snake = []
        for i, char in enumerate(name):
            if char.isupper() and i != 0:
                snake.append("_")
            snake.append(char.lower())
        return "".join(snake) + "s"  # pluralize


    def __repr__(self) -> str:
        attrs = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        return f"< {self.__class__.__name__} {attrs} >"