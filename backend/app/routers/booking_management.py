"""
Booking management API endpoints for complete booking workflow
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
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

@router.post("/booking-request")
async def create_booking_request(
    request: BookingRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a booking request that requires trainer approval"""
    
    if current_user.role != UserRole.CLIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only clients can create booking requests"
        )
    
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
            recurring_pattern=request.recurring_pattern
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
