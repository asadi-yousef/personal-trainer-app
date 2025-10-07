"""
Test script for email notifications
"""
import asyncio
import os
from dotenv import load_dotenv
from app.services.email_service import email_service

# Load environment variables from .env file
load_dotenv()

async def test_booking_request_notification():
    """Test sending a booking request notification to trainer"""
    print("🧪 Testing booking request notification...")
    
    success = await email_service.send_booking_request_notification(
        trainer_email="trainer@example.com",  # Replace with real email
        trainer_name="John Trainer",
        client_name="Jane Client",
        session_type="Personal Training",
        preferred_date="2024-01-15T10:00:00",
        preferred_time="10:00",
        duration_minutes=60,
        location="Gym Studio A",
        special_requests="Focus on strength training"
    )
    
    if success:
        print("✅ Booking request notification sent successfully!")
    else:
        print("❌ Failed to send booking request notification")

async def test_booking_confirmation():
    """Test sending a booking confirmation to client"""
    print("🧪 Testing booking confirmation...")
    
    success = await email_service.send_booking_confirmation(
        client_email="client@example.com",  # Replace with real email
        client_name="Jane Client",
        trainer_name="John Trainer",
        session_type="Personal Training",
        confirmed_date="2024-01-15T10:00:00",
        confirmed_time="10:00",
        duration_minutes=60,
        location="Gym Studio A"
    )
    
    if success:
        print("✅ Booking confirmation sent successfully!")
    else:
        print("❌ Failed to send booking confirmation")

async def main():
    """Run all email tests"""
    print("🚀 Starting email notification tests...")
    print("📧 Make sure to set your email credentials in environment variables:")
    print("   - MAIL_USERNAME")
    print("   - MAIL_PASSWORD") 
    print("   - MAIL_FROM")
    print()
    
    # Check if email credentials are set
    if not os.getenv("MAIL_USERNAME") or not os.getenv("MAIL_PASSWORD"):
        print("⚠️  Email credentials not set. Please set environment variables:")
        print("   export MAIL_USERNAME='your-email@gmail.com'")
        print("   export MAIL_PASSWORD='your-app-password'")
        print("   export MAIL_FROM='your-email@gmail.com'")
        return
    
    await test_booking_request_notification()
    print()
    await test_booking_confirmation()
    print()
    print("🎉 Email tests completed!")

if __name__ == "__main__":
    asyncio.run(main())
