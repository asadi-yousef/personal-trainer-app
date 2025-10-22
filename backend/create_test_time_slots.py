"""
Create test time slots for trainers to enable optimal scheduling
"""
import sys
import os
from datetime import datetime, timedelta, date, time
from sqlalchemy.orm import Session

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.database import get_db
from app.models import TimeSlot, Trainer, User

def create_test_time_slots():
    """Create test time slots for all trainers"""
    db: Session = next(get_db())
    
    try:
        # Get all trainers
        trainers = db.query(Trainer).all()
        
        if not trainers:
            print("No trainers found in database. Please create trainers first.")
            return
        
        print(f"Found {len(trainers)} trainers. Creating time slots...")
        
        # Create time slots for the next 7 days
        start_date = date.today()
        end_date = start_date + timedelta(days=7)
        
        slots_created = 0
        
        for trainer in trainers:
            print(f"Creating slots for trainer {trainer.id} ({trainer.user.full_name if trainer.user else 'Unknown'})")
            
            current_date = start_date
            while current_date <= end_date:
                # Skip weekends for now (you can modify this)
                if current_date.weekday() < 5:  # Monday = 0, Friday = 4
                    # Create 60-minute slots from 8:00 AM to 6:00 PM
                    start_time = time(8, 0)
                    end_time = time(18, 0)
                    
                    current_time = start_time
                    while current_time < end_time:
                        slot_start = datetime.combine(current_date, current_time)
                        slot_end = slot_start + timedelta(minutes=60)
                        
                        # Create the time slot
                        time_slot = TimeSlot(
                            trainer_id=trainer.id,
                            date=slot_start.date(),
                            start_time=slot_start,
                            end_time=slot_end,
                            duration_minutes=60,
                            is_available=True,
                            is_booked=False
                        )
                        
                        db.add(time_slot)
                        slots_created += 1
                        
                        # Move to next hour
                        current_time = (datetime.combine(current_date, current_time) + timedelta(hours=1)).time()
                
                current_date += timedelta(days=1)
        
        # Commit all changes
        db.commit()
        
        print(f"✅ Successfully created {slots_created} time slots for {len(trainers)} trainers")
        print(f"📅 Date range: {start_date} to {end_date}")
        print(f"⏰ Time range: 8:00 AM to 6:00 PM (60-minute slots)")
        print("\nNow you can test the optimal scheduling with 90-minute sessions!")
        
    except Exception as e:
        print(f"❌ Error creating time slots: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_time_slots()
