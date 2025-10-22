#!/usr/bin/env python3
"""
Reset database for fresh testing
WARNING: This will delete ALL data from the database!
"""

import pymysql

def reset_database():
    """Reset database by clearing all data but keeping table structure"""
    
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
            print("🗑️  Clearing all data from database...")
            
            # List of tables to clear (in dependency order to avoid foreign key issues)
            tables_to_clear = [
                'workout_progress',
                'session_goals', 
                'session_tracking',
                'program_assignments',
                'workouts',
                'programs',
                'time_slots',
                'trainer_availability',
                'trainer_scheduling_preferences',
                'booking_requests',
                'bookings',
                'sessions',
                'payments',
                'messages',
                'conversations',
                'trainers',
                'users'
            ]
            
            # Disable foreign key checks temporarily
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
            
            cleared_count = 0
            for table in tables_to_clear:
                try:
                    # Check if table exists
                    cursor.execute(f"SHOW TABLES LIKE '{table}'")
                    if cursor.fetchone():
                        # Clear table
                        cursor.execute(f"DELETE FROM {table}")
                        rows_affected = cursor.rowcount
                        if rows_affected > 0:
                            print(f"   ✅ Cleared {rows_affected} rows from {table}")
                            cleared_count += rows_affected
                        else:
                            print(f"   ⏭️  Table {table} was already empty")
                    else:
                        print(f"   ⚠️  Table {table} does not exist")
                except Exception as e:
                    print(f"   ❌ Error clearing {table}: {e}")
            
            # Re-enable foreign key checks
            cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
            
            # Reset auto-increment counters
            for table in tables_to_clear:
                try:
                    cursor.execute(f"ALTER TABLE {table} AUTO_INCREMENT = 1")
                except:
                    pass  # Some tables might not have auto-increment
            
            connection.commit()
            print(f"\n🎉 Database reset completed!")
            print(f"📊 Total rows cleared: {cleared_count}")
            print("🔄 Auto-increment counters reset to 1")
            print("🚀 Database is ready for fresh testing!")
            
    except Exception as e:
        print(f"❌ Error resetting database: {e}")
        return False
    finally:
        if 'connection' in locals():
            connection.close()
    
    return True

if __name__ == "__main__":
    print("⚠️  WARNING: This will delete ALL data from the database!")
    print("📝 Make sure you have backups if needed")
    print("🔄 Proceeding with database reset...")
    print()
    
    success = reset_database()
    if success:
        print("\n✅ Database reset completed successfully!")
        print("🧪 Ready for comprehensive testing!")
    else:
        print("\n💥 Database reset failed!")
        print("🔧 Please check your database connection")





