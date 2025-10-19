from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import json

from app.database import get_db
from app.models import BookingRequest, BookingRequestStatus, Booking, BookingStatus, TimeSlot, Trainer, User
from app.schemas.booking_request import (
    BookingRequestCreate,
    BookingRequestResponse,
    BookingRequestApproval,
    BookingRequestUpdate
)
from app.utils.auth import get_current_user
from app.services.email_service import email_service
from app.services.booking_service import BookingService

router = APIRouter(prefix="/booking-requests", tags=["Booking Requests"])

@router.post("/", response_model=BookingRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_booking_request(
    request_data: BookingRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new booking request that requires trainer approval
    """
    # Validate trainer exists
    trainer = db.query(Trainer).filter(Trainer.id == request_data.trainer_id).first()
    if not trainer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainer not found"
        )
    
    # Set expiration date (24 hours from now)
    expires_at = datetime.utcnow() + timedelta(hours=24)
    
    # Create booking request
    booking_request = BookingRequest(
        client_id=current_user.id,
        trainer_id=request_data.trainer_id,
        session_type=request_data.session_type,
        duration_minutes=request_data.duration_minutes,
        location=request_data.location,
        special_requests=request_data.special_requests,
        preferred_start_date=request_data.preferred_start_date,
        preferred_end_date=request_data.preferred_end_date,
        preferred_times=json.dumps(request_data.preferred_times) if request_data.preferred_times else None,
        avoid_times=json.dumps(request_data.avoid_times) if request_data.avoid_times else None,
        allow_weekends=request_data.allow_weekends,
        allow_evenings=request_data.allow_evenings,
        is_recurring=request_data.is_recurring,
        recurring_pattern=request_data.recurring_pattern,
        expires_at=expires_at
    )
    
    db.add(booking_request)
    db.commit()
    db.refresh(booking_request)
    
    # Add names for response
    booking_request.client_name = current_user.full_name
    booking_request.trainer_name = trainer.user.full_name
    
    # Set the JSON fields for response
    booking_request.preferred_times = booking_request.preferred_times_list
    booking_request.avoid_times = booking_request.avoid_times_list
    
    # Send email notification to trainer
    try:
        preferred_time_str = request_data.preferred_times[0] if request_data.preferred_times else "Not specified"
        await email_service.send_booking_request_notification(
            trainer_email=trainer.user.email,
            trainer_name=trainer.user.full_name,
            client_name=current_user.full_name,
            session_type=request_data.session_type,
            preferred_date=request_data.preferred_start_date.isoformat(),
            preferred_time=preferred_time_str,
            duration_minutes=request_data.duration_minutes,
            location=request_data.location or "Not specified",
            special_requests=request_data.special_requests
        )
    except Exception as e:
        # Log the error but don't fail the request
        print(f"Failed to send email notification: {str(e)}")
    
    return booking_request

@router.get("/", response_model=List[BookingRequestResponse])
async def get_booking_requests(
    status: Optional[BookingRequestStatus] = None,
    trainer_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get booking requests with optional filtering
    """
    query = db.query(BookingRequest)
    
    # Filter by user role
    if current_user.role == "client":
        query = query.filter(BookingRequest.client_id == current_user.id)
    elif current_user.role == "trainer":
        if current_user.trainer_profile:
            query = query.filter(BookingRequest.trainer_id == current_user.trainer_profile.id)
        else:
            # If trainer role but no trainer profile, return empty results
            query = query.filter(BookingRequest.id == -1)
    # Admin can see all requests
    
    # Apply filters
    if status:
        query = query.filter(BookingRequest.status == status)
    if trainer_id:
        query = query.filter(BookingRequest.trainer_id == trainer_id)
    
    requests = query.order_by(BookingRequest.created_at.desc()).all()
    
    # Add names for response
    for req in requests:
        try:
            req.client_name = req.client.full_name if req.client else "Unknown Client"
            req.trainer_name = req.trainer.user.full_name if req.trainer and req.trainer.user else "Unknown Trainer"
            # Parse JSON fields to lists
            req.preferred_times = req.preferred_times_list
            req.avoid_times = req.avoid_times_list
        except Exception as e:
            print(f"Error adding names for request {req.id}: {e}")
            req.client_name = "Unknown Client"
            req.trainer_name = "Unknown Trainer"
            req.preferred_times = []
            req.avoid_times = []
    
    return requests

@router.get("/{request_id}", response_model=BookingRequestResponse)
async def get_booking_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific booking request
    """
    request = db.query(BookingRequest).filter(BookingRequest.id == request_id).first()
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking request not found"
        )
    
    # Check permissions
    if current_user.role == "client" and request.client_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this request"
        )
    elif current_user.role == "trainer":
        if not current_user.trainer_profile or request.trainer_id != current_user.trainer_profile.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this request"
            )
    
    # Add names for response
    request.client_name = request.client.full_name if request.client else "Unknown Client"
    request.trainer_name = request.trainer.user.full_name if request.trainer and request.trainer.user else "Unknown Trainer"
    request.preferred_times = request.preferred_times_list
    request.avoid_times = request.avoid_times_list
    
    return request

@router.put("/{request_id}/approve", response_model=BookingRequestResponse)
async def approve_booking_request(
    request_id: int,
    approval: BookingRequestApproval,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Approve or reject a booking request (trainer only)
    """
    # Get the booking request
    request = db.query(BookingRequest).filter(BookingRequest.id == request_id).first()
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking request not found"
        )
    
    # Check permissions (only the trainer can approve/reject)
    if current_user.role != "trainer" or not current_user.trainer_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only trainers can approve booking requests"
        )
    
    if request.trainer_id != current_user.trainer_profile.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to approve this request"
        )
    
    # Check if request is still pending
    if request.status != BookingRequestStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request has already been processed"
        )
    
    # Check if request has expired
    if request.expires_at and request.expires_at < datetime.utcnow():
        request.status = BookingRequestStatus.EXPIRED
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request has expired"
        )
    
    # Update request status
    request.status = approval.status
    request.notes = approval.notes
    request.rejection_reason = approval.rejection_reason
    
    if approval.status == BookingRequestStatus.APPROVED:
        # For booking requests, use the client's preferred times directly
        # Trainer can only approve/reject, not change times
        if request.preferred_start_date:
            # Use client's preferred start time
            start_time = request.preferred_start_date
            end_time = start_time + timedelta(minutes=request.duration_minutes)
            request.confirmed_date = start_time
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Client preferred times are required for approval"
            )
        
        # Calculate the price
        trainer = db.query(Trainer).filter(Trainer.id == request.trainer_id).first()
        hours = request.duration_minutes / 60
        calculated_price = trainer.price_per_hour * hours if trainer.price_per_hour > 0 else trainer.price_per_session
        
        # Create a confirmed booking using client's preferred times
        booking = Booking(
            client_id=request.client_id,
            trainer_id=request.trainer_id,
            session_type=request.session_type,
            duration_minutes=request.duration_minutes,
            location=request.location,
            special_requests=request.special_requests,
            preferred_start_date=request.preferred_start_date,
            preferred_end_date=request.preferred_end_date,
            preferred_times=request.preferred_times,
            confirmed_date=request.confirmed_date,  # Use the confirmed date (client's preferred time)
            start_time=start_time,  # Client's preferred start time
            end_time=end_time,      # Calculated end time based on client's preferred start
            total_cost=calculated_price,
            price_per_hour=trainer.price_per_hour,
            training_type=request.training_type or request.session_type,
            location_type=request.location_type,
            status=BookingStatus.CONFIRMED,
            is_recurring=request.is_recurring,
            recurring_pattern=request.recurring_pattern
        )
        
        # Also update the booking request with the calculated price
        request.total_cost = calculated_price
        
        db.add(booking)
        db.commit()
        db.refresh(booking)
        
        print(f"DEBUG: Created booking with ID {booking.id} for trainer {request.trainer_id}")  # Debug log
        
        # Create corresponding Session using client's preferred times
        from app.models import Session as SessionModel, SessionStatus
        session = SessionModel(
            client_id=request.client_id,
            trainer_id=request.trainer_id,
            booking_id=booking.id,
            title=f"{request.session_type} Session",
            session_type=request.session_type,
            scheduled_date=start_time,  # Use client's preferred start time
            duration_minutes=request.duration_minutes,
            location=request.location,
            notes=request.special_requests,
            status=SessionStatus.CONFIRMED
        )
        
        db.add(session)
        db.commit()
        
        # Mark corresponding time slot as booked if it exists
        if start_time:
            # Find time slots that overlap with this booking (using client's preferred times)
            time_slots = db.query(TimeSlot).filter(
                TimeSlot.trainer_id == request.trainer_id,
                TimeSlot.start_time >= start_time,
                TimeSlot.start_time < end_time,
                TimeSlot.is_available == True,
                TimeSlot.is_booked == False
            ).all()
            
            for time_slot in time_slots:
                time_slot.is_booked = True
                time_slot.booking_id = booking.id
            
            if time_slots:
                db.commit()
    
    db.commit()
    db.refresh(request)
    
    # Add names for response
    request.client_name = request.client.full_name if request.client else "Unknown Client"
    request.trainer_name = request.trainer.user.full_name if request.trainer and request.trainer.user else "Unknown Trainer"
    request.preferred_times = request.preferred_times_list
    request.avoid_times = request.avoid_times_list
    
    # Send email notification to client if approved
    if approval.status == BookingRequestStatus.APPROVED:
        try:
            # Use client's preferred time for confirmation email
            confirmed_time_str = request.confirmed_date.strftime("%H:%M") if request.confirmed_date else "Not specified"
            await email_service.send_booking_confirmation(
                client_email=request.client.email,
                client_name=request.client.full_name,
                trainer_name=request.trainer.user.full_name,
                session_type=request.session_type,
                confirmed_date=request.confirmed_date.isoformat(),
                confirmed_time=confirmed_time_str,
                duration_minutes=request.duration_minutes,
                location=request.location or "Not specified"
            )
        except Exception as e:
            # Log the error but don't fail the request
            print(f"Failed to send confirmation email: {str(e)}")
    
    return request

