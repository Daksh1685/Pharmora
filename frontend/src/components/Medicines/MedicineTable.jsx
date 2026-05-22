'use client';

import { useState } from 'react';
import { IconEdit, IconTrash, IconAlertCircle } from '@tabler/icons-react';
import Button from '@/components/Common/Button';

export default function MedicineTable({ 
  medicines, 
  loading,
  onEdit, 
  onDelete 
}) {
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, medicine: null });

  const isExpired = (expiryDate) => {
    return new Date(expiryDate) < new Date();
  };

  const isOutOfStock = (quantity) => {
    return quantity === 0;
  };

  const isLowStock = (quantity) => {
    return quantity > 0 && quantity < 20;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-16 bg-slate-200 rounded animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!medicines || medicines.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
        <p className="text-slate-600 dark:text-slate-300">No medicines found. Add one to get started.</p>
      </div>
    );
  }

  const handleDeleteClick = (medicine) => {
    setDeleteModal({ isOpen: true, medicine });
  };

  const confirmDelete = () => {
    if (deleteModal.medicine) {
      onDelete(deleteModal.medicine._id || deleteModal.medicine.id);
      setDeleteModal({ isOpen: false, medicine: null });
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                Category
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                Price
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                Expiry Date
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                Status
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {medicines.map((medicine) => {
            const medicineId = medicine._id || medicine.id;
            const expired = isExpired(medicine.expiryDate);
            const outOfStock = isOutOfStock(medicine.quantity);
            const lowStock = isLowStock(medicine.quantity);

            return (
              <tr
                key={medicineId}
                className={`border-b border-slate-200 dark:border-slate-700 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                  expired ? 'bg-red-50 dark:bg-red-900/20' : outOfStock ? 'bg-red-50 dark:bg-red-900/20' : lowStock ? 'bg-amber-50 dark:bg-amber-900/20' : ''
                }`}
              >
                <td className="px-6 py-4 text-sm text-slate-900 dark:text-white font-medium">
                  {medicine.name}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                  {typeof medicine.category === 'object' && medicine.category !== null 
                    ? medicine.category.name 
                    : medicine.category}
                </td>
                <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">
                  ₹{parseFloat(medicine.price || 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      outOfStock
                        ? 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200'
                        : lowStock
                        ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200'
                        : 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200'
                    }`}
                  >
                    {medicine.quantity || 0}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">
                  {medicine.expiryDate ? formatDate(medicine.expiryDate) : 'N/A'}
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center gap-2">
                    {expired && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 rounded text-xs font-medium">
                        <IconAlertCircle size={14} />
                        Expired
                      </span>
                    )}
                    {!expired && outOfStock && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 rounded text-xs font-medium">
                        <IconAlertCircle size={14} />
                        Out of Stock
                      </span>
                    )}
                    {!expired && !outOfStock && lowStock && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 rounded text-xs font-medium">
                        <IconAlertCircle size={14} />
                        Low Stock
                      </span>
                    )}
                    {!expired && !outOfStock && !lowStock && (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 rounded text-xs font-medium">
                        Active
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onEdit(medicine)}
                      className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <IconEdit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(medicine)}
                      className="p-2 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <IconTrash size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>

    {/* Delete Confirmation Modal */}
    {deleteModal.isOpen && deleteModal.medicine && (
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
            <IconTrash size={24} className="text-red-600 dark:text-red-400" />
          </div>
          
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white text-center mb-2">
            Delete Medicine?
          </h3>
          
          <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6">
            Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{deleteModal.medicine.name}</strong>? This action cannot be undone.
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteModal({ isOpen: false, medicine: null })}
              className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="flex-1 px-4 py-2.5 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
