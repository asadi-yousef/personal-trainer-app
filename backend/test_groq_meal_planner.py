#!/usr/bin/env python3
"""
Test script for Groq API meal planner integration
"""
import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_groq_meal_planner():
    """Test the meal planner endpoint with Groq API"""
    print("🧪 Testing Groq Meal Planner Integration")
    print("=" * 50)
    
    # Test data
    test_data = {
        "user_goal": "Weight Loss",
        "weight": 70.0,
        "height": 175.0,
        "age": 25,
        "activity_level": "Moderate",
        "user_restrictions": "No nuts, vegetarian",
        "training_day": True
    }
    
    try:
        print("🚀 Testing Meal Planner Endpoint...")
        response = requests.post(
            "http://localhost:8000/api/meal-plan",
            json=test_data,
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Meal Planner Success!")
            print(f"📅 Day: {result['day']}")
            print(f"🔥 Total Calories: {result['total_calories']}")
            print(f"💪 Total Protein: {result['total_protein']}g")
            print(f"🍞 Total Carbs: {result['total_carbs']}g")
            print(f"🥑 Total Fat: {result['total_fat']}g")
            print(f"🌾 Total Fiber: {result['total_fiber']}g")
            print(f"📊 Calculated Calories: {result['calculated_calories']}")
            print(f"⚡ BMR: {result['bmr']}")
            print(f"🏃 Activity Multiplier: {result['activity_multiplier']}")
            
            print("\n🍽️ Meal Plan:")
            for meal in result['plan']:
                print(f"\n{meal['meal']}:")
                print(f"  Recipe: {meal['recipe_name']}")
                print(f"  Ingredients: {meal['ingredients']}")
                print(f"  Calories: {meal['calories']}")
                print(f"  Protein: {meal['protein']}g")
                print(f"  Carbs: {meal['carbs']}g")
                print(f"  Fat: {meal['fat']}g")
                print(f"  Fiber: {meal['fiber']}g")
            
            return True
        else:
            print(f"❌ Meal Planner Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Meal Planner Error: {e}")
        return False

if __name__ == "__main__":
    success = test_groq_meal_planner()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 Groq Meal Planner is working perfectly!")
    else:
        print("⚠️ Meal Planner test failed. Check the errors above.")
