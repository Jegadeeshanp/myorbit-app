import { apiRequest } from './client';

export interface GoalMilestone {
  id: string;
  goalId: string;
  userId: string;
  title: string;
  horizon: string;
  isCompleted: boolean;
  dueDate: string | null;
  createdAt: string;
}

export interface GoalProcess {
  id: string;
  goalId: string;
  userId: string;
  title: string;
  frequency: string;
  isActive: boolean;
  createdAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  category: string;
  why: string | null;
  metric: string | null;
  deadline: string | null;
  status: 'active' | 'completed' | 'paused';
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
  category?: string;
  why?: string;
  metric?: string;
  deadline?: string;
  status?: 'active' | 'completed' | 'paused';
  milestones?: Array<{ title: string; horizon?: string }>;
  processes?: Array<{ title: string; frequency?: string }>;
}): Promise<Goal> {
  return apiRequest<Goal>('/api/goals', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateGoal(id: string, input: Partial<{
  title: string;
  category: string;
  why: string;
  metric: string;
  status: 'active' | 'completed' | 'paused';
  deadline: string;
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
