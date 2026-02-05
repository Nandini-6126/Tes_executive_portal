"""
Employee Schemas - Pydantic models for Employee API.
"""

from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

from app.models.employee import AvailabilityStatus, SkillProficiency


class SkillBase(BaseModel):
    """Base skill schema."""
    name: str = Field(..., min_length=1, max_length=100)
    category: Optional[str] = None
    description: Optional[str] = None


class SkillCreate(SkillBase):
    """Schema for creating a skill."""
    pass


class SkillResponse(SkillBase):
    """Schema for skill response."""
    id: int
    is_active: bool
    
    class Config:
        from_attributes = True


class EmployeeSkillInfo(BaseModel):
    """Schema for employee skill with proficiency."""
    skill_id: int
    skill_name: str
    proficiency: SkillProficiency = SkillProficiency.INTERMEDIATE
    years_experience: float = 0


class EmployeeBase(BaseModel):
    """Base employee schema."""
    employee_id: Optional[str] = Field(None, max_length=50)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    weekly_capacity_hours: int = Field(default=40, ge=1, le=168)
    hire_date: Optional[date] = None


class EmployeeCreate(EmployeeBase):
    """Schema for creating an employee."""
    skills: Optional[List[EmployeeSkillInfo]] = None


class EmployeeUpdate(BaseModel):
    """Schema for updating an employee."""
    employee_id: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    weekly_capacity_hours: Optional[int] = None
    hire_date: Optional[date] = None
    availability_status: Optional[AvailabilityStatus] = None
    is_active: Optional[bool] = None
    skills: Optional[List[EmployeeSkillInfo]] = None


class EmployeeResponse(EmployeeBase):
    """Schema for employee response."""
    id: int
    full_name: str
    availability_status: AvailabilityStatus
    current_workload_hours: float
    available_hours: float
    workload_percentage: float
    is_active: bool
    manager_id: int
    manager_name: Optional[str] = None
    skills: List[EmployeeSkillInfo] = []
    active_tasks_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class EmployeeListResponse(BaseModel):
    """Schema for list of employees."""
    data: List[EmployeeResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class EmployeeBulkImport(BaseModel):
    """Schema for bulk importing employees."""
    employees: List[EmployeeCreate]


class EmployeeBulkImportResult(BaseModel):
    """Result of bulk import operation."""
    success_count: int
    error_count: int
    errors: List[dict] = []


# AI Recommendation schemas
class EmployeeRecommendation(BaseModel):
    """AI recommendation for task assignment."""
    employee: EmployeeResponse
    overall_score: float = Field(..., ge=0, le=100)
    skill_match_score: float = Field(..., ge=0, le=100)
    availability_score: float = Field(..., ge=0, le=100)
    workload_score: float = Field(..., ge=0, le=100)
    matching_skills: List[str] = []
    reasoning: str
