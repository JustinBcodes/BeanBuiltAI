'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { useStore } from '@/store'
import { Clock, Target, Edit3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import type { WeeklyWorkoutScheduleItem } from '@/types/plan-types'

interface WorkoutCardProps {
  daySchedule: WeeklyWorkoutScheduleItem
}

export function WorkoutCard({ daySchedule }: WorkoutCardProps) {
  const { toast } = useToast()
  const [isHydrated, setIsHydrated] = useState(false)
  
  // Get state directly from store
  const workoutProgress = useStore(state => state.workoutProgress)
  const toggleExerciseCompletion = useStore(state => state.toggleExerciseCompletion)

  // Hydration guard
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  if (!isHydrated) {
    return (
      <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-3 bg-card-foreground/5">
          <CardTitle className="text-lg font-semibold text-center">{daySchedule.dayOfWeek}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-5">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Get workout progress for this day - simplified
  const dayProgress = workoutProgress?.weeklySchedule?.[0]?.find(day => day.dayOfWeek === daySchedule.dayOfWeek);
  const workoutData = dayProgress || daySchedule;
  
  console.log('🔍 WorkoutCard Simple Debug:', {
    dayOfWeek: daySchedule.dayOfWeek,
    hasProgress: !!dayProgress,
    isRestDay: workoutData.isRestDay,
    exerciseCount: workoutData.workoutDetails?.exercises?.length || 0
  });

  const handleExerciseToggle = (exerciseName: string, exerciseIndex: number, currentCompleted: boolean) => {
    console.log('🎯 SIMPLE EXERCISE TOGGLE:', { 
      dayOfWeek: daySchedule.dayOfWeek, 
      exerciseName, 
      exerciseIndex, 
      currentCompleted 
    });
    
    toggleExerciseCompletion(daySchedule.dayOfWeek, exerciseName, exerciseIndex);
    
    toast({
      title: !currentCompleted ? "✅ Exercise completed!" : "⬜ Exercise unchecked",
      description: `${exerciseName}`,
    });
  };

  if (workoutData.isRestDay) {
    return (
      <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-3 bg-green-50">
          <CardTitle className="text-lg font-semibold text-center text-green-700">{daySchedule.dayOfWeek}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-5 text-center">
          <div className="py-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🛌</span>
            </div>
            <h3 className="text-lg font-medium text-green-700 mb-2">Rest Day</h3>
            <p className="text-sm text-green-600">Take time to recover and let your muscles rebuild stronger.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!workoutData.workoutDetails) {
    return (
      <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-3 bg-card-foreground/5">
          <CardTitle className="text-lg font-semibold text-center">{daySchedule.dayOfWeek}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-5 text-center">
          <p className="text-muted-foreground">No workout scheduled for this day.</p>
        </CardContent>
      </Card>
    )
  }

  const { workoutDetails } = workoutData;

  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
      <CardHeader className="pb-3 bg-card-foreground/5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{daySchedule.dayOfWeek}</CardTitle>
          <Badge variant="outline" className="text-xs">
            {workoutDetails.workoutName}
          </Badge>
        </div>
      </CardHeader>

      {workoutDetails.warmUp && (
        <div className="px-4 md:px-5 py-3 bg-blue-50 border-b">
          <h5 className="font-medium text-sm text-blue-700 mb-1 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Warm-up
          </h5>
          <p className="text-xs text-blue-600 whitespace-pre-wrap">{workoutDetails.warmUp}</p>
        </div>
      )}

      <CardContent className="p-4 md:p-5 flex-grow">
        <div className="space-y-3">
          {workoutDetails.exercises && workoutDetails.exercises.length > 0 ? (
            <Accordion type="single" collapsible className="space-y-2">
              {workoutDetails.exercises.map((exercise, index) => (
                <AccordionItem value={`exercise-${index}`} key={`${exercise.name}-${index}`} className="border bg-background rounded-md shadow-sm hover:shadow-md transition-shadow">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleExerciseToggle(exercise.name, index, exercise.completed || false);
                          }}
                          className={cn(
                            "h-4 w-4 rounded-sm border-2 flex items-center justify-center transition-colors",
                            exercise.completed
                              ? "bg-primary border-primary text-white"
                              : "bg-white border-gray-300 hover:border-gray-400"
                          )}
                        >
                          {exercise.completed && (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                        <span className={cn(
                          "font-medium text-sm text-left",
                          exercise.completed ? "line-through text-gray-500" : "text-gray-800"
                        )}>
                          {exercise.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          exercise.completed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {exercise.completed ? 'Done' : 'Pending'}
                        </span>
                        <span>{exercise.sets} sets</span>
                        <span>•</span>
                        <span>{exercise.reps}</span>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-4 pt-2 pb-3 space-y-2 border-t border-border">
                    <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                      <span>Rest: {exercise.rest}</span>
                      {exercise.equipment && <span>Equipment: {exercise.equipment}</span>}
                    </div>
                    <p className="text-xs text-foreground whitespace-pre-wrap bg-muted/30 p-2 rounded">{exercise.notes}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No exercises listed for this workout.</p>
          )}
        </div>
      </CardContent>

      {workoutDetails.coolDown && (
        <CardFooter className="p-4 md:p-5 border-t mt-auto bg-muted/50 rounded-b-md">
          <div>
            <h5 className="font-medium text-sm text-muted-foreground mb-1">Cool-down</h5>
            <p className="text-xs text-foreground whitespace-pre-wrap">{workoutDetails.coolDown}</p>
          </div>
        </CardFooter>
      )}
    </Card>
  )
} 