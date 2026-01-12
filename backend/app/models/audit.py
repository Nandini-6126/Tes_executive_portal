"""
Tessolve Executive Portal - Audit Log Model
Ultra-secure, append-only audit logging for compliance.
"""

from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class AuditLog(Base):
    """
    Immutable audit log for tracking all system actions.
    
    Action Types:
    - AUTH: login_success, login_failure, logout, password_change, account_locked
    - DATA: create, read, update, delete, export
    - CTI: cti_access, cti_create, cti_update, cti_export
    - ADMIN: role_change, permission_change, user_create, user_deactivate
    """
    
    __tablename__ = "audit_logs"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # WHO - User information (denormalized for persistence)
    user_id: Mapped[Optional[int]] = mapped_column(
        Integer, 
        ForeignKey("users.id"),
        nullable=True,  # Allow null for failed login attempts with unknown user
        index=True
    )
    username: Mapped[Optional[str]] = mapped_column(String(100))  # Preserved even if user deleted
    user_role: Mapped[Optional[str]] = mapped_column(String(50))  # Preserved even if role changed
    ip_address: Mapped[Optional[str]] = mapped_column(String(45))  # IPv4 or IPv6
    user_agent: Mapped[Optional[str]] = mapped_column(Text)
    
    # WHAT - Action details
    action: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    module: Mapped[Optional[str]] = mapped_column(String(50), index=True)  # auth, services, products, admin, cti
    resource_type: Mapped[Optional[str]] = mapped_column(String(100))  # service, product, user, cti_data
    resource_id: Mapped[Optional[int]] = mapped_column(Integer)
    
    # DETAILS - Context and changes (using JSON for SQLite compatibility)
    description: Mapped[Optional[str]] = mapped_column(Text)  # Human-readable description
    old_values: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON)  # Previous state
    new_values: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON)  # New state
    extra_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON)  # Additional context
    
    # WHEN - Timestamp (no updated_at - records are immutable)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True
    )
    
    @classmethod
    def create_log(
        cls,
        action: str,
        module: Optional[str] = None,
        user_id: Optional[int] = None,
        username: Optional[str] = None,
        user_role: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[int] = None,
        description: Optional[str] = None,
        old_values: Optional[Dict[str, Any]] = None,
        new_values: Optional[Dict[str, Any]] = None,
        extra_data: Optional[Dict[str, Any]] = None,
    ) -> "AuditLog":
        """Factory method to create audit log entries."""
        return cls(
            action=action,
            module=module,
            user_id=user_id,
            username=username,
            user_role=user_role,
            ip_address=ip_address,
            user_agent=user_agent,
            resource_type=resource_type,
            resource_id=resource_id,
            description=description,
            old_values=old_values,
            new_values=new_values,
            extra_data=extra_data,
        )
    
    def __repr__(self) -> str:
        return f"<AuditLog {self.id}: {self.action} by {self.username}>"


# Constants for action types
class AuditAction:
    """Enumeration of audit action types."""
    
    # Authentication
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILURE = "login_failure"
    LOGOUT = "logout"
    PASSWORD_CHANGE = "password_change"
    ACCOUNT_LOCKED = "account_locked"
    TOKEN_REFRESH = "token_refresh"
    
    # CRUD Operations
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    EXPORT = "export"
    
    # CTI (Customer/Technical Intelligence)
    CTI_ACCESS = "cti_access"
    CTI_CREATE = "cti_create"
    CTI_UPDATE = "cti_update"
    CTI_EXPORT = "cti_export"
    
    # Admin Actions
    ROLE_CHANGE = "role_change"
    PERMISSION_CHANGE = "permission_change"
    USER_CREATE = "user_create"
    USER_DEACTIVATE = "user_deactivate"
    USER_UNLOCK = "user_unlock"


class AuditModule:
    """Enumeration of audit modules."""
    
    AUTH = "auth"
    SERVICES = "services"
    PRODUCTS = "products"
    ANALYTICS = "analytics"
    ADMIN = "admin"
    CTI = "cti"
