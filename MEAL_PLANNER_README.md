# 🍽️ AI Meal Planner Feature

## Overview
The AI Meal Planner is a new feature for FitConnect that uses OpenAI's GPT-3.5-turbo model to generate personalized meal plans based on user goals, calorie targets, and dietary restrictions.

## 🚀 Features
- **AI-Powered**: Uses OpenAI GPT-3.5-turbo for intelligent meal planning
- **JSON Response Format**: Structured output for easy parsing
- **User-Friendly Interface**: Simple form with 3 input fields
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Generation**: Instant meal plan creation

## 🏗️ Architecture

### Backend (FastAPI)
- **Endpoint**: `POST /api/meal-plan`
- **Model**: GPT-3.5-turbo with JSON response format
- **Input**: User goal, calories, dietary restrictions
- **Output**: Structured meal plan with breakfast, lunch, dinner

### Frontend (Next.js/React)
- **Component**: `MealPlanner.tsx`
- **Route**: `/meal-planner`
- **Navigation**: Added to main navbar
- **UI**: Clean, modern interface with loading states

## 📁 Files Created/Modified

### Backend Files
- `backend/app/routers/meal_planning.py` - New API router
- `backend/app/main.py` - Added meal planning router

### Frontend Files
- `frontend/src/components/MealPlanner.tsx` - Main component
- `frontend/src/app/meal-planner/page.tsx` - Page route
- `frontend/src/components/Navbar.tsx` - Added navigation link

### Test Files
- `test_meal_planner.py` - API testing script

## 🔧 Setup Instructions

### 1. Backend Setup
1. Ensure OpenAI API key is set in environment variables:
   ```bash
   export OPENAI_API_KEY="your-api-key-here"
   ```

2. Install dependencies (if not already installed):
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. Start the backend server:
   ```bash
   cd backend
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### 2. Frontend Setup
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the frontend server:
   ```bash
   cd frontend
   npm run dev
   ```

### 3. Testing
Run the test script to verify the API:
```bash
python test_meal_planner.py
```

## 🎯 Usage

### For Users
1. Navigate to `/meal-planner` in the app
2. Fill in the form:
   - **Fitness Goal**: e.g., "Weight Loss", "Muscle Gain"
   - **Target Calories**: Daily calorie target
   - **Dietary Restrictions**: e.g., "No dairy", "Vegetarian"
3. Click "Generate Meal Plan"
4. View your personalized meal plan

### API Usage
```bash
curl -X POST "http://localhost:8000/api/meal-plan" \
  -H "Content-Type: application/json" \
  -d '{
    "user_goal": "Weight Loss",
    "user_calories": 1800,
    "user_restrictions": "No dairy, Vegetarian"
  }'
```

## 📊 API Response Format
```json
{
  "day": "Monday",
  "plan": [
    {
      "meal": "Breakfast",
      "recipe_name": "Oatmeal with Berries",
      "ingredients": "1/2 cup oats, 1 cup almond milk, 1/2 cup mixed berries, 1 tbsp honey",
      "calories": "350"
    },
    {
      "meal": "Lunch",
      "recipe_name": "Quinoa Buddha Bowl",
      "ingredients": "1/2 cup quinoa, 1 cup mixed vegetables, 1/4 avocado, 2 tbsp tahini dressing",
      "calories": "450"
    },
    {
      "meal": "Dinner",
      "recipe_name": "Grilled Salmon with Roasted Vegetables",
      "ingredients": "4 oz salmon, 1 cup roasted broccoli, 1/2 cup sweet potato, 1 tsp olive oil",
      "calories": "500"
    }
  ]
}
```

## 🔒 Security & Best Practices
- OpenAI API key is stored in environment variables
- Input validation on both frontend and backend
- Error handling for API failures
- Rate limiting considerations (implement if needed)

## 🚀 Future Enhancements
- Save meal plans to user profiles
- Weekly meal planning
- Shopping list generation
- Nutritional analysis
- Integration with fitness tracking
- Meal plan sharing between trainer and client

## 🐛 Troubleshooting

### Common Issues
1. **OpenAI API Key Missing**: Ensure `OPENAI_API_KEY` environment variable is set
2. **Connection Error**: Verify backend is running on port 8000
3. **CORS Issues**: Check that frontend is making requests to correct backend URL
4. **JSON Parsing Error**: Verify OpenAI response format in logs

### Debug Steps
1. Check backend logs for OpenAI API errors
2. Verify environment variables are loaded
3. Test API endpoint directly with curl
4. Check browser network tab for frontend requests

## 📝 Notes
- This is a minimal MVP implementation
- OpenAI costs are minimal for GPT-3.5-turbo
- Consider implementing caching for repeated requests
- Add input validation for calorie ranges
- Consider adding meal plan history for users

