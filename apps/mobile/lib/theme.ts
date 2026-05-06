// Design System Colors & Theme

export const COLORS = {
  // Background
  background: '#0d1117',
  surface: '#161b22',
  surfaceAlt: '#21262d',

  // Surfaces & Cards
  card: '#1c2128',
  cardDark: '#161b22',
  
  // Primary Colors (by module)
  goals: '#6C63FF', // Purple
  goalsPurple: '#A855F7', // Gradient to
  tasks: '#22C55E', // Green
  habits: '#F97316', // Orange
  health: '#EC4899', // Pink/Red
  finance: {
    positive: '#22C55E', // Green
    negative: '#EF4444', // Red
    neutral: '#6B7280',
  },
  
  // Text
  textPrimary: '#e6edf3',
  textSecondary: '#8b949e',
  textTertiary: '#636e7b',

  // Accents
  border: '#30363d',
  divider: '#30363d',
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F97316',
  info: '#3B82F6',
  
  // Common UI colors
  green: '#22C55E',
  red: '#EF4444',
  orange: '#F97316',
  purple: '#6C63FF',
  blue: '#3B82F6',
  pink: '#EC4899',
  teal: '#14B8A6',
  grey: '#6B7280',
  
  // Status badges
  active: '#22C55E',
  pending: '#F97316',
  completed: '#10B981',
  cancelled: '#6B7280',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 36,
    fontWeight: '700' as const,
    lineHeight: 44,
  },
  h2: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h3: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
  },
  h4: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 30,
  },
  bodyLarge: {
    fontSize: 20,
    fontWeight: '500' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 18,
    fontWeight: '400' as const,
    lineHeight: 26,
  },
  bodySmall: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  captionBold: {
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
};

// Currency formatting
export const CURRENCY = {
  symbol: '₹',
  code: 'INR',
};

// Tab icons & labels mapping
export const MODULES = {
  goals: {
    label: 'Goals',
    color: COLORS.goals,
    icon: 'target',
  },
  tasks: {
    label: 'Tasks',
    color: COLORS.tasks,
    icon: 'check-square',
  },
  habits: {
    label: 'Habits',
    color: COLORS.habits,
    icon: 'repeat',
  },
  health: {
    label: 'Health',
    color: COLORS.health,
    icon: 'activity',
  },
  finance: {
    label: 'Finance',
    color: COLORS.tasks,
    icon: 'wallet',
  },
  insights: {
    label: 'Insights',
    color: COLORS.blue,
    icon: 'zap',
  },
};
