/**
 * lib/taskTypes.ts
 * Type definitions for task instances and related responses.
 * These types are used throughout the task API and Today view.
 */

export interface TaskInstanceWithTask {
  id: string;
  userId: string;
  taskId: string;
  date: string; // YYYY-MM-DD
  status: 'pending' | 'completed' | 'deleted';
  isDeleted: boolean;
  completedAt: string | null;
  task: {
    id: string;
    title: string;
    priority: string;
    dueTime: string | null;
    tags: string; // JSON string
    listId: string | null;
    list?: {
      id: string;
      name: string;
      color: string | null;
      emoji: string | null;
    };
  };
}

export interface TodayResponse {
  overdue: TaskInstanceWithTask[];
  today: TaskInstanceWithTask[];
  missed: TaskInstanceWithTask[];
  completed: TaskInstanceWithTask[];
}
