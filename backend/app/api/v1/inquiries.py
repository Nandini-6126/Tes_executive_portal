"""
Client Inquiries API Endpoints
Manage client service inquiries and sales pipeline.
"""

from typing import Optional
from datetime import datetime, timezone, date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_db, get_current_user
from app.models import User, Client, Service
from app.models.inquiry import ClientInquiry, InquiryActivity, InquiryStatus, InquiryPriority, InquirySource
from app.schemas.inquiry import (
    InquiryCreate, InquiryUpdate, InquiryResponse, InquiryDetailResponse,
    InquiryListResponse, InquiryActivityCreate, InquiryActivityResponse,
    InquiryConvertRequest, InquiryStats
)

router = APIRouter(prefix="/inquiries", tags=["Client Inquiries"])


def generate_inquiry_number(db: Session) -> str:
    """Generate a unique inquiry number."""
    year = datetime.now().year
    prefix = f"INQ-{year}-"
    
    # Get the latest inquiry number for this year
    latest = db.query(ClientInquiry).filter(
        ClientInquiry.inquiry_number.like(f"{prefix}%")
    ).order_by(ClientInquiry.id.desc()).first()
    
    if latest:
        try:
            last_num = int(latest.inquiry_number.split('-')[-1])
            new_num = last_num + 1
        except:
            new_num = 1
    else:
        new_num = 1
    
    return f"{prefix}{new_num:04d}"


def inquiry_to_response(inquiry: ClientInquiry, db: Session) -> InquiryResponse:
    """Convert inquiry model to response schema."""
    activities_count = len(inquiry.activities) if inquiry.activities else 0
    
    return InquiryResponse(
        id=inquiry.id,
        inquiry_number=inquiry.inquiry_number,
        company_name=inquiry.company_name,
        contact_person=inquiry.contact_person,
        contact_email=inquiry.contact_email,
        contact_phone=inquiry.contact_phone,
        company_website=inquiry.company_website,
        company_size=inquiry.company_size,
        industry=inquiry.industry,
        title=inquiry.title,
        description=inquiry.description,
        requirements=inquiry.requirements,
        service_type=inquiry.service_type,
        status=inquiry.status,
        priority=inquiry.priority,
        source=inquiry.source,
        estimated_budget=inquiry.estimated_budget,
        currency=inquiry.currency,
        estimated_value=inquiry.estimated_value,
        expected_start_date=inquiry.expected_start_date,
        decision_date=inquiry.decision_date,
        next_follow_up_date=inquiry.next_follow_up_date,
        last_contact_date=inquiry.last_contact_date,
        win_probability=inquiry.win_probability,
        internal_notes=inquiry.internal_notes,
        assigned_to_id=inquiry.assigned_to_id,
        assigned_to_name=inquiry.assigned_to.full_name if inquiry.assigned_to else None,
        created_by_id=inquiry.created_by_id,
        created_by_name=inquiry.created_by.full_name if inquiry.created_by else None,
        converted_to_client_id=inquiry.converted_to_client_id,
        converted_to_service_id=inquiry.converted_to_service_id,
        converted_at=inquiry.converted_at,
        is_converted=inquiry.is_converted,
        loss_reason=inquiry.loss_reason,
        activities_count=activities_count,
        created_at=inquiry.created_at,
        updated_at=inquiry.updated_at,
    )


