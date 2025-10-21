"""
Sessions router for FitConnect API
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_
from datetime import datetime, timedelta
from app.database import get_db
from app.models import Session, Booking, User, Trainer, SessionStatus
from app.schemas.session import (
    SessionCreate, 
    SessionUpdate, 
    SessionResponse,
    BookingCreate,
    BookingResponse
)
from app.utils.auth import get_current_active_user
from app.models import UserRole

router = APIRouter()

@router.post("/", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    session_data: SessionCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new training session (for trainers and admins)"""
    if current_user.role not in [UserRole.TRAINER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only trainers and admins can create sessions"
        )
    
    # Verify trainer exists
    trainer = db.query(Trainer).filter(Trainer.id == session_data.trainer_id).first()
    if not trainer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainer not found"
        )
    
    # Create session
    db_session = Session(
        client_id=current_user.id,
        trainer_id=session_data.trainer_id,
        title=session_data.title,
        description=session_data.description,
        session_type=session_data.session_type,
        scheduled_date=session_data.scheduled_date,
        duration_minutes=session_data.duration_minutes,
        location=session_data.location,
        status=SessionStatus.PENDING
    )
    
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    
    # Get related information
    client = db.query(User).filter(User.id == db_session.client_id).first()
    trainer_user = db.query(User).filter(User.id == trainer.user_id).first()
    
    return SessionResponse(
        id=db_session.id,
        client_id=db_session.client_id,
        trainer_id=db_session.trainer_id,
        title=db_session.title,
        description=db_session.description,
        session_type=db_session.session_type,
        scheduled_date=db_session.scheduled_date,
        duration_minutes=db_session.duration_minutes,
        location=db_session.location,
        status=db_session.status,
        notes=db_session.notes,
        created_at=db_session.created_at,
        client_name=client.full_name,
        trainer_name=trainer_user.full_name,
        trainer_avatar=trainer_user.avatar
    )

@router.get("/", response_model=List[SessionResponse])
async def get_sessions(
    status: Optional[SessionStatus] = Query(None),
    trainer_id: Optional[int] = Query(None),
    client_id: Optional[int] = Query(None),
    upcoming_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get sessions with optional filters"""
    
    # Build query
    query = db.query(Session)
    
    # Apply filters based on user role
    if current_user.role == UserRole.CLIENT:
        query = query.filter(Session.client_id == current_user.id)
    elif current_user.role == UserRole.TRAINER:
        trainer = db.query(Trainer).filter(Trainer.user_id == current_user.id).first()
        if trainer:
            query = query.filter(Session.trainer_id == trainer.id)
    elif current_user.role == UserRole.ADMIN:
        # Admins can see all sessions
        pass
    
    # Apply additional filters
    if status:
        query = query.filter(Session.status == status)
    
    if trainer_id:
        query = query.filter(Session.trainer_id == trainer_id)
    
    if client_id:
        query = query.filter(Session.client_id == client_id)
    
    if upcoming_only:
        query = query.filter(Session.scheduled_date >= datetime.utcnow())
    
    # Order by scheduled date
    sessions = query.order_by(Session.scheduled_date.desc()).all()
    
    # Optimized query with joins to avoid N+1 problem
    sessions_with_relations = db.query(Session)\
        .options(
            joinedload(Session.client),
            joinedload(Session.trainer).joinedload(Trainer.user)
        )\
        .filter(Session.id.in_([s.id for s in sessions]))\
        .all()
    
    # Format response
    session_responses = []
    for session in sessions_with_relations:
        session_responses.append(SessionResponse(
            id=session.id,
            client_id=session.client_id,
            trainer_id=session.trainer_id,
            title=session.title,
            description=session.description,
            session_type=session.session_type,
            scheduled_date=session.scheduled_date,
            duration_minutes=session.duration_minutes,
            location=session.location,
            status=session.status,
            notes=session.notes,
            created_at=session.created_at,
            client_name=session.client.full_name,
            trainer_name=session.trainer.user.full_name,
            trainer_avatar=session.trainer.user.avatar
        ))
    
    return session_responses

@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific session by ID"""
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Check permissions
    if current_user.role == UserRole.CLIENT and session.client_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this session"
        )
    elif current_user.role == UserRole.TRAINER:
        trainer = db.query(Trainer).filter(Trainer.user_id == current_user.id).first()
        if not trainer or session.trainer_id != trainer.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this session"
            )
    
    # Get related information
    client = db.query(User).filter(User.id == session.client_id).first()
    trainer = db.query(Trainer).filter(Trainer.id == session.trainer_id).first()
    trainer_user = db.query(User).filter(User.id == trainer.user_id).first()
    
    return SessionResponse(
        id=session.id,
        client_id=session.client_id,
        trainer_id=session.trainer_id,
        title=session.title,
        description=session.description,
        session_type=session.session_type,
        scheduled_date=session.scheduled_date,
        duration_minutes=session.duration_minutes,
        location=session.location,
        status=session.status,
        notes=session.notes,
        created_at=session.created_at,
        client_name=client.full_name,
        trainer_name=trainer_user.full_name,
        trainer_avatar=trainer_user.avatar
    )

