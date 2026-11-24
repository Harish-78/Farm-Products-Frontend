import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import type { User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, otp: string) => Promise<void>;
  requestSignupOtp: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  initiateGoogleLogin: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider is now a thin React wrapper around the Zustand auth store
 * (`useAuthStore`). The store is the single source of truth for auth state and
 * persists the authenticated user to localStorage. All existing `useAuth()`
 * consumers continue to work unchanged.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    user,
    loading,
    login,
    signup,
    requestSignupOtp,
    logout,
    initiateGoogleLogin,
    refreshUser,
  } = useAuthStore();

  // Re-hydrate/confirm the session from the server cookie on mount.
  useEffect(() => {
    const init = async () => {
      await refreshUser();
      // `loading` is reset to false inside refreshUser.
    };
    init();
  }, [refreshUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        requestSignupOtp,
        logout,
        initiateGoogleLogin,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
