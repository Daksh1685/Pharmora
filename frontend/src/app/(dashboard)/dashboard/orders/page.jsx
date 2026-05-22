'use client';

import { useState, useEffect } from 'react';
import useAuthStore from '@/store/authStore';
import apiClient from '@/utils/apiClient';
import SearchResults from '@/components/Dashboard/SearchResults';
import { IconPlus, IconTrendingUp, IconPackage, IconClock, IconX } from '@tabler/icons-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useUIStore from '@/store/uiStore';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [revenue, setRevenue] = useState(0);
  const [revenueChange, setRevenueChange] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingChange, setPendingChange] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('Yearly');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [previousYear, setPreviousYear] = useState(new Date().getFullYear() - 1);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedicineFilter, setSelectedMedicineFilter] = useState(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState(null);
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [availableMedicines, setAvailableMedicines] = useState([]);
  const [formData, setFormData] = useState({
    supplierName: '',
    supplierPhone: '',
    medicineId: '',
    batchNumber: '',
    expiryDate: '',
    quantity: '',
    purchasePrice: '',
    totalAmount: '',
    status: 'pending',
    deliveryDate: '',
    paymentTerms: 'upi',
    notes: '',
  });
  const user = useAuthStore((state) => state.user);
  const { openConfirm, addNotification } = useUIStore();

  // Initial load
  useEffect(() => {
    fetchOrders(true);
    fetchMedicines();
    const interval = setInterval(() => {
      fetchOrders(false);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchMedicines = async () => {
    try {
      const response = await apiClient.get('/medicines');
      const meds = response.data?.data?.medicines || response.data?.data || [];
      setAvailableMedicines(Array.isArray(meds) ? meds : []);
    } catch (error) {
      console.error('Failed to fetch medicines:', error);
    }
  };

  // Re-generate chart when timeRange changes
  useEffect(() => {
    generateChartData(orders, timeRange);
  }, [timeRange, orders]);

  // Recalculate stats when orders change
  useEffect(() => {
    if (orders.length > 0) {
      calculateStats(orders);
    }
  }, [orders]);

  // Auto-calculate total amount when quantity or purchasePrice changes
  useEffect(() => {
    if (formData.quantity && formData.purchasePrice) {
      const qty = parseFloat(formData.quantity);
      const price = parseFloat(formData.purchasePrice);
      if (!isNaN(qty) && !isNaN(price)) {
        const total = (qty * price).toFixed(2);
        setFormData(prev => ({...prev, totalAmount: total}));
      }
    }
  }, [formData.quantity, formData.purchasePrice]);

  const fetchOrders = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const response = await apiClient.get('/purchases');
      const ordersData = response.data?.data?.purchases || response.data?.data || [];
      const ordersArray = Array.isArray(ordersData) ? ordersData : [];
      setOrders(ordersArray);
      calculateStats(ordersArray);
      generateChartData(ordersArray, timeRange);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setOrders([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const calculateStats = (ordersArray) => {
    const totalRevenue = ordersArray.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    setRevenue(totalRevenue);
    
    // Calculate trend percentage (comparing first half vs second half of orders)
    const mid = Math.floor(ordersArray.length / 2);
    const firstHalf = ordersArray.slice(0, mid).reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const secondHalf = ordersArray.slice(mid).reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const trend = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf * 100) : 0;
    setRevenueChange(trend);

    // Count pending orders - only pending and processing are considered pending
    const pending = ordersArray.filter(order => {
      const status = order.status?.toLowerCase?.() || '';
      return status === 'pending' || status === 'processing';
    }).length;
    setPendingCount(pending);
    
    // Pending trend
    const completedCount = ordersArray.filter(o => o.status?.toLowerCase?.() === 'completed').length;
    const totalOrders = ordersArray.length;
    const pendingPercentage = totalOrders > 0 ? (pending / totalOrders * 100) : 0;
    setPendingChange(pendingPercentage);
  };

  const generateChartData = (ordersArray, selectedRange = 'Yearly') => {
    if (selectedRange === 'Yearly') {
      const monthlyData = {};
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const curr = new Date().getFullYear();
      const prev = curr - 1;

      months.forEach(month => {
        monthlyData[month] = { month, [prev]: 0, [curr]: 0 };
      });

      ordersArray.forEach(order => {
        const orderDate = order.deliveryDate || order.createdAt;
        if (orderDate) {
          const date = new Date(orderDate);
          const month = months[date.getMonth()];
          const year = date.getFullYear();

          if (monthlyData[month] && (year === prev || year === curr)) {
            monthlyData[month][year] = (monthlyData[month][year] || 0) + 1;
          }
        }
      });

      setChartData(months.map(month => monthlyData[month]));
    } else if (selectedRange === 'Monthly') {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const dailyData = {};
      
      for (let day = 1; day <= daysInMonth; day++) {
        dailyData[day] = { day: `${currentDate.toLocaleString('en-US', { month: 'short' })} ${day}`, count: 0 };
      }

      ordersArray.forEach(order => {
        const orderDate = order.deliveryDate || order.createdAt;
        if (orderDate) {
          const date = new Date(orderDate);
          if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
            const day = date.getDate();
            if (dailyData[day]) {
              dailyData[day].count = (dailyData[day].count || 0) + 1;
            }
          }
        }
      });

      const data = Object.values(dailyData).map(d => ({ ...d, Orders: d.count }));
      setChartData(data);
    } else if (selectedRange === 'Weekly') {
      const currentDate = new Date();
      const weeklyData = {};
      
      for (let i = 11; i >= 0; i--) {
        const weekStart = new Date(currentDate);
        weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + i * 7));
        const weekLabel = `Week ${12 - i}`;
        weeklyData[weekLabel] = { week: weekLabel, Orders: 0 };
      }

      ordersArray.forEach(order => {
        const orderDate = order.deliveryDate || order.createdAt;
        if (orderDate) {
          const date = new Date(orderDate);
          const weekNumber = Math.floor((currentDate - date) / (7 * 24 * 60 * 60 * 1000));
          if (weekNumber >= 0 && weekNumber < 12) {
            const weekLabel = `Week ${12 - weekNumber}`;
            if (weeklyData[weekLabel]) {
              weeklyData[weekLabel].Orders = (weeklyData[weekLabel].Orders || 0) + 1;
            }
          }
        }
      });

      setChartData(Object.values(weeklyData));
    }
  };

  const handleAddOrder = async (e) => {
    e.preventDefault();
    
    // Validate form data before sending
    if (!formData.supplierName.trim()) {
      openConfirm({ title: 'Validation Error', message: 'Please enter supplier name', type: 'warning', confirmText: 'OK', cancelText: 'Close' });
      return;
    }
    if (!formData.medicineId) {
      openConfirm({ title: 'Validation Error', message: 'Please select a medicine', type: 'warning', confirmText: 'OK', cancelText: 'Close' });
      return;
    }
    if (!formData.batchNumber.trim()) {
      openConfirm({ title: 'Validation Error', message: 'Please enter batch number', type: 'warning', confirmText: 'OK', cancelText: 'Close' });
      return;
    }
    if (!formData.expiryDate) {
      openConfirm({ title: 'Validation Error', message: 'Please select expiry date', type: 'warning', confirmText: 'OK', cancelText: 'Close' });
      return;
    }
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      openConfirm({ title: 'Validation Error', message: 'Please enter valid quantity', type: 'warning', confirmText: 'OK', cancelText: 'Close' });
      return;
    }
    if (!formData.purchasePrice || parseFloat(formData.purchasePrice) < 0) {
      openConfirm({ title: 'Validation Error', message: 'Please enter valid purchase price', type: 'warning', confirmText: 'OK', cancelText: 'Close' });
      return;
    }
    
    try {
      const orderData = {
        supplierName: formData.supplierName.trim(),
        supplierPhone: formData.supplierPhone.trim() || '',
        medicines: [
          {
            medicineId: formData.medicineId,
            batchNumber: formData.batchNumber.trim(),
            expiryDate: formData.expiryDate,
            quantity: parseInt(formData.quantity),
            purchasePrice: parseFloat(formData.purchasePrice),
          }
        ],
        status: formData.status,
        deliveryDate: formData.deliveryDate || new Date().toISOString().split('T')[0],
        paymentMethod: formData.paymentTerms,
        notes: formData.notes.trim() || '',
      };
      
      console.log('Sending order data:', orderData);
      
      let response;
      if (editingOrderId) {
        // Update existing order
        response = await apiClient.put(`/purchases/${editingOrderId}`, orderData);
        openConfirm({ title: 'Success', message: 'Order updated successfully!', type: 'info', confirmText: 'OK', cancelText: 'Close' });
      } else {
        // Create new order
        response = await apiClient.post('/purchases', orderData);
        openConfirm({ title: 'Success', message: 'Order created successfully!', type: 'info', confirmText: 'OK', cancelText: 'Close' });
      }
      
      handleCloseModal();
      fetchOrders(false);
    } catch (error) {
      console.error('Failed to create order:', error.response?.data || error.message);
      
      let errorMsg = editingOrderId ? 'Failed to update order' : 'Failed to create order';
      
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.response?.data) {
        errorMsg = JSON.stringify(error.response.data);
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      addNotification(`Error: ${errorMsg}`, 'error');
    }
  };

  const handleEditOrder = (order) => {
    setEditingOrderId(order._id);
    setFormData({
      supplierName: order.supplierName || '',
      supplierPhone: order.supplierPhone || '',
      medicineName: order.medicines?.[0]?.name || '',
      batchNumber: order.medicines?.[0]?.batchNumber || '',
      expiryDate: order.medicines?.[0]?.expiryDate?.split('T')[0] || '',
      quantity: order.medicines?.[0]?.quantity?.toString() || '',
      purchasePrice: order.medicines?.[0]?.purchasePrice?.toString() || '',
      totalAmount: (order.medicines?.[0]?.quantity * order.medicines?.[0]?.purchasePrice)?.toString() || '',
      status: order.status || 'pending',
      deliveryDate: order.deliveryDate?.split('T')[0] || '',
      paymentTerms: order.paymentMethod || 'upi',
      notes: order.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteOrder = (orderId) => {
    openConfirm({
      title: 'Delete Order',
      message: 'Are you sure you want to delete this order? This cannot be undone.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await apiClient.delete(`/purchases/${orderId}`);
          openConfirm({ title: 'Deleted', message: 'Order deleted successfully!', type: 'info', confirmText: 'OK', cancelText: 'Close' });
          fetchOrders(false);
        } catch (error) {
          console.error('Failed to delete order:', error);
          openConfirm({ title: 'Error', message: error.response?.data?.message || 'Failed to delete order', type: 'danger', confirmText: 'OK', cancelText: 'Close' });
        }
      }
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOrderId(null);
    setFormData({
      supplierName: '',
      supplierPhone: '',
      medicineName: '',
      batchNumber: '',
      expiryDate: '',
      quantity: '',
      purchasePrice: '',
      totalAmount: '',
      status: 'pending',
      deliveryDate: '',
      paymentTerms: 'upi',
      notes: '',
    });
  };

  // Filter function for search - searches across all fields
  const getFilteredOrders = () => {
    let filtered = orders;

    // Apply search across all fields
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => {
        return order.supplierName?.toLowerCase().includes(query) ||
               order.supplierPhone?.toLowerCase().includes(query) ||
               order._id?.toLowerCase().includes(query) ||
               order.medicines?.some(m => m.medicineName?.toLowerCase().includes(query) ||
                                          m.name?.toLowerCase().includes(query));
      });
    }

    // Apply status filter if selected
    if (selectedStatusFilter) {
      filtered = filtered.filter(order => order.status?.toLowerCase() === selectedStatusFilter.toLowerCase());
    }

    // Apply medicine filter if selected
    if (selectedMedicineFilter) {
      filtered = filtered.filter(order => 
        order.medicines?.some(m => m.medicineName?.toLowerCase() === selectedMedicineFilter.toLowerCase() ||
                                   m.name?.toLowerCase() === selectedMedicineFilter.toLowerCase())
      );
    }

    // Return all orders if showAllOrders is true, otherwise limit to 5
    return showAllOrders ? filtered : filtered.slice(0, 5);
  };

  const filteredOrders = getFilteredOrders();
  const recentOrders = filteredOrders;
  const curr = new Date().getFullYear();
  const prev = curr - 1;

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-8 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl shadow-md animate-pulse border border-slate-200" />
          ))}
        </div>
        <div className="h-96 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl shadow-lg animate-pulse border border-slate-200" />
        <div className="h-64 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl shadow-lg animate-pulse border border-slate-200" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">Orders Management</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-1">
            Monitor all purchase orders and analytics in real-time
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-all duration-300 shadow-md hover:shadow-lg active:scale-95"
        >
          <IconPlus size={20} />
          New Order
        </button>
      </div>

      {/* Search Results */}
      <SearchResults />

      {/* New Order Modal */}
      {isModalOpen && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={handleCloseModal} />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl z-50 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{editingOrderId ? 'Edit Order' : 'Create New Order'}</h2>
              <button 
                onClick={handleCloseModal}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddOrder} className="p-6 space-y-5">
              {/* Supplier Details Section */}
              <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Supplier Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Supplier Name</label>
                    <input
                      type="text"
                      value={formData.supplierName}
                      onChange={(e) => setFormData({...formData, supplierName: e.target.value})}
                      placeholder="Enter supplier name"
                      required
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.supplierPhone}
                      onChange={(e) => setFormData({...formData, supplierPhone: e.target.value})}
                      placeholder="Enter phone number"
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* Product Details Section */}
              <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Product Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Medicine *</label>
                    <select
                      value={formData.medicineId}
                      onChange={(e) => setFormData({...formData, medicineId: e.target.value})}
                      required
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
                    >
                      <option value="">Select a medicine</option>
                      {availableMedicines.map(med => (
                        <option key={med._id} value={med._id}>{med.name} (Stock: {med.quantity})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Batch Number</label>
                    <input
                      type="text"
                      value={formData.batchNumber}
                      onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
                      placeholder="Enter batch number"
                      required
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Expiry Date</label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                      required
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Quantity</label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      placeholder="Enter quantity"
                      min="0"
                      step="1"
                      required
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Purchase Price (₹)</label>
                    <input
                      type="number"
                      value={formData.purchasePrice}
                      onChange={(e) => setFormData({...formData, purchasePrice: e.target.value})}
                      placeholder="Enter purchase price"
                      step="0.01"
                      min="0"
                      required
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Total Amount (₹)</label>
                    <input
                      type="number"
                      value={formData.totalAmount}
                      readOnly
                      required
                      placeholder="Auto-calculated"
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Order Details Section */}
              <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Order Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Delivery Date</label>
                    <input
                      type="date"
                      value={formData.deliveryDate}
                      onChange={(e) => setFormData({...formData, deliveryDate: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Payment Method</label>
                    <select
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({...formData, paymentTerms: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
                    >
                      <option value="upi">UPI</option>
                      <option value="card">Card</option>
                      <option value="netbanking">Net Banking</option>
                      <option value="cod">Cash on Delivery</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Notes (Optional)</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Add any additional notes"
                      rows="3"
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-slate-700 dark:bg-slate-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors font-medium"
                >
                  {editingOrderId ? 'Update Order' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Stats Cards Grid - StatCardNew Design with Smooth Area Line Graphs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Total Orders Card */}
        <div className="bg-slate-50 dark:bg-slate-800 dark:bg-blue-900/20 rounded-2xl p-5 sm:p-6 border border-slate-100 dark:border-blue-900/40 shadow-sm hover:shadow-lg hover:border-slate-200 dark:hover:border-blue-800/60 transition-all duration-300 ease-out">
          {/* Header with title */}
          <div className="mb-4">
            <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Total Orders
            </p>
          </div>

          {/* Value and percentage */}
          <div className="mb-6">
            <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              {orders.length}
            </p>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
              <span className="text-slate-700 dark:text-slate-300 dark:text-blue-400 font-semibold">Real-time</span>{' '}
              <span className="text-slate-400 dark:text-slate-500">All time</span>
            </p>
          </div>

          {/* Smooth area chart */}
          <svg className="w-full h-12 group" viewBox="0 0 200 50" preserveAspectRatio="none">
            <defs>
              <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgb(96, 165, 250)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="rgb(96, 165, 250)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,35 Q25,20 50,25 T100,15 T150,22 T200,18 L200,50 L0,50 Z" fill="url(#blueGradient)" className="opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
            <path d="M0,35 Q25,20 50,25 T100,15 T150,22 T200,18" fill="none" stroke="rgb(59, 130, 246)" strokeWidth="2.5" className="opacity-80 group-hover:opacity-100 transition-opacity duration-300" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>

        {/* Revenue Card */}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-5 sm:p-6 border border-slate-100 dark:border-emerald-900/40 shadow-sm hover:shadow-lg hover:border-slate-200 dark:hover:border-emerald-800/60 transition-all duration-300 ease-out group">
          {/* Header with title */}
          <div className="mb-4">
            <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Total Purchase Value
            </p>
          </div>

          {/* Value and percentage */}
          <div className="mb-6">
            <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              ₹{(revenue / 100000).toFixed(1)}L
            </p>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
              <span className={`font-semibold ${revenueChange > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {revenueChange > 0 ? '↑' : '↓'} {Math.abs(revenueChange).toFixed(1)}%
              </span>{' '}
              <span className="text-slate-400 dark:text-slate-500">vs previous</span>
            </p>
          </div>

          {/* Smooth area chart */}
          <svg className="w-full h-12 group" viewBox="0 0 200 50" preserveAspectRatio="none">
            <defs>
              <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,30 Q25,12 50,18 T100,8 T150,15 T200,12 L200,50 L0,50 Z" fill="url(#emeraldGradient)" className="opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
            <path d="M0,30 Q25,12 50,18 T100,8 T150,15 T200,12" fill="none" stroke="rgb(5, 150, 105)" strokeWidth="2.5" className="opacity-80 group-hover:opacity-100 transition-opacity duration-300" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>

        {/* Pending Orders Card */}
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-5 sm:p-6 border border-slate-100 dark:border-orange-900/40 shadow-sm hover:shadow-lg hover:border-slate-200 dark:hover:border-orange-800/60 transition-all duration-300 ease-out group">
          {/* Header with title */}
          <div className="mb-4">
            <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Pending Orders
            </p>
          </div>

          {/* Value and percentage */}
          <div className="mb-6">
            <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              {pendingCount}
            </p>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
              <span className="text-orange-600 dark:text-orange-400 font-semibold">{pendingChange.toFixed(1)}%</span>{' '}
              <span className="text-slate-400 dark:text-slate-500">of total</span>
            </p>
          </div>

          {/* Smooth area chart */}
          <svg className="w-full h-12 group" viewBox="0 0 200 50" preserveAspectRatio="none">
            <defs>
              <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgb(249, 115, 22)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="rgb(249, 115, 22)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,32 Q25,16 50,22 T100,10 T150,20 T200,15 L200,50 L0,50 Z" fill="url(#orangeGradient)" className="opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
            <path d="M0,32 Q25,16 50,22 T100,10 T150,20 T200,15" fill="none" stroke="rgb(234, 88, 12)" strokeWidth="2.5" className="opacity-80 group-hover:opacity-100 transition-opacity duration-300" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      </div>

      {/* Total Orders Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 sm:p-8 transition-all duration-300 hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-600">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Total Orders Trend</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {timeRange === 'Yearly' && `Monthly comparison between ${prev} and ${curr}`}
              {timeRange === 'Monthly' && 'Daily order count for current month'}
              {timeRange === 'Weekly' && 'Weekly order count for last 12 weeks'}
            </p>
          </div>
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 text-sm font-medium border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 bg-white text-slate-900 dark:text-white hover:border-slate-400 transition-all duration-200"
          >
            <option value="Yearly">Yearly</option>
            <option value="Monthly">Monthly</option>
            <option value="Weekly">Weekly</option>
          </select>
        </div>
        
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey={timeRange === 'Yearly' ? 'month' : timeRange === 'Monthly' ? 'day' : 'week'} 
                stroke="#64748b" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                stroke="#64748b" 
                label={{ value: 'Order Count', angle: -90, position: 'insideLeft', style: { fill: '#64748b' } }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #64748b',
                  borderRadius: '8px',
                  color: '#f1f5f9'
                }}
                formatter={(value, name) => [value, timeRange === 'Yearly' ? `Year ${name}` : 'Orders']}
                labelFormatter={(label) => `${timeRange === 'Yearly' ? 'Month: ' : timeRange === 'Monthly' ? 'Day: ' : 'Week: '}${label}`}
              />
              {timeRange === 'Yearly' ? (
                <>
                  <Line 
                    type="monotone" 
                    dataKey={prev}
                    stroke="#14b8a6" 
                    strokeWidth={2}
                    dot={{ fill: '#14b8a6', r: 5 }}
                    activeDot={{ r: 7 }}
                    name={prev}
                  />
                  <Line 
                    type="monotone" 
                    dataKey={curr}
                    stroke="#f472b6" 
                    strokeWidth={2}
                    dot={{ fill: '#f472b6', r: 5 }}
                    activeDot={{ r: 7 }}
                    name={curr}
                  />
                </>
              ) : (
                <Line 
                  type="monotone" 
                  dataKey="Orders" 
                  stroke="#14b8a6" 
                  strokeWidth={2}
                  dot={{ fill: '#14b8a6', r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Orders"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-400">No data available for {timeRange.toLowerCase()} view</p>
          </div>
        )}
        
        <div className="flex gap-6 mt-6 justify-center flex-wrap">
          {timeRange === 'Yearly' ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-teal-500" />
                <span className="text-sm text-slate-600 dark:text-slate-400">{prev}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-pink-400" />
                <span className="text-sm text-slate-600 dark:text-slate-400">{curr}</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-teal-500" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Total Orders</span>
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Table */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {showAllOrders ? `All Orders (${recentOrders.length})` : 'Recent Orders'}
          </h2>
          <button
            onClick={() => setShowAllOrders(!showAllOrders)}
            className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200"
          >
            {showAllOrders ? 'Show Less' : 'View All'}
          </button>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 sm:p-8 overflow-x-auto hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300 ease-out">
          {/* Search Box Inside Card */}
          <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by supplier name, phone, medicine, or order ID..."
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-3 text-xs px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 transition-all duration-200"
              >
                Clear Search
              </button>
            )}
          </div>
          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700">
                    <th className="text-left py-3 sm:py-4 px-2 sm:px-4 font-semibold text-slate-900 dark:text-white">Order ID</th>
                    <th className="text-left py-3 sm:py-4 px-2 sm:px-4 font-semibold text-slate-900 dark:text-white hidden sm:table-cell">Date</th>
                    <th className="text-left py-3 sm:py-4 px-2 sm:px-4 font-semibold text-slate-900 dark:text-white">Supplier</th>
                    <th className="text-left py-3 sm:py-4 px-2 sm:px-4 font-semibold text-slate-900 dark:text-white hidden lg:table-cell">Phone</th>
                    <th className="text-left py-3 sm:py-4 px-2 sm:px-4 font-semibold text-slate-900 dark:text-white hidden md:table-cell">Medicine</th>
                    <th className="text-center py-3 sm:py-4 px-2 sm:px-4 font-semibold text-slate-900 dark:text-white hidden sm:table-cell">Qty</th>
                    <th className="text-right py-3 sm:py-4 px-2 sm:px-4 font-semibold text-slate-900 dark:text-white">Amount</th>
                    <th className="text-left py-3 sm:py-4 px-2 sm:px-4 font-semibold text-slate-900 dark:text-white hidden md:table-cell">Payment</th>
                    <th className="text-center py-3 sm:py-4 px-2 sm:px-4 font-semibold text-slate-900 dark:text-white">Status</th>
                    <th className="text-center py-3 sm:py-4 px-2 sm:px-4 font-semibold text-slate-900 dark:text-white">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order._id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200">
                      <td className="py-3 sm:py-4 px-2 sm:px-4 text-slate-600 dark:text-slate-300 font-medium text-xs sm:text-sm">{order._id?.slice(-8).toUpperCase() || 'N/A'}</td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4 text-slate-600 dark:text-slate-300 hidden sm:table-cell text-xs">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : 'N/A'}
                      </td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4 text-slate-600 dark:text-slate-300 text-xs sm:text-sm">{order.supplierName || 'N/A'}</td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4 text-slate-600 dark:text-slate-300 text-xs hidden lg:table-cell">{order.supplierPhone || 'N/A'}</td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4 text-slate-600 dark:text-slate-300 text-xs hidden md:table-cell">{order.medicines?.[0]?.name || order.medicines?.[0]?.medicineName || 'N/A'}</td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4 text-center text-slate-600 dark:text-slate-300 text-xs hidden sm:table-cell">{order.medicines?.[0]?.quantity || 0}</td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4 text-right font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">
                        ₹{order.totalAmount ? order.totalAmount.toLocaleString('en-IN') : 0}
                      </td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4 text-slate-600 dark:text-slate-300 text-xs hidden md:table-cell capitalize">{order.paymentMethod || 'N/A'}</td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4 text-center">
                        <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                          order.status?.toLowerCase() === 'completed' || order.status?.toLowerCase() === 'received'
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-200'
                            : order.status?.toLowerCase() === 'pending' || order.status?.toLowerCase() === 'processing'
                            ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-200'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}>
                          {order.status || 'Pending'}
                        </span>
                      </td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4 text-center">
                        <div className="flex gap-1 sm:gap-2 justify-center flex-col sm:flex-row">
                          <button
                            onClick={() => handleEditOrder(order)}
                            className="px-2 sm:px-3 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-700 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order._id)}
                            className="px-2 sm:px-3 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
                          >
                            Del
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              {searchQuery ? (
                <>
                  <p className="text-slate-600 dark:text-slate-300 font-medium mb-2">No results found</p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Try searching with different keywords</p>
                </>
              ) : (
                <p className="text-slate-600 dark:text-slate-400">No orders found</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
