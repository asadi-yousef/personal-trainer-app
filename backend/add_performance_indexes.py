#!/usr/bin/env python3
"""
Add database indexes for performance optimization
"""
import sys
import os
sys.path.append(os.path.dirname(__file__))

from app.database import engine
from sqlalchemy import text

def add_performance_indexes():
    """Add database indexes to improve query performance"""
    
    indexes = [
        # Sessions table indexes
        "CREATE INDEX idx_sessions_client_id ON sessions(client_id)",
        "CREATE INDEX idx_sessions_trainer_id ON sessions(trainer_id)",
        "CREATE INDEX idx_sessions_status ON sessions(status)",
        "CREATE INDEX idx_sessions_scheduled_date ON sessions(scheduled_date)",
        "CREATE INDEX idx_sessions_status_date ON sessions(status, scheduled_date)",
        
        # Users table indexes
        "CREATE INDEX idx_users_role ON users(role)",
        "CREATE INDEX idx_users_email ON users(email)",
        "CREATE INDEX idx_users_created_at ON users(created_at)",
        
        # Trainers table indexes
        "CREATE INDEX idx_trainers_user_id ON trainers(user_id)",
        "CREATE INDEX idx_trainers_specialty ON trainers(specialty)",
        
        # Bookings table indexes
        "CREATE INDEX idx_bookings_client_id ON bookings(client_id)",
        "CREATE INDEX idx_bookings_trainer_id ON bookings(trainer_id)",
        "CREATE INDEX idx_bookings_status ON bookings(status)",
        "CREATE INDEX idx_bookings_created_at ON bookings(created_at)",
        
        # Messages table indexes
        "CREATE INDEX idx_messages_sender_id ON messages(sender_id)",
        "CREATE INDEX idx_messages_receiver_id ON messages(receiver_id)",
        "CREATE INDEX idx_messages_created_at ON messages(created_at)",
        
        # Programs table indexes
        "CREATE INDEX idx_programs_trainer_id ON programs(trainer_id)",
        "CREATE INDEX idx_programs_created_at ON programs(created_at)",
        
        # Goals table indexes
        "CREATE INDEX idx_goals_client_id ON fitness_goals(client_id)",
        "CREATE INDEX idx_goals_is_active ON fitness_goals(is_active)",
        
        # Time slots table indexes
        "CREATE INDEX idx_time_slots_trainer_id ON time_slots(trainer_id)",
        "CREATE INDEX idx_time_slots_date_time ON time_slots(date, time)",
        "CREATE INDEX idx_time_slots_is_available ON time_slots(is_available)",
    ]
    
    try:
        with engine.connect() as conn:
            for index_sql in indexes:
                print(f"Creating index: {index_sql}")
                conn.execute(text(index_sql))
                conn.commit()
            
        print("✅ All performance indexes created successfully!")
        
    except Exception as e:
        print(f"❌ Error creating indexes: {e}")

if __name__ == "__main__":
    add_performance_indexes()
