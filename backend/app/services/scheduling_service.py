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
        # First, try to find exact duration matches
        exact_slots = self.db.query(TimeSlot).filter(
            TimeSlot.trainer_id == trainer_id,
            TimeSlot.start_time >= start_date,
            TimeSlot.start_time <= end_date,
            TimeSlot.is_available == True,
            TimeSlot.is_booked == False,
            TimeSlot.duration_minutes == duration_minutes
        ).order_by(TimeSlot.start_time).all()
        
        if exact_slots:
            return exact_slots
        
        # If no exact matches, try to combine consecutive 60-minute slots
        if duration_minutes > 60:
            return self._get_combined_time_slots(
                trainer_id, start_date, end_date, duration_minutes
            )
        
        # For 60-minute requests, get 60-minute slots
        return self.db.query(TimeSlot).filter(
            TimeSlot.trainer_id == trainer_id,
            TimeSlot.start_time >= start_date,
            TimeSlot.start_time <= end_date,
            TimeSlot.is_available == True,
            TimeSlot.is_booked == False,
            TimeSlot.duration_minutes == 60
        ).order_by(TimeSlot.start_time).all()
    
    def _get_combined_time_slots(
        self,
        trainer_id: int,
        start_date: datetime,
        end_date: datetime,
        duration_minutes: int
    ) -> List[Dict]:
        """Find consecutive 60-minute slots that can be combined for longer duration"""
        # Get all available 60-minute slots
        base_slots = self.db.query(TimeSlot).filter(
            TimeSlot.trainer_id == trainer_id,
            TimeSlot.start_time >= start_date,
            TimeSlot.start_time <= end_date,
            TimeSlot.is_available == True,
            TimeSlot.is_booked == False,
            TimeSlot.duration_minutes == 60
        ).order_by(TimeSlot.start_time).all()
        
        if not base_slots:
            return []
        
        # Calculate how many 60-minute slots we need
        slots_needed = duration_minutes // 60
        
        combined_slots = []
        used_slot_ids = set()
        
        for i, start_slot in enumerate(base_slots):
            if start_slot.id in used_slot_ids:
                continue
                
            # Check if we can find consecutive slots starting from this one
            consecutive_slots = [start_slot]
            current_time = start_slot.end_time
            
            for j in range(i + 1, len(base_slots)):
                next_slot = base_slots[j]
                
                # Skip if this slot is already used
                if next_slot.id in used_slot_ids:
                    continue
                
                # Check if this slot starts exactly when the previous one ends
                if next_slot.start_time == current_time:
                    consecutive_slots.append(next_slot)
                    current_time = next_slot.end_time
                    
                    # If we have enough consecutive slots, create a combined slot entry
                    if len(consecutive_slots) == slots_needed:
                        # Create a combined slot entry (not a TimeSlot object)
                        combined_slot = {
                            'slot_id': start_slot.id,  # Use the first slot's ID
                            'start_slot_id': start_slot.id,
                            'end_slot_id': next_slot.id,
                            'start_time': start_slot.start_time,
                            'end_time': next_slot.end_time,
                            'duration_minutes': duration_minutes,
                            'is_available': True,
                            'is_booked': False,
                            'is_combined': True,
                            'component_slots': [slot.id for slot in consecutive_slots]
                        }
                        combined_slots.append(combined_slot)
                        
                        # Mark all used slots
                        for slot in consecutive_slots:
                            used_slot_ids.add(slot.id)
                        break
                else:
                    # Gap found, can't continue this sequence
                    break
        
        return combined_slots
    
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
        time_slots, 
        booking_request: SmartBookingRequest
    ) -> List[Dict]:
        """
        Score time slots based on optimization criteria
        
        Scoring is designed to scale from 0-100, where:
        - 90-100: Perfect match (preferred time, date, and all criteria met)
        - 70-89: Great match (most criteria met)
        - 50-69: Good match (some criteria met)
        - 30-49: Fair match (basic availability)
        - 0-29: Poor match
        """
        scored_slots = []
        
        for slot in time_slots:
            score = 0.0
            
            # Handle both TimeSlot objects and combined slot dictionaries
            if isinstance(slot, dict):
                # Combined slot
                start_time = slot['start_time']
                end_time = slot['end_time']
                slot_id = slot['slot_id']
                is_combined = slot.get('is_combined', False)
            else:
                # Regular TimeSlot object
                start_time = slot.start_time
                end_time = slot.end_time
                slot_id = slot.id
                is_combined = False
            
            # Base score for availability (0-20 points)
            score += 20.0
            
            # Time preference scoring (0-40 points) - HIGHEST WEIGHT
            if booking_request.preferred_times:
                time_str = start_time.strftime("%H:%M")
                if time_str in booking_request.preferred_times:
                    score += 40.0  # Perfect match for preferred time
                else:
                    # Check if close to preferred times (within 1 hour)
                    hour = start_time.hour
                    minute = start_time.minute
                    is_close_to_preferred = False
                    for pref_time in booking_request.preferred_times:
                        try:
                            pref_hour, pref_minute = map(int, pref_time.split(':'))
                            time_diff_minutes = abs((hour * 60 + minute) - (pref_hour * 60 + pref_minute))
                            if time_diff_minutes <= 60:  # Within 1 hour
                                score += 20.0
                                is_close_to_preferred = True
                                break
                        except:
                            pass
                    
                    if not is_close_to_preferred:
                        score += 5.0   # Small bonus for any available time
            else:
                # No preferred times specified, give moderate score
                score += 20.0
            
            # Convenience scoring - time of day (0-20 points)
            hour = start_time.hour
            if 9 <= hour <= 11:  # Morning slots (peak convenience)
                score += 20.0
            elif 14 <= hour <= 16:  # Afternoon slots
                score += 18.0
            elif 17 <= hour <= 19:  # Evening slots
                score += 15.0
            elif 7 <= hour <= 9 or 11 <= hour <= 14:  # Early morning or midday
                score += 12.0
            else:  # Late evening or very early
                score += 8.0
            
            # Day of week scoring (0-10 points)
            weekday = start_time.weekday()
            if weekday < 5:  # Weekday
                score += 10.0
            elif booking_request.allow_weekends:
                score += 8.0  # Weekend with permission
            else:
                score += 3.0  # Weekend not preferred but available
            
            # Duration optimization (0-5 points)
            if booking_request.duration_minutes == 60:
                score += 5.0  # Standard 1-hour sessions
            elif booking_request.duration_minutes == 120:
                score += 4.0  # 2-hour sessions
            else:
                score += 2.0  # Other durations
            
            # Bonus for combined slots (0-5 points)
            if is_combined:
                score += 5.0  # Higher bonus for successfully combining slots
            
            # Enhanced optimization scoring (0-25 points total)
            enhanced_score = self._calculate_enhanced_score(slot, booking_request)
            score += enhanced_score
            
            # Ensure score doesn't exceed 125 (100 + 25 enhanced)
            score = min(125.0, score)
            
            # Convert score to priority level
            priority = self._calculate_priority_level(score)
            
            scored_slot = {
                'slot_id': slot_id,
                'date': start_time.date(),
                'start_time': start_time.time(),
                'end_time': end_time.time(),
                'datetime_start': start_time,
                'datetime_end': end_time,
                'score': round(score, 2),  # Keep for internal use
                'priority': priority,  # User-friendly priority level
                'start_time_str': start_time.strftime("%H:%M"),
                'end_time_str': end_time.strftime("%H:%M"),
                'date_str': start_time.strftime("%Y-%m-%d")
            }
            
            # Add combined slot information if applicable
            if isinstance(slot, dict) and is_combined:
                scored_slot['is_combined'] = True
                scored_slot['component_slots'] = slot.get('component_slots', [])
                scored_slot['start_slot_id'] = slot.get('start_slot_id')
                scored_slot['end_slot_id'] = slot.get('end_slot_id')
            
            scored_slots.append(scored_slot)
        
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
                    slot['trainer_price'] = trainer.price_per_hour if trainer.price_per_hour > 0 else trainer.price_per_session
                
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
                    'trainer_price': trainer.price_per_hour if trainer.price_per_hour > 0 else trainer.price_per_session,
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
    
    async def get_available_time_slots(
        self,
        trainer_id: int,
        date: datetime,
        duration_minutes: int = 60
    ) -> List[Dict]:
        """
        Get available time slots for a trainer on a specific date
        This is the new time-based booking system
        """
        # Validate duration
        if duration_minutes not in [60, 120]:
            raise ValueError("Duration must be 60 or 120 minutes")
        
        # Get trainer's availability for the day
        day_of_week = date.weekday()
        trainer_availability = self.db.query(TrainerAvailability).filter(
            TrainerAvailability.trainer_id == trainer_id,
            TrainerAvailability.day_of_week == day_of_week,
            TrainerAvailability.is_available == True
        ).first()
        
        if not trainer_availability:
            return []  # Trainer not available on this day
        
        # Parse availability times
        start_time_str = trainer_availability.start_time
        end_time_str = trainer_availability.end_time
        
        # Convert to datetime objects for the specific date
        start_datetime = datetime.combine(date.date(), datetime.strptime(start_time_str, "%H:%M").time())
        end_datetime = datetime.combine(date.date(), datetime.strptime(end_time_str, "%H:%M").time())
        
        # Generate 30-minute slots within availability window
        available_slots = []
        current_time = start_datetime
        
        while current_time + timedelta(minutes=duration_minutes) <= end_datetime:
            slot_end_time = current_time + timedelta(minutes=duration_minutes)
            
            # Check if this slot conflicts with existing bookings
            if not self._has_time_slot_conflict(trainer_id, current_time, slot_end_time):
                available_slots.append({
                    'start_time': current_time,
                    'end_time': slot_end_time,
                    'duration_minutes': duration_minutes,
                    'is_available': True
                })
            
            # Move to next 30-minute slot
            current_time += timedelta(minutes=30)
        
        return available_slots
    
    def _has_time_slot_conflict(
        self,
        trainer_id: int,
        start_time: datetime,
        end_time: datetime
    ) -> bool:
        """Check if a time slot conflicts with existing bookings or sessions"""
        
        # Check for existing bookings
        conflicting_bookings = self.db.query(Booking).filter(
            Booking.trainer_id == trainer_id,
            Booking.status.in_(['pending', 'confirmed']),
            Booking.start_time < end_time,
            Booking.end_time > start_time
        ).count()
        
        if conflicting_bookings > 0:
            return True
        
        # Check for existing sessions
        conflicting_sessions = self.db.query(Session).filter(
            Session.trainer_id == trainer_id,
            Session.status.in_(['pending', 'confirmed']),
            Session.scheduled_date < end_time,
            Session.scheduled_date + timedelta(minutes=Session.duration_minutes) > start_time
        ).count()
        
        if conflicting_sessions > 0:
            return True
        
        return False
    
    def create_time_based_booking(
        self,
        client_id: int,
        trainer_id: int,
        start_time: datetime,
        end_time: datetime,
        training_type: str,
        location_type: str = "gym",
        location_address: str = None,
        special_requests: str = None
    ) -> Dict:
        """
        Create a time-based booking
        """
        # Validate session duration
        duration_minutes = (end_time - start_time).total_seconds() / 60
        if duration_minutes not in [60, 120]:
            raise ValueError("Session duration must be 60 or 120 minutes")
        
        # Check for conflicts
        if self._has_time_slot_conflict(trainer_id, start_time, end_time):
            raise ValueError("Time slot conflicts with existing booking")
        
        # Get trainer for pricing
        trainer = self.db.query(Trainer).filter(Trainer.id == trainer_id).first()
        if not trainer:
            raise ValueError("Trainer not found")
        
        if trainer.profile_completion_status != ProfileCompletionStatus.COMPLETE:
            raise ValueError("Trainer profile is not complete")
        
        # Calculate pricing
        total_hours = duration_minutes / 60
        base_cost = trainer.price_per_hour * total_hours
        
        # Add location surcharge if needed
        location_surcharge = 0.0
        if location_type == "home":
            location_surcharge = 10.0  # $10 surcharge for home training
        
        total_cost = base_cost + location_surcharge
        
        # Create booking
        booking = Booking(
            client_id=client_id,
            trainer_id=trainer_id,
            start_time=start_time,
            end_time=end_time,
            training_type=training_type,
            price_per_hour=trainer.price_per_hour,
            total_cost=total_cost,
            location_type=location_type,
            location_address=location_address,
            special_requests=special_requests,
            status='pending',
            duration_minutes=int(duration_minutes)
        )
        
        self.db.add(booking)
        self.db.commit()
        self.db.refresh(booking)
        
        return {
            'booking_id': booking.id,
            'start_time': start_time,
            'end_time': end_time,
            'duration_minutes': int(duration_minutes),
            'total_cost': total_cost,
            'status': 'pending',
            'message': 'Booking created successfully'
        }
    
    def _calculate_enhanced_score(self, slot, booking_request) -> float:
        """
        Calculate enhanced optimization score based on new parameters
        Returns score between 0-25 points
        
        Budget optimization only applies when browsing ALL trainers (no specific trainer selected)
        """
        enhanced_score = 0.0
        
        # Get trainer info if available (we'll need to modify the calling method)
        trainer_info = getattr(slot, 'trainer_info', None)
        
        # Budget optimization (0-8 points) - ONLY when browsing all trainers
        if (booking_request.max_budget_per_session and 
            trainer_info and 
            not booking_request.trainer_id):  # No specific trainer selected
            
            session_cost = self._calculate_session_cost(slot, trainer_info)
            if session_cost <= booking_request.max_budget_per_session:
                budget_ratio = session_cost / booking_request.max_budget_per_session
                if budget_ratio <= 0.7:  # Under 70% of budget
                    enhanced_score += 8.0
                elif budget_ratio <= 0.9:  # Under 90% of budget
                    enhanced_score += 6.0
                else:  # Close to budget limit
                    enhanced_score += 4.0
            else:  # Over budget
                enhanced_score -= 5.0  # Penalty for over budget
        
        # Price sensitivity scoring (0-5 points) - ONLY when browsing all trainers
        if (trainer_info and 
            hasattr(trainer_info, 'price_per_hour') and 
            not booking_request.trainer_id):  # No specific trainer selected
            
            price_score = self._calculate_price_sensitivity_score(
                trainer_info.price_per_hour, 
                booking_request.price_sensitivity
            )
            enhanced_score += price_score
        
        # Trainer experience matching (0-4 points)
        if trainer_info and booking_request.trainer_experience_min:
            if hasattr(trainer_info, 'experience_years') and trainer_info.experience_years >= booking_request.trainer_experience_min:
                experience_bonus = min(4.0, trainer_info.experience_years * 0.2)
                enhanced_score += experience_bonus
            else:
                enhanced_score -= 2.0  # Penalty for insufficient experience
        
        # Trainer rating matching (0-3 points)
        if trainer_info and booking_request.trainer_rating_min:
            if hasattr(trainer_info, 'rating') and trainer_info.rating >= booking_request.trainer_rating_min:
                rating_bonus = (trainer_info.rating / 5.0) * 3.0
                enhanced_score += rating_bonus
            else:
                enhanced_score -= 1.0  # Penalty for low rating
        
        # Session intensity matching (0-3 points)
        intensity_score = self._calculate_intensity_score(slot, booking_request.session_intensity)
        enhanced_score += intensity_score
        
        # Equipment preference matching (0-2 points)
        if trainer_info and booking_request.equipment_preference:
            equipment_score = self._calculate_equipment_score(trainer_info, booking_request.equipment_preference)
            enhanced_score += equipment_score
        
        return max(0.0, min(25.0, enhanced_score))  # Cap between 0-25 points
    
    def _calculate_session_cost(self, slot, trainer_info) -> float:
        """Calculate total session cost"""
        duration_hours = slot.duration_minutes / 60.0 if hasattr(slot, 'duration_minutes') else 1.0
        return trainer_info.price_per_hour * duration_hours
    
    def _calculate_price_sensitivity_score(self, trainer_price: float, sensitivity: int) -> float:
        """Calculate price sensitivity score (0-5 points)"""
        if sensitivity <= 3:  # Very price sensitive
            return max(0, 5 - (trainer_price / 20))  # Prefer cheaper trainers
        elif sensitivity <= 6:  # Moderately price sensitive
            return 2.5  # Neutral scoring
        else:  # Not price sensitive
            return 4.0  # Slight preference for higher-end trainers
    
    def _calculate_intensity_score(self, slot, session_intensity: str) -> float:
        """Calculate session intensity score (0-3 points)"""
        hour = slot.start_time.hour if hasattr(slot, 'start_time') else 12
        
        if session_intensity == 'light':
            # Prefer morning or late afternoon for light sessions
            if 9 <= hour <= 11 or 15 <= hour <= 17:
                return 3.0
            elif 7 <= hour <= 9 or 17 <= hour <= 19:
                return 2.0
            else:
                return 1.0
        elif session_intensity == 'intense':
            # Prefer morning or early evening for intense sessions
            if 7 <= hour <= 9 or 17 <= hour <= 19:
                return 3.0
            elif 9 <= hour <= 11 or 15 <= hour <= 17:
                return 2.0
            else:
                return 1.0
        else:  # moderate
            return 2.0  # Neutral scoring for moderate intensity
    
    def _calculate_equipment_score(self, trainer_info, equipment_preference: str) -> float:
        """Calculate equipment preference score (0-2 points)"""
        if equipment_preference == 'gym':
            # Prefer trainers with gym access
            if hasattr(trainer_info, 'gym_name') and trainer_info.gym_name:
                return 2.0
            else:
                return 1.0
        elif equipment_preference == 'minimal':
            # Prefer trainers who can work with minimal equipment
            return 1.5  # Most trainers can adapt
        else:  # none
            # Prefer trainers who can do bodyweight exercises
            return 1.0
    
    def _calculate_priority_level(self, score: float) -> str:
        """
        Convert numerical score to user-friendly priority level
        
        Scoring ranges:
        - High Priority: 90-125 points (Excellent match)
        - Medium Priority: 60-89 points (Good match)
        - Low Priority: 0-59 points (Basic availability)
        """
        if score >= 90:
            return "High Priority"
        elif score >= 60:
            return "Medium Priority"
        else:
            return "Low Priority"