@router.put("/{request_id}", response_model=BookingRequestResponse)
async def update_booking_request(
    request_id: int,
    update_data: BookingRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a booking request (client only, and only if pending)
    """
    request = db.query(BookingRequest).filter(BookingRequest.id == request_id).first()
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking request not found"
        )
    
    # Check permissions (only the client can update their own request)
    if current_user.role != "client" or request.client_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this request"
        )
    
    # Check if request is still pending
    if request.status != BookingRequestStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update a request that has been processed"
        )
    
    # Update fields
    update_dict = update_data.dict(exclude_unset=True)
    for field, value in update_dict.items():
        if field in ['preferred_times', 'avoid_times']:
            # Handle JSON fields
            setattr(request, f"{field}_list", value)
        else:
            setattr(request, field, value)
    
    db.commit()
    db.refresh(request)
    
    # Add names for response
    request.client_name = request.client.full_name if request.client else "Unknown Client"
    request.trainer_name = request.trainer.user.full_name if request.trainer and request.trainer.user else "Unknown Trainer"
    request.preferred_times = request.preferred_times_list
    request.avoid_times = request.avoid_times_list
    
    return request

@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_booking_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cancel a booking request (client only, and only if pending)
    """
    request = db.query(BookingRequest).filter(BookingRequest.id == request_id).first()
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking request not found"
        )
    
    # Check permissions (only the client can cancel their own request)
    if current_user.role != "client" or request.client_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to cancel this request"
        )
    
    # Check if request is still pending
    if request.status != BookingRequestStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel a request that has been processed"
        )
    
    # Mark as rejected (cancelled by client)
    request.status = BookingRequestStatus.REJECTED
    request.rejection_reason = "Cancelled by client"
    
    db.commit()
    return {"message": "Booking request cancelled successfully"}


