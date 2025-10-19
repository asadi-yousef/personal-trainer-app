"""
Simple script to create test users for TestSprite
"""
import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(__file__))

from app.database import get_db
from app.models import User, UserRole
from app.utils.auth import get_password_hash

def create_test_users():
    """Create test users for TestSprite"""
    try:
        db = next(get_db())
        
        test_users = [
            {
                "email": "client@example.com",
                "username": "testclient",
                "full_name": "Test Client",
                "password": "password123",
                "role": UserRole.CLIENT
            },
            {
                "email": "trainer@example.com", 
                "username": "testtrainer",
                "full_name": "Test Trainer",
                "password": "password123",
                "role": UserRole.TRAINER
            },
            {
                "email": "admin@example.com",
                "username": "testadmin", 
                "full_name": "Test Admin",
                "password": "password123",
                "role": UserRole.ADMIN
            }
        ]
        
        for user_data in test_users:
            # Check if user already exists
            existing_user = db.query(User).filter(User.email == user_data["email"]).first()
            
            if existing_user:
                print(f"✅ User {user_data['email']} already exists")
                continue
                
            # Create new user
            hashed_password = get_password_hash(user_data["password"])
            new_user = User(
                email=user_data["email"],
                username=user_data["username"],
                full_name=user_data["full_name"],
                hashed_password=hashed_password,
                role=user_data["role"],
                is_active=True
            )
            
            db.add(new_user)
            print(f"✅ Created user: {user_data['email']} ({user_data['role']})")
        
        db.commit()
        print("\n🎉 All test users created successfully!")
        print("\nTest Credentials:")
        print("Client: client@example.com / password123")
        print("Trainer: trainer@example.com / password123") 
        print("Admin: admin@example.com / password123")
        
    except Exception as e:
        print(f"❌ Error creating users: {e}")
        db.rollback()

if __name__ == "__main__":
    create_test_users()
