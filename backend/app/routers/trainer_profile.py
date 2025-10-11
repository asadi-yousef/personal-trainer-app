"""
Simple API router for trainer profile management
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import json

from app.database import get_db
from app.models import Trainer, User
from app.schemas.trainer_profile import (
    UpdateBasicInfo,
    UpdateTrainingInfo,
    UpdateGymInfo,
    UpdatePricing,
    TrainerProfileResponse
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/trainer-profile", tags=["trainer-profile"])


@router.get("/me", response_model=TrainerProfileResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current trainer's profile"""
    if current_user.role != "trainer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only trainers can access this endpoint"
        )
    
    trainer = db.query(Trainer).filter(Trainer.user_id == current_user.id).first()
    if not trainer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainer profile not found"
        )
    
    return TrainerProfileResponse(
        id=trainer.id,
        user_id=trainer.user_id,
        specialty=trainer.specialty.value if trainer.specialty else "",
        rating=trainer.rating or 0.0,
        reviews_count=trainer.reviews_count or 0,
        price_per_hour=trainer.price_per_hour or 0.0,
        bio=trainer.bio,
        experience_years=trainer.experience_years or 0,
        certifications=trainer.certifications,
        training_types=trainer.training_types_list,
        gym_name=trainer.gym_name,
        gym_address=trainer.gym_address,
        gym_city=trainer.gym_city,
        gym_state=trainer.gym_state,
        gym_zip_code=trainer.gym_zip_code,
        gym_phone=trainer.gym_phone,
        is_available=trainer.is_available
    )


@router.patch("/basic-info")
async def update_basic_info(
    data: UpdateBasicInfo,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update basic trainer information"""
    if current_user.role != "trainer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only trainers can update their profile"
        )
    
    trainer = db.query(Trainer).filter(Trainer.user_id == current_user.id).first()
    if not trainer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainer profile not found"
        )
    
    # Update fields if provided
    if data.bio is not None:
        trainer.bio = data.bio
    if data.experience_years is not None:
        trainer.experience_years = data.experience_years
    if data.certifications is not None:
        trainer.certifications = data.certifications
    
    db.commit()
    db.refresh(trainer)
    
    return {"message": "Basic information updated successfully"}


@router.patch("/training-info")
async def update_training_info(
    data: UpdateTrainingInfo,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update training types and specialty"""
    if current_user.role != "trainer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only trainers can update their profile"
        )
    
    trainer = db.query(Trainer).filter(Trainer.user_id == current_user.id).first()
    if not trainer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainer profile not found"
        )
    
    # Update fields if provided
    if data.training_types is not None:
        trainer.training_types = json.dumps([t.value for t in data.training_types])
    if data.specialty is not None:
        trainer.specialty = data.specialty
    
    db.commit()
    db.refresh(trainer)
    
    return {"message": "Training information updated successfully"}


@router.patch("/gym-info")
async def update_gym_info(
    data: UpdateGymInfo,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update gym location information"""
    if current_user.role != "trainer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only trainers can update their profile"
        )
    
    trainer = db.query(Trainer).filter(Trainer.user_id == current_user.id).first()
    if not trainer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainer profile not found"
        )
    
    # Update fields if provided
    if data.gym_name is not None:
        trainer.gym_name = data.gym_name
    if data.gym_address is not None:
        trainer.gym_address = data.gym_address
    if data.gym_city is not None:
        trainer.gym_city = data.gym_city
    if data.gym_state is not None:
        trainer.gym_state = data.gym_state
    if data.gym_zip_code is not None:
        trainer.gym_zip_code = data.gym_zip_code
    if data.gym_phone is not None:
        trainer.gym_phone = data.gym_phone
    
    db.commit()
    db.refresh(trainer)
    
    return {"message": "Gym information updated successfully"}


@router.patch("/pricing")
async def update_pricing(
    data: UpdatePricing,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update pricing"""
    if current_user.role != "trainer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only trainers can update their profile"
        )
    
    trainer = db.query(Trainer).filter(Trainer.user_id == current_user.id).first()
    if not trainer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainer profile not found"
        )
    
    trainer.price_per_hour = data.price_per_hour
    
    db.commit()
    db.refresh(trainer)
    
    return {"message": "Pricing updated successfully", "new_price": data.price_per_hour}

