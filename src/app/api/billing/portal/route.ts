import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { billingConfigured, billingOrigin, stripeClient } from '@/lib/billing'
import { validateMutationRequest } from '@/lib/api-security'

export async function POST(request: Request) {
  const invalid = validateMutationRequest(request)
  if (invalid) return invalid
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
  if (!billingConfigured()) return NextResponse.json({ error: 'Billing is not available yet.' }, { status: 503 })
  try {
    const account = await prisma.billingAccount.findUnique({ where: { userId: session.user.id } })
    if (!account) return NextResponse.json({ error: 'No billing account found.' }, { status: 404 })
    const portal = await stripeClient().billingPortal.sessions.create({ customer: account.stripeCustomerId, return_url: `${billingOrigin()}/billing` })
    return NextResponse.json({ url: portal.url })
  } catch {
    return NextResponse.json({ error: 'The billing portal is unavailable. Please retry.' }, { status: 503 })
  }
}
