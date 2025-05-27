import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      console.log('No session or email found')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Checking status for user:', session.user.email)

    // Get user's onboarding status and plans
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        workoutPlans: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        },
        nutritionPlans: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    })

    if (!user) {
      console.log('User not found:', session.user.email)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if plans exist and are not empty
    const hasWorkoutPlan = user.workoutPlans.length > 0 && user.workoutPlans[0].plan
    const hasNutritionPlan = user.nutritionPlans.length > 0 && user.nutritionPlans[0].plan

    console.log('User status:', {
      hasCompletedOnboarding: user.hasCompletedOnboarding,
      hasWorkoutPlan,
      hasNutritionPlan,
      workoutPlanCount: user.workoutPlans.length,
      nutritionPlanCount: user.nutritionPlans.length
    })

    return NextResponse.json({
      hasCompletedOnboarding: user.hasCompletedOnboarding,
      hasWorkoutPlan,
      hasNutritionPlan,
      workoutPlan: hasWorkoutPlan ? user.workoutPlans[0].plan : null,
      nutritionPlan: hasNutritionPlan ? user.nutritionPlans[0].plan : null
    })
  } catch (error) {
    console.error('Error in status endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 