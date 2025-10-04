#!/usr/bin/env python3
"""
Simple login test
"""
import requests
import json

def test_login():
    print("🔍 Testing Login API")
    print("=" * 30)
    
    # Test login
    login_data = {
        "email": "example@gmail.com",
        "password": "password"
    }
    
    try:
        response = requests.post("http://127.0.0.1:8000/api/auth/login", json=login_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Login successful!")
            data = response.json()
            print(f"User: {data.get('user', {}).get('email')}")
            print(f"Token: {data.get('access_token', '')[:20]}...")
        else:
            print("❌ Login failed")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_login()

