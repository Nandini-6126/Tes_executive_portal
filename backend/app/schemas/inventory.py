"""
Tessolve Executive Portal - Inventory Schemas
Pydantic schemas for inventory API validation.
"""

from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


# Enums
class ComponentTypeEnum(str, Enum):
    HARDWARE = "hardware"
    SOFTWARE = "software"
    LICENSE = "license"
    CONSUMABLE = "consumable"
    EQUIPMENT = "equipment"


class ComponentCategoryEnum(str, Enum):
    SERVER = "server"
    WORKSTATION = "workstation"
    NETWORKING = "networking"
    STORAGE = "storage"
    PERIPHERAL = "peripheral"
    CABLE = "cable"
    OPERATING_SYSTEM = "operating_system"
    DATABASE = "database"
    DEVELOPMENT_TOOL = "development_tool"
    TESTING_TOOL = "testing_tool"
    SECURITY = "security"
    CLOUD_SERVICE = "cloud_service"
    OTHER = "other"


class RequestStatusEnum(str, Enum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    MANAGER_APPROVED = "manager_approved"
    DEPT_HEAD_APPROVED = "dept_head_approved"
    REJECTED = "rejected"
    ORDERED = "ordered"
    PARTIALLY_DELIVERED = "partially_delivered"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class ApprovalStatusEnum(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ApprovalLevelEnum(str, Enum):
    MANAGER = "manager"
    DEPARTMENT_HEAD = "department_head"
    FINANCE = "finance"
    PROCUREMENT = "procurement"


# Vendor Schemas
class VendorBase(BaseModel):
    name: str
    code: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    vendor_type: Optional[str] = None
    payment_terms: Optional[str] = None
    lead_time_days: int = 7
    rating: Optional[Decimal] = None
    categories: Optional[List[str]] = None
    notes: Optional[str] = None


class VendorCreate(VendorBase):
    pass


class VendorUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    vendor_type: Optional[str] = None
    payment_terms: Optional[str] = None
    lead_time_days: Optional[int] = None
    rating: Optional[Decimal] = None
    categories: Optional[List[str]] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class VendorResponse(VendorBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Component Schemas
class ComponentBase(BaseModel):
    name: str
    sku: Optional[str] = None
    part_number: Optional[str] = None
    component_type: ComponentTypeEnum
    category: ComponentCategoryEnum
    description: Optional[str] = None
    specifications: Optional[Dict[str, Any]] = None
    quantity_in_stock: int = 0
    minimum_stock_level: int = 0
    unit_of_measure: str = "unit"
    unit_price: Optional[Decimal] = None
    currency: str = "USD"
    license_type: Optional[str] = None
    version: Optional[str] = None


class ComponentCreate(ComponentBase):
    pass


class ComponentUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    part_number: Optional[str] = None
    component_type: Optional[ComponentTypeEnum] = None
    category: Optional[ComponentCategoryEnum] = None
    description: Optional[str] = None
    specifications: Optional[Dict[str, Any]] = None
    quantity_in_stock: Optional[int] = None
    minimum_stock_level: Optional[int] = None
    unit_of_measure: Optional[str] = None
    unit_price: Optional[Decimal] = None
    currency: Optional[str] = None
    license_type: Optional[str] = None
    version: Optional[str] = None
    is_active: Optional[bool] = None


class ComponentResponse(ComponentBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    vendors: Optional[List[Dict[str, Any]]] = None

    class Config:
        from_attributes = True


# BOM Schemas
class BOMItemBase(BaseModel):
    component_id: Optional[int] = None
    custom_name: Optional[str] = None
    custom_description: Optional[str] = None
    custom_type: Optional[ComponentTypeEnum] = None
    custom_category: Optional[ComponentCategoryEnum] = None
    quantity: int = 1
    unit_price: Optional[Decimal] = None
    notes: Optional[str] = None


class BOMItemCreate(BOMItemBase):
    pass


class BOMItemResponse(BOMItemBase):
    id: int
    bom_id: int
    ai_suggested: bool
    ai_recommendation: Optional[str] = None
    suggested_vendors: Optional[List[Dict[str, Any]]] = None
    component: Optional[ComponentResponse] = None
    created_at: datetime

    class Config:
        from_attributes = True


class BOMBase(BaseModel):
    name: str
    version: str = "1.0"
    service_id: Optional[int] = None
    description: Optional[str] = None


class BOMCreate(BOMBase):
    items: Optional[List[BOMItemCreate]] = None


class BOMResponse(BOMBase):
    id: int
    created_by_id: Optional[int] = None
    ai_generated: bool
    ai_analysis: Optional[Dict[str, Any]] = None
    is_active: bool
    items: List[BOMItemResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Inventory Request Schemas
class RequestItemBase(BaseModel):
    component_id: Optional[int] = None
    vendor_id: Optional[int] = None
    name: str
    description: Optional[str] = None
    component_type: Optional[ComponentTypeEnum] = None
    category: Optional[ComponentCategoryEnum] = None
    quantity: int = 1
    unit_price: Optional[Decimal] = None


class RequestItemCreate(RequestItemBase):
    pass


class RequestItemResponse(RequestItemBase):
    id: int
    request_id: int
    total_price: Optional[Decimal] = None
    currency: str
    expected_delivery_date: Optional[date] = None
    status: str
    ai_suggested_vendor: bool
    ai_reasoning: Optional[str] = None
    vendor: Optional[VendorResponse] = None
    created_at: datetime

    class Config:
        from_attributes = True


class InventoryRequestBase(BaseModel):
    service_id: Optional[int] = None
    bom_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    justification: Optional[str] = None
    priority: str = "normal"
    required_by_date: Optional[date] = None


class InventoryRequestCreate(InventoryRequestBase):
    items: Optional[List[RequestItemCreate]] = None


class InventoryRequestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    justification: Optional[str] = None
    priority: Optional[str] = None
    required_by_date: Optional[date] = None
    status: Optional[RequestStatusEnum] = None


class ApprovalResponse(BaseModel):
    id: int
    level: ApprovalLevelEnum
    approver_id: int
    approver_name: Optional[str] = None
    status: ApprovalStatusEnum
    comments: Optional[str] = None
    approved_at: Optional[datetime] = None
    email_sent: bool
    created_at: datetime

    class Config:
        from_attributes = True


class InventoryRequestResponse(InventoryRequestBase):
    id: int
    request_number: str
    requested_by_id: int
    requested_by_name: Optional[str] = None
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    status: RequestStatusEnum
    total_amount: Optional[Decimal] = None
    currency: str
    ai_analysis: Optional[Dict[str, Any]] = None
    items: List[RequestItemResponse] = []
    approvals: List[ApprovalResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# AI Analysis Schemas
class AIAnalysisRequest(BaseModel):
    service_id: int
    description: Optional[str] = None
    requirements: Optional[str] = None


class AIAnalysisResponse(BaseModel):
    success: bool
    analysis: Dict[str, Any]
    recommended_components: List[Dict[str, Any]]
    estimated_cost: Optional[Decimal] = None
    estimated_delivery_days: Optional[int] = None


class BOMUploadRequest(BaseModel):
    service_id: Optional[int] = None
    name: str
    file_content: str  # Base64 encoded file content
    file_type: str  # csv, xlsx, json


class VendorSuggestionRequest(BaseModel):
    component_name: str
    component_type: ComponentTypeEnum
    category: ComponentCategoryEnum
    quantity: int = 1
    required_by_date: Optional[date] = None


class VendorSuggestionResponse(BaseModel):
    vendors: List[Dict[str, Any]]
    ai_recommendation: str
    best_option: Optional[Dict[str, Any]] = None


# Report Schemas
class InventoryReportRequest(BaseModel):
    report_type: str  # stock_levels, low_stock, requests_summary, vendor_analysis
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    filters: Optional[Dict[str, Any]] = None


class InventoryReportResponse(BaseModel):
    report_type: str
    generated_at: datetime
    data: Dict[str, Any]
    summary: str


# Approval Action
class ApprovalAction(BaseModel):
    action: ApprovalStatusEnum
    comments: Optional[str] = None


# Email Request
class SendApprovalEmailRequest(BaseModel):
    request_id: int
    level: ApprovalLevelEnum
