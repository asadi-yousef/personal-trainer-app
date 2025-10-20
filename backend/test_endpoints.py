#!/usr/bin/env python3
"""
Test script to check if the trainer registration endpoints are working
"""
import requests

def test_endpoints():
    print("Testing trainer registration endpoints...")
    
    try:
        # Test if the trainer registration endpoints exist
        response = requests.get('http://localhost:8000/api/trainer-registration/profile-status')
        print(f'Profile status endpoint: {response.status_code}')
        print(f'Content-Type: {response.headers.get("content-type", "Not set")}')
        print(f'Response (first 200 chars): {response.text[:200]}')
        
        if response.status_code == 404:
            print('\n404 Error - Endpoint not found. Checking if router is included...')
            
            # Check if the main API is working
            health_response = requests.get('http://localhost:8000/health')
            print(f'Health endpoint: {health_response.status_code}')
            
            # Check if other API endpoints work
            auth_response = requests.get('http://localhost:8000/api/auth/me')
            print(f'Auth endpoint: {auth_response.status_code}')
            
            # List all available endpoints by checking the docs
            docs_response = requests.get('http://localhost:8000/docs')
            print(f'Docs endpoint: {docs_response.status_code}')
            
        elif response.status_code == 401:
            print('Endpoint exists but requires authentication (expected)')
            
    except Exception as e:
        print(f'Error: {e}')

if __name__ == "__main__":
    test_endpoints()





















