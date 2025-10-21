#!/usr/bin/env python3
"""
Test gym field validation for trainer registration
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.schemas.trainer_registration import ProfileCompletionRequest
from app.models import TrainingType

def test_gym_validation():
    """Test gym field validation logic"""
    print("🧪 Testing Gym Field Validation...")
    
    # Test Case 1: Customer's choice - should NOT require gym fields
    print("\n📋 Test Case 1: Customer's Choice Location")
    try:
        customer_choice_data = {
            "training_types": [TrainingType.STRENGTH],
            "price_per_hour": 75.0,
            "gym_name": None,  # Empty gym fields
            "gym_address": None,
            "gym_city": None,
            "gym_state": None,
            "gym_zip_code": None,
            "gym_phone": None,
            "location_preference": "customer_choice",
            "bio": "Experienced trainer with 5+ years helping clients achieve fitness goals through personalized training programs."
        }
        
        request = ProfileCompletionRequest(**customer_choice_data)
        print("   ✅ Customer's choice validation passed - gym fields not required")
        
    except Exception as e:
        print(f"   ❌ Customer's choice validation failed: {e}")
        return False
    
    # Test Case 2: Specific gym - should REQUIRE gym fields
    print("\n📋 Test Case 2: Specific Gym Location (Missing Fields)")
    try:
        specific_gym_incomplete_data = {
            "training_types": [TrainingType.STRENGTH],
            "price_per_hour": 75.0,
            "gym_name": None,  # Missing gym fields
            "gym_address": None,
            "gym_city": None,
            "gym_state": None,
            "gym_zip_code": None,
            "gym_phone": None,
            "location_preference": "specific_gym",
            "bio": "Experienced trainer with 5+ years helping clients achieve fitness goals through personalized training programs."
        }
        
        request = ProfileCompletionRequest(**specific_gym_incomplete_data)
        print("   ❌ Should have failed - gym fields required for specific gym")
        return False
        
    except Exception as e:
        print(f"   ✅ Correctly failed - gym fields required: {e}")
    
    # Test Case 3: Specific gym - should PASS with gym fields
    print("\n📋 Test Case 3: Specific Gym Location (Complete Fields)")
    try:
        specific_gym_complete_data = {
            "training_types": [TrainingType.STRENGTH],
            "price_per_hour": 75.0,
            "gym_name": "FitLife Gym",
            "gym_address": "123 Main Street, Suite 100",
            "gym_city": "New York",
            "gym_state": "NY",
            "gym_zip_code": "10001",
            "gym_phone": "555-0123",
            "location_preference": "specific_gym",
            "bio": "Experienced trainer with 5+ years helping clients achieve fitness goals through personalized training programs."
        }
        
        request = ProfileCompletionRequest(**specific_gym_complete_data)
        print("   ✅ Specific gym validation passed - all gym fields provided")
        
    except Exception as e:
        print(f"   ❌ Specific gym validation failed: {e}")
        return False
    
    print("\n🎉 Gym Validation Test Results:")
    print("✅ Customer's choice - gym fields not required")
    print("✅ Specific gym - gym fields required")
    print("✅ Validation logic working correctly")
    
    return True

if __name__ == "__main__":
    print("🚀 Testing Gym Field Validation...")
    print("=" * 50)
    
    success = test_gym_validation()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 GYM VALIDATION TESTS PASSED!")
        print("✅ Trainer registration should work now!")
    else:
        print("❌ GYM VALIDATION TESTS FAILED!")
        print("🔧 Please check the validation logic")
