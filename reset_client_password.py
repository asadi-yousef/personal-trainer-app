#!/usr/bin/env python3
"""
Reset client password or create test user
"""
import sys
import os
sys.path.append('backend')

# Set environment variable to avoid table redefinition
os.environ['SQLALCHEMY_DATABASE_URL'] = 'mysql+pymysql://root:password@localhost/fitconnect'

from backend.app.database import get_db
from backend.app.models import User, Trainer
from backend.app.utils.auth import get_password_hash
from sqlalchemy.orm import Session

def reset_client_password():
    print("🔧 Resetting Client Password...")
    print("=" * 50)
    
    try:
        # Get database session
        db = next(get_db())
        
        # Find the client user
        client_user = db.query(User).filter(User.email == "example@gmail.com").first()
        
        if client_user:
            print(f"✅ Found client user: {client_user.full_name}")
            print(f"   Email: {client_user.email}")
            print(f"   Role: {client_user.role}")
            
            # Reset password to "password"
            new_password = "password"
            hashed_password = get_password_hash(new_password)
            client_user.hashed_password = hashed_password
            
            db.commit()
            print(f"✅ Password reset to: {new_password}")
            
        else:
            print("❌ Client user not found. Creating new test user...")
            
            # Create new test client user
            test_user = User(
                email="testclient@example.com",
                username="testclient",
                full_name="Test Client",
                hashed_password=get_password_hash("password"),
                role="client",
                is_active=True,
                is_verified=True
            )
            
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
            
            print(f"✅ Created test client user:")
            print(f"   Email: testclient@example.com")
            print(f"   Password: password")
        
        print("\n" + "=" * 50)
        print("🎯 Now you can test with these credentials:")
        print("   Email: example@gmail.com (or testclient@example.com)")
        print("   Password: password")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    reset_client_password()
