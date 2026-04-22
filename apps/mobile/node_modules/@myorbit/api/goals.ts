import { apiRequest } from './client';
import type { Goal, GoalMilestone, GoalProcess } from './types';

export const getGoals = (): Promise<Goal[]> =>
  apiRequest<Goal[]>('/api/goals');

export const createGoal = (data: Partial<Goal>): Promise<Goal> =>
  apiRequest<Goal>('/api/goals', { method: 'POST', body: JSON.stringify(data) });

export const updateGoal = (id: string, data: Partial<Goal>): Promise<Goal> =>
  apiRequest<Goal>(`/api/goals/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteGoal = (id: string): Promise<void> =>
  apiRequest<void>(`/api/goals/${id}`, { method: 'DELETE' });

export const getMilestones = (goalId: string): Promise<GoalMilestone[]> =>
  apiRequest<GoalMilestone[]>(`/api/goals/${goalId}/milestones`);

export const createMilestone = (
  goalId: string, data: Partial<GoalMilestone>
): Promise<GoalMilestone> =>
  apiRequest<GoalMilestone>(`/api/goals/${goalId}/milestones`, {
    method: 'POST', body: JSON.stringify(data),
  });

export const updateMilestone = (
  goalId: string, mid: string, data: Partial<GoalMilestone>
): Promise<GoalMilestone> =>
  apiRequest<GoalMilestone>(`/api/goals/${goalId}/milestones/${mid}`, {
    method: 'PATCH', body: JSON.stringify(data),
  });

export const deleteMilestone = (goalId: string, mid: string): Promise<void> =>
  apiRequest<void>(`/api/goals/${goalId}/milestones/${mid}`, { method: 'DELETE' });

export const getProcesses = (goalId: string): Promise<GoalProcess[]> =>
  apiRequest<GoalProcess[]>(`/api/goals/${goalId}/processes`);

export const createProcess = (
  goalId: string, data: Partial<GoalProcess>
): Promise<GoalProcess> =>
  apiRequest<GoalProcess>(`/api/goals/${goalId}/processes`, {
    method: 'POST', body: JSON.stringify(data),
  });

export const deleteProcess = (goalId: string, pid: string): Promise<void> =>
  apiRequest<void>(`/api/goals/${goalId}/processes/${pid}`, { method: 'DELETE' });
