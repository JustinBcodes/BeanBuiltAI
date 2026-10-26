import { z } from 'zod'

const tags = z.array(z.string().trim().min(1).max(100)).max(30)
const kilograms = z.number().finite().min(9).max(500)
const days = z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])).min(1).max(7)

/** Profile API uses database units: kilograms and centimeters. */
export const metricProfileSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  age: z.number().int().min(13).max(100).optional(),
  sex: z.enum(['male', 'female']).optional(),
  height: z.number().finite().min(90).max(245).optional(),
  weight: kilograms.optional(),
  currentWeight: kilograms.optional(),
  targetWeight: kilograms.optional(),
  goalType: z.enum(['weight_loss', 'muscle_gain', 'general_fitness', 'strength_gain', 'maintenance']).optional(),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  preferredWorkoutDays: days.optional(),
  weakPoints: tags.optional(),
  favoriteFoods: tags.optional(),
  allergies: tags.optional(),
  targetDate: z.string().max(40).refine(value => Number.isFinite(Date.parse(value)), 'Invalid target date').nullable().optional(),
}).strict()

export const weightUpdateSchema = z.object({ weight: kilograms }).strict()
