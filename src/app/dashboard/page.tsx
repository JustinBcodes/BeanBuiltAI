'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { motion, useReducedMotion } from 'framer-motion'
import { Activity, Apple, ArrowRight, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Dumbbell, Loader2, Plus, Scale, Sparkles, Target } from 'lucide-react'
import { useStore } from '@/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { RestTimer } from '@/components/dashboard/RestTimer'
import { tips } from '@/lib/tips'

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const pounds = (weight: number) => Math.round(weight * 2.2046226218 * 10) / 10
const percent = (value: number, total: number) => total > 0 ? Math.min(100, Math.max(0, Math.round(value / total * 100))) : 0

export default function DashboardPage() {
  const { profile, workoutPlan, nutritionPlan, workoutProgress, nutritionProgress, weightProgress, generatePlans, updateWeightProgress } = useStore()
  const [weekIndex, setWeekIndex] = useState(workoutPlan?.currentWeekIndex ?? 0)
  const [selectedDay, setSelectedDay] = useState(() => format(new Date(), 'EEEE').toLowerCase())
  const [weightOpen, setWeightOpen] = useState(false)
  const [weightInput, setWeightInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [mounted, setMounted] = useState(false)
  const reducedMotion = useReducedMotion()
  const { toast } = useToast()
  useEffect(() => setMounted(true), [])

  if (!mounted || !profile) return <div className="flex min-h-80 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading dashboard" /></div>
  if (!profile.hasCompletedOnboarding) return <div className="mx-auto flex min-h-96 max-w-lg flex-col items-center justify-center gap-5 text-center"><Target className="h-12 w-12 text-primary" /><h1 className="text-3xl font-semibold">Your next chapter starts here.</h1><p className="text-muted-foreground">Tell us about your goals and build your first workout and meal plans.</p><Button asChild><Link href="/onboarding">Build my plan <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div>

  const totalWeeks = Math.max(workoutPlan?.multiWeekSchedules?.length ?? 0, nutritionPlan?.multiWeekMealPlans?.length ?? 0, 1)
  const activeWeek = Math.min(weekIndex, totalWeeks - 1)
  const workouts = workoutProgress?.weeklySchedule?.[activeWeek] ?? []
  const meals = nutritionProgress?.weeklyMealProgress?.[activeWeek] ?? []
  const workout = workouts.find(day => day.dayOfWeek.toLowerCase() === selectedDay)
  const dayMeals = meals.find(day => day.dayOfWeek.toLowerCase() === selectedDay)
  const completedWorkouts = workouts.filter(day => !day.isRestDay && day.workoutDetails?.completed).length
  const plannedWorkouts = workouts.filter(day => !day.isRestDay && day.workoutDetails).length
  const completedMeals = meals.reduce((sum, day) => sum + day.meals.filter(meal => meal.completed).length, 0)
  const plannedMeals = meals.reduce((sum, day) => sum + day.meals.length, 0)
  const loggedCalories = dayMeals?.meals.reduce((sum, meal) => sum + (meal.completed ? meal.originalCalories ?? 0 : 0), 0) ?? 0
  const calorieTarget = nutritionPlan?.dailyTargets?.calories ?? 0
  const currentWeight = profile.currentWeight ? pounds(profile.currentWeight) : null
  const targetWeight = profile.targetWeight ? pounds(profile.targetWeight) : null
  const history = weightProgress?.weights ?? []
  const startWeight = history[0] ?? profile.currentWeight
  const weightGoalProgress = profile.targetWeight === startWeight ? (profile.currentWeight === profile.targetWeight ? 100 : 0) : percent(Math.abs(startWeight - profile.targetWeight) - Math.abs(profile.currentWeight - profile.targetWeight), Math.abs(startWeight - profile.targetWeight))
  const tipList = Object.values(tips).flatMap(category => category.tips)
  const dailyTip = tipList[Math.floor(Date.now() / 86400000) % tipList.length]
  const today = format(new Date(), 'EEEE').toLowerCase()
  const nextWorkout = [...workouts].sort((a, b) => ((days.indexOf(a.dayOfWeek.toLowerCase()) - days.indexOf(today) + 7) % 7) - ((days.indexOf(b.dayOfWeek.toLowerCase()) - days.indexOf(today) + 7) % 7)).find(day => !day.isRestDay && day.workoutDetails && !day.workoutDetails.completed)

  async function saveWeight(event: React.FormEvent) {
    event.preventDefault()
    const value = Number(weightInput)
    if (!Number.isFinite(value) || value < 20 || value > 1100) {
      toast({ title: 'Check your weight', description: 'Enter a weight between 20 and 1,100 lbs.', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      await updateWeightProgress(value / 2.2046226218)
      setWeightOpen(false)
      setWeightInput('')
      toast({ title: 'Weight saved', description: 'Your latest check-in is ready.' })
    } catch (error) {
      toast({ title: 'Could not save weight', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' })
    } finally { setSaving(false) }
  }

  return <motion.div initial={reducedMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Your training headquarters</p><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Let&apos;s build, {profile.name?.split(' ')[0] || 'you'}.</h1><p className="mt-2 text-sm text-muted-foreground">{format(new Date(), 'EEEE, MMMM d')} · One good decision at a time.</p></div>
      <Button variant="outline" onClick={() => setWeightOpen(true)}><Plus className="mr-2 h-4 w-4" />Log weight</Button>
    </div>

    <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/15 via-card to-card p-6 sm:p-8">
      <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center"><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Next up</p><h2 className="mt-3 text-2xl font-semibold">{nextWorkout?.workoutDetails?.workoutName || (plannedWorkouts > 0 && completedWorkouts === plannedWorkouts ? 'Week complete. Nicely done.' : 'Make room for your next session.')}</h2><p className="mt-2 text-sm text-muted-foreground">{nextWorkout ? `${nextWorkout.dayOfWeek} · ${nextWorkout.workoutDetails?.exercises.length ?? 0} exercises · Week ${activeWeek + 1}` : 'Explore your plan, check in with your progress, and keep moving forward.'}</p></div><Button asChild className="shrink-0"><Link href="/dashboard/workouts">Open workout plan <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div>
    </div>

    <section aria-label="Weekly progress" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[
        { label: 'Workouts completed', value: `${completedWorkouts} / ${plannedWorkouts}`, progress: percent(completedWorkouts, plannedWorkouts), icon: Dumbbell },
        { label: 'Meals logged', value: `${completedMeals} / ${plannedMeals}`, progress: percent(completedMeals, plannedMeals), icon: Apple },
        { label: 'Current weight', value: currentWeight ? `${currentWeight} lbs` : 'No check-in', progress: weightGoalProgress, icon: Scale },
        { label: 'Plan completion', value: `${percent(completedWorkouts + completedMeals, plannedWorkouts + plannedMeals)}%`, progress: percent(completedWorkouts + completedMeals, plannedWorkouts + plannedMeals), icon: Activity },
      ].map(stat => <Card key={stat.label} className="rounded-2xl transition-colors hover:border-primary/40"><CardContent className="p-5"><div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">{stat.label}</p><stat.icon className="h-4 w-4 text-primary" /></div><p className="my-4 text-2xl font-semibold tabular-nums">{stat.value}</p><Progress value={stat.progress} aria-label={stat.label} className="h-1.5" /></CardContent></Card>)}
    </section>

    <Card className="rounded-2xl"><CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3"><div><CardTitle className="flex items-center gap-2 text-lg"><CalendarDays className="h-5 w-5 text-primary" />Your week at a glance</CardTitle><p className="mt-2 text-sm text-muted-foreground">Select a day to see its workout and logged meals.</p></div><div className="flex items-center gap-2"><Button variant="outline" size="icon" aria-label="Previous week" disabled={activeWeek === 0} onClick={() => setWeekIndex(activeWeek - 1)}><ChevronLeft className="h-4 w-4" /></Button><span className="text-sm tabular-nums">Week {activeWeek + 1} / {totalWeeks}</span><Button variant="outline" size="icon" aria-label="Next week" disabled={activeWeek >= totalWeeks - 1} onClick={() => setWeekIndex(activeWeek + 1)}><ChevronRight className="h-4 w-4" /></Button></div></CardHeader><CardContent>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-3">{days.map(day => {
        const training = workouts.find(item => item.dayOfWeek.toLowerCase() === day)
        const food = meals.find(item => item.dayOfWeek.toLowerCase() === day)
        const done = food?.meals.filter(meal => meal.completed).length ?? 0
        return <button key={day} aria-pressed={selectedDay === day} aria-label={`${day}, ${training?.isRestDay ? 'rest day' : training?.workoutDetails?.completed ? 'workout complete' : 'workout not completed'}, ${done} meals logged`} onClick={() => setSelectedDay(day)} className={`min-w-0 rounded-xl border px-1 py-4 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-3 ${selectedDay === day ? 'border-primary bg-primary/10' : 'border-border bg-muted/20 hover:bg-muted/50'}`}><span className={`text-xs font-medium ${day === today ? 'text-primary' : 'text-muted-foreground'}`}>{day.slice(0, 3)}</span><div className="my-3 flex justify-center">{training?.workoutDetails?.completed ? <CheckCircle2 className="h-5 w-5 text-primary" /> : training?.isRestDay ? <span className="text-xs text-muted-foreground">Rest</span> : <Dumbbell className="h-5 w-5 text-muted-foreground" />}</div><div className="mx-auto h-1.5 max-w-12 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all motion-reduce:transition-none" style={{ width: `${percent(done, food?.meals.length ?? 0)}%` }} /></div><span className="mt-2 block text-[10px] text-muted-foreground">{done}/{food?.meals.length ?? 0}</span></button>
      })}</div>
      <p className="mt-3 text-xs text-muted-foreground">Meal bars show logged meals. Highlighted weekday is today. Weeks follow your plan, not calendar dates.</p>
      <div className="mt-6 grid gap-5 md:grid-cols-2"><div className="rounded-xl bg-muted/25 p-5"><p className="text-xs font-medium capitalize text-primary">{selectedDay} · Training</p><h3 className="mt-2 text-lg font-semibold">{workout?.isRestDay ? 'Recovery is part of the plan.' : workout?.workoutDetails?.workoutName || 'No workout planned'}</h3><p className="mt-2 text-sm text-muted-foreground">{workout?.isRestDay ? 'Take your scheduled rest day and return ready for your next session.' : workout?.workoutDetails ? `${workout.workoutDetails.exercises.filter(exercise => exercise.completed).length} of ${workout.workoutDetails.exercises.length} exercises completed` : 'Create your workout plan to see sessions here.'}</p><Button asChild variant="link" className="mt-3 h-auto p-0"><Link href="/dashboard/workouts">View workouts <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div><div className="rounded-xl bg-muted/25 p-5"><p className="text-xs font-medium capitalize text-primary">{selectedDay} · Nutrition</p><h3 className="mt-2 text-lg font-semibold">{Math.round(loggedCalories).toLocaleString()} <span className="text-sm font-normal text-muted-foreground">/ {calorieTarget.toLocaleString()} kcal logged</span></h3><Progress value={percent(loggedCalories, calorieTarget)} className="mt-4 h-2" aria-label="Logged calories" /><p className="mt-2 text-xs text-muted-foreground">Only completed meals count toward this total.</p><Button asChild variant="link" className="mt-3 h-auto p-0"><Link href="/nutrition">Open meal plan <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div></div>
    </CardContent></Card>

    {(!workoutPlan || !nutritionPlan) && <Card className="border-primary/30"><CardContent className="flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center"><div><h2 className="font-semibold">Finish setting up your plans</h2><p className="mt-1 text-sm text-muted-foreground">Generate your workout and nutrition plans from your saved preferences.</p></div><Button disabled={generating} onClick={async () => { setGenerating(true); try { await generatePlans(); toast({ title: 'Your plans are ready' }) } catch { toast({ title: 'Could not generate plans', description: 'Please try again.', variant: 'destructive' }) } finally { setGenerating(false) } }}>{generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Generate plans</Button></CardContent></Card>}

    <div className="grid gap-6 lg:grid-cols-3"><RestTimer /><Card className="rounded-2xl"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Scale className="h-5 w-5 text-primary" />Weight check-ins</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{currentWeight ?? '—'} <span className="text-sm font-normal text-muted-foreground">lbs</span></p><p className="mt-2 text-sm text-muted-foreground">{targetWeight ? `Goal: ${targetWeight} lbs` : 'Set a target in your goals.'}</p><div className="my-5 space-y-3">{history.length ? history.slice(-3).reverse().map((weight, index) => <div key={index} className="flex justify-between border-b border-border/60 pb-2 text-sm"><span className="text-muted-foreground">{weightProgress?.dates[history.length - 1 - index]}</span><span className="font-medium tabular-nums">{pounds(weight)} lbs</span></div>) : <p className="py-4 text-sm text-muted-foreground">Your first check-in starts your history.</p>}</div><Button className="w-full" variant="outline" onClick={() => setWeightOpen(true)}>Add check-in</Button><p className="mt-3 text-xs text-muted-foreground">Latest weight syncs to your account. Check-in history and completion logs are stored on this browser and cleared on sign-out.</p></CardContent></Card><Card className="rounded-2xl border-primary/25 bg-primary/5"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Sparkles className="h-5 w-5 text-primary" />Build your routine</CardTitle></CardHeader><CardContent><p className="text-sm leading-relaxed text-muted-foreground">{dailyTip}</p><div className="mt-6 space-y-2"><Button asChild variant="outline" className="w-full justify-between"><Link href="/goals">Review your goals <Target className="h-4 w-4" /></Link></Button><Button asChild variant="outline" className="w-full justify-between"><Link href="/tips">Explore training tips <ArrowRight className="h-4 w-4" /></Link></Button></div></CardContent></Card></div>

    <Dialog open={weightOpen} onOpenChange={setWeightOpen}><DialogContent><DialogHeader><DialogTitle>Log your weight</DialogTitle><DialogDescription>One check-in per day. Logging again updates today&apos;s entry.</DialogDescription></DialogHeader><form onSubmit={saveWeight}><div className="my-5 space-y-2"><Label htmlFor="check-in-weight">Weight (lbs)</Label><Input autoFocus id="check-in-weight" type="number" inputMode="decimal" min="20" max="1100" step="0.1" required value={weightInput} onChange={event => setWeightInput(event.target.value)} placeholder={currentWeight?.toString() ?? 'Enter your weight'} /></div><DialogFooter><Button type="button" variant="outline" onClick={() => setWeightOpen(false)}>Cancel</Button><Button disabled={saving} type="submit">{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save check-in</Button></DialogFooter></form></DialogContent></Dialog>
  </motion.div>
}
