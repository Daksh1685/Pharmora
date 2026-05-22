'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import { ROUTES } from '@/utils/constants';

/**
 * Higher-order component to protect routes from unauthorized access
 * Redirects to /login if user is not authenticated
 */
export const withAuth = (Component) => {
  return function ProtectedComponent(props) {
    const router = useRouter();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const user = useAuthStore((state) => state.user);
    const isLoading = useAuthStore((state) => state.isLoading);

    useEffect(() => {
      // Wait for loading to finish before making a decision
      if (!isLoading && !isAuthenticated) {
        router.replace(ROUTES.LOGIN);
      }
    }, [isAuthenticated, isLoading, router]);

    // Show nothing or a loading spinner while checking auth status
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
};

/**
 * Redirect authenticated users away from auth pages
 */
export const withoutAuth = (Component) => {
  return function PublicComponent(props) {
    const router = useRouter();
    const isLoading = useAuthStore((state) => state.isLoading);

    useEffect(() => {
      // Wait for loading to finish before making a decision
      if (!isLoading && isAuthenticated) {
        router.replace(ROUTES.DASHBOARD);
      }
    }, [isAuthenticated, isLoading, router]);

    // Show nothing or a loading spinner while checking auth status
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    return <Component {...props} />;
  };
};
