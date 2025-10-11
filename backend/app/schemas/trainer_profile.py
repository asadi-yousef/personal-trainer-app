"""
Simple Pydantic schemas for trainer profile management
"""
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from app.models import TrainingType, Specialty


class UpdateBasicInfo(BaseModel):
    """Update basic trainer information"""
    bio: Optional[str] = Field(None, min_length=100, max_length=2000, description="Professional bio (100-2000 characters)")
    experience_years: Optional[int] = Field(None, ge=0, le=50, description="Years of experience")
    certifications: Optional[str] = Field(None, max_length=1000, description="Certifications (comma-separated)")
    
    @validator('bio')
    def validate_bio(cls, v):
        if v and len(v.strip()) < 100:
            raise ValueError('Bio must be at least 100 characters')
        return v.strip() if v else v


class UpdateTrainingInfo(BaseModel):
    """Update training types and specialty"""
    training_types: Optional[List[TrainingType]] = Field(None, min_items=1, max_items=5, description="Training types (1-5)")
    specialty: Optional[Specialty] = Field(None, description="Primary specialty")


class UpdateGymInfo(BaseModel):
    """Update gym location information"""
    gym_name: Optional[str] = Field(None, min_length=2, max_length=255)
    gym_address: Optional[str] = Field(None, min_length=10, max_length=500)
    gym_city: Optional[str] = Field(None, min_length=2, max_length=100)
    gym_state: Optional[str] = Field(None, min_length=2, max_length=50)
    gym_zip_code: Optional[str] = Field(None, min_length=5, max_length=20)
    gym_phone: Optional[str] = Field(None, max_length=20)


class UpdatePricing(BaseModel):
    """Update pricing information"""
    price_per_hour: float = Field(..., ge=20.0, le=500.0, description="Hourly rate ($20-$500)")


class TrainerProfileResponse(BaseModel):
    """Complete trainer profile response"""
    id: int
    user_id: int
    specialty: str
    rating: float
    reviews_count: int
    price_per_hour: float
    bio: Optional[str]
    experience_years: int
    certifications: Optional[str]
    training_types: List[str]
    gym_name: Optional[str]
    gym_address: Optional[str]
    gym_city: Optional[str]
    gym_state: Optional[str]
    gym_zip_code: Optional[str]
    gym_phone: Optional[str]
    is_available: bool
    
    class Config:
        from_attributes = True

