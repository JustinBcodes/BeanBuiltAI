import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getMembership } from '@/lib/billing'

/** Reserve usage before any paid AI call; failed attempts also count toward the limit. */
export async function authorizeAiGeneration(userId: string): Promise<NextResponse | null> {
  try {
    const membership = await getMembership(userId)
    if (!membership.pro) {
      return NextResponse.json({ error: 'AI plan generation requires BeanBuilt Pro.', code: 'PRO_REQUIRED' }, { status: 403 })
    }
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const allowed = await prisma.$transaction(async transaction => {
          const count = await transaction.aiGenerationUsage.count({ where: { userId, createdAt: { gte: since } } })
          if (count >= 3) return false
          await transaction.aiGenerationUsage.create({ data: { userId } })
          return true
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
        return allowed ? null : NextResponse.json({
          error: 'You have used your three AI generations in the last 24 hours. Please try again later.',
          code: 'GENERATION_LIMIT',
        }, { status: 429, headers: { 'Retry-After': '86400' } })
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2034' || attempt === 2) throw error
      }
    }
  } catch {
    // Never grant access when payment verification or durable quota storage is unavailable.
    return NextResponse.json({ error: 'AI generation is temporarily unavailable. Please try again later.' }, { status: 503 })
  }
  return NextResponse.json({ error: 'AI generation is temporarily unavailable.' }, { status: 503 })
}
