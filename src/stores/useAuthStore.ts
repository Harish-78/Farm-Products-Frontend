import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import type { User } from '@/lib/api';
import { apiFetch } from '@/lib/api';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  refreshUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    name: string,
    email: string,
    password: string,
    otp: string
  ) => Promise<void>;
  requestSignupOtp: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  initiateGoogleLogin: () => Promise<void>;
}

const storage: StateStorage = {
  getItem: (name) => {
    const value = localStorage.getItem(name);
    return value === null ? null : value;
  },
  setItem: (name, value) => {
    localStorage.setItem(name, value);
  },
  removeItem: (name) => {
    localStorage.removeItem(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: true,

      setUser: (user) => set({ user }),
      setLoading: (loading) => set({ loading }),

      refreshUser: async () => {
        try {
          const data = await apiFetch<{ success: boolean; user: User }>(
            '/auth/me'
          );
          if (data.success && data.user) {
            set({ user: data.user, loading: false });
          } else {
            set({ user: null, loading: false });
          }
        } catch {
          set({ user: null, loading: false });
        }
      },

      login: async (email, password) => {
        const data = await apiFetch<{ success: boolean; user: User }>(
          '/auth/login',
          {
            method: 'POST',
            body: JSON.stringify({ email, password }),
          }
        );
        if (data.user) {
          set({ user: data.user, loading: false });
        }
      },

      requestSignupOtp: async (email) => {
        await apiFetch('/auth/signup-otp', {
          method: 'POST',
          body: JSON.stringify({ email }),
        });
      },

      signup: async (name, email, password, otp) => {
        const data = await apiFetch<{ success: boolean; user: User }>(
          '/auth/signup',
          {
            method: 'POST',
            body: JSON.stringify({ name, email, password, otp }),
          }
        );
        if (data.user) {
          set({ user: data.user, loading: false });
        }
      },

      logout: async () => {
        try {
          await apiFetch('/auth/logout', { method: 'POST' });
        } finally {
          set({ user: null, loading: false });
        }
      },

      initiateGoogleLogin: async () => {
        const data = await apiFetch<{ success: boolean; url: string }>(
          '/auth/google/url'
        );
        if (data.url) {
          window.location.href = data.url;
        }
      },
    }),
    {
      name: 'poongodi-auth-storage',
      storage: createJSONStorage(() => storage),
      // Only persist the authenticated user; loading/actions are never persisted.
      partialize: (state) => ({ user: state.user }),
    }
  )
);