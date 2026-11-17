import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch, type User } from '@/lib/api';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch current user on mount (from cookie)
  const refreshUser = async () => {
    try {
      const data = await apiFetch<{ success: boolean; user: User }>('/auth/me');
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      try {
        const data = await apiFetch<{ success: boolean; user: User }>('/auth/me');
        if (isMounted) {
          if (data.success && data.user) {
            setUser(data.user);
          } else {
            setUser(null);
          }
        }
      } catch {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    initAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiFetch<{ success: boolean; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.user) {
      setUser(data.user);
    }
  };

  const requestSignupOtp = async (email: string) => {
    await apiFetch('/auth/signup-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  };

  const signup = async (name: string, email: string, password: string, otp: string) => {
    const data = await apiFetch<{ success: boolean; user: User }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, otp }),
    });
    if (data.user) {
      setUser(data.user);
    }
  };

  const logout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
    }
  };

  const initiateGoogleLogin = async () => {
    const data = await apiFetch<{ success: boolean; url: string }>('/auth/google/url');
    if (data.url) {
      window.location.href = data.url;
    }
  };

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
