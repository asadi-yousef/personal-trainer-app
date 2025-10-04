"""
API routes for time slot management
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta, date
import json

from app.database import get_db
from app.models import TimeSlot, Trainer, User, Booking
from app.schemas.time_slots import (
    TimeSlotCreate,
    TimeSlotUpdate,
    TimeSlotResponse,
    BulkTimeSlotCreate,
    AvailableSlotRequest,
    AvailableSlotsResponse,
    AvailableSlot,
    TimeSlotBookingRequest,
    TimeSlotBookingResponse
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/time-slots", tags=["time-slots"])


@router.post("/bulk-create", response_model=List[TimeSlotResponse])
async def create_bulk_time_slots(
    bulk_data: BulkTimeSlotCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create multiple time slots for a trainer over a date range
    Only the trainer themselves or an admin can create time slots
    """
    # Check if trainer exists
    trainer = db.query(Trainer).filter(Trainer.id == bulk_data.trainer_id).first()
    if not trainer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainer not found"
        )
    
    # Check permissions
    if current_user.role != "admin" and current_user.id != trainer.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create time slots for this trainer"
        )
    
    # Parse start and end times
    start_time = datetime.strptime(bulk_data.start_time, "%H:%M").time()
    end_time = datetime.strptime(bulk_data.end_time, "%H:%M").time()
    
    created_slots = []
    current_date = bulk_data.start_date.date()
    end_date = bulk_data.end_date.date()
    
    # Generate time slots for each day in the range
    while current_date <= end_date:
        day_of_week = current_date.weekday()
        
        # Check if this day is in the specified days of week
        if day_of_week in bulk_data.days_of_week:
            # Generate slots for this day
            current_time = start_time
            while True:
                # Calculate slot end time
                current_datetime = datetime.combine(current_date, current_time)
                slot_end_datetime = current_datetime + timedelta(minutes=bulk_data.duration_minutes)
                
                if slot_end_datetime.time() > end_time:
                    break
                
                # Create time slot
                time_slot = TimeSlot(
                    trainer_id=bulk_data.trainer_id,
                    date=current_datetime,
                    start_time=current_datetime,
                    end_time=slot_end_datetime,
                    duration_minutes=bulk_data.duration_minutes,
                    is_available=bulk_data.is_available
                )
                
                db.add(time_slot)
                created_slots.append(time_slot)
                
                # Move to next slot
                current_datetime += timedelta(minutes=bulk_data.duration_minutes)
                current_time = current_datetime.time()
        
        current_date += timedelta(days=1)
    
    db.commit()
    
    # Refresh to get IDs
    for slot in created_slots:
        db.refresh(slot)
    
    return created_slots


@router.get("/trainer/{trainer_id}/available", response_model=AvailableSlotsResponse)
async def get_available_slots(
    trainer_id: int,
    date: str,
    duration_minutes: int = 60,
    db: Session = Depends(get_db)
):
    """
    Get available time slots for a trainer on a specific date
    """
    # Validate trainer exists
    trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainer not found"
        )
    
    # Parse the requested date
    try:
        requested_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    
    # Get available time slots for this date
    start_datetime = datetime.combine(requested_date, datetime.min.time())
    end_datetime = datetime.combine(requested_date, datetime.max.time())
    
    available_slots = db.query(TimeSlot).filter(
        TimeSlot.trainer_id == trainer_id,
        TimeSlot.date >= start_datetime,
        TimeSlot.date < end_datetime,
        TimeSlot.is_available == True,
        TimeSlot.is_booked == False,
        TimeSlot.duration_minutes == duration_minutes
    ).order_by(TimeSlot.start_time).all()
    
    # Convert to response format
    slots_response = []
    for slot in available_slots:
        slots_response.append(AvailableSlot(
            id=slot.id,
            start_time=slot.start_time.strftime("%H:%M"),
            end_time=slot.end_time.strftime("%H:%M"),
            duration_minutes=slot.duration_minutes,
            is_available=slot.is_available
        ))
    
    # Find recommended slot (first available)
    recommended_slot = slots_response[0] if slots_response else None
    
    return AvailableSlotsResponse(
        trainer_id=trainer_id,
        date=date,
        available_slots=slots_response,
        total_slots=len(slots_response),
        recommended_slot=recommended_slot
    )


