// API service layer
const API_BASE_URL = 'https://api.beanbuilt.ai';

export interface WorkoutData {
  id: string;
  type: string;
  exercise?: string;
  sets?: number;
  reps?: number;
  weight?: number;
  duration: number;
  notes?: string;
  date: string;
  status: 'completed' | 'planned' | 'rest';
}

export interface NutritionData {
  id: string;
  meal: string;
  foodItems: Array<{
    name: string;
    calories: number;
    servingSize: string;
  }>;
  time: string;
  date: string;
}

export interface UserGoal {
  targetWeight: number;
  goalType: 'weight_loss' | 'muscle_gain' | 'maintenance';
  timeframe: string;
  objectives: string;
}

// API services
export const apiService = {
  async getWorkouts(): Promise<WorkoutData[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/workouts`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching workouts:', error);
      return [];
    }
  },

  async logWorkout(workout: Partial<WorkoutData>): Promise<WorkoutData> {
    try {
      const response = await fetch(`${API_BASE_URL}/workouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workout),
      });
      return await response.json();
    } catch (error) {
      console.error('Error logging workout:', error);
      throw error;
    }
  },

  async getNutrition(): Promise<NutritionData[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/nutrition`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
      return [];
    }
  },

  async logNutrition(nutrition: Partial<NutritionData>): Promise<NutritionData> {
    try {
      const response = await fetch(`${API_BASE_URL}/nutrition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nutrition),
      });
      return await response.json();
    } catch (error) {
      console.error('Error logging nutrition:', error);
      throw error;
    }
  },

  async updateGoals(goals: Partial<UserGoal>): Promise<UserGoal> {
    try {
      const response = await fetch(`${API_BASE_URL}/goals`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(goals),
      });
      return await response.json();
    } catch (error) {
      console.error('Error updating goals:', error);
      throw error;
    }
  },
}; 