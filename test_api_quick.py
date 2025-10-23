#!/usr/bin/env python3
"""
Quick test for the meal planner API
"""
import requests
import json

def test_api():
    url = "http://localhost:8000/api/meal-plan"
    test_data = {
        "user_goal": "Weight Loss",
        "weight": 75.0,
        "height": 180.0,
        "age": 25,
        "activity_level": "Moderate",
        "user_restrictions": "No dairy",
        "training_day": True
    }
    
    try:
        print("Testing API...")
        response = requests.post(url, json=test_data, timeout=30)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ API working!")
        else:
            print(f"❌ Error: {response.text}")
    except requests.exceptions.Timeout:
        print("❌ Request timed out")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_api()

