"""
Tessolve Executive Portal - Database Session Management
SQLAlchemy session configuration and dependency injection.
Supports PostgreSQL (recommended) and SQLite (for testing).
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool, StaticPool
from typing import Generator

from app.config import settings


# Get database URL from settings
database_url = settings.database_url

# Determine if using SQLite (for testing only)
is_sqlite = database_url.startswith("sqlite")

# Create engine with appropriate settings
if is_sqlite:
    # SQLite requires special handling for threading
    engine = create_engine(
        database_url,
        echo=settings.DB_ECHO,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
else:
    # PostgreSQL with connection pooling
    engine = create_engine(
        database_url,
        echo=settings.DB_ECHO,
        poolclass=QueuePool,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
    )

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db() -> Generator[Session, None, None]:
    """
    Database session dependency for FastAPI.
    Yields a session and ensures cleanup after request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """
    Initialize database tables.
    Called on application startup.
    """
    from app.models.base import Base
    # Import all models to register them with Base
    from app.models import user, user_settings, audit, master_data, service
    
    Base.metadata.create_all(bind=engine)
