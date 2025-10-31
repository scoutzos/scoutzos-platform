"""
Base classes for Pydantic schemas.

All schemas should inherit from `ORMBase` so that they support loading
from SQLAlchemy ORM objects using Pydantic's `from_attributes` feature.
"""

from pydantic import BaseModel, ConfigDict


class ORMBase(BaseModel):
    """Base Pydantic model configured for SQLAlchemy ORM compatibility."""

    model_config = ConfigDict(from_attributes=True)