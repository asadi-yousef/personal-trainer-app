#!/usr/bin/env python3
"""
Test OpenAI API directly
"""
import os
from dotenv import load_dotenv
import openai

def test_openai_api():
    # Load environment variables
    load_dotenv()
    
    api_key = os.getenv("OPENAI_API_KEY")
    print(f"API Key loaded: {bool(api_key)}")
    print(f"Key starts with: {api_key[:20] if api_key else 'None'}...")
    
    if not api_key:
        print("❌ No API key found")
        return
    
    try:
        client = openai.OpenAI(api_key=api_key)
        
        # Test with a simple request
        print("🧪 Testing OpenAI API...")
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "user", "content": "Say 'Hello' in one word"}
            ],
            max_tokens=5
        )
        
        print("✅ OpenAI API works!")
        print(f"Response: {response.choices[0].message.content}")
        
    except Exception as e:
        print(f"❌ OpenAI API error: {e}")
        if "quota" in str(e).lower():
            print("💡 Your OpenAI quota is exceeded. Please:")
            print("1. Check your usage at: https://platform.openai.com/usage")
            print("2. Add payment method at: https://platform.openai.com/settings/billing")
            print("3. Wait for quota to reset or upgrade your plan")

if __name__ == "__main__":
    test_openai_api()

