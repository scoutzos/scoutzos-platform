"""
Router package aggregator.

This module imports and exposes all individual routers so they can be
conveniently referenced when creating the FastAPI application.
"""

from . import organizations, owners, properties, units, leads, deals, contacts, tasks, documents, audit  # noqa: F401

__all__ = [
    "organizations",
    "owners",
    "properties",
    "units",
    "leads",
    "deals",
    "contacts",
    "tasks",
    "documents",
    "audit",
]