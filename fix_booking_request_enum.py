import pymysql

# Database connection details
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'yosef2005',
    'database': 'fitconnect_db'
}

def fix_booking_request_enum():
    print("🔧 Fixing booking_requests enum values...")
    
    try:
        connection = pymysql.connect(**DB_CONFIG)
        with connection.cursor() as cursor:
            
            # First, let's see what the current enum values are
            cursor.execute("SHOW COLUMNS FROM booking_requests LIKE 'status'")
            result = cursor.fetchone()
            if result:
                print(f"Current enum definition: {result[1]}")
            
            # Update the enum to use lowercase values
            print("Updating enum values to lowercase...")
            cursor.execute("""
                ALTER TABLE booking_requests 
                MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'expired') 
                DEFAULT 'pending'
            """)
            
            print("✅ Enum values updated successfully")
            
            # Verify the change
            cursor.execute("SHOW COLUMNS FROM booking_requests LIKE 'status'")
            result = cursor.fetchone()
            if result:
                print(f"New enum definition: {result[1]}")
                
    except Exception as e:
        print(f"❌ Error fixing enum: {e}")
    finally:
        if 'connection' in locals() and connection.open:
            connection.close()

def check_existing_data():
    print("\n🔍 Checking existing booking_requests data...")
    
    try:
        connection = pymysql.connect(**DB_CONFIG)
        with connection.cursor() as cursor:
            
            # Check if there are any existing records
            cursor.execute("SELECT COUNT(*) FROM booking_requests")
            count = cursor.fetchone()[0]
            print(f"Total booking_requests: {count}")
            
            if count > 0:
                # Show existing records
                cursor.execute("SELECT id, status FROM booking_requests LIMIT 5")
                records = cursor.fetchall()
                print("Existing records:")
                for record in records:
                    print(f"  ID {record[0]}: status = {record[1]}")
                    
    except Exception as e:
        print(f"❌ Error checking data: {e}")
    finally:
        if 'connection' in locals() and connection.open:
            connection.close()

if __name__ == "__main__":
    check_existing_data()
    fix_booking_request_enum()
    print("\n✅ Enum fix completed!")