@router.get("", response_model=InquiryListResponse)
async def get_inquiries(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[InquiryStatus] = None,
    priority: Optional[InquiryPriority] = None,
    source: Optional[InquirySource] = None,
    assigned_to_me: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all client inquiries."""
    query = db.query(ClientInquiry).filter(ClientInquiry.is_deleted == 0)
    
    # Filter by assignment for non-admin
    if current_user.role.name != "admin":
        query = query.filter(
            (ClientInquiry.created_by_id == current_user.id) |
            (ClientInquiry.assigned_to_id == current_user.id)
        )
    
    if assigned_to_me:
        query = query.filter(ClientInquiry.assigned_to_id == current_user.id)
    
    # Search filter
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (ClientInquiry.company_name.ilike(search_filter)) |
            (ClientInquiry.contact_person.ilike(search_filter)) |
            (ClientInquiry.title.ilike(search_filter)) |
            (ClientInquiry.inquiry_number.ilike(search_filter))
        )
    
    # Status filter
    if status:
        query = query.filter(ClientInquiry.status == status)
    
    # Priority filter
    if priority:
        query = query.filter(ClientInquiry.priority == priority)
    
    # Source filter
    if source:
        query = query.filter(ClientInquiry.source == source)
    
    # Get total count
    total = query.count()
    
    # Paginate
    inquiries = query.order_by(ClientInquiry.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    return InquiryListResponse(
        data=[inquiry_to_response(i, db) for i in inquiries],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.get("/stats", response_model=InquiryStats)
async def get_inquiry_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get inquiry statistics."""
    query = db.query(ClientInquiry).filter(ClientInquiry.is_deleted == 0)
    
    if current_user.role.name != "admin":
        query = query.filter(
            (ClientInquiry.created_by_id == current_user.id) |
            (ClientInquiry.assigned_to_id == current_user.id)
        )
    
    inquiries = query.all()
    
    total = len(inquiries)
    new_count = sum(1 for i in inquiries if i.status == InquiryStatus.NEW)
    in_progress = sum(1 for i in inquiries if i.status in [
        InquiryStatus.CONTACTED, InquiryStatus.MEETING_SCHEDULED,
        InquiryStatus.PROPOSAL_SENT, InquiryStatus.NEGOTIATING
    ])
    won = sum(1 for i in inquiries if i.status == InquiryStatus.WON)
    lost = sum(1 for i in inquiries if i.status == InquiryStatus.LOST)
    
    total_estimated = sum((i.estimated_value or Decimal("0")) for i in inquiries)
    total_won = sum((i.estimated_value or Decimal("0")) for i in inquiries if i.status == InquiryStatus.WON)
    
    closed = won + lost
    conversion_rate = (won / closed * 100) if closed > 0 else 0
    
    active_inquiries = [i for i in inquiries if i.status not in [InquiryStatus.WON, InquiryStatus.LOST]]
    avg_probability = sum(i.win_probability for i in active_inquiries) / len(active_inquiries) if active_inquiries else 0
    
    # By status
    by_status = {}
    for s in InquiryStatus:
        by_status[s.value] = sum(1 for i in inquiries if i.status == s)
    
    # By source
    by_source = {}
    for s in InquirySource:
        by_source[s.value] = sum(1 for i in inquiries if i.source == s)
    
    # By priority
    by_priority = {}
    for p in InquiryPriority:
        by_priority[p.value] = sum(1 for i in inquiries if i.priority == p)
    
    return InquiryStats(
        total_inquiries=total,
        new_inquiries=new_count,
        in_progress=in_progress,
        won=won,
        lost=lost,
        total_estimated_value=total_estimated,
        total_won_value=total_won,
        conversion_rate=round(conversion_rate, 1),
        avg_win_probability=round(avg_probability, 1),
        by_status=by_status,
        by_source=by_source,
        by_priority=by_priority,
    )


@router.post("", response_model=InquiryResponse, status_code=status.HTTP_201_CREATED)
async def create_inquiry(
    inquiry_data: InquiryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new client inquiry."""
    inquiry = ClientInquiry(
        **inquiry_data.model_dump(),
        inquiry_number=generate_inquiry_number(db),
        created_by_id=current_user.id,
    )
    db.add(inquiry)
    
    # Add creation activity
    activity = InquiryActivity(
        inquiry=inquiry,
        activity_type="created",
        title="Inquiry Created",
        description=f"New inquiry created for {inquiry_data.company_name}",
        performed_by_id=current_user.id,
    )
    db.add(activity)
    
    db.commit()
    db.refresh(inquiry)
    
    return inquiry_to_response(inquiry, db)


@router.get("/{inquiry_id}", response_model=InquiryDetailResponse)
async def get_inquiry(
    inquiry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific inquiry with activities."""
    inquiry = db.query(ClientInquiry).filter(
        ClientInquiry.id == inquiry_id,
        ClientInquiry.is_deleted == 0
    ).first()
    
    if not inquiry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inquiry not found"
        )
    
    # Check access
    if current_user.role.name != "admin":
        if inquiry.created_by_id != current_user.id and inquiry.assigned_to_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this inquiry"
            )
    
    response = inquiry_to_response(inquiry, db)
    
    # Add activities
    activities = [
        InquiryActivityResponse(
            id=a.id,
            inquiry_id=a.inquiry_id,
            activity_type=a.activity_type,
            title=a.title,
            description=a.description,
            old_status=a.old_status,
            new_status=a.new_status,
            performed_by_id=a.performed_by_id,
            performed_by_name=a.performed_by.full_name if a.performed_by else None,
            created_at=a.created_at,
        )
        for a in sorted(inquiry.activities, key=lambda x: x.created_at, reverse=True)
    ]
    
    return InquiryDetailResponse(
        **response.model_dump(),
        activities=activities,
    )


