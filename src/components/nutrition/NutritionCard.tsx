import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
  }, []);
  
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

  // Create complete meal items by combining progress data with original meal data
  const mealsToRender = dayData ? {
    breakfast: (() => {
      const progressMeal = dayData.meals?.find((meal: any) => meal.mealType === 'breakfast');
      const originalMeal = originalDayPlan?.meals?.find(m => m.mealType === 'breakfast');
      return createCompleteMealItem(progressMeal, originalMeal);
    })(),
    lunch: (() => {
      const progressMeal = dayData.meals?.find((meal: any) => meal.mealType === 'lunch');
      const originalMeal = originalDayPlan?.meals?.find(m => m.mealType === 'lunch');
      return createCompleteMealItem(progressMeal, originalMeal);
    })(),
    dinner: (() => {
      const progressMeal = dayData.meals?.find((meal: any) => meal.mealType === 'dinner');
      const originalMeal = originalDayPlan?.meals?.find(m => m.mealType === 'dinner');
      return createCompleteMealItem(progressMeal, originalMeal);
    })(),
    snacks: (() => {
      const progressSnacks = dayData.meals?.filter((meal: any) => meal.mealType === 'snacks') || [];
      const originalSnacks = originalDayPlan?.meals?.filter(m => m.mealType === 'snacks') || [];
      return progressSnacks.map((progressSnack: any, index: number) => {
        const originalSnack = originalSnacks[index];
        return createCompleteMealItem(progressSnack, originalSnack);
      }).filter(Boolean) as CompletedMealItem[];
    })()
  } : dailyMeals;

  // Memoized toggle handler to prevent unnecessary re-renders
  const handleMealComplete = useCallback((
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks',
    mealNameOrSnackIndex: string | number, // Meal name for B/L/D, index for snacks
    currentStatus: boolean
  ) => {
    if (!isHydrated) return; // Prevent action before hydration
    
    console.log('🔄 Toggling meal:', { dayOfWeek, mealType, mealNameOrSnackIndex, currentStatus });
    
    toggleMealCompletion(dayOfWeek, mealType, mealNameOrSnackIndex);
    
    const mealToLog = typeof mealNameOrSnackIndex === 'string' ? mealNameOrSnackIndex : `${mealType} #${mealNameOrSnackIndex + 1}`;
    toast({
      title: !currentStatus ? "Meal marked complete!" : "Meal marked incomplete.",
      description: `${dayOfWeek}: ${mealToLog}`,
    });
  }, [isHydrated, dayOfWeek, toggleMealCompletion, toast]);

  // const handleCustomize = async (mealType: string, updatedMeal: MealItem, snackIndex?: number) => {
  //   // Future implementation for meal customization
  //   // try {
  //   //   await customizeMeal(dayOfWeek, mealType, updatedMeal, snackIndex); 
  //   //   toast({ title: "Meal customized!", description: "Your changes have been saved." });
  //   // } catch (error) {
  //   //   toast({ title: "Error customizing meal", description: "Please try again", variant: "destructive" });
  //   // }
  //   console.log("Customize action for:", dayOfWeek, mealType, updatedMeal, snackIndex);
  //   toast({title: "Customize Clicked (Not Implemented)", description: mealType});
  // };

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
        className="space-y-3 border-b border-border py-4 last:border-b-0 last:pb-0 cursor-pointer group"
        onClick={() => handleMealComplete(mealType, mealIdentifier, meal.completed)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Utensils className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <h4 className="font-semibold text-base group-hover:text-primary transition-colors">
              {meal.name} <span className="text-xs text-muted-foreground">({mealType.charAt(0).toUpperCase() + mealType.slice(1)}{snackIndex !== undefined ? ` ${snackIndex+1}` : ''})</span>
            </h4>
            {meal.instructions && (
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-1" onClick={(e) => e.stopPropagation()}>
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
          <div className="flex items-center gap-3">
            {/* <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCustomize(mealType, meal, snackIndex)}> 
              <Edit3 className="h-4 w-4 text-muted-foreground hover:text-primary" />
            </Button> */} 
            <Button
              variant="ghost"
              size="sm"
              disabled={!isHydrated}
              onClick={(e) => {
                e.stopPropagation();
                handleMealComplete(mealType, mealIdentifier, meal.completed);
              }}
              className="h-8 w-8 p-0"
              aria-label={`Mark ${meal.name} as ${meal.completed ? 'incomplete' : 'complete'}`}
            >
              <Checkbox
                checked={meal.completed}
                className="cursor-pointer data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
            </Button>
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