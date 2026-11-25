import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import type { User } from '@/lib/api';

type UserRole = 'admin' | 'user';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, otp: string) => Promise<void>;
  requestSignupOtp: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  initiateGoogleLogin: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function resolveUserRole(user: User | null): UserRole {
  return String(user?.role || '').toLowerCase().trim() === 'admin' ? 'admin' : 'user';
}

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

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (!mounted) return;
      await refreshUser();
    };
    void init();
    return () => {
      mounted = false;
    };
  }, [refreshUser]);

  const role = resolveUserRole(user);
  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAdmin,
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