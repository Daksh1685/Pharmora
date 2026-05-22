'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthForm from '@/components/Auth/AuthForm';
import { authService } from '@/services/authService';
import useAuthStore from '@/store/authStore';
import { ROUTES } from '@/utils/constants';

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleRegister = async (formData) => {
    setIsLoading(true);
    setErrors({});

    try {
      // Prepare registration data (exclude confirmPassword)
      const registerData = {
        email: formData.email,
        password: formData.password,
        name: formData.email.split('@')[0], // Extract name from email
      };

      const response = await authService.register(registerData);

      // Store JWT token
      authService.setToken(response.token);

      // Update auth store
      setUser(response.user);

      // Redirect to dashboard
      router.push(ROUTES.DASHBOARD);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
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
      title="Register"
      submitButtonText="Create Account"
      onSubmit={handleRegister}
      onGoogleSuccess={handleGoogleLogin}
      isLoading={isLoading}
      errors={errors}
      mode="register"
    />
  );
}
