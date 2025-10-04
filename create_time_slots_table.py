#!/usr/bin/env python3
"""
Script to create the time_slots table in the database
"""

import pymysql
from datetime import datetime, timedelta

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'yosef2005',
    'database': 'fitconnect_db',
    'charset': 'utf8mb4'
}

def create_time_slots_table():
    """Create the time_slots table"""
    connection = pymysql.connect(**DB_CONFIG)
    
    try:
        with connection.cursor() as cursor:
            # Create time_slots table
            create_table_sql = """
            CREATE TABLE IF NOT EXISTS time_slots (
                id INT AUTO_INCREMENT PRIMARY KEY,
                trainer_id INT NOT NULL,
                date DATETIME NOT NULL,
                start_time DATETIME NOT NULL,
                end_time DATETIME NOT NULL,
                duration_minutes INT NOT NULL DEFAULT 60,
                is_available BOOLEAN DEFAULT TRUE,
                is_booked BOOLEAN DEFAULT FALSE,
                booking_id INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE CASCADE,
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
                INDEX idx_trainer_date (trainer_id, date),
                INDEX idx_start_time (start_time),
                INDEX idx_available (is_available, is_booked)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """
            
            cursor.execute(create_table_sql)
            print("✅ time_slots table created successfully")
            
            # Create some sample time slots for existing trainers
            cursor.execute("SELECT id FROM trainers LIMIT 1")
            trainer_result = cursor.fetchone()
            
            if trainer_result:
                trainer_id = trainer_result[0]
                print(f"Creating sample time slots for trainer {trainer_id}")
                
                # Create time slots for the next 2 weeks
                today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
                
                for day_offset in range(14):  # Next 2 weeks
                    current_date = today + timedelta(days=day_offset)
                    
                    # Skip weekends for now (can be changed)
                    if current_date.weekday() >= 5:  # Saturday or Sunday
                        continue
                    
                    # Create 1-hour slots from 9 AM to 6 PM
                    for hour in range(9, 18):
                        start_time = current_date.replace(hour=hour, minute=0)
                        end_time = start_time + timedelta(hours=1)
                        
                        insert_sql = """
                        INSERT INTO time_slots (trainer_id, date, start_time, end_time, duration_minutes, is_available, is_booked)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                        """
                        
                        cursor.execute(insert_sql, (
                            trainer_id,
                            current_date,
                            start_time,
                            end_time,
                            60,
                            True,
                            False
                        ))
                
                print(f"✅ Created sample time slots for trainer {trainer_id}")
            
            connection.commit()
            
    except Exception as e:
        print(f"❌ Error creating time_slots table: {e}")
        connection.rollback()
    finally:
        connection.close()

def verify_time_slots():
    """Verify the time_slots table was created correctly"""
    connection = pymysql.connect(**DB_CONFIG)
    
    try:
        with connection.cursor() as cursor:
            # Check table structure
            cursor.execute("DESCRIBE time_slots")
            columns = cursor.fetchall()
            print("\n📋 time_slots table structure:")
            for column in columns:
                print(f"  {column[0]}: {column[1]} {column[2]} {column[3]} {column[4]}")
            
            # Check sample data
            cursor.execute("SELECT COUNT(*) FROM time_slots")
            count = cursor.fetchone()[0]
            print(f"\n📊 Total time slots created: {count}")
            
            if count > 0:
                cursor.execute("SELECT * FROM time_slots LIMIT 5")
                samples = cursor.fetchall()
                print("\n🔍 Sample time slots:")
                for sample in samples:
                    print(f"  ID: {sample[0]}, Trainer: {sample[1]}, Date: {sample[2]}, Start: {sample[3]}, End: {sample[4]}")
            
    except Exception as e:
        print(f"❌ Error verifying time_slots table: {e}")
    finally:
        connection.close()

if __name__ == "__main__":
    print("🚀 Creating time_slots table...")
    create_time_slots_table()
    verify_time_slots()
    print("\n✅ Time slots setup completed!")
