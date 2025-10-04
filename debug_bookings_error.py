#!/usr/bin/env python3
"""
Debug the bookings endpoint error with detailed logging
"""
import requests
import json

def debug_bookings_error():
    print("🔍 Debugging bookings endpoint error...")
    print("=" * 50)
    
    try:
        # First login to get token
        login_data = {
            "email": "example@gmail.com",
            "password": "password"
        }
        
        print("1. Logging in...")
        login_response = requests.post('http://127.0.0.1:8000/api/auth/login', json=login_data)
        print(f"   Login status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            token = login_response.json().get('access_token')
            user_info = login_response.json().get('user')
            print(f"   User role: {user_info.get('role')}")
            print(f"   User ID: {user_info.get('id')}")
            
            headers = {'Authorization': f'Bearer {token}'}
            
            print("\n2. Testing bookings endpoint...")
            bookings_response = requests.get('http://127.0.0.1:8000/api/bookings?limit=5', headers=headers)
            print(f"   Bookings status: {bookings_response.status_code}")
            print(f"   Bookings response: {bookings_response.text}")
            
            # Try to get more details about the error
            if bookings_response.status_code == 500:
                print("\n3. Checking if it's a CORS issue...")
                # Try with different headers
                cors_headers = {
                    'Authorization': f'Bearer {token}',
                    'Origin': 'http://localhost:3000',
                    'Content-Type': 'application/json'
                }
                cors_response = requests.get('http://127.0.0.1:8000/api/bookings?limit=5', headers=cors_headers)
                print(f"   CORS test status: {cors_response.status_code}")
                print(f"   CORS test response: {cors_response.text[:200]}")
                
        else:
            print(f"   Login failed: {login_response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 50)

if __name__ == "__main__":
    debug_bookings_error()

