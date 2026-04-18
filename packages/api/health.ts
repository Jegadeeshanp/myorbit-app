import { apiRequest } from './client';
import type { HealthEntry, Workout } from './types';

export const getHealthEntry = (date: string): Promise<HealthEntry> =>
  apiRequest<HealthEntry>(`/api/health/entries?date=${date}`);

export const upsertHealthEntry = (data: Partial<HealthEntry>): Promise<HealthEntry> =>
  apiRequest<HealthEntry>('/api/health/entries', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getWorkouts = (date?: string): Promise<Workout[]> => {
  const url = date ? `/api/workouts?date=${date}` : '/api/workouts';
  return apiRequest<Workout[]>(url);
};

export const createWorkout = (data: Partial<Workout>): Promise<Workout> =>
  apiRequest<Workout>('/api/workouts', { method: 'POST', body: JSON.stringify(data) });

export const deleteWorkout = (id: string): Promise<void> =>
  apiRequest<void>(`/api/workouts/${id}`, { method: 'DELETE' });
