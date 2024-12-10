// src/hooks/useApi.js
import { useState, useCallback, useEffect, useRef } from 'react';
import { ApiError } from '../services/api';

export const useApi = (apiFunc, options = {}) => {
  const {
    immediate = false,
    params = [],
    onSuccess,
    onError,
    transformResponse,
    cacheKey,
    cacheDuration = 300000 // 5 minutes default cache duration
  } = options;

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const cache = useRef(new Map());
  const abortController = useRef(null);

  // Cache management
  const getCachedData = useCallback((key) => {
    const cached = cache.current.get(key);
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > cacheDuration;
    if (isExpired) {
      cache.current.delete(key);
      return null;
    }
    
    return cached.data;
  }, [cacheDuration]);

  const setCachedData = useCallback((key, newData) => {
    if (!key) return;
    cache.current.set(key, {
      data: newData,
      timestamp: Date.now()
    });
  }, []);

  // Main execute function
  const execute = useCallback(async (...executionParams) => {
    // Cancel any in-flight requests
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      // Check cache first if cacheKey is provided
      if (cacheKey) {
        const key = typeof cacheKey === 'function' 
          ? cacheKey(...executionParams) 
          : cacheKey;
        const cachedData = getCachedData(key);
        if (cachedData) {
          setData(cachedData);
          return cachedData;
        }
      }

      const result = await apiFunc(...executionParams);
      
      // Transform response if needed
      const transformedResult = transformResponse 
        ? transformResponse(result) 
        : result;

      // Update state and cache
      setData(transformedResult);
      if (cacheKey) {
        const key = typeof cacheKey === 'function'
          ? cacheKey(...executionParams)
          : cacheKey;
        setCachedData(key, transformedResult);
      }

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(transformedResult);
      }

      return transformedResult;
    } catch (error) {
      const apiError = error instanceof ApiError 
        ? error 
        : new ApiError(error.message, 500, null, apiFunc.name);

      setError(apiError);
      
      // Call onError callback if provided
      if (onError) {
        onError(apiError);
      }

      throw apiError;
    } finally {
      if (!abortController.current.signal.aborted) {
        setLoading(false);
        abortController.current = null;
      }
    }
  }, [apiFunc, cacheKey, transformResponse, onSuccess, onError, getCachedData, setCachedData]);

  // Handle immediate execution
  useEffect(() => {
    if (immediate) {
      execute(...params);
    }
    
    // Cleanup function
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [immediate, execute, params]);

  // Utility function to manually clear cache
  const clearCache = useCallback(() => {
    cache.current.clear();
  }, []);

  return {
    data,
    error,
    loading,
    execute,
    clearCache,
    // Additional helper methods
    reset: useCallback(() => {
      setData(null);
      setError(null);
      setLoading(false);
    }, []),
    setData: useCallback((newData) => {
      setData(newData);
      if (cacheKey) {
        const key = typeof cacheKey === 'function'
          ? cacheKey(...params)
          : cacheKey;
        setCachedData(key, newData);
      }
    }, [cacheKey, params, setCachedData])
  };
};

// Example usage:
/*
const {
  data: tasks,
  loading,
  error,
  execute: fetchTasks
} = useApi(api.tasks.getAll, {
  immediate: true,
  params: [{ startDate: '2024-01-01', endDate: '2024-12-31' }],
  cacheKey: (params) => `tasks-${JSON.stringify(params)}`,
  transformResponse: (response) => {
    // Transform the response data if needed
    return response.map(task => ({
      ...task,
      formattedDate: new Date(task.due_date).toLocaleDateString()
    }));
  },
  onSuccess: (data) => {
    console.log('Tasks loaded successfully:', data);
  },
  onError: (error) => {
    console.error('Failed to load tasks:', error);
  }
});
*/