'use client';

import { useState, useEffect } from 'react';
import { IconEdit, IconTrash, IconSearch, IconX } from '@tabler/icons-react';
import apiClient from '@/utils/apiClient';
import useUIStore from '@/store/uiStore';

export default function RecentSalesList({ data }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(!data);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSale, setEditingSale] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editFormData, setEditFormData] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { addNotification, openConfirm } = useUIStore();

  useEffect(() => {
    if (data && Array.isArray(data)) {
      const transformedSales = data.map((sale) => ({
        _id: sale._id,
        userId: {
          name: sale.customerName || 'Unknown Customer',
          phone: sale.customerPhone || '-'
        },
        medicineId: {
          name: sale.medicines?.[0]?.medicineName || 'Unknown Medicine'
        },
        quantity: sale.medicines?.[0]?.quantity || 0,
        totalAmount: sale.totalAmount || 0,
        date: sale.createdAt || sale.date
      }));
      setSales(transformedSales);
      setLoading(false);
      return;
    }

    const fetchSales = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/sales');
        const salesData = response.data?.data?.sales || [];
        
        const transformedSales = salesData.map((sale) => ({
          _id: sale._id,
          userId: {
            name: sale.customerName || 'Unknown Customer',
            phone: sale.customerPhone || '-'
          },
          medicineId: {
            name: sale.medicines?.[0]?.medicineName || 'Unknown Medicine'
          },
          quantity: sale.medicines?.[0]?.quantity || 0,
          totalAmount: sale.totalAmount || 0,
          date: sale.createdAt || sale.date
        }));
        
        setSales(transformedSales.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch sales:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, [data]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '₹0';
    return `₹${value.toLocaleString('en-IN')}`;
  };

  // Filter sales based on search query
  const filteredSales = sales.filter((sale) =>
    sale.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle Edit
  const handleEdit = (sale) => {
    setEditingSale(sale);
    setEditFormData({
      quantity: sale.quantity,
      totalAmount: sale.totalAmount,
    });
    setShowEditModal(true);
  };

  // Handle Save Edit
  const handleSaveEdit = async () => {
    if (!editingSale || !editFormData) return;

    try {
      setActionLoading(true);
      const response = await apiClient.put(`/sales/${editingSale._id}`, {
        quantity: editFormData.quantity,
        totalAmount: editFormData.totalAmount,
      });

      if (response.data?.success) {
        // Update local state
        setSales(
          sales.map((s) =>
            s._id === editingSale._id
              ? {
                  ...s,
                  quantity: editFormData.quantity,
                  totalAmount: editFormData.totalAmount,
                }
              : s
          )
        );
        setShowEditModal(false);
        setEditingSale(null);
        addNotification('Sale updated successfully!', 'success');
      }
    } catch (error) {
      console.error('Failed to update sale:', error);
      addNotification('Failed to update sale. Please try again.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete
  const handleDelete = async (sale) => {
    try {
      setActionLoading(true);
      const response = await apiClient.delete(`/sales/${sale._id}`);

      if (response.data?.success) {
        // Remove from local state
        setSales(sales.filter((s) => s._id !== sale._id));
        setDeleteConfirm(null);
        addNotification('Sale deleted successfully!', 'success');
      }
    } catch (error) {
      console.error('Failed to delete sale:', error);
      addNotification('Failed to delete sale. Please try again.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500 dark:text-slate-400">Loading recent sales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 md:p-6 border-b border-slate-100 dark:border-slate-700">
        <div className="flex flex-col gap-4">
          <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">Recent Sales List</h3>
          
          {/* Search Input */}
          <div className="relative w-full">
            <IconSearch
              size={18}
              className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500"
            />
            <input
              type="text"
              placeholder="Search by customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-700 dark:focus:ring-slate-500 focus:border-transparent transition-colors bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <IconX size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-100 dark:border-slate-600">
            <tr>
              <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[140px] sm:min-w-[160px]">Name</th>
              <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[150px] sm:min-w-[180px]">Medicine</th>
              <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[110px] sm:min-w-[140px]">Phone</th>
              <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[70px]">Quantity</th>
              <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[80px] sm:min-w-[100px]">Total Price</th>
              <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[70px]">Date</th>
              <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left font-semibold text-slate-700 dark:text-slate-200 min-w-[60px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                  {sales.length === 0 ? 'No sales data available' : 'No matching results found'}
                </td>
              </tr>
            ) : (
              filteredSales.map((sale, idx) => (
                <tr
                  key={idx}
                  className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-4 min-w-[140px] sm:min-w-[160px]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 dark:bg-slate-700 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 dark:text-blue-300">
                          {sale.userId?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <span className="font-medium text-slate-900 dark:text-white truncate text-xs sm:text-sm">
                        {sale.userId?.name || 'Unknown'}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-4 text-slate-600 dark:text-slate-300 min-w-[150px] sm:min-w-[180px]">
                    <span className="block break-words text-xs sm:text-sm">
                      {sale.medicineId?.name || '-'}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-4 text-slate-600 dark:text-slate-300 min-w-[110px] sm:min-w-[140px]">
                    <span className="block break-words text-xs sm:text-sm font-mono">
                      {sale.userId?.phone || '-'}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-4 min-w-[70px]">
                    <div className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-slate-100 dark:bg-slate-700 rounded-full whitespace-nowrap">
                      <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full" />
                      <span className="text-slate-700 dark:text-slate-300 text-xs">{sale.quantity || 0}</span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-4 font-semibold text-slate-900 dark:text-white min-w-[80px] sm:min-w-[100px] text-xs sm:text-sm">
                    {formatCurrency(sale.totalAmount)}
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-4 text-slate-600 dark:text-slate-300 min-w-[70px] whitespace-nowrap text-xs sm:text-sm">
                    {formatDate(sale.date)}
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-4 min-w-[60px]">
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      <button
                        onClick={() => handleEdit(sale)}
                        className="p-0.5 sm:p-1 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-blue-900/40 rounded-lg transition-colors text-slate-700 dark:text-slate-300 dark:text-blue-400 flex-shrink-0"
                        title="Edit"
                        disabled={actionLoading}
                      >
                        <IconEdit size={14} className="sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => {
                          openConfirm({
                            title: 'Delete Sale',
                            message: `Are you sure you want to delete this sale for ${sale.userId?.name}? This action cannot be undone.`,
                            type: 'danger',
                            onConfirm: () => handleDelete(sale)
                          });
                        }}
                        className="p-0.5 sm:p-1 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-lg transition-colors text-red-600 dark:text-red-400 flex-shrink-0"
                        title="Delete"
                        disabled={actionLoading}
                      >
                        <IconTrash size={14} className="sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingSale && editFormData && (
        <div className="fixed inset-0 bg-black dark:bg-black bg-opacity-50 dark:bg-opacity-70 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Edit Sale</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"
                disabled={actionLoading}
              >
                <IconX size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-white mb-1">
                  Customer Name
                </label>
                <p className="px-3 py-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-400">
                  {editingSale.userId?.name}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-white mb-1">
                  Medicine
                </label>
                <p className="px-3 py-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-400">
                  {editingSale.medicineId?.name}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-white mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={editFormData.quantity}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      quantity: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-700 dark:focus:ring-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                  disabled={actionLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-white mb-1">
                  Total Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editFormData.totalAmount}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      totalAmount: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-700 dark:focus:ring-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                  disabled={actionLoading}
                />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium disabled:opacity-50"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2 bg-slate-700 dark:bg-slate-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-500 transition-colors text-sm font-medium disabled:opacity-50"
                disabled={actionLoading}
              >
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - moved to UI store */}
      <div className="hidden">
        {deleteConfirm && <div />}
      </div>
    </div>
  );
}
