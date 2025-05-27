import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userFromDb = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        age: true,
        sex: true,
        height: true,
        weight: true,
        targetWeight: true,
        goalType: true,
        experienceLevel: true,
        preferredWorkoutDays: true,
        hasCompletedOnboarding: true,
        targetDate: true,
      }
    })

    if (!userFromDb) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Convert the DB format to match the Profile interface
    const userProfile = {
      id: userFromDb.id,
      email: userFromDb.email || session.user.email || '',
      name: userFromDb.name || '',
      age: userFromDb.age || 25,
      sex: userFromDb.sex || 'male',
      height: userFromDb.height || 70,
      currentWeight: userFromDb.weight || 150,
      targetWeight: userFromDb.targetWeight || 140,
      goalType: userFromDb.goalType || 'general_fitness',
      experienceLevel: userFromDb.experienceLevel || 'beginner',
      preferredWorkoutDays: userFromDb.preferredWorkoutDays || ['monday', 'wednesday', 'friday'],
      hasCompletedOnboarding: userFromDb.hasCompletedOnboarding || false,
    };

    return NextResponse.json(userProfile)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await req.json()
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: data.name,
        height: data.height,
        weight: data.weight,
        goalType: data.goalType,
        experienceLevel: data.experienceLevel,
        targetWeight: data.targetWeight,
        targetDate: data.targetDate
      }
    })

    // Return in the same format as GET
    const userProfile = {
      id: updatedUser.id,
      email: updatedUser.email || session.user.email || '',
      name: updatedUser.name || '',
      age: updatedUser.age || 25,
      sex: updatedUser.sex || 'male',
      height: updatedUser.height || 70,
      currentWeight: updatedUser.weight || 150,
      targetWeight: updatedUser.targetWeight || 140,
      goalType: updatedUser.goalType || 'general_fitness',
      experienceLevel: updatedUser.experienceLevel || 'beginner',
      preferredWorkoutDays: updatedUser.preferredWorkoutDays || ['monday', 'wednesday', 'friday'],
      hasCompletedOnboarding: updatedUser.hasCompletedOnboarding || false,
    };

    return NextResponse.json(userProfile)
  } catch (error) {
    console.error('Failed to update profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
} 