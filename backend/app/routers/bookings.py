"""
API routes for booking management with smart scheduling
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import json

from app.database import get_db
from app.models import Booking, Trainer, User, Session, TimeSlot
from app.schemas.booking import (
    BookingCreate,
    BookingUpdate,
    BookingResponse,
    BookingConfirmation,
    SmartBookingRequest,
    SmartBookingResponse,
    BookingStatus
)
from app.services.scheduling_service import SchedulingService
from app.utils.auth import get_current_user

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post("/smart-booking", response_model=SmartBookingResponse)
async def create_smart_booking(
    booking_request: SmartBookingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a smart booking with automatic optimal scheduling using time slots
    
    This endpoint uses our time slot system to find and book the best available slots
    """
    
    # Validate trainer exists
    trainer = db.query(Trainer).filter(Trainer.id == booking_request.trainer_id).first()
    if not trainer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainer not found"
        )
    
    # Initialize scheduling service
    scheduling_service = SchedulingService(db)
    
    # Find optimal slots using time slot system
    suggested_slots = scheduling_service.find_optimal_slots(
        booking_request, 
        booking_request.trainer_id
    )
    
    if not suggested_slots:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No available time slots found for the given criteria"
        )
    
    # Get the best time slot and book it
    best_slot = suggested_slots[0]
    time_slot = db.query(TimeSlot).filter(TimeSlot.id == best_slot['slot_id']).first()
    
    if not time_slot or time_slot.is_booked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected time slot is no longer available"
        )
    
    # Create the booking record
    booking = Booking(
        client_id=current_user.id,
        trainer_id=booking_request.trainer_id,
        session_type=booking_request.session_type,
        duration_minutes=booking_request.duration_minutes,
        location=booking_request.location,
        special_requests=booking_request.special_requests,
        confirmed_date=time_slot.start_time,
        preferred_start_date=booking_request.earliest_date,
        preferred_end_date=booking_request.latest_date,
        preferred_times=json.dumps(booking_request.preferred_times) if booking_request.preferred_times else None,
        status=BookingStatus.CONFIRMED
    )
    
    db.add(booking)
    db.commit()
    db.refresh(booking)
    
    # Mark the time slot as booked
    time_slot.is_booked = True
    time_slot.booking_id = booking.id
    db.commit()
    
    # Calculate confidence score based on number of good options
    confidence_score = min(1.0, len(suggested_slots) / 5.0) if suggested_slots else 0.0
    
    # Prepare response
    best_slot = suggested_slots[0] if suggested_slots else None
    
    return SmartBookingResponse(
        booking_id=booking.id,
        suggested_slots=suggested_slots,
        best_slot=best_slot,
        confidence_score=confidence_score,
        message=f"Found {len(suggested_slots)} optimal time slots. Top recommendation: {best_slot['date_str']} at {best_slot['start_time_str']}"
    )


@router.post("/optimal-schedule", response_model=SmartBookingResponse)
async def find_optimal_schedule(
    booking_request: SmartBookingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Find optimal schedule across all trainers using greedy algorithm
    
    This endpoint:
    1. If trainer_id is provided, finds optimal slots for that trainer
    2. If no trainer_id, evaluates all trainers and finds the best overall match
    3. Uses greedy algorithm to prioritize highest-scoring options
    
    NOTE: This endpoint only SUGGESTS optimal times. It does NOT create a booking.
    The client must explicitly book a slot through a separate booking request.
    """
    
    # Initialize scheduling service
    scheduling_service = SchedulingService(db)
    
    # Find optimal schedule across trainers
    result = scheduling_service.find_optimal_schedule_across_trainers(
        booking_request,
        booking_request.trainer_id
    )
    
    if not result['suggested_slots']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result['message']
        )
    
    # Return suggestions without creating a booking
    # The user will need to explicitly book one of the suggested slots
    return SmartBookingResponse(
        booking_id=None,  # No booking created yet
        suggested_slots=result['suggested_slots'],
        best_slot=result['best_slot'],
        confidence_score=result['confidence_score'],
        message=result['message']
    )


@router.post("/greedy-optimization")
async def greedy_schedule_optimization(
    booking_request: SmartBookingRequest,
    max_suggestions: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Advanced greedy scheduling optimization across all trainers
    
    This endpoint provides the most sophisticated scheduling algorithm that:
    1. Scores each trainer-slot combination
    2. Considers multiple optimization criteria
    3. Applies greedy selection with tie-breaking
    4. Returns ranked suggestions with detailed scoring
    """
    
    # Initialize scheduling service
    scheduling_service = SchedulingService(db)
    
    # Run greedy optimization
    result = scheduling_service.greedy_schedule_optimization(
        booking_request,
        max_suggestions
    )
    
    if not result['suggestions']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result['message']
        )
    
    return result


