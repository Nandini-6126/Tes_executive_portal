"""
Tessolve Executive Portal - User Schemas
Pydantic models for user CRUD operations.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, EmailStr


class UserBase(BaseModel):
    """Base user schema with common fields."""
    
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    full_name: Optional[str] = Field(None, max_length=200)
    department_id: Optional[int] = None


class UserCreate(UserBase):
    """Schema for creating a new user."""
    
    password: str = Field(..., min_length=8)
    role_id: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "john.doe@tessolve.com",
                "username": "john.doe",
                "full_name": "John Doe",
                "password": "SecurePass123!",
                "role_id": 3,
                "department_id": 1
            }
        }


class UserUpdate(BaseModel):
    """Schema for updating a user."""
    
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, max_length=200)
    role_id: Optional[int] = None
    department_id: Optional[int] = None
    is_active: Optional[bool] = None


class UserInDB(UserBase):
    """User schema as stored in database."""
    
    id: int
    role_id: int
    is_active: bool
    is_locked: bool
    failed_attempts: int
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    """User response schema with role info."""
    
    id: int
    email: str
    username: str
    full_name: Optional[str] = None
    role: str
    role_id: int
    permissions: List[str]
    department_id: Optional[int] = None
    is_active: bool
    is_locked: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """Response for user listing."""
    
    success: bool = True
    data: List[UserResponse]
    total: int
    page: int
    page_size: int


class RoleBase(BaseModel):
    """Base role schema."""
    
    name: str = Field(..., min_length=2, max_length=50)
    display_name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None


class RoleResponse(RoleBase):
    """Role response with permissions."""
    
    id: int
    is_active: bool
    permissions: List[str]
    
    class Config:
        from_attributes = True


class RoleListResponse(BaseModel):
    """Response for role listing."""
    
    success: bool = True
    data: List[RoleResponse]
