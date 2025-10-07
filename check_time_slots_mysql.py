import pymysql
from datetime import datetime, timedelta

# Database connection details
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'yosef2005',
    'database': 'fitconnect_db'
}

def check_time_slots():
    print("🔍 Checking time_slots table in MySQL...")
    
    try:
        connection = pymysql.connect(**DB_CONFIG)
        with connection.cursor() as cursor:
            
            # 1. Check total count of time slots
            cursor.execute("SELECT COUNT(*) FROM time_slots")
            total_count = cursor.fetchone()[0]
            print(f"📊 Total time slots in database: {total_count}")
            
            # 2. Check time slots by trainer
            cursor.execute("""
                SELECT trainer_id, COUNT(*) as slot_count 
                FROM time_slots 
                GROUP BY trainer_id 
                ORDER BY trainer_id
            """)
            trainer_slots = cursor.fetchall()
            print(f"\n👨‍💼 Time slots by trainer:")
            for trainer_id, count in trainer_slots:
                print(f"  Trainer {trainer_id}: {count} slots")
            
            # 3. Check time slots by availability status
            cursor.execute("""
                SELECT 
                    is_available,
                    is_booked,
                    COUNT(*) as count
                FROM time_slots 
                GROUP BY is_available, is_booked
                ORDER BY is_available DESC, is_booked ASC
            """)
            availability_stats = cursor.fetchall()
            print(f"\n📅 Time slots by availability:")
            for is_available, is_booked, count in availability_stats:
                status = "Available" if is_available and not is_booked else "Booked" if is_booked else "Unavailable"
                print(f"  {status}: {count} slots")
            
            # 4. Show recent time slots (next 7 days)
            today = datetime.now().date()
            next_week = today + timedelta(days=7)
            
            cursor.execute("""
                SELECT 
                    id, trainer_id, date, start_time, end_time, 
                    duration_minutes, is_available, is_booked
                FROM time_slots 
                WHERE date >= %s AND date <= %s
                ORDER BY date, start_time
                LIMIT 20
            """, (today, next_week))
            
            recent_slots = cursor.fetchall()
            print(f"\n📋 Recent time slots (next 7 days):")
            print(f"{'ID':<4} {'Trainer':<8} {'Date':<12} {'Start':<8} {'End':<8} {'Duration':<8} {'Status':<12}")
            print("-" * 70)
            
            for slot in recent_slots:
                slot_id, trainer_id, date, start_time, end_time, duration, is_available, is_booked = slot
                status = "Available" if is_available and not is_booked else "Booked" if is_booked else "Unavailable"
                start_str = start_time.strftime('%H:%M') if start_time else 'N/A'
                end_str = end_time.strftime('%H:%M') if end_time else 'N/A'
                date_str = date.strftime('%Y-%m-%d') if date else 'N/A'
                
                print(f"{slot_id:<4} {trainer_id:<8} {date_str:<12} {start_str:<8} {end_str:<8} {duration:<8} {status:<12}")
            
            # 5. Check for today's available slots specifically
            cursor.execute("""
                SELECT 
                    id, start_time, end_time, duration_minutes
                FROM time_slots 
                WHERE date = %s 
                AND is_available = 1 
                AND is_booked = 0
                ORDER BY start_time
            """, (today,))
            
            today_available = cursor.fetchall()
            print(f"\n✅ Available slots for today ({today}):")
            if today_available:
                for slot in today_available:
                    slot_id, start_time, end_time, duration = slot
                    start_str = start_time.strftime('%H:%M') if start_time else 'N/A'
                    end_str = end_time.strftime('%H:%M') if end_time else 'N/A'
                    print(f"  ID {slot_id}: {start_str} - {end_str} ({duration} min)")
            else:
                print("  No available slots for today")
            
            # 6. Check tomorrow's available slots (for testing)
            tomorrow = today + timedelta(days=1)
            cursor.execute("""
                SELECT 
                    id, start_time, end_time, duration_minutes
                FROM time_slots 
                WHERE date = %s 
                AND is_available = 1 
                AND is_booked = 0
                ORDER BY start_time
            """, (tomorrow,))
            
            tomorrow_available = cursor.fetchall()
            print(f"\n✅ Available slots for tomorrow ({tomorrow}):")
            if tomorrow_available:
                for slot in tomorrow_available:
                    slot_id, start_time, end_time, duration = slot
                    start_str = start_time.strftime('%H:%M') if start_time else 'N/A'
                    end_str = end_time.strftime('%H:%M') if end_time else 'N/A'
                    print(f"  ID {slot_id}: {start_str} - {end_str} ({duration} min)")
            else:
                print("  No available slots for tomorrow")
                
    except Exception as e:
        print(f"❌ Error checking time slots: {e}")
    finally:
        if 'connection' in locals() and connection.open:
            connection.close()

def check_booking_requests():
    print("\n🔍 Checking booking_requests table...")
    
    try:
        connection = pymysql.connect(**DB_CONFIG)
        with connection.cursor() as cursor:
            
            # Check total booking requests
            cursor.execute("SELECT COUNT(*) FROM booking_requests")
            total_requests = cursor.fetchone()[0]
            print(f"📊 Total booking requests: {total_requests}")
            
            if total_requests > 0:
                # Show recent booking requests
                cursor.execute("""
                    SELECT 
                        id, client_id, trainer_id, session_type, 
                        status, created_at, preferred_start_date
                    FROM booking_requests 
                    ORDER BY created_at DESC 
                    LIMIT 5
                """)
                
                requests = cursor.fetchall()
                print(f"\n📋 Recent booking requests:")
                print(f"{'ID':<4} {'Client':<8} {'Trainer':<8} {'Type':<15} {'Status':<10} {'Created':<20}")
                print("-" * 80)
                
                for req in requests:
                    req_id, client_id, trainer_id, session_type, status, created_at, preferred_start = req
                    created_str = created_at.strftime('%Y-%m-%d %H:%M') if created_at else 'N/A'
                    print(f"{req_id:<4} {client_id:<8} {trainer_id:<8} {session_type:<15} {status:<10} {created_str:<20}")
            else:
                print("  No booking requests found")
                
    except Exception as e:
        print(f"❌ Error checking booking requests: {e}")
    finally:
        if 'connection' in locals() and connection.open:
            connection.close()

if __name__ == "__main__":
    check_time_slots()
    check_booking_requests()
    print("\n✅ Database check completed!")
