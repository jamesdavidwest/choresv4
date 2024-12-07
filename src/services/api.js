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
    if (!token && endpoint !== '/auth/login') {
      console.error('No token found for authenticated request');
      throw new ApiError('Authentication required', 401, null, functionName);
    }

    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    console.log(`API Request: ${endpoint}`, {
      method: options.method || 'GET',
      headers: { ...headers, Authorization: token ? 'Bearer [REDACTED]' : undefined }
    });

    const response = await fetchWithTimeout(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    console.log(`API Response: ${endpoint}`, {
      status: response.status,
      statusText: response.statusText
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
      const data = await response.json();
      console.log(`API Data: ${endpoint}`, data);
      return data;
    } catch (e) {
      throw new ApiError('Invalid response from server', 500, null, functionName);
    }
  } catch (error) {
    console.error(`API Error in ${functionName}:`, {
      message: error.message,
      status: error.status,
      data: error.data,
      stack: error.stack
    });

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
    // Validate required fields
    if (!choreData.name || !choreData.frequency_id || !choreData.location_id) {
      throw new ApiError('Name, frequency, and location are required', 400, null, 'chores.create');
    }

    // Ensure due_time is properly formatted if provided
    if (choreData.due_time) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(choreData.due_time)) {
        throw new ApiError('Invalid time format. Use HH:mm format (e.g., 09:00)', 400, null, 'chores.create');
      }
    }

    // Ensure due_date is properly formatted if provided
    if (choreData.due_date) {
      const dateObj = new Date(choreData.due_date);
      if (isNaN(dateObj.getTime())) {
        throw new ApiError('Invalid date format', 400, null, 'chores.create');
      }
    }

    return fetchWithAuth('/chores', {
      method: 'POST',
      body: JSON.stringify(choreData),
    }, 'chores.create');
  },

  update: async (id, choreData) => {
    if (!id) throw new ApiError('Chore ID is required', 400, null, 'chores.update');
    
    try {
      // First verify the chore exists
      const existingChore = await fetchWithAuth(`/chores/${id}`, {}, 'chores.update.verify');
      
      if (!existingChore) {
        throw new ApiError('Chore not found', 404, null, 'chores.update');
      }

      // Then perform the update
      return await fetchWithAuth(`/chores/${id}`, {
        method: 'PUT',
        body: JSON.stringify(choreData),
      }, 'chores.update');
    } catch (error) {
      console.error('Update chore error:', {
        id,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  },

  delete: (id) => {
    if (!id) throw new ApiError('Chore ID is required', 400, null, 'chores.delete');
    return fetchWithAuth(`/chores/${id}`, {
      method: 'DELETE',
    }, 'chores.delete');
  },

  toggleComplete: async (choreId, instanceId) => {
    if (!choreId) throw new ApiError('Chore ID is required', 400, null, 'chores.toggleComplete');
    
    try {
      if (instanceId) {
        // Get current instance state
        const response = await fetchWithAuth(`/chores/${choreId}`, {}, 'chores.toggleComplete.get');
        const instance = response.instances?.find(i => i.id === instanceId);
        
        if (!instance) {
          throw new ApiError('Chore instance not found', 404, null, 'chores.toggleComplete');
        }

        // Update the instance
        return await fetchWithAuth(`/chores/${choreId}/instances/${instanceId}`, {
          method: 'PUT',
          body: JSON.stringify({
            is_complete: !instance.is_complete
          }),
        }, 'chores.toggleComplete.instance');
      } else {
        // Legacy behavior for chores without instances
        const currentChore = await fetchWithAuth(`/chores/${choreId}`, {}, 'chores.toggleComplete.get');
        
        if (!currentChore) {
          throw new ApiError('Chore not found', 404, null, 'chores.toggleComplete');
        }

        const updatedChore = {
          ...currentChore,
          is_complete: !currentChore.is_complete,
          last_completed: !currentChore.is_complete ? new Date().toISOString() : null
        };

        return await fetchWithAuth(`/chores/${choreId}`, {
          method: 'PUT',
          body: JSON.stringify(updatedChore),
        }, 'chores.toggleComplete.update');
      }
    } catch (error) {
      console.error('Toggle complete error:', {
        choreId,
        instanceId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
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

  // Instance-specific methods
  getInstance: (choreId, instanceId) => {
    if (!choreId) throw new ApiError('Chore ID is required', 400, null, 'chores.getInstance');
    if (!instanceId) throw new ApiError('Instance ID is required', 400, null, 'chores.getInstance');
    
    return fetchWithAuth(`/chores/${choreId}/instances/${instanceId}`, {}, 'chores.getInstance');
  },

  getInstances: (choreId, params = {}) => {
    if (!choreId) throw new ApiError('Chore ID is required', 400, null, 'chores.getInstances');
    
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(
      `/chores/${choreId}/instances${queryString ? `?${queryString}` : ''}`,
      {},
      'chores.getInstances'
    );
  },

  updateInstance: (choreId, instanceId, updates) => {
    if (!choreId) throw new ApiError('Chore ID is required', 400, null, 'chores.updateInstance');
    if (!instanceId) throw new ApiError('Instance ID is required', 400, null, 'chores.updateInstance');
    
    return fetchWithAuth(`/chores/${choreId}/instances/${instanceId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }, 'chores.updateInstance');
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

export { ApiError };