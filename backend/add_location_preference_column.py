#!/usr/bin/env python3
"""
Quick migration script to add location_preference column to trainers table
"""

import pymysql
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def add_location_preference_column():
    """Add location_preference column to trainers table"""
    
    # Database connection parameters
    host = os.getenv('DB_HOST', 'localhost')
    port = int(os.getenv('DB_PORT', 3306))
    user = os.getenv('DB_USER', 'root')
    password = os.getenv('DB_PASSWORD', '')
    database = os.getenv('DB_NAME', 'fitconnect')
    
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
        print("🎉 Migration completed successfully!")
    else:
        print("💥 Migration failed!")









