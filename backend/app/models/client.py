"""
Client Model - Top-level entity for customer organizations.
Services belong to Clients.
"""

from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Boolean, ForeignKey
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, SoftDeleteMixin


class Client(Base, TimestampMixin, SoftDeleteMixin):
    """
    Client represents a customer organization.
    Managers can create clients and add services under them.
    """
    
    __tablename__ = "clients"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Basic Info
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text)
    
    # Contact Info
    contact_person: Mapped[Optional[str]] = mapped_column(String(255))
    contact_email: Mapped[Optional[str]] = mapped_column(String(255))
    contact_phone: Mapped[Optional[str]] = mapped_column(String(50))
    
    # Address
    address: Mapped[Optional[str]] = mapped_column(Text)
    city: Mapped[Optional[str]] = mapped_column(String(100))
    country: Mapped[Optional[str]] = mapped_column(String(100))
    
    # Industry/Sector
    industry: Mapped[Optional[str]] = mapped_column(String(100))
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Manager who created/owns this client
    manager_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey('users.id'))
    
    # Relationships
    services: Mapped[List["Service"]] = relationship(
        "Service", 
        back_populates="client",
        cascade="all, delete-orphan"
    )
    manager = relationship("User", foreign_keys=[manager_id])
    
    def __repr__(self) -> str:
        return f"<Client {self.id}: {self.name}>"
