"""
Optimal Schedule API Router

Provides endpoints for generating optimal trainer schedules using greedy algorithms.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.utils.auth import get_current_user
from app.models import User, Trainer, UserRole
from app.schemas.optimal_schedule import (
    OptimalScheduleResponse,
    OptimalScheduleRequest,
    ProposedScheduleEntry,
    OptimalScheduleStatistics
)
from app.services.optimal_schedule_service import OptimalScheduleService
from app.services.email_service import email_service


router = APIRouter()


# IMPORTANT: This route must come BEFORE /trainer/{trainer_id}/optimal-schedule
# Otherwise FastAPI will try to parse "me" as an integer for trainer_id
@router.get(
    "/trainer/me/optimal-schedule",
    response_model=OptimalScheduleResponse,
    summary="Generate Optimal Schedule for Current Trainer",
    description="Generate optimal schedule for the currently authenticated trainer."
)
async def generate_my_optimal_schedule(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate optimal schedule for the currently authenticated trainer.
    
    This is a convenience endpoint that doesn't require the trainer_id parameter.
    """
    # Verify current user is a trainer
    if current_user.role != UserRole.TRAINER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only trainers can access this endpoint"
        )
    
    # Get trainer profile
    trainer = db.query(Trainer).filter(Trainer.user_id == current_user.id).first()
    if not trainer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainer profile not found"
        )
    
    # Generate optimal schedule
    service = OptimalScheduleService(db)
    result = service.generate_optimal_schedule(trainer.id)
    
    # Convert to response schema
    return OptimalScheduleResponse(
        trainer_id=result['trainer_id'],
        proposed_entries=[
            ProposedScheduleEntry(**entry)
            for entry in result['proposed_entries']
        ],
        statistics=OptimalScheduleStatistics(**result['statistics']),
        message=result['message']
    )


