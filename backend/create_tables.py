"""
Simple script to create all database tables directly
"""
import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

def create_all_tables():
    """Create all database tables"""
    try:
        print("🔄 Creating database tables...")
        
        from app.database import create_tables
        create_tables()
        
        print("✅ All database tables created successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        import traceback
        traceback.print_exc()
        return False

def show_tables():
    """Show all created tables"""
    try:
        from app.database import engine
        from sqlalchemy import text
        
        with engine.connect() as conn:
            result = conn.execute(text("SHOW TABLES"))
            tables = result.fetchall()
            
            print("\n📊 Created tables:")
            for table in tables:
                print(f"   - {table[0]}")
                
    except Exception as e:
        print(f"❌ Error showing tables: {e}")

if __name__ == "__main__":
    if create_all_tables():
        show_tables()
        print("\n🎉 Database setup complete!")
        print("📋 Next steps:")
        print("   1. Start the API server: python -m app.main")
        print("   2. API will be available at: http://localhost:8000")
    else:
        print("\n❌ Database setup failed!")
