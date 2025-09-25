"""
Trainer schemas for FitConnect API
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models import Specialty, Availability


class TrainerBase(BaseModel):
    """Base trainer schema"""
    specialty: Specialty
    price_per_session: float
    bio: Optional[str] = None
    cover_image: Optional[str] = None
    experience_years: int = 0
    certifications: Optional[str] = None
    availability: Optional[str] = None  # JSON string
    location: Optional[str] = None


class TrainerCreate(TrainerBase):
    """Trainer creation schema"""
    pass


class TrainerUpdate(BaseModel):
    """Trainer update schema"""
    specialty: Optional[Specialty] = None
    price_per_session: Optional[float] = None
    bio: Optional[str] = None
    cover_image: Optional[str] = None
    experience_years: Optional[int] = None
    certifications: Optional[str] = None
    availability: Optional[str] = None
    location: Optional[str] = None
    is_available: Optional[bool] = None


class TrainerResponse(TrainerBase):
    """Trainer response schema"""
    id: int
    user_id: int
    rating: float
    reviews_count: int
    is_available: bool
    created_at: datetime
    
    # User information
    user_name: str
    user_email: str
    user_avatar: Optional[str] = None
    
    class Config:
        from_attributes = True


class TrainerListResponse(BaseModel):
    """Trainer list response schema"""
    trainers: List[TrainerResponse]
    total: int
    page: int
    size: int
    total_pages: int


class TrainerSearchFilters(BaseModel):
    """Trainer search filters schema"""
    specialty: Optional[Specialty] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_rating: Optional[float] = None
    location: Optional[str] = None
    availability: Optional[Availability] = None
    page: int = 1
    size: int = 10

