"""
Task Model - Tasks generated from services.
Tasks can be AI-generated or manually created, and assigned to employees.
"""

from datetime import datetime, timezone, date
from typing import Optional, List
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Date, Boolean, 
    ForeignKey, Float, Enum as SQLEnum
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.models.base import Base, TimestampMixin, SoftDeleteMixin


class TaskStatus(str, enum.Enum):
    """Task status."""
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TaskPriority(str, enum.Enum):
    """Task priority level."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Task(Base, TimestampMixin, SoftDeleteMixin):
    """
    Task represents a unit of work within a service.
    Can be AI-generated (from service analysis) or manually created.
    """
    
    __tablename__ = "tasks"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Basic Info
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    
    # Parent Service
    service_id: Mapped[int] = mapped_column(Integer, ForeignKey('services.id'), nullable=False)
    
    # Status and Priority
    status: Mapped[TaskStatus] = mapped_column(
        SQLEnum(TaskStatus),
        default=TaskStatus.PENDING,
        nullable=False,
        index=True
    )
    priority: Mapped[TaskPriority] = mapped_column(
        SQLEnum(TaskPriority),
        default=TaskPriority.MEDIUM,
        nullable=False
    )
    
    # Time Estimates
    estimated_hours: Mapped[float] = mapped_column(Float, default=8)
    actual_hours: Mapped[Optional[float]] = mapped_column(Float)
    
    # Required Skills (stored as JSON string for simplicity)
    required_skills: Mapped[Optional[str]] = mapped_column(Text)  # JSON array of skill names
    
    # Dates
    start_date: Mapped[Optional[date]] = mapped_column(Date)
    due_date: Mapped[Optional[date]] = mapped_column(Date)
    completed_date: Mapped[Optional[date]] = mapped_column(Date)
    
    # Progress
    progress_percentage: Mapped[int] = mapped_column(Integer, default=0)
    
    # AI Generation Info
    is_ai_generated: Mapped[bool] = mapped_column(Boolean, default=False)
    ai_reasoning: Mapped[Optional[str]] = mapped_column(Text)  # Why AI created this task
    
    # Created by (manager)
    created_by_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey('users.id'))
    
    # Relationships
    service = relationship("Service", backref="tasks")
    created_by = relationship("User", foreign_keys=[created_by_id])
    assignments: Mapped[List["TaskAssignment"]] = relationship(
        "TaskAssignment",
        back_populates="task",
        cascade="all, delete-orphan"
    )
    
    @property
    def is_assigned(self) -> bool:
        return any(a.is_active for a in self.assignments)
    
    @property
    def current_assignee(self):
        """Get the current active assignee."""
        for assignment in self.assignments:
            if assignment.is_active:
                return assignment.employee
        return None
    
    def __repr__(self) -> str:
        return f"<Task {self.id}: {self.title}>"


class TaskAssignment(Base, TimestampMixin):
    """
    TaskAssignment links a task to an employee.
    Tracks assignment history and AI recommendations.
    """
    
    __tablename__ = "task_assignments"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Task and Employee
    task_id: Mapped[int] = mapped_column(Integer, ForeignKey('tasks.id'), nullable=False)
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey('employees.id'), nullable=False)
    
    # Assignment Info
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    assigned_hours: Mapped[float] = mapped_column(Float, default=0)  # Hours allocated
    
    # AI Recommendation Info
    is_ai_recommended: Mapped[bool] = mapped_column(Boolean, default=False)
    ai_match_score: Mapped[Optional[float]] = mapped_column(Float)  # 0-100 score
    ai_skill_match: Mapped[Optional[float]] = mapped_column(Float)
    ai_availability_score: Mapped[Optional[float]] = mapped_column(Float)
    ai_reasoning: Mapped[Optional[str]] = mapped_column(Text)
    
    # Assignment tracking
    assigned_by_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey('users.id'))
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc)
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    # Relationships
    task: Mapped["Task"] = relationship("Task", back_populates="assignments")
    employee: Mapped["Employee"] = relationship("Employee", back_populates="task_assignments")
    assigned_by = relationship("User", foreign_keys=[assigned_by_id])
    
    def __repr__(self) -> str:
        return f"<TaskAssignment task={self.task_id} employee={self.employee_id}>"
