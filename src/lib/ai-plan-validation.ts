import { z } from 'zod'
import type { NutritionPlan, WorkoutPlan, WeeklyMealPlan } from '@/types/plan-types'

const text = z.string().trim().min(1).max(2000)
const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const day = z.string().transform(value => value.toLowerCase()).refine(value => days.includes(value))
const completeWeek = (week: { dayOfWeek: string }[]) => new Set(week.map(item => item.dayOfWeek)).size === 7
const amount = z.number().finite().min(0).max(10000)
const exercise = z.object({
  name: text, sets: z.union([z.number().int().min(1).max(30), text]), reps: text,
  rest: text.default('60–90 seconds'), notes: z.string().max(2000).default(''),
  equipment: text.optional(), muscleGroup: text.optional(),
})
const workoutSchema = z.object({
  planName: text,
  weeklySchedule: z.array(z.object({
    dayOfWeek: day, isRestDay: z.boolean(),
    workoutDetails: z.object({
      workoutName: text, warmUp: text, exercises: z.array(exercise).min(1).max(30), coolDown: text,
    }).nullish(),
  }).refine(item => item.isRestDay || !!item.workoutDetails)).length(7).refine(completeWeek),
})
const meal = z.object({
  mealType: text, name: text,
  ingredients: z.array(z.object({ item: text, qty: text })).min(1).max(30),
  calories: amount, protein: amount, carbs: amount, fats: amount,
  instructions: z.string().max(4000).optional(),
})
const nutritionSchema = z.object({
  planName: text,
  dailyTargets: z.object({ calories: amount.positive(), proteinGrams: amount, carbGrams: amount, fatGrams: amount }),
  weeklyMealPlan: z.array(z.object({ dayOfWeek: day, meals: z.array(meal).min(1).max(10) })).length(7).refine(completeWeek),
})

function parseJson(value: string): unknown {
  const cleaned = value.trim().replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
  return JSON.parse(cleaned)
}

export function parseWorkoutPlan(value: string, preferences: WorkoutPlan['preferences']): WorkoutPlan {
  const parsed = workoutSchema.parse(parseJson(value))
  return {
    planName: parsed.planName, preferences, currentWeekIndex: 0,
    summaryNotes: 'Build consistency with this personalized seven-day training plan. Adjust effort to your recovery.',
    multiWeekSchedules: [parsed.weeklySchedule.map(item => ({
      ...item, dayOfWeek: item.dayOfWeek.charAt(0).toUpperCase() + item.dayOfWeek.slice(1),
      workoutDetails: item.isRestDay ? null : item.workoutDetails!,
    }))],
  }
}

export function parseNutritionPlan(value: string, preferences: NutritionPlan['preferences']): NutritionPlan {
  const parsed = nutritionSchema.parse(parseJson(value))
  const week: WeeklyMealPlan = {} as WeeklyMealPlan
  for (const item of parsed.weeklyMealPlan) {
    const sum = (key: 'calories' | 'protein' | 'carbs' | 'fats') => Math.round(item.meals.reduce((total, entry) => total + entry[key], 0))
    week[item.dayOfWeek] = {
      meals: item.meals, dailyTotalCalories: sum('calories'), dailyTotalProtein: sum('protein'),
      dailyTotalCarbs: sum('carbs'), dailyTotalFats: sum('fats'),
    }
  }
  return {
    planName: parsed.planName, preferences, dailyTargets: parsed.dailyTargets,
    currentWeekIndex: 0, multiWeekMealPlans: [week],
    hydrationRecommendation: 'Keep water available throughout the day and during training.',
    generalTips: ['Review all ingredients and product labels for your dietary needs before preparing a meal.'],
  }
}
