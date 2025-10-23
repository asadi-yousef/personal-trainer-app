#!/usr/bin/env python3
"""
Test script to verify timezone handling in booking requests
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime
import pytz

def test_timezone_parsing():
    """Test how different datetime formats are parsed"""
    print("🧪 Testing Timezone Handling in Booking Requests")
    print("=" * 60)
    
    # Test different datetime formats
    test_cases = [
        # Format 1: No timezone (what we had before)
        "2024-01-15T12:00:00",
        # Format 2: With timezone offset
        "2024-01-15T12:00:00+02:00",
        # Format 3: UTC format
        "2024-01-15T10:00:00Z",
        # Format 4: ISO format with timezone
        "2024-01-15T12:00:00+02:00"
    ]
    
    for i, dt_str in enumerate(test_cases, 1):
        print(f"\n📅 Test Case {i}: {dt_str}")
        
        try:
            # Parse the datetime string
            if dt_str.endswith('Z'):
                # UTC format
                dt = datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
            else:
                dt = datetime.fromisoformat(dt_str)
            
            print(f"   ✅ Parsed successfully: {dt}")
            print(f"   📍 Timezone: {dt.tzinfo}")
            
            # Convert to UTC for storage
            if dt.tzinfo is None:
                # Assume local timezone if no timezone info
                local_tz = pytz.timezone('Europe/Jerusalem')  # Adjust as needed
                dt = local_tz.localize(dt)
                print(f"   🔄 Assumed local timezone: {dt}")
            
            utc_dt = dt.astimezone(pytz.UTC)
            print(f"   🌍 UTC equivalent: {utc_dt}")
            
        except Exception as e:
            print(f"   ❌ Error parsing: {e}")
    
    print(f"\n✅ Timezone parsing test completed!")

def test_booking_timezone_scenario():
    """Test a realistic booking scenario with timezone handling"""
    print(f"\n🎯 Testing Realistic Booking Scenario")
    print("=" * 60)
    
    # Simulate a user in Jerusalem timezone booking for 12:00-13:00
    jerusalem_tz = pytz.timezone('Europe/Jerusalem')
    utc_tz = pytz.UTC
    
    # User selects 12:00-13:00 on 2024-01-15
    user_date = "2024-01-15"
    user_start_time = "12:00"
    user_end_time = "13:00"
    
    print(f"📅 User selects: {user_date} from {user_start_time} to {user_end_time}")
    
    # Create datetime objects
    start_dt_str = f"{user_date}T{user_start_time}:00"
    end_dt_str = f"{user_date}T{user_end_time}:00"
    
    print(f"📝 Frontend sends: start_time={start_dt_str}, end_time={end_dt_str}")
    
    # Parse as if they have timezone info (what our fix does)
    start_dt = datetime.fromisoformat(f"{start_dt_str}+02:00")  # Jerusalem is +02:00
    end_dt = datetime.fromisoformat(f"{end_dt_str}+02:00")
    
    print(f"🕐 Parsed start: {start_dt}")
    print(f"🕐 Parsed end: {end_dt}")
    
    # Convert to UTC for database storage
    start_utc = start_dt.astimezone(utc_tz)
    end_utc = end_dt.astimezone(utc_tz)
    
    print(f"🌍 UTC start: {start_utc}")
    print(f"🌍 UTC end: {end_utc}")
    
    # When displaying back to user, convert back to local timezone
    start_display = start_utc.astimezone(jerusalem_tz)
    end_display = end_utc.astimezone(jerusalem_tz)
    
    print(f"👤 Displayed to user: {start_display.strftime('%H:%M')} - {end_display.strftime('%H:%M')}")
    
    # Verify the times are correct
    if start_display.hour == 12 and end_display.hour == 13:
        print("✅ Timezone handling is correct!")
    else:
        print("❌ Timezone handling has issues!")

if __name__ == "__main__":
    test_timezone_parsing()
    test_booking_timezone_scenario()
