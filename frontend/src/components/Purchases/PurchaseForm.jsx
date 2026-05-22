'use client';

import { useState } from 'react';
import Button from '@/components/Common/Button';

export default function PurchaseForm({
  onSubmit,
  isLoading,
  medicines = [],
}) {
  const [formData, setFormData] = useState({
    supplierName: '',
    medicineId: '',
    batchNumber: '',
    expiryDate: '',
    quantity: '',
    purchasePrice: '',
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.supplierName.trim()) newErrors.supplierName = 'Supplier name is required';
    if (!formData.medicineId) newErrors.medicineId = 'Medicine is required';
    if (!formData.batchNumber.trim()) newErrors.batchNumber = 'Batch number is required';
    if (!formData.expiryDate) newErrors.expiryDate = 'Expiry date is required';
    if (!formData.quantity || parseInt(formData.quantity) <= 0) newErrors.quantity = 'Valid quantity is required';
    if (!formData.purchasePrice || parseFloat(formData.purchasePrice) <= 0) newErrors.purchasePrice = 'Valid price is required';

    // Validate expiry date is in the future
    if (formData.expiryDate && new Date(formData.expiryDate) <= new Date()) {
      newErrors.expiryDate = 'Expiry date must be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      setFormData({ supplierName: '', medicineId: '', batchNumber: '', expiryDate: '', quantity: '', purchasePrice: '' });
    }
  };

  const totalAmount =
    formData.quantity && formData.purchasePrice
      ? (parseFloat(formData.purchasePrice) * parseInt(formData.quantity)).toFixed(2)
      : 0;

  const inputClass = (field) =>
    `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 ${
      errors[field]
        ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
        : 'border-slate-300 dark:border-slate-600 focus:ring-slate-700 dark:focus:ring-slate-500'
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Supplier Name */}
      <div>
        <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">
          Supplier Name *
        </label>
        <input
          type="text"
          name="supplierName"
          value={formData.supplierName}
          onChange={handleChange}
          className={inputClass('supplierName')}
          placeholder="e.g., Pharma Supplies Inc"
        />
        {errors.supplierName && <span className="text-xs text-red-600 dark:text-red-400 mt-1 block">{errors.supplierName}</span>}
      </div>

      {/* Medicine Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">
          Medicine *
        </label>
        <select
          name="medicineId"
          value={formData.medicineId}
          onChange={handleChange}
          className={inputClass('medicineId')}
        >
          <option value="" className="bg-white dark:bg-slate-700">Select a medicine</option>
          {medicines.map((med) => (
            <option key={med._id} value={med._id} className="bg-white dark:bg-slate-700">
              {med.name} (Stock: {med.quantity ?? 0} units)
            </option>
          ))}
        </select>
        {errors.medicineId && <span className="text-xs text-red-600 dark:text-red-400 mt-1 block">{errors.medicineId}</span>}
      </div>

      {/* Batch Number & Expiry Date */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">
            Batch Number *
          </label>
          <input
            type="text"
            name="batchNumber"
            value={formData.batchNumber}
            onChange={handleChange}
            className={inputClass('batchNumber')}
            placeholder="e.g., BATCH001"
          />
          {errors.batchNumber && <span className="text-xs text-red-600 dark:text-red-400 mt-1 block">{errors.batchNumber}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">
            Expiry Date *
          </label>
          <input
            type="date"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleChange}
            min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
            className={inputClass('expiryDate')}
          />
          {errors.expiryDate && <span className="text-xs text-red-600 dark:text-red-400 mt-1 block">{errors.expiryDate}</span>}
        </div>
      </div>

      {/* Quantity & Price */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">
            Quantity (units) *
          </label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            min="1"
            className={inputClass('quantity')}
            placeholder="0"
          />
          {errors.quantity && <span className="text-xs text-red-600 dark:text-red-400 mt-1 block">{errors.quantity}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">
            Purchase Price (₹) *
          </label>
          <input
            type="number"
            name="purchasePrice"
            value={formData.purchasePrice}
            onChange={handleChange}
            step="0.01"
            min="0"
            className={inputClass('purchasePrice')}
            placeholder="0.00"
          />
          {errors.purchasePrice && <span className="text-xs text-red-600 dark:text-red-400 mt-1 block">{errors.purchasePrice}</span>}
        </div>
      </div>

      {/* Total Amount Preview */}
      {formData.quantity && formData.purchasePrice && (
        <div className="p-3 bg-slate-50 dark:bg-slate-800 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-600 dark:text-slate-300">Total Amount</p>
            <p className="text-2xl font-bold text-slate-700 dark:text-slate-300 dark:text-blue-400">₹{totalAmount}</p>
          </div>
        </div>
      )}

      <Button type="submit" variant="primary" isLoading={isLoading} className="w-full">
        Record Purchase
      </Button>
    </form>
  );
}
