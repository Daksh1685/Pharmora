'use client';

import { useState, useEffect } from 'react';
import useAuthStore from '@/store/authStore';
import apiClient from '@/utils/apiClient';
import SearchResults from '@/components/Dashboard/SearchResults';
import { NewCustomersCard } from '@/components/Customers/NewCustomersCard';
import { RetentionRateCard } from '@/components/Customers/RetentionRateCard';
import SalesTable from '@/components/Customers/SalesTable';
import { IconPlus, IconX, IconTrash } from '@tabler/icons-react';
import useUIStore from '@/store/uiStore';
import useMedicineStore from '@/store/medicineStore';

export default function CustomersPage() {
  const { fetchMedicines } = useMedicineStore();
  // Live medicines fetched directly from API on checkout open (never stale)
  const [liveStock, setLiveStock] = useState([]);
  const [isLoadingStock, setIsLoadingStock] = useState(false);

  // Add Customer Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatedOrderId, setGeneratedOrderId] = useState('');
  const [medicineSearch, setMedicineSearch] = useState('');
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Edit Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    customerName: '',
    customerPhone: '',
    medicineId: '',
    quantity: '',
    paymentMethod: 'cash',
    totalAmount: ''
  });

  // Delete Modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState('');

  // Refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const user = useAuthStore((state) => state.user);
  const openConfirm = useUIStore((state) => state.openConfirm);

  // Helper function to show notifications using the new premium modal
  const showNotification = (type, title, message) => {
    openConfirm({
      title,
      message,
      type,
      confirmText: 'OK',
      cancelText: null // Setting this to null will hide the Close button
    });
  };

  // Generate Sequential Order ID
  const generateOrderId = async () => {
    try {
      const response = await apiClient.get('/sales/generate-order-id');
      const orderId = response.data?.data?.orderId;
      
      if (!orderId) {
        console.warn('No orderId in response, using fallback');
        return `ORD-1001`;
      }
      
      console.log('Generated Order ID:', orderId);
      return orderId;
    } catch (error) {
      console.error('Error generating Order ID from API:', error.message);
      console.error('Error response:', error.response?.data);
      // Fallback: Return a default starting value
      return `ORD-1001`;
    }
  };

  // Always fetch LIVE stock directly from API when checkout opens
  useEffect(() => {
    if (showCheckoutModal) {
      // Fetch directly from API - not from cache - for accurate stock
      setIsLoadingStock(true);
      apiClient.get('/medicines?limit=1000')
        .then(res => {
          const meds = res.data?.data?.medicines || [];
          setLiveStock(Array.isArray(meds) ? meds : []);
        })
        .catch(err => {
          console.error('Failed to load live stock:', err);
          setLiveStock([]);
        })
        .finally(() => setIsLoadingStock(false));

      if (!generatedOrderId) {
        generateOrderId().then(id => setGeneratedOrderId(id));
      }
    }
  }, [showCheckoutModal, generatedOrderId]);

  // Also keep the global store in sync on mount
  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  // Auto-calculate total amount when medicine or quantity changes (uses liveStock)
  useEffect(() => {
    if (formData.medicineId && formData.quantity) {
      const selectedMedicine = liveStock.find(m => m._id === formData.medicineId);
      if (selectedMedicine) {
        const total = (parseFloat(selectedMedicine.price || 0) * parseInt(formData.quantity || 0)).toFixed(2);
        setFormData(prev => ({ ...prev, totalAmount: total }));
      }
    }
  }, [formData.medicineId, formData.quantity, liveStock]);

  // Auto-calculate total amount for edit form (uses liveStock)
  useEffect(() => {
    if (editData.medicineId && editData.quantity) {
      const selectedMedicine = liveStock.find(m => m._id === editData.medicineId);
      if (selectedMedicine) {
        const total = (parseFloat(selectedMedicine.price || 0) * parseInt(editData.quantity || 0)).toFixed(2);
        setEditData(prev => ({ ...prev, totalAmount: total }));
      }
    }
  }, [editData.medicineId, editData.quantity, liveStock]);

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      if (!formData.name || !formData.medicineId || !formData.quantity) {
        showNotification('warning', 'Incomplete Form', 'Please fill in all required fields');
        return;
      }

      const saleData = {
        customerName: formData.name,
        customerPhone: formData.phone,
        paymentMethod: formData.paymentMethod || 'cash',
        totalAmount: parseFloat(formData.totalAmount) || 0,
        medicines: [{
          medicineId: formData.medicineId,
          quantity: parseInt(formData.quantity)
        }]
      };

      const response = await apiClient.post('/sales', saleData);
      showNotification('success', 'Success', 'Customer added successfully!');
      setIsModalOpen(false);
      setFormData({ name: '', phone: '', medicineId: '', quantity: '', paymentMethod: 'cash', totalAmount: '' });
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Failed to add customer:', error);
      showNotification('error', 'Error', 'Failed to add customer: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEditOpen = (sale) => {
    setEditingId(sale._id);
    
    // Convert medicines from sale to selected format
    const editMedicines = (sale.medicines || []).map(med => ({
      _id: med.medicineId?._id || '',
      name: med.medicineId?.name || '',
      price: med.medicineId?.price || 0,
      quantity: med.quantity || 0
    }));
    
    setEditData({
      customerName: sale.customerName || '',
      customerPhone: sale.customerPhone || '',
      medicines: editMedicines,
      paymentMethod: sale.paymentMethod || 'cash',
      totalAmount: sale.totalAmount || ''
    });
    setSelectedMedicines(editMedicines);
    setIsEditOpen(true);
  };

  const handleDeleteOpen = (sale) => {
    setDeleteId(sale._id);
    setDeleteName(sale.customerName);
    setIsDeleteOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      if (!editData.customerName || selectedMedicines.length === 0) {
        showNotification('warning', 'Incomplete Form', 'Please fill in customer name and select at least one medicine');
        return;
      }

      const updateData = {
        customerName: editData.customerName,
        customerPhone: editData.customerPhone,
        paymentMethod: editData.paymentMethod || 'cash',
        totalAmount: selectedMedicines.reduce((sum, med) => sum + (med.price * med.quantity), 0).toFixed(2),
        medicines: selectedMedicines.map(med => ({
          medicineId: med._id,
          quantity: parseInt(med.quantity)
        }))
      };

      await apiClient.put(`/sales/${editingId}`, updateData);
      showNotification('success', 'Success', 'Sale updated successfully!');
      setIsEditOpen(false);
      setEditingId(null);
      setSelectedMedicines([]);
      
      // Refresh the table
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Failed to update sale:', error);
      showNotification('error', 'Error', 'Failed to update sale: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleConfirmDelete = () => {
    openConfirm({
      title: 'Delete Customer Record',
      message: `Are you sure you want to delete the sale record for ${deleteName}? This action cannot be undone.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await apiClient.delete(`/sales/${deleteId}`);
          showNotification('success', 'Success', 'Customer record deleted successfully!');
          setIsDeleteOpen(false);
          setRefreshTrigger(prev => prev + 1);
        } catch (error) {
          console.error('Failed to delete customer:', error);
          showNotification('error', 'Error', 'Failed to delete record: ' + (error.response?.data?.message || error.message));
        }
      }
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ name: '', phone: '', medicineId: '', quantity: '', paymentMethod: 'cash', totalAmount: '' });
  };

  const handleCloseEditModal = () => {
    setIsEditOpen(false);
    setEditingId(null);
    setEditData({
      customerName: '',
      customerPhone: '',
      medicineId: '',
      quantity: '',
      paymentMethod: 'cash',
      totalAmount: ''
    });
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteOpen(false);
    setDeleteId(null);
    setDeleteName('');
  };

  const addMedicine = (medicine) => {
    setSelectedMedicines([...selectedMedicines, { ...medicine, quantity: 1 }]);
    setMedicineSearch('');
    setShowMedicineDropdown(false);
  };

  const removeMedicine = (medicineId) => {
    setSelectedMedicines(selectedMedicines.filter(m => m._id !== medicineId));
  };

  const updateMedicineQuantity = (medicineId, quantity) => {
    if (quantity <= 0) {
      removeMedicine(medicineId);
    } else {
      setSelectedMedicines(selectedMedicines.map(m =>
        m._id === medicineId ? { ...m, quantity } : m
      ));
    }
  };

  const getTotalPrice = () => {
    return selectedMedicines.reduce((sum, med) => sum + (med.price * med.quantity), 0).toFixed(2);
  };

  const handleCheckout = async () => {
    if (selectedMedicines.length === 0) {
      showNotification('warning', 'No Items', 'Please add medicines to checkout');
      return;
    }

    if (!formData.name || !formData.phone) {
      showNotification('warning', 'Incomplete Details', 'Please fill in customer details');
      return;
    }

    // Validate medicines have proper data
    for (const med of selectedMedicines) {
      if (!med._id || med.quantity < 1) {
        showNotification('error', 'Invalid Medicine', `Medicine "${med.name}" has invalid quantity`);
        return;
      }
    }

    try {
      // Build the sale data - remove undefined fields
      const saleData = {
        customerName: formData.name,
        customerPhone: formData.phone,
        medicines: selectedMedicines.map(med => ({
          medicineId: med._id,
          quantity: parseInt(med.quantity)
        })),
        paymentMethod: paymentMethod || 'cash'
      };

      // Only add optional fields if they have values
      if (generatedOrderId) {
        saleData.orderId = generatedOrderId;
      }
      if (formData.email) {
        saleData.customerEmail = formData.email;
      }

      // Log the data being sent for debugging
      console.log('Sending sale data:', JSON.stringify(saleData, null, 2));

      const response = await apiClient.post('/sales', saleData);
      showNotification('success', 'Sale Successful', `Sale recorded successfully! Order ID: ${generatedOrderId || 'Generated'}`);
      setShowCheckoutModal(false);
      setSelectedMedicines([]);
      setFormData({ name: '', phone: '', email: '' });
      setGeneratedOrderId('');
      setPaymentMethod('cash');
      setMedicineSearch('');
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      // Extract the actual error message from the response
      const errorMessage = 
        error.response?.data?.message || 
        error.response?.data?.error || 
        error.message || 
        'Checkout failed. Please try again.';
      
      showNotification('error', 'Checkout Error', errorMessage);
    }
  };

  // Use liveStock (fresh API) for checkout dropdown — never stale
  const filteredMedicines = medicineSearch
    ? liveStock.filter(m =>
        m.name.toLowerCase().includes(medicineSearch.toLowerCase()) &&
        !selectedMedicines.find(sm => sm._id === m._id)
      )
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">Customers Overview</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-1">
            Manage pharmora customers
          </p>
        </div>
        <button 
          onClick={() => setShowCheckoutModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors shadow-md hover:shadow-lg">
          <IconPlus size={20} />
          Add Customer
        </button>
      </div>

      {/* Customer Overview Cards */}
      <div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* New Customers Card - takes 1 column (small) */}
          <div className="min-w-0">
            <NewCustomersCard refreshTrigger={refreshTrigger} />
          </div>
          
          {/* Retention Rate Card - takes 2 columns (large) */}
          <div className="lg:col-span-2 min-w-0">
            <RetentionRateCard refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </div>

      {/* Search Results */}
      <SearchResults />

      {/* Sales Table */}
      <SalesTable
        onEditOpen={handleEditOpen}
        onDeleteOpen={handleDeleteOpen}
        refreshDependency={refreshTrigger}
      />

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-slate-700 to-slate-800 dark:from-slate-700 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-white">Checkout</h2>
                <p className="text-sm text-slate-300 mt-1">Order ID: <span className="font-mono font-semibold text-green-400">{generatedOrderId}</span></p>
              </div>
              <button
                onClick={() => {
                  setShowCheckoutModal(false);
                  setSelectedMedicines([]);
                  setFormData({ name: '', phone: '', email: '' });
                  setGeneratedOrderId('');
                  setPaymentMethod('cash');
                  setMedicineSearch('');
                }}
                className="text-slate-200 hover:text-white transition-colors"
              >
                <IconX size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              {/* Customer Details */}
              <div className="space-y-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white">Customer Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Customer name"
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Phone <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="Phone number"
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="Email (optional)"
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
                  />
                </div>
              </div>

              {/* Add Medicines */}
              <div className="space-y-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white">Select Medicines</h3>
                <div className="relative">
                  <input
                    type="text"
                    value={medicineSearch}
                    onChange={(e) => {
                      setMedicineSearch(e.target.value);
                      setShowMedicineDropdown(true);
                    }}
                    onFocus={() => setShowMedicineDropdown(true)}
                    placeholder="Search medicines..."
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
                  />
                  {isLoadingStock && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-slate-500">
                      <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Loading stock...
                    </div>
                  )}
                  
                  {showMedicineDropdown && medicineSearch && !isLoadingStock && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                      {filteredMedicines.length > 0 ? filteredMedicines.map(medicine => {
                        const outOfStock = (medicine.quantity ?? 0) === 0;
                        return (
                          <button
                            key={medicine._id}
                            type="button"
                            onClick={() => !outOfStock && addMedicine(medicine)}
                            disabled={outOfStock}
                            className={`w-full text-left px-4 py-3 transition-colors border-b border-slate-100 dark:border-slate-600 last:border-b-0 ${
                              outOfStock
                                ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer'
                            }`}
                          >
                            <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                              {medicine.name}
                              {outOfStock && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Out of Stock</span>}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">Price: ₹{medicine.price} | Stock: {medicine.quantity ?? 0}</div>
                          </button>
                        );
                      }) : (
                        <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">No medicines found matching "{medicineSearch}"</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Medicines List */}
                {selectedMedicines.length > 0 && (
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {selectedMedicines.map(medicine => (
                      <div key={medicine._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">{medicine.name}</div>
                          <div className="text-sm text-slate-600">₹{medicine.price} x {medicine.quantity} = ₹{(medicine.price * medicine.quantity).toFixed(2)}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min="1"
                            value={medicine.quantity || 1}
                            onChange={(e) => {
                              const qty = parseInt(e.target.value);
                              if (!isNaN(qty) && qty > 0) {
                                updateMedicineQuantity(medicine._id, qty);
                              }
                            }}
                            className="w-16 px-2 py-1 border border-slate-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-slate-400"
                          />
                          <button
                            type="button"
                            onClick={() => removeMedicine(medicine._id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <IconX size={20} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="space-y-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white">Payment Method</h3>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="store_credit">Store Credit</option>
                  <option value="net_banking">Net Banking</option>
                </select>
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 p-5 rounded-lg border border-slate-200 dark:border-slate-600">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Subtotal ({selectedMedicines.length} item{selectedMedicines.length !== 1 ? 's' : ''}):</span>
                  <span className="text-slate-900 dark:text-white font-semibold">₹{getTotalPrice()}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t-2 border-slate-300 dark:border-slate-600">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">Total Amount:</span>
                  <span className="text-2xl font-bold text-green-600">₹{getTotalPrice()}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">Payment Method: <span className="font-semibold text-slate-700 dark:text-slate-300">{paymentMethod === 'store_credit' ? 'Store Credit' : paymentMethod === 'net_banking' ? 'Net Banking' : paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}</span></p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCheckoutModal(false);
                    setSelectedMedicines([]);
                    setFormData({ name: '', phone: '', email: '' });
                    setGeneratedOrderId('');
                    setPaymentMethod('cash');
                    setMedicineSearch('');
                  }}
                  className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={selectedMedicines.length === 0}
                  className="flex-1 px-4 py-2.5 bg-slate-700 dark:bg-slate-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors font-medium disabled:bg-slate-400 dark:disabled:bg-slate-500 disabled:cursor-not-allowed"
                >
                  Complete Purchase
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sale Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Update Customer</h2>
              <button
                onClick={handleCloseEditModal}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 transition-colors"
              >
                <IconX size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[calc(90vh-120px)] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Customer Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editData.customerName}
                  onChange={(e) => setEditData({...editData, customerName: e.target.value})}
                  placeholder="Enter customer name"
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={editData.customerPhone}
                  onChange={(e) => setEditData({...editData, customerPhone: e.target.value})}
                  placeholder="Enter phone number"
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
                />
              </div>

              {/* Edit Medicines */}
              <div className="space-y-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white">Medicines <span className="text-red-500">*</span></h3>
                <div className="relative">
                  <input
                    type="text"
                    value={medicineSearch}
                    onChange={(e) => {
                      setMedicineSearch(e.target.value);
                      setShowMedicineDropdown(true);
                    }}
                    onFocus={() => setShowMedicineDropdown(true)}
                    placeholder="Search medicines to add..."
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
                  />
                  
                  {showMedicineDropdown && filteredMedicines.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                      {filteredMedicines.map(medicine => (
                        <button
                          key={medicine._id}
                          type="button"
                          onClick={() => {
                            addMedicine(medicine);
                            setMedicineSearch('');
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors border-b border-slate-100 dark:border-slate-600 last:border-b-0"
                        >
                          <div className="font-medium text-slate-900 dark:text-white">{medicine.name}</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">Price: ₹{medicine.price} | Stock: {medicine.quantity}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Medicines List */}
                {selectedMedicines.length > 0 && (
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {selectedMedicines.map(medicine => (
                      <div key={medicine._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">{medicine.name}</div>
                          <div className="text-sm text-slate-600">₹{medicine.price} x {medicine.quantity} = ₹{(medicine.price * medicine.quantity).toFixed(2)}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min="1"
                            value={medicine.quantity || 1}
                            onChange={(e) => {
                              const qty = parseInt(e.target.value);
                              if (!isNaN(qty) && qty > 0) {
                                updateMedicineQuantity(medicine._id, qty);
                              }
                            }}
                            className="w-16 px-2 py-1 border border-slate-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-slate-400"
                          />
                          <button
                            type="button"
                            onClick={() => removeMedicine(medicine._id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <IconX size={20} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Payment Method</label>
                <select
                  value={editData.paymentMethod}
                  onChange={(e) => setEditData({...editData, paymentMethod: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="store_credit">Store Credit</option>
                  <option value="net_banking">Net Banking</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Total Amount</label>
                <input
                  type="number"
                  value={selectedMedicines.reduce((sum, med) => sum + (med.price * med.quantity), 0).toFixed(2)}
                  readOnly
                  placeholder="Auto-calculated"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-green-600 dark:text-green-400 focus:outline-none font-semibold"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selectedMedicines.length === 0}
                  className="flex-1 px-4 py-2.5 bg-slate-700 dark:bg-slate-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors font-medium disabled:bg-slate-400 dark:disabled:bg-slate-500 disabled:cursor-not-allowed"
                >
                  Update Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
