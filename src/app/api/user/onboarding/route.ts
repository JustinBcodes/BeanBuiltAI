import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createStaticWorkoutPlan } from '@/data/workouts'
import { createStaticNutritionPlan } from '@/data/meals'
import { z } from 'zod'

// Zod schema for onboarding data validation
const onboardingSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.number().int().min(13, "Age must be at least 13").max(100),
  sex: z.enum(['male', 'female']), // Adjust if other values are supported by your models/logic
  currentWeight: z.number().min(20).max(350), // lbs
  targetWeight: z.number().min(20).max(350), // lbs
  height: z.number().int().min(36, "Height must be at least 36 inches (3ft)").max(96, "Height must be at most 96 inches (8ft)"), // total inches from form
  goalType: z.enum(['weight_loss', 'muscle_gain', 'general_fitness', 'strength_gain']),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  preferredWorkoutDays: z.array(z.string()).min(1, "At least one workout day is required"),
  // Optional fields - to be added to form later for full personalization
  weakPoints: z.array(z.string()).optional(),
  favoriteFoods: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  targetDate: z.string().optional().refine((date) => !date || !isNaN(new Date(date).getTime()), "Invalid target date format"),
});

export async function POST(req: Request) {
  let sessionUser = null; // For potential rollback
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) { // Check for user.id from session
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    sessionUser = session.user; // Store for potential rollback

    const rawData = await req.json();
    const validationResult = onboardingSchema.safeParse(rawData);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: validationResult.error.flatten() }, { status: 400 });
    }

    const data = validationResult.data;
    
    const weightInKg = data.currentWeight * 0.453592;
    const targetWeightInKg = data.targetWeight * 0.453592;
    const heightInCm = Math.round(data.height * 2.54); // Convert inches to CM and round
    const finalTargetDate = data.targetDate ? new Date(data.targetDate) : undefined;

    const userUpdateData = {
      name: data.name,
      age: data.age,
      sex: data.sex,
      height: heightInCm, // Store height in CM as it's used by plan generation
      weight: weightInKg,
      goalType: data.goalType,
      experienceLevel: data.experienceLevel,
      hasCompletedOnboarding: true,
      startingWeight: weightInKg, // Storing as kg
      targetWeight: targetWeightInKg, // Storing as kg
      preferredWorkoutDays: data.preferredWorkoutDays, // Added, ensure Prisma schema supports String[] or JSON
      ...(data.weakPoints && { weakPoints: data.weakPoints }),
      ...(data.favoriteFoods && { favoriteFoods: data.favoriteFoods }),
      ...(data.allergies && { allergies: data.allergies }),
      ...(finalTargetDate && { targetDate: finalTargetDate }),
    };

    const user = await prisma.user.update({
      where: { id: session.user.id }, // Use user.id from session
      data: userUpdateData
    });

    // Plan Generation using static generators
    const [workoutPlan, nutritionPlan] = await Promise.all([
      createStaticWorkoutPlan({
        goalType: data.goalType,
        experienceLevel: data.experienceLevel,
        workoutSplit: data.experienceLevel === 'beginner' ? 'FullBody' : 'PPL',
        preferredDays: data.preferredWorkoutDays,
      }),
      createStaticNutritionPlan({
        goalType: data.goalType,
        currentWeight: weightInKg,
        height: heightInCm,
        age: data.age,
        sex: data.sex,
      })
    ]);

    if (!workoutPlan || !nutritionPlan) {
      // Rollback onboarding status if plan generation fails critically
      await prisma.user.update({
        where: { id: session.user.id },
        data: { hasCompletedOnboarding: false }
      });
      return NextResponse.json({ error: 'Failed to generate workout or nutrition plan' }, { status: 500 });
    }

    // Save plans
    await Promise.all([
      prisma.workoutPlan.create({
        data: {
          userId: user.id,
          planName: (workoutPlan as any).planName || "Generated Workout Plan",
          plan: workoutPlan as any, // Changed from planData to plan
          startDate: new Date(),
          ...(finalTargetDate && { endDate: finalTargetDate }), // Set endDate if targetDate is available
        }
      }),
      prisma.nutritionPlan.create({
        data: {
          userId: user.id,
          planName: (nutritionPlan as any).planName || "Generated Nutrition Plan",
          plan: nutritionPlan as any, // Changed from planData to plan
          startDate: new Date(),
          ...(finalTargetDate && { endDate: finalTargetDate }), // Set endDate if targetDate is available
        }
      })
    ]);

    return NextResponse.json({ 
      message: 'Onboarding successful and plans generated',
      user, // Send back updated user 
      workoutPlan, // Added workoutPlan to response
      nutritionPlan // Added nutritionPlan to response
    });

  } catch (error) {
    console.error('[API Onboarding POST] Error:', error);
    // Attempt to rollback onboarding status if an unexpected error occurs before plans are generated
    // but after user might have been marked as completed (though Zod validation is first)
    if (sessionUser?.id && error instanceof Error && !(error.message.includes("Failed to generate"))) {
        try {
            const userCheck = await prisma.user.findUnique({ where: {id: sessionUser.id }, select: { hasCompletedOnboarding: true }});
            if(userCheck?.hasCompletedOnboarding) {
                 await prisma.user.update({ where: { id: sessionUser.id }, data: { hasCompletedOnboarding: false }});
                 console.log(`[API Onboarding POST] Rolled back hasCompletedOnboarding for user ${sessionUser.id}`);
            }
        } catch (rollbackError) {
            console.error("[API Onboarding POST] Rollback error:", rollbackError);
        }
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An internal server error occurred' },
      { status: 500 }
    );
  }
}

