const API_URL = 'http://localhost:3001/api';
const DEFAULT_TIMEOUT = 15000;
const BATCH_SIZE = 50;

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

    const requestOptions = {
      ...options,
      headers,
    };

    console.log(`API Request: ${endpoint}`, {
      method: options.method || 'GET',
      headers: { ...headers, Authorization: token ? 'Bearer [REDACTED]' : undefined },
      body: options.body ? JSON.parse(options.body) : undefined
    });

    const response = await fetchWithTimeout(`${API_URL}${endpoint}`, requestOptions);

    console.log(`API Response: ${endpoint}`, {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
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

    const data = await response.json();
    console.log(`API Data: ${endpoint}`, data);
    return data;
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

// Cache for batch operations
const batchCache = new Map();

export const chores = {
  getAll: async (params = {}) => {
    console.log('API getAll - params:', params);
    const queryParams = { ...params };
    
    // Only include userId if it's not null
    if (queryParams.userId === null || queryParams.userId === undefined) {
      delete queryParams.userId;
    } else {
      queryParams.userId = parseInt(queryParams.userId, 10);
    }
    
    const queryString = new URLSearchParams(queryParams).toString();
    const cacheKey = `chores-${queryString}`;
    
    // Check cache first
    if (batchCache.has(cacheKey)) {
      return batchCache.get(cacheKey);
    }
    
    console.log('API getAll - queryString:', queryString);
    const data = await fetchWithAuth(
      `/chores${queryString ? `?${queryString}` : ''}`,
      {},
      'chores.getAll'
    );
    
    // Cache the result
    batchCache.set(cacheKey, data);
    
    // Clear cache after 5 minutes
    setTimeout(() => batchCache.delete(cacheKey), 300000);
    
    return data;
  },

  getById: (id) => {
    if (!id) throw new ApiError('Chore ID is required', 400, null, 'chores.getById');
    return fetchWithAuth(`/chores/${id}`, {}, 'chores.getById');
  },

  create: async (choreData) => {
    if (!choreData.name || !choreData.frequency_id || !choreData.location_id) {
      throw new ApiError('Name, frequency, and location are required', 400, null, 'chores.create');
    }

    // Validate due time if provided
    if (choreData.due_time) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(choreData.due_time)) {
        throw new ApiError('Invalid time format. Use HH:mm format (e.g., 09:00)', 400, null, 'chores.create');
      }
    }

    const result = await fetchWithAuth('/chores', {
      method: 'POST',
      body: JSON.stringify(choreData),
    }, 'chores.create');

    // Clear all cache entries as new chore affects all queries
    batchCache.clear();

    return result;
  },

  update: async (id, choreData) => {
    if (!id) throw new ApiError('Chore ID is required', 400, null, 'chores.update');
    
    const result = await fetchWithAuth(`/chores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(choreData),
    }, 'chores.update');

    // Clear all cache entries as update affects all queries
    batchCache.clear();

    return result;
  },

  delete: async (id) => {
    if (!id) throw new ApiError('Chore ID is required', 400, null, 'chores.delete');
    
    const result = await fetchWithAuth(`/chores/${id}`, {
      method: 'DELETE',
    }, 'chores.delete');

    // Clear all cache entries as deletion affects all queries
    batchCache.clear();

    return result;
  },

  toggleComplete: async (choreId, instanceId) => {
    if (!choreId) throw new ApiError('Chore ID is required', 400, null, 'chores.toggleComplete');
    
    try {
      if (instanceId) {
        // First get the current instance state
        const currentChore = await fetchWithAuth(`/chores/${choreId}`, {}, 'chores.toggleComplete.get');
        const currentInstance = currentChore.instances?.find(i => i.id === parseInt(instanceId));
        
        if (!currentInstance) {
          throw new ApiError('Instance not found', 404, null, 'chores.toggleComplete');
        }

        // Optimistic update in cache
        batchCache.forEach((value, key) => {
          if (key.startsWith('chores-')) {
            const updatedData = value.map(chore => {
              if (chore.id === choreId) {
                return {
                  ...chore,
                  instances: chore.instances?.map(instance => {
                    if (instance.id === parseInt(instanceId)) {
                      return {
                        ...instance,
                        is_complete: !currentInstance.is_complete,
                        completed_at: !currentInstance.is_complete ? new Date().toISOString() : null
                      };
                    }
                    return instance;
                  })
                };
              }
              return chore;
            });
            batchCache.set(key, updatedData);
          }
        });

        const response = await fetchWithAuth(`/chores/${choreId}/instances/${instanceId}`, {
          method: 'PUT',
          body: JSON.stringify({
            is_complete: !currentInstance.is_complete
          }),
        }, 'chores.toggleComplete.instance');

        return response;
      } else {
        const currentChore = await fetchWithAuth(`/chores/${choreId}`, {}, 'chores.toggleComplete.get');
        
        if (!currentChore) {
          throw new ApiError('Chore not found', 404, null, 'chores.toggleComplete');
        }

        // Optimistic update in cache
        batchCache.forEach((value, key) => {
          if (key.startsWith('chores-')) {
            const updatedData = value.map(chore => {
              if (chore.id === choreId) {
                return {
                  ...chore,
                  is_complete: !currentChore.is_complete,
                  last_completed: !currentChore.is_complete ? new Date().toISOString() : null
                };
              }
              return chore;
            });
            batchCache.set(key, updatedData);
          }
        });

        return await fetchWithAuth(`/chores/${choreId}`, {
          method: 'PUT',
          body: JSON.stringify({
            is_complete: !currentChore.is_complete,
            last_completed: !currentChore.is_complete ? new Date().toISOString() : null
          }),
        }, 'chores.toggleComplete.update');
      }
    } catch (error) {
      // Revert optimistic updates on error
      batchCache.clear();
      
      console.error('Toggle complete error:', {
        choreId,
        instanceId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  },

  // New method for batch operations
  updateBatch: async (updates) => {
    if (!Array.isArray(updates) || updates.length === 0) {
      throw new ApiError('Updates array is required', 400, null, 'chores.updateBatch');
    }

    const results = [];
    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = updates.slice(i, i + BATCH_SIZE);
      const batchResults = await fetchWithAuth('/chores/batch', {
        method: 'PUT',
        body: JSON.stringify({ updates: batch }),
      }, 'chores.updateBatch');
      results.push(...batchResults);

      // Allow UI to update between batches
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    // Clear cache after batch update
    batchCache.clear();

    return results;
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
    batchCache.clear();
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

// Make sure both the class and its exports are available
export { ApiError };
