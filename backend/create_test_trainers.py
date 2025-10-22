"""
Create test trainers and users for testing optimal scheduling
"""
import sys
import os
from datetime import datetime
from sqlalchemy.orm import Session

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.database import get_db
from app.models import User, Trainer, UserRole

def create_test_trainers():
    """Create test trainers and users"""
    db: Session = next(get_db())
    
    try:
        # Check if trainers already exist
        existing_trainers = db.query(Trainer).count()
        if existing_trainers > 0:
            print(f"✅ Found {existing_trainers} existing trainers. Skipping creation.")
            return
        
        print("Creating test trainers and users...")
        
        # Create test users and trainers
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
        
        created_count = 0
        
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
            created_count += 1
            
            print(f"✅ Created trainer: {trainer_data['full_name']} ({trainer_data['email']})")
        
        # Commit all changes
        db.commit()
        
        print(f"\n🎉 Successfully created {created_count} test trainers!")
        print("Now you can create time slots and test optimal scheduling.")
        
    except Exception as e:
        print(f"❌ Error creating trainers: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_trainers()
