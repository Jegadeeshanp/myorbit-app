import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { loginUser, loginWithGoogle, loginWithApple, setAuthToken } from '@myorbit/api';

const TOKEN_KEY = 'myorbit_token';
const USER_KEY  = 'myorbit_user';

interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  token:          string | null;
  user:           AuthUser | null;
  isLoading:      boolean;
  login:          (email: string, password: string) => Promise<void>;
  signInWithGoogle: (accessToken: string) => Promise<void>;
  signInWithApple:  (identityToken: string, fullName?: string) => Promise<void>;
  logout:         () => Promise<void>;
  hydrate:        () => Promise<void>;
}

async function persistSession(token: string, user: AuthUser) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  setAuthToken(token);
}

export const useAuthStore = create<AuthState>((set) => ({
  token:     null,
  user:      null,
  isLoading: true,

  login: async (email, password) => {
    const { token, user } = await loginUser(email, password);
    await persistSession(token, user);
    set({ token, user });
  },

  signInWithGoogle: async (accessToken) => {
    const { token, user } = await loginWithGoogle(accessToken);
    await persistSession(token, user);
    set({ token, user });
  },

  signInWithApple: async (identityToken, fullName) => {
    const { token, user } = await loginWithApple(identityToken, fullName);
    await persistSession(token, user);
    set({ token, user });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    setAuthToken(null);
    set({ token: null, user: null });
  },

  hydrate: async () => {
    try {
      const token   = await SecureStore.getItemAsync(TOKEN_KEY);
      const userStr = await SecureStore.getItemAsync(USER_KEY);
      if (token && userStr) {
        const user = JSON.parse(userStr) as AuthUser;
        setAuthToken(token);
        set({ token, user, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
