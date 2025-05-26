'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loading } from '@/components/ui/loading'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal, Loader2 } from 'lucide-react'

// Helper function to calculate workout completion percentage
const calculateWorkoutCompletion = (workoutProgress: any) => {
  if (!workoutProgress || !Array.isArray(workoutProgress.weeklySchedule) || workoutProgress.weeklySchedule.length === 0) {
    return 0;
  }
  
  // Get current week index
  const currentWeekIndex = workoutProgress.currentWeekIndex || 0;
  const currentWeek = workoutProgress.weeklySchedule[currentWeekIndex];
  
  if (!Array.isArray(currentWeek)) {
    return 0;
  }
  
  const workoutDays = currentWeek.filter((day: any) => !day.isRestDay && day.workoutDetails);
  const completedWorkouts = workoutDays.filter((day: any) => day.workoutDetails?.completed).length;
  
  return workoutDays.length > 0 ? Math.round((completedWorkouts / workoutDays.length) * 100) : 0;
};

// Helper function to calculate meal adherence
const calculateMealAdherence = (nutritionProgress: any) => {
  if (!nutritionProgress || !Array.isArray(nutritionProgress.weeklyMealProgress) || nutritionProgress.weeklyMealProgress.length === 0) {
    return [];
  }
  
  // Get current week index
  const currentWeekIndex = nutritionProgress.currentWeekIndex || 0;
  const currentWeek = nutritionProgress.weeklyMealProgress[currentWeekIndex];
  
  if (!Array.isArray(currentWeek)) {
    return [];
  }
  
  return currentWeek.map((dayData: any) => {
    const meals = dayData.meals || [];
    const totalMeals = meals.length;
    const completedMeals = meals.filter((meal: any) => meal && meal.completed).length;
    return {
      name: dayData.dayOfWeek.substring(0, 3),
      adherence: totalMeals > 0 ? Math.round((completedMeals / totalMeals) * 100) : 0,
    };
  });
};

// Helper to convert lbs to kg
const lbsToKg = (lbs: number): number => {
  return lbs / 2.20462;
};

