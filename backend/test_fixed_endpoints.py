#!/usr/bin/env python3
"""
Test script to check if the trainer registration endpoints are now working
"""
import requests

def test_endpoints():
    print("Testing trainer registration endpoints after fix...")
    
    try:
        # Test the endpoints
        response = requests.get('http://localhost:8000/api/trainer-registration/profile-status')
        print(f'Profile status endpoint: {response.status_code}')
        print(f'Content-Type: {response.headers.get("content-type", "Not set")}')
        
        if response.status_code == 401:
            print('✅ SUCCESS: Endpoint exists and requires authentication (expected)')
        elif response.status_code == 404:
            print('❌ FAILED: Endpoint still not found')
        else:
            print(f'Response: {response.text[:200]}')
            
        # Test progress endpoint
        response2 = requests.get('http://localhost:8000/api/trainer-registration/progress')
        print(f'Progress endpoint: {response2.status_code}')
        
        if response2.status_code == 401:
            print('✅ SUCCESS: Progress endpoint exists and requires authentication (expected)')
        elif response2.status_code == 404:
            print('❌ FAILED: Progress endpoint still not found')
            
    except Exception as e:
        print(f'Error: {e}')

if __name__ == "__main__":
    test_endpoints()





