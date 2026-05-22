'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  IconSearch,
  IconLogout,
  IconChevronDown,
  IconMenu2,
  IconBell,
  IconGlobe,
} from '@tabler/icons-react';
import useAuthStore from '@/store/authStore';
import useSearchStore from '@/store/searchStore';
import useMedicineStore from '@/store/medicineStore';
import useNotificationStore from '@/store/notificationStore';
import { authService } from '@/services/authService';

export default function TopbarNew({ onMenuClick }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const medicines = useMedicineStore((state) => state.medicines);
  
  const searchQuery = useSearchStore((state) => state.searchQuery);
  const searchFilter = useSearchStore((state) => state.searchFilter);
  const setSearchQuery = useSearchStore((state) => state.setSearchQuery);
  const setSearchFilter = useSearchStore((state) => state.setSearchFilter);
  const setSearchResults = useSearchStore((state) => state.setSearchResults);

  // Get notifications and inventory alerts
  const inventoryAlerts = useNotificationStore((state) => state.inventoryAlerts);
  const dismissInventoryAlert = useNotificationStore((state) => state.dismissInventoryAlert);

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'medicines', label: 'Medicines' },
    { value: 'orders', label: 'Orders' },
    { value: 'sales', label: 'Sales' },
    { value: 'customers', label: 'Customers' },
  ];

  const handleLogout = () => {
    authService.setToken(null);
    logout();
    router.push('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    // Search based on filter type
    let results = [];
    const query = searchQuery.toLowerCase();

    if (searchFilter === 'all' || searchFilter === 'medicines') {
      const medicineResults = medicines.filter((med) =>
        med.name?.toLowerCase().includes(query) ||
        med.genericName?.toLowerCase().includes(query) ||
        med.manufacturer?.toLowerCase().includes(query)
      );
      results = [...results, ...medicineResults.map(m => ({ ...m, type: 'medicine' }))];
    }

    setSearchResults(results);
    console.log('Search:', searchQuery, 'Filter:', searchFilter, 'Results:', results);
  };

  return (
    <header className="fixed top-4 left-4 right-4 h-20 bg-gradient-to-r from-blue-50 to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-300 dark:border-slate-600 dark:border-slate-700 shadow-xl z-40 rounded-3xl">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Menu toggle + Pharmacy Logo */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={onMenuClick}
            className="sm:hidden p-2 hover:bg-blue-200/40 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Toggle Menu"
          >
            <IconMenu2 size={20} className="text-slate-700 dark:text-slate-300" />
          </button>

          {/* Pharmora Logo */}
          <Link href="/dashboard" className="hidden sm:flex items-center gap-2 px-3 py-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 flex items-center justify-center drop-shadow-sm">
              <img src="/favicon_transparent.png" alt="Pharmora Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-sm font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Pharmora
            </span>
          </Link>
        </div>

        {/* Right: Extended Search with Language, Notifications, Profile */}
        <div className="flex items-center gap-2 flex-1 sm:flex-none justify-end h-full">
          {/* Extended Search Box with Filter */}
          <form
            onSubmit={handleSearch}
            className="hidden sm:flex items-center gap-0 px-4 py-2.5 bg-white dark:bg-slate-700 rounded-full border border-blue-200 dark:border-slate-600 shadow-xl hover:shadow-lg transition-all focus-within:ring-2 focus-within:ring-blue-400 focus-within:ring-opacity-30 dark:focus-within:ring-blue-500"
          >
            <IconSearch size={18} className="text-blue-400 dark:text-blue-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search medicines, orders, sales..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(e);
                }
              }}
              className="bg-transparent text-sm text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none flex-1 px-3"
            />
            
            {/* Separator */}
            <div className="text-slate-300 dark:text-slate-600">|</div>

            {/* Filter Dropdown - Inline */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setFilterDropdownOpen(!filterDropdownOpen);
                  setNotificationMenuOpen(false);
                  setProfileMenuOpen(false);
                }}
                className="flex items-center gap-1.5 px-3 text-sm font-medium text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                {filterOptions.find(opt => opt.value === searchFilter)?.label || 'All'}
              </button>

              {/* Filter Dropdown Menu */}
              {filterDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-300 dark:border-slate-600 dark:border-slate-700 overflow-hidden z-50">
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setSearchFilter(option.value);
                        setFilterDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-sm text-left transition-colors ${
                        searchFilter === option.value
                          ? 'bg-slate-50 dark:bg-slate-800 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </form>

          {/* Language Selector */}
          <div className="hidden sm:flex items-center gap-1.5">
            <IconGlobe size={16} className="text-slate-600 dark:text-slate-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">EN</span>
          </div>
        </div>

        {/* Right: Notifications, Profile */}
        <div className="flex items-center gap-1 sm:gap-2 h-full">
          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => {
                setNotificationMenuOpen(!notificationMenuOpen);
                setProfileMenuOpen(false);
                setFilterDropdownOpen(false);
              }}
              className="p-2.5 hover:bg-blue-200/40 dark:hover:bg-slate-700 rounded-lg transition-colors relative flex items-center justify-center"
            >
              <IconBell size={18} className="text-slate-700 dark:text-slate-300" />
              {inventoryAlerts.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            {/* Notifications Dropdown Menu */}
            {notificationMenuOpen && (
              <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-300 dark:border-slate-600 dark:border-slate-700 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-slate-300 dark:border-slate-600 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-slate-50 dark:from-slate-700 dark:to-slate-800 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</p>
                  {inventoryAlerts.length > 0 && (
                    <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                      {inventoryAlerts.length}
                    </span>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {inventoryAlerts.length > 0 ? (
                    inventoryAlerts.map((alert) => (
                      <div 
                        key={alert.id}
                        className={`p-3 border-b border-blue-200/30 dark:border-slate-700 transition-colors cursor-pointer ${
                          alert.severity === 'high'
                            ? 'hover:bg-red-50 dark:hover:bg-red-950/20'
                            : 'hover:bg-yellow-50 dark:hover:bg-yellow-950/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              alert.severity === 'high'
                                ? 'text-red-900 dark:text-red-200'
                                : 'text-yellow-900 dark:text-yellow-200'
                            }`}>
                              {alert.title}
                            </p>
                            <p className={`text-xs mt-1 ${
                              alert.severity === 'high'
                                ? 'text-red-800 dark:text-red-300'
                                : 'text-yellow-800 dark:text-yellow-300'
                            }`}>
                              {alert.message}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Just now</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissInventoryAlert(alert.id);
                            }}
                            className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-sm text-slate-600 dark:text-slate-400">No alerts at this time</p>
                    </div>
                  )}
                </div>
                <div className="px-4 py-2 border-t border-slate-300 dark:border-slate-600 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:bg-slate-700 text-center">
                  <button 
                    onClick={() => {
                      router.push('/dashboard/notifications');
                      setNotificationMenuOpen(false);
                    }}
                    className="text-xs text-slate-700 dark:text-slate-300 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                  >
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileMenuOpen(!profileMenuOpen);
                setNotificationMenuOpen(false);
                setFilterDropdownOpen(false);
              }}
              className="flex items-center gap-2 hover:bg-blue-200/40 rounded-lg px-2 py-2 transition-colors h-full"
            >
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-blue-700">
                    {(user?.email || user?.name || 'U')?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {user?.email?.split('@')[0] || 'user@example.com'}
                  </p>
                </div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-300 dark:border-slate-600 dark:border-slate-700 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-slate-300 dark:border-slate-600 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-slate-50 dark:from-slate-700 dark:to-slate-800">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
                <div className="py-2">
                  <button 
                    onClick={() => {
                      router.push('/dashboard/profile');
                      setProfileMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors text-left"
                  >
                    Profile Settings
                  </button>
                  <button 
                    onClick={() => {
                      router.push('/dashboard/account');
                      setProfileMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors text-left"
                  >
                    Account
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left border-t border-slate-300 dark:border-slate-600 dark:border-slate-700 flex items-center gap-2"
                  >
                    <IconLogout size={16} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
