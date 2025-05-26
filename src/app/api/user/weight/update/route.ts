import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { weight } = await request.json()
    if (!weight || typeof weight !== 'number') {
      return NextResponse.json(
        { error: 'Weight is required and must be a number' },
        { status: 400 }
      )
    }

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
    console.error('Error updating weight:', error)
    return NextResponse.json(
      { error: 'Failed to update weight. Please try again.' },
      { status: 500 }
    )
  }
} 