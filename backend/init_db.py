"""
Database initialization script for FitConnect
"""
import asyncio
import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.config import settings
from app.database import create_tables, engine
from app.models import *


def create_database():
    """Create the database if it doesn't exist"""
    try:
        # Connect to MySQL server without specifying database
        from urllib.parse import quote_plus
        password_encoded = quote_plus(settings.db_password)
        server_url = f"mysql+pymysql://{settings.db_user}:{password_encoded}@{settings.db_host}:{settings.db_port}/"
        server_engine = create_engine(server_url)
        
        with server_engine.connect() as conn:
            # Create database if it doesn't exist
            conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {settings.db_name}"))
            conn.commit()
            print(f"Database '{settings.db_name}' created or already exists")
            
    except SQLAlchemyError as e:
        print(f"Error creating database: {e}")
        return False
    
    return True


def create_all_tables():
    """Create all database tables"""
    try:
        create_tables()
        print("All database tables created successfully")
        return True
    except SQLAlchemyError as e:
        print(f"Error creating tables: {e}")
        return False


def test_connection():
    """Test database connection"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("Database connection successful")
            return True
    except SQLAlchemyError as e:
        print(f"Database connection failed: {e}")
        return False


def main():
    """Main initialization function"""
    print("Initializing FitConnect Database...")
    print(f"Database: {settings.db_name}")
    print(f"Host: {settings.db_host}:{settings.db_port}")
    print(f"User: {settings.db_user}")
    print("-" * 50)
    
    # Step 1: Create database
    if not create_database():
        print("Failed to create database")
        return
    
    # Step 2: Test connection
    if not test_connection():
        print("Failed to connect to database")
        return
    
    # Step 3: Create tables
    if not create_all_tables():
        print("Failed to create tables")
        return
    
    print("-" * 50)
    print("Database initialization completed successfully!")
    print("Next steps:")
    print("   1. Run: alembic revision --autogenerate -m 'Initial migration'")
    print("   2. Run: alembic upgrade head")
    print("   3. Start the FastAPI server")


if __name__ == "__main__":
    main()
