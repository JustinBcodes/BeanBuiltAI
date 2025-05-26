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
  const { profile, updateProfileStats, updateCurrentWeight, updateWeightProgress } = useStore()
  
  const [weightGoal, setWeightGoal] = useState({
    start: 180,
    current: 165,
    target: 160
  })
  const [workoutGoal, setWorkoutGoal] = useState({
    current: 4,
    target: 5
  })
  const [nutritionGoal, setNutritionGoal] = useState({
    current: 1800,
    target: 2000
  })
  const [isUpdating, setIsUpdating] = useState(false)

  // Initialize from profile when it's loaded
  useEffect(() => {
    if (profile) {
      setWeightGoal({
        start: kgToLbs(profile.currentWeight), // Use current weight as start weight
        current: kgToLbs(profile.currentWeight),
        target: kgToLbs(profile.targetWeight)
      })
    }
  }, [profile])

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
        // Update weight in the store
        updateCurrentWeight(currentWeightKg)
        
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

  const handleUpdateWorkout = () => {
    // Here you would typically make an API call to update the workout goal
    toast({
      title: "Workout Goal Updated",
      description: "Your workout goal has been updated successfully.",
    })
  }

  const handleUpdateNutrition = () => {
    // Here you would typically make an API call to update the nutrition goal
    toast({
      title: "Nutrition Goal Updated",
      description: "Your nutrition goal has been updated successfully.",
    })
  }

  // Calculate weight difference for proper progress display
  const weightDifference = Math.abs(weightGoal.start - weightGoal.target)
  const weightProgress = Math.abs(weightGoal.start - weightGoal.current)
  const weightProgressPercentage = weightDifference > 0 
    ? Math.min(100, (weightProgress / weightDifference) * 100)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Your Goals</h1>
        <p className="text-gray-500">Track and manage your fitness goals</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Weight Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Current Progress</span>
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
                    className="bg-gray-50"
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
                <span className="text-sm text-gray-500">Weekly Workouts</span>
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
                    onChange={(e) => setWorkoutGoal(prev => ({ ...prev, current: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target Workouts</Label>
                  <Input 
                    type="number" 
                    value={workoutGoal.target}
                    onChange={(e) => setWorkoutGoal(prev => ({ ...prev, target: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <Button onClick={handleUpdateWorkout} className="w-full">Update Workout Goal</Button>
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
                <span className="text-sm text-gray-500">Daily Calories</span>
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
                    onChange={(e) => setNutritionGoal(prev => ({ ...prev, current: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target Calories</Label>
                  <Input 
                    type="number" 
                    value={nutritionGoal.target}
                    onChange={(e) => setNutritionGoal(prev => ({ ...prev, target: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <Button onClick={handleUpdateNutrition} className="w-full">Update Nutrition Goal</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 