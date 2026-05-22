'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/utils/apiClient';

export default function SalesTable({ onEditOpen, onDeleteOpen, refreshDependency }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

  // Only fetch when refreshDependency changes or activeSearch changes
  useEffect(() => {
    loadSalesData();
  }, [refreshDependency, activeSearch]);

  const loadSalesData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeSearch.trim()) {
        params.append('search', activeSearch.trim());
        console.log('🔍 [FRONTEND] Searching for:', activeSearch.trim());
      }
      
      const url = `/sales/customers/list${params.toString() ? '?' + params.toString() : ''}`;
      console.log('📡 [FRONTEND] API URL:', url);
      const response = await apiClient.get(url);
      console.log('📦 [FRONTEND] Full response:', response);
      console.log('📦 [FRONTEND] response.data:', response.data);
      console.log('📦 [FRONTEND] response.data.data:', response.data?.data);
      
      const data = response.data?.data?.sales || response.data?.sales || response.data || [];
      console.log('✅ [FRONTEND] Extracted data:', data.length, 'results');
      if (data.length > 0) {
        console.log('  Sample:', { orderId: data[0].orderId, customerName: data[0].customerName });
      }
      setSales(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('❌ [FRONTEND] Error fetching sales:', error);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    console.log('🔎 [SEARCH SUBMIT] Input value:', searchInputValue);
    setActiveSearch(searchInputValue);
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchInputValue('');
    setActiveSearch('');
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-8">
        <p className="text-center text-slate-500 dark:text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-slate-200 dark:border-slate-700">
      {/* Header with Title and Search */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Customers</h3>
        
        {/* Search Form */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="text"
            value={searchInputValue}
            onChange={(e) => setSearchInputValue(e.target.value)}
            placeholder="Search by name, phone, order ID, or medicine..."
            className="flex-1 px-4 py-2.5 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-700 dark:focus:ring-slate-500 transition-all shadow-sm"
          />
          <button
            type="submit"
            className="px-6 py-2.5 bg-slate-700 dark:bg-slate-600 text-white rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shadow-sm hover:shadow-md"
          >
            Search
          </button>
          {activeSearch && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="px-4 py-2.5 border-2 border-slate-700 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {sales.length === 0 ? (
        <div className="p-8 text-center text-slate-500 dark:text-slate-400">
          <p>{activeSearch ? 'No customers found matching your search' : 'No customers found'}</p>
          {activeSearch && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Searched for: "{activeSearch}"</p>
          )}
          {activeSearch && console.log('🚫 [DEBUG] Empty results for search:', activeSearch, 'Sales count:', sales.length)}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Order ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Customer Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Phone</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Medicines</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900 dark:text-white">Total Qty</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900 dark:text-white">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Payment</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900 dark:text-white">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {(showAll ? sales : sales.slice(0, 5)).map((sale) => {
                const medicines = sale.medicines || [];
                const totalQty = medicines.reduce((sum, med) => sum + (med.quantity || 0), 0);
                const medicineNames = medicines
                  .map(m => m.medicineId?.name || m.medicineName || 'Unknown')
                  .join(', ');

                return (
                  <tr key={sale._id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">
                      {sale.orderId || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-white font-medium">
                      {sale.customerName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {sale.customerPhone || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      <div className="max-w-xs overflow-hidden text-ellipsis" title={medicineNames}>
                        {medicineNames || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 text-center">
                      {totalQty}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white text-right">
                      ₹{sale.totalAmount ? sale.totalAmount.toLocaleString('en-IN') : 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 capitalize">
                      {sale.paymentMethod?.replace(/_/g, ' ') || 'cash'}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onEditOpen(sale)}
                          className="px-3 py-1 text-slate-700 dark:text-slate-300 dark:text-blue-400 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 rounded font-medium transition-colors whitespace-nowrap"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteOpen(sale)}
                          className="px-3 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-slate-700 rounded font-medium transition-colors whitespace-nowrap"
                        >
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {/* View More Button */}
          {sales.length > 5 && !showAll && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 text-center">
              <button
                onClick={() => setShowAll(true)}
                className="px-4 py-2.5 bg-slate-700 dark:bg-slate-600 text-white rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
              >
                View More ({sales.length - 5} more)
              </button>
            </div>
          )}
          
          {/* View Less Button */}
          {showAll && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 text-center">
              <button
                onClick={() => setShowAll(false)}
                className="px-4 py-2.5 bg-slate-700 dark:bg-slate-600 text-white rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
              >
                View Less
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
