// Goals API Service Stubs

export const goalsAPI = {
  getGoals: async (filters?: any) => {
    return [];
  },
  getGoal: async (id: string) => {
    return null;
  },
  createGoal: async (goal: any) => {
    return goal;
  },
  updateGoal: async (id: string, goal: any) => {
    return goal;
  },
  deleteGoal: async (id: string) => {
    return { success: true };
  },
  addMilestone: async (goalId: string, milestone: any) => {
    return milestone;
  },
  updateMilestone: async (goalId: string, milestoneId: string, milestone: any) => {
    return milestone;
  },
  addProcess: async (goalId: string, process: any) => {
    return process;
  },
};
