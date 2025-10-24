"""
Test all imports to ensure everything works
"""
import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

def test_imports():
    """Test all imports"""
    try:
        print("🔄 Testing imports...")
        
        # Test config
        from app.config import settings
        print("✅ Config imported successfully")
        print(f"   Database URL: {settings.database_url}")
        
        # Test database
        from app.database import Base, engine
        print("✅ Database imported successfully")
        
        # Test models
        from app.models import User, Trainer, Session, Program, Message, Booking
        print("✅ Models imported successfully")
        
        # Test main app
        from app.main import app
        print("✅ Main app imported successfully")
        
        print("🎉 All imports successful!")
        return True
        
    except Exception as e:
        print(f"❌ Import failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_imports()











































