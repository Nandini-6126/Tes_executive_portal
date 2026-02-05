"""
Clients API Endpoints
Manage client organizations.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_db, get_current_user
from app.models import User, Client, Service
from app.schemas.client import (
    ClientCreate, ClientUpdate, ClientResponse, ClientListResponse
)

router = APIRouter(prefix="/clients", tags=["Clients"])


def client_to_response(client: Client, db: Session) -> ClientResponse:
    """Convert Client model to response schema."""
    services_count = db.query(func.count(Service.id)).filter(
        Service.client_id == client.id,
        Service.is_deleted == 0
    ).scalar() or 0
    
    return ClientResponse(
        id=client.id,
        name=client.name,
        description=client.description,
        contact_person=client.contact_person,
        contact_email=client.contact_email,
        contact_phone=client.contact_phone,
        address=client.address,
        city=client.city,
        country=client.country,
        industry=client.industry,
        is_active=client.is_active,
        manager_id=client.manager_id,
        manager_name=client.manager.full_name if client.manager else None,
        services_count=services_count,
        created_at=client.created_at,
        updated_at=client.updated_at,
    )


@router.get("", response_model=ClientListResponse)
async def get_clients(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all clients for the current manager."""
    query = db.query(Client).filter(Client.is_deleted == 0)
    
    # Filter by manager for non-admin users
    if current_user.role.name != "admin":
        query = query.filter(Client.manager_id == current_user.id)
    
    # Search filter
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Client.name.ilike(search_filter)) |
            (Client.contact_person.ilike(search_filter)) |
            (Client.industry.ilike(search_filter))
        )
    
    # Active filter
    if is_active is not None:
        query = query.filter(Client.is_active == is_active)
    
    # Get total count
    total = query.count()
    
    # Paginate
    clients = query.order_by(Client.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    return ClientListResponse(
        data=[client_to_response(c, db) for c in clients],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    client_data: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new client."""
    # Check for duplicate name
    existing = db.query(Client).filter(
        Client.name == client_data.name,
        Client.manager_id == current_user.id,
        Client.is_deleted == 0
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A client with this name already exists"
        )
    
    client = Client(
        **client_data.model_dump(),
        manager_id=current_user.id,
    )
    db.add(client)
    db.commit()
    db.refresh(client)
    
    return client_to_response(client, db)


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific client."""
    query = db.query(Client).filter(
        Client.id == client_id,
        Client.is_deleted == 0
    )
    
    # Check ownership for non-admin users
    if current_user.role.name != "admin":
        query = query.filter(Client.manager_id == current_user.id)
    
    client = query.first()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    return client_to_response(client, db)


@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: int,
    client_data: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a client."""
    query = db.query(Client).filter(
        Client.id == client_id,
        Client.is_deleted == 0
    )
    
    if current_user.role.name != "admin":
        query = query.filter(Client.manager_id == current_user.id)
    
    client = query.first()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    # Update fields
    update_data = client_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(client, field, value)
    
    db.commit()
    db.refresh(client)
    
    return client_to_response(client, db)


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Soft delete a client."""
    query = db.query(Client).filter(
        Client.id == client_id,
        Client.is_deleted == 0
    )
    
    if current_user.role.name != "admin":
        query = query.filter(Client.manager_id == current_user.id)
    
    client = query.first()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    # Soft delete
    client.is_deleted = 1
    db.commit()
    
    return None


@router.get("/{client_id}/services")
async def get_client_services(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all services for a client."""
    # Verify client access
    query = db.query(Client).filter(
        Client.id == client_id,
        Client.is_deleted == 0
    )
    
    if current_user.role.name != "admin":
        query = query.filter(Client.manager_id == current_user.id)
    
    client = query.first()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    # Get services
    services = db.query(Service).filter(
        Service.client_id == client_id,
        Service.is_deleted == 0
    ).order_by(Service.created_at.desc()).all()
    
    return {
        "client_id": client_id,
        "client_name": client.name,
        "services": [
            {
                "id": s.id,
                "name": s.name,
                "description": s.description,
                "status": s.status.value if s.status else None,
                "contract_value": float(s.contract_value) if s.contract_value else None,
                "resource_count": s.resource_count,
                "created_at": s.created_at,
            }
            for s in services
        ]
    }
