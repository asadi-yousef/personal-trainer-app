#!/usr/bin/env python3
"""
Test script for the enhanced meal planner API endpoint
"""
import requests
import json

def test_enhanced_meal_planner_api():
    """Test the enhanced meal planner API endpoint"""
    
    # API endpoint
    url = "http://localhost:8000/api/meal-plan"
    
    # Test data
    test_data = {
        "user_goal": "Weight Loss",
        "weight": 75.0,
        "height": 180.0,
        "age": 25,
        "activity_level": "Moderate",
        "user_restrictions": "No dairy, High protein",
        "training_day": True
    }
    
    try:
        print("🧪 Testing Enhanced Meal Planner API...")
        print(f"📡 Sending request to: {url}")
        print(f"📋 Test data: {json.dumps(test_data, indent=2)}")
        
        # Make the request
        response = requests.post(url, json=test_data)
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Success! Enhanced meal plan generated:")
            print(json.dumps(result, indent=2))
            
            # Validate response structure
            assert "day" in result, "Missing 'day' field"
            assert "plan" in result, "Missing 'plan' field"
            assert "total_calories" in result, "Missing 'total_calories' field"
            assert "total_protein" in result, "Missing 'total_protein' field"
            assert "calculated_calories" in result, "Missing 'calculated_calories' field"
            
            print("✅ Enhanced response structure validation passed!")
            
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Make sure the backend server is running on localhost:8000")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_enhanced_meal_planner_api()

