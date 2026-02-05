"""
Dashboard Analytics API Endpoints
Provides comprehensive analytics for the executive dashboard.
"""

from typing import Optional, List
from datetime import datetime, timezone, timedelta, date
from decimal import Decimal
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.api.deps import get_db, get_current_user
from app.models import User, Service, Client
from app.models.service import ServiceStatus
from app.models.employee import Employee, AvailabilityStatus
from app.models.task import Task, TaskAssignment, TaskStatus
from app.models.inquiry import ClientInquiry, InquiryStatus
from pydantic import BaseModel

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


class ServiceStats(BaseModel):
    """Service statistics."""
    total: int = 0
    active: int = 0
    draft: int = 0
    completed: int = 0
    on_hold: int = 0
    cancelled: int = 0
    by_status: dict = {}


class RevenueStats(BaseModel):
    """Revenue statistics."""
    total_contract_value: float = 0.0
    active_revenue: float = 0.0
    completed_revenue: float = 0.0
    average_contract_value: float = 0.0
    by_month: List[dict] = []
    by_status: dict = {}


class EmployeeStats(BaseModel):
    """Employee statistics."""
    total: int = 0
    available: int = 0
    busy: int = 0
    on_leave: int = 0
    average_workload: float = 0.0
    overloaded_count: int = 0
    workload_distribution: List[dict] = []


class TaskStats(BaseModel):
    """Task statistics."""
    total: int = 0
    pending: int = 0
    assigned: int = 0
    in_progress: int = 0
    completed: int = 0
    overdue: int = 0
    by_status: dict = {}
    by_priority: dict = {}


class InquiryStats(BaseModel):
    """Inquiry/Lead statistics."""
    total: int = 0
    new: int = 0
    in_progress: int = 0
    won: int = 0
    lost: int = 0
    conversion_rate: float = 0.0
    pipeline_value: float = 0.0
    by_status: dict = {}


class ClientStats(BaseModel):
    """Client statistics."""
    total: int = 0
    active: int = 0
    new_this_month: int = 0
    by_industry: dict = {}


class RecentActivity(BaseModel):
    """Recent activity item."""
    id: int
    type: str  # service, task, inquiry, employee
    title: str
    description: str
    timestamp: datetime
    user_name: Optional[str] = None


class DashboardAnalytics(BaseModel):
    """Complete dashboard analytics."""
    services: ServiceStats
    revenue: RevenueStats
    employees: EmployeeStats
    tasks: TaskStats
    inquiries: InquiryStats
    clients: ClientStats
    recent_activities: List[RecentActivity] = []
    upcoming_deadlines: List[dict] = []
    quick_stats: dict = {}


