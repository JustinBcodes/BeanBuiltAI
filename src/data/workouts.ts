import { WorkoutPlan, WeeklyWorkoutScheduleItem, WorkoutDetails, WorkoutExercise } from "@/types/plan-types";

// Aligned with WorkoutExercise from plan-types
export interface StaticExerciseDataItem {
  name: string;
  sets: number | string;
  reps: string;
  rest: string; // Added
  notes: string; // Added (can be specific to this exercise instance in a plan)
  equipment?: string;
  muscleGroup?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  // completed will be handled dynamically in the component/store, not part of base library data
  // instructions can be part of WorkoutDay notes or specific exercise notes if needed.
  // For now, instructions on ExerciseDataItem is removed to match WorkoutExercise closer.
}

// Represents a defined day workout in the library (template for WorkoutDetails)
export interface StaticWorkoutDay {
  workoutName: string; // Changed from name, aligns with WorkoutDetails
  exercises: StaticExerciseDataItem[];
  notes?: string; // General notes for this workout template (e.g., "Focus on form")
  warmUp?: string; // Added
  coolDown?: string; // Added
}

export interface WorkoutLibrary {
  push: StaticWorkoutDay[];
  pull: StaticWorkoutDay[];
  legs: StaticWorkoutDay[];
  fullBody: StaticWorkoutDay[];
}

