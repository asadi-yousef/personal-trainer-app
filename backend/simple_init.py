"""
Simple database initialization script for FitConnect
"""
import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

def test_imports():
    """Test if all imports work"""
    try:
        print("🔄 Testing imports...")
        
        from app.config import settings
        print("✅ Config imported successfully")
        
        from app.database import engine
        print("✅ Database engine imported successfully")
        
        from app.models import User
        print("✅ Models imported successfully")
        
        print(f"📊 Database URL: {settings.database_url}")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_database_connection():
    """Test database connection"""
    try:
        print("🔄 Testing database connection...")
        
        from app.database import engine
        from sqlalchemy import text
        
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Database connection successful")
            return True
            
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def main():
    """Main function"""
    print("🚀 Simple FitConnect Database Test")
    print("=" * 50)
    
    # Test imports
    if not test_imports():
        print("❌ Import test failed")
        return
    
    # Test database connection
    if not test_database_connection():
        print("❌ Database connection test failed")
        return
    
    print("=" * 50)
    print("🎉 All tests passed!")

if __name__ == "__main__":
    main()




















