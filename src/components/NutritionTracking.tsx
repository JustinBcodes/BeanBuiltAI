'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useStore } from '@/store'
import { useToast } from '@/components/ui/use-toast'
import { ErrorMessage } from '@/components/ui/error-message'
import { Loader2, ChevronDown, ChevronUp, Apple } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WeeklyMealPlan } from '@/types/plan-types'

export function NutritionTracking() {
  const { 
    profile, 
    nutritionPlan, 
    nutritionProgress, 
    currentViewedWeekIndex,
    setCurrentViewedWeekIndex,
    toggleMealCompletion,
    generatePlans 
  } = useStore()
  const { toast } = useToast()
  const [expandedDays, setExpandedDays] = useState<string[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  // Hydration guard
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Protected useEffect for plan generation - only runs when hydrated and profile is valid
  useEffect(() => {
    if (!isHydrated || !profile || !profile.hasCompletedOnboarding) return

    if (!nutritionPlan || !Array.isArray(nutritionPlan.multiWeekMealPlans)) {
      console.log("NutritionTracking: Missing or invalid nutrition plan, generating...")
      generatePlans(profile)
    }
  }, [isHydrated, profile?.hasCompletedOnboarding, nutritionPlan, profile, generatePlans])

  // Safe access to current week data with comprehensive validation
  const currentWeekMealPlan = React.useMemo(() => {
    if (!nutritionPlan || 
        !Array.isArray(nutritionPlan.multiWeekMealPlans) || 
        currentViewedWeekIndex < 0 || 
        currentViewedWeekIndex >= nutritionPlan.multiWeekMealPlans.length) {
      return null
    }
    return nutritionPlan.multiWeekMealPlans[currentViewedWeekIndex]
  }, [nutritionPlan, currentViewedWeekIndex])
  
  const currentWeekProgress = React.useMemo(() => {
    if (!nutritionProgress || 
        !Array.isArray(nutritionProgress.weeklyMealProgress) ||
        currentViewedWeekIndex < 0 ||
        currentViewedWeekIndex >= nutritionProgress.weeklyMealProgress.length) {
      return null
    }
    return nutritionProgress.weeklyMealProgress[currentViewedWeekIndex]
  }, [nutritionProgress, currentViewedWeekIndex])

  const toggleDay = (dayOfWeek: string) => {
    setExpandedDays(prev =>
      prev.includes(dayOfWeek)
        ? prev.filter(d => d !== dayOfWeek)
        : [...prev, dayOfWeek]
    )
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

  // Check if nutrition plan is valid
  const hasValidNutritionPlan = nutritionPlan && 
                                Array.isArray(nutritionPlan.multiWeekMealPlans) && 
                                nutritionPlan.multiWeekMealPlans.length > 0 &&
                                typeof nutritionPlan.planName === 'string'

  // Check if week data is valid
  const hasValidWeekData = currentWeekMealPlan !== null && nutritionProgress !== null

  if (!hasValidNutritionPlan) {
    return (
      <ErrorMessage 
        text="Nutrition plan not found. Please complete onboarding or reset your progress."
        actionText="🚀 Force Generate Plan Now"
        action={() => {
          console.log("🚀 FORCE GENERATING NUTRITION PLAN IMMEDIATELY");
          if (profile) {
            generatePlans(profile);
          } else {
            console.log("No profile found, generating default nutrition plan");
            generatePlans();
          }
        }}
      />
    )
  }

  if (!hasValidWeekData) {
    return (
      <ErrorMessage 
        text="Nutrition schedule data is missing or malformed. Try viewing the first week."
        actionText="View First Week"
        action={() => {
          console.log("Setting nutrition week to 0");
          setCurrentViewedWeekIndex(0);
          
          if (nutritionPlan && !nutritionProgress) {
            console.log("Initializing nutrition progress");
            useStore.getState().initializeProgressFromPlans(useStore.getState().workoutPlan, nutritionPlan);
          }
        }}
      />
    )
  }

  // Calculate weekly nutrition stats with safe operations
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  let totalCaloriesConsumed = 0
  let totalMeals = 0
  let completedMeals = 0

  if (Array.isArray(currentWeekProgress)) {
    currentWeekProgress.forEach((dayProgress: any) => {
      if (dayProgress && Array.isArray(dayProgress.meals)) {
        totalMeals += dayProgress.meals.length
        dayProgress.meals.forEach((meal: any) => {
          if (meal && meal.completed) {
            completedMeals++
            totalCaloriesConsumed += meal.originalCalories || 0
          }
        })
      }
    })
  }

  const mealProgress = totalMeals > 0 ? (completedMeals / totalMeals) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="mb-8 p-6 bg-white shadow-xl rounded-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">
              Your Nutrition Plan - Week {currentViewedWeekIndex + 1}
            </h1>
            <p className="text-lg text-gray-600 mt-1">
              {nutritionPlan.planName}
            </p>
          </div>
        </div>

        <Card className="mb-6 bg-gray-50">
          <CardHeader>
            <CardTitle className="text-2xl text-brand-dark">Week {currentViewedWeekIndex + 1} Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{completedMeals}</p>
                <p className="text-sm text-muted-foreground">Meals Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{totalMeals}</p>
                <p className="text-sm text-muted-foreground">Total Meals</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-accent-foreground">{totalCaloriesConsumed}</p>
                <p className="text-sm text-muted-foreground">Calories Consumed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-secondary-foreground">{nutritionPlan.dailyTargets?.calories || 0}</p>
                <p className="text-sm text-muted-foreground">Daily Target</p>
              </div>
            </div>
            <Progress value={mealProgress} className="w-full [&>div]:bg-primary" />
            <div className="mt-3 text-sm text-gray-600">
              Overall Progress: {mealProgress.toFixed(0)}%
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
            onClick={() => setCurrentViewedWeekIndex(Math.min((nutritionPlan?.multiWeekMealPlans?.length || 1) - 1, currentViewedWeekIndex + 1))}
            disabled={currentViewedWeekIndex >= (nutritionPlan?.multiWeekMealPlans?.length || 1) - 1}
            variant="outline"
          >
            Next Week
          </Button>
        </div>

        <div className="space-y-6">
          {daysOfWeek.map(day => {
            if (!currentWeekMealPlan || typeof currentWeekMealPlan !== 'object') return null

            const dayMealPlan = currentWeekMealPlan[day as keyof typeof currentWeekMealPlan]
            const dayProgress = Array.isArray(currentWeekProgress) 
              ? currentWeekProgress.find(dp => dp && dp.dayOfWeek && dp.dayOfWeek.toLowerCase() === day)
              : undefined

            if (!dayMealPlan || !Array.isArray(dayMealPlan.meals)) {
              return null
            }

            return (
              <Card key={day} className="bg-white">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="capitalize">
                      {day} - {dayMealPlan.meals.length} meals ({dayMealPlan.dailyTotalCalories} cal)
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => toggleDay(day)}>
                      {expandedDays.includes(day) ? <ChevronUp /> : <ChevronDown />}
                    </Button>
                  </div>
                </CardHeader>
                {expandedDays.includes(day) && (
                  <CardContent>
                    <div className="space-y-4">
                      {dayMealPlan.meals.map((meal: any, mealIndex: number) => {
                        if (!meal || typeof meal !== 'object') return null

                        const mealProgress = Array.isArray(dayProgress?.meals) 
                          ? dayProgress.meals.find((mp: any) => mp && mp.name === meal.name)
                          : undefined
                        const isCompleted = mealProgress?.completed || false

                        return (
                          <div key={`${day}-${meal.name}-${mealIndex}`} className={cn(
                            "p-4 border rounded-lg",
                            isCompleted ? "bg-green-50 border-green-200" : "bg-white"
                          )}>
                            <div className="flex items-center space-x-3 mb-2">
                              <Checkbox
                                checked={isCompleted}
                                onCheckedChange={() => {
                                  toggleMealCompletion(day, meal.mealType, meal.name)
                                }}
                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                              <Label className={cn(
                                "text-lg font-semibold cursor-pointer",
                                isCompleted ? "line-through text-gray-500" : "text-gray-800"
                              )}>
                                {meal.name} ({meal.mealType})
                              </Label>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600 mb-2">
                              <span>Calories: {meal.calories}</span>
                              <span>Protein: {meal.protein}g</span>
                              <span>Carbs: {meal.carbs}g</span>
                              <span>Fat: {meal.fats}g</span>
                            </div>
                            {meal.ingredients && Array.isArray(meal.ingredients) && meal.ingredients.length > 0 && (
                              <div className="text-sm text-gray-600">
                                <strong>Ingredients:</strong> {meal.ingredients.map((ing: any) => ing && typeof ing === 'object' ? `${ing.item} (${ing.qty})` : '').filter(Boolean).join(', ')}
                              </div>
                            )}
                            {meal.instructions && (
                              <div className="text-sm text-gray-600 mt-2">
                                <strong>Instructions:</strong> {meal.instructions}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>

        {nutritionPlan.generalTips && Array.isArray(nutritionPlan.generalTips) && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Nutrition Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {nutritionPlan.generalTips.map((tip, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <Apple className="w-4 h-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
