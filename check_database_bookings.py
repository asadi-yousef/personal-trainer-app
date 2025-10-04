#!/usr/bin/env python3
"""
Check the database for bookings and related data
"""
import pymysql

def check_database():
    print("🔍 Checking database for bookings...")
    print("=" * 50)
    
    try:
        # Connect to database
        connection = pymysql.connect(
            host='localhost',
            user='root',
            password='yosef2005',
            database='fitconnect_db',
            charset='utf8mb4'
        )
        
        with connection.cursor() as cursor:
            # Check users
            print("1. Checking users:")
            cursor.execute("SELECT id, email, full_name, role FROM users WHERE id = 2")
            user = cursor.fetchone()
            if user:
                print(f"   User found: {user}")
            else:
                print("   User not found")
            
            # Check bookings
            print("\n2. Checking bookings:")
            cursor.execute("SELECT COUNT(*) FROM bookings")
            count = cursor.fetchone()[0]
            print(f"   Total bookings: {count}")
            
            if count > 0:
                cursor.execute("SELECT id, client_id, trainer_id, session_type, status FROM bookings LIMIT 5")
                bookings = cursor.fetchall()
                for booking in bookings:
                    print(f"   Booking: {booking}")
            
            # Check trainers
            print("\n3. Checking trainers:")
            cursor.execute("SELECT id, user_id, specialty FROM trainers LIMIT 5")
            trainers = cursor.fetchall()
            for trainer in trainers:
                print(f"   Trainer: {trainer}")
            
            # Check if there are any bookings for user 2
            print("\n4. Checking bookings for user 2:")
            cursor.execute("SELECT id, client_id, trainer_id, session_type, status FROM bookings WHERE client_id = 2")
            user_bookings = cursor.fetchall()
            print(f"   Bookings for user 2: {len(user_bookings)}")
            for booking in user_bookings:
                print(f"   User booking: {booking}")
                
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if 'connection' in locals() and connection.open:
            connection.close()
    
    print("\n" + "=" * 50)

if __name__ == "__main__":
    check_database()

