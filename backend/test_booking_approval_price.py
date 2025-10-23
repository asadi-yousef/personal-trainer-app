#!/usr/bin/env python3
"""
Test script to verify booking approval price calculation
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import get_db
from app.models import Booking, Trainer, User, BookingRequest, BookingRequestStatus
from app.services.booking_service import BookingService
from datetime import datetime, timedelta

def test_booking_approval_price():
    """Test that booking approval correctly calculates and saves prices"""
    db = next(get_db())
    
    try:
        print("🧪 Testing Booking Approval Price Calculation")
        print("=" * 60)
        
        # Get a trainer with pricing
        trainer = db.query(Trainer).filter(Trainer.price_per_hour > 0).first()
        if not trainer:
            print("❌ No trainer with pricing found")
            return
        
        print(f"✅ Found trainer: {trainer.user.full_name}")
        print(f"   - Price per hour: ${trainer.price_per_hour}")
        print(f"   - Price per session: ${trainer.price_per_session}")
        
        # Get a client
        client = db.query(User).filter(User.role == 'CLIENT').first()
        if not client:
            print("❌ No client found")
            return
        
        print(f"✅ Found client: {client.full_name}")
        
        # Create a test booking request
        booking_request = BookingRequest(
            client_id=client.id,
            trainer_id=trainer.id,
            session_type="Personal Training",
            duration_minutes=60,
            location="Gym",
            start_time=datetime.now() + timedelta(days=1),
            end_time=datetime.now() + timedelta(days=1, hours=1),
            training_type="Strength Training",
            status=BookingRequestStatus.PENDING,
            expires_at=datetime.now() + timedelta(hours=24)
        )
        
        db.add(booking_request)
        db.commit()
        db.refresh(booking_request)
        
        print(f"✅ Created booking request: ID {booking_request.id}")
        print(f"   - Duration: {booking_request.duration_minutes} minutes")
        print(f"   - Status: {booking_request.status}")
        
        # Test the approval process
        booking_service = BookingService(db)
        
        try:
            result = booking_service.approve_booking_request(
                booking_request_id=booking_request.id,
                trainer_id=trainer.id,
                notes="Test approval"
            )
            
            print(f"✅ Booking approved successfully!")
            print(f"   - Booking ID: {result['booking_id']}")
            
            # Check the created booking
            booking = db.query(Booking).filter(Booking.id == result['booking_id']).first()
            if booking:
                print(f"✅ Booking details:")
                print(f"   - Total Cost: ${booking.total_cost}")
                print(f"   - Price per Hour: ${booking.price_per_hour}")
                print(f"   - Duration: {booking.duration_minutes} minutes")
                print(f"   - Status: {booking.status}")
                
                # Verify price calculation
                expected_price = trainer.price_per_hour * (booking.duration_minutes / 60)
                if abs(booking.total_cost - expected_price) < 0.01:
                    print(f"✅ Price calculation correct: ${expected_price}")
                else:
                    print(f"❌ Price calculation incorrect: expected ${expected_price}, got ${booking.total_cost}")
            else:
                print("❌ Booking not found after approval")
            
            # Check the updated booking request
            db.refresh(booking_request)
            print(f"✅ Booking request updated:")
            print(f"   - Status: {booking_request.status}")
            print(f"   - Total Cost: ${booking_request.total_cost}")
            print(f"   - Price per Hour: ${booking_request.price_per_hour}")
            
        except Exception as e:
            print(f"❌ Approval failed: {e}")
            import traceback
            traceback.print_exc()
        
        print(f"\n✅ Booking approval price test completed!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_booking_approval_price()
