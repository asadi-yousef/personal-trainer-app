# Groq API Setup Guide for Chatbot

## 🚀 Quick Setup

### 1. Get Your Groq API Key
1. Go to [https://console.groq.com/](https://console.groq.com/)
2. Sign up for a free account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `gsk_`)

### 2. Configure Your Environment
Create or update your `backend/.env` file:

```env
# Groq API Configuration
GROQ_API_KEY=gsk_your_actual_api_key_here

# Other existing configurations...
OPENAI_API_KEY=your-openai-api-key-here
DATABASE_URL=sqlite:///./fitconnect.db
SECRET_KEY=your-secret-key-here
```

### 3. Test the Integration
Run the test script to verify everything works:

```bash
cd backend
python test_groq_chatbot.py
```

## 🔧 What's Been Updated

### Chatbot Router (`backend/app/routers/chatbot.py`)
- ✅ Replaced OpenAI with Groq API
- ✅ Uses `llama3-8b-8192` model (fast and free)
- ✅ Maintains all existing functionality
- ✅ Falls back to rule-based responses if API fails
- ✅ Same endpoint: `POST /chatbot/message`

### Key Features
- **Fast Responses**: Groq's infrastructure is optimized for speed
- **Free Tier**: Generous free usage limits
- **Same Interface**: No frontend changes needed
- **Fallback Support**: Works even without API key

## 🧪 Testing

### Test Script
The `test_groq_chatbot.py` script will:
1. Test Groq API directly
2. Test your chatbot endpoint
3. Show detailed results

### Manual Testing
1. Start your backend: `python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
2. Test the endpoint:
```bash
curl -X POST "http://localhost:8000/chatbot/message" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello! I need help booking a training session",
    "context": "/client",
    "user_role": "client"
  }'
```

## 🎯 Benefits of Groq

- **Speed**: Much faster than OpenAI
- **Free**: Generous free tier
- **Reliable**: High uptime
- **Simple**: Easy API integration

## 🔍 Troubleshooting

### Common Issues
1. **API Key Not Set**: Make sure `GROQ_API_KEY` is in your `.env` file
2. **Wrong Format**: API key should start with `gsk_`
3. **Network Issues**: Check your internet connection
4. **Rate Limits**: Groq has generous limits, but check if you've exceeded them

### Debug Steps
1. Run `python test_groq_chatbot.py`
2. Check the console output for specific errors
3. Verify your API key is correct
4. Ensure the backend server is running

## 📊 Expected Response Format

The chatbot will return:
```json
{
  "reply": "AI-generated response",
  "source": "groq",
  "suggestions": [
    {"label": "📅 Manage Availability", "href": "/trainer/availability"},
    {"label": "⚙️ Scheduling Preferences", "href": "/trainer/scheduling-preferences"}
  ]
}
```

## 🎉 You're All Set!

Your chatbot is now powered by Groq API and ready to use! The integration maintains all existing functionality while providing faster, free AI responses.
