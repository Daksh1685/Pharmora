'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthForm from '@/components/Auth/AuthForm';
import { authService } from '@/services/authService';
import useAuthStore from '@/store/authStore';
import { ROUTES } from '@/utils/constants';

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleLogin = async (formData) => {
    setIsLoading(true);
    setErrors({});

    try {
      const response = await authService.login(formData.email, formData.password);

      // Store JWT token
      authService.setToken(response.token);

      // Update auth store
      setUser(response.user);

      // Redirect to dashboard
      router.push(ROUTES.DASHBOARD);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (googleData) => {
    setIsLoading(true);
    setErrors({});

    try {
      const response = await authService.googleLogin(googleData);

      // Store JWT token
      authService.setToken(response.token);

      // Update auth store
      setUser(response.user);

      // Redirect to dashboard
      router.push(ROUTES.DASHBOARD);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Google login failed. Please try again.';
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthForm
      title="Login"
      submitButtonText="Sign In"
      onSubmit={handleLogin}
      onGoogleSuccess={handleGoogleLogin}
      isLoading={isLoading}
      errors={errors}
      mode="login"
    />
  );
}
