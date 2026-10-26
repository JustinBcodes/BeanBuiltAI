import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { getMembership } from '@/lib/billing'

export const dynamic = 'force-dynamic'
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
  try {
    return NextResponse.json(await getMembership(session.user.id), { headers: { 'Cache-Control': 'private, no-store' } })
  } catch {
    return NextResponse.json({ error: 'Membership could not be verified. Please retry.' }, { status: 503 })
  }
}
