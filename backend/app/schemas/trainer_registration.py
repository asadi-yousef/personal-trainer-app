"""
Pydantic schemas for trainer registration completion
"""
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime
from app.models import TrainingType, ProfileCompletionStatus, LocationType


class TrainingTypeSelection(BaseModel):
    """Training types selection schema"""
    training_types: List[TrainingType] = Field(
        ..., 
        min_items=1, 
        max_items=5,
        description="Selected training types (1-5 types)"
    )


class PricingSetup(BaseModel):
    """Pricing setup schema"""
    price_per_hour: float = Field(
        ..., 
        ge=20.0, 
        le=200.0,
        description="Price per hour (minimum $20, maximum $200)"
    )


class GymInformation(BaseModel):
    """Gym information schema"""
    gym_name: str = Field(..., min_length=2, max_length=255, description="Gym name")
    gym_address: str = Field(..., min_length=10, description="Full gym address")
    gym_city: str = Field(..., min_length=2, max_length=100, description="City")
    gym_state: str = Field(..., min_length=2, max_length=50, description="State")
    gym_zip_code: str = Field(..., min_length=5, max_length=20, description="ZIP code")
    gym_phone: Optional[str] = Field(None, max_length=20, description="Gym phone number")


class ProfileCompletionRequest(BaseModel):
    """Complete trainer registration request"""
    training_types: List[TrainingType] = Field(
        ..., 
        min_items=1, 
        max_items=5,
        description="Selected training types"
    )
    price_per_hour: float = Field(
        ..., 
        ge=20.0, 
        le=200.0,
        description="Price per hour"
    )
    gym_name: str = Field(..., min_length=2, max_length=255)
    gym_address: str = Field(..., min_length=10)
    gym_city: str = Field(..., min_length=2, max_length=100)
    gym_state: str = Field(..., min_length=2, max_length=50)
    gym_zip_code: str = Field(..., min_length=5, max_length=20)
    gym_phone: Optional[str] = Field(None, max_length=20)
    bio: str = Field(..., min_length=100, description="Bio must be at least 100 characters")

    @validator('training_types')
    def validate_training_types(cls, v):
        if not v:
            raise ValueError('At least one training type must be selected')
        if len(v) > 5:
            raise ValueError('Maximum 5 training types allowed')
        return v

    @validator('bio')
    def validate_bio_length(cls, v):
        if len(v.strip()) < 100:
            raise ValueError('Bio must be at least 100 characters long')
        return v.strip()


class ProfileCompletionResponse(BaseModel):
    """Profile completion response"""
    success: bool
    message: str
    profile_completion_status: ProfileCompletionStatus
    profile_completion_date: Optional[datetime] = None


class TrainerProfileStatus(BaseModel):
    """Trainer profile completion status"""
    is_complete: bool
    completion_status: ProfileCompletionStatus
    completion_date: Optional[datetime] = None
    missing_fields: List[str] = []
    completion_percentage: float = Field(..., ge=0.0, le=100.0)


class TrainerRegistrationStep(BaseModel):
    """Individual registration step"""
    step_number: int
    step_name: str
    is_completed: bool
    is_required: bool
    description: str


class RegistrationProgress(BaseModel):
    """Registration progress tracking"""
    current_step: int
    total_steps: int
    completed_steps: int
    steps: List[TrainerRegistrationStep]
    can_proceed: bool
    next_step: Optional[str] = None


class TimeBasedBookingRequest(BaseModel):
    """Time-based booking request"""
    trainer_id: int
    start_time: datetime = Field(..., description="Session start time")
    end_time: datetime = Field(..., description="Session end time")
    training_type: TrainingType = Field(..., description="Selected training type")
    location_type: LocationType = Field(default=LocationType.GYM, description="Location type")
    location_address: Optional[str] = Field(None, description="Specific location address")
    special_requests: Optional[str] = Field(None, description="Special requests or notes")

    @validator('end_time')
    def validate_session_duration(cls, v, values):
        if 'start_time' in values:
            start_time = values['start_time']
            duration_minutes = (v - start_time).total_seconds() / 60
            
            if duration_minutes < 60:
                raise ValueError('Session must be at least 1 hour (60 minutes)')
            if duration_minutes > 120:
                raise ValueError('Session must be at most 2 hours (120 minutes)')
            if duration_minutes % 30 != 0:
                raise ValueError('Session duration must be in 30-minute increments')
        
        return v

    @validator('start_time')
    def validate_start_time(cls, v):
        # Check if start time is at least 2 hours in the future
        from datetime import datetime, timedelta
        min_start_time = datetime.now() + timedelta(hours=2)
        if v < min_start_time:
            raise ValueError('Session must be scheduled at least 2 hours in advance')
        
        # Check if start time is not more than 30 days in the future
        max_start_time = datetime.now() + timedelta(days=30)
        if v > max_start_time:
            raise ValueError('Session cannot be scheduled more than 30 days in advance')
        
        return v


class BookingPriceCalculation(BaseModel):
    """Booking price calculation"""
    trainer_id: int
    duration_minutes: int
    training_type: TrainingType
    location_type: LocationType = LocationType.GYM
    base_price_per_hour: float
    total_hours: float
    base_cost: float
    location_surcharge: float = 0.0
    training_type_multiplier: float = 1.0
    total_cost: float
    currency: str = "USD"


class AvailableTimeSlot(BaseModel):
    """Available time slot for booking"""
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    price_per_hour: float
    total_cost: float
    is_available: bool = True
    location_type: LocationType = LocationType.GYM


class TimeSlotRequest(BaseModel):
    """Request for available time slots"""
    trainer_id: int
    date: datetime = Field(..., description="Date to check availability")
    duration_minutes: int = Field(60, ge=60, le=120, description="Session duration in minutes")
    training_type: Optional[TrainingType] = None
    location_type: LocationType = LocationType.GYM

    @validator('duration_minutes')
    def validate_duration(cls, v):
        if v not in [60, 90, 120]:  # 1h, 1.5h, 2h
            raise ValueError('Duration must be 60, 90, or 120 minutes')
        return v












