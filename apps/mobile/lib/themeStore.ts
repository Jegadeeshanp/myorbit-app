import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const THEME_KEY = 'myorbit_theme';

interface ThemeState {
  isDark:  boolean;
  toggle:  () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: true,

  toggle: async () => {
    const next = !get().isDark;
    try { await SecureStore.setItemAsync(THEME_KEY, next ? 'dark' : 'light'); } catch {}
    set({ isDark: next });
  },

  hydrate: async () => {
    try {
      const stored = await SecureStore.getItemAsync(THEME_KEY);
      if (stored) set({ isDark: stored === 'dark' });
    } catch {}
  },
}));

// ── Colour palette ────────────────────────────────────────────────────────────

export interface Theme {
  bg:        string;  // screen background
  cardBg:    string;  // card / panel background
  modalBg:   string;  // bottom-sheet / modal background
  surface:   string;  // secondary surface (inputs, chips)
  surfaceAlt:string;  // tertiary surface
  text:      string;  // primary text
  textSec:   string;  // secondary text (slightly dimmer)
  subText:   string;  // muted text
  mutedText: string;  // very muted / placeholder text
  border:    string;  // border / divider
  inputBg:   string;  // text input background
  accent:    string;
  danger:    string;
}

export const DARK: Theme = {
  bg:        '#0d1117',  // web page bg
  cardBg:    '#1c2128',  // web card
  modalBg:   '#161b22',  // web surface
  surface:   '#161b22',  // web surface
  surfaceAlt:'#21262d',  // web card-alt
  text:      '#e6edf3',  // web text-1
  textSec:   '#adbac7',  // web text-2
  subText:   '#8b949e',  // web text-gray-600
  mutedText: '#636e7b',  // web text-3
  border:    '#30363d',  // web border
  inputBg:   '#21262d',  // web card-alt
  accent:    '#10B981',
  danger:    '#EF4444',
};

export const LIGHT: Theme = {
  bg:        '#F9FAFB',  // bg-gray-50
  cardBg:    '#FFFFFF',
  modalBg:   '#FFFFFF',
  surface:   '#F3F4F6',  // bg-gray-100
  surfaceAlt:'#E5E7EB',  // bg-gray-200
  text:      '#111827',
  textSec:   '#374151',
  subText:   '#6B7280',
  mutedText: '#9CA3AF',
  border:    '#E5E7EB',
  inputBg:   '#F9FAFB',
  accent:    '#10B981',
  danger:    '#EF4444',
};

export function getTheme(isDark: boolean): Theme {
  return isDark ? DARK : LIGHT;
}

export function useTheme(): Theme {
  const { isDark } = useThemeStore();
  return getTheme(isDark);
}
