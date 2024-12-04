// src/services/api.js

const API_URL = 'http://localhost:3001/api';
const DEFAULT_TIMEOUT = 5000; // 5 seconds

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

// Helper to handle fetch calls with timeout
const fetchWithTimeout = (resource, options = {}) => {
  const { timeout = DEFAULT_TIMEOUT } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  return fetch(resource, {
    ...options,
    signal: controller.signal,
  }).finally(() => clearTimeout(id));
};

const fetchWithAuth = async (endpoint, options = {}) => {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetchWithTimeout(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/signin';
      throw new ApiError('Session expired. Please login again.', 401);
    }

    // Handle other non-200 responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || errorData.error || 'An error occurred',
        response.status,
        errorData
      );
    }

    // Handle no content responses
    if (response.status === 204) {
      return null;
    }

    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new ApiError('Request timeout', 408);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message || 'Network error', 0);
  }
};

// Auth API calls
export const auth = {
  login: async (credentials) => {
    if (!credentials.username || !credentials.password) {
      throw new ApiError('Username and password are required', 400);
    }
    
    // We'll make this request without authentication
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(error.message || error.error || 'Login failed', response.status);
    }

    const data = await response.json();
    
    if (data.token) {
      localStorage.setItem('token', data.token);
      return data;
    } else {
      throw new ApiError('No token received from server', 500);
    }
  },

  getCurrentUser: () => fetchWithAuth('/auth/me'),

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};

// Chores API calls
export const chores = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/chores${queryString ? `?${queryString}` : ''}`);
  },

  getById: (id) => {
    if (!id) throw new ApiError('Chore ID is required', 400);
    return fetchWithAuth(`/chores/${id}`);
  },

  create: (choreData) => {
    if (!choreData.name || !choreData.frequency_id || !choreData.location_id) {
      throw new ApiError('Name, frequency, and location are required', 400);
    }
    return fetchWithAuth('/chores', {
      method: 'POST',
      body: JSON.stringify(choreData),
    });
  },

  update: (id, choreData) => {
    if (!id) throw new ApiError('Chore ID is required', 400);
    return fetchWithAuth(`/chores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(choreData),
    });
  },

  delete: (id) => {
    if (!id) throw new ApiError('Chore ID is required', 400);
    return fetchWithAuth(`/chores/${id}`, {
      method: 'DELETE',
    });
  },

  toggleComplete: async (id, isComplete) => {
    if (!id) throw new ApiError('Chore ID is required', 400);
    return fetchWithAuth(`/chores/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        is_complete: isComplete,
        last_completed: isComplete ? new Date().toISOString() : null,
      }),
    });
  },

  // Batch operations
  batchUpdate: (updates) => {
    if (!Array.isArray(updates) || !updates.length) {
      throw new ApiError('Updates array is required', 400);
    }
    return fetchWithAuth('/chores/batch', {
      method: 'PUT',
      body: JSON.stringify({ updates }),
    });
  },
};

// Export error class for use in components
export { ApiError };