const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
  created_at?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  user?: User;
  url?: string;
  data?: T;
}

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include', // Important: sends and receives HTTP-only cookies
  });

  const data = await response.json().catch(() => ({
    success: false,
    message: 'Invalid server response',
  }));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}
