#!/usr/bin/env python3
"""
Check trainer scheduling preferences
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import get_db
from app.models import TrainerSchedulingPreferences, Trainer, User

def check_preferences():
    """Check trainer scheduling preferences"""
    
    db = next(get_db())
    
    print('=== TRAINER SCHEDULING PREFERENCES ===')
    prefs = db.query(TrainerSchedulingPreferences).all()
    
    for pref in prefs:
        trainer = db.query(Trainer).filter(Trainer.id == pref.trainer_id).first()
        user = db.query(User).filter(User.id == trainer.user_id).first() if trainer else None
        
        print(f'Trainer: {user.full_name if user else "Unknown"} (ID: {pref.trainer_id})')
        print(f'  Max sessions per day: {pref.max_sessions_per_day}')
        print(f'  Min break minutes: {pref.min_break_minutes}')
        print(f'  Work start time: {pref.work_start_time}')
        print(f'  Work end time: {pref.work_end_time}')
        print(f'  Days off: {pref.days_off}')
        print(f'  Preferred time blocks: {pref.preferred_time_blocks}')
        print(f'  Prefer consecutive sessions: {pref.prefer_consecutive_sessions}')
        print(f'  Prioritize recurring clients: {pref.prioritize_recurring_clients}')
        print(f'  Prioritize high value sessions: {pref.prioritize_high_value_sessions}')
        print('---')
    
    print(f'\nTotal preferences: {len(prefs)}')

if __name__ == "__main__":
    check_preferences()