@router.get("/analytics", response_model=DashboardAnalytics)
async def get_dashboard_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get comprehensive dashboard analytics."""
    is_admin = current_user.role.name == "admin"
    
    # Service Stats
    services_query = db.query(Service).filter(Service.is_deleted == 0)
    if not is_admin:
        services_query = services_query.filter(Service.manager_id == current_user.id)
    
    services = services_query.all()
    service_stats = ServiceStats(
        total=len(services),
        active=sum(1 for s in services if s.status == ServiceStatus.ACTIVE),
        draft=sum(1 for s in services if s.status == ServiceStatus.DRAFT),
        completed=sum(1 for s in services if s.status == ServiceStatus.COMPLETED),
        on_hold=sum(1 for s in services if s.status == ServiceStatus.ON_HOLD),
        cancelled=sum(1 for s in services if s.status == ServiceStatus.CANCELLED),
        by_status={status.value: sum(1 for s in services if s.status == status) for status in ServiceStatus}
    )
    
    # Revenue Stats
    total_value = sum(float(s.contract_value or 0) for s in services)
    active_value = sum(float(s.contract_value or 0) for s in services if s.status == ServiceStatus.ACTIVE)
    completed_value = sum(float(s.contract_value or 0) for s in services if s.status == ServiceStatus.COMPLETED)
    
    revenue_by_status = {}
    for status in ServiceStatus:
        revenue_by_status[status.value] = sum(float(s.contract_value or 0) for s in services if s.status == status)
    
    # Monthly revenue (last 6 months)
    revenue_by_month = []
    today = datetime.now(timezone.utc).date()
    for i in range(5, -1, -1):
        month_date = today.replace(day=1) - timedelta(days=i*30)
        month_services = [s for s in services if s.created_at and s.created_at.month == month_date.month and s.created_at.year == month_date.year]
        revenue_by_month.append({
            "month": month_date.strftime("%b %Y"),
            "value": sum(float(s.contract_value or 0) for s in month_services),
            "count": len(month_services)
        })
    
    revenue_stats = RevenueStats(
        total_contract_value=total_value,
        active_revenue=active_value,
        completed_revenue=completed_value,
        average_contract_value=total_value / len(services) if services else 0,
        by_month=revenue_by_month,
        by_status=revenue_by_status
    )
    
    # Employee Stats
    employees_query = db.query(Employee).filter(Employee.is_deleted == 0, Employee.is_active == True)
    if not is_admin:
        employees_query = employees_query.filter(Employee.manager_id == current_user.id)
    
    employees = employees_query.all()
    avg_workload = sum(e.workload_percentage for e in employees) / len(employees) if employees else 0
    overloaded = sum(1 for e in employees if e.workload_percentage >= 100)
    
    workload_distribution = [
        {"name": e.full_name, "workload": round(e.workload_percentage, 1), "capacity": e.weekly_capacity_hours}
        for e in sorted(employees, key=lambda x: x.workload_percentage, reverse=True)[:10]
    ]
    
    employee_stats = EmployeeStats(
        total=len(employees),
        available=sum(1 for e in employees if e.availability_status == AvailabilityStatus.AVAILABLE),
        busy=sum(1 for e in employees if e.availability_status == AvailabilityStatus.BUSY),
        on_leave=sum(1 for e in employees if e.availability_status == AvailabilityStatus.ON_LEAVE),
        average_workload=round(avg_workload, 1),
        overloaded_count=overloaded,
        workload_distribution=workload_distribution
    )
    
    # Task Stats
    tasks_query = db.query(Task).join(Service).filter(Task.is_deleted == 0)
    if not is_admin:
        tasks_query = tasks_query.filter(Service.manager_id == current_user.id)
    
    tasks = tasks_query.all()
    overdue = sum(1 for t in tasks if t.due_date and t.due_date < today and t.status not in [TaskStatus.COMPLETED, TaskStatus.CANCELLED])
    
    task_stats = TaskStats(
        total=len(tasks),
        pending=sum(1 for t in tasks if t.status == TaskStatus.PENDING),
        assigned=sum(1 for t in tasks if t.status == TaskStatus.ASSIGNED),
        in_progress=sum(1 for t in tasks if t.status == TaskStatus.IN_PROGRESS),
        completed=sum(1 for t in tasks if t.status == TaskStatus.COMPLETED),
        overdue=overdue,
        by_status={status.value: sum(1 for t in tasks if t.status == status) for status in TaskStatus},
        by_priority={}
    )
    
    # Inquiry Stats
    inquiries_query = db.query(ClientInquiry).filter(ClientInquiry.is_deleted == 0)
    if not is_admin:
        inquiries_query = inquiries_query.filter(
            (ClientInquiry.created_by_id == current_user.id) |
            (ClientInquiry.assigned_to_id == current_user.id)
        )
    
    inquiries = inquiries_query.all()
    won_count = sum(1 for i in inquiries if i.status == InquiryStatus.WON)
    lost_count = sum(1 for i in inquiries if i.status == InquiryStatus.LOST)
    closed = won_count + lost_count
    
    pipeline_value = sum(float(i.estimated_value or 0) for i in inquiries if i.status not in [InquiryStatus.WON, InquiryStatus.LOST])
    
    inquiry_stats = InquiryStats(
        total=len(inquiries),
        new=sum(1 for i in inquiries if i.status == InquiryStatus.NEW),
        in_progress=sum(1 for i in inquiries if i.status in [InquiryStatus.CONTACTED, InquiryStatus.MEETING_SCHEDULED, InquiryStatus.PROPOSAL_SENT, InquiryStatus.NEGOTIATING]),
        won=won_count,
        lost=lost_count,
        conversion_rate=round((won_count / closed * 100) if closed > 0 else 0, 1),
        pipeline_value=pipeline_value,
        by_status={status.value: sum(1 for i in inquiries if i.status == status) for status in InquiryStatus}
    )
    
    # Client Stats
    clients_query = db.query(Client).filter(Client.is_deleted == 0)
    if not is_admin:
        clients_query = clients_query.filter(Client.manager_id == current_user.id)
    
    clients = clients_query.all()
    month_start = today.replace(day=1)
    new_this_month = sum(1 for c in clients if c.created_at and c.created_at.date() >= month_start)
    
    by_industry = {}
    for c in clients:
        industry = c.industry or "Other"
        by_industry[industry] = by_industry.get(industry, 0) + 1
    
    client_stats = ClientStats(
        total=len(clients),
        active=sum(1 for c in clients if c.is_active),
        new_this_month=new_this_month,
        by_industry=by_industry
    )
    
    # Recent Activities (combined from various sources)
    recent_activities = []
    
    # Recent services
    recent_services = sorted(services, key=lambda x: x.created_at, reverse=True)[:5]
    for s in recent_services:
        recent_activities.append(RecentActivity(
            id=s.id,
            type="service",
            title=f"Service: {s.name}",
            description=f"Status: {s.status.value}",
            timestamp=s.created_at,
            user_name=s.manager.full_name if s.manager else None
        ))
    
    # Recent inquiries
    recent_inquiries = sorted(inquiries, key=lambda x: x.created_at, reverse=True)[:5]
    for i in recent_inquiries:
        recent_activities.append(RecentActivity(
            id=i.id,
            type="inquiry",
            title=f"Inquiry: {i.title}",
            description=f"From {i.company_name} - {i.status.value}",
            timestamp=i.created_at,
            user_name=i.created_by.full_name if i.created_by else None
        ))
    
    # Sort all activities by timestamp
    recent_activities = sorted(recent_activities, key=lambda x: x.timestamp, reverse=True)[:10]
    
    # Upcoming Deadlines
    upcoming_deadlines = []
    upcoming_tasks = [t for t in tasks if t.due_date and t.due_date >= today and t.status not in [TaskStatus.COMPLETED, TaskStatus.CANCELLED]]
    for t in sorted(upcoming_tasks, key=lambda x: x.due_date)[:5]:
        upcoming_deadlines.append({
            "id": t.id,
            "title": t.title,
            "due_date": t.due_date.isoformat(),
            "days_left": (t.due_date - today).days,
            "priority": t.priority.value,
            "service_name": t.service.name if t.service else None
        })
    
    # Quick Stats
    quick_stats = {
        "total_team_size": len(employees),
        "active_projects": service_stats.active,
        "pending_tasks": task_stats.pending,
        "open_inquiries": inquiry_stats.new + inquiry_stats.in_progress,
        "total_revenue": revenue_stats.total_contract_value,
        "avg_employee_utilization": employee_stats.average_workload,
    }
    
    return DashboardAnalytics(
        services=service_stats,
        revenue=revenue_stats,
        employees=employee_stats,
        tasks=task_stats,
        inquiries=inquiry_stats,
        clients=client_stats,
        recent_activities=recent_activities,
        upcoming_deadlines=upcoming_deadlines,
        quick_stats=quick_stats
    )


@router.get("/summary")
async def get_quick_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a quick summary for the dashboard header."""
    is_admin = current_user.role.name == "admin"
    
    # Services
    services_query = db.query(Service).filter(Service.is_deleted == 0)
    if not is_admin:
        services_query = services_query.filter(Service.manager_id == current_user.id)
    
    total_services = services_query.count()
    active_services = services_query.filter(Service.status == ServiceStatus.ACTIVE).count()
    
    # Revenue
    total_revenue = db.query(func.sum(Service.contract_value)).filter(
        Service.is_deleted == 0,
        Service.manager_id == current_user.id if not is_admin else True
    ).scalar() or 0
    
    # Employees
    employees_query = db.query(Employee).filter(Employee.is_deleted == 0, Employee.is_active == True)
    if not is_admin:
        employees_query = employees_query.filter(Employee.manager_id == current_user.id)
    total_employees = employees_query.count()
    
    # Tasks
    tasks_query = db.query(Task).join(Service).filter(Task.is_deleted == 0)
    if not is_admin:
        tasks_query = tasks_query.filter(Service.manager_id == current_user.id)
    pending_tasks = tasks_query.filter(Task.status == TaskStatus.PENDING).count()
    
    # Inquiries
    inquiries_query = db.query(ClientInquiry).filter(ClientInquiry.is_deleted == 0)
    if not is_admin:
        inquiries_query = inquiries_query.filter(
            (ClientInquiry.created_by_id == current_user.id) |
            (ClientInquiry.assigned_to_id == current_user.id)
        )
    new_inquiries = inquiries_query.filter(ClientInquiry.status == InquiryStatus.NEW).count()
    
    return {
        "total_services": total_services,
        "active_services": active_services,
        "total_revenue": float(total_revenue),
        "total_employees": total_employees,
        "pending_tasks": pending_tasks,
        "new_inquiries": new_inquiries,
    }
