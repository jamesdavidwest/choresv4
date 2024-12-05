const API_URL = 'http://localhost:3001/api';
const DEFAULT_TIMEOUT = 15000;

class ApiError extends Error {
  constructor(message, status, data, functionName = '') {
    super(message);
    this.status = status;
    this.data = data;
    this.functionName = functionName;
    this.name = 'ApiError';
    this.fullMessage = functionName ? `${functionName}: ${message}` : message;
  }

  toString() {
    return this.fullMessage;
  }
}

const fetchWithTimeout = (resource, options = {}) => {
  const { timeout = DEFAULT_TIMEOUT } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  return fetch(resource, {
    ...options,
    signal: controller.signal,
  }).finally(() => clearTimeout(id));
};

const fetchWithAuth = async (endpoint, options = {}, functionName = '') => {
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

    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/signin';
      throw new ApiError('Session expired. Please login again.', 401, null, functionName);
    }

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = {
          message: `Server returned ${response.status}: ${response.statusText}`,
          status: response.status
        };
      }
      throw new ApiError(
        errorData.message || `Request failed with status ${response.status}`,
        response.status,
        errorData,
        functionName
      );
    }

    if (response.status === 204) {
      return null;
    }

    try {
      return await response.json();
    } catch (e) {
      throw new ApiError('Invalid response from server', 500, null, functionName);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new ApiError('Request timeout - please try again', 408, null, functionName);
    }
    if (error instanceof ApiError) {
      error.functionName = functionName || error.functionName;
      throw error;
    }
    throw new ApiError(error.message || 'Network error', 0, null, functionName);
  }
};

export const auth = {
  login: async (credentials) => {
    if (!credentials.username || !credentials.password) {
      throw new ApiError('Username and password are required', 400, null, 'auth.login');
    }
    
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new ApiError(error.message || error.error || 'Login failed', response.status, null, 'auth.login');
      }

      const data = await response.json();
      
      if (data.token) {
        localStorage.setItem('token', data.token);
        return data;
      } else {
        throw new ApiError('No token received from server', 500, null, 'auth.login');
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(error.message || 'Login failed', 500, null, 'auth.login');
    }
  },

  getCurrentUser: () => fetchWithAuth('/auth/me', {}, 'auth.getCurrentUser'),

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};

export const users = {
  getAll: () => fetchWithAuth('/users', {}, 'users.getAll'),
};

export const locations = {
  getAll: () => fetchWithAuth('/locations', {}, 'locations.getAll'),
  getById: (id) => {
    if (!id) throw new ApiError('Location ID is required', 400, null, 'locations.getById');
    return fetchWithAuth(`/locations/${id}`, {}, 'locations.getById');
  }
};

export const chores = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(
      `/chores${queryString ? `?${queryString}` : ''}`,
      {},
      'chores.getAll'
    );
  },

  getById: (id) => {
    if (!id) throw new ApiError('Chore ID is required', 400, null, 'chores.getById');
    return fetchWithAuth(`/chores/${id}`, {}, 'chores.getById');
  },

  create: (choreData) => {
    if (!choreData.name || !choreData.frequency_id || !choreData.location_id) {
      throw new ApiError('Name, frequency, and location are required', 400, null, 'chores.create');
    }
    return fetchWithAuth('/chores', {
      method: 'POST',
      body: JSON.stringify(choreData),
    }, 'chores.create');
  },

  update: (id, choreData) => {
    if (!id) throw new ApiError('Chore ID is required', 400, null, 'chores.update');
    return fetchWithAuth(`/chores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(choreData),
    }, 'chores.update');
  },

  delete: (id) => {
    if (!id) throw new ApiError('Chore ID is required', 400, null, 'chores.delete');
    return fetchWithAuth(`/chores/${id}`, {
      method: 'DELETE',
    }, 'chores.delete');
  },

  toggleComplete: async (id, isComplete) => {
    if (!id) throw new ApiError('Chore ID is required', 400, null, 'chores.toggleComplete');
    
    const maxRetries = 3;
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fetchWithAuth(`/chores/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            is_complete: isComplete,
            last_completed: isComplete ? new Date().toISOString() : null,
          }),
        }, 'chores.toggleComplete');
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          continue;
        }
        throw new ApiError(
          `Failed after ${maxRetries} attempts: ${error.message}`,
          error.status || 500,
          error.data,
          'chores.toggleComplete'
        );
      }
    }
    
    throw lastError;
  },

  batchUpdate: (updates) => {
    if (!Array.isArray(updates) || !updates.length) {
      throw new ApiError('Updates array is required', 400, null, 'chores.batchUpdate');
    }
    return fetchWithAuth('/chores/batch', {
      method: 'PUT',
      body: JSON.stringify({ updates }),
    }, 'chores.batchUpdate');
  },
};

export { ApiError };