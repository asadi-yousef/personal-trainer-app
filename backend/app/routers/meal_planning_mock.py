"""
Mock Meal Planning API endpoints for testing without OpenAI
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import json
import random

router = APIRouter()

class MealPlanRequest(BaseModel):
    user_goal: str
    user_calories: int
    user_restrictions: str

class Meal(BaseModel):
    meal: str
    recipe_name: str
    ingredients: str
    calories: str

class MealPlanResponse(BaseModel):
    day: str
    plan: List[Meal]

@router.post("/meal-plan", response_model=MealPlanResponse)
async def generate_meal_plan(request: MealPlanRequest):
    """
    Generate a mock meal plan for testing
    """
    try:
        # Mock meal plans based on user input
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        day = random.choice(days)
        
        # Generate meals based on user preferences
        if "vegetarian" in request.user_restrictions.lower():
            meals = [
                {
                    "meal": "Breakfast",
                    "recipe_name": "Avocado Toast with Chickpeas",
                    "ingredients": "2 slices whole grain bread, 1/2 avocado, 1/4 cup chickpeas, lemon juice, salt, pepper",
                    "calories": "350"
                },
                {
                    "meal": "Lunch", 
                    "recipe_name": "Quinoa Buddha Bowl",
                    "ingredients": "1/2 cup quinoa, 1 cup mixed vegetables, 1/4 avocado, 2 tbsp tahini dressing, hemp seeds",
                    "calories": "450"
                },
                {
                    "meal": "Dinner",
                    "recipe_name": "Lentil Curry with Rice",
                    "ingredients": "1/2 cup lentils, 1/2 cup brown rice, coconut milk, curry spices, vegetables",
                    "calories": "500"
                }
            ]
        elif "keto" in request.user_goal.lower():
            meals = [
                {
                    "meal": "Breakfast",
                    "recipe_name": "Keto Avocado Smoothie",
                    "ingredients": "1 avocado, 1 cup almond milk, 1 tbsp coconut oil, 1 scoop protein powder",
                    "calories": "400"
                },
                {
                    "meal": "Lunch",
                    "recipe_name": "Grilled Chicken Caesar Salad",
                    "ingredients": "4 oz grilled chicken, mixed greens, parmesan cheese, olive oil dressing",
                    "calories": "350"
                },
                {
                    "meal": "Dinner",
                    "recipe_name": "Salmon with Roasted Vegetables",
                    "ingredients": "6 oz salmon, roasted broccoli, cauliflower, olive oil, herbs",
                    "calories": "450"
                }
            ]
        else:
            meals = [
                {
                    "meal": "Breakfast",
                    "recipe_name": "Greek Yogurt Parfait",
                    "ingredients": "1 cup Greek yogurt, 1/2 cup berries, 2 tbsp granola, 1 tbsp honey",
                    "calories": "300"
                },
                {
                    "meal": "Lunch",
                    "recipe_name": "Turkey and Hummus Wrap",
                    "ingredients": "Whole wheat tortilla, 3 oz turkey, 2 tbsp hummus, lettuce, tomato",
                    "calories": "400"
                },
                {
                    "meal": "Dinner",
                    "recipe_name": "Baked Cod with Sweet Potato",
                    "ingredients": "6 oz cod, 1 medium sweet potato, steamed broccoli, olive oil",
                    "calories": "450"
                }
            ]
        
        # Adjust calories based on user target
        if request.user_calories < 1500:
            # Low calorie version
            for meal in meals:
                current_cals = int(meal["calories"])
                meal["calories"] = str(int(current_cals * 0.8))
        elif request.user_calories > 2500:
            # High calorie version
            for meal in meals:
                current_cals = int(meal["calories"])
                meal["calories"] = str(int(current_cals * 1.2))
        
        return MealPlanResponse(day=day, plan=meals)
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to generate mock meal plan: {str(e)}"
        )

