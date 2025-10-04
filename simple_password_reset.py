#!/usr/bin/env python3
"""
Simple password reset using direct database connection
"""
import pymysql
import bcrypt

def reset_password():
    print("🔧 Resetting Client Password...")
    print("=" * 50)
    
    try:
        # Connect to database
        connection = pymysql.connect(
            host='localhost',
            user='root',
            password='yosef2005',
            database='fitconnect_db',
            charset='utf8mb4'
        )
        
        with connection.cursor() as cursor:
            # Check if client user exists
            cursor.execute("SELECT id, email, full_name FROM users WHERE email = 'example@gmail.com'")
            user = cursor.fetchone()
            
            if user:
                print(f"✅ Found client user: {user[2]} ({user[1]})")
                
                # Hash new password
                new_password = "password"
                hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                
                # Update password
                cursor.execute(
                    "UPDATE users SET hashed_password = %s WHERE id = %s",
                    (hashed_password, user[0])
                )
                connection.commit()
                
                print(f"✅ Password reset to: {new_password}")
                
            else:
                print("❌ Client user not found. Creating new test user...")
                
                # Hash password
                new_password = "password"
                hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                
                # Create new user
                cursor.execute("""
                    INSERT INTO users (email, username, full_name, hashed_password, role, is_active, is_verified, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
                """, (
                    "testclient@example.com",
                    "testclient", 
                    "Test Client",
                    hashed_password,
                    "client",
                    True,
                    True
                ))
                connection.commit()
                
                print(f"✅ Created test client user:")
                print(f"   Email: testclient@example.com")
                print(f"   Password: {new_password}")
        
        connection.close()
        
        print("\n" + "=" * 50)
        print("🎯 Now you can test with these credentials:")
        print("   Email: example@gmail.com (or testclient@example.com)")
        print("   Password: password")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    reset_password()
