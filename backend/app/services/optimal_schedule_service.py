"""
Optimal Schedule Generator Service - CORRECTED VERSION

This service suggests which pending booking requests to approve/reject
based on trainer constraints and existing schedule.
"""
from sqlalchemy.orm import Session
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
from collections import defaultdict

from app.models import BookingRequest, Trainer, User, BookingRequestStatus, TrainerSchedulingPreferences, Booking, Session as SessionModel


class OptimalScheduleService:
    """
    Service for generating optimal trainer schedules by suggesting which requests to approve/reject.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def generate_optimal_schedule(self, trainer_id: int) -> Dict:
        """
        Generate optimal schedule by suggesting which pending requests to approve/reject.
        """
        # Step 1: Get trainer's scheduling preferences
        preferences = self._get_trainer_preferences(trainer_id)
        
        # Step 2: Get all pending booking requests
        pending_requests = self._get_pending_requests(trainer_id)
        
        if not pending_requests:
            return {
                'trainer_id': trainer_id,
                'proposed_entries': [],
                'rejected_requests': [],
                'statistics': {
                    'total_requests': 0,
                    'recommended_approvals': 0,
                    'recommended_rejections': 0,
                    'total_hours': 0,
                    'scheduling_efficiency': 0
                },
                'message': 'No pending booking requests found'
            }
        
        # Step 3: Get existing confirmed bookings/sessions
        existing_schedule = self._get_existing_schedule(trainer_id)
        
        # Step 4: Run optimization algorithm
        result = self._optimize_schedule(
            pending_requests, 
            existing_schedule, 
            preferences
        )
        
        return result
    
    def _get_trainer_preferences(self, trainer_id: int) -> Optional[TrainerSchedulingPreferences]:
        """Get trainer's scheduling preferences."""
        return self.db.query(TrainerSchedulingPreferences).filter(
            TrainerSchedulingPreferences.trainer_id == trainer_id
        ).first()
    
    def _get_pending_requests(self, trainer_id: int) -> List[BookingRequest]:
        """Get all pending booking requests for this trainer."""
        return self.db.query(BookingRequest).filter(
            BookingRequest.trainer_id == trainer_id,
            BookingRequest.status == BookingRequestStatus.PENDING
        ).all()
    
    def _get_existing_schedule(self, trainer_id: int) -> List[Dict]:
        """Get existing confirmed bookings and sessions."""
        existing_schedule = []
        
        # Get confirmed bookings
        bookings = self.db.query(Booking).filter(
            Booking.trainer_id == trainer_id,
            Booking.start_time >= datetime.now()
        ).all()
        
        for booking in bookings:
            existing_schedule.append({
                'start_time': booking.start_time,
                'end_time': booking.end_time,
                'type': 'booking',
                'id': booking.id
            })
        
        # Get confirmed sessions
        sessions = self.db.query(SessionModel).filter(
            SessionModel.trainer_id == trainer_id,
            SessionModel.scheduled_date >= datetime.now()
        ).all()
        
        for session in sessions:
            session_end = session.scheduled_date + timedelta(minutes=session.duration_minutes)
            existing_schedule.append({
                'start_time': session.scheduled_date,
                'end_time': session_end,
                'type': 'session',
                'id': session.id
            })
        
        return existing_schedule
    
    def _optimize_schedule(
        self, 
        pending_requests: List[BookingRequest], 
        existing_schedule: List[Dict], 
        preferences: Optional[TrainerSchedulingPreferences]
    ) -> Dict:
        """
        Main optimization algorithm.
        """
        # Sort requests by priority
        prioritized_requests = self._prioritize_requests(pending_requests, preferences)
        
        # Track approved and rejected requests
        approved_requests = []
        rejected_requests = []
        
        # Process each request
        for request in prioritized_requests:
            # Check if this request can be scheduled
            can_schedule = self._can_schedule_request(request, existing_schedule, approved_requests, preferences)
            
            if can_schedule:
                # Add to approved requests
                approved_requests.append(self._create_schedule_entry(request))
            else:
                # Add to rejected requests
                rejected_requests.append(self._create_rejection_entry(request))
        
        # Calculate statistics
        statistics = self._calculate_statistics(approved_requests, rejected_requests, pending_requests)
        
        return {
            'trainer_id': pending_requests[0].trainer_id if pending_requests else 0,
            'proposed_entries': approved_requests,
            'rejected_requests': rejected_requests,
            'statistics': statistics,
            'message': f'Recommended {len(approved_requests)} approvals and {len(rejected_requests)} rejections'
        }
    
    def _prioritize_requests(
        self, 
        requests: List[BookingRequest], 
        preferences: Optional[TrainerSchedulingPreferences]
    ) -> List[BookingRequest]:
        """Sort requests by priority using trainer constraints."""
        def sort_key(request):
            # Use existing priority score (already considers trainer constraints)
            priority = getattr(request, 'priority_score', 5.0) or 5.0
            
            # Additional boosts based on trainer preferences
            if preferences and preferences.prioritize_recurring_clients:
                if getattr(request, 'is_recurring', False):
                    priority += 1.0  # Additional boost for recurring clients
            
            if preferences and preferences.prioritize_high_value_sessions:
                # Boost for longer sessions
                if request.duration_minutes >= 120:
                    priority += 1.0
                elif request.duration_minutes >= 90:
                    priority += 0.5
            
            # Time-based priority (earlier requests get slight boost)
            time_factor = 0
            if request.start_time:
                # Earlier in the day gets slight boost
                hour = request.start_time.hour
                if hour < 10:  # Morning sessions
                    time_factor = 0.2
                elif hour < 14:  # Midday sessions
                    time_factor = 0.1
            
            return (-priority, -time_factor, request.duration_minutes)
        
        return sorted(requests, key=sort_key)
    
    def _can_schedule_request(
        self, 
        request: BookingRequest, 
        existing_schedule: List[Dict], 
        approved_requests: List[Dict], 
        preferences: Optional[TrainerSchedulingPreferences]
    ) -> bool:
        """Check if a request can be scheduled without conflicts."""
        
        # Get request time
        if not request.start_time or not request.end_time:
            print(f"DEBUG: Request {request.id} has no start/end time")
            return False
        
        request_start = request.start_time
        request_end = request.end_time
        
        print(f"DEBUG: Checking request {request.id}: {request_start} - {request_end}")
        
        # Check work hours constraint
        if preferences and preferences.work_start_time and preferences.work_end_time:
            from datetime import time
            work_start = time.fromisoformat(preferences.work_start_time)
            work_end = time.fromisoformat(preferences.work_end_time)
            
            if not (work_start <= request_start.time() <= work_end):
                return False
        
        # Check days off constraint
        if preferences and preferences.days_off_list:
            if request_start.weekday() in preferences.days_off_list:
                    return False
            
        # Check max sessions per day constraint
        if preferences and preferences.max_sessions_per_day:
            day_sessions = sum(1 for req in approved_requests 
                             if req['start_time'].date() == request_start.date())
            if day_sessions >= preferences.max_sessions_per_day:
                return False
        
        # Check for conflicts with existing schedule
        min_break = preferences.min_break_minutes if preferences else 15
        
        for existing in existing_schedule:
            # Check for direct overlap
            if (request_start < existing['end_time'] and request_end > existing['start_time']):
                return False
            
            # Check break time violations
            # Case 1: New request starts too close to existing session end
            if (request_start >= existing['end_time'] and 
                request_start - existing['end_time'] < timedelta(minutes=min_break)):
                return False
            
            # Case 2: New request ends too close to existing session start  
            if (request_end <= existing['start_time'] and
                existing['start_time'] - request_end < timedelta(minutes=min_break)):
                return False
        
        # Check for conflicts with other approved requests
        for approved in approved_requests:
            print(f"DEBUG: Checking against approved request: {approved['start_time']} - {approved['end_time']}")
            
            # Check for direct overlap
            if (request_start < approved['end_time'] and request_end > approved['start_time']):
                print(f"DEBUG: Request {request.id} has direct overlap with approved request")
                return False
            
            # Check break time violations
            # Case 1: New request starts too close to approved session end
            if (request_start >= approved['end_time'] and 
                request_start - approved['end_time'] < timedelta(minutes=min_break)):
                print(f"DEBUG: Request {request.id} starts too close to approved session end (break: {request_start - approved['end_time']})")
                return False
            
            # Case 2: New request ends too close to approved session start
            if (request_end <= approved['start_time'] and
                approved['start_time'] - request_end < timedelta(minutes=min_break)):
                print(f"DEBUG: Request {request.id} ends too close to approved session start (break: {approved['start_time'] - request_end})")
                return False
        
        print(f"DEBUG: Request {request.id} can be scheduled")
        return True
    
    def _create_schedule_entry(self, request: BookingRequest) -> Dict:
        """Create a schedule entry for an approved request."""
        client = self.db.query(User).filter(User.id == request.client_id).first()
        
        return {
            'booking_request_id': request.id,
            'client_id': request.client_id,
            'client_name': client.full_name if client else "Unknown",
            'session_type': request.session_type,
            'training_type': request.training_type,
            'duration_minutes': request.duration_minutes,
            'start_time': request.start_time,
            'end_time': request.end_time,
            'slot_ids': [f"request_{request.id}"],  # Use request ID as slot ID
            'is_contiguous': True,  # Assume contiguous for direct bookings
            'preferred_start_date': request.preferred_start_date,
            'special_requests': request.special_requests,
            'location': request.location,
            'priority_score': getattr(request, 'priority_score', 5.0),
            'reason': 'Fits schedule with no conflicts'
        }
    
    def _create_rejection_entry(self, request: BookingRequest) -> Dict:
        """Create a rejection entry for a request that can't be scheduled."""
        client = self.db.query(User).filter(User.id == request.client_id).first()
        
        return {
            'booking_request_id': request.id,
            'client_id': request.client_id,
            'client_name': client.full_name if client else "Unknown",
            'session_type': request.session_type,
            'training_type': request.training_type,
            'duration_minutes': request.duration_minutes,
            'start_time': request.start_time,
            'end_time': request.end_time,
            'slot_ids': [],  # Empty for rejected requests
            'is_contiguous': False,  # Not contiguous for rejected requests
            'preferred_start_date': request.preferred_start_date,
            'special_requests': request.special_requests,
            'location': request.location,
            'priority_score': getattr(request, 'priority_score', 5.0),
            'recommendation': 'REJECT',
            'reason': 'Conflicts with existing schedule or constraints'
        }
    
    def _calculate_statistics(
        self,
        approved_requests: List[Dict], 
        rejected_requests: List[Dict], 
        total_requests: List[BookingRequest]
    ) -> Dict:
        """Calculate optimization statistics."""
        total_hours = sum(req['duration_minutes'] for req in approved_requests) / 60
        
        return {
            'total_requests': len(total_requests),
            'scheduled_requests': len(approved_requests),
            'unscheduled_requests': len(rejected_requests),
            'total_hours': round(total_hours, 2),
            'gaps_minimized': 0,  # Not applicable for direct bookings
            'utilization_rate': 0.0,  # Not applicable for direct bookings
            'scheduling_efficiency': round((len(approved_requests) / len(total_requests) * 100) if total_requests else 0, 2)
        }
