"""
Client Inquiry Schemas - Pydantic models for Inquiry API.
"""

from datetime import datetime, date
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, EmailStr, Field

from app.models.inquiry import InquiryStatus, InquiryPriority, InquirySource


class InquiryActivityBase(BaseModel):
    """Base schema for inquiry activity."""
    activity_type: str
    title: str
    description: Optional[str] = None


class InquiryActivityCreate(InquiryActivityBase):
    """Schema for creating an activity."""
    pass


class InquiryActivityResponse(InquiryActivityBase):
    """Schema for activity response."""
    id: int
    inquiry_id: int
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    performed_by_id: int
    performed_by_name: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class InquiryBase(BaseModel):
    """Base inquiry schema."""
    company_name: str = Field(..., min_length=1, max_length=255)
    contact_person: str = Field(..., min_length=1, max_length=255)
    contact_email: EmailStr
    contact_phone: Optional[str] = None
    company_website: Optional[str] = None
    company_size: Optional[str] = None
    industry: Optional[str] = None
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    requirements: Optional[str] = None
    service_type: Optional[str] = None
    priority: InquiryPriority = InquiryPriority.MEDIUM
    source: InquirySource = InquirySource.OTHER
    estimated_budget: Optional[Decimal] = None
    currency: str = "USD"
    estimated_value: Optional[Decimal] = None
    expected_start_date: Optional[date] = None
    decision_date: Optional[date] = None
    next_follow_up_date: Optional[date] = None
    win_probability: int = Field(default=50, ge=0, le=100)
    internal_notes: Optional[str] = None


class InquiryCreate(InquiryBase):
    """Schema for creating an inquiry."""
    assigned_to_id: Optional[int] = None


class InquiryUpdate(BaseModel):
    """Schema for updating an inquiry."""
    company_name: Optional[str] = None
    contact_person: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    company_website: Optional[str] = None
    company_size: Optional[str] = None
    industry: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    service_type: Optional[str] = None
    status: Optional[InquiryStatus] = None
    priority: Optional[InquiryPriority] = None
    source: Optional[InquirySource] = None
    estimated_budget: Optional[Decimal] = None
    currency: Optional[str] = None
    estimated_value: Optional[Decimal] = None
    expected_start_date: Optional[date] = None
    decision_date: Optional[date] = None
    next_follow_up_date: Optional[date] = None
    last_contact_date: Optional[date] = None
    assigned_to_id: Optional[int] = None
    win_probability: Optional[int] = Field(None, ge=0, le=100)
    internal_notes: Optional[str] = None
    loss_reason: Optional[str] = None


class InquiryResponse(InquiryBase):
    """Schema for inquiry response."""
    id: int
    inquiry_number: str
    status: InquiryStatus
    last_contact_date: Optional[date] = None
    assigned_to_id: Optional[int] = None
    assigned_to_name: Optional[str] = None
    created_by_id: int
    created_by_name: Optional[str] = None
    converted_to_client_id: Optional[int] = None
    converted_to_service_id: Optional[int] = None
    converted_at: Optional[datetime] = None
    is_converted: bool = False
    loss_reason: Optional[str] = None
    activities_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class InquiryDetailResponse(InquiryResponse):
    """Schema for detailed inquiry response with activities."""
    activities: List[InquiryActivityResponse] = []


class InquiryListResponse(BaseModel):
    """Schema for list of inquiries."""
    data: List[InquiryResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class InquiryConvertRequest(BaseModel):
    """Schema for converting inquiry to client/service."""
    create_client: bool = True
    create_service: bool = False
    service_name: Optional[str] = None
    service_description: Optional[str] = None
    contract_value: Optional[Decimal] = None


class InquiryStats(BaseModel):
    """Statistics for inquiries."""
    total_inquiries: int = 0
    new_inquiries: int = 0
    in_progress: int = 0
    won: int = 0
    lost: int = 0
    total_estimated_value: Decimal = Decimal("0")
    total_won_value: Decimal = Decimal("0")
    conversion_rate: float = 0.0
    avg_win_probability: float = 0.0
    by_status: dict = {}
    by_source: dict = {}
    by_priority: dict = {}
