"""
Meal Planning API endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import requests
import os
import json
from app.config import settings
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

router = APIRouter()

# Groq API setup
GROQ_API_KEY = os.getenv("GROQ_API_KEY") or "your-groq-api-key-here"
GROQ_BASE_URL = "https://api.groq.com/openai/v1"

def create_fallback_meal(meal_name: str, target_calories: int, goal: str, training_day: bool) -> dict:
    """Create a fallback meal when API fails"""
    base_meals = {
        "Breakfast": {
            "recipe_name": "Greek Yogurt Parfait",
            "ingredients": "1 cup Greek yogurt, 1/2 cup berries, 2 tbsp granola, 1 tbsp honey",
            "calories": 300,
            "protein": 25.0,
            "carbs": 35.0,
            "fat": 8.0,
            "fiber": 6.0
        },
        "Lunch": {
            "recipe_name": "Turkey and Hummus Wrap",
            "ingredients": "Whole wheat tortilla, 3 oz turkey, 2 tbsp hummus, lettuce, tomato",
            "calories": 400,
            "protein": 30.0,
            "carbs": 45.0,
            "fat": 12.0,
            "fiber": 8.0
        },
        "Dinner": {
            "recipe_name": "Baked Cod with Sweet Potato",
            "ingredients": "6 oz cod, 1 medium sweet potato, steamed broccoli, olive oil",
            "calories": 450,
            "protein": 40.0,
            "carbs": 50.0,
            "fat": 15.0,
            "fiber": 10.0
        }
    }
    
    meal = base_meals.get(meal_name, base_meals["Breakfast"]).copy()
    meal["meal"] = meal_name
    
    # Adjust for goal and training day
    if goal.lower() == "weight loss":
        meal["calories"] = int(meal["calories"] * 0.8)
        meal["protein"] = round(meal["protein"] * 1.1, 1)
    elif goal.lower() == "muscle gain":
        meal["calories"] = int(meal["calories"] * 1.2)
        meal["protein"] = round(meal["protein"] * 1.3, 1)
    
    if training_day:
        meal["calories"] = int(meal["calories"] * 1.1)
        meal["carbs"] = round(meal["carbs"] * 1.2, 1)
    
    return meal

def calculate_calories(weight: float, height: float, age: int, activity_level: str, goal: str, training_day: bool) -> tuple:
    """
    Calculate daily calorie needs based on BMR, activity level, and goals
    Returns: (total_calories, bmr, activity_multiplier)
    """
    # Calculate BMR using Mifflin-St Jeor Equation
    bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5  # Male formula (assuming male for simplicity)
    
    # Activity multipliers
    activity_multipliers = {
        "Sedentary": 1.2,
        "Light": 1.375,
        "Moderate": 1.55,
        "Active": 1.725,
        "Very Active": 1.9
    }
    
    activity_multiplier = activity_multipliers.get(activity_level, 1.55)
    tdee = bmr * activity_multiplier
    
    # Adjust for training vs rest day
    if training_day:
        tdee *= 1.1  # 10% more calories on training days
    else:
        tdee *= 0.95  # 5% fewer calories on rest days
    
    # Adjust for goals
    if goal.lower() == "weight loss":
        tdee -= 500  # 500 calorie deficit
    elif goal.lower() == "muscle gain":
        tdee += 300  # 300 calorie surplus
    # Maintenance stays the same
    
    return int(tdee), int(bmr), activity_multiplier

class MealPlanRequest(BaseModel):
    user_goal: str  # Weight Loss, Muscle Gain, Maintenance
    weight: float  # in kg
    height: float  # in cm
    age: int
    activity_level: str  # Sedentary, Light, Moderate, Active, Very Active
    user_restrictions: str
    training_day: bool = True  # True for training day, False for rest day

class Meal(BaseModel):
    meal: str
    recipe_name: str
    ingredients: str
    calories: int
    protein: float  # in grams
    carbs: float    # in grams
    fat: float      # in grams
    fiber: float    # in grams

class MealPlanResponse(BaseModel):
    day: str
    plan: List[Meal]
    total_calories: int
    total_protein: float
    total_carbs: float
    total_fat: float
    total_fiber: float
    calculated_calories: int
    bmr: int
    activity_multiplier: float

@router.post("/meal-plan", response_model=MealPlanResponse)
async def generate_meal_plan(request: MealPlanRequest):
    """
    Generate a personalized meal plan using Groq API
    """
    print(f"🍽️ Meal plan request received: {request}")
    
    # Check if Groq API key is configured
    if not GROQ_API_KEY or GROQ_API_KEY == "your-groq-api-key-here":
        print("❌ Groq API key not configured")
        raise HTTPException(
            status_code=500,
            detail="Groq API key not configured. Please set GROQ_API_KEY environment variable."
        )
    
    try:
        # Calculate calories based on user data
        calculated_calories, bmr, activity_multiplier = calculate_calories(
            request.weight, request.height, request.age, 
            request.activity_level, request.user_goal, request.training_day
        )
        print(f"📊 Calculated calories: {calculated_calories}, BMR: {bmr}, Activity: {activity_multiplier}")
        
        # Generate meal plan using Groq API
        print("🤖 Generating meal plan with Groq API...")
        
        # System prompt for Groq
        system_prompt = """You are a friendly, expert nutritionist and meal planner. Generate a detailed 1-day meal plan based ONLY on the user's input. Do NOT add any disclaimers or extra text. Your output MUST be a JSON object that strictly adheres to the following structure:
{
  "day": "Monday",
  "plan": [
    {
      "meal": "Breakfast", 
      "recipe_name": "...", 
      "ingredients": "...", 
      "calories": 400,
      "protein": 25.5,
      "carbs": 45.2,
      "fat": 12.8,
      "fiber": 8.5
    },
    {
      "meal": "Lunch", 
      "recipe_name": "...", 
      "ingredients": "...", 
      "calories": 500,
      "protein": 35.0,
      "carbs": 55.0,
      "fat": 15.0,
      "fiber": 10.0
    },
    {
      "meal": "Dinner", 
      "recipe_name": "...", 
      "ingredients": "...", 
      "calories": 600,
      "protein": 40.0,
      "carbs": 60.0,
      "fat": 20.0,
      "fiber": 12.0
    }
  ]
}

