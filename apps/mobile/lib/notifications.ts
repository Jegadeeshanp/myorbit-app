import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Task } from '@myorbit/api';

function getReminder(raw: string): string {
  try {
    const t = (JSON.parse(raw || '[]') as string[]).find(x => x.startsWith('reminder:'));
    return t ? t.replace('reminder:', '') : 'none';
  } catch { return 'none'; }
}

export async function setupNotifications(): Promise<boolean> {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('tasks', {
      name: 'Task Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  // Check existing permission first — avoids re-prompting if already granted/denied
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleTaskNotification(task: Task): Promise<void> {
  await cancelTaskNotification(task.id);

  const reminder = getReminder(task.tags ?? '');
  if (reminder === 'none' || !task.dueDate) return;

  const dueDateTime = task.dueTime
    ? new Date(`${task.dueDate}T${task.dueTime}:00`)
    : new Date(`${task.dueDate}T09:00:00`);

  const offsetMs: Record<string, number> = {
    'on-time': 0,
    '5m': -5 * 60 * 1000,
    '30m': -30 * 60 * 1000,
    '1h': -60 * 60 * 1000,
    '1d': -24 * 60 * 60 * 1000,
  };

  const offset = offsetMs[reminder];
  if (offset === undefined) return;

  const fireAt = new Date(dueDateTime.getTime() + offset);
  const secondsFromNow = Math.floor((fireAt.getTime() - Date.now()) / 1000);
  if (secondsFromNow <= 5) return;

  await Notifications.scheduleNotificationAsync({
    identifier: `task-${task.id}`,
    content: {
      title: task.title,
      body: task.dueTime ? `Due at ${task.dueTime}` : 'Reminder',
      data: { taskId: task.id },
      sound: 'default',
      ...(Platform.OS === 'android' && { color: '#10B981' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireAt,
      channelId: 'tasks',
    },
  });
}

export async function cancelTaskNotification(taskId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(`task-${taskId}`);
  } catch { /* ignore if not found */ }
}

export async function snoozeTaskNotification(
  taskId: string,
  title: string,
  minutes: number,
): Promise<void> {
  await cancelTaskNotification(taskId);
  const snoozeAt = new Date(Date.now() + minutes * 60 * 1000);
  await Notifications.scheduleNotificationAsync({
    identifier: `task-${taskId}`,
    content: {
      title,
      body: 'Snoozed reminder',
      data: { taskId },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: snoozeAt,
      channelId: 'tasks',
    },
  });
}

export function minutesUntilTomorrowMorning(): number {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(8, 0, 0, 0);
  return Math.round((tomorrow.getTime() - Date.now()) / 60000);
}
