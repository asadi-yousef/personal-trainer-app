#!/usr/bin/env python3
"""
Test script for the meal planner API endpoint
"""
import requests
import json

def test_meal_planner_api():
    """Test the meal planner API endpoint"""
    
    # API endpoint
    url = "http://localhost:8000/api/meal-plan"
    
    # Test data
    test_data = {
        "user_goal": "Weight Loss",
        "user_calories": 1800,
        "user_restrictions": "No dairy, Vegetarian"
    }
    
    try:
        print("🧪 Testing Meal Planner API...")
        print(f"📡 Sending request to: {url}")
        print(f"📋 Test data: {json.dumps(test_data, indent=2)}")
        
        # Make the request
        response = requests.post(url, json=test_data)
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Success! Meal plan generated:")
            print(json.dumps(result, indent=2))
            
            # Validate response structure
            assert "day" in result, "Missing 'day' field"
            assert "plan" in result, "Missing 'plan' field"
            assert isinstance(result["plan"], list), "Plan should be a list"
            assert len(result["plan"]) == 3, "Should have 3 meals (breakfast, lunch, dinner)"
            
            for meal in result["plan"]:
                assert "meal" in meal, "Missing 'meal' field"
                assert "recipe_name" in meal, "Missing 'recipe_name' field"
                assert "ingredients" in meal, "Missing 'ingredients' field"
                assert "calories" in meal, "Missing 'calories' field"
            
            print("✅ Response structure validation passed!")
            
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Make sure the backend server is running on localhost:8000")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_meal_planner_api()

