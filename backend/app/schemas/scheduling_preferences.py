"""
Pydantic schemas for trainer scheduling preferences
"""
from pydantic import BaseModel, Field, validator
from typing import List, Optional


class SchedulingPreferencesBase(BaseModel):
    """Base schema for scheduling preferences"""
    max_sessions_per_day: int = Field(default=8, ge=1, le=15, description="Maximum sessions per day")
    min_break_minutes: int = Field(default=15, ge=0, le=60, description="Minimum break between sessions (minutes)")
    prefer_consecutive_sessions: bool = Field(default=True, description="Prefer back-to-back sessions")
    work_start_time: str = Field(default="08:00", description="Work start time (HH:MM)")
    work_end_time: str = Field(default="18:00", description="Work end time (HH:MM)")
    days_off: List[int] = Field(default=[], description="Days off (0=Monday, 6=Sunday)")
    preferred_time_blocks: List[str] = Field(default=["morning", "afternoon"], description="Preferred time blocks")
    prioritize_recurring_clients: bool = Field(default=True, description="Give priority to recurring clients")
    prioritize_high_value_sessions: bool = Field(default=False, description="Prioritize longer/more expensive sessions")
    
    @validator('work_start_time', 'work_end_time')
    def validate_time_format(cls, v):
        """Validate time format HH:MM"""
        if not v:
            raise ValueError('Time cannot be empty')
        parts = v.split(':')
        if len(parts) != 2:
            raise ValueError('Time must be in HH:MM format')
        try:
            hours, minutes = int(parts[0]), int(parts[1])
            if not (0 <= hours <= 23 and 0 <= minutes <= 59):
                raise ValueError('Invalid time values')
        except ValueError:
            raise ValueError('Time must be valid HH:MM format')
        return v
    
    @validator('days_off')
    def validate_days_off(cls, v):
        """Validate days off are in range 0-6 and not all days"""
        if v:
            # Check valid range
            for day in v:
                if not 0 <= day <= 6:
                    raise ValueError('Days must be between 0 (Monday) and 6 (Sunday)')
            # Prevent marking all 7 days as off
            if len(v) >= 7:
                raise ValueError('You cannot mark all days as off. You must work at least one day per week.')
        return v
    
    @validator('preferred_time_blocks')
    def validate_time_blocks(cls, v):
        """Validate time blocks"""
        valid_blocks = ['morning', 'afternoon', 'evening']
        if v:
            for block in v:
                if block not in valid_blocks:
                    raise ValueError(f'Time block must be one of: {", ".join(valid_blocks)}')
        return v


class SchedulingPreferencesCreate(SchedulingPreferencesBase):
    """Schema for creating scheduling preferences"""
    pass


class SchedulingPreferencesUpdate(BaseModel):
    """Schema for updating scheduling preferences"""
    max_sessions_per_day: Optional[int] = Field(None, ge=1, le=15)
    min_break_minutes: Optional[int] = Field(None, ge=0, le=60)
    prefer_consecutive_sessions: Optional[bool] = None
    work_start_time: Optional[str] = None
    work_end_time: Optional[str] = None
    days_off: Optional[List[int]] = None
    preferred_time_blocks: Optional[List[str]] = None
    prioritize_recurring_clients: Optional[bool] = None
    prioritize_high_value_sessions: Optional[bool] = None


class SchedulingPreferencesResponse(SchedulingPreferencesBase):
    """Schema for scheduling preferences response"""
    id: int
    trainer_id: int
    
    class Config:
        from_attributes = True

