'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { 
  Loader2, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Flame, 
  CheckCircle2,
  Edit,
  Save,
  X,
  Dumbbell
} from 'lucide-react'
import { useStore } from '@/store'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { useToast } from '@/components/ui/use-toast'
import { createStaticWorkoutPlan } from '@/data/workouts'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Link from 'next/link'
import { ErrorMessage } from '@/components/ui/error-message'

import {
  WorkoutPlan, 
  WeeklyWorkoutScheduleItem, 
  WorkoutDetails, 
  WorkoutExercise 
} from '@/types/plan-types'

// Sample exercise gallery - in production, this would come from an API or a more robust static data source
// This might need to be integrated with or replaced by workoutLibrary from data/workouts.ts
const exerciseGallery = [
  {
    name: 'Bench Press',
    imageUrl: '/exercises/bench-press.jpg',
    caloriesBurned: 150,
    category: 'chest'
  },
  {
    name: 'Squats',
    imageUrl: '/exercises/squats.jpg',
    caloriesBurned: 200,
    category: 'legs'
  },
  // Add more exercises...
]

export function WorkoutTracking() {
  const {
    workoutPlan,
    setWorkoutPlan,
    toggleExerciseCompletion,
    profile,
    workoutProgress,
    currentViewedWeekIndex,
    setCurrentViewedWeekIndex,
    generatePlans,
  } = useStore()

  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isGeneratingNextWeek, setIsGeneratingNextWeek] = useState(false)
  const [expandedDays, setExpandedDays] = useState<string[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const [editingExercise, setEditingExercise] = useState<{
    dayOfWeek: string;
    exerciseIndex: number;
    exercise: WorkoutExercise;
    weekIndex: number;
  } | null>(null)
  const [isAddingExercise, setIsAddingExercise] = useState(false)
  const [newExercise, setNewExercise] = useState<Partial<WorkoutExercise>>({
    name: '',
    sets: 3,
    reps: '10-12',
    rest: '60s',
    notes: '',
    equipment: '',
    completed: false,
  })
  const [selectedDayForNewExercise, setSelectedDayForNewExercise] = useState<string | null>(null)

  // Hydration guard
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Protected useEffect for setting week index - only runs when hydrated and workoutPlan exists
  useEffect(() => {
    if (!isHydrated || !workoutPlan) return
    
    setCurrentViewedWeekIndex(workoutPlan.currentWeekIndex)
  }, [isHydrated, workoutPlan?.currentWeekIndex, setCurrentViewedWeekIndex])

  // Protected useEffect for plan generation - only runs when hydrated and profile is valid
  useEffect(() => {
    if (!isHydrated || !profile || !profile.hasCompletedOnboarding) return

    if (!workoutPlan || !Array.isArray(workoutPlan.multiWeekSchedules)) {
      console.log("WorkoutTracking: Missing or invalid workout plan, generating...")
      const workoutPrefs = {
        workoutSplit: profile.experienceLevel === 'beginner' ? 'FullBody' : 'PPL',
        goalType: profile.goalType,
        experienceLevel: profile.experienceLevel,
      }
      
      const staticPlan = createStaticWorkoutPlan(workoutPrefs)
      setWorkoutPlan(staticPlan)
      
      // Also initialize progress
      useStore.getState().initializeProgressFromPlans(staticPlan, useStore.getState().nutritionPlan)
    }
  }, [isHydrated, profile?.hasCompletedOnboarding, workoutPlan?.multiWeekSchedules?.length, profile, setWorkoutPlan])
  
  // Force create workout plan after delay if still missing - only when hydrated
  useEffect(() => {
    if (!isHydrated) return
    
    const timer = setTimeout(() => {
      if (profile && !workoutPlan) {
        console.log("🚨 FORCE CREATING WORKOUT PLAN - No plan exists after delay")
        const workoutPrefs = {
          workoutSplit: 'FullBody',
          goalType: profile.goalType || 'general_fitness',
          experienceLevel: profile.experienceLevel || 'beginner',
        }
        const staticPlan = createStaticWorkoutPlan(workoutPrefs)
        setWorkoutPlan(staticPlan)
        useStore.getState().initializeProgressFromPlans(staticPlan, useStore.getState().nutritionPlan)
      }
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [isHydrated, profile, workoutPlan, setWorkoutPlan])

  // Safe access to current week data with comprehensive validation
  const currentWeeklySchedule = React.useMemo(() => {
    if (!workoutPlan || 
        !Array.isArray(workoutPlan.multiWeekSchedules) || 
        currentViewedWeekIndex < 0 || 
        currentViewedWeekIndex >= workoutPlan.multiWeekSchedules.length) {
      return null
    }
    const weekData = workoutPlan.multiWeekSchedules[currentViewedWeekIndex]
    return Array.isArray(weekData) ? weekData : null
  }, [workoutPlan?.multiWeekSchedules, currentViewedWeekIndex])
  
  const currentWeekProgress = React.useMemo(() => {
    if (!workoutProgress || 
        !Array.isArray(workoutProgress.weeklySchedule) ||
        currentViewedWeekIndex < 0 ||
        currentViewedWeekIndex >= workoutProgress.weeklySchedule.length) {
      return null
    }
    const progressData = workoutProgress.weeklySchedule[currentViewedWeekIndex]
    return Array.isArray(progressData) ? progressData : null
  }, [workoutProgress?.weeklySchedule, currentViewedWeekIndex])

  // Add defensive validation to ensure currentWeekProgress is always an array - only when hydrated
  useEffect(() => {
    if (!isHydrated || !workoutProgress || currentViewedWeekIndex < 0) return
    
    // Ensure the weekly schedule exists for the current week index
    if (!Array.isArray(workoutProgress.weeklySchedule[currentViewedWeekIndex])) {
      console.error(`Week progress for index ${currentViewedWeekIndex} is not an array:`, workoutProgress.weeklySchedule[currentViewedWeekIndex])
      
      // If the current week has a schedule in the plan but not in progress, initialize it
      if (workoutPlan && Array.isArray(workoutPlan.multiWeekSchedules) && 
          Array.isArray(workoutPlan.multiWeekSchedules[currentViewedWeekIndex])) {
        console.log(`Initializing missing progress for week ${currentViewedWeekIndex}`)
        useStore.getState().initializeProgressFromPlans(workoutPlan, useStore.getState().nutritionPlan)
      }
    }
  }, [isHydrated, workoutProgress, currentViewedWeekIndex, workoutPlan])

  const handleGenerateNextWeek = async () => {
    setIsGeneratingNextWeek(true)
    try {
      await generatePlans(profile)
      toast({ 
        title: "New Week Generated!", 
        description: "Your next workout week is ready. Keep up the great work!",
        duration: 3000 
      })
    } catch (error) {
      console.error("Error generating next week:", error)
      toast({ 
        title: "Error", 
        description: "Failed to generate next week. Please try again.",
        variant: "destructive" 
      })
    } finally {
      setIsGeneratingNextWeek(false)
    }
  }

  const toggleDay = (dayOfWeek: string) => {
    setExpandedDays(prev =>
      prev.includes(dayOfWeek)
        ? prev.filter(d => d !== dayOfWeek)
        : [...prev, dayOfWeek]
    )
  }

  const addExerciseToDayViaGallery = (dayOfWeek: string, galleryExercise: typeof exerciseGallery[0]) => {
    if (!workoutPlan || !currentWeeklySchedule) return

    const updatedPlan = JSON.parse(JSON.stringify(workoutPlan)) as WorkoutPlan
    const targetWeekSchedule = updatedPlan.multiWeekSchedules[currentViewedWeekIndex]
    if (!targetWeekSchedule) return

    const daySchedule = targetWeekSchedule.find(d => d.dayOfWeek === dayOfWeek)

    if (daySchedule && daySchedule.workoutDetails) {
      const newEx: WorkoutExercise = {
        name: galleryExercise.name,
        sets: 3, // Default or from galleryExercise if adaptable
        reps: '10-12',
        rest: '60s',
        notes: 'Added from gallery',
        equipment: galleryExercise.category, // Example mapping
        completed: false,
        // caloriesBurned is not in WorkoutExercise, handle if needed elsewhere
      }
      daySchedule.workoutDetails.exercises.push(newEx)
      setWorkoutPlan(updatedPlan)
    } else {
      toast({ title: "Error", description: "Could not add exercise to this day.", variant: "destructive" })
    }
  }

  const handleEditExercise = (dayOfWeek: string, exerciseIndex: number, exercise: WorkoutExercise) => {
    setEditingExercise({
      dayOfWeek,
      exerciseIndex,
      exercise: { ...exercise },
      weekIndex: currentViewedWeekIndex
    })
  }

  const handleSaveEditedExercise = () => {
    if (!editingExercise || !workoutPlan || !currentWeeklySchedule) return
    const { dayOfWeek, exerciseIndex, exercise, weekIndex } = editingExercise
    const updatedPlan = JSON.parse(JSON.stringify(workoutPlan)) as WorkoutPlan
    
    if (!updatedPlan.multiWeekSchedules[weekIndex]) {
      toast({ title: "Error", description: "Target week not found in plan.", variant: "destructive" })
      setEditingExercise(null)
      return
    }

    const daySchedule = updatedPlan.multiWeekSchedules[weekIndex].find(d => d.dayOfWeek === dayOfWeek)

    if (daySchedule && daySchedule.workoutDetails && daySchedule.workoutDetails.exercises[exerciseIndex]) {
      daySchedule.workoutDetails.exercises[exerciseIndex] = exercise
      setWorkoutPlan(updatedPlan)
      setEditingExercise(null)
      toast({
        title: "Exercise Updated",
        description: `Your ${exercise.name} exercise has been updated for Week ${weekIndex + 1}.`,
      })
    } else {
      toast({ title: "Error", description: "Could not save exercise changes.", variant: "destructive" })
    }
  }

  const handleAddNewExercise = (dayOfWeek: string) => {
    setSelectedDayForNewExercise(dayOfWeek)
    setIsAddingExercise(true)
    setNewExercise({
      name: '',
      sets: 3,
      reps: '10-12',
      rest: '60s',
      notes: '',
      equipment: '',
      completed: false,
    })
  }

  const handleSaveNewExercise = () => {
    if (!selectedDayForNewExercise || !newExercise.name || !workoutPlan || !currentWeeklySchedule) return
    const updatedPlan = JSON.parse(JSON.stringify(workoutPlan)) as WorkoutPlan
    
    if (!updatedPlan.multiWeekSchedules[currentViewedWeekIndex]) {
       toast({ title: "Error", description: "Target week not found for adding exercise.", variant: "destructive" })
       setIsAddingExercise(false)
       setSelectedDayForNewExercise(null)
       return
    }
    const daySchedule = updatedPlan.multiWeekSchedules[currentViewedWeekIndex].find(d => d.dayOfWeek === selectedDayForNewExercise)

    if (daySchedule && daySchedule.workoutDetails) {
      daySchedule.workoutDetails.exercises.push(newExercise as WorkoutExercise)
      setWorkoutPlan(updatedPlan)
      setIsAddingExercise(false)
      setSelectedDayForNewExercise(null)
      toast({ title: "Exercise Added", description: `${newExercise.name} has been added to your workout.` })
    } else {
       toast({ title: "Error", description: "Could not add new exercise.", variant: "destructive" })
    }
  }

  const handleRemoveExercise = (dayOfWeek: string, exerciseIndex: number) => {
    if (!workoutPlan || !currentWeeklySchedule) return
    const updatedPlan = JSON.parse(JSON.stringify(workoutPlan)) as WorkoutPlan

    if (!updatedPlan.multiWeekSchedules[currentViewedWeekIndex]) {
      toast({ title: "Error", description: "Target week not found for removing exercise.", variant: "destructive" })
      return
    }
    const daySchedule = updatedPlan.multiWeekSchedules[currentViewedWeekIndex].find(d => d.dayOfWeek === dayOfWeek)

    if (daySchedule && daySchedule.workoutDetails && daySchedule.workoutDetails.exercises[exerciseIndex]) {
      daySchedule.workoutDetails.exercises.splice(exerciseIndex, 1)
      setWorkoutPlan(updatedPlan)
      toast({ title: "Exercise Removed", description: "The exercise has been removed." })
    } else {
      toast({ title: "Error", description: "Could not remove exercise.", variant: "destructive" })
    }
  }

  const handleCompleteWorkout = (dayOfWeek: string) => {
    if (!workoutPlan || !currentWeeklySchedule) return
    const weekIdx = currentViewedWeekIndex
    const dayProgress = currentWeekProgress?.find(dp => dp.dayOfWeek === dayOfWeek)

    if (dayProgress && dayProgress.workoutDetails) {
      const allExercisesCompleted = dayProgress.workoutDetails.exercises.every(ex => ex.completed)
      if (!allExercisesCompleted) {
         dayProgress.workoutDetails.exercises.forEach((_, exerciseIdx) => {
           if (workoutPlan.currentWeekIndex === weekIdx) {
            const exerciseToMark = currentWeeklySchedule?.find(d => d.dayOfWeek === dayOfWeek)?.workoutDetails?.exercises[exerciseIdx]
            if(exerciseToMark && !exerciseToMark.completed) {
                toggleExerciseCompletion(dayOfWeek, exerciseToMark.name, exerciseIdx)
            }
           }
         })
         toast({ title: "Workout Complete!", description: `All exercises for ${dayOfWeek} marked as complete.` })
      } else {
         toast({ title: "Workout Already Complete", description: `All exercises for ${dayOfWeek} are done.` })
      }
    }
  }

  const handleResetWorkout = (dayOfWeek: string) => {
    if (!workoutPlan || !currentWeeklySchedule) return
    const weekIdx = currentViewedWeekIndex

    const dayDetails = currentWeeklySchedule.find(d => d.dayOfWeek === dayOfWeek)?.workoutDetails
    if (dayDetails) {
        dayDetails.exercises.forEach((exercise, exerciseIdx) => {
            if (exercise.completed) {
                if (workoutPlan.currentWeekIndex === weekIdx) {
                    toggleExerciseCompletion(dayOfWeek, exercise.name, exerciseIdx)
                }
            }
        })
        toast({ title: "Workout Reset", description: `Progress for ${dayOfWeek} has been reset.` })
    }
  }

  // Show loading during hydration
  if (!isHydrated) {
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

  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Profile...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Validation function for workout plan
  // Check if workout plan is valid
  const hasValidWorkoutPlan = workoutPlan && 
                              Array.isArray(workoutPlan.multiWeekSchedules) && 
                              workoutPlan.multiWeekSchedules.length > 0 &&
                              typeof workoutPlan.planName === 'string'

  // Check if week data is valid
  const hasValidWeekData = Array.isArray(currentWeeklySchedule) && workoutProgress !== null

  if (!hasValidWorkoutPlan) {
    return (
      <ErrorMessage 
        text="Workout plan not found. Please complete onboarding or reset your progress."
        actionText="🚀 Force Generate Plan Now"
        action={() => {
          console.log("🚀 FORCE GENERATING WORKOUT PLAN IMMEDIATELY")
          if (profile) {
            const workoutPrefs = {
              workoutSplit: profile.experienceLevel === 'beginner' ? 'FullBody' : 'PPL',
              goalType: profile.goalType,
              experienceLevel: profile.experienceLevel,
            }
            
            const immediatePlan = createStaticWorkoutPlan(workoutPrefs)
            setWorkoutPlan(immediatePlan)
            useStore.getState().generatePlans(profile)
          } else {
            const defaultPlan = createStaticWorkoutPlan()
            setWorkoutPlan(defaultPlan)
          }
        }}
      />
    )
  }

  if (!hasValidWeekData) {
    return (
      <ErrorMessage 
        text="Workout schedule data is missing or malformed. Try viewing the first week."
        actionText="View First Week"
        action={() => {
          console.log("🔴 VIEW FIRST WEEK BUTTON CLICKED!")
          setCurrentViewedWeekIndex(0)
          
          if (!workoutProgress && workoutPlan) {
            console.log("Initializing progress from existing workout plan")
            useStore.getState().initializeProgressFromPlans(workoutPlan, useStore.getState().nutritionPlan)
          }
          
          if (workoutPlan.currentWeekIndex !== 0) {
            setWorkoutPlan({...workoutPlan, currentWeekIndex: 0})
          }
        }}
      />
    )
  }

  // Calculate workout stats with safe operations
  const weeklySchedule = currentWeeklySchedule
  const weekProgress = currentWeekProgress
  const totalWorkoutDays = Array.isArray(weeklySchedule) 
    ? weeklySchedule.filter((day: any) => day && !day.isRestDay && day.workoutDetails).length
    : 0
  
  const completedWorkouts = Array.isArray(weekProgress)
    ? weekProgress.filter((dayProg: any) => dayProg && !dayProg.isRestDay && dayProg.workoutDetails?.completed).length
    : 0
  
  const overallProgress = totalWorkoutDays > 0 ? (completedWorkouts / totalWorkoutDays) * 100 : 0

  return (
    <div className="space-y-6 opacity-100">
      <div className="mb-8 p-6 bg-white shadow-xl rounded-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">
              Your Workout Plan - Week {currentViewedWeekIndex + 1}
            </h1>
            <p className="text-lg text-gray-600 mt-1">
              {workoutPlan.planName} ({workoutPlan.preferences?.workoutSplit || 'General'})
            </p>
          </div>
        </div>

        <Card className="mb-6 bg-gray-50">
          <CardHeader>
            <CardTitle className="text-2xl text-brand-dark">Week {currentViewedWeekIndex + 1} Overview</CardTitle>
            <CardDescription>
              {completedWorkouts} of {totalWorkoutDays} workouts completed this week.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={overallProgress} className="w-full [&>div]:bg-brand-teal" />
            <div className="mt-3 text-sm text-gray-600">
              Overall Progress: {overallProgress.toFixed(0)}%
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center items-center space-x-4 my-4">
          <Button 
            onClick={() => setCurrentViewedWeekIndex(Math.max(0, currentViewedWeekIndex - 1))}
            disabled={currentViewedWeekIndex === 0}
            variant="outline"
          >
            Previous Week
          </Button>
          <span className="text-lg font-medium">Viewing Week {currentViewedWeekIndex + 1}</span>
          <Button 
            onClick={() => setCurrentViewedWeekIndex(Math.min((workoutPlan?.multiWeekSchedules?.length || 1) - 1, currentViewedWeekIndex + 1))}
            disabled={currentViewedWeekIndex >= (workoutPlan?.multiWeekSchedules?.length || 1) - 1}
            variant="outline"
          >
            Next Week
          </Button>
        </div>

                  {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
                  
                  <div className="space-y-6">
                    {Array.isArray(weeklySchedule) ? weeklySchedule.map((dayItem: any, dayIdx: number) => {
                      if (!dayItem || typeof dayItem !== 'object') return null

                      const dayProgress = Array.isArray(weekProgress) 
                        ? weekProgress.find((dp: any) => dp && dp.dayOfWeek === dayItem.dayOfWeek)
                        : undefined
                      const isDayCompleted = dayProgress?.workoutDetails?.completed || false

                      return (
                        <Card 
                          key={`${currentViewedWeekIndex}-${dayItem.dayOfWeek}-${dayIdx}`} 
                          className={cn(
                            "transition-all duration-300 ease-in-out",
                            isDayCompleted ? "bg-green-50 border-green-200" : "bg-white"
                          )}
                        >
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="capitalize">
                                {dayItem.dayOfWeek}
                                {dayItem.isRestDay ? " (Rest Day)" : ` - ${dayItem.workoutDetails?.exercises?.length || 0} exercises`}
                              </CardTitle>
                              {!dayItem.isRestDay && (
                                <div className="flex items-center space-x-2">
                                  {isDayCompleted && <CheckCircle2 className="text-primary h-5 w-5" />}
                                  <Button variant="ghost" size="sm" onClick={() => toggleDay(dayItem.dayOfWeek)}>
                                    {expandedDays.includes(dayItem.dayOfWeek) ? <ChevronUp /> : <ChevronDown />}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardHeader>
                          
                          {!dayItem.isRestDay && expandedDays.includes(dayItem.dayOfWeek) && dayItem.workoutDetails && (
                            <CardContent>
                              <div className="space-y-4">
                                {Array.isArray(dayItem.workoutDetails.exercises) && dayItem.workoutDetails.exercises.map((exercise: any, exerciseIdx: number) => {
                                  if (!exercise || typeof exercise !== 'object') return null

                                  const exerciseProgress = Array.isArray(dayProgress?.workoutDetails?.exercises)
                                    ? dayProgress.workoutDetails.exercises[exerciseIdx]
                                    : undefined
                                  const isCompleted = exerciseProgress?.completed || false

                                  return (
                                    <div key={`${dayItem.dayOfWeek}-${exercise.name}-${exerciseIdx}`} className={cn(
                                      "p-4 border rounded-lg transition-all duration-200",
                                      isCompleted ? "bg-green-50 border-green-200" : "bg-white"
                                    )}>
                                      <div className="flex items-center space-x-3 mb-2">
                                        <Checkbox
                                          checked={isCompleted}
                                          onCheckedChange={() => {
                                            toggleExerciseCompletion(dayItem.dayOfWeek, exercise.name, exerciseIdx)
                                          }}
                                          className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                                        />
                                        <Label className={cn(
                                          "text-lg font-semibold cursor-pointer",
                                          isCompleted ? "line-through text-gray-500" : "text-gray-800"
                                        )}>
                                          {exercise.name}
                                        </Label>
                                      </div>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                                        <span>Sets: {exercise.sets}</span>
                                        <span>Reps: {exercise.reps}</span>
                                        <span>Rest: {exercise.rest}</span>
                                        <span>Equipment: {exercise.equipment || 'None'}</span>
                                      </div>
                                      {exercise.notes && (
                                        <div className="text-sm text-gray-600 mt-2">
                                          <strong>Notes:</strong> {exercise.notes}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                              
                              <div className="mt-4 flex justify-between">
                                <Button 
                                  onClick={() => handleCompleteWorkout(dayItem.dayOfWeek)}
                                  disabled={isDayCompleted}
                                  className={cn(
                                    "transition-all duration-200",
                                    isDayCompleted ? "bg-green-500 text-white" : ""
                                  )}
                                >
                                  {isDayCompleted ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <Dumbbell className="mr-2 h-4 w-4" />}
                                  {isDayCompleted ? "Completed!" : "Complete Workout"}
                                </Button>
                                {isDayCompleted && (
                                  <Button 
                                    onClick={() => handleResetWorkout(dayItem.dayOfWeek)}
                                    variant="outline"
                                  >
                                    Reset Progress
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      )
                    }) : null}
        </div>
      </div>
    </div>
  )
} 