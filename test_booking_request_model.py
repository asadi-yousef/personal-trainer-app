import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app.database import get_db
from backend.app.models import BookingRequest, BookingRequestStatus
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import json

def test_booking_request_model():
    print("🧪 Testing BookingRequest model...")
    
    try:
        # Get database session
        db = next(get_db())
        
        # Try to create a BookingRequest object
        print("Creating BookingRequest object...")
        
        booking_request = BookingRequest(
            client_id=2,
            trainer_id=1,
            session_type="Personal Training",
            duration_minutes=60,
            preferred_start_date=datetime.now() + timedelta(days=1),
            preferred_end_date=datetime.now() + timedelta(days=1, hours=1),
            preferred_times=json.dumps(["10:00"]),
            allow_weekends=True,
            allow_evenings=True,
            is_recurring=False,
            expires_at=datetime.utcnow() + timedelta(hours=24)
        )
        
        print("✅ BookingRequest object created successfully")
        
        # Try to add to database
        print("Adding to database...")
        db.add(booking_request)
        db.commit()
        db.refresh(booking_request)
        
        print(f"✅ BookingRequest saved to database with ID: {booking_request.id}")
        
        # Clean up - delete the test record
        db.delete(booking_request)
        db.commit()
        print("✅ Test record cleaned up")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    test_booking_request_model()
