interface WorkoutTip {
  category: string
  tips: string[]
}

export const workoutTips: { [key: string]: WorkoutTip } = {
  strength: {
    category: 'Strength Training',
    tips: [
      'Focus on proper form over heavy weights',
      'Take 2-3 minutes rest between sets for optimal recovery',
      'Progressive overload is key - gradually increase weight or reps',
      'Keep a training log to track your progress',
      'Don\'t skip warm-up sets',
      'Stay hydrated during your workout',
      'Focus on compound movements first',
      'Maintain a neutral spine during lifts',
      'Breathe properly - exhale during exertion',
      'Get adequate protein for muscle recovery'
    ]
  },
  cardio: {
    category: 'Cardio Training',
    tips: [
      'Start with a proper warm-up',
      'Stay hydrated before, during, and after',
      'Monitor your heart rate zones',
      'Mix high and low intensity intervals',
      'Don\'t forget to cool down',
      'Wear proper footwear for your activity',
      'Listen to your body\'s signals',
      'Gradually increase duration and intensity',
      'Cross-train to prevent overuse injuries',
      'Track your progress and adjust accordingly'
    ]
  },
  flexibility: {
    category: 'Flexibility & Mobility',
    tips: [
      'Warm up before stretching',
      'Hold stretches for 30-60 seconds',
      'Don\'t bounce during static stretches',
      'Focus on breathing during stretches',
      'Stretch both sides equally',
      'Don\'t force stretches beyond comfort',
      'Include dynamic stretches in warm-up',
      'Stretch regularly, not just before workouts',
      'Focus on major muscle groups',
      'Consider yoga or mobility work'
    ]
  },
  general: {
    category: 'General Fitness',
    tips: [
      'Stay consistent with your routine',
      'Get adequate sleep for recovery',
      'Eat a balanced diet to support your goals',
      'Stay hydrated throughout the day',
      'Listen to your body and rest when needed',
      'Set realistic, achievable goals',
      'Track your progress regularly',
      'Mix up your routine to prevent plateaus',
      'Focus on proper form and technique',
      'Stay motivated by celebrating small wins'
    ]
  }
}

export function getWorkoutTips(workoutType: string = 'general'): string[] {
  const category = workoutTips[workoutType.toLowerCase()] || workoutTips.general
  return category.tips
} 