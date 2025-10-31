"""
Entry point for the ScoutzOS FastAPI application.
"""

from fastapi import FastAPI

from .routers import (
    organizations,
    owners,
    properties,
    units,
    leads,
    deals,
    contacts,
    tasks,
    documents,
    audit,
)


def create_app() -> FastAPI:
    app = FastAPI(title="ScoutzOS API", version="1.0.0")
    # Register routers
    app.include_router(organizations.router)
    app.include_router(owners.router)
    app.include_router(properties.router)
    app.include_router(units.router)
    app.include_router(leads.router)
    app.include_router(deals.router)
    app.include_router(contacts.router)
    app.include_router(tasks.router)
    app.include_router(documents.router)
    app.include_router(audit.router)
    return app


app = create_app()