@router.post("/book", response_model=TimeSlotBookingResponse)
async def book_time_slot(
    booking_request: TimeSlotBookingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Book a specific time slot
    """
    # Get the time slot
    time_slot = db.query(TimeSlot).filter(TimeSlot.id == booking_request.time_slot_id).first()
    if not time_slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Time slot not found"
        )
    
    # Check if slot is available
    if not time_slot.is_available or time_slot.is_booked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Time slot is not available for booking"
        )
    
    # Check if user is authorized to book for this client
    if current_user.role not in ["admin"] and current_user.id != booking_request.client_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to book for this client"
        )
    
    # Create booking
    booking = Booking(
        client_id=booking_request.client_id,
        trainer_id=time_slot.trainer_id,
        confirmed_date=time_slot.start_time,
        session_type=booking_request.session_type,
        duration_minutes=booking_request.duration_minutes,
        location=booking_request.location,
        special_requests=booking_request.special_requests,
        status="confirmed"
    )
    
    db.add(booking)
    db.commit()
    db.refresh(booking)
    
    # Update time slot
    time_slot.is_booked = True
    time_slot.booking_id = booking.id
    db.commit()
    
    return TimeSlotBookingResponse(
        booking_id=booking.id,
        time_slot_id=time_slot.id,
        status="confirmed",
        message="Time slot booked successfully"
    )


@router.get("/trainer/{trainer_id}", response_model=List[TimeSlotResponse])
async def get_trainer_time_slots(
    trainer_id: int,
    start_date: str,
    end_date: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get time slots for a trainer within a date range
    """
    # Check permissions
    trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainer not found"
        )
    
    if current_user.role != "admin" and current_user.id != trainer.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this trainer's time slots"
        )
    
    # Parse dates
    try:
        start_datetime = datetime.strptime(start_date, "%Y-%m-%d")
        end_datetime = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    
    # Get time slots
    time_slots = db.query(TimeSlot).filter(
        TimeSlot.trainer_id == trainer_id,
        TimeSlot.date >= start_datetime,
        TimeSlot.date < end_datetime
    ).order_by(TimeSlot.start_time).all()
    
    return time_slots


@router.put("/{slot_id}", response_model=TimeSlotResponse)
async def update_time_slot(
    slot_id: int,
    slot_update: TimeSlotUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a time slot
    """
    time_slot = db.query(TimeSlot).filter(TimeSlot.id == slot_id).first()
    if not time_slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Time slot not found"
        )
    
    # Check permissions
    trainer = db.query(Trainer).filter(Trainer.id == time_slot.trainer_id).first()
    if current_user.role != "admin" and current_user.id != trainer.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this time slot"
        )
    
    # Update fields
    update_data = slot_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(time_slot, field, value)
    
    db.commit()
    db.refresh(time_slot)
    
    return time_slot


@router.delete("/{slot_id}")
async def delete_time_slot(
    slot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a time slot
    """
    time_slot = db.query(TimeSlot).filter(TimeSlot.id == slot_id).first()
    if not time_slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Time slot not found"
        )
    
    # Check permissions
    trainer = db.query(Trainer).filter(Trainer.id == time_slot.trainer_id).first()
    if current_user.role != "admin" and current_user.id != trainer.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this time slot"
        )
    
    # Check if slot is booked
    if time_slot.is_booked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a booked time slot"
        )
    
    db.delete(time_slot)
    db.commit()
    
    return {"message": "Time slot deleted successfully"}
