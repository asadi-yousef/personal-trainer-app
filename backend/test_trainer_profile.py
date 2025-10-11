"""
Simple test script for trainer profile management endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8000"

# You'll need to replace this with a real trainer token
TRAINER_TOKEN = "your_trainer_token_here"

headers = {
    "Authorization": f"Bearer {TRAINER_TOKEN}",
    "Content-Type": "application/json"
}


def test_get_profile():
    """Test getting trainer profile"""
    print("\n=== Testing GET Profile ===")
    response = requests.get(f"{BASE_URL}/api/trainer-profile/me", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.json()


def test_update_basic_info():
    """Test updating basic info"""
    print("\n=== Testing UPDATE Basic Info ===")
    data = {
        "bio": "I am a certified personal trainer with over 10 years of experience helping clients achieve their fitness goals through personalized training programs and nutrition guidance.",
        "experience_years": 10,
        "certifications": "ACE Certified, NASM-CPT, CrossFit Level 2"
    }
    response = requests.patch(
        f"{BASE_URL}/api/trainer-profile/basic-info",
        headers=headers,
        json=data
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")


def test_update_training_info():
    """Test updating training info"""
    print("\n=== Testing UPDATE Training Info ===")
    data = {
        "training_types": ["Strength Training", "Cardio", "Functional Training"],
        "specialty": "Strength Training"
    }
    response = requests.patch(
        f"{BASE_URL}/api/trainer-profile/training-info",
        headers=headers,
        json=data
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")


def test_update_gym_info():
    """Test updating gym info"""
    print("\n=== Testing UPDATE Gym Info ===")
    data = {
        "gym_name": "FitLife Gym",
        "gym_address": "123 Main Street",
        "gym_city": "New York",
        "gym_state": "NY",
        "gym_zip_code": "10001",
        "gym_phone": "555-0123"
    }
    response = requests.patch(
        f"{BASE_URL}/api/trainer-profile/gym-info",
        headers=headers,
        json=data
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")


def test_update_pricing():
    """Test updating pricing"""
    print("\n=== Testing UPDATE Pricing ===")
    data = {
        "price_per_hour": 75.00
    }
    response = requests.patch(
        f"{BASE_URL}/api/trainer-profile/pricing",
        headers=headers,
        json=data
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")


if __name__ == "__main__":
    print("=== Trainer Profile Management Tests ===")
    print("\nIMPORTANT: Update TRAINER_TOKEN variable with a valid trainer token first!")
    print("You can get a token by logging in as a trainer through the /api/auth/login endpoint")
    
    # Run tests
    try:
        test_get_profile()
        test_update_basic_info()
        test_update_training_info()
        test_update_gym_info()
        test_update_pricing()
        test_get_profile()  # Get profile again to see updated values
    except Exception as e:
        print(f"\nError: {e}")
        print("Make sure the backend server is running and you have a valid trainer token!")

