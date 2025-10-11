"""
Test script for Optimal Schedule Generator
Creates test data and calls the optimization algorithm
"""
import sys
import os
from datetime import datetime, timedelta
import random

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import (
    User, Trainer, BookingRequest, TimeSlot, 
    UserRole, BookingRequestStatus, Specialty
)
from app.services.optimal_schedule_service import OptimalScheduleService


def create_test_data(db: Session, trainer_user_id: int = None):
    """Create test booking requests and time slots"""
    
    print("🔧 Creating test data...")
    
    # Find or create a trainer
    if trainer_user_id:
        trainer_user = db.query(User).filter(User.id == trainer_user_id).first()
    else:
        trainer_user = db.query(User).filter(User.role == UserRole.TRAINER).first()
    
    if not trainer_user:
        print("❌ No trainer found. Creating test trainer...")
        # Create test trainer user
        trainer_user = User(
            email="test_trainer@fitconnect.com",
            username="test_trainer",
            full_name="Test Trainer",
            hashed_password="$2b$12$test_password_hash",
            role=UserRole.TRAINER,
            is_active=True,
            is_verified=True
        )
        db.add(trainer_user)
        db.commit()
        db.refresh(trainer_user)
        
        # Create trainer profile
        trainer = Trainer(
            user_id=trainer_user.id,
            specialty=Specialty.STRENGTH_TRAINING,
            price_per_session=50.0,
            price_per_hour=60.0,
            bio="Test trainer for algorithm testing",
            is_available=True
        )
        db.add(trainer)
        db.commit()
        db.refresh(trainer)
    
    trainer = db.query(Trainer).filter(Trainer.user_id == trainer_user.id).first()
    print(f"✅ Using Trainer: {trainer_user.full_name} (ID: {trainer.id})")
    
    # Find or create test clients
    clients = []
    for i in range(3):
        client = db.query(User).filter(
            User.email == f"test_client_{i+1}@fitconnect.com"
        ).first()
        
        if not client:
            client = User(
                email=f"test_client_{i+1}@fitconnect.com",
                username=f"test_client_{i+1}",
                full_name=f"Test Client {i+1}",
                hashed_password="$2b$12$test_password_hash",
                role=UserRole.CLIENT,
                is_active=True
            )
            db.add(client)
        clients.append(client)
    
    db.commit()
    for client in clients:
        db.refresh(client)
    
    print(f"✅ Created/found {len(clients)} test clients")
    
    # Clear existing test data for this trainer
    db.query(BookingRequest).filter(
        BookingRequest.trainer_id == trainer.id
    ).delete()
    db.query(TimeSlot).filter(
        TimeSlot.trainer_id == trainer.id
    ).delete()
    db.commit()
    
    # Create time slots for next 7 days
    print("\n📅 Creating time slots...")
    now = datetime.now()
    start_date = now.replace(hour=9, minute=0, second=0, microsecond=0)
    
    slots_created = 0
    for day_offset in range(7):  # Next 7 days
        current_date = start_date + timedelta(days=day_offset)
        
        # Skip weekends for simplicity
        if current_date.weekday() >= 5:
            continue
        
        # Create 60-minute slots from 9 AM to 6 PM (9 hours = 9 slots)
        for hour_offset in range(9):
            slot_start = current_date + timedelta(hours=hour_offset)
            slot_end = slot_start + timedelta(hours=1)
            
            slot = TimeSlot(
                trainer_id=trainer.id,
                date=current_date,
                start_time=slot_start,
                end_time=slot_end,
                duration_minutes=60,
                is_available=True,
                is_booked=False
            )
            db.add(slot)
            slots_created += 1
    
    db.commit()
    print(f"✅ Created {slots_created} time slots (60-min each)")
    
    # Create diverse booking requests
    print("\n📝 Creating booking requests...")
    
    requests_data = [
        # High priority, short duration
        {
            "client": clients[0],
            "duration": 60,
            "priority": 9.0,
            "type": "Weight Training",
            "days_ahead": 1
        },
        # Medium priority, medium duration
        {
            "client": clients[1],
            "duration": 90,
            "priority": 6.5,
            "type": "Cardio Session",
            "days_ahead": 2
        },
        # High priority, long duration
        {
            "client": clients[0],
            "duration": 120,
            "priority": 8.5,
            "type": "Full Body Workout",
            "days_ahead": 3
        },
        # Low priority, short duration
        {
            "client": clients[2],
            "duration": 60,
            "priority": 4.0,
            "type": "Consultation",
            "days_ahead": 1
        },
        # Medium priority, short duration
        {
            "client": clients[1],
            "duration": 60,
            "priority": 5.5,
            "type": "HIIT Training",
            "days_ahead": 4
        },
        # High priority, medium duration
        {
            "client": clients[2],
            "duration": 90,
            "priority": 7.5,
            "type": "Strength Training",
            "days_ahead": 2
        },
    ]
    
    requests_created = 0
    for req_data in requests_data:
        preferred_date = now + timedelta(days=req_data["days_ahead"])
        
        booking_request = BookingRequest(
            client_id=req_data["client"].id,
            trainer_id=trainer.id,
            session_type=req_data["type"],
            duration_minutes=req_data["duration"],
            status=BookingRequestStatus.PENDING,
            preferred_start_date=preferred_date,
            preferred_end_date=preferred_date + timedelta(days=7),
            allow_weekends=False,
            allow_evenings=True,
            location="Gym"
        )
        
        # Add priority_score if the field exists
        try:
            booking_request.priority_score = req_data["priority"]
        except AttributeError:
            # If priority_score field doesn't exist, we'll add it to the model
            pass
        
        db.add(booking_request)
        requests_created += 1
    
    db.commit()
    print(f"✅ Created {requests_created} booking requests with varying priorities and durations")
    
    return trainer.id


