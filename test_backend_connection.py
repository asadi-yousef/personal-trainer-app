#!/usr/bin/env python3
"""
Test backend connection and basic functionality
"""
import requests
import json

def test_backend():
    print("🔍 Testing backend connection...")
    
    # Test 1: Check if backend is running
    try:
        response = requests.get("http://localhost:8000/", timeout=5)
        print(f"✅ Backend is running: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"❌ Backend not running: {e}")
        return
    
    # Test 2: Check health endpoint
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        print(f"✅ Health check: {response.status_code}")
        print(f"Health: {response.json()}")
    except Exception as e:
        print(f"❌ Health check failed: {e}")
    
    # Test 3: Check if meal-plan endpoint exists
    try:
        response = requests.get("http://localhost:8000/docs", timeout=5)
        print(f"✅ API docs accessible: {response.status_code}")
    except Exception as e:
        print(f"❌ API docs not accessible: {e}")

if __name__ == "__main__":
    test_backend()

