'use client';

import { useState, useEffect } from 'react';
import {
  IconSearch,
  IconFilter,
  IconArrowDown,
  IconEdit,
  IconTrash,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react';
import apiClient from '@/utils/apiClient';

export default function SalesTable() {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const response = await apiClient.get('/sales');
        const salesData = response.data?.data?.sales || [];
        setSales(salesData);
        setFilteredSales(salesData);
      } catch (error) {
        console.error('Failed to fetch sales:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);

    if (!query.trim()) {
      setFilteredSales(sales);
      return;
    }

    const filtered = sales.filter(
      (sale) =>
        sale.medicineId?.name?.toLowerCase().includes(query.toLowerCase()) ||
        sale.userId?.email?.toLowerCase().includes(query.toLowerCase()) ||
        sale.quantity?.toString().includes(query)
    );

    setFilteredSales(filtered);
  };

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  // Sort data
  const sortedSales = [...filteredSales].sort((a, b) => {
    const key = sortConfig.key;
    let aVal = a[key];
    let bVal = b[key];

    if (key === 'medicineId') aVal = a.medicineId?.name || '';
    if (key === 'medicineId') bVal = b.medicineId?.name || '';
    if (key === 'userId') aVal = a.userId?.email || '';
    if (key === 'userId') bVal = b.userId?.email || '';

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedSales = sortedSales.slice(startIdx, startIdx + itemsPerPage);
  const totalPages = Math.ceil(sortedSales.length / itemsPerPage);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (value) => {
    if (!value) return '₹ 0.00';
    return `₹ ${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Loading sales data...</div>;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-slate-900">Recent Sales List</h3>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:flex-none relative">
              <IconSearch
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-700 dark:focus:border-slate-500 focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-600"
              />
            </div>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <IconFilter size={18} className="text-slate-600" />
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <IconArrowDown size={18} className="text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-slate-700">Name</th>
              <th>
                <button
                  onClick={() => handleSort('medicineId')}
                  className="px-6 py-3 text-left font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-2"
                >
                  Medicine
                  {sortConfig.key === 'medicineId' && (
                    <span className="text-xs">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              </th>
              <th className="px-6 py-3 text-left font-semibold text-slate-700">User Email</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-700">Quantity</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-700">Total Price</th>
              <th>
                <button
                  onClick={() => handleSort('date')}
                  className="px-6 py-3 text-left font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-2"
                >
                  Date
                  {sortConfig.key === 'date' && (
                    <span className="text-xs">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              </th>
              <th className="px-6 py-3 text-left font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedSales.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                  No sales found
                </td>
              </tr>
            ) : (
              paginatedSales.map((sale, idx) => (
                <tr
                  key={idx}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {sale.userId?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <span className="font-medium text-slate-900">
                        {sale.userId?.name || 'Unknown'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {sale.medicineId?.name || '-'}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {sale.userId?.email || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-2 px-2 py-1 bg-slate-100 rounded-full">
                      <span className="w-2 h-2 bg-slate-400 rounded-full" />
                      <span className="text-slate-700">{sale.quantity || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    {formatCurrency(sale.totalAmount)}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {formatDate(sale.date)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 hover:bg-slate-50 dark:bg-slate-800 rounded-lg transition-colors text-slate-700 dark:text-slate-300">
                        <IconEdit size={16} />
                      </button>
                      <button className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-600">
                        <IconTrash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-600">
          Showing {filteredSales.length === 0 ? 0 : startIdx + 1} of {filteredSales.length} entries
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <IconChevronLeft size={18} className="text-slate-600" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                currentPage === page
                  ? 'bg-slate-100 dark:bg-slate-700 text-blue-700'
                  : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <IconChevronRight size={18} className="text-slate-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