export default function ProgressPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { 
    profile, 
    workoutPlan, 
    nutritionPlan,
    workoutProgress,
    nutritionProgress,
    weightProgress, 
    resetProgress: resetStoreProgress,
    updateCurrentWeight
  } = useStore()
  
  const [isResetting, setIsResetting] = useState(false)
  const [newWeightInputLbs, setNewWeightInputLbs] = useState('')
  const [isSubmittingWeight, setIsSubmittingWeight] = useState(false)

  const handleResetProgress = async () => {
    try {
      setIsResetting(true)
      await resetStoreProgress()
      toast({
        title: "Progress Reset",
        description: "Your progress, plans, and profile onboarding status have been reset.",
      })
      router.push('/onboarding')
    } catch (error) {
      console.error('Error resetting progress:', error)
      toast({
        title: "Error",
        description: "Failed to reset progress. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsResetting(false)
    }
  }

  const handleLogNewWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeightInputLbs || isNaN(Number(newWeightInputLbs)) || Number(newWeightInputLbs) <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid weight in lbs.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingWeight(true);
    try {
      const weightInLbs = Number(newWeightInputLbs);
      const weightInKg = lbsToKg(weightInLbs);
      
      updateCurrentWeight(weightInKg); 
      
      setNewWeightInputLbs('');
      toast({
        title: "Weight Logged",
        description: `Your weight of ${weightInLbs} lbs has been logged successfully.`,
      });
    } catch (error) {
      console.error("Failed to log new weight:", error);
      toast({
        title: "Logging Failed",
        description: error instanceof Error ? error.message : "Could not log your weight. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingWeight(false);
    }
  };

  // Memoized chart data
  const weightChartData = useMemo(() => {
    if (!weightProgress || !weightProgress.dates || !weightProgress.weights) return [];
    return weightProgress.dates.map((date: string, index: number) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: weightProgress.weights[index],
      goal: weightProgress.goal
    }));
  }, [weightProgress]);

  const workoutCompletionPercentage = useMemo(() => {
    if (!workoutProgress) return 0;
    return calculateWorkoutCompletion(workoutProgress);
  }, [workoutProgress]);

  const mealAdherenceData = useMemo(() => {
    if (!nutritionProgress) return [];
    return calculateMealAdherence(nutritionProgress);
  }, [nutritionProgress]);
  
  if (isResetting) {
    return <Loading message="Resetting your progress..." />
  }

  if (!profile?.hasCompletedOnboarding) {
    if (typeof window !== 'undefined') {
      router.push('/onboarding')
    }
    return <Loading message="Redirecting to onboarding..." />;
  }
  
  if (!profile) {
    return <Loading message="Loading profile..." />;
  }
  
  const noWeightData = !weightChartData || weightChartData.length === 0;
  const noWorkoutData = !workoutProgress || !Array.isArray(workoutProgress.weeklySchedule) || workoutProgress.weeklySchedule.length === 0;
  const noNutritionData = !nutritionProgress || !Array.isArray(nutritionProgress.weeklyMealProgress) || nutritionProgress.weeklyMealProgress.length === 0;

  return (
    <div className="space-y-8 p-4 md:p-6 bg-background text-foreground">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Progress Tracking</h1>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Reset All Progress</Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card text-card-foreground">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all your progress data, including workout logs, nutrition logs, and weight history. It will also reset your generated plans and onboarding status. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetProgress} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                Yes, Reset Everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Weight Over Time Chart */}
      <Card className="shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl text-primary">Weight Over Time</CardTitle>
          <CardDescription>Your weight progression towards your goal.</CardDescription>
        </CardHeader>
        <CardContent>
          {noWeightData ? (
             <Alert className="border-primary/50 mb-6">
              <Terminal className="h-4 w-4 text-primary" />
              <AlertTitle className="text-primary">No Weight Data Yet</AlertTitle>
              <AlertDescription>
                Start tracking your weight to see your progress here. Log your current weight below.
              </AlertDescription>
            </Alert>
          ) : (
            <ResponsiveContainer width="100%" height={300} className="mb-6">
              <LineChart data={weightChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" domain={['dataMin - 5', 'dataMax + 5']} unit="kg"/>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    color: 'hsl(var(--foreground))'
                  }}
                  formatter={(value, name) => [`${Number(value).toFixed(1)} kg`, name]}
                />
                <Legend />
                <Line type="monotone" dataKey="weight" stroke="hsl(var(--ring))" strokeWidth={2} activeDot={{ r: 8 }} name="Your Weight (kg)" />
                {weightProgress && weightProgress.goal && typeof weightProgress.goal === 'number' && (
                  <Line type="monotone" dataKey="goal" stroke="hsl(var(--primary))" strokeDasharray="5 5" name="Goal Weight (kg)" />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
          
          <form onSubmit={handleLogNewWeight} className="mt-6 border-t pt-6">
            <h3 className="text-lg font-medium mb-3 text-foreground">Log Your Current Weight</h3>
            <div className="flex flex-col sm:flex-row items-end gap-3">
              <div className="flex-grow space-y-1">
                <Label htmlFor="new-weight-lbs" className="text-muted-foreground">Weight (lbs)</Label>
                <Input
                  id="new-weight-lbs"
                  type="number"
                  step="0.1"
                  value={newWeightInputLbs}
                  onChange={(e) => setNewWeightInputLbs(e.target.value)}
                  placeholder="Enter current weight in lbs"
                  className="bg-input border-border"
                  min="0"
                />
              </div>
              <Button type="submit" disabled={isSubmittingWeight || !newWeightInputLbs} className="w-full sm:w-auto">
                {isSubmittingWeight ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Log Weight
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Workout Completion Chart */}
        <Card className="shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl text-primary">Weekly Workout Completion</CardTitle>
             <CardDescription>Percentage of workouts completed this week.</CardDescription>
          </CardHeader>
          <CardContent>
            {noWorkoutData ? (
              <Alert className="border-primary/50">
                <Terminal className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary">No Workout Data</AlertTitle>
                <AlertDescription>
                  Your workout plan isn't set up or has no workouts. Complete onboarding or generate a plan.
                </AlertDescription>
              </Alert>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[{ name: 'Completed', value: workoutCompletionPercentage }, { name: 'Remaining', value: 100 - workoutCompletionPercentage }]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell key={`cell-0`} fill="hsl(var(--ring))" />
                    <Cell key={`cell-1`} fill="hsl(var(--muted))" />
                  </Pie>
                  <Tooltip  contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)' }}/>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Meal Plan Adherence Chart */}
        <Card className="shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl text-primary">Daily Meal Adherence</CardTitle>
            <CardDescription>Percentage of meals completed each day.</CardDescription>
          </CardHeader>
          <CardContent>
            {noNutritionData || mealAdherenceData.length === 0 ? (
              <Alert className="border-primary/50">
                 <Terminal className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary">No Nutrition Data</AlertTitle>
                <AlertDescription>
                  Your nutrition plan isn't set up or has no meals. Complete onboarding or generate a plan.
                </AlertDescription>
              </Alert>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mealAdherenceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 100]} unit="%" />
                  <Tooltip  contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)' }} />
                  <Legend />
                  <Bar dataKey="adherence" fill="hsl(var(--ring))" name="Meal Adherence" radius={[4, 4, 0, 0]}/>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Placeholder for additional stats or insights */}
      <Card className="shadow-lg rounded-2xl">
        <CardHeader>
            <CardTitle className="text-xl text-primary">Current Stats Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-card-foreground/5 rounded-lg">
                <p className="text-sm text-muted-foreground">Current Weight</p>
                <p className="text-2xl font-bold text-primary">{weightProgress?.weights[weightProgress.weights.length - 1] || 'N/A'} kg</p>
            </div>
            <div className="p-4 bg-card-foreground/5 rounded-lg">
                <p className="text-sm text-muted-foreground">Target Weight</p>
                <p className="text-2xl font-bold">{profile?.targetWeight || 'N/A'} kg</p>
            </div>
            <div className="p-4 bg-card-foreground/5 rounded-lg">
                <p className="text-sm text-muted-foreground">Workouts This Week</p>
                <p className="text-2xl font-bold">{(() => {
                  if (!workoutProgress || !Array.isArray(workoutProgress.weeklySchedule)) return '0 / 0';
                  const currentWeekIndex = workoutProgress.currentWeekIndex || 0;
                  const currentWeek = workoutProgress.weeklySchedule[currentWeekIndex];
                  if (!Array.isArray(currentWeek)) return '0 / 0';
                  const workoutDays = currentWeek.filter((day: any) => !day.isRestDay && day.workoutDetails);
                  const completedWorkouts = workoutDays.filter((day: any) => day.workoutDetails?.completed).length;
                  return `${completedWorkouts} / ${workoutDays.length}`;
                })()}</p>
            </div>
             <div className="p-4 bg-card-foreground/5 rounded-lg">
                <p className="text-sm text-muted-foreground">Daily Calorie Target</p>
                <p className="text-2xl font-bold text-primary">{nutritionPlan?.dailyTargets?.calories || 'N/A'} kcal</p>
            </div>
            <div className="p-4 bg-card-foreground/5 rounded-lg">
                <p className="text-sm text-muted-foreground">Experience Level</p>
                <p className="text-2xl font-bold capitalize">{profile?.experienceLevel || 'N/A'}</p>
            </div>
             <div className="p-4 bg-card-foreground/5 rounded-lg">
                <p className="text-sm text-muted-foreground">Primary Goal</p>
                <p className="text-2xl font-bold capitalize">{profile?.goalType || 'N/A'}</p>
            </div>
        </CardContent>
      </Card>

    </div>
  )
} 