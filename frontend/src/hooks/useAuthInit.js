'use client';

import { useEffect } from 'react';
import useAuthStore from '@/store/authStore';
import { authService } from '@/services/authService';

/**
 * Initialize authentication on app load
 * Checks if user has a valid token and loads their session
 */
export const useAuthInit = () => {
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        const token = authService.getToken();

        if (token) {
          // Token exists, try to fetch current user
          const user = await authService.getCurrentUser();
          setUser(user);
        }
      } catch (error) {
        // Token is invalid or expired, clear it
        authService.setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [setUser, setLoading]);
};
