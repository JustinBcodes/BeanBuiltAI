'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, CreditCard, Loader2, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMembership } from '@/hooks/useMembership'

export default function BillingPage() {
  const { membership, error, loading, reload } = useMembership()
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  async function openBilling(action: 'checkout' | 'portal') {
    setBusy(true); setActionError('')
    try {
      const response = await fetch(`/api/billing/${action}`, { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Billing is unavailable.')
      const destination = new URL(data.url)
      if (destination.protocol !== 'https:' || !['checkout.stripe.com', 'billing.stripe.com'].includes(destination.hostname)) throw new Error('Invalid billing destination.')
      window.location.assign(destination.href)
    } catch (err) { setActionError(err instanceof Error ? err.message : 'Please retry.'); setBusy(false) }
  }
  return <div className="mx-auto max-w-5xl space-y-8 pb-10">
    <div><p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-primary">Your membership</p><h1 className="text-3xl font-bold tracking-tight md:text-4xl">A little more in your corner.</h1><p className="mt-3 max-w-xl text-muted-foreground">Keep building with the essentials. Go Pro when you want more planning power and less busywork.</p></div>
    {loading && <p role="status" className="flex gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Checking your membership…</p>}
    {error && <div role="alert" className="rounded-xl border p-4">{error}<Button variant="link" onClick={() => void reload()}>Retry</Button></div>}
    {membership && <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-5"><span className="flex items-center gap-3"><ShieldCheck className="text-primary" /><span><strong>{membership.pro ? 'BeanBuilt Pro' : 'BeanBuilt Free'}</strong><span className="block text-sm text-muted-foreground">{membership.cancelAtPeriodEnd ? 'Cancellation scheduled. Pro stays available while your subscription is active.' : membership.pro ? 'Your Pro tools are unlocked.' : 'Your core fitness tools are ready.'}</span></span></span><Button variant="outline" size="sm" onClick={() => void reload()} disabled={loading}>Refresh status</Button></div>}
    <div className="grid gap-6 md:grid-cols-2">
      <section className="rounded-3xl border bg-card p-7"><p className="font-semibold">The essentials</p><h2 className="mt-5 text-4xl font-bold">Free</h2><p className="mt-3 text-sm text-muted-foreground">Build your routine, one day at a time.</p><ul className="my-7 space-y-4">{['Starter workout and meal plans', 'Workout and meal completion tracking', 'Weight history and goal tracking', 'Weekly activity dashboard and rest timer'].map(item => <li key={item} className="flex gap-3 text-sm"><Check className="h-4 w-4 shrink-0 text-primary" />{item}</li>)}</ul><Button asChild variant="outline" className="w-full"><Link href="/dashboard">Open dashboard <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></section>
      <section className="relative rounded-3xl border border-primary/50 bg-gradient-to-br from-primary/10 via-card to-card p-7"><span className="flex items-center gap-2 font-semibold text-primary"><Sparkles className="h-5 w-5" />BeanBuilt Pro</span><h2 className="mt-5"><strong className="text-5xl font-bold">$12</strong><span className="text-muted-foreground"> USD / month</span></h2><p className="mt-3 text-sm text-muted-foreground">Everything in Free, plus tools for the week ahead.</p><ul className="my-7 space-y-4">{['AI plan refreshes · 3 requests per 24 hours', 'Grocery lists from your saved meal plan', 'Workout calendar export (.ics)', 'Downloadable workout and nutrition plans'].map(item => <li key={item} className="flex gap-3 text-sm"><Check className="h-4 w-4 shrink-0 text-primary" />{item}</li>)}</ul>{membership?.pro ? <Button asChild className="w-full"><Link href="/pro">Explore Pro tools <ArrowRight className="ml-2 h-4 w-4" /></Link></Button> : <Button className="w-full" disabled={busy || loading || !membership?.configured} onClick={() => void openBilling('checkout')}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}{membership?.configured ? 'Upgrade for $12/month' : 'Pro checkout coming soon'}</Button>}<p className="mt-3 text-xs leading-relaxed text-muted-foreground">Monthly recurring membership. Cancel through Manage billing. {membership?.configured ? 'Payment is handled securely by Stripe.' : 'Checkout is not open yet. No payment is required to use Free.'}</p></section>
    </div>
    {actionError && <p role="alert" className="rounded-xl border border-destructive/40 p-4 text-sm">{actionError}</p>}
    {membership?.customer && <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5"><div><h2 className="font-semibold">You’re in control</h2><p className="mt-1 text-sm text-muted-foreground">Update your payment method, view invoices, or cancel your membership.</p></div><Button variant="outline" disabled={busy} onClick={() => void openBilling('portal')}>Manage billing</Button></div>}
  </div>
}
