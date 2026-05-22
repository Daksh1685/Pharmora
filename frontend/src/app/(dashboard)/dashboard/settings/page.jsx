'use client';

import { useState, useEffect } from 'react';
import useAuthStore from '@/store/authStore';
import useThemeStore from '@/store/themeStore';
import SearchResults from '@/components/Dashboard/SearchResults';
import { 
  IconSettings, IconBell, IconLock, IconDeviceFloppy, IconUser, 
  IconDownload, IconTrash, IconEye, IconEyeOff, IconCheck, IconX,
  IconLogout, IconClock, IconDatabase, IconShieldLock 
} from '@tabler/icons-react';
import useUIStore from '@/store/uiStore';
import apiClient from '@/utils/apiClient';

const ToggleSwitch = ({ enabled, onChange }) => (
  <button
    onClick={onChange}
    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
      enabled ? 'bg-[#4a5f7f]' : 'bg-slate-300 dark:bg-slate-600'
    }`}
  >
    <span
      className={`inline-block h-6 w-6 transform rounded-full bg-white dark:bg-slate-100 transition-transform ${
        enabled ? 'translate-x-7' : 'translate-x-1'
      }`}
    />
  </button>
);

const Message = ({ message }) => {
  if (!message.text) return null;
  return (
    <div className={`p-4 rounded-lg border flex items-center gap-3 ${
      message.type === 'success' 
        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
        : message.type === 'error'
        ? 'bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800'
        : 'bg-slate-50 dark:bg-slate-800 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800'
    }`}>
      {message.type === 'success' && <IconCheck size={20} />}
      {message.type === 'error' && <IconX size={20} />}
      {message.text}
    </div>
  );
};

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { theme: currentTheme, setTheme } = useThemeStore();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('general');
  const [showPassword, setShowPassword] = useState(false);
  const openConfirm = useUIStore((state) => state.openConfirm);

  const [settings, setSettings] = useState({
    timezone: 'IST',
    language: 'en',
    theme: 'light',
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    dataBackup: true,
    twoFactorAuth: false,
    activityLog: true,
    lowStockAlert: true,
    stockThreshold: 10,
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    pharmacy: user?.address || 'Main Store'
  });

  // Sync profile data when user object is loaded/updated
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        pharmacy: user.address || 'Main Store'
      });
    }
  }, [user]);

  useEffect(() => {
    const savedSettings = localStorage.getItem('pharmacySettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      // Always use the theme store as the source of truth,
      // not the stale value stored in pharmacySettings
      setSettings({ ...parsed, theme: currentTheme });
    } else {
      // Use the current theme from store
      setSettings(prev => ({ ...prev, theme: currentTheme }));
    }
  }, []);

  const handleToggle = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleSelectChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleThemeChange = (theme) => {
    setSettings(prev => ({ ...prev, theme }));
    setTheme(theme);
    setMessage({ type: 'success', text: `Switched to ${theme} mode` });
    setTimeout(() => setMessage({ type: '', text: '' }), 2000);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwords.new.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.put('/auth/change-password', {
        oldPassword: passwords.current,
        newPassword: passwords.new
      });

      if (response.data?.success) {
        setMessage({ type: 'success', text: 'Password updated successfully!' });
        setPasswords({ current: '', new: '', confirm: '' });
        
        // Update user hasPassword status in the store
        const setUser = useAuthStore.getState().setUser;
        setUser({ ...user, hasPassword: true });
      }
    } catch (error) {
      console.error('Password change failed:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update password' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await apiClient.put('/auth/update-profile', {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        address: profileData.pharmacy // Mapping pharmacy name to address
      });

      if (response.data?.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully' });
        // Update user in auth store
        const setUser = useAuthStore.getState().setUser;
        setUser({ 
          ...user, 
          name: profileData.name, 
          email: profileData.email,
          phone: profileData.phone,
          address: profileData.pharmacy
        });
      }
    } catch (error) {
      console.error('Profile update failed:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update profile' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    try {
      // Save theme preference
      if (settings.theme !== currentTheme) {
        setTheme(settings.theme);
      }
      
      // Always persist the current theme from the store (source of truth)
      const settingsToSave = { ...settings, theme: currentTheme };
      localStorage.setItem('pharmacySettings', JSON.stringify(settingsToSave));
      setTimeout(() => {
        setMessage({ type: 'success', text: 'Settings saved successfully' });
        setIsLoading(false);
      }, 500);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
      setIsLoading(false);
    }
  };

  const handleExportData = () => {
    setMessage({ type: 'info', text: 'Exporting your data...' });
    setTimeout(() => {
      const dataStr = JSON.stringify({ user, settings }, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pharmacy-backup-${Date.now()}.json`;
      link.click();
      setMessage({ type: 'success', text: 'Data exported successfully' });
    }, 1000);
  };

  const handleLogoutAllDevices = () => {
    openConfirm({
      title: 'Logout All Devices',
      message: 'Are you sure you want to log out from all devices? You will be signed out from this session as well.',
      type: 'warning',
      onConfirm: () => {
        setMessage({ type: 'info', text: 'Logging out from all devices...' });
        setTimeout(() => {
          logout();
        }, 1000);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Customize your preferences and manage system settings</p>
      </div>

      <Message message={message} />

      {/* Search Results */}
      <SearchResults />

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <div className="flex gap-8 overflow-x-auto">
          {[
            { id: 'general', label: 'General', icon: IconSettings },
            { id: 'profile', label: 'Profile', icon: IconUser },
            { id: 'security', label: 'Security', icon: IconLock },
            { id: 'notifications', label: 'Notifications', icon: IconBell },
            { id: 'data', label: 'Data Management', icon: IconDatabase }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-2 font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-white'
                    : 'text-slate-600 dark:text-slate-400 border-b-2 border-transparent hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* General Settings Tab */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">System Settings</h2>
            
            <div className="space-y-6">
              {/* Timezone */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Timezone</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Select your preferred timezone</p>
                </div>
                <select
                  value={settings.timezone}
                  onChange={(e) => handleSelectChange('timezone', e.target.value)}
                  className="sm:w-48 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white dark:bg-slate-700"
                >
                  <option value="UTC">UTC (GMT +0)</option>
                  <option value="IST">IST (GMT +5:30)</option>
                  <option value="PST">PST (GMT -8)</option>
                  <option value="EST">EST (GMT -5)</option>
                  <option value="CET">CET (GMT +1)</option>
                </select>
              </div>

              {/* Language */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Language</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Choose your preferred language</p>
                </div>
                <select
                  value={settings.language}
                  onChange={(e) => handleSelectChange('language', e.target.value)}
                  className="sm:w-48 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white dark:bg-slate-700"
                >
                  <option value="en">English</option>
                  <option value="hi">हिन्दी</option>
                  <option value="es">Español</option>
                </select>
              </div>

              {/* Theme */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Appearance</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Choose your preferred theme</p>
                </div>
                <div className="flex gap-3 sm:w-48">
                  {['light', 'dark'].map(theme => (
                    <button
                      key={theme}
                      onClick={() => handleThemeChange(theme)}
                      className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                        settings.theme === theme
                          ? 'bg-[#4a5f7f] text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Stock Alert Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Inventory Alerts</h2>
            
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Low Stock Alerts</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Get notified when stock is low</p>
                </div>
                <ToggleSwitch enabled={settings.lowStockAlert} onChange={() => handleToggle('lowStockAlert')} />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Stock Threshold</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Alert when stock falls below this quantity</p>
                </div>
                <input
                  type="number"
                  value={settings.stockThreshold}
                  onChange={(e) => handleSelectChange('stockThreshold', parseInt(e.target.value))}
                  className="sm:w-32 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white dark:bg-slate-700"
                  min="1"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Settings Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Profile Information</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">Full Name</label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white dark:bg-slate-700"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">Email Address</label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white dark:bg-slate-700"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">Phone Number</label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white dark:bg-slate-700"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">Pharmora Name</label>
              <input
                type="text"
                value={profileData.pharmacy}
                onChange={(e) => setProfileData(prev => ({ ...prev, pharmacy: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white dark:bg-slate-700"
              />
            </div>

            <button
              onClick={handleUpdateProfile}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-[#4a5f7f] text-white rounded-md font-semibold hover:bg-[#3d4d63] transition-colors disabled:opacity-50"
            >
              Save Profile
            </button>
          </div>
        </div>
      )}

      {/* Security Settings Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Change Password */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <IconLock size={20} />
              Change Password
            </h2>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {user?.hasPassword !== false && (
                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">Current Password</label>
                  <input
                    type="password"
                    value={passwords.current}
                    onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white dark:bg-slate-700"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwords.new}
                    onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white dark:bg-slate-700"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    {showPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white dark:bg-slate-700"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-[#4a5f7f] text-white rounded-md font-semibold hover:bg-[#3d4d63] transition-colors disabled:opacity-50"
              >
                Update Password
              </button>
            </form>
          </div>

          {/* Two-Factor Authentication */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <IconShieldLock size={20} />
                  Two-Factor Authentication
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Add extra security to your account</p>
              </div>
              <ToggleSwitch enabled={settings.twoFactorAuth} onChange={() => handleToggle('twoFactorAuth')} />
            </div>
            {settings.twoFactorAuth && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">✓ Two-factor authentication is enabled</p>
            )}
          </div>

          {/* Session Management */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <IconClock size={20} />
              Session Management
            </h2>
            
            <div className="space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">Current Device</p>
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-md">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Chrome on Windows</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Last active: Just now</p>
                </div>
                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs rounded-full">Current</span>
              </div>

              <button
                onClick={handleLogoutAllDevices}
                className="w-full mt-4 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <IconLogout size={18} />
                Logout from All Devices
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <IconBell size={20} />
            Notification Preferences
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Email Notifications</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Receive alerts via email</p>
              </div>
              <ToggleSwitch enabled={settings.emailNotifications} onChange={() => handleToggle('emailNotifications')} />
            </div>

            <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">SMS Notifications</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Receive alerts via SMS</p>
              </div>
              <ToggleSwitch enabled={settings.smsNotifications} onChange={() => handleToggle('smsNotifications')} />
            </div>

            <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Push Notifications</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Receive push notifications on your device</p>
              </div>
              <ToggleSwitch enabled={settings.pushNotifications} onChange={() => handleToggle('pushNotifications')} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Activity Logging</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Log all account activities</p>
              </div>
              <ToggleSwitch enabled={settings.activityLog} onChange={() => handleToggle('activityLog')} />
            </div>
          </div>
        </div>
      )}

      {/* Data Management Tab */}
      {activeTab === 'data' && (
        <div className="space-y-6">
          {/* Backup Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Data Backup</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Automatic Data Backup</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Automatically backup your data daily</p>
                </div>
                <ToggleSwitch enabled={settings.dataBackup} onChange={() => handleToggle('dataBackup')} />
              </div>

              <button
                onClick={handleExportData}
                className="w-full px-4 py-3 bg-[#4a5f7f] text-white rounded-md font-semibold hover:bg-[#3d4d63] transition-colors flex items-center justify-center gap-2"
              >
                <IconDownload size={20} />
                Export My Data
              </button>
            </div>
          </div>

          {/* Delete Account */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-red-200 dark:border-red-900 p-6">
            <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
              <IconTrash size={20} />
              Danger Zone
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
            <button
              onClick={() => {
                openConfirm({
                  title: 'Delete Account',
                  message: 'Are you absolutely sure you want to delete your account? This action is permanent and cannot be undone.',
                  type: 'danger',
                  onConfirm: () => {
                    setMessage({ type: 'info', text: 'Account deletion initiated. We will miss you!' });
                  }
                });
              }}
              className="w-full px-4 py-3 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <IconTrash size={20} />
              Delete Account Permanently
            </button>
          </div>
        </div>
      )}

      {/* Save Button - shown for all tabs */}
      <div className="flex justify-end gap-3">
        <button
          onClick={handleSaveSettings}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 bg-[#4a5f7f] text-white rounded-md hover:bg-[#3d4d63] transition-colors disabled:opacity-50 font-semibold"
        >
          <IconDeviceFloppy size={20} />
          Save All Settings
        </button>
      </div>
    </div>
  );
}
