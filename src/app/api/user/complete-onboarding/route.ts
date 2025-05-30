import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering and disable caching for production
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Helper function to generate plans for user if they don't exist
async function generatePlansForUser(userId: string) {
  console.log('🔄 Generating plans for user:', userId)
  
  try {
    // Call the plans generation API internally
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/plans/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Pass the user context for internal API call
        'x-user-id': userId,
      },
    })

    if (!response.ok) {
      console.error('❌ Failed to generate plans:', response.status, response.statusText)
      return false
    }

    const result = await response.json()
    console.log('✅ Plans generated successfully:', result.message)
    return true
  } catch (error) {
    console.error('❌ Error generating plans:', error)
    return false
  }
}

// POST /api/user/complete-onboarding - Mark user as having completed onboarding
export async function POST() {
  try {
    console.log('🔄 Complete onboarding API called')
    
    // Get authenticated session
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      console.log('❌ No valid session found')
      return NextResponse.json(
        { error: 'Unauthorized - No valid session' },
        { status: 401 }
      )
    }

    console.log('✅ Valid session found for:', session.user.email)

    // Get user ID for plan checking
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      console.log('❌ User not found in database')
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      )
    }

    const userId = user.id

    // 🔧 1. Check if plans already exist in DB before regenerating
    console.log('🔍 Checking for existing plans...')
    const [existingWorkout, existingNutrition] = await Promise.all([
      prisma.workoutPlan.findFirst({ where: { userId } }),
      prisma.nutritionPlan.findFirst({ where: { userId } })
    ])

    console.log('📊 Existing plans status:', {
      hasWorkoutPlan: !!existingWorkout,
      hasNutritionPlan: !!existingNutrition,
      workoutPlanId: existingWorkout?.id,
      nutritionPlanId: existingNutrition?.id
    })

    // Only generate plans if they don't exist
    if (!existingWorkout || !existingNutrition) {
      console.log('🚀 Missing plans detected, generating...')
      const plansGenerated = await generatePlansForUser(userId)
      
      if (!plansGenerated) {
        console.warn('⚠️ Plan generation failed, but continuing with onboarding completion')
      }
    } else {
      console.log('✅ Plans already exist, skipping generation')
    }

    // Update user's onboarding status in database using upsert to avoid conflicts
    const updatedUser = await prisma.user.update({
      where: {
        email: session.user.email,
      },
      data: {
        hasCompletedOnboarding: true,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        hasCompletedOnboarding: true,
        age: true,
        sex: true,
        height: true,
        weight: true,
        targetWeight: true,
        startingWeight: true,
        goalType: true,
        experienceLevel: true,
        preferredWorkoutDays: true,
        weakPoints: true,
        favoriteFoods: true,
        allergies: true,
        targetDate: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    console.log('✅ Database updated - hasCompletedOnboarding:', updatedUser.hasCompletedOnboarding)

    // Transform response to match frontend expectations
    const responseData = {
      ...updatedUser,
      currentWeight: updatedUser.weight,
    }

    // Return success with instruction to refresh session
    return NextResponse.json(
      {
        success: true,
        message: 'Onboarding completed successfully',
        user: responseData,
        // Signal that session needs to be updated
        refreshSession: true,
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    )
    
  } catch (error) {
    console.error('❌ Error completing onboarding:', error)
    
    // Handle Prisma errors specifically
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error while completing onboarding' },
      { status: 500 }
    )
  }
} 