@router.get(
    "/trainer/{trainer_id}/optimal-schedule",
    response_model=OptimalScheduleResponse,
    summary="Generate Optimal Schedule for Trainer",
    description="""
    Generate an optimal schedule for a specific trainer using a greedy heuristic algorithm.
    
    **Algorithm Overview:**
    - Prioritizes booking requests by priority score and duration
    - Finds contiguous time slot combinations for different session lengths
    - Assigns requests to earliest available slots closest to preferred dates
    - Maximizes consecutive sessions to minimize gaps
    
    **Returns:**
    - List of proposed schedule entries (booking request + assigned time slots)
    - Statistics about scheduling efficiency and utilization
    - Unscheduled requests information
    """
)
async def generate_optimal_schedule(
    trainer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate optimal schedule for a trainer.
    
    Only the trainer themselves or admins can access this endpoint.
    """
    # Verify trainer exists
    trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainer not found"
        )
    
    # Authorization: Only the trainer themselves or admin can generate their schedule
    if current_user.role != UserRole.ADMIN:
        if current_user.role != UserRole.TRAINER or trainer.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this trainer's schedule"
            )
    
    # Generate optimal schedule
    service = OptimalScheduleService(db)
    result = service.generate_optimal_schedule(trainer_id)
    
    # Convert to response schema
    return OptimalScheduleResponse(
        trainer_id=result['trainer_id'],
        proposed_entries=[
            ProposedScheduleEntry(**entry)
            for entry in result['proposed_entries']
        ],
        statistics=OptimalScheduleStatistics(**result['statistics']),
        message=result['message']
    )


@router.post(
    "/trainer/{trainer_id}/optimal-schedule/apply",
    summary="Apply Optimal Schedule",
    description="""
    Apply the optimal schedule by converting proposed entries into confirmed bookings.
    
    **Warning:** This will automatically approve booking requests and assign time slots.
    Make sure to review the proposed schedule before applying it.
    """
)
async def apply_optimal_schedule(
    trainer_id: int,
    entry_ids: list[int],  # List of booking_request_ids to apply
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Apply selected entries from the optimal schedule.
    
    This endpoint will:
    1. Approve the selected booking requests
    2. Assign the time slots to the bookings
    3. Mark the slots as booked
    """
    from app.models import BookingRequest, BookingRequestStatus, TimeSlot, Booking
    from app.schemas.booking import BookingStatus
    
    # Verify trainer exists
    trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainer not found"
        )
    
    # Authorization check
    if current_user.role != UserRole.ADMIN:
        if current_user.role != UserRole.TRAINER or trainer.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to modify this trainer's schedule"
            )
    
    # Track results
    applied_entries = []
    failed_entries = []
    
    for booking_request_id in entry_ids:
        try:
            # Get the booking request
            booking_request = db.query(BookingRequest).filter(
                BookingRequest.id == booking_request_id,
                BookingRequest.trainer_id == trainer_id
            ).first()
            
            if not booking_request:
                failed_entries.append({
                    'booking_request_id': booking_request_id,
                    'reason': 'Booking request not found'
                })
                continue
            
            # Check if already processed
            if booking_request.status != BookingRequestStatus.PENDING:
                failed_entries.append({
                    'booking_request_id': booking_request_id,
                    'reason': f'Booking request already {booking_request.status}'
                })
                continue
            
            # Get the proposed slot IDs from the optimal schedule service
            # Re-generate to get the slot assignments
            service = OptimalScheduleService(db)
            result = service.generate_optimal_schedule(trainer_id)
            
            # Find the entry for this booking request
            proposed_entry = None
            for entry in result['proposed_entries']:
                if entry['booking_request_id'] == booking_request_id:
                    proposed_entry = entry
                    break
            
            if not proposed_entry:
                failed_entries.append({
                    'booking_request_id': booking_request_id,
                    'reason': 'No time slots available for this request'
                })
                continue
            
            # Verify all time slots are still available
            slot_ids = proposed_entry['slot_ids']
            time_slots = db.query(TimeSlot).filter(TimeSlot.id.in_(slot_ids)).all()
            
            if len(time_slots) != len(slot_ids):
                failed_entries.append({
                    'booking_request_id': booking_request_id,
                    'reason': 'Some time slots are no longer available'
                })
                continue
            
            # Check if any slots are already booked
            if any(slot.is_booked for slot in time_slots):
                failed_entries.append({
                    'booking_request_id': booking_request_id,
                    'reason': 'One or more time slots are already booked'
                })
                continue
            
            # Create the booking
            booking = Booking(
                client_id=booking_request.client_id,
                trainer_id=booking_request.trainer_id,
                session_type=booking_request.session_type,
                duration_minutes=booking_request.duration_minutes,
                location=booking_request.location,
                special_requests=booking_request.special_requests,
                confirmed_date=proposed_entry['start_time'],
                preferred_start_date=booking_request.preferred_start_date,
                preferred_end_date=booking_request.preferred_end_date,
                preferred_times=booking_request.preferred_times,
                status=BookingStatus.CONFIRMED
            )
            
            db.add(booking)
            db.flush()  # Get the booking ID
            
            # Mark time slots as booked
            for time_slot in time_slots:
                time_slot.is_booked = True
                time_slot.booking_id = booking.id
            
            # Update booking request status
            booking_request.status = BookingRequestStatus.APPROVED
            
            # Commit transaction for this entry
            db.commit()
            
            applied_entries.append({
                'booking_request_id': booking_request_id,
                'booking_id': booking.id,
                'client_name': proposed_entry['client_name'],
                'start_time': proposed_entry['start_time'].isoformat(),
                'end_time': proposed_entry['end_time'].isoformat()
            })
            
            # Send email notification to client
            try:
                client = db.query(User).filter(User.id == booking_request.client_id).first()
                if client and client.email:
                    await email_service.send_booking_confirmation(
                        client_email=client.email,
                        client_name=client.full_name,
                        trainer_name=trainer.user.full_name,
                        session_type=booking.session_type,
                        confirmed_date=proposed_entry['start_time'].isoformat(),
                        confirmed_time=proposed_entry['start_time'].strftime("%H:%M"),
                        duration_minutes=booking.duration_minutes,
                        location=booking.location or "Not specified"
                    )
            except Exception as email_error:
                # Log email error but don't fail the booking
                print(f"Failed to send confirmation email: {str(email_error)}")
            
        except Exception as e:
            db.rollback()
            failed_entries.append({
                'booking_request_id': booking_request_id,
                'reason': f'Error: {str(e)}'
            })
    
    return {
        "message": f"Applied {len(applied_entries)} out of {len(entry_ids)} selected entries",
        "trainer_id": trainer_id,
        "applied_entries": applied_entries,
        "failed_entries": failed_entries,
        "success_count": len(applied_entries),
        "failure_count": len(failed_entries)
    }

