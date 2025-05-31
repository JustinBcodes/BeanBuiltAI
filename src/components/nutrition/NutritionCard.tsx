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
  
  // Subscribe to the actual state to ensure re-renders
  const toggleMealCompletion = useStore(state => state.toggleMealCompletion);
  const nutritionProgress = useStore(state => state.nutritionProgress);
  const nutritionPlan = useStore(state => state.nutritionPlan);
  
  // Hydration guard
  useEffect(() => {
    setIsHydrated(true);
    console.log('🏗️ NutritionCard mounted for', dayOfWeek, {
      hasToggleFunction: !!toggleMealCompletion,
      hasNutritionProgress: !!nutritionProgress,
      hasNutritionPlan: !!nutritionPlan
    });
  }, [dayOfWeek]);
  
  // Get the current week's data directly from state to ensure fresh data
  const currentWeekIndex = nutritionProgress?.currentWeekIndex || 0;
  const currentWeekProgress = nutritionProgress?.weeklyMealProgress?.[currentWeekIndex];
  const dayData = currentWeekProgress?.find(day => day.dayOfWeek === dayOfWeek);
  
  // Get the original meal plan data for this day to get complete meal information
  const currentWeekPlan = nutritionPlan?.multiWeekMealPlans?.[currentWeekIndex];
  const dayKey = dayOfWeek.toLowerCase();
  const originalDayPlan = currentWeekPlan && dayKey in currentWeekPlan 
    ? currentWeekPlan[dayKey as keyof typeof currentWeekPlan] 
    : null;

  console.log('🔍 NutritionCard Debug:', {
    dayOfWeek,
    currentWeekIndex,
    dayData: dayData?.meals?.length,
    originalDayPlan: originalDayPlan?.meals?.length,
    hasMeals: !!originalDayPlan?.meals
  });

  // Always reconstruct complete meal data from store - ignore the incomplete dailyMeals prop
  const mealsToRender = (() => {
    if (!dayData || !originalDayPlan) {
      console.log('❌ Missing dayData or originalDayPlan for', dayOfWeek);
      return {
        breakfast: null,
        lunch: null,
        dinner: null,
        snacks: []
      };
    }

    const breakfast = (() => {
      const progressMeal = dayData.meals?.find((meal: any) => meal.mealType === 'breakfast');
      const originalMeal = originalDayPlan.meals?.find(m => m.mealType === 'breakfast');
      const result = createCompleteMealItem(progressMeal, originalMeal);
      console.log('🥞 Breakfast:', { progressMeal: !!progressMeal, originalMeal: !!originalMeal, result: !!result, completed: result?.completed });
      return result;
    })();
    
    const lunch = (() => {
      const progressMeal = dayData.meals?.find((meal: any) => meal.mealType === 'lunch');
      const originalMeal = originalDayPlan.meals?.find(m => m.mealType === 'lunch');
      const result = createCompleteMealItem(progressMeal, originalMeal);
      console.log('🥗 Lunch:', { progressMeal: !!progressMeal, originalMeal: !!originalMeal, result: !!result, completed: result?.completed });
      return result;
    })();
    
    const dinner = (() => {
      const progressMeal = dayData.meals?.find((meal: any) => meal.mealType === 'dinner');
      const originalMeal = originalDayPlan.meals?.find(m => m.mealType === 'dinner');
      const result = createCompleteMealItem(progressMeal, originalMeal);
      console.log('🍽️ Dinner:', { progressMeal: !!progressMeal, originalMeal: !!originalMeal, result: !!result, completed: result?.completed });
      return result;
    })();
    
    const snacks = (() => {
      const progressSnacks = dayData.meals?.filter((meal: any) => meal.mealType === 'snacks') || [];
      const originalSnacks = originalDayPlan.meals?.filter(m => m.mealType === 'snacks') || [];
      const results = progressSnacks.map((progressSnack: any, index: number) => {
        const originalSnack = originalSnacks[index];
        return createCompleteMealItem(progressSnack, originalSnack);
      }).filter(Boolean) as CompletedMealItem[];
      console.log('🍎 Snacks:', { progressCount: progressSnacks.length, originalCount: originalSnacks.length, resultCount: results.length });
      return results;
    })();

    return { breakfast, lunch, dinner, snacks };
  })();

  const renderMeal = (meal: CompletedMealItem | null, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks', snackIndex?: number) => {
    if (!meal) {
      return (
        <div key={mealType + (snackIndex !== undefined ? snackIndex : '')} className="p-4 text-sm text-muted-foreground">
          {mealType.charAt(0).toUpperCase() + mealType.slice(1)}{snackIndex !== undefined ? ` ${snackIndex+1}` : ''} not specified in the plan.
        </div>
      );
    }
    
    // For snacks, use the index as identifier; for other meals, use the meal name
    const mealIdentifier = mealType === 'snacks' && typeof snackIndex === 'number' ? snackIndex : meal.name;

    return (
      <div 
        key={meal.name + (snackIndex !== undefined ? snackIndex : '')} 
        className="space-y-3 border-b border-border py-4 last:border-b-0 last:pb-0"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              role="checkbox"
              aria-checked={meal.completed}
              onClick={() => {
                console.log('✅ Button clicked!', { meal: meal.name, completed: meal.completed });
                toggleMealCompletion(dayOfWeek, mealType, mealIdentifier);
                toast({ 
                  title: !meal.completed ? "Meal marked as completed!" : "Meal marked as incomplete",
                  description: `${meal.name} - ${dayOfWeek}`
                });
              }}
              className={cn(
                "peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                "disabled:cursor-not-allowed disabled:opacity-50",
                meal.completed
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-white"
              )}
            >
              {meal.completed && (
                <svg className="w-full h-full p-[1px]" fill="white" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <Utensils className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <h4 className="font-semibold text-base">
              {meal.name} <span className="text-xs text-muted-foreground">({mealType.charAt(0).toUpperCase() + mealType.slice(1)}{snackIndex !== undefined ? ` ${snackIndex+1}` : ''})</span>
            </h4>
            {meal.instructions && (
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs bg-background border text-foreground p-2 rounded-md shadow-lg">
                    <p className="text-xs font-medium mb-1">Instructions:</p>
                    <p className="text-xs">{meal.instructions}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={`px-2 py-1 rounded text-xs font-medium ${meal.completed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
              {meal.completed ? 'Completed' : 'Pending'}
            </span>
          </div>
        </div>

        {meal.ingredients && meal.ingredients.length > 0 && (
          <div className="pl-6 space-y-2">
             <p className="text-xs font-medium text-muted-foreground mb-1">Ingredients:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
              {meal.ingredients.map((ingredient, index) => (
                <div key={index} className="text-xs">
                  <span className="font-medium">{ingredient.item}:</span> <span className="text-muted-foreground">{ingredient.qty}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pl-6 pt-2">
          <Badge variant="secondary">{meal.calories} kcal</Badge>
          <Badge variant="outline">P: {meal.protein}g</Badge>
          <Badge variant="outline">C: {meal.carbs}g</Badge>
          <Badge variant="outline">F: {meal.fats}g</Badge>
        </div>
      </div>
    );
  }

  // Show loading state during hydration
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

  console.log('🎯 About to render NutritionCard for', dayOfWeek, {
    breakfast: !!mealsToRender.breakfast,
    lunch: !!mealsToRender.lunch, 
    dinner: !!mealsToRender.dinner,
    snacksCount: mealsToRender.snacks.length,
    hasAnyMeals: !!(mealsToRender.breakfast || mealsToRender.lunch || mealsToRender.dinner || mealsToRender.snacks.length > 0)
  });

  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      <div className="p-5 bg-card-foreground/5 border-b border-border">
        <h3 className="text-lg font-semibold text-center text-card-foreground">{dayOfWeek}</h3>
      </div>
      <div className="p-4 md:p-5 space-y-4 flex-grow overflow-y-auto">
        {renderMeal(mealsToRender.breakfast, 'breakfast')}
        {renderMeal(mealsToRender.lunch, 'lunch')}
        {renderMeal(mealsToRender.dinner, 'dinner')}
        
        {mealsToRender.snacks && mealsToRender.snacks.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-border">
            <h4 className="font-semibold text-base text-muted-foreground pl-1">Snacks</h4>
            {mealsToRender.snacks.map((snack, index) => (
                renderMeal(snack, 'snacks', index)
            ))}
          </div>
        )}
        {(!mealsToRender.breakfast && !mealsToRender.lunch && !mealsToRender.dinner && (!mealsToRender.snacks || mealsToRender.snacks.length === 0)) &&
            <p className="text-sm text-muted-foreground text-center py-8">No meals specified for {dayOfWeek}.</p>        
        }
      </div>
    </Card>
  );
} 