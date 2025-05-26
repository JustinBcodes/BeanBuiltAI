'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useStore } from '@/store'
import { getWorkoutTips } from '@/lib/workoutTips'
import { useEffect, useState } from 'react'

export function Tips() {
  const { workoutPlan, nutritionPlan } = useStore()
  const [tips, setTips] = useState<string[]>([])

  useEffect(() => {
    if (workoutPlan && Array.isArray(workoutPlan.multiWeekSchedules) && workoutPlan.multiWeekSchedules.length > 0) {
      // Get tips based on the workout type
      // Look for workout type in the first week's first workout day
      const firstWeek = workoutPlan.multiWeekSchedules[0];
      let workoutType = 'general';
      
      if (Array.isArray(firstWeek)) {
        const firstWorkoutDay = firstWeek.find(day => !day.isRestDay && day.workoutDetails);
        if (firstWorkoutDay?.workoutDetails?.workoutName) {
          const workoutName = firstWorkoutDay.workoutDetails.workoutName.toLowerCase();
          if (workoutName.includes('strength')) {
            workoutType = 'strength';
          } else if (workoutName.includes('cardio')) {
            workoutType = 'cardio';
          }
        }
      }
      
      setTips(getWorkoutTips(workoutType))
    }
  }, [workoutPlan])

  if (!workoutPlan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Generate a workout plan to see personalized tips.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personalized Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Workout Tips</h3>
              <ul className="space-y-2">
                {tips.map((tip, index) => (
                  <li key={index} className="text-sm text-gray-600">
                    • {tip}
                  </li>
                ))}
              </ul>
            </div>

            {nutritionPlan && (
              <div>
                <h3 className="text-sm font-medium mb-2">Nutrition Tips</h3>
                <ul className="space-y-2">
                  {nutritionPlan.hydrationRecommendation && (
                    <li className="text-sm text-gray-600">
                      • Aim to drink {nutritionPlan.hydrationRecommendation} daily
                    </li>
                  )}
                  {nutritionPlan.generalTips && Array.isArray(nutritionPlan.generalTips) && 
                    nutritionPlan.generalTips.slice(0, 3).map((tip, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        • {tip}
                      </li>
                    ))
                  }
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 