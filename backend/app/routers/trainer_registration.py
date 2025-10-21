"""
API router for trainer registration completion
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db
from app.models import Trainer, User, TrainingType, ProfileCompletionStatus
from app.schemas.trainer_registration import (
    ProfileCompletionRequest,
    ProfileCompletionResponse,
    TrainerProfileStatus,
    RegistrationProgress,
    TrainerRegistrationStep,
    TimeBasedBookingRequest,
    BookingPriceCalculation,
    AvailableTimeSlot,
    TimeSlotRequest
)
from app.utils.auth import get_current_user
from app.services.scheduling_service import SchedulingService

router = APIRouter(prefix="/api/trainer-registration", tags=["trainer-registration"])


@router.get("/profile-status", response_model=TrainerProfileStatus)
async def get_profile_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get trainer profile completion status"""
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
    
    # Check completion status
    is_complete = trainer.is_profile_complete()
    missing_fields = []
    
    if not trainer.training_types:
        missing_fields.append("training_types")
    if not trainer.price_per_hour or trainer.price_per_hour <= 0:
        missing_fields.append("price_per_hour")
    if not trainer.gym_name:
        missing_fields.append("gym_name")
    if not trainer.gym_address:
        missing_fields.append("gym_address")
    if not trainer.bio or len(trainer.bio) < 100:
        missing_fields.append("bio")
    
    completion_percentage = ((5 - len(missing_fields)) / 5) * 100
    
    return TrainerProfileStatus(
        is_complete=is_complete,
        completion_status=trainer.profile_completion_status,
        completion_date=trainer.profile_completion_date,
        missing_fields=missing_fields,
        completion_percentage=completion_percentage
    )


@router.get("/progress", response_model=RegistrationProgress)
async def get_registration_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed registration progress"""
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
    
    # Define registration steps
    steps = [
        TrainerRegistrationStep(
            step_number=1,
            step_name="Training Types",
            is_completed=bool(trainer.training_types),
            is_required=True,
            description="Select your training specialties"
        ),
        TrainerRegistrationStep(
            step_number=2,
            step_name="Pricing",
            is_completed=bool(trainer.price_per_hour and trainer.price_per_hour > 0),
            is_required=True,
            description="Set your hourly rate"
        ),
        TrainerRegistrationStep(
            step_number=3,
            step_name="Gym Information",
            is_completed=bool(
                (trainer.location_preference == 'customer_choice') or 
                (trainer.gym_name and trainer.gym_address)
            ),
            is_required=True,
            description="Provide gym details or choose customer's choice"
        ),
        TrainerRegistrationStep(
            step_number=4,
            step_name="Bio",
            is_completed=bool(trainer.bio and len(trainer.bio) >= 100),
            is_required=True,
            description="Write your professional bio"
        ),
        TrainerRegistrationStep(
            step_number=5,
            step_name="Availability",
            is_completed=bool(trainer.availability),
            is_required=True,
            description="Set your weekly schedule"
        )
    ]
    
    completed_steps = sum(1 for step in steps if step.is_completed)
    current_step = completed_steps + 1 if completed_steps < len(steps) else len(steps)
    
    # Determine next step
    next_step = None
    if completed_steps < len(steps):
        next_incomplete_step = next(step for step in steps if not step.is_completed)
        next_step = next_incomplete_step.step_name.lower().replace(" ", "_")
    
    can_proceed = completed_steps == len(steps)
    
    return RegistrationProgress(
        current_step=current_step,
        total_steps=len(steps),
        completed_steps=completed_steps,
        steps=steps,
        can_proceed=can_proceed,
        next_step=next_step
    )


@router.post("/complete", response_model=ProfileCompletionResponse)
async def complete_registration(
    request: ProfileCompletionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Complete trainer registration"""
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
    
    # Update trainer profile
    trainer.training_types_list = [t.value for t in request.training_types]
    trainer.price_per_hour = request.price_per_hour
    trainer.location_preference = request.location_preference
    trainer.bio = request.bio
    
    # Only update gym fields when location preference is 'specific_gym'
    if request.location_preference == 'specific_gym':
        trainer.gym_name = request.gym_name
        trainer.gym_address = request.gym_address
        trainer.gym_city = request.gym_city
        trainer.gym_state = request.gym_state
        trainer.gym_zip_code = request.gym_zip_code
        trainer.gym_phone = request.gym_phone
    else:
        # Clear gym fields when customer's choice is selected
        trainer.gym_name = None
        trainer.gym_address = None
        trainer.gym_city = None
        trainer.gym_state = None
        trainer.gym_zip_code = None
        trainer.gym_phone = None
    
    # Mark profile as complete
    if trainer.mark_profile_complete():
        db.commit()
        return ProfileCompletionResponse(
            success=True,
            message="Profile completed successfully! You can now accept bookings.",
            profile_completion_status=ProfileCompletionStatus.COMPLETE,
            profile_completion_date=trainer.profile_completion_date
        )
    else:
        db.commit()
        return ProfileCompletionResponse(
            success=False,
            message="Profile updated but still incomplete. Please complete all required fields.",
            profile_completion_status=ProfileCompletionStatus.INCOMPLETE
        )


