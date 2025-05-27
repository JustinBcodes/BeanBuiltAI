import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan } = await req.json()
    if (!plan) {
      return NextResponse.json({ error: 'Workout plan is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create a new workout plan
    const workoutPlan = await prisma.workoutPlan.create({
      data: {
        userId: user.id,
        plan: plan as any,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    })

    return NextResponse.json({ workoutPlan })
  } catch (error) {
    console.error('Failed to update workout plan:', error)
    return NextResponse.json(
      { error: 'Failed to update workout plan' },
      { status: 500 }
    )
  }
} 