#!/usr/bin/env python3
"""
Test the optimal scheduling API endpoint directly
"""
import requests
import json
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://127.0.0.1:8000/api"

def test_optimal_scheduling_api():
    """Test the optimal scheduling API directly"""
    
    print("🧪 Testing Optimal Scheduling API Directly")
    print("=" * 50)
    
    # Test 1: Health check
    print("\n1. Testing backend health...")
    try:
        response = requests.get("http://127.0.0.1:8000/health")
        if response.status_code == 200:
            print("✅ Backend is running")
        else:
            print("❌ Backend health check failed")
            return
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Make sure it's running on http://127.0.0.1:8000")
        return
    
    # Test 2: Login to get token
    print("\n2. Testing authentication...")
    login_data = {
        "email": "example@gmail.com",  # Client user
        "password": "password"         # Try common passwords
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        if response.status_code == 200:
            auth_data = response.json()
            token = auth_data["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            print("✅ Authentication successful")
        else:
            print(f"❌ Authentication failed: {response.status_code}")
            print("Response:", response.text)
            print("\n💡 Try with correct credentials or create a test user")
            return
    except Exception as e:
        print(f"❌ Authentication error: {e}")
        return
    
    # Test 3: Test optimal scheduling without specific trainer
    print("\n3. Testing optimal scheduling (no specific trainer)...")
    
    # Calculate dates - make sure they include Tuesday, Wednesday, or Friday
    # Since trainer is available: Tuesday 9-10, Wednesday 9-10, Friday 20-22
    today = datetime.now()
    
    # Find next Tuesday, Wednesday, or Friday
    days_ahead = 0
    while True:
        test_date = today + timedelta(days=days_ahead)
        if test_date.weekday() in [1, 2, 4]:  # Tuesday, Wednesday, Friday
            break
        days_ahead += 1
        if days_ahead > 14:  # Safety check
            test_date = today + timedelta(days=1)
            break
    
    earliest_date = test_date
    latest_date = test_date + timedelta(days=7)
    
    booking_request = {
        "session_type": "Strength Training",
        "duration_minutes": 60,
        "location": "Gym Studio",
        "earliest_date": earliest_date.isoformat(),
        "latest_date": latest_date.isoformat(),
        "preferred_times": ["09:00", "20:00"],  # Match trainer availability
        "avoid_times": [],
        "prioritize_convenience": True,
        "prioritize_cost": False,
        "allow_weekends": True,
        "allow_evenings": True
        # No trainer_id - let algorithm choose
    }
    
    print(f"📅 Testing with date range: {earliest_date.date()} to {latest_date.date()}")
    print(f"📅 Trainer available on: Tuesday 9-10, Wednesday 9-10, Friday 20-22")
    
    try:
        response = requests.post(f"{BASE_URL}/bookings/optimal-schedule", 
                               json=booking_request, headers=headers)
        
        print(f"📡 API Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Optimal scheduling successful!")
            print(f"   Booking ID: {result.get('booking_id')}")
            print(f"   Message: {result.get('message')}")
            print(f"   Confidence Score: {result.get('confidence_score', 0):.2f}")
            
            suggested_slots = result.get('suggested_slots', [])
            print(f"   Found {len(suggested_slots)} optimal time slots")
            
            if suggested_slots:
                print("\n📋 Suggested Slots:")
                for i, slot in enumerate(suggested_slots[:3]):  # Show first 3
                    print(f"   {i+1}. {slot.get('date_str')} at {slot.get('start_time_str')}")
                    print(f"      Trainer: {slot.get('trainer_name', 'Unknown')}")
                    print(f"      Score: {slot.get('score', 0):.2f}")
                    print(f"      Specialty: {slot.get('trainer_specialty', 'Unknown')}")
            else:
                print("❌ No slots found - this indicates a problem with the algorithm")
                
        else:
            print(f"❌ Optimal scheduling failed: {response.status_code}")
            print("Response:", response.text)
            
    except Exception as e:
        print(f"❌ Error in optimal scheduling: {e}")
    
    # Test 4: Test with specific trainer
    print("\n4. Testing optimal scheduling with specific trainer...")
    
    booking_request["trainer_id"] = 1  # Yosef Asadi
    
    try:
        response = requests.post(f"{BASE_URL}/bookings/optimal-schedule", 
                               json=booking_request, headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Specific trainer scheduling successful!")
            print(f"   Message: {result.get('message')}")
            
            suggested_slots = result.get('suggested_slots', [])
            print(f"   Found {len(suggested_slots)} slots with specific trainer")
            
            if suggested_slots:
                print("\n📋 Specific Trainer Slots:")
                for i, slot in enumerate(suggested_slots[:3]):
                    print(f"   {i+1}. {slot.get('date_str')} at {slot.get('start_time_str')}")
                    print(f"      Score: {slot.get('score', 0):.2f}")
        else:
            print(f"❌ Specific trainer scheduling failed: {response.status_code}")
            print("Response:", response.text)
            
    except Exception as e:
        print(f"❌ Error in specific trainer scheduling: {e}")
    
    print("\n" + "=" * 50)
    print("🎯 Analysis:")
    print("If both tests fail, the issue is likely in the scheduling algorithm")
    print("If only one test fails, the issue is in that specific path")
    print("If both succeed, the issue is likely in the frontend")

if __name__ == "__main__":
    test_optimal_scheduling_api()
