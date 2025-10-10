"""
Check current secret key and generate a new one if needed
"""
import os

def check_secret_key():
    """Check if secret key exists and show it"""
    print("🔍 Checking for existing secret key...")
    
    # Check environment variable
    secret_key = os.getenv("SECRET_KEY")
    
    if secret_key:
        print(f"✅ Found SECRET_KEY in environment: {secret_key[:10]}...")
        return secret_key
    else:
        print("❌ No SECRET_KEY found in environment")
        return None

def generate_new_secret():
    """Generate a new secret key"""
    import secrets
    new_secret = secrets.token_urlsafe(32)
    print(f"🔑 Generated new SECRET_KEY: {new_secret}")
    return new_secret

def main():
    """Main function"""
    print("🔐 Secret Key Checker")
    print("=" * 40)
    
    existing_key = check_secret_key()
    
    if not existing_key:
        print("\n🔄 Generating new secret key...")
        new_key = generate_new_secret()
        
        print("\n📝 Add this to your .env file:")
        print(f"SECRET_KEY={new_key}")
        
        print("\n📋 Your .env file should look like:")
        print("DB_PASSWORD=your_mysql_password")
        print(f"SECRET_KEY={new_key}")
    else:
        print(f"\n✅ You already have a secret key: {existing_key[:20]}...")

if __name__ == "__main__":
    main()















