"""Schemas module - Pydantic models for request/response validation."""

from app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    UserInfo,
    LoginResponse,
    LogoutResponse,
    PasswordChangeRequest,
    PasswordChangeResponse,
    CurrentUserResponse,
)
from app.schemas.user import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserInDB,
    UserResponse,
    UserListResponse,
    RoleBase,
    RoleResponse,
    RoleListResponse,
)
from app.schemas.audit import (
    AuditLogBase,
    AuditLogResponse,
    AuditLogFilterRequest,
    AuditLogListResponse,
    AuditLogStats,
)

__all__ = [
    # Auth
    "LoginRequest",
    "TokenResponse",
    "RefreshTokenRequest",
    "UserInfo",
    "LoginResponse",
    "LogoutResponse",
    "PasswordChangeRequest",
    "PasswordChangeResponse",
    "CurrentUserResponse",
    # User
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserInDB",
    "UserResponse",
    "UserListResponse",
    "RoleBase",
    "RoleResponse",
    "RoleListResponse",
    # Audit
    "AuditLogBase",
    "AuditLogResponse",
    "AuditLogFilterRequest",
    "AuditLogListResponse",
    "AuditLogStats",
]
