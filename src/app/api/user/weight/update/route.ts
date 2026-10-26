import { weightUpdateSchema } from '@/lib/validations/profile'
import { validateMutationRequest, readJsonBody, requestErrorResponse } from '@/lib/api-security'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const rejected = validateMutationRequest(request)
  if (rejected) return rejected
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = weightUpdateSchema.safeParse(await readJsonBody(request))
    if (!result.success) return NextResponse.json({ error: 'Enter a valid weight in kilograms' }, { status: 400 })
    const { weight } = result.data

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update the user's weight
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { weight: weight }
    })

    return NextResponse.json({
      message: 'Weight updated successfully',
      weight: updatedUser.weight
    })
  } catch (error) {
    const badRequest = requestErrorResponse(error)
    if (badRequest) return badRequest
    console.error('Error updating weight:', error)
    return NextResponse.json(
      { error: 'Failed to update weight. Please try again.' },
      { status: 500 }
    )
  }
}