// Basic Zod schema for profile update (can be expanded)
const profileUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  age: z.number().int().min(13).max(100).optional(),
  sex: z.enum(['male', 'female']).optional(),
  goalType: z.enum(['weight_loss', 'muscle_gain', 'general_fitness', 'strength_gain', 'maintenance']).optional(),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  currentWeight: z.number().min(20).max(700).optional(),
  targetWeight: z.number().min(20).max(700).optional(),
  height: z.number().int().min(36).max(96).optional(),
  preferredWorkoutDays: z.array(z.string()).min(1).optional(),
  weakPoints: z.array(z.string()).optional(),
  favoriteFoods: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  targetDate: z.string().optional().refine((date) => !date || !isNaN(new Date(date).getTime()), "Invalid target date format"),
});

const PLAN_AFFECTING_FIELDS: (keyof z.infer<typeof profileUpdateSchema>)[] = [
  'age', 'sex', 'goalType', 'experienceLevel', 'currentWeight', 'targetWeight', 'height', 'preferredWorkoutDays'
];

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const currentUserState = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!currentUserState) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const rawData = await req.json();
    const validationResult = profileUpdateSchema.safeParse(rawData);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: validationResult.error.flatten() }, { status: 400 });
    }
    
    const dataToUpdate = validationResult.data;
    const updatePayload: Record<string, any> = {};
    let shouldRegeneratePlans = false;

    for (const key in dataToUpdate) {
      if (Object.prototype.hasOwnProperty.call(dataToUpdate, key) && (dataToUpdate as any)[key] !== undefined) {
        const formValue = (dataToUpdate as any)[key];
        let comparisonValue = formValue;

        if (key === 'currentWeight') {
          updatePayload.weight = formValue * 0.453592; // KG for DB
          comparisonValue = updatePayload.weight;
          if (currentUserState.weight !== comparisonValue && PLAN_AFFECTING_FIELDS.includes(key as any)) {
             shouldRegeneratePlans = true;
          }
        } else if (key === 'targetWeight') {
          updatePayload.targetWeight = formValue * 0.453592; // KG for DB
          comparisonValue = updatePayload.targetWeight;
          if (currentUserState.targetWeight !== comparisonValue && PLAN_AFFECTING_FIELDS.includes(key as any)) {
            shouldRegeneratePlans = true;
          }
        } else if (key === 'height') {
          updatePayload.height = Math.round(formValue * 2.54); // CM for DB
          comparisonValue = updatePayload.height;
          if (currentUserState.height !== comparisonValue && PLAN_AFFECTING_FIELDS.includes(key as any)) {
            shouldRegeneratePlans = true;
          }
        } else if (key === 'targetDate') {
          updatePayload.targetDate = formValue ? new Date(formValue) : null;
          // Note: targetDate changes alone might not trigger full plan regen unless other fields also change.
          // The PLAN_AFFECTING_FIELDS check handles this implicitly if targetDate is not in it.
        } else if (key === 'preferredWorkoutDays') {
          // Use preferredWorkoutDays directly for Prisma, as it matches the schema
          updatePayload.preferredWorkoutDays = formValue; 
          
          // Check if preferredWorkoutDays actually changed for plan regeneration
          const currentDays = currentUserState.preferredWorkoutDays || [];
          const newDays = formValue || [];
          if (JSON.stringify(currentDays.sort()) !== JSON.stringify(newDays.sort())) {
            shouldRegeneratePlans = true;
          }
        } else {
          updatePayload[key] = formValue; // For all other keys
          // Check for plan regeneration for other PLAN_AFFECTING_FIELDS
          if (PLAN_AFFECTING_FIELDS.includes(key as any)) {
             // This check is for fields other than preferredWorkoutDays, currentWeight, targetWeight, height which are handled above/below
             // For simple scalar types:
            if ((currentUserState as any)[key] !== formValue) {
              shouldRegeneratePlans = true;
            }
          }
        }
      }
    }

    // Specific checks for weight/height conversions and their impact on shouldRegeneratePlans
    // These were done before, but let's ensure they are consolidated here if they modify updatePayload directly
    if (dataToUpdate.currentWeight !== undefined) {
        const newWeightKg = dataToUpdate.currentWeight * 0.453592;
        updatePayload.weight = newWeightKg;
        if (currentUserState.weight !== newWeightKg) {
            shouldRegeneratePlans = true;
        }
    }
    if (dataToUpdate.targetWeight !== undefined) {
        const newTargetWeightKg = dataToUpdate.targetWeight * 0.453592;
        updatePayload.targetWeight = newTargetWeightKg;
        if (currentUserState.targetWeight !== newTargetWeightKg) {
            shouldRegeneratePlans = true;
        }
    }
    if (dataToUpdate.height !== undefined) {
        const newHeightCm = Math.round(dataToUpdate.height * 2.54);
        updatePayload.height = newHeightCm;
        if (currentUserState.height !== newHeightCm) {
            shouldRegeneratePlans = true;
        }
    }

    // Ensure other direct PLAN_AFFECTING_FIELDS that don't need conversion also trigger regen if changed
    for (const pKey of PLAN_AFFECTING_FIELDS) {
        if (pKey !== 'currentWeight' && pKey !== 'targetWeight' && pKey !== 'height' && pKey !== 'preferredWorkoutDays') {
            if (dataToUpdate[pKey] !== undefined && (currentUserState as any)[pKey] !== dataToUpdate[pKey]) {
                shouldRegeneratePlans = true;
                if (!updatePayload[pKey]) updatePayload[pKey] = dataToUpdate[pKey]; // Ensure it's in updatePayload if not already
            }
        }
    }

    if (Object.keys(updatePayload).length === 0) {
        return NextResponse.json({ message: "No valid fields provided for update" }, { status: 400 });
    }

    const updatedUserPrisma = await prisma.user.update({
      where: { id: userId },
      data: updatePayload,
    });

    if (shouldRegeneratePlans && updatedUserPrisma.hasCompletedOnboarding) {
      // Fetch the fully updated user to pass to plan generation
      const userForPlanGen = await prisma.user.findUnique({ where: { id: userId } });
      if (!userForPlanGen || !userForPlanGen.age || !userForPlanGen.sex || !userForPlanGen.height || !userForPlanGen.weight || !userForPlanGen.goalType || !userForPlanGen.experienceLevel) {
        // This case should ideally not happen if onboarding is complete and fields are set.
        console.error("User data incomplete for plan regeneration after update. User data:", JSON.stringify(userForPlanGen));
        return NextResponse.json({ message: "Profile updated, but plans not regenerated due to incomplete data.", user: updatedUserPrisma });
      }
      
      // Delete old plans
      await prisma.workoutPlan.deleteMany({ where: { userId } });
      await prisma.nutritionPlan.deleteMany({ where: { userId } });

      const [newWorkoutPlan, newNutritionPlan] = await Promise.all([
        createStaticWorkoutPlan({
          goalType: userForPlanGen.goalType,
          experienceLevel: userForPlanGen.experienceLevel,
          workoutSplit: userForPlanGen.experienceLevel === 'beginner' ? 'FullBody' : 'PPL',
          preferredDays: userForPlanGen.preferredWorkoutDays || [],
        }),
        createStaticNutritionPlan({
          goalType: userForPlanGen.goalType,
          currentWeight: userForPlanGen.weight,
          height: userForPlanGen.height,
          age: userForPlanGen.age,
          sex: userForPlanGen.sex,
        })
      ]);

      console.log("[API Profile PUT] Generated Workout Plan:", JSON.stringify(newWorkoutPlan, null, 2));
      console.log("[API Profile PUT] Generated Nutrition Plan:", JSON.stringify(newNutritionPlan, null, 2));

      if (!newWorkoutPlan || !newNutritionPlan) {
        // Log error, but user profile is already updated. Don't roll back user update.
        console.error("Failed to regenerate plans after profile update for user (OpenAI returned null/undefined):", userId);
        return NextResponse.json({ 
          message: 'Profile updated, but failed to regenerate plans.', 
          user: updatedUserPrisma 
        }, { status: 200 }); // Success for profile update, but partial for plans
      }

      await Promise.all([
        prisma.workoutPlan.create({ data: { userId, planName: (newWorkoutPlan as any).planName || "Updated Workout Plan", plan: newWorkoutPlan as any, startDate: new Date(), endDate: userForPlanGen.targetDate } }),
        prisma.nutritionPlan.create({ data: { userId, planName: (newNutritionPlan as any).planName || "Updated Nutrition Plan", plan: newNutritionPlan as any, startDate: new Date(), endDate: userForPlanGen.targetDate } })
      ]);

      return NextResponse.json({ 
        message: "Profile updated and plans regenerated successfully", 
        user: updatedUserPrisma, 
        workoutPlan: newWorkoutPlan, 
        nutritionPlan: newNutritionPlan 
      });
    }

    return NextResponse.json({ message: "Profile updated successfully", user: updatedUserPrisma });

  } catch (error) {
    console.error('[API Profile PUT] Error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
} 