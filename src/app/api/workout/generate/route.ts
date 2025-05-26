import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateWorkoutPlan } from '@/lib/openai'
import { validateWorkoutPlan, createFallbackWorkoutPlan } from '@/lib/validators'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Enforce rule: Plans can only be generated during onboarding or after a progress reset
    if (user.hasCompletedOnboarding) {
      return NextResponse.json(
        { error: 'Plan generation is only available during onboarding or after a progress reset' },
        { status: 403 }
      )
    }

    // Validate required fields but use defaults instead of returning errors
    const requiredFields = ['goalType', 'experienceLevel', 'weight', 'height', 'age', 'sex'];
    const missingFields = requiredFields.filter(field => !user[field as keyof typeof user]);
    
    if (missingFields.length > 0) {
      console.warn(`Missing user data fields for workout plan: ${missingFields.join(', ')}. Using defaults.`);
    }

    try {
      const newWorkoutPlan = await generateWorkoutPlan({
        goalType: user.goalType || 'general fitness',
        experienceLevel: user.experienceLevel || 'beginner',
        currentWeight: user.weight || 70, // Default weight in kg
        targetWeight: user.targetWeight || user.weight || 70,
        age: user.age || 30, // Default age
        sex: user.sex || 'unspecified',
        height: user.height || 170, // Default height in cm
        preferredWorkoutDays: user.preferredWorkoutDays || [],
        weakPoints: user.weakPoints || [],
        targetDate: user.targetDate?.toISOString().split('T')[0],
      })

      // Validate the workout plan
      const validatedPlan = validateWorkoutPlan(newWorkoutPlan);
      if (!validatedPlan) {
        console.error('Generated workout plan failed validation, using fallback plan');
        const fallbackPlan = createFallbackWorkoutPlan();
        
        // Save the fallback plan
        await prisma.workoutPlan.create({
          data: {
            userId: user.id,
            planName: fallbackPlan.planName,
            plan: fallbackPlan as any,
            startDate: new Date(),
            endDate: user.targetDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default to 30 days if no target date
          },
        });
        
        // Update user's onboarding status
        await prisma.user.update({
          where: { id: user.id },
          data: { hasCompletedOnboarding: true }
        });
        
        return NextResponse.json(fallbackPlan)
      }

      // Clear any previous workout plans
      await prisma.workoutPlan.deleteMany({
        where: { userId: userId },
      })

      const savedPlan = await prisma.workoutPlan.create({
        data: {
          userId: user.id,
          planName: validatedPlan.planName || "Workout Plan",
          plan: validatedPlan as any,
          startDate: new Date(),
          endDate: user.targetDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default to 30 days if no target date
        },
      })

      // Update user's onboarding status
      await prisma.user.update({
        where: { id: user.id },
        data: { hasCompletedOnboarding: true }
      });

      return NextResponse.json(validatedPlan)
    } catch (generationError) {
      console.error('Error generating workout plan:', generationError);
      
      // Use fallback plan if AI generation fails
      const fallbackPlan = createFallbackWorkoutPlan();
      
      // Save the fallback plan
      await prisma.workoutPlan.create({
        data: {
          userId: user.id,
          planName: fallbackPlan.planName,
          plan: fallbackPlan as any,
          startDate: new Date(),
          endDate: user.targetDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default to 30 days if no target date
        },
      });
      
      // Update user's onboarding status
      await prisma.user.update({
        where: { id: user.id },
        data: { hasCompletedOnboarding: true }
      });
      
      return NextResponse.json(fallbackPlan)
    }
  } catch (error) {
    console.error('[API Workout Generate POST] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate workout plan' },
      { status: 500 }
    )
  }
} 