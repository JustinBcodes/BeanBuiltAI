import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { billingConfigured, billingOrigin, customerSubscriptions, PRO_PRICE_CENTS, stripeClient } from '@/lib/billing'
import { validateMutationRequest } from '@/lib/api-security'

export const dynamic = 'force-dynamic'
export async function POST(request: Request) {
  const invalid = validateMutationRequest(request)
  if (invalid) return invalid
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
  if (!billingConfigured()) return NextResponse.json({ error: 'Pro checkout is coming soon. Your free tools are ready to use.' }, { status: 503 })
  try {
    const stripe = stripeClient()
    const price = await stripe.prices.retrieve(process.env.STRIPE_PRICE_ID!)
    if (!price.active || price.currency !== 'usd' || price.unit_amount !== PRO_PRICE_CENTS || price.recurring?.interval !== 'month' || price.recurring.interval_count !== 1) {
      return NextResponse.json({ error: 'The monthly plan is temporarily unavailable.' }, { status: 503 })
    }
    let account = await prisma.billingAccount.findUnique({ where: { userId: session.user.id } })
    if (!account) {
      const customer = await stripe.customers.create({ email: session.user.email || undefined, metadata: { userId: session.user.id } }, { idempotencyKey: `beanbuilt-customer-${session.user.id}` })
      account = await prisma.billingAccount.upsert({ where: { userId: session.user.id }, create: { userId: session.user.id, stripeCustomerId: customer.id }, update: {} })
    }
    const customerId = account.stripeCustomerId
    // Serialize checkout creation per account, including concurrent browser tabs.
    const result = await prisma.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${session.user.id}))`
      const current = await tx.billingAccount.findUniqueOrThrow({ where: { userId: session.user.id } })
      const subscriptions = await customerSubscriptions(customerId)
      if (subscriptions.some(item => !['canceled', 'incomplete_expired'].includes(item.status))) return { exists: true, url: null }
      if (current.checkoutSessionId) {
        const existing = await stripe.checkout.sessions.retrieve(current.checkoutSessionId)
        if (existing.status === 'open' && existing.url) return { exists: false, url: existing.url }
        if (existing.status === 'complete') {
          // A completed Checkout may have a subscription still settling.
          const subscriptionId = typeof existing.subscription === 'string' ? existing.subscription : existing.subscription?.id
          if (subscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId)
            if (!['canceled', 'incomplete_expired'].includes(subscription.status)) return { exists: true, url: null }
          }
        }
      }
      const origin = billingOrigin()
      const checkout = await stripe.checkout.sessions.create({
        mode: 'subscription', customer: customerId, client_reference_id: session.user.id,
        line_items: [{ price: price.id, quantity: 1 }],
        success_url: `${origin}/billing?checkout=success`, cancel_url: `${origin}/billing?checkout=canceled`,
        subscription_data: { metadata: { userId: session.user.id } },
      }, { idempotencyKey: `beanbuilt-checkout-${session.user.id}-${current.checkoutSessionId || 'first'}` })
      await tx.billingAccount.update({ where: { userId: session.user.id }, data: { checkoutSessionId: checkout.id } })
      return { exists: false, url: checkout.url }
    }, { timeout: 60000, maxWait: 10000 })
    if (result.exists) return NextResponse.json({ error: 'You already have a subscription. Use Manage billing to update it.' }, { status: 409 })
    return NextResponse.json({ url: result.url })
  } catch {
    return NextResponse.json({ error: 'Checkout is temporarily unavailable. Please try again.' }, { status: 503 })
  }
}
