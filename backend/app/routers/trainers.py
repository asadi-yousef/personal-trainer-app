"""
Trainers router for FitConnect API
"""
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from app.database import get_db
from app.models import Trainer, User, Specialty, Availability
from app.schemas.trainer import (
    TrainerCreate, 
    TrainerUpdate, 
    TrainerResponse, 
    TrainerListResponse,
    TrainerSearchFilters
)
from app.utils.auth import get_current_active_user
from app.models import UserRole

router = APIRouter()

@router.post("/", response_model=TrainerResponse, status_code=status.HTTP_201_CREATED)
async def create_trainer_profile(
    trainer_data: TrainerCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a trainer profile (only for users with trainer role)"""
    if current_user.role != UserRole.TRAINER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only users with trainer role can create trainer profiles"
        )
    
    # Check if trainer profile already exists
    existing_trainer = db.query(Trainer).filter(Trainer.user_id == current_user.id).first()
    if existing_trainer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Trainer profile already exists"
        )
    
    # Create trainer profile with default pricing
    db_trainer = Trainer(
        user_id=current_user.id,
        specialty=trainer_data.specialty,
        price_per_session=50.0,  # Default for backward compatibility
        price_per_hour=50.0,     # Default hourly rate
        bio=trainer_data.bio,
        cover_image=trainer_data.cover_image,
        experience_years=trainer_data.experience_years,
        certifications=trainer_data.certifications,
        availability=trainer_data.availability,
        location=trainer_data.location
    )
    
    db.add(db_trainer)
    db.commit()
    db.refresh(db_trainer)
    
    # Get user information
    user = db.query(User).filter(User.id == current_user.id).first()
    
    return TrainerResponse(
        id=db_trainer.id,
        user_id=db_trainer.user_id,
        specialty=db_trainer.specialty,
        price_per_session=db_trainer.price_per_session,
        bio=db_trainer.bio,
        cover_image=db_trainer.cover_image,
        experience_years=db_trainer.experience_years,
        certifications=db_trainer.certifications,
        availability=db_trainer.availability,
        location=db_trainer.location,
        rating=db_trainer.rating,
        reviews_count=db_trainer.reviews_count,
        is_available=db_trainer.is_available,
        created_at=db_trainer.created_at,
        user_name=user.full_name,
        user_email=user.email,
        user_avatar=user.avatar
    )

@router.get("/", response_model=TrainerListResponse)
async def get_trainers(
    specialty: Optional[Specialty] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    min_rating: Optional[float] = Query(None),
    location: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Get list of trainers with optional filters"""
    
    # Build query
    query = db.query(Trainer).join(User).filter(
        and_(
            User.is_active == True,
            Trainer.is_available == True
        )
    )
    
    # Apply filters
    if specialty:
        query = query.filter(Trainer.specialty == specialty)
    
    if min_price is not None:
        query = query.filter(Trainer.price_per_session >= min_price)
    
    if max_price is not None:
        query = query.filter(Trainer.price_per_session <= max_price)
    
    if min_rating is not None:
        query = query.filter(Trainer.rating >= min_rating)
    
    if location:
        query = query.filter(Trainer.location.ilike(f"%{location}%"))
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * size
    trainers = query.offset(offset).limit(size).all()
    
    # Format response
    trainer_responses = []
    for trainer in trainers:
        user = db.query(User).filter(User.id == trainer.user_id).first()
        trainer_responses.append(TrainerResponse(
            id=trainer.id,
            user_id=trainer.user_id,
            specialty=trainer.specialty,
            price_per_session=trainer.price_per_session,
            price_per_hour=trainer.price_per_hour,
            training_types=json.dumps(trainer.training_types) if trainer.training_types else None,
            bio=trainer.bio,
            cover_image=trainer.cover_image,
            experience_years=trainer.experience_years,
            certifications=trainer.certifications,
            availability=trainer.availability,
            location=trainer.location,
            rating=trainer.rating,
            reviews_count=trainer.reviews_count,
            is_available=trainer.is_available,
            created_at=trainer.created_at,
            # Gym information
            gym_name=trainer.gym_name,
            gym_address=trainer.gym_address,
            gym_city=trainer.gym_city,
            gym_state=trainer.gym_state,
            gym_zip_code=trainer.gym_zip_code,
            gym_phone=trainer.gym_phone,
            # Profile completion status
            profile_completion_status=trainer.profile_completion_status.value if trainer.profile_completion_status else None,
            # Location preference
            location_preference=trainer.location_preference,
            # User information
            user_name=user.full_name,
            user_email=user.email,
            user_avatar=user.avatar
        ))
    
    total_pages = (total + size - 1) // size
    
    return TrainerListResponse(
        trainers=trainer_responses,
        total=total,
        page=page,
        size=size,
        total_pages=total_pages
    )

@router.get("/{trainer_id}", response_model=TrainerResponse)
async def get_trainer(
    trainer_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific trainer by ID"""
    trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainer not found"
        )
    
    user = db.query(User).filter(User.id == trainer.user_id).first()
    
    return TrainerResponse(
        id=trainer.id,
        user_id=trainer.user_id,
        specialty=trainer.specialty,
        price_per_session=trainer.price_per_session,
        price_per_hour=trainer.price_per_hour,
        training_types=trainer.training_types,
        bio=trainer.bio,
        cover_image=trainer.cover_image,
        experience_years=trainer.experience_years,
        certifications=trainer.certifications,
        availability=trainer.availability,
        location=trainer.location,
        rating=trainer.rating,
        reviews_count=trainer.reviews_count,
        is_available=trainer.is_available,
        created_at=trainer.created_at,
        # Gym information
        gym_name=trainer.gym_name,
        gym_address=trainer.gym_address,
        gym_city=trainer.gym_city,
        gym_state=trainer.gym_state,
        gym_zip_code=trainer.gym_zip_code,
        gym_phone=trainer.gym_phone,
        # Profile completion status
        profile_completion_status=trainer.profile_completion_status.value if trainer.profile_completion_status else None,
        # Location preference
        location_preference=trainer.location_preference,
        # User information
        user_name=user.full_name,
        user_email=user.email,
        user_avatar=user.avatar
    )

@router.put("/{trainer_id}", response_model=TrainerResponse)
async def update_trainer(
    trainer_id: int,
    trainer_update: TrainerUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update trainer profile (only the trainer owner or admin)"""
    trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainer not found"
        )
    
    # Check permissions
    if current_user.role != UserRole.ADMIN and trainer.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this trainer profile"
        )
    
    # Update fields
    update_data = trainer_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(trainer, field, value)
    
    db.commit()
    db.refresh(trainer)
    
    # Get user information
    user = db.query(User).filter(User.id == trainer.user_id).first()
    
    return TrainerResponse(
        id=trainer.id,
        user_id=trainer.user_id,
        specialty=trainer.specialty,
        price_per_session=trainer.price_per_session,
        bio=trainer.bio,
        cover_image=trainer.cover_image,
        experience_years=trainer.experience_years,
        certifications=trainer.certifications,
        availability=trainer.availability,
        location=trainer.location,
        rating=trainer.rating,
        reviews_count=trainer.reviews_count,
        is_available=trainer.is_available,
        created_at=trainer.created_at,
        user_name=user.full_name,
        user_email=user.email,
        user_avatar=user.avatar
    )

