import { apiRequest } from './client';

export interface TaskSubtask {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  sortOrder: number;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  notes: string | null;
  status: 'active' | 'completed';
  priority: 'none' | 'low' | 'medium' | 'high';
  dueDate: string | null;
  dueTime: string | null;
  tags: string;
  listId: string | null;
  isActive: boolean;
  isDeleted: boolean;
  isRecurring: boolean;
  recurrenceDays: number[] | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  subtasks?: TaskSubtask[];
  list?: { id: string; name: string; color: string | null; emoji: string | null } | null;
}

export interface TaskInstance {
  id: string;
  userId: string;
  taskId: string;
  date: string;
  status: 'pending' | 'completed' | 'deleted';
  isDeleted: boolean;
  completedAt: string | null;
  task: {
    id: string;
    title: string;
    priority: string;
    dueTime: string | null;
    tags: string;
    listId: string | null;
    list?: { id: string; name: string; color: string | null; emoji: string | null };
  };
}

export interface TodayResponse {
  overdue: TaskInstance[];
  today: TaskInstance[];
  missed: TaskInstance[];
  completed: TaskInstance[];
}

export interface TaskList {
  id: string;
  userId: string;
  name: string;
  color: string | null;
  emoji: string | null;
  sortOrder: number;
}

export interface CreateTaskInput {
  title: string;
  notes?: string;
  priority?: 'none' | 'low' | 'medium' | 'high';
  dueDate?: string | null;
  dueTime?: string | null;
  tags?: string[];
  listId?: string | null;
}

export function getTodayTasks(): Promise<TodayResponse> {
  return apiRequest<TodayResponse>('/api/tasks/today');
}

export function getAllTasks(params?: { smartList?: string; listId?: string }): Promise<Task[]> {
  const qs = new URLSearchParams();
  if (params?.smartList) qs.set('smartList', params.smartList);
  if (params?.listId)    qs.set('listId', params.listId);
  const q = qs.toString();
  return apiRequest<Task[]>(`/api/tasks${q ? `?${q}` : ''}`);
}

export function getNext7Tasks(): Promise<Task[]> {
  return getAllTasks({ smartList: 'next7' });
}

export function createTask(input: CreateTaskInput): Promise<Task> {
  return apiRequest<Task>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateTask(id: string, input: Partial<CreateTaskInput> & { status?: string; isActive?: boolean }): Promise<Task> {
  return apiRequest<Task>(`/api/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function completeInstance(instanceId: string): Promise<TaskInstance> {
  return apiRequest<TaskInstance>(`/api/tasks/instances/${instanceId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'completed' }),
  });
}

export function deleteTask(id: string): Promise<void> {
  return apiRequest<void>(`/api/tasks/${id}`, { method: 'DELETE' });
}

export function getTaskLists(): Promise<TaskList[]> {
  return apiRequest<TaskList[]>('/api/task-lists');
}

export function createTaskList(input: { name: string; color?: string; emoji?: string }): Promise<TaskList> {
  return apiRequest<TaskList>('/api/task-lists', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateTaskList(id: string, input: { name?: string; color?: string; emoji?: string }): Promise<TaskList> {
  return apiRequest<TaskList>(`/api/task-lists/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteTaskList(id: string): Promise<void> {
  return apiRequest<void>(`/api/task-lists/${id}`, { method: 'DELETE' });
}

export function createSubtask(taskId: string, input: { title: string }): Promise<TaskSubtask> {
  return apiRequest<TaskSubtask>(`/api/tasks/${taskId}/subtasks`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateSubtask(taskId: string, subtaskId: string, input: { title?: string; isCompleted?: boolean }): Promise<TaskSubtask> {
  return apiRequest<TaskSubtask>(`/api/tasks/${taskId}/subtasks/${subtaskId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
