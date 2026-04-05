'use client';

import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useReducer,
} from 'react';
import { useSession } from 'next-auth/react';

// ── Types ──────────────────────────────────────────────────────────────────

export type HealthEntry = {
  id: string;
  userId: string;
  date: string;
  steps?: number | null;
  sleepHours?: number | null;
  waterMl?: number | null;
  weightKg?: number | null;
  mood?: number | null;
  energyLevel?: number | null;
  heartRate?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Workout = {
  id: string;
  userId: string;
  name: string;
  type: string;
  durationMins: number;
  caloriesBurned?: number | null;
  distanceKm?: number | null;
  date: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type HealthHabit = {
  id: string;
  name: string;
  color?: string | null;
  iconEmoji?: string | null;
  goalPerDay: number;
  isCountBased: boolean;
  daysOfWeek: string;
  category: string;
  completedToday: boolean;
  todayValue: number;
};

export type HealthTask = {
  id: string;
  title: string;
  status: string;
  dueDate?: string | null;
  dueTime?: string | null;
  habitId?: string | null;
  habit?: HealthHabit | null;
};

export type GoalMilestone = {
  id: string;
  goalId: string;
  title: string;
  horizon: string;
  isCompleted: boolean;
  dueDate?: string | null;
};

export type HealthGoal = {
  id: string;
  title: string;
  category: string;
  why?: string | null;
  metric?: string | null;
  deadline?: string | null;
  status: string;
  milestones: GoalMilestone[];
};

export type WeeklyStats = {
  habitsCompletedThisWeek: number;
  workoutsThisWeek: number;
  avgSleep: number;
};

export type DashboardData = {
  todayEntry: HealthEntry | null;
  todayWorkouts: Workout[];
  healthHabits: HealthHabit[];
  healthTasks: HealthTask[];
  healthGoals: HealthGoal[];
  weeklyStats: WeeklyStats;
};

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

type HealthState = {
  entries: HealthEntry[];
  workouts: Workout[];
  dashboard: DashboardData | null;
  loadState: LoadState;
};

type HealthAction =
  | { type: 'hydrate'; payload: { entries: HealthEntry[]; workouts: Workout[]; dashboard: DashboardData } }
  | { type: 'setLoadState'; payload: LoadState }
  | { type: 'addEntry'; payload: HealthEntry }
  | { type: 'updateEntry'; payload: HealthEntry }
  | { type: 'addWorkout'; payload: Workout }
  | { type: 'updateWorkout'; payload: Workout }
  | { type: 'deleteWorkout'; payload: string }
  | { type: 'patchDashboard'; payload: Partial<DashboardData> };

// ── API helper ─────────────────────────────────────────────────────────────

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error ?? 'Request failed');
  }
  return res.json();
}

// ── Reducer ────────────────────────────────────────────────────────────────

const initialState: HealthState = {
  entries: [],
  workouts: [],
  dashboard: null,
  loadState: 'idle',
};

function healthReducer(state: HealthState, action: HealthAction): HealthState {
  switch (action.type) {
    case 'hydrate':
      return {
        ...state,
        entries: action.payload.entries,
        workouts: action.payload.workouts,
        dashboard: action.payload.dashboard,
        loadState: 'ready',
      };
    case 'setLoadState':
      return { ...state, loadState: action.payload };
    case 'addEntry':
      return {
        ...state,
        entries: [action.payload, ...state.entries.filter(e => e.date !== action.payload.date)],
        dashboard: state.dashboard
          ? { ...state.dashboard, todayEntry: action.payload.date === new Date().toISOString().split('T')[0] ? action.payload : state.dashboard.todayEntry }
          : state.dashboard,
      };
    case 'updateEntry':
      return {
        ...state,
        entries: state.entries.map(e => e.id === action.payload.id ? action.payload : e),
        dashboard: state.dashboard
          ? { ...state.dashboard, todayEntry: action.payload.date === new Date().toISOString().split('T')[0] ? action.payload : state.dashboard.todayEntry }
          : state.dashboard,
      };
    case 'addWorkout':
      return {
        ...state,
        workouts: [action.payload, ...state.workouts],
        dashboard: state.dashboard
          ? { ...state.dashboard, todayWorkouts: action.payload.date === new Date().toISOString().split('T')[0] ? [action.payload, ...state.dashboard.todayWorkouts] : state.dashboard.todayWorkouts }
          : state.dashboard,
      };
    case 'updateWorkout':
      return {
        ...state,
        workouts: state.workouts.map(w => w.id === action.payload.id ? action.payload : w),
        dashboard: state.dashboard
          ? { ...state.dashboard, todayWorkouts: state.dashboard.todayWorkouts.map(w => w.id === action.payload.id ? action.payload : w) }
          : state.dashboard,
      };
    case 'deleteWorkout':
      return {
        ...state,
        workouts: state.workouts.filter(w => w.id !== action.payload),
        dashboard: state.dashboard
          ? { ...state.dashboard, todayWorkouts: state.dashboard.todayWorkouts.filter(w => w.id !== action.payload) }
          : state.dashboard,
      };
    case 'patchDashboard':
      return {
        ...state,
        dashboard: state.dashboard ? { ...state.dashboard, ...action.payload } : state.dashboard,
      };
    default:
      return state;
  }
}

