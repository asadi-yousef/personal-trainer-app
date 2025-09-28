"""
Script to create trainer profile for existing users with trainer role
"""
import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '.'))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User, Trainer, UserRole

def fix_existing_trainers():
    """Create trainer profiles for existing users with trainer role"""
    db: Session = SessionLocal()
    
    try:
        # Find users with trainer role who don't have trainer profiles
        trainer_users = db.query(User).filter(
            User.role == UserRole.TRAINER
        ).all()
        
        print(f"Found {len(trainer_users)} users with trainer role")
        
        for user in trainer_users:
            # Check if they already have a trainer profile
            existing_trainer = db.query(Trainer).filter(Trainer.user_id == user.id).first()
            
            if not existing_trainer:
                print(f"Creating trainer profile for: {user.full_name} ({user.email})")
                
                # Create trainer profile
                trainer_profile = Trainer(
                    user_id=user.id,
                    specialty="Strength Training",  # Default specialty
                    price_per_session=50.0,  # Default price
                    bio="New trainer - profile setup required",
                    experience_years=0,
                    is_available=True
                )
                
                db.add(trainer_profile)
                db.commit()
                print(f"✅ Created trainer profile for {user.full_name}")
            else:
                print(f"⏭️  Trainer profile already exists for: {user.full_name}")
        
        print("\n🎉 All trainer profiles created successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_existing_trainers()
