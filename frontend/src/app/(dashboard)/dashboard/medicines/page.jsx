'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { IconPlus, IconTrendingUp, IconAlertCircle, IconPackage } from '@tabler/icons-react';
import MedicineTable from '@/components/Medicines/MedicineTable';
import MedicineForm from '@/components/Medicines/MedicineForm';
import Modal from '@/components/Medicines/Modal';
import apiClient from '@/utils/apiClient';
import SearchResults from '@/components/Dashboard/SearchResults';
import useNotificationStore from '@/store/notificationStore';
import { checkInventoryAlerts } from '@/services/inventoryAlerts';
import useUIStore from '@/store/uiStore';

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(null); // 'active', 'outOfStock', 'lowStock'
  
  const setInventoryAlerts = useNotificationStore((state) => state.setInventoryAlerts);
  const { openConfirm, addNotification } = useUIStore();

  // Fetch medicines and categories on mount
  useEffect(() => {
    fetchMedicines();
    fetchCategories();
  }, []);

  // Filter medicines based on search and active filters - searches in name and category
  const filteredMedicines = medicines.filter(med => {
    // Apply search filter first
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const categoryName = typeof med.category === 'object' && med.category !== null 
        ? med.category.name 
        : med.category;
      const matchesSearch = (
        med.name?.toLowerCase().includes(query) ||
        categoryName?.toLowerCase().includes(query)
      );
      if (!matchesSearch) return false;
    }

    // Apply quick stat filters
    if (activeFilter === 'active') {
      return med.quantity >= 20 && new Date(med.expiryDate) > new Date();
    } else if (activeFilter === 'outOfStock') {
      return med.quantity === 0;
    } else if (activeFilter === 'lowStock') {
      return med.quantity > 0 && med.quantity < 20;
    }

    return true;
  });

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/categories');
      const categoriesArray = response.data?.data?.categories || [];
      setCategories(Array.isArray(categoriesArray) ? categoriesArray : []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories([]);
    }
  };

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      // Fetch ALL medicines (with high limit) instead of just first 10
      const response = await apiClient.get('/medicines?limit=1000');
      // API returns: { success, statusCode, message, data: { medicines: [...], pagination: {...} } }
      const medicinesArray = response.data?.data?.medicines || [];
      setMedicines(Array.isArray(medicinesArray) ? medicinesArray : []);
      
      // Also fetch categories to keep them in sync
      const categoriesResponse = await apiClient.get('/categories');
      const categoriesArray = categoriesResponse.data?.data?.categories || [];
      setCategories(Array.isArray(categoriesArray) ? categoriesArray : []);
      
      console.log(`✅ Loaded ${medicinesArray.length} medicines`);
      
      // Check inventory alerts (get threshold from settings or use default 10)
      const savedSettings = JSON.parse(localStorage.getItem('pharmacySettings') || '{}');
      const threshold = savedSettings.stockThreshold || 10;
      const alerts = await checkInventoryAlerts(threshold);
      
      // Add alerts to notification store instead of local state
      if (alerts.notifications?.length > 0) {
        setInventoryAlerts(alerts.notifications);
      }
      
      if (alerts.outOfStock?.length > 0 || alerts.lowStock?.length > 0) {
        console.warn(`⚠️ Inventory Alert: ${alerts.outOfStock?.length || 0} out of stock, ${alerts.lowStock?.length || 0} low stock items`);
      }
    } catch (error) {
      console.error('Failed to fetch medicines:', error);
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const getApiUrl = (endpoint) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    return `${baseUrl}${endpoint}`;
  };

  const handleAddMedicine = () => {
    setEditingMedicine(null);
    fetchCategories(); // Refresh categories to get any newly added ones
    setIsModalOpen(true);
  };

  const handleEditMedicine = (medicine) => {
    setEditingMedicine(medicine);
    setIsModalOpen(true);
  };

  const handleDeleteMedicine = (medicineId) => {
    openConfirm({
      title: 'Delete Medicine',
      message: 'Are you sure you want to delete this medicine? This action cannot be undone.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await axios.delete(
            getApiUrl(`/medicines/${medicineId}`),
            { headers: getAuthHeaders() }
          );
          setMedicines((prev) =>
            prev.filter((medicine) => medicine._id !== medicineId && medicine.id !== medicineId)
          );
        } catch (error) {
          console.error('Failed to delete medicine:', error);
          // For simple alerts, we can use the confirm modal with just one button or a notification
          openConfirm({
            title: 'Error',
            message: 'Failed to delete medicine',
            type: 'danger',
            confirmText: 'OK',
            cancelText: 'Close'
          });
        }
      }
    });
  };

  const handleSubmitForm = async (formData) => {
    try {
      setIsSubmitting(true);

      if (editingMedicine) {
        // Update existing medicine
        const medicineId = editingMedicine._id || editingMedicine.id;
        
        // Optimistic update
        const oldMedicines = medicines;
        setMedicines((prev) =>
          prev.map((med) =>
            (med._id === medicineId || med.id === medicineId)
              ? { ...med, ...formData }
              : med
          )
        );

        try {
          const response = await axios.put(
            getApiUrl(`/medicines/${medicineId}`),
            formData,
            { headers: getAuthHeaders() }
          );

          // Response: { success, statusCode, message, data: { medicine } }
          const updatedMedicine = response.data?.data?.medicine || response.data?.data || response.data;
          setMedicines((prev) =>
            prev.map((med) =>
              (med._id === medicineId || med.id === medicineId)
                ? updatedMedicine
                : med
            )
          );
          
          // Check inventory alerts after update
          const savedSettings = JSON.parse(localStorage.getItem('pharmacySettings') || '{}');
          const threshold = savedSettings.stockThreshold || 10;
          const alerts = await checkInventoryAlerts(threshold);
          if (alerts.notifications?.length > 0) {
            setInventoryAlerts(alerts.notifications);
          }
          
          setIsModalOpen(false);
          setEditingMedicine(null);
          addNotification('Medicine updated successfully!', 'success');
        } catch (error) {
          setMedicines(oldMedicines);
          console.error('Failed to update medicine:', error);
          const errorMsg = error.response?.data?.message || 'Failed to update medicine';
          addNotification(errorMsg, 'error');
        }
      } else {
        // Add new medicine - optimistic update
        const tempId = `temp-${Date.now()}`;
        const newMedicineTemp = { id: tempId, ...formData };
        
        setMedicines((prev) => [...prev, newMedicineTemp]);
        setIsModalOpen(false);
        setEditingMedicine(null);

        try {
          const response = await axios.post(
            getApiUrl('/medicines'),
            formData,
            { headers: getAuthHeaders() }
          );
          // Response: { success, statusCode, message, data: { medicine } }
          const newMedicine = response.data?.data?.medicine || response.data?.data || response.data;

          // Replace temp with actual medicine from server
          setMedicines((prev) =>
            prev.map((med) => (med.id === tempId ? newMedicine : med))
          );
          
          // Check inventory alerts after add
          const savedSettings = JSON.parse(localStorage.getItem('pharmacySettings') || '{}');
          const threshold = savedSettings.stockThreshold || 10;
          const alerts = await checkInventoryAlerts(threshold);
          if (alerts.notifications?.length > 0) {
            setInventoryAlerts(alerts.notifications);
          }
          
          addNotification('Medicine added successfully!', 'success');
        } catch (error) {
          // Remove temp medicine on error
          setMedicines((prev) => prev.filter((med) => med.id !== tempId));
          console.error('Failed to save medicine:', error);
          const errorMsg = error.response?.data?.message || 'Failed to save medicine';
          addNotification(errorMsg, 'error');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">Medicines Inventory</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-1">
            Manage your medicine stock and track sales
          </p>
        </div>
        <button
          onClick={handleAddMedicine}
          className="flex items-center gap-2 px-6 py-2.5 bg-slate-700 dark:bg-slate-600 text-white rounded-full hover:bg-slate-800 dark:hover:bg-slate-500 transition-all duration-300 ease-out shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
        >
          <IconPlus size={20} />
          Add Medicine
        </button>
      </div>

      {/* Search Results */}
      <SearchResults />

      {/* Inventory Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Medicines Card */}
        <div className="bg-slate-50 dark:bg-slate-800 dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-slate-200 dark:hover:border-slate-600 transition-all duration-300 ease-out group">
          <div className="mb-4">
            <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Total Medicines</p>
          </div>
          <div className="mb-6 flex items-start justify-between">
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">{medicines.length}</p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">Active stock items</p>
            </div>
            <div className="p-3 bg-slate-100 dark:bg-slate-700 dark:bg-blue-900/30 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <IconPackage size={28} className="text-slate-700 dark:text-slate-300" />
            </div>
          </div>
          {/* Progress Visualization */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Stock Health</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 dark:text-blue-400">{Math.round((medicines.length > 0 ? (medicines.filter(m => m.quantity > 20).length / medicines.length) * 100 : 0))}%</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-slate-700 dark:bg-slate-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${medicines.length > 0 ? (medicines.filter(m => m.quantity > 20).length / medicines.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Low Stock Card */}
        <div className="bg-red-50 dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-slate-200 dark:hover:border-slate-600 transition-all duration-300 ease-out group">
          <div className="mb-4">
            <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Low Stock</p>
          </div>
          <div className="mb-6 flex items-start justify-between">
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                {medicines.filter((m) => m.quantity <= 20).length}
              </p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">Below 20 units threshold</p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <IconAlertCircle size={28} className="text-red-600" />
            </div>
          </div>
          {/* Alert Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Alert Level</span>
              <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                {medicines.filter(m => m.quantity <= 20).length > 5 ? 'High' : medicines.filter(m => m.quantity <= 20).length > 0 ? 'Medium' : 'Low'}
              </span>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                    i <= Math.ceil((medicines.filter(m => m.quantity <= 20).length / Math.max(medicines.length, 1)) * 5)
                      ? 'bg-red-600'
                      : 'bg-red-100'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Total Stock Value Card */}
        <div className="bg-green-50 dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-slate-200 dark:hover:border-slate-600 transition-all duration-300 ease-out group">
          <div className="mb-4">
            <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Total Stock Value</p>
          </div>
          <div className="mb-6 flex items-start justify-between">
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                ₹{(medicines.reduce((sum, m) => sum + ((m.price || 0) * (m.quantity || 0)), 0) / 100000).toFixed(1)}L
              </p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">Inventory value</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <IconTrendingUp size={28} className="text-green-600" />
            </div>
          </div>
          {/* Value Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">Performance</span>
              <span className="text-xs font-semibold text-green-600">
                {medicines.reduce((sum, m) => sum + (m.quantity || 0), 0) > 100 ? 'Excellent' : 'Good'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 bg-green-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min((medicines.reduce((sum, m) => sum + (m.quantity || 0), 0) / 500) * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-green-600 whitespace-nowrap">
                {Math.round(Math.min((medicines.reduce((sum, m) => sum + (m.quantity || 0), 0) / 500) * 100, 100))}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Medicine List */}
        <div className="lg:col-span-3">
          {/* Title and Search Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Medicine List</h2>
            <input
              type="text"
              placeholder="Search by name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sm:w-80 px-4 py-2.5 border border-slate-300 dark:border-slate-600 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-700 dark:focus:ring-slate-500 dark:focus:ring-slate-700 dark:focus:ring-slate-500"
            />
          </div>

          {/* Single Card with Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-lg border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 overflow-hidden transition-all duration-300 ease-out group">
            {/* Result Counter */}
            <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-700 transition-colors duration-300">
              <span className="text-sm text-slate-600 dark:text-slate-300">
                Showing <span className="font-semibold text-slate-900 dark:text-white">{filteredMedicines.length}</span> of {medicines.length} medicines
              </span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-slate-700 dark:text-slate-300 hover:text-blue-700 font-medium transition-colors"
                >
                  Clear Search
                </button>
              )}
            </div>

            {/* Medicine Table */}
            <MedicineTable
              medicines={filteredMedicines}
              loading={loading}
              onEdit={handleEditMedicine}
              onDelete={handleDeleteMedicine}
            />
          </div>
        </div>

        {/* Right Column: Quick Stats */}
        <div>
          {/* Medicine Summary Stats */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-lg border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 p-6 sticky top-28 transition-all duration-300 ease-out">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Quick Stats</h3>
            <div className="space-y-3">
              {/* Active Medicines */}
              <button
                onClick={() => {
                  setActiveFilter(activeFilter === 'active' ? null : 'active');
                  setSearchQuery('');
                }}
                className={`w-full flex items-center justify-between p-4 rounded-lg transition-all duration-300 ease-out ${
                  activeFilter === 'active'
                    ? 'bg-slate-50 dark:bg-slate-800 dark:bg-blue-900/30 text-slate-900 dark:text-white border-2 border-blue-600 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 border border-blue-200/30 dark:border-slate-600'
                }`}
              >
                <span className={`text-sm font-medium`}>Active Items</span>
                <span className={`text-xl font-bold`}>
                  {medicines.filter(m => m.quantity >= 20 && new Date(m.expiryDate) > new Date()).length}
                </span>
              </button>

              {/* Out of Stock */}
              <button
                onClick={() => {
                  setActiveFilter(activeFilter === 'outOfStock' ? null : 'outOfStock');
                  setSearchQuery('');
                }}
                className={`w-full flex items-center justify-between p-4 rounded-lg transition-all duration-300 ease-out ${
                  activeFilter === 'outOfStock'
                    ? 'bg-red-50 dark:bg-red-900/30 text-slate-900 dark:text-white border-2 border-red-600 shadow-md'
                    : 'bg-red-50 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-red-100 dark:hover:bg-slate-600 border border-red-200/30 dark:border-slate-600'
                }`}
              >
                <span className={`text-sm font-medium`}>Out of Stock</span>
                <span className={`text-xl font-bold`}>
                  {medicines.filter(m => m.quantity === 0).length}
                </span>
              </button>

              {/* Low Stock Warning */}
              <button
                onClick={() => {
                  setActiveFilter(activeFilter === 'lowStock' ? null : 'lowStock');
                  setSearchQuery('');
                }}
                className={`w-full flex items-center justify-between p-4 rounded-lg transition-all duration-300 ease-out ${
                  activeFilter === 'lowStock'
                    ? 'bg-amber-50 dark:bg-amber-900/30 text-slate-900 dark:text-white border-2 border-amber-600 shadow-md'
                    : 'bg-amber-50 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-amber-100 dark:hover:bg-slate-600 border border-amber-200/30 dark:border-slate-600'
                }`}
              >
                <span className={`text-sm font-medium`}>Low Stock</span>
                <span className={`text-xl font-bold`}>
                  {medicines.filter(m => m.quantity > 0 && m.quantity < 20).length}
                </span>
              </button>

              {/* Total Inventory Value */}
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-slate-700 rounded-lg border border-green-200/30 dark:border-slate-600 transition-all duration-300 hover:shadow-md hover:border-green-200">
                <span className="text-sm font-medium text-slate-900 dark:text-white">Inventory Value</span>
                <span className="text-xl font-bold text-green-600 dark:text-green-400">
                  ₹{(medicines.reduce((sum, m) => sum + ((m.price || 0) * (m.quantity || 0)), 0) / 100000).toFixed(1)}L
                </span>
              </div>

              {/* Average Price */}
              <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-slate-700 rounded-lg border border-purple-200/30 dark:border-slate-600 transition-all duration-300 hover:shadow-md hover:border-purple-200">
                <span className="text-sm font-medium text-slate-900 dark:text-white">Avg Price</span>
                <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  ₹{medicines.length > 0 ? (medicines.reduce((sum, m) => sum + (m.price || 0), 0) / medicines.length).toFixed(0) : 0}
                </span>
              </div>

              {/* Total Units */}
              <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-slate-700 rounded-lg border border-indigo-200/30 dark:border-slate-600 transition-all duration-300 hover:shadow-md hover:border-indigo-200">
                <span className="text-sm font-medium text-slate-900 dark:text-white">Total Units</span>
                <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                  {medicines.reduce((sum, m) => sum + (m.quantity || 0), 0)}
                </span>
              </div>

              {/* Reset Filter */}
              {activeFilter && (
                <button
                  onClick={() => {
                    setActiveFilter(null);
                    setSearchQuery('');
                  }}
                  className="w-full mt-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-300"
                >
                  View All
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        title={editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMedicine(null);
        }}
      >
        <MedicineForm
          onSubmit={handleSubmitForm}
          isLoading={isSubmitting}
          initialData={editingMedicine}
          categories={categories}
        />
      </Modal>
    </div>
  );
}
