const API_URL = '';

interface ApiError extends Error {
  status?: number;
  response?: {
    data?: {
      message?: string;
    };
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ApiError = new Error('An error occurred');
    error.status = response.status;
    try {
      const data = await response.json();
      error.message = data.message || `HTTP error ${response.status}`;
      error.response = data;
    } catch {
      error.message = `HTTP error ${response.status}`;
    }
    throw error;
  }

  try {
    return await response.json();
  } catch {
    return {} as T;
  }
}

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });
  return handleResponse<T>(response);
}

export const api = {
  async get<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint);
  },

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  async delete<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: 'DELETE' });
  },
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}