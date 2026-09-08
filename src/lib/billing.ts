import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

export const PRO_PRICE_CENTS = 1200
export function billingConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID && process.env.STRIPE_WEBHOOK_SECRET && process.env.NEXTAUTH_URL)
}

export function stripeClient() {
  if (!billingConfigured()) throw new Error('Billing is not configured')
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { maxNetworkRetries: 2, timeout: 15000 })
}

export function billingOrigin() {
  const url = new URL(process.env.NEXTAUTH_URL!)
  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') throw new Error('HTTPS required')
  return url.origin
}

// Always verify with Stripe. A forged client flag or delayed webhook cannot grant access.
export async function customerSubscriptions(customerId: string) {
  const subscriptions = await stripeClient().subscriptions.list({ customer: customerId, status: 'all', limit: 100 })
  return subscriptions.data.filter(subscription => subscription.items.data.some(item => item.price.id === process.env.STRIPE_PRICE_ID))
}

export async function getMembership(userId: string) {
  if (!billingConfigured()) return { configured: false, pro: false, status: 'unavailable', customer: false, cancelAtPeriodEnd: false }
  const account = await prisma.billingAccount.findUnique({ where: { userId } })
  if (!account) return { configured: true, pro: false, status: 'free', customer: false, cancelAtPeriodEnd: false }
  const subscriptions = await customerSubscriptions(account.stripeCustomerId)
  const active = subscriptions.find(item => item.status === 'active' || item.status === 'trialing')
  const latest = active || subscriptions[0]
  return { configured: true, pro: Boolean(active), status: latest?.status || 'free', customer: true, cancelAtPeriodEnd: latest?.cancel_at_period_end || false }
}
