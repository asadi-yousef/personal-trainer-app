"""
Comprehensive booking service with conflict prevention and atomic operations
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
import json
import logging
from contextlib import contextmanager

from app.models import (
    Booking, BookingRequest, TimeSlot, User, Trainer, 
    BookingStatus, BookingRequestStatus
)
from app.services.email_service import email_service
from app.services.scoring_service import ScoringService

logger = logging.getLogger(__name__)

class BookingService:
    """Service for managing bookings with conflict prevention"""
    
    def __init__(self, db: Session):
        self.db = db
    
    @contextmanager
    def atomic_booking(self):
        """Context manager for atomic booking operations"""
        try:
            yield self.db
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            logger.error(f"Booking operation failed, rolled back: {str(e)}")
            raise
    
    def lock_time_slots(self, slot_ids: List[int], lock_duration_minutes: int = 5) -> bool:
        """Temporarily lock time slots to prevent double booking"""
        try:
            lock_until = datetime.now() + timedelta(minutes=lock_duration_minutes)
            
            # Lock slots atomically
            locked_count = self.db.query(TimeSlot).filter(
                and_(
                    TimeSlot.id.in_(slot_ids),
                    TimeSlot.is_available == True,
                    TimeSlot.is_booked == False,
                    or_(
                        TimeSlot.locked_until.is_(None),
                        TimeSlot.locked_until < datetime.now()
                    )
                )
            ).update(
                {"locked_until": lock_until},
                synchronize_session=False
            )
            
            self.db.commit()
            
            # Check if all slots were locked
            if locked_count == len(slot_ids):
                logger.info(f"Successfully locked {locked_count} time slots")
                return True
            else:
                logger.warning(f"Could only lock {locked_count} of {len(slot_ids)} slots")
                return False
                
        except Exception as e:
            logger.error(f"Failed to lock time slots: {str(e)}")
            self.db.rollback()
            return False
    
    def unlock_time_slots(self, slot_ids: List[int]) -> bool:
        """Unlock time slots"""
        try:
            self.db.query(TimeSlot).filter(
                TimeSlot.id.in_(slot_ids)
            ).update(
                {"locked_until": None},
                synchronize_session=False
            )
            self.db.commit()
            logger.info(f"Unlocked {len(slot_ids)} time slots")
            return True
        except Exception as e:
            logger.error(f"Failed to unlock time slots: {str(e)}")
            self.db.rollback()
            return False
    
    def create_booking_request(
        self,
        client_id: int,
        trainer_id: int,
        session_type: str,
        duration_minutes: int,
        location: str,
        special_requests: Optional[str] = None,
        preferred_start_date: Optional[datetime] = None,
        preferred_end_date: Optional[datetime] = None,
        preferred_times: Optional[List[str]] = None,
        avoid_times: Optional[List[str]] = None,
        allow_weekends: bool = True,
        allow_evenings: bool = True,
        is_recurring: bool = False,
        recurring_pattern: Optional[str] = None
    ) -> Dict:
        """Create a booking request that requires trainer approval"""
        
        with self.atomic_booking():
            # Validate trainer exists and is available
            trainer = self.db.query(Trainer).filter(
                and_(
                    Trainer.id == trainer_id,
                    Trainer.is_available == True
                )
            ).first()
            
            if not trainer:
                raise ValueError("Trainer not found or not available")
            
            # Create booking request
            booking_request = BookingRequest(
                client_id=client_id,
                trainer_id=trainer_id,
                session_type=session_type,
                duration_minutes=duration_minutes,
                location=location,
                special_requests=special_requests,
                preferred_start_date=preferred_start_date,
                preferred_end_date=preferred_end_date,
                preferred_times=json.dumps(preferred_times) if preferred_times else None,
                avoid_times=json.dumps(avoid_times) if avoid_times else None,
                allow_weekends=allow_weekends,
                allow_evenings=allow_evenings,
                is_recurring=is_recurring,
                recurring_pattern=recurring_pattern,
                status=BookingRequestStatus.PENDING,
                expires_at=datetime.now() + timedelta(hours=24)  # 24-hour expiration
            )
            
            self.db.add(booking_request)
            self.db.flush()  # Get the ID
            
            # If explicit start/end provided, attempt to lock the requested slots until expiry
            try:
                if preferred_start_date and preferred_end_date:
                    # Find matching time slot(s); support multi-slot by duration
                    slot_ids = self._find_requested_time_slot(
                        trainer_id=trainer_id,
                        start_time=preferred_start_date,
                        end_time=preferred_end_date,
                        duration_minutes=duration_minutes
                    )
                    if slot_ids:
                        # Lock slots until the request expires (soft-hold)
                        lock_minutes = int((booking_request.expires_at - datetime.now()).total_seconds() // 60) or 5
                        self.lock_time_slots(slot_ids, lock_duration_minutes=lock_minutes)
            except Exception as e:
                logger.warning(f"Unable to lock requested slots on request creation: {str(e)}")

            # Send notification email to trainer
            try:
                client = self.db.query(User).filter(User.id == client_id).first()
                if client and trainer.user:
                    email_service.send_booking_request_notification(
                        trainer_email=trainer.user.email,
                        trainer_name=trainer.user.full_name,
                        client_name=client.full_name,
                        session_type=session_type,
                        preferred_date=preferred_start_date.isoformat() if preferred_start_date else "Flexible",
                        preferred_time=preferred_times[0] if preferred_times else "Flexible",
                        duration_minutes=duration_minutes,
                        location=location,
                        special_requests=special_requests
                    )
            except Exception as e:
                logger.error(f"Failed to send booking request email: {str(e)}")
            
            return {
                "booking_request_id": booking_request.id,
                "status": "pending",
                "message": "Booking request sent to trainer for approval",
                "expires_at": booking_request.expires_at.isoformat()
            }
    
    def approve_booking_request(
        self,
        booking_request_id: int,
        trainer_id: int,
        notes: Optional[str] = None
    ) -> Dict:
        """
        Approve a booking request and create confirmed booking with atomic multi-slot support
        
        This method ensures data integrity by:
        1. Using database transactions for atomic operations
        2. Proper rollback on any failure
        3. Validation of all slots before booking
        4. Comprehensive error logging
        """
        logger.info(
            f"Starting approval process for BookingRequest {booking_request_id} "
            f"by Trainer {trainer_id}"
        )
        
        try:
            # Start transaction block
            with self.atomic_booking():
                # Get and validate booking request
                booking_request = self.db.query(BookingRequest).filter(
                    and_(
                        BookingRequest.id == booking_request_id,
                        BookingRequest.trainer_id == trainer_id,
                        BookingRequest.status == BookingRequestStatus.PENDING,
                        BookingRequest.expires_at > datetime.now()
                    )
                ).first()
                
                if not booking_request:
                    logger.error(
                        f"BookingRequest {booking_request_id} not found, expired, "
                        f"or already processed"
                    )
                    raise ValueError("Booking request not found, expired, or already processed")
                
                # Handle both new and old booking requests
                if booking_request.start_time and booking_request.end_time:
                    # New format: use requested times
                    confirmed_start_time = booking_request.start_time
                    confirmed_end_time = booking_request.end_time
                else:
                    # Old format: use flexible scheduling (create slots on demand)
                    if not booking_request.preferred_start_date or not booking_request.preferred_end_date:
                        logger.error(
                            f"BookingRequest {booking_request_id} has no time preferences"
                        )
                        raise ValueError("Invalid booking request - no time preferences specified")
                    confirmed_start_time = booking_request.preferred_start_date
                    confirmed_end_time = booking_request.preferred_end_date
                
                # Calculate number of slots needed for multi-slot bookings
                duration_minutes = booking_request.duration_minutes
                slots_needed = duration_minutes // 60
                
                logger.info(
                    f"Booking requires {slots_needed} slot(s) for {duration_minutes} minutes"
                )
                
                # Find or create time slots based on request type
                if booking_request.start_time and booking_request.end_time:
                    # New format: find specific requested slot(s)
                    slot_ids = self._find_requested_time_slot_atomic(
                        trainer_id=trainer_id,
                        start_time=confirmed_start_time,
                        end_time=confirmed_end_time,
                        duration_minutes=duration_minutes
                    )
                    
                    if not slot_ids:
                        logger.error(
                            f"Requested time slots not available for BookingRequest {booking_request_id}"
                        )
                        raise ValueError("Requested time slot is no longer available")
                else:
                    # Old format: create slots on demand for flexible scheduling
                    slot_ids = self._create_flexible_time_slots(
                        trainer_id=trainer_id,
                        start_time=confirmed_start_time,
                        end_time=confirmed_end_time,
                        duration_minutes=duration_minutes
                    )
                
                logger.info(
                    f"Found/created {len(slot_ids)} slot(s) for booking: {slot_ids}"
                )
                
                # CRITICAL: Atomic Multi-Slot Booking Operation
                # Lock and validate ALL slots before proceeding
                if not self._atomic_lock_slots(slot_ids):
                    logger.error(
                        f"Failed to atomically lock slots {slot_ids} for BookingRequest {booking_request_id}. "
                        f"Possible concurrency conflict."
                    )
                    raise ValueError(
                        "Time slots are no longer available - another booking may have been made simultaneously"
                    )
                
                try:
                    # Step 1: Create the Booking record
                    booking = Booking(
                        client_id=booking_request.client_id,
                        trainer_id=booking_request.trainer_id,
                        session_type=booking_request.session_type,
                        duration_minutes=booking_request.duration_minutes,
                        location=booking_request.location,
                        special_requests=booking_request.special_requests,
                        start_time=confirmed_start_time,
                        end_time=confirmed_end_time,
                        confirmed_date=confirmed_start_time,
                        status=BookingStatus.CONFIRMED,
                        is_recurring=booking_request.is_recurring,
                        recurring_pattern=booking_request.recurring_pattern
                    )
                    
                    self.db.add(booking)
                    self.db.flush()  # Get the booking ID but don't commit yet
                    
                    logger.info(f"Created Booking {booking.id} in transaction")
                    
                    # Step 2 & 3: Atomically update ALL time slots
                    # This is where the atomic operation is critical for multi-slot bookings
                    updated_count = self.db.query(TimeSlot).filter(
                        and_(
                            TimeSlot.id.in_(slot_ids),
                            TimeSlot.is_booked == False,  # Double-check they're still available
                            or_(
                                TimeSlot.locked_until.is_(None),
                                TimeSlot.locked_until >= datetime.now()  # Our lock
                            )
                        )
                    ).update({
                        "is_booked": True,
                        "booking_id": booking.id,
                        "locked_until": None
                    }, synchronize_session=False)
                    
                    # CRITICAL CHECK: Ensure ALL slots were updated
                    if updated_count != len(slot_ids):
                        logger.error(
                            f"ATOMIC OPERATION FAILED: Expected to update {len(slot_ids)} slots, "
                            f"but only updated {updated_count}. Rolling back transaction. "
                            f"Slot IDs: {slot_ids}"
                        )
                        raise IntegrityError(
                            f"Concurrency conflict: Only {updated_count}/{len(slot_ids)} slots "
                            f"were available for booking. Transaction will be rolled back.",
                            params=None,
                            orig=None
                        )
                    
                    logger.info(
                        f"Successfully updated {updated_count} slot(s) atomically for Booking {booking.id}"
                    )
                    
                    # Step 4: Update booking request status
                    booking_request.status = BookingRequestStatus.APPROVED
                    booking_request.confirmed_date = confirmed_start_time
                    booking_request.notes = notes
                    
                    # Transaction will be committed by atomic_booking context manager
                    logger.info(
                        f"Booking {booking.id} approved successfully. "
                        f"Transaction will be committed."
                    )
                    
                    # Send confirmation email (outside critical path)
                    try:
                        client = self.db.query(User).filter(User.id == booking_request.client_id).first()
                        trainer = self.db.query(Trainer).filter(Trainer.id == trainer_id).first()
                        
                        if client and trainer and trainer.user:
                            email_service.send_booking_confirmation(
                                client_email=client.email,
                                client_name=client.full_name,
                                trainer_name=trainer.user.full_name,
                                session_type=booking_request.session_type,
                                confirmed_date=confirmed_start_time.isoformat(),
                                confirmed_time=confirmed_start_time.strftime("%I:%M %p"),
                                duration_minutes=booking_request.duration_minutes,
                                location=booking_request.location
                            )
                    except Exception as e:
                        logger.error(f"Failed to send confirmation email: {str(e)}")
                    
                    return {
                        "booking_id": booking.id,
                        "booking_request_id": booking_request_id,
                        "status": "confirmed",
                        "message": "Booking approved and confirmed",
                        "confirmed_time": confirmed_start_time.isoformat(),
                        "slots_booked": len(slot_ids)
                    }
                    
                except (IntegrityError, SQLAlchemyError) as e:
                    # This will trigger the rollback in atomic_booking context manager
                    logger.error(
                        f"Database error during atomic booking operation: {str(e)}",
                        exc_info=True
                    )
                    # Unlock slots since transaction failed
                    self.unlock_time_slots(slot_ids)
                    raise ValueError(
                        f"Failed to complete booking due to database conflict: {str(e)}"
                    )
                    
        except Exception as e:
            logger.error(
                f"Error approving BookingRequest {booking_request_id}: {str(e)}",
                exc_info=True
            )
            raise
    
    def reject_booking_request(
        self,
        booking_request_id: int,
        trainer_id: int,
        rejection_reason: str
    ) -> Dict:
        """Reject a booking request"""
        
        with self.atomic_booking():
            booking_request = self.db.query(BookingRequest).filter(
                and_(
                    BookingRequest.id == booking_request_id,
                    BookingRequest.trainer_id == trainer_id,
                    BookingRequest.status == BookingRequestStatus.PENDING
                )
            ).first()
            
            if not booking_request:
                raise ValueError("Booking request not found or already processed")
            
            booking_request.status = BookingRequestStatus.REJECTED
            booking_request.rejection_reason = rejection_reason
            
            # Unlock any slots that may have been locked for this request
            try:
                if booking_request.start_time and booking_request.end_time:
                    slot_ids = self._find_requested_time_slot(
                        trainer_id=trainer_id,
                        start_time=booking_request.start_time,
                        end_time=booking_request.end_time,
                        duration_minutes=booking_request.duration_minutes
                    )
                    if slot_ids:
                        self.unlock_time_slots(slot_ids)
            except Exception as e:
                logger.warning(f"Failed to unlock slots after rejection: {str(e)}")
            
            return {
                "booking_request_id": booking_request_id,
                "status": "rejected",
                "message": "Booking request rejected",
                "rejection_reason": rejection_reason
            }
    
    def cancel_booking(
        self,
        booking_id: int,
        user_id: int,
        user_role: str,
        cancellation_reason: Optional[str] = None
    ) -> Dict:
        """Cancel a booking and release time slots"""
        
        with self.atomic_booking():
            # Get booking with validation
            booking = self.db.query(Booking).filter(
                and_(
                    Booking.id == booking_id,
                    or_(
                        Booking.client_id == user_id,
                        Booking.trainer_id == user_id
                    ),
                    Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED])
                )
            ).first()
            
            if not booking:
                raise ValueError("Booking not found or cannot be cancelled")
            
            # Release time slots
            slot_ids = self.db.query(TimeSlot.id).filter(
                TimeSlot.booking_id == booking_id
            ).all()
            
            if slot_ids:
                slot_ids = [slot.id for slot in slot_ids]
                self.db.query(TimeSlot).filter(
                    TimeSlot.id.in_(slot_ids)
                ).update({
                    "is_booked": False,
                    "booking_id": None,
                    "locked_until": None
                }, synchronize_session=False)
            
            # Update booking status
            booking.status = BookingStatus.CANCELLED
            
            return {
                "booking_id": booking_id,
                "status": "cancelled",
                "message": "Booking cancelled successfully",
                "slots_released": len(slot_ids) if slot_ids else 0
            }
    
    def reschedule_booking(
        self,
        booking_id: int,
        user_id: int,
        new_start_time: datetime,
        new_end_time: datetime,
        reason: Optional[str] = None
    ) -> Dict:
        """Reschedule a booking to new time slots"""
        
        with self.atomic_booking():
            # Get and validate booking
            booking = self.db.query(Booking).filter(
                and_(
                    Booking.id == booking_id,
                    or_(
                        Booking.client_id == user_id,
                        Booking.trainer_id == user_id
                    ),
                    Booking.status == BookingStatus.CONFIRMED
                )
            ).first()
            
            if not booking:
                raise ValueError("Booking not found or cannot be rescheduled")
            
            # Find new available time slots
            new_slot_ids = self._find_time_slots_for_booking(
                trainer_id=booking.trainer_id,
                start_time=new_start_time,
                end_time=new_end_time,
                duration_minutes=booking.duration_minutes
            )
            
            if not new_slot_ids:
                raise ValueError("No available time slots for the new time")
            
            # Lock new slots
            if not self.lock_time_slots(new_slot_ids):
                raise ValueError("New time slots are no longer available")
            
            try:
                # Release old slots
                old_slot_ids = self.db.query(TimeSlot.id).filter(
                    TimeSlot.booking_id == booking_id
                ).all()
                
                if old_slot_ids:
                    old_slot_ids = [slot.id for slot in old_slot_ids]
                    self.db.query(TimeSlot).filter(
                        TimeSlot.id.in_(old_slot_ids)
                    ).update({
                        "is_booked": False,
                        "booking_id": None,
                        "locked_until": None
                    }, synchronize_session=False)
                
                # Update booking with new times
                booking.start_time = new_start_time
                booking.end_time = new_end_time
                booking.confirmed_date = new_start_time
                
                # Mark new slots as booked
                self.db.query(TimeSlot).filter(
                    TimeSlot.id.in_(new_slot_ids)
                ).update({
                    "is_booked": True,
                    "booking_id": booking_id,
                    "locked_until": None
                }, synchronize_session=False)
                
                return {
                    "booking_id": booking_id,
                    "status": "rescheduled",
                    "message": "Booking rescheduled successfully",
                    "new_time": new_start_time.isoformat(),
                    "old_slots_released": len(old_slot_ids) if old_slot_ids else 0,
                    "new_slots_booked": len(new_slot_ids)
                }
                
            except Exception as e:
                # Unlock new slots if rescheduling fails
                self.unlock_time_slots(new_slot_ids)
                raise e
    
    def _atomic_lock_slots(self, slot_ids: List[int]) -> bool:
        """
        Atomically lock multiple slots with enhanced validation
        
        This method ensures that ALL slots are locked together or none are locked.
        Critical for multi-slot bookings to prevent partial bookings.
        
        Returns:
            True if all slots were locked successfully, False otherwise
        """
        try:
            lock_until = datetime.now() + timedelta(minutes=5)
            
            # Attempt to lock ALL slots atomically with strict conditions
            locked_count = self.db.query(TimeSlot).filter(
                and_(
                    TimeSlot.id.in_(slot_ids),
                    TimeSlot.is_available == True,
                    TimeSlot.is_booked == False,
                    or_(
                        TimeSlot.locked_until.is_(None),
                        TimeSlot.locked_until < datetime.now()
                    )
                )
            ).update(
                {"locked_until": lock_until},
                synchronize_session=False
            )
            
            self.db.flush()  # Ensure update is applied within transaction
            
            # CRITICAL: Verify ALL slots were locked
            if locked_count == len(slot_ids):
                logger.info(
                    f"Successfully locked {locked_count} time slots atomically: {slot_ids}"
                )
                return True
            else:
                logger.warning(
                    f"Atomic lock FAILED: Could only lock {locked_count} of {len(slot_ids)} slots. "
                    f"Required slots: {slot_ids}"
                )
                # Unlock any partially locked slots
                self.unlock_time_slots(slot_ids)
                return False
                
        except Exception as e:
            logger.error(
                f"Error during atomic slot locking: {str(e)}",
                exc_info=True
            )
            # Attempt to clean up any locks
            try:
                self.unlock_time_slots(slot_ids)
            except:
                pass
            return False
    
    def _find_requested_time_slot_atomic(
        self,
        trainer_id: int,
        start_time: datetime,
        end_time: datetime,
        duration_minutes: int
    ) -> List[int]:
        """
        Find the specific time slot(s) that were requested by the client
        with atomic validation for multi-slot bookings
        
        This enhanced version ensures all consecutive slots are available
        before returning them.
        """
        # Calculate how many 60-minute slots we need
        slots_needed = duration_minutes // 60
        
        logger.debug(
            f"Looking for {slots_needed} consecutive slot(s) from "
            f"{start_time} to {end_time} for trainer {trainer_id}"
        )
        
        if slots_needed == 1:
            # Single slot
            slot = self.db.query(TimeSlot).filter(
                and_(
                    TimeSlot.trainer_id == trainer_id,
                    TimeSlot.start_time == start_time,
                    TimeSlot.end_time == end_time,
                    TimeSlot.duration_minutes == 60,
                    TimeSlot.is_available == True,
                    TimeSlot.is_booked == False,
                    or_(
                        TimeSlot.locked_until.is_(None),
                        TimeSlot.locked_until < datetime.now()
                    )
                )
            ).first()
            
            if slot:
                logger.debug(f"Found single slot: {slot.id}")
                return [slot.id]
            else:
                logger.warning(
                    f"Single slot not found or not available for time {start_time}"
                )
                return []
        
        else:
            # Multiple consecutive slots required
            base_slots = self.db.query(TimeSlot).filter(
                and_(
                    TimeSlot.trainer_id == trainer_id,
                    TimeSlot.start_time >= start_time,
                    TimeSlot.end_time <= end_time,
                    TimeSlot.duration_minutes == 60,
                    TimeSlot.is_available == True,
                    TimeSlot.is_booked == False,
                    or_(
                        TimeSlot.locked_until.is_(None),
                        TimeSlot.locked_until < datetime.now()
                    )
                )
            ).order_by(TimeSlot.start_time).all()
            
            logger.debug(f"Found {len(base_slots)} potential slots in time range")
            
            # Find consecutive slots
            consecutive_slots = []
            for i, slot in enumerate(base_slots):
                if len(consecutive_slots) == slots_needed:
                    break
                    
                if not consecutive_slots:
                    consecutive_slots = [slot]
                else:
                    # Check if this slot is consecutive to the last one
                    last_slot = consecutive_slots[-1]
                    if slot.start_time == last_slot.end_time:
                        consecutive_slots.append(slot)
                        logger.debug(
                            f"Slot {slot.id} is consecutive to {last_slot.id}"
                        )
                    else:
                        # Gap found, start over
                        logger.debug(
                            f"Gap detected between {last_slot.id} and {slot.id}, "
                            f"restarting search"
                        )
                        consecutive_slots = [slot]
            
            if len(consecutive_slots) == slots_needed:
                slot_ids = [slot.id for slot in consecutive_slots]
                logger.info(
                    f"Found {slots_needed} consecutive slots: {slot_ids}"
                )
                return slot_ids
            else:
                logger.warning(
                    f"Could not find {slots_needed} consecutive slots. "
                    f"Only found {len(consecutive_slots)}"
                )
                return []
    
    def _find_requested_time_slot(
        self,
        trainer_id: int,
        start_time: datetime,
        end_time: datetime,
        duration_minutes: int
    ) -> List[int]:
        """Find the specific time slot that was requested by the client (legacy method)"""
        
        # Calculate how many 60-minute slots we need
        slots_needed = duration_minutes // 60
        
        if slots_needed == 1:
            # Single slot
            slot = self.db.query(TimeSlot).filter(
                and_(
                    TimeSlot.trainer_id == trainer_id,
                    TimeSlot.start_time == start_time,
                    TimeSlot.end_time == end_time,
                    TimeSlot.duration_minutes == 60,
                    TimeSlot.is_available == True,
                    TimeSlot.is_booked == False,
                    or_(
                        TimeSlot.locked_until.is_(None),
                        TimeSlot.locked_until < datetime.now()
                    )
                )
            ).first()
            
            return [slot.id] if slot else []
        
        else:
            # Multiple consecutive slots
            base_slots = self.db.query(TimeSlot).filter(
                and_(
                    TimeSlot.trainer_id == trainer_id,
                    TimeSlot.start_time >= start_time,
                    TimeSlot.end_time <= end_time,
                    TimeSlot.duration_minutes == 60,
                    TimeSlot.is_available == True,
                    TimeSlot.is_booked == False,
                    or_(
                        TimeSlot.locked_until.is_(None),
                        TimeSlot.locked_until < datetime.now()
                    )
                )
            ).order_by(TimeSlot.start_time).all()
            
            # Find consecutive slots
            consecutive_slots = []
            for i, slot in enumerate(base_slots):
                if len(consecutive_slots) == slots_needed:
                    break
                    
                if not consecutive_slots:
                    consecutive_slots = [slot]
                else:
                    # Check if this slot is consecutive to the last one
                    last_slot = consecutive_slots[-1]
                    if slot.start_time == last_slot.end_time:
                        consecutive_slots.append(slot)
                    else:
                        # Gap found, start over
                        consecutive_slots = [slot]
            
            if len(consecutive_slots) == slots_needed:
                return [slot.id for slot in consecutive_slots]
            else:
                return []
    
    def _create_flexible_time_slots(
        self,
        trainer_id: int,
        start_time: datetime,
        end_time: datetime,
        duration_minutes: int
    ) -> List[int]:
        """Create time slots on demand for flexible scheduling (backward compatibility)"""
        
        # Calculate how many 60-minute slots we need
        slots_needed = duration_minutes // 60
        
        # Create the time slots
        created_slots = []
        current_time = start_time
        
        for i in range(slots_needed):
            slot_end_time = current_time + timedelta(minutes=60)
            
            # Create the time slot
            time_slot = TimeSlot(
                trainer_id=trainer_id,
                date=current_time,  # Set the date field
                start_time=current_time,
                end_time=slot_end_time,
                duration_minutes=60,
                is_available=True,
                is_booked=False,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            
            self.db.add(time_slot)
            self.db.flush()  # Get the ID
            created_slots.append(time_slot.id)
            
            current_time = slot_end_time
        
        return created_slots
    
    def get_booking_requests_for_trainer(self, trainer_id: int) -> List[Dict]:
        """Get all pending booking requests for a trainer"""
        
        requests = self.db.query(BookingRequest).filter(
            and_(
                BookingRequest.trainer_id == trainer_id,
                BookingRequest.status == BookingRequestStatus.PENDING,
                BookingRequest.expires_at > datetime.now()
            )
        ).all()
        
        result = []
        for req in requests:
            client = self.db.query(User).filter(User.id == req.client_id).first()
            result.append({
                "id": req.id,
                "client_name": client.full_name if client else "Unknown",
                "client_email": client.email if client else None,
                "session_type": req.session_type,
                "duration_minutes": req.duration_minutes,
                "location": req.location,
                "special_requests": req.special_requests,
                "preferred_start_date": req.preferred_start_date.isoformat() if req.preferred_start_date else None,
                "preferred_end_date": req.preferred_end_date.isoformat() if req.preferred_end_date else None,
                "preferred_times": req.preferred_times_list,
                "allow_weekends": req.allow_weekends,
                "allow_evenings": req.allow_evenings,
                "is_recurring": req.is_recurring,
                "created_at": req.created_at.isoformat(),
                "expires_at": req.expires_at.isoformat()
            })
        
        return result

    def get_booking_requests_for_client(self, client_id: int) -> List[Dict]:
        """Get all booking requests created by a client (pending and recent)"""
        requests = self.db.query(BookingRequest).filter(
            BookingRequest.client_id == client_id
        ).order_by(BookingRequest.created_at.desc()).all()

        result = []
        for req in requests:
            trainer = self.db.query(Trainer).filter(Trainer.id == req.trainer_id).first()
            trainer_name = trainer.user.full_name if trainer and trainer.user else "Trainer"
            result.append({
                "id": req.id,
                "trainer_name": trainer_name,
                "session_type": req.session_type,
                "duration_minutes": req.duration_minutes,
                "location": req.location,
                "special_requests": req.special_requests,
                "preferred_start_date": req.preferred_start_date.isoformat() if req.preferred_start_date else None,
                "preferred_end_date": req.preferred_end_date.isoformat() if req.preferred_end_date else None,
                "start_time": req.start_time.isoformat() if getattr(req, 'start_time', None) else None,
                "end_time": req.end_time.isoformat() if getattr(req, 'end_time', None) else None,
                "status": req.status.value if hasattr(req.status, 'value') else str(req.status),
                "created_at": req.created_at.isoformat(),
                "expires_at": req.expires_at.isoformat() if req.expires_at else None,
            })

        return result
    
    def get_bookings_for_user(self, user_id: int, user_role: str) -> List[Dict]:
        """Get all bookings for a user (client or trainer)"""
        
        if user_role == "client":
            bookings = self.db.query(Booking).filter(
                Booking.client_id == user_id
            ).order_by(Booking.start_time.desc()).all()
        else:  # trainer
            bookings = self.db.query(Booking).filter(
                Booking.trainer_id == user_id
            ).order_by(Booking.start_time.desc()).all()
        
        result = []
        for booking in bookings:
            if user_role == "client":
                trainer = self.db.query(Trainer).filter(Trainer.id == booking.trainer_id).first()
                other_party_name = trainer.user.full_name if trainer and trainer.user else "Unknown"
            else:
                client = self.db.query(User).filter(User.id == booking.client_id).first()
                other_party_name = client.full_name if client else "Unknown"
            
            # Check if payment exists for this booking
            from app.models import Payment, PaymentStatus
            payment = self.db.query(Payment).filter(
                Payment.booking_id == booking.id,
                Payment.status == PaymentStatus.COMPLETED
            ).first()
            
            result.append({
                "id": booking.id,
                "other_party_name": other_party_name,
                "session_type": booking.session_type,
                "duration_minutes": booking.duration_minutes,
                "location": booking.location,
                "start_time": booking.start_time.isoformat() if booking.start_time else None,
                "end_time": booking.end_time.isoformat() if booking.end_time else None,
                "total_cost": booking.total_cost,
                "status": booking.status.value,
                "special_requests": booking.special_requests,
                "created_at": booking.created_at.isoformat(),
                "can_cancel": booking.status in [BookingStatus.PENDING, BookingStatus.CONFIRMED],
                "can_reschedule": booking.status == BookingStatus.CONFIRMED,
                "has_payment": payment is not None
            })
        
        return result
    
    def find_best_slots_with_scoring(
        self,
        booking_request: BookingRequest,
        trainer_id: int,
        max_results: int = 5
    ) -> List[Dict]:
        """
        Find the best available time slots using W_C scoring algorithm
        
        Args:
            booking_request: The booking request with client preferences
            trainer_id: ID of the trainer
            max_results: Maximum number of results to return
            
        Returns:
            List of scored slots with their W_C scores and breakdowns
        """
        logger.info(
            f"Finding best slots for BookingRequest {booking_request.id} "
            f"with Trainer {trainer_id} using W_C scoring"
        )
        
        try:
            # Get date range for slot search
            if booking_request.preferred_start_date and booking_request.preferred_end_date:
                start_date = booking_request.preferred_start_date
                end_date = booking_request.preferred_end_date
            else:
                # Default to next 2 weeks
                start_date = datetime.now()
                end_date = datetime.now() + timedelta(days=14)
            
            # Fetch available time slots
            available_slots = self.db.query(TimeSlot).filter(
                and_(
                    TimeSlot.trainer_id == trainer_id,
                    TimeSlot.start_time >= start_date,
                    TimeSlot.start_time <= end_date,
                    TimeSlot.is_available == True,
                    TimeSlot.is_booked == False,
                    or_(
                        TimeSlot.locked_until.is_(None),
                        TimeSlot.locked_until < datetime.now()
                    )
                )
            ).order_by(TimeSlot.start_time).all()
            
            logger.info(
                f"Found {len(available_slots)} available slots for scoring"
            )
            
            if not available_slots:
                return []
            
            # Use ScoringService to rank slots
            scored_slots = ScoringService.rank_time_slots(
                booking_request=booking_request,
                available_slots=available_slots,
                duration_minutes=booking_request.duration_minutes
            )
            
            # Log any slots requiring manual review
            manual_review_slots = [
                slot for slot in scored_slots 
                if slot.get('requires_manual_review', False)
            ]
            
            if manual_review_slots:
                logger.warning(
                    f"Found {len(manual_review_slots)} slots requiring manual review "
                    f"for BookingRequest {booking_request.id}"
                )
            
            # Return top results
            return scored_slots[:max_results]
            
        except Exception as e:
            logger.error(
                f"Error finding best slots with scoring: {str(e)}",
                exc_info=True
            )
            return []
