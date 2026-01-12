"""
Tessolve Executive Portal - User & Role Models
Implements role-based access control with permission system.
"""

from datetime import datetime, timezone
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, 
    ForeignKey, Table, Text
)
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.models.base import Base, TimestampMixin


# Association table for Role <-> Permission many-to-many
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", Integer, ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
)


class Permission(Base):
    """
    Permission model for granular access control.
    Format: module.action (e.g., 'services.read', 'cti.write', 'admin.users')
    """
    
    __tablename__ = "permissions"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    name: Mapped[Optional[str]] = mapped_column(String(200))
    module: Mapped[Optional[str]] = mapped_column(String(50), index=True)  # services, products, analytics, admin, cti
    description: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc)
    )
    
    # Relationships
    roles: Mapped[List["Role"]] = relationship(
        "Role",
        secondary=role_permissions,
        back_populates="permissions",
    )
    
    def __repr__(self) -> str:
        return f"<Permission {self.code}>"


class Role(Base, TimestampMixin):
    """
    Role model for user grouping.
    Roles: admin, manager, engineer
    """
    
    __tablename__ = "roles"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    display_name: Mapped[Optional[str]] = mapped_column(String(100))
    description: Mapped[Optional[str]] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Relationships
    users: Mapped[List["User"]] = relationship("User", back_populates="role")
    permissions: Mapped[List["Permission"]] = relationship(
        "Permission",
        secondary=role_permissions,
        back_populates="roles",
    )
    
    def has_permission(self, permission_code: str) -> bool:
        """Check if role has a specific permission."""
        return any(p.code == permission_code for p in self.permissions)
    
    def get_permission_codes(self) -> List[str]:
        """Get list of all permission codes for this role."""
        return [p.code for p in self.permissions]
    
    def __repr__(self) -> str:
        return f"<Role {self.name}>"


class User(Base, TimestampMixin):
    """
    User model with authentication and authorization fields.
    Includes account lockout and security tracking.
    """
    
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(200))
    
    # Role relationship
    role_id: Mapped[int] = mapped_column(Integer, ForeignKey("roles.id"), nullable=False)
    role: Mapped["Role"] = relationship("Role", back_populates="users")
    
    # Department (optional)
    department_id: Mapped[Optional[int]] = mapped_column(
        Integer, 
        ForeignKey("departments.id"),
        nullable=True
    )
    
    # Account status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_locked: Mapped[bool] = mapped_column(Boolean, default=False)
    failed_attempts: Mapped[int] = mapped_column(Integer, default=0)
    locked_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Security tracking
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    password_changed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    def has_permission(self, permission_code: str) -> bool:
        """Check if user has a specific permission through their role."""
        if not self.is_active or self.is_locked:
            return False
        return self.role.has_permission(permission_code)
    
    def get_permissions(self) -> List[str]:
        """Get all permission codes for this user."""
        if not self.role:
            return []
        return self.role.get_permission_codes()
    
    def is_account_locked(self) -> bool:
        """Check if account is currently locked."""
        if not self.is_locked:
            return False
        if self.locked_until and datetime.now(timezone.utc) > self.locked_until:
            return False  # Lock has expired
        return True
    
    def record_failed_login(self, max_attempts: int, lockout_minutes: int) -> bool:
        """
        Record a failed login attempt.
        Returns True if account is now locked.
        """
        from datetime import timedelta
        
        self.failed_attempts += 1
        if self.failed_attempts >= max_attempts:
            self.is_locked = True
            self.locked_until = datetime.now(timezone.utc) + timedelta(minutes=lockout_minutes)
            return True
        return False
    
    def reset_failed_attempts(self) -> None:
        """Reset failed login counter on successful login."""
        self.failed_attempts = 0
        self.is_locked = False
        self.locked_until = None
        self.last_login = datetime.now(timezone.utc)
    
    def __repr__(self) -> str:
        return f"<User {self.username} ({self.role.name if self.role else 'no role'})>"
