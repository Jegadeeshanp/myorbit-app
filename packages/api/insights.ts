import { apiRequest } from './client';
import type { InsightScores } from './types';

export const getInsightScores = (): Promise<InsightScores> =>
  apiRequest<InsightScores>('/api/insights/scores');
