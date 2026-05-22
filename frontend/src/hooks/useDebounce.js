'use client';

import { useState, useEffect } from 'react';
import { debounce } from '@/utils/helpers';

export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = debounce(() => {
      setDebouncedValue(value);
    }, delay);

    handler();

    return () => {
      clearTimeout(handler.timeout);
    };
  }, [value, delay]);

  return debouncedValue;
};
