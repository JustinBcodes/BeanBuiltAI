import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering and disable caching for production
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/user/workout/plan - Fetch user's workout plan from database
export async function GET() {
  try {
    console.log('🔄 Fetching workout plan from database')
    
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

    // Get user ID
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

    // Fetch the most recent workout plan for the user
    const workoutPlan = await prisma.workoutPlan.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        planName: true,
        plan: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!workoutPlan) {
      console.log('📭 No workout plan found for user')
      return NextResponse.json(
        { error: 'No workout plan found' },
        { status: 404 }
      )
    }

    console.log('✅ Workout plan found:', {
      planId: workoutPlan.id,
      planName: workoutPlan.planName,
      createdAt: workoutPlan.createdAt
    })

    // Return the plan data in the expected format
    const planData = {
      ...(typeof workoutPlan.plan === 'object' && workoutPlan.plan !== null ? workoutPlan.plan : {}),
      id: workoutPlan.id,
      planName: workoutPlan.planName,
      startDate: workoutPlan.startDate,
      endDate: workoutPlan.endDate,
      createdAt: workoutPlan.createdAt,
      updatedAt: workoutPlan.updatedAt,
    }

    return NextResponse.json(planData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
    
  } catch (error) {
    console.error('❌ Error fetching workout plan:', error)
    
    return NextResponse.json(
      { error: 'Internal server error while fetching workout plan' },
      { status: 500 }
    )
  }
} 