import { NutritionPlan, WorkoutPlan, MealItem, WorkoutExercise, WeeklyWorkoutScheduleItem, DailyMealPlan, WeeklyMealPlan } from '@/types/plan-types';

/**
 * Validates if an object is an array
 */
export function isArray(obj: any): obj is any[] {
  return Array.isArray(obj);
}

/**
 * Validates a workout exercise
 */
export function isValidWorkoutExercise(exercise: any): exercise is WorkoutExercise {
  return (
    exercise &&
    typeof exercise === 'object' &&
    typeof exercise.name === 'string' &&
    (typeof exercise.sets === 'number' || typeof exercise.sets === 'string') &&
    typeof exercise.reps === 'string' &&
    typeof exercise.rest === 'string' &&
    typeof exercise.notes === 'string'
  );
}

/**
 * Validates a workout day item
 */
export function isValidWorkoutDay(day: any): day is WeeklyWorkoutScheduleItem {
  return (
    day &&
    typeof day === 'object' &&
    typeof day.dayOfWeek === 'string' &&
    typeof day.isRestDay === 'boolean' &&
    (day.isRestDay || (
      day.workoutDetails &&
      typeof day.workoutDetails === 'object' &&
      typeof day.workoutDetails.workoutName === 'string' &&
      typeof day.workoutDetails.warmUp === 'string' &&
      Array.isArray(day.workoutDetails.exercises) &&
      day.workoutDetails.exercises.every(isValidWorkoutExercise) &&
      typeof day.workoutDetails.coolDown === 'string'
    ))
  );
}

/**
 * Validates a workout plan object structure
 */
export function isValidWorkoutPlan(plan: any): plan is WorkoutPlan {
  return (
    plan &&
    typeof plan === 'object' &&
    typeof plan.planName === 'string' &&
    Array.isArray(plan.multiWeekSchedules) &&
    plan.multiWeekSchedules.every((week: any) => 
      Array.isArray(week) && 
      week.length > 0 && 
      week.every(isValidWorkoutDay)
    ) &&
    typeof plan.currentWeekIndex === 'number' &&
    plan.preferences && 
    typeof plan.preferences === 'object' &&
    typeof plan.summaryNotes === 'string'
  );
}

/**
 * Validates a nutrition ingredient
 */
export function isValidNutritionIngredient(ingredient: any): boolean {
  return (
    ingredient &&
    typeof ingredient === 'object' &&
    typeof ingredient.item === 'string' &&
    typeof ingredient.qty === 'string'
  );
}

/**
 * Validates a meal item
 */
export function isValidMealItem(meal: any): meal is MealItem {
  return (
    meal &&
    typeof meal === 'object' &&
    typeof meal.mealType === 'string' &&
    typeof meal.name === 'string' &&
    Array.isArray(meal.ingredients) &&
    meal.ingredients.every(isValidNutritionIngredient) &&
    typeof meal.calories === 'number' &&
    typeof meal.protein === 'number' &&
    typeof meal.carbs === 'number' &&
    typeof meal.fats === 'number'
  );
}

/**
 * Validates a daily meal plan
 */
export function isValidDailyMealPlan(plan: any): plan is DailyMealPlan {
  return (
    plan &&
    typeof plan === 'object' &&
    Array.isArray(plan.meals) &&
    plan.meals.every(isValidMealItem) &&
    typeof plan.dailyTotalCalories === 'number' &&
    typeof plan.dailyTotalProtein === 'number' &&
    typeof plan.dailyTotalCarbs === 'number' &&
    typeof plan.dailyTotalFats === 'number'
  );
}

/**
 * Validates a weekly meal plan
 */
export function isValidWeeklyMealPlan(plan: any): plan is WeeklyMealPlan {
  const requiredDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  return (
    plan &&
    typeof plan === 'object' &&
    requiredDays.every(day => 
      plan[day] && isValidDailyMealPlan(plan[day])
    )
  );
}

/**
 * Validates a nutrition plan object structure
 */
export function isValidNutritionPlan(plan: any): plan is NutritionPlan {
  return (
    plan &&
    typeof plan === 'object' &&
    typeof plan.planName === 'string' &&
    plan.dailyTargets &&
    typeof plan.dailyTargets === 'object' &&
    typeof plan.dailyTargets.calories === 'number' &&
    typeof plan.dailyTargets.proteinGrams === 'number' &&
    typeof plan.dailyTargets.carbGrams === 'number' &&
    typeof plan.dailyTargets.fatGrams === 'number' &&
    plan.preferences &&
    typeof plan.preferences === 'object' &&
    typeof plan.hydrationRecommendation === 'string' &&
    Array.isArray(plan.generalTips) &&
    Array.isArray(plan.multiWeekMealPlans) &&
    plan.multiWeekMealPlans.every(isValidWeeklyMealPlan) &&
    typeof plan.currentWeekIndex === 'number'
  );
}

/**
 * Validates a nutrition plan and returns a validated plan or fallback
 */
export function validateNutritionPlan(plan: any): NutritionPlan {
  if (isValidNutritionPlan(plan)) {
    return plan;
  }
  console.error('Invalid nutrition plan format, using fallback plan');
  return createFallbackNutritionPlan();
}

/**
 * Validates a workout plan and returns a validated plan or fallback
 */
