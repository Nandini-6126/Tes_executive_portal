"""
Tessolve Executive Portal - User Settings Model
Stores user preferences and settings.
"""

from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class UserSettings(Base, TimestampMixin):
    """
    User settings model for storing user preferences.
    """
    
    __tablename__ = "user_settings"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Appearance
    theme: Mapped[str] = mapped_column(String(20), default="dark")  # light, dark, system
    language: Mapped[str] = mapped_column(String(10), default="en")  # en, es, fr, de, hi
    
    # Display options
    compact_view: Mapped[bool] = mapped_column(Boolean, default=False)
    show_animations: Mapped[bool] = mapped_column(Boolean, default=True)
    high_contrast: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Notifications
    notify_email: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_browser: Mapped[bool] = mapped_column(Boolean, default=False)
    notify_service_updates: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_new_customers: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_weekly_report: Mapped[bool] = mapped_column(Boolean, default=False)
    
    def __repr__(self) -> str:
        return f"<UserSettings user_id={self.user_id}>"
