#!/usr/bin/env python3
"""
Update existing trainers with appropriate location preferences
"""

import pymysql

def update_existing_trainers():
    """Update existing trainers with location preferences based on their current setup"""
    
    # Database connection parameters from config
    host = 'localhost'
    port = 3306
    user = 'root'
    password = 'yosef2005'  # From app/config.py
    database = 'fitconnect_db'  # From app/config.py
    
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
            # Get all trainers
            cursor.execute("SELECT id, gym_name, location_preference FROM trainers")
            trainers = cursor.fetchall()
            
            print(f"📊 Found {len(trainers)} trainers to update")
            
            updated_count = 0
            
            for trainer_id, gym_name, current_preference in trainers:
                # Determine appropriate location preference
                if gym_name and gym_name.strip():
                    # If trainer has a gym name, they prefer specific gym
                    new_preference = 'specific_gym'
                    reason = f"has gym: {gym_name}"
                else:
                    # If no gym name, they prefer customer's choice
                    new_preference = 'customer_choice'
                    reason = "no gym specified"
                
                # Only update if preference is different
                if current_preference != new_preference:
                    cursor.execute("""
                        UPDATE trainers 
                        SET location_preference = %s 
                        WHERE id = %s
                    """, (new_preference, trainer_id))
                    
                    print(f"✅ Trainer {trainer_id}: {current_preference} → {new_preference} ({reason})")
                    updated_count += 1
                else:
                    print(f"⏭️  Trainer {trainer_id}: already set to {current_preference}")
            
            connection.commit()
            print(f"\n🎉 Successfully updated {updated_count} trainers")
            
            # Show summary
            cursor.execute("""
                SELECT location_preference, COUNT(*) as count 
                FROM trainers 
                GROUP BY location_preference
            """)
            summary = cursor.fetchall()
            
            print("\n📈 Location Preference Summary:")
            for preference, count in summary:
                print(f"   {preference}: {count} trainers")
            
    except Exception as e:
        print(f"❌ Error updating trainers: {e}")
        print("💡 Make sure your MySQL server is running and the database exists")
        return False
    finally:
        if 'connection' in locals():
            connection.close()
    
    return True

if __name__ == "__main__":
    print("🔄 Updating existing trainers with location preferences...")
    print("📝 This will set location preferences based on existing gym information")
    success = update_existing_trainers()
    if success:
        print("\n🎉 Migration completed successfully!")
        print("🚀 Existing trainers now have appropriate location preferences")
    else:
        print("\n💥 Migration failed!")
        print("🔧 Please check your database connection and run the script again")
