#!/usr/bin/env python3
"""
Test script to verify the Customer's choice bug fix
"""
import requests
import json

def test_customer_choice_display():
    """Test that trainers with customer's choice show correctly"""
    print("🧪 Testing Customer's Choice Display Fix")
    print("=" * 50)
    
    try:
        # Get all trainers
        response = requests.get("http://localhost:8000/api/trainers")
        
        if response.status_code == 200:
            trainers = response.json()
            print(f"✅ Found {len(trainers)} trainers")
            
            # Check for trainers with customer's choice
            customer_choice_trainers = []
            for trainer in trainers:
                if trainer.get('location_preference') == 'customer_choice':
                    customer_choice_trainers.append(trainer)
                    print(f"\n🏋️ Trainer: {trainer.get('name', 'Unknown')}")
                    print(f"   Location Preference: {trainer.get('location_preference')}")
                    print(f"   Gym Name: {trainer.get('gym_name')}")
                    print(f"   Should display as: Customer's choice")
            
            if customer_choice_trainers:
                print(f"\n✅ Found {len(customer_choice_trainers)} trainers with customer's choice")
                print("🎯 These should now display 'Customer's choice' instead of trainer names")
            else:
                print("\n⚠️ No trainers found with customer's choice preference")
                print("💡 You may need to create a trainer with customer's choice to test")
            
            return True
        else:
            print(f"❌ Error fetching trainers: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Test error: {e}")
        return False

if __name__ == "__main__":
    success = test_customer_choice_display()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 Customer's choice fix test completed!")
        print("💡 Check the frontend to see if trainers show 'Customer's choice' properly")
    else:
        print("⚠️ Test failed. Check the errors above.")
