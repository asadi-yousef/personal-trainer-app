"""
Complete setup script for optimal scheduling testing
Creates trainers, time slots, and test data needed for 90-minute sessions
"""
import sys
import os
from datetime import datetime, timedelta, date, time
from sqlalchemy.orm import Session

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.database import get_db
from app.models import TimeSlot, Trainer, User, UserRole

def setup_optimal_scheduling():
    """Complete setup for optimal scheduling testing"""
    db: Session = next(get_db())
    
    try:
        print("🚀 Setting up optimal scheduling test environment...")
        print("=" * 60)
        
        # Step 1: Create test trainers if they don't exist
        print("📋 Step 1: Creating test trainers...")
        existing_trainers = db.query(Trainer).count()
        
        if existing_trainers == 0:
            test_trainers = [
                {
                    "email": "john.trainer@example.com",
                    "full_name": "John Smith",
                    "phone": "+1234567890",
                    "specialties": ["Strength Training", "Weight Loss"],
                    "price_per_hour": 80.0
                },
                {
                    "email": "sarah.trainer@example.com", 
                    "full_name": "Sarah Johnson",
                    "phone": "+1234567891",
                    "specialties": ["Yoga", "Pilates", "Flexibility"],
                    "price_per_hour": 75.0
                },
                {
                    "email": "mike.trainer@example.com",
                    "full_name": "Mike Wilson", 
                    "phone": "+1234567892",
                    "specialties": ["Cardio", "HIIT", "Endurance"],
                    "price_per_hour": 70.0
                }
            ]
            
            for trainer_data in test_trainers:
                # Create user
                user = User(
                    email=trainer_data["email"],
                    full_name=trainer_data["full_name"],
                    phone=trainer_data["phone"],
                    role=UserRole.TRAINER,
                    is_active=True,
                    created_at=datetime.now()
                )
                
                db.add(user)
                db.flush()  # Get the user ID
                
                # Create trainer profile
                trainer = Trainer(
                    user_id=user.id,
                    bio=f"Professional trainer specializing in {', '.join(trainer_data['specialties'])}",
                    specialties=", ".join(trainer_data["specialties"]),
                    price_per_hour=trainer_data["price_per_hour"],
                    is_available=True,
                    created_at=datetime.now()
                )
                
                db.add(trainer)
                print(f"  ✅ Created trainer: {trainer_data['full_name']}")
        else:
            print(f"  ✅ Found {existing_trainers} existing trainers")
        
        # Step 2: Create time slots
        print("\n📅 Step 2: Creating time slots...")
        
        # Create time slots for the next 7 days
        start_date = date.today()
        end_date = start_date + timedelta(days=7)
        
        # Check if time slots already exist
        existing_slots = db.query(TimeSlot).count()
        if existing_slots > 0:
            print(f"  ✅ Found {existing_slots} existing time slots")
        else:
            # Get all trainers
            trainers = db.query(Trainer).all()
            
            slots_created = 0
            
            for trainer in trainers:
                current_date = start_date
                while current_date <= end_date:
                    # Create slots Monday to Friday
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
            
            print(f"  ✅ Created {slots_created} time slots")
        
        # Commit all changes
        db.commit()
        
        # Step 3: Summary
        print("\n📊 Step 3: Setup Summary")
        print("=" * 60)
        
        final_trainers = db.query(Trainer).count()
        final_slots = db.query(TimeSlot).count()
        
        print(f"👥 Trainers: {final_trainers}")
        print(f"⏰ Time Slots: {final_slots}")
        print(f"📅 Date Range: {start_date} to {end_date}")
        print(f"🕐 Time Range: 8:00 AM to 6:00 PM (60-minute slots)")
        
        print("\n🎉 Setup completed successfully!")
        print("\nNow you can test optimal scheduling with:")
        print("  • 60-minute sessions (1 slot)")
        print("  • 90-minute sessions (2 consecutive slots)")  
        print("  • 120-minute sessions (3 consecutive slots)")
        
        print("\n🚀 Next steps:")
        print("  1. Start your backend server")
        print("  2. Test the optimal scheduling page")
        print("  3. Try booking 90-minute sessions!")
        
    except Exception as e:
        print(f"❌ Error during setup: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    setup_optimal_scheduling()
