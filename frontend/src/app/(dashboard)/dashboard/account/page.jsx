'use client';

import { useState, useEffect } from 'react';
import useAuthStore from '@/store/authStore';
import apiClient from '@/utils/apiClient';
import SearchResults from '@/components/Dashboard/SearchResults';
import { IconShieldCheck, IconKey, IconDeviceDesktop, IconEye, IconEyeOff, IconCheck, IconX, IconAlertCircle, IconLoader } from '@tabler/icons-react';
import useUIStore from '@/store/uiStore';

export default function AccountPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [devices, setDevices] = useState([]);
  const { openConfirm, addNotification } = useUIStore();
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Fetch devices on mount
  useEffect(() => {
    fetchDevices();
    // Register current device with a small delay
    const timer = setTimeout(() => {
      registerCurrentDevice();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const fetchDevices = async () => {
    try {
      setLoadingDevices(true);
      setMessage({ type: '', text: '' });
      const response = await apiClient.get('/auth/devices');
      
      if (response.status === 200 && response.data?.data?.devices) {
        const devicesData = response.data.data.devices;
        // Sort devices by lastActive (most recent first)
        const sorted = devicesData.sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive));
        setDevices(sorted);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Failed to fetch devices:', error);
      
      let errorMessage = 'Failed to load devices';
      if (error?.response?.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error?.response?.status === 404) {
        errorMessage = 'Devices endpoint not found. Please check your backend configuration.';
      } else if (error?.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (!error?.response) {
        errorMessage = 'Cannot connect to the server. Make sure the backend is running.';
      }
      
      setMessage({ type: 'error', text: errorMessage });
      setDevices([]);
    } finally {
      setLoadingDevices(false);
    }
  };

  const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    let osName = 'Unknown OS';
    let browserName = 'Unknown Browser';
    let deviceType = 'desktop';

    // Detect OS
    if (ua.indexOf('Win') > -1) osName = 'Windows';
    else if (ua.indexOf('Mac') > -1) {
      osName = ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1 ? 'iOS' : 'macOS';
      if (ua.indexOf('iPad') > -1) deviceType = 'tablet';
      else if (ua.indexOf('iPhone') > -1) deviceType = 'mobile';
    } else if (ua.indexOf('Linux') > -1) osName = 'Linux';
    else if (ua.indexOf('Android') > -1) {
      osName = 'Android';
      deviceType = 'mobile';
    }

    // Detect Browser
    if (ua.indexOf('Firefox') > -1) browserName = 'Firefox';
    else if (ua.indexOf('Chrome') > -1) browserName = 'Chrome';
    else if (ua.indexOf('Safari') > -1) browserName = 'Safari';
    else if (ua.indexOf('Edge') > -1) browserName = 'Edge';
    else if (ua.indexOf('Opera') > -1) browserName = 'Opera';

    return { osName, browserName, deviceType };
  };

  const registerCurrentDevice = async () => {
    try {
      const { osName, browserName, deviceType } = getDeviceInfo();
      const deviceName = `${osName} • ${browserName}`;

      const response = await apiClient.post('/auth/register-device', {
        deviceName,
        deviceType,
        osName,
        browserName,
      });

      // Refresh devices list after successful registration
      if (response.data?.success) {
        setTimeout(() => fetchDevices(), 300);
      }
    } catch (error) {
      // Don't show error to user for device registration - it's a background operation
      // But log it for debugging
      console.debug('Device registration info:', error.response?.data?.message || error.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (formData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.put('/auth/change-password', {
        oldPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      if (response.data?.success) {
        setMessage({ type: 'success', text: 'Password changed successfully' });
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to change password' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveDevice = async (deviceId) => {
    openConfirm({
      title: 'Remove Device',
      message: 'Are you sure you want to remove this device?',
      type: 'warning',
      onConfirm: async () => {
        try {
          const response = await apiClient.delete(`/auth/devices/${deviceId}`);
          if (response.data?.success) {
            addNotification('Device removed successfully', 'success');
            // Refresh devices
            fetchDevices();
          }
        } catch (error) {
          console.error('Failed to remove device:', error);
          addNotification('Failed to remove device', 'error');
        }
      }
    });
  };

  const handleDeleteAccount = async () => {
    openConfirm({
      title: 'Delete Account',
      message: 'Are you sure? This action cannot be undone.',
      type: 'danger',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          // TODO: Implement delete account endpoint in backend
          // await apiClient.delete('/auth/delete-account');
          addNotification('Account deletion not yet implemented', 'info');
          setIsLoading(false);
        } catch (error) {
          console.error('Failed to delete account:', error);
          addNotification(error.response?.data?.message || 'Failed to delete account', 'error');
          setIsLoading(false);
        }
      }
    });
  };

  const formatLastActive = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">Account</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-1">
            Manage your account security and connected devices
          </p>
        </div>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-900/40'
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-900/40'
        }`}>
          {message.text}
        </div>
      )}

      {/* Search Results */}
      <SearchResults />

      {/* Account Overview */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <IconShieldCheck size={20} className="text-slate-700 dark:text-slate-300" />
          Account Overview
        </h2>
        
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-300 dark:border-slate-600 dark:border-blue-900/40 p-6 sm:p-8 lg:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4 pb-6 md:pb-0 md:border-b-0 border-b border-slate-300 dark:border-slate-600 dark:border-blue-900/40">
              <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-700 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-blue-700 dark:text-blue-400">
                  {(user?.email || 'U')?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Account Name</p>
                <p className="font-semibold text-slate-900 dark:text-white">{user?.name || 'User'}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                <IconCheck size={24} className="text-emerald-700 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Account Status</p>
                <p className="font-semibold text-emerald-700">Active & Verified</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <IconKey size={20} className="text-slate-700 dark:text-slate-300" />
          Change Password
        </h2>
        
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-300 dark:border-slate-600 dark:border-blue-900/40 p-6 sm:p-8 lg:p-10">
          <form onSubmit={handleChangePassword} className="space-y-6">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="Enter your current password"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:border-blue-900/40 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-700 dark:focus:ring-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  {showCurrentPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Enter your new password (min. 8 characters)"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:border-blue-900/40 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-700 dark:focus:ring-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  {showPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your new password"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:border-blue-900/40 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-700 dark:focus:ring-slate-500"
                />
                {formData.confirmPassword && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {formData.newPassword === formData.confirmPassword ? (
                      <IconCheck size={20} className="text-emerald-600" />
                    ) : (
                      <IconX size={20} className="text-red-600" />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2.5 bg-slate-700 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 font-semibold"
            >
              Update Password
            </button>
          </form>
        </div>
      </div>

      {/* Connected Devices */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <IconDeviceDesktop size={20} className="text-slate-700 dark:text-slate-300" />
          Connected Devices
        </h2>
        
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-300 dark:border-slate-600 dark:border-blue-900/40 p-6 sm:p-8 lg:p-10">
          {loadingDevices ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-3">
                <IconLoader size={32} className="text-slate-700 dark:text-slate-300 animate-spin" />
                <p className="text-slate-600 dark:text-slate-400">Loading devices...</p>
              </div>
            </div>
          ) : devices.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-slate-600 dark:text-slate-400 mb-2">No devices found</p>
              <p className="text-xs text-slate-500 dark:text-slate-500">Your connected devices will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {devices.map((device) => (
                <div 
                  key={device.deviceId} 
                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                    device.isCurrent 
                      ? 'bg-slate-50 dark:bg-slate-800 dark:bg-blue-900/20 border-slate-300 dark:border-slate-600 dark:border-blue-900/40'
                      : 'bg-slate-50 dark:bg-slate-700 border-slate-200/50 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900 dark:text-white">{device.deviceName}</p>
                      {device.isCurrent && (
                        <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {device.osName} • {device.browserName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      Last active: {formatLastActive(device.lastActive)}
                    </p>
                  </div>
                  
                  {!device.isCurrent && (
                    <button 
                      onClick={() => handleRemoveDevice(device.deviceId)}
                      className="px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <IconAlertCircle size={20} className="text-red-600" />
          Danger Zone
        </h2>
        
        <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl shadow-xl border border-red-200/50 dark:border-red-900/40 p-6 sm:p-8 lg:p-10">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Delete Account</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button
                onClick={handleDeleteAccount}
                disabled={isLoading}
                className="px-4 py-2.5 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50 font-semibold"
              >
                Delete My Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
