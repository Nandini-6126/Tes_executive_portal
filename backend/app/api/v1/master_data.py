"""
Tessolve Executive Portal - Master Data API Endpoints
Endpoints for fetching dropdown/filter options.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.master_data import (
    Sector,
    Technology,
    EngagementModel,
    ServiceCategory,
    Department,
)


router = APIRouter(prefix="/master-data", tags=["Master Data"])


class OptionItem(BaseModel):
    """Generic option item for dropdowns."""
    id: int
    name: str
    
    class Config:
        from_attributes = True


class TechnologyOption(BaseModel):
    """Technology option with category."""
    id: int
    name: str
    category: str | None = None
    
    class Config:
        from_attributes = True


class EngagementModelOption(BaseModel):
    """Engagement model option with billing type."""
    id: int
    name: str
    billing_type: str | None = None
    description: str | None = None
    
    class Config:
        from_attributes = True


class MasterDataResponse(BaseModel):
    """Combined master data response."""
    sectors: List[OptionItem]
    technologies: List[TechnologyOption]
    engagement_models: List[EngagementModelOption]
    service_categories: List[OptionItem]
    departments: List[OptionItem]


@router.get("/all", response_model=MasterDataResponse)
async def get_all_master_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get all master data for form dropdowns.
    Returns sectors, technologies, engagement models, etc.
    """
    sectors = db.query(Sector).filter(Sector.is_active == True).all()
    technologies = db.query(Technology).filter(Technology.is_active == True).all()
    engagement_models = db.query(EngagementModel).filter(EngagementModel.is_active == True).all()
    service_categories = db.query(ServiceCategory).filter(ServiceCategory.is_active == True).all()
    departments = db.query(Department).filter(Department.is_active == True).all()
    
    return MasterDataResponse(
        sectors=[OptionItem(id=s.id, name=s.name) for s in sectors],
        technologies=[TechnologyOption(id=t.id, name=t.name, category=t.category) for t in technologies],
        engagement_models=[
            EngagementModelOption(
                id=e.id, 
                name=e.name, 
                billing_type=e.billing_type,
                description=e.description
            ) for e in engagement_models
        ],
        service_categories=[OptionItem(id=c.id, name=c.name) for c in service_categories],
        departments=[OptionItem(id=d.id, name=d.name) for d in departments],
    )


@router.get("/sectors", response_model=List[OptionItem])
async def get_sectors(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all active sectors."""
    sectors = db.query(Sector).filter(Sector.is_active == True).all()
    return [OptionItem(id=s.id, name=s.name) for s in sectors]


@router.get("/technologies", response_model=List[TechnologyOption])
async def get_technologies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all active technologies."""
    technologies = db.query(Technology).filter(Technology.is_active == True).all()
    return [TechnologyOption(id=t.id, name=t.name, category=t.category) for t in technologies]


@router.get("/engagement-models", response_model=List[EngagementModelOption])
async def get_engagement_models(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all active engagement models."""
    models = db.query(EngagementModel).filter(EngagementModel.is_active == True).all()
    return [
        EngagementModelOption(
            id=e.id, 
            name=e.name, 
            billing_type=e.billing_type,
            description=e.description
        ) for e in models
    ]


@router.get("/service-categories", response_model=List[OptionItem])
async def get_service_categories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all active service categories."""
    categories = db.query(ServiceCategory).filter(ServiceCategory.is_active == True).all()
    return [OptionItem(id=c.id, name=c.name) for c in categories]


@router.get("/departments", response_model=List[OptionItem])
async def get_departments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all active departments."""
    departments = db.query(Department).filter(Department.is_active == True).all()
    return [OptionItem(id=d.id, name=d.name) for d in departments]
