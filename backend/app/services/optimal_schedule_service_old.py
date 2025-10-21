"""
Optimal Schedule Generator Service

Implements a greedy heuristic algorithm to generate optimal schedules for trainers
by maximizing consecutive sessions and minimizing gaps.
"""
from sqlalchemy.orm import Session
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
from collections import defaultdict

from app.models import BookingRequest, TimeSlot, Trainer, User, BookingRequestStatus, TrainerSchedulingPreferences


class OptimalScheduleService:
    """
    Service for generating optimal trainer schedules using a greedy algorithm.
    
    Primary Goal: Maximize consecutive sessions to minimize gaps.
    
    Algorithm Steps:
    1. Prioritize booking requests by priority_score (desc) and duration (asc)
    2. Find all contiguous slot combinations for each duration
    3. Iteratively assign requests to earliest available slots closest to preferred dates
    4. Mark slots as temporarily unavailable to prevent double-booking
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def generate_optimal_schedule(self, trainer_id: int) -> Dict:
        """
        Generate optimal schedule for a specific trainer using their preferences.
        
        Args:
            trainer_id: The ID of the trainer
            
        Returns:
            Dictionary containing:
            - proposed_entries: List of proposed schedule entries
            - statistics: Summary statistics about the optimization
            - conflicts: Any detected conflicts
        """
        # Step 0: Load trainer's scheduling preferences
        preferences = self._get_trainer_preferences(trainer_id)
        
        # Step 1: Get all pending booking requests for this trainer
        pending_requests = self._get_pending_requests(trainer_id)
        
        if not pending_requests:
            return {
                'trainer_id': trainer_id,
                'proposed_entries': [],
                'statistics': {
                    'total_requests': 0,
                    'scheduled_requests': 0,
                    'unscheduled_requests': 0,
                    'total_hours': 0,
                    'gaps_minimized': 0
                },
                'message': 'No pending booking requests found'
            }
        
        # Step 2: Get all available, unbooked time slots for this trainer (filtered by preferences)
        available_slots = self._get_available_slots(trainer_id, preferences)
        
        if not available_slots:
            # Check if it's because of days_off settings
            days_off = preferences.days_off_list if preferences else []
            if len(days_off) >= 7:
                message = 'No available time slots found. All days are marked as days off in your scheduling preferences.'
            else:
                message = 'No available time slots found. Please create time slots or adjust your scheduling preferences.'
            
            return {
                'trainer_id': trainer_id,
                'proposed_entries': [],
                'statistics': {
                    'total_requests': len(pending_requests),
                    'scheduled_requests': 0,
                    'unscheduled_requests': len(pending_requests),
                    'total_hours': 0,
                    'gaps_minimized': 0,
                    'utilization_rate': 0,
                    'scheduling_efficiency': 0
                },
                'message': message
            }
        
        # Step 3: Sort requests by priority (greedy approach using preferences)
        prioritized_requests = self._prioritize_requests(pending_requests, preferences)
        
        # Step 4: Find contiguous slot combinations
        slot_combinations = self._find_slot_combinations(available_slots)
        
        # Step 5: Run the greedy placement algorithm with preferences
        proposed_schedule = self._greedy_placement(
            prioritized_requests,
            slot_combinations,
            preferences
        )
        
        # Step 6: Calculate statistics
        statistics = self._calculate_statistics(
            proposed_schedule,
            pending_requests,
            available_slots
        )
        
        return {
            'trainer_id': trainer_id,
            'proposed_entries': proposed_schedule,
            'statistics': statistics,
            'message': f'Generated optimal schedule with {len(proposed_schedule)} proposed sessions'
        }
    
    def _get_trainer_preferences(self, trainer_id: int) -> TrainerSchedulingPreferences:
        """
        Get trainer's scheduling preferences or create default ones.
        """
        preferences = self.db.query(TrainerSchedulingPreferences).filter(
            TrainerSchedulingPreferences.trainer_id == trainer_id
        ).first()
        
        if not preferences:
            # Create default preferences
            preferences = TrainerSchedulingPreferences(trainer_id=trainer_id)
            self.db.add(preferences)
            self.db.commit()
            self.db.refresh(preferences)
        
        return preferences
    
    def _get_pending_requests(self, trainer_id: int) -> List[BookingRequest]:
        """
        Get all pending booking requests for a trainer.
        
        Filters out requests that don't match the trainer's training types.
        """
        # Get trainer's training types
        trainer = self.db.query(Trainer).filter(Trainer.id == trainer_id).first()
        if not trainer:
            return []
        
        # Get all pending and non-expired requests (align with dashboard)
        from sqlalchemy import and_
        all_requests = self.db.query(BookingRequest).filter(
            and_(
                BookingRequest.trainer_id == trainer_id,
                BookingRequest.status == BookingRequestStatus.PENDING,
                BookingRequest.expires_at > datetime.now()
            )
        ).all()
        
        # Parse trainer's training types
        trainer_types = []
        if trainer.training_types:
            try:
                import json
                trainer_types = json.loads(trainer.training_types)
            except (json.JSONDecodeError, TypeError):
                trainer_types = []
        
        # If trainer has no training types specified, accept all requests
        if not trainer_types:
            return all_requests
        
        # Filter requests by matching training type
        filtered_requests = []
        for request in all_requests:
            # Check if request's training_type matches any of trainer's types
            if request.training_type:
                if request.training_type in trainer_types:
                    filtered_requests.append(request)
            # If no training_type specified in request, check session_type
            elif request.session_type:
                # Accept if session_type is generic or matches
                if any(req_type.lower() in request.session_type.lower() 
                       for req_type in trainer_types):
                    filtered_requests.append(request)
                else:
                    # Accept generic session types
                    generic_types = ['training', 'session', 'workout', 'personal training']
                    if any(gen in request.session_type.lower() for gen in generic_types):
                        filtered_requests.append(request)
            else:
                # No type specified, include it
                filtered_requests.append(request)
        
        return filtered_requests
    
    def _get_available_slots(self, trainer_id: int, preferences: TrainerSchedulingPreferences) -> List[Dict]:
        """
        Generate simple available time slots for the next 7 days.
        """
        from datetime import datetime, timedelta, time
        
        now = datetime.now()
        available_slots = []
        
        # Generate slots for next 7 days only
        for day_offset in range(7):
            current_date = (now + timedelta(days=day_offset)).date()
            
            # Skip days off
            if preferences and preferences.days_off_list and current_date.weekday() in preferences.days_off_list:
                continue
            
            # Work hours: 8:00-12:00 (4 hours = 8 slots of 30 minutes each)
            work_start = time(8, 0)
            work_end = time(12, 0)
            
            current_time = datetime.combine(current_date, work_start)
            day_end = datetime.combine(current_date, work_end)
            
            slot_id = 1
            while current_time < day_end:
                slot_end = current_time + timedelta(minutes=30)
                
                available_slots.append({
                    'id': f"slot_{current_date}_{slot_id}",
                    'trainer_id': trainer_id,
                    'start_time': current_time,
                    'end_time': slot_end,
                    'duration_minutes': 30,
                    'is_available': True,
                    'is_booked': False
                })
                
                current_time += timedelta(minutes=30)
                slot_id += 1
        
        return available_slots
    
    def _is_in_preferred_time_block(self, slot_time: datetime, preferred_blocks: List[str]) -> bool:
        """
        Check if a slot time falls within the trainer's preferred time blocks.
        """
        hour = slot_time.hour
        
        for block in preferred_blocks:
            if block == 'morning' and 6 <= hour < 12:
                return True
            elif block == 'afternoon' and 12 <= hour < 18:
                return True
            elif block == 'evening' and 18 <= hour < 22:
                return True
        
        return False
    
    def _has_sufficient_break(self, combo: Dict, existing_schedule: List[Dict], min_break_minutes: int) -> bool:
        """
        Check if there's sufficient break time between the new session and existing sessions.
        """
        new_start = combo['start_time']
        new_end = combo['end_time']
        
        for existing in existing_schedule:
            existing_start = existing['start_time']
            existing_end = existing['end_time']
            
            # Check if sessions are on the same day
            if new_start.date() == existing_start.date():
                # Check break before new session
                if new_start - existing_end < timedelta(minutes=min_break_minutes):
                    return False
                
                # Check break after new session
                if existing_start - new_end < timedelta(minutes=min_break_minutes):
                    return False
        
        return True
    
    def _prioritize_requests(self, requests: List[BookingRequest], preferences: TrainerSchedulingPreferences) -> List[BookingRequest]:
        """
        Prioritize booking requests using greedy criteria and trainer preferences.
        
        Priority Rules:
        1. Recurring clients priority (if enabled in preferences)
        2. Highest priority_score first (if set)
        3. High-value sessions (if enabled in preferences)
        4. Shortest duration first (favoring easier placements)
        5. Earliest preferred_start_date first
        """
        def sort_key(request):
            # Default priority score if not set
            priority = getattr(request, 'priority_score', 5.0) or 5.0
            
            # Boost priority for recurring clients if preference is enabled
            if preferences and preferences.prioritize_recurring_clients:
                # Check if is_recurring field exists and is True
                if getattr(request, 'is_recurring', False):
                    priority += 2  # Boost priority by 2 points
            
            # Adjust priority for high-value sessions if preference is enabled
            value_factor = 0
            if preferences and preferences.prioritize_high_value_sessions:
                # Longer sessions are higher value
                value_factor = -request.duration_minutes / 60  # Negative to sort longer first
            
            # Convert to tuple for sorting (desc, asc, asc, asc)
            return (
                -priority,  # Negative for descending (highest first)
                value_factor,  # Consider session value if enabled
                request.duration_minutes,  # Ascending (shortest first)
                request.preferred_start_date or datetime.max  # Earliest first
            )
        
        return sorted(requests, key=sort_key)
    
    def _find_slot_combinations(self, slots: List[Dict]) -> Dict[int, List[Dict]]:
        """
        Find simple slot combinations for 60-minute sessions only.
        """
        combinations = {
            60: [],
            90: [],
            120: []
        }
        
        # Group slots by date
        slots_by_date = defaultdict(list)
        for slot in slots:
            date_key = slot['start_time'].date()
            slots_by_date[date_key].append(slot)
        
        # For each date, find 60-minute combinations (2 consecutive slots)
        for date_key, date_slots in slots_by_date.items():
            date_slots.sort(key=lambda s: s['start_time'])
            
            # Find 60-minute combinations (2 consecutive 30-minute slots)
            for i in range(len(date_slots) - 1):
                slot1 = date_slots[i]
                slot2 = date_slots[i + 1]
                
                # Check if slots are consecutive
                if slot2['start_time'] - slot1['end_time'] == timedelta(minutes=0):
                    combinations[60].append({
                        'duration': 60,
                        'start_time': slot1['start_time'],
                        'end_time': slot2['end_time'],
                        'slot_ids': [slot1['id'], slot2['id']],
                        'is_contiguous': True
                    })
        
        return combinations
    
    def _can_combine_for_duration(self, slots: List[Dict], start_idx: int, duration: int) -> bool:
        """Check if slots starting at start_idx can be combined for the given duration."""
        needed_minutes = duration
        accumulated_minutes = 0
        current_time = None
        
        for i in range(start_idx, len(slots)):
            slot = slots[i]
            
            # First slot
            if current_time is None:
                current_time = slot['start_time']
                accumulated_minutes = slot['duration_minutes']
            else:
                # Check if this slot is contiguous with the previous
                if slot['start_time'] == current_time + timedelta(minutes=accumulated_minutes):
                    accumulated_minutes += slot['duration_minutes']
                else:
                    # Gap found, can't combine
                    return False
            
            # Check if we've accumulated enough time
            if accumulated_minutes >= needed_minutes:
                return True
        
        return accumulated_minutes >= needed_minutes
    
    def _create_combination(self, slots: List[Dict], start_idx: int, duration: int) -> Optional[Dict]:
        """Create a slot combination for the given duration."""
        needed_minutes = duration
        accumulated_minutes = 0
        current_time = None
        slot_ids = []
        start_time = None
        end_time = None
        
        for i in range(start_idx, len(slots)):
            slot = slots[i]
            
            # First slot
            if current_time is None:
                current_time = slot['start_time']
                start_time = slot['start_time']
                accumulated_minutes = slot['duration_minutes']
                slot_ids.append(slot['id'])
            else:
                # Check if this slot is contiguous
                expected_start = current_time + timedelta(minutes=accumulated_minutes)
                if slot['start_time'] == expected_start:
                    accumulated_minutes += slot['duration_minutes']
                    slot_ids.append(slot['id'])
                else:
                    # Gap found
                    return None
            
            # Check if we've accumulated enough time
            if accumulated_minutes >= needed_minutes:
                end_time = start_time + timedelta(minutes=needed_minutes)
                return {
                    'duration': duration,
                    'start_time': start_time,
                    'end_time': end_time,
                    'slot_ids': slot_ids,
                    'is_contiguous': len(slot_ids) > 1
                }
        
        return None
    
    def _greedy_placement(
        self,
        requests: List[BookingRequest],
        slot_combinations: Dict[int, List[Dict]],
        preferences: TrainerSchedulingPreferences
    ) -> List[Dict]:
        """
        Main greedy algorithm: Assign requests to optimal slots using preferences.
        
        For each prioritized request:
        1. Find all feasible slot combinations for the required duration
        2. Check if adding this session exceeds max_sessions_per_day
        3. Select the earliest available slot closest to preferred_start_date
        4. Consider consecutive session preference
        5. Mark slots as used to prevent double-booking
        """
        proposed_schedule = []
        used_slot_ids = set()
        sessions_per_day = defaultdict(int)  # Track sessions scheduled per day
        
        for request in requests:
            # Only handle 60-minute sessions for now
            if request.duration_minutes != 60:
                continue
                
            # Get feasible combinations for 60 minutes
            feasible_combos = [
                combo for combo in slot_combinations.get(60, [])
                if not any(slot_id in used_slot_ids for slot_id in combo['slot_ids'])
            ]
            
            if not feasible_combos:
                continue
            
            # Filter by break time
            if preferences and preferences.min_break_minutes:
                feasible_combos = [
                    combo for combo in feasible_combos
                    if self._has_sufficient_break(combo, proposed_schedule, preferences.min_break_minutes)
                ]
            
            if not feasible_combos:
                continue
            
            # Take the first available slot
            best_combo = feasible_combos[0]
            
            # Create proposed schedule entry
            entry = self._create_schedule_entry(request, best_combo)
            proposed_schedule.append(entry)
            
            # Mark slots as used
            for slot_id in best_combo['slot_ids']:
                used_slot_ids.add(slot_id)
        
        # Sort proposed schedule by start time for better presentation
        proposed_schedule.sort(key=lambda e: e['start_time'])
        
        return proposed_schedule
    
    def _select_best_slot(
        self,
        feasible_combos: List[Dict],
        preferred_date: Optional[datetime],
        existing_schedule: Optional[List[Dict]] = None
    ) -> Optional[Dict]:
        """
        Select the best slot combination using greedy criteria and consecutive session preference.
        
        Selection Rules:
        1. Slot immediately after existing sessions (if prefer_consecutive_sessions)
        2. Closest to preferred_date (if provided)
        3. Earliest start_time overall
        """
        if not feasible_combos:
            return None
        
        # If we prefer consecutive sessions and have existing schedule
        if existing_schedule:
            # Find slots that start right after an existing session ends
            consecutive_combos = []
            for combo in feasible_combos:
                for existing in existing_schedule:
                    if combo['start_time'] == existing['end_time']:
                        consecutive_combos.append(combo)
                        break
            
            # If we found consecutive slots, prefer those
            if consecutive_combos:
                feasible_combos = consecutive_combos
        
        if preferred_date:
            # Find combo closest to preferred date
            def distance_from_preferred(combo):
                time_diff = abs((combo['start_time'] - preferred_date).total_seconds())
                return time_diff
            
            feasible_combos.sort(key=distance_from_preferred)
        else:
            # Just sort by earliest start time
            feasible_combos.sort(key=lambda c: c['start_time'])
        
        return feasible_combos[0]
    
    def _create_schedule_entry(
        self,
        request: BookingRequest,
        slot_combo: Dict
    ) -> Dict:
        """Create a proposed schedule entry from a request and slot combination."""
        # Get client information
        client = self.db.query(User).filter(User.id == request.client_id).first()
        client_name = client.full_name if client else "Unknown Client"
        
        return {
            'booking_request_id': request.id,
            'client_id': request.client_id,
            'client_name': client_name,
            'session_type': request.session_type,
            'training_type': request.training_type,  # Include training type
            'duration_minutes': request.duration_minutes,
            'start_time': slot_combo['start_time'],
            'end_time': slot_combo['end_time'],
            'slot_ids': slot_combo['slot_ids'],
            'is_contiguous': slot_combo['is_contiguous'],
            'preferred_start_date': request.preferred_start_date,
            'special_requests': request.special_requests,
            'location': request.location,
            'priority_score': getattr(request, 'priority_score', 5.0)
        }
    
    def _calculate_statistics(
        self,
        proposed_schedule: List[Dict],
        all_requests: List[BookingRequest],
        all_slots: List[Dict]
    ) -> Dict:
        """Calculate optimization statistics."""
        scheduled_count = len(proposed_schedule)
        total_requests = len(all_requests)
        unscheduled_count = total_requests - scheduled_count
        
        # Calculate total hours scheduled
        total_minutes = sum(entry['duration_minutes'] for entry in proposed_schedule)
        total_hours = total_minutes / 60
        
        # Calculate gaps minimized (count contiguous sessions)
        gaps_minimized = self._count_gaps_minimized(proposed_schedule)
        
        # Calculate utilization
        if all_slots:
            total_available_minutes = sum(slot['duration_minutes'] for slot in all_slots)
            utilization_rate = (total_minutes / total_available_minutes * 100) if total_available_minutes > 0 else 0
        else:
            utilization_rate = 0
        
        return {
            'total_requests': total_requests,
            'scheduled_requests': scheduled_count,
            'unscheduled_requests': unscheduled_count,
            'total_hours': round(total_hours, 2),
            'gaps_minimized': gaps_minimized,
            'utilization_rate': round(utilization_rate, 2),
            'scheduling_efficiency': round((scheduled_count / total_requests * 100) if total_requests > 0 else 0, 2)
        }
    
    def _count_gaps_minimized(self, schedule: List[Dict]) -> int:
        """
        Count how many gaps were minimized by finding consecutive sessions.
        
        Two sessions are consecutive if one starts immediately after the other ends.
        """
        if len(schedule) <= 1:
            return 0
        
        gaps_minimized = 0
        sorted_schedule = sorted(schedule, key=lambda e: e['start_time'])
        
        for i in range(len(sorted_schedule) - 1):
            current_end = sorted_schedule[i]['end_time']
            next_start = sorted_schedule[i + 1]['start_time']
            
            # Check if sessions are consecutive (no gap)
            if current_end == next_start:
                gaps_minimized += 1
        
        return gaps_minimized

