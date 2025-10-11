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
    
    # TODO: Implement the actual booking confirmation logic
    # This would involve:
    # 1. Validating that the booking requests still exist and are PENDING
    # 2. Checking that the time slots are still available
    # 3. Creating Booking records from BookingRequest records
    # 4. Marking TimeSlots as booked
    # 5. Updating BookingRequest status to APPROVED
    
    return {
        "message": "Apply optimal schedule endpoint - implementation pending",
        "trainer_id": trainer_id,
        "applied_entries": entry_ids,
        "note": "This feature will be implemented in the next phase"
    }

