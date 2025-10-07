import requests
import json
from datetime import datetime, timedelta

# Test the booking request creation
BASE_URL = "http://127.0.0.1:8000/api"

def test_booking_request_creation():
    print("🧪 Testing booking request creation...")
    
    # First, let's login to get a token
    login_data = {
        "email": "example@gmail.com",
        "password": "password"
    }
    
    try:
        # Login
        login_response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        print(f"Login status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            token_data = login_response.json()
            token = token_data.get("access_token")
            print("✅ Login successful")
            
            # Create booking request
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            # Create a test booking request
            tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
            booking_data = {
                "trainer_id": 1,
                "session_type": "Personal Training",
                "duration_minutes": 60,
                "location": "Gym Studio",
                "special_requests": "Test booking request",
                "preferred_start_date": f"{tomorrow}T10:00:00",
                "preferred_end_date": f"{tomorrow}T11:00:00",
                "preferred_times": ["10:00"],
                "allow_weekends": True,
                "allow_evenings": True,
                "is_recurring": False
            }
            
            print(f"Creating booking request for {tomorrow}...")
            print(f"Request data: {json.dumps(booking_data, indent=2)}")
            
            response = requests.post(
                f"{BASE_URL}/booking-requests", 
                json=booking_data, 
                headers=headers
            )
            
            print(f"Booking request status: {response.status_code}")
            
            if response.status_code == 201:
                result = response.json()
                print("✅ Booking request created successfully!")
                print(f"Request ID: {result.get('id')}")
                print(f"Status: {result.get('status')}")
            else:
                print(f"❌ Booking request failed: {response.status_code}")
                print(f"Error response: {response.text}")
                
        else:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"Login error: {login_response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Backend server is not running")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_booking_requests_endpoint():
    print("\n🔍 Testing booking-requests endpoint...")
    
    try:
        # Test if the endpoint exists
        response = requests.get(f"{BASE_URL}/booking-requests/")
        print(f"Booking-requests endpoint status: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ Endpoint exists (requires authentication)")
        elif response.status_code == 404:
            print("❌ Endpoint not found")
        else:
            print(f"⚠️ Unexpected status: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing endpoint: {e}")

if __name__ == "__main__":
    test_booking_requests_endpoint()
    test_booking_request_creation()
