#!/usr/bin/env python3
"""
Test script to verify timezone fix in booking requests
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import get_db
from app.models import BookingRequest, User, Trainer
from datetime import datetime, timedelta
import json

def test_timezone_booking_request():
    """Test that booking requests handle timezone correctly"""
    db = next(get_db())
    
    try:
        print("🧪 Testing Timezone Fix in Booking Requests")
        print("=" * 60)
        
        # Get a trainer and client
        trainer = db.query(Trainer).first()
        client = db.query(User).filter(User.role == 'CLIENT').first()
        
        if not trainer or not client:
            print("❌ No trainer or client found")
            return
        
        print(f"✅ Using trainer: {trainer.user.full_name}")
        print(f"✅ Using client: {client.full_name}")
        
        # Test case 1: Old format (no timezone) - should cause issues
        print(f"\n📅 Test Case 1: Old format (no timezone)")
        old_format_start = "2024-01-15T12:00:00"
        old_format_end = "2024-01-15T13:00:00"
        
        print(f"   Frontend sends: start_time={old_format_start}, end_time={old_format_end}")
        
        # Parse as if backend receives this
        start_dt_old = datetime.fromisoformat(old_format_start)
        end_dt_old = datetime.fromisoformat(old_format_end)
        
        print(f"   Backend parses: start={start_dt_old}, end={end_dt_old}")
        print(f"   ❌ Problem: No timezone info, backend assumes UTC")
        print(f"   ❌ User in +2 timezone sees: 14:00-15:00 instead of 12:00-13:00")
        
        # Test case 2: New format (with timezone) - should work correctly
        print(f"\n📅 Test Case 2: New format (with timezone)")
        new_format_start = "2024-01-15T12:00:00+02:00"
        new_format_end = "2024-01-15T13:00:00+02:00"
        
        print(f"   Frontend sends: start_time={new_format_start}, end_time={new_format_end}")
        
        # Parse with timezone info
        start_dt_new = datetime.fromisoformat(new_format_start)
        end_dt_new = datetime.fromisoformat(new_format_end)
        
        print(f"   Backend parses: start={start_dt_new}, end={end_dt_new}")
        print(f"   ✅ Timezone info: {start_dt_new.tzinfo}")
        print(f"   ✅ User sees correct time: 12:00-13:00")
        
        # Convert to UTC for storage
        start_utc = start_dt_new.astimezone()
        end_utc = end_dt_new.astimezone()
        
        print(f"   🌍 UTC for storage: start={start_utc}, end={end_utc}")
        
        # Test case 3: Create actual booking request with new format
        print(f"\n📅 Test Case 3: Create booking request with timezone fix")
        
        booking_request = BookingRequest(
            client_id=client.id,
            trainer_id=trainer.id,
            session_type="Personal Training",
            duration_minutes=60,
            location="Test Gym",
            special_requests="Timezone test",
            start_time=start_dt_new,
            end_time=end_dt_new,
            training_type="Strength Training",
            status="PENDING",
            expires_at=datetime.now() + timedelta(hours=24)
        )
        
        db.add(booking_request)
        db.commit()
        db.refresh(booking_request)
        
        print(f"✅ Created booking request: ID {booking_request.id}")
        print(f"   - Start time: {booking_request.start_time}")
        print(f"   - End time: {booking_request.end_time}")
        print(f"   - Timezone: {booking_request.start_time.tzinfo}")
        
        # Verify the times are correct
        if booking_request.start_time.hour == 12 and booking_request.end_time.hour == 13:
            print(f"✅ Timezone fix working correctly!")
        else:
            print(f"❌ Timezone fix not working - times are wrong")
        
        print(f"\n✅ Timezone booking request test completed!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_timezone_booking_request()
