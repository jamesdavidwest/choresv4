// src/hooks/useApi.js
import { useState, useCallback, useEffect } from 'react';
import { ApiError } from '../services/api';

export const useApi = (apiFunc, immediate = true) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const execute = useCallback(async (...params) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunc(...params);
      setData(result);
      return result;
    } catch (error) {
      const apiError = error instanceof ApiError ? error : new ApiError(error.message);
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, [apiFunc]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return {
    data,
    error,
    loading,
    execute,
  };
};