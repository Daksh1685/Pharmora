'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/Common';
import PurchaseForm from '@/components/Purchases/PurchaseForm';
import PurchaseTable from '@/components/Purchases/PurchaseTable';
import apiClient from '@/utils/apiClient';
import useUIStore from '@/store/uiStore';
import useMedicineStore from '@/store/medicineStore';

export default function PurchasesPage() {
  const [medicines, setMedicines] = useState([]);
  const [medicinesMap, setMedicinesMap] = useState({});
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { openConfirm, addNotification } = useUIStore();
  const { fetchMedicines: refreshGlobalMedicines } = useMedicineStore();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch medicines and purchases from API
      const [medicinesRes, purchasesRes] = await Promise.all([
        apiClient.get('/medicines'),
        apiClient.get('/purchases')
      ]);

      // Medicines API: { success, data: { medicines: [...], pagination: {...} } }
      const medicinesData = Array.isArray(medicinesRes.data?.data?.medicines) 
        ? medicinesRes.data.data.medicines 
        : Array.isArray(medicinesRes.data?.data) 
          ? medicinesRes.data.data 
          : [];
      
      // Purchases API: { success, data: { purchases: [...], pagination: {...} } }
      const purchasesData = Array.isArray(purchasesRes.data?.data?.purchases)
        ? purchasesRes.data.data.purchases
        : Array.isArray(purchasesRes.data?.data)
          ? purchasesRes.data.data
          : [];

      // Convert medicines array to object
      const medicinesMapData = Array.isArray(medicinesData) ? medicinesData.reduce((acc, med) => {
        acc[med._id] = med;
        return acc;
      }, {}) : {};

      setMedicines(medicinesData);
      setMedicinesMap(medicinesMapData);
      setPurchases(Array.isArray(purchasesData) ? purchasesData : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setMedicines([]);
      setPurchases([]);
      setMedicinesMap({});
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPurchase = async (formData) => {
    try {
      setIsSubmitting(true);

      // Build the correct payload matching the backend API
      const payload = {
        supplierName: formData.supplierName,
        medicines: [
          {
            medicineId: formData.medicineId,
            batchNumber: formData.batchNumber,
            expiryDate: formData.expiryDate,
            quantity: parseInt(formData.quantity),
            purchasePrice: parseFloat(formData.purchasePrice),
          }
        ],
        paymentMethod: 'bank_transfer',
        paymentStatus: 'pending',
      };

      const response = await apiClient.post('/purchases', payload);
      const newPurchase = response.data?.data?.purchase || response.data?.data;

      // Refresh data from server to get accurate stock & purchase list
      await fetchData();

      // Also refresh global medicine store so Customers & other pages see updated stock
      await refreshGlobalMedicines();
      addNotification('Purchase recorded successfully! Stock updated.', 'success');
    } catch (error) {
      console.error('Failed to create purchase:', error);
      const msg = error.response?.data?.message || 'Failed to complete purchase';
      addNotification(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePurchase = async (purchaseId) => {
    openConfirm({
      title: 'Delete Purchase',
      message: 'Are you sure you want to delete this purchase? This will also reverse the stock addition.',
      type: 'danger',
      onConfirm: async () => {
        try {
          // Delete purchase from API
          await apiClient.delete(`/purchases/${purchaseId}`);

          const purchaseToDelete = purchases.find((p) => p._id === purchaseId || p.id === purchaseId);

          if (purchaseToDelete) {
            // Reduce stock (reverse the purchase)
            setMedicines((prev) =>
              prev.map((med) =>
                med._id === purchaseToDelete.medicineId || med.id === purchaseToDelete.medicineId
                  ? {
                      ...med,
                      quantity: Math.max(0, med.quantity - purchaseToDelete.quantity),
                    }
                  : med
              )
            );
          }

          setPurchases((prev) => prev.filter((purchase) => purchase._id !== purchaseId && purchase.id !== purchaseId));
          addNotification('Purchase record deleted', 'success');
        } catch (error) {
          console.error('Failed to delete purchase:', error);
          addNotification('Failed to delete purchase', 'error');
        }
      }
    });
  };

  const totalPurchases = purchases.reduce((sum, purchase) => sum + (purchase.price || 0) * (purchase.quantity || 0), 0);
  const totalQuantity = purchases.reduce((sum, purchase) => sum + (purchase.quantity || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Purchases</h1>
        <p className="text-slate-600 mt-1">
          Record and manage medicine purchases
        </p>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">✓ Purchase recorded successfully</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow border border-blue-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Records</p>
              <p className="text-3xl font-bold text-slate-700 dark:text-slate-300 mt-3">{purchases.length}</p>
            </div>
            <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
              <svg className="w-6 h-6 text-slate-700 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </Card>
        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow border border-emerald-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Quantity</p>
              <p className="text-3xl font-bold text-emerald-600 mt-3">{totalQuantity}</p>
              <p className="text-xs text-slate-500 mt-1">units</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-lg">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m0 10v10l8 4m0-10l8-4" />
              </svg>
            </div>
          </div>
        </Card>
        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow border border-amber-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Spent</p>
              <p className="text-3xl font-bold text-amber-600 mt-3">₹{totalPurchases.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Form Card */}
        <Card className="lg:col-span-1 p-8 shadow-lg h-fit sticky top-6 border border-slate-200">
          <div className="mb-8 pb-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">New Purchase</h2>
            <p className="text-sm text-slate-600 mt-2">Record a medicine purchase from supplier</p>
          </div>
          <PurchaseForm
            onSubmit={handleSubmitPurchase}
            isLoading={isSubmitting}
            medicines={medicines}
          />
        </Card>

        {/* Purchase Table Card */}
        <div className="lg:col-span-3">
          <Card className="overflow-hidden shadow-lg border border-slate-200">
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
              <h2 className="text-lg font-bold text-slate-900">Purchase History</h2>
              <p className="text-sm text-slate-600 mt-1">View all recorded purchases</p>
            </div>
            <PurchaseTable
              purchases={purchases}
              medicines={medicinesMap}
              loading={loading}
              onDelete={handleDeletePurchase}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
