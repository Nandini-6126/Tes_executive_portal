"""
Tessolve Executive Portal - User Settings API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.user_settings import UserSettings


router = APIRouter(prefix="/settings", tags=["Settings"])


class SettingsResponse(BaseModel):
    theme: str = "dark"
    language: str = "en"
    compact_view: bool = False
    show_animations: bool = True
    high_contrast: bool = False
    notify_email: bool = True
    notify_browser: bool = False
    notify_service_updates: bool = True
    notify_new_customers: bool = True
    notify_weekly_report: bool = False

    class Config:
        from_attributes = True


class SettingsUpdateRequest(BaseModel):
    theme: Optional[str] = None
    language: Optional[str] = None
    compact_view: Optional[bool] = None
    show_animations: Optional[bool] = None
    high_contrast: Optional[bool] = None
    notify_email: Optional[bool] = None
    notify_browser: Optional[bool] = None
    notify_service_updates: Optional[bool] = None
    notify_new_customers: Optional[bool] = None
    notify_weekly_report: Optional[bool] = None


def get_or_create_settings(db: Session, user_id: int) -> UserSettings:
    """Get user settings or create default settings if not exists."""
    settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
    if not settings:
        settings = UserSettings(user_id=user_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.get("", response_model=SettingsResponse)
async def get_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current user's settings."""
    settings = get_or_create_settings(db, current_user.id)
    return SettingsResponse(
        theme=settings.theme,
        language=settings.language,
        compact_view=settings.compact_view,
        show_animations=settings.show_animations,
        high_contrast=settings.high_contrast,
        notify_email=settings.notify_email,
        notify_browser=settings.notify_browser,
        notify_service_updates=settings.notify_service_updates,
        notify_new_customers=settings.notify_new_customers,
        notify_weekly_report=settings.notify_weekly_report,
    )


@router.put("", response_model=SettingsResponse)
async def update_settings(
    data: SettingsUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update current user's settings."""
    settings = get_or_create_settings(db, current_user.id)
    
    # Update only provided fields
    if data.theme is not None:
        if data.theme not in ["light", "dark", "system"]:
            raise HTTPException(status_code=400, detail="Invalid theme. Must be: light, dark, or system")
        settings.theme = data.theme
    
    if data.language is not None:
        if data.language not in ["en", "es", "fr", "de", "hi"]:
            raise HTTPException(status_code=400, detail="Invalid language")
        settings.language = data.language
    
    if data.compact_view is not None:
        settings.compact_view = data.compact_view
    
    if data.show_animations is not None:
        settings.show_animations = data.show_animations
    
    if data.high_contrast is not None:
        settings.high_contrast = data.high_contrast
    
    if data.notify_email is not None:
        settings.notify_email = data.notify_email
    
    if data.notify_browser is not None:
        settings.notify_browser = data.notify_browser
    
    if data.notify_service_updates is not None:
        settings.notify_service_updates = data.notify_service_updates
    
    if data.notify_new_customers is not None:
        settings.notify_new_customers = data.notify_new_customers
    
    if data.notify_weekly_report is not None:
        settings.notify_weekly_report = data.notify_weekly_report
    
    db.commit()
    db.refresh(settings)
    
    return SettingsResponse(
        theme=settings.theme,
        language=settings.language,
        compact_view=settings.compact_view,
        show_animations=settings.show_animations,
        high_contrast=settings.high_contrast,
        notify_email=settings.notify_email,
        notify_browser=settings.notify_browser,
        notify_service_updates=settings.notify_service_updates,
        notify_new_customers=settings.notify_new_customers,
        notify_weekly_report=settings.notify_weekly_report,
    )


@router.delete("")
async def reset_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Reset user settings to defaults."""
    settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if settings:
        db.delete(settings)
        db.commit()
    
    # Create new default settings
    new_settings = get_or_create_settings(db, current_user.id)
    
    return {"success": True, "message": "Settings reset to defaults"}
