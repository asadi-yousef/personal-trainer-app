"""
Test script to verify new MySQL password works
"""
import pymysql
import sys

def test_password(password):
    """Test if the new password works"""
    try:
        print(f"🔄 Testing password: {password[:3]}***{password[-3:] if len(password) > 6 else '***'}")
        
        # Try to connect with new password
        connection = pymysql.connect(
            host='localhost',
            port=3306,
            user='root',
            password=password,
            charset='utf8mb4'
        )
        
        print("✅ Password works! Connection successful!")
        
        # Test database access
        with connection.cursor() as cursor:
            cursor.execute("SHOW DATABASES")
            databases = cursor.fetchall()
            print(f"📊 Can access {len(databases)} databases")
            
            # Check if our database exists
            cursor.execute("SHOW DATABASES LIKE 'fitconnect_db'")
            result = cursor.fetchone()
            if result:
                print("✅ fitconnect_db database is accessible")
            else:
                print("⚠️  fitconnect_db database not found")
        
        connection.close()
        return True
        
    except pymysql.Error as e:
        print(f"❌ Password test failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def main():
    """Main function"""
    if len(sys.argv) != 2:
        print("Usage: python test_new_password.py <your_new_password>")
        print("Example: python test_new_password.py 'MyStrongPassword123!@#'")
        return
    
    password = sys.argv[1]
    
    if len(password) < 8:
        print("⚠️  Warning: Password is less than 8 characters")
    
    if test_password(password):
        print("\n🎉 Password is working correctly!")
        print("📋 Next steps:")
        print("   1. Update your .env file with this password")
        print("   2. Restart your API server")
    else:
        print("\n❌ Password test failed!")
        print("📋 Troubleshooting:")
        print("   1. Make sure you changed the MySQL password")
        print("   2. Check if MySQL service is running")
        print("   3. Verify the password is correct")

if __name__ == "__main__":
    main()





















