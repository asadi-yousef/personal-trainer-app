"""
Script to clean up duplicate bookings in the database.
Keeps the newest booking (highest ID) when duplicates are found.
"""
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.database import get_db, engine
from app.models import Booking

def find_and_remove_duplicates():
    """Find and remove duplicate bookings"""
    
    print("=" * 60)
    print("DUPLICATE BOOKINGS CLEANUP SCRIPT")
    print("=" * 60)
    print()
    
    # Create session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Get all confirmed bookings
        all_bookings = db.query(Booking).filter(
            Booking.status == 'confirmed',
            Booking.confirmed_date.isnot(None)
        ).order_by(Booking.confirmed_date).all()
        
        print(f"Total confirmed bookings: {len(all_bookings)}")
        print()
        
        # Group bookings by client_id + confirmed_date + trainer_id
        booking_groups = {}
        for booking in all_bookings:
            key = (booking.client_id, booking.trainer_id, str(booking.confirmed_date))
            if key not in booking_groups:
                booking_groups[key] = []
            booking_groups[key].append(booking)
        
        # Find duplicates
        duplicates_found = []
        for key, bookings in booking_groups.items():
            if len(bookings) > 1:
                duplicates_found.append((key, bookings))
        
        if not duplicates_found:
            print("✅ No duplicate bookings found!")
            print()
            return
        
        print(f"⚠️  Found {len(duplicates_found)} duplicate booking groups:")
        print()
        
        # Show duplicates
        for idx, (key, bookings) in enumerate(duplicates_found, 1):
            client_id, trainer_id, confirmed_date = key
            print(f"Duplicate Group {idx}:")
            print(f"  Client ID: {client_id}")
            print(f"  Trainer ID: {trainer_id}")
            print(f"  Date/Time: {confirmed_date}")
            print(f"  Number of duplicates: {len(bookings)}")
            print(f"  Booking IDs: {[b.id for b in bookings]}")
            
            # Sort by ID (newest first)
            bookings_sorted = sorted(bookings, key=lambda x: x.id, reverse=True)
            keep = bookings_sorted[0]
            remove = bookings_sorted[1:]
            
            print(f"  → Will KEEP: Booking ID {keep.id} (newest)")
            print(f"  → Will DELETE: {[b.id for b in remove]}")
            print()
        
        # Ask for confirmation
        print("=" * 60)
        response = input("Do you want to DELETE the duplicate bookings? (yes/no): ").strip().lower()
        print()
        
        if response != 'yes':
            print("❌ Cleanup cancelled. No changes made.")
            return
        
        # Delete duplicates
        deleted_count = 0
        for key, bookings in duplicates_found:
            bookings_sorted = sorted(bookings, key=lambda x: x.id, reverse=True)
            keep = bookings_sorted[0]
            remove = bookings_sorted[1:]
            
            for booking in remove:
                print(f"Deleting Booking ID {booking.id}...")
                db.delete(booking)
                deleted_count += 1
        
        # Commit changes
        db.commit()
        
        print()
        print("=" * 60)
        print(f"✅ Successfully deleted {deleted_count} duplicate bookings!")
        print("=" * 60)
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    find_and_remove_duplicates()

