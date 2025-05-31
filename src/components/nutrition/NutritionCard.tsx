import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { useStore } from '@/store'
import { Clock, Utensils, Info, Edit3 } from 'lucide-react'
// import Image from 'next/image' // Not currently used
// import { CustomizationDialog } from '@/components/customization/CustomizationDialog' // Dialog not implemented here
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { MealItem, NutritionIngredient, CompletedMealItem, MealProgress } from '@/types/plan-types'; // Use types from plan-types
import { cn } from '@/lib/utils'

// The structure of dailyMeals received as prop from nutrition/page.tsx
// which comes from store's nutritionProgress.weeklySchedule[n].meals
interface DailyMealsProp {
  breakfast: CompletedMealItem | null;
  lunch: CompletedMealItem | null;
  dinner: CompletedMealItem | null;
  snacks: CompletedMealItem[];
}

interface NutritionCardProps {
  dayOfWeek: string;
  dailyMeals: DailyMealsProp;
}

// Helper function to create a complete MealItem from progress data
const createCompleteMealItem = (
  progressMeal: MealProgress | undefined,
  originalMeal?: MealItem
): CompletedMealItem | null => {
  if (!progressMeal) return null;
  
  // If we have the original meal data, use it
  if (originalMeal) {
    return {
      ...originalMeal,
      completed: progressMeal.completed
    };
  }
  
  // Otherwise, create a minimal meal item with proper defaults
  return {
    mealType: progressMeal.mealType,
    name: progressMeal.name,
    ingredients: [], // Default empty ingredients
    calories: progressMeal.originalCalories || 0,
    protein: 0, // Default values
    carbs: 0,
    fats: 0,
    instructions: undefined,
    completed: progressMeal.completed
  };
};

export function NutritionCard({ dayOfWeek, dailyMeals }: NutritionCardProps) {
  const { toast } = useToast();
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Get state directly from store
  const nutritionProgress = useStore(state => state.nutritionProgress);
  const nutritionPlan = useStore(state => state.nutritionPlan);
  const toggleMealCompletion = useStore(state => state.toggleMealCompletion);
  
  // Hydration guard
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
        <div className="p-5 bg-card-foreground/5 border-b border-border">
          <h3 className="text-lg font-semibold text-center text-card-foreground">{dayOfWeek}</h3>
        </div>
        <div className="p-4 md:p-5 space-y-4 flex-grow overflow-y-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </Card>
    );
  }

  // Get meals for this day - simplified approach
  const dayProgress = nutritionProgress?.weeklyMealProgress?.[0]?.find(day => day.dayOfWeek === dayOfWeek);
  const dayPlan = nutritionPlan?.multiWeekMealPlans?.[0]?.[dayOfWeek.toLowerCase()];
  
  const meals = dayProgress?.meals || [];
  
  console.log('🔍 NutritionCard Simple Debug:', {
    dayOfWeek,
    mealsCount: meals.length,
    dayProgress: !!dayProgress,
    dayPlan: !!dayPlan
  });

  const handleMealToggle = (mealType: string, mealIdentifier: any, currentCompleted: boolean) => {
    console.log('🎯 SIMPLE MEAL TOGGLE:', { dayOfWeek, mealType, mealIdentifier, currentCompleted });
    
    toggleMealCompletion(dayOfWeek, mealType, mealIdentifier);
    
    toast({
      title: !currentCompleted ? "✅ Meal completed!" : "⬜ Meal unchecked",
      description: `${dayOfWeek} - ${mealType}`,
    });
  };

  const renderSimpleMeal = (meal: any, index: number) => {
    if (!meal) return null;
    
    // Simple ID system - for snacks use index, for others use name
    const mealId = meal.mealType === 'snacks' ? index : meal.name;
    
    return (
      <div key={`${meal.mealType}-${index}`} className="space-y-3 border-b border-border py-4 last:border-b-0 last:pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleMealToggle(meal.mealType, mealId, meal.completed)}
              className={cn(
                "h-4 w-4 rounded-sm border-2 flex items-center justify-center transition-colors",
                meal.completed
                  ? "bg-primary border-primary text-white"
                  : "bg-white border-gray-300 hover:border-gray-400"
              )}
            >
              {meal.completed && (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <Utensils className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <h4 className="font-semibold text-base">
              {meal.name}
              <span className="text-xs text-muted-foreground ml-1">
                ({meal.mealType?.charAt(0).toUpperCase() + meal.mealType?.slice(1)})
              </span>
            </h4>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              meal.completed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
            }`}>
              {meal.completed ? 'Completed' : 'Pending'}
            </span>
          </div>
        </div>

        {/* Get meal details from plan if available */}
        {dayPlan?.meals && (() => {
          const planMeal = dayPlan.meals.find(m => m.name === meal.name && m.mealType === meal.mealType);
          if (!planMeal) return null;
          
          return (
            <>
              {planMeal.ingredients && planMeal.ingredients.length > 0 && (
                <div className="pl-6 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Ingredients:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                    {planMeal.ingredients.map((ingredient, idx) => (
                      <div key={idx} className="text-xs">
                        <span className="font-medium">{ingredient.item}:</span> 
                        <span className="text-muted-foreground ml-1">{ingredient.qty}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pl-6 pt-2">
                <Badge variant="secondary">{planMeal.calories} kcal</Badge>
                <Badge variant="outline">P: {planMeal.protein}g</Badge>
                <Badge variant="outline">C: {planMeal.carbs}g</Badge>
                <Badge variant="outline">F: {planMeal.fats}g</Badge>
              </div>
            </>
          );
        })()}
      </div>
    );
  };

  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      <div className="p-5 bg-card-foreground/5 border-b border-border">
        <h3 className="text-lg font-semibold text-center text-card-foreground">{dayOfWeek}</h3>
      </div>
      <div className="p-4 md:p-5 space-y-4 flex-grow overflow-y-auto">
        {meals.length > 0 ? (
          meals.map((meal, index) => renderSimpleMeal(meal, index))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            No meals specified for {dayOfWeek}.
          </p>
        )}
      </div>
    </Card>
  );
} 