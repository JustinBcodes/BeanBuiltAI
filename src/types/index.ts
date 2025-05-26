export interface User {
  id: string;
  email: string;
  name: string;
  height: number;
  weight: number;
  goalType: 'bodybuilder' | 'maintain' | 'cut' | 'bulk';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  weakPoints: string[];
  favoriteFoods: string[];
  allergies: string[];
  targetDate: Date;
}

export interface WorkoutPlan {
  id: string;
  userId: string;
  type: string;
  exercises: Exercise[];
  split: string;
  restTimes: string;
  optimalTimes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restTime: string;
  videoUrl?: string;
  instructions: string;
}

export interface NutritionPlan {
  dailyCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
  };
  mealPlan: {
    [key: string]: {
      breakfast: Meal;
      lunch: Meal;
      dinner: Meal;
      snacks: Meal[];
    };
  };
  hydration: {
    dailyWater: string;
    timing: string;
  };
  supplements: Array<{
    name: string;
    timing: string;
    dosage: string;
  }>;
}

export interface Meal {
  id: string;
  name: string;
  time: string;
  foods: Food[];
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
  };
}

export interface Food {
  id: string;
  name: string;
  servingSize: string;
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
  };
}

export interface FoodAlternative {
  originalFood: Food;
  alternatives: Food[];
}

export interface Progress {
  id: string;
  userId: string;
  date: Date;
  weight: number;
  bodyFat?: number;
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    arms?: number;
    thighs?: number;
  };
  notes?: string;
} 