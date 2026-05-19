import { apiRequest } from './client';

export interface HealthEntry {
  id: string;
  userId: string;
  date: string;
  steps: number | null;
  sleepHours: number | null;
  waterMl: number | null;
  weightKg: number | null;
  mood: number | null;
  energyLevel: number | null;
  heartRate: number | null;
  notes: string | null;
}

export interface Workout {
  id: string;
  userId: string;
  name: string;
  type: string | null;
  durationMins: number | null;
  caloriesBurned: number | null;
  distanceKm: number | null;
  date: string;
  notes: string | null;
}

export function getHealthEntry(date: string): Promise<HealthEntry | null> {
  return apiRequest<HealthEntry | null>(`/api/health/entries?date=${date}`);
}

export function upsertHealthEntry(data: Partial<HealthEntry> & { date: string }): Promise<HealthEntry> {
  return apiRequest<HealthEntry>('/api/health/entries', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getWorkouts(date?: string): Promise<Workout[]> {
  const q = date ? `?date=${date}` : '';
  return apiRequest<Workout[]>(`/api/workouts${q}`);
}

export function createWorkout(input: {
  name: string;
  type?: string;
  durationMins?: number;
  caloriesBurned?: number;
  distanceKm?: number;
  date?: string;
  notes?: string;
}): Promise<Workout> {
  return apiRequest<Workout>('/api/workouts', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function deleteWorkout(id: string): Promise<void> {
  return apiRequest<void>(`/api/workouts/${id}`, { method: 'DELETE' });
}
