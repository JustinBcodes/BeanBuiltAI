import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { billingConfigured, customerSubscriptions, stripeClient } from '@/lib/billing'
import { readRawBody } from '@/lib/webhook-body'

export const runtime = 'nodejs'
export async function POST(request: Request) {
  if (!billingConfigured()) return NextResponse.json({ error: 'Billing is not configured.' }, { status: 503 })
  const signature = request.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'Missing signature.' }, { status: 400 })
  const stripe = stripeClient()
  let event
  try {
    event = stripe.webhooks.constructEvent(await readRawBody(request), signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid webhook.' }, { status: 400 })
  }
  try {
    if (['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted', 'checkout.session.completed'].includes(event.type)) {
      const object = event.data.object as { customer?: string | { id: string } | null }
      const customerId = typeof object.customer === 'string' ? object.customer : object.customer?.id
      if (customerId) {
        const account = await prisma.billingAccount.findUnique({ where: { stripeCustomerId: customerId } })
        if (account) {
          // Read current state instead of trusting event ordering; repeated delivery is safe.
          const subscriptions = await customerSubscriptions(customerId)
          const current = subscriptions.find(item => ['active', 'trialing'].includes(item.status)) || subscriptions[0]
          await prisma.billingAccount.update({ where: { userId: account.userId }, data: { subscriptionId: current?.id || null, status: current?.status || 'inactive' } })
        }
      }
    }
    return NextResponse.json({ received: true })
  } catch {
    return NextResponse.json({ error: 'Webhook processing failed. Retry delivery.' }, { status: 500 })
  }
}
