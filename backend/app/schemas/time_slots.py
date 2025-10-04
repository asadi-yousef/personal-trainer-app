"""
Pydantic schemas for time slot management
"""
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import datetime


class TimeSlotBase(BaseModel):
    """Base time slot schema"""
    trainer_id: int
    date: datetime
    start_time: datetime
    end_time: datetime
    duration_minutes: int = Field(default=60, ge=30, le=240)
    is_available: bool = True

    @field_validator('end_time')
    @classmethod
    def end_time_after_start_time(cls, v, info):
        if hasattr(info, 'data') and 'start_time' in info.data and v <= info.data['start_time']:
            raise ValueError('End time must be after start time')
        return v


class TimeSlotCreate(TimeSlotBase):
    """Schema for creating time slots"""
    pass


class TimeSlotUpdate(BaseModel):
    """Schema for updating time slots"""
    is_available: Optional[bool] = None
    is_booked: Optional[bool] = None
    booking_id: Optional[int] = None


class TimeSlotResponse(TimeSlotBase):
    """Schema for time slot response"""
    id: int
    is_booked: bool
    booking_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class BulkTimeSlotCreate(BaseModel):
    """Schema for creating multiple time slots at once"""
    trainer_id: int
    start_date: datetime
    end_date: datetime
    duration_minutes: int = Field(default=60, ge=30, le=240)
    days_of_week: List[int] = Field(..., min_items=1, max_items=7, description="Days of week (0=Monday, 6=Sunday)")
    start_time: str = Field(..., pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$', description="Start time in HH:MM format")
    end_time: str = Field(..., pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$', description="End time in HH:MM format")
    is_available: bool = True

    @field_validator('end_time')
    @classmethod
    def end_time_after_start_time(cls, v, info):
        if hasattr(info, 'data') and 'start_time' in info.data and v <= info.data['start_time']:
            raise ValueError('End time must be after start time')
        return v


class AvailableSlotRequest(BaseModel):
    """Schema for requesting available slots"""
    trainer_id: int
    date: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$', description="Date in YYYY-MM-DD format")
    duration_minutes: int = Field(default=60, ge=30, le=240)
    preferred_times: Optional[List[str]] = Field(None, description="Preferred time slots in HH:MM format")


class AvailableSlot(BaseModel):
    """Schema for available slot"""
    id: int
    start_time: str
    end_time: str
    duration_minutes: int
    is_available: bool = True


class AvailableSlotsResponse(BaseModel):
    """Schema for available slots response"""
    trainer_id: int
    date: str
    available_slots: List[AvailableSlot]
    total_slots: int
    recommended_slot: Optional[AvailableSlot] = None


class TimeSlotBookingRequest(BaseModel):
    """Schema for booking a specific time slot"""
    time_slot_id: int
    client_id: int
    session_type: str = Field(..., min_length=1, max_length=100)
    duration_minutes: int = Field(default=60, ge=30, le=240)
    location: Optional[str] = None
    special_requests: Optional[str] = None


class TimeSlotBookingResponse(BaseModel):
    """Schema for time slot booking response"""
    booking_id: int
    time_slot_id: int
    status: str
    message: str
