#!/usr/bin/env python3
"""
Test script for admin system
"""
import requests
import json

def test_admin_endpoints():
    """Test admin endpoints"""
    print("🧪 Testing Admin System")
    print("=" * 50)
    
    base_url = "http://localhost:8000"
    
    # Test 1: Check if admin endpoints are available
    print("1️⃣ Testing Admin Endpoints Availability...")
    try:
        response = requests.get(f"{base_url}/docs")
        if response.status_code == 200:
            print("✅ API docs accessible")
        else:
            print("❌ API docs not accessible")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to API: {e}")
        return False
    
    # Test 2: Try to access admin endpoints (should fail without auth)
    print("\n2️⃣ Testing Admin Endpoint Protection...")
    try:
        response = requests.get(f"{base_url}/api/admin/dashboard/stats")
        if response.status_code == 401:
            print("✅ Admin endpoints are properly protected")
        else:
            print(f"⚠️ Unexpected response: {response.status_code}")
    except Exception as e:
        print(f"❌ Error testing admin protection: {e}")
    
    # Test 3: Test admin login with dummy credentials
    print("\n3️⃣ Testing Admin Login...")
    try:
        login_data = {
            "username": "test_admin",
            "password": "test_password"
        }
        response = requests.post(f"{base_url}/api/admin/login", json=login_data)
        
        if response.status_code == 401:
            print("✅ Admin login properly rejects invalid credentials")
        else:
            print(f"⚠️ Unexpected login response: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Error testing admin login: {e}")
    
    print("\n" + "=" * 50)
    print("🎯 Admin System Test Complete!")
    print("\n📋 Next Steps:")
    print("1. Create your first admin using the backend server")
    print("2. Test admin login with real credentials")
    print("3. Access admin dashboard endpoints")
    
    return True

if __name__ == "__main__":
    test_admin_endpoints()

