import { NutritionPlan, MealItem, NutritionIngredient, DailyMealPlan, WeeklyMealPlan } from "@/types/plan-types";

// Aligned with NutritionIngredient from plan-types
export interface StaticNutritionIngredient {
  item: string; // Changed from name
  qty: string;  // Changed from amount
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
}

// Aligned with MealItem from plan-types
export interface StaticMealDataItem {
  mealType: string; // Added: e.g., "Breakfast", "Lunch", "Dinner", "Snack"
  name: string;
  ingredients: StaticNutritionIngredient[]; // Updated to use StaticNutritionIngredient
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  instructions?: string;
  completed?: boolean; // Added
}

export interface MealLibrary {
  breakfast: StaticMealDataItem[];
  lunch: StaticMealDataItem[];
  dinner: StaticMealDataItem[];
  snacks: StaticMealDataItem[];
}

export const mealLibrary: MealLibrary = {
  breakfast: [
    { mealType: "Breakfast", name: "Oatmeal with Almond Butter & Berries", calories: 380, protein: 15, carbs: 50, fats: 14, ingredients: [{item: "Oats", qty: "1/2 cup", calories: 150}, {item: "Almond Butter", qty: "2 tbsp", calories: 190}, {item: "Berries", qty: "1/2 cup", calories: 40}], instructions: "Cook oats with water or milk. Stir in almond butter and top with berries.", completed: false },
    { mealType: "Breakfast", name: "Scrambled Eggs with Spinach & Whole Wheat Toast", calories: 400, protein: 25, carbs: 30, fats: 18, ingredients: [{item: "Eggs", qty: "3"}, {item: "Spinach", qty: "1 cup"}, {item: "Whole Wheat Toast", qty: "2 slices"}], instructions: "Scramble eggs with spinach. Serve with toast.", completed: false },
    { mealType: "Breakfast", name: "Greek Yogurt with Granola and Honey", calories: 320, protein: 20, carbs: 40, fats: 9, ingredients: [{item: "Greek Yogurt", qty: "1 cup"}, {item: "Granola", qty: "1/4 cup"}, {item: "Honey", qty: "1 tsp"}], instructions: "Combine Greek yogurt, granola, and a drizzle of honey.", completed: false },
    { mealType: "Breakfast", name: "Protein Smoothie (Whey, Banana, PB)", calories: 450, protein: 35, carbs: 45, fats: 15, ingredients: [{item: "Whey Protein", qty: "1 scoop"}, {item: "Banana", qty: "1"}, {item: "Peanut Butter", qty: "2 tbsp"}, {item: "Almond Milk", qty: "1 cup"} ], completed: false },
  ],
  lunch: [
    { mealType: "Lunch", name: "Grilled Chicken Salad with Vinaigrette", calories: 480, protein: 45, carbs: 25, fats: 22, ingredients: [{item: "Chicken Breast", qty: "150g"}, {item: "Mixed Greens", qty: "3 cups"}, {item: "Olive Oil Vinaigrette", qty: "2 tbsp"}], completed: false },
    { mealType: "Lunch", name: "Quinoa Bowl with Black Beans and Avocado", calories: 550, protein: 20, carbs: 70, fats: 20, ingredients: [{item: "Quinoa", qty: "1 cup cooked"}, {item: "Black Beans", qty: "1/2 cup"}, {item: "Avocado", qty: "1/2"}], completed: false },
  ],
  dinner: [
    { mealType: "Dinner", name: "Baked Salmon with Roasted Asparagus & Sweet Potato", calories: 650, protein: 45, carbs: 55, fats: 28, ingredients: [{item: "Salmon Fillet", qty: "150g"}, {item: "Asparagus", qty: "1 cup"}, {item: "Sweet Potato", qty: "1 medium"}], completed: false },
    { mealType: "Dinner", name: "Lean Beef Stir-fry with Brown Rice", calories: 600, protein: 40, carbs: 60, fats: 20, ingredients: [{item: "Lean Beef Strips", qty: "150g"}, {item: "Mixed Vegetables", qty: "2 cups"}, {item: "Brown Rice", qty: "1 cup cooked"}], completed: false },
  ],
  snacks: [
    { mealType: "Snack", name: "Apple with Peanut Butter", calories: 220, protein: 8, carbs: 25, fats: 10, ingredients: [{item: "Apple", qty: "1 medium"}, {item: "Peanut Butter", qty: "2 tbsp"}], completed: false },
    { mealType: "Snack", name: "Protein Bar", calories: 200, protein: 20, carbs: 20, fats: 8, ingredients: [{item: "Protein Bar", qty: "1"}], completed: false },
    { mealType: "Snack", name: "Handful of Almonds", calories: 180, protein: 6, carbs: 6, fats: 15, ingredients: [{item: "Almonds", qty: "1/4 cup"}], completed: false },
  ],
};

