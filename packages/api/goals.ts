import { apiRequest } from './client';

export interface GoalMilestone {
  id: string;
  goalId: string;
  title: string;
  isCompleted: boolean;
  dueDate: string | null;
  sortOrder: number;
}

export interface GoalProcess {
  id: string;
  goalId: string;
  title: string;
  frequency: string;
  sortOrder: number;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  category: string | null;
  status: 'active' | 'completed' | 'paused';
  deadline: string | null;
  progress: number;
  emoji: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
  milestones?: GoalMilestone[];
  processes?: GoalProcess[];
}

export function getGoals(): Promise<Goal[]> {
  return apiRequest<Goal[]>('/api/goals');
}

export function createGoal(input: {
  title: string;
  description?: string;
  category?: string;
  deadline?: string;
  emoji?: string;
  color?: string;
}): Promise<Goal> {
  return apiRequest<Goal>('/api/goals', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateGoal(id: string, input: Partial<{
  title: string;
  description: string;
  category: string;
  status: 'active' | 'completed' | 'paused';
  deadline: string;
  progress: number;
  emoji: string;
  color: string;
}>): Promise<Goal> {
  return apiRequest<Goal>(`/api/goals/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteGoal(id: string): Promise<void> {
  return apiRequest<void>(`/api/goals/${id}`, { method: 'DELETE' });
}

export function createMilestone(goalId: string, input: {
  title: string;
  dueDate?: string;
}): Promise<GoalMilestone> {
  return apiRequest<GoalMilestone>(`/api/goals/${goalId}/milestones`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateMilestone(goalId: string, milestoneId: string, input: Partial<{
  title: string;
  isCompleted: boolean;
  dueDate: string;
}>): Promise<GoalMilestone> {
  return apiRequest<GoalMilestone>(`/api/goals/${goalId}/milestones/${milestoneId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function createProcess(goalId: string, input: {
  title: string;
  frequency?: string;
}): Promise<GoalProcess> {
  return apiRequest<GoalProcess>(`/api/goals/${goalId}/processes`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function deleteProcess(goalId: string, processId: string): Promise<void> {
  return apiRequest<void>(`/api/goals/${goalId}/processes/${processId}`, { method: 'DELETE' });
}
