import requests
import json
from datetime import datetime, timedelta

# Debug the booking request creation step by step
BASE_URL = "http://127.0.0.1:8000/api"

def debug_booking_request():
    print("🔍 Debugging booking request creation...")
    
    # Step 1: Login
    login_data = {
        "email": "example@gmail.com",
        "password": "password"
    }
    
    try:
        print("Step 1: Logging in...")
        login_response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        print(f"Login status: {login_response.status_code}")
        
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.text}")
            return
            
        token_data = login_response.json()
        token = token_data.get("access_token")
        user_data = token_data.get("user")
        print(f"✅ Login successful - User ID: {user_data.get('id')}")
        
        # Step 2: Test trainer exists
        print("\nStep 2: Checking if trainer exists...")
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        trainer_response = requests.get(f"{BASE_URL}/trainers/1", headers=headers)
        print(f"Trainer check status: {trainer_response.status_code}")
        if trainer_response.status_code == 200:
            trainer_data = trainer_response.json()
            print(f"✅ Trainer found: {trainer_data.get('user_name', 'Unknown')}")
        else:
            print(f"❌ Trainer not found: {trainer_response.text}")
            return
        
        # Step 3: Create booking request with detailed error handling
        print("\nStep 3: Creating booking request...")
        
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        booking_data = {
            "trainer_id": 1,
            "session_type": "Personal Training",
            "duration_minutes": 60,
            "preferred_start_date": f"{tomorrow}T10:00:00",
            "preferred_end_date": f"{tomorrow}T11:00:00"
        }
        
        print(f"Request data: {json.dumps(booking_data, indent=2)}")
        
        response = requests.post(
            f"{BASE_URL}/booking-requests", 
            json=booking_data, 
            headers=headers
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        print(f"Response text: {response.text}")
        
        if response.status_code == 201:
            result = response.json()
            print("✅ Booking request created successfully!")
            print(f"Request ID: {result.get('id')}")
        else:
            print("❌ Booking request failed")
            
            # Try to get more detailed error info
            try:
                error_data = response.json()
                print(f"Error details: {json.dumps(error_data, indent=2)}")
            except:
                print("Could not parse error response as JSON")
                
    except Exception as e:
        print(f"❌ Exception: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_booking_request()
