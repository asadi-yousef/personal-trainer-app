#!/usr/bin/env python3
"""
Check specific booking fields that might cause serialization issues
"""
import pymysql
import json

def check_booking_fields():
    print("🔍 Checking booking fields for serialization issues...")
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
            # Check booking 1 fields
            print("1. Checking booking 1 fields:")
            cursor.execute("""
                SELECT id, session_type, duration_minutes, location, special_requests,
                       status, preferred_start_date, preferred_end_date, preferred_times,
                       confirmed_date, priority_score, is_recurring, recurring_pattern,
                       created_at, updated_at
                FROM bookings 
                WHERE id = 1
            """)
            result = cursor.fetchone()
            if result:
                print(f"   ID: {result[0]}")
                print(f"   session_type: {result[1]}")
                print(f"   duration_minutes: {result[2]}")
                print(f"   location: {result[3]}")
                print(f"   special_requests: {result[4]}")
                print(f"   status: {result[5]}")
                print(f"   preferred_start_date: {result[6]}")
                print(f"   preferred_end_date: {result[7]}")
                print(f"   preferred_times: {result[8]} (type: {type(result[8])})")
                print(f"   confirmed_date: {result[9]}")
                print(f"   priority_score: {result[10]}")
                print(f"   is_recurring: {result[11]}")
                print(f"   recurring_pattern: {result[12]}")
                print(f"   created_at: {result[13]}")
                print(f"   updated_at: {result[14]}")
                
                # Try to parse preferred_times if it's not None
                if result[8]:
                    try:
                        parsed_times = json.loads(result[8])
                        print(f"   preferred_times parsed: {parsed_times}")
                    except json.JSONDecodeError as e:
                        print(f"   ❌ JSON decode error for preferred_times: {e}")
            else:
                print("   Booking 1 not found")
                
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if 'connection' in locals() and connection.open:
            connection.close()
    
    print("\n" + "=" * 50)

if __name__ == "__main__":
    check_booking_fields()

