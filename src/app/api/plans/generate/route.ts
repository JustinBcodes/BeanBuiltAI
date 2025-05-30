import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateWorkoutPlan, generateNutritionPlan } from '@/lib/openai'; // Using AI generation

// Force dynamic rendering and disable caching for production
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request) {
  try {
    console.log('🔄 Plans generation API called')
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('❌ No valid session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // Check for x-user-id header for internal API calls
    const headers = request.headers;
    const internalUserId = headers.get('x-user-id');
    const effectiveUserId = internalUserId || userId;

    console.log('✅ Valid session found for user:', effectiveUserId)

    // Fetch the latest, complete user profile from the database
    const user = await prisma.user.findUnique({
      where: { id: effectiveUserId },
    });

    if (!user) {
      console.log('❌ User not found in database')
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.hasCompletedOnboarding) {
      console.log('❌ User has not completed onboarding')
      return NextResponse.json(
        { error: 'Please complete onboarding first.' },
        { status: 400 }
      );
    }

    // 🔧 Check if plans already exist before generating
    console.log('🔍 Checking for existing plans...')
    const [existingWorkout, existingNutrition] = await Promise.all([
      prisma.workoutPlan.findFirst({ where: { userId: effectiveUserId } }),
      prisma.nutritionPlan.findFirst({ where: { userId: effectiveUserId } })
    ])

    console.log('📊 Existing plans status:', {
      hasWorkoutPlan: !!existingWorkout,
      hasNutritionPlan: !!existingNutrition,
      workoutPlanId: existingWorkout?.id,
      nutritionPlanId: existingNutrition?.id
    })

    // Determine what needs to be generated
    const needsWorkoutPlan = !existingWorkout
    const needsNutritionPlan = !existingNutrition

    if (!needsWorkoutPlan && !needsNutritionPlan) {
      console.log('✅ All plans already exist, skipping generation')
      return NextResponse.json({ 
        message: "Plans already exist, no generation needed.",
        workoutPlan: existingWorkout?.plan, 
        nutritionPlan: existingNutrition?.plan,
        skipped: true
      });
    }

    // Ensure all required data for plan generation is present
    if (!user.goalType || !user.experienceLevel || !user.weight || !user.height || !user.age || !user.sex) {
        console.log('❌ User profile data incomplete')
        return NextResponse.json(
            { error: 'User profile data is incomplete for AI plan generation. Please update your profile.' },
            { status: 400 }
        );
    }

    console.log('🚀 Generating missing plans:', {
      needsWorkout: needsWorkoutPlan,
      needsNutrition: needsNutritionPlan
    })

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
        console.log('❌ Failed to generate required plans')
        return NextResponse.json({ error: 'Failed to generate new plans from AI service.' }, { status: 500 });
    }

    // Save only the newly generated plans
    const savePromises = []

    if (needsWorkoutPlan && newWorkoutPlan) {
      savePromises.push(
        prisma.workoutPlan.create({
          data: {
            userId: effectiveUserId,
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
            userId: effectiveUserId,
            planName: (newNutritionPlan as any).planName || "AI Generated Nutrition Plan",
            plan: newNutritionPlan as any,
            startDate: new Date(),
            endDate: user.targetDate,
          },
        })
      )
    }

    await Promise.all(savePromises)

    console.log('✅ Plans generated and saved successfully')

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
    console.error('❌ Error in plans generation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate plans' },
      { status: 500 }
    );
  }
} 