export function validateWorkoutPlan(plan: any): WorkoutPlan {
  if (isValidWorkoutPlan(plan)) {
    return plan;
  }
  console.error('Invalid workout plan format, using fallback plan');
  return createFallbackWorkoutPlan();
}

/**
 * Validates meal data structure
 */
export function validateMeal(meal: any): MealItem | null {
  if (isValidMealItem(meal)) {
    return meal;
  }
  console.error('Invalid meal format: missing required properties');
  return null;
}

/**
 * Creates a fallback nutrition plan if validation fails
 */
export function createFallbackNutritionPlan(): NutritionPlan {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const weeklyMealPlan: any = {};
  
  // Create a default meal plan for each day
  days.forEach(day => {
    weeklyMealPlan[day] = {
      meals: [
        {
          mealType: "Breakfast",
          name: "Default Breakfast",
          ingredients: [
            { item: "Eggs", qty: "2" },
            { item: "Toast", qty: "2 slices" }
          ],
          calories: 500,
          protein: 30,
          carbs: 50,
          fats: 15,
          instructions: "Scramble eggs and serve with toast."
        },
        {
          mealType: "Lunch",
          name: "Default Lunch",
          ingredients: [
            { item: "Chicken Breast", qty: "4 oz" },
            { item: "Rice", qty: "1 cup" },
            { item: "Vegetables", qty: "1 cup" }
          ],
          calories: 700,
          protein: 40,
          carbs: 70,
          fats: 20,
          instructions: "Cook chicken and serve with rice and vegetables."
        },
        {
          mealType: "Dinner",
          name: "Default Dinner",
          ingredients: [
            { item: "Salmon", qty: "4 oz" },
            { item: "Sweet Potato", qty: "1 medium" },
            { item: "Broccoli", qty: "1 cup" }
          ],
          calories: 600,
          protein: 35,
          carbs: 60,
          fats: 15,
          instructions: "Bake salmon and serve with sweet potato and steamed broccoli."
        },
        {
          mealType: "Snack",
          name: "Default Snack",
          ingredients: [
            { item: "Greek Yogurt", qty: "1 cup" },
            { item: "Berries", qty: "1/2 cup" }
          ],
          calories: 200,
          protein: 15,
          carbs: 20,
          fats: 5,
          instructions: "Mix berries into yogurt."
        }
      ],
      dailyTotalCalories: 2000,
      dailyTotalProtein: 120,
      dailyTotalCarbs: 200,
      dailyTotalFats: 55
    };
  });
  
  return {
    planName: "Default Nutrition Plan",
    dailyTargets: {
      calories: 2000,
      proteinGrams: 150,
      carbGrams: 200,
      fatGrams: 70
    },
    preferences: {
      goalType: "maintenance",
      activityLevel: "moderate"
    },
    hydrationRecommendation: "Drink 8-10 glasses of water daily",
    generalTips: ["Focus on whole foods", "Eat protein with every meal", "Stay hydrated"],
    multiWeekMealPlans: [weeklyMealPlan as WeeklyMealPlan],
    currentWeekIndex: 0
  };
}

/**
 * Creates a fallback workout plan if validation fails
 */
export function createFallbackWorkoutPlan(): WorkoutPlan {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const weeklySchedule = days.map(day => {
    // Make weekends rest days in the fallback plan
    const isRestDay = day === 'Saturday' || day === 'Sunday';
    
    return {
      dayOfWeek: day,
      isRestDay,
      workoutDetails: isRestDay ? null : {
        workoutName: `Default ${day} Workout`,
        workoutType: day === 'Monday' || day === 'Thursday' ? 'Upper Body' : 'Lower Body',
        warmUp: 'Light cardio for 5 minutes followed by dynamic stretching.',
        coolDown: 'Static stretching for 5-10 minutes.',
        exercises: [
          {
            name: day === 'Monday' || day === 'Thursday' ? 'Push-ups' : 'Bodyweight Squats',
            sets: 3,
            reps: '10-12',
            rest: '60 seconds',
            notes: 'Focus on form',
            equipment: 'None',
            muscleGroup: day === 'Monday' || day === 'Thursday' ? 'Chest' : 'Legs',
          },
          {
            name: day === 'Monday' || day === 'Thursday' ? 'Dumbbell Rows' : 'Lunges',
            sets: 3,
            reps: '10-12',
            rest: '60 seconds',
            notes: 'Maintain proper posture',
            equipment: day === 'Monday' || day === 'Thursday' ? 'Dumbbells' : 'None',
            muscleGroup: day === 'Monday' || day === 'Thursday' ? 'Back' : 'Legs',
          },
          {
            name: day === 'Monday' || day === 'Thursday' ? 'Shoulder Press' : 'Calf Raises',
            sets: 3,
            reps: '10-12',
            rest: '60 seconds',
            notes: 'Control the movement',
            equipment: day === 'Monday' || day === 'Thursday' ? 'Dumbbells' : 'None',
            muscleGroup: day === 'Monday' || day === 'Thursday' ? 'Shoulders' : 'Calves',
          }
        ]
      }
    };
  });
  
  return {
    planName: "Default Workout Plan",
    preferences: {
      workoutSplit: "UpperLower",
      goalType: "general_fitness",
      experienceLevel: "beginner"
    },
    summaryNotes: "A basic workout plan with 5 training days per week.",
    multiWeekSchedules: [weeklySchedule],
    currentWeekIndex: 0
  };
} 