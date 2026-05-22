'use client';

import { useState } from 'react';
import Button from '@/components/Common/Button';

export default function MedicineForm({ 
  onSubmit, 
  isLoading, 
  initialData = null,
  categories = [] 
}) {
  const [formData, setFormData] = useState(() => {
    const defaultData = {
      name: '',
      manufacturer: '',
      category: '',
      price: '',
      quantity: '',
      expiryDate: '',
      description: '',
    };

    if (!initialData) return defaultData;

    // Normalize initialData to convert null values to empty strings
    return {
      name: initialData.name || '',
      manufacturer: initialData.manufacturer || '',
      category: initialData.category 
        ? (typeof initialData.category === 'object' ? initialData.category._id : initialData.category)
        : '',
      price: initialData.price ?? '',
      quantity: initialData.quantity ?? '',
      expiryDate: initialData.expiryDate ? 
        (typeof initialData.expiryDate === 'string' 
          ? initialData.expiryDate.split('T')[0] 
          : new Date(initialData.expiryDate).toISOString().split('T')[0]
        ) : '',
      description: initialData.description || '',
    };
  });

  const [errors, setErrors] = useState({});

  // Use provided categories or empty array if none provided

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.manufacturer.trim()) newErrors.manufacturer = 'Manufacturer is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.price || parseFloat(formData.price) < 0)
      newErrors.price = 'Valid price is required';
    if (!formData.quantity || parseInt(formData.quantity) < 0)
      newErrors.quantity = 'Valid quantity is required';
    if (!formData.expiryDate) newErrors.expiryDate = 'Expiry date is required';

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
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div>
        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
          Medicine Name
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 ${
            errors.name
              ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
              : 'border-slate-300 dark:border-slate-600 focus:ring-slate-700 dark:focus:ring-slate-500'
          }`}
          placeholder="e.g., Aspirin"
        />
        {errors.name && (
          <span className="text-xs text-red-600 dark:text-red-400 mt-1.5 block">{errors.name}</span>
        )}
      </div>

      {/* Manufacturer */}
      <div>
        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
          Manufacturer
        </label>
        <input
          type="text"
          name="manufacturer"
          value={formData.manufacturer}
          onChange={handleChange}
          className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 ${
            errors.manufacturer
              ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
              : 'border-slate-300 dark:border-slate-600 focus:ring-slate-700 dark:focus:ring-slate-500'
          }`}
          placeholder="e.g., Pharma Corp"
        />
        {errors.manufacturer && (
          <span className="text-xs text-red-600 dark:text-red-400 mt-1.5 block">{errors.manufacturer}</span>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
          Category
        </label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors bg-white dark:bg-slate-700 text-slate-900 dark:text-white ${
            errors.category
              ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
              : 'border-slate-300 dark:border-slate-600 focus:ring-slate-700 dark:focus:ring-slate-500'
          }`}
        >
          <option value="" className="bg-white dark:bg-slate-700 text-slate-900 dark:text-white">Select a category</option>
          {categories.length > 0 ? (
            categories.map((cat) => {
              // Handle both object format { _id, name } and string format
              const categoryId = typeof cat === 'object' ? cat._id : cat;
              const categoryName = typeof cat === 'object' ? cat.name : cat;
              return (
                <option key={categoryId} value={categoryId} className="bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                  {categoryName}
                </option>
              );
            })
          ) : (
            <option disabled className="bg-white dark:bg-slate-700 text-slate-900 dark:text-white">No categories available</option>
          )}
        </select>
        {errors.category && (
          <span className="text-xs text-red-600 dark:text-red-400 mt-1.5 block">{errors.category}</span>
        )}
      </div>

      {/* Price & Quantity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
            Price (₹)
          </label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            step="0.01"
            min="0"
            className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 ${
              errors.price
                ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
                : 'border-slate-300 dark:border-slate-600 focus:ring-slate-700 dark:focus:ring-slate-500'
            }`}
            placeholder="0.00"
          />
          {errors.price && (
            <span className="text-xs text-red-600 dark:text-red-400 mt-1.5 block">{errors.price}</span>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
            Quantity
          </label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            min="0"
            className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 ${
              errors.quantity
                ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
                : 'border-slate-300 dark:border-slate-600 focus:ring-slate-700 dark:focus:ring-slate-500'
            }`}
            placeholder="0"
          />
          {errors.quantity && (
            <span className="text-xs text-red-600 dark:text-red-400 mt-1.5 block">{errors.quantity}</span>
          )}
        </div>
      </div>

      {/* Expiry Date */}
      <div>
        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
          Expiry Date
        </label>
        <input
          type="date"
          name="expiryDate"
          value={formData.expiryDate}
          onChange={handleChange}
          className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors bg-white dark:bg-slate-700 text-slate-900 dark:text-white ${
            errors.expiryDate
              ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
              : 'border-slate-300 dark:border-slate-600 focus:ring-slate-700 dark:focus:ring-slate-500'
          }`}
        />
        {errors.expiryDate && (
          <span className="text-xs text-red-600 dark:text-red-400 mt-1.5 block">{errors.expiryDate}</span>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
          Description (Optional)
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 dark:focus:ring-slate-500 transition-colors bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
          placeholder="Add any additional notes..."
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="flex-1 font-semibold"
          disabled={isLoading}
        >
          {initialData ? 'Update Medicine' : 'Add Medicine'}
        </Button>
      </div>
    </form>
  );
}