@router.put("/{session_id}", response_model=SessionResponse)
async def update_session(
    session_id: int,
    session_update: SessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a session (trainers and admins can update status, clients can update some fields)"""
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Check permissions
    if current_user.role == UserRole.CLIENT and session.client_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this session"
        )
    elif current_user.role == UserRole.TRAINER:
        trainer = db.query(Trainer).filter(Trainer.user_id == current_user.id).first()
        if not trainer or session.trainer_id != trainer.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this session"
            )
    
    # Update fields
    update_data = session_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(session, field, value)
    
    db.commit()
    db.refresh(session)
    
    # Get related information
    client = db.query(User).filter(User.id == session.client_id).first()
    trainer = db.query(Trainer).filter(Trainer.id == session.trainer_id).first()
    trainer_user = db.query(User).filter(User.id == trainer.user_id).first()
    
    return SessionResponse(
        id=session.id,
        client_id=session.client_id,
        trainer_id=session.trainer_id,
        title=session.title,
        description=session.description,
        session_type=session.session_type,
        scheduled_date=session.scheduled_date,
        duration_minutes=session.duration_minutes,
        location=session.location,
        status=session.status,
        notes=session.notes,
        created_at=session.created_at,
        client_name=client.full_name,
        trainer_name=trainer_user.full_name,
        trainer_avatar=trainer_user.avatar
    )

@router.post("/{session_id}/complete", status_code=status.HTTP_200_OK)
async def complete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Complete a session (Trainers only)"""
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Check permissions - only trainer can mark session as complete
    if current_user.role != UserRole.TRAINER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only trainers can complete sessions"
        )
    
    trainer = db.query(Trainer).filter(Trainer.user_id == current_user.id).first()
    if not trainer or session.trainer_id != trainer.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to complete this session"
        )
    
    # Check if session is confirmed
    if session.status != SessionStatus.CONFIRMED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Can only complete confirmed sessions. Current status: {session.status.value}"
        )
    
    # Mark session as completed
    session.status = SessionStatus.COMPLETED
    session.actual_end_time = datetime.utcnow()
    
    if not session.actual_start_time:
        session.actual_start_time = datetime.utcnow() - timedelta(minutes=session.duration_minutes)
    
    db.commit()
    db.refresh(session)
    
    return {
        "message": "Session marked as completed successfully",
        "session_id": session.id,
        "status": session.status.value
    }

@router.post("/{session_id}/cancel", status_code=status.HTTP_200_OK)
async def cancel_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Cancel a session (Clients or Trainers)"""
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Check permissions
    if current_user.role == UserRole.CLIENT:
        if session.client_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to cancel this session"
            )
    elif current_user.role == UserRole.TRAINER:
        trainer = db.query(Trainer).filter(Trainer.user_id == current_user.id).first()
        if not trainer or session.trainer_id != trainer.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to cancel this session"
            )
    elif current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to cancel this session"
        )
    
    # Check if session can be cancelled
    if session.status == SessionStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel a completed session"
        )
    
    if session.status == SessionStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session is already cancelled"
        )
    
    # Mark session as cancelled
    session.status = SessionStatus.CANCELLED
    
    db.commit()
    db.refresh(session)
    
    return {
        "message": "Session cancelled successfully",
        "session_id": session.id,
        "status": session.status.value
    }

@router.post("/bookings", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(
    booking_data: BookingCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a booking request (for clients)"""
    print("DEBUG: /api/sessions/bookings endpoint called!")
    print(f"DEBUG: booking_data = {booking_data}")
    
    if current_user.role != UserRole.CLIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only clients can create booking requests"
        )
    
    # Verify trainer exists
    trainer = db.query(Trainer).filter(Trainer.id == booking_data.trainer_id).first()
    if not trainer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainer not found"
        )
    
    # Create booking
    db_booking = Booking(
        client_id=current_user.id,
        trainer_id=booking_data.trainer_id,
        preferred_dates=booking_data.preferred_dates,
        session_type=booking_data.session_type,
        duration_minutes=booking_data.duration_minutes,
        location=booking_data.location,
        special_requests=booking_data.special_requests,
        status="pending"
    )
    
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    
    # Get related information
    client = db.query(User).filter(User.id == db_booking.client_id).first()
    trainer_user = db.query(User).filter(User.id == trainer.user_id).first()
    
    return BookingResponse(
        id=db_booking.id,
        client_id=db_booking.client_id,
        trainer_id=db_booking.trainer_id,
        preferred_dates=db_booking.preferred_dates,
        session_type=db_booking.session_type,
        duration_minutes=db_booking.duration_minutes,
        location=db_booking.location,
        special_requests=db_booking.special_requests,
        status=db_booking.status,
        created_at=db_booking.created_at,
        client_name=client.full_name,
        trainer_name=trainer_user.full_name
    )
