#!/usr/bin/env python3
"""
Simple test to isolate the bookings endpoint issue
"""
import requests
import json

def test_simple_bookings():
    print("🔍 Simple bookings test...")
    print("=" * 50)
    
    try:
        # Login
        login_data = {
            "email": "example@gmail.com",
            "password": "password"
        }
        
        login_response = requests.post('http://127.0.0.1:8000/api/auth/login', json=login_data)
        print(f"Login status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            token = login_response.json().get('access_token')
            headers = {'Authorization': f'Bearer {token}'}
            
            # Test with minimal parameters
            print("\nTesting with minimal parameters...")
            response = requests.get('http://127.0.0.1:8000/api/bookings', headers=headers)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
            
            # Test with limit=1
            print("\nTesting with limit=1...")
            response2 = requests.get('http://127.0.0.1:8000/api/bookings?limit=1', headers=headers)
            print(f"Status: {response2.status_code}")
            print(f"Response: {response2.text}")
            
        else:
            print(f"Login failed: {login_response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 50)

if __name__ == "__main__":
    test_simple_bookings()

