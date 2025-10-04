#!/usr/bin/env python3
"""
Test the bookings endpoint to debug the 500 error
"""
import requests
import json

def test_bookings_endpoint():
    print("🔍 Testing bookings endpoint...")
    print("=" * 50)
    
    try:
        # Test without authentication first
        print("1. Testing without authentication:")
        response = requests.get('http://127.0.0.1:8000/api/bookings?limit=5')
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:500]}")
        print()
        
        # Test with authentication
        print("2. Testing with authentication:")
        # First login to get token
        login_data = {
            "email": "example@gmail.com",
            "password": "password"
        }
        
        login_response = requests.post('http://127.0.0.1:8000/api/auth/login', json=login_data)
        print(f"   Login status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            token = login_response.json().get('access_token')
            headers = {'Authorization': f'Bearer {token}'}
            
            bookings_response = requests.get('http://127.0.0.1:8000/api/bookings?limit=5', headers=headers)
            print(f"   Bookings status: {bookings_response.status_code}")
            print(f"   Bookings response: {bookings_response.text[:500]}")
        else:
            print(f"   Login failed: {login_response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n" + "=" * 50)

if __name__ == "__main__":
    test_bookings_endpoint()

