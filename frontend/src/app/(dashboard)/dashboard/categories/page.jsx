'use client';

import { useState, useEffect } from 'react';
import useAuthStore from '@/store/authStore';
import useUIStore from '@/store/uiStore';
import useMedicineStore from '@/store/medicineStore';
import apiClient from '@/utils/apiClient';
import SearchResults from '@/components/Dashboard/SearchResults';
import CategoryStatistics from '@/components/Dashboard/CategoryStatistics';
import { IconPlus, IconChevronDown, IconX, IconEdit } from '@tabler/icons-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState(null);
  
  // Add Category Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Edit Category Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  
  // Delete Category Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);
  
  const [searchQueries, setSearchQueries] = useState({});
  
  const user = useAuthStore((state) => state.user);
  const addNotification = useUIStore((state) => state.addNotification);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch categories from backend API
      const categoriesResponse = await apiClient.get('/categories');
      const categoriesData = categoriesResponse.data?.data?.categories || [];
      setCategories(categoriesData);
      
      // Fetch ALL medicines (with high limit) for accurate category counting
      // Default limit is 10, but we need all medicines to show correct counts per category
      const medicinesResponse = await apiClient.get('/medicines?limit=1000');
      const medicinesData = medicinesResponse.data?.data?.medicines || [];
      setMedicines(medicinesData);
      
      console.log(`✅ Loaded ${medicinesData.length} medicines for category counting`);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setCategories([]);
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = (categoryId, categoryName) => {
    setDeletingCategory({ _id: categoryId, name: categoryName });
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (!deletingCategory) return;
    
    try {
      setIsDeleteSubmitting(true);
      
      // Call backend API to delete category
      await apiClient.delete(`/categories/${deletingCategory._id}`);
      
      // Remove from local state immediately (real-time update)
      setCategories(categories.filter(cat => cat._id !== deletingCategory._id));
      if (expandedCategory === deletingCategory._id) {
        setExpandedCategory(null);
      }
      
      // Close modal and reset
      setIsDeleteModalOpen(false);
      setDeletingCategory(null);
      
      // Refresh medicines to stay in sync
      await fetchData();
    } catch (error) {
      console.error('Failed to delete category:', error);
      const errorMessage = error.response?.data?.message || error.message;
      addNotification(`Failed to delete category: ${errorMessage}`, 'error');
    } finally {
      setIsDeleteSubmitting(false);
    }
  };
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      addNotification('Category name is required', 'warning');
      return;
    }

    if (categories.some(cat => cat.name.toLowerCase() === newCategoryName.toLowerCase())) {
      addNotification('This category already exists', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      // Call backend API to create category
      const response = await apiClient.post('/categories', {
        name: newCategoryName.trim()
      });
      
      const newCategory = response.data?.data?.category;
      if (newCategory) {
        setCategories([...categories, newCategory]);
        // Refresh medicines to update any filters/references
        await fetchData();
      }
      
      // Reset form and close modal
      setNewCategoryName('');
      setIsModalOpen(false);
      addNotification('Category added successfully!', 'success');
    } catch (error) {
      console.error('Failed to add category:', error);
      const errorMessage = error.response?.data?.message || error.message;
      addNotification(`Failed to add category: ${errorMessage}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleEditCategory = async () => {
    if (!editingCategoryName.trim()) {
      addNotification('Category name is required', 'warning');
      return;
    }

    if (editingCategoryName !== editingCategory.name && 
        categories.some(cat => cat.name.toLowerCase() === editingCategoryName.toLowerCase())) {
      addNotification('This category name already exists', 'warning');
      return;
    }

    try {
      setIsEditSubmitting(true);
      // Call backend API to update category
      await apiClient.put(`/categories/${editingCategory._id}`, {
        name: editingCategoryName.trim()
      });
      
      // Update the category in the list
      setCategories(categories.map(cat => 
        cat._id === editingCategory._id 
          ? { ...cat, name: editingCategoryName }
          : cat
      ));
      
      // Refresh medicines to update references
      await fetchData();
      
      // Reset form and close modal
      setEditingCategoryName('');
      setEditingCategory(null);
      setIsEditModalOpen(false);
      addNotification('Category renamed successfully!', 'success');
    } catch (error) {
      console.error('Failed to edit category:', error);
      const errorMessage = error.response?.data?.message || error.message;
      addNotification(`Failed to edit category: ${errorMessage}`, 'error');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const startEditCategory = (category) => {
    setEditingCategory(category);
    setEditingCategoryName(category.name);
    setIsEditModalOpen(true);
  };

  const getMedicinesForCategory = (categoryId, categoryName, searchQuery = '') => {
    let result = medicines.filter(m => {
      // If m.category is an object (populated), compare IDs
      if (typeof m.category === 'object' && m.category !== null) {
        return m.category._id === categoryId || m.category.name === categoryName;
      }
      // If m.category is a string, compare with name
      return m.category === categoryName;
    });
    
    // Filter by search query if provided
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(m => 
        m.name?.toLowerCase().includes(query) ||
        (typeof m.category === 'object' ? m.category.name : m.category)?.toLowerCase().includes(query)
      );
    }
    
    return result;
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-48" />
        <div className="h-96 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">Categories</h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1">
            Manage medicine categories
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-slate-700 text-white rounded-full hover:bg-slate-800 transition-all duration-300 ease-out shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
        >
          <IconPlus size={20} />
          Add Category
        </button>
      </div>

      {/* Search Results */}
      <SearchResults />

      {/* Main Content Card - Categories List */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Categories List</h2>
        
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-lg border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 p-6 sm:p-8 lg:p-10 transition-all duration-300 ease-out">
          {categories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
              {categories.map((category) => {
                const categoryMedicines = getMedicinesForCategory(category._id, category.name, searchQueries[category._id] || '');
                const isExpanded = expandedCategory === category._id;
                
                return (
                  <div 
                    key={category._id} 
                    className={`relative bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 transition-all duration-300 ${isExpanded ? 'ring-2 ring-blue-400 dark:ring-blue-500' : ''}`}
                  >
                    {/* Category Card Header */}
                    <div className="flex items-center justify-between p-4 hover:shadow-md transition-all duration-300">
                      <button
                        onClick={() => setExpandedCategory(isExpanded ? null : category._id)}
                        className="flex-1 text-left cursor-pointer group"
                      >
                        <h3 className="font-semibold text-slate-900 dark:text-white">{category.name}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                          {getMedicinesForCategory(category._id, category.name).length} {getMedicinesForCategory(category._id, category.name).length === 1 ? 'Medicine' : 'Medicines'}
                        </p>
                      </button>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 ml-2">
                        <button
                          onClick={() => startEditCategory(category)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          title="Edit category"
                        >
                          <IconEdit size={20} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category._id, category.name)}
                          className="p-1 hover:bg-red-100 rounded-lg transition-colors text-red-600 hover:text-red-700"
                          title="Delete category"
                        >
                          <IconX size={20} />
                        </button>
                      </div>
                    </div>

                    {/* Medicines List - Absolutely Positioned (doesn't push other cards) */}
                    {isExpanded && (
                      <div className="absolute top-full left-0 right-0 mt-0 bg-white dark:bg-slate-700 border-t border-slate-200 dark:border-slate-600 rounded-b-lg shadow-lg z-40">
                        {/* Search Box */}
                        <div className="p-3 border-b border-slate-200 dark:border-slate-600 sticky top-0 bg-white dark:bg-slate-700 rounded-b-none">
                          <input
                            type="text"
                            placeholder="Search medicines..."
                            value={searchQueries[category._id] || ''}
                            onChange={(e) => setSearchQueries({
                              ...searchQueries,
                              [category._id]: e.target.value
                            })}
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:border-slate-700 dark:focus:border-slate-500 dark:focus:border-slate-700 dark:focus:border-slate-500 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 dark:focus:ring-slate-700 dark:focus:ring-slate-500/50 outline-none text-sm transition-all"
                          />
                        </div>

                        {categoryMedicines.length > 0 ? (
                          <div className="max-h-48 overflow-y-auto scrollbar-hide">
                            {categoryMedicines.map((medicine) => (
                              <div
                                key={medicine._id || medicine.id}
                                className="px-4 py-3 border-b border-slate-200 dark:border-slate-600 last:border-b-0 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                              >
                                <p className="font-medium text-slate-900 dark:text-white truncate">
                                  {medicine.name}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                  Stock: {medicine.quantity} | ₹{medicine.price}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="px-4 py-6 text-center text-slate-600 dark:text-slate-400 text-sm">
                            {searchQueries[category.id] ? 'No medicines found matching your search' : 'No medicines in this category'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-600 dark:text-slate-400">No categories found</p>
            </div>
          )}
        </div>
      </div>

      {/* Category Statistics Section with Donut Chart and Table */}
      {categories.length > 0 && medicines.length > 0 && (
        <CategoryStatistics medicines={medicines} categories={categories} />
      )}

      {/* Add Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Add New Category</h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setNewCategoryName('');
                }}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <IconX size={24} className="text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleAddCategory(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name (e.g., Pain Relief, Vitamins)"
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-slate-700 dark:focus:border-slate-500 dark:focus:border-slate-700 dark:focus:border-slate-500 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 dark:focus:ring-slate-700 dark:focus:ring-slate-500/50 outline-none transition-all"
                  disabled={isSubmitting}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setNewCategoryName('');
                  }}
                  className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-slate-700 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors font-medium disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Adding...' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Category</h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingCategory(null);
                  setEditingCategoryName('');
                }}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <IconX size={24} className="text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleEditCategory(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  value={editingCategoryName}
                  onChange={(e) => setEditingCategoryName(e.target.value)}
                  placeholder="Enter new category name"
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:border-slate-700 dark:focus:border-slate-500 dark:focus:border-slate-700 dark:focus:border-slate-500 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 dark:focus:ring-slate-700 dark:focus:ring-slate-500/50 outline-none transition-all"
                  disabled={isEditSubmitting}
                  autoFocus
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingCategory(null);
                    setEditingCategoryName('');
                  }}
                  className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
                  disabled={isEditSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-slate-700 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors font-medium disabled:opacity-50"
                  disabled={isEditSubmitting}
                >
                  {isEditSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Modal */}
      {isDeleteModalOpen && deletingCategory && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Delete Category?</h2>
                <p className="text-sm text-slate-600 mt-1">This action cannot be undone</p>
              </div>
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletingCategory(null);
                }}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                disabled={isDeleteSubmitting}
              >
                <IconX size={24} className="text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            {/* Category Info */}
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-900/40 p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-red-100 dark:bg-red-900/40">
                    <IconX size={18} className="text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {deletingCategory.name}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {(() => {
                      const medicinesInCategory = medicines.filter(m => {
                        if (typeof m.category === 'object' && m.category !== null) {
                          return m.category._id === deletingCategory._id;
                        }
                        return m.category === deletingCategory.name;
                      });
                      return medicinesInCategory.length > 0
                        ? `Contains ${medicinesInCategory.length} medicine(s)`
                        : 'This category is empty';
                    })()}
                  </p>
                </div>
              </div>
            </div>

            {/* Medicines List (if any) */}
            {(() => {
              const medicinesInCategory = medicines.filter(m => {
                if (typeof m.category === 'object' && m.category !== null) {
                  return m.category._id === deletingCategory._id;
                }
                return m.category === deletingCategory.name;
              });
              
              if (medicinesInCategory.length > 0) {
                return (
                  <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 mb-6 max-h-48 overflow-y-auto">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white mb-3 uppercase tracking-wide">Medicines in this category:</p>
                    <div className="space-y-2">
                      {medicinesInCategory.map((med) => (
                        <div key={med._id} className="flex items-start gap-2 text-xs">
                          <span className="text-red-500 dark:text-red-400 mt-1">•</span>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{med.name}</p>
                            <p className="text-slate-600 dark:text-slate-400">Stock: {med.quantity} | ₹{med.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-900/40">
                      ⚠️ You must delete or move these medicines to another category before deleting this category.
                    </p>
                  </div>
                );
              }
              return null;
            })()}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletingCategory(null);
                }}
                className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
                disabled={isDeleteSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteCategory}
                disabled={
                  isDeleteSubmitting ||
                  medicines.some(m => {
                    if (typeof m.category === 'object' && m.category !== null) {
                      return m.category._id === deletingCategory._id;
                    }
                    return m.category === deletingCategory.name;
                  })
                }
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                  medicines.some(m => {
                    if (typeof m.category === 'object' && m.category !== null) {
                      return m.category._id === deletingCategory._id;
                    }
                    return m.category === deletingCategory.name;
                  })
                    ? 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-400 cursor-not-allowed'
                    : 'bg-slate-700 dark:bg-slate-700 text-white hover:bg-slate-800 dark:hover:bg-slate-600'
                }`}
              >
                {isDeleteSubmitting ? 'Deleting...' : 'Delete Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Scrollbar Hide CSS */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
