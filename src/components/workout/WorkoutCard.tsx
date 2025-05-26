'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { useStore } from '@/store'
import { ChevronDown, ChevronUp, RefreshCw, CheckCircle2, Circle, Zap } from 'lucide-react'
import { CustomizationDialog } from '@/components/customization/CustomizationDialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import type { DailyWorkoutProgressItem, WorkoutDetailsProgress, ExerciseProgress } from '@/store'

interface WorkoutCardProps {
  daySchedule: DailyWorkoutProgressItem
}

export function WorkoutCard({ daySchedule }: WorkoutCardProps) {
  const { toast } = useToast()
  const { toggleExerciseCompletion } = useStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null)

  const handleExerciseComplete = (exerciseName: string) => {
    if (daySchedule.workoutDetails) {
      toggleExerciseCompletion(daySchedule.dayOfWeek, exerciseName)
    }
  }

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

  if (!daySchedule) {
    return null
  }

  const { dayOfWeek, isRestDay, workoutDetails } = daySchedule

  return (
    <Card className="flex flex-col h-full shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="bg-card-foreground/5">
        <CardTitle className="text-xl text-center font-semibold text-card-foreground">{dayOfWeek}</CardTitle>
      </CardHeader>

      {isRestDay || !workoutDetails ? (
        <CardContent className="flex-grow flex flex-col items-center justify-center p-6 text-center">
          <Zap className="h-12 w-12 text-primary mb-3" />
          <p className="text-lg font-semibold text-foreground">Rest Day</p>
          <p className="text-sm text-muted-foreground">Recharge and recover!</p>
        </CardContent>
      ) : (
        <>
          <CardContent className="p-4 md:p-5 flex-grow space-y-4">
            {workoutDetails.workoutName && (
              <div className="text-center mb-3">
                <h4 className="font-semibold text-lg text-primary">{workoutDetails.workoutName}</h4>
              </div>
            )}

            {workoutDetails.warmUp && (
              <div className="mb-3 p-3 bg-muted/50 rounded-md">
                <h5 className="font-medium text-sm text-muted-foreground mb-1">Warm-up</h5>
                <p className="text-xs text-foreground whitespace-pre-wrap">{workoutDetails.warmUp}</p>
              </div>
            )}

            {workoutDetails.exercises && workoutDetails.exercises.length > 0 ? (
              <Accordion type="single" collapsible className="w-full space-y-2">
                {workoutDetails.exercises.map((exercise, index) => (
                  <AccordionItem value={`exercise-${index}`} key={exercise.name + index} className="border bg-background rounded-md shadow-sm hover:shadow-md transition-shadow">
                    <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline group">
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate max-w-[180px] group-hover:text-primary transition-colors text-left">{exercise.name}</span>
                        <div className="flex items-center gap-2 ml-2">
                          {exercise.completed ? 
                            <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" /> : 
                            <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
                          <Badge variant="outline">{exercise.sets} x {exercise.reps}</Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pt-2 pb-3 space-y-2 border-t border-border">
                      <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                        <span>Rest: {exercise.rest}</span>
                        {exercise.equipment && <span>Equipment: {exercise.equipment}</span>}
                      </div>
                      <p className="text-xs text-foreground whitespace-pre-wrap bg-muted/30 p-2 rounded">{exercise.notes}</p>
                      <Button 
                        variant={exercise.completed ? "secondary" : "default"}
                        size="sm" 
                        className="w-full mt-2 text-xs" 
                        onClick={() => handleExerciseComplete(exercise.name)}
                      >
                        {exercise.completed ? 'Mark Incomplete' : 'Mark Complete'}
                      </Button>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No exercises listed for this workout.</p>
            )}
          </CardContent>

          {workoutDetails.coolDown && (
            <CardFooter className="p-4 md:p-5 border-t mt-auto bg-muted/50 rounded-b-md">
              <div>
                <h5 className="font-medium text-sm text-muted-foreground mb-1">Cool-down</h5>
                <p className="text-xs text-foreground whitespace-pre-wrap">{workoutDetails.coolDown}</p>
              </div>
            </CardFooter>
          )}
          {workoutDetails.completed !== undefined && (
            <div className={`p-3 text-center text-xs font-medium rounded-b-md ${workoutDetails.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
              {workoutDetails.completed ? 'Day Complete!' : 'Day Incomplete'}
            </div>
          )}
        </>
      )}

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full mt-4 gap-2">
            <RefreshCw className="h-4 w-4" />
            Regenerate Workout
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Workout</DialogTitle>
          </DialogHeader>
          <p className="text-gray-500">
            This will create a new workout plan for {dayOfWeek}. Your progress will be reset.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline">Cancel</Button>
            <Button variant="default">Regenerate</Button>
          </div>
        </DialogContent>
      </Dialog>

      <CustomizationDialog
        type="workout"
        day={dayOfWeek}
        item={workoutDetails}
        onUpdate={handleCustomize}
      />
    </Card>
  )
} 