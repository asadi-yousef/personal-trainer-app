"""
Simple MySQL connection test
"""
import pymysql

def test_mysql_connection():
    """Test MySQL connection with your credentials"""
    try:
        print("🔄 Testing MySQL connection...")
        print("Host: localhost")
        print("Port: 3306")
        print("User: root")
        print("Password: 1@2@3@4_5Tuf (URL encoded: 1%402%403%404_5Tuf)")
        print("-" * 40)
        
        # Try to connect
        connection = pymysql.connect(
            host='localhost',
            port=3306,
            user='root',
            password='1@2@3@4_5Tuf',
            charset='utf8mb4'
        )
        
        print("✅ MySQL connection successful!")
        
        # Test creating database
        with connection.cursor() as cursor:
            cursor.execute("CREATE DATABASE IF NOT EXISTS fitconnect_db")
            print("✅ Database 'fitconnect_db' created successfully!")
            
            # List databases to confirm
            cursor.execute("SHOW DATABASES")
            databases = cursor.fetchall()
            print(f"📊 Available databases: {[db[0] for db in databases]}")
        
        connection.close()
        return True
        
    except pymysql.Error as e:
        print(f"❌ MySQL connection failed: {e}")
        print("\n🔧 Troubleshooting tips:")
        print("1. Make sure MySQL server is running")
        print("2. Check if the password is correct")
        print("3. Try connecting with MySQL Workbench or command line first")
        print("4. If you changed the root password, update it in app/config.py")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    test_mysql_connection()
