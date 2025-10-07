import pymysql

# Database connection details
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'yosef2005',
    'database': 'fitconnect_db'
}

def fix_enum_final():
    print("🔧 Final enum fix - using uppercase values...")
    
    try:
        connection = pymysql.connect(**DB_CONFIG)
        with connection.cursor() as cursor:
            
            # First, convert all existing records to uppercase
            print("Converting existing records to uppercase...")
            cursor.execute("UPDATE booking_requests SET status = 'PENDING' WHERE status = 'pending'")
            cursor.execute("UPDATE booking_requests SET status = 'APPROVED' WHERE status = 'approved'")
            cursor.execute("UPDATE booking_requests SET status = 'REJECTED' WHERE status = 'rejected'")
            cursor.execute("UPDATE booking_requests SET status = 'EXPIRED' WHERE status = 'expired'")
            
            print("✅ Converted existing records to uppercase")
            
            # Now update the enum definition to uppercase
            print("Updating enum definition to uppercase...")
            cursor.execute("""
                ALTER TABLE booking_requests 
                MODIFY COLUMN status ENUM('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED') 
                DEFAULT 'PENDING'
            """)
            
            print("✅ Enum definition updated to uppercase")
            
            # Verify the change
            cursor.execute("SHOW COLUMNS FROM booking_requests LIKE 'status'")
            result = cursor.fetchone()
            if result:
                print(f"New enum definition: {result[1]}")
            
            # Check existing records
            cursor.execute("SELECT id, status FROM booking_requests LIMIT 5")
            records = cursor.fetchall()
            print(f"\n📋 Sample records after fix:")
            for record in records:
                print(f"  ID {record[0]}: status = {record[1]}")
                
    except Exception as e:
        print(f"❌ Error fixing enum: {e}")
    finally:
        if 'connection' in locals() and connection.open:
            connection.close()

if __name__ == "__main__":
    fix_enum_final()
    print("\n✅ Final enum fix completed!")
