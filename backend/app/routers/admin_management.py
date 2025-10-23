"""
Admin management router for platform administration
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime, timedelta

from app.database import get_db
from app.models import User, Trainer, Booking, Payment, AdminUser, AdminLevel, ProfileCompletionStatus
from app.routers.admin_auth import get_current_admin
from app.schemas.admin import AdminResponse

router = APIRouter(prefix="/api/admin", tags=["admin-management"])


@router.get("/dashboard/stats")
async def get_dashboard_stats(
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics"""
    # User statistics
    total_users = db.query(User).count()
    total_trainers = db.query(Trainer).count()
    total_clients = total_users - total_trainers
    
    # Booking statistics
    total_bookings = db.query(Booking).count()
    completed_bookings = db.query(Booking).filter(Booking.status == "completed").count()
    pending_bookings = db.query(Booking).filter(Booking.status == "pending").count()
    
    # Revenue statistics
    total_revenue = db.query(func.sum(Payment.amount)).filter(Payment.status == "completed").scalar() or 0
    
    # Recent activity (last 7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    new_users_week = db.query(User).filter(User.created_at >= week_ago).count()
    new_bookings_week = db.query(Booking).filter(Booking.created_at >= week_ago).count()
    
    return {
        "users": {
            "total": total_users,
            "trainers": total_trainers,
            "clients": total_clients,
            "new_this_week": new_users_week
        },
        "bookings": {
            "total": total_bookings,
            "completed": completed_bookings,
            "pending": pending_bookings,
            "new_this_week": new_bookings_week
        },
        "revenue": {
            "total": float(total_revenue),
            "currency": "USD"
        }
    }


@router.get("/users")
async def get_all_users(
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    role: Optional[str] = None,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all users with pagination and filtering"""
    query = db.query(User)
    
    # Apply filters
    if search:
        query = query.filter(
            (User.full_name.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%"))
        )
    
    if role:
        query = query.filter(User.role == role)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * limit
    users = query.offset(offset).limit(limit).all()
    
    # Format response
    user_list = []
    for user in users:
        # Split full_name into first and last name
        name_parts = user.full_name.split(' ', 1)
        first_name = name_parts[0] if name_parts else ''
        last_name = name_parts[1] if len(name_parts) > 1 else ''
        
        user_data = {
            "id": user.id,
            "first_name": first_name,
            "last_name": last_name,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "last_login": None  # User model doesn't have last_login field
        }
        
        # Add trainer-specific info if applicable
        if user.role == "trainer":
            trainer = db.query(Trainer).filter(Trainer.user_id == user.id).first()
            if trainer:
                user_data.update({
                    "trainer_id": trainer.id,
                    "profile_complete": trainer.profile_completion_status == ProfileCompletionStatus.COMPLETE,
                    "price_per_hour": trainer.price_per_hour,
                    "training_types": trainer.training_types_list
                })
        
        user_list.append(user_data)
    
    return {
        "users": user_list,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }


@router.get("/trainers")
async def get_all_trainers(
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all trainers with pagination and filtering"""
    query = db.query(Trainer).join(User)
    
    # Apply filters
    if search:
        query = query.filter(
            (User.full_name.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%"))
        )
    
    if status_filter:
        if status_filter == "complete":
            query = query.filter(Trainer.profile_completion_status == ProfileCompletionStatus.COMPLETE)
        elif status_filter == "incomplete":
            query = query.filter(Trainer.profile_completion_status == ProfileCompletionStatus.INCOMPLETE)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * limit
    trainers = query.offset(offset).limit(limit).all()
    
    # Format response
    trainer_list = []
    for trainer in trainers:
        user = trainer.user
        trainer_data = {
            "id": trainer.id,
            "user_id": trainer.user_id,
            "name": user.full_name,
            "email": user.email,
            "profile_complete": trainer.profile_completion_status == ProfileCompletionStatus.COMPLETE,
            "price_per_hour": trainer.price_per_hour,
            "training_types": trainer.training_types_list,
            "gym_name": trainer.gym_name,
            "location_preference": trainer.location_preference,
            "created_at": trainer.created_at,
            "profile_completion_date": trainer.profile_completion_date
        }
        trainer_list.append(trainer_data)
    
    return {
        "trainers": trainer_list,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }


@router.get("/bookings")
async def get_all_bookings(
    page: int = 1,
    limit: int = 20,
    status_filter: Optional[str] = None,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all bookings with pagination and filtering"""
    query = db.query(Booking)
    
    # Apply filters
    if status_filter:
        query = query.filter(Booking.status == status_filter)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * limit
    bookings = query.offset(offset).limit(limit).all()
    
    # Format response
    booking_list = []
    for booking in bookings:
        booking_data = {
            "id": booking.id,
            "client_name": booking.client.full_name,
            "trainer_name": booking.trainer.user.full_name,
            "session_type": booking.session_type,
            "duration_minutes": booking.duration_minutes,
            "start_time": booking.start_time,
            "end_time": booking.end_time,
            "status": booking.status,
            "total_cost": booking.total_cost,
            "created_at": booking.created_at
        }
        booking_list.append(booking_data)
    
    return {
        "bookings": booking_list,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }


@router.post("/users/{user_id}/toggle-status")
async def toggle_user_status(
    user_id: int,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Toggle user active status"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent admin from deactivating themselves
    # Check if the user being deactivated has the same email as the admin
    if user.email == current_admin.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account"
        )
    
    # Store previous status for logging
    previous_status = user.is_active
    
    # Toggle status
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    
    # Log the action
    action = "activated" if user.is_active else "deactivated"
    print(f"🔧 Admin {current_admin.username} {action} user {user.email} (ID: {user_id})")
    
    return {
        "success": True,
        "message": f"User {user.full_name} has been {action}",
        "user_id": user_id,
        "user_name": user.full_name,
        "user_email": user.email,
        "is_active": user.is_active,
        "previous_status": previous_status,
        "action_performed_by": current_admin.username
    }


@router.post("/users/bulk-toggle-status")
async def bulk_toggle_user_status(
    user_ids: List[int],
    action: str,  # 'activate' or 'deactivate'
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Bulk toggle user active status"""
    if action not in ['activate', 'deactivate']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Action must be 'activate' or 'deactivate'"
        )
    
    # Prevent admin from deactivating themselves
    # Filter out users with the same email as the admin
    if action == 'deactivate':
        users_to_check = db.query(User).filter(User.id.in_(user_ids)).all()
        filtered_user_ids = []
        for user in users_to_check:
            if user.email != current_admin.email:
                filtered_user_ids.append(user.id)
        
        if not filtered_user_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot deactivate your own account"
            )
        user_ids = filtered_user_ids
    
    users = db.query(User).filter(User.id.in_(user_ids)).all()
    if not users:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No users found"
        )
    
    # Update users
    updated_users = []
    for user in users:
        user.is_active = (action == 'activate')
        updated_users.append({
            "id": user.id,
            "name": user.full_name,
            "email": user.email,
            "is_active": user.is_active
        })
    
    db.commit()
    
    # Log the action
    print(f"🔧 Admin {current_admin.username} bulk {action}d {len(users)} users")
    
    return {
        "success": True,
        "message": f"Bulk {action} completed for {len(users)} users",
        "action": action,
        "updated_users": updated_users,
        "count": len(users),
        "action_performed_by": current_admin.username
    }
