"""
Application configuration settings.

This module defines configuration classes using Pydantic's `BaseSettings`.  Values
are read from environment variables with sensible defaults for development.

The `Settings` class can be instantiated once at application startup and then
imported throughout the code base.
"""

from functools import lru_cache
from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    """Configuration values for ScoutzOS.

    Attributes:
        app_name: Human‑readable application name.
        database_url: URL for the SQLAlchemy database engine.  Defaults to
            SQLite for local development but should be configured via the
            `DATABASE_URL` environment variable in production.
        debug: Enable debug mode for FastAPI.
    """

    app_name: str = Field(default="ScoutzOS API")
    database_url: str = Field(default="sqlite:///./dev.db", env="DATABASE_URL")
    debug: bool = Field(default=False, env="DEBUG")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Return a cached instance of the Settings.

    Using `lru_cache` ensures that the Settings are only loaded from the
    environment once.
    """

    return Settings()