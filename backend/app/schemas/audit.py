"""
Tessolve Executive Portal - Audit Log Schemas
Pydantic models for audit log queries and responses.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AuditLogBase(BaseModel):
    """Base audit log schema."""
    
    action: str
    module: Optional[str] = None
    resource_type: Optional[str] = None
    resource_id: Optional[int] = None
    description: Optional[str] = None


class AuditLogResponse(AuditLogBase):
    """Audit log response schema."""
    
    id: int
    user_id: Optional[int] = None
    username: Optional[str] = None
    user_role: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None
    extra_data: Optional[Dict[str, Any]] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class AuditLogFilterRequest(BaseModel):
    """Request schema for filtering audit logs."""
    
    user_id: Optional[int] = None
    action: Optional[List[str]] = None
    module: Optional[List[str]] = None
    resource_type: Optional[str] = None
    resource_id: Optional[int] = None
    ip_address: Optional[str] = None
    search: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    
    # Pagination
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    
    # Sorting
    sort_field: str = Field(default="created_at")
    sort_direction: str = Field(default="desc", pattern="^(asc|desc)$")


class AuditLogListResponse(BaseModel):
    """Response for audit log listing."""
    
    success: bool = True
    data: List[AuditLogResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class AuditLogStats(BaseModel):
    """Audit log statistics for dashboard."""
    
    total_logs: int
    logs_today: int
    login_attempts: int
    failed_logins: int
    cti_accesses: int
    actions_by_module: Dict[str, int]
    actions_by_type: Dict[str, int]
