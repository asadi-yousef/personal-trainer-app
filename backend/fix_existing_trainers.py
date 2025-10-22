#!/usr/bin/env python3
"""
Script to fix existing trainers who don't have the new profile completion fields set
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import Trainer, ProfileCompletionStatus
from app.database import Base

def fix_existing_trainers():
    """Fix existing trainers to have proper profile completion status"""
    db = SessionLocal()
    
    try:
        # Get all trainers
        trainers = db.query(Trainer).all()
        
        print(f"Found {len(trainers)} trainers to check...")
        
        updated_count = 0
        for trainer in trainers:
            # Check if trainer needs profile completion
            if trainer.profile_completion_status is None:
                # Set to incomplete if not set
                trainer.profile_completion_status = ProfileCompletionStatus.INCOMPLETE
                updated_count += 1
                print(f"Updated trainer {trainer.id} (user_id: {trainer.user_id}) - set profile_completion_status to INCOMPLETE")
            
            # Check if price_per_hour is not set
            if trainer.price_per_hour is None or trainer.price_per_hour == 0:
                # Set a default price_per_hour based on price_per_session
                if trainer.price_per_session and trainer.price_per_session > 0:
                    trainer.price_per_hour = trainer.price_per_session
                else:
                    trainer.price_per_hour = 50.0  # Default price
                updated_count += 1
                print(f"Updated trainer {trainer.id} - set price_per_hour to {trainer.price_per_hour}")
        
        if updated_count > 0:
            db.commit()
            print(f"Successfully updated {updated_count} trainer records")
        else:
            print("No trainers needed updates")
            
    except Exception as e:
        print(f"Error updating trainers: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Fixing existing trainers...")
    fix_existing_trainers()
    print("Done!")




























