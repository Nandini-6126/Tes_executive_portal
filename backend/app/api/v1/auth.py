"""
Tessolve Executive Portal - Auth API Endpoints
Login, logout, token refresh, and password management.
"""

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.api.deps import (
    get_db,
    get_current_user,
    get_client_ip,
    get_user_agent,
)
from app.models.user import User
from app.services.auth_service import AuthService
from app.config import settings
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    TokenResponse,
    RefreshTokenRequest,
    LogoutResponse,
    PasswordChangeRequest,
    PasswordChangeResponse,
    CurrentUserResponse,
    UserInfo,
)


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
async def login(
    request: Request,
    login_data: LoginRequest,
    db: Session = Depends(get_db),
):
    """
    Authenticate user and return JWT tokens.
    
    - **username**: Username or email address
    - **password**: User password
    
    Returns access and refresh tokens on success.
    Failed attempts are logged and may result in account lockout.
    """
    auth_service = AuthService(db)
    
    user, access_token, refresh_token = auth_service.authenticate(
        username=login_data.username,
        password=login_data.password,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    
    return LoginResponse(
        success=True,
        message="Login successful",
        tokens=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        ),
        user=UserInfo(
            id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            role=user.role.name,
            permissions=user.get_permissions(),
            department_id=user.department_id,
            last_login=user.last_login,
            created_at=user.created_at,
        ),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: Request,
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    """
    Refresh access token using a valid refresh token.
    
    Returns new access and refresh tokens.
    """
    auth_service = AuthService(db)
    
    new_access_token, new_refresh_token = auth_service.refresh_tokens(
        refresh_token=refresh_data.refresh_token,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    
    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/logout", response_model=LogoutResponse)
async def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Log out the current user.
    
    Note: This endpoint logs the logout event. 
    Client should discard tokens after calling this.
    """
    auth_service = AuthService(db)
    
    auth_service.logout(
        user=current_user,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    
    return LogoutResponse(
        success=True,
        message="Logged out successfully",
    )


@router.post("/change-password", response_model=PasswordChangeResponse)
async def change_password(
    request: Request,
    password_data: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Change the current user's password.
    
    - **current_password**: Current password for verification
    - **new_password**: New password (min 8 chars, must include uppercase, lowercase, digit, special char)
    - **confirm_password**: Must match new_password
    """
    from app.core.exceptions import ValidationError
    
    # Validate passwords match
    if not password_data.validate_passwords_match():
        raise ValidationError(
            message="Passwords do not match",
            errors=[{"field": "confirm_password", "message": "Must match new_password"}],
        )
    
    auth_service = AuthService(db)
    
    auth_service.change_password(
        user=current_user,
        current_password=password_data.current_password,
        new_password=password_data.new_password,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    
    return PasswordChangeResponse(
        success=True,
        message="Password changed successfully",
    )


@router.get("/me", response_model=CurrentUserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
):
    """
    Get current authenticated user's information.
    
    Returns user profile with role and permissions.
    """
    return CurrentUserResponse(
        success=True,
        user=UserInfo(
            id=current_user.id,
            username=current_user.username,
            email=current_user.email,
            full_name=current_user.full_name,
            role=current_user.role.name,
            permissions=current_user.get_permissions(),
            department_id=current_user.department_id,
            last_login=current_user.last_login,
            created_at=current_user.created_at,
        ),
    )
