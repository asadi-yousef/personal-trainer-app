"""
Pydantic schemas for trainer availability management
"""
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import datetime


class TrainerAvailabilityBase(BaseModel):
    """Base trainer availability schema"""
    day_of_week: int = Field(..., ge=0, le=6, description="Day of week (0=Monday, 6=Sunday)")
    start_time: str = Field(..., pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$', description="Start time in HH:MM format")
    end_time: str = Field(..., pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$', description="End time in HH:MM format")
    is_available: bool = True

    @field_validator('end_time')
    @classmethod
    def end_time_after_start_time(cls, v, info):
        if hasattr(info, 'data') and 'start_time' in info.data and v <= info.data['start_time']:
            raise ValueError('End time must be after start time')
        return v


class TrainerAvailabilityCreate(TrainerAvailabilityBase):
    """Schema for creating trainer availability"""
    pass


class TrainerAvailabilityUpdate(BaseModel):
    """Schema for updating trainer availability"""
    day_of_week: Optional[int] = Field(None, ge=0, le=6)
    start_time: Optional[str] = Field(None, pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
    end_time: Optional[str] = Field(None, pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
    is_available: Optional[bool] = None


class TrainerAvailabilityResponse(TrainerAvailabilityBase):
    """Schema for trainer availability response"""
    id: int
    trainer_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class WeeklyAvailabilityCreate(BaseModel):
    """Schema for creating a full week of availability"""
    availability: List[TrainerAvailabilityCreate] = Field(..., min_items=1, max_items=7)


class WeeklyAvailabilityResponse(BaseModel):
    """Schema for weekly availability response"""
    trainer_id: int
    weekly_schedule: List[TrainerAvailabilityResponse]
    total_hours_per_week: float

    class Config:
        from_attributes = True


class TimeSlotRequest(BaseModel):
    """Schema for requesting available time slots"""
    trainer_id: int
    date: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$', description="Date in YYYY-MM-DD format")
    duration_minutes: int = Field(..., ge=30, le=240, description="Session duration in minutes")
    preferred_times: Optional[List[str]] = Field(None, description="Preferred time slots in HH:MM format")


class TimeSlot(BaseModel):
    """Schema for available time slot"""
    start_time: str
    end_time: str
    is_available: bool = True
    conflict_reason: Optional[str] = None


class AvailableSlotsResponse(BaseModel):
    """Schema for available time slots response"""
    trainer_id: int
    date: str
    available_slots: List[TimeSlot]
    total_slots: int
    recommended_slot: Optional[TimeSlot] = None
