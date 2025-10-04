#!/usr/bin/env python3
"""
Check database state for scheduling system
"""
import sys
import os
sys.path.append('backend')

from backend.app.database import get_db
from backend.app.models import Trainer, TrainerAvailability, User
from sqlalchemy.orm import Session

def check_database():
    print("🔍 Checking Database State...")
    print("=" * 50)
    
    try:
        # Get database session
        db = next(get_db())
        
        # Check users
        users = db.query(User).all()
        print(f"📊 Total Users: {len(users)}")
        for user in users:
            print(f"  - {user.full_name} ({user.email}) - Role: {user.role}")
        
        # Check trainers
        trainers = db.query(Trainer).all()
        print(f"\n🏋️ Total Trainers: {len(trainers)}")
        
        for trainer in trainers:
            print(f"\nTrainer ID: {trainer.id}")
            print(f"  Name: {trainer.user.full_name}")
            print(f"  Email: {trainer.user.email}")
            print(f"  Available: {trainer.is_available}")
            print(f"  Specialty: {trainer.specialty}")
            print(f"  Rating: {trainer.rating}")
            print(f"  Price: ${trainer.price_per_session}")
            
            # Check availability
            availability = db.query(TrainerAvailability).filter(
                TrainerAvailability.trainer_id == trainer.id
            ).all()
            
            print(f"  Availability entries: {len(availability)}")
            for avail in availability:
                day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                day_name = day_names[avail.day_of_week] if avail.day_of_week < 7 else 'Unknown'
                print(f"    {day_name}: {avail.start_time} - {avail.end_time} (Available: {avail.is_available})")
        
        # Check if we have any trainers available
        available_trainers = db.query(Trainer).filter(Trainer.is_available == True).all()
        print(f"\n✅ Available Trainers: {len(available_trainers)}")
        
        if len(available_trainers) == 0:
            print("❌ PROBLEM: No available trainers found!")
            print("   Solution: Set is_available = True for at least one trainer")
        
        # Check availability for available trainers
        for trainer in available_trainers:
            availability = db.query(TrainerAvailability).filter(
                TrainerAvailability.trainer_id == trainer.id,
                TrainerAvailability.is_available == True
            ).all()
            
            if len(availability) == 0:
                print(f"❌ PROBLEM: Trainer {trainer.user.full_name} has no availability!")
                print("   Solution: Add availability entries for this trainer")
            else:
                print(f"✅ Trainer {trainer.user.full_name} has {len(availability)} availability entries")
        
        print("\n" + "=" * 50)
        print("🎯 Next Steps:")
        
        if len(available_trainers) == 0:
            print("1. Set is_available = True for at least one trainer")
        elif len(availability) == 0:
            print("1. Add availability entries for available trainers")
        else:
            print("1. ✅ Database looks good!")
            print("2. Test the API endpoint directly")
            print("3. Check frontend API calls")
        
    except Exception as e:
        print(f"❌ Error checking database: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_database()

