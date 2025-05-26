import { useState, useEffect } from 'react';
import { apiService, NutritionData } from '@/lib/api';

export const useNutrition = () => {
  const [nutritionData, setNutritionData] = useState<NutritionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNutrition = async () => {
    try {
      setLoading(true);
      const data = await apiService.getNutrition();
      setNutritionData(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch nutrition data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNutrition();
  }, []);

  const logNewNutrition = async (nutrition: Partial<NutritionData>) => {
    try {
      const newNutrition = await apiService.logNutrition(nutrition);
      setNutritionData([newNutrition, ...nutritionData]);
      return newNutrition;
    } catch (err) {
      setError('Failed to log nutrition');
      throw err;
    }
  };

  return { nutritionData, loading, error, logNewNutrition, refreshNutrition: fetchNutrition };
}; 