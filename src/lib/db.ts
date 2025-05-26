import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function getUserData(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      workoutPlans: true,
      nutritionPlans: true
    }
  });
}

export async function createUser(data: any) {
  return await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      age: data.age,
      sex: data.sex,
      height: data.height,
      weight: data.currentWeight,
      targetWeight: data.targetWeight,
      startingWeight: data.currentWeight,
      goalType: data.goalType,
      experienceLevel: data.experienceLevel,
      weakPoints: data.weakPoints || [],
      favoriteFoods: data.favoriteFoods || [],
      allergies: data.allergies || [],
      preferredWorkoutDays: data.preferredWorkoutDays || [],
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
      hasCompletedOnboarding: true
    }
  });
}

export async function updateUserProfile(userId: string, data: any) {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      age: data.age,
      height: data.height,
      weight: data.currentWeight,
      targetWeight: data.targetWeight,
      goalType: data.goalType,
      experienceLevel: data.experienceLevel,
      preferredWorkoutDays: data.preferredWorkoutDays,
      updatedAt: new Date()
    }
  });
}

export async function createWorkoutPlan(userId: string, planData: any) {
  return await prisma.workoutPlan.create({
    data: {
      userId,
      planName: planData.planName || 'Workout Plan',
      plan: planData,
      startDate: new Date(),
      endDate: planData.endDate ? new Date(planData.endDate) : null
    }
  });
}

export async function createNutritionPlan(userId: string, planData: any) {
  return await prisma.nutritionPlan.create({
    data: {
      userId,
      planName: planData.planName || 'Nutrition Plan',
      plan: planData,
      startDate: new Date(),
      endDate: planData.endDate ? new Date(planData.endDate) : null
    }
  });
}

export async function updateUserWeight(userId: string, weight: number) {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      weight: weight,
      updatedAt: new Date()
    }
  });
} 