import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createStaticNutritionPlan, mealLibrary, StaticMealDataItem, MealLibrary } from '@/data/meals'
import { createStaticWorkoutPlan, workoutLibrary, StaticWorkoutDay, WorkoutLibrary as StaticWorkoutLibType } from '@/data/workouts'
import type { 
  Profile,
  WorkoutPlan, 
  NutritionPlan, 
  WeeklyWorkoutScheduleItem, 
  MealItem, 
  DailyMealPlan,
  WeeklyMealPlan,
  WorkoutExercise,
  WorkoutDetails,
} from '@/types/plan-types'

interface Exercise {
  name: string
  sets: number
  reps: string
  weight: string
  rest: string
  equipment: string
  muscleGroup: string
  caloriesPerSet: number
  difficulty: string
  image: string
  instructions: string
  completed: boolean
  snacks: Meal[]
}

interface Workout {
  name: string
  type: string
  exercises: Exercise[]
  totalCalories: number
  completed: boolean
}

interface Ingredient {
  name: string
  amount: string
  calories: number
  protein: number
  carbs: number
  fats: number
}

interface Meal {
  name: string
  ingredients: Ingredient[]
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFats: number
  prepTime: string
  instructions: string
  completed: boolean
}

interface DailyMeals {
  breakfast: Meal
  lunch: Meal
  dinner: Meal
  snacks: Meal[]
}

export interface ExerciseProgress extends WorkoutExercise {
  completed: boolean;
}

export interface WorkoutDetailsProgress extends WorkoutDetails {
  exercises: ExerciseProgress[];
  completed?: boolean;
}

export interface DailyWorkoutProgressItem extends Omit<WeeklyWorkoutScheduleItem, 'workoutDetails'> {
  workoutDetails: WorkoutDetailsProgress | null;
}

interface MealProgress extends MealItem {
  completed: boolean;
}

interface DailyNutritionProgressMealPlan {
  meals: MealProgress[];
  dailyTotalCalories: number;
  dailyTotalProtein: number;
  dailyTotalCarbs: number;
  dailyTotalFats: number;
}

interface DailyNutritionProgressItem {
  dayOfWeek: string;
  meals: ({ mealType: string; name: string; completed: boolean; originalCalories?: number })[];
  dailyTotalCaloriesLogged: number;
  dailyTotalProteinLogged: number;
  dailyTotalCarbsLogged: number;
  dailyTotalFatsLogged: number;
}

interface WorkoutProgress {
  weeklySchedule: DailyWorkoutProgressItem[][];
  totalWorkouts: number;
  completedWorkouts: number;
  currentWeekIndex: number;
}

interface NutritionProgress {
  weeklyMealProgress: DailyNutritionProgressItem[][];
  currentWeekIndex: number;
}

interface WeightProgress {
  dates: string[]
  weights: number[]
  goal: number
}

export interface ProfileStatsUpdateData {
  name?: string;
  currentWeight?: number;
  targetWeight?: number;
  height?: number;
  goalType?: 'weight_loss' | 'muscle_gain' | 'general_fitness' | 'strength_gain';
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  preferredWorkoutDays?: string[];
  age?: number;
  sex?: 'male' | 'female';
}

interface Store {
  profile: Profile | null
  workoutPlan: WorkoutPlan | null
  nutritionPlan: NutritionPlan | null

  workoutProgress: WorkoutProgress | null
  nutritionProgress: NutritionProgress | null
  weightProgress: WeightProgress | null
  
  // Internal state flags to prevent race conditions
  isGeneratingPlans: boolean
  isResetting: boolean

  // Current viewed week index for navigation
  currentViewedWeekIndex: number
  setCurrentViewedWeekIndex: (index: number) => void

  setProfile: (data: Profile) => void
  setWorkoutPlan: (plan: WorkoutPlan | null) => void
  setNutritionPlan: (plan: NutritionPlan | null) => void
  resetStore: () => void
  generatePlans: (profile?: Profile | null, preferences?: { nutrition?: any, workout?: any }) => Promise<void>
  toggleExerciseCompletion: (dayOfWeek: string, exerciseName: string, exerciseIndex?: number) => void
  toggleMealCompletion: (dayOfWeek: string, mealType: string, mealIdentifier: string | number) => void
  initializeProgressFromPlans: (workoutPlanData?: WorkoutPlan | null, nutritionPlanData?: NutritionPlan | null) => void
  updateProfileStats: (data: ProfileStatsUpdateData) => Promise<{ success: boolean; plansRegenerated?: boolean; error?: string }>
  initializeWeightProgress: (targetWeight: number) => void
  updateCurrentWeight: (weight: number) => void
  updateWeightProgress: (weight: number) => Promise<void>
  resetProgress: () => Promise<boolean>
  generateNextWorkoutWeek: () => Promise<void>
  generateNextNutritionWeek: () => Promise<void>
}

// Helper function to get a random item from an array, ensuring it's different from a list of excluded names if possible
const getRandomItem = <T extends { name: string }>(library: T[], excludeNames: string[] = []): T => {
  let availableItems = library.filter(item => !excludeNames.includes(item.name));
  if (availableItems.length === 0) {
    // If all items are excluded (or library is small), fall back to any item
    availableItems = library;
  }
  if (availableItems.length === 0) { // Should not happen if library is not empty
    throw new Error("Library is empty or all items excluded with no fallback.");
  }
  const randomIndex = Math.floor(Math.random() * availableItems.length);
  return JSON.parse(JSON.stringify(availableItems[randomIndex])); // Deep copy
};