@router.get("/training-types", response_model=List[str])
async def get_available_training_types():
    """Get list of available training types"""
    return [training_type.value for training_type in TrainingType]


@router.post("/calculate-price", response_model=BookingPriceCalculation)
async def calculate_booking_price(
    request: TimeBasedBookingRequest,
    db: Session = Depends(get_db)
):
    """Calculate booking price for time-based session"""
    trainer = db.query(Trainer).filter(Trainer.id == request.trainer_id).first()
    if not trainer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainer not found"
        )
    
    if trainer.profile_completion_status != ProfileCompletionStatus.COMPLETE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Trainer profile is not complete"
        )
    
    # Calculate duration
    duration_minutes = (request.end_time - request.start_time).total_seconds() / 60
    total_hours = duration_minutes / 60
    
    # Base pricing
    base_price_per_hour = trainer.price_per_hour
    base_cost = base_price_per_hour * total_hours
    
    # Location surcharge (example: home training costs more)
    location_surcharge = 0.0
    if request.location_type.value == "home":
        location_surcharge = 10.0  # $10 surcharge for home training
    
    # Training type multiplier (could be different rates for different types)
    training_type_multiplier = 1.0
    # You could implement different rates for different training types here
    
    total_cost = (base_cost * training_type_multiplier) + location_surcharge
    
    return BookingPriceCalculation(
        trainer_id=request.trainer_id,
        duration_minutes=int(duration_minutes),
        training_type=request.training_type,
        location_type=request.location_type,
        base_price_per_hour=base_price_per_hour,
        total_hours=total_hours,
        base_cost=base_cost,
        location_surcharge=location_surcharge,
        training_type_multiplier=training_type_multiplier,
        total_cost=round(total_cost, 2)
    )


@router.get("/available-slots", response_model=List[AvailableTimeSlot])
async def get_available_time_slots(
    trainer_id: int,
    date: datetime,
    duration_minutes: int = 60,
    training_type: str = None,
    location_type: str = "gym",
    db: Session = Depends(get_db)
):
    """Get available time slots for a trainer on a specific date"""
    trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainer not found"
        )
    
    if trainer.profile_completion_status != ProfileCompletionStatus.COMPLETE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Trainer profile is not complete"
        )
    
    # Validate duration
    if duration_minutes not in [60, 90, 120]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duration must be 60, 90, or 120 minutes"
        )
    
    # Use scheduling service to get available slots
    scheduling_service = SchedulingService(db)
    available_slots = await scheduling_service.get_available_time_slots(
        trainer_id=trainer_id,
        date=date,
        duration_minutes=duration_minutes
    )
    
    # Convert to response format
    time_slots = []
    for slot in available_slots:
        total_hours = duration_minutes / 60
        total_cost = trainer.price_per_hour * total_hours
        
        time_slots.append(AvailableTimeSlot(
            start_time=slot['start_time'],
            end_time=slot['end_time'],
            duration_minutes=duration_minutes,
            price_per_hour=trainer.price_per_hour,
            total_cost=round(total_cost, 2),
            is_available=slot['is_available'],
            location_type=location_type
        ))
    
    return time_slots