// Helper to get random meal, ensuring it's a deep copy to avoid mutation issues
const getRandomMeal = (category: keyof MealLibrary): StaticMealDataItem => {
  const meals = mealLibrary[category];
  if (!meals || meals.length === 0) { // Should not happen with current library
    throw new Error(`No meals found for category: ${category}`);
  }
  const meal = meals[Math.floor(Math.random() * meals.length)];
  return JSON.parse(JSON.stringify(meal));
};

const generateDailyMealPlan = (): DailyMealPlan => {
  const breakfast = getRandomMeal('breakfast');
  const lunch = getRandomMeal('lunch');
  const dinner = getRandomMeal('dinner');
  const snack1 = getRandomMeal('snacks');
  let snack2 = getRandomMeal('snacks');
  if (mealLibrary.snacks.length > 1) {
    while (snack2.name === snack1.name) {
        snack2 = getRandomMeal('snacks');
    }
  }
  
  const allMeals: MealItem[] = [breakfast, lunch, dinner, snack1, snack2].map(m => ({...m, completed: false}));

  const dailyTotalCalories = allMeals.reduce((sum, meal) => sum + meal.calories, 0);
  const dailyTotalProtein = allMeals.reduce((sum, meal) => sum + meal.protein, 0);
  const dailyTotalCarbs = allMeals.reduce((sum, meal) => sum + meal.carbs, 0);
  const dailyTotalFats = allMeals.reduce((sum, meal) => sum + meal.fats, 0);

  return {
    meals: allMeals,
    dailyTotalCalories,
    dailyTotalProtein,
    dailyTotalCarbs,
    dailyTotalFats,
  };
};

interface NutritionPlanPreferences {
  currentWeight?: number; // kg
  height?: number; // cm
  age?: number; // years
  sex?: 'male' | 'female' | string;
  goalType?: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'strength_gain' | string;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | string;
  dietaryRestrictions?: string[];
}

const calculateTargets = (prefs: NutritionPlanPreferences): {calories: number, protein: number, carbs: number, fat: number} => {
  const { currentWeight, height, age, sex, goalType, activityLevel = 'moderate' } = prefs;

  if (!currentWeight || !height || !age || !sex || !goalType) {
    // Return default targets if essential info is missing
    console.warn("Essential profile data missing for calorie calculation, using defaults.");
    return { calories: 2000, protein: 150, carbs: 200, fat: 67 };
  }

  let bmr = 0;
  if (sex === 'male') {
    bmr = (10 * currentWeight) + (6.25 * height) - (5 * age) + 5;
  } else { // female or other (using female formula as a fallback if not strictly male)
    bmr = (10 * currentWeight) + (6.25 * height) - (5 * age) - 161;
  }

  const activityFactors: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  const tdee = bmr * (activityFactors[activityLevel as string] || 1.55); // Default to moderate if invalid

  let targetCalories = tdee;
  if (goalType === 'weight_loss') {
    targetCalories -= 400;
  } else if (goalType === 'muscle_gain') {
    targetCalories += 400;
  } // maintenance or strength_gain (assuming strength gain might also be at maintenance or slight surplus)

  // Protein: 0.8g per lb of bodyweight. 1kg = 2.20462 lbs
  const targetProteinGrams = Math.round(currentWeight * 2.20462 * 0.8);
  // Fat: 25% of total calories
  const targetFatGrams = Math.round((targetCalories * 0.25) / 9);
  // Carbs: Remainder
  const targetCarbGrams = Math.round((targetCalories - (targetProteinGrams * 4) - (targetFatGrams * 9)) / 4);
  
  return {
    calories: Math.round(targetCalories),
    protein: targetProteinGrams,
    carbs: targetCarbGrams,
    fat: targetFatGrams,
  };
};

