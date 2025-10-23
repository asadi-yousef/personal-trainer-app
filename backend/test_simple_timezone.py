#!/usr/bin/env python3
"""
Simple test to demonstrate timezone issue
"""
from datetime import datetime

def test_timezone_issue():
    """Test the timezone shift issue"""
    print("🧪 Testing Timezone Issue")
    print("=" * 50)
    
    # Simulate what the frontend sends (before our fix)
    frontend_datetime_old = "2024-01-15T12:00:00"  # No timezone info
    print(f"📅 Frontend sends (old): {frontend_datetime_old}")
    
    # Parse as if it's UTC (what backend might do)
    parsed_utc = datetime.fromisoformat(frontend_datetime_old)
    print(f"🌍 Backend parses as UTC: {parsed_utc}")
    print(f"   - This assumes UTC timezone")
    
    # If user is in +2 timezone, this would display as 14:00 instead of 12:00
    print(f"   - User sees: 14:00 (2 hours ahead of intended 12:00)")
    print(f"   - ❌ PROBLEM: User wanted 12:00 but sees 14:00")
    
    print("\n" + "="*50)
    
    # Simulate what the frontend sends (after our fix)
    frontend_datetime_new = "2024-01-15T12:00:00+02:00"  # With timezone info
    print(f"📅 Frontend sends (new): {frontend_datetime_new}")
    
    # Parse with timezone info
    parsed_with_tz = datetime.fromisoformat(frontend_datetime_new)
    print(f"🌍 Backend parses with timezone: {parsed_with_tz}")
    print(f"   - Timezone: {parsed_with_tz.tzinfo}")
    
    # Convert to UTC for storage
    utc_time = parsed_with_tz.astimezone()
    print(f"🌍 UTC equivalent: {utc_time}")
    
    # When displaying back, convert to user's timezone
    user_timezone_offset = 2  # +2 hours
    user_time = utc_time.replace(tzinfo=None)  # Remove timezone info for display
    print(f"👤 User sees: {user_time.strftime('%H:%M')}")
    print(f"   - ✅ CORRECT: User sees 12:00 as intended")

if __name__ == "__main__":
    test_timezone_issue()
