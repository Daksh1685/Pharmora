'use client';

import { useState, useEffect } from 'react';
import useAuthStore from '@/store/authStore';
import apiClient from '@/utils/apiClient';
import SearchResults from '@/components/Dashboard/SearchResults';
import { IconUser, IconMail, IconPhone, IconMapPin, IconEdit, IconDeviceFloppy, IconX } from '@tabler/icons-react';

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await apiClient.put('/auth/update-profile', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
      });

      if (response.data?.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully' });
        // Update user in auth store
        const setUser = useAuthStore.getState().setUser;
        setUser({ 
          ...user, 
          name: formData.name, 
          email: formData.email,
          phone: formData.phone,
          address: formData.address
        });
        setIsEditing(false);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update profile' 
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">Profile Settings</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-1">
            Manage your personal information and account preferences
          </p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors shadow-md hover:shadow-lg ${
            isEditing
              ? 'bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-800'
              : 'bg-slate-700 dark:bg-slate-600 text-white hover:bg-slate-800 dark:hover:bg-slate-700'
          }`}
        >
          {isEditing ? <IconX size={20} /> : <IconEdit size={20} />}
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
            : 'bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Search Results */}
      <SearchResults />

      {/* Personal Information Card */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Personal Information</h2>
        
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-300 dark:border-slate-600 dark:border-slate-700 p-6 sm:p-8 lg:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Avatar Section */}
            <div className="md:col-span-2 flex items-center gap-6 pb-6 border-b border-slate-300 dark:border-slate-600 dark:border-slate-700">
              <div className="w-20 h-20 rounded-full bg-blue-200 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                <span className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                  {(user?.email || user?.name || 'U')?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{user?.name || 'User'}</h3>
                <p className="text-slate-600 dark:text-slate-400">{user?.email || 'user@example.com'}</p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-1 capitalize">Role: {user?.role || 'Staff'}</p>
              </div>
            </div>

            {/* Form Fields */}
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                <IconUser size={16} className="inline mr-2" />
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:bg-slate-100 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-slate-700 dark:focus:ring-slate-500 dark:focus:ring-slate-700 dark:focus:ring-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                <IconMail size={16} className="inline mr-2" />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:bg-slate-100 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-slate-700 dark:focus:ring-slate-500 dark:focus:ring-slate-700 dark:focus:ring-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                <IconPhone size={16} className="inline mr-2" />
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Enter phone number"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:bg-slate-100 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-slate-700 dark:focus:ring-slate-500 dark:focus:ring-slate-700 dark:focus:ring-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                <IconMapPin size={16} className="inline mr-2" />
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Enter your address"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:bg-slate-100 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-slate-700 dark:focus:ring-slate-500 dark:focus:ring-slate-700 dark:focus:ring-slate-500"
              />
            </div>
          </div>

          {/* Save Button */}
          {isEditing && (
            <div className="mt-6 flex justify-end gap-3 pt-6 border-t border-slate-300 dark:border-slate-600 dark:border-slate-700">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 border border-blue-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 dark:bg-slate-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                <IconDeviceFloppy size={20} />
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
