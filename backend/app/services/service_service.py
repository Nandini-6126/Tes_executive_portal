"""
Tessolve Executive Portal - Service Business Logic
Handles all service-related operations.
"""

from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_, and_

from app.models.service import Service, Project, ServiceStatus, ProjectStatus, CustomerType
from app.models.master_data import Technology, Sector, EngagementModel, ServiceCategory, Department
from app.models.user import User
from app.schemas.service import (
    ServiceCreate, 
    ServiceUpdate, 
    ServiceFilterRequest,
    ServiceAnalytics,
    ProjectCreate,
    ProjectUpdate,
)
from app.core.exceptions import NotFoundError, ValidationError


class ServiceService:
    """Service layer for service operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_service(
        self, 
        data: ServiceCreate, 
        manager_id: int
    ) -> Service:
        """
        Create a new service.
        
        Args:
            data: Service creation data
            manager_id: ID of the manager creating the service
            
        Returns:
            Created Service object
        """
        try:
            # Create service
            service = Service(
                name=data.name,
                description=data.description,
                notes=data.notes,
                customer_name=data.customer_name,
                customer_type=CustomerType(data.customer_type.value) if data.customer_type else CustomerType.NEW,
                customer_contact=data.customer_contact,
                customer_email=data.customer_email,
                status=ServiceStatus(data.status.value) if data.status else ServiceStatus.DRAFT,
                engagement_model_id=data.engagement_model_id,
                service_category_id=data.service_category_id,
                sector_id=data.sector_id,
                department_id=data.department_id,
                contract_value=data.contract_value,
                currency=data.currency or "USD",
                capex=data.capex,
                opex=data.opex,
                resource_count=data.resource_count or 0,
                start_date=data.start_date,
                end_date=data.end_date,
                manager_id=manager_id,
                is_deleted=0,  # Explicitly set to 0
                # CTI Data
                cti_strategic_insights=data.cti_strategic_insights,
                cti_managerial_notes=data.cti_managerial_notes,
                cti_competitive_intel=data.cti_competitive_intel,
                cti_risk_assessment=data.cti_risk_assessment,
                cti_classification=data.cti_classification or "internal",
            )
            
            # Add technologies
            if data.technology_ids:
                technologies = self.db.query(Technology).filter(
                    Technology.id.in_(data.technology_ids)
                ).all()
                service.technologies = technologies
            
            self.db.add(service)
            self.db.commit()
            
            # Reload with all relationships
            return self.get_service_by_id(service.id)
        except Exception as e:
            self.db.rollback()
            raise ValidationError(f"Failed to create service: {str(e)}")
    
    def update_service(
        self, 
        service_id: int, 
        data: ServiceUpdate
    ) -> Service:
        """
        Update an existing service.
        
        Args:
            service_id: ID of the service to update
            data: Update data
            
        Returns:
            Updated Service object
        """
        service = self.get_service_by_id(service_id)
        
        # Update fields that are provided
        update_data = data.model_dump(exclude_unset=True, exclude={'technology_ids'})
        
        for field, value in update_data.items():
            if value is not None:
                # Handle enum conversions
                if field == 'status' and value:
                    value = ServiceStatus(value.value)
                elif field == 'customer_type' and value:
                    value = CustomerType(value.value)
                setattr(service, field, value)
        
        # Update technologies if provided
        if data.technology_ids is not None:
            technologies = self.db.query(Technology).filter(
                Technology.id.in_(data.technology_ids)
            ).all()
            service.technologies = technologies
        
        self.db.commit()
        self.db.refresh(service)
        
        return service
    
    def get_service_by_id(self, service_id: int, include_deleted: bool = False) -> Service:
        """
        Get a service by ID.
        
        Args:
            service_id: Service ID
            include_deleted: Include soft-deleted services
            
        Returns:
            Service object
            
        Raises:
            NotFoundError: If service not found
        """
        query = self.db.query(Service).options(
            joinedload(Service.projects),
            joinedload(Service.technologies),
            joinedload(Service.manager),
            joinedload(Service.engagement_model),
            joinedload(Service.service_category),
            joinedload(Service.sector),
            joinedload(Service.department),
        ).filter(Service.id == service_id)
        
        if not include_deleted:
            query = query.filter(Service.is_deleted == 0)
        
        service = query.first()
        
        if not service:
            raise NotFoundError(f"Service with ID {service_id} not found")
        
        return service
    
    def delete_service(self, service_id: int, hard_delete: bool = False) -> bool:
        """
        Delete a service (soft delete by default).
        
        Args:
            service_id: Service ID
            hard_delete: If True, permanently delete
            
        Returns:
            True if deleted
        """
        service = self.get_service_by_id(service_id)
        
        if hard_delete:
            self.db.delete(service)
        else:
            service.is_deleted = 1
            service.deleted_at = datetime.now(timezone.utc)
        
        self.db.commit()
        return True
    
    def filter_services(
        self, 
        filters: ServiceFilterRequest
    ) -> Tuple[List[Service], int]:
        """
        Filter services with pagination.
        
        Args:
            filters: Filter criteria
            
        Returns:
            Tuple of (services list, total count)
        """
        query = self.db.query(Service).options(
            joinedload(Service.projects),
            joinedload(Service.technologies),
            joinedload(Service.manager),
            joinedload(Service.engagement_model),
            joinedload(Service.service_category),
            joinedload(Service.sector),
            joinedload(Service.department),
        ).filter(Service.is_deleted == 0)
        
        # Apply filters
        if filters.search:
            search_term = f"%{filters.search}%"
            query = query.filter(
                or_(
                    Service.name.ilike(search_term),
                    Service.customer_name.ilike(search_term),
                    Service.description.ilike(search_term),
                )
            )
        
        if filters.status:
            status_values = [ServiceStatus(s.value) for s in filters.status]
            query = query.filter(Service.status.in_(status_values))
        
        if filters.customer_type:
            query = query.filter(Service.customer_type == CustomerType(filters.customer_type.value))
        
        if filters.engagement_model_id:
            query = query.filter(Service.engagement_model_id == filters.engagement_model_id)
        
        if filters.service_category_id:
            query = query.filter(Service.service_category_id == filters.service_category_id)
        
        if filters.sector_id:
            query = query.filter(Service.sector_id == filters.sector_id)
        
        if filters.department_id:
            query = query.filter(Service.department_id == filters.department_id)
        
        if filters.manager_id:
            query = query.filter(Service.manager_id == filters.manager_id)
        
        if filters.resource_count_min is not None:
            query = query.filter(Service.resource_count >= filters.resource_count_min)
        
        if filters.resource_count_max is not None:
            query = query.filter(Service.resource_count <= filters.resource_count_max)
        
        if filters.technology_ids:
            query = query.filter(
                Service.technologies.any(Technology.id.in_(filters.technology_ids))
            )
        
        # Get total count
        total = query.count()
        
        # Apply sorting
        sort_column = getattr(Service, filters.sort_field, Service.created_at)
        if filters.sort_direction == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())
        
        # Apply pagination
        offset = (filters.page - 1) * filters.page_size
        services = query.offset(offset).limit(filters.page_size).all()
        
        return services, total
    
    def get_analytics(self) -> ServiceAnalytics:
        """
        Get service analytics for dashboard.
        
        Returns:
            ServiceAnalytics object
        """
        # Base query for non-deleted services
        base_query = self.db.query(Service).filter(Service.is_deleted == 0)
        
        # Total counts
        total_services = base_query.count()
        
        # Count by status
        active_services = base_query.filter(Service.status == ServiceStatus.ACTIVE).count()
        completed_services = base_query.filter(Service.status == ServiceStatus.COMPLETED).count()
        on_hold_services = base_query.filter(Service.status == ServiceStatus.ON_HOLD).count()
        draft_services = base_query.filter(Service.status == ServiceStatus.DRAFT).count()
        
        # Total contract value
        total_value = base_query.with_entities(
            func.coalesce(func.sum(Service.contract_value), 0)
        ).scalar() or Decimal("0")
        
        # Total resources
        total_resources = base_query.with_entities(
            func.coalesce(func.sum(Service.resource_count), 0)
        ).scalar() or 0
        
        # Customer counts
        new_customers = base_query.filter(Service.customer_type == CustomerType.NEW).count()
        existing_customers = base_query.filter(Service.customer_type == CustomerType.EXISTING).count()
        
        # Services by status
        services_by_status = {
            "active": active_services,
            "completed": completed_services,
            "on_hold": on_hold_services,
            "draft": draft_services,
            "cancelled": base_query.filter(Service.status == ServiceStatus.CANCELLED).count(),
        }
        
        # Services by sector
        sector_counts = self.db.query(
            Sector.name,
            func.count(Service.id)
        ).join(Service, Service.sector_id == Sector.id).filter(
            Service.is_deleted == 0
        ).group_by(Sector.name).all()
        
        services_by_sector = {name: count for name, count in sector_counts}
        
        # Services by category
        category_counts = self.db.query(
            ServiceCategory.name,
            func.count(Service.id)
        ).join(Service, Service.service_category_id == ServiceCategory.id).filter(
            Service.is_deleted == 0
        ).group_by(ServiceCategory.name).all()
        
        services_by_category = {name: count for name, count in category_counts}
        
        return ServiceAnalytics(
            total_services=total_services,
            active_services=active_services,
            completed_services=completed_services,
            on_hold_services=on_hold_services,
            draft_services=draft_services,
            total_contract_value=total_value,
            total_resources=total_resources,
            new_customers=new_customers,
            existing_customers=existing_customers,
            services_by_status=services_by_status,
            services_by_sector=services_by_sector,
            services_by_category=services_by_category,
        )
    
    # ============ Project Operations ============
    
    def add_project(self, service_id: int, data: ProjectCreate) -> Project:
        """Add a project to a service."""
        # Verify service exists
        service = self.get_service_by_id(service_id)
        
        project = Project(
            service_id=service_id,
            name=data.name,
            description=data.description,
            status=ProjectStatus(data.status.value),
            start_date=data.start_date,
            end_date=data.end_date,
            progress_percentage=data.progress_percentage,
        )
        
        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)
        
        return project
    
    def update_project(self, project_id: int, data: ProjectUpdate) -> Project:
        """Update a project."""
        project = self.db.query(Project).filter(Project.id == project_id).first()
        
        if not project:
            raise NotFoundError(f"Project with ID {project_id} not found")
        
        update_data = data.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            if value is not None:
                if field == 'status' and value:
                    value = ProjectStatus(value.value)
                setattr(project, field, value)
        
        self.db.commit()
        self.db.refresh(project)
        
        return project
    
    def delete_project(self, project_id: int) -> bool:
        """Delete a project."""
        project = self.db.query(Project).filter(Project.id == project_id).first()
        
        if not project:
            raise NotFoundError(f"Project with ID {project_id} not found")
        
        self.db.delete(project)
        self.db.commit()
        
        return True
