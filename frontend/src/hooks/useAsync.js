'use client';

import { useState, useCallback } from 'react';
import { handleApiError } from '@/utils/errorHandler';

export const useAsync = (asyncFunction, immediate = true) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const execute = useCallback(async (...args) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await asyncFunction(...args);
      setData(response);
      return response;
    } catch (err) {
      const message = handleApiError(err);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [asyncFunction]);

  return { execute, isLoading, error, data };
};
