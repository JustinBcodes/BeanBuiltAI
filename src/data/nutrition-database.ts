export const nutritionDatabase = {
  breakfast: [
    {
      name: "Protein Oatmeal",
      ingredients: [
        {
          name: "Oats",
          amount: "1 cup",
          calories: 300,
          protein: 10,
          carbs: 54,
          fats: 5
        },
        {
          name: "Protein Powder",
          amount: "1 scoop",
          calories: 120,
          protein: 24,
          carbs: 3,
          fats: 1
        },
        {
          name: "Almond Milk",
          amount: "1 cup",
          calories: 30,
          protein: 1,
          carbs: 1,
          fats: 2.5
        }
      ],
      totalCalories: 450,
      totalProtein: 35,
      totalCarbs: 58,
      totalFats: 8.5,
      prepTime: "5 minutes",
      instructions: "Mix oats with almond milk, cook for 2 minutes, stir in protein powder",
      completed: false
    }
  ],
  lunch: [
    {
      name: "Chicken Salad",
      ingredients: [
        {
          name: "Chicken Breast",
          amount: "6 oz",
          calories: 180,
          protein: 35,
          carbs: 0,
          fats: 4
        },
        {
          name: "Mixed Greens",
          amount: "2 cups",
          calories: 20,
          protein: 2,
          carbs: 4,
          fats: 0
        },
        {
          name: "Olive Oil",
          amount: "1 tbsp",
          calories: 120,
          protein: 0,
          carbs: 0,
          fats: 14
        }
      ],
      totalCalories: 320,
      totalProtein: 37,
      totalCarbs: 4,
      totalFats: 18,
      prepTime: "10 minutes",
      instructions: "Grill chicken, chop vegetables, mix with olive oil",
      completed: false
    }
  ],
  dinner: [
    {
      name: "Salmon with Vegetables",
      ingredients: [
        {
          name: "Salmon Fillet",
          amount: "6 oz",
          calories: 280,
          protein: 34,
          carbs: 0,
          fats: 16
        },
        {
          name: "Broccoli",
          amount: "1 cup",
          calories: 55,
          protein: 3.7,
          carbs: 11.2,
          fats: 0.6
        },
        {
          name: "Brown Rice",
          amount: "1 cup",
          calories: 216,
          protein: 4.5,
          carbs: 45,
          fats: 1.8
        }
      ],
      totalCalories: 551,
      totalProtein: 42.2,
      totalCarbs: 56.2,
      totalFats: 18.4,
      prepTime: "20 minutes",
      instructions: "Bake salmon, steam vegetables, cook rice",
      completed: false
    }
  ],
  snacks: [
    {
      name: "Greek Yogurt with Berries",
      ingredients: [
        {
          name: "Greek Yogurt",
          amount: "1 cup",
          calories: 130,
          protein: 17,
          carbs: 9,
          fats: 0.7
        },
        {
          name: "Mixed Berries",
          amount: "1/2 cup",
          calories: 40,
          protein: 0.5,
          carbs: 10,
          fats: 0.2
        }
      ],
      totalCalories: 170,
      totalProtein: 17.5,
      totalCarbs: 19,
      totalFats: 0.9,
      prepTime: "2 minutes",
      instructions: "Mix yogurt with berries",
      completed: false
    }
  ]
} 