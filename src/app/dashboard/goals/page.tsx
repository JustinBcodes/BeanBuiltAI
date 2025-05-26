'use client'

import { useSession } from 'next-auth/react'
import { useStore } from '@/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export default function GoalsPage() {
  const { data: session } = useSession()
  const { profile, workoutPlan, nutritionPlan } = useStore()

  if (!session) {
    return <div>Please sign in to access this page.</div>
  }

  if (!profile) {
    return <div>Please complete your profile setup first.</div>
  }

  const calculateProgress = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100)
  }

  const formatGoalType = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Your Goals</h1>
        <p className="text-gray-500">Track your progress towards your fitness goals</p>
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
                  {calculateProgress(profile.currentWeight, profile.targetWeight)}%
                </span>
              </div>
              <Progress 
                value={calculateProgress(profile.currentWeight, profile.targetWeight)} 
                className="h-2" 
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Current Weight</p>
                  <p className="text-lg font-medium">{profile.currentWeight} lbs</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Target Weight</p>
                  <p className="text-lg font-medium">{profile.targetWeight} lbs</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Goal Type</p>
                <p className="text-lg font-medium">{formatGoalType(profile.goalType)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {workoutPlan && (
          <Card>
            <CardHeader>
              <CardTitle>Workout Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Weekly Progress</span>
                  <span className="text-sm font-medium">
                    {workoutPlan.completedWorkouts || 0}/{workoutPlan.totalWorkouts || 0} workouts
                  </span>
                </div>
                <Progress 
                  value={calculateProgress(workoutPlan.completedWorkouts || 0, workoutPlan.totalWorkouts || 1)} 
                  className="h-2" 
                />
                <div>
                  <p className="text-sm text-gray-500">Weekly Schedule</p>
                  {workoutPlan.multiWeekSchedules && Array.isArray(workoutPlan.multiWeekSchedules) && workoutPlan.multiWeekSchedules.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {workoutPlan.multiWeekSchedules[0] && Array.isArray(workoutPlan.multiWeekSchedules[0]) ? 
                        workoutPlan.multiWeekSchedules[0].map((day: any, index: number) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm">{day.dayOfWeek}</span>
                            <span className={`text-sm ${day.isRestDay ? 'text-blue-600' : 'text-gray-500'}`}>
                              {day.isRestDay ? 'Rest Day' : 'Workout Day'}
                            </span>
                          </div>
                        )) : null}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-gray-400">No weekly workout schedule available.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {nutritionPlan && (
          <Card>
            <CardHeader>
              <CardTitle>Nutrition Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Daily Calories</span>
                  <span className="text-sm font-medium">
                    {nutritionPlan.dailyTargets?.calories || 0} calories
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Protein</p>
                    <p className="text-lg font-medium">{nutritionPlan.dailyTargets?.proteinGrams || 0}g</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Carbs</p>
                    <p className="text-lg font-medium">{nutritionPlan.dailyTargets?.carbGrams || 0}g</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fats</p>
                    <p className="text-lg font-medium">{nutritionPlan.dailyTargets?.fatGrams || 0}g</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 