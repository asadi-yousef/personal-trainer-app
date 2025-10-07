import requests
import json
from datetime import datetime, timedelta

# Test the time slots API endpoint
BASE_URL = "http://127.0.0.1:8000/api"

def test_time_slots_api():
    print("🧪 Testing Time Slots API...")
    
    # Test 1: Get available time slots for trainer 1
    trainer_id = 1
    test_date = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
    
    url = f"{BASE_URL}/time-slots/trainer/{trainer_id}/available"
    params = {
        'date': test_date,
        'duration_minutes': 60
    }
    
    print(f"Testing URL: {url}")
    print(f"Parameters: {params}")
    
    try:
        response = requests.get(url, params=params)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response Type: {type(data)}")
            print(f"Response Data: {json.dumps(data, indent=2, default=str)}")
            
            if isinstance(data, list):
                print(f"✅ API returned array with {len(data)} time slots")
            else:
                print(f"⚠️ API returned {type(data)} instead of array")
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"Error Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Backend server is not running")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_time_slots_endpoint_exists():
    print("\n🔍 Testing if time-slots endpoint exists...")
    
    try:
        # Test the main time-slots endpoint
        response = requests.get(f"{BASE_URL}/time-slots/")
        print(f"Time-slots endpoint status: {response.status_code}")
        
        if response.status_code == 404:
            print("❌ Time-slots endpoint not found - router might not be included")
        elif response.status_code == 200:
            print("✅ Time-slots endpoint exists")
        else:
            print(f"⚠️ Time-slots endpoint returned: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing endpoint: {e}")

if __name__ == "__main__":
    test_time_slots_endpoint_exists()
    test_time_slots_api()
