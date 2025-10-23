#!/usr/bin/env python3
"""
Script to create the first admin user using SQLite
"""
import sys
import os
from sqlalchemy.orm import Session
from passlib.context import CryptContext

# Add the app directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Use SQLite for admin creation
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import AdminUser, AdminLevel, Base

# Create SQLite engine for admin creation
sqlite_engine = create_engine("sqlite:///./admin_temp.db")
Base.metadata.create_all(bind=sqlite_engine)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sqlite_engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def create_first_admin():
    """Create the first admin user"""
    db = SessionLocal()
    
    try:
        # Check if any admins exist
        existing_admin = db.query(AdminUser).first()
        if existing_admin:
            print("❌ Admin users already exist!")
            print(f"   Found admin: {existing_admin.username}")
            return False
        
        # Get admin details from user
        print("🔐 Creating First Admin User")
        print("=" * 40)
        
        username = input("Enter admin username: ").strip()
        if not username:
            print("❌ Username cannot be empty!")
            return False
        
        email = input("Enter admin email: ").strip()
        if not email:
            print("❌ Email cannot be empty!")
            return False
        
        password = input("Enter admin password: ").strip()
        if len(password) < 8:
            print("❌ Password must be at least 8 characters!")
            return False
        
        confirm_password = input("Confirm password: ").strip()
        if password != confirm_password:
            print("❌ Passwords don't match!")
            return False
        
        # Create super admin
        admin = AdminUser(
            username=username,
            email=email,
            password_hash=get_password_hash(password),
            admin_level=AdminLevel.SUPER_ADMIN,
            is_active=True
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print("\n✅ First admin created successfully!")
        print(f"   Username: {admin.username}")
        print(f"   Email: {admin.email}")
        print(f"   Admin Level: {admin.admin_level}")
        print(f"   ID: {admin.id}")
        
        print("\n🚀 You can now login to the admin dashboard!")
        print("   Use the /api/admin/login endpoint with these credentials")
        
        # Now we need to insert this admin into the main database
        print("\n📝 Note: You'll need to manually add this admin to your main database")
        print("   Or restart your backend server to create the admin_users table")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating admin: {e}")
        db.rollback()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    print("🛠️  FitConnect Admin Setup (SQLite)")
    print("=" * 40)
    create_first_admin()

