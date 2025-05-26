import OpenAI from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

// Configure OpenAI API
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface WorkoutPlanParams {
  goalType: string;
  experienceLevel: string;
  currentWeight: number; // kg
  targetWeight: number;  // kg
  age: number;
  sex: string;
  height: number; // cm - for consistency, though workout might not strictly need it like nutrition
  preferredWorkoutDays: string[];
  // Optional, as form might not provide them yet
  weakPoints?: string[]; 
  targetDate?: string;    
}

interface NutritionPlanParams {
  goalType: string;
  experienceLevel: string; // Added
  height: number; // cm
  weight: number; // kg (current weight)
  age: number;
  sex: string;
  // Optional, as form might not provide them yet
  favoriteFoods?: string[];
  allergies?: string[];
  targetDate?: string; 
  // currentWeight: number; // kg - already have `weight`
  // targetWeight: number;  // kg - For nutrition, target weight is good context
  targetWeight?: number;
}

// Validate and restructure JSON from AI
function validateAndFixWorkoutPlanJson(jsonString: string): any {
  // First clean up any markdown formatting or code blocks
  let cleanedJsonString = jsonString;
  
  // Remove markdown code blocks if present
  const codeBlockMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    cleanedJsonString = codeBlockMatch[1];
  }
  
  // Remove comments which are invalid in JSON
  cleanedJsonString = cleanedJsonString.replace(/\/\/.*$/gm, '');
  
  try {
    // Try to parse the cleaned string
    const parsed = JSON.parse(cleanedJsonString);
    
    // Basic validation
    if (!parsed.weeklySchedule) {
      parsed.weeklySchedule = [];
    }
    
    // Ensure planName and planType exist
    if (!parsed.planName) {
      parsed.planName = "Customized 7-Day Workout Plan";
    }
    
    if (!parsed.planType) {
      parsed.planType = "general";
    }
    
    return parsed;
  } catch (error) {
    console.error("Workout plan JSON parsing failed, attempting to fix:", error);
    
    // If parsing fails, attempt more aggressive JSON repair
    try {
      // Fallback to a very simplistic valid structure if all parsing fails
      return {
        planName: "Basic Workout Plan",
        planType: "general",
        weeklySchedule: [
          {
            dayOfWeek: "Monday",
            isRestDay: false,
            workoutDetails: {
              workoutName: "Full Body Workout",
              warmUp: "5 min light cardio, dynamic stretching",
              exercises: [
                {
                  name: "Squats",
                  sets: 3,
                  reps: "10-12",
                  weight: "moderate",
                  notes: "Focus on form and depth"
                },
                {
                  name: "Push-ups",
                  sets: 3,
                  reps: "10-15",
                  weight: "bodyweight",
                  notes: "Modify on knees if needed"
                },
                {
                  name: "Dumbbell Rows",
                  sets: 3,
                  reps: "10-12 per arm",
                  weight: "light to moderate",
                  notes: "Focus on squeezing shoulder blades"
                }
              ],
              coolDown: "5 min static stretching"
            }
          }
        ]
      };
    } catch (fallbackError) {
      throw new Error(`Failed to create valid workout plan JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export async function generateWorkoutPlan(params: WorkoutPlanParams) {
  try {
    // Ensure all required parameters have values
    const safeParams = {
      goalType: params.goalType || 'general fitness',
      experienceLevel: params.experienceLevel || 'beginner',
      currentWeight: params.currentWeight || 70,
      targetWeight: params.targetWeight || params.currentWeight || 70,
      age: params.age || 30,
      sex: params.sex || 'unspecified',
      height: params.height || 170,
      preferredWorkoutDays: params.preferredWorkoutDays || [],
      weakPoints: params.weakPoints || [],
      targetDate: params.targetDate || ''
    };

    const systemPrompt = `You are a professional fitness trainer specialized in creating personalized workout plans. 
    RESPOND ONLY WITH VALID JSON without any comments, explanations, or extra text.
    The JSON must strictly follow the structure requested in the user prompt.`;

    const userPrompt = `Create a 7-day workout plan for a ${safeParams.age}-year-old ${safeParams.sex}, who is ${safeParams.experienceLevel} with the goal of ${safeParams.goalType}. 
    Their current weight is ${safeParams.currentWeight} kg, target weight is ${safeParams.targetWeight} kg, and height is ${safeParams.height} cm.
    ${safeParams.preferredWorkoutDays.length > 0 ? 
      `They prefer to work out on: ${safeParams.preferredWorkoutDays.join(', ')}.` : ''}
    ${safeParams.weakPoints.length > 0 ? 
      `Focus on these weak points: ${safeParams.weakPoints.join(', ')}.` : ''}
    ${safeParams.targetDate ? `They want to reach their target by: ${safeParams.targetDate}.` : ''}
    
    Your response must be a valid JSON object with this structure:

    {
      "planName": "Customized 7-Day Workout Plan",
      "planType": "${safeParams.goalType}",
      "weeklySchedule": [
        {
          "dayOfWeek": "Monday",
          "isRestDay": false,
          "workoutDetails": {
            "workoutName": "Push Day - Chest & Triceps",
            "warmUp": "5 min cardio + dynamic stretches",
            "exercises": [
              {
                "name": "Bench Press",
                "sets": 3,
                "reps": "8-10",
                "weight": "moderate/heavy",
                "notes": "Focus on form, keep shoulders back"
              }
            ],
            "coolDown": "Static stretches for worked muscle groups"
          }
        }
      ]
    }
    
    Include entries for all 7 days of the week.
    For rest days, set "isRestDay": true and omit the workoutDetails field.
    Provide NO COMMENTS or explanations, only the JSON response.`;

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    // Use gpt-3.5-turbo for compatibility
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.5, // Lower temperature for more consistent output
      max_tokens: 4000,
    });

    const workoutPlanString = response.choices[0]?.message?.content || '';
    console.log("Received workout plan response length:", workoutPlanString.length);
    
    // Validate and fix the JSON response
    return validateAndFixWorkoutPlanJson(workoutPlanString);
  } catch (error) {
    console.error('Failed to generate workout plan:', error);
    throw new Error(`Failed to generate workout plan: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Validate and restructure JSON from AI for nutrition plans
function validateAndFixNutritionPlanJson(jsonString: string): any {
  // First clean up any markdown formatting or code blocks
  let cleanedJsonString = jsonString;
  
  // Remove markdown code blocks if present
  const codeBlockMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    cleanedJsonString = codeBlockMatch[1];
  }
  
  // Remove comments which are invalid in JSON
  cleanedJsonString = cleanedJsonString.replace(/\/\/.*$/gm, '');
  
  try {
    // Try to parse the cleaned string
    const parsed = JSON.parse(cleanedJsonString);
    
    // Basic validation
    if (!parsed.weeklyMealPlan) {
      parsed.weeklyMealPlan = [];
    }
    
    // Ensure the structure is correct
    if (!Array.isArray(parsed.weeklyMealPlan) && typeof parsed.weeklyMealPlan === 'object') {
      // Convert from object format to array format if needed
      const arrayFormat = Object.entries(parsed.weeklyMealPlan).map(([dayOfWeek, mealData]) => ({
        dayOfWeek: dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1),
        meals: Array.isArray((mealData as any)?.meals) ? (mealData as any).meals : []
      }));
      
      parsed.weeklyMealPlan = arrayFormat;
    }
    
    // Ensure dailyTargets exist
    if (!parsed.dailyTargets) {
      parsed.dailyTargets = {
        calories: 2000,
        proteinGrams: 150,
        carbGrams: 200,
        fatGrams: 70
      };
    }
    
    // Ensure planName and planType exist
    if (!parsed.planName) {
      parsed.planName = "Customized 7-Day Nutrition Plan";
    }
    
    if (!parsed.planType) {
      parsed.planType = "general";
    }
    
    return parsed;
  } catch (error) {
    console.error("JSON parsing failed, attempting to fix:", error);
    
    // If parsing fails, attempt more aggressive JSON repair
    try {
      // Fallback to a very simplistic valid structure if all parsing fails
      return {
        planName: "Basic Nutrition Plan",
        planType: "general",
        dailyTargets: {
          calories: 2000,
          proteinGrams: 150,
          carbGrams: 200,
          fatGrams: 70
        },
        weeklyMealPlan: [
          {
            dayOfWeek: "Monday",
            meals: [
              {
                mealType: "Breakfast",
                name: "Default Breakfast",
                description: "A balanced breakfast",
                calories: 500,
                protein: 30,
                carbs: 50,
                fats: 15
              },
              {
                mealType: "Lunch",
                name: "Default Lunch",
                description: "A balanced lunch",
                calories: 700,
                protein: 40,
                carbs: 70,
                fats: 20
              },
              {
                mealType: "Dinner",
                name: "Default Dinner",
                description: "A balanced dinner",
                calories: 600,
                protein: 35,
                carbs: 60,
                fats: 15
              }
            ]
          }
        ]
      };
    } catch (fallbackError) {
      throw new Error(`Failed to create valid nutrition plan JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export async function generateNutritionPlan(params: NutritionPlanParams) {
  try {
    // Ensure all required parameters have values
    const safeParams = {
      goalType: params.goalType || 'general health',
      experienceLevel: params.experienceLevel || 'beginner',
      height: params.height || 170,
      weight: params.weight || 70,
      age: params.age || 30,
      sex: params.sex || 'unspecified',
      favoriteFoods: params.favoriteFoods || [],
      allergies: params.allergies || [],
      targetDate: params.targetDate || '',
      targetWeight: params.targetWeight || params.weight || 70
    };

    const systemPrompt = `You are a professional nutritionist specialized in creating personalized meal plans. 
    RESPOND ONLY WITH VALID JSON without any comments, explanations, or extra text.
    The JSON must strictly follow the structure requested in the user prompt.`;

    const userPrompt = `Create a 7-day nutrition plan for a ${safeParams.age}-year-old ${safeParams.sex}, who is ${safeParams.experienceLevel} with the goal of ${safeParams.goalType}.
    Their current weight is ${safeParams.weight} kg, height is ${safeParams.height} cm.
    ${safeParams.targetWeight ? `They are aiming for a target weight of ${safeParams.targetWeight} kg.` : ''}
    ${safeParams.favoriteFoods.length > 0 ? `They prefer these foods: ${safeParams.favoriteFoods.join(', ')}.` : ''}
    ${safeParams.allergies.length > 0 ? `They have allergies to: ${safeParams.allergies.join(', ')}.` : ''}
    ${safeParams.targetDate ? `They want to reach their target by: ${safeParams.targetDate}.` : ''}
    
    Your response must be a valid JSON object with this structure:

    {
      "planName": "Customized 7-Day Nutrition Plan",
      "planType": "${safeParams.goalType}",
      "dailyTargets": {
        "calories": 2000,
        "proteinGrams": 150,
        "carbGrams": 200,
        "fatGrams": 70
      },
      "weeklyMealPlan": [
        {
          "dayOfWeek": "Monday",
          "meals": [
            {
              "mealType": "Breakfast",
              "name": "Protein Oatmeal",
              "description": "Oatmeal with whey protein",
              "calories": 450,
              "protein": 30,
              "carbs": 45,
              "fats": 15
            }
          ]
        }
      ]
    }
    
    Include entries for all 7 days of the week.
    For each day, include 3-4 meals (breakfast, lunch, dinner, and optionally snacks).
    Provide NO COMMENTS or explanations, only the JSON response.`;

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    // Use gpt-3.5-turbo for compatibility
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.5, // Lower temperature for more consistent output
      max_tokens: 4000,
    });

    const nutritionPlanString = response.choices[0]?.message?.content || '';
    console.log("Received nutrition plan response length:", nutritionPlanString.length);
    
    // Validate and fix the JSON response
    return validateAndFixNutritionPlanJson(nutritionPlanString);
  } catch (error) {
    console.error('Failed to generate nutrition plan:', error);
    throw new Error(`Failed to generate nutrition plan: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function generateMealPlan(userData: any) {
  const prompt = `Create a personalized meal plan for a user with the following details:
    Goal: ${userData.goalType}
    Daily Calorie Target: ${userData.dailyCalories}
    Dietary Restrictions: ${userData.dietaryRestrictions.join(', ')}
    Favorite Foods: ${userData.favoriteFoods.join(', ')}
    Allergies: ${userData.allergies.join(', ')}
    
    Please provide a detailed meal plan that includes:
    1. Daily meal breakdown
    2. Macro distribution
    3. Meal timing
    4. Food alternatives
    5. Shopping list`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{ role: "user", content: prompt }],
  });

  return completion.choices[0].message.content;
}

export async function analyzeProgress(userData: any, progressData: any) {
  const prompt = `Analyze the user's fitness progress and provide recommendations:
    Current Progress:
    - Weight Change: ${progressData.weightChange}
    - Workout Completion: ${progressData.workoutCompletion}
    - Nutrition Adherence: ${progressData.nutritionAdherence}
    
    User Data:
    - Goal: ${userData.goalType}
    - Target Weight: ${userData.targetWeight}
    - Time Remaining: ${progressData.timeRemaining}
    
    Please provide:
    1. Progress analysis
    2. Areas of success
    3. Areas for improvement
    4. Specific recommendations
    5. Motivation and encouragement`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{ role: "user", content: prompt }],
  });

  return completion.choices[0].message.content;
} 