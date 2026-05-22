'use client';

import { useState } from 'react';
import Button from '@/components/Common/Button';

export default function BatchForm({ 
  onSubmit, 
  isLoading, 
  medicines = [],
  initialData = null 
}) {
  const [formData, setFormData] = useState(
    initialData || {
      medicineId: '',
      batchNo: '',
      quantity: '',
      mfgDate: '',
      expiryDate: '',
    }
  );

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.medicineId) newErrors.medicineId = 'Medicine is required';
    if (!formData.batchNo.trim()) newErrors.batchNo = 'Batch number is required';
    if (!formData.quantity || parseInt(formData.quantity) <= 0)
      newErrors.quantity = 'Valid quantity is required';
    if (!formData.mfgDate) newErrors.mfgDate = 'Manufacturing date is required';
    if (!formData.expiryDate) newErrors.expiryDate = 'Expiry date is required';
    
    // Validate date order
    if (formData.mfgDate && formData.expiryDate) {
      if (new Date(formData.mfgDate) >= new Date(formData.expiryDate)) {
        newErrors.expiryDate = 'Expiry date must be after manufacturing date';
      }
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
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Medicine */}
      <div>
        <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">
          Medicine
        </label>
        <select
          name="medicineId"
          value={formData.medicineId}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white ${
            errors.medicineId
              ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
              : 'border-slate-300 dark:border-slate-600 focus:ring-slate-700 dark:focus:ring-slate-500'
          }`}
        >
          <option value="" className="bg-white dark:bg-slate-700 text-slate-900 dark:text-white">Select a medicine</option>
          {medicines.map((med) => (
            <option key={med.id} value={med.id} className="bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
              {med.name}
            </option>
          ))}
        </select>
        {errors.medicineId && (
          <span className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.medicineId}</span>
        )}
      </div>

      {/* Batch No */}
      <div>
        <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">
          Batch Number
        </label>
        <input
          type="text"
          name="batchNo"
          value={formData.batchNo}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 ${
            errors.batchNo
              ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
              : 'border-slate-300 dark:border-slate-600 focus:ring-slate-700 dark:focus:ring-slate-500'
          }`}
          placeholder="e.g., B001234"
        />
        {errors.batchNo && (
          <span className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.batchNo}</span>
        )}
      </div>

      {/* Quantity */}
      <div>
        <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">
          Quantity
        </label>
        <input
          type="number"
          name="quantity"
          value={formData.quantity}
          onChange={handleChange}
          min="1"
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 ${
            errors.quantity
              ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
              : 'border-slate-300 dark:border-slate-600 focus:ring-slate-700 dark:focus:ring-slate-500'
          }`}
          placeholder="0"
        />
        {errors.quantity && (
          <span className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.quantity}</span>
        )}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">
            Mfg Date
          </label>
          <input
            type="date"
            name="mfgDate"
            value={formData.mfgDate}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white ${
              errors.mfgDate
                ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
                : 'border-slate-300 dark:border-slate-600 focus:ring-slate-700 dark:focus:ring-slate-500'
            }`}
          />
          {errors.mfgDate && (
            <span className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.mfgDate}</span>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">
            Expiry Date
          </label>
          <input
            type="date"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white ${
              errors.expiryDate
                ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
                : 'border-slate-300 dark:border-slate-600 focus:ring-slate-700 dark:focus:ring-slate-500'
            }`}
          />
          {errors.expiryDate && (
            <span className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.expiryDate}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="flex-1"
        >
          {initialData ? 'Update Batch' : 'Add Batch'}
        </Button>
      </div>
    </form>
  );
}
