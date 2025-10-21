#!/usr/bin/env python3
"""
Check what's in the database
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import get_db
from app.models import BookingRequest, User, Trainer
from sqlalchemy.orm import Session

def check_database():
    """Check what's in the database"""
    
    db = next(get_db())
    
    print('=== BOOKING REQUESTS ===')
    requests = db.query(BookingRequest).all()
    for req in requests:
        client = db.query(User).filter(User.id == req.client_id).first()
        trainer = db.query(Trainer).filter(Trainer.id == req.trainer_id).first()
        print(f'ID: {req.id}')
        print(f'  Client: {client.full_name if client else "Unknown"} (ID: {req.client_id})')
        print(f'  Trainer: {trainer.user.full_name if trainer and trainer.user else "Unknown"} (ID: {req.trainer_id})')
        print(f'  Status: {req.status}')
        print(f'  Priority: {req.priority_score}')
        print(f'  Start: {req.start_time}')
        print(f'  End: {req.end_time}')
        print(f'  Duration: {req.duration_minutes} min')
        print(f'  Type: {req.training_type}')
        print('---')

    print(f'\nTotal requests: {len(requests)}')
    
    print('\n=== USERS ===')
    users = db.query(User).all()
    for user in users:
        print(f'ID: {user.id}, Name: {user.full_name}, Role: {user.role}, Email: {user.email}')
    
    print(f'\nTotal users: {len(users)}')
    
    print('\n=== TRAINERS ===')
    trainers = db.query(Trainer).all()
    for trainer in trainers:
        print(f'ID: {trainer.id}, User: {trainer.user.full_name if trainer.user else "Unknown"}')
    
    print(f'\nTotal trainers: {len(trainers)}')

if __name__ == "__main__":
    check_database()
