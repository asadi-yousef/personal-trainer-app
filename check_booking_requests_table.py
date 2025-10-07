import pymysql

# Database connection details
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'yosef2005',
    'database': 'fitconnect_db'
}

def check_booking_requests_table():
    print("🔍 Checking booking_requests table...")
    
    try:
        connection = pymysql.connect(**DB_CONFIG)
        with connection.cursor() as cursor:
            
            # Check if table exists
            cursor.execute("SHOW TABLES LIKE 'booking_requests'")
            table_exists = cursor.fetchone()
            
            if table_exists:
                print("✅ booking_requests table exists")
                
                # Check table structure
                cursor.execute("DESCRIBE booking_requests")
                columns = cursor.fetchall()
                print("\n📋 Table structure:")
                for col in columns:
                    print(f"  {col[0]}: {col[1]} {col[2] or ''} {col[3] or ''} {col[4] or ''} {col[5] or ''}")
                
                # Check if there are any records
                cursor.execute("SELECT COUNT(*) FROM booking_requests")
                count = cursor.fetchone()[0]
                print(f"\n📊 Total records: {count}")
                
            else:
                print("❌ booking_requests table does not exist")
                print("Creating table...")
                
                # Create the table
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
                print("✅ booking_requests table created")
                
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if 'connection' in locals() and connection.open:
            connection.close()

if __name__ == "__main__":
    check_booking_requests_table()
