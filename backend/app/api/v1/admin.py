"""
Tessolve Executive Portal - Admin API Endpoints
User management, roles, master data, and audit logs.
"""

from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, Field, EmailStr

from app.api.deps import (
    get_db,
    get_current_user,
    get_admin_user,
)
from app.models.user import User, Role
from app.services.audit_service import AuditService
from app.core.permissions import Permissions, PermissionChecker
from app.core.security import PasswordHandler
from app.schemas.audit import (
    AuditLogFilterRequest,
    AuditLogListResponse,
    AuditLogResponse,
    AuditLogStats,
)
from app.schemas.user import RoleListResponse, RoleResponse


router = APIRouter(prefix="/admin", tags=["Admin"])


# User schemas
class UserCreateRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, pattern=r'^[a-zA-Z0-9._-]+$')
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=1, max_length=100)
    role: str = "engineer"
    is_active: bool = True


class UserUpdateRequest(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8)
    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    role: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    role: str
    is_active: bool
    
    class Config:
        from_attributes = True


# User Management Endpoints
@router.get("/users")
async def list_users(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """List all users. Admin only."""
    users = db.query(User).all()
    return {
        "success": True,
        "users": [
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "full_name": u.full_name,
                "role": u.role.name if u.role else None,
                "is_active": u.is_active,
            }
            for u in users
        ]
    }


@router.get("/users/{user_id}")
async def get_user(
    user_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Get user by ID. Admin only."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "success": True,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.name if user.role else None,
            "is_active": user.is_active,
        }
    }


@router.post("/users")
async def create_user(
    data: UserCreateRequest,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Create a new user. Admin only."""
    try:
        # Check if username or email exists
        existing = db.query(User).filter(
            (User.username == data.username) | (User.email == data.email)
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username or email already exists")
        
        # Get role
        role = db.query(Role).filter(Role.name == data.role).first()
        if not role:
            raise HTTPException(status_code=400, detail=f"Invalid role: {data.role}. Valid roles: admin, manager, engineer")
        
        # Create user
        user = User(
            username=data.username,
            email=data.email,
            password_hash=PasswordHandler.hash(data.password),
            full_name=data.full_name,
            role_id=role.id,
            is_active=data.is_active,
            is_locked=False,
            failed_attempts=0,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        return {
            "success": True,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "role": data.role,
                "is_active": user.is_active,
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.put("/users/{user_id}")
async def update_user(
    user_id: int,
    data: UserUpdateRequest,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Update a user. Admin only."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if data.email is not None:
        # Check email uniqueness
        existing = db.query(User).filter(User.email == data.email, User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = data.email
    
    if data.full_name is not None:
        user.full_name = data.full_name
    
    if data.password is not None:
        user.password_hash = PasswordHandler.hash(data.password)
    
    if data.role is not None:
        role = db.query(Role).filter(Role.name == data.role).first()
        if not role:
            raise HTTPException(status_code=400, detail="Invalid role")
        user.role_id = role.id
    
    if data.is_active is not None:
        user.is_active = data.is_active
    
    db.commit()
    db.refresh(user)
    
    return {
        "success": True,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.name if user.role else None,
            "is_active": user.is_active,
        }
    }


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Delete a user. Admin only."""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    
    return {"success": True, "message": "User deleted"}


# Audit Log Endpoints
@router.post("/audit-logs/filter", response_model=AuditLogListResponse)
async def filter_audit_logs(
    filter_request: AuditLogFilterRequest,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Query audit logs with filters. **Admin only.**
    
    Supports filtering by:
    - user_id: Filter by specific user
    - action: List of actions to include
    - module: List of modules to include
    - resource_type: Filter by resource type
    - date_from/date_to: Date range filter
    - search: Search in description field
    """
    audit_service = AuditService(db)
    
    logs, total = audit_service.get_logs(
        user_id=filter_request.user_id,
        action=filter_request.action,
        module=filter_request.module,
        resource_type=filter_request.resource_type,
        resource_id=filter_request.resource_id,
        ip_address=filter_request.ip_address,
        search=filter_request.search,
        date_from=filter_request.date_from,
        date_to=filter_request.date_to,
        page=filter_request.page,
        page_size=filter_request.page_size,
        sort_field=filter_request.sort_field,
        sort_direction=filter_request.sort_direction,
    )
    
    total_pages = (total + filter_request.page_size - 1) // filter_request.page_size
    
    return AuditLogListResponse(
        success=True,
        data=[AuditLogResponse.model_validate(log) for log in logs],
        total=total,
        page=filter_request.page,
        page_size=filter_request.page_size,
        total_pages=total_pages,
    )


@router.get("/audit-logs/stats", response_model=AuditLogStats)
async def get_audit_stats(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Get audit log statistics for dashboard. **Admin only.**
    
    Returns:
    - Total logs count
    - Logs today
    - Login attempts and failures
    - CTI access count
    - Breakdown by module and action type
    """
    audit_service = AuditService(db)
    stats = audit_service.get_stats()
    return AuditLogStats(**stats)


@router.get("/roles", response_model=RoleListResponse)
async def list_roles(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    List all roles with their permissions. **Admin only.**
    """
    roles = db.query(Role).filter(Role.is_active == True).all()
    
    role_responses = []
    for role in roles:
        role_responses.append(RoleResponse(
            id=role.id,
            name=role.name,
            display_name=role.display_name,
            description=role.description,
            is_active=role.is_active,
            permissions=role.get_permission_codes(),
        ))
    
    return RoleListResponse(
        success=True,
        data=role_responses,
    )
