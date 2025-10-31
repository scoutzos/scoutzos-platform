"""
Pydantic schemas for organizations.
"""

from typing import Optional
from .base import ORMBase


class OrganizationBase(ORMBase):
    name: str
    slug: str


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationRead(OrganizationBase):
    id: str