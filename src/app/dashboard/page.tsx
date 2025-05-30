'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useStore } from '@/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowRight, 
  Dumbbell, 
  Apple, 
  Target, 
  Loader2, 
  RefreshCw, 
  CheckCircle2,
  Plus,
  TrendingUp,
  Calendar,
  Clock,
  Scale,
  ChevronRight,
  Edit,
  X
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'
import { format } from 'date-fns'
import { tips } from '@/lib/tips'

import { isValidWorkoutPlan, isValidNutritionPlan } from '@/lib/validators'
import type { DailyMealPlan, WeeklyMealPlan } from '@/types/plan-types'

// Helper function to convert kg to pounds
const kgToLbs = (kg: number): number => {
  return Math.round(kg * 2.20462 * 10) / 10; // Round to 1 decimal place
}

export default function DashboardPage() {
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)
  
  const {
    profile,
    workoutPlan,
    nutritionPlan,
    workoutProgress,
    nutritionProgress,
    weightProgress,
  } = useStore()

  const { toast } = useToast()
  const generatePlans = useStore(state => state.generatePlans)
  const updateCurrentWeight = useStore(state => state.updateCurrentWeight)
  const updateWeightProgress = useStore(state => state.updateWeightProgress)
  const resetProgress = useStore(state => state.resetProgress)

  const [isLoadingPlans, setIsLoadingPlans] = useState(false)
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [newWeight, setNewWeight] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  const [isSubmittingWeight, setIsSubmittingWeight] = useState(false)
  const [todaysTip, setTodaysTip] = useState('')

  // Hydration guard
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Select a random tip each day
  useEffect(() => {
    const categories = Object.keys(tips)
    const randomCategory = categories[Math.floor(Math.random() * categories.length)]
    const categoryTips = tips[randomCategory].tips
    const randomTip = categoryTips[Math.floor(Math.random() * categoryTips.length)]
    setTodaysTip(randomTip)
  }, [])

  // Show loading state during hydration
  if (!isHydrated) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const handleGeneratePlans = async () => {
    console.log("🚀 Dashboard: Generate plans button clicked");
    console.log("🔍 Current state:", {
      hasProfile: !!profile,
      profileOnboarding: profile?.hasCompletedOnboarding,
      hasWorkoutPlan: !!workoutPlan,
      hasNutritionPlan: !!nutritionPlan
    });
    
    setIsLoadingPlans(true);
    try {
      await generatePlans();
      
      // Verify plans were generated
      const finalWorkoutPlan = useStore.getState().workoutPlan;
      const finalNutritionPlan = useStore.getState().nutritionPlan;
      
      console.log("✅ Dashboard: Plans generated:", {
        workoutPlanGenerated: !!(finalWorkoutPlan && Array.isArray(finalWorkoutPlan.multiWeekSchedules)),
        nutritionPlanGenerated: !!(finalNutritionPlan && Array.isArray(finalNutritionPlan.multiWeekMealPlans))
      });
      
      toast({
        title: "Plans Refreshed",
        description: "Your workout and nutrition plans have been updated.",
      });
    } catch (error) {
      console.error("❌ Dashboard: Failed to generate plans:", error);
      toast({
        title: "Error Generating Plans",
        description: error instanceof Error ? error.message : "Could not refresh your plans. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const handleWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight || isNaN(Number(newWeight))) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid weight.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingWeight(true);
    try {
      const weight = Number(newWeight);
      // Update store
      updateCurrentWeight(weight);
      await updateWeightProgress(weight);
      setNewWeight('');
      setIsWeightModalOpen(false);
      toast({
        title: "Weight Updated",
        description: "Your weight has been logged successfully.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update weight",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingWeight(false);
    }
  };

  const handleResetProgress = async () => {
    setIsResetting(true);
    try {
      const success = await resetProgress();
      if (success) {
        toast({
          title: "Progress Reset",
          description: "Your progress has been reset. You'll be redirected to onboarding.",
        });
        // Redirect to onboarding
        if (typeof window !== 'undefined') {
          window.location.href = '/onboarding';
        }
      } else {
        toast({
          title: "Reset Failed",
          description: "There was an error resetting your progress.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: error instanceof Error ? error.message : "Failed to reset your progress",
        variant: "destructive"
      });
    } finally {
      setIsResetting(false);
      setIsResetModalOpen(false);
    }
  };

  // --- NEW MULTI-WEEK SELECTORS ---
  const workoutWeekIdx = workoutPlan?.currentWeekIndex ?? 0;
  const nutritionWeekIdx = nutritionPlan?.currentWeekIndex ?? 0;

  // Added Array.isArray checks for safer access
  const currentWorkoutWeek = Array.isArray(workoutProgress?.weeklySchedule) && 
                            workoutProgress.weeklySchedule.length > workoutWeekIdx &&
                            Array.isArray(workoutProgress.weeklySchedule[workoutWeekIdx]) 
    ? workoutProgress.weeklySchedule[workoutWeekIdx] 
    : [];
    
  const currentNutritionWeek = Array.isArray(nutritionProgress?.weeklyMealProgress) && 
                              nutritionProgress.weeklyMealProgress.length > nutritionWeekIdx &&
                              Array.isArray(nutritionProgress.weeklyMealProgress[nutritionWeekIdx]) 
    ? nutritionProgress.weeklyMealProgress[nutritionWeekIdx] 
    : [];

  // Weight progress for the current week
  let currentWeekWeightStart = null;
  let currentWeekWeightEnd = null;
  let weeklyWeightChange = null;
  if (weightProgress?.dates && weightProgress?.weights && weightProgress.dates.length > 0) {
    // Find all weights for the current week (assume 7 days per week, most recent week is last 7 entries)
    const weekStartIdx = Math.max(0, weightProgress.dates.length - 7 * (workoutWeekIdx + 1));
    const weekEndIdx = weightProgress.dates.length - 7 * workoutWeekIdx - 1;
    if (weekStartIdx <= weekEndIdx && weekEndIdx < weightProgress.weights.length) {
      currentWeekWeightStart = weightProgress.weights[weekStartIdx];
      currentWeekWeightEnd = weightProgress.weights[weekEndIdx];
      weeklyWeightChange = currentWeekWeightEnd - currentWeekWeightStart;
    }
  }

  // --- WORKOUTS COMPLETED ---
  const totalWorkoutsThisWeek = Array.isArray(currentWorkoutWeek)
    ? currentWorkoutWeek.filter(day => !day.isRestDay && day.workoutDetails).length
    : 0;
  const completedWorkoutsThisWeek = Array.isArray(currentWorkoutWeek)
    ? currentWorkoutWeek.filter(day => !day.isRestDay && day.workoutDetails?.completed).length
    : 0;

  // --- MEALS LOGGED ---
  const totalMealsThisWeek = Array.isArray(currentNutritionWeek)
    ? currentNutritionWeek.reduce((sum, day) => sum + (Array.isArray(day.meals) ? day.meals.length : 0), 0)
    : 0;
  const completedMealsThisWeek = Array.isArray(currentNutritionWeek)
    ? currentNutritionWeek.reduce((sum, day) => sum + (Array.isArray(day.meals) ? day.meals.filter(m => m.completed).length : 0), 0)
    : 0;

  // --- CALORIES & MACROS ---
  const weeklyNutritionTotals = Array.isArray(currentNutritionWeek)
    ? currentNutritionWeek.reduce(
        (totals, day) => {
          if (Array.isArray(day.meals)) {
            day.meals.forEach(meal => {
              if (meal.completed) {
                const weekPlan = nutritionPlan?.multiWeekMealPlans?.[nutritionWeekIdx];
                const dayKey = day.dayOfWeek.toLowerCase();
                
                // Type-safe access to day plan
                let dayPlan: DailyMealPlan | undefined;
                if (weekPlan && dayKey in weekPlan) {
                  dayPlan = weekPlan[dayKey as keyof WeeklyMealPlan];
                }
                
                const orig = dayPlan?.meals?.find(m => m.name === meal.name && m.mealType === meal.mealType);
                if (orig) {
                  totals.calories += orig.calories;
                  totals.protein += orig.protein;
                  totals.carbs += orig.carbs;
                  totals.fats += orig.fats;
                }
              }
            });
          }
          return totals;
        },
        { calories: 0, protein: 0, carbs: 0, fats: 0 }
      )
    : { calories: 0, protein: 0, carbs: 0, fats: 0 };
  const weeklyTarget = nutritionPlan ? {
    calories: (nutritionPlan.dailyTargets.calories || 0) * 7,
    protein: (nutritionPlan.dailyTargets.proteinGrams || 0) * 7,
    carbs: (nutritionPlan.dailyTargets.carbGrams || 0) * 7,
    fats: (nutritionPlan.dailyTargets.fatGrams || 0) * 7,
  } : { calories: 0, protein: 0, carbs: 0, fats: 0 };

  // --- LOADING/ERROR STATES ---
  const loading = sessionStatus === 'loading' || !profile;
  const workoutPlanValid = workoutPlan && isValidWorkoutPlan(workoutPlan);
  const nutritionPlanValid = nutritionPlan && isValidNutritionPlan(nutritionPlan);
  const workoutProgressValid = workoutProgress && Array.isArray(workoutProgress.weeklySchedule);
  const nutritionProgressValid = nutritionProgress && Array.isArray(nutritionProgress.weeklyMealProgress);

  // Validate plans and show appropriate UI
  const hasValidWorkoutPlan = workoutPlan && 
                              Array.isArray(workoutPlan.multiWeekSchedules) && 
                              workoutPlan.multiWeekSchedules.length > 0

  const hasValidNutritionPlan = nutritionPlan && 
                                Array.isArray(nutritionPlan.multiWeekMealPlans) && 
                                nutritionPlan.multiWeekMealPlans.length > 0

  console.log("🔍 Dashboard validation state:", {
    sessionStatus,
    hasProfile: !!profile,
    profileOnboarding: profile?.hasCompletedOnboarding,
    hasValidWorkoutPlan,
    hasValidNutritionPlan,
    workoutPlanExists: !!workoutPlan,
    nutritionPlanExists: !!nutritionPlan,
    workoutProgressExists: !!workoutProgress,
    nutritionProgressExists: !!nutritionProgress
  });

  // --- UI ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (sessionStatus === 'unauthenticated') {
    return <div className="p-6 text-center">Please sign in to access the dashboard.</div>;
  }

  if (!profile?.hasCompletedOnboarding) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] space-y-4 p-6 text-center">
        <Target size={48} className="text-primary mb-4" />
        <h2 className="text-2xl font-bold text-foreground">Welcome to Your Fitness Journey!</h2>
        <p className="text-muted-foreground max-w-md">
          It looks like you haven&rsquo;t completed your onboarding yet. Please set up your profile to generate personalized workout and nutrition plans.
        </p>
        <Button asChild size="lg" className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href="/onboarding">Complete Onboarding</Link>
        </Button>
      </div>
    );
  }
  
  const showWorkoutSkeletons = isLoadingPlans || (profile?.hasCompletedOnboarding && !workoutProgress && sessionStatus === 'authenticated');
  const showNutritionSkeletons = isLoadingPlans || (profile?.hasCompletedOnboarding && !nutritionProgress && sessionStatus === 'authenticated');

  const calculateProgress = (current?: number, target?: number) => {
    if (target === undefined || current === undefined || target <= 0) return 0;
    return Math.min(Math.max(0, Math.round((current / target) * 100)), 100);
  }

  const formatGoalType = (type?: string) => {
    if (!type) return 'N/A';
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  // Get today's day for workout and nutrition
  const today = format(new Date(), 'EEEE');
  const todaysWorkout = workoutProgress?.weeklySchedule?.[workoutProgress.currentWeekIndex ?? 0]?.find(day => 
    day?.dayOfWeek && day.dayOfWeek.toLowerCase() === today.toLowerCase()
  );
  
  // For nutrition tracking
  const getTodaysCalories = () => {
    if (!nutritionProgress || !Array.isArray(nutritionProgress.weeklyMealProgress)) 
      return { eaten: 0, target: 0 };
    
    let eatenCalories = 0;
    
    // Make sure we're accessing the correct week index
    const currentWeekIndex = nutritionProgress.currentWeekIndex ?? 0;
    const currentWeek = nutritionProgress.weeklyMealProgress[currentWeekIndex];
    
    if (!Array.isArray(currentWeek)) {
      return { eaten: 0, target: nutritionPlan?.dailyTargets?.calories || 0 };
    }
    
    const todayScheduleItem = currentWeek.find(day => 
      day?.dayOfWeek && day.dayOfWeek.toLowerCase() === today.toLowerCase()
    );
    
    if (todayScheduleItem && Array.isArray(todayScheduleItem.meals)) {
      todayScheduleItem.meals.forEach(meal => {
        if (meal?.completed && typeof meal.originalCalories === 'number') {
          eatenCalories += meal.originalCalories;
        }
      });
    }
    
    return { 
      eaten: eatenCalories,
      target: nutritionPlan?.dailyTargets?.calories || 0 // Use nutritionPlan for target
    };
  }
  
  // Get weekly stats
  const getWeeklyStats = () => {
    if (!workoutProgress || !Array.isArray(workoutProgress.weeklySchedule) || 
        !nutritionProgress || !Array.isArray(nutritionProgress.weeklyMealProgress)) 
      return { workoutsCompleted: 0, workoutsTotal: 0, mealsLogged: 0, mealsTotal: 0, avgCalories: 0 };
    
    let mealsLogged = 0;
    let mealsTotal = 0;
    let totalCaloriesSum = 0;
    let daysWithMeals = 0;
    
    // Make sure we're accessing the correct week index
    const currentNutritionWeek = nutritionProgress.weeklyMealProgress[nutritionProgress.currentWeekIndex ?? 0];
    
    if (Array.isArray(currentNutritionWeek)) {
      currentNutritionWeek.forEach(dayProgressItem => {
        if (!dayProgressItem) return;
        
        const meals = dayProgressItem.meals;
        if (Array.isArray(meals) && meals.length > 0) {
          daysWithMeals++;
          meals.forEach(meal => {
            if (meal) { // Ensure meal object exists
              mealsTotal++;
              if (meal.completed) {
                mealsLogged++;
              }
              if (typeof meal.originalCalories === 'number') {
                totalCaloriesSum += meal.originalCalories;
              }
            }
          });
        }
      });
    }
    
    const avgCalories = daysWithMeals > 0 ? Math.round(totalCaloriesSum / daysWithMeals) : 0;
    
    return {
      workoutsCompleted: workoutProgress.completedWorkouts || 0,
      workoutsTotal: workoutProgress.totalWorkouts || 0,
      mealsLogged,
      mealsTotal,
      avgCalories
    };
  }

  const calorieInfo = getTodaysCalories();
  const weeklyStats = getWeeklyStats();

  // Calculate adherence score (percentage of workouts and meals completed)
  const adherenceScore = Math.round(
    ((weeklyStats.workoutsCompleted / Math.max(1, weeklyStats.workoutsTotal)) * 0.5 +
    (weeklyStats.mealsLogged / Math.max(1, weeklyStats.mealsTotal)) * 0.5) * 100
  );

  // Get weight progress data
  const weightData = weightProgress ? {
    current: profile?.currentWeight ? kgToLbs(profile.currentWeight) : 0,
    target: profile?.targetWeight ? kgToLbs(profile.targetWeight) : 0,
    history: weightProgress.weights.map(w => kgToLbs(w))
  } : {
    current: profile?.currentWeight ? kgToLbs(profile.currentWeight) : 0,
    target: profile?.targetWeight ? kgToLbs(profile.targetWeight) : 0,
    history: []
  };

  return (
    <div className="space-y-6 p-2 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome Back, {profile?.name || 'User'}!</h1>
          <p className="text-muted-foreground">Here&apos;s your fitness snapshot for {format(new Date(), 'EEEE, MMMM d')}</p>
        </div>
      </div>

      {/* Daily Snapshot Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Nutrition Plan Card */}
        {nutritionPlan && isValidNutritionPlan(nutritionPlan) ? (
          <div>
          <Card className="rounded-2xl shadow-md h-full">
            <CardHeader>
              <CardTitle className="text-xl text-foreground flex items-center">
                <Apple className="w-5 h-5 mr-2 text-primary" />
                Calories & Macros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Daily Progress</span>
                  <span className="text-sm font-medium">
                    {calorieInfo.eaten} / {calorieInfo.target} kcal
                  </span>
                </div>
                <Progress 
                  value={calculateProgress(calorieInfo.eaten, calorieInfo.target)} 
                  className="h-2 bg-primary/20 [&>div]:bg-primary"
                />
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-muted/30 p-2 rounded-md text-center">
                    <p className="text-xs text-muted-foreground">Protein</p>
                    <p className="font-medium">{nutritionPlan.dailyTargets?.proteinGrams || 0}g</p>
                  </div>
                  <div className="bg-muted/30 p-2 rounded-md text-center">
                    <p className="text-xs text-muted-foreground">Carbs</p>
                    <p className="font-medium">{nutritionPlan.dailyTargets?.carbGrams || 0}g</p>
                  </div>
                  <div className="bg-muted/30 p-2 rounded-md text-center">
                    <p className="text-xs text-muted-foreground">Fats</p>
                    <p className="font-medium">{nutritionPlan.dailyTargets?.fatGrams || 0}g</p>
                  </div>
                </div>

                <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Link href="/nutrition">
                    Log Meal <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          </div>
        ) : (
          <Card className="rounded-2xl shadow-md h-full">
            <CardHeader>
              <CardTitle className="text-xl text-foreground">Nutrition Plan Issue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">There seems to be an issue with your nutrition plan.</p>
              <Button onClick={handleGeneratePlans} disabled={isLoadingPlans}>
                {isLoadingPlans ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Regenerate Plan
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Workout Plan Card */}
        {hasValidWorkoutPlan ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-2xl shadow-md h-full">
              <CardHeader>
                <CardTitle className="text-xl text-foreground flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-primary" />
                  Today&apos;s Workout
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todaysWorkout ? (
                    <>
                      <div className="flex items-center justify-between">
                                                 <h3 className="font-semibold text-lg text-foreground">{todaysWorkout.workoutDetails?.workoutName}</h3>
                         <span className={`px-2 py-1 rounded text-xs font-medium ${
                           todaysWorkout.workoutDetails?.completed 
                             ? "bg-green-100 text-green-800" 
                             : "bg-gray-100 text-gray-800"
                         }`}>
                           {todaysWorkout.workoutDetails?.completed ? "Completed" : "Pending"}
                         </span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          <strong>Warm-up:</strong> {todaysWorkout.workoutDetails?.warmUp}
                        </p>
                        <div className="space-y-1">
                                                     <p className="text-sm font-medium text-foreground">Exercises:</p>
                          {todaysWorkout.workoutDetails?.exercises?.slice(0, 3).map((exercise: any, index: number) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{exercise.name}</span>
                              <span className="text-muted-foreground">{exercise.sets} × {exercise.reps}</span>
                            </div>
                          ))}
                          {(todaysWorkout.workoutDetails?.exercises?.length || 0) > 3 && (
                            <p className="text-xs text-muted-foreground">
                              +{(todaysWorkout.workoutDetails?.exercises?.length || 0) - 3} more exercises
                            </p>
                          )}
                        </div>
                        <Button 
                          onClick={() => router.push('/dashboard/workouts')} 
                          className="w-full mt-4"
                          variant={todaysWorkout.workoutDetails?.completed ? "outline" : "default"}
                        >
                          {todaysWorkout.workoutDetails?.completed ? "View Workout" : "Start Workout"}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-4">
                      <p className="text-muted-foreground mb-2">No workout scheduled</p>
                      {!profile?.hasCompletedOnboarding ? (
                        <Button onClick={handleGeneratePlans} variant="outline" size="sm" disabled={isLoadingPlans}>
                          {isLoadingPlans ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                          )}
                          Generate Plan
                        </Button>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          To generate a new plan, use Reset Progress in Quick Actions below.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="rounded-2xl shadow-md h-full">
            <CardHeader>
              <CardTitle className="text-xl text-foreground">Workout Plan Issue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {!workoutPlan ? "No workout plan found." : "Your workout plan appears to be invalid."}
              </p>
              <Button onClick={handleGeneratePlans} disabled={isLoadingPlans}>
                {isLoadingPlans ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                {!workoutPlan ? "Generate Plan" : "Regenerate Plan"}
              </Button>
            </CardContent>
          </Card>
        )}

        <div>
          <Card className="rounded-2xl shadow-md h-full">
            <CardHeader>
              <CardTitle className="text-xl text-foreground flex items-center">
                <Scale className="w-5 h-5 mr-2 text-primary" />
                Weight Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-3xl font-bold flex items-center">
                      {weightData.current} 
                      <span className="text-primary text-sm ml-1">→</span> 
                      <span className="text-primary ml-1">{weightData.target}</span> 
                      <span className="text-sm ml-1">lbs</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Math.abs(weightData.current - weightData.target).toFixed(1)} lbs to go
                    </p>
                  </div>
                </div>

                <Progress 
                  value={calculateProgress(
                    Math.abs(weightData.target - (weightData.history.length > 0 ? weightData.history[0] : weightData.current)), 
                    Math.abs(weightData.target - weightData.current)
                  )} 
                  className="h-2 bg-primary/20 [&>div]:bg-primary"
                />
                
                {Array.isArray(weightData.history) && weightData.history.length > 1 && (
                  <div className="flex items-center text-sm">
                    <TrendingUp className="w-4 h-4 mr-1 text-primary" />
                    <span>
                      {(weightData.history[weightData.history.length - 1] - weightData.history[0]).toFixed(1)} lbs change
                    </span>
                  </div>
                )}

                <Button 
                  onClick={() => setIsWeightModalOpen(true)}
                  className="w-full"
                >
                  Log Today&apos;s Weight
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Weekly Overview */}
      <div>
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="text-xl text-foreground flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-primary" />
              Weekly Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-xs text-muted-foreground">Workouts Completed</p>
                <p className="text-2xl font-bold">{weeklyStats.workoutsCompleted} <span className="text-sm font-normal text-muted-foreground">/ {weeklyStats.workoutsTotal}</span></p>
              </div>
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-xs text-muted-foreground">Meals Logged</p>
                <p className="text-2xl font-bold">{weeklyStats.mealsLogged} <span className="text-sm font-normal text-muted-foreground">/ {weeklyStats.mealsTotal}</span></p>
              </div>
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-xs text-muted-foreground">Avg Daily Calories</p>
                <p className="text-2xl font-bold">{weeklyStats.avgCalories} <span className="text-sm font-normal text-muted-foreground">kcal</span></p>
              </div>
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-xs text-muted-foreground">Adherence Score</p>
                <p className="text-2xl font-bold">{adherenceScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="text-xl text-foreground">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                onClick={() => setIsWeightModalOpen(true)}
              >
                <Scale className="h-5 w-5 text-primary" />
                <span className="text-xs">Log Weight</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                asChild
              >
                <Link href="/nutrition">
                  <Apple className="h-5 w-5 text-primary" />
                  <span className="text-xs">Log Meal</span>
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                asChild
              >
                <Link href="/workouts">
                  <Dumbbell className="h-5 w-5 text-primary" />
                  <span className="text-xs">Log Workout</span>
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                asChild
              >
                <Link href="/goals">
                  <Target className="h-5 w-5 text-primary" />
                  <span className="text-xs">Update Goals</span>
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                onClick={() => setIsResetModalOpen(true)}
              >
                <RefreshCw className="h-5 w-5 text-primary" />
                <span className="text-xs">Reset Progress</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tip of the Day */}
      <div>
        <Card className="rounded-2xl shadow-md bg-primary/5">
          <CardHeader>
            <CardTitle className="text-xl text-foreground">Tip of the Day</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{todaysTip}</p>
            <div className="mt-4 flex justify-end">
              <Button 
                variant="link" 
                className="p-0 h-auto text-primary text-sm"
                asChild
              >
                <Link href="/tips">
                  View All Tips <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reset Progress Modal */}
      <Dialog open={isResetModalOpen} onOpenChange={setIsResetModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset Progress</DialogTitle>
            <DialogDescription>
              Are you sure you want to reset everything and restart onboarding? This will clear all your progress data and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This will reset:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
              <li>Weight history</li>
              <li>Nutrition plan</li>
              <li>Workout plan</li>
              <li>All logs and progress</li>
            </ul>
          </div>
            
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsResetModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button"
              variant="destructive"
              onClick={handleResetProgress}
              disabled={isResetting}
            >
              {isResetting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Reset All Progress
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Weight Modal */}
      <Dialog open={isWeightModalOpen} onOpenChange={setIsWeightModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Log Today&rsquo;s Weight</DialogTitle>
            <DialogDescription>
              Enter your current weight to track your progress.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleWeightSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="weight" className="text-right">
                  Weight
                </Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    placeholder="Enter weight"
                    className="col-span-2"
                  />
                  <span>lbs</span>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsWeightModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmittingWeight || !newWeight}
              >
                {isSubmittingWeight ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 