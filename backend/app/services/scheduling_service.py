"""
Core scheduling algorithm and optimization service
"""
from sqlalchemy.orm import Session
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta, date, time
import json
import math

from app.models import TrainerAvailability, Booking, Session, Trainer, User, TimeSlot
from app.schemas.booking import SmartBookingRequest, BookingConflict


class SchedulingService:
    """Core scheduling algorithm service with greedy optimization"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def find_optimal_slots(
        self, 
        booking_request: SmartBookingRequest,
        trainer_id: int
    ) -> List[Dict]:
        """
        Find optimal time slots for a booking request using time slot system
        
        This algorithm:
        1. Gets available time slots from the TimeSlot model
        2. Filters by client preferences
        3. Scores and ranks slots based on optimization criteria
        """
        
        # Step 1: Get available time slots for the trainer
        available_slots = self._get_available_time_slots(
            trainer_id, 
            booking_request.earliest_date, 
            booking_request.latest_date,
            booking_request.duration_minutes
        )
        
        if not available_slots:
            return []
        
        # Step 2: Filter slots by client preferences
        filtered_slots = self._filter_slots_by_preferences(
            available_slots, 
            booking_request
        )
        
        # Step 3: Score and rank slots based on optimization criteria
        scored_slots = self._score_time_slots(
            filtered_slots, 
            booking_request
        )
        
        # Step 4: Return top recommendations
        return sorted(scored_slots, key=lambda x: x['score'], reverse=True)[:10]
    
    def _get_available_time_slots(
        self, 
        trainer_id: int, 
        start_date: datetime, 
        end_date: datetime,
        duration_minutes: int
    ) -> List[TimeSlot]:
        """Get available time slots for a trainer within a date range"""
        time_slots = self.db.query(TimeSlot).filter(
            TimeSlot.trainer_id == trainer_id,
            TimeSlot.start_time >= start_date,
            TimeSlot.start_time <= end_date,
            TimeSlot.is_available == True,
            TimeSlot.is_booked == False,
            TimeSlot.duration_minutes == duration_minutes
        ).order_by(TimeSlot.start_time).all()
        
        return time_slots
    
    def _filter_slots_by_preferences(
        self, 
        time_slots: List[TimeSlot], 
        booking_request: SmartBookingRequest
    ) -> List[TimeSlot]:
        """Filter time slots based on client preferences"""
        filtered_slots = []
        
        for slot in time_slots:
            # Check avoid times (strict - these should be avoided)
            if booking_request.avoid_times:
                time_str = slot.start_time.strftime("%H:%M")
                if time_str in booking_request.avoid_times:
                    continue
            
            # Check weekend preference
            if not booking_request.allow_weekends:
                if slot.start_time.weekday() >= 5:  # Saturday or Sunday
                    continue
            
            # Check evening preference
            if not booking_request.allow_evenings and slot.start_time.hour >= 18:
                continue
            
            filtered_slots.append(slot)
        
        return filtered_slots
    
    def _score_time_slots(
        self, 
        time_slots: List[TimeSlot], 
        booking_request: SmartBookingRequest
    ) -> List[Dict]:
        """Score time slots based on optimization criteria"""
        scored_slots = []
        
        for slot in time_slots:
            score = 0.0
            
            # Base score for availability
            score += 10.0
            
            # Time preference scoring
            if booking_request.preferred_times:
                time_str = slot.start_time.strftime("%H:%M")
                if time_str in booking_request.preferred_times:
                    score += 25.0  # High bonus for preferred times
                else:
                    score += 5.0   # Small bonus for any available time
            
            # Convenience scoring (morning/afternoon slots)
            hour = slot.start_time.hour
            if 9 <= hour <= 11:  # Morning slots
                score += 15.0
            elif 14 <= hour <= 16:  # Afternoon slots
                score += 12.0
            elif 17 <= hour <= 19:  # Evening slots
                score += 8.0
            
            # Weekend penalty/bonus
            if booking_request.allow_weekends:
                # Weekend slots get a small bonus for flexibility
                if slot.start_time.weekday() >= 5:  # Saturday or Sunday
                    score += 5.0
            
            # Duration optimization
            if booking_request.duration_minutes == 60:
                score += 5.0  # Bonus for standard 1-hour sessions
            
            # Add randomization factor to avoid always getting the same results
            import random
            score += random.uniform(0, 5)
            
            scored_slots.append({
                'slot_id': slot.id,
                'date': slot.start_time.date(),
                'start_time': slot.start_time.time(),
                'end_time': slot.end_time.time(),
                'datetime_start': slot.start_time,
                'datetime_end': slot.end_time,
                'score': round(score, 2),
                'start_time_str': slot.start_time.strftime("%H:%M"),
                'end_time_str': slot.end_time.strftime("%H:%M"),
                'date_str': slot.start_time.strftime("%Y-%m-%d")
            })
        
        return scored_slots
    
    def _get_trainer_availability(self, trainer_id: int) -> List[TrainerAvailability]:
        """Get trainer's weekly availability schedule (legacy method for compatibility)"""
        availability = self.db.query(TrainerAvailability).filter(
            TrainerAvailability.trainer_id == trainer_id,
            TrainerAvailability.is_available == True
        ).all()
        
        # If no availability is set, create default availability
        if not availability:
            # Create default availability (Monday-Friday, 9 AM - 6 PM)
            default_availability = []
            for day in range(5):  # Monday to Friday
                default_availability.append(TrainerAvailability(
                    trainer_id=trainer_id,
                    day_of_week=day,
                    start_time="09:00",
                    end_time="18:00",
                    is_available=True
                ))
            
            # Add to database
            for avail in default_availability:
                self.db.add(avail)
            self.db.commit()
            
            # Refresh to get IDs
            for avail in default_availability:
                self.db.refresh(avail)
            
            availability = default_availability
        
        return availability
    
    def _get_existing_conflicts(
        self, 
        trainer_id: int, 
        start_date: datetime, 
        end_date: datetime
    ) -> List[Dict]:
        """Get existing bookings and sessions that could conflict (legacy method)"""
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
    
    def _has_conflict(
        self, 
        start_datetime: datetime, 
        end_datetime: datetime, 
        existing_conflicts: List[Dict]
    ) -> bool:
        """Check if a time slot conflicts with existing bookings/sessions (legacy method)"""
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
        booking_request: SmartBookingRequest,
        target_date: date = None
    ) -> bool:
        """Check if a time slot matches client preferences (legacy method)"""
        
        # Check avoid times (strict - these should be avoided)
        if booking_request.avoid_times:
            time_str = slot_time.strftime("%H:%M")
            if time_str in booking_request.avoid_times:
                return False
        
        # Check weekend preference
        if target_date and not booking_request.allow_weekends:
            if target_date.weekday() >= 5:  # Saturday or Sunday
                return False
        
        # Check evening preference
        if not booking_request.allow_evenings and slot_time.hour >= 18:
            return False
        
        # Note: We don't strictly filter by preferred_times here
        # Instead, we'll give bonus points in scoring for preferred times
        return True
    
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
    
    def find_optimal_schedule_across_trainers(
        self, 
        booking_request: SmartBookingRequest,
        preferred_trainer_id: Optional[int] = None
    ) -> Dict:
        """
        Greedy algorithm to find optimal schedule across all trainers
        
        This algorithm:
        1. If a trainer is specified, finds optimal slots for that trainer
        2. If no trainer specified, evaluates all trainers and finds the best overall match
        3. Uses greedy approach: prioritize highest-scoring slots first
        4. Considers trainer availability, client preferences, and optimization criteria
        """
        
        if preferred_trainer_id:
            # Find optimal slots for specific trainer
            trainer_slots = self.find_optimal_slots(booking_request, preferred_trainer_id)
            if trainer_slots:
                return {
                    'trainer_id': preferred_trainer_id,
                    'suggested_slots': trainer_slots,
                    'best_slot': trainer_slots[0] if trainer_slots else None,
                    'confidence_score': min(1.0, len(trainer_slots) / 5.0),
                    'message': f"Found {len(trainer_slots)} optimal slots with your preferred trainer"
                }
            else:
                return {
                    'trainer_id': preferred_trainer_id,
                    'suggested_slots': [],
                    'best_slot': None,
                    'confidence_score': 0.0,
                    'message': "No available slots found with your preferred trainer"
                }
        
        # Find optimal schedule across all trainers using greedy algorithm
        all_trainers = self.db.query(Trainer).filter(Trainer.is_available == True).all()
        
        if not all_trainers:
            return {
                'trainer_id': None,
                'suggested_slots': [],
                'best_slot': None,
                'confidence_score': 0.0,
                'message': "No available trainers found"
            }
        
        # Collect all possible slots from all trainers
        all_slots = []
        trainer_slot_map = {}
        
        for trainer in all_trainers:
            trainer_slots = self.find_optimal_slots(booking_request, trainer.id)
            if trainer_slots:
                # Add trainer information to each slot
                for slot in trainer_slots:
                    slot['trainer_id'] = trainer.id
                    slot['trainer_name'] = trainer.user.full_name
                    slot['trainer_specialty'] = trainer.specialty
                    slot['trainer_rating'] = trainer.rating
                    slot['trainer_price'] = trainer.price_per_session
                
                all_slots.extend(trainer_slots)
                trainer_slot_map[trainer.id] = trainer_slots
        
        if not all_slots:
            return {
                'trainer_id': None,
                'suggested_slots': [],
                'best_slot': None,
                'confidence_score': 0.0,
                'message': "No available slots found with any trainer"
            }
        
        # Apply greedy algorithm: sort by score and select best options
        sorted_slots = sorted(all_slots, key=lambda x: x['score'], reverse=True)
        
        # Take top 10 slots as suggestions
        top_slots = sorted_slots[:10]
        
        # Calculate confidence score based on number of good options and score distribution
        if top_slots:
            max_score = top_slots[0]['score']
            min_score = top_slots[-1]['score']
            score_range = max_score - min_score if max_score > min_score else 1
            confidence_score = min(1.0, (len(top_slots) / 10.0) * (score_range / 50.0))
        else:
            confidence_score = 0.0
        
        best_slot = top_slots[0] if top_slots else None
        
        # Generate message
        if best_slot:
            trainer_name = best_slot['trainer_name']
            date_str = best_slot['date_str']
            time_str = best_slot['start_time_str']
            message = f"Found {len(top_slots)} optimal options. Best match: {trainer_name} on {date_str} at {time_str}"
        else:
            message = "No optimal schedule found"
        
        return {
            'trainer_id': best_slot['trainer_id'] if best_slot else None,
            'suggested_slots': top_slots,
            'best_slot': best_slot,
            'confidence_score': confidence_score,
            'message': message,
            'total_trainers_evaluated': len(all_trainers),
            'total_slots_found': len(all_slots)
        }
    
    def greedy_schedule_optimization(
        self,
        booking_request: SmartBookingRequest,
        max_suggestions: int = 5
    ) -> Dict:
        """
        Advanced greedy scheduling optimization
        
        This algorithm implements a more sophisticated greedy approach:
        1. Scores each trainer-slot combination
        2. Considers multiple optimization criteria
        3. Applies greedy selection with tie-breaking
        4. Returns ranked suggestions
        """
        
        # Get all available trainers
        trainers = self.db.query(Trainer).filter(Trainer.is_available == True).all()
        
        if not trainers:
            return {
                'suggestions': [],
                'best_match': None,
                'optimization_score': 0.0,
                'message': "No available trainers found"
            }
        
        # Score each trainer-slot combination
        scored_combinations = []
        
        for trainer in trainers:
            # Get slots for this trainer
            trainer_slots = self.find_optimal_slots(booking_request, trainer.id)
            
            for slot in trainer_slots:
                # Calculate comprehensive score
                optimization_score = self._calculate_optimization_score(
                    slot, trainer, booking_request
                )
                
                scored_combinations.append({
                    'trainer_id': trainer.id,
                    'trainer_name': trainer.user.full_name,
                    'trainer_specialty': trainer.specialty,
                    'trainer_rating': trainer.rating,
                    'trainer_price': trainer.price_per_session,
                    'slot': slot,
                    'optimization_score': optimization_score,
                    'combined_score': slot['score'] + optimization_score
                })
        
        if not scored_combinations:
            return {
                'suggestions': [],
                'best_match': None,
                'optimization_score': 0.0,
                'message': "No suitable time slots found"
            }
        
        # Sort by combined score (greedy selection)
        scored_combinations.sort(key=lambda x: x['combined_score'], reverse=True)
        
        # Take top suggestions
        top_suggestions = scored_combinations[:max_suggestions]
        
        # Calculate overall optimization score
        if top_suggestions:
            avg_score = sum(s['combined_score'] for s in top_suggestions) / len(top_suggestions)
            max_possible_score = 100.0  # Theoretical maximum
            optimization_score = min(1.0, avg_score / max_possible_score)
        else:
            optimization_score = 0.0
        
        best_match = top_suggestions[0] if top_suggestions else None
        
        # Generate detailed message
        if best_match:
            trainer_name = best_match['trainer_name']
            slot = best_match['slot']
            date_str = slot['date_str']
            time_str = slot['start_time_str']
            message = f"Optimal schedule found with {trainer_name} on {date_str} at {time_str} (Score: {best_match['combined_score']:.1f})"
        else:
            message = "No optimal schedule found"
        
        return {
            'suggestions': top_suggestions,
            'best_match': best_match,
            'optimization_score': optimization_score,
            'message': message,
            'total_combinations_evaluated': len(scored_combinations)
        }
    
    def _calculate_optimization_score(
        self,
        slot: Dict,
        trainer: Trainer,
        booking_request: SmartBookingRequest
    ) -> float:
        """
        Calculate optimization score for a trainer-slot combination
        
        This considers:
        - Trainer rating and experience
        - Price competitiveness
        - Time convenience
        - Specialty match
        - Availability flexibility
        """
        score = 0.0
        
        # Trainer rating score (0-20 points)
        if trainer.rating:
            score += (trainer.rating / 5.0) * 20.0
        
        # Price competitiveness (0-15 points)
        # Lower price gets higher score (assuming price is reasonable)
        if trainer.price_per_session:
            # Normalize price score (lower is better)
            price_score = max(0, 15 - (trainer.price_per_session / 10))
            score += price_score
        
        # Time convenience score (0-25 points)
        hour = slot['start_time'].hour
        if 9 <= hour <= 11:  # Morning slots
            score += 25.0
        elif 14 <= hour <= 16:  # Afternoon slots
            score += 20.0
        elif 17 <= hour <= 19:  # Evening slots
            score += 15.0
        else:
            score += 10.0
        
        # Specialty match score (0-20 points)
        # This would need to be enhanced based on client preferences
        # For now, give all trainers equal score
        score += 15.0
        
        # Availability flexibility (0-20 points)
        # More available trainers get higher score
        trainer_availability = self._get_trainer_availability(trainer.id)
        availability_hours = sum([
            (datetime.strptime(avail.end_time, "%H:%M") - 
             datetime.strptime(avail.start_time, "%H:%M")).total_seconds() / 3600
            for avail in trainer_availability
        ])
        
        # More hours = higher flexibility score
        flexibility_score = min(20.0, availability_hours * 2)
        score += flexibility_score
        
        return round(score, 2)
