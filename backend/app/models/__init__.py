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
from app.models.client import Client
from app.models.service import Service, Project, ServiceStatus, ProjectStatus, CustomerType
from app.models.employee import Employee, Skill, AvailabilityStatus, SkillProficiency, employee_skills
from app.models.task import Task, TaskAssignment, TaskStatus, TaskPriority
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
    # Client
    "Client",
    # Services
    "Service",
    "Project",
    "ServiceStatus",
    "ProjectStatus",
    "CustomerType",
    # Employee & Skills
    "Employee",
    "Skill",
    "AvailabilityStatus",
    "SkillProficiency",
    "employee_skills",
    # Tasks
    "Task",
    "TaskAssignment",
    "TaskStatus",
    "TaskPriority",
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
