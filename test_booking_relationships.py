#!/usr/bin/env python3
"""
Test booking relationships to find the 500 error cause
"""
import pymysql

def test_booking_relationships():
    print("🔍 Testing booking relationships...")
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
            # Check booking 1 relationships
            print("1. Checking booking 1 relationships:")
            cursor.execute("""
                SELECT b.id, b.client_id, b.trainer_id, 
                       u.full_name as client_name, 
                       t.user_id as trainer_user_id,
                       tu.full_name as trainer_name
                FROM bookings b
                LEFT JOIN users u ON b.client_id = u.id
                LEFT JOIN trainers t ON b.trainer_id = t.id
                LEFT JOIN users tu ON t.user_id = tu.id
                WHERE b.id = 1
            """)
            result = cursor.fetchone()
            if result:
                print(f"   Booking 1: {result}")
            else:
                print("   Booking 1 not found")
            
            # Check if trainer 1 has a user
            print("\n2. Checking trainer 1 user relationship:")
            cursor.execute("""
                SELECT t.id, t.user_id, u.full_name, u.email
                FROM trainers t
                LEFT JOIN users u ON t.user_id = u.id
                WHERE t.id = 1
            """)
            trainer_result = cursor.fetchone()
            if trainer_result:
                print(f"   Trainer 1: {trainer_result}")
            else:
                print("   Trainer 1 not found")
            
            # Check all bookings with their relationships
            print("\n3. Checking all bookings with relationships:")
            cursor.execute("""
                SELECT b.id, b.client_id, b.trainer_id, 
                       u.full_name as client_name, 
                       t.user_id as trainer_user_id,
                       tu.full_name as trainer_name
                FROM bookings b
                LEFT JOIN users u ON b.client_id = u.id
                LEFT JOIN trainers t ON b.trainer_id = t.id
                LEFT JOIN users tu ON t.user_id = tu.id
                WHERE b.client_id = 2
                LIMIT 3
            """)
            results = cursor.fetchall()
            for result in results:
                print(f"   Booking {result[0]}: client={result[3]}, trainer={result[5]}")
                
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if 'connection' in locals() and connection.open:
            connection.close()
    
    print("\n" + "=" * 50)

if __name__ == "__main__":
    test_booking_relationships()

