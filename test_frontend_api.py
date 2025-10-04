#!/usr/bin/env python3
"""
Test script to verify frontend API connection
"""
import requests
import json

def test_api_connection():
    print("🔍 Testing Frontend API Connection")
    print("=" * 50)
    
    base_url = "http://127.0.0.1:8000"
    
    # Test 1: Health check
    print("1. Testing health endpoint...")
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False
    
    # Test 2: Login
    print("\n2. Testing login...")
    try:
        login_data = {
            "email": "example@gmail.com",
            "password": "password"
        }
        response = requests.post(f"{base_url}/api/auth/login", json=login_data)
        if response.status_code == 200:
            print("✅ Login successful")
            auth_data = response.json()
            token = auth_data.get('access_token')
            print(f"   User: {auth_data.get('user', {}).get('email')}")
            print(f"   Token: {token[:20]}..." if token else "   No token")
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Login error: {e}")
        return False
    
    # Test 3: Get bookings with token
    print("\n3. Testing bookings endpoint...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{base_url}/api/bookings", headers=headers)
        if response.status_code == 200:
            print("✅ Bookings endpoint accessible")
            bookings = response.json()
            print(f"   Found {len(bookings)} bookings")
        else:
            print(f"❌ Bookings endpoint failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Bookings error: {e}")
    
    # Test 4: Test optimal schedule endpoint
    print("\n4. Testing optimal schedule endpoint...")
    try:
        schedule_data = {
            "session_type": "Strength Training",
            "duration_minutes": 60,
            "location": "Gym",
            "earliest_date": "2024-01-01T00:00:00Z",
            "latest_date": "2024-12-31T23:59:59Z",
            "preferred_times": ["09:00", "10:00"],
            "avoid_times": [],
            "prioritize_convenience": True,
            "prioritize_cost": False,
            "allow_weekends": True,
            "allow_evenings": True
        }
        response = requests.post(f"{base_url}/api/bookings/optimal-schedule", 
                               json=schedule_data, headers=headers)
        if response.status_code == 200:
            print("✅ Optimal schedule endpoint working")
            result = response.json()
            print(f"   Found {len(result.get('suggested_slots', []))} suggested slots")
            print(f"   Best slot: {result.get('best_slot', {}).get('date_str', 'N/A')}")
        else:
            print(f"❌ Optimal schedule failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Optimal schedule error: {e}")
    
    print("\n" + "=" * 50)
    print("🎯 API Connection Test Complete")

if __name__ == "__main__":
    test_api_connection()

