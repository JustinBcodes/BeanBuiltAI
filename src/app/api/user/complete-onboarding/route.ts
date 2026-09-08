import { validateMutationRequest, readJsonBody, requestErrorResponse } from '@/lib/api-security'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering and disable caching for production
export const dynamic = 'force-dynamic'
export const revalidate = 0

// POST /api/user/complete-onboarding - Mark user as having completed onboarding
export async function POST(request: Request) {
  const rejected = validateMutationRequest(request)
  if (rejected) return rejected
  try {

    // Get authenticated session
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - No valid session' },
        { status: 401 }
      )
    }

    // Get user ID for plan checking
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

    const userId = user.id
    const [existingWorkout, existingNutrition] = await Promise.all([
      prisma.workoutPlan.findFirst({ where: { userId } }),
      prisma.nutritionPlan.findFirst({ where: { userId } })
    ])

    if (!existingWorkout || !existingNutrition) {
      return NextResponse.json({ error: 'Finish onboarding to create both plans before continuing.' }, { status: 409 })
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
    const badRequest = requestErrorResponse(error)
    if (badRequest) return badRequest
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