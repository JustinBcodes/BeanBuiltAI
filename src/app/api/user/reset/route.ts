import { validateMutationRequest, readJsonBody, requestErrorResponse } from '@/lib/api-security'
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const rejected = validateMutationRequest(req)
  if (rejected) return rejected
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Start a transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Delete related plans first
      await tx.workoutPlan.deleteMany({
        where: { userId },
      });
      await tx.nutritionPlan.deleteMany({
        where: { userId },
      });

      // Reset user profile fields
      await tx.user.update({
        where: { id: userId },
        data: {
          hasCompletedOnboarding: false,
          age: null,
          sex: null,
          height: null,
          weight: null,
          targetWeight: null,
          startingWeight: null,
          goalType: null,
          experienceLevel: null,
          preferredWorkoutDays: [],
          weakPoints: [],
          favoriteFoods: [],
          allergies: [],
          targetDate: null,
          // Explicitly nullify fields that should be cleared
          // name, email, image are typically kept from Auth provider
        },
      });
    });

    return NextResponse.json({ message: 'User progress and onboarding status reset successfully.' });

  } catch (error) {
    const badRequest = requestErrorResponse(error)
    if (badRequest) return badRequest
    console.error('[API User Reset POST] Error:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred during reset.' },
      { status: 500 }
    );
  }
}