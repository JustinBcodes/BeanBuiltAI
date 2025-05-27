import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { generateWorkoutPlan, generateNutritionPlan } from '@/lib/openai'; // Using AI generation

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // Fetch the latest, complete user profile from the database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.hasCompletedOnboarding) {
      return NextResponse.json(
        { error: 'Please complete onboarding first.' },
        { status: 400 }
      );
    }

    // Ensure all required data for plan generation is present
    if (!user.goalType || !user.experienceLevel || !user.weight || !user.height || !user.age || !user.sex) {
        return NextResponse.json(
            { error: 'User profile data is incomplete for AI plan generation. Please update your profile.' },
            { status: 400 }
        );
    }

    // Generate both workout and nutrition plans using OpenAI
    const [newWorkoutPlan, newNutritionPlan] = await Promise.all([
      generateWorkoutPlan({
        goalType: user.goalType,
        experienceLevel: user.experienceLevel,
        currentWeight: user.weight, // Weight from DB is in KG
        targetWeight: user.targetWeight || user.weight, // Target weight from DB is in KG
        age: user.age,
        sex: user.sex,
        height: user.height, // Height from DB is in CM
        preferredWorkoutDays: user.preferredWorkoutDays || [],
        weakPoints: user.weakPoints || [],
        targetDate: user.targetDate?.toISOString().split('T')[0],
      }),
      generateNutritionPlan({
        goalType: user.goalType,
        experienceLevel: user.experienceLevel,
        height: user.height, // CM
        weight: user.weight, // KG
        age: user.age,
        sex: user.sex,
        favoriteFoods: user.favoriteFoods || [],
        allergies: user.allergies || [],
        targetWeight: user.targetWeight || user.weight, // KG
        targetDate: user.targetDate?.toISOString().split('T')[0],
      })
    ]);

    if (!newWorkoutPlan || !newNutritionPlan) {
        return NextResponse.json({ error: 'Failed to generate new plans from AI service.' }, { status: 500 });
    }

    // Delete old plans for the user (both workout and nutrition)
    await Promise.all([
        prisma.workoutPlan.deleteMany({ where: { userId: userId } }),
        prisma.nutritionPlan.deleteMany({ where: { userId: userId } })
    ]);

    // Save the newly generated plans
    await Promise.all([
      prisma.workoutPlan.create({
        data: {
          userId: user.id,
          planName: (newWorkoutPlan as any).planName || "AI Generated Workout Plan",
          plan: newWorkoutPlan as any,
          startDate: new Date(),
          endDate: user.targetDate,
        },
      }),
      prisma.nutritionPlan.create({
        data: {
          userId: user.id,
          planName: (newNutritionPlan as any).planName || "AI Generated Nutrition Plan",
          plan: newNutritionPlan as any,
          startDate: new Date(),
          endDate: user.targetDate,
        },
      }),
    ]);

    return NextResponse.json({ 
        message: "AI-powered workout and nutrition plans regenerated successfully.",
        workoutPlan: newWorkoutPlan, 
        nutritionPlan: newNutritionPlan 
    });

  } catch (error) {
    console.error('[API Plans Generate POST] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate plans' },
      { status: 500 }
    );
  }
} 