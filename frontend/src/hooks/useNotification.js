'use client';

import { useCallback } from 'react';
import useUiStore from '@/store/uiStore';

export const useNotification = () => {
  const addNotification = useUiStore((state) => state.addNotification);
  const removeNotification = useUiStore((state) => state.removeNotification);

  const notify = useCallback(
    (message, type = 'info', duration = 3000) => {
      const id = Date.now();
      addNotification({ id, message, type });

      if (duration) {
        setTimeout(() => removeNotification(id), duration);
      }

      return id;
    },
    [addNotification, removeNotification]
  );

  return {
    notify,
    success: (message, duration) => notify(message, 'success', duration),
    error: (message, duration) => notify(message, 'error', duration),
    warning: (message, duration) => notify(message, 'warning', duration),
    info: (message, duration) => notify(message, 'info', duration),
  };
};
