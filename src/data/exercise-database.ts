export const exerciseDatabase = {
  chest: [
    {
      name: 'Bench Press',
      sets: 3,
      reps: '8-12',
      weight: 'Body Weight',
      rest: '90 seconds',
      equipment: 'Barbell',
      muscleGroup: 'chest',
      caloriesPerSet: 10,
      difficulty: 'Intermediate',
      image: '/exercises/bench-press.jpg',
      instructions: 'Lie on bench, grip barbell slightly wider than shoulder width, lower to chest, push up',
      completed: false
    },
    {
      name: 'Push-ups',
      sets: 3,
      reps: '10-15',
      weight: 'Body Weight',
      rest: '60 seconds',
      equipment: 'None',
      muscleGroup: 'chest',
      caloriesPerSet: 8,
      difficulty: 'Beginner',
      image: '/exercises/push-ups.jpg',
      instructions: 'Start in plank position, lower body until chest nearly touches ground, push back up',
      completed: false
    }
  ],
  back: [
    {
      name: 'Pull-ups',
      sets: 3,
      reps: '8-12',
      weight: 'Body Weight',
      rest: '90 seconds',
      equipment: 'Pull-up Bar',
      muscleGroup: 'back',
      caloriesPerSet: 12,
      difficulty: 'Intermediate',
      image: '/exercises/pull-ups.jpg',
      instructions: 'Hang from bar, pull body up until chin is over bar, lower back down',
      completed: false
    },
    {
      name: 'Bent Over Rows',
      sets: 3,
      reps: '10-12',
      weight: 'Dumbbells',
      rest: '60 seconds',
      equipment: 'Dumbbells',
      muscleGroup: 'back',
      caloriesPerSet: 8,
      difficulty: 'Beginner',
      image: '/exercises/bent-over-rows.jpg',
      instructions: 'Bend at hips and knees, hold dumbbells, pull elbows back',
      completed: false
    }
  ],
  legs: [
    {
      name: 'Squats',
      sets: 3,
      reps: '12-15',
      weight: 'Body Weight',
      rest: '90 seconds',
      equipment: 'None',
      muscleGroup: 'legs',
      caloriesPerSet: 15,
      difficulty: 'Beginner',
      image: '/exercises/squats.jpg',
      instructions: 'Stand with feet shoulder-width, lower body until thighs are parallel to ground',
      completed: false
    },
    {
      name: 'Lunges',
      sets: 3,
      reps: '10 each leg',
      weight: 'Body Weight',
      rest: '60 seconds',
      equipment: 'None',
      muscleGroup: 'legs',
      caloriesPerSet: 10,
      difficulty: 'Beginner',
      image: '/exercises/lunges.jpg',
      instructions: 'Step forward, lower body until both knees are at 90 degrees',
      completed: false
    }
  ],
  shoulders: [
    {
      name: 'Shoulder Press',
      sets: 3,
      reps: '10-12',
      weight: 'Dumbbells',
      rest: '60 seconds',
      equipment: 'Dumbbells',
      muscleGroup: 'shoulders',
      caloriesPerSet: 8,
      difficulty: 'Intermediate',
      image: '/exercises/shoulder-press.jpg',
      instructions: 'Sit with back straight, press dumbbells overhead',
      completed: false
    },
    {
      name: 'Lateral Raises',
      sets: 3,
      reps: '12-15',
      weight: 'Dumbbells',
      rest: '45 seconds',
      equipment: 'Dumbbells',
      muscleGroup: 'shoulders',
      caloriesPerSet: 6,
      difficulty: 'Beginner',
      image: '/exercises/lateral-raises.jpg',
      instructions: 'Stand with dumbbells at sides, raise arms to shoulder height',
      completed: false
    }
  ],
  arms: [
    {
      name: 'Bicep Curls',
      sets: 3,
      reps: '12-15',
      weight: 'Dumbbells',
      rest: '45 seconds',
      equipment: 'Dumbbells',
      muscleGroup: 'arms',
      caloriesPerSet: 6,
      difficulty: 'Beginner',
      image: '/exercises/bicep-curls.jpg',
      instructions: 'Stand with dumbbells, curl arms up while keeping elbows stationary',
      completed: false
    },
    {
      name: 'Tricep Dips',
      sets: 3,
      reps: '10-12',
      weight: 'Body Weight',
      rest: '60 seconds',
      equipment: 'Chair/Bench',
      muscleGroup: 'arms',
      caloriesPerSet: 8,
      difficulty: 'Beginner',
      image: '/exercises/tricep-dips.jpg',
      instructions: 'Support body on chair/bench, lower body by bending elbows',
      completed: false
    }
  ],
  core: [
    {
      name: 'Plank',
      sets: 3,
      reps: '30-60 seconds',
      weight: 'Body Weight',
      rest: '30 seconds',
      equipment: 'None',
      muscleGroup: 'core',
      caloriesPerSet: 5,
      difficulty: 'Beginner',
      image: '/exercises/plank.jpg',
      instructions: 'Hold push-up position with forearms on ground',
      completed: false
    },
    {
      name: 'Crunches',
      sets: 3,
      reps: '15-20',
      weight: 'Body Weight',
      rest: '30 seconds',
      equipment: 'None',
      muscleGroup: 'core',
      caloriesPerSet: 4,
      difficulty: 'Beginner',
      image: '/exercises/crunches.jpg',
      instructions: 'Lie on back, knees bent, lift shoulders off ground',
      completed: false
    }
  ]
} 