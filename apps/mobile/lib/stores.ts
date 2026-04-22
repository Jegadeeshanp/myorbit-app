import { create } from 'zustand';

// Goals Store
export interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'Finance' | 'Health' | 'Career' | 'Learning' | 'Personal';
  metric: string;
  deadline: string;
  status: 'active' | 'completed' | 'paused';
  progress: number;
  milestones: Milestone[];
  processCount: number;
}

export interface Milestone {
  id: string;
  duration: '6M' | '3M' | '1M';
  target: number;
  completed: number;
}

interface GoalsState {
  goals: Goal[];
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, goal: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
}

export const useGoalsStore = create<GoalsState>((set) => ({
  goals: [
    {
      id: '1',
      title: 'Reading',
      description: 'Read',
      category: 'Personal',
      metric: 'Complete books',
      deadline: '2026-07-31',
      status: 'active',
      progress: 0,
      milestones: [
        { id: 'm1', duration: '6M', target: 10, completed: 0 },
        { id: 'm2', duration: '3M', target: 6, completed: 0 },
        { id: 'm3', duration: '1M', target: 3, completed: 0 },
      ],
      processCount: 2,
    },
  ],
  addGoal: (goal) => set((state) => ({ goals: [...state.goals, goal] })),
  updateGoal: (id, updates) =>
    set((state) => ({
      goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    })),
  deleteGoal: (id) =>
    set((state) => ({
      goals: state.goals.filter((g) => g.id !== id),
    })),
}));

// Tasks Store
export interface Task {
  id: string;
  title: string;
  description?: string;
  listId: string;
  dueDate?: string;
  dueTime?: string;
  repeat?: 'daily' | 'weekly' | 'monthly';
  priority?: 'high' | 'medium' | 'low';
  completed: boolean;
  tags?: string[];
}

export interface TaskList {
  id: string;
  name: string;
  emoji?: string;
  color: string;
  taskCount: number;
}

interface TasksState {
  tasks: Task[];
  lists: TaskList[];
  addTask: (task: Task) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addList: (list: TaskList) => void;
}

export const useTasksStore = create<TasksState>((set) => ({
  tasks: [
    {
      id: 't1',
      title: 'Maintenance Rs.50,298/- for school fee',
      listId: 'l2',
      dueDate: '2026-03-23',
      dueTime: '10:00',
      completed: false,
    },
    {
      id: 't2',
      title: 'Call Amma',
      listId: 'l2',
      dueDate: '2026-03-23',
      dueTime: '10:30',
      repeat: 'daily',
      completed: false,
    },
  ],
  lists: [
    { id: 'l1', name: 'Health & Fitness', emoji: '💪', color: '#22C55E', taskCount: 1 },
    { id: 'l2', name: 'Family', emoji: '🏠', color: '#EC4899', taskCount: 3 },
    { id: 'l3', name: 'Daily Task', emoji: '✓', color: '#6B7280', taskCount: 4 },
    { id: 'l4', name: 'Bill & Renewal', emoji: '💳', color: '#EF4444', taskCount: 2 },
    { id: 'l5', name: 'Weekly & Monthly', emoji: '📅', color: '#F97316', taskCount: 5 },
    { id: 'l6', name: 'Self Improvement', emoji: '📚', color: '#14B8A6', taskCount: 2 },
  ],
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  deleteTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),
  addList: (list) => set((state) => ({ lists: [...state.lists, list] })),
}));

// Habits Store
export interface Habit {
  id: string;
  title: string;
  category: string;
  frequency: string;
  streak: number;
  completed: boolean;
  color: string;
}

interface HabitsState {
  habits: Habit[];
  todayCompleted: number;
  totalStreak: number;
  longestStreak: number;
  addHabit: (habit: Habit) => void;
  updateHabit: (id: string, habit: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
}

export const useHabitsStore = create<HabitsState>((set) => ({
  habits: [],
  todayCompleted: 0,
  totalStreak: 0,
  longestStreak: 0,
  addHabit: (habit) => set((state) => ({ habits: [...state.habits, habit] })),
  updateHabit: (id, updates) =>
    set((state) => ({
      habits: state.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)),
    })),
  deleteHabit: (id) =>
    set((state) => ({
      habits: state.habits.filter((h) => h.id !== id),
    })),
}));

// Health Store
export interface HealthMetric {
  name: string;
  value: number | string;
  target?: number;
  unit?: string;
}

interface HealthState {
  metrics: Record<string, HealthMetric>;
  steps: number;
  exercise: number;
  sleep: number;
  water: number;
  calories: number;
  updateMetric: (name: string, value: number | string) => void;
}

