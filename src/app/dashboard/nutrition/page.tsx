'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/store'
import { NutritionCard } from '@/components/nutrition/NutritionCard'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { RefreshCw } from 'lucide-react'
import { Loading } from '@/components/ui/loading'
import type { NutritionPlan, DailyMealPlan } from '@/types/plan-types'

export default function NutritionPage() {
  const profile = useStore(state => state.profile);
  const nutritionProgress = useStore(state => state.nutritionProgress);
  const nutritionPlan = useStore(state => state.nutritionPlan);
  const generatePlans = useStore(state => state.generatePlans);

  const { toast } = useToast()
  const [isRegenerating, setIsRegenerating] = useState(false)

  console.log('🍎 NutritionPage Debug:', {
    hasProfile: !!profile,
    hasCompletedOnboarding: profile?.hasCompletedOnboarding,
    hasNutritionProgress: !!nutritionProgress,
    hasNutritionPlan: !!nutritionPlan,
    currentWeekIndex: nutritionProgress?.currentWeekIndex,
    weeklyMealProgressLength: nutritionProgress?.weeklyMealProgress?.length,
    multiWeekMealPlansLength: nutritionPlan?.multiWeekMealPlans?.length
  });

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
      await generatePlans()
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

  // Check if we have valid nutrition plan and progress
  if (!nutritionPlan || !nutritionProgress?.weeklyMealProgress?.[0]) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">Your Nutrition Plan is Cooking!</h2>
        <p className="text-muted-foreground mb-6">
          Your plan isn&rsquo;t available yet or needs to be generated. Please click below.
        </p>
        <Button onClick={handleRegeneratePlans} disabled={isRegenerating} size="lg">
          {isRegenerating ? <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> : <RefreshCw className="mr-2 h-5 w-5" />}
          Generate My Plans
        </Button>
      </div>
    )
  }

  // Get the current week's meal progress
  const currentWeekIndex = nutritionProgress.currentWeekIndex || 0;
  const currentWeekProgress = nutritionProgress.weeklyMealProgress[currentWeekIndex];

  if (!Array.isArray(currentWeekProgress)) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">Loading Your Nutrition Plan...</h2>
        <Button onClick={handleRegeneratePlans} disabled={isRegenerating} size="lg">
          {isRegenerating ? <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> : <RefreshCw className="mr-2 h-5 w-5" />}
          Regenerate Plans
        </Button>
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
        {currentWeekProgress.map((dailyProgressItem: any) => {
          // Transform the meals array into the structure expected by NutritionCard
          const transformedMeals = {
            breakfast: dailyProgressItem.meals?.find((meal: any) => meal.mealType === 'breakfast') || null,
            lunch: dailyProgressItem.meals?.find((meal: any) => meal.mealType === 'lunch') || null,
            dinner: dailyProgressItem.meals?.find((meal: any) => meal.mealType === 'dinner') || null,
            snacks: dailyProgressItem.meals?.filter((meal: any) => meal.mealType === 'snacks') || []
          };
          
          return (
            <NutritionCard
              key={dailyProgressItem.dayOfWeek}
              dayOfWeek={dailyProgressItem.dayOfWeek}
              dailyMeals={transformedMeals}
            />
          );
        })}
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
