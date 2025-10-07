from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum

class BookingRequestStatus(str, Enum):
    """Booking request status enumeration"""
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"

class BookingRequestCreate(BaseModel):
    """Schema for creating a booking request"""
    trainer_id: int
    session_type: str = Field(..., min_length=1, max_length=100)
    duration_minutes: int = Field(..., ge=15, le=240)
    location: Optional[str] = Field(None, max_length=255)
    special_requests: Optional[str] = None
    
    # Time preferences
    preferred_start_date: datetime
    preferred_end_date: datetime
    preferred_times: Optional[List[str]] = None
    avoid_times: Optional[List[str]] = None
    
    # Additional preferences
    allow_weekends: bool = True
    allow_evenings: bool = True
    is_recurring: bool = False
    recurring_pattern: Optional[str] = None  # "weekly", "biweekly", "monthly"

class BookingRequestResponse(BaseModel):
    """Schema for booking request response"""
    id: int
    client_id: int
    trainer_id: int
    session_type: str
    duration_minutes: int
    location: Optional[str]
    special_requests: Optional[str]
    status: BookingRequestStatus
    preferred_start_date: datetime
    preferred_end_date: datetime
    preferred_times: Optional[List[str]]
    avoid_times: Optional[List[str]]
    allow_weekends: bool
    allow_evenings: bool
    is_recurring: bool
    recurring_pattern: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    
    # Related data
    client_name: Optional[str] = None
    trainer_name: Optional[str] = None
    
    class Config:
        from_attributes = True

class BookingRequestApproval(BaseModel):
    """Schema for trainer approval/rejection of booking request"""
    status: BookingRequestStatus
    confirmed_date: Optional[datetime] = None
    alternative_dates: Optional[List[datetime]] = None
    notes: Optional[str] = None
    rejection_reason: Optional[str] = None

class BookingRequestUpdate(BaseModel):
    """Schema for updating booking request"""
    session_type: Optional[str] = None
    duration_minutes: Optional[int] = Field(None, ge=15, le=240)
    location: Optional[str] = None
    special_requests: Optional[str] = None
    preferred_start_date: Optional[datetime] = None
    preferred_end_date: Optional[datetime] = None
    preferred_times: Optional[List[str]] = None
    avoid_times: Optional[List[str]] = None
    allow_weekends: Optional[bool] = None
    allow_evenings: Optional[bool] = None
