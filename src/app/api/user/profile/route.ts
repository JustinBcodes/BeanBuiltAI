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

    const userProfile = {
      ...userFromDb,
      currentWeight: userFromDb.weight,
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

    return NextResponse.json({
      name: updatedUser.name,
      email: updatedUser.email,
      height: updatedUser.height,
      weight: updatedUser.weight,
      goalType: updatedUser.goalType,
      experienceLevel: updatedUser.experienceLevel,
      targetWeight: updatedUser.targetWeight,
      targetDate: updatedUser.targetDate
    })
  } catch (error) {
    console.error('Failed to update profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
} 