@router.get("/{request_id}/scored-slots")
async def get_scored_time_slots(
    request_id: int,
    max_results: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get time slots ranked by W_C (Client Preference Match) score
    
    This endpoint uses the robust scoring algorithm to find the best
    time slots that match the client's preferences.
    
    Returns:
        List of scored slots with:
        - total_score: W_C score (integer)
        - breakdown: Component scores (date_match, time_of_day_match, etc.)
        - slot_id: ID of the time slot
        - slot_start: ISO timestamp of slot start
        - requires_manual_review: Boolean flag if score is too low
    """
    # Get booking request
    request = db.query(BookingRequest).filter(BookingRequest.id == request_id).first()
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking request not found"
        )
    
    # Check permissions (trainer or client can view)
    if current_user.role == "client" and request.client_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this request"
        )
    elif current_user.role == "trainer":
        if not current_user.trainer_profile or request.trainer_id != current_user.trainer_profile.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this request"
            )
    
    # Use BookingService to find best slots with scoring
    booking_service = BookingService(db)
    scored_slots = booking_service.find_best_slots_with_scoring(
        booking_request=request,
        trainer_id=request.trainer_id,
        max_results=max_results
    )
    
    if not scored_slots:
        return {
            "request_id": request_id,
            "scored_slots": [],
            "message": "No available time slots found for the given preferences"
        }
    
    return {
        "request_id": request_id,
        "scored_slots": scored_slots,
        "message": f"Found {len(scored_slots)} time slots ranked by preference match",
        "scoring_info": {
            "max_date_score": 50,
            "max_time_score": 40,
            "max_bonus": 10,
            "avoid_penalty": -50,
            "best_score": scored_slots[0]['total_score'] if scored_slots else None
        }
    }
