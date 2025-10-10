"""
Robust Client Preference Scoring System (W_C Score)

This module implements the client preference match scoring algorithm
for optimal time slot selection in the booking system.
"""
from datetime import datetime, time, timedelta
from typing import Dict, List, Optional, Tuple
import json
import logging

from app.models import BookingRequest, TimeSlot

logger = logging.getLogger(__name__)

# Define standard time buckets for classification
TIME_BUCKETS = {
    'early_morning': (time(5, 0), time(8, 0)),   # 5 AM - 8 AM
    'morning': (time(8, 0), time(12, 0)),         # 8 AM - 12 PM
    'lunch': (time(12, 0), time(14, 0)),          # 12 PM - 2 PM
    'afternoon': (time(14, 0), time(17, 0)),      # 2 PM - 5 PM
    'evening': (time(17, 0), time(21, 0)),        # 5 PM - 9 PM
    'night': (time(21, 0), time(23, 59)),         # 9 PM - Midnight
}

# Score weights and limits
MAX_DATE_SCORE = 50
MAX_TIME_SCORE = 40
MAX_WEEKEND_EVENING_BONUS = 10
AVOID_TIME_PENALTY = -50
MIN_ACCEPTABLE_SCORE = 0  # Scores below this trigger manual review


class ScoringService:
    """Service for calculating client preference match scores"""
    
    @staticmethod
    def calculate_client_match_score(
        booking_request: BookingRequest,
        time_slot: TimeSlot,
        additional_slots: Optional[List[TimeSlot]] = None
    ) -> Dict:
        """
        Calculate the W_C (Client Match) score for a time slot
        
        Args:
            booking_request: The booking request with client preferences
            time_slot: The primary time slot being evaluated
            additional_slots: Additional consecutive slots (for multi-slot bookings)
            
        Returns:
            Dictionary containing:
            - total_score: Final W_C score
            - breakdown: Component scores for debugging
            - requires_manual_review: Boolean flag if score is too low
        """
        try:
            # Initialize score breakdown
            breakdown = {
                'date_match': 0,
                'time_of_day_match': 0,
                'weekend_evening_bonus': 0,
                'avoid_time_penalty': 0
            }
            
            # Component 1: Date Match Score (Max 50 points)
            date_score = ScoringService._calculate_date_match_score(
                booking_request, time_slot
            )
            breakdown['date_match'] = date_score
            
            # Component 2: Time of Day Match Score (Max 40 points or -50 penalty)
            time_score, avoid_penalty = ScoringService._calculate_time_match_score(
                booking_request, time_slot, additional_slots
            )
            breakdown['time_of_day_match'] = time_score
            breakdown['avoid_time_penalty'] = avoid_penalty
            
            # Component 3: Weekend/Evening Bonus (Max 10 points)
            bonus_score = ScoringService._calculate_weekend_evening_bonus(
                booking_request, time_slot
            )
            breakdown['weekend_evening_bonus'] = bonus_score
            
            # Calculate total score
            total_score = (
                breakdown['date_match'] +
                breakdown['time_of_day_match'] +
                breakdown['avoid_time_penalty'] +
                breakdown['weekend_evening_bonus']
            )
            
            # Determine if manual review is required
            requires_manual_review = total_score < MIN_ACCEPTABLE_SCORE
            
            if requires_manual_review:
                logger.warning(
                    f"Low W_C score detected for BookingRequest {booking_request.id} "
                    f"and TimeSlot {time_slot.id}: Score={total_score}. "
                    f"Manual review recommended. Breakdown: {breakdown}"
                )
            
            return {
                'total_score': total_score,
                'breakdown': breakdown,
                'requires_manual_review': requires_manual_review,
                'slot_id': time_slot.id,
                'slot_start': time_slot.start_time.isoformat()
            }
            
        except Exception as e:
            logger.error(
                f"Error calculating W_C score for BookingRequest {booking_request.id} "
                f"and TimeSlot {time_slot.id}: {str(e)}",
                exc_info=True
            )
            # Return a zero score with manual review flag on error
            return {
                'total_score': 0,
                'breakdown': {},
                'requires_manual_review': True,
                'error': str(e)
            }
    
    @staticmethod
    def _calculate_date_match_score(
        booking_request: BookingRequest,
        time_slot: TimeSlot
    ) -> int:
        """
        Calculate date proximity score (Max 50 points)
        
        Logic:
        - If slot is within preferred date range: score based on proximity to preferred_start_date
        - Closer to preferred_start_date = higher score
        - Outside date range = 0 points
        """
        slot_date = time_slot.start_time.date()
        
        # Check if we have date preferences
        if not booking_request.preferred_start_date or not booking_request.preferred_end_date:
            # No preference specified, give neutral score
            return 25
        
        pref_start = booking_request.preferred_start_date.date()
        pref_end = booking_request.preferred_end_date.date()
        
        # Check if slot is within the preferred date range
        if slot_date < pref_start or slot_date > pref_end:
            return 0
        
        # Calculate days from preferred start date
        days_from_start = (slot_date - pref_start).days
        total_range_days = (pref_end - pref_start).days
        
        if total_range_days == 0:
            # Single day preference, exact match
            return MAX_DATE_SCORE
        
        # Linear decay: closer to preferred start = higher score
        # Formula: MAX_DATE_SCORE * (1 - days_from_start / total_range_days)
        score = int(MAX_DATE_SCORE * (1 - (days_from_start / total_range_days)))
        return max(0, min(MAX_DATE_SCORE, score))
    
    @staticmethod
    def _calculate_time_match_score(
        booking_request: BookingRequest,
        time_slot: TimeSlot,
        additional_slots: Optional[List[TimeSlot]] = None
    ) -> Tuple[int, int]:
        """
        Calculate time of day match score and avoid time penalty
        
        Returns:
            Tuple of (time_match_score, avoid_penalty)
            - time_match_score: 0 to MAX_TIME_SCORE points
            - avoid_penalty: 0 or AVOID_TIME_PENALTY points
        """
        # Parse preferred times from JSON
        preferred_times = []
        if booking_request.preferred_times:
            try:
                if isinstance(booking_request.preferred_times, str):
                    preferred_times = json.loads(booking_request.preferred_times)
                else:
                    preferred_times = booking_request.preferred_times
            except (json.JSONDecodeError, TypeError):
                logger.warning(
                    f"Failed to parse preferred_times for BookingRequest {booking_request.id}"
                )
        
        # Parse avoid times from JSON
        avoid_times = []
        if booking_request.avoid_times:
            try:
                if isinstance(booking_request.avoid_times, str):
                    avoid_times = json.loads(booking_request.avoid_times)
                else:
                    avoid_times = booking_request.avoid_times
            except (json.JSONDecodeError, TypeError):
                logger.warning(
                    f"Failed to parse avoid_times for BookingRequest {booking_request.id}"
                )
        
        # Collect all slots to check (primary + additional for multi-slot bookings)
        all_slots = [time_slot]
        if additional_slots:
            all_slots.extend(additional_slots)
        
        # Check for avoid time conflicts (any overlap = penalty)
        avoid_penalty = 0
        for slot in all_slots:
            if ScoringService._check_time_overlap(slot, avoid_times):
                avoid_penalty = AVOID_TIME_PENALTY
                logger.info(
                    f"Avoid time penalty applied for slot {slot.id} "
                    f"(starts at {slot.start_time.time()})"
                )
                break  # One penalty is enough
        
        # Check for preferred time matches
        time_match_score = 0
        if preferred_times:
            # Check if primary slot matches preferred times
            if ScoringService._check_time_overlap(time_slot, preferred_times):
                time_match_score = MAX_TIME_SCORE
                logger.debug(
                    f"Preferred time match for slot {time_slot.id} "
                    f"(starts at {time_slot.start_time.time()})"
                )
        else:
            # No preferred times specified, give neutral score
            time_match_score = MAX_TIME_SCORE // 2  # 20 points
        
        return time_match_score, avoid_penalty
    
    @staticmethod
    def _check_time_overlap(
        time_slot: TimeSlot,
        time_blocks: List[str]
    ) -> bool:
        """
        Check if a time slot overlaps with any of the given time blocks
        
        Args:
            time_slot: The time slot to check
            time_blocks: List of time strings (e.g., ["09:00-12:00", "14:00-17:00"])
        
        Returns:
            True if there's any overlap, False otherwise
        """
        slot_start = time_slot.start_time.time()
        slot_end = time_slot.end_time.time()
        
        for block in time_blocks:
            try:
                # Parse time block (format: "HH:MM-HH:MM" or "HH:MM")
                if '-' in block:
                    start_str, end_str = block.split('-')
                    block_start = datetime.strptime(start_str.strip(), "%H:%M").time()
                    block_end = datetime.strptime(end_str.strip(), "%H:%M").time()
                else:
                    # Single time point, check if slot starts at this time
                    block_time = datetime.strptime(block.strip(), "%H:%M").time()
                    if slot_start <= block_time < slot_end:
                        return True
                    continue
                
                # Check for overlap: slot overlaps block if:
                # slot_start < block_end AND slot_end > block_start
                if slot_start < block_end and slot_end > block_start:
                    return True
                    
            except (ValueError, AttributeError) as e:
                logger.warning(f"Failed to parse time block '{block}': {e}")
                continue
        
        return False
    
    @staticmethod
    def _calculate_weekend_evening_bonus(
        booking_request: BookingRequest,
        time_slot: TimeSlot
    ) -> int:
        """
        Calculate weekend/evening bonus score (Max 10 points)
        
        Logic:
        - If request allows weekends AND slot is on weekend: +5 points
        - If request allows evenings AND slot is in evening: +5 points
        """
        bonus = 0
        
        slot_datetime = time_slot.start_time
        slot_time = slot_datetime.time()
        slot_weekday = slot_datetime.weekday()  # 0=Monday, 6=Sunday
        
        # Weekend bonus (Saturday=5, Sunday=6)
        if booking_request.allow_weekends and slot_weekday >= 5:
            bonus += 5
            logger.debug(f"Weekend bonus applied for slot {time_slot.id}")
        
        # Evening bonus (5 PM - 9 PM)
        evening_start, evening_end = TIME_BUCKETS['evening']
        if booking_request.allow_evenings and evening_start <= slot_time < evening_end:
            bonus += 5
            logger.debug(f"Evening bonus applied for slot {time_slot.id}")
        
        return min(MAX_WEEKEND_EVENING_BONUS, bonus)
    
    @staticmethod
    def rank_time_slots(
        booking_request: BookingRequest,
        available_slots: List[TimeSlot],
        duration_minutes: int
    ) -> List[Dict]:
        """
        Rank all available time slots by W_C score
        
        Args:
            booking_request: The booking request with preferences
            available_slots: List of available time slots
            duration_minutes: Required session duration
            
        Returns:
            List of scored slots, sorted by total_score (highest first)
        """
        scored_slots = []
        
        # If session is longer than 60 minutes, we need consecutive slots
        slots_needed = duration_minutes // 60
        
        if slots_needed == 1:
            # Single slot bookings
            for slot in available_slots:
                score_result = ScoringService.calculate_client_match_score(
                    booking_request, slot
                )
                scored_slots.append(score_result)
        else:
            # Multi-slot bookings - find consecutive slots
            for i in range(len(available_slots) - slots_needed + 1):
                base_slot = available_slots[i]
                consecutive_slots = [base_slot]
                
                # Check for consecutive slots
                for j in range(1, slots_needed):
                    next_slot = available_slots[i + j]
                    prev_slot = consecutive_slots[-1]
                    
                    # Verify slots are consecutive (end of prev = start of next)
                    if next_slot.start_time == prev_slot.end_time:
                        consecutive_slots.append(next_slot)
                    else:
                        break  # Gap found, not consecutive
                
                # Only score if we found enough consecutive slots
                if len(consecutive_slots) == slots_needed:
                    additional_slots = consecutive_slots[1:] if len(consecutive_slots) > 1 else None
                    score_result = ScoringService.calculate_client_match_score(
                        booking_request, base_slot, additional_slots
                    )
                    score_result['consecutive_slot_ids'] = [s.id for s in consecutive_slots]
                    scored_slots.append(score_result)
        
        # Sort by total_score (highest first)
        scored_slots.sort(key=lambda x: x['total_score'], reverse=True)
        
        logger.info(
            f"Ranked {len(scored_slots)} slot options for BookingRequest {booking_request.id}. "
            f"Top score: {scored_slots[0]['total_score'] if scored_slots else 'N/A'}"
        )
        
        return scored_slots

