"""
Tessolve Executive Portal - Inventory API Endpoints
Handles inventory management, BOM, requests, and AI analysis.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import os

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.inventory_service import InventoryService
from app.schemas.inventory import (
    VendorCreate, VendorUpdate, VendorResponse,
    ComponentCreate, ComponentUpdate, ComponentResponse,
    BOMCreate, BOMResponse,
    InventoryRequestCreate, InventoryRequestUpdate, InventoryRequestResponse,
    AIAnalysisRequest, AIAnalysisResponse,
    VendorSuggestionRequest, VendorSuggestionResponse,
    InventoryReportRequest, InventoryReportResponse,
    ApprovalAction, BOMUploadRequest
)
from app.config import settings


router = APIRouter(prefix="/inventory", tags=["Inventory Management"])


def get_inventory_service(db: Session = Depends(get_db)) -> InventoryService:
    """Get inventory service instance."""
    api_key = os.getenv("ANTHROPIC_API_KEY") or getattr(settings, 'ANTHROPIC_API_KEY', None)
    return InventoryService(db, api_key)


# ==================== Vendors ====================

@router.get("/vendors", response_model=List[VendorResponse])
async def get_vendors(
    active_only: bool = True,
    current_user: User = Depends(get_current_user),
    service: InventoryService = Depends(get_inventory_service)
):
    """Get all vendors."""
    return service.get_vendors(active_only)


@router.post("/vendors", response_model=VendorResponse)
async def create_vendor(
    data: VendorCreate,
    current_user: User = Depends(get_current_user),
    service: InventoryService = Depends(get_inventory_service)
):
    """Create a new vendor."""
    return service.create_vendor(data)


@router.get("/vendors/{vendor_id}", response_model=VendorResponse)
async def get_vendor(
    vendor_id: int,
    current_user: User = Depends(get_current_user),
    service: InventoryService = Depends(get_inventory_service)
):
    """Get vendor by ID."""
    return service.get_vendor_by_id(vendor_id)


@router.put("/vendors/{vendor_id}", response_model=VendorResponse)
async def update_vendor(
    vendor_id: int,
    data: VendorUpdate,
    current_user: User = Depends(get_current_user),
    service: InventoryService = Depends(get_inventory_service)
):
    """Update vendor."""
    return service.update_vendor(vendor_id, data)


# ==================== Components ====================

@router.get("/components", response_model=List[ComponentResponse])
async def get_components(
    component_type: Optional[str] = None,
    category: Optional[str] = None,
    active_only: bool = True,
    current_user: User = Depends(get_current_user),
    service: InventoryService = Depends(get_inventory_service)
):
    """Get all components with optional filtering."""
    return service.get_components(component_type, category, active_only)


@router.post("/components", response_model=ComponentResponse)
async def create_component(
    data: ComponentCreate,
    current_user: User = Depends(get_current_user),
    service: InventoryService = Depends(get_inventory_service)
):
    """Create a new component."""
    return service.create_component(data)


@router.get("/components/{component_id}", response_model=ComponentResponse)
async def get_component(
    component_id: int,
    current_user: User = Depends(get_current_user),
    service: InventoryService = Depends(get_inventory_service)
):
    """Get component by ID."""
    return service.get_component_by_id(component_id)


@router.get("/components/alerts/low-stock", response_model=List[ComponentResponse])
async def get_low_stock_components(
    current_user: User = Depends(get_current_user),
    service: InventoryService = Depends(get_inventory_service)
):
    """Get components below minimum stock level."""
    return service.get_low_stock_components()


# ==================== Bill of Materials ====================

@router.get("/bom", response_model=List[BOMResponse])
async def get_boms(
    service_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    service: InventoryService = Depends(get_inventory_service)
):
    """Get all BOMs."""
    return service.get_boms(service_id)


@router.post("/bom", response_model=BOMResponse)
async def create_bom(
    data: BOMCreate,
    current_user: User = Depends(get_current_user),
    service: InventoryService = Depends(get_inventory_service)
):
    """Create a new BOM."""
    return service.create_bom(data, current_user.id)


@router.get("/bom/{bom_id}", response_model=BOMResponse)
async def get_bom(
    bom_id: int,
    current_user: User = Depends(get_current_user),
    service: InventoryService = Depends(get_inventory_service)
):
    """Get BOM by ID."""
    return service.get_bom_by_id(bom_id)


@router.post("/bom/upload")
async def upload_bom(
    data: BOMUploadRequest,
    current_user: User = Depends(get_current_user),
    service: InventoryService = Depends(get_inventory_service)
):
    """Upload and parse a BOM file."""
    items = service.parse_bom_file(data.file_content, data.file_type)
    return {"success": True, "items": items, "count": len(items)}


# ==================== AI Analysis ====================

@router.post("/ai/analyze-service")
async def analyze_service_requirements(
    data: AIAnalysisRequest,
    current_user: User = Depends(get_current_user),
    service: InventoryService = Depends(get_inventory_service)
):
    """Use AI to analyze service requirements and suggest components."""
    analysis = service.analyze_service_requirements(
        data.service_id,
        additional_context=data.requirements
    )
    return {"success": True, "analysis": analysis}


@router.post("/ai/suggest-vendors")
async def suggest_vendors(
    data: VendorSuggestionRequest,
    current_user: User = Depends(get_current_user),
    service: InventoryService = Depends(get_inventory_service)
):
    """Use AI to suggest best vendors for a component."""
    suggestions = service.suggest_vendors(
        data.component_name,
        data.component_type.value,
        data.category.value,
        data.quantity,
        data.required_by_date
    )
    return {"success": True, "suggestions": suggestions}


@router.post("/ai/generate-bom/{service_id}")
async def generate_bom_from_service(
    service_id: int,
    requirements: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    inv_service: InventoryService = Depends(get_inventory_service)
):
    """Generate a BOM automatically from service analysis."""
    # First analyze the service
    analysis = inv_service.analyze_service_requirements(service_id, requirements)
    
    if "error" in analysis:
        return {"success": False, "error": analysis["error"]}
    
    # Create BOM from analysis
    from app.schemas.inventory import BOMCreate, BOMItemCreate, ComponentTypeEnum, ComponentCategoryEnum
    
    items = []
    
    # Add hardware components
    for hw in analysis.get("hardware_components", []):
        items.append(BOMItemCreate(
            component_id=hw.get("existing_component_id"),
            custom_name=hw["name"],
            custom_description=hw.get("description"),
            custom_type=ComponentTypeEnum.HARDWARE,
            custom_category=ComponentCategoryEnum(hw.get("category", "other")),
            quantity=hw.get("quantity", 1),
            unit_price=hw.get("estimated_unit_price")
        ))
    
    # Add software components
    for sw in analysis.get("software_components", []):
        items.append(BOMItemCreate(
            component_id=sw.get("existing_component_id"),
            custom_name=sw["name"],
            custom_description=sw.get("description"),
            custom_type=ComponentTypeEnum.SOFTWARE,
            custom_category=ComponentCategoryEnum(sw.get("category", "other")),
            quantity=sw.get("quantity", 1),
            unit_price=sw.get("estimated_unit_price")
        ))
    
    # Get service name
    from app.models.service import Service
    db = inv_service.db
    svc = db.query(Service).filter(Service.id == service_id).first()
    
    bom_data = BOMCreate(
        name=f"AI Generated BOM - {svc.name if svc else 'Service ' + str(service_id)}",
        version="1.0",
        service_id=service_id,
        description=analysis.get("analysis_summary"),
        items=items
    )
    
    bom = inv_service.create_bom(bom_data, current_user.id)
    
    # Mark as AI generated
    bom.ai_generated = True
    bom.ai_analysis = analysis
    db.commit()
    
    return {
        "success": True,
        "bom_id": bom.id,
        "analysis": analysis,
        "items_created": len(items)
    }


# ==================== Inventory Requests ====================

@router.get("/requests", response_model=List[InventoryRequestResponse])
async def get_inventory_requests(
    status: Optional[str] = None,
    my_requests: bool = False,
    current_user: User = Depends(get_current_user),
    service: InventoryService = Depends(get_inventory_service)
):
    """Get inventory requests."""
    user_id = current_user.id if my_requests else None
    requests = service.get_inventory_requests(status, user_id)
    
    # Convert to response format
    result = []
    for r in requests:
        result.append({
            "id": r.id,
            "request_number": r.request_number,
            "service_id": r.service_id,
            "bom_id": r.bom_id,
            "requested_by_id": r.requested_by_id,
            "requested_by_name": r.requested_by.full_name if r.requested_by else None,
            "department_id": r.department_id,
            "department_name": r.department.name if r.department else None,
            "title": r.title,
            "description": r.description,
            "justification": r.justification,
            "priority": r.priority,
            "required_by_date": r.required_by_date,
            "status": r.status,
            "total_amount": r.total_amount,
            "currency": r.currency,
            "ai_analysis": r.ai_analysis,
            "items": [
                {
                    "id": i.id,
                    "request_id": i.request_id,
                    "component_id": i.component_id,
                    "vendor_id": i.vendor_id,
                    "name": i.name,
                    "description": i.description,
                    "component_type": i.component_type,
                    "category": i.category,
                    "quantity": i.quantity,
                    "unit_price": i.unit_price,
                    "total_price": i.total_price,
                    "currency": i.currency,
                    "expected_delivery_date": i.expected_delivery_date,
                    "status": i.status,
                    "ai_suggested_vendor": i.ai_suggested_vendor,
                    "ai_reasoning": i.ai_reasoning,
                    "vendor": {
                        "id": i.vendor.id,
                        "name": i.vendor.name
                    } if i.vendor else None,
                    "created_at": i.created_at
                }
                for i in r.items
            ],
            "approvals": [
                {
                    "id": a.id,
                    "level": a.level,
                    "approver_id": a.approver_id,
                    "approver_name": a.approver.full_name if a.approver else None,
                    "status": a.status,
                    "comments": a.comments,
                    "approved_at": a.approved_at,
                    "email_sent": a.email_sent,
                    "created_at": a.created_at
                }
                for a in r.approvals
            ],
            "created_at": r.created_at,
            "updated_at": r.updated_at
        })
    
    return result


@router.post("/requests", response_model=InventoryRequestResponse)
async def create_inventory_request(
    data: InventoryRequestCreate,
    current_user: User = Depends(get_current_user),
    service: InventoryService = Depends(get_inventory_service)
):
    """Create a new inventory request."""
    request = service.create_inventory_request(data, current_user)
    return service.get_request_by_id(request.id)


@router.get("/requests/{request_id}")
async def get_inventory_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    service: InventoryService = Depends(get_inventory_service)
):
    """Get inventory request by ID."""
    r = service.get_request_by_id(request_id)
    return {
        "id": r.id,
        "request_number": r.request_number,
        "service_id": r.service_id,
        "bom_id": r.bom_id,
        "requested_by_id": r.requested_by_id,
        "requested_by_name": r.requested_by.full_name if r.requested_by else None,
        "department_id": r.department_id,
        "department_name": r.department.name if r.department else None,
        "title": r.title,
        "description": r.description,
        "justification": r.justification,
        "priority": r.priority,
        "required_by_date": r.required_by_date,
        "status": r.status.value,
        "total_amount": r.total_amount,
        "currency": r.currency,
        "ai_analysis": r.ai_analysis,
        "service_name": r.service.name if r.service else None,
        "items": [
            {
                "id": i.id,
                "name": i.name,
                "description": i.description,
                "component_type": i.component_type.value if i.component_type else None,
                "category": i.category.value if i.category else None,
                "quantity": i.quantity,
                "unit_price": float(i.unit_price) if i.unit_price else None,
                "total_price": float(i.total_price) if i.total_price else None,
                "status": i.status,
                "vendor": {"id": i.vendor.id, "name": i.vendor.name} if i.vendor else None,
                "ai_reasoning": i.ai_reasoning
            }
            for i in r.items
        ],
        "approvals": [
            {
                "id": a.id,
                "level": a.level.value,
                "approver_name": a.approver.full_name if a.approver else None,
                "status": a.status.value,
                "comments": a.comments,
                "approved_at": a.approved_at
            }
            for a in r.approvals
        ],
        "created_at": r.created_at,
        "updated_at": r.updated_at
    }


@router.post("/requests/{request_id}/submit")
async def submit_request_for_approval(
    request_id: int,
    current_user: User = Depends(get_current_user),
    service: InventoryService = Depends(get_inventory_service)
):
    """Submit request for approval."""
    request = service.submit_for_approval(request_id, current_user)
    return {"success": True, "status": request.status.value}


@router.post("/requests/{request_id}/approvals/{approval_id}")
async def process_approval(
    request_id: int,
    approval_id: int,
    action: ApprovalAction,
    current_user: User = Depends(get_current_user),
    service: InventoryService = Depends(get_inventory_service)
):
    """Process an approval action."""
    request = service.process_approval(request_id, approval_id, action, current_user)
    return {"success": True, "status": request.status.value}


# ==================== Reports ====================

@router.post("/reports")
async def generate_report(
    data: InventoryReportRequest,
    current_user: User = Depends(get_current_user),
    service: InventoryService = Depends(get_inventory_service)
):
    """Generate inventory report."""
    report = service.generate_inventory_report(data.report_type, data.filters)
    return report


@router.get("/reports/dashboard")
async def get_inventory_dashboard(
    current_user: User = Depends(get_current_user),
    service: InventoryService = Depends(get_inventory_service)
):
    """Get inventory dashboard data."""
    # Components summary
    from app.models.inventory import Component, Vendor, InventoryRequest, RequestStatus
    db = service.db
    
    total_components = db.query(Component).filter(Component.is_active == True).count()
    low_stock = db.query(Component).filter(
        Component.is_active == True,
        Component.quantity_in_stock <= Component.minimum_stock_level
    ).count()
    
    # Vendors
    total_vendors = db.query(Vendor).filter(Vendor.is_active == True).count()
    
    # Requests
    pending_requests = db.query(InventoryRequest).filter(
        InventoryRequest.is_deleted == 0,
        InventoryRequest.status.in_([
            RequestStatus.PENDING_APPROVAL,
            RequestStatus.MANAGER_APPROVED
        ])
    ).count()
    
    total_requests = db.query(InventoryRequest).filter(
        InventoryRequest.is_deleted == 0
    ).count()
    
    return {
        "total_components": total_components,
        "low_stock_alerts": low_stock,
        "total_vendors": total_vendors,
        "pending_requests": pending_requests,
        "total_requests": total_requests
    }