export const workoutLibrary: WorkoutLibrary = {
  push: [
    {
      workoutName: "Push Day - Strength Focus",
      warmUp: "5-10 minutes of light cardio (jogging, jump ropes) followed by dynamic stretches (arm circles, shoulder rotations).",
      exercises: [
        { name: "Barbell Bench Press", sets: 4, reps: "6-8", rest: "90-120s", notes: "Focus on controlled descent and explosive push.", equipment: "Barbell, Bench", muscleGroup: "Chest", difficulty: "Intermediate" },
        { name: "Incline Dumbbell Press", sets: 3, reps: "8-12", rest: "60-90s", notes: "Adjust incline to target upper chest.", equipment: "Dumbbells, Incline Bench", muscleGroup: "Chest", difficulty: "Intermediate" },
        { name: "Overhead Press (Barbell)", sets: 4, reps: "6-8", rest: "90-120s", notes: "Keep core tight, avoid excessive back arch.", equipment: "Barbell", muscleGroup: "Shoulders", difficulty: "Intermediate" },
        { name: "Dumbbell Lateral Raises", sets: 3, reps: "12-15", rest: "45-60s", notes: "Focus on controlled movement, avoid using momentum.", equipment: "Dumbbells", muscleGroup: "Shoulders", difficulty: "Beginner" },
        { name: "Triceps Dips (or Bench Dips)", sets: 3, reps: "8-12", rest: "60-90s", notes: "Go as deep as comfortable while maintaining form.", equipment: "Dip Bars / Bench", muscleGroup: "Triceps", difficulty: "Intermediate" },
        { name: "Triceps Pushdowns (Rope or Bar)", sets: 3, reps: "10-15", rest: "45-60s", notes: "Keep elbows tucked in.", equipment: "Cable Machine", muscleGroup: "Triceps", difficulty: "Beginner" },
      ],
      coolDown: "5-10 minutes of static stretching, holding each stretch for 20-30 seconds (chest, shoulders, triceps).",
      notes: "Rest 90-120 seconds for compound lifts, 60-90 seconds for isolation exercises.",
    },
    // ... More Push day variations with ~25 distinct exercises in total for PUSH type ...
  ],
  pull: [
    {
      workoutName: "Pull Day - Strength Focus",
      warmUp: "5-10 minutes of light cardio (rowing machine, elliptical) followed by dynamic stretches (band pull-aparts, cat-cow).",
      exercises: [
        { name: "Deadlifts (Conventional)", sets: 1, reps: "5", rest: "120-180s", notes: "Maintain neutral spine. Ensure proper form and warm-up sets. Consider only if experienced.", equipment: "Barbell", muscleGroup: "Back", difficulty: "Advanced" },
        { name: "Pull-ups (or Lat Pulldowns)", sets: 4, reps: "6-10", rest: "60-90s", notes: "Full range of motion. If using Lat Pulldown, control the negative.", equipment: "Pull-up Bar / Lat Pulldown Machine", muscleGroup: "Back", difficulty: "Intermediate" },
        { name: "Barbell Rows", sets: 3, reps: "8-12", rest: "60-90s", notes: "Maintain a flat back, pull towards your lower chest.", equipment: "Barbell", muscleGroup: "Back", difficulty: "Intermediate" },
        { name: "Face Pulls", sets: 3, reps: "15-20", rest: "45-60s", notes: "Focus on rear delt and upper back activation.", equipment: "Cable Machine, Rope Attachment", muscleGroup: "Shoulders, Back", difficulty: "Beginner" },
        { name: "Bicep Curls (Dumbbell or Barbell)", sets: 3, reps: "10-15", rest: "45-60s", notes: "Avoid swinging, control the eccentric.", equipment: "Dumbbells / Barbell", muscleGroup: "Biceps", difficulty: "Beginner" },
      ],
      coolDown: "5-10 minutes of static stretching (lats, biceps, traps, lower back).",
      notes: "Focus on squeezing back muscles. Rest appropriately for heavy lifts.",
    },
    // ... More Pull day variations with ~25 distinct exercises for PULL type ...
  ],
  legs: [
    {
      workoutName: "Leg Day - Strength Focus",
      warmUp: "5-10 minutes of light cardio (cycling, incline walk) followed by dynamic stretches (leg swings, bodyweight squats).",
      exercises: [
        { name: "Barbell Squats", sets: 4, reps: "6-8", rest: "120-180s", notes: "Focus on depth and maintaining an upright torso.", equipment: "Barbell, Squat Rack", muscleGroup: "Legs", difficulty: "Intermediate" },
        { name: "Romanian Deadlifts (RDLs)", sets: 3, reps: "8-12", rest: "60-90s", notes: "Focus on hamstring stretch and maintaining a flat back.", equipment: "Barbell / Dumbbells", muscleGroup: "Hamstrings, Glutes", difficulty: "Intermediate" },
        { name: "Leg Press", sets: 3, reps: "10-15", rest: "60-90s", notes: "Control the descent, avoid letting knees cave in.", equipment: "Leg Press Machine", muscleGroup: "Legs", difficulty: "Beginner" },
        { name: "Leg Extensions", sets: 3, reps: "12-15", rest: "45-60s", notes: "Focus on quad contraction at the top.", equipment: "Leg Extension Machine", muscleGroup: "Quads", difficulty: "Beginner" },
        { name: "Hamstring Curls", sets: 3, reps: "12-15", rest: "45-60s", notes: "Control the movement throughout.", equipment: "Hamstring Curl Machine", muscleGroup: "Hamstrings", difficulty: "Beginner" },
        { name: "Calf Raises (Standing or Seated)", sets: 4, reps: "15-20", rest: "30-45s", notes: "Full range of motion, pause at the top.", equipment: "Bodyweight / Machine", muscleGroup: "Calves", difficulty: "Beginner" },
      ],
      coolDown: "5-10 minutes of static stretching (quads, hamstrings, glutes, calves).",
      notes: "Ensure full range of motion and control on all leg exercises.",
    },
    // ... More Legs day variations with ~25 distinct exercises for LEGS type ...
  ],
  fullBody: [
    {
      workoutName: "Full Body Workout A - Beginner",
      warmUp: "5 minutes of light cardio and dynamic movements like torso twists and high knees.",
      exercises: [
        { name: "Goblet Squats", sets: 3, reps: "10-15", rest: "60s", notes: "Keep the dumbbell close to your chest.", equipment: "Dumbbell", muscleGroup: "Legs", difficulty: "Beginner" },
        { name: "Push-ups (or Knee Push-ups)", sets: 3, reps: "As many as possible (AMRAP)", rest: "60s", notes: "Maintain a straight line from head to heels/knees.", equipment: "Bodyweight", muscleGroup: "Chest, Shoulders, Triceps", difficulty: "Beginner" },
        { name: "Dumbbell Rows (Single Arm)", sets: 3, reps: "10-12 per side", rest: "60s", notes: "Support yourself on a bench, pull dumbbell towards hip.", equipment: "Dumbbell, Bench", muscleGroup: "Back, Biceps", difficulty: "Beginner" },
        { name: "Plank", sets: 3, reps: "30-60 seconds hold", rest: "60s", notes: "Keep core engaged, avoid letting hips sag.", equipment: "Bodyweight", muscleGroup: "Core", difficulty: "Beginner" },
        { name: "Overhead Press (Dumbbell)", sets: 3, reps: "10-15", rest: "60s", notes: "Press dumbbells directly overhead.", equipment: "Dumbbells", muscleGroup: "Shoulders", difficulty: "Beginner" }
      ],
      coolDown: "5 minutes of light stretching for all major muscle groups.",
      notes: "Focus on learning form. Rest 60-90s between sets.",
    },
    {
      workoutName: "Full Body Workout B - Beginner",
      warmUp: "5 minutes of light cardio and dynamic movements.",
      exercises: [
        { name: "Romanian Deadlifts (Dumbbells)", sets: 3, reps: "12-15", rest: "60s", notes: "Focus on hip hinge, slight knee bend.", equipment: "Dumbbells", muscleGroup: "Hamstrings, Glutes", difficulty: "Beginner" },
        { name: "Incline Dumbbell Press", sets: 3, reps: "10-15", rest: "60s", notes: "Targets upper chest.", equipment: "Dumbbells, Incline Bench", muscleGroup: "Chest", difficulty: "Beginner" },
        { name: "Lat Pulldowns (or Assisted Pull-ups)", sets: 3, reps: "10-15", rest: "60s", notes: "Focus on pulling with your back.", equipment: "Lat Pulldown Machine / Assisted Pull-up Machine", muscleGroup: "Back", difficulty: "Beginner" },
        { name: "Russian Twists", sets: 3, reps: "15-20 per side", rest: "45s", notes: "Keep core engaged.", equipment: "Bodyweight / Light Weight", muscleGroup: "Core", difficulty: "Beginner" },
        { name: "Bicep Curls (Dumbbells)", sets: 2, reps: "12-15", rest: "45s", notes: "Control the movement.", equipment: "Dumbbells", muscleGroup: "Biceps", difficulty: "Beginner" },
      ],
      coolDown: "5 minutes of light stretching.",
      notes: "Alternate with Full Body Workout A. Rest 60-90s between sets."
    }
  ],
};

