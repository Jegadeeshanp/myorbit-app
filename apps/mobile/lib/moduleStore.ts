import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { apiRequest } from '@myorbit/api';

const MODULES_KEY = 'myorbit_enabled_modules';

export const ALL_MODULES = ['finance', 'tasks', 'habits', 'goals', 'health', 'insights'] as const;
export type ModuleKey = typeof ALL_MODULES[number];

interface ModuleState {
  enabledModules: ModuleKey[];
  toggle: (key: ModuleKey) => Promise<void>;
  hydrate: () => Promise<void>;
  syncFromServer: () => Promise<void>;
}

function parseModules(raw: string): ModuleKey[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is ModuleKey => ALL_MODULES.includes(s as ModuleKey));
}

export const useModuleStore = create<ModuleState>((set, get) => ({
  enabledModules: [...ALL_MODULES],

  toggle: async (key) => {
    const current = get().enabledModules;
    const isEnabled = current.includes(key);
    if (isEnabled && current.length <= 1) return; // keep at least one module

    const next = isEnabled ? current.filter((m) => m !== key) : [...current, key];
    set({ enabledModules: next });

    try { await SecureStore.setItemAsync(MODULES_KEY, next.join(',')); } catch {}
    try {
      await apiRequest('/api/settings', {
        method: 'PATCH',
        body: JSON.stringify({ enabledModules: next }),
      });
    } catch {}
  },

  hydrate: async () => {
    try {
      const stored = await SecureStore.getItemAsync(MODULES_KEY);
      if (stored) {
        const modules = parseModules(stored);
        if (modules.length > 0) { set({ enabledModules: modules }); return; }
      }
    } catch {}
  },

  syncFromServer: async () => {
    try {
      const data = await apiRequest<{ preferences: { enabledModules: string[] } }>('/api/settings');
      const modules = (data.preferences.enabledModules ?? []).filter(
        (m): m is ModuleKey => ALL_MODULES.includes(m as ModuleKey),
      );
      if (modules.length > 0) {
        set({ enabledModules: modules });
        await SecureStore.setItemAsync(MODULES_KEY, modules.join(','));
      }
    } catch {}
  },
}));
