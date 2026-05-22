'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

const AuthForm = ({ onSubmit, onGoogleSuccess, isLoading = false, errors, mode = 'login' }) => {
  const [selectedRole, setSelectedRole] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    ...(mode === 'register' && { confirmPassword: '' }),
  });

  const [validationErrors, setValidationErrors] = useState({});

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Fetch user info from Google using the access token
        const userInfo = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });

        if (onGoogleSuccess) {
          onGoogleSuccess({
            email: userInfo.data.email,
            name: userInfo.data.name,
            googleId: userInfo.data.sub,
          });
        }
      } catch (error) {
        console.error('Google user info fetch failed:', error);
      }
    },
    onError: (error) => console.error('Google Login Failed:', error),
  });

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username && !formData.email) {
      newErrors.username = 'Username or email is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (mode === 'register') {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const submitData = {
      email: formData.email || formData.username,
      password: formData.password,
      role: selectedRole,
      ...(mode === 'register' && { confirmPassword: formData.confirmPassword }),
    };

    onSubmit(submitData);
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans text-slate-900">

      {/* Left Side - Image & Branding (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 relative bg-slate-900 overflow-hidden">
        <Image
          src="/login_image.png"
          alt="Pharmora Branding"
          fill
          className="object-cover opacity-80"
          priority
          quality={100}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />

        {/* Branding Content */}
        <div className="relative z-10 flex flex-col justify-end p-16 h-full text-white w-full">
          <div className="mb-auto mt-8 flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center drop-shadow-md">
              <img src="/favicon.png" alt="Pharmora Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-2xl font-bold tracking-widest uppercase">Pharmora</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <h1 className="text-5xl font-light leading-tight mb-6 tracking-tight">
              The future of <br />
              <span className="font-semibold">inventory.</span>
            </h1>
            <p className="text-lg text-slate-300 font-light max-w-md">
              Seamless, intelligent, and designed for modern healthcare.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-white relative">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="w-12 h-12 flex items-center justify-center drop-shadow-md">
              <img src="/favicon.png" alt="Pharmora Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-2xl font-bold tracking-widest uppercase text-slate-900">Pharmora</span>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-10">
              <h2 className="text-3xl font-semibold mb-2">
                {mode === 'login' ? 'Welcome back' : 'Create an account'}
              </h2>
              <p className="text-slate-500">
                {mode === 'login' ? 'Enter your credentials to access your dashboard' : 'Sign up to get started'}
              </p>
            </div>

            {errors?.general && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm">
                {errors.general}
              </div>
            )}

            {mode === 'login' && (
              <div className="mb-8 p-1 bg-slate-100 rounded-lg flex text-sm font-medium">
                <button
                  type="button"
                  onClick={() => setSelectedRole('admin')}
                  className={`flex-1 py-2 rounded-md transition-all ${selectedRole === 'admin' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('cashier')}
                  className={`flex-1 py-2 rounded-md transition-all ${selectedRole === 'cashier' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  Cashier
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {mode === 'register' ? 'Email address' : 'Username or Email'}
                </label>
                <input
                  type={mode === 'register' ? 'email' : 'text'}
                  name={mode === 'register' ? 'email' : 'username'}
                  value={mode === 'register' ? formData.email : formData.username}
                  onChange={handleChange}
                  placeholder={mode === 'register' ? 'Enter your email' : 'Enter your email'}
                  className={`w-full px-4 py-3 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all ${validationErrors.username || validationErrors.email ? 'border-red-300' : 'border-slate-200 hover:border-slate-300'
                    }`}
                />
                {(validationErrors.username || validationErrors.email) && (
                  <p className="text-red-500 text-xs mt-1.5">{validationErrors.username || validationErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all ${validationErrors.password ? 'border-red-300' : 'border-slate-200 hover:border-slate-300'
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="text-red-500 text-xs mt-1.5">{validationErrors.password}</p>
                )}
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`w-full px-4 py-3 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all ${validationErrors.confirmPassword ? 'border-red-300' : 'border-slate-200 hover:border-slate-300'
                        }`}
                    />
                  </div>
                  {validationErrors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1.5">{validationErrors.confirmPassword}</p>
                  )}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 px-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2 shadow-sm shadow-slate-900/20"
                >
                  {isLoading && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {mode === 'login' ? 'Sign in' : 'Create account'}
                </button>
              </div>
            </form>

            <div className="mt-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => googleLogin()}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-3 px-4 rounded-xl transition-all active:scale-[0.98] shadow-sm"
              >
                <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M47.532 24.5528C47.532 22.9214 47.396 21.2899 47.1135 19.6912H24.48V28.9181H37.4434C36.9055 31.8988 35.177 34.5356 32.6461 36.2111V42.2336H40.3985C44.9367 38.0491 47.532 31.8847 47.532 24.5528Z" fill="#4285F4" />
                  <path d="M24.48 48.0016C30.9529 48.0016 36.4116 45.8764 40.4126 42.2336L32.6461 36.2111C30.4907 37.6536 27.7119 38.4904 24.48 38.4904C18.223 38.4904 12.926 34.2536 11.0315 28.5367H3.04541V34.7214C7.03926 42.6644 15.228 48.0016 24.48 48.0016Z" fill="#34A853" />
                  <path d="M11.0315 28.5367C10.0345 25.5684 10.0345 22.3685 11.0315 19.4002V13.2155H3.04541C-0.315507 19.9238 -0.315507 27.9491 3.04541 34.7214L11.0315 28.5367Z" fill="#FBBC04" />
                  <path d="M24.48 9.51119C27.971 9.4716 31.3533 10.7937 33.8842 13.2155L40.5682 6.53148C36.3267 2.27439 30.5146 -0.0620392 24.48 0.000103239C15.228 0.000103239 7.03926 5.33728 3.04541 13.2803L11.0315 19.465C12.926 13.7481 18.223 9.51119 24.48 9.51119Z" fill="#EA4335" />
                </svg>
                Google
              </button>
            </div>

            <div className="mt-8 text-center text-sm text-slate-500">
              {mode === 'login' ? (
                <p>
                  Don&apos;t have an account?{' '}
                  <Link href="/register" className="font-medium text-slate-900 hover:underline">
                    Sign up
                  </Link>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <Link href="/login" className="font-medium text-slate-900 hover:underline">
                    Sign in
                  </Link>
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
