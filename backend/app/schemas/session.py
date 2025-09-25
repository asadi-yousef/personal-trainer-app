"""
Session schemas for FitConnect API
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models import SessionStatus


class SessionBase(BaseModel):
    """Base session schema"""
    title: str
    description: Optional[str] = None
    session_type: str
    scheduled_date: datetime
    duration_minutes: int
    location: Optional[str] = None


class SessionCreate(SessionBase):
    """Session creation schema"""
    trainer_id: int


class SessionUpdate(BaseModel):
    """Session update schema"""
    title: Optional[str] = None
    description: Optional[str] = None
    session_type: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    location: Optional[str] = None
    status: Optional[SessionStatus] = None
    notes: Optional[str] = None


class SessionResponse(SessionBase):
    """Session response schema"""
    id: int
    client_id: int
    trainer_id: int
    status: SessionStatus
    notes: Optional[str] = None
    created_at: datetime
    
    # Related information
    client_name: str
    trainer_name: str
    trainer_avatar: Optional[str] = None
    
    class Config:
        from_attributes = True


class BookingCreate(BaseModel):
    """Booking request schema"""
    trainer_id: int
    preferred_dates: str  # JSON string of preferred dates
    session_type: str
    duration_minutes: int
    location: Optional[str] = None
    special_requests: Optional[str] = None


class BookingResponse(BaseModel):
    """Booking response schema"""
    id: int
    client_id: int
    trainer_id: int
    preferred_dates: str
    session_type: str
    duration_minutes: int
    location: Optional[str] = None
    special_requests: Optional[str] = None
    status: str
    created_at: datetime
    
    # Related information
    client_name: str
    trainer_name: str
    
    class Config:
        from_attributes = True