IMPORTANT: All numeric values (calories, protein, carbs, fat, fiber) must be numbers, not strings."""

        # User prompt with their specific requirements
        day_type = "training" if request.training_day else "rest"
        user_prompt = f"""Create a detailed meal plan for someone with the following requirements:
- Goal: {request.user_goal}
- Weight: {request.weight} kg
- Height: {request.height} cm  
- Age: {request.age} years
- Activity Level: {request.activity_level}
- Day Type: {day_type} day
- Target Calories: {calculated_calories} calories
- Dietary Restrictions: {request.user_restrictions}

Generate a balanced 1-day meal plan with breakfast, lunch, and dinner. Include specific recipe names, ingredient lists, and detailed macronutrients (calories, protein, carbs, fat, fiber) for each meal. 

For {day_type} days, adjust the meal plan accordingly:
- Training days: Higher protein and carbs for recovery
- Rest days: Slightly lower calories, focus on healthy fats and fiber

Ensure the total calories add up to approximately {calculated_calories} calories."""

        # Call Groq API
        try:
            headers = {
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 1500,
                "response_format": {"type": "json_object"}
            }
            
            response = requests.post(
                f"{GROQ_BASE_URL}/chat/completions",
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                meal_plan_data = json.loads(data["choices"][0]["message"]["content"])
                print("✅ Groq API response received")
            else:
                print(f"❌ Groq API error: {response.status_code} - {response.text}")
                # Fallback to mock data
                import random
                days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
                meals = [
                    create_fallback_meal("Breakfast", calculated_calories, request.user_goal, request.training_day),
                    create_fallback_meal("Lunch", calculated_calories, request.user_goal, request.training_day),
                    create_fallback_meal("Dinner", calculated_calories, request.user_goal, request.training_day)
                ]
                meal_plan_data = {
                    "day": random.choice(days),
                    "plan": meals
                }
                print("🔄 Using fallback meal plan")
                
        except Exception as e:
            print(f"❌ Groq API error: {str(e)}")
            # Fallback to mock data
            import random
            days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            meals = [
                create_fallback_meal("Breakfast", calculated_calories, request.user_goal, request.training_day),
                create_fallback_meal("Lunch", calculated_calories, request.user_goal, request.training_day),
                create_fallback_meal("Dinner", calculated_calories, request.user_goal, request.training_day)
            ]
            meal_plan_data = {
                "day": random.choice(days),
                "plan": meals
            }
            print("🔄 Using fallback meal plan")
        
        # Calculate totals
        total_calories = sum(meal["calories"] for meal in meal_plan_data["plan"])
        total_protein = sum(meal["protein"] for meal in meal_plan_data["plan"])
        total_carbs = sum(meal["carbs"] for meal in meal_plan_data["plan"])
        total_fat = sum(meal["fat"] for meal in meal_plan_data["plan"])
        total_fiber = sum(meal["fiber"] for meal in meal_plan_data["plan"])
        print(f"📊 Calculated totals: {total_calories} cal, {total_protein}g protein, {total_carbs}g carbs, {total_fat}g fat, {total_fiber}g fiber")
        
        # Create enhanced response
        enhanced_response = {
            "day": meal_plan_data["day"],
            "plan": meal_plan_data["plan"],
            "total_calories": total_calories,
            "total_protein": round(total_protein, 1),
            "total_carbs": round(total_carbs, 1),
            "total_fat": round(total_fat, 1),
            "total_fiber": round(total_fiber, 1),
            "calculated_calories": calculated_calories,
            "bmr": bmr,
            "activity_multiplier": activity_multiplier
        }
        
        # Validate and return the response
        print("✅ Returning meal plan response")
        return MealPlanResponse(**enhanced_response)

    except json.JSONDecodeError as e:
        print(f"❌ JSON decode error: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to parse AI response as JSON: {str(e)}"
        )
    except Exception as e:
        print(f"❌ General error: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to generate meal plan: {str(e)}"
        )
