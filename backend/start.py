"""
Startup script for FitConnect API
"""
import subprocess
import sys
import os
from pathlib import Path


def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed")
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed")
        print(f"Error: {e.stderr}")
        return False


def main():
    """Main startup function"""
    print("🚀 FitConnect API Startup Script")
    print("=" * 50)
    
    # Change to backend directory
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    # Check if virtual environment is activated
    if not hasattr(sys, 'real_prefix') and not (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("⚠️  Virtual environment not detected. Please activate it first:")
        print("   Windows: .\\venv\\Scripts\\activate")
        print("   Linux/Mac: source venv/bin/activate")
        return
    
    # Install dependencies
    if not run_command("pip install -r requirements.txt", "Installing dependencies"):
        return
    
    # Initialize database
    if not run_command("python init_db.py", "Initializing database"):
        return
    
    # Create initial migration
    if not run_command("alembic revision --autogenerate -m 'Initial migration'", "Creating initial migration"):
        return
    
    # Apply migration
    if not run_command("alembic upgrade head", "Applying migration"):
        return
    
    print("=" * 50)
    print("🎉 Setup completed successfully!")
    print("📋 Next steps:")
    print("   1. Update database credentials in app/config.py if needed")
    print("   2. Run: python -m app.main")
    print("   3. API will be available at: http://localhost:8000")
    print("   4. API docs at: http://localhost:8000/docs")


if __name__ == "__main__":
    main()










