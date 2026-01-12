"""
Tessolve Executive Portal - SQLAlchemy Base Models
Base class and mixins for all database models.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Integer
from sqlalchemy.orm import DeclarativeBase, declared_attr


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    
    @declared_attr.directive
    def __tablename__(cls) -> str:
        """Generate table name from class name (lowercase with underscores)."""
        import re
        name = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', cls.__name__)
        return re.sub('([a-z0-9])([A-Z])', r'\1_\2', name).lower()


class TimestampMixin:
    """
    Mixin that adds created_at and updated_at columns.
    Use with models that need automatic timestamp tracking.
    """
    
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class SoftDeleteMixin:
    """
    Mixin for soft delete functionality.
    Records are marked as deleted rather than physically removed.
    """
    
    is_deleted = Column(
        "is_deleted",
        Integer,
        default=0,
        nullable=False,
    )
    deleted_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )
    
    @property
    def is_soft_deleted(self):
        """Check if record is soft deleted (works with both int and bool)."""
        return bool(self.is_deleted)
