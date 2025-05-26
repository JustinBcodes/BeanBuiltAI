import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateNutritionPlan } from '@/lib/openai'
import { validateNutritionPlan, createFallbackNutritionPlan } from '@/lib/validators'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { preferences } = await request.json()
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
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

    // Validate required fields
    const requiredFields = ['age', 'sex', 'height', 'weight', 'goalType', 'experienceLevel'];
    const missingFields = requiredFields.filter(field => !user[field as keyof typeof user]);
    
    if (missingFields.length > 0) {
      console.warn(`Missing user data fields for nutrition plan: ${missingFields.join(', ')}. Using defaults.`);
    }

    try {
      // Generate nutrition plan using OpenAI with safe defaults for any missing data
      const nutritionPlanData = await generateNutritionPlan({
        goalType: user.goalType || 'general health',
        experienceLevel: user.experienceLevel || 'beginner',
        height: user.height || 170, // Default height in cm
        weight: user.weight || 70,  // Default weight in kg
        age: user.age || 30,        // Default age
        sex: user.sex || 'unspecified',
        favoriteFoods: user.favoriteFoods || [],
        allergies: user.allergies || [],
        targetDate: user.targetDate?.toISOString() || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        targetWeight: user.targetWeight || user.weight || 70
      })

      // Validate the nutrition plan structure
      const validatedPlan = validateNutritionPlan(nutritionPlanData)
      if (!validatedPlan) {
        console.error('Generated nutrition plan failed validation, using fallback plan');
        const fallbackPlan = createFallbackNutritionPlan();
        
        // Save the fallback plan
        await prisma.nutritionPlan.create({
          data: {
            userId: user.id,
            plan: fallbackPlan as any,
            startDate: new Date(),
            endDate: user.targetDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        });
        
        return NextResponse.json(fallbackPlan)
      }

      // Save the generated nutrition plan
      const savedPlan = await prisma.nutritionPlan.create({
        data: {
          userId: user.id,
          plan: validatedPlan as any,
          startDate: new Date(),
          endDate: user.targetDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      })

      // Update user's onboarding status
      await prisma.user.update({
        where: { id: user.id },
        data: { hasCompletedOnboarding: true }
      });

      return NextResponse.json(validatedPlan)
    } catch (openaiError) {
      console.error('Error with OpenAI integration:', openaiError);
      // Fallback to a default plan if OpenAI fails
      const fallbackPlan = createFallbackNutritionPlan();
      
      // Save the fallback plan
      await prisma.nutritionPlan.create({
        data: {
          userId: user.id,
          plan: fallbackPlan as any,
          startDate: new Date(),
          endDate: user.targetDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
      
      return NextResponse.json(fallbackPlan)
    }
  } catch (error) {
    console.error('Error generating nutrition plan:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate nutrition plan' },
      { status: 500 }
    )
  }
} 