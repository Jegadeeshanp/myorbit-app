// Health API Service Stubs

export const healthAPI = {
  // Workouts
  getWorkouts: async (filters?: any) => {
    return [];
  },
  createWorkout: async (workout: any) => {
    return workout;
  },
  updateWorkout: async (id: string, workout: any) => {
    return workout;
  },
  deleteWorkout: async (id: string) => {
    return { success: true };
  },

  // Nutrition
  getNutritionLog: async (date: string) => {
    return { calories: 0, macros: {}, micros: {} };
  },
  addFoodEntry: async (entry: any) => {
    return entry;
  },
  setNutritionProfile: async (profile: any) => {
    return profile;
  },

  // Metrics
  getMetrics: async () => {
    return {};
  },
  updateMetric: async (metric: string, value: any) => {
    return { success: true };
  },

  // Health Insights
  getInsights: async () => {
    return [];
  },
};
