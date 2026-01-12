"""
Tessolve Executive Portal - Services API Endpoints
CRUD operations for services and projects.
"""

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from typing import List

from app.api.deps import (
    get_db,
    get_current_user,
    get_client_ip,
    get_user_agent,
)
from app.models.user import User
from app.models.service import Service
from app.services.service_service import ServiceService
from app.services.audit_service import AuditService
from app.models.audit import AuditAction, AuditModule
from app.core.permissions import Permissions, PermissionChecker
from app.core.exceptions import PermissionDeniedError
from app.schemas.service import (
    ServiceCreate,
    ServiceUpdate,
    ServiceResponse,
    ServiceWithCTIResponse,
    ServiceFilterRequest,
    ServiceListResponse,
    ServiceAnalytics,
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
)


router = APIRouter(prefix="/services", tags=["Services"])


def service_to_response(service: Service, include_cti: bool = False):
    """Convert Service model to response schema."""
    response_data = {
        "id": service.id,
        "name": service.name,
        "description": service.description,
        "notes": service.notes,
        "customer_name": service.customer_name,
        "customer_type": service.customer_type.value,
        "customer_contact": service.customer_contact,
        "customer_email": service.customer_email,
        "status": service.status.value,
        "engagement_model_id": service.engagement_model_id,
        "service_category_id": service.service_category_id,
        "sector_id": service.sector_id,
        "department_id": service.department_id,
        "contract_value": service.contract_value,
        "currency": service.currency,
        "capex": service.capex,
        "opex": service.opex,
        "resource_count": service.resource_count,
        "start_date": service.start_date,
        "end_date": service.end_date,
        "manager_id": service.manager_id,
        "created_at": service.created_at,
        "updated_at": service.updated_at,
        "projects": [
            ProjectResponse(
                id=p.id,
                service_id=p.service_id,
                name=p.name,
                description=p.description,
                status=p.status.value,
                start_date=p.start_date,
                end_date=p.end_date,
                progress_percentage=p.progress_percentage,
                created_at=p.created_at,
                updated_at=p.updated_at,
            ) for p in service.projects
        ],
        "technology_ids": [t.id for t in service.technologies],
        "technology_names": [t.name for t in service.technologies],
        "engagement_model_name": service.engagement_model.name if service.engagement_model else None,
        "service_category_name": service.service_category.name if service.service_category else None,
        "sector_name": service.sector.name if service.sector else None,
        "department_name": service.department.name if service.department else None,
        "manager_name": service.manager.full_name if service.manager else None,
    }
    
    if include_cti:
        response_data.update({
            "cti_strategic_insights": service.cti_strategic_insights,
            "cti_managerial_notes": service.cti_managerial_notes,
            "cti_competitive_intel": service.cti_competitive_intel,
            "cti_risk_assessment": service.cti_risk_assessment,
            "cti_classification": service.cti_classification,
        })
        return ServiceWithCTIResponse(**response_data)
    
    return ServiceResponse(**response_data)