const getRandomWorkoutDayTemplate = (category: keyof WorkoutLibrary): StaticWorkoutDay => {
  const categoryWorkouts = workoutLibrary[category];
  if (!categoryWorkouts || categoryWorkouts.length === 0) {
    // Fallback for empty category
    return { workoutName: "Rest Day", exercises: [], warmUp: "N/A", coolDown: "N/A", notes: "No workout defined for this category." };
  }
  const template = categoryWorkouts[Math.floor(Math.random() * categoryWorkouts.length)];
  return JSON.parse(JSON.stringify(template)); // Deep copy
};

interface WorkoutPlanPreferences {
  preferredDays?: string[]; // Example: ['monday', 'wednesday', 'friday'] - not fully implemented for scheduling yet
  workoutSplit?: 'PPL' | 'FullBody' | 'UpperLower' | string; // User's preferred training split
  goalType?: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'strength_gain' | string; // User's primary fitness goal
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced' | string; // User's experience level
}

export const createStaticWorkoutPlan = (preferences?: WorkoutPlanPreferences): WorkoutPlan => {
  try {
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const weeklySchedule: WeeklyWorkoutScheduleItem[] = [];
    
    // Ensure preferences have safe defaults
    const safePreferences = {
      workoutSplit: preferences?.workoutSplit || 'FullBody',
      goalType: preferences?.goalType || 'general_fitness',
      experienceLevel: preferences?.experienceLevel || 'beginner',
      preferredDays: preferences?.preferredDays || []
    };
    
    const splitType = safePreferences.workoutSplit;
    const goal = safePreferences.goalType;

    let workoutSequence: (keyof WorkoutLibrary | 'Rest')[] = [];

    if (splitType === 'PPL') {
      workoutSequence = ['push', 'pull', 'legs', 'Rest', 'push', 'pull', 'legs'];
    } else if (splitType === 'FullBody') {
      workoutSequence = ['fullBody', 'Rest', 'fullBody', 'Rest', 'fullBody', 'Rest', 'Rest'];
    } else if (splitType === 'UpperLower') {
      workoutSequence = ['fullBody', 'Rest', 'fullBody', 'Rest', 'fullBody', 'Rest', 'Rest']; // Fallback to FullBody
    } else {
      workoutSequence = ['fullBody', 'Rest', 'fullBody', 'Rest', 'fullBody', 'Rest', 'Rest']; // Default fallback
    }

    let totalActiveWorkouts = 0;
    let fullBodyTemplateIndex = 0;

    daysOfWeek.forEach((day, index) => {
      const workoutTypeOrRest = workoutSequence[index % workoutSequence.length];

      if (workoutTypeOrRest === 'Rest') {
        weeklySchedule.push({
          dayOfWeek: day,
          isRestDay: true,
          workoutDetails: null,
        });
      } else {
        try {
          let workoutTemplate: StaticWorkoutDay;
          if (workoutTypeOrRest === 'fullBody' && workoutLibrary.fullBody.length > 1) {
            workoutTemplate = JSON.parse(JSON.stringify(workoutLibrary.fullBody[fullBodyTemplateIndex % workoutLibrary.fullBody.length]));
            fullBodyTemplateIndex++;
          } else {
            workoutTemplate = getRandomWorkoutDayTemplate(workoutTypeOrRest as keyof WorkoutLibrary);
          }

          // Validate workoutTemplate
          if (!workoutTemplate || !Array.isArray(workoutTemplate.exercises)) {
            throw new Error(`Invalid workout template for ${workoutTypeOrRest}`);
          }

          // Adjust exercises based on goalType (simplified example)
          const adjustedExercises = workoutTemplate.exercises.map(ex => {
            let reps = ex.reps || '10-12';
            let notes = ex.notes || '';
            if (goal === 'weight_loss') {
              if (ex.reps.includes('-')) {
                const parts = ex.reps.split('-').map(Number);
                reps = `${parts[0] + 2}-${parts[1] + 2}`;
              }
              notes += ' Consider adding 20-30 mins of cardio after this workout.';
            } else if (goal === 'muscle_gain') {
              if (ex.reps.includes('-')) {
                const parts = ex.reps.split('-').map(Number);
                if (parts[0] < 6) reps = `6-${Math.max(parts[1], 10)}`;
              }
              notes += ' Focus on progressive overload: increasing weight or reps over time.';
            }
            return { 
              ...ex, 
              reps, 
              notes: notes.trim(),
              sets: ex.sets || 3,
              rest: ex.rest || '60s',
              equipment: ex.equipment || 'Bodyweight',
              completed: false
            }; 
          });
          
          const workoutDetails: WorkoutDetails = {
            workoutName: workoutTemplate.workoutName || `${workoutTypeOrRest} Workout`,
            warmUp: workoutTemplate.warmUp || "5-10 min light cardio & dynamic stretches",
            exercises: adjustedExercises as WorkoutExercise[],
            coolDown: workoutTemplate.coolDown || "5-10 min static stretches",
          };

          weeklySchedule.push({
            dayOfWeek: day,
            isRestDay: false,
            workoutDetails: workoutDetails,
          });
          totalActiveWorkouts++;
        } catch (error) {
          console.error(`Error creating workout for ${day}:`, error);
          // Fallback to rest day if workout generation fails
          weeklySchedule.push({
            dayOfWeek: day,
            isRestDay: true,
            workoutDetails: null,
          });
        }
      }
    });

    // Ensure we have exactly 7 days
    while (weeklySchedule.length < 7) {
      weeklySchedule.push({
        dayOfWeek: daysOfWeek[weeklySchedule.length],
        isRestDay: true,
        workoutDetails: null,
      });
    }

    const planName = safePreferences.workoutSplit 
      ? `${safePreferences.workoutSplit} Plan (${goal})` 
      : `General Workout Plan (${goal})`;

    const finalPlan: WorkoutPlan = {
      planName: planName,
      multiWeekSchedules: [weeklySchedule],
      currentWeekIndex: 0,
      preferences: safePreferences,
      summaryNotes: goal === 'weight_loss' 
        ? "Focus on maintaining a calorie deficit and consistent training. Stay hydrated!"
        : goal === 'muscle_gain'
        ? "Ensure you are in a slight calorie surplus with adequate protein. Lift progressively heavier!"
        : "Maintain consistency with your workouts and nutrition. Listen to your body.",
      completedWorkouts: 0,
      totalWorkouts: totalActiveWorkouts || 1, // Ensure at least 1
    };

    // Final validation
    if (!Array.isArray(finalPlan.multiWeekSchedules) || finalPlan.multiWeekSchedules.length === 0) {
      throw new Error("Workout plan validation failed: no weeks generated");
    }

    if (!Array.isArray(finalPlan.multiWeekSchedules[0]) || finalPlan.multiWeekSchedules[0].length !== 7) {
      throw new Error("Workout plan validation failed: invalid week structure");
    }

    // Debug log before returning
    console.log("🏋️ createStaticWorkoutPlan created plan:", {
      planName: finalPlan.planName,
      multiWeekSchedulesLength: finalPlan.multiWeekSchedules?.length,
      firstWeekExists: !!finalPlan.multiWeekSchedules?.[0],
      firstWeekIsArray: Array.isArray(finalPlan.multiWeekSchedules?.[0]),
      firstWeekLength: Array.isArray(finalPlan.multiWeekSchedules?.[0]) ? finalPlan.multiWeekSchedules[0].length : 'not array',
      weeklyScheduleLength: weeklySchedule.length,
      weeklyScheduleSample: weeklySchedule.slice(0, 2).map(day => ({
        dayOfWeek: day.dayOfWeek,
        isRestDay: day.isRestDay,
        hasWorkoutDetails: !!day.workoutDetails,
        exerciseCount: day.workoutDetails?.exercises?.length || 0
      }))
    });

    return finalPlan;
  } catch (error) {
    console.error("Error creating workout plan:", error);
    
    // Emergency fallback plan
    const emergencySchedule: WeeklyWorkoutScheduleItem[] = [
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
    ].map(day => ({
      dayOfWeek: day,
      isRestDay: day === 'sunday' || day === 'thursday' ? true : false,
      workoutDetails: day === 'sunday' || day === 'thursday' ? null : {
        workoutName: "Basic Full Body Workout",
        warmUp: "5-10 minutes light movement",
        exercises: [
          { name: "Bodyweight Squats", sets: 3, reps: "10-15", rest: "60s", notes: "Focus on form", equipment: "Bodyweight", completed: false },
          { name: "Push-ups", sets: 3, reps: "5-10", rest: "60s", notes: "Modify as needed", equipment: "Bodyweight", completed: false },
          { name: "Plank", sets: 3, reps: "30-60s", rest: "60s", notes: "Keep core tight", equipment: "Bodyweight", completed: false }
        ],
        coolDown: "5-10 minutes stretching"
      }
    }));

    return {
      planName: "Emergency Workout Plan",
      multiWeekSchedules: [emergencySchedule],
      currentWeekIndex: 0,
      preferences: { workoutSplit: 'FullBody', goalType: 'general_fitness', experienceLevel: 'beginner' },
      summaryNotes: "Emergency plan - please check your profile settings",
      completedWorkouts: 0,
      totalWorkouts: 3,
    };
  }
}; 