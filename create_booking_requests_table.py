import pymysql
from datetime import datetime, timedelta

# Database connection details
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'yosef2005',
    'database': 'fitconnect_db'
}

def create_booking_requests_table():
    print("🚀 Creating booking_requests table...")
    try:
        connection = pymysql.connect(**DB_CONFIG)
        with connection.cursor() as cursor:
            # Drop table if it exists
            cursor.execute("DROP TABLE IF EXISTS booking_requests")
            
            # Create booking_requests table
            create_table_query = """
            CREATE TABLE booking_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                client_id INT NOT NULL,
                trainer_id INT NOT NULL,
                session_type VARCHAR(100) NOT NULL,
                duration_minutes INT NOT NULL,
                location VARCHAR(255),
                special_requests TEXT,
                preferred_start_date DATETIME,
                preferred_end_date DATETIME,
                preferred_times TEXT,
                avoid_times TEXT,
                allow_weekends BOOLEAN DEFAULT TRUE,
                allow_evenings BOOLEAN DEFAULT TRUE,
                is_recurring BOOLEAN DEFAULT FALSE,
                recurring_pattern VARCHAR(50),
                status ENUM('pending', 'approved', 'rejected', 'expired') DEFAULT 'pending',
                confirmed_date DATETIME,
                alternative_dates TEXT,
                notes TEXT,
                rejection_reason TEXT,
                expires_at DATETIME,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (client_id) REFERENCES users(id),
                FOREIGN KEY (trainer_id) REFERENCES trainers(id)
            );
            """
            cursor.execute(create_table_query)
            print("✅ booking_requests table created successfully")
        connection.commit()
    except Exception as e:
        print(f"❌ Error creating booking_requests table: {e}")
    finally:
        if 'connection' in locals() and connection.open:
            connection.close()

def create_sample_booking_requests():
    print("Creating sample booking requests...")
    try:
        connection = pymysql.connect(**DB_CONFIG)
        with connection.cursor() as cursor:
            # Create sample booking requests
            sample_requests = [
                {
                    'client_id': 2,  # Assuming client with ID 2 exists
                    'trainer_id': 1,  # Assuming trainer with ID 1 exists
                    'session_type': 'Personal Training',
                    'duration_minutes': 60,
                    'location': 'Gym Studio A',
                    'special_requests': 'Focus on strength training',
                    'preferred_start_date': (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d %H:%M:%S'),
                    'preferred_end_date': (datetime.now() + timedelta(days=3)).strftime('%Y-%m-%d %H:%M:%S'),
                    'preferred_times': '["09:00", "10:00", "14:00"]',
                    'avoid_times': '["12:00", "18:00"]',
                    'allow_weekends': True,
                    'allow_evenings': True,
                    'is_recurring': False,
                    'status': 'pending',
                    'expires_at': (datetime.now() + timedelta(hours=24)).strftime('%Y-%m-%d %H:%M:%S')
                },
                {
                    'client_id': 2,
                    'trainer_id': 1,
                    'session_type': 'Cardio Training',
                    'duration_minutes': 45,
                    'location': 'Gym Studio B',
                    'special_requests': 'High intensity interval training',
                    'preferred_start_date': (datetime.now() + timedelta(days=2)).strftime('%Y-%m-%d %H:%M:%S'),
                    'preferred_end_date': (datetime.now() + timedelta(days=4)).strftime('%Y-%m-%d %H:%M:%S'),
                    'preferred_times': '["08:00", "17:00"]',
                    'avoid_times': '["12:00", "13:00"]',
                    'allow_weekends': False,
                    'allow_evenings': True,
                    'is_recurring': True,
                    'recurring_pattern': 'weekly',
                    'status': 'pending',
                    'expires_at': (datetime.now() + timedelta(hours=24)).strftime('%Y-%m-%d %H:%M:%S')
                }
            ]
            
            for request in sample_requests:
                # Build dynamic insert query based on available fields
                fields = list(request.keys())
                placeholders = [f"%({field})s" for field in fields]
                
                insert_query = f"""
                INSERT INTO booking_requests ({', '.join(fields)})
                VALUES ({', '.join(placeholders)})
                """
                cursor.execute(insert_query, request)
            
            print("✅ Created sample booking requests")
        connection.commit()
    except Exception as e:
        print(f"❌ Error creating sample booking requests: {e}")
    finally:
        if 'connection' in locals() and connection.open:
            connection.close()

def describe_table(table_name: str):
    print(f"\n📋 {table_name} table structure:")
    try:
        connection = pymysql.connect(**DB_CONFIG)
        with connection.cursor() as cursor:
            cursor.execute(f"DESCRIBE {table_name}")
            for row in cursor.fetchall():
                print(f"  {row[0]}: {row[1]} {row[2] or ''} {row[3] or ''} {row[4] or ''} {row[5] or ''}")
    except Exception as e:
        print(f"❌ Error describing table {table_name}: {e}")
    finally:
        if 'connection' in locals() and connection.open:
            connection.close()

if __name__ == "__main__":
    create_booking_requests_table()
    create_sample_booking_requests()
    describe_table("booking_requests")

    # Count total booking requests
    try:
        connection = pymysql.connect(**DB_CONFIG)
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM booking_requests")
            total_requests = cursor.fetchone()[0]
            print(f"\n📊 Total booking requests created: {total_requests}")
            
            print("\n🔍 Sample booking requests:")
            cursor.execute("SELECT id, client_id, trainer_id, session_type, status, created_at FROM booking_requests LIMIT 5")
            for row in cursor.fetchall():
                print(f"  ID: {row[0]}, Client: {row[1]}, Trainer: {row[2]}, Type: {row[3]}, Status: {row[4]}, Created: {row[5]}")
        connection.commit()
    except Exception as e:
        print(f"❌ Error counting booking requests: {e}")
    finally:
        if 'connection' in locals() and connection.open:
            connection.close()
    
    print("\n✅ Booking requests setup completed!")
