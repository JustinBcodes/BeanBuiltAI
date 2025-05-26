'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { WorkoutCard } from '@/components/workout/WorkoutCard'
import { Loading } from '@/components/ui/loading'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import type { WorkoutPlan, WeeklyWorkoutScheduleItem } from '@/types/plan-types'

export default function WorkoutsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const profile = useStore(state => state.profile);
  const workoutProgress = useStore(state => state.workoutProgress);
  const generatePlans = useStore(state => state.generatePlans);
  const workoutPlan = useStore(state => state.workoutPlan);

  const [isRegenerating, setIsRegenerating] = useState(false)

  const handleRegenerate = async () => {
    if (!profile) {
      toast({ title: "Profile not found", description: "Cannot regenerate plan without user profile.", variant: "destructive" })
      return
    }
    setIsRegenerating(true)
    try {
      await generatePlans(profile)
      toast({
        title: "Workout Plan Regenerated!",
        description: "Your workout plan has been updated.",
      })
    } catch (error) {
      console.error('Error regenerating workout plan:', error)
      toast({
        title: "Error Regenerating Workout Plan",
        description: error instanceof Error ? error.message : "Failed to regenerate workout plan. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRegenerating(false)
    }
  }

  useEffect(() => {
    if (profile?.hasCompletedOnboarding && !workoutPlan && !isRegenerating) {
    }
  }, [profile, workoutPlan, isRegenerating])

  if (isRegenerating) {
    return <Loading message="Regenerating your workout plan... This might take a moment." />
  }

  if (!profile?.hasCompletedOnboarding) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
        <AlertTriangle className="w-16 h-16 text-primary mb-4" />
        <h2 className="text-2xl font-semibold mb-3">Onboarding Incomplete</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Please complete your onboarding profile to generate a personalized workout plan.
        </p>
        <Button onClick={() => router.push('/onboarding')} size="lg">Go to Onboarding</Button>
      </div>
    )
  }

  if (!workoutProgress?.weeklySchedule || workoutProgress.weeklySchedule.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">Ready to Build Your Workout?</h2>
        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
          {profile?.hasCompletedOnboarding ? 
            "Your personalized workout plan isn\'t available yet or needs to be generated. Click the button below to get started!" : 
            "Complete your onboarding to generate your personalized workout plan."
          }
        </p>
        {profile?.hasCompletedOnboarding && (
          <Button onClick={handleRegenerate} disabled={isRegenerating} size="lg">
            {isRegenerating ? <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> : <RefreshCw className="mr-2 h-5 w-5" />}
            Generate My Workout Plan
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl md:text-4xl font-bold">Your Workout Plan</h1>
          {workoutPlan?.planName && <p className="text-muted-foreground mt-1 text-lg">{workoutPlan.planName}</p>}
        </div>
        <Button 
          onClick={handleRegenerate} 
          disabled={isRegenerating} 
          variant="outline"
          className="gap-2 w-full sm:w-auto"
        >
          {isRegenerating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Regenerate Workout Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.isArray(workoutProgress.weeklySchedule) && workoutProgress.weeklySchedule.length > 0 ? 
          (() => {
            const currentWeekIndex = workoutProgress.currentWeekIndex || 0;
            const currentWeek = workoutProgress.weeklySchedule[currentWeekIndex];
            return Array.isArray(currentWeek) ? currentWeek.map((scheduleItem) => (
              <WorkoutCard 
                key={scheduleItem.dayOfWeek} 
                daySchedule={scheduleItem}
              />
            )) : null;
          })() : null
        }
      </div>
      {workoutPlan?.summaryNotes && (
        <div className="mt-10 p-6 bg-card rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-3 text-foreground">Coach's Notes</h3>
          <p className="text-muted-foreground whitespace-pre-wrap">{workoutPlan.summaryNotes}</p>
        </div>
      )}
    </div>
  )
} 