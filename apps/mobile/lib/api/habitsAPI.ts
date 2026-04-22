// Habits API Service Stubs

export const habitsAPI = {
  getHabits: async (filters?: any) => {
    return [];
  },
  getHabit: async (id: string) => {
    return null;
  },
  createHabit: async (habit: any) => {
    return habit;
  },
  updateHabit: async (id: string, habit: any) => {
    return habit;
  },
  deleteHabit: async (id: string) => {
    return { success: true };
  },
  completeHabitToday: async (id: string) => {
    return { success: true };
  },
  getStreaks: async () => {
    return { totalStreak: 0, longestStreak: 0 };
  },
};
