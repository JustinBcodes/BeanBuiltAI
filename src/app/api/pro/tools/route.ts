import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { getMembership } from '@/lib/billing'
import { prisma } from '@/lib/prisma'
import { groceryList, workoutCalendar } from '@/lib/pro-tools'
import { isValidNutritionPlan, isValidWorkoutPlan } from '@/lib/validators'

export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
  try {
    const membership = await getMembership(session.user.id)
    if (!membership.pro) return NextResponse.json({ error: 'These tools require BeanBuilt Pro.' }, { status: 403 })
    const params = new URL(request.url).searchParams
    const action = params.get('action') || 'groceries'
    const week = Number(params.get('week') || 0)
    if (!Number.isInteger(week) || week < 0 || week > 51 || !['groceries', 'calendar', 'backup'].includes(action)) return NextResponse.json({ error: 'Invalid tool or week.' }, { status: 400 })
    const [nutrition, workout] = await Promise.all([
      prisma.nutritionPlan.findFirst({ where: { userId: session.user.id }, orderBy: { createdAt: 'desc' } }),
      prisma.workoutPlan.findFirst({ where: { userId: session.user.id }, orderBy: { createdAt: 'desc' } }),
    ])
    const headers = { 'Cache-Control': 'private, no-store' }
    if (action === 'groceries') {
      if (!isValidNutritionPlan(nutrition?.plan) || !nutrition.plan.multiWeekMealPlans[week]) return NextResponse.json({ error: 'Save a nutrition plan for this week first.' }, { status: 404 })
      return NextResponse.json({ items: groceryList(nutrition.plan, week), weeks: nutrition.plan.multiWeekMealPlans.length, planId: nutrition.id }, { headers })
    }
    if (action === 'calendar') {
      if (!isValidWorkoutPlan(workout?.plan) || !workout.plan.multiWeekSchedules[week]) return NextResponse.json({ error: 'Save a workout plan for this week first.' }, { status: 404 })
      let calendar
      try { calendar = workoutCalendar(workout.plan, week, params.get('start') || '', workout.id) }
      catch { return NextResponse.json({ error: 'Choose a valid Monday for your calendar week.' }, { status: 400 }) }
      return new NextResponse(calendar, { headers: { ...headers, 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': 'attachment; filename="beanbuilt-workouts.ics"' } })
    }
    if (!nutrition && !workout) return NextResponse.json({ error: 'Save a plan before exporting.' }, { status: 404 })
    return NextResponse.json({ exportedAt: new Date().toISOString(), workout: workout?.plan || null, nutrition: nutrition?.plan || null }, { headers: { ...headers, 'Content-Disposition': 'attachment; filename="beanbuilt-plans.json"' } })
  } catch {
    return NextResponse.json({ error: 'Your Pro tools could not be loaded. Please retry.' }, { status: 503 })
  }
}
