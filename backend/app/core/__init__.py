"""Core module - security, permissions, and exceptions."""

from app.core.security import (
    PasswordHandler,
    JWTHandler,
    create_token_payload,
)
from app.core.permissions import (
    Permissions,
    ROLE_PERMISSIONS,
    get_permissions_for_role,
    check_permission,
    check_any_permission,
    check_all_permissions,
    PermissionChecker,
    require_permissions,
    is_admin,
    is_manager_or_above,
    can_access_cti,
)
from app.core.exceptions import (
    TessolveException,
    AuthenticationError,
    InvalidCredentialsError,
    AccountLockedError,
    AccountDisabledError,
    TokenExpiredError,
    InvalidTokenError,
    PermissionDeniedError,
    NotFoundError,
    ValidationError,
    ConflictError,
    RateLimitError,
    InternalError,
)

__all__ = [
    # Security
    "PasswordHandler",
    "JWTHandler",
    "create_token_payload",
    # Permissions
    "Permissions",
    "ROLE_PERMISSIONS",
    "get_permissions_for_role",
    "check_permission",
    "check_any_permission",
    "check_all_permissions",
    "PermissionChecker",
    "require_permissions",
    "is_admin",
    "is_manager_or_above",
    "can_access_cti",
    # Exceptions
    "TessolveException",
    "AuthenticationError",
    "InvalidCredentialsError",
    "AccountLockedError",
    "AccountDisabledError",
    "TokenExpiredError",
    "InvalidTokenError",
    "PermissionDeniedError",
    "NotFoundError",
    "ValidationError",
    "ConflictError",
    "RateLimitError",
    "InternalError",
]
