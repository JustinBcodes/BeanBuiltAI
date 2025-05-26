'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, CheckCircle2 } from 'lucide-react'

// Define Ingredient and Meal types, similar to store/index.ts or NutritionTracking.tsx
interface Ingredient {
  name: string;
  amount: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface Meal {
  name: string;
  ingredients: Ingredient[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  instructions?: string;
  completed: boolean;
}

interface DayPlan { // Type for dayPlan from Object.entries
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  snacks: Meal[];
}

interface Supplement { // Basic type for supplement
    name: string;
    timing: string;
    dosage: string;
}

export function Nutrition() {
  const { nutritionPlan, toggleMealCompletion: storeToggleMealCompletion, setNutritionPlan } = useStore() // Renamed to avoid conflict, and added setNutritionPlan if needed
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading) {
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

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
          <Button
            onClick={() => setError(null)}
            className="mt-4"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!nutritionPlan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Nutrition Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Generate a nutrition plan to get started.</p>
        </CardContent>
      </Card>
    )
  }

  const renderMealDetails = (meal: Meal | undefined) => ( // Added undefined to meal type
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">{meal?.name || 'Unnamed Meal'}</h4>
        <span className="text-sm text-gray-500">{meal?.totalCalories || 0} calories</span>
      </div>
      <div className="text-sm text-gray-500">
        <p>Protein: {meal?.totalProtein || 0}g | Carbs: {meal?.totalCarbs || 0}g | Fats: {meal?.totalFats || 0}g</p>
      </div>
      {meal?.ingredients && meal.ingredients.length > 0 ? (
        <div className="text-sm">
          <p className="font-medium mb-1">Ingredients:</p>
          <ul className="list-disc list-inside space-y-1">
            {meal.ingredients.map((ingredient: Ingredient, index: number) => (
              <li key={index} className="text-gray-600">
                {ingredient?.amount || ''} {ingredient?.name || 'Unknown Ingredient'} ({ingredient?.calories || 0} cal)
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-gray-400">No ingredients listed.</p>
      )}
      {meal?.instructions && (
        <div className="text-sm">
          <p className="font-medium mb-1">Instructions:</p>
          <p className="text-gray-600">{meal.instructions}</p>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Daily Nutrition Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h3 className="text-sm font-medium">Daily Calories</h3>
              <p className="text-2xl font-bold">{nutritionPlan.dailyTargets?.calories || 0}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium">Protein</h3>
              <p className="text-2xl font-bold">{nutritionPlan.dailyTargets?.proteinGrams || 0}g</p>
            </div>
            <div>
              <h3 className="text-sm font-medium">Carbs</h3>
              <p className="text-2xl font-bold">{nutritionPlan.dailyTargets?.carbGrams || 0}g</p>
            </div>
            <div>
              <h3 className="text-sm font-medium">Fats</h3>
              <p className="text-2xl font-bold">{nutritionPlan.dailyTargets?.fatGrams || 0}g</p>
            </div>
            <div>
              <h3 className="text-sm font-medium">Water Intake</h3>
              <p className="text-2xl font-bold">{nutritionPlan.hydrationRecommendation || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium">Plan Name</h3>
              <p className="text-2xl font-bold">{nutritionPlan.planName || 'Custom Plan'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="monday" className="w-full">
        {nutritionPlan.multiWeekMealPlans && nutritionPlan.multiWeekMealPlans.length > 0 && nutritionPlan.multiWeekMealPlans[0] ? (
          <TabsList className="grid w-full grid-cols-7">
            {Object.keys(nutritionPlan.multiWeekMealPlans[0]).map((day) => (
              <TabsTrigger key={day} value={day}>
                {day.charAt(0).toUpperCase() + day.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
        ) : (
          <TabsList><TabsTrigger value="no_days">No days in plan</TabsTrigger></TabsList>
        )}

        {nutritionPlan.multiWeekMealPlans && nutritionPlan.multiWeekMealPlans.length > 0 && nutritionPlan.multiWeekMealPlans[0] ? (
          Object.entries(nutritionPlan.multiWeekMealPlans[0]).map(([day, dayPlan]: [string, DayPlan]) => (
            <TabsContent key={day} value={day}>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Breakfast</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start justify-between">
                      {renderMealDetails(dayPlan.breakfast)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => storeToggleMealCompletion(day, dayPlan.breakfast.name, 'breakfast')}
                      >
                        {dayPlan.breakfast.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5 text-gray-300" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Lunch</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start justify-between">
                      {renderMealDetails(dayPlan.lunch)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => storeToggleMealCompletion(day, dayPlan.lunch.name, 'lunch')}
                      >
                        {dayPlan.lunch.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5 text-gray-300" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Dinner</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start justify-between">
                      {renderMealDetails(dayPlan.dinner)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => storeToggleMealCompletion(day, dayPlan.dinner.name, 'dinner')}
                      >
                        {dayPlan.dinner.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5 text-gray-300" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {dayPlan.snacks && dayPlan.snacks.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Snacks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {dayPlan.snacks.map((snack: Meal, index: number) => (
                          <div key={index} className="flex items-start justify-between">
                            {renderMealDetails(snack)}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => storeToggleMealCompletion(day, 'snacks', index)}
                            >
                              {snack.completed ? (
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                              ) : (
                                <CheckCircle2 className="h-5 w-5 text-gray-300" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          ))
        ) : (
          <TabsContent value="no_days">
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold mb-4">Meal plan is empty or not structured correctly.</h2>
              <p className="text-gray-600 mb-6">Generate a nutrition plan to see your meals.</p>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {nutritionPlan.generalTips && Array.isArray(nutritionPlan.generalTips) && nutritionPlan.generalTips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Nutrition Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {nutritionPlan.generalTips.map((tip: string, index: number) => (
                <div key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-sm text-gray-600">{tip}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 