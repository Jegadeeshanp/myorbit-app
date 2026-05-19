import { apiRequest } from './client';

export interface InsightScores {
  lifeScore: number;
  scores: {
    habit: number;
    task: number;
    goal: number;
    health: number;
    finance: number;
  };
  insights: {
    type: string;
    title: string;
    body: string;
    severity: string;
  }[];
  history: {
    date: string;
    mood: number | null;
    energy: number | null;
    steps: number | null;
  }[];
}

export function getInsightScores(): Promise<InsightScores> {
  return apiRequest<InsightScores>('/api/insights/scores');
}
