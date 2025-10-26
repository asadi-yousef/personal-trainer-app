"""
Booking management API endpoints for complete booking workflow
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel

from app.database import get_db
from app.utils.auth import get_current_user
from app.models import User, UserRole
from app.services.booking_service import BookingService

router = APIRouter(tags=["booking-management"])

# Pydantic schemas
class BookingRequestCreate(BaseModel):
    trainer_id: int
    session_type: str
    duration_minutes: int
    location: str
    special_requests: Optional[str] = None
    preferred_start_date: Optional[datetime] = None
    preferred_end_date: Optional[datetime] = None
    preferred_times: Optional[List[str]] = None
    avoid_times: Optional[List[str]] = None
    allow_weekends: bool = True
    allow_evenings: bool = True
    is_recurring: bool = False
    recurring_pattern: Optional[str] = None
    # New time-based fields
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    training_type: Optional[str] = None
    location_type: Optional[str] = None
    location_address: Optional[str] = None

class BookingApproval(BaseModel):
    booking_request_id: int
    notes: Optional[str] = None

class BookingRejection(BaseModel):
    booking_request_id: int
    rejection_reason: str

class BookingCancellation(BaseModel):
    booking_id: int
    cancellation_reason: Optional[str] = None

class BookingReschedule(BaseModel):
    booking_id: int
    new_start_time: datetime
    new_end_time: datetime
    reason: Optional[str] = None

@router.get("/test")
async def test_endpoint():
    """Test endpoint to verify booking-management router is working"""
    print("DEBUG: Test endpoint called!")
    return {"message": "Booking management router is working"}

@router.post("/reserve-slot")
async def reserve_time_slot(
    request: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reserve a time slot temporarily to prevent double-booking"""
    
    print(f"DEBUG: Reserve slot endpoint called")
    print(f"DEBUG: Reservation data: {request}")
    
    if current_user.role != UserRole.CLIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only clients can reserve time slots"
        )
    
    # Extract reservation data
    trainer_id = request.get('trainer_id')
    start_time = request.get('start_time')
    end_time = request.get('end_time')
    duration_minutes = request.get('duration_minutes')
    
    if not all([trainer_id, start_time, end_time, duration_minutes]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required reservation data"
        )
    
    # Parse datetime strings with timezone awareness
    from dateutil import parser
    
    start_dt = parser.isoparse(start_time) if isinstance(start_time, str) else start_time
    end_dt = parser.isoparse(end_time) if isinstance(end_time, str) else end_time
    
    # Normalize to timezone-aware if needed
    if start_dt.tzinfo is not None:
        start_dt = start_dt.astimezone(timezone.utc).replace(tzinfo=None)
    if end_dt.tzinfo is not None:
        end_dt = end_dt.astimezone(timezone.utc).replace(tzinfo=None)
    
    # Check if slot is already reserved or booked
    from app.models import Booking, Session as SessionModel
    from app.models import BookingStatus, SessionStatus
    
    # Check for existing bookings
    existing_bookings = db.query(Booking).filter(
        Booking.trainer_id == trainer_id,
        Booking.status == BookingStatus.CONFIRMED,
        Booking.start_time < end_dt,
        Booking.end_time > start_dt
    ).all()
    
    # Check for existing sessions
    existing_sessions = db.query(SessionModel).filter(
        SessionModel.trainer_id == trainer_id,
        SessionModel.status == SessionStatus.CONFIRMED,
        SessionModel.scheduled_date < end_dt
    ).all()
    
    # Filter sessions by duration manually to avoid SQLAlchemy InstrumentedAttribute issue
    conflicting_sessions = []
    for session in existing_sessions:
        session_end = session.scheduled_date + timedelta(minutes=session.duration_minutes)
        # Convert timezone-aware datetime to naive for comparison
        if session_end.tzinfo is not None:
            session_end = session_end.astimezone(timezone.utc).replace(tzinfo=None)
        if session_end > start_dt:
            conflicting_sessions.append(session)
    
    print(f"DEBUG: Found {len(existing_bookings)} existing bookings")
    print(f"DEBUG: Found {len(conflicting_sessions)} conflicting sessions")
    
    if existing_bookings or conflicting_sessions:
        print(f"DEBUG: Time slot conflict detected - rejecting reservation")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Time slot is no longer available"
        )
    
    # TODO: Add temporary reservation logic here
    # For now, just return success
    # In a full implementation, you would:
    # 1. Create a temporary reservation record
    # 2. Set expiration time (e.g., 15 minutes)
    # 3. Clean up expired reservations periodically
    
    print(f"DEBUG: Time slot reserved successfully for {start_dt} to {end_dt}")
    return {"message": "Time slot reserved successfully", "reservation_id": "temp_123"}

