import { z } from 'zod';

export const onboardingSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.number().int().min(13, "Age must be at least 13").max(100),
  sex: z.enum(['male', 'female']), 
  currentWeight: z.number().min(20).max(350), 
  targetWeight: z.number().min(20).max(350), 
  height: z.number().int().min(36, "Height must be at least 36 inches").max(96, "Height must be at most 96 inches"), 
  goalType: z.enum(['weight_loss', 'muscle_gain', 'general_fitness', 'strength_gain']),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  preferredWorkoutDays: z.array(z.string()).min(1, "At least one workout day is required"),
  weakPoints: z.array(z.string()).optional(),
  favoriteFoods: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  targetDate: z.string().optional().refine((date) => !date || !isNaN(new Date(date).getTime()), "Invalid target date format"),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  age: z.number().int().min(13).max(100).optional(),
  sex: z.enum(['male', 'female']).optional(),
  goalType: z.enum(['weight_loss', 'muscle_gain', 'general_fitness', 'strength_gain', 'maintenance']).optional(),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  currentWeight: z.number().min(20).max(700).optional(),
  targetWeight: z.number().min(20).max(700).optional(),
  height: z.number().int().min(36).max(96).optional(),
  preferredWorkoutDays: z.array(z.string()).min(1).optional(),
  weakPoints: z.array(z.string()).optional(),
  favoriteFoods: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  targetDate: z.string().optional().refine((date) => !date || !isNaN(new Date(date).getTime()), "Invalid target date format"),
});

export type OnboardingData = z.infer<typeof onboardingSchema>;
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;
