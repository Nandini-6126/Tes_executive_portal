"""
Tessolve Executive Portal - Custom Exceptions
Centralized exception definitions and handlers.
"""

from typing import Any, Dict, Optional, List
from fastapi import HTTPException, status


class TessolveException(HTTPException):
    """Base exception for Tessolve portal."""
    
    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        details: Optional[List[Dict[str, Any]]] = None,
    ):
        detail = {
            "code": code,
            "message": message,
        }
        if details:
            detail["details"] = details
        
        super().__init__(status_code=status_code, detail=detail)


class AuthenticationError(TessolveException):
    """Raised when authentication fails."""
    
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="UNAUTHORIZED",
            message=message,
        )


class InvalidCredentialsError(AuthenticationError):
    """Raised when username/password is invalid."""
    
    def __init__(self):
        super().__init__(message="Invalid username or password")


class AccountLockedError(AuthenticationError):
    """Raised when account is locked due to failed attempts."""
    
    def __init__(self, locked_until: Optional[str] = None):
        message = "Account is locked due to too many failed login attempts"
        if locked_until:
            message += f". Try again after {locked_until}"
        super().__init__(message=message)


class AccountDisabledError(AuthenticationError):
    """Raised when account is disabled."""
    
    def __init__(self):
        super().__init__(message="Account is disabled. Please contact administrator.")


class TokenExpiredError(AuthenticationError):
    """Raised when JWT token has expired."""
    
    def __init__(self):
        super().__init__(message="Token has expired. Please login again.")


class InvalidTokenError(AuthenticationError):
    """Raised when JWT token is invalid."""
    
    def __init__(self):
        super().__init__(message="Invalid authentication token")


class PermissionDeniedError(TessolveException):
    """Raised when user lacks required permission."""
    
    def __init__(
        self, 
        message: str = "You do not have permission to perform this action",
        required_permissions: Optional[List[str]] = None,
    ):
        details = None
        if required_permissions:
            details = [{"required_permissions": required_permissions}]
        
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            code="FORBIDDEN",
            message=message,
            details=details,
        )


class NotFoundError(TessolveException):
    """Raised when a resource is not found."""
    
    def __init__(self, resource: str, identifier: Any = None):
        message = f"{resource} not found"
        if identifier:
            message = f"{resource} with ID '{identifier}' not found"
        
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            code="NOT_FOUND",
            message=message,
        )


class ValidationError(TessolveException):
    """Raised when input validation fails."""
    
    def __init__(
        self,
        message: str = "Validation failed",
        errors: Optional[List[Dict[str, str]]] = None,
    ):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code="VALIDATION_ERROR",
            message=message,
            details=errors,
        )


class ConflictError(TessolveException):
    """Raised when there's a conflict (e.g., duplicate entry)."""
    
    def __init__(self, message: str = "Resource already exists"):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            code="CONFLICT",
            message=message,
        )


class RateLimitError(TessolveException):
    """Raised when rate limit is exceeded."""
    
    def __init__(self, retry_after: Optional[int] = None):
        message = "Rate limit exceeded"
        if retry_after:
            message += f". Retry after {retry_after} seconds"
        
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            code="RATE_LIMITED",
            message=message,
        )


class InternalError(TessolveException):
    """Raised for internal server errors."""
    
    def __init__(self, message: str = "An internal error occurred"):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL_ERROR",
            message=message,
        )
