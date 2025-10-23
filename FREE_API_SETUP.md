# 🆓 Free API Setup Guide

## Spoonacular API (FREE - 50 calls/day)

### Step 1: Get Free API Key
1. Go to: https://spoonacular.com/food-api
2. Click "Get Started" or "Sign Up"
3. Create a free account
4. Get your API key from the dashboard

### Step 2: Update the Backend
Replace the API key in `backend/app/routers/meal_planning.py`:

```python
SPOONACULAR_API_KEY = "your-actual-api-key-here"
```

### Step 3: Test the API
```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Alternative Free APIs

### 1. TheMealDB (Completely Free)
- No API key required
- Basic recipe data
- Limited nutrition info

### 2. Recipe Puppy (Free)
- No API key required
- Simple recipe search
- Basic ingredients

### 3. Edamam (Free Tier)
- 10 users, 20 meal plans/day
- Good nutrition data
- Requires API key

## Features You Get

✅ **Real Recipe Data** - From Spoonacular's database
✅ **Detailed Nutrition** - Calories, protein, carbs, fat, fiber
✅ **Dietary Restrictions** - Vegetarian, vegan, gluten-free, etc.
✅ **Goal-Based Meals** - Weight loss, muscle gain, maintenance
✅ **Training vs Rest Day** - Different meal plans
✅ **Smart Fallbacks** - Works even if API fails

## Free Tier Limits

- **50 API calls per day** (plenty for testing)
- **500 widget requests per day**
- **No credit card required**
- **No expiration date**

## Cost Comparison

| Service | Free Tier | Paid Plans |
|---------|-----------|------------|
| **Spoonacular** | 50 calls/day | $9.99/month for 150 calls/day |
| **OpenAI** | $5 credit | $20/month minimum |
| **TheMealDB** | Unlimited | Free forever |

The Spoonacular free tier is perfect for development and testing! 🎉

