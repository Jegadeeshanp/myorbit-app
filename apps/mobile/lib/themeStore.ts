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
  bg:        '#111111',
  cardBg:    '#1A1A1A',
  modalBg:   '#141414',
  surface:   '#1E1E1E',
  surfaceAlt:'#242424',
  text:      '#FFFFFF',
  textSec:   '#E5E7EB',
  subText:   '#9CA3AF',
  mutedText: '#6B7280',
  border:    '#2A2A2A',
  inputBg:   '#1E1E1E',
  accent:    '#10B981',
  danger:    '#EF4444',
};

export const LIGHT: Theme = {
  bg:        '#F3F4F6',
  cardBg:    '#FFFFFF',
  modalBg:   '#FFFFFF',
  surface:   '#F9FAFB',
  surfaceAlt:'#F3F4F6',
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
