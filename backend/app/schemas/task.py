"""
Task Schemas - Pydantic models for Task API.
"""

from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field

from app.models.task import TaskStatus, TaskPriority


class TaskBase(BaseModel):
    """Base task schema."""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    estimated_hours: float = Field(default=8, ge=0.5, le=1000)
    required_skills: Optional[List[str]] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None


class TaskCreate(TaskBase):
    """Schema for creating a task."""
    service_id: int


class TaskUpdate(BaseModel):
    """Schema for updating a task."""
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    required_skills: Optional[List[str]] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    progress_percentage: Optional[int] = Field(None, ge=0, le=100)


class TaskAssignmentCreate(BaseModel):
    """Schema for assigning a task."""
    employee_id: int
    assigned_hours: Optional[float] = None
    is_ai_recommended: bool = False
    ai_match_score: Optional[float] = None
    ai_reasoning: Optional[str] = None


class TaskAssignmentResponse(BaseModel):
    """Schema for task assignment response."""
    id: int
    task_id: int
    employee_id: int
    employee_name: str
    is_active: bool
    assigned_hours: float
    is_ai_recommended: bool
    ai_match_score: Optional[float] = None
    ai_reasoning: Optional[str] = None
    assigned_at: datetime
    
    class Config:
        from_attributes = True


class TaskResponse(TaskBase):
    """Schema for task response."""
    id: int
    service_id: int
    service_name: Optional[str] = None
    client_name: Optional[str] = None
    status: TaskStatus
    actual_hours: Optional[float] = None
    progress_percentage: int
    is_ai_generated: bool
    ai_reasoning: Optional[str] = None
    completed_date: Optional[date] = None
    is_assigned: bool
    current_assignee_id: Optional[int] = None
    current_assignee_name: Optional[str] = None
    assignments: List[TaskAssignmentResponse] = []
    created_by_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class TaskListResponse(BaseModel):
    """Schema for list of tasks."""
    data: List[TaskResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# AI Task Generation schemas
class AITaskGenerationRequest(BaseModel):
    """Request to generate tasks from a service using AI."""
    service_id: int
    additional_context: Optional[str] = None


class AIGeneratedTask(BaseModel):
    """An AI-generated task suggestion."""
    title: str
    description: str
    priority: TaskPriority
    estimated_hours: float
    required_skills: List[str]
    reasoning: str


class AITaskGenerationResponse(BaseModel):
    """Response from AI task generation."""
    service_id: int
    service_name: str
    tasks: List[AIGeneratedTask]
    analysis_summary: str


class AIEmployeeRecommendationRequest(BaseModel):
    """Request for AI employee recommendations for a task."""
    task_id: int
    top_n: int = Field(default=3, ge=1, le=10)


class AIEmployeeRecommendation(BaseModel):
    """AI recommendation for a single employee."""
    employee_id: int
    employee_name: str
    overall_score: float
    skill_match_score: float
    availability_score: float
    workload_score: float
    matching_skills: List[str]
    reasoning: str


class AIEmployeeRecommendationResponse(BaseModel):
    """Response with AI employee recommendations."""
    task_id: int
    task_title: str
    recommendations: List[AIEmployeeRecommendation]
