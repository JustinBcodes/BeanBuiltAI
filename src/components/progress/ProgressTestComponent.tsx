'use client'

import { useStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function ProgressTestComponent() {
  const nutritionProgress = useStore(state => state.nutritionProgress)
  const workoutProgress = useStore(state => state.workoutProgress)
  
  const weekIdx = nutritionProgress?.currentWeekIndex || 0
  const currentNutritionWeek = nutritionProgress?.weeklyMealProgress?.[weekIdx] || []
  const currentWorkoutWeek = workoutProgress?.weeklySchedule?.[weekIdx] || []
  
  const completedMeals = currentNutritionWeek.reduce((sum, day) => 
    sum + (day?.meals?.filter(m => m.completed).length || 0), 0
  )
  const totalMeals = currentNutritionWeek.reduce((sum, day) => 
    sum + (day?.meals?.length || 0), 0
  )
  
  const completedWorkouts = currentWorkoutWeek.filter(day => 
    day?.workoutDetails?.completed
  ).length
  const totalWorkouts = currentWorkoutWeek.filter(day => 
    !day?.isRestDay && day?.workoutDetails
  ).length
  
  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-2">Toggle System Test</h3>
      <div className="space-y-2 text-sm">
        <div>
          <strong>Meals:</strong> {completedMeals} / {totalMeals} completed
        </div>
        <div>
          <strong>Workouts:</strong> {completedWorkouts} / {totalWorkouts} completed
        </div>
        <div className="text-xs text-muted-foreground">
          If these numbers change when you click checkboxes, the system is working!
        </div>
      </div>
    </Card>
  )
} 