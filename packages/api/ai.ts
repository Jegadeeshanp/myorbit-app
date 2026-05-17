import { apiRequest } from './client';

export interface AICommandResult {
  success: boolean;
  action?: string;
  message: string;
  data?: Record<string, unknown>;
}

export async function sendAICommand(command: string): Promise<AICommandResult> {
  return apiRequest<AICommandResult>('/api/ai-command', {
    method: 'POST',
    body: JSON.stringify({ command }),
  });
}
