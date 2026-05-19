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

// ── Card data shapes (returned in data.cardData) ──────────────────────────────

export interface WaterCardData {
  amount_ml: number;
  total_ml:  number;
  goal_ml:   number;
}

export interface ActivityCardData {
  activity_type:  string;
  distance_km:    number | null;
  duration_min:   number | null;
  estimated_kcal: number;
}

export interface NutritionItem {
  name:     string;
  quantity: string;
  calories: number;
  protein:  number;
  carbs:    number;
  fat:      number;
  fibre:    number;
}

export interface NutritionCardData {
  items:  NutritionItem[];
  totals: { calories: number; protein: number; carbs: number; fat: number; fibre: number };
}

export interface GoalPlanEntry {
  id:          string;
  duration:    '1month' | '3month' | '6month';
  title:       string;
  description: string;
  milestones:  string[];
  targetDate:  string;
}

export interface GoalPlanCardData {
  event: string;
  goals: GoalPlanEntry[];
}

export type AnyCardData = WaterCardData | ActivityCardData | NutritionCardData | GoalPlanCardData;

export interface AICommandResult {
  success:  boolean;
  action?:  string;
  message:  string;
  data?:    Record<string, unknown> & { summary?: DailySummary; cardData?: AnyCardData };
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
