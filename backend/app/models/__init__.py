"""
Tessolve Executive Portal - Database Models
Export all models for easy importing.
"""

from app.models.base import Base, TimestampMixin, SoftDeleteMixin
from app.models.user import User, Role, Permission, role_permissions
from app.models.user_settings import UserSettings
from app.models.master_data import (
    Sector,
    Technology,
    EngagementModel,
    ServiceCategory,
    Department,
)
from app.models.audit import AuditLog, AuditAction, AuditModule
from app.models.service import Service, Project, ServiceStatus, ProjectStatus, CustomerType
from app.models.inventory import (
    Vendor, Component, ComponentVendor, BOM, BOMItem,
    InventoryRequest, RequestItem, RequestApproval, InventoryTransaction,
    ComponentType, ComponentCategory, RequestStatus, ApprovalStatus, ApprovalLevel
)

__all__ = [
    # Base
    "Base",
    "TimestampMixin",
    "SoftDeleteMixin",
    # User & Auth
    "User",
    "Role",
    "Permission",
    "role_permissions",
    "UserSettings",
    # Master Data
    "Sector",
    "Technology",
    "EngagementModel",
    "ServiceCategory",
    "Department",
    # Audit
    "AuditLog",
    "AuditAction",
    "AuditModule",
    # Services
    "Service",
    "Project",
    "ServiceStatus",
    "ProjectStatus",
    "CustomerType",
    # Inventory
    "Vendor",
    "Component",
    "ComponentVendor",
    "BOM",
    "BOMItem",
    "InventoryRequest",
    "RequestItem",
    "RequestApproval",
    "InventoryTransaction",
    "ComponentType",
    "ComponentCategory",
    "RequestStatus",
    "ApprovalStatus",
    "ApprovalLevel",
]
