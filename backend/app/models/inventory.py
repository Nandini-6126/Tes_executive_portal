"""
Tessolve Executive Portal - Inventory Models
Models for BOM, Components, Vendors, Orders, and Approvals.
"""

from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey, 
    Numeric, Boolean, Enum as SQLEnum, JSON, Date
)
from sqlalchemy.orm import relationship
import enum

from app.models.base import Base, TimestampMixin


class ComponentType(enum.Enum):
    """Type of component."""
    HARDWARE = "hardware"
    SOFTWARE = "software"
    LICENSE = "license"
    CONSUMABLE = "consumable"
    EQUIPMENT = "equipment"


class ComponentCategory(enum.Enum):
    """Category of component."""
    # Hardware
    SERVER = "server"
    WORKSTATION = "workstation"
    NETWORKING = "networking"
    STORAGE = "storage"
    PERIPHERAL = "peripheral"
    CABLE = "cable"
    # Software
    OPERATING_SYSTEM = "operating_system"
    DATABASE = "database"
    DEVELOPMENT_TOOL = "development_tool"
    TESTING_TOOL = "testing_tool"
    SECURITY = "security"
    CLOUD_SERVICE = "cloud_service"
    # Other
    OTHER = "other"


class RequestStatus(enum.Enum):
    """Status of inventory request."""
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    MANAGER_APPROVED = "manager_approved"
    DEPT_HEAD_APPROVED = "dept_head_approved"
    REJECTED = "rejected"
    ORDERED = "ordered"
    PARTIALLY_DELIVERED = "partially_delivered"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class ApprovalStatus(enum.Enum):
    """Status of approval."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ApprovalLevel(enum.Enum):
    """Level of approval."""
    MANAGER = "manager"
    DEPARTMENT_HEAD = "department_head"
    FINANCE = "finance"
    PROCUREMENT = "procurement"


# Vendor Model
class Vendor(Base, TimestampMixin):
    """Vendor/Supplier information."""
    __tablename__ = "vendors"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    
    # Contact Info
    contact_person = Column(String(255))
    email = Column(String(255))
    phone = Column(String(50))
    website = Column(String(500))
    
    # Address
    address = Column(Text)
    city = Column(String(100))
    country = Column(String(100))
    
    # Business Info
    vendor_type = Column(String(50))  # hardware, software, both
    payment_terms = Column(String(100))  # Net 30, Net 60, etc.
    lead_time_days = Column(Integer, default=7)  # Average delivery time
    rating = Column(Numeric(3, 2))  # 0.00 to 5.00
    
    # Categories they supply
    categories = Column(JSON)  # List of ComponentCategory values
    
    is_active = Column(Boolean, default=True)
    notes = Column(Text)
    
    # Relationships
    components = relationship("ComponentVendor", back_populates="vendor")


# Component Model
class Component(Base, TimestampMixin):
    """Component/Part in inventory."""
    __tablename__ = "components"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    sku = Column(String(100), unique=True)  # Stock Keeping Unit
    part_number = Column(String(100))
    
    # Classification
    component_type = Column(SQLEnum(ComponentType), nullable=False)
    category = Column(SQLEnum(ComponentCategory), nullable=False)
    
    # Description
    description = Column(Text)
    specifications = Column(JSON)  # Technical specs
    
    # Inventory
    quantity_in_stock = Column(Integer, default=0)
    minimum_stock_level = Column(Integer, default=0)
    unit_of_measure = Column(String(50), default="unit")  # unit, license, pack
    
    # Pricing
    unit_price = Column(Numeric(12, 2))
    currency = Column(String(3), default="USD")
    
    # For software
    license_type = Column(String(100))  # perpetual, subscription, open-source
    version = Column(String(50))
    
    is_active = Column(Boolean, default=True)
    
    # Relationships
    vendors = relationship("ComponentVendor", back_populates="component")
    bom_items = relationship("BOMItem", back_populates="component")


# Component-Vendor Association (with pricing)
class ComponentVendor(Base, TimestampMixin):
    """Association between components and vendors with pricing."""
    __tablename__ = "component_vendors"
    
    id = Column(Integer, primary_key=True, index=True)
    component_id = Column(Integer, ForeignKey("components.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    
    # Vendor-specific info
    vendor_sku = Column(String(100))
    vendor_part_number = Column(String(100))
    unit_price = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default="USD")
    lead_time_days = Column(Integer)
    minimum_order_qty = Column(Integer, default=1)
    
    is_preferred = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    component = relationship("Component", back_populates="vendors")
    vendor = relationship("Vendor", back_populates="components")


# Bill of Materials (BOM)
class BOM(Base, TimestampMixin):
    """Bill of Materials for a service/project."""
    __tablename__ = "boms"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    version = Column(String(20), default="1.0")
    
    # Association
    service_id = Column(Integer, ForeignKey("services.id"))
    
    # Metadata
    description = Column(Text)
    created_by_id = Column(Integer, ForeignKey("users.id"))
    
    # AI Analysis
    ai_generated = Column(Boolean, default=False)
    ai_analysis = Column(JSON)  # Store AI recommendations
    
    is_active = Column(Boolean, default=True)
    
    # Relationships
    items = relationship("BOMItem", back_populates="bom", cascade="all, delete-orphan")
    service = relationship("Service", backref="boms")
    created_by = relationship("User", foreign_keys=[created_by_id])


# BOM Line Items
class BOMItem(Base, TimestampMixin):
    """Individual items in a BOM."""
    __tablename__ = "bom_items"
    
    id = Column(Integer, primary_key=True, index=True)
    bom_id = Column(Integer, ForeignKey("boms.id"), nullable=False)
    component_id = Column(Integer, ForeignKey("components.id"))
    
    # If component doesn't exist in system
    custom_name = Column(String(255))
    custom_description = Column(Text)
    custom_type = Column(SQLEnum(ComponentType))
    custom_category = Column(SQLEnum(ComponentCategory))
    
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Numeric(12, 2))
    
    # AI Suggestions
    ai_suggested = Column(Boolean, default=False)
    ai_recommendation = Column(Text)
    suggested_vendors = Column(JSON)  # List of vendor IDs with pricing
    
    notes = Column(Text)
    
    # Relationships
    bom = relationship("BOM", back_populates="items")
    component = relationship("Component", back_populates="bom_items")


# Inventory Request
class InventoryRequest(Base, TimestampMixin):
    """Request for inventory items."""
    __tablename__ = "inventory_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    request_number = Column(String(50), unique=True, nullable=False)
    
    # Association
    service_id = Column(Integer, ForeignKey("services.id"))
    bom_id = Column(Integer, ForeignKey("boms.id"))
    
    # Requester info
    requested_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"))
    
    # Request details
    title = Column(String(255), nullable=False)
    description = Column(Text)
    justification = Column(Text)
    priority = Column(String(20), default="normal")  # low, normal, high, urgent
    
    # Status
    status = Column(SQLEnum(RequestStatus), default=RequestStatus.DRAFT)
    
    # Dates
    required_by_date = Column(Date)
    
    # Totals
    total_amount = Column(Numeric(14, 2))
    currency = Column(String(3), default="USD")
    
    # AI Analysis
    ai_analysis = Column(JSON)
    
    is_deleted = Column(Integer, default=0)
    
    # Relationships
    items = relationship("RequestItem", back_populates="request", cascade="all, delete-orphan")
    approvals = relationship("RequestApproval", back_populates="request", cascade="all, delete-orphan")
    service = relationship("Service", backref="inventory_requests")
    bom = relationship("BOM")
    requested_by = relationship("User", foreign_keys=[requested_by_id])
    department = relationship("Department")


# Request Line Items
class RequestItem(Base, TimestampMixin):
    """Individual items in an inventory request."""
    __tablename__ = "request_items"
    
    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("inventory_requests.id"), nullable=False)
    component_id = Column(Integer, ForeignKey("components.id"))
    vendor_id = Column(Integer, ForeignKey("vendors.id"))
    
    # Item details
    name = Column(String(255), nullable=False)
    description = Column(Text)
    component_type = Column(SQLEnum(ComponentType))
    category = Column(SQLEnum(ComponentCategory))
    
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Numeric(12, 2))
    total_price = Column(Numeric(14, 2))
    currency = Column(String(3), default="USD")
    
    # Delivery
    expected_delivery_date = Column(Date)
    
    # Status
    status = Column(String(50), default="pending")  # pending, ordered, delivered
    
    # AI Info
    ai_suggested_vendor = Column(Boolean, default=False)
    ai_reasoning = Column(Text)
    
    # Relationships
    request = relationship("InventoryRequest", back_populates="items")
    component = relationship("Component")
    vendor = relationship("Vendor")


# Approval Workflow
class RequestApproval(Base, TimestampMixin):
    """Approval record for inventory request."""
    __tablename__ = "request_approvals"
    
    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("inventory_requests.id"), nullable=False)
    
    # Approval details
    level = Column(SQLEnum(ApprovalLevel), nullable=False)
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Status
    status = Column(SQLEnum(ApprovalStatus), default=ApprovalStatus.PENDING)
    
    # Response
    comments = Column(Text)
    approved_at = Column(DateTime(timezone=True))
    
    # Email tracking
    email_sent = Column(Boolean, default=False)
    email_sent_at = Column(DateTime(timezone=True))
    
    # Relationships
    request = relationship("InventoryRequest", back_populates="approvals")
    approver = relationship("User")


# Inventory Transaction Log
class InventoryTransaction(Base, TimestampMixin):
    """Track inventory movements."""
    __tablename__ = "inventory_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    component_id = Column(Integer, ForeignKey("components.id"), nullable=False)
    
    # Transaction details
    transaction_type = Column(String(50), nullable=False)  # in, out, adjustment
    quantity = Column(Integer, nullable=False)
    reference_type = Column(String(50))  # request, order, adjustment
    reference_id = Column(Integer)
    
    # Before/After
    quantity_before = Column(Integer)
    quantity_after = Column(Integer)
    
    # User
    performed_by_id = Column(Integer, ForeignKey("users.id"))
    notes = Column(Text)
    
    # Relationships
    component = relationship("Component")
    performed_by = relationship("User")