// ── Context ────────────────────────────────────────────────────────────────

type HealthContextValue = HealthState & {
  addHealthEntry: (data: Omit<HealthEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<HealthEntry>;
  updateHealthEntry: (id: string, data: Partial<HealthEntry>) => Promise<HealthEntry>;
  addWorkout: (data: Omit<Workout, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<Workout>;
  updateWorkout: (id: string, data: Partial<Workout>) => Promise<Workout>;
  deleteWorkout: (id: string) => Promise<void>;
  completeHealthTask: (taskId: string, steps?: number, durationMins?: number) => Promise<any>;
  reload: () => Promise<void>;
};

const HealthContext = createContext<HealthContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────

export function HealthProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(healthReducer, initialState);
  const { status } = useSession();

  async function load() {
    dispatch({ type: 'setLoadState', payload: 'loading' });
    try {
      const [entries, workouts, dashboard] = await Promise.all([
        api<HealthEntry[]>('/api/health/entries?limit=30'),
        api<Workout[]>('/api/workouts?limit=20'),
        api<DashboardData>('/api/health/dashboard'),
      ]);
      dispatch({ type: 'hydrate', payload: { entries, workouts, dashboard } });
    } catch {
      dispatch({ type: 'setLoadState', payload: 'error' });
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      load();
    }
  }, [status]);

  const addHealthEntry = async (data: Omit<HealthEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<HealthEntry> => {
    const entry = await api<HealthEntry>('/api/health/entries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    dispatch({ type: 'addEntry', payload: entry });
    return entry;
  };

  const updateHealthEntry = async (id: string, data: Partial<HealthEntry>): Promise<HealthEntry> => {
    const entry = await api<HealthEntry>('/api/health/entries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    dispatch({ type: 'updateEntry', payload: entry });
    return entry;
  };

  const addWorkout = async (data: Omit<Workout, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Workout> => {
    const workout = await api<Workout>('/api/workouts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    dispatch({ type: 'addWorkout', payload: workout });
    return workout;
  };

  const updateWorkout = async (id: string, data: Partial<Workout>): Promise<Workout> => {
    const workout = await api<Workout>(`/api/workouts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    dispatch({ type: 'updateWorkout', payload: workout });
    return workout;
  };

  const deleteWorkout = async (id: string): Promise<void> => {
    await api(`/api/workouts/${id}`, { method: 'DELETE' });
    dispatch({ type: 'deleteWorkout', payload: id });
  };

  const completeHealthTask = async (taskId: string, steps?: number, durationMins?: number) => {
    const result = await api<any>('/api/health/complete-task', {
      method: 'POST',
      body: JSON.stringify({ taskId, steps, durationMins }),
    });
    // Refresh dashboard after task completion
    const dashboard = await api<DashboardData>('/api/health/dashboard');
    dispatch({ type: 'patchDashboard', payload: dashboard });
    return result;
  };

  return (
    <HealthContext.Provider
      value={{
        ...state,
        addHealthEntry,
        updateHealthEntry,
        addWorkout,
        updateWorkout,
        deleteWorkout,
        completeHealthTask,
        reload: load,
      }}
    >
      {children}
    </HealthContext.Provider>
  );
}

export function useHealth(): HealthContextValue {
  const ctx = useContext(HealthContext);
  if (!ctx) throw new Error('useHealth must be used inside <HealthProvider>');
  return ctx;
}