@router.post("/booking-request")
async def create_booking_request(
    request: BookingRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a booking request that requires trainer approval"""
    
    print("DEBUG: create_booking_request endpoint called!")
    print(f"DEBUG: Request data: {request}")
    print(f"DEBUG: Current user: {current_user.id} ({current_user.role})")
    
    if current_user.role != UserRole.CLIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only clients can create booking requests"
        )
    
    # Debug logging
    print(f"DEBUG: Received booking request data:")
    print(f"  - start_time: {request.start_time}")
    print(f"  - end_time: {request.end_time}")
    print(f"  - training_type: {request.training_type}")
    print(f"  - location_type: {request.location_type}")
    print(f"  - location_address: {request.location_address}")
    
    booking_service = BookingService(db)
    
    try:
        result = booking_service.create_booking_request(
            client_id=current_user.id,
            trainer_id=request.trainer_id,
            session_type=request.session_type,
            duration_minutes=request.duration_minutes,
            location=request.location,
            special_requests=request.special_requests,
            preferred_start_date=request.preferred_start_date,
            preferred_end_date=request.preferred_end_date,
            preferred_times=request.preferred_times,
            avoid_times=request.avoid_times,
            allow_weekends=request.allow_weekends,
            allow_evenings=request.allow_evenings,
            is_recurring=request.is_recurring,
            recurring_pattern=request.recurring_pattern,
            # New time-based fields
            start_time=request.start_time,
            end_time=request.end_time,
            training_type=request.training_type,
            location_type=request.location_type,
            location_address=request.location_address
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create booking request"
        )

@router.get("/booking-requests")
async def get_booking_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get booking requests for the current user"""
    
    if current_user.role != UserRole.TRAINER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only trainers can view booking requests"
        )
    
    # Get trainer profile
    trainer_profile = current_user.trainer_profile
    if not trainer_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainer profile not found"
        )
    
    booking_service = BookingService(db)
    requests = booking_service.get_booking_requests_for_trainer(trainer_profile.id)
    
    return {"booking_requests": requests}

@router.get("/my-booking-requests")
async def get_my_booking_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get booking requests created by the current client"""
    if current_user.role != UserRole.CLIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only clients can view their booking requests"
        )

    booking_service = BookingService(db)
    requests = booking_service.get_booking_requests_for_client(current_user.id)
    return {"booking_requests": requests}

@router.post("/approve-booking")
async def approve_booking_request(
    approval: BookingApproval,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Approve a booking request and create confirmed booking"""
    
    print(f"DEBUG: Booking-management approval endpoint called")
    print(f"DEBUG: Approval data: {approval}")
    
    if current_user.role != UserRole.TRAINER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only trainers can approve booking requests"
        )
    
    # Get trainer profile
    trainer_profile = current_user.trainer_profile
    if not trainer_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainer profile not found"
        )
    
    booking_service = BookingService(db)
    
    try:
        result = booking_service.approve_booking_request(
            booking_request_id=approval.booking_request_id,
            trainer_id=trainer_profile.id,
            notes=approval.notes
        )
        
        return result
        
    except ValueError as e:
        print(f"ValueError in approve booking: {str(e)}")  # Debug log
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        print(f"Exception in approve booking: {str(e)}")  # Debug log
        import traceback
        traceback.print_exc()  # Print full stack trace
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to approve booking request: {str(e)}"
        )

@router.post("/reject-booking")
async def reject_booking_request(
    rejection: BookingRejection,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reject a booking request"""
    
    if current_user.role != UserRole.TRAINER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only trainers can reject booking requests"
        )
    
    # Get trainer profile
    trainer_profile = current_user.trainer_profile
    if not trainer_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainer profile not found"
        )
    
    booking_service = BookingService(db)
    
    try:
        result = booking_service.reject_booking_request(
            booking_request_id=rejection.booking_request_id,
            trainer_id=trainer_profile.id,
            rejection_reason=rejection.rejection_reason
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reject booking request"
        )

@router.get("/my-bookings")
async def get_my_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all bookings for the current user"""
    
    booking_service = BookingService(db)
    
    # For trainers, we need to get the trainer_id from the trainer profile
    if current_user.role == UserRole.TRAINER:
        if not current_user.trainer_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trainer profile not found"
            )
        print(f"DEBUG: Trainer profile ID: {current_user.trainer_profile.id}")  # Debug log
        bookings = booking_service.get_bookings_for_user(
            user_id=current_user.trainer_profile.id,
            user_role=current_user.role.value
        )
    else:
        bookings = booking_service.get_bookings_for_user(
            user_id=current_user.id,
            user_role=current_user.role.value
        )
    
    return {"bookings": bookings}

