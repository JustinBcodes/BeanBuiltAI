/**
 * Categorized fitness tips for the BeanBuilt AI app
 * These tips are static and don't require AI generation
 */

export interface TipCategory {
  title: string;
  tips: string[];
}

export const tips: Record<string, TipCategory> = {
  bulking: {
    title: 'Bulking',
    tips: [
      'Eat in a 10–20% calorie surplus to maximize muscle gains',
      'Prioritize compound lifts (squat, bench, deadlift) for overall mass',
      'Consume at least 1.6g-2.2g of protein per kg of bodyweight',
      'Include both slow and fast digesting carbs in your diet',
      'Don\'t neglect healthy fats - aim for 20-35% of calories from fats'
    ]
  },
  cutting: {
    title: 'Cutting',
    tips: [
      'Stay in a 500-calorie deficit for steady, sustainable fat loss',
      'Increase protein intake to preserve muscle mass while cutting',
      'Maintain training intensity, even when reducing volume',
      'Consider adding HIIT or steady-state cardio for extra calorie burn',
      'Plan regular refeed days to boost metabolism and restore glycogen'
    ]
  },
  supplements: {
    title: 'Supplements',
    tips: [
      'Creatine monohydrate (3-5g daily) is safe and effective for strength gains',
      'Use whey protein if you struggle hitting your daily protein goal',
      'Pre-workout supplements can boost performance, but aren\'t necessary',
      'Consider ZMA or magnesium supplements for better sleep and recovery',
      'Vitamin D supplementation is beneficial, especially in winter months'
    ]
  },
  form: {
    title: 'Exercise Form',
    tips: [
      'Keep a neutral spine during compound movements to protect your back',
      'Focus on muscle activation and mind-muscle connection',
      'Record yourself to check form and identify issues',
      'Control the eccentric (lowering) phase for better muscle growth',
      'Proper breathing: exhale during exertion, inhale during the easier phase'
    ]
  },
  recovery: {
    title: 'Recovery',
    tips: [
      'Aim for 7-9 hours of quality sleep for optimal recovery',
      'Active recovery (light activity) can help reduce soreness',
      'Consider foam rolling and stretching for better mobility',
      'Stay well-hydrated to support muscle recovery and nutrient transport',
      'Listen to your body - persistent pain may require medical attention'
    ]
  }
};

/**
 * Function to get tips for a specific category
 */
export function getTipsByCategory(category: string): string[] {
  return tips[category]?.tips || [];
}

/**
 * Function to get all tip categories
 */
export function getAllTipCategories(): string[] {
  return Object.keys(tips);
} 