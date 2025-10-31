"""
Database utilities for ScoutzOS.

This module provides a SQLAlchemy `SessionLocal` and a base class for ORM models.
It also includes a FastAPI dependency that yields a database session per request.
"""

from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session

from .config import get_settings


# Create the SQLAlchemy engine using the configured database URL.  The `future`
# flag enables SQLAlchemy 2.0 style behaviours.  Note that SQLite requires
# `check_same_thread=False` when used with multithreading (e.g., in uvicorn).
_settings = get_settings()
engine = create_engine(
    _settings.database_url,
    echo=_settings.debug,
    future=True,
)


# Configure a session factory.  We disable autocommit and autoflush to allow
# explicit control of transactions.
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=Session,
)


# Declarative base class for all ORM models.
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Yield a database session for FastAPI dependencies.

    The session is automatically closed after the request finishes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()