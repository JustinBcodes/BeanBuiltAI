import { metricProfileSchema } from '@/lib/validations/profile'
import { validateMutationRequest, readJsonBody, requestErrorResponse } from '@/lib/api-security'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/user/profile - Fetch current user's profile
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

    // Find user in database
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
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

    if (!user) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      )
    }

    // Transform the data to match the frontend expectations
    // Map 'weight' to 'currentWeight' for compatibility
    const profileData = {
      ...user,
      currentWeight: user.weight,
    }

    // Return user profile data
    return NextResponse.json(profileData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })

  } catch (error) {
    const badRequest = requestErrorResponse(error)
    if (badRequest) return badRequest
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error while fetching profile' },
      { status: 500 }
    )
  }
}

// POST /api/user/profile - Update user's profile
export async function POST(request: NextRequest) {
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

    const result = metricProfileSchema.safeParse(await readJsonBody(request))
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid profile data', details: result.error.flatten() }, { status: 400 })
    }
    const { currentWeight, targetDate, ...fields } = result.data
    const updateData = {
      ...fields,
      ...(currentWeight !== undefined && { weight: currentWeight }),
      ...(targetDate !== undefined && { targetDate: targetDate ? new Date(targetDate) : null }),
    }

    // Ensure we have something to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields provided for update' },
        { status: 400 }
      )
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: {
        email: session.user.email,
      },
      data: {
        ...updateData,
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

    // Transform the response to match frontend expectations
    const responseData = {
      ...updatedUser,
      currentWeight: updatedUser.weight,
    }

    return NextResponse.json(
      {
        message: 'Profile updated successfully',
        user: responseData
      },
      { status: 200 }
    )

  } catch (error) {
    const badRequest = requestErrorResponse(error)
    if (badRequest) return badRequest
    console.error('Error updating user profile:', error)

    // Handle Prisma errors specifically
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error while updating profile' },
      { status: 500 }
    )
  }
}