export const createStaticNutritionPlan = (userPreferences?: NutritionPlanPreferences): NutritionPlan => {
  // ✅ This function creates static nutrition plans
  // 🤖 AI is only used to suggest substitutions or macro tweaks after plan generation
  // ❌ AI does not create or replace full plans
  
  try {
    const days: (keyof WeeklyMealPlan)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const weeklyMealPlanData: Partial<WeeklyMealPlan> = {};

    // Create a valid meal plan for each day
    days.forEach(day => {
      try {
        weeklyMealPlanData[day] = generateDailyMealPlan();
      } catch (error) {
        console.error(`Error generating meal plan for ${day}:`, error);
        // Provide a fallback meal plan with minimal structure
        weeklyMealPlanData[day] = {
          meals: [
            {
              mealType: "Breakfast",
              name: "Default Breakfast",
              ingredients: [{ item: "Default", qty: "1 serving" }],
              calories: 400,
              protein: 20,
              carbs: 40,
              fats: 15,
              completed: false
            }
          ],
          dailyTotalCalories: 400,
          dailyTotalProtein: 20,
          dailyTotalCarbs: 40,
          dailyTotalFats: 15
        };
      }
    });
    
    // Always ensure every day exists
    days.forEach(day => {
      if (!weeklyMealPlanData[day] || !Array.isArray(weeklyMealPlanData[day]?.meals)) {
        console.warn(`Day ${day} is missing or has invalid structure, creating default`);
        weeklyMealPlanData[day] = {
          meals: [
            {
              mealType: "Breakfast",
              name: "Default Breakfast",
              ingredients: [{ item: "Default", qty: "1 serving" }],
              calories: 400,
              protein: 20,
              carbs: 40,
              fats: 15,
              completed: false
            }
          ],
          dailyTotalCalories: 400,
          dailyTotalProtein: 20,
          dailyTotalCarbs: 40,
          dailyTotalFats: 15
        };
      }
    });
    
    const targets = calculateTargets(userPreferences || {});

    let planName = "Standard Nutrition Plan";
    if (userPreferences?.goalType) {
      const goal = String(userPreferences.goalType).replace('_', ' ');
      planName = `${goal.charAt(0).toUpperCase() + goal.slice(1)} Nutrition Plan`;
    }

    // Perform a final validation before returning
    const finalPlan: NutritionPlan = {
      planName: planName,
      dailyTargets: {
        calories: targets.calories || 2000,
        proteinGrams: targets.protein || 150,
        carbGrams: targets.carbs || 200,
        fatGrams: targets.fat || 67,
      },
      preferences: userPreferences || {},
      hydrationRecommendation: "Aim for 8-10 glasses (64-80 oz) of water daily. Adjust based on activity level and thirst.",
      generalTips: [
        "Prioritize whole, unprocessed foods.",
        "Include a variety of colorful fruits and vegetables.",
        "Ensure adequate protein intake at each meal for satiety and muscle repair.",
        "Don\'t fear healthy fats from sources like avocados, nuts, seeds, and olive oil.",
        "Listen to your body\'s hunger and fullness cues.",
        "Meal prep can save time and help you stick to your plan."
      ],
      multiWeekMealPlans: [weeklyMealPlanData as WeeklyMealPlan],
      currentWeekIndex: 0,
    };
    
    // Make sure multiWeekMealPlans is always an array
    if (!Array.isArray(finalPlan.multiWeekMealPlans)) {
      console.warn("multiWeekMealPlans is not an array, fixing");
      finalPlan.multiWeekMealPlans = [];
    }
    
    // Make sure we have at least one week
    if (finalPlan.multiWeekMealPlans.length === 0) {
      console.warn("No weeks in multiWeekMealPlans, adding default week");
      finalPlan.multiWeekMealPlans.push(weeklyMealPlanData as WeeklyMealPlan);
    }
    
    return finalPlan;
  } catch (error) {
    // If anything goes wrong, return a minimal valid structure
    console.error("Error creating nutrition plan:", error);
    
    // Create an extremely minimal valid plan
    const fallbackPlan: NutritionPlan = {
      planName: "Emergency Fallback Plan",
      dailyTargets: {
        calories: 2000,
        proteinGrams: 150,
        carbGrams: 200,
        fatGrams: 67,
      },
      preferences: {},
      hydrationRecommendation: "Drink 8-10 glasses of water daily",
      generalTips: ["Focus on whole foods"],
      multiWeekMealPlans: [
        {
          monday: { 
            meals: [{ mealType: "Breakfast", name: "Emergency Meal", ingredients: [], calories: 500, protein: 30, carbs: 50, fats: 20, completed: false }],
            dailyTotalCalories: 500,
            dailyTotalProtein: 30,
            dailyTotalCarbs: 50,
            dailyTotalFats: 20
          },
          tuesday: { 
            meals: [{ mealType: "Breakfast", name: "Emergency Meal", ingredients: [], calories: 500, protein: 30, carbs: 50, fats: 20, completed: false }],
            dailyTotalCalories: 500,
            dailyTotalProtein: 30,
            dailyTotalCarbs: 50,
            dailyTotalFats: 20
          },
          wednesday: { 
            meals: [{ mealType: "Breakfast", name: "Emergency Meal", ingredients: [], calories: 500, protein: 30, carbs: 50, fats: 20, completed: false }],
            dailyTotalCalories: 500,
            dailyTotalProtein: 30,
            dailyTotalCarbs: 50,
            dailyTotalFats: 20
          },
          thursday: { 
            meals: [{ mealType: "Breakfast", name: "Emergency Meal", ingredients: [], calories: 500, protein: 30, carbs: 50, fats: 20, completed: false }],
            dailyTotalCalories: 500,
            dailyTotalProtein: 30,
            dailyTotalCarbs: 50,
            dailyTotalFats: 20
          },
          friday: { 
            meals: [{ mealType: "Breakfast", name: "Emergency Meal", ingredients: [], calories: 500, protein: 30, carbs: 50, fats: 20, completed: false }],
            dailyTotalCalories: 500,
            dailyTotalProtein: 30,
            dailyTotalCarbs: 50,
            dailyTotalFats: 20
          },
          saturday: { 
            meals: [{ mealType: "Breakfast", name: "Emergency Meal", ingredients: [], calories: 500, protein: 30, carbs: 50, fats: 20, completed: false }],
            dailyTotalCalories: 500,
            dailyTotalProtein: 30,
            dailyTotalCarbs: 50,
            dailyTotalFats: 20
          },
          sunday: { 
            meals: [{ mealType: "Breakfast", name: "Emergency Meal", ingredients: [], calories: 500, protein: 30, carbs: 50, fats: 20, completed: false }],
            dailyTotalCalories: 500,
            dailyTotalProtein: 30,
            dailyTotalCarbs: 50,
            dailyTotalFats: 20
          }
        }
      ],
      currentWeekIndex: 0
    };
    
    return fallbackPlan;
  }
};
