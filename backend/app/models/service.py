"""
Tessolve Executive Portal - Service and Project Models
Core business entities for service delivery tracking.
"""

from datetime import datetime, timezone, date
from decimal import Decimal
from typing import Optional, List
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Date, ForeignKey, 
    Numeric, Boolean, Enum as SQLEnum
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.models.base import Base, TimestampMixin, SoftDeleteMixin


class ServiceStatus(str, enum.Enum):
    """Service engagement status."""
    DRAFT = "draft"
    ACTIVE = "active"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ProjectStatus(str, enum.Enum):
    """Project status within a service."""
    PLANNING = "planning"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    COMPLETED = "completed"
    ON_HOLD = "on_hold"
    CANCELLED = "cancelled"


class CustomerType(str, enum.Enum):
    """Type of customer relationship."""
    NEW = "new"
    EXISTING = "existing"


# Association table for Service-Technology many-to-many
from sqlalchemy import Table
service_technologies = Table(
    'service_technologies',
    Base.metadata,
    Column('service_id', Integer, ForeignKey('services.id'), primary_key=True),
    Column('technology_id', Integer, ForeignKey('technologies.id'), primary_key=True)
)


class Service(Base, TimestampMixin, SoftDeleteMixin):
    """
    Service engagement - represents a client contract/engagement.
    This is the main business entity that managers will create and track.
    Services belong to Clients.
    """
    
    __tablename__ = "services"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Basic Info
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    notes: Mapped[Optional[str]] = mapped_column(Text)  # Manager notes
    
    # Client relationship (optional for backward compatibility)
    client_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey('clients.id'), nullable=True)
    
    # Customer Info (kept for backward compatibility, but client_id is preferred)
    customer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    customer_type: Mapped[CustomerType] = mapped_column(
        SQLEnum(CustomerType), 
        default=CustomerType.NEW,
        nullable=False
    )
    customer_contact: Mapped[Optional[str]] = mapped_column(String(255))
    customer_email: Mapped[Optional[str]] = mapped_column(String(255))
    
    # Status
    status: Mapped[ServiceStatus] = mapped_column(
        SQLEnum(ServiceStatus),
        default=ServiceStatus.DRAFT,
        nullable=False,
        index=True
    )
    
    # Relationships to Master Data
    engagement_model_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey('engagement_models.id')
    )
    service_category_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey('service_categories.id')
    )
    sector_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey('sectors.id')
    )
    department_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey('departments.id')
    )
    
    # Financial
    contract_value: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2))
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    capex: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2))  # Capital Expenditure
    opex: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2))   # Operating Expenditure
    
    # Resources
    resource_count: Mapped[int] = mapped_column(Integer, default=0)
    
    # Timeline
    start_date: Mapped[Optional[date]] = mapped_column(Date)
    end_date: Mapped[Optional[date]] = mapped_column(Date)
    
    # Management
    manager_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey('users.id'))
    
    # CTI Data (Restricted - Manager/Admin only)
    cti_strategic_insights: Mapped[Optional[str]] = mapped_column(Text)
    cti_managerial_notes: Mapped[Optional[str]] = mapped_column(Text)
    cti_competitive_intel: Mapped[Optional[str]] = mapped_column(Text)
    cti_risk_assessment: Mapped[Optional[str]] = mapped_column(Text)
    cti_classification: Mapped[Optional[str]] = mapped_column(String(50), default="internal")
    
    # Relationships
    client = relationship("Client", back_populates="services")
    projects: Mapped[List["Project"]] = relationship("Project", back_populates="service", cascade="all, delete-orphan")
    technologies = relationship("Technology", secondary=service_technologies, backref="services")
    manager = relationship("User", foreign_keys=[manager_id])
    engagement_model = relationship("EngagementModel")
    service_category = relationship("ServiceCategory")
    sector = relationship("Sector")
    department = relationship("Department")
    
    def __repr__(self) -> str:
        return f"<Service {self.id}: {self.name}>"


class Project(Base, TimestampMixin):
    """
    Project within a service engagement.
    A service can have multiple projects.
    """
    
    __tablename__ = "projects"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Parent Service
    service_id: Mapped[int] = mapped_column(Integer, ForeignKey('services.id'), nullable=False)
    
    # Basic Info
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    
    # Status
    status: Mapped[ProjectStatus] = mapped_column(
        SQLEnum(ProjectStatus),
        default=ProjectStatus.PLANNING,
        nullable=False
    )
    
    # Timeline
    start_date: Mapped[Optional[date]] = mapped_column(Date)
    end_date: Mapped[Optional[date]] = mapped_column(Date)
    
    # Progress
    progress_percentage: Mapped[int] = mapped_column(Integer, default=0)
    
    # Relationships
    service: Mapped["Service"] = relationship("Service", back_populates="projects")
    
    def __repr__(self) -> str:
        return f"<Project {self.id}: {self.name}>"
