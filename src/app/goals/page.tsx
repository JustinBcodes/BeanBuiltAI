'use client'

import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState, useEffect } from 'react'
import { toast } from '@/components/ui/use-toast'
import { useStore } from '@/store'
import Link from 'next/link'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'

// Helper function to convert kg to pounds
const kgToLbs = (kg: number): number => {
  return Math.round(kg * 2.20462 * 10) / 10; // Round to 1 decimal place
}

// Helper function to convert pounds to kg
const lbsToKg = (lbs: number): number => {
  return Math.round(lbs / 2.20462 * 10) / 10; // Round to 1 decimal place
}

export default function GoalsPage() {
  const { data: session } = useSession()
  const { profile, updateProfileStats, updateWeightProgress, workoutProgress, nutritionProgress, nutritionPlan, weightProgress: loggedWeights } = useStore()

  const [weightGoal, setWeightGoal] = useState({
    start: 180,
    current: 165,
    target: 160
  })
  const currentWeek = workoutProgress?.weeklySchedule?.[workoutProgress.currentWeekIndex ?? 0] ?? []
  const workoutGoal = { current: currentWeek.filter(day => !day.isRestDay && day.workoutDetails?.completed).length, target: currentWeek.filter(day => !day.isRestDay && day.workoutDetails).length }
  const today = format(new Date(), 'EEEE').toLowerCase()
  const mealDay = nutritionProgress?.weeklyMealProgress?.[nutritionProgress.currentWeekIndex ?? 0]?.find(day => day.dayOfWeek.toLowerCase() === today)
  const nutritionGoal = { current: mealDay?.meals.reduce((sum, meal) => sum + (meal.completed ? meal.originalCalories ?? 0 : 0), 0) ?? 0, target: nutritionPlan?.dailyTargets?.calories ?? 0 }
  const [isUpdating, setIsUpdating] = useState(false)

  // Initialize from profile when it's loaded
  useEffect(() => {
    if (profile) {
      setWeightGoal({
        start: kgToLbs(loggedWeights?.weights[0] ?? profile.currentWeight),
        current: kgToLbs(profile.currentWeight),
        target: kgToLbs(profile.targetWeight)
      })
    }
  }, [profile, loggedWeights])

  if (!session) {
    return <div>Please sign in to access this page.</div>
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const calculateProgress = (current: number, target: number) => {
    // Handle edge cases and prevent NaN or Infinity
    if (current === target) return 100
    if (target === 0 || !target) return 0

    // Calculate percentage of progress
    const progress = Math.min(Math.round((current / target) * 100), 100)
    return Math.max(0, progress) // Ensure we don't return negative values
  }

  const handleUpdateWeight = async () => {
    setIsUpdating(true)

    try {
      // Convert lbs values to kg for storage
      const currentWeightKg = lbsToKg(weightGoal.current)
      const targetWeightKg = lbsToKg(weightGoal.target)

      // Update global state and backend via the store
      const result = await updateProfileStats({
        currentWeight: currentWeightKg,
        targetWeight: targetWeightKg
      })

      if (result.success) {
        // Update weight progress to track the change
        await updateWeightProgress(currentWeightKg)

        toast({
          title: "Weight Goal Updated",
          description: "Your weight goals have been updated successfully.",
        })
      } else {
        throw new Error(result.error || "Failed to update weight goal")
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update weight goal",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Calculate weight difference for proper progress display
  const weightDifference = Math.abs(weightGoal.start - weightGoal.target)
  const weightProgress = Math.max(0, weightDifference - Math.abs(weightGoal.current - weightGoal.target))
  const weightProgressPercentage = weightDifference > 0
    ? Math.min(100, (weightProgress / weightDifference) * 100)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Your Goals</h1>
        <p className="text-muted-foreground">Track and manage your fitness goals</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Weight Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current Progress</span>
                <span className="text-sm font-medium">
                  {weightProgressPercentage.toFixed(0)}%
                </span>
              </div>
              <Progress
                value={weightProgressPercentage}
                className="h-2"
              />
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Start Weight (lbs)</Label>
                  <Input
                    type="number"
                    value={weightGoal.start}
                    onChange={(e) => setWeightGoal(prev => ({ ...prev, start: Number(e.target.value) }))}
                    readOnly
                    className="bg-muted/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Current Weight (lbs)</Label>
                  <Input
                    type="number"
                    value={weightGoal.current}
                    onChange={(e) => setWeightGoal(prev => ({ ...prev, current: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target Weight (lbs)</Label>
                  <Input
                    type="number"
                    value={weightGoal.target}
                    onChange={(e) => setWeightGoal(prev => ({ ...prev, target: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <Button
                onClick={handleUpdateWeight}
                className="w-full"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : 'Update Weight Goal'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workout Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Weekly Workouts</span>
                <span className="text-sm font-medium">
                  {workoutGoal.current}/{workoutGoal.target}
                </span>
              </div>
              <Progress
                value={calculateProgress(workoutGoal.current, workoutGoal.target)}
                className="h-2"
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Current Workouts</Label>
                  <Input
                    type="number"
                    value={workoutGoal.current}
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target Workouts</Label>
                  <Input
                    type="number"
                    value={workoutGoal.target}
                    readOnly
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Progress comes from your current workout plan.</p><Button asChild className="w-full"><Link href="/dashboard/workouts">Open workout plan</Link></Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nutrition Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Daily Calories</span>
                <span className="text-sm font-medium">
                  {nutritionGoal.current}/{nutritionGoal.target}
                </span>
              </div>
              <Progress
                value={calculateProgress(nutritionGoal.current, nutritionGoal.target)}
                className="h-2"
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Current Calories</Label>
                  <Input
                    type="number"
                    value={nutritionGoal.current}
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target Calories</Label>
                  <Input
                    type="number"
                    value={nutritionGoal.target}
                    readOnly
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Today&apos;s completed meals and your plan&apos;s daily target.</p><Button asChild className="w-full"><Link href="/nutrition">Open meal plan</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}