// src/hooks/useApi.js
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { ApiError } from '../services/api';

/**
 * Enhanced API hook with SQLite support and improved caching
 * @param {Function} apiFunc - API function to call
 * @param {Object} options - Configuration options
 * @returns {Object} API state and control functions
 */
export const useApi = (apiFunc, options = {}) => {
  const {
    immediate = false,
    params = [],
    onSuccess,
    onError,
    transformResponse,
    cacheKey,
    cacheDuration = 300000, // 5 minutes default
    retryCount = 0,
    retryDelay = 1000,
    batchSize = 50,
    debounceMs = 0
  } = options;

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [retries, setRetries] = useState(0);
  
  const cache = useRef(new Map());
  const abortController = useRef(null);
  const debounceTimer = useRef(null);

  // Memoize static values
  const memoizedOptions = useMemo(() => ({
    retryCount,
    retryDelay,
    batchSize,
    debounceMs,
    cacheDuration
  }), [retryCount, retryDelay, batchSize, debounceMs, cacheDuration]);

  // Cache management
  const getCachedData = useCallback((key) => {
    const cached = cache.current.get(key);
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > memoizedOptions.cacheDuration;
    if (isExpired) {
      cache.current.delete(key);
      return null;
    }
    
    return cached.data;
  }, [memoizedOptions.cacheDuration]);

  const setCachedData = useCallback((key, newData) => {
    if (!key) return;
    cache.current.set(key, {
      data: newData,
      timestamp: Date.now()
    });
  }, []);

  // Retry logic
  const shouldRetry = useCallback((error) => {
    return (error.status >= 500 || error.status === 0) && 
           retries < memoizedOptions.retryCount;
  }, [retries, memoizedOptions.retryCount]);

  // Main execute implementation
  const executeImpl = useCallback(async (...executionParams) => {
    try {
      if (abortController.current) {
        abortController.current.abort();
      }
      abortController.current = new AbortController();

      setLoading(true);
      setError(null);

      // Check cache first
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

      // Handle batch operations
      let result;
      if (Array.isArray(executionParams[0]) && executionParams[0].length > memoizedOptions.batchSize) {
        const items = executionParams[0];
        const batches = [];
        
        for (let i = 0; i < items.length; i += memoizedOptions.batchSize) {
          const batch = items.slice(i, i + memoizedOptions.batchSize);
          batches.push(await apiFunc(batch, ...executionParams.slice(1)));
          await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        result = batches.flat();
      } else {
        result = await apiFunc(...executionParams);
      }

      const transformedResult = transformResponse 
        ? transformResponse(result) 
        : result;

      setData(transformedResult);
      if (cacheKey) {
        const key = typeof cacheKey === 'function'
          ? cacheKey(...executionParams)
          : cacheKey;
        setCachedData(key, transformedResult);
      }

      setRetries(0);

      if (onSuccess) {
        onSuccess(transformedResult);
      }

      return transformedResult;
    } catch (error) {
      const apiError = error instanceof ApiError 
        ? error 
        : new ApiError(
            error.message || 'An unexpected error occurred',
            error.status || 500,
            error.data || null,
            apiFunc.name
          );

      if (shouldRetry(apiError)) {
        setRetries(prev => prev + 1);
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(executeImpl(...executionParams));
          }, memoizedOptions.retryDelay * Math.pow(2, retries));
        });
      }

      setError(apiError);
      if (onError) {
        onError(apiError);
      }
      throw apiError;
    } finally {
      if (!abortController.current?.signal.aborted) {
        setLoading(false);
        abortController.current = null;
      }
    }
  }, [
    apiFunc,
    cacheKey,
    transformResponse,
    onSuccess,
    onError,
    getCachedData,
    setCachedData,
    shouldRetry,
    retries,
    memoizedOptions.retryDelay,
    memoizedOptions.batchSize
  ]);

  // Debounced execute wrapper
  const execute = useCallback((...executionParams) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!memoizedOptions.debounceMs) {
      return executeImpl(...executionParams);
    }

    return new Promise((resolve, reject) => {
      debounceTimer.current = setTimeout(() => {
        executeImpl(...executionParams)
          .then(resolve)
          .catch(reject);
      }, memoizedOptions.debounceMs);
    });
  }, [executeImpl, memoizedOptions.debounceMs]);

  // Handle immediate execution
  useEffect(() => {
    if (immediate) {
      execute(...params);
    }
    
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [immediate, execute, params]);

  // Utility functions
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
    setRetries(0);
  }, []);

  const clearCache = useCallback(() => {
    cache.current.clear();
  }, []);

  const updateData = useCallback((newData) => {
    setData(newData);
    if (cacheKey) {
      const key = typeof cacheKey === 'function'
        ? cacheKey(...params)
        : cacheKey;
      setCachedData(key, newData);
    }
  }, [cacheKey, params, setCachedData]);

  const isStale = useCallback((key) => {
    const cached = cache.current.get(key);
    return !cached || (Date.now() - cached.timestamp > memoizedOptions.cacheDuration);
  }, [memoizedOptions.cacheDuration]);

  const prefetch = useCallback((...prefetchParams) => {
    return executeImpl(...prefetchParams).catch(() => {});
  }, [executeImpl]);

  return {
    data,
    error,
    loading,
    execute,
    retries,
    clearCache,
    reset,
    setData: updateData,
    isStale,
    prefetch
  };
};

// Additional exports for type checking
export const ApiStatus = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
};