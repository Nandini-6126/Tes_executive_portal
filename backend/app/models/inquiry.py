"""
Client Inquiry/Lead Model - For tracking potential client service inquiries.
Managers can add inquiries when clients contact them about new services.
"""

from datetime import datetime, timezone, date
from decimal import Decimal
from typing import Optional, List
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Date, Boolean, 
    ForeignKey, Numeric, Enum as SQLEnum
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.models.base import Base, TimestampMixin, SoftDeleteMixin


class InquiryStatus(str, enum.Enum):
    """Status of the client inquiry."""
    NEW = "new"
    CONTACTED = "contacted"
    MEETING_SCHEDULED = "meeting_scheduled"
    PROPOSAL_SENT = "proposal_sent"
    NEGOTIATING = "negotiating"
    WON = "won"
    LOST = "lost"
    ON_HOLD = "on_hold"


class InquiryPriority(str, enum.Enum):
    """Priority level of the inquiry."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class InquirySource(str, enum.Enum):
    """How the inquiry was received."""
    WEBSITE = "website"
    REFERRAL = "referral"
    COLD_CALL = "cold_call"
    EMAIL = "email"
    SOCIAL_MEDIA = "social_media"
    TRADE_SHOW = "trade_show"
    EXISTING_CLIENT = "existing_client"
    PARTNER = "partner"
    OTHER = "other"


class ClientInquiry(Base, TimestampMixin, SoftDeleteMixin):
    """
    Client Inquiry tracks potential service requests from clients.
    Managers can track the sales pipeline and convert to actual services.
    """
    
    __tablename__ = "client_inquiries"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Inquiry Reference
    inquiry_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    
    # Client Information
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_person: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_email: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_phone: Mapped[Optional[str]] = mapped_column(String(50))
    company_website: Mapped[Optional[str]] = mapped_column(String(255))
    company_size: Mapped[Optional[str]] = mapped_column(String(50))  # e.g., "1-10", "11-50", "51-200", etc.
    industry: Mapped[Optional[str]] = mapped_column(String(100))
    
    # Inquiry Details
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    requirements: Mapped[Optional[str]] = mapped_column(Text)
    
    # Service Interest
    service_type: Mapped[Optional[str]] = mapped_column(String(100))  # Type of service interested in
    
    # Status and Priority
    status: Mapped[InquiryStatus] = mapped_column(
        SQLEnum(InquiryStatus),
        default=InquiryStatus.NEW,
        nullable=False,
        index=True
    )
    priority: Mapped[InquiryPriority] = mapped_column(
        SQLEnum(InquiryPriority),
        default=InquiryPriority.MEDIUM,
        nullable=False
    )
    source: Mapped[InquirySource] = mapped_column(
        SQLEnum(InquirySource),
        default=InquirySource.OTHER,
        nullable=False
    )
    
    # Financial
    estimated_budget: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2))
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    estimated_value: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2))  # Our estimated deal value
    
    # Timeline
    expected_start_date: Mapped[Optional[date]] = mapped_column(Date)
    decision_date: Mapped[Optional[date]] = mapped_column(Date)  # When client will decide
    
    # Follow-up
    next_follow_up_date: Mapped[Optional[date]] = mapped_column(Date)
    last_contact_date: Mapped[Optional[date]] = mapped_column(Date)
    
    # Assignment
    assigned_to_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey('users.id'))
    created_by_id: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'), nullable=False)
    
    # Conversion
    converted_to_client_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey('clients.id'))
    converted_to_service_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey('services.id'))
    converted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    # Notes
    internal_notes: Mapped[Optional[str]] = mapped_column(Text)
    
    # Probability of winning (0-100)
    win_probability: Mapped[int] = mapped_column(Integer, default=50)
    
    # Loss reason if lost
    loss_reason: Mapped[Optional[str]] = mapped_column(Text)
    
    # Relationships
    assigned_to = relationship("User", foreign_keys=[assigned_to_id])
    created_by = relationship("User", foreign_keys=[created_by_id])
    converted_client = relationship("Client", foreign_keys=[converted_to_client_id])
    converted_service = relationship("Service", foreign_keys=[converted_to_service_id])
    activities: Mapped[List["InquiryActivity"]] = relationship(
        "InquiryActivity",
        back_populates="inquiry",
        cascade="all, delete-orphan"
    )
    
    @property
    def is_converted(self) -> bool:
        return self.status == InquiryStatus.WON and (self.converted_to_client_id or self.converted_to_service_id)
    
    def __repr__(self) -> str:
        return f"<ClientInquiry {self.inquiry_number}: {self.company_name}>"


class InquiryActivity(Base, TimestampMixin):
    """
    Activity log for client inquiries - tracks all interactions.
    """
    
    __tablename__ = "inquiry_activities"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Parent Inquiry
    inquiry_id: Mapped[int] = mapped_column(Integer, ForeignKey('client_inquiries.id'), nullable=False)
    
    # Activity Details
    activity_type: Mapped[str] = mapped_column(String(50), nullable=False)  # call, email, meeting, note, status_change
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    
    # For status changes
    old_status: Mapped[Optional[str]] = mapped_column(String(50))
    new_status: Mapped[Optional[str]] = mapped_column(String(50))
    
    # User who performed the activity
    performed_by_id: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'), nullable=False)
    
    # Relationships
    inquiry: Mapped["ClientInquiry"] = relationship("ClientInquiry", back_populates="activities")
    performed_by = relationship("User", foreign_keys=[performed_by_id])
    
    def __repr__(self) -> str:
        return f"<InquiryActivity {self.id}: {self.activity_type}>"