// Helper to generate a new single week of meals, ensuring variety from existing meals if possible
// This simplified version just generates a random week. True variety requires more complex logic.
const generateNewWeeklyMealPlanData = (existingPlan?: NutritionPlan): WeeklyMealPlan => {
  const days: (keyof WeeklyMealPlan)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const newWeekData: Partial<WeeklyMealPlan> = {};

  // Simple function to get random meals for a day
  // For true variety, this would need to be more intelligent, e.g. ensuring meals differ from previous weeks.
  const generateDailyMeals = (): DailyMealPlan => {
    const breakfast = getRandomItem(mealLibrary.breakfast);
    const lunch = getRandomItem(mealLibrary.lunch);
    const dinner = getRandomItem(mealLibrary.dinner);
    // Ensure two different snacks if possible
    const snack1 = getRandomItem(mealLibrary.snacks);
    let snack2: StaticMealDataItem;
    if (mealLibrary.snacks.length > 1) {
      snack2 = getRandomItem(mealLibrary.snacks, [snack1.name]);
    } else {
      snack2 = getRandomItem(mealLibrary.snacks); // Fallback if only one snack type
    }
    
    const allMeals: MealItem[] = [breakfast, lunch, dinner, snack1, snack2].map(m => ({
        ...m, 
        ingredients: m.ingredients.map(ing => ({...ing, item: ing.item, qty: ing.qty})), // Ensure ingredients are mapped correctly
        completed: false,
    }));

    return {
      meals: allMeals,
      dailyTotalCalories: allMeals.reduce((sum, meal) => sum + meal.calories, 0),
      dailyTotalProtein: allMeals.reduce((sum, meal) => sum + meal.protein, 0),
      dailyTotalCarbs: allMeals.reduce((sum, meal) => sum + meal.carbs, 0),
      dailyTotalFats: allMeals.reduce((sum, meal) => sum + meal.fats, 0),
    };
  };

  days.forEach(day => {
    newWeekData[day] = generateDailyMeals();
  });
  return newWeekData as WeeklyMealPlan;
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      profile: null,
      workoutPlan: null,
      nutritionPlan: null,
      workoutProgress: null,
      nutritionProgress: null,
      weightProgress: null,
      isGeneratingPlans: false,
      isResetting: false,
      currentViewedWeekIndex: 0,

      setProfile: (data) => set({ profile: data }),
      setWorkoutPlan: (plan) => {
        console.log("🏋️ WORKOUT PLAN GENERATED:", {
          planExists: !!plan,
          planName: plan?.planName,
          multiWeekSchedulesExists: !!plan?.multiWeekSchedules,
          multiWeekSchedulesIsArray: Array.isArray(plan?.multiWeekSchedules),
          multiWeekSchedulesLength: plan?.multiWeekSchedules?.length,
          firstWeekExists: !!plan?.multiWeekSchedules?.[0],
          firstWeekIsArray: Array.isArray(plan?.multiWeekSchedules?.[0]),
          firstWeekLength: Array.isArray(plan?.multiWeekSchedules?.[0]) ? plan.multiWeekSchedules[0].length : 'not array'
        });

        // Basic validation
        if (!plan) {
          console.error("❌ Null workout plan provided to setWorkoutPlan");
          return;
        }
        
        let validPlan = plan;
        
        // Handle old format conversion only if needed
        if (!Array.isArray(plan.multiWeekSchedules) && Array.isArray((plan as any).weeklySchedule)) {
          console.log("🔄 Converting old workout plan format to new format");
          validPlan = {
            ...plan,
            multiWeekSchedules: [(plan as any).weeklySchedule],
            currentWeekIndex: 0
          };
        }
        
        // Only regenerate if the plan is completely invalid
        if (!Array.isArray(validPlan.multiWeekSchedules) || validPlan.multiWeekSchedules.length === 0) {
          console.error("❌ Invalid workout plan structure, regenerating");
          validPlan = createStaticWorkoutPlan();
          console.log("✅ Emergency workout plan created:", {
            planName: validPlan.planName,
            weeksCount: validPlan.multiWeekSchedules?.length,
            firstWeekDaysCount: validPlan.multiWeekSchedules?.[0]?.length
          });
        }
        
        // Set the current viewed week index to match the plan's current week
        const newCurrentWeekIndex = validPlan.currentWeekIndex || 0;
        
        console.log("✅ Setting workout plan in Zustand:", {
          planName: validPlan.planName,
          currentWeekIndex: newCurrentWeekIndex,
          totalWeeks: validPlan.multiWeekSchedules?.length
        });
        
        set({ 
          workoutPlan: validPlan,
          currentViewedWeekIndex: newCurrentWeekIndex
        });
        
        // Initialize progress after setting the plan
        get().initializeProgressFromPlans(validPlan, get().nutritionPlan);
      },
      setNutritionPlan: (plan) => {
        console.log("🍎 NUTRITION PLAN GENERATED:", {
          planExists: !!plan,
          planName: plan?.planName,
          multiWeekMealPlansExists: !!plan?.multiWeekMealPlans,
          multiWeekMealPlansIsArray: Array.isArray(plan?.multiWeekMealPlans),
          multiWeekMealPlansLength: plan?.multiWeekMealPlans?.length,
          firstWeekExists: !!plan?.multiWeekMealPlans?.[0],
          dailyTargets: plan?.dailyTargets
        });

        // ✅ Plans are static.
        // 🤖 AI is only used to suggest substitutions or macro tweaks after plan generation.
        // ❌ AI does not create or replace full plans.
        
        // Defensive: validate plan structure before setting
        let validPlan = plan;
        
        try {
          // Check if plan is valid overall (has multiWeekMealPlans or older weeklyMealPlan format)
          if (!plan || 
              (!Array.isArray(plan.multiWeekMealPlans) && !(plan as any).weeklyMealPlan)) {
            console.error("❌ Invalid nutrition plan format detected in setNutritionPlan. Regenerating a valid plan.");
            const currentProfile = get().profile;
            const prefs = currentProfile ? { 
              goalType: currentProfile.goalType,
              currentWeight: currentProfile.currentWeight,
              height: currentProfile.height,
              age: currentProfile.age,
              sex: currentProfile.sex,
            } : undefined;
            validPlan = createStaticNutritionPlan(prefs);
            console.log("✅ Emergency nutrition plan created:", {
              planName: validPlan.planName,
              weeksCount: validPlan.multiWeekMealPlans?.length
            });
          }
          
          // Handle transition from old plan format (weeklyMealPlan) to new format (multiWeekMealPlans)
          if (validPlan && !Array.isArray(validPlan.multiWeekMealPlans) && (validPlan as any).weeklyMealPlan) {
            console.log("🔄 Converting old nutrition plan format to new format");
            validPlan = {
              ...validPlan,
              multiWeekMealPlans: [(validPlan as any).weeklyMealPlan],
              currentWeekIndex: 0
            };
          }
          
          // Ensure multiWeekMealPlans is always an array
          if (validPlan && !Array.isArray(validPlan.multiWeekMealPlans)) {
            console.warn("⚠️ multiWeekMealPlans is not an array, fixing");
            validPlan = {
              ...validPlan,
              multiWeekMealPlans: [],
            };
          }
          
          // Ensure each week in multiWeekMealPlans is a valid structure
          if (validPlan && Array.isArray(validPlan.multiWeekMealPlans)) {
            const requiredDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            const validWeeks = validPlan.multiWeekMealPlans.map((week, weekIndex) => {
              if (!week || typeof week !== 'object' || week === null) {
                console.error(`❌ Invalid week ${weekIndex} format in nutrition plan (null or not an object)`, week);
                // Generate a default week structure
                const currentProfile = get().profile;
                const prefs = currentProfile ? { 
                  goalType: currentProfile.goalType,
                  currentWeight: currentProfile.currentWeight,
                } : undefined;
                return createStaticNutritionPlan(prefs).multiWeekMealPlans[0];
              }
              
              // Check all days exist
              if (!requiredDays.every(day => 
                  (week as any)[day] && 
                  typeof (week as any)[day] === 'object' && 
                  Array.isArray((week as any)[day].meals)
              )) {
                console.error(`❌ Invalid week ${weekIndex} format in nutrition plan (missing days or invalid day structure)`, week);
                // Generate a default week structure
                const currentProfile = get().profile;
                const prefs = currentProfile ? { 
                  goalType: currentProfile.goalType,
                  currentWeight: currentProfile.currentWeight,
                } : undefined;
                return createStaticNutritionPlan(prefs).multiWeekMealPlans[0];
              }
              
              // Verify each day has meals
              let needsReplacement = false;
              requiredDays.forEach(day => {
                if (!(week as any)[day] || !Array.isArray((week as any)[day].meals) || (week as any)[day].meals.length === 0) {
                  console.error(`❌ Day ${day} has no meals in nutrition plan week ${weekIndex}`, (week as any)[day]);
                  needsReplacement = true;
                }
              });
              
              if (needsReplacement) {
                console.error(`❌ Week ${weekIndex} needs replacement due to invalid day structure`);
                const currentProfile = get().profile;
                const prefs = currentProfile ? { 
                  goalType: currentProfile.goalType,
                  currentWeight: currentProfile.currentWeight,
                } : undefined;
                return createStaticNutritionPlan(prefs).multiWeekMealPlans[0];
              }
              
              return week;
            });
            
            validPlan = {
              ...validPlan,
              multiWeekMealPlans: validWeeks
            };
          }
          
          // Ensure at least one week exists
          if (validPlan && (!Array.isArray(validPlan.multiWeekMealPlans) || validPlan.multiWeekMealPlans.length === 0)) {
            console.error("❌ No weeks in multiWeekMealPlans after validation");
            const currentProfile = get().profile;
            const newPlan = createStaticNutritionPlan(currentProfile ? {
              goalType: currentProfile.goalType,
              currentWeight: currentProfile.currentWeight,
            } : undefined);
            validPlan = newPlan;
            console.log("✅ Created new nutrition plan with weeks:", validPlan.multiWeekMealPlans?.length);
          }
          
          // Validate currentWeekIndex
          if (validPlan && (
              typeof validPlan.currentWeekIndex !== 'number' || 
              validPlan.currentWeekIndex < 0 || 
              (Array.isArray(validPlan.multiWeekMealPlans) && validPlan.currentWeekIndex >= validPlan.multiWeekMealPlans.length)
          )) {
            console.warn("⚠️ Invalid currentWeekIndex, setting to 0");
            validPlan = {
              ...validPlan,
              currentWeekIndex: 0
            };
          }
          
          // Final validation before setting
          if (!validPlan || 
              !Array.isArray(validPlan.multiWeekMealPlans) || 
              validPlan.multiWeekMealPlans.length === 0) {
            console.error("❌ Final validation failed, using emergency plan");
            validPlan = createStaticNutritionPlan(); // Use default static plan as last resort
          }
          
          console.log("✅ Setting nutrition plan in Zustand:", {
            planName: validPlan.planName,
            currentWeekIndex: validPlan.currentWeekIndex,
            totalWeeks: validPlan.multiWeekMealPlans?.length,
            dailyTargets: validPlan.dailyTargets
          });
          
          set({ nutritionPlan: validPlan });
          
          // Initialize progress with the validated plan
          get().initializeProgressFromPlans(get().workoutPlan, validPlan);
        } catch (error) {
          console.error("❌ Error in setNutritionPlan:", error);
          // Final emergency fallback
          const emergencyPlan = createStaticNutritionPlan();
          console.log("🚨 Using emergency nutrition plan:", emergencyPlan.planName);
          set({ nutritionPlan: emergencyPlan });
          get().initializeProgressFromPlans(get().workoutPlan, emergencyPlan);
        }
      },
      resetStore: () => set({ 
        profile: null, 
        workoutPlan: null, 
        nutritionPlan: null,
        workoutProgress: null,
        nutritionProgress: null,
        weightProgress: null
      }),

      // ✅ Plans are static
      // 🤖 AI is only used to suggest substitutions or macro tweaks after plan generation
      // ❌ AI does not create or replace full plans
      generatePlans: async (profileData, preferences) => {
        console.log("🚀 GENERATE PLANS CALLED:", {
          profileProvided: !!profileData,
          preferencesProvided: !!preferences,
          currentProfile: !!get().profile,
          isGenerating: get().isGeneratingPlans
        });

        // Prevent concurrent calls that could corrupt state
        if (get().isGeneratingPlans) {
          console.warn("⚠️ Plan generation already in progress, skipping");
          return;
        }

        set({ isGeneratingPlans: true });

        try {
          const currentProfile = get().profile;
          const effectiveProfile = profileData || currentProfile;

          console.log("🔄 Using profile for plan generation:", {
            hasProfile: !!effectiveProfile,
            hasCompletedOnboarding: effectiveProfile?.hasCompletedOnboarding,
            goalType: effectiveProfile?.goalType,
            experienceLevel: effectiveProfile?.experienceLevel
          });

          if (!effectiveProfile) {
            console.error("❌ No profile available for plan generation");
            throw new Error("Profile is required for plan generation");
          }

          // Create a safe profile with defaults for missing fields
          const safeProfile = {
            id: effectiveProfile.id || '',
            name: effectiveProfile.name || '',
            email: effectiveProfile.email || '',
            age: effectiveProfile.age || 25,
            height: effectiveProfile.height || 70,
            currentWeight: effectiveProfile.currentWeight || 150,
            targetWeight: effectiveProfile.targetWeight || 140,
            goalType: effectiveProfile.goalType || 'general_fitness',
            experienceLevel: effectiveProfile.experienceLevel || 'beginner',
            preferredWorkoutDays: effectiveProfile.preferredWorkoutDays || ['monday', 'wednesday', 'friday'],
            sex: effectiveProfile.sex || 'male',
            hasCompletedOnboarding: effectiveProfile.hasCompletedOnboarding || false,
          };

          console.log("✅ Safe profile created for plan generation:", {
            goalType: safeProfile.goalType,
            experienceLevel: safeProfile.experienceLevel,
            preferredWorkoutDays: safeProfile.preferredWorkoutDays?.length
          });

          const workoutPrefs = {
            workoutSplit: preferences?.workout?.workoutSplit || 
                          (safeProfile.experienceLevel === 'beginner' ? 'FullBody' : 'PPL'),
            goalType: safeProfile.goalType,
            experienceLevel: safeProfile.experienceLevel,
            preferredDays: safeProfile.preferredWorkoutDays
          };

          const nutritionPrefs = {
            goalType: safeProfile.goalType,
            currentWeight: safeProfile.currentWeight,
            height: safeProfile.height,
            age: safeProfile.age,
            sex: safeProfile.sex,
          };

          console.log("🔄 Generating plans with preferences:", {
            workoutPrefs,
            nutritionPrefs
          });

          // Generate plans synchronously from static data - no API calls
          const newNutritionPlanData = createStaticNutritionPlan(nutritionPrefs);
          const newWorkoutPlanData = createStaticWorkoutPlan(workoutPrefs);

          console.log("✅ Static plans generated:", {
            workoutPlan: {
              exists: !!newWorkoutPlanData,
              planName: newWorkoutPlanData?.planName,
              weeksCount: newWorkoutPlanData?.multiWeekSchedules?.length
            },
            nutritionPlan: {
              exists: !!newNutritionPlanData,
              planName: newNutritionPlanData?.planName,
              weeksCount: newNutritionPlanData?.multiWeekMealPlans?.length
            }
          });

          // Ensure plans are in the correct multi-week structure
          let finalNutritionPlan: NutritionPlan;
          let finalWorkoutPlan: WorkoutPlan;

          // Handle nutrition plan structure
          if (newNutritionPlanData && Array.isArray(newNutritionPlanData.multiWeekMealPlans)) {
            finalNutritionPlan = {
              ...newNutritionPlanData,
              currentWeekIndex: 0,
            };
            console.log("✅ Nutrition plan structure validated");
          } else {
            console.error("❌ Invalid nutrition plan structure, using emergency fallback");
            finalNutritionPlan = createStaticNutritionPlan(); // Emergency fallback
          }

          // Handle workout plan structure
          if (newWorkoutPlanData && Array.isArray(newWorkoutPlanData.multiWeekSchedules)) {
            finalWorkoutPlan = {
              ...newWorkoutPlanData,
              currentWeekIndex: 0,
            };
            console.log("✅ Workout plan structure validated");
          } else {
            console.error("❌ Invalid workout plan structure, using emergency fallback");
            finalWorkoutPlan = createStaticWorkoutPlan(); // Emergency fallback
          }
          
          console.log("🔄 Setting plans using validated setters...");
          
          // Set the plans using the validated setters
          get().setWorkoutPlan(finalWorkoutPlan);
          get().setNutritionPlan(finalNutritionPlan);
          
          console.log("✅ Plans set successfully in Zustand store");
          
          // If we created a default profile, set it too
          if (!currentProfile && effectiveProfile) {
            console.log("🔄 Setting profile in store");
            set({ profile: effectiveProfile });
          }
          
        } catch (error) {
          console.error("❌ Error generating plans:", error);
          
          // Emergency fallback - create minimal valid plans
          try {
            console.log("🚨 Creating emergency fallback plans...");
            const emergencyWorkout = createStaticWorkoutPlan();
            const emergencyNutrition = createStaticNutritionPlan();
            
            console.log("✅ Emergency plans created:", {
              workout: emergencyWorkout.planName,
              nutrition: emergencyNutrition.planName
            });
            
            get().setWorkoutPlan(emergencyWorkout);
            get().setNutritionPlan(emergencyNutrition);
            
          } catch (fallbackError) {
            console.error("🚨 Emergency fallback failed:", fallbackError);
          }
        } finally {
          set({ isGeneratingPlans: false });
          console.log("✅ Plan generation completed");
        }
      },

      toggleExerciseCompletion: (dayOfWeek, exerciseIdentifier, exerciseIndex) => {
        const currentWPlan = get().workoutPlan;
        const currentWProgress = get().workoutProgress;
        
        console.log('🔄 Store: toggleExerciseCompletion called with:', { dayOfWeek, exerciseIdentifier, exerciseIndex });
        
        if (!currentWPlan || !currentWProgress || currentWPlan.currentWeekIndex === undefined) {
          console.log('❌ Store: Missing workout plan or progress data');
          return;
        }

        const weekIdx = currentWPlan.currentWeekIndex;

        // Ensure progress structure exists for the current week
        if (!currentWProgress.weeklySchedule[weekIdx]) {
            console.log('❌ Store: No progress data for week', weekIdx);
            return;
        }
        
        const updatedWeeklyScheduleProgress = currentWProgress.weeklySchedule.map((weekProgress, wIdx) => {
            if (wIdx === weekIdx) {
                return weekProgress.map(dayItemProg => {
                    if (dayItemProg.dayOfWeek === dayOfWeek && dayItemProg.workoutDetails && dayItemProg.workoutDetails.exercises) {
                        const updatedExercises = dayItemProg.workoutDetails.exercises.map((ex, exIdx) => {
                            // Use exerciseIndex as the primary identifier, fallback to name matching
                            if ((exerciseIndex !== undefined && exIdx === exerciseIndex) || (ex.name === exerciseIdentifier)) {
                                console.log('✅ Store: Toggling exercise completion:', ex.name, 'from', ex.completed, 'to', !ex.completed);
                                return { ...ex, completed: !ex.completed };
                            }
                            return ex;
                        });
                        
                        // Recalculate if workoutDetails itself is completed
                        const allExercisesCompleted = updatedExercises.every(ex => ex.completed);
                        
                        return { 
                            ...dayItemProg, 
                            workoutDetails: { 
                                ...dayItemProg.workoutDetails, 
                                exercises: updatedExercises,
                                completed: allExercisesCompleted
                            } 
                        };
                    }
                    return dayItemProg;
                });
            }
            return weekProgress;
        });

        // Recalculate completed workouts for the current week
        let completedWorkoutsThisWeek = 0;
        if (updatedWeeklyScheduleProgress[weekIdx]) {
            updatedWeeklyScheduleProgress[weekIdx].forEach(dayProg => {
                if (dayProg.workoutDetails?.completed) {
                    completedWorkoutsThisWeek++;
                }
            });
        }

        set({ 
            workoutProgress: { 
                ...currentWProgress, 
                weeklySchedule: updatedWeeklyScheduleProgress,
            } 
        });
        
        // Reinitialize progress to recalculate overall stats
        get().initializeProgressFromPlans(get().workoutPlan, get().nutritionPlan);
      },

      toggleMealCompletion: (dayOfWeek, mealTypeToToggle, mealIdentifier) => {
        const currentNPlan = get().nutritionPlan;
        const currentNProgress = get().nutritionProgress;

        console.log('🔄 Store: toggleMealCompletion called with:', { dayOfWeek, mealTypeToToggle, mealIdentifier });

        if (!currentNPlan || !currentNProgress || currentNPlan.currentWeekIndex === undefined) {
          console.log('❌ Store: Missing plan or progress data');
          return;
        }
        
        const weekIdx = currentNPlan.currentWeekIndex;

        if (!currentNProgress.weeklyMealProgress[weekIdx]) {
            console.log('❌ Store: No progress data for week', weekIdx);
            return;
        }

        const updatedWeeklyMealProgress = currentNProgress.weeklyMealProgress.map((weekMealsProg, wIdx) => {
            if (wIdx === weekIdx) {
                return weekMealsProg.map(dayProg => {
                    if (dayProg.dayOfWeek === dayOfWeek && dayProg.meals) {
                        const updatedMeals = dayProg.meals.map((meal, mealIndex) => {
                             // For snacks, mealIdentifier is the snack index (number)
                             // For other meals (breakfast, lunch, dinner), mealIdentifier is the meal name (string)
                             const isTargetMeal = mealTypeToToggle === 'snacks' 
                                ? (meal.mealType === 'snacks' && mealIndex === mealIdentifier)
                                : (meal.name === mealIdentifier && meal.mealType === mealTypeToToggle);

                            if (isTargetMeal) {
                                console.log('✅ Store: Toggling meal completion:', meal.name, 'from', meal.completed, 'to', !meal.completed);
                                return { ...meal, completed: !meal.completed };
                            }
                            return meal;
                        });
                        
                        // Recalculate logged calories/macros for the day
                        let loggedCalories = 0;
                        let loggedProtein = 0;
                        let loggedCarbs = 0;
                        let loggedFats = 0;
                        
                        const currentDayPlan = currentNPlan.multiWeekMealPlans[weekIdx]?.[dayOfWeek.toLowerCase() as keyof WeeklyMealPlan];

                        updatedMeals.forEach(progMeal => {
                            if (progMeal.completed && currentDayPlan) {
                                const originalMeal = currentDayPlan.meals.find(m => m.name === progMeal.name && m.mealType === progMeal.mealType);
                                if (originalMeal) {
                                    loggedCalories += originalMeal.calories;
                                    loggedProtein += originalMeal.protein;
                                    loggedCarbs += originalMeal.carbs;
                                    loggedFats += originalMeal.fats;
                                }
                            }
                        });

                        return { 
                            ...dayProg, 
                            meals: updatedMeals,
                            dailyTotalCaloriesLogged: loggedCalories,
                            dailyTotalProteinLogged: loggedProtein,
                            dailyTotalCarbsLogged: loggedCarbs,
                            dailyTotalFatsLogged: loggedFats,
                        };
                    }
                    return dayProg;
                });
            }
            return weekMealsProg;
        });
        
        set({ 
            nutritionProgress: { 
                ...currentNProgress, 
                weeklyMealProgress: updatedWeeklyMealProgress,
            }
        });
      },

      // ✅ Plans are static
      // 🤖 AI is only used to suggest substitutions or macro tweaks after plan generation
      // ❌ AI does not create or replace full plans
      initializeProgressFromPlans: (workoutPlanData, nutritionPlanData) => {
        const currentWPlan = workoutPlanData || get().workoutPlan;
        const currentNPlan = nutritionPlanData || get().nutritionPlan;
        const profile = get().profile;

        let newWorkoutProgress: WorkoutProgress | null = null;
        if (currentWPlan && Array.isArray(currentWPlan.multiWeekSchedules) && currentWPlan.multiWeekSchedules.length > 0) {
            const wpWeekIndex = currentWPlan.currentWeekIndex || 0;
            const weeklyScheduleProgress: DailyWorkoutProgressItem[][] = currentWPlan.multiWeekSchedules.map(weekSchedule => {
                // Validate weekSchedule is an array
                if (!Array.isArray(weekSchedule)) {
                    console.error("Invalid week schedule format in workout plan", weekSchedule);
                    // Return an empty array as fallback if week schedule is invalid
                    return [];
                }
                
                return weekSchedule.map(dayPlan => ({
                    dayOfWeek: dayPlan.dayOfWeek,
                    isRestDay: dayPlan.isRestDay,
                    workoutDetails: dayPlan.isRestDay || !dayPlan.workoutDetails ? null : {
                        ...dayPlan.workoutDetails,
                        exercises: Array.isArray(dayPlan.workoutDetails.exercises) 
                            ? dayPlan.workoutDetails.exercises.map(ex => ({ ...ex, completed: ex.completed || false }))
                            : [], // Provide empty array if exercises is not an array
                        completed: Array.isArray(dayPlan.workoutDetails.exercises) 
                            ? dayPlan.workoutDetails.exercises.every(ex => ex.completed || false)
                            : false, // Initial check
                    }
                }));
            });
            
            // Calculate total and completed workouts based on ALL weeks up to current.
            // This might need to be more nuanced if user can go back to previous weeks.
            // For now, assumes progress is linear.
            let totalCompleted = 0;
            let totalPossible = 0;
            currentWPlan.multiWeekSchedules.forEach((week, weekIdx) => {
                week.forEach(day => {
                    if(!day.isRestDay) totalPossible++;
                });
                if(weeklyScheduleProgress[weekIdx]){
                    weeklyScheduleProgress[weekIdx].forEach(dayProg => {
                        if (dayProg.workoutDetails?.completed) {
                            totalCompleted++;
                        }
                    });
                }
            });


            newWorkoutProgress = {
                weeklySchedule: weeklyScheduleProgress,
                totalWorkouts: totalPossible, // This should be based on actual plan definition for all weeks
                completedWorkouts: totalCompleted, // Sum of all completed workouts across all weeks
                currentWeekIndex: wpWeekIndex,
            };
        }

        let newNutritionProgress: NutritionProgress | null = null;
        
        // Early guard - validate nutrition plan structure
        if (!currentNPlan || !currentNPlan.multiWeekMealPlans || !Array.isArray(currentNPlan.multiWeekMealPlans)) {
            // We'll return null NutritionProgress, which will preserve any existing progress
        } else {
            const npWeekIndex = currentNPlan.currentWeekIndex || 0;
            
            // Create weekly meal progress data with strict validation
            const weeklyMealProgressData: DailyNutritionProgressItem[][] = Array.isArray(currentNPlan.multiWeekMealPlans)
                ? currentNPlan.multiWeekMealPlans.map(weeklyPlan => {
                    // Validate weeklyPlan is a proper object before using Object.entries
                    if (!weeklyPlan || typeof weeklyPlan !== 'object' || weeklyPlan === null) {
                        return []; // Return empty array for this week
                    }
                    
                    try {
                        return Object.entries(weeklyPlan).map(([dayKey, dailyPlan]) => {
                            // Validate dailyPlan and its meals array
                            if (!dailyPlan || !Array.isArray(dailyPlan.meals)) {
                                return {
                                    dayOfWeek: dayKey.charAt(0).toUpperCase() + dayKey.slice(1),
                                    meals: [],
                                    dailyTotalCaloriesLogged: 0,
                                    dailyTotalProteinLogged: 0,
                                    dailyTotalCarbsLogged: 0,
                                    dailyTotalFatsLogged: 0,
                                };
                            }
                            
                            // Process meals with validation
                            const mealsProgress = Array.isArray(dailyPlan.meals)
                                ? dailyPlan.meals.map((meal: any) => {
                                    if (!meal || typeof meal !== 'object') {
                                        return {
                                            mealType: "Unknown",
                                            name: "Unknown",
                                            completed: false,
                                            originalCalories: 0
                                        };
                                    }
                                    return {
                                        mealType: meal.mealType || "Unknown",
                                        name: meal.name || "Unknown",
                                        completed: meal.completed || false,
                                        originalCalories: meal.calories || 0
                                    };
                                })
                                : [];
                            
                            // Calculate initial logged values with validation
                            let loggedCalories = 0;
                            let loggedProtein = 0;
                            let loggedCarbs = 0;
                            let loggedFats = 0;

                            if (Array.isArray(mealsProgress)) {
                                mealsProgress.forEach(progMeal => {
                                    if (progMeal.completed && Array.isArray(dailyPlan.meals)) {
                                        const originalMeal = dailyPlan.meals.find((m: any) => 
                                            m && m.name === progMeal.name && m.mealType === progMeal.mealType
                                        );
                                        if (originalMeal) {
                                            loggedCalories += originalMeal.calories || 0;
                                            loggedProtein += originalMeal.protein || 0;
                                            loggedCarbs += originalMeal.carbs || 0;
                                            loggedFats += originalMeal.fats || 0;
                                        }
                                    }
                                });
                            }

                            return {
                                dayOfWeek: dayKey.charAt(0).toUpperCase() + dayKey.slice(1),
                                meals: mealsProgress,
                                dailyTotalCaloriesLogged: loggedCalories,
                                dailyTotalProteinLogged: loggedProtein,
                                dailyTotalCarbsLogged: loggedCarbs,
                                dailyTotalFatsLogged: loggedFats,
                            };
                        });
                    } catch (error) {
                        console.error("Error processing weekly plan:", error);
                        return []; // Return empty array for this week if any error occurs
                    }
                })
                : [];
            
            // Only create new progress if we have valid data
            if (Array.isArray(weeklyMealProgressData) && weeklyMealProgressData.length > 0) {
                newNutritionProgress = {
                    weeklyMealProgress: weeklyMealProgressData,
                    currentWeekIndex: npWeekIndex,
                };
            }
        }
        
        const oldWorkoutProgress = get().workoutProgress;
        const oldNutritionProgress = get().nutritionProgress;

        set(state => ({
            workoutProgress: newWorkoutProgress ? { ...oldWorkoutProgress, ...newWorkoutProgress } : oldWorkoutProgress,
            nutritionProgress: newNutritionProgress ? { ...oldNutritionProgress, ...newNutritionProgress } : oldNutritionProgress,
        }));

      },

      updateWeightProgress: async (weight) => {
        const { weightProgress, profile } = get()
        
        if (!weightProgress && profile) {
          set({
            weightProgress: {
              dates: [new Date().toISOString().split('T')[0]],
              weights: [weight],
              goal: profile.targetWeight || 0
            }
          })
          return
        }
        
        if (!weightProgress) return

        const today = new Date().toISOString().split('T')[0]
        const dates = [...weightProgress.dates, today]
        const weights = [...weightProgress.weights, weight]

        set({
          weightProgress: {
            ...weightProgress,
            dates,
            weights
          }
        })
      },

      resetProgress: async () => {
        // Prevent concurrent resets that could corrupt state
        if (get().isResetting) {
          return false;
        }
        
        set({ isResetting: true });
        
        try {
          const currentProfile = get().profile;
          if (!currentProfile) {
            console.error("Profile not found, cannot reset progress and regenerate plans.");
            return false;
          }
          
          // Regenerate plans which will also re-initialize progress
          await get().generatePlans(currentProfile); 
          // generatePlans now initializes progress itself with currentWeekIndex 0 for both
          
          // Double-check that progress was properly initialized
          const workoutPlan = get().workoutPlan;
          const workoutProgress = get().workoutProgress;
          
          if (workoutPlan && (!workoutProgress || !Array.isArray(workoutProgress.weeklySchedule))) {
            // Force re-initialization of progress
            get().initializeProgressFromPlans(workoutPlan, get().nutritionPlan);
          }
          
          // Reset weight progress specifically
          if (get().weightProgress && currentProfile.targetWeight) {
              get().initializeWeightProgress(currentProfile.targetWeight);
          }
  
          return true;
        } catch (error) {
          console.error("Error resetting progress:", error);
          return false;
        } finally {
          set({ isResetting: false });
        }
      },

      updateProfileStats: async (data) => {
        const currentProfile = get().profile;
        const updatedProfile = { ...(currentProfile || {}), ...data } as Profile;
        set({ profile: updatedProfile });

        if (data.goalType || data.experienceLevel) {
          await get().generatePlans(updatedProfile);
          return { success: true, plansRegenerated: true };
        }
        return { success: true, plansRegenerated: false };
      },

      initializeWeightProgress: (targetWeight) => {
        set({ weightProgress: { dates: [], weights: [], goal: targetWeight } });
      },
      
      updateCurrentWeight: (weight) => {
        set(state => {
          const updatedProfile = state.profile ? { ...state.profile, currentWeight: weight } : null;
          
          let newWeightProgress = state.weightProgress;
          if (!newWeightProgress) {
            // Initialize if null, goal can be taken from profile or a sensible default
            const goal = state.profile?.targetWeight || weight + 10; // Default goal if not set
            newWeightProgress = { 
              dates: [new Date().toISOString().split('T')[0]], 
              weights: [weight], 
              goal: goal 
            };
          } else if (state.weightProgress) {
            newWeightProgress = {
              ...state.weightProgress,
              dates: [...state.weightProgress.dates, new Date().toISOString().split('T')[0]],
              weights: [...state.weightProgress.weights, weight],
              goal: state.weightProgress.goal || weight + 10
            };
          }
          
          return {
            profile: updatedProfile,
            weightProgress: newWeightProgress,
          };
        });
      },

      generateNextWorkoutWeek: async () => {
        const currentWPlan = get().workoutPlan;
        const currentProfile = get().profile;
        const currentWProgress = get().workoutProgress;

        if (!currentWPlan || !currentProfile || !currentWProgress) {
          console.error("Cannot generate next workout week: missing plan, profile, or progress.");
          return;
        }

        // Use preferences from the existing plan for consistency
        const newWeekScheduleItems = createStaticWorkoutPlan((currentWPlan as any).preferences);
        
        const updatedMultiWeekSchedules = [...currentWPlan.multiWeekSchedules, newWeekScheduleItems.multiWeekSchedules[0]];
        const newCurrentWeekIndex = currentWPlan.currentWeekIndex + 1;

        // Create new progress scaffold for the new week
        const newWeekProgressScaffold: DailyWorkoutProgressItem[] = newWeekScheduleItems.multiWeekSchedules[0].map((dayPlan: any) => ({
            dayOfWeek: dayPlan.dayOfWeek,
            isRestDay: dayPlan.isRestDay,
            workoutDetails: dayPlan.isRestDay || !dayPlan.workoutDetails ? null : {
                ...dayPlan.workoutDetails,
                exercises: dayPlan.workoutDetails.exercises.map((ex: any) => ({ ...ex, completed: false })),
                completed: false,
            }
        }));
        const updatedProgressSchedule = [...currentWProgress.weeklySchedule, newWeekProgressScaffold];
        
        // Recalculate total workouts
        let totalPossible = 0;
        updatedMultiWeekSchedules.forEach(week => {
            week.forEach(day => {
                if(!day.isRestDay) totalPossible++;
            });
        });

        set({
          workoutPlan: {
            ...currentWPlan,
            multiWeekSchedules: updatedMultiWeekSchedules,
            currentWeekIndex: newCurrentWeekIndex,
            // totalWorkouts might need to be updated if it's part of WorkoutPlan and not WorkoutProgress
            // For now, assuming WorkoutPlan.totalWorkouts from createStaticWorkoutPlan is for a single week
            // and overall total is managed in WorkoutProgress.
          },
          workoutProgress: {
            ...currentWProgress,
            weeklySchedule: updatedProgressSchedule,
            currentWeekIndex: newCurrentWeekIndex,
            totalWorkouts: totalPossible, // Update total workouts count
            // completedWorkouts remains the same until new workouts are completed
          }
        });
      },

      generateNextNutritionWeek: async () => {
        const currentNPlan = get().nutritionPlan;
        const currentProfile = get().profile; // May need for preferences if generateNewWeeklyMealPlanData evolves
        const currentNProgress = get().nutritionProgress;


        if (!currentNPlan || !currentProfile || !currentNProgress) {
          console.error("Cannot generate next nutrition week: missing plan, profile, or progress.");
          return;
        }

        // Generate new weekly meal plan, ideally ensuring variety from previous weeks.
        // For now, generateNewWeeklyMealPlanData creates a random new week.
        // It should use currentNPlan.dailyTargets to maintain consistency.
        const newWeeklyMealData = generateNewWeeklyMealPlanData(currentNPlan); // Pass current plan for reference if needed
        
        const updatedMultiWeekMealPlans = [...currentNPlan.multiWeekMealPlans, newWeeklyMealData];
        const newCurrentWeekIndex = currentNPlan.currentWeekIndex + 1;

        // Create new progress scaffold for the new nutrition week
        const newNutritionWeekProgressScaffold: DailyNutritionProgressItem[] = 
            Object.entries(newWeeklyMealData).map(([dayKey, dailyPlan]) => ({
                dayOfWeek: dayKey.charAt(0).toUpperCase() + dayKey.slice(1),
                meals: dailyPlan.meals.map((meal: any) => ({ 
                    mealType: meal.mealType, 
                    name: meal.name, 
                    completed: false,
                    originalCalories: meal.calories
                })),
                dailyTotalCaloriesLogged: 0,
                dailyTotalProteinLogged: 0,
                dailyTotalCarbsLogged: 0,
                dailyTotalFatsLogged: 0,
            }));
        
        const updatedProgressWeeklyData = [...currentNProgress.weeklyMealProgress, newNutritionWeekProgressScaffold];

        set({
          nutritionPlan: {
            ...currentNPlan,
            multiWeekMealPlans: updatedMultiWeekMealPlans,
            currentWeekIndex: newCurrentWeekIndex,
          },
          nutritionProgress: {
            ...currentNProgress,
            weeklyMealProgress: updatedProgressWeeklyData,
            currentWeekIndex: newCurrentWeekIndex,
          }
        });
      },

      setCurrentViewedWeekIndex: (index) => {
        set({ currentViewedWeekIndex: index });
      },
    }),
    {
      name: 'beanbuilt-ai-store',
      partialize: (state) => ({
        profile: state.profile,
        workoutPlan: state.workoutPlan,
        nutritionPlan: state.nutritionPlan,
        workoutProgress: state.workoutProgress,
        nutritionProgress: state.nutritionProgress,
        weightProgress: state.weightProgress,
      }),
    }
  )
) 