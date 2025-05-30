export interface Profile {
  id: string;
  name: string;
  email: string;
  age: number;
  height: number; // in inches
  currentWeight: number; // in lbs
  targetWeight: number; // in lbs
  goalType: 'weight_loss' | 'muscle_gain' | 'general_fitness' | 'strength_gain';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  preferredWorkoutDays: string[];
  sex: 'male' | 'female';
  hasCompletedOnboarding: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WorkoutExercise {
  name: string;
  sets: number | string;
  reps: string;
  rest: string;
  notes: string;
  equipment?: string;
  muscleGroup?: string;
  completed?: boolean;
}

export interface WorkoutDetails {
  workoutName: string;
  warmUp: string;
  exercises: WorkoutExercise[];
  coolDown: string;
}

export interface WeeklyWorkoutScheduleItem {
  dayOfWeek: string;
  isRestDay: boolean;
  workoutDetails: WorkoutDetails | null;
}

export interface WorkoutPlanPreferences {
  preferredDays?: string[];
  workoutSplit?: 'PPL' | 'FullBody' | 'UpperLower' | string;
  goalType?: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'strength_gain' | string;
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced' | string;
}

export interface WorkoutPlan {
  planName: string;
  multiWeekSchedules: WeeklyWorkoutScheduleItem[][];
  currentWeekIndex: number;
  preferences: WorkoutPlanPreferences;
  summaryNotes: string;
  completedWorkouts?: number;
  totalWorkouts?: number;
}

export interface NutritionIngredient {
  item: string;
  qty: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
}

export interface MealItem {
  mealType: string;
  name: string;
  ingredients: NutritionIngredient[];
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  instructions?: string;
  completed?: boolean;
}

// Type for meal items with completion status
export type CompletedMealItem = MealItem & { completed: boolean };

// Type for simplified meal progress data stored in nutritionProgress
export interface MealProgress {
  mealType: string;
  name: string;
  completed: boolean;
  originalCalories?: number;
}

export interface DailyMealPlan {
  meals: MealItem[];
  dailyTotalCalories: number;
  dailyTotalProtein: number;
  dailyTotalCarbs: number;
  dailyTotalFats: number;
}

export interface WeeklyMealPlan {
  monday: DailyMealPlan;
  tuesday: DailyMealPlan;
  wednesday: DailyMealPlan;
  thursday: DailyMealPlan;
  friday: DailyMealPlan;
  saturday: DailyMealPlan;
  sunday: DailyMealPlan;
}

export interface NutritionPlanPreferences {
  currentWeight?: number;
  height?: number;
  age?: number;
  sex?: 'male' | 'female' | string;
  goalType?: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'strength_gain' | string;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | string;
  dietaryRestrictions?: string[];
}

export interface NutritionPlan {
  planName: string;
  dailyTargets: {
    calories: number;
    proteinGrams: number;
    carbGrams: number;
    fatGrams: number;
  };
  preferences: NutritionPlanPreferences;
  hydrationRecommendation: string;
  generalTips: string[];
  multiWeekMealPlans: WeeklyMealPlan[];
  currentWeekIndex: number;
} 