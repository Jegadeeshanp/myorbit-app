import { apiRequest } from './client';
import type {
  Task, TaskList, TaskInstance, TodayResponse, CreateTaskInput, TaskSubtask,
} from './types';

export const getTodayTasks = (): Promise<TodayResponse> =>
  apiRequest<TodayResponse>('/api/tasks/today');

export const getAllTasks = (listId?: string): Promise<Task[]> => {
  const url = listId
    ? `/api/tasks?listId=${listId}`
    : '/api/tasks?smartList=all';
  return apiRequest<Task[]>(url);
};

export const getNext7Tasks = (): Promise<Task[]> =>
  apiRequest<Task[]>('/api/tasks?smartList=next7');

export const getTaskLists = (): Promise<TaskList[]> =>
  apiRequest<TaskList[]>('/api/task-lists');

export const createTaskList = (data: { name: string; emoji?: string; color?: string }): Promise<TaskList> =>
  apiRequest<TaskList>('/api/task-lists', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateTaskList = (id: string, data: Partial<Pick<TaskList, 'name' | 'emoji' | 'color'>> & { sortOrder?: number }): Promise<TaskList> =>
  apiRequest<TaskList>(`/api/task-lists/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const deleteTaskList = (id: string): Promise<void> =>
  apiRequest<void>(`/api/task-lists/${id}`, { method: 'DELETE' });

export const createTask = (data: CreateTaskInput): Promise<Task> =>
  apiRequest<Task>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateTask = (id: string, data: Partial<Task>): Promise<Task> =>
  apiRequest<Task>(`/api/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const deleteTask = (id: string): Promise<void> =>
  apiRequest<void>(`/api/tasks/${id}`, { method: 'DELETE' });

export const completeInstance = (instanceId: string): Promise<TaskInstance> =>
  apiRequest<TaskInstance>(`/api/tasks/instances/${instanceId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'completed' }),
  });

export const deleteInstance = (instanceId: string): Promise<void> =>
  apiRequest<void>(`/api/tasks/instances/${instanceId}`, { method: 'DELETE' });

export const createSubtask = (taskId: string, title: string): Promise<TaskSubtask> =>
  apiRequest<TaskSubtask>(`/api/tasks/${taskId}/subtasks`, {
    method: 'POST',
    body: JSON.stringify({ title }),
  });

export const updateSubtask = (taskId: string, subtaskId: string, data: { title?: string; isDone?: boolean }): Promise<TaskSubtask> =>
  apiRequest<TaskSubtask>(`/api/tasks/${taskId}/subtasks/${subtaskId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
