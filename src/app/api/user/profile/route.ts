import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

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
    return NextResponse.json(profileData, { status: 200 })
    
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error while fetching profile' },
      { status: 500 }
    )
  }
}

// POST /api/user/profile - Update user's profile
export async function POST(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - No valid session' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    
    // Validate and sanitize input data
    const allowedFields = [
      'name',
      'hasCompletedOnboarding',
      'age',
      'sex',
      'height',
      'weight', // Map currentWeight to weight
      'targetWeight',
      'startingWeight',
      'goalType',
      'experienceLevel',
      'preferredWorkoutDays',
      'weakPoints',
      'favoriteFoods',
      'allergies',
      'targetDate',
    ]
    
    const updateData: any = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }
    
    // Handle currentWeight mapping to weight
    if (body.currentWeight !== undefined) {
      updateData.weight = body.currentWeight
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