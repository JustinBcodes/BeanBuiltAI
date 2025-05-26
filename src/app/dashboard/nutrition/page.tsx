'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/store'
import { NutritionCard } from '@/components/nutrition/NutritionCard'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { RefreshCw } from 'lucide-react'
import { Loading } from '@/components/ui/loading'
import type { NutritionPlan, DailyMealPlan } from '@/types/plan-types' // Import correct types

export default function NutritionPage() {
  // Use nutritionProgress for display as it's structured for UI and includes completion status
  // Select state and actions individually to stabilize references
  const profile = useStore(state => state.profile);
  const nutritionProgress = useStore(state => state.nutritionProgress);
  const storeGeneratePlans = useStore(state => state.generatePlans);
  const nutritionPlan = useStore(state => state.nutritionPlan); // Keep nutritionPlan to get dailyTargets etc.

  const { toast } = useToast()
  const [isRegenerating, setIsRegenerating] = useState(false)

  const handleRegeneratePlans = async () => {
    if (!profile) {
      toast({
        title: "Profile not found",
        description: "Cannot regenerate plans without user profile.",
        variant: "destructive",
      })
      return
    }
    setIsRegenerating(true)
    try {
      await storeGeneratePlans() // This action now handles setting workout/nutrition plans and init progress
      toast({
        title: "Plans Regenerated!",
        description: "Your workout and nutrition plans have been updated.",
      })
    } catch (error) {
      console.error("Error regenerating plans:", error)
      toast({
        title: "Error Regenerating Plans",
        description: error instanceof Error ? error.message : "Failed to regenerate plans. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRegenerating(false)
    }
  }

  // Initial check to see if plans need to be generated if onboarding is done but plans are missing
  useEffect(() => {
    if (profile?.hasCompletedOnboarding && !nutritionPlan && !isRegenerating) {
       // Optionally trigger generation automatically, or rely on user clicking button.
       // For now, let user trigger via button shown in the empty state.
    }
  }, [profile, nutritionPlan, isRegenerating]);

  if (isRegenerating) {
    return <Loading message="Regenerating your personalized plans... This may take a moment." />
  }

  if (!profile?.hasCompletedOnboarding) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
        <p className="text-xl text-muted-foreground mb-4">Welcome! Please complete your onboarding to get started.</p>
                    <Button onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/onboarding';
              }
            }}>Go to Onboarding</Button>
      </div>
    )
  }

  // Use nutritionProgress for checking displayable content, but nutritionPlan for global targets
  if (!nutritionProgress?.weeklyMealProgress || nutritionProgress.weeklyMealProgress.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">Your Nutrition Plan is Cooking!</h2>
        <p className="text-muted-foreground mb-6">
          {profile?.hasCompletedOnboarding ? 
            "Your plan isn't available yet or needs to be generated. Please click below." : 
            "Complete your onboarding to generate your personalized nutrition plan."
          }
        </p>
        {profile?.hasCompletedOnboarding && (
          <Button onClick={handleRegeneratePlans} disabled={isRegenerating} size="lg">
            {isRegenerating ? <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> : <RefreshCw className="mr-2 h-5 w-5" />}
            Generate My Plans
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl md:text-4xl font-bold">Your Nutrition Plan</h1>
          {nutritionPlan?.dailyTargets && (
             <p className="text-muted-foreground mt-1 text-lg">
              Target: <span className="font-semibold text-primary">{nutritionPlan.dailyTargets.calories}</span> kcal, 
              <span className="font-semibold text-primary">{nutritionPlan.dailyTargets.proteinGrams}</span>g P, 
              <span className="font-semibold text-primary">{nutritionPlan.dailyTargets.carbGrams}</span>g C, 
              <span className="font-semibold text-primary">{nutritionPlan.dailyTargets.fatGrams}</span>g F
            </p>
          )}
        </div>
        <Button
          variant="outline"
          className="gap-2 w-full sm:w-auto"
          onClick={handleRegeneratePlans}
          disabled={isRegenerating}
        >
          {isRegenerating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Regenerate All Plans
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {nutritionProgress.weeklyMealProgress[0] && Array.isArray(nutritionProgress.weeklyMealProgress[0]) ? 
          nutritionProgress.weeklyMealProgress[0].map((dailyScheduleItem: any) => (
            <NutritionCard
              key={dailyScheduleItem.dayOfWeek}
              dayOfWeek={dailyScheduleItem.dayOfWeek}
              dailyMeals={dailyScheduleItem.meals} // This now matches DailyNutritionProgressItem structure
              // Pass toggleMealCompletion if NutritionCard handles it directly
            />
          )) : null}
      </div>
       {nutritionPlan?.generalTips && nutritionPlan.generalTips.length > 0 && (
        <div className="mt-10 p-6 bg-card rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-3 text-foreground">General Nutrition Tips</h3>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            {nutritionPlan.generalTips.map((tip, index) => <li key={index}>{tip}</li>)}
          </ul>
        </div>
      )}
      {nutritionPlan?.hydrationRecommendation && (
         <div className="mt-6 p-6 bg-card rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-3 text-foreground">Hydration</h3>
          <p className="text-muted-foreground">{nutritionPlan.hydrationRecommendation}</p>
        </div>
      )}
    </div>
  )
} 
