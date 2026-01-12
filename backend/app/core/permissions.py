"""
Tessolve Executive Portal - Permissions Module
Role-Based Access Control (RBAC) decorators and utilities.
"""

from functools import wraps
from typing import List, Callable, Any
from fastapi import HTTPException, status


# Permission code constants
class Permissions:
    """All permission codes used in the system."""
    
    # Services Module
    SERVICES_READ = "services.read"
    SERVICES_WRITE = "services.write"
    SERVICES_DELETE = "services.delete"
    
    # Products Module
    PRODUCTS_READ = "products.read"
    PRODUCTS_WRITE = "products.write"
    PRODUCTS_DELETE = "products.delete"
    
    # CTI (Restricted)
    CTI_READ = "cti.read"
    CTI_WRITE = "cti.write"
    CTI_PRODUCTS_READ = "cti_products.read"
    CTI_PRODUCTS_WRITE = "cti_products.write"
    
    # Analytics
    ANALYTICS_READ = "analytics.read"
    ANALYTICS_EXECUTIVE = "analytics.executive"
    
    # Admin
    ADMIN_USERS = "admin.users"
    ADMIN_ROLES = "admin.roles"
    ADMIN_MASTER_DATA = "admin.master_data"
    ADMIN_AUDIT_LOGS = "admin.audit_logs"


# Role-to-permissions mapping (source of truth)
ROLE_PERMISSIONS = {
    "admin": [
        # Full access to everything
        Permissions.SERVICES_READ,
        Permissions.SERVICES_WRITE,
        Permissions.SERVICES_DELETE,
        Permissions.PRODUCTS_READ,
        Permissions.PRODUCTS_WRITE,
        Permissions.PRODUCTS_DELETE,
        Permissions.CTI_READ,
        Permissions.CTI_WRITE,
        Permissions.CTI_PRODUCTS_READ,
        Permissions.CTI_PRODUCTS_WRITE,
        Permissions.ANALYTICS_READ,
        Permissions.ANALYTICS_EXECUTIVE,
        Permissions.ADMIN_USERS,
        Permissions.ADMIN_ROLES,
        Permissions.ADMIN_MASTER_DATA,
        Permissions.ADMIN_AUDIT_LOGS,
    ],
    "manager": [
        # Strategic access - includes CTI
        Permissions.SERVICES_READ,
        Permissions.SERVICES_WRITE,
        Permissions.SERVICES_DELETE,
        Permissions.PRODUCTS_READ,
        Permissions.PRODUCTS_WRITE,
        Permissions.CTI_READ,
        Permissions.CTI_WRITE,
        Permissions.CTI_PRODUCTS_READ,
        Permissions.ANALYTICS_READ,
        Permissions.ANALYTICS_EXECUTIVE,
    ],
    "engineer": [
        # Operational access - no CTI
        Permissions.SERVICES_READ,
        Permissions.SERVICES_WRITE,
        Permissions.PRODUCTS_READ,
        Permissions.PRODUCTS_WRITE,
        Permissions.ANALYTICS_READ,  # Limited analytics
    ],
}


def get_permissions_for_role(role_name: str) -> List[str]:
    """Get all permission codes for a given role."""
    return ROLE_PERMISSIONS.get(role_name.lower(), [])


def check_permission(user_permissions: List[str], required_permission: str) -> bool:
    """
    Check if user has a specific permission.
    
    Args:
        user_permissions: List of user's permission codes
        required_permission: Permission code to check
        
    Returns:
        True if user has permission, False otherwise
    """
    return required_permission in user_permissions


def check_any_permission(user_permissions: List[str], required_permissions: List[str]) -> bool:
    """
    Check if user has any of the required permissions.
    
    Args:
        user_permissions: List of user's permission codes
        required_permissions: List of permission codes (any match succeeds)
        
    Returns:
        True if user has at least one permission, False otherwise
    """
    return any(p in user_permissions for p in required_permissions)


def check_all_permissions(user_permissions: List[str], required_permissions: List[str]) -> bool:
    """
    Check if user has all required permissions.
    
    Args:
        user_permissions: List of user's permission codes
        required_permissions: List of permission codes (all must match)
        
    Returns:
        True if user has all permissions, False otherwise
    """
    return all(p in user_permissions for p in required_permissions)


class PermissionChecker:
    """
    Dependency class for checking permissions in FastAPI routes.
    
    Usage:
        @router.get("/cti-data")
        async def get_cti_data(
            current_user: User = Depends(get_current_user),
            _: bool = Depends(PermissionChecker([Permissions.CTI_READ]))
        ):
            pass
    """
    
    def __init__(self, required_permissions: List[str], require_all: bool = False):
        """
        Initialize permission checker.
        
        Args:
            required_permissions: List of permission codes to check
            require_all: If True, user must have ALL permissions. 
                        If False (default), user needs ANY permission.
        """
        self.required_permissions = required_permissions
        self.require_all = require_all
    
    def __call__(self, current_user) -> bool:
        """
        Check permissions for the current user.
        
        Args:
            current_user: User object with permissions
            
        Returns:
            True if permission check passes
            
        Raises:
            HTTPException: If permission check fails
        """
        user_permissions = current_user.get_permissions()
        
        if self.require_all:
            has_permission = check_all_permissions(user_permissions, self.required_permissions)
        else:
            has_permission = check_any_permission(user_permissions, self.required_permissions)
        
        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "FORBIDDEN",
                    "message": "You do not have permission to perform this action",
                    "required_permissions": self.required_permissions,
                }
            )
        
        return True


def require_permissions(permissions: List[str], require_all: bool = False) -> Callable:
    """
    Decorator for requiring permissions on a function.
    
    Usage:
        @require_permissions([Permissions.CTI_READ])
        async def get_cti_data(current_user: User):
            pass
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            # Find current_user in kwargs
            current_user = kwargs.get("current_user")
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            user_permissions = current_user.get_permissions()
            
            if require_all:
                has_permission = check_all_permissions(user_permissions, permissions)
            else:
                has_permission = check_any_permission(user_permissions, permissions)
            
            if not has_permission:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={
                        "code": "FORBIDDEN",
                        "message": "Insufficient permissions",
                        "required": permissions,
                    }
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def is_admin(user_permissions: List[str]) -> bool:
    """Check if user has admin role (has admin permissions)."""
    return Permissions.ADMIN_USERS in user_permissions


def is_manager_or_above(user_permissions: List[str]) -> bool:
    """Check if user is manager or admin (has CTI access)."""
    return Permissions.CTI_READ in user_permissions


def can_access_cti(user_permissions: List[str]) -> bool:
    """Check if user can access CTI data."""
    return Permissions.CTI_READ in user_permissions
