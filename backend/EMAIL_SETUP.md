# Email Notification Setup Guide

## Overview
The FitConnect platform now includes email notifications for booking requests and confirmations.

## Email Configuration

### For Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Copy the 16-character password

3. **Set Environment Variables**:
   ```bash
   export MAIL_USERNAME="your-email@gmail.com"
   export MAIL_PASSWORD="your-16-char-app-password"
   export MAIL_FROM="your-email@gmail.com"
   ```

### For Production (Recommended Services)

- **SendGrid**: Professional email service with high deliverability
- **AWS SES**: Amazon's email service
- **Mailgun**: Developer-friendly email API
- **Postmark**: Transactional email service

## Email Templates

The system includes two email templates:

### 1. Booking Request Notification (to Trainer)
- Sent when a client requests a training session
- Includes client details, preferred time, and session information
- Professional HTML template with call-to-action

### 2. Booking Confirmation (to Client)
- Sent when trainer approves a booking request
- Includes confirmed session details and reminders
- Professional HTML template with session information

## Testing Email Functionality

1. **Install Dependencies**:
   ```bash
   pip install fastapi-mail jinja2
   ```

2. **Set Environment Variables** (see above)

3. **Test the System**:
   - Create a booking request through the frontend
   - Check trainer's email for notification
   - Approve the request as a trainer
   - Check client's email for confirmation

## Troubleshooting

### Common Issues:
- **Authentication Failed**: Check app password is correct
- **SMTP Connection Error**: Verify Gmail settings and firewall
- **Emails Not Received**: Check spam folder, verify email addresses

### Debug Mode:
Set `MAIL_DEBUG=True` in environment variables to see detailed SMTP logs.

## Security Notes

- Never commit email credentials to version control
- Use environment variables for all sensitive data
- Consider using a dedicated email service for production
- Implement rate limiting for email sending
