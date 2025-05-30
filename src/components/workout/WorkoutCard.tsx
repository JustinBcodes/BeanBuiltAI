'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
  const toggleExerciseCompletion = useStore(state => state.toggleExerciseCompletion)
  const workoutProgress = useStore(state => state.workoutProgress)
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null)

  // Hydration guard
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Get the current week's data directly from state to ensure fresh data
  const currentWeekIndex = workoutProgress?.currentWeekIndex || 0;
  const currentWeekProgress = workoutProgress?.weeklySchedule?.[currentWeekIndex];
  const dayData = currentWeekProgress?.find(day => day.dayOfWeek === daySchedule.dayOfWeek);
  
  // Use state data if available, otherwise fall back to props
  const workoutToRender = dayData || daySchedule;

  // Memoized exercise completion handler
  const handleExerciseComplete = useCallback((exerciseName: string, exerciseIndex: number) => {
    if (!isHydrated) return; // Prevent action before hydration
    
    console.log('🔄 Toggling exercise:', { dayOfWeek: workoutToRender.dayOfWeek, exerciseName, exerciseIndex });
    
    if (workoutToRender.workoutDetails) {
      toggleExerciseCompletion(workoutToRender.dayOfWeek, exerciseName, exerciseIndex)
      toast({
        title: "Exercise updated!",
        description: `${exerciseName} completion status changed.`,
      })
    }
  }, [isHydrated, workoutToRender.dayOfWeek, workoutToRender.workoutDetails, toggleExerciseCompletion, toast])

  const handleCustomize = async (updatedWorkout: any) => {
    try {
      toast({
        title: "Workout customized!",
        description: "Your changes have been saved.",
      })
    } catch (error) {
      toast({
        title: "Error customizing workout",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  if (!workoutToRender) {
    return null
  }

  const { dayOfWeek, isRestDay, workoutDetails } = workoutToRender

  // Show loading state during hydration
  if (!isHydrated) {
    return (
      <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-3 bg-card-foreground/5">
          <CardTitle className="text-lg font-semibold text-center">{dayOfWeek}</CardTitle>
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

  if (isRestDay) {
    return (
      <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-3 bg-green-50">
          <CardTitle className="text-lg font-semibold text-center text-green-700">{dayOfWeek}</CardTitle>
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

  if (!workoutDetails) {
    return (
      <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-3 bg-card-foreground/5">
          <CardTitle className="text-lg font-semibold text-center">{dayOfWeek}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-5 text-center">
          <p className="text-muted-foreground">No workout scheduled for this day.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
      <CardHeader className="pb-3 bg-card-foreground/5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{dayOfWeek}</CardTitle>
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
              {workoutDetails.exercises.map((exercise, index) => {
                const handleExerciseClick = () => {
                  alert(`Clicked on ${exercise.name}!`); // Simple test to see if clicks work
                  
                  console.log('🖱️ Exercise clicked:', {
                    exerciseName: exercise.name,
                    exerciseIndex: index,
                    currentCompleted: exercise.completed,
                    isHydrated,
                    dayOfWeek: workoutToRender.dayOfWeek
                  });
                  
                  if (!isHydrated) {
                    console.log('❌ Not hydrated yet, ignoring exercise click');
                    return;
                  }
                  
                  handleExerciseComplete(exercise.name, index);
                };

                return (
                  <AccordionItem value={`exercise-${index}`} key={exercise.name + index} className="border bg-background rounded-md shadow-sm hover:shadow-md transition-shadow">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <div
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleExerciseClick();
                            }}
                            className="cursor-pointer flex items-center justify-center h-6 w-6 rounded border border-input transition-colors hover:bg-accent"
                            aria-label={`Mark ${exercise.name} as ${exercise.completed ? 'incomplete' : 'complete'}`}
                          >
                            <Checkbox
                              checked={exercise.completed || false}
                              className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 pointer-events-none"
                            />
                          </div>
                          <span className={cn(
                            "font-medium text-sm text-left",
                            exercise.completed ? "line-through text-gray-500" : "text-gray-800"
                          )}>
                            {exercise.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${exercise.completed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
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
                );
              })}
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