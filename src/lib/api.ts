const API_BASE = import.meta.env.VITE_API_BASE || '/api';

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
  // Ensure endpoint has a leading slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const response = await fetch(`${API_BASE}${cleanEndpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include', // Important: sends and receives cookies on the same origin
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
