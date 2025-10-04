#!/usr/bin/env python3
"""
Test script for the optimal scheduling system
This script tests the greedy algorithm implementation
"""

import requests
import json
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://127.0.0.1:8000/api"
TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "testpassword123"

def test_optimal_scheduling():
    """Test the optimal scheduling system"""
    
    print("🧪 Testing Optimal Scheduling System")
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
    
    # Test 2: Login (you'll need to create a test user first)
    print("\n2. Testing authentication...")
    login_data = {
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        if response.status_code == 200:
            auth_data = response.json()
            token = auth_data["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            print("✅ Authentication successful")
        else:
            print("❌ Authentication failed. You may need to create a test user first.")
            print("Response:", response.text)
            return
    except Exception as e:
        print(f"❌ Authentication error: {e}")
        return
    
    # Test 3: Get available trainers
    print("\n3. Testing trainer availability...")
    try:
        response = requests.get(f"{BASE_URL}/trainers", headers=headers)
        if response.status_code == 200:
            trainers_data = response.json()
            trainers = trainers_data.get("trainers", [])
            print(f"✅ Found {len(trainers)} available trainers")
            if trainers:
                print(f"   Sample trainer: {trainers[0].get('user_name', 'Unknown')}")
        else:
            print("❌ Failed to get trainers")
            return
    except Exception as e:
        print(f"❌ Error getting trainers: {e}")
        return
    
    # Test 4: Test optimal scheduling without specific trainer
    print("\n4. Testing optimal scheduling (no specific trainer)...")
    
    # Calculate dates
    earliest_date = datetime.now() + timedelta(days=1)
    latest_date = datetime.now() + timedelta(days=14)
    
    booking_request = {
        "trainer_id": None,  # No specific trainer - let algorithm choose
        "session_type": "Strength Training",
        "duration_minutes": 60,
        "location": "Gym Studio",
        "earliest_date": earliest_date.isoformat(),
        "latest_date": latest_date.isoformat(),
        "preferred_times": ["09:00", "10:00", "14:00", "15:00"],
        "avoid_times": [],
        "prioritize_convenience": True,
        "prioritize_cost": False,
        "allow_weekends": True,
        "allow_evenings": True
    }
    
    try:
        response = requests.post(f"{BASE_URL}/bookings/optimal-schedule", 
                               json=booking_request, headers=headers)
        if response.status_code == 200:
            result = response.json()
            print("✅ Optimal scheduling successful!")
            print(f"   Booking ID: {result.get('booking_id')}")
            print(f"   Message: {result.get('message')}")
            print(f"   Confidence Score: {result.get('confidence_score', 0):.2f}")
            
            suggested_slots = result.get('suggested_slots', [])
            print(f"   Found {len(suggested_slots)} optimal time slots")
            
            if suggested_slots:
                best_slot = suggested_slots[0]
                print(f"   Best slot: {best_slot.get('date_str')} at {best_slot.get('start_time_str')}")
                print(f"   Trainer: {best_slot.get('trainer_name', 'Unknown')}")
                print(f"   Score: {best_slot.get('score', 0):.2f}")
        else:
            print(f"❌ Optimal scheduling failed: {response.status_code}")
            print("Response:", response.text)
    except Exception as e:
        print(f"❌ Error in optimal scheduling: {e}")
    
    # Test 5: Test greedy optimization
    print("\n5. Testing greedy optimization...")
    
    try:
        response = requests.post(f"{BASE_URL}/bookings/greedy-optimization?max_suggestions=3", 
                               json=booking_request, headers=headers)
        if response.status_code == 200:
            result = response.json()
            print("✅ Greedy optimization successful!")
            print(f"   Message: {result.get('message')}")
            print(f"   Optimization Score: {result.get('optimization_score', 0):.2f}")
            
            suggestions = result.get('suggestions', [])
            print(f"   Found {len(suggestions)} optimized suggestions")
            
            if suggestions:
                best_match = suggestions[0]
                slot = best_match.get('slot', {})
                print(f"   Best match: {slot.get('date_str')} at {slot.get('start_time_str')}")
                print(f"   Trainer: {best_match.get('trainer_name', 'Unknown')}")
                print(f"   Combined Score: {best_match.get('combined_score', 0):.2f}")
                print(f"   Optimization Score: {best_match.get('optimization_score', 0):.2f}")
        else:
            print(f"❌ Greedy optimization failed: {response.status_code}")
            print("Response:", response.text)
    except Exception as e:
        print(f"❌ Error in greedy optimization: {e}")
    
    # Test 6: Test with specific trainer (if trainers available)
    if trainers:
        print("\n6. Testing optimal scheduling with specific trainer...")
        
        specific_trainer_id = trainers[0]["id"]
        booking_request["trainer_id"] = specific_trainer_id
        
        try:
            response = requests.post(f"{BASE_URL}/bookings/optimal-schedule", 
                                   json=booking_request, headers=headers)
            if response.status_code == 200:
                result = response.json()
                print("✅ Specific trainer scheduling successful!")
                print(f"   Message: {result.get('message')}")
                
                suggested_slots = result.get('suggested_slots', [])
                print(f"   Found {len(suggested_slots)} slots with specific trainer")
            else:
                print(f"❌ Specific trainer scheduling failed: {response.status_code}")
                print("Response:", response.text)
        except Exception as e:
            print(f"❌ Error in specific trainer scheduling: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Testing completed!")
    print("\nTo test the frontend:")
    print("1. Start the frontend: cd frontend && npm run dev")
    print("2. Go to http://localhost:3000/client/schedule")
    print("3. Select session preferences and click 'Find Optimal Schedule'")

if __name__ == "__main__":
    test_optimal_scheduling()

