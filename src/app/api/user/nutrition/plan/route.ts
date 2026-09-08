import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering and disable caching for production
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/user/nutrition/plan - Fetch user's nutrition plan from database
export async function GET() {
  try {

    // Get authenticated session
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - No valid session' },
        { status: 401 }
      )
    }

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      )
    }

    // Fetch the most recent nutrition plan for the user
    const nutritionPlan = await prisma.nutritionPlan.findFirst({
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

    if (!nutritionPlan) {
      return NextResponse.json(
        { error: 'No nutrition plan found' },
        { status: 404 }
      )
    }

    // Return the plan data in the expected format
    const planData = {
      ...(typeof nutritionPlan.plan === 'object' && nutritionPlan.plan !== null ? nutritionPlan.plan : {}),
      id: nutritionPlan.id,
      planName: nutritionPlan.planName,
      startDate: nutritionPlan.startDate,
      endDate: nutritionPlan.endDate,
      createdAt: nutritionPlan.createdAt,
      updatedAt: nutritionPlan.updatedAt,
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
    console.error('❌ Error fetching nutrition plan:', error)

    return NextResponse.json(
      { error: 'Internal server error while fetching nutrition plan' },
      { status: 500 }
    )
  }
}