/**
 * Android Widget Task Handler
 * Handles widget click events and data updates.
 * Registered in app.json via react-native-android-widget plugin.
 */

import * as SecureStore from 'expo-secure-store';

export const WIDGET_TASK_NAME = 'myorbit-widget-task';

export interface WidgetData {
  habits: {
    total: number;
    done: number;
    list: Array<{ id: string; name: string; emoji: string; done: boolean }>;
  };
  tasks: {
    total: number;
    overdue: number;
    list: Array<{ id: string; title: string; priority: string; overdue: boolean }>;
  };
  finance: {
    balance: number;
    balanceLabel: string;
  };
  goals: {
    active: number;
    nearest: string | null;
  };
  date: string;
  greeting: string;
  lastUpdated: string;
}

const WIDGET_DATA_KEY = 'myorbit_widget_data';

export async function saveWidgetData(data: WidgetData): Promise<void> {
  try {
    await SecureStore.setItemAsync(WIDGET_DATA_KEY, JSON.stringify(data));
  } catch {
    // SecureStore might not be available in widget context
    try {
      const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(data));
    } catch {}
  }
}

export async function loadWidgetData(): Promise<WidgetData | null> {
  try {
    const raw = await SecureStore.getItemAsync(WIDGET_DATA_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function buildWidgetData(
  habits: any[],
  tasks: any[],
  balance: number,
  accountCount: number,
  goals: any[],
): WidgetData {
  const today = new Date().toISOString().split('T')[0];
  const todayDow = new Date().getDay();

  const todayHabits = habits.filter(h => {
    try {
      const days = JSON.parse(h.daysOfWeek ?? '[0,1,2,3,4,5,6]');
      return days.includes(todayDow);
    } catch { return true; }
  });

  const doneHabits  = todayHabits.filter(h => h.logs?.some((l: any) => l.logDate === today));
  const overdueTasks = tasks.filter(t => t.dueDate && t.dueDate < today);

  const nearestGoal = goals
    .filter(g => g.deadline)
    .sort((a, b) => a.deadline < b.deadline ? -1 : 1)[0];

  return {
    habits: {
      total: todayHabits.length,
      done: doneHabits.length,
      list: todayHabits.slice(0, 6).map(h => ({
        id: h.id,
        name: h.name,
        emoji: h.iconEmoji ?? '✅',
        done: h.logs?.some((l: any) => l.logDate === today) ?? false,
      })),
    },
    tasks: {
      total: tasks.length,
      overdue: overdueTasks.length,
      list: tasks.slice(0, 5).map(t => ({
        id: t.id,
        title: t.title,
        priority: t.priority ?? 'none',
        overdue: t.dueDate ? t.dueDate < today : false,
      })),
    },
    finance: {
      balance,
      balanceLabel: `${accountCount} account${accountCount !== 1 ? 's' : ''}`,
    },
    goals: {
      active: goals.length,
      nearest: nearestGoal
        ? `${nearestGoal.title} · ${Math.ceil((new Date(nearestGoal.deadline).getTime() - Date.now()) / 86400000)}d`
        : null,
    },
    date: today,
    greeting: getGreeting(),
    lastUpdated: new Date().toISOString(),
  };
}
