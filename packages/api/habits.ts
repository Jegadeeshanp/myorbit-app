import { apiRequest } from './client';
import type { Habit, HabitLog } from './types';

export const getHabits = (): Promise<Habit[]> =>
  apiRequest<Habit[]>('/api/habits');

export const createHabit = (data: Partial<Habit>): Promise<Habit> =>
  apiRequest<Habit>('/api/habits', { method: 'POST', body: JSON.stringify(data) });

export const updateHabit = (id: string, data: Partial<Habit>): Promise<Habit> =>
  apiRequest<Habit>(`/api/habits/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteHabit = (id: string): Promise<void> =>
  apiRequest<void>(`/api/habits/${id}`, { method: 'DELETE' });

export const logHabit = (id: string, date: string, value = 1): Promise<HabitLog> =>
  apiRequest<HabitLog>(`/api/habits/${id}/log`, {
    method: 'POST',
    body: JSON.stringify({ date, value }),
  });
