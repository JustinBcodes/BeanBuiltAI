import { validateMutationRequest, readJsonBody, requestErrorResponse } from '@/lib/api-security'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const rejected = validateMutationRequest(request)
  if (rejected) return rejected
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Reset all user data
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        weight: null,
        age: null,
        sex: null,
        targetWeight: null,
        startingWeight: null,
        preferredWorkoutDays: [],
        height: null,
        goalType: null,
        experienceLevel: null,
        targetDate: null,
        weakPoints: [],
        favoriteFoods: [],
        allergies: [],
        hasCompletedOnboarding: false,
        workoutPlans: {
          deleteMany: {}
        },
        nutritionPlans: {
          deleteMany: {}
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const badRequest = requestErrorResponse(error)
    if (badRequest) return badRequest
    console.error('Error resetting progress:', error)
    return NextResponse.json(
      { error: 'Failed to reset progress' },
      { status: 500 }
    )
  }
}
