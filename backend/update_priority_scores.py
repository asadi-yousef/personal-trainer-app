#!/usr/bin/env python3
"""
Update priority scores for existing booking requests
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import get_db
from app.models import BookingRequest
from sqlalchemy.orm import Session
import random

def update_priority_scores():
    """Update priority scores for all existing booking requests"""
    
    db = next(get_db())
    
    try:
        # Get all booking requests
        requests = db.query(BookingRequest).all()
        
        print(f"🔄 Updating priority scores for {len(requests)} booking requests...")
        
        for req in requests:
            # Calculate new priority score
            score = 3.0  # Base score
            
            # Recurring clients get highest priority
            if req.is_recurring:
                score += 3.0
            
            # Training type gets different priority scores
            if req.training_type:
                type_scores = {
                    'Personal Training': 2.5,
                    'Nutrition Coaching': 2.0,
                    'Rehabilitation': 2.0,
                    'Calisthenics': 1.5,
                    'Gym Weights': 1.0,
                    'Cardio': 0.8,
                    'Yoga': 0.5,
                    'Pilates': 0.5
                }
                score += type_scores.get(req.training_type, 1.0)
            
            # Session duration affects priority
            if req.duration_minutes >= 120:
                score += 1.5
            elif req.duration_minutes >= 90:
                score += 1.0
            elif req.duration_minutes >= 60:
                score += 0.5
            else:
                score += 0.2
            
            # Special requests
            if req.special_requests and len(req.special_requests.strip()) > 0:
                if "Booked via optimal scheduling algorithm" not in req.special_requests:
                    score += 1.5
                else:
                    score += 0.5
            
            # Location type
            if req.location_type == 'home':
                score += 1.0
            elif req.location_type == 'gym':
                score += 0.3
            
            # Add randomness for variation
            score += random.uniform(0.1, 0.3)
            
            # Ensure score is within 1-10 range
            new_score = max(1.0, min(10.0, round(score, 1)))
            
            # Update the request
            req.priority_score = new_score
            
            print(f"✅ Request {req.id}: {req.training_type} -> Priority: {new_score}")
        
        # Commit changes
        db.commit()
        
        print(f"\n🎉 Successfully updated {len(requests)} booking requests!")
        print("📊 New priority distribution:")
        
        # Show new distribution
        for req in requests:
            priority_level = "HIGH" if req.priority_score >= 8 else "NORMAL" if req.priority_score >= 5 else "LOW"
            print(f"   ID {req.id}: {req.priority_score} ({priority_level}) - {req.training_type}")
        
    except Exception as e:
        print(f"❌ Error updating priority scores: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    update_priority_scores()
