import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Convert kg to pounds
const convertToPounds = (kg: number) => kg * 2.20462

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's data including plans and progress
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        workoutPlans: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        },
        nutritionPlans: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate days to goal
    const today = new Date()
    const targetDate = user.targetDate ? new Date(user.targetDate) : null
    const daysToGoal = targetDate ? Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0

    // Get the latest workout and nutrition plans
    const workoutPlan = user.workoutPlans[0]?.plan
    const nutritionPlan = user.nutritionPlans[0]?.plan

    // Extract daily calories from nutrition plan
    const dailyCalories = (nutritionPlan as any)?.dailyTargets?.calories || 0

    // Calculate workout completion percentage
    const workoutCompletion = (workoutPlan as any)?.completedWorkouts 
      ? ((workoutPlan as any).completedWorkouts / (workoutPlan as any).totalWorkouts) * 100 
      : 0

    // Calculate weight progress (convert to pounds)
    const weightProgress = user.weight ? {
      current: convertToPounds(user.weight),
      start: convertToPounds(user.startingWeight || user.weight),
      goal: convertToPounds(user.targetWeight || (user.goalType === 'weight_loss' ? user.weight * 0.9 : user.weight * 1.1)),
      goalType: user.goalType,
      targetDate: user.targetDate
    } : null

    return NextResponse.json({
      hasCompletedOnboarding: user.hasCompletedOnboarding,
      hasWorkoutPlan: !!workoutPlan,
      hasNutritionPlan: !!nutritionPlan,
      workoutPlan,
      nutritionPlan,
      dailyCalories,
      workoutCompletion,
      weightProgress,
      daysToGoal,
      user: {
        name: user.name,
        email: user.email,
        goalType: user.goalType,
        experienceLevel: user.experienceLevel,
        targetWeight: user.targetWeight ? convertToPounds(user.targetWeight) : null,
        startingWeight: user.startingWeight ? convertToPounds(user.startingWeight) : null
      }
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
} 