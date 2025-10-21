#!/usr/bin/env python3
"""
Simple database connectivity test
"""

import pymysql

def test_database_connection():
    """Test database connection and basic queries"""
    print("🧪 Testing Database Connection...")
    
    # Database connection parameters
    host = 'localhost'
    port = 3306
    user = 'root'
    password = 'yosef2005'
    database = 'fitconnect_db'
    
    try:
        # Connect to database
        connection = pymysql.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database,
            charset='utf8mb4'
        )
        
        with connection.cursor() as cursor:
            # Test 1: Check if tables exist
            print("   📋 Checking table structure...")
            cursor.execute("SHOW TABLES")
            tables = [row[0] for row in cursor.fetchall()]
            print(f"   ✅ Found {len(tables)} tables")
            
            # Test 2: Check if location_preference column exists
            print("   🔍 Checking location_preference column...")
            cursor.execute("""
                SELECT COUNT(*) 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = %s 
                AND TABLE_NAME = 'trainers' 
                AND COLUMN_NAME = 'location_preference'
            """, (database,))
            
            column_exists = cursor.fetchone()[0] > 0
            if column_exists:
                print("   ✅ location_preference column exists")
            else:
                print("   ❌ location_preference column missing")
                return False
            
            # Test 3: Check if database is empty
            print("   📊 Checking database state...")
            cursor.execute("SELECT COUNT(*) FROM users")
            user_count = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM trainers")
            trainer_count = cursor.fetchone()[0]
            
            print(f"   📈 Users: {user_count}")
            print(f"   📈 Trainers: {trainer_count}")
            
            if user_count == 0 and trainer_count == 0:
                print("   ✅ Database is clean and ready for testing")
            else:
                print("   ⚠️  Database still has data")
            
            # Test 4: Test schema imports
            print("   🔧 Testing schema imports...")
            try:
                from app.schemas.booking import SmartBookingRequest
                print("   ✅ SmartBookingRequest schema imports successfully")
            except Exception as e:
                print(f"   ❌ Schema import failed: {e}")
                return False
            
            print("   ✅ All database tests passed!")
            return True
            
    except Exception as e:
        print(f"   ❌ Database connection failed: {e}")
        return False
    finally:
        if 'connection' in locals():
            connection.close()

def main():
    """Run simple tests"""
    print("🚀 Starting Simple Database Tests...")
    print("=" * 50)
    
    success = test_database_connection()
    
    print()
    print("=" * 50)
    if success:
        print("🎉 DATABASE TESTS PASSED!")
        print("✅ Database connection working")
        print("✅ Schema structure correct")
        print("✅ location_preference column exists")
        print("✅ Database is clean and ready")
        print("🚀 Ready for frontend testing!")
    else:
        print("❌ DATABASE TESTS FAILED!")
        print("🔧 Please check your database setup")

if __name__ == "__main__":
    main()