def test_optimization_algorithm(db: Session, trainer_id: int):
    """Test the optimization algorithm"""
    
    print(f"\n🚀 Running Optimization Algorithm for Trainer ID: {trainer_id}")
    print("=" * 70)
    
    service = OptimalScheduleService(db)
    result = service.generate_optimal_schedule(trainer_id)
    
    # Display results
    print(f"\n📊 RESULTS:")
    print(f"Message: {result['message']}")
    print(f"\n📈 Statistics:")
    stats = result['statistics']
    print(f"  • Total Requests: {stats['total_requests']}")
    print(f"  • Scheduled: {stats['scheduled_requests']}")
    print(f"  • Unscheduled: {stats['unscheduled_requests']}")
    print(f"  • Total Hours: {stats['total_hours']}")
    print(f"  • Gaps Minimized: {stats['gaps_minimized']}")
    print(f"  • Utilization Rate: {stats['utilization_rate']:.2f}%")
    print(f"  • Scheduling Efficiency: {stats['scheduling_efficiency']:.2f}%")
    
    print(f"\n📅 Proposed Schedule ({len(result['proposed_entries'])} entries):")
    print("-" * 70)
    
    for i, entry in enumerate(result['proposed_entries'], 1):
        print(f"\n{i}. {entry['client_name']} - {entry['session_type']}")
        print(f"   ⏰ {entry['start_time'].strftime('%a, %b %d at %I:%M %p')} - {entry['end_time'].strftime('%I:%M %p')}")
        print(f"   ⏱️  Duration: {entry['duration_minutes']} minutes")
        print(f"   ⭐ Priority: {entry['priority_score']:.1f}/10")
        print(f"   📍 Slot IDs: {entry['slot_ids']}")
        if entry['is_contiguous']:
            print(f"   🔗 Uses multiple contiguous slots")
    
    print("\n" + "=" * 70)
    return result


def main():
    """Main test function"""
    print("🧪 Optimal Schedule Algorithm Test Suite")
    print("=" * 70)
    
    db = SessionLocal()
    
    try:
        # Allow specifying trainer ID via command line
        trainer_id = None
        if len(sys.argv) > 1:
            try:
                trainer_id = int(sys.argv[1])
                print(f"Using specified trainer ID: {trainer_id}")
            except ValueError:
                print("Invalid trainer ID provided, will find/create one")
        
        # Create test data
        trainer_id = create_test_data(db, trainer_id)
        
        # Run optimization
        result = test_optimization_algorithm(db, trainer_id)
        
        print("\n✅ Test completed successfully!")
        print("\n💡 Next steps:")
        print(f"   1. Open frontend: http://localhost:3000/trainer/optimal-schedule")
        print(f"   2. Login as trainer (ID: {trainer_id})")
        print(f"   3. View the optimized schedule")
        print(f"   4. Or test API: GET /api/trainer/{trainer_id}/optimal-schedule")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        
    finally:
        db.close()


if __name__ == "__main__":
    main()


