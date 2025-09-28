"""
Core scheduling algorithm and optimization service
"""
from sqlalchemy.orm import Session
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta, date, time
import json
import math

from app.models import TrainerAvailability, Booking, Session, Trainer, User
from app.schemas.booking import SmartBookingRequest, BookingConflict


class SchedulingService:
    """Core scheduling algorithm service"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def find_optimal_slots(
        self, 
        booking_request: SmartBookingRequest,
        trainer_id: int
    ) -> List[Dict]:
        """
        Find optimal time slots for a booking request using our scheduling algorithm
        
        This is the core algorithm that considers:
        1. Trainer availability
        2. Existing bookings/sessions
        3. Client preferences
        4. Optimization criteria (convenience, cost, etc.)
        """
        
        # Step 1: Get trainer's availability schedule
        trainer_availability = self._get_trainer_availability(trainer_id)
        if not trainer_availability:
            return []
        
        # Step 2: Get existing bookings and sessions
        existing_conflicts = self._get_existing_conflicts(
            trainer_id, 
            booking_request.earliest_date, 
            booking_request.latest_date
        )
        
        # Step 3: Generate candidate time slots
        candidate_slots = self._generate_candidate_slots(
            trainer_availability,
            booking_request,
            existing_conflicts
        )
        
        # Step 4: Score and rank slots based on optimization criteria
        scored_slots = self._score_slots(
            candidate_slots, 
            booking_request
        )
        
        # Step 5: Return top recommendations
        return sorted(scored_slots, key=lambda x: x['score'], reverse=True)[:10]
    
    def _get_trainer_availability(self, trainer_id: int) -> List[TrainerAvailability]:
        """Get trainer's weekly availability schedule"""
        return self.db.query(TrainerAvailability).filter(
            TrainerAvailability.trainer_id == trainer_id,
            TrainerAvailability.is_available == True
        ).all()
    
    def _get_existing_conflicts(
        self, 
        trainer_id: int, 
        start_date: datetime, 
        end_date: datetime
    ) -> List[Dict]:
        """Get existing bookings and sessions that could conflict"""
        conflicts = []
        
        # Get existing sessions
        sessions = self.db.query(Session).filter(
            Session.trainer_id == trainer_id,
            Session.scheduled_date >= start_date,
            Session.scheduled_date <= end_date,
            Session.status.in_(['pending', 'confirmed'])
        ).all()
        
        for session in sessions:
            conflicts.append({
                'type': 'session',
                'id': session.id,
                'start_time': session.scheduled_date,
                'end_time': session.scheduled_date + timedelta(minutes=session.duration_minutes),
                'status': session.status
            })
        
        # Get existing bookings
        bookings = self.db.query(Booking).filter(
            Booking.trainer_id == trainer_id,
            Booking.status.in_(['pending', 'confirmed']),
            Booking.confirmed_date >= start_date,
            Booking.confirmed_date <= end_date
        ).all()
        
        for booking in bookings:
            if booking.confirmed_date:
                conflicts.append({
                    'type': 'booking',
                    'id': booking.id,
                    'start_time': booking.confirmed_date,
                    'end_time': booking.confirmed_date + timedelta(minutes=booking.duration_minutes),
                    'status': booking.status
                })
        
        return conflicts
    
    def _generate_candidate_slots(
        self,
        trainer_availability: List[TrainerAvailability],
        booking_request: SmartBookingRequest,
        existing_conflicts: List[Dict]
    ) -> List[Dict]:
        """Generate all possible time slots based on availability"""
        candidate_slots = []
        
        # Iterate through each day in the requested range
        current_date = booking_request.earliest_date.date()
        end_date = booking_request.latest_date.date()
        
        while current_date <= end_date:
            day_of_week = current_date.weekday()
            
            # Find trainer's availability for this day
            day_availability = [
                avail for avail in trainer_availability 
                if avail.day_of_week == day_of_week
            ]
            
            for availability in day_availability:
                slots = self._generate_slots_for_day(
                    current_date,
                    availability,
                    booking_request,
                    existing_conflicts
                )
                candidate_slots.extend(slots)
            
            current_date += timedelta(days=1)
        
        return candidate_slots
    
    def _generate_slots_for_day(
        self,
        target_date: date,
        availability: TrainerAvailability,
        booking_request: SmartBookingRequest,
        existing_conflicts: List[Dict]
    ) -> List[Dict]:
        """Generate time slots for a specific day"""
        slots = []
        
        # Parse availability times
        start_time = datetime.strptime(availability.start_time, "%H:%M").time()
        end_time = datetime.strptime(availability.end_time, "%H:%M").time()
        
        # Generate 30-minute slots
        current_time = start_time
        while True:
            # Calculate slot end time
            current_datetime = datetime.combine(target_date, current_time)
            slot_end_datetime = current_datetime + timedelta(minutes=booking_request.duration_minutes)
            
            if slot_end_datetime.time() > end_time:
                break
            
            # Check for conflicts
            if not self._has_conflict(current_datetime, slot_end_datetime, existing_conflicts):
                # Check time preferences
                if self._matches_preferences(current_time, booking_request):
                    slots.append({
                        'date': target_date,
                        'start_time': current_time,
                        'end_time': slot_end_datetime.time(),
                        'datetime_start': current_datetime,
                        'datetime_end': slot_end_datetime
                    })
            
            # Move to next 30-minute slot
            current_datetime += timedelta(minutes=30)
            current_time = current_datetime.time()
        
        return slots
    
    def _has_conflict(
        self, 
        start_datetime: datetime, 
        end_datetime: datetime, 
        existing_conflicts: List[Dict]
    ) -> bool:
        """Check if a time slot conflicts with existing bookings/sessions"""
        for conflict in existing_conflicts:
            conflict_start = conflict['start_time']
            conflict_end = conflict['end_time']
            
            # Check for overlap
            if (start_datetime < conflict_end and end_datetime > conflict_start):
                return True
        
        return False
    
    def _matches_preferences(
        self, 
        slot_time: time, 
        booking_request: SmartBookingRequest
    ) -> bool:
        """Check if a time slot matches client preferences"""
        
        # Check preferred times
        if booking_request.preferred_times:
            time_str = slot_time.strftime("%H:%M")
            if time_str not in booking_request.preferred_times:
                return False
        
        # Check avoid times
        if booking_request.avoid_times:
            time_str = slot_time.strftime("%H:%M")
            if time_str in booking_request.avoid_times:
                return False
        
        # Check weekend preference
        if not booking_request.allow_weekends:
            # This would need the date to check, but for now we'll skip this check
            pass
        
        # Check evening preference
        if not booking_request.allow_evenings and slot_time.hour >= 18:
            return False
        
        return True
    
    def _score_slots(
        self, 
        slots: List[Dict], 
        booking_request: SmartBookingRequest
    ) -> List[Dict]:
        """Score time slots based on optimization criteria"""
        scored_slots = []
        
        for slot in slots:
            score = 0.0
            
            # Base score for availability
            score += 10.0
            
            # Time preference scoring
            if booking_request.preferred_times:
                time_str = slot['start_time'].strftime("%H:%M")
                if time_str in booking_request.preferred_times:
                    score += 20.0  # High bonus for preferred times
            
            # Convenience scoring (morning/afternoon slots)
            hour = slot['start_time'].hour
            if 9 <= hour <= 11:  # Morning slots
                score += 15.0
            elif 14 <= hour <= 16:  # Afternoon slots
                score += 12.0
            elif 17 <= hour <= 19:  # Evening slots
                score += 8.0
            
            # Weekend penalty/bonus
            if booking_request.allow_weekends:
                # Weekend slots get a small bonus for flexibility
                if slot['date'].weekday() >= 5:  # Saturday or Sunday
                    score += 5.0
            
            # Duration optimization
            if booking_request.duration_minutes == 60:
                score += 5.0  # Bonus for standard 1-hour sessions
            
            # Add randomization factor to avoid always getting the same results
            import random
            score += random.uniform(0, 5)
            
            scored_slots.append({
                **slot,
                'score': round(score, 2),
                'start_time_str': slot['start_time'].strftime("%H:%M"),
                'end_time_str': slot['end_time'].strftime("%H:%M"),
                'date_str': slot['date'].strftime("%Y-%m-%d")
            })
        
        return scored_slots
    
    def detect_conflicts(self, booking_id: int) -> List[BookingConflict]:
        """Detect conflicts for a specific booking"""
        booking = self.db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking or not booking.confirmed_date:
            return []
        
        conflicts = []
        
        # Calculate booking end time
        booking_end = booking.confirmed_date + timedelta(minutes=booking.duration_minutes)
        
        # Check for session conflicts
        conflicting_sessions = self.db.query(Session).filter(
            Session.trainer_id == booking.trainer_id,
            Session.id != booking_id,  # Exclude the booking itself
            Session.status.in_(['pending', 'confirmed']),
            Session.scheduled_date < booking_end,
            Session.scheduled_date + timedelta(minutes=Session.duration_minutes) > booking.confirmed_date
        ).all()
        
        for session in conflicting_sessions:
            conflicts.append(BookingConflict(
                conflict_type="time_overlap",
                conflicting_session_id=session.id,
                conflict_details=f"Overlaps with existing session: {session.title}",
                suggested_resolution="Consider rescheduling to avoid overlap"
            ))
        
        # Check for other booking conflicts
        conflicting_bookings = self.db.query(Booking).filter(
            Booking.trainer_id == booking.trainer_id,
            Booking.id != booking_id,
            Booking.status.in_(['pending', 'confirmed']),
            Booking.confirmed_date.isnot(None),
            Booking.confirmed_date < booking_end,
            Booking.confirmed_date + timedelta(minutes=Booking.duration_minutes) > booking.confirmed_date
        ).all()
        
        for other_booking in conflicting_bookings:
            conflicts.append(BookingConflict(
                conflict_type="time_overlap",
                conflicting_booking_id=other_booking.id,
                conflict_details=f"Overlaps with existing booking",
                suggested_resolution="Consider rescheduling to avoid overlap"
            ))
        
        return conflicts
