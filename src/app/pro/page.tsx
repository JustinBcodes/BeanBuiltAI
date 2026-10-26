'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Calendar, Download, ShoppingBasket, Sparkles, Lock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useMembership } from '@/hooks/useMembership'
import { useStore } from '@/store'
import { isValidNutritionPlan, isValidWorkoutPlan } from '@/lib/validators'

type Grocery = { item: string; quantities: string[]; meals: string[] }
export default function ProPage() {
  const { membership, loading, error, reload } = useMembership()
  const [week, setWeek] = useState(0)
  const [start, setStart] = useState('')
  const [groceries, setGroceries] = useState<Grocery[] | null>(null)
  const [checked, setChecked] = useState<string[]>([])
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const nutrition = useStore(state => state.nutritionPlan)
  const workout = useStore(state => state.workoutPlan)
  const weeks = Math.max(nutrition?.multiWeekMealPlans.length || 1, workout?.multiWeekSchedules.length || 1)
  async function tool(action: 'groceries' | 'calendar' | 'backup' | 'refresh') {
    setBusy(action); setMessage('')
    try {
      const response = action === 'refresh'
        ? await fetch('/api/plans/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh: true }) })
        : await fetch(`/api/pro/tools?${new URLSearchParams({ action, week: String(week), start })}`)
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'This tool is unavailable.') }
      if (action === 'groceries') { const data = await response.json(); setGroceries(data.items); setChecked([]) }
      else if (action === 'refresh') {
        const data = await response.json()
        if (!isValidWorkoutPlan(data.workoutPlan) || !isValidNutritionPlan(data.nutritionPlan)) throw new Error('The refreshed plans were incomplete. Please reload your dashboard.')
        useStore.getState().setWorkoutPlan(data.workoutPlan)
        useStore.getState().setNutritionPlan(data.nutritionPlan)
        useStore.getState().initializeProgressFromPlans()
        setGroceries(null); setWeek(0); setMessage('Your new plans are saved. Open your dashboard to get started.')
      } else {
        const url = URL.createObjectURL(await response.blob())
        const link = document.createElement('a'); link.href = url; link.download = action === 'calendar' ? 'beanbuilt-workouts.ics' : 'beanbuilt-plans.json'; link.click()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
        setMessage('Your download is ready.')
      }
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Please retry.') }
    finally { setBusy('') }
  }
  return <div className="mx-auto max-w-5xl space-y-7 pb-10">
    <div><p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-primary">BeanBuilt Pro</p><h1 className="text-3xl font-bold md:text-4xl">Make next week easier.</h1><p className="mt-3 text-muted-foreground">Your plans, ready for the grocery store, your calendar, and whatever comes next.</p></div>
    {loading && <p role="status">Checking membership…</p>}
    {error && <div role="alert">{error}<Button variant="link" onClick={() => void reload()}>Retry</Button></div>}
    {!loading && membership && !membership.pro && <div className="rounded-3xl border border-primary/30 bg-primary/5 p-7"><Lock className="mb-4 text-primary" /><h2 className="text-xl font-semibold">A stronger planning toolkit.</h2><p className="my-3 text-muted-foreground">Unlock these tools with Pro for $12/month. Your existing plans and tracking stay available.</p><Button asChild><Link href="/billing">View membership <Sparkles className="ml-2 h-4 w-4" /></Link></Button></div>}
    <div className="flex flex-wrap items-end gap-4 rounded-2xl border bg-card p-5"><div><Label htmlFor="plan-week">Plan week</Label><select id="plan-week" value={week} onChange={event => { setWeek(Number(event.target.value)); setGroceries(null); setChecked([]) }} className="mt-2 block h-10 min-w-[130px] px-3">{Array.from({ length: weeks }, (_, i) => <option key={i} value={i}>Week {i + 1}</option>)}</select></div><div><Label htmlFor="calendar-start">Calendar week starts (Monday)</Label><Input id="calendar-start" type="date" value={start} onChange={event => setStart(event.target.value)} className="mt-2" /></div></div>
    <div className="grid gap-5 md:grid-cols-3">{[
      { id: 'groceries' as const, icon: ShoppingBasket, title: 'Shop with a plan', copy: 'All the ingredients in your selected meal-plan week, grouped into a checklist.', button: 'Build grocery list' },
      { id: 'calendar' as const, icon: Calendar, title: 'Make room to train', copy: 'Export your selected workout week as all-day events for Apple, Google, or Outlook calendars.', button: 'Export calendar' },
      { id: 'backup' as const, icon: Download, title: 'Take your plans along', copy: 'Download your saved workout and nutrition plans in a portable JSON file.', button: 'Download plans' },
    ].map(item => <section key={item.id} className="flex flex-col rounded-2xl border bg-card p-6"><item.icon className="mb-5 text-primary" /><h2 className="font-semibold">{item.title}</h2><p className="mb-6 mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{item.copy}</p><Button variant="outline" disabled={!membership?.pro || !!busy || (item.id === 'calendar' && !start)} onClick={() => void tool(item.id)}>{busy === item.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{item.button}</Button></section>)}</div>
    <section className="rounded-2xl border bg-gradient-to-r from-primary/10 to-card p-6"><div className="flex flex-wrap items-center justify-between gap-5"><div><h2 className="flex items-center gap-2 font-semibold"><Sparkles className="h-5 w-5 text-primary" />A fresh direction</h2><p className="mt-2 max-w-xl text-sm text-muted-foreground">Generate new AI workout and nutrition plans from your saved profile. This replaces your current plans and restarts their completion tracking. Up to 3 requests every 24 hours.</p></div><Button disabled={!membership?.pro || !!busy} onClick={() => { if (window.confirm('Replace your current workout and nutrition plans and restart their completion tracking?')) void tool('refresh') }}>{busy === 'refresh' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Refresh with AI</Button></div></section>
    {message && <p role="status" className="rounded-xl border p-4 text-sm">{message}</p>}
    {groceries && <section className="rounded-2xl border bg-card p-6"><div className="flex flex-wrap justify-between gap-3"><h2 className="text-xl font-semibold">Your grocery list</h2><p className="text-sm text-primary">{checked.length} / {groceries.length} picked up</p></div><p className="mb-5 mt-2 text-sm text-muted-foreground">Quantities show each recipe’s portion separately. Check ingredients against your dietary needs. Checkmarks last while this page is open.</p>{groceries.length === 0 ? <p>No ingredients found in this week.</p> : <ul className="divide-y">{groceries.map(item => <li key={item.item} className="py-4"><label className="flex cursor-pointer gap-3"><input type="checkbox" checked={checked.includes(item.item)} onChange={event => setChecked(values => event.target.checked ? [...values, item.item] : values.filter(value => value !== item.item))} className="mt-1 h-4 w-4 accent-lime-400" /><span><strong className={checked.includes(item.item) ? 'text-muted-foreground line-through' : ''}>{item.item}</strong><span className="mt-1 block text-sm text-muted-foreground">{item.quantities.join(' + ')}</span><span className="mt-1 block text-xs text-muted-foreground">{item.meals.join(' · ')}</span></span></label></li>)}</ul>}</section>}
  </div>
}
