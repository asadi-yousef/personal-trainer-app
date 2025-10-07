"""
Simple email test without .env file dependency
"""
import asyncio
import os
from app.services.email_service import EmailService

async def test_email():
    """Test email with direct credentials"""
    print("🧪 Testing email notifications...")
    
    # You can set your credentials directly here for testing
    # Replace these with your actual credentials
    email_service = EmailService()
    
    # Test booking request notification
    print("📧 Sending test email...")
    
    # Replace with your actual email for testing
    test_email = input("Enter your email address to receive test email: ")
    
    success = await email_service.send_booking_request_notification(
        trainer_email=test_email,
        trainer_name="Test Trainer",
        client_name="Test Client",
        session_type="Personal Training",
        preferred_date="2024-01-15T10:00:00",
        preferred_time="10:00",
        duration_minutes=60,
        location="Test Gym",
        special_requests="This is a test email"
    )
    
    if success:
        print("✅ Test email sent successfully!")
        print("📬 Check your inbox (and spam folder)")
    else:
        print("❌ Failed to send test email")
        print("💡 Make sure your email credentials are correct")

if __name__ == "__main__":
    asyncio.run(test_email())
