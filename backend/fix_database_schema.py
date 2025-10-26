#!/usr/bin/env python3
"""
Simple migration script to add location_preference column to trainers table
"""

import pymysql

def add_location_preference_column():
    """Add location_preference column to trainers table"""
    
    # Database connection parameters - adjust these values as needed
    host = 'localhost'
    port = 3306
    user = 'root'
    password = ''  # Add your MySQL password here if needed
    database = 'fitconnect'  # Adjust database name if different
    
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
            # Check if column already exists
            cursor.execute("""
                SELECT COUNT(*) 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = %s 
                AND TABLE_NAME = 'trainers' 
                AND COLUMN_NAME = 'location_preference'
            """, (database,))
            
            column_exists = cursor.fetchone()[0] > 0
            
            if column_exists:
                print("✅ Column 'location_preference' already exists in trainers table")
            else:
                # Add the column
                cursor.execute("""
                    ALTER TABLE trainers 
                    ADD COLUMN location_preference VARCHAR(50) DEFAULT 'specific_gym' 
                    AFTER gym_phone
                """)
                print("✅ Successfully added 'location_preference' column to trainers table")
            
            connection.commit()
            print("✅ Database migration completed successfully")
            
    except Exception as e:
        print(f"❌ Error adding column: {e}")
        print("💡 Make sure your MySQL server is running and the database exists")
        print("💡 Adjust the connection parameters in this script if needed")
        return False
    finally:
        if 'connection' in locals():
            connection.close()
    
    return True

if __name__ == "__main__":
    print("🔄 Adding location_preference column to trainers table...")
    print("📝 Make sure to update the database connection parameters in this script if needed")
    success = add_location_preference_column()
    if success:
        print("🎉 Migration completed successfully!")
        print("🚀 You can now restart your backend server")
    else:
        print("💥 Migration failed!")
        print("🔧 Please check your database connection and run the script again")











