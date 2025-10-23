"use client";

import React, { useState } from 'react';

interface Meal {
  meal: string;
  recipe_name: string;
  ingredients: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

interface MealPlanResponse {
  day: string;
  plan: Meal[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber: number;
  calculated_calories: number;
  bmr: number;
  activity_multiplier: number;
}

export default function MealPlanner() {
  const [formData, setFormData] = useState({
    user_goal: '',
    weight: '',
    height: '',
    age: '',
    activity_level: '',
    user_restrictions: '',
    training_day: true
  });
  const [mealPlan, setMealPlan] = useState<MealPlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Form submitted with data:', formData);
    setLoading(true);
    setError('');
    setMealPlan(null);

    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      const requestBody = {
        user_goal: formData.user_goal,
        weight: parseFloat(formData.weight) || 0,
        height: parseFloat(formData.height) || 0,
        age: parseInt(formData.age) || 0,
        activity_level: formData.activity_level,
        user_restrictions: formData.user_restrictions,
        training_day: formData.training_day
      };
      
      console.log('📤 Sending request to backend:', requestBody);
      
      const response = await fetch('http://localhost:8000/api/meal-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      console.log('📥 Response received:', response.status, response.statusText);
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP error! status: ${response.status}. ${errorData.detail || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('✅ Success! Meal plan received:', data);
      setMealPlan(data);
    } catch (err) {
      console.error('❌ Error occurred:', err);
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out after 60 seconds. Please try again.');
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          🍽️ AI Meal Planner
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="user_goal" className="block text-sm font-medium text-gray-700 mb-2">
                Fitness Goal
              </label>
              <select
                id="user_goal"
                name="user_goal"
                value={formData.user_goal}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select your goal</option>
                <option value="Weight Loss">Weight Loss</option>
                <option value="Muscle Gain">Muscle Gain</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>

            <div>
              <label htmlFor="activity_level" className="block text-sm font-medium text-gray-700 mb-2">
                Activity Level
              </label>
              <select
                id="activity_level"
                name="activity_level"
                value={formData.activity_level}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select activity level</option>
                <option value="Sedentary">Sedentary (little/no exercise)</option>
                <option value="Light">Light (1-3 days/week)</option>
                <option value="Moderate">Moderate (3-5 days/week)</option>
                <option value="Active">Active (6-7 days/week)</option>
                <option value="Very Active">Very Active (2x/day)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                id="weight"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                placeholder="e.g., 70"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-2">
                Height (cm)
              </label>
              <input
                type="number"
                step="0.1"
                id="height"
                name="height"
                value={formData.height}
                onChange={handleInputChange}
                placeholder="e.g., 175"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                Age (years)
              </label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                placeholder="e.g., 25"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="user_restrictions" className="block text-sm font-medium text-gray-700 mb-2">
              Dietary Restrictions
            </label>
            <textarea
              id="user_restrictions"
              name="user_restrictions"
              value={formData.user_restrictions}
              onChange={handleInputChange}
              placeholder="e.g., No dairy, Vegetarian, Gluten-free"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="training_day"
              name="training_day"
              checked={formData.training_day}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="training_day" className="ml-2 block text-sm text-gray-700">
              Training Day (uncheck for rest day)
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '🤖 Generating Plan...' : '🍽️ Generate Meal Plan'}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 font-medium">Error: {error}</p>
          </div>
        )}

        {mealPlan && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              📅 Your {mealPlan.day} Meal Plan
            </h2>
            
            {/* Summary Stats */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-8 border border-blue-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">📊 Daily Nutrition Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <div className="text-2xl font-bold text-blue-600">{mealPlan.total_calories}</div>
                  <div className="text-sm text-gray-600">Calories</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <div className="text-2xl font-bold text-green-600">{mealPlan.total_protein}g</div>
                  <div className="text-sm text-gray-600">Protein</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <div className="text-2xl font-bold text-orange-600">{mealPlan.total_carbs}g</div>
                  <div className="text-sm text-gray-600">Carbs</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <div className="text-2xl font-bold text-purple-600">{mealPlan.total_fat}g</div>
                  <div className="text-sm text-gray-600">Fat</div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Target: {mealPlan.calculated_calories} calories | BMR: {mealPlan.bmr} | Activity: {mealPlan.activity_multiplier}x
                </p>
              </div>
            </div>
            
            {/* Individual Meals */}
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
              {mealPlan.plan.map((meal, index) => (
                <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-center mb-4">
                    <span className="text-2xl mr-3">
                      {meal.meal === 'Breakfast' ? '🌅' : meal.meal === 'Lunch' ? '☀️' : '🌙'}
                    </span>
                    <h3 className="text-xl font-bold text-gray-800">{meal.meal}</h3>
                  </div>
                  
                  <h4 className="text-lg font-semibold text-blue-700 mb-3">
                    {meal.recipe_name}
                  </h4>
                  
                  <div className="mb-4">
                    <h5 className="font-medium text-gray-700 mb-2">Ingredients:</h5>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {meal.ingredients}
                    </p>
                  </div>
                  
                  {/* Macro breakdown */}
                  <div className="bg-white rounded-lg p-4 border border-blue-100">
                    <h6 className="font-medium text-gray-700 mb-3">Macronutrients:</h6>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Calories:</span>
                        <span className="font-semibold text-blue-600">{meal.calories}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Protein:</span>
                        <span className="font-semibold text-green-600">{meal.protein}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Carbs:</span>
                        <span className="font-semibold text-orange-600">{meal.carbs}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fat:</span>
                        <span className="font-semibold text-purple-600">{meal.fat}g</span>
                      </div>
                      <div className="flex justify-between col-span-2">
                        <span className="text-gray-600">Fiber:</span>
                        <span className="font-semibold text-indigo-600">{meal.fiber}g</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                💡 This meal plan is generated by AI and should be used as a starting point. 
                Consult with a nutritionist for personalized dietary advice.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