@router.post("/", response_model=BookingResponse)
async def create_booking(
    booking_data: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new booking with manual scheduling"""
    
    # Validate trainer exists
    trainer = db.query(Trainer).filter(Trainer.id == booking_data.trainer_id).first()
    if not trainer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainer not found"
        )
    
    # Create booking
    booking = Booking(
        client_id=current_user.id,
        trainer_id=booking_data.trainer_id,
        session_type=booking_data.session_type,
        duration_minutes=booking_data.duration_minutes,
        location=booking_data.location,
        special_requests=booking_data.special_requests,
        preferred_start_date=booking_data.preferred_start_date,
        preferred_end_date=booking_data.preferred_end_date,
        preferred_times=json.dumps(booking_data.preferred_times) if booking_data.preferred_times else None,
        is_recurring=booking_data.is_recurring,
        recurring_pattern=booking_data.recurring_pattern,
        status=BookingStatus.PENDING
    )
    
    db.add(booking)
    db.commit()
    db.refresh(booking)
    
    # Add client and trainer names for response
    booking.client_name = current_user.full_name
    booking.trainer_name = trainer.user.full_name
    
    return booking


@router.post("/{booking_id}/confirm", response_model=BookingResponse)
async def confirm_booking(
    booking_id: int,
    confirmation: BookingConfirmation,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Confirm a booking with a specific date and time"""
    
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Check permissions (trainer or admin can confirm)
    if current_user.role not in ["trainer", "admin"] and current_user.id != booking.trainer.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to confirm this booking"
        )
    
    # Check for conflicts
    scheduling_service = SchedulingService(db)
    conflicts = scheduling_service.detect_conflicts(booking_id)
    
    if conflicts:
        conflict_details = [c.conflict_details for c in conflicts]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Scheduling conflicts detected: {', '.join(conflict_details)}"
        )
    
    # Update booking
    booking.confirmed_date = confirmation.confirmed_date
    booking.status = BookingStatus.CONFIRMED
    booking.notes = confirmation.notes
    
    # Create corresponding session
    session = Session(
        client_id=booking.client_id,
        trainer_id=booking.trainer_id,
        booking_id=booking.id,
        title=f"{booking.session_type} Session",
        session_type=booking.session_type,
        scheduled_date=confirmation.confirmed_date,
        duration_minutes=booking.duration_minutes,
        location=booking.location,
        notes=confirmation.notes,
        status="confirmed"
    )
    
    db.add(session)
    db.commit()
    db.refresh(booking)
    db.refresh(session)
    
    # Add names for response
    booking.client_name = booking.client.full_name
    booking.trainer_name = booking.trainer.user.full_name
    
    return booking


@router.get("/", response_model=List[BookingResponse])
async def get_bookings(
    skip: int = 0,
    limit: int = 100,
    status: Optional[BookingStatus] = None,
    trainer_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get bookings with optional filtering"""
    
    query = db.query(Booking)
    
    # Filter by user role
    if current_user.role == "client":
        query = query.filter(Booking.client_id == current_user.id)
    elif current_user.role == "trainer":
        if current_user.trainer_profile:
            query = query.filter(Booking.trainer_id == current_user.trainer_profile.id)
        else:
            # If trainer role but no trainer profile, return empty results
            query = query.filter(Booking.id == -1)  # This will return no results
    # Admin can see all bookings
    
    # Apply filters
    if status:
        query = query.filter(Booking.status == status)
    if trainer_id:
        query = query.filter(Booking.trainer_id == trainer_id)
    
    bookings = query.offset(skip).limit(limit).all()
    
    # Add names for response with error handling
    for booking in bookings:
        try:
            booking.client_name = booking.client.full_name if booking.client else "Unknown Client"
            booking.trainer_name = booking.trainer.user.full_name if booking.trainer and booking.trainer.user else "Unknown Trainer"
            # Parse preferred_times JSON to list
            booking.preferred_times = booking.preferred_times_list
        except Exception as e:
            # Log the error but don't fail the entire request
            print(f"Error adding names for booking {booking.id}: {e}")
            booking.client_name = "Unknown Client"
            booking.trainer_name = "Unknown Trainer"
            booking.preferred_times = []
    
    return bookings


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific booking"""
    
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Check permissions
    if (current_user.role not in ["admin"] and 
        current_user.id != booking.client_id and 
        current_user.id != booking.trainer.user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this booking"
        )
    
    # Add names for response
    booking.client_name = booking.client.full_name
    booking.trainer_name = booking.trainer.user.full_name
    
    return booking


@router.put("/{booking_id}", response_model=BookingResponse)
async def update_booking(
    booking_id: int,
    booking_update: BookingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a booking"""
    
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Check permissions
    if (current_user.role not in ["admin"] and 
        current_user.id != booking.client_id and 
        current_user.id != booking.trainer.user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this booking"
        )
    
    # Update fields
    update_data = booking_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(booking, field, value)
    
    db.commit()
    db.refresh(booking)
    
    # Add names for response
    booking.client_name = booking.client.full_name
    booking.trainer_name = booking.trainer.user.full_name
    
    return booking


@router.delete("/{booking_id}")
async def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel a booking"""
    
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Check permissions
    if (current_user.role not in ["admin"] and 
        current_user.id != booking.client_id and 
        current_user.id != booking.trainer.user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to cancel this booking"
        )
    
    # Update status
    booking.status = BookingStatus.CANCELLED
    db.commit()
    
    return {"message": "Booking cancelled successfully"}


@router.get("/{booking_id}/conflicts")
async def check_booking_conflicts(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Check for scheduling conflicts with a booking"""
    
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Check permissions
    if (current_user.role not in ["admin"] and 
        current_user.id != booking.client_id and 
        current_user.id != booking.trainer.user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to check conflicts for this booking"
        )
    
    # Check for conflicts
    scheduling_service = SchedulingService(db)
    conflicts = scheduling_service.detect_conflicts(booking_id)
    
    return {
        "booking_id": booking_id,
        "conflicts": conflicts,
        "has_conflicts": len(conflicts) > 0
    }
