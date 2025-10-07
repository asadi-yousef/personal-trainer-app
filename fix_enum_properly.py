import pymysql

# Database connection details
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'yosef2005',
    'database': 'fitconnect_db'
}

def fix_enum_properly():
    print("🔧 Fixing booking_requests enum values properly...")
    
    try:
        connection = pymysql.connect(**DB_CONFIG)
        with connection.cursor() as cursor:
            
            # First, let's see what the current enum values are
            cursor.execute("SHOW COLUMNS FROM booking_requests LIKE 'status'")
            result = cursor.fetchone()
            if result:
                print(f"Current enum definition: {result[1]}")
            
            # Check if there are any existing records with uppercase values
            cursor.execute("SELECT id, status FROM booking_requests WHERE status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED')")
            uppercase_records = cursor.fetchall()
            
            if uppercase_records:
                print(f"Found {len(uppercase_records)} records with uppercase enum values")
                print("Converting to lowercase...")
                
                # Convert existing records to lowercase
                cursor.execute("UPDATE booking_requests SET status = 'pending' WHERE status = 'PENDING'")
                cursor.execute("UPDATE booking_requests SET status = 'approved' WHERE status = 'APPROVED'")
                cursor.execute("UPDATE booking_requests SET status = 'rejected' WHERE status = 'REJECTED'")
                cursor.execute("UPDATE booking_requests SET status = 'expired' WHERE status = 'EXPIRED'")
                
                print("✅ Converted existing records to lowercase")
            
            # Now update the enum definition
            print("Updating enum definition to lowercase...")
            cursor.execute("""
                ALTER TABLE booking_requests 
                MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'expired') 
                DEFAULT 'pending'
            """)
            
            print("✅ Enum definition updated to lowercase")
            
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
    fix_enum_properly()
    print("\n✅ Enum fix completed!")
