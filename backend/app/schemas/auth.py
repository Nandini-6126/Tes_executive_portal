"""
Tessolve Executive Portal - Auth Schemas
Pydantic models for authentication requests and responses.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, EmailStr


class LoginRequest(BaseModel):
    """Login request payload."""
    
    username: str = Field(..., min_length=3, max_length=100, description="Username or email")
    password: str = Field(..., min_length=1, description="User password")
    
    class Config:
        json_schema_extra = {
            "example": {
                "username": "admin",
                "password": "SecurePass123!"
            }
        }


class TokenResponse(BaseModel):
    """Successful login response with JWT tokens."""
    
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token for renewal")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Access token expiry in seconds")
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIs...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
                "token_type": "bearer",
                "expires_in": 3600
            }
        }


class RefreshTokenRequest(BaseModel):
    """Request to refresh access token."""
    
    refresh_token: str = Field(..., description="Valid refresh token")


class UserInfo(BaseModel):
    """User information returned after login."""
    
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    role: str
    permissions: List[str]
    department_id: Optional[int] = None
    last_login: Optional[datetime] = None
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    """Full login response with tokens and user info."""
    
    success: bool = True
    message: str = "Login successful"
    tokens: TokenResponse
    user: UserInfo


class LogoutResponse(BaseModel):
    """Logout response."""
    
    success: bool = True
    message: str = "Logged out successfully"


class PasswordChangeRequest(BaseModel):
    """Request to change password."""
    
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)
    
    def validate_passwords_match(self) -> bool:
        """Check if new password and confirmation match."""
        return self.new_password == self.confirm_password


class PasswordChangeResponse(BaseModel):
    """Password change response."""
    
    success: bool = True
    message: str = "Password changed successfully"


class CurrentUserResponse(BaseModel):
    """Response for current user info endpoint."""
    
    success: bool = True
    user: UserInfo
