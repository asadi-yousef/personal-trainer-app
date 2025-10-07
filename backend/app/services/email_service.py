"""
Email service for sending notifications
"""
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from typing import List, Optional
import os
from datetime import datetime
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(dotenv_path=".env", encoding="utf-8")

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        # Email configuration - using Gmail SMTP for demo
        # In production, use proper email service like SendGrid, AWS SES, etc.
        self.conf = ConnectionConfig(
            MAIL_USERNAME=os.getenv("MAIL_USERNAME", "your-email@gmail.com"),
            MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", "your-app-password"),
            MAIL_FROM=os.getenv("MAIL_FROM", "your-email@gmail.com"),
            MAIL_PORT=587,
            MAIL_SERVER="smtp.gmail.com",
            MAIL_STARTTLS=True,
            MAIL_SSL_TLS=False,
            USE_CREDENTIALS=True,
            VALIDATE_CERTS=True
        )
        self.fastmail = FastMail(self.conf)

    async def send_booking_request_notification(
        self, 
        trainer_email: str, 
        trainer_name: str,
        client_name: str,
        session_type: str,
        preferred_date: str,
        preferred_time: str,
        duration_minutes: int,
        location: str,
        special_requests: Optional[str] = None
    ):
        """Send email notification to trainer about new booking request"""
        
        # Format the preferred date and time
        try:
            preferred_datetime = datetime.fromisoformat(preferred_date.replace('Z', '+00:00'))
            formatted_date = preferred_datetime.strftime("%A, %B %d, %Y")
            formatted_time = preferred_datetime.strftime("%I:%M %p")
        except:
            formatted_date = preferred_date
            formatted_time = preferred_time

        # Create email content
        subject = f"New Booking Request from {client_name}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .booking-details {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }}
                .detail-row {{ display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }}
                .detail-label {{ font-weight: bold; color: #555; }}
                .detail-value {{ color: #333; }}
                .cta-button {{ display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🏋️ New Booking Request</h1>
                    <p>You have a new training session request!</p>
                </div>
                
                <div class="content">
                    <h2>Hello {trainer_name}!</h2>
                    <p><strong>{client_name}</strong> has requested a training session with you. Here are the details:</p>
                    
                    <div class="booking-details">
                        <div class="detail-row">
                            <span class="detail-label">Client:</span>
                            <span class="detail-value">{client_name}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Session Type:</span>
                            <span class="detail-value">{session_type}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Preferred Date:</span>
                            <span class="detail-value">{formatted_date}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Preferred Time:</span>
                            <span class="detail-value">{formatted_time}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Duration:</span>
                            <span class="detail-value">{duration_minutes} minutes</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Location:</span>
                            <span class="detail-value">{location}</span>
                        </div>
                        {f'<div class="detail-row"><span class="detail-label">Special Requests:</span><span class="detail-value">{special_requests}</span></div>' if special_requests else ''}
                    </div>
                    
                    <p><strong>Next Steps:</strong></p>
                    <ul>
                        <li>Log into your trainer dashboard</li>
                        <li>Review the booking request</li>
                        <li>Approve or suggest alternative times</li>
                        <li>Confirm the session details</li>
                    </ul>
                    
                    <div style="text-align: center;">
                        <a href="http://localhost:3000/trainer/dashboard" class="cta-button">View Dashboard</a>
                    </div>
                    
                    <p><em>Please respond to this request within 24 hours to maintain good client relationships.</em></p>
                </div>
                
                <div class="footer">
                    <p>This is an automated notification from FitConnect Personal Trainer Platform</p>
                    <p>If you have any questions, please contact support.</p>
                </div>
            </div>
        </body>
        </html>
        """

        message = MessageSchema(
            subject=subject,
            recipients=[trainer_email],
            body=html_content,
            subtype="html"
        )

        try:
            await self.fastmail.send_message(message)
            logger.info(f"Booking request notification sent to {trainer_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {trainer_email}: {str(e)}")
            return False

    async def send_booking_confirmation(
        self,
        client_email: str,
        client_name: str,
        trainer_name: str,
        session_type: str,
        confirmed_date: str,
        confirmed_time: str,
        duration_minutes: int,
        location: str
    ):
        """Send email confirmation to client when booking is approved"""
        
        # Format the confirmed date and time
        try:
            confirmed_datetime = datetime.fromisoformat(confirmed_date.replace('Z', '+00:00'))
            formatted_date = confirmed_datetime.strftime("%A, %B %d, %Y")
            formatted_time = confirmed_datetime.strftime("%I:%M %p")
        except:
            formatted_date = confirmed_date
            formatted_time = confirmed_time

        subject = f"Training Session Confirmed with {trainer_name}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .booking-details {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50; }}
                .detail-row {{ display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }}
                .detail-label {{ font-weight: bold; color: #555; }}
                .detail-value {{ color: #333; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✅ Session Confirmed!</h1>
                    <p>Your training session has been approved</p>
                </div>
                
                <div class="content">
                    <h2>Hello {client_name}!</h2>
                    <p>Great news! <strong>{trainer_name}</strong> has confirmed your training session. Here are the final details:</p>
                    
                    <div class="booking-details">
                        <div class="detail-row">
                            <span class="detail-label">Trainer:</span>
                            <span class="detail-value">{trainer_name}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Session Type:</span>
                            <span class="detail-value">{session_type}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Date:</span>
                            <span class="detail-value">{formatted_date}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Time:</span>
                            <span class="detail-value">{formatted_time}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Duration:</span>
                            <span class="detail-value">{duration_minutes} minutes</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Location:</span>
                            <span class="detail-value">{location}</span>
                        </div>
                    </div>
                    
                    <p><strong>Important Reminders:</strong></p>
                    <ul>
                        <li>Arrive 10 minutes early for your session</li>
                        <li>Bring water and a towel</li>
                        <li>Wear appropriate workout attire</li>
                        <li>Contact your trainer if you need to reschedule</li>
                    </ul>
                </div>
                
                <div class="footer">
                    <p>This is an automated confirmation from FitConnect Personal Trainer Platform</p>
                    <p>If you have any questions, please contact your trainer or support.</p>
                </div>
            </div>
        </body>
        </html>
        """

        message = MessageSchema(
            subject=subject,
            recipients=[client_email],
            body=html_content,
            subtype="html"
        )

        try:
            await self.fastmail.send_message(message)
            logger.info(f"Booking confirmation sent to {client_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send confirmation email to {client_email}: {str(e)}")
            return False

# Global email service instance
email_service = EmailService()
