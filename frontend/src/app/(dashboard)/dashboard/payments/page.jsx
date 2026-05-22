'use client';

import { useState, useEffect } from 'react';
import useAuthStore from '@/store/authStore';
import apiClient from '@/utils/apiClient';
import { Card } from '@/components/Common';
import { IconCheck, IconClock, IconCoins, IconSearch, IconDownload, IconEye, IconEdit, IconTrash, IconPlus, IconFileInvoice, IconCreditCard, IconX as IconClose, IconPrinter, IconWallet, IconTrendingUp } from '@tabler/icons-react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import useUIStore from '@/store/uiStore';

export default function PaymentsPage() {
  const [paymentStats, setPaymentStats] = useState({
    completed: { count: 0, revenue: 0 },
    pending: { count: 0, revenue: 0 },
    totalRevenue: { count: '₹0', revenue: 0 }
  });
  const [paymentMethodData, setPaymentMethodData] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [allSalesData, setAllSalesData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [formData, setFormData] = useState({
    orderId: '',
    customerName: '',
    customerPhone: '',
    paymentMethod: 'cash',
    amount: '',
    notes: ''
  });
  const user = useAuthStore((state) => state.user);
  const addNotification = useUIStore((state) => state.addNotification);

  // Fetch sales data
  useEffect(() => {
    loadPaymentData();
  }, []);

  const loadPaymentData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/sales/customers/list');
      const sales = response.data?.data?.sales || [];
      
      // Store all sales data for later use
      setAllSalesData(sales);
      
      // Transform sales to transactions
      const transactions = sales.map((sale) => ({
        id: `TXN-${sale._id.slice(-6).toUpperCase()}`,
        orderId: sale.orderId || 'N/A',
        customer: sale.customerName || 'Unknown',
        date: sale.createdAt ? new Date(sale.createdAt).toLocaleDateString('en-IN') : 'N/A',
        amount: sale.totalAmount || 0,
        status: 'Completed', // All from sales are completed
        method: (sale.paymentMethod || 'cash').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        customerPhone: sale.customerPhone || 'N/A',
        _id: sale._id
      }));

      // Calculate stats
      const completed = transactions.filter(t => t.status === 'Completed');
      const completedRevenue = completed.reduce((sum, t) => sum + t.amount, 0);
      const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);

      // Calculate revenue by payment method
      const methodBreakdown = {};
      transactions.forEach(t => {
        const paymentMethod = t.method;
        if (!methodBreakdown[paymentMethod]) {
          methodBreakdown[paymentMethod] = 0;
        }
        methodBreakdown[paymentMethod] += t.amount;
      });

      const chartData = Object.entries(methodBreakdown).map(([name, value]) => ({
        name,
        value: parseFloat(value.toFixed(2))
      }));

      setPaymentStats({
        completed: { count: completed.length, revenue: completedRevenue },
        pending: { count: 0, revenue: 0 },
        totalRevenue: { count: `₹${totalRevenue.toLocaleString('en-IN')}`, revenue: totalRevenue }
      });

      setPaymentMethodData(chartData);
      setRecentTransactions(transactions.sort((a, b) => new Date(b.date) - new Date(a.date)));
      setFilteredTransactions(transactions.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) {
      console.error('Error loading payment data:', error);
      setRecentTransactions([]);
      setFilteredTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  useEffect(() => {
    const filtered = recentTransactions.filter(transaction =>
      transaction.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.orderId.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredTransactions(filtered);
    setCurrentPage(1); // Reset to page 1 when search query changes
  }, [searchQuery, recentTransactions]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      // Create a sale record
      const saleData = {
        orderId: formData.orderId,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        paymentMethod: formData.paymentMethod,
        totalAmount: parseFloat(formData.amount),
        medicines: [],
        notes: formData.notes
      };

      await apiClient.post('/sales', saleData);
      addNotification('Payment recorded successfully!', 'success');
      setShowAddPaymentModal(false);
      setFormData({
        orderId: '',
        customerName: '',
        customerPhone: '',
        paymentMethod: 'cash',
        amount: '',
        notes: ''
      });
      loadPaymentData(); // Refresh data
    } catch (error) {
      console.error('Error recording payment:', error);
      addNotification('Error: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  // Handle View - Show order details
  const handleViewDetails = (transaction) => {
    const sale = allSalesData.find(s => s._id === transaction._id);
    if (sale) {
      setSelectedTransaction({ ...transaction, fullData: sale });
      setShowDetailModal(true);
    }
  };

  // Generate and download invoice
  const handleDownloadInvoice = (transaction) => {
    const sale = allSalesData.find(s => s._id === transaction._id);
    if (!sale) return;

    // Create invoice content
    const invoiceContent = `
PHARMORA INVENTORY SYSTEM
INVOICE

=====================================
Invoice No: ${transaction.id}
Order ID: ${transaction.orderId}
Date: ${transaction.date}
=====================================

CUSTOMER INFORMATION:
Name: ${transaction.customer}
Phone: ${transaction.customerPhone}
Email: ${sale.customerEmail || 'N/A'}

=====================================
ITEMS:
${sale.medicines && sale.medicines.length > 0 
  ? sale.medicines.map((med, idx) => 
      `${idx + 1}. ${med.medicineId?.name || 'Unknown Medicine'}\n   Quantity: ${med.quantity}\n   Price: ₹${(med.price || 0).toLocaleString('en-IN')}\n   Subtotal: ₹${((med.price || 0) * med.quantity).toLocaleString('en-IN')}`
    ).join('\n\n')
  : 'No items'
}

=====================================
PAYMENT DETAILS:
Payment Method: ${transaction.method}
Total Amount: ₹${transaction.amount.toLocaleString('en-IN')}
Status: ${transaction.status}

=====================================
Generated on: ${new Date().toLocaleString('en-IN')}
Thank you for your business!
    `;

    // Create a blob and download
    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice-${transaction.orderId}-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Handle Delete
  const handleDeleteTransaction = (transaction) => {
    setTransactionToDelete(transaction);
    setShowDeleteModal(true);
  };

  // Confirm Delete
  const confirmDeleteTransaction = async () => {
    if (!transactionToDelete) return;

    try {
      await apiClient.delete(`/sales/${transactionToDelete._id}`);
      setShowDeleteModal(false);
      setTransactionToDelete(null);
      loadPaymentData();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      addNotification('Error: ' + (error.response?.data?.message || error.message), 'error');
      setShowDeleteModal(false);
    }
  };

  // Handle Print Bill
  const handlePrintBill = (transaction) => {
    const sale = allSalesData.find(s => s._id === transaction._id);
    if (!sale) return;

    const printContent = `
<html>
<head>
  <title>Invoice - ${transaction.orderId}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .invoice-container { max-width: 600px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 30px; }
    .header h1 { margin: 0; }
    .details { margin-bottom: 20px; }
    .details-row { display: flex; justify-content: space-between; margin: 5px 0; }
    .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .items-table th, .items-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    .items-table th { background-color: #f0f0f0; }
    .total { float: right; margin-top: 20px; font-size: 18px; font-weight: bold; }
    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <h1>PHARMORA INVOICE</h1>
      <p>Invoice #${transaction.id}</p>
    </div>
    
    <div class="details">
      <div class="details-row">
        <strong>Order ID:</strong>
        <span>${transaction.orderId}</span>
      </div>
      <div class="details-row">
        <strong>Date:</strong>
        <span>${transaction.date}</span>
      </div>
      <div class="details-row">
        <strong>Customer:</strong>
        <span>${transaction.customer}</span>
      </div>
      <div class="details-row">
        <strong>Phone:</strong>
        <span>${transaction.customerPhone}</span>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Medicine</th>
          <th>Quantity</th>
          <th>Price</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${sale.medicines && sale.medicines.length > 0 
          ? sale.medicines.map(med => `
            <tr>
              <td>${med.medicineId?.name || 'Unknown'}</td>
              <td>${med.quantity}</td>
              <td>₹${(med.price || 0).toLocaleString('en-IN')}</td>
              <td>₹${((med.price || 0) * med.quantity).toLocaleString('en-IN')}</td>
            </tr>
          `).join('')
          : '<tr><td colspan="4">No items</td></tr>'
        }
      </tbody>
    </table>

    <div class="total">
      Total: ₹${transaction.amount.toLocaleString('en-IN')}
    </div>

    <div style="clear: both;"></div>
    <div class="details" style="margin-top: 40px;">
      <div class="details-row">
        <strong>Payment Method:</strong>
        <span>${transaction.method}</span>
      </div>
      <div class="details-row">
        <strong>Status:</strong>
        <span>${transaction.status}</span>
      </div>
    </div>

    <div class="footer">
      <p>Thank you for your business!</p>
      <p>Generated on ${new Date().toLocaleString('en-IN')}</p>
    </div>
  </div>
</body>
</html>
    `;

    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  // Handle Export to File
  const handleExportToFile = () => {
    const timestamp = new Date().toLocaleString('en-IN');
    const csvContent = "data:text/csv;charset=utf-8," + 
      ["Transaction ID,Customer,Date,Time,Amount,Status,Payment Method,Order ID"]
        .concat(
          filteredTransactions.map(t => 
            `${t.id},${t.customer},${t.date},${new Date().toLocaleTimeString('en-IN')},${t.amount},${t.status},${t.method},${t.orderId}`
          )
        )
        .join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Transactions-${new Date().toLocaleDateString('en-IN')}-${Date.now()}.csv`);
    link.click();
  };

  // Split Design - Text on left, Icon on right
  const StatCard = ({ icon: Icon, label, count, revenue, statusColor }) => (
    <Card className="overflow-hidden transition-shadow duration-200 hover:shadow-md">
      <div className="flex">
        {/* Left Side - Text */}
        <div className="flex-1 p-6 flex flex-col justify-center">
          <p className="text-slate-600 text-xs sm:text-sm font-medium">{label}</p>
          {typeof count === 'string' ? (
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-2">{count}</h3>
          ) : (
            <>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2 line-clamp-2">{count}</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">₹{revenue.toLocaleString('en-IN')}</p>
            </>
          )}
        </div>
        
        {/* Right Side - Icon */}
        <div 
          className="w-2/5 flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${statusColor}10` }}
        >
          <Icon size={52} color={statusColor} strokeWidth={1.5} />
        </div>
      </div>
    </Card>
  );

  // Add Payment Modal Component
  const AddPaymentModal = () => (
    <>
      {/* Backdrop */}
      {showAddPaymentModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowAddPaymentModal(false)}
        />
      )}

      {/* Modal */}
      <div
        className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md sm:max-w-lg transition-all duration-300 ${
          showAddPaymentModal ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <Card className="p-6 sm:p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Record Payment</h2>
            <button
              onClick={() => setShowAddPaymentModal(false)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <IconClose size={20} className="text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleAddPayment} className="space-y-4 sm:space-y-5">
            {/* Order ID */}
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Order ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="orderId"
                value={formData.orderId}
                onChange={handleFormChange}
                placeholder="e.g., ORD-1001"
                className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 dark:focus:ring-slate-500 focus:border-slate-700 dark:focus:border-slate-500 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                required
              />
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleFormChange}
                placeholder="Enter customer name"
                className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 dark:focus:ring-slate-500 focus:border-slate-700 dark:focus:border-slate-500 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                required
              />
            </div>

            {/* Customer Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Customer Phone
              </label>
              <input
                type="tel"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleFormChange}
                placeholder="Enter phone number"
                className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 dark:focus:ring-slate-500 focus:border-slate-700 dark:focus:border-slate-500 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleFormChange}
                placeholder="Enter amount"
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 dark:focus:ring-slate-500 focus:border-slate-700 dark:focus:border-slate-500 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                required
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleFormChange}
                className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 dark:focus:ring-slate-500 focus:border-slate-700 dark:focus:border-slate-500 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                required
              >
                <option value="cash" className="bg-white dark:bg-slate-700 text-slate-900 dark:text-white">Cash</option>
                <option value="upi" className="bg-white dark:bg-slate-700 text-slate-900 dark:text-white">UPI</option>
                <option value="card" className="bg-white dark:bg-slate-700 text-slate-900 dark:text-white">Card</option>
                <option value="store_credit" className="bg-white dark:bg-slate-700 text-slate-900 dark:text-white">Store Credit</option>
                <option value="net_banking" className="bg-white dark:bg-slate-700 text-slate-900 dark:text-white">Net Banking</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                placeholder="Add any notes about this payment"
                rows="3"
                className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 dark:focus:ring-slate-500 focus:border-slate-700 dark:focus:border-slate-500 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowAddPaymentModal(false)}
                className="flex-1 px-4 py-2 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-slate-600 dark:bg-slate-600 hover:bg-slate-700 dark:hover:bg-slate-500 text-white rounded-lg transition-colors font-medium text-sm"
              >
                Record Payment
              </button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Payments</h1>
          <p className="text-slate-600 text-xs sm:text-sm md:text-base mt-1">
            View and manage all payment transactions
          </p>
        </div>
        <button
          onClick={() => setShowAddPaymentModal(true)}
          className="px-4 sm:px-6 py-2 sm:py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium w-full sm:w-auto"
        >
          <IconPlus size={18} />
          <span>Add Payment</span>
        </button>
      </div>

      {/* Stats Cards */}
      {/* Payment Methods Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Visa Card */}
        <div className="rounded-2xl p-5 sm:p-6 text-white shadow-sm overflow-hidden relative transition-shadow duration-200 hover:shadow-2xl" 
             style={{ 
               background: 'linear-gradient(135deg, #0a1f44 0%, #005f99 100%)',
               minHeight: '160px'
             }}>
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-xs opacity-80 mb-1">Visa Card</p>
              <p className="text-sm sm:text-base font-semibold">•••• •••• •••• 1685</p>
            </div>
            <div className="text-lg sm:text-xl font-bold">VISA</div>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs opacity-80 mb-1">Cardholder</p>
              <p className="text-xs sm:text-sm font-medium">Daksh Chaurasia</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-80">Expires</p>
              <p className="text-xs sm:text-sm font-medium">11/31</p>
            </div>
          </div>
        </div>

        {/* SBI Card */}
        <div className="rounded-2xl p-5 sm:p-6 text-white shadow-sm overflow-hidden relative transition-shadow duration-200 hover:shadow-2xl"
             style={{ 
               background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
               minHeight: '160px'
             }}>
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-xs opacity-80 mb-1">Credit Card</p>
              <p className="text-sm sm:text-base font-semibold">•••• •••• •••• 1685</p>
            </div>
            <div className="text-lg sm:text-xl font-bold">SBI
            </div>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs opacity-80 mb-1">Cardholder</p>
              <p className="text-xs sm:text-sm font-medium">Daksh Chaurasia</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-80">Expires</p>
              <p className="text-xs sm:text-sm font-medium">11/31</p>
            </div>
          </div>
        </div>

        {/* HDFC Card */}
        <div className="rounded-2xl p-5 sm:p-6 text-white shadow-sm overflow-hidden relative transition-shadow duration-200 hover:shadow-2xl"
             style={{ 
               background: 'linear-gradient(135deg, #ff0a7a 0%, #cc0066 35%, #7b00d4 100%)',
               minHeight: '160px'
             }}>
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-xs opacity-80 mb-1">Debit Card</p>
              <p className="text-sm sm:text-base font-semibold">•••• •••• •••• 1685</p>
            </div>
            <div className="text-lg sm:text-xl font-bold">HDFC</div>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs opacity-80 mb-1">Cardholder</p>
              <p className="text-xs sm:text-sm font-medium">Daksh Chaurasia</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-80">Expires</p>
              <p className="text-xs sm:text-sm font-medium">11/31</p>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice & Billing Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Latest Transaction Card */}
        <Card className="p-6 sm:p-8 bg-slate-50 dark:bg-slate-800 dark:bg-blue-900/20 border-2 border-slate-100 dark:border-blue-900/40 transition-shadow duration-200 hover:shadow-md">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Latest Transaction</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">Most recent payment details</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-700 dark:bg-blue-900/40">
              <IconFileInvoice size={24} className="text-slate-700 dark:text-slate-300 dark:text-blue-400" />
            </div>
          </div>

          {recentTransactions.length > 0 ? (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between mb-3">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Order ID</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{recentTransactions[0].orderId}</span>
                </div>
                <div className="flex justify-between mb-3">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Date</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{recentTransactions[0].date}</span>
                </div>
                <div className="flex justify-between mb-3">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Customer</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{recentTransactions[0].customer}</span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex justify-between">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Amount</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">₹{recentTransactions[0].amount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => handleViewDetails(recentTransactions[0])}
                  className="flex-1 px-3 sm:px-4 py-2 border-2 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-blue-900/40 transition-colors text-xs sm:text-sm font-medium">
                  View
                </button>
                <button 
                  onClick={() => handleDownloadInvoice(recentTransactions[0])}
                  className="flex-1 px-3 sm:px-4 py-2 border-2 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-blue-900/40 transition-colors text-xs sm:text-sm font-medium">
                  Download
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-600 dark:text-slate-400 text-sm">
              No transactions recorded yet
            </div>
          )}
        </Card>

        {/* Billing System Card */}
        <Card className="p-6 sm:p-8 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-slate-100 dark:border-emerald-900/40 transition-shadow duration-200 hover:shadow-md">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Billing System</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">Print and manage invoices</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
              <IconPrinter size={24} className="text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>

          {recentTransactions.length > 0 ? (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 space-y-3 border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Last Invoice:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{recentTransactions[0].id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Customer:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{recentTransactions[0].customer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Order ID:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{recentTransactions[0].orderId}</span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex justify-between">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Amount:</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{recentTransactions[0].amount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => handlePrintBill(recentTransactions[0])}
                  className="flex-1 px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-xs sm:text-sm font-medium flex items-center justify-center gap-2">
                  <IconPrinter size={16} />
                  <span>Print Bill</span>
                </button>
                <button 
                  onClick={() => window.location.href = '/dashboard/customers'}
                  className="flex-1 px-3 sm:px-4 py-2 border-2 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg transition-colors text-xs sm:text-sm font-medium flex items-center justify-center gap-2">
                  <IconDownload size={16} />
                  <span>Proceed to Checkout</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-600 dark:text-slate-400">
              <p className="text-sm">No invoices to display</p>
            </div>
          )}
        </Card>
      </div>

      {/* Recent Transactions Card */}
      <Card className="p-4 sm:p-6 md:p-8 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 transition-shadow duration-200 hover:shadow-md">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Recent Transactions</h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">Transaction details and status</p>
          </div>
          <button 
            onClick={handleExportToFile}
            className="px-3 sm:px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm font-medium">
            <IconDownload size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <IconSearch className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by customer, transaction ID, or order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 dark:focus:ring-slate-500 focus:border-slate-700 dark:focus:border-slate-500 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-600 text-sm">Loading transactions...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600 text-sm">No transactions found matching your search</p>
          </div>
        ) : (
          <>
            {/* Calculate pagination */}
            {(() => {
              const startIndex = (currentPage - 1) * itemsPerPage;
              const endIndex = startIndex + itemsPerPage;
              const currentTransactions = filteredTransactions.slice(startIndex, endIndex);
              const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

              return (
                <>
            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <th className="text-left px-3 sm:px-4 py-3 font-semibold text-slate-900 dark:text-white">Transaction ID</th>
                    <th className="text-left px-3 sm:px-4 py-3 font-semibold text-slate-900 dark:text-white">Customer Name</th>
                    <th className="text-left px-3 sm:px-4 py-3 font-semibold text-slate-900 dark:text-white">Payment Date</th>
                    <th className="text-right px-3 sm:px-4 py-3 font-semibold text-slate-900 dark:text-white">Amount</th>
                    <th className="text-center px-3 sm:px-4 py-3 font-semibold text-slate-900 dark:text-white">Status</th>
                    <th className="text-left px-3 sm:px-4 py-3 font-semibold text-slate-900 dark:text-white hidden md:table-cell">Payment Method</th>
                    <th className="text-left px-3 sm:px-4 py-3 font-semibold text-slate-900 dark:text-white hidden lg:table-cell">Order ID</th>
                    <th className="text-center px-3 sm:px-4 py-3 font-semibold text-slate-900 dark:text-white">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTransactions.map((transaction) => {
                    const statusColors = {
                      'Completed': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
                      'Pending': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
                      'Failed': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' }
                    };
                    const statusStyle = statusColors[transaction.status] || statusColors['Pending'];

                    return (
                      <tr key={transaction.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-3 sm:px-4 py-3 text-slate-900 dark:text-white font-medium">{transaction.id}</td>
                        <td className="px-3 sm:px-4 py-3 text-slate-700 dark:text-slate-300">{transaction.customer}</td>
                        <td className="px-3 sm:px-4 py-3 text-slate-700 dark:text-slate-300">{transaction.date}</td>
                        <td className="px-3 sm:px-4 py-3 text-right text-slate-900 dark:text-white font-semibold">₹{transaction.amount.toLocaleString('en-IN')}</td>
                        <td className="px-3 sm:px-4 py-3 text-center">
                          <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-slate-700 dark:text-slate-300 hidden md:table-cell text-xs sm:text-sm">{transaction.method}</td>
                        <td className="px-3 sm:px-4 py-3 text-slate-700 dark:text-slate-300 hidden lg:table-cell font-medium">{transaction.orderId}</td>
                        <td className="px-3 sm:px-4 py-3 text-center">
                          <div className="flex gap-2 justify-center">
                            <button 
                              onClick={() => handleViewDetails(transaction)}
                              className="p-2 sm:p-2.5 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-300 dark:text-blue-400 rounded-lg transition-colors font-medium" 
                              title="View">
                              <IconEye size={18} />
                            </button>
                            <button 
                              onClick={() => handleDownloadInvoice(transaction)}
                              className="p-2 sm:p-2.5 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400 rounded-lg transition-colors font-medium" 
                              title="Download">
                              <IconDownload size={18} />
                            </button>
                            <button 
                              onClick={() => handleDeleteTransaction(transaction)}
                              className="p-2 sm:p-2.5 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg transition-colors font-medium" 
                              title="Delete">
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

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4 pt-6 border-t border-slate-200 dark:border-slate-700 text-xs sm:text-sm">
              <p className="text-slate-600 dark:text-slate-400">Showing {startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length} transactions</p>
              <div className="flex gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button 
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 sm:px-5 py-2 border-2 rounded-lg transition-colors font-semibold text-sm ${
                      currentPage === page 
                        ? 'bg-slate-300 text-slate-900 border-slate-300 dark:bg-slate-600 dark:text-white dark:border-slate-600' 
                        : 'border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>
                </>
              );
            })()}
          </>
        )}
      </Card>

      {/* Add Payment Modal */}
      <AddPaymentModal />

      {/* Order Details Modal */}
      {showDetailModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-opacity duration-200 bg-white dark:bg-slate-800">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Order Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg transition-colors"
              >
                <IconClose size={20} />
              </button>
            </div>

            {selectedTransaction.fullData && (
              <div className="p-6 space-y-6 bg-white dark:bg-slate-800">
                {/* Transaction Info */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-3">Transaction Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Transaction ID</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{selectedTransaction.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Order ID</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{selectedTransaction.orderId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Date</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{selectedTransaction.date}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Status</p>
                      <p className="font-semibold text-green-600 dark:text-green-400">{selectedTransaction.status}</p>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-3">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Name</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{selectedTransaction.customer}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Phone</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{selectedTransaction.customerPhone}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-slate-600 dark:text-slate-400">Email</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{selectedTransaction.fullData.customerEmail || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-3">Items</h3>
                  {selectedTransaction.fullData.medicines && selectedTransaction.fullData.medicines.length > 0 ? (
                    <div className="space-y-2">
                      {selectedTransaction.fullData.medicines.map((med, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{med.medicineId?.name || 'Unknown Medicine'}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Stock Balance: {med.medicineId?.quantity || 'N/A'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-slate-600 dark:text-slate-400">Qty: {med.quantity}</p>
                            <p className="font-semibold text-slate-900 dark:text-white">₹{((med.price || 0) * med.quantity).toLocaleString('en-IN')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-600 dark:text-slate-400 text-sm">No items in this order</p>
                  )}
                </div>

                {/* Payment & Total */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-3">Payment Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Payment Method:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{selectedTransaction.method}</span>
                    </div>
                    <div className="border-t border-slate-300 dark:border-slate-700 pt-2 flex justify-between">
                      <span className="font-medium text-slate-900 dark:text-white">Total Amount:</span>
                      <span className="text-lg font-bold text-slate-900 dark:text-white">₹{selectedTransaction.amount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => handlePrintBill(selectedTransaction)}
                    className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <IconPrinter size={16} />
                    Print Bill
                  </button>
                  <button
                    onClick={() => handleDownloadInvoice(selectedTransaction)}
                    className="flex-1 px-4 py-2 border-2 border-slate-600 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <IconDownload size={16} />
                    Download
                  </button>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="flex-1 px-4 py-2 border-2 border-slate-300 text-slate-900 hover:bg-slate-50 rounded-lg transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && transactionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md transition-opacity duration-200 bg-white dark:bg-slate-800">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30">
                  <IconTrash size={24} className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Delete Transaction</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">This action cannot be undone</p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 mb-6 space-y-2 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Order ID:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{transactionToDelete.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Customer:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{transactionToDelete.customer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Amount:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">₹{transactionToDelete.amount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                Are you sure you want to permanently delete this transaction? This will remove the order record from the system.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setTransactionToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteTransaction}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 text-white rounded-lg transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