export const useHealthStore = create<HealthState>((set) => ({
  metrics: {
    mood: { name: 'Mood', value: 'Not logged' },
    energy: { name: 'Energy', value: 'Energy level' },
    weight: { name: 'Weight', value: 'Body weight' },
    heartRate: { name: 'Heart Rate', value: 'Resting HR' },
  },
  steps: 0,
  exercise: 0,
  sleep: 0,
  water: 0,
  calories: 0,
  updateMetric: (name, value) =>
    set((state) => ({
      metrics: {
        ...state.metrics,
        [name]: { ...state.metrics[name], value },
      },
    })),
}));

// Finance Store
export interface Account {
  id: string;
  name: string;
  type: 'savings' | 'credit' | 'wallet' | 'cash';
  balance: number;
  currency: string;
  institution?: string;
  icon?: string;
}

export interface Transaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  account: string;
  recurring?: boolean;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  tags: string[];
}

interface FinanceState {
  netWorth: number;
  assets: number;
  liabilities: number;
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  accountBalance: number;
  updateBalance: (amount: number) => void;
  addTransaction: (transaction: Transaction) => void;
  addAccount: (account: Account) => void;
}

export const useFinanceStore = create<FinanceState>((set) => ({
  netWorth: 3445000,
  assets: 7897402,
  liabilities: 4598312,
  accountBalance: 212355,
  accounts: [
    { id: 'a1', name: 'HDFC Savings', type: 'savings', balance: 8045, currency: 'INR', institution: 'HDFC' },
    { id: 'a2', name: 'SBI OD Savings', type: 'savings', balance: 180000, currency: 'INR', institution: 'SBI' },
    { id: 'a3', name: 'SBI Amma Savings', type: 'savings', balance: 16476, currency: 'INR', institution: 'SBI' },
    { id: 'a4', name: 'Axis Savings', type: 'savings', balance: 5000, currency: 'INR', institution: 'Axis' },
  ],
  transactions: [
    {
      id: 't1',
      title: 'YouTube Premium Subscription',
      category: 'Subscriptions',
      amount: 299,
      type: 'expense',
      date: '2026-04-13',
      account: 'HDFC Regalia',
      recurring: true,
    },
    {
      id: 't2',
      title: 'Netflix Family plan',
      category: 'Subscriptions',
      amount: 199,
      type: 'expense',
      date: '2026-04-03',
      account: 'Axis Airtel',
      recurring: true,
    },
  ],
  budgets: [
    { id: 'b1', category: 'Family', limit: 25000, spent: 0, tags: ['Family'] },
    { id: 'b2', category: 'Groceries', limit: 20000, spent: 0, tags: ['Groceries'] },
    { id: 'b3', category: 'Food - Outside', limit: 10000, spent: 0, tags: ['Office', 'Restaurants'] },
    { id: 'b4', category: 'Housing', limit: 30000, spent: 0, tags: ['Rent', 'Maintenance', 'Helper Salary'] },
    { id: 'b5', category: 'Investment', limit: 41000, spent: 0, tags: ['Investment'] },
    { id: 'b6', category: 'Life Styles', limit: 10000, spent: 0, tags: ['Travel', 'Shopping', 'Gifts', 'Self Care', 'Entertainment'] },
    { id: 'b7', category: 'Loans', limit: 80000, spent: 0, tags: ['Loan'] },
    { id: 'b8', category: 'Medical', limit: 3000, spent: 0, tags: ['Medical', 'Healthcare'] },
    { id: 'b9', category: 'Transportation', limit: 10000, spent: 0, tags: ['Fuel', 'Transport'] },
    { id: 'b10', category: 'Utilities', limit: 4000, spent: 498, tags: ['Utilities', 'Internet', 'Mobile', 'Subscriptions', 'Bills'] },
    { id: 'b11', category: 'Self Improvement', limit: 2500, spent: 0, tags: ['Education'] },
  ],
  updateBalance: (amount) => set((state) => ({ accountBalance: state.accountBalance + amount })),
  addTransaction: (transaction) =>
    set((state) => ({
      transactions: [...state.transactions, transaction],
    })),
  addAccount: (account) =>
    set((state) => ({
      accounts: [...state.accounts, account],
    })),
}));

// Auth Store
interface AuthState {
  user: { id: string; name: string; email: string } | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => void;
  logout: () => void;
  setUser: (user: any) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: { id: '1', name: 'Jegadeeshan', email: 'jeggy@example.com' },
  isAuthenticated: true,
  login: (email, password) =>
    set({
      user: { id: '1', name: 'User', email },
      isAuthenticated: true,
    }),
  logout: () => set({ user: null, isAuthenticated: false }),
  setUser: (user) => set({ user, isAuthenticated: !!user }),
}));
