"""
Tessolve Executive Portal - Audit Service
Business logic for audit logging operations.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, func, and_

from app.models.audit import AuditLog, AuditAction, AuditModule
from app.models.user import User


class AuditService:
    """Service for audit log operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def log(
        self,
        action: str,
        module: Optional[str] = None,
        user: Optional[User] = None,
        user_id: Optional[int] = None,
        username: Optional[str] = None,
        user_role: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[int] = None,
        description: Optional[str] = None,
        old_values: Optional[Dict[str, Any]] = None,
        new_values: Optional[Dict[str, Any]] = None,
        extra_data: Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        """
        Create an audit log entry.
        
        Args:
            action: Action type (use AuditAction constants)
            module: Module name (use AuditModule constants)
            user: User object (will extract id, username, role)
            user_id: User ID (alternative to user object)
            username: Username (alternative to user object)
            user_role: User role (alternative to user object)
            ip_address: Client IP address
            user_agent: Client user agent string
            resource_type: Type of resource affected
            resource_id: ID of resource affected
            description: Human-readable description
            old_values: Previous state (for updates)
            new_values: New state (for creates/updates)
            extra_data: Additional context data
            
        Returns:
            Created AuditLog entry
        """
        # Extract user info if user object provided
        if user:
            user_id = user.id
            username = user.username
            user_role = user.role.name if user.role else None
        
        audit_log = AuditLog(
            action=action,
            module=module,
            user_id=user_id,
            username=username,
            user_role=user_role,
            ip_address=ip_address,
            user_agent=user_agent,
            resource_type=resource_type,
            resource_id=resource_id,
            description=description,
            old_values=old_values,
            new_values=new_values,
            extra_data=extra_data,
        )
        
        self.db.add(audit_log)
        self.db.commit()
        self.db.refresh(audit_log)
        
        return audit_log
    
    def log_login_success(
        self,
        user: User,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditLog:
        """Log successful login."""
        return self.log(
            action=AuditAction.LOGIN_SUCCESS,
            module=AuditModule.AUTH,
            user=user,
            ip_address=ip_address,
            user_agent=user_agent,
            description=f"User '{user.username}' logged in successfully",
            extra_data={"login_time": datetime.now(timezone.utc).isoformat()},
        )
    
    def log_login_failure(
        self,
        username: str,
        reason: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        user_id: Optional[int] = None,
    ) -> AuditLog:
        """Log failed login attempt."""
        return self.log(
            action=AuditAction.LOGIN_FAILURE,
            module=AuditModule.AUTH,
            user_id=user_id,
            username=username,
            ip_address=ip_address,
            user_agent=user_agent,
            description=f"Failed login attempt for '{username}': {reason}",
            extra_data={"reason": reason},
        )
    
    def log_account_locked(
        self,
        user: User,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditLog:
        """Log account lockout due to failed attempts."""
        return self.log(
            action=AuditAction.ACCOUNT_LOCKED,
            module=AuditModule.AUTH,
            user=user,
            ip_address=ip_address,
            user_agent=user_agent,
            resource_type="user",
            resource_id=user.id,
            description=f"Account '{user.username}' locked due to too many failed attempts",
            extra_data={
                "failed_attempts": user.failed_attempts,
                "locked_until": user.locked_until.isoformat() if user.locked_until else None,
            },
        )
    
    def log_logout(
        self,
        user: User,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditLog:
        """Log user logout."""
        return self.log(
            action=AuditAction.LOGOUT,
            module=AuditModule.AUTH,
            user=user,
            ip_address=ip_address,
            user_agent=user_agent,
            description=f"User '{user.username}' logged out",
        )
    
    def log_password_change(
        self,
        user: User,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditLog:
        """Log password change."""
        return self.log(
            action=AuditAction.PASSWORD_CHANGE,
            module=AuditModule.AUTH,
            user=user,
            ip_address=ip_address,
            user_agent=user_agent,
            resource_type="user",
            resource_id=user.id,
            description=f"User '{user.username}' changed their password",
        )
    
    def log_cti_access(
        self,
        user: User,
        resource_type: str,
        resource_id: int,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditLog:
        """Log CTI data access (sensitive data)."""
        return self.log(
            action=AuditAction.CTI_ACCESS,
            module=AuditModule.CTI,
            user=user,
            ip_address=ip_address,
            user_agent=user_agent,
            resource_type=resource_type,
            resource_id=resource_id,
            description=f"User '{user.username}' accessed CTI {resource_type} #{resource_id}",
        )
    
    def get_logs(
        self,
        user_id: Optional[int] = None,
        action: Optional[List[str]] = None,
        module: Optional[List[str]] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[int] = None,
        ip_address: Optional[str] = None,
        search: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        page: int = 1,
        page_size: int = 20,
        sort_field: str = "created_at",
        sort_direction: str = "desc",
    ) -> tuple[List[AuditLog], int]:
        """
        Query audit logs with filters.
        
        Returns:
            Tuple of (logs list, total count)
        """
        query = self.db.query(AuditLog)
        
        # Apply filters
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        
        if action:
            query = query.filter(AuditLog.action.in_(action))
        
        if module:
            query = query.filter(AuditLog.module.in_(module))
        
        if resource_type:
            query = query.filter(AuditLog.resource_type == resource_type)
        
        if resource_id:
            query = query.filter(AuditLog.resource_id == resource_id)
        
        if ip_address:
            query = query.filter(AuditLog.ip_address == ip_address)
        
        if search:
            query = query.filter(AuditLog.description.ilike(f"%{search}%"))
        
        if date_from:
            query = query.filter(AuditLog.created_at >= date_from)
        
        if date_to:
            query = query.filter(AuditLog.created_at <= date_to)
        
        # Get total count
        total = query.count()
        
        # Apply sorting
        sort_column = getattr(AuditLog, sort_field, AuditLog.created_at)
        if sort_direction == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))
        
        # Apply pagination
        offset = (page - 1) * page_size
        logs = query.offset(offset).limit(page_size).all()
        
        return logs, total
    
    def get_stats(self) -> Dict[str, Any]:
        """Get audit log statistics."""
        today_start = datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        
        total_logs = self.db.query(func.count(AuditLog.id)).scalar()
        logs_today = self.db.query(func.count(AuditLog.id)).filter(
            AuditLog.created_at >= today_start
        ).scalar()
        
        login_attempts = self.db.query(func.count(AuditLog.id)).filter(
            AuditLog.action.in_([AuditAction.LOGIN_SUCCESS, AuditAction.LOGIN_FAILURE])
        ).scalar()
        
        failed_logins = self.db.query(func.count(AuditLog.id)).filter(
            AuditLog.action == AuditAction.LOGIN_FAILURE
        ).scalar()
        
        cti_accesses = self.db.query(func.count(AuditLog.id)).filter(
            AuditLog.module == AuditModule.CTI
        ).scalar()
        
        # Actions by module
        module_counts = self.db.query(
            AuditLog.module, func.count(AuditLog.id)
        ).group_by(AuditLog.module).all()
        
        actions_by_module = {m: c for m, c in module_counts if m}
        
        # Actions by type
        action_counts = self.db.query(
            AuditLog.action, func.count(AuditLog.id)
        ).group_by(AuditLog.action).all()
        
        actions_by_type = {a: c for a, c in action_counts}
        
        return {
            "total_logs": total_logs or 0,
            "logs_today": logs_today or 0,
            "login_attempts": login_attempts or 0,
            "failed_logins": failed_logins or 0,
            "cti_accesses": cti_accesses or 0,
            "actions_by_module": actions_by_module,
            "actions_by_type": actions_by_type,
        }