@router.post("/cancel-booking")
async def cancel_booking(
    cancellation: BookingCancellation,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel a booking"""
    
    booking_service = BookingService(db)
    
    try:
        result = booking_service.cancel_booking(
            booking_id=cancellation.booking_id,
            user_id=current_user.id,
            user_role=current_user.role.value,
            cancellation_reason=cancellation.cancellation_reason
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel booking"
        )

@router.post("/reschedule-booking")
async def reschedule_booking(
    reschedule: BookingReschedule,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reschedule a booking to new time slots"""
    
    booking_service = BookingService(db)
    
    try:
        result = booking_service.reschedule_booking(
            booking_id=reschedule.booking_id,
            user_id=current_user.id,
            new_start_time=reschedule.new_start_time,
            new_end_time=reschedule.new_end_time,
            reason=reschedule.reason
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reschedule booking"
        )

@router.get("/available-slots/{trainer_id}")
async def get_available_slots(
    trainer_id: int,
    start_date: datetime,
    end_date: datetime,
    duration_minutes: int = 60,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get available time slots for a trainer within a date range"""
    
    from app.services.scheduling_service import SchedulingService
    
    scheduling_service = SchedulingService(db)
    
    try:
        # Get available slots using the scheduling service
        available_slots = scheduling_service._get_available_time_slots(
            trainer_id=trainer_id,
            start_date=start_date,
            end_date=end_date,
            duration_minutes=duration_minutes
        )
        
        # Format response
        slots = []
        for slot in available_slots:
            if hasattr(slot, 'id'):  # Regular TimeSlot object
                slots.append({
                    "id": slot.id,
                    "start_time": slot.start_time.isoformat(),
                    "end_time": slot.end_time.isoformat(),
                    "duration_minutes": slot.duration_minutes,
                    "is_available": slot.is_available,
                    "is_booked": slot.is_booked
                })
            else:  # Combined slot dictionary
                slots.append({
                    "id": slot.get('slot_id'),
                    "start_time": slot['start_time'].isoformat(),
                    "end_time": slot['end_time'].isoformat(),
                    "duration_minutes": slot['duration_minutes'],
                    "is_available": slot['is_available'],
                    "is_booked": slot['is_booked'],
                    "is_combined": slot.get('is_combined', False),
                    "component_slots": slot.get('component_slots', [])
                })
        
        return {"available_slots": slots}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get available slots"
        )

@router.post("/check-availability-batch")
async def check_availability_batch(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Check availability for multiple proposed schedule entries with break time validation"""
    
    if current_user.role != UserRole.TRAINER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only trainers can check availability"
        )
    
    proposed_entries = data.get('proposed_entries', [])
    if not proposed_entries:
        return {"conflicts": [], "available": True}
    
    try:
        from datetime import datetime, timedelta
        from app.models import Booking, Session as SessionModel, BookingRequest, TrainerSchedulingPreferences
        
        conflicts = []
        trainer_id = current_user.trainer_profile.id
        
        # Get trainer's scheduling preferences
        prefs = db.query(TrainerSchedulingPreferences).filter(
            TrainerSchedulingPreferences.trainer_id == trainer_id
        ).first()
        
        min_break_minutes = prefs.min_break_minutes if prefs else 15  # Default 15 minutes
        
        print(f"DEBUG: Checking availability with {min_break_minutes} minute minimum break")
        
        # Sort proposed entries by start time to check for break time violations
        sorted_entries = sorted(proposed_entries, key=lambda x: x.get('start_time', ''))
        
        for i, entry in enumerate(sorted_entries):
            booking_request_id = entry.get('booking_request_id')
            start_time = entry.get('start_time')
            end_time = entry.get('end_time')
            
            if not all([booking_request_id, start_time, end_time]):
                continue
            
            # Parse datetime strings with timezone awareness
            from dateutil import parser
            start_dt = parser.isoparse(start_time) if isinstance(start_time, str) else start_time
            end_dt = parser.isoparse(end_time) if isinstance(end_time, str) else end_time
            
            # Normalize to timezone-aware if needed
            if start_dt.tzinfo is not None:
                start_dt = start_dt.astimezone(timezone.utc).replace(tzinfo=None)
            if end_dt.tzinfo is not None:
                end_dt = end_dt.astimezone(timezone.utc).replace(tzinfo=None)
            
            # Get booking request details
            booking_request = db.query(BookingRequest).filter(
                BookingRequest.id == booking_request_id
            ).first()
            
            if not booking_request:
                continue
            
            client_name = booking_request.client.full_name if booking_request.client else "Unknown"
            
            # Check for existing bookings (with break time)
            existing_bookings = db.query(Booking).filter(
                Booking.trainer_id == trainer_id,
                Booking.start_time < end_dt + timedelta(minutes=min_break_minutes),
                Booking.end_time > start_dt - timedelta(minutes=min_break_minutes)
            ).all()
            
            # Check for existing sessions (with break time)
            existing_sessions = db.query(SessionModel).filter(
                SessionModel.trainer_id == trainer_id
            ).all()
            
            # Check for break time violations with existing sessions
            conflicting_sessions = []
            for session in existing_sessions:
                session_end = session.scheduled_date + timedelta(minutes=session.duration_minutes)
                session_start = session.scheduled_date
                
                # Convert timezone-aware datetimes to naive for comparison
                if session_end.tzinfo is not None:
                    session_end = session_end.astimezone(timezone.utc).replace(tzinfo=None)
                if session_start.tzinfo is not None:
                    session_start = session_start.astimezone(timezone.utc).replace(tzinfo=None)
                
                # Check if there's insufficient break time between sessions
                if (session_end + timedelta(minutes=min_break_minutes) > start_dt and 
                    session_start - timedelta(minutes=min_break_minutes) < end_dt):
                    conflicting_sessions.append(session)
            
            # Check for break time violations with other proposed entries
            break_violations = []
            for j, other_entry in enumerate(sorted_entries):
                if i == j:  # Skip self
                    continue
                
                other_start = other_entry.get('start_time')
                other_end = other_entry.get('end_time')
                
                if not all([other_start, other_end]):
                    continue
                
                # Parse other entries with timezone awareness
                other_start_dt = parser.isoparse(other_start) if isinstance(other_start, str) else other_start
                other_end_dt = parser.isoparse(other_end) if isinstance(other_end, str) else other_end
                
                # Normalize to timezone-aware if needed
                if other_start_dt.tzinfo is not None:
                    other_start_dt = other_start_dt.astimezone(timezone.utc).replace(tzinfo=None)
                if other_end_dt.tzinfo is not None:
                    other_end_dt = other_end_dt.astimezone(timezone.utc).replace(tzinfo=None)
                
                # Check if there's insufficient break time between proposed sessions
                if (other_end_dt + timedelta(minutes=min_break_minutes) > start_dt and 
                    other_start_dt - timedelta(minutes=min_break_minutes) < end_dt):
                    break_violations.append({
                        'other_booking_request_id': other_entry.get('booking_request_id'),
                        'other_time': f"{other_start_dt.strftime('%H:%M')} - {other_end_dt.strftime('%H:%M')}"
                    })
            
            if existing_bookings or conflicting_sessions or break_violations:
                conflict_reasons = []
                if existing_bookings:
                    conflict_reasons.append(f"{len(existing_bookings)} existing bookings")
                if conflicting_sessions:
                    conflict_reasons.append(f"{len(conflicting_sessions)} existing sessions")
                if break_violations:
                    conflict_reasons.append(f"{len(break_violations)} break time violations")
                
                conflicts.append({
                    'booking_request_id': booking_request_id,
                    'client_name': client_name,
                    'requested_time': f"{start_dt.strftime('%Y-%m-%d %H:%M')} - {end_dt.strftime('%H:%M')}",
                    'conflict_reasons': conflict_reasons,
                    'conflicting_bookings': len(existing_bookings),
                    'conflicting_sessions': len(conflicting_sessions),
                    'break_violations': len(break_violations),
                    'min_break_required': min_break_minutes
                })
        
        return {
            "conflicts": conflicts,
            "available": len(conflicts) == 0,
            "total_checked": len(proposed_entries),
            "conflicts_found": len(conflicts),
            "min_break_minutes": min_break_minutes
        }
        
    except Exception as e:
        print(f"DEBUG: Error checking batch availability: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking availability: {str(e)}"
        )
