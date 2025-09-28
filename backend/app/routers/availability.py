"""
API routes for trainer availability management
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta, date
import json

from app.database import get_db
from app.models import TrainerAvailability, Trainer, User
from app.schemas.availability import (
    TrainerAvailabilityCreate,
    TrainerAvailabilityUpdate,
    TrainerAvailabilityResponse,
    WeeklyAvailabilityCreate,
    WeeklyAvailabilityResponse,
    TimeSlotRequest,
    AvailableSlotsResponse,
    TimeSlot
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/availability", tags=["availability"])


@router.post("/trainer/{trainer_id}/schedule", response_model=WeeklyAvailabilityResponse)
async def create_weekly_availability(
    trainer_id: int,
    weekly_data: WeeklyAvailabilityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create or update a trainer's weekly availability schedule
    Only the trainer themselves or an admin can modify availability
    """
    # Check if trainer exists
    trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainer not found"
        )
    
    # Check permissions
    if current_user.role != "admin" and current_user.id != trainer.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this trainer's availability"
        )
    
    # Clear existing availability for this trainer
    db.query(TrainerAvailability).filter(
        TrainerAvailability.trainer_id == trainer_id
    ).delete()
    
    # Create new availability entries
    total_hours = 0
    weekly_schedule = []
    
    for availability_data in weekly_data.availability:
        # Calculate hours for this day
        start_time = datetime.strptime(availability_data.start_time, "%H:%M")
        end_time = datetime.strptime(availability_data.end_time, "%H:%M")
        hours = (end_time - start_time).total_seconds() / 3600
        total_hours += hours
        
        availability = TrainerAvailability(
            trainer_id=trainer_id,
            day_of_week=availability_data.day_of_week,
            start_time=availability_data.start_time,
            end_time=availability_data.end_time,
            is_available=availability_data.is_available
        )
        db.add(availability)
        weekly_schedule.append(availability)
    
    db.commit()
    
    # Refresh to get IDs
    for availability in weekly_schedule:
        db.refresh(availability)
    
    return WeeklyAvailabilityResponse(
        trainer_id=trainer_id,
        weekly_schedule=weekly_schedule,
        total_hours_per_week=round(total_hours, 2)
    )


@router.get("/trainer/{trainer_id}/schedule", response_model=List[TrainerAvailabilityResponse])
async def get_trainer_availability(
    trainer_id: int,
    db: Session = Depends(get_db)
):
    """Get a trainer's weekly availability schedule"""
    availability = db.query(TrainerAvailability).filter(
        TrainerAvailability.trainer_id == trainer_id,
        TrainerAvailability.is_available == True
    ).order_by(TrainerAvailability.day_of_week, TrainerAvailability.start_time).all()
    
    return availability


@router.put("/{availability_id}", response_model=TrainerAvailabilityResponse)
async def update_availability(
    availability_id: int,
    availability_update: TrainerAvailabilityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a specific availability entry"""
    availability = db.query(TrainerAvailability).filter(
        TrainerAvailability.id == availability_id
    ).first()
    
    if not availability:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Availability entry not found"
        )
    
    # Check permissions
    if current_user.role != "admin" and current_user.id != availability.trainer.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this availability"
        )
    
    # Update fields
    update_data = availability_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(availability, field, value)
    
    db.commit()
    db.refresh(availability)
    
    return availability


@router.delete("/{availability_id}")
async def delete_availability(
    availability_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a specific availability entry"""
    availability = db.query(TrainerAvailability).filter(
        TrainerAvailability.id == availability_id
    ).first()
    
    if not availability:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Availability entry not found"
        )
    
    # Check permissions
    if current_user.role != "admin" and current_user.id != availability.trainer.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this availability"
        )
    
    db.delete(availability)
    db.commit()
    
    return {"message": "Availability deleted successfully"}


@router.post("/available-slots", response_model=AvailableSlotsResponse)
async def get_available_slots(
    slot_request: TimeSlotRequest,
    db: Session = Depends(get_db)
):
    """
    Get available time slots for a trainer on a specific date
    This is the core scheduling algorithm function
    """
    # Validate trainer exists
    trainer = db.query(Trainer).filter(Trainer.id == slot_request.trainer_id).first()
    if not trainer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainer not found"
        )
    
    # Parse the requested date
    try:
        requested_date = datetime.strptime(slot_request.date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    
    # Get day of week (0=Monday, 6=Sunday)
    day_of_week = requested_date.weekday()
    
    # Get trainer's availability for this day
    daily_availability = db.query(TrainerAvailability).filter(
        TrainerAvailability.trainer_id == slot_request.trainer_id,
        TrainerAvailability.day_of_week == day_of_week,
        TrainerAvailability.is_available == True
    ).all()
    
    if not daily_availability:
        return AvailableSlotsResponse(
            trainer_id=slot_request.trainer_id,
            date=slot_request.date,
            available_slots=[],
            total_slots=0
        )
    
    # Generate time slots
    available_slots = []
    
    for availability in daily_availability:
        # Parse start and end times
        start_time = datetime.strptime(availability.start_time, "%H:%M").time()
        end_time = datetime.strptime(availability.end_time, "%H:%M").time()
        
        # Generate 30-minute slots
        current_time = start_time
        while True:
            # Calculate end time for this slot
            current_datetime = datetime.combine(requested_date, current_time)
            slot_end_datetime = current_datetime + timedelta(minutes=slot_request.duration_minutes)
            
            if slot_end_datetime.time() > end_time:
                break
            
            # Check for conflicts with existing sessions
            # TODO: Implement conflict checking with Session model
            
            slot = TimeSlot(
                start_time=current_time.strftime("%H:%M"),
                end_time=slot_end_datetime.time().strftime("%H:%M"),
                is_available=True
            )
            available_slots.append(slot)
            
            # Move to next 30-minute slot
            current_datetime += timedelta(minutes=30)
            current_time = current_datetime.time()
    
    # Find recommended slot (preferably in preferred times)
    recommended_slot = None
    if slot_request.preferred_times and available_slots:
        for preferred_time in slot_request.preferred_times:
            for slot in available_slots:
                if slot.start_time == preferred_time:
                    recommended_slot = slot
                    break
            if recommended_slot:
                break
    
    # If no preferred time match, recommend first available slot
    if not recommended_slot and available_slots:
        recommended_slot = available_slots[0]
    
    return AvailableSlotsResponse(
        trainer_id=slot_request.trainer_id,
        date=slot_request.date,
        available_slots=available_slots,
        total_slots=len(available_slots),
        recommended_slot=recommended_slot
    )
