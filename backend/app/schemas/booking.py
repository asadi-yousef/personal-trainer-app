"""
Pydantic schemas for booking management and scheduling
"""
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import datetime
from enum import Enum


class BookingStatus(str, Enum):
    """Booking status enumeration"""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    NO_SHOW = "no_show"


class BookingCreate(BaseModel):
    """Schema for creating a new booking"""
    trainer_id: int
    session_type: str = Field(..., min_length=1, max_length=100)
    duration_minutes: int = Field(..., ge=30, le=240)
    location: Optional[str] = Field(None, max_length=255)
    special_requests: Optional[str] = None
    
    # Scheduling preferences
    preferred_start_date: datetime
    preferred_end_date: Optional[datetime] = None
    preferred_times: Optional[List[str]] = Field(None, description="Preferred time slots in HH:MM format")
    
    # Recurring options
    is_recurring: bool = False
    recurring_pattern: Optional[str] = Field(None, pattern="^(weekly|biweekly|monthly)$")
    
    @field_validator('preferred_end_date')
    @classmethod
    def end_date_after_start_date(cls, v, info):
        if v and hasattr(info, 'data') and 'preferred_start_date' in info.data and v <= info.data['preferred_start_date']:
            raise ValueError('End date must be after start date')
        return v
    
    @field_validator('preferred_times')
    @classmethod
    def validate_time_format(cls, v):
        if v:
            import re
            time_pattern = r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
            for time_slot in v:
                if not re.match(time_pattern, time_slot):
                    raise ValueError(f'Invalid time format: {time_slot}. Use HH:MM format')
        return v


class BookingUpdate(BaseModel):
    """Schema for updating a booking"""
    session_type: Optional[str] = Field(None, min_length=1, max_length=100)
    duration_minutes: Optional[int] = Field(None, ge=30, le=240)
    location: Optional[str] = Field(None, max_length=255)
    special_requests: Optional[str] = None
    status: Optional[BookingStatus] = None
    confirmed_date: Optional[datetime] = None
    is_recurring: Optional[bool] = None
    recurring_pattern: Optional[str] = Field(None, pattern="^(weekly|biweekly|monthly)$")


class BookingResponse(BaseModel):
    """Schema for booking response"""
    id: int
    client_id: int
    trainer_id: int
    session_type: str
    duration_minutes: int
    location: Optional[str]
    special_requests: Optional[str]
    status: BookingStatus
    preferred_start_date: Optional[datetime]
    preferred_end_date: Optional[datetime]
    preferred_times: Optional[List[str]] = None
    confirmed_date: Optional[datetime]
    priority_score: float
    is_recurring: bool
    recurring_pattern: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Related data
    client_name: Optional[str] = None
    trainer_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class BookingConfirmation(BaseModel):
    """Schema for confirming a booking"""
    booking_id: int
    confirmed_date: datetime
    notes: Optional[str] = None


class SmartBookingRequest(BaseModel):
    """Schema for smart booking with automatic scheduling"""
    trainer_id: Optional[int] = None  # Optional - if None, finds best trainer
    session_type: str = Field(..., min_length=1, max_length=100)
    duration_minutes: int = Field(..., ge=30, le=240)
    location: Optional[str] = Field(None, max_length=255)
    special_requests: Optional[str] = None
    
    # Flexible scheduling
    earliest_date: datetime
    latest_date: datetime
    preferred_times: Optional[List[str]] = None
    avoid_times: Optional[List[str]] = None  # Times to avoid
    
    # Optimization preferences
    prioritize_convenience: bool = True  # Prioritize convenient times
    prioritize_cost: bool = False  # Prioritize lower cost times
    allow_weekends: bool = True
    allow_evenings: bool = True
    
    @field_validator('latest_date')
    @classmethod
    def latest_after_earliest(cls, v, info):
        if hasattr(info, 'data') and 'earliest_date' in info.data and v <= info.data['earliest_date']:
            raise ValueError('Latest date must be after earliest date')
        return v


class SmartBookingResponse(BaseModel):
    """Schema for smart booking response with suggestions"""
    booking_id: Optional[int] = None  # None if just suggesting times, int if booking was created
    suggested_slots: List[dict]  # List of suggested time slots with scores
    best_slot: Optional[dict] = None  # The best recommended slot
    confidence_score: float  # How confident we are in the suggestions
    message: str  # Explanation of the suggestions


class BookingConflict(BaseModel):
    """Schema for booking conflicts"""
    conflict_type: str  # "time_overlap", "trainer_unavailable", "client_busy"
    conflicting_booking_id: Optional[int] = None
    conflicting_session_id: Optional[int] = None
    conflict_details: str
    suggested_resolution: Optional[str] = None


class BookingWithConflicts(BaseModel):
    """Schema for booking with conflict information"""
    booking: BookingResponse
    conflicts: List[BookingConflict]
    can_auto_resolve: bool = False
