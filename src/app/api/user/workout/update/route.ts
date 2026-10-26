import { isValidWorkoutPlan } from '@/lib/validators'
import { validateMutationRequest, readJsonBody, requestErrorResponse } from '@/lib/api-security'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const rejected = validateMutationRequest(req)
  if (rejected) return rejected
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await readJsonBody(req)
    const plan = body && typeof body === 'object' && 'plan' in body ? body.plan : null
    if (!isValidWorkoutPlan(plan) || !plan.multiWeekSchedules.length || plan.multiWeekSchedules.length > 52 ||
        !Number.isInteger(plan.currentWeekIndex) || plan.currentWeekIndex < 0 || plan.currentWeekIndex >= plan.multiWeekSchedules.length) {
      return NextResponse.json({ error: 'A valid workout plan is required' }, { status: 400 })
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
    const badRequest = requestErrorResponse(error)
    if (badRequest) return badRequest
    console.error('Failed to update workout plan:', error)
    return NextResponse.json(
      { error: 'Failed to update workout plan' },
      { status: 500 }
    )
  }
}