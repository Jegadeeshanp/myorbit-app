import { apiRequest } from './client';

export interface Habit {
  id: string;
  userId: string;
  name: string;
  emoji: string | null;
  color: string | null;
  frequency: string;
  isActive: boolean;
  createdAt: string;
  logs?: { id: string; logDate: string }[];
}

export function getHabits(): Promise<Habit[]> {
  return apiRequest<Habit[]>('/api/habits');
}

export function createHabit(input: {
  name: string;
  emoji?: string;
  color?: string;
  frequency?: string;
}): Promise<Habit> {
  return apiRequest<Habit>('/api/habits', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateHabit(id: string, input: Partial<{
  name: string;
  emoji: string;
  color: string;
  frequency: string;
  isActive: boolean;
}>): Promise<Habit> {
  return apiRequest<Habit>(`/api/habits/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteHabit(id: string): Promise<void> {
  return apiRequest<void>(`/api/habits/${id}`, { method: 'DELETE' });
}

export function logHabit(id: string, date?: string): Promise<{ id: string; logDate: string }> {
  return apiRequest<{ id: string; logDate: string }>(`/api/habits/${id}/log`, {
    method: 'POST',
    body: JSON.stringify({ date: date ?? new Date().toISOString().split('T')[0] }),
  });
}