@router.put("/{inquiry_id}", response_model=InquiryResponse)
async def update_inquiry(
    inquiry_id: int,
    inquiry_data: InquiryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an inquiry."""
    inquiry = db.query(ClientInquiry).filter(
        ClientInquiry.id == inquiry_id,
        ClientInquiry.is_deleted == 0
    ).first()
    
    if not inquiry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inquiry not found"
        )
    
    # Track status change for activity
    old_status = inquiry.status
    
    # Update fields
    update_data = inquiry_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(inquiry, field, value)
    
    # Add status change activity if status changed
    if inquiry_data.status and inquiry_data.status != old_status:
        activity = InquiryActivity(
            inquiry=inquiry,
            activity_type="status_change",
            title=f"Status changed to {inquiry_data.status.value}",
            description=f"Status updated from {old_status.value} to {inquiry_data.status.value}",
            old_status=old_status.value,
            new_status=inquiry_data.status.value,
            performed_by_id=current_user.id,
        )
        db.add(activity)
    
    db.commit()
    db.refresh(inquiry)
    
    return inquiry_to_response(inquiry, db)


@router.delete("/{inquiry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_inquiry(
    inquiry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Soft delete an inquiry."""
    inquiry = db.query(ClientInquiry).filter(
        ClientInquiry.id == inquiry_id,
        ClientInquiry.is_deleted == 0
    ).first()
    
    if not inquiry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inquiry not found"
        )
    
    inquiry.is_deleted = 1
    db.commit()
    
    return None


@router.post("/{inquiry_id}/activities", response_model=InquiryActivityResponse)
async def add_activity(
    inquiry_id: int,
    activity_data: InquiryActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add an activity to an inquiry."""
    inquiry = db.query(ClientInquiry).filter(
        ClientInquiry.id == inquiry_id,
        ClientInquiry.is_deleted == 0
    ).first()
    
    if not inquiry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inquiry not found"
        )
    
    activity = InquiryActivity(
        inquiry_id=inquiry_id,
        **activity_data.model_dump(),
        performed_by_id=current_user.id,
    )
    db.add(activity)
    
    # Update last contact date
    inquiry.last_contact_date = datetime.now(timezone.utc).date()
    
    db.commit()
    db.refresh(activity)
    
    return InquiryActivityResponse(
        id=activity.id,
        inquiry_id=activity.inquiry_id,
        activity_type=activity.activity_type,
        title=activity.title,
        description=activity.description,
        old_status=activity.old_status,
        new_status=activity.new_status,
        performed_by_id=activity.performed_by_id,
        performed_by_name=current_user.full_name,
        created_at=activity.created_at,
    )


@router.post("/{inquiry_id}/convert", response_model=InquiryResponse)
async def convert_inquiry(
    inquiry_id: int,
    convert_data: InquiryConvertRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Convert a won inquiry to a client and/or service."""
    inquiry = db.query(ClientInquiry).filter(
        ClientInquiry.id == inquiry_id,
        ClientInquiry.is_deleted == 0
    ).first()
    
    if not inquiry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inquiry not found"
        )
    
    if inquiry.is_converted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inquiry has already been converted"
        )
    
    # Create client if requested
    if convert_data.create_client:
        client = Client(
            name=inquiry.company_name,
            contact_person=inquiry.contact_person,
            contact_email=inquiry.contact_email,
            contact_phone=inquiry.contact_phone,
            industry=inquiry.industry,
            manager_id=current_user.id,
        )
        db.add(client)
        db.flush()
        inquiry.converted_to_client_id = client.id
    
    # Create service if requested
    if convert_data.create_service:
        from app.models.service import ServiceStatus, CustomerType
        
        service = Service(
            name=convert_data.service_name or inquiry.title,
            description=convert_data.service_description or inquiry.description,
            customer_name=inquiry.company_name,
            customer_type=CustomerType.NEW,
            customer_email=inquiry.contact_email,
            customer_contact=inquiry.contact_person,
            contract_value=convert_data.contract_value or inquiry.estimated_value,
            status=ServiceStatus.DRAFT,
            manager_id=current_user.id,
            client_id=inquiry.converted_to_client_id,
        )
        db.add(service)
        db.flush()
        inquiry.converted_to_service_id = service.id
    
    # Update inquiry status
    inquiry.status = InquiryStatus.WON
    inquiry.converted_at = datetime.now(timezone.utc)
    
    # Add conversion activity
    activity = InquiryActivity(
        inquiry=inquiry,
        activity_type="converted",
        title="Inquiry Converted",
        description=f"Converted to {'client' if convert_data.create_client else ''}{' and ' if convert_data.create_client and convert_data.create_service else ''}{'service' if convert_data.create_service else ''}",
        old_status=inquiry.status.value,
        new_status=InquiryStatus.WON.value,
        performed_by_id=current_user.id,
    )
    db.add(activity)
    
    db.commit()
    db.refresh(inquiry)
    
    return inquiry_to_response(inquiry, db)
