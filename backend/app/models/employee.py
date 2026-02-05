"""
Employee Model - Team members managed by managers.
Employees have skills and can be assigned to tasks.
"""

from datetime import datetime, timezone, date
from typing import Optional, List
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Date, Boolean, 
    ForeignKey, Table, Float, Enum as SQLEnum
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.models.base import Base, TimestampMixin, SoftDeleteMixin


class AvailabilityStatus(str, enum.Enum):
    """Employee availability status."""
    AVAILABLE = "available"
    PARTIALLY_AVAILABLE = "partially_available"
    BUSY = "busy"
    ON_LEAVE = "on_leave"
    UNAVAILABLE = "unavailable"


class SkillProficiency(str, enum.Enum):
    """Skill proficiency level."""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


# Association table for Employee-Skill many-to-many with proficiency
employee_skills = Table(
    'employee_skills',
    Base.metadata,
    Column('employee_id', Integer, ForeignKey('employees.id', ondelete='CASCADE'), primary_key=True),
    Column('skill_id', Integer, ForeignKey('skills.id', ondelete='CASCADE'), primary_key=True),
    Column('proficiency', SQLEnum(SkillProficiency), default=SkillProficiency.INTERMEDIATE),
    Column('years_experience', Float, default=0),
    Column('created_at', DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
)


class Skill(Base, TimestampMixin):
    """
    Skill represents a competency/technology/ability.
    """
    
    __tablename__ = "skills"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    category: Mapped[Optional[str]] = mapped_column(String(100))  # Technical, Soft, Domain, etc.
    description: Mapped[Optional[str]] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    def __repr__(self) -> str:
        return f"<Skill {self.name}>"


class Employee(Base, TimestampMixin, SoftDeleteMixin):
    """
    Employee represents a team member managed by a manager.
    Different from User - employees are resources assigned to tasks.
    An employee may or may not have a User account.
    """
    
    __tablename__ = "employees"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Basic Info
    employee_id: Mapped[Optional[str]] = mapped_column(String(50), unique=True, index=True)  # Company employee ID
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50))
    
    # Job Info
    job_title: Mapped[Optional[str]] = mapped_column(String(100))
    department: Mapped[Optional[str]] = mapped_column(String(100))
    
    # Work Capacity
    weekly_capacity_hours: Mapped[int] = mapped_column(Integer, default=40)  # Max hours per week
    current_workload_hours: Mapped[float] = mapped_column(Float, default=0)  # Current assigned hours
    
    # Availability
    availability_status: Mapped[AvailabilityStatus] = mapped_column(
        SQLEnum(AvailabilityStatus),
        default=AvailabilityStatus.AVAILABLE
    )
    
    # Dates
    hire_date: Mapped[Optional[date]] = mapped_column(Date)
    
    # Manager relationship
    manager_id: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'), nullable=False)
    
    # Optional link to User account
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey('users.id'), nullable=True)
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Relationships
    skills = relationship("Skill", secondary=employee_skills, backref="employees")
    manager = relationship("User", foreign_keys=[manager_id], backref="managed_employees")
    user = relationship("User", foreign_keys=[user_id])
    task_assignments: Mapped[List["TaskAssignment"]] = relationship(
        "TaskAssignment", 
        back_populates="employee",
        cascade="all, delete-orphan"
    )
    
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
    
    @property
    def available_hours(self) -> float:
        return max(0, self.weekly_capacity_hours - self.current_workload_hours)
    
    @property
    def workload_percentage(self) -> float:
        if self.weekly_capacity_hours == 0:
            return 100
        return (self.current_workload_hours / self.weekly_capacity_hours) * 100
    
    def __repr__(self) -> str:
        return f"<Employee {self.id}: {self.full_name}>"
