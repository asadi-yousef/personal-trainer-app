import requests
import json
from datetime import datetime, timedelta

# Test the booking request creation with minimal data
BASE_URL = "http://127.0.0.1:8000/api"

def test_minimal_booking_request():
    print("🧪 Testing minimal booking request...")
    
    # Login first
    login_data = {
        "email": "example@gmail.com",
        "password": "password"
    }
    
    try:
        # Login
        login_response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.status_code}")
            return
            
        token_data = login_response.json()
        token = token_data.get("access_token")
        print("✅ Login successful")
        
        # Create minimal booking request
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        # Minimal required data
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        booking_data = {
            "trainer_id": 1,
            "session_type": "Personal Training",
            "duration_minutes": 60,
            "preferred_start_date": f"{tomorrow}T10:00:00",
            "preferred_end_date": f"{tomorrow}T11:00:00"
        }
        
        print(f"Creating minimal booking request...")
        print(f"Data: {json.dumps(booking_data, indent=2)}")
        
        response = requests.post(
            f"{BASE_URL}/booking-requests", 
            json=booking_data, 
            headers=headers
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 201:
            print("✅ Success!")
        else:
            print("❌ Failed")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_backend_health():
    print("🔍 Testing backend health...")
    
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Health check: {response.status_code}")
        if response.status_code == 200:
            print("✅ Backend is healthy")
        else:
            print("❌ Backend health check failed")
    except Exception as e:
        print(f"❌ Backend connection failed: {e}")

if __name__ == "__main__":
    test_backend_health()
    test_minimal_booking_request()
