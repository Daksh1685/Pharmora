'use client';

import { useEffect, useState } from 'react';
import { IconSearch, IconX } from '@tabler/icons-react';
import SalesTable from './SalesTable';
import Modal from '@/components/Medicines/Modal';
import apiClient from '@/utils/apiClient';
import useUIStore from '@/store/uiStore';

export default function SalesHistory({ sales = [], medicines = {}, onEdit, onRefresh }) {
  const [displaySales, setDisplaySales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [searchMedicine, setSearchMedicine] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'delete' or 'edit'
  const [selectedSaleId, setSelectedSaleId] = useState(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addNotification, openConfirm } = useUIStore();

  // Update display sales when sales data changes
  useEffect(() => {
    const sortedSales = [...sales].sort(
      (a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
    );
    setDisplaySales(sortedSales);
    applyFilters(sortedSales, searchMedicine, startDate, endDate);
  }, [sales]);

  // Apply filters when search/date filters change
  useEffect(() => {
    applyFilters(displaySales, searchMedicine, startDate, endDate);
  }, [searchMedicine, startDate, endDate, displaySales]);

  const applyFilters = (salesToFilter, medicine, start, end) => {
    let filtered = salesToFilter;

    // Filter by medicine name
    if (medicine.trim()) {
      filtered = filtered.filter((sale) => {
        const medicines_list = sale.medicines && sale.medicines.length > 0
          ? sale.medicines
          : [{ medicineId: sale.medicineId, medicineName: sale.medicineName }];

        return medicines_list.some((med) => {
          const medName = med.medicineName || 
                         med.medicineId?.name || 
                         medicines[med.medicineId]?.name || 
                         'Unknown Medicine';
          return medName.toLowerCase().includes(medicine.toLowerCase());
        });
      });
    }

    // Filter by date range
    if (start) {
      const startDateTime = new Date(start);
      startDateTime.setHours(0, 0, 0, 0);
      filtered = filtered.filter((sale) => {
        const saleDate = new Date(sale.createdAt || sale.date);
        return saleDate >= startDateTime;
      });
    }

    if (end) {
      const endDateTime = new Date(end);
      endDateTime.setHours(23, 59, 59, 999);
      filtered = filtered.filter((sale) => {
        const saleDate = new Date(sale.createdAt || sale.date);
        return saleDate <= endDateTime;
      });
    }

    setFilteredSales(filtered);
  };

  const handleDeleteSale = (saleId) => {
    openConfirm({
      title: 'Delete Sale',
      message: 'Are you sure you want to delete this sale? This action will restore the stock and cannot be undone.',
      type: 'danger',
      onConfirm: async () => {
        try {
          setIsLoading(true);
          console.log(`🗑️ Deleting sale: ${saleId}`);
          const response = await apiClient.delete(`/sales/${saleId}`);

          console.log('✅ Sale deleted successfully:', response.data);
          if (onRefresh) {
            await onRefresh();
          } else {
            window.location.reload();
          }
        } catch (error) {
          console.error('❌ Error deleting sale:', error);
          const errorMsg = error.response?.data?.message || error.message || 'Failed to delete sale';
          addNotification(`Error: ${errorMsg}`, 'error');
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const confirmDeleteSale = async () => {
    try {
      setIsLoading(true);
      console.log(`🗑️ Deleting sale: ${selectedSaleId}`);
      const response = await apiClient.delete(`/sales/${selectedSaleId}`);

      console.log('✅ Sale deleted successfully:', response.data);
      setModalOpen(false);
      if (onRefresh) {
        await onRefresh(); // Refresh data without full page reload
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error('❌ Error deleting sale:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to delete sale';
      addNotification(`Error: ${errorMsg}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSale = (saleId) => {
    const saleToEdit = sales.find((s) => s._id === saleId || s.id === saleId);
    if (saleToEdit) {
      setSelectedSaleId(saleId);
      setEditQuantity(saleToEdit.medicines?.[0]?.quantity || saleToEdit.quantity || '');
      setEditNotes(saleToEdit.notes || '');
      setModalType('edit');
      setModalOpen(true);
    }
  };

  const confirmEditSale = async () => {
    const newQuantityNum = parseInt(editQuantity);
    if (isNaN(newQuantityNum) || newQuantityNum < 1) {
      addNotification('Please enter a valid quantity', 'warning');
      return;
    }

    try {
      setIsLoading(true);
      console.log(`📝 Editing sale: ${selectedSaleId}, new quantity: ${newQuantityNum}, notes: ${editNotes}`);
      const response = await apiClient.put(`/sales/${selectedSaleId}`, {
        quantity: newQuantityNum,
        notes: editNotes
      });

      console.log('✅ Sale updated successfully:', response.data);
      setModalOpen(false);
      if (onRefresh) {
        await onRefresh(); // Refresh data without full page reload
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error('❌ Error editing sale:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to update sale';
      addNotification(`Error: ${errorMsg}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType(null);
    setSelectedSaleId(null);
    setEditQuantity('');
    setEditNotes('');
  };

  const clearFilters = () => {
    setSearchMedicine('');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = searchMedicine || startDate || endDate;

  // Calculate stats from filtered sales
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
  const totalQuantity = filteredSales
    .flatMap((sale) => {
      const medList = sale.medicines && sale.medicines.length > 0
        ? sale.medicines
        : [{ quantity: sale.quantity }];
      return medList;
    })
    .reduce((sum, med) => sum + (med.quantity || 0), 0);
  const avgSaleValue = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-slate-50 dark:from-slate-700 to-slate-100 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sales History</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{filteredSales.length} sales</p>
      </div>

      {/* Filter Section */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="space-y-3">
          {/* Medicine Name Filter */}
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Search by Medicine Name
            </label>
            <div className="relative">
              <IconSearch size={18} className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="e.g., Amoxicillin, Aspirin..."
                value={searchMedicine}
                onChange={(e) => setSearchMedicine(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 dark:focus:ring-slate-500 focus:border-transparent text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
              {searchMedicine && (
                <button
                  onClick={() => setSearchMedicine('')}
                  className="absolute right-2 top-2.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"
                >
                  <IconX size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 dark:focus:ring-slate-500 focus:border-transparent text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 dark:focus:ring-slate-500 focus:border-transparent text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Filter Status and Clear Button */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Showing <span className="font-semibold text-slate-900 dark:text-white">{filteredSales.length}</span> of <span className="font-semibold text-slate-900 dark:text-white">{displaySales.length}</span> sales
              </p>
              <button
                onClick={clearFilters}
                className="text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 px-4 py-1.5 rounded-lg hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-blue-900/20 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sales Table */}
      <div className="overflow-x-auto">
        <SalesTable
          sales={filteredSales}
          medicines={medicines}
          onDelete={handleDeleteSale}
          onEdit={handleEditSale}
        />
      </div>

      {/* Modals handled by UI Store or local for complex forms */}
      <div className="hidden">
        <Modal
          isOpen={false}
          title="Delete Sale"
          onClose={closeModal}
        >
          {/* Content removed, moved to centralized store */}
        </Modal>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={modalOpen && modalType === 'edit'}
        title="Edit Sale"
        onClose={closeModal}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              value={editQuantity}
              onChange={(e) => setEditQuantity(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
              placeholder="Enter quantity"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
              Notes
            </label>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 resize-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
              placeholder="Add any notes about this sale..."
              rows="3"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={closeModal}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={confirmEditSale}
              className="px-4 py-2 bg-slate-700 dark:bg-slate-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-500 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
