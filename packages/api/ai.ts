import { apiRequest } from './client';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface DailySummary {
  tasks: {
    completed: number;
    pending:   number;
    overdue:   number;
  };
  spending: {
    total:          number;
    topCategories:  { category: string; amount: number }[];
  };
  habits: {
    logged: number;
    total:  number;
    done:   string[];
    missed: string[];
  };
  health?: {
    steps?:        number | null;
    sleepHours?:   number | null;
    waterMl?:      number | null;
    mood?:         number | null;
    energyLevel?:  number | null;
    workouts:      { name: string; durationMins: number; caloriesBurned?: number | null }[];
    totalCalories: number;
  };
  goals?: {
    active:       number;
    nearDeadline: { title: string; deadline: string }[];
  };
}

export interface AICommandResult {
  success:  boolean;
  action?:  string;
  message:  string;
  data?:    Record<string, unknown> & { summary?: DailySummary };
}

export async function sendAICommand(
  command: string,
  history?: AIMessage[],
): Promise<AICommandResult> {
  return apiRequest<AICommandResult>('/api/ai-command', {
    method: 'POST',
    body:   JSON.stringify({ command, history }),
  });
}
