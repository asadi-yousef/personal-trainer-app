#!/usr/bin/env python3
"""
Test script for Groq API chatbot integration
"""
import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_groq_api_direct():
    """Test Groq API directly"""
    groq_api_key = os.getenv("GROQ_API_KEY")
    
    if not groq_api_key or groq_api_key == "your-groq-api-key-here":
        print("❌ GROQ_API_KEY not set in .env file")
        print("Please add GROQ_API_KEY=your-actual-api-key to backend/.env")
        return False
    
    print(f"🔑 Groq API Key: {groq_api_key[:10]}...")
    
    # Test Groq API
    headers = {
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {"role": "user", "content": "Hello! Can you help me with booking a training session?"}
        ],
        "temperature": 0.4,
        "max_tokens": 100
    }
    
    try:
        print("🚀 Testing Groq API...")
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=data,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            reply = result["choices"][0]["message"]["content"]
            print(f"✅ Groq API Success!")
            print(f"🤖 Response: {reply}")
            return True
        else:
            print(f"❌ Groq API Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Groq API Error: {e}")
        return False

def test_chatbot_endpoint():
    """Test the chatbot endpoint"""
    print("\n🧪 Testing Chatbot Endpoint...")
    
    try:
        response = requests.post(
            "http://localhost:8000/chatbot/message",
            json={
                "message": "Hello! I need help booking a training session",
                "context": "/client",
                "user_role": "client"
            },
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Chatbot Endpoint Success!")
            print(f"🤖 Reply: {result['reply']}")
            print(f"📊 Source: {result['source']}")
            print(f"💡 Suggestions: {len(result['suggestions'])} items")
            return True
        else:
            print(f"❌ Chatbot Endpoint Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Chatbot Endpoint Error: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Groq Chatbot Integration")
    print("=" * 50)
    
    # Test 1: Direct Groq API
    print("\n1️⃣ Testing Groq API directly...")
    groq_success = test_groq_api_direct()
    
    # Test 2: Chatbot endpoint (if backend is running)
    print("\n2️⃣ Testing Chatbot Endpoint...")
    chatbot_success = test_chatbot_endpoint()
    
    print("\n" + "=" * 50)
    print("📊 Test Results:")
    print(f"Groq API: {'✅ Success' if groq_success else '❌ Failed'}")
    print(f"Chatbot Endpoint: {'✅ Success' if chatbot_success else '❌ Failed'}")
    
    if groq_success and chatbot_success:
        print("\n🎉 All tests passed! Groq chatbot is working!")
    else:
        print("\n⚠️ Some tests failed. Check the errors above.")
