#!/usr/bin/env python3
"""
First add the location_preference column to the database
"""

import pymysql

def add_location_preference_column():
    """Add location_preference column to trainers table"""
    
    # Database connection parameters from config
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
        return False
    finally:
        if 'connection' in locals():
            connection.close()
    
    return True

if __name__ == "__main__":
    print("🔄 Adding location_preference column to trainers table...")
    success = add_location_preference_column()
    if success:
        print("🎉 Column added successfully!")
        print("🚀 Now you can run: python update_existing_trainers.py")
    else:
        print("💥 Failed to add column!")









