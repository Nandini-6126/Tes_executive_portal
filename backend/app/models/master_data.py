"""
Tessolve Executive Portal - Master Data Models
Global dropdown entities managed by Admin.
"""

from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Sector(Base, TimestampMixin):
    """Industry sectors for services and products."""
    
    __tablename__ = "sectors"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    def __repr__(self) -> str:
        return f"<Sector {self.name}>"


class Technology(Base, TimestampMixin):
    """
    Technology stack items.
    Managed via Master Data Management in Admin panel.
    """
    
    __tablename__ = "technologies"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(50), index=True)  # Frontend, Backend, DevOps, AI/ML
    description: Mapped[Optional[str]] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    def __repr__(self) -> str:
        return f"<Technology {self.name}>"


class EngagementModel(Base, TimestampMixin):
    """
    Service engagement models.
    E.g., Fixed Price, T&M, Retainer
    """
    
    __tablename__ = "engagement_models"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    billing_type: Mapped[Optional[str]] = mapped_column(String(50))  # milestone, hourly, monthly
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    def __repr__(self) -> str:
        return f"<EngagementModel {self.name}>"


class ServiceCategory(Base, TimestampMixin):
    """
    Service category types.
    E.g., Consulting, Development, Managed Services
    """
    
    __tablename__ = "service_categories"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    def __repr__(self) -> str:
        return f"<ServiceCategory {self.name}>"


class Department(Base, TimestampMixin):
    """
    Organization departments.
    Links to users for department-based filtering and analytics.
    """
    
    __tablename__ = "departments"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    code: Mapped[Optional[str]] = mapped_column(String(20), unique=True)
    head_user_id: Mapped[Optional[int]] = mapped_column(
        Integer, 
        ForeignKey("users.id"),
        nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    def __repr__(self) -> str:
        return f"<Department {self.name}>"
