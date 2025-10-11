"""
API router for trainer scheduling preferences management
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import json

from app.database import get_db
from app.models import TrainerSchedulingPreferences, Trainer, User
from app.schemas.scheduling_preferences import (
    SchedulingPreferencesCreate,
    SchedulingPreferencesUpdate,
    SchedulingPreferencesResponse
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/scheduling-preferences", tags=["scheduling-preferences"])


@router.get("/me", response_model=SchedulingPreferencesResponse)
async def get_my_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current trainer's scheduling preferences"""
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
    
    # Get or create preferences
    preferences = db.query(TrainerSchedulingPreferences).filter(
        TrainerSchedulingPreferences.trainer_id == trainer.id
    ).first()
    
    if not preferences:
        # Create default preferences
        preferences = TrainerSchedulingPreferences(trainer_id=trainer.id)
        db.add(preferences)
        db.commit()
        db.refresh(preferences)
    
    return SchedulingPreferencesResponse(
        id=preferences.id,
        trainer_id=preferences.trainer_id,
        max_sessions_per_day=preferences.max_sessions_per_day,
        min_break_minutes=preferences.min_break_minutes,
        prefer_consecutive_sessions=preferences.prefer_consecutive_sessions,
        work_start_time=preferences.work_start_time,
        work_end_time=preferences.work_end_time,
        days_off=preferences.days_off_list,
        preferred_time_blocks=preferences.preferred_time_blocks_list,
        prioritize_recurring_clients=preferences.prioritize_recurring_clients,
        prioritize_high_value_sessions=preferences.prioritize_high_value_sessions
    )


@router.put("/me", response_model=SchedulingPreferencesResponse)
async def update_my_preferences(
    data: SchedulingPreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current trainer's scheduling preferences"""
    if current_user.role != "trainer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only trainers can update their preferences"
        )
    
    trainer = db.query(Trainer).filter(Trainer.user_id == current_user.id).first()
    if not trainer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainer profile not found"
        )
    
    # Get or create preferences
    preferences = db.query(TrainerSchedulingPreferences).filter(
        TrainerSchedulingPreferences.trainer_id == trainer.id
    ).first()
    
    if not preferences:
        # Create new preferences
        preferences = TrainerSchedulingPreferences(trainer_id=trainer.id)
        db.add(preferences)
    
    # Update fields if provided
    if data.max_sessions_per_day is not None:
        preferences.max_sessions_per_day = data.max_sessions_per_day
    if data.min_break_minutes is not None:
        preferences.min_break_minutes = data.min_break_minutes
    if data.prefer_consecutive_sessions is not None:
        preferences.prefer_consecutive_sessions = data.prefer_consecutive_sessions
    if data.work_start_time is not None:
        preferences.work_start_time = data.work_start_time
    if data.work_end_time is not None:
        preferences.work_end_time = data.work_end_time
    if data.days_off is not None:
        preferences.days_off_list = data.days_off
    if data.preferred_time_blocks is not None:
        preferences.preferred_time_blocks_list = data.preferred_time_blocks
    if data.prioritize_recurring_clients is not None:
        preferences.prioritize_recurring_clients = data.prioritize_recurring_clients
    if data.prioritize_high_value_sessions is not None:
        preferences.prioritize_high_value_sessions = data.prioritize_high_value_sessions
    
    db.commit()
    db.refresh(preferences)
    
    return SchedulingPreferencesResponse(
        id=preferences.id,
        trainer_id=preferences.trainer_id,
        max_sessions_per_day=preferences.max_sessions_per_day,
        min_break_minutes=preferences.min_break_minutes,
        prefer_consecutive_sessions=preferences.prefer_consecutive_sessions,
        work_start_time=preferences.work_start_time,
        work_end_time=preferences.work_end_time,
        days_off=preferences.days_off_list,
        preferred_time_blocks=preferences.preferred_time_blocks_list,
        prioritize_recurring_clients=preferences.prioritize_recurring_clients,
        prioritize_high_value_sessions=preferences.prioritize_high_value_sessions
    )


@router.post("/reset", response_model=SchedulingPreferencesResponse)
async def reset_to_defaults(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reset scheduling preferences to default values"""
    if current_user.role != "trainer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only trainers can reset their preferences"
        )
    
    trainer = db.query(Trainer).filter(Trainer.user_id == current_user.id).first()
    if not trainer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainer profile not found"
        )
    
    # Get or create preferences
    preferences = db.query(TrainerSchedulingPreferences).filter(
        TrainerSchedulingPreferences.trainer_id == trainer.id
    ).first()
    
    if preferences:
        # Reset to defaults
        preferences.max_sessions_per_day = 8
        preferences.min_break_minutes = 15
        preferences.prefer_consecutive_sessions = True
        preferences.work_start_time = "08:00"
        preferences.work_end_time = "18:00"
        preferences.days_off_list = []
        preferences.preferred_time_blocks_list = ["morning", "afternoon"]
        preferences.prioritize_recurring_clients = True
        preferences.prioritize_high_value_sessions = False
    else:
        # Create with defaults
        preferences = TrainerSchedulingPreferences(trainer_id=trainer.id)
        db.add(preferences)
    
    db.commit()
    db.refresh(preferences)
    
    return SchedulingPreferencesResponse(
        id=preferences.id,
        trainer_id=preferences.trainer_id,
        max_sessions_per_day=preferences.max_sessions_per_day,
        min_break_minutes=preferences.min_break_minutes,
        prefer_consecutive_sessions=preferences.prefer_consecutive_sessions,
        work_start_time=preferences.work_start_time,
        work_end_time=preferences.work_end_time,
        days_off=preferences.days_off_list,
        preferred_time_blocks=preferences.preferred_time_blocks_list,
        prioritize_recurring_clients=preferences.prioritize_recurring_clients,
        prioritize_high_value_sessions=preferences.prioritize_high_value_sessions
    )

