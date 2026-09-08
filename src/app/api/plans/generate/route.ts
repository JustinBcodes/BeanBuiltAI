import { authorizeAiGeneration } from '@/lib/ai-access'
import { validateMutationRequest, readJsonBody, requestErrorResponse } from '@/lib/api-security'
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateWorkoutPlan, generateNutritionPlan } from '@/lib/openai'; // Using AI generation

// Force dynamic rendering and disable caching for production
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request) {
  const rejected = validateMutationRequest(request)
  if (rejected) return rejected
  try {

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    const body = request.body ? await readJsonBody(request) : {};
    if (!body || typeof body !== 'object' || Array.isArray(body) ||
        Object.keys(body).some(key => key !== 'refresh') ||
        ('refresh' in body && typeof body.refresh !== 'boolean')) {
      return NextResponse.json({ error: 'Expected an optional boolean refresh field.' }, { status: 400 });
    }
    const refresh = 'refresh' in body && body.refresh === true;

    // Authorization always comes from the verified session, never request headers.

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
    const [existingWorkout, existingNutrition] = await Promise.all([
      prisma.workoutPlan.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      prisma.nutritionPlan.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } })
    ])

    // Determine what needs to be generated
    const needsWorkoutPlan = refresh || !existingWorkout
    const needsNutritionPlan = refresh || !existingNutrition

    if (!needsWorkoutPlan && !needsNutritionPlan) {
      return NextResponse.json({
        message: "Plans already exist, no generation needed.",
        workoutPlan: existingWorkout?.plan,
        nutritionPlan: existingNutrition?.plan,
        skipped: true
      });
    }

    // Ensure all required data for plan generation is present
    if (!user.goalType || !user.experienceLevel || !user.weight || !user.height || !user.age || !user.sex) {
        return NextResponse.json(
            { error: 'User profile data is incomplete for AI plan generation. Please update your profile.' },
            { status: 400 }
        );
    }

    const accessDenied = await authorizeAiGeneration(user.id)
    if (accessDenied) return accessDenied

    // Generate only the missing plans
    let newWorkoutPlan = null
    let newNutritionPlan = null

    const generationPromises = []

    if (needsWorkoutPlan) {
      generationPromises.push(
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
        }).then(plan => { newWorkoutPlan = plan })
      )
    }

    if (needsNutritionPlan) {
      generationPromises.push(
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
        }).then(plan => { newNutritionPlan = plan })
      )
    }

    // Wait for all generations to complete
    await Promise.all(generationPromises)

    if ((needsWorkoutPlan && !newWorkoutPlan) || (needsNutritionPlan && !newNutritionPlan)) {
        return NextResponse.json({ error: 'Failed to generate new plans from AI service.' }, { status: 500 });
    }

    // Save only the newly generated plans
    const savePromises = []

    if (needsWorkoutPlan && newWorkoutPlan) {
      savePromises.push(
        prisma.workoutPlan.create({
          data: {
            userId: userId,
            planName: (newWorkoutPlan as any).planName || "AI Generated Workout Plan",
            plan: newWorkoutPlan as any,
            startDate: new Date(),
            endDate: user.targetDate,
          },
        })
      )
    }

    if (needsNutritionPlan && newNutritionPlan) {
      savePromises.push(
        prisma.nutritionPlan.create({
          data: {
            userId: userId,
            planName: (newNutritionPlan as any).planName || "AI Generated Nutrition Plan",
            plan: newNutritionPlan as any,
            startDate: new Date(),
            endDate: user.targetDate,
          },
        })
      )
    }

    await prisma.$transaction(savePromises)

    return NextResponse.json({
        message: `Successfully generated ${needsWorkoutPlan ? 'workout' : ''}${needsWorkoutPlan && needsNutritionPlan ? ' and ' : ''}${needsNutritionPlan ? 'nutrition' : ''} plan(s).`,
        workoutPlan: newWorkoutPlan || existingWorkout?.plan,
        nutritionPlan: newNutritionPlan || existingNutrition?.plan,
        generated: {
          workout: needsWorkoutPlan,
          nutrition: needsNutritionPlan
        }
    });

  } catch (error) {
    const badRequest = requestErrorResponse(error)
    if (badRequest) return badRequest
    console.error('❌ Error in plans generation:', error);
    return NextResponse.json(
      { error: 'Failed to generate plans' },
      { status: 500 }
    );
  }
}