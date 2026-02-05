"""
Tessolve Executive Portal - Service Schemas
Pydantic models for service-related API operations.
"""

from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum


class ServiceStatusEnum(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ProjectStatusEnum(str, Enum):
    PLANNING = "planning"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    COMPLETED = "completed"
    ON_HOLD = "on_hold"
    CANCELLED = "cancelled"


class CustomerTypeEnum(str, Enum):
    NEW = "new"
    EXISTING = "existing"


# ============ Project Schemas ============

class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    status: ProjectStatusEnum = ProjectStatusEnum.PLANNING
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    progress_percentage: int = Field(default=0, ge=0, le=100)


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[ProjectStatusEnum] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    progress_percentage: Optional[int] = Field(None, ge=0, le=100)


class ProjectResponse(ProjectBase):
    id: int
    service_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============ Service Schemas ============

class ServiceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    notes: Optional[str] = None
    client_id: Optional[int] = None  # Link to Client
    customer_name: str = Field(..., min_length=1, max_length=255)
    customer_type: CustomerTypeEnum = CustomerTypeEnum.NEW
    customer_contact: Optional[str] = None
    customer_email: Optional[str] = None
    status: ServiceStatusEnum = ServiceStatusEnum.DRAFT
    engagement_model_id: Optional[int] = None
    service_category_id: Optional[int] = None
    sector_id: Optional[int] = None
    department_id: Optional[int] = None
    contract_value: Optional[Decimal] = None
    currency: str = "USD"
    capex: Optional[Decimal] = None
    opex: Optional[Decimal] = None
    resource_count: int = Field(default=0, ge=0)
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class ServiceCreate(ServiceBase):
    """Schema for creating a new service."""
    technology_ids: List[int] = []
    # CTI fields (optional, for manager/admin)
    cti_strategic_insights: Optional[str] = None
    cti_managerial_notes: Optional[str] = None
    cti_competitive_intel: Optional[str] = None
    cti_risk_assessment: Optional[str] = None
    cti_classification: Optional[str] = "internal"


class ServiceUpdate(BaseModel):
    """Schema for updating an existing service."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    notes: Optional[str] = None
    client_id: Optional[int] = None
    customer_name: Optional[str] = Field(None, min_length=1, max_length=255)
    customer_type: Optional[CustomerTypeEnum] = None
    customer_contact: Optional[str] = None
    customer_email: Optional[str] = None
    status: Optional[ServiceStatusEnum] = None
    engagement_model_id: Optional[int] = None
    service_category_id: Optional[int] = None
    sector_id: Optional[int] = None
    department_id: Optional[int] = None
    contract_value: Optional[Decimal] = None
    currency: Optional[str] = None
    capex: Optional[Decimal] = None
    opex: Optional[Decimal] = None
    resource_count: Optional[int] = Field(None, ge=0)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    technology_ids: Optional[List[int]] = None
    # CTI fields
    cti_strategic_insights: Optional[str] = None
    cti_managerial_notes: Optional[str] = None
    cti_competitive_intel: Optional[str] = None
    cti_risk_assessment: Optional[str] = None
    cti_classification: Optional[str] = None


class ServiceResponse(ServiceBase):
    """Schema for service response (without CTI data)."""
    id: int
    notes: Optional[str] = None
    manager_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    projects: List[ProjectResponse] = []
    technology_ids: List[int] = []
    
    # Related data names (for display)
    client_name: Optional[str] = None
    engagement_model_name: Optional[str] = None
    service_category_name: Optional[str] = None
    sector_name: Optional[str] = None
    department_name: Optional[str] = None
    manager_name: Optional[str] = None
    technology_names: List[str] = []

    class Config:
        from_attributes = True


class ServiceWithCTIResponse(ServiceResponse):
    """Schema for service response with CTI data (Manager/Admin only)."""
    cti_strategic_insights: Optional[str] = None
    cti_managerial_notes: Optional[str] = None
    cti_competitive_intel: Optional[str] = None
    cti_risk_assessment: Optional[str] = None
    cti_classification: Optional[str] = None


# ============ Filter & List Schemas ============

class ServiceFilterRequest(BaseModel):
    """Schema for filtering services."""
    search: Optional[str] = None
    status: Optional[List[ServiceStatusEnum]] = None
    customer_type: Optional[CustomerTypeEnum] = None
    engagement_model_id: Optional[int] = None
    service_category_id: Optional[int] = None
    sector_id: Optional[int] = None
    department_id: Optional[int] = None
    technology_ids: Optional[List[int]] = None
    manager_id: Optional[int] = None
    resource_count_min: Optional[int] = None
    resource_count_max: Optional[int] = None
    start_date_from: Optional[date] = None
    start_date_to: Optional[date] = None
    # Pagination
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    # Sorting
    sort_field: str = "created_at"
    sort_direction: str = "desc"


class ServiceListResponse(BaseModel):
    """Schema for paginated service list response."""
    success: bool = True
    data: List[ServiceResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ============ Analytics Schemas ============

class ServiceAnalytics(BaseModel):
    """Dashboard analytics for services."""
    total_services: int = 0
    active_services: int = 0
    completed_services: int = 0
    on_hold_services: int = 0
    draft_services: int = 0
    total_contract_value: Decimal = Decimal("0")
    total_resources: int = 0
    new_customers: int = 0
    existing_customers: int = 0
    services_by_status: dict = {}
    services_by_sector: dict = {}
    services_by_category: dict = {}


class DashboardAnalytics(BaseModel):
    """Complete dashboard analytics."""
    services: ServiceAnalytics
    # Add more analytics sections as needed
