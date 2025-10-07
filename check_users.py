import pymysql

# Database connection details
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'yosef2005',
    'database': 'fitconnect_db'
}

def check_users():
    print("🔍 Checking users in database...")
    
    try:
        connection = pymysql.connect(**DB_CONFIG)
        with connection.cursor() as cursor:
            
            # Check all users
            cursor.execute("""
                SELECT id, email, full_name, role, is_active 
                FROM users 
                ORDER BY id
            """)
            users = cursor.fetchall()
            
            print(f"📊 Total users: {len(users)}")
            print(f"{'ID':<4} {'Email':<25} {'Name':<20} {'Role':<10} {'Active':<8}")
            print("-" * 70)
            
            for user in users:
                user_id, email, full_name, role, is_active = user
                active_status = "Yes" if is_active else "No"
                print(f"{user_id:<4} {email:<25} {full_name:<20} {role:<10} {active_status:<8}")
                
    except Exception as e:
        print(f"❌ Error checking users: {e}")
    finally:
        if 'connection' in locals() and connection.open:
            connection.close()

if __name__ == "__main__":
    check_users()
