"""
Tessolve Executive Portal - Auth Service
Business logic for authentication operations.
"""

from datetime import datetime, timezone
from typing import Optional, Tuple
from sqlalchemy.orm import Session

from app.models.user import User
from app.config import settings
from app.core.security import (
    PasswordHandler,
    JWTHandler,
    create_token_payload,
)
from app.core.exceptions import (
    InvalidCredentialsError,
    AccountLockedError,
    AccountDisabledError,
)
from app.services.audit_service import AuditService


class AuthService:
    """Service for authentication operations."""
    
    def __init__(self, db: Session):
        self.db = db
        self.audit_service = AuditService(db)
    
    def authenticate(
        self,
        username: str,
        password: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Tuple[User, str, str]:
        """
        Authenticate user with username/password.
        
        Args:
            username: Username or email
            password: Plain text password
            ip_address: Client IP for audit logging
            user_agent: Client user agent for audit logging
            
        Returns:
            Tuple of (User, access_token, refresh_token)
            
        Raises:
            InvalidCredentialsError: If credentials are invalid
            AccountLockedError: If account is locked
            AccountDisabledError: If account is disabled
        """
        # Find user by username or email
        user = self.db.query(User).filter(
            (User.username == username) | (User.email == username)
        ).first()
        
        # User not found
        if not user:
            self.audit_service.log_login_failure(
                username=username,
                reason="User not found",
                ip_address=ip_address,
                user_agent=user_agent,
            )
            raise InvalidCredentialsError()
        
        # Check if account is locked
        if user.is_account_locked():
            locked_until_str = None
            if user.locked_until:
                locked_until_str = user.locked_until.strftime("%Y-%m-%d %H:%M:%S UTC")
            
            self.audit_service.log_login_failure(
                username=username,
                reason="Account locked",
                ip_address=ip_address,
                user_agent=user_agent,
                user_id=user.id,
            )
            raise AccountLockedError(locked_until=locked_until_str)
        
        # Check if account is active
        if not user.is_active:
            self.audit_service.log_login_failure(
                username=username,
                reason="Account disabled",
                ip_address=ip_address,
                user_agent=user_agent,
                user_id=user.id,
            )
            raise AccountDisabledError()
        
        # Verify password
        if not PasswordHandler.verify(password, user.password_hash):
            # Record failed attempt
            is_now_locked = user.record_failed_login(
                max_attempts=settings.MAX_LOGIN_ATTEMPTS,
                lockout_minutes=settings.LOCKOUT_DURATION_MINUTES,
            )
            self.db.commit()
            
            if is_now_locked:
                self.audit_service.log_account_locked(
                    user=user,
                    ip_address=ip_address,
                    user_agent=user_agent,
                )
                locked_until_str = user.locked_until.strftime("%Y-%m-%d %H:%M:%S UTC")
                raise AccountLockedError(locked_until=locked_until_str)
            
            self.audit_service.log_login_failure(
                username=username,
                reason="Invalid password",
                ip_address=ip_address,
                user_agent=user_agent,
                user_id=user.id,
            )
            raise InvalidCredentialsError()
        
        # Successful login - reset failed attempts
        user.reset_failed_attempts()
        self.db.commit()
        
        # Generate tokens
        token_payload = create_token_payload(
            user_id=user.id,
            username=user.username,
            role=user.role.name,
            permissions=user.get_permissions(),
            department_id=user.department_id,
        )
        
        access_token = JWTHandler.create_access_token(token_payload)
        refresh_token = JWTHandler.create_refresh_token({"sub": str(user.id)})
        
        # Log successful login
        self.audit_service.log_login_success(
            user=user,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        
        return user, access_token, refresh_token
    
    def refresh_tokens(
        self,
        refresh_token: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Tuple[str, str]:
        """
        Refresh access token using refresh token.
        
        Args:
            refresh_token: Valid refresh token
            ip_address: Client IP for audit logging
            user_agent: Client user agent for audit logging
            
        Returns:
            Tuple of (new_access_token, new_refresh_token)
            
        Raises:
            InvalidCredentialsError: If refresh token is invalid
        """
        payload = JWTHandler.verify_token(refresh_token, token_type="refresh")
        
        if not payload:
            raise InvalidCredentialsError()
        
        user_id = int(payload.get("sub"))
        user = self.db.query(User).filter(User.id == user_id).first()
        
        if not user or not user.is_active or user.is_account_locked():
            raise InvalidCredentialsError()
        
        # Generate new tokens
        token_payload = create_token_payload(
            user_id=user.id,
            username=user.username,
            role=user.role.name,
            permissions=user.get_permissions(),
            department_id=user.department_id,
        )
        
        new_access_token = JWTHandler.create_access_token(token_payload)
        new_refresh_token = JWTHandler.create_refresh_token({"sub": str(user.id)})
        
        return new_access_token, new_refresh_token
    
    def logout(
        self,
        user: User,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> None:
        """
        Log user logout.
        
        Note: JWT tokens are stateless, so we just log the event.
        For proper token invalidation, implement a token blacklist.
        """
        self.audit_service.log_logout(
            user=user,
            ip_address=ip_address,
            user_agent=user_agent,
        )
    
    def change_password(
        self,
        user: User,
        current_password: str,
        new_password: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> None:
        """
        Change user password.
        
        Args:
            user: User changing password
            current_password: Current password for verification
            new_password: New password
            ip_address: Client IP for audit logging
            user_agent: Client user agent for audit logging
            
        Raises:
            InvalidCredentialsError: If current password is wrong
            ValidationError: If new password doesn't meet requirements
        """
        from app.core.exceptions import ValidationError
        
        # Verify current password
        if not PasswordHandler.verify(current_password, user.password_hash):
            raise InvalidCredentialsError()
        
        # Validate new password strength
        is_valid, errors = PasswordHandler.validate_strength(new_password)
        if not is_valid:
            raise ValidationError(
                message="Password does not meet requirements",
                errors=[{"field": "new_password", "message": e} for e in errors],
            )
        
        # Update password
        user.password_hash = PasswordHandler.hash(new_password)
        user.password_changed_at = datetime.now(timezone.utc)
        self.db.commit()
        
        # Log password change
        self.audit_service.log_password_change(
            user=user,
            ip_address=ip_address,
            user_agent=user_agent,
        )
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID with role eagerly loaded."""
        return self.db.query(User).filter(User.id == user_id).first()
