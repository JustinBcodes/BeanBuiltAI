'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Loader2, Dumbbell, Apple, LineChart, Target, Ruler } from 'lucide-react'
import { useStore } from '@/store'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Label } from '@/components/ui/label'

export function Dashboard() {
  const {
    profile,
    workoutPlan,
    nutritionPlan,
    workoutProgress,
    nutritionProgress,
    weightProgress,
  } = useStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
          <Button
            onClick={() => setError(null)}
            className="mt-4"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Welcome to BeanBuilt AI</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>Let's get started by setting up your profile.</p>
            <Button asChild>
              <Link href="/profile">Complete Profile</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate weight difference and progress percentage
  const weightDifference = profile.currentWeight ? (profile.currentWeight - (profile.targetWeight || profile.currentWeight)) : 0
  
  // Calculate progress percentage based on how close current weight is to target weight
  // A non-zero initial difference is needed to track progress
  const initialWeightDifference = profile.currentWeight && profile.targetWeight ? Math.abs(profile.currentWeight - profile.targetWeight) : 1
  const currentWeightDifference = weightDifference ? Math.abs(weightDifference) : 0
  const progressPercentage = Math.max(0, Math.min(100, 100 - ((currentWeightDifference / initialWeightDifference) * 100)))

  // Calculate workout progress from the workoutProgress state
  const workoutCompletePercentage = 
    workoutProgress && workoutProgress.totalWorkouts ? 
    (workoutProgress.completedWorkouts / workoutProgress.totalWorkouts) * 100 : 
    0

  // Calculate nutrition progress
  // This now uses the nutritionProgress state instead of directly accessing the plan
  const nutritionCompletePercentage = nutritionProgress && Array.isArray(nutritionProgress.weeklyMealProgress) ? 
    nutritionProgress.weeklyMealProgress.reduce((total, weekData) => {
      if (!Array.isArray(weekData)) return total;
      
      const weekTotal = weekData.reduce((weekSum, day) => {
        if (!day || !Array.isArray(day.meals)) return weekSum;
        
        const mealCount = day.meals.length;
        const completedMeals = day.meals.filter(meal => meal && meal.completed).length;
        
        return weekSum + (mealCount > 0 ? (completedMeals / mealCount) : 0);
      }, 0);
      
      return total + (weekData.length > 0 ? weekTotal / weekData.length : 0);
    }, 0) / nutritionProgress.weeklyMealProgress.length * 100 : 0;

  // Convert cm to feet and inches
  const convertHeight = (cm: number) => {
    if (!cm) return "N/A";
    const totalInches = cm / 2.54
    const feet = Math.floor(totalInches / 12)
    const inches = Math.round(totalInches % 12)
    return `${feet}'${inches}"`
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {profile.name || 'User'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Progress to Goal</Label>
              <div className="flex items-center gap-2">
                <Progress value={progressPercentage || 0} />
                <span className="text-sm text-muted-foreground">
                  {weightDifference ? `${Math.abs(weightDifference).toFixed(1)} lbs to go` : 'Set a weight goal'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Goal Weight</p>
                      <p className="text-2xl font-bold">{profile.targetWeight ? `${profile.targetWeight} lbs` : 'Not set'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Current Weight</p>
                      <p className="text-2xl font-bold">{profile.currentWeight ? `${profile.currentWeight} lbs` : 'Not set'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Ruler className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Height</p>
                      <p className="text-2xl font-bold">{profile.height ? convertHeight(profile.height) : 'Not set'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Workout Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">{Math.round(workoutCompletePercentage)}%</span>
              </div>
              <Progress value={workoutCompletePercentage} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nutrition Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Meal Completion</span>
                <span className="text-sm text-muted-foreground">{Math.round(nutritionCompletePercentage)}%</span>
              </div>
              <Progress value={nutritionCompletePercentage} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h3 className="text-sm font-medium">Workouts Completed</h3>
              <p className="text-2xl font-bold">{workoutProgress?.completedWorkouts || 0}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium">Total Workouts</h3>
              <p className="text-2xl font-bold">{workoutProgress?.totalWorkouts || 0}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium">Daily Water Intake</h3>
              <p className="text-2xl font-bold">
                {nutritionPlan?.hydrationRecommendation 
                  ? `${nutritionPlan.hydrationRecommendation.split(' ')[0]}L` 
                  : '0L'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button asChild>
              <Link href="/workouts">Start Workout</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/nutrition">Log Meal</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/progress">Update Weight</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/tips">View Tips</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 