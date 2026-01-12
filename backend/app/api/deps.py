"""
Tessolve Executive Portal - API Dependencies
Dependency injection for database sessions, current user, and permissions.
"""

from typing import Generator, Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import JWTHandler
from app.core.exceptions import (
    InvalidTokenError,
    TokenExpiredError,
    AccountDisabledError,
    AccountLockedError,
)


# OAuth2 scheme for JWT bearer tokens
security = HTTPBearer()


def get_db() -> Generator[Session, None, None]:
    """
    Database session dependency.
    Provides a SQLAlchemy session and ensures cleanup.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_client_ip(request: Request) -> Optional[str]:
    """Extract client IP from request, handling proxies."""
    # Check for forwarded header (behind proxy/load balancer)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    
    # Check for real IP header
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # Fall back to direct client
    if request.client:
        return request.client.host
    
    return None


def get_user_agent(request: Request) -> Optional[str]:
    """Extract user agent from request."""
    return request.headers.get("User-Agent")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    Get current authenticated user from JWT token.
    
    Args:
        credentials: Bearer token from Authorization header
        db: Database session
        
    Returns:
        Authenticated User object
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    token = credentials.credentials
    
    # Decode and verify token
    payload = JWTHandler.verify_token(token, token_type="access")
    
    if not payload:
        raise InvalidTokenError()
    
    # Extract user ID
    user_id = payload.get("sub")
    if not user_id:
        raise InvalidTokenError()
    
    try:
        user_id = int(user_id)
    except ValueError:
        raise InvalidTokenError()
    
    # Fetch user from database
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise InvalidTokenError()
    
    # Check user status
    if not user.is_active:
        raise AccountDisabledError()
    
    if user.is_account_locked():
        raise AccountLockedError()
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Ensure current user is active.
    Use this as a dependency when you need an active user.
    """
    if not current_user.is_active:
        raise AccountDisabledError()
    return current_user


class RoleChecker:
    """
    Dependency class for checking user roles.
    
    Usage:
        @router.get("/admin")
        async def admin_only(
            user: User = Depends(RoleChecker(["admin"]))
        ):
            pass
    """
    
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles
    
    async def __call__(
        self,
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role.name not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "FORBIDDEN",
                    "message": f"Access restricted to roles: {', '.join(self.allowed_roles)}",
                }
            )
        return current_user


# Convenience dependencies for common role checks
get_admin_user = RoleChecker(["admin"])
get_manager_or_admin = RoleChecker(["admin", "manager"])
