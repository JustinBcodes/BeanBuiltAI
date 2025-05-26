import { useState, useEffect } from 'react';
import { apiService, WorkoutData } from '@/lib/api';

export const useWorkouts = () => {
  const [workouts, setWorkouts] = useState<WorkoutData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      const data = await apiService.getWorkouts();
      setWorkouts(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch workouts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const logNewWorkout = async (workout: Partial<WorkoutData>) => {
    try {
      const newWorkout = await apiService.logWorkout(workout);
      setWorkouts([newWorkout, ...workouts]);
      return newWorkout;
    } catch (err) {
      setError('Failed to log workout');
      throw err;
    }
  };

  return { workouts, loading, error, logNewWorkout, refreshWorkouts: fetchWorkouts };
}; 