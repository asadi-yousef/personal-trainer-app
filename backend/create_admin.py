#!/usr/bin/env python3
"""
Script to create the first admin user
"""
import sys
import os
from sqlalchemy.orm import Session
from passlib.context import CryptContext

# Add the app directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine
from app.models import AdminUser, AdminLevel, Base

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

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
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating admin: {e}")
        db.rollback()
        return False
    finally:
        db.close()


def list_admins():
    """List all existing admins"""
    db = SessionLocal()
    
    try:
        admins = db.query(AdminUser).all()
        
        if not admins:
            print("📝 No admin users found")
            return
        
        print("👥 Existing Admin Users:")
        print("=" * 40)
        
        for admin in admins:
            status = "🟢 Active" if admin.is_active else "🔴 Inactive"
            print(f"ID: {admin.id}")
            print(f"Username: {admin.username}")
            print(f"Email: {admin.email}")
            print(f"Level: {admin.admin_level}")
            print(f"Status: {status}")
            print(f"Created: {admin.created_at}")
            print(f"Last Login: {admin.last_login or 'Never'}")
            print("-" * 40)
            
    except Exception as e:
        print(f"❌ Error listing admins: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    print("🛠️  FitConnect Admin Setup")
    print("=" * 40)
    
    if len(sys.argv) > 1 and sys.argv[1] == "list":
        list_admins()
    else:
        create_first_admin()