@router.post("/filter", response_model=ServiceListResponse)
async def filter_services(
    filter_request: ServiceFilterRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Filter and list services with pagination.
    All authenticated users can view services.
    """
    service_svc = ServiceService(db)
    services, total = service_svc.filter_services(filter_request)
    
    total_pages = (total + filter_request.page_size - 1) // filter_request.page_size
    
    return ServiceListResponse(
        success=True,
        data=[service_to_response(s) for s in services],
        total=total,
        page=filter_request.page,
        page_size=filter_request.page_size,
        total_pages=total_pages,
    )


@router.get("/list")
async def list_all_services(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get all services (simple list for dropdowns).
    Returns basic service info without pagination.
    """
    service_svc = ServiceService(db)
    services, total = service_svc.filter_services(
        ServiceFilterRequest(page=1, page_size=1000)
    )
    
    result = []
    for s in services:
        # Handle status whether it's an enum or string
        status_value = s.status.value if hasattr(s.status, 'value') else str(s.status)
        result.append({
            "id": s.id,
            "name": s.name,
            "customer_name": s.customer_name,
            "status": status_value,
            "description": s.description
        })
    
    return result


@router.post("", response_model=ServiceResponse)
async def create_service(
    request: Request,
    service_data: ServiceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new service.
    Requires services.write permission (Manager/Admin).
    """
    # Check permission
    if not current_user.has_permission(Permissions.SERVICES_WRITE):
        raise PermissionDeniedError("You don't have permission to create services")
    
    service_svc = ServiceService(db)
    service = service_svc.create_service(service_data, manager_id=current_user.id)
    
    # Audit log
    audit_svc = AuditService(db)
    audit_svc.log(
        action=AuditAction.CREATE,
        module=AuditModule.SERVICES,
        user=current_user,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
        resource_type="service",
        resource_id=service.id,
        description=f"Created service: {service.name}",
        new_values={"name": service.name, "customer": service.customer_name},
    )
    
    return service_to_response(service)


@router.get("/{service_id}", response_model=ServiceResponse)
async def get_service(
    service_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get a service by ID.
    """
    service_svc = ServiceService(db)
    service = service_svc.get_service_by_id(service_id)
    
    # Check if user can see CTI data
    include_cti = current_user.has_permission(Permissions.CTI_READ)
    
    return service_to_response(service, include_cti=include_cti)


@router.put("/{service_id}", response_model=ServiceResponse)
async def update_service(
    request: Request,
    service_id: int,
    service_data: ServiceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update a service.
    Requires services.write permission.
    """
    if not current_user.has_permission(Permissions.SERVICES_WRITE):
        raise PermissionDeniedError("You don't have permission to update services")
    
    service_svc = ServiceService(db)
    service = service_svc.update_service(service_id, service_data)
    
    # Audit log
    audit_svc = AuditService(db)
    audit_svc.log(
        action=AuditAction.UPDATE,
        module=AuditModule.SERVICES,
        user=current_user,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
        resource_type="service",
        resource_id=service.id,
        description=f"Updated service: {service.name}",
    )
    
    include_cti = current_user.has_permission(Permissions.CTI_READ)
    return service_to_response(service, include_cti=include_cti)


@router.delete("/{service_id}")
async def delete_service(
    request: Request,
    service_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a service (soft delete).
    Requires services.delete permission.
    """
    if not current_user.has_permission(Permissions.SERVICES_DELETE):
        raise PermissionDeniedError("You don't have permission to delete services")
    
    service_svc = ServiceService(db)
    service = service_svc.get_service_by_id(service_id)
    service_name = service.name
    
    service_svc.delete_service(service_id)
    
    # Audit log
    audit_svc = AuditService(db)
    audit_svc.log(
        action=AuditAction.DELETE,
        module=AuditModule.SERVICES,
        user=current_user,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
        resource_type="service",
        resource_id=service_id,
        description=f"Deleted service: {service_name}",
    )
    
    return {"success": True, "message": "Service deleted successfully"}


@router.get("/{service_id}/cti", response_model=ServiceWithCTIResponse)
async def get_service_cti(
    request: Request,
    service_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get service with CTI data.
    Requires cti.read permission (Manager/Admin only).
    """
    if not current_user.has_permission(Permissions.CTI_READ):
        raise PermissionDeniedError("You don't have permission to access CTI data")
    
    service_svc = ServiceService(db)
    service = service_svc.get_service_by_id(service_id)
    
    # Audit CTI access
    audit_svc = AuditService(db)
    audit_svc.log_cti_access(
        user=current_user,
        resource_type="service",
        resource_id=service_id,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    
    return service_to_response(service, include_cti=True)


# ============ Project Endpoints ============

@router.post("/{service_id}/projects", response_model=ProjectResponse)
async def add_project(
    service_id: int,
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Add a project to a service.
    Requires services.write permission.
    """
    if not current_user.has_permission(Permissions.SERVICES_WRITE):
        raise PermissionDeniedError("You don't have permission to add projects")
    
    service_svc = ServiceService(db)
    project = service_svc.add_project(service_id, project_data)
    
    return ProjectResponse(
        id=project.id,
        service_id=project.service_id,
        name=project.name,
        description=project.description,
        status=project.status.value,
        start_date=project.start_date,
        end_date=project.end_date,
        progress_percentage=project.progress_percentage,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


@router.put("/projects/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a project."""
    if not current_user.has_permission(Permissions.SERVICES_WRITE):
        raise PermissionDeniedError("You don't have permission to update projects")
    
    service_svc = ServiceService(db)
    project = service_svc.update_project(project_id, project_data)
    
    return ProjectResponse(
        id=project.id,
        service_id=project.service_id,
        name=project.name,
        description=project.description,
        status=project.status.value,
        start_date=project.start_date,
        end_date=project.end_date,
        progress_percentage=project.progress_percentage,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


@router.delete("/projects/{project_id}")
async def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a project."""
    if not current_user.has_permission(Permissions.SERVICES_WRITE):
        raise PermissionDeniedError("You don't have permission to delete projects")
    
    service_svc = ServiceService(db)
    service_svc.delete_project(project_id)
    
    return {"success": True, "message": "Project deleted successfully"}


# ============ Analytics Endpoint ============

@router.get("/analytics/dashboard", response_model=ServiceAnalytics)
async def get_service_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get service analytics for dashboard.
    """
    service_svc = ServiceService(db)
    return service_svc.get_analytics()
