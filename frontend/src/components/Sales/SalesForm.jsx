'use client';

import { useState, useEffect } from 'react';

export default function SalesForm({
  onSubmit,
  isLoading,
  medicines = [],
  initialData = null,
}) {
  const [formData, setFormData] = useState(
    initialData || {
      medicineId: '',
      medicineName: '',
      quantity: '',
      notes: '',
    }
  );

  const [errors, setErrors] = useState({});
  const [selectedMedicineDetail, setSelectedMedicineDetail] = useState(null);
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);
  const [filteredMedicines, setFilteredMedicines] = useState([]);

  // Log whenever medicines prop changes
  useEffect(() => {
    console.log('💊 [SALESFORM] Medicines prop received:', {
      count: medicines.length,
      samples: medicines.slice(0, 3).map(m => ({
        _id: m._id,
        name: m.name,
        quantity: m.quantity,
        quantityType: typeof m.quantity,
        quantityInt: parseInt(m.quantity) || 0
      }))
    });
  }, [medicines]);

  // Filter medicines when user types
  const handleMedicineSearch = (searchText) => {
    setFormData((prev) => ({
      ...prev,
      medicineName: searchText,
      medicineId: '', // Clear ID when user is typing
    }));
    setSelectedMedicineDetail(null);

    if (searchText.trim()) {
      // First: Try exact/contains match (show ALL medicines, not just in-stock)
      const exactMatches = medicines.filter((med) => {
        const matchesSearch = med.name.toLowerCase().includes(searchText.toLowerCase());
        return matchesSearch; // Don't filter by stock here - show all matching medicines
      });

      // If exact matches found, use them
      let filteredMedicines = exactMatches;

      // If no exact matches, show partial matches (medicines containing any word from search)
      if (filteredMedicines.length === 0) {
        filteredMedicines = medicines.filter((med) => {
          const lowerName = med.name.toLowerCase();
          const lowerSearch = searchText.toLowerCase();
          
          // Check if any word in medicine name contains search term
          const words = lowerName.split(/\s+/);
          const hasPartialMatch = words.some(word => word.includes(lowerSearch)) || lowerName.includes(lowerSearch);
          
          return hasPartialMatch; // Show all matches regardless of stock
        });
      }

      // Debug: Log what medicines are available
      console.log('🔍 Medicine Search Debug:', {
        searchText: searchText,
        totalMedicines: medicines.length,
        exactMatches: exactMatches.length,
        filteredResults: filteredMedicines.map(m => ({ 
          name: m.name, 
          quantity: parseInt(m.quantity) || 0,
          inStock: (parseInt(m.quantity) || 0) > 0
        }))
      });

      setFilteredMedicines(filteredMedicines);
      setShowMedicineDropdown(true);
    } else {
      setFilteredMedicines([]);
      setShowMedicineDropdown(false);

      // Show all medicines when search is cleared
      console.log('📋 All medicines available:', medicines.map(m => ({
        name: m.name,
        quantity: parseInt(m.quantity) || 0,
        inStock: (parseInt(m.quantity) || 0) > 0
      })));
    }

    if (errors.medicineId) {
      setErrors((prev) => ({ ...prev, medicineId: '' }));
    }
  };

  // When user selects a medicine from dropdown
  const selectMedicine = (medicine) => {
    console.log('🔷 Medicine selected:', {
      _id: medicine._id,
      name: medicine.name,
      quantity: medicine.quantity,
      quantityType: typeof medicine.quantity,
      quantityInt: parseInt(medicine.quantity),
      hasStock: medicine.quantity && parseInt(medicine.quantity) > 0,
    });
    
    setFormData((prev) => ({
      ...prev,
      medicineId: medicine._id,
      medicineName: medicine.name,
    }));
    setSelectedMedicineDetail(medicine);
    setShowMedicineDropdown(false);
    setFilteredMedicines([]);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.medicineId) {
      newErrors.medicineId = 'Please select a medicine from the list';
    }

    // Check if selected medicine has stock
    if (selectedMedicineDetail) {
      const medicineStock = parseInt(selectedMedicineDetail.quantity) || 0;
      if (medicineStock <= 0) {
        newErrors.medicineId = `❌ "${selectedMedicineDetail.name}" is out of stock`;
      }
    }

    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      newErrors.quantity = 'Valid quantity is required';
    }

    if (selectedMedicineDetail && parseInt(formData.quantity) > selectedMedicineDetail.quantity) {
      newErrors.quantity = `Only ${selectedMedicineDetail.quantity} units available`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'medicineName') {
      handleMedicineSearch(value);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: '' }));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Debug logging: Show selected medicine details before validation
    console.log('📋 Form Submit - Selected Medicine Details:', {
      medicineId: selectedMedicineDetail?._id,
      medicineName: selectedMedicineDetail?.name,
      stockInSelectedDetail: selectedMedicineDetail?.quantity,
      stockType: typeof selectedMedicineDetail?.quantity,
      stockInt: parseInt(selectedMedicineDetail?.quantity || 0),
      requestedQuantity: formData.quantity,
    });
    
    if (validateForm()) {
      // Log data being submitted for debugging
      console.log('📤 Submitting sale form with:', {
        medicineId: formData.medicineId,
        medicineName: formData.medicineName,
        quantity: parseInt(formData.quantity),
        selectedMedicineStock: selectedMedicineDetail?.quantity,
        price: selectedMedicineDetail?.price,
      });
      
      onSubmit(formData);
      setFormData({ medicineId: '', medicineName: '', quantity: '', notes: '' });
      setSelectedMedicineDetail(null);
    } else {
      console.warn('❌ Form validation failed:', errors);
    }
  };

  const totalAmount =
    selectedMedicineDetail && formData.quantity
      ? (selectedMedicineDetail.price * parseInt(formData.quantity)).toFixed(2)
      : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Medicine Search Input */}
      <div className="relative">
        <label className="block text-sm sm:text-base font-semibold text-slate-900 dark:text-white mb-2">
          Medicine <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="medicineName"
          value={formData.medicineName}
          onChange={handleChange}
          onFocus={() => formData.medicineName && setShowMedicineDropdown(true)}
          placeholder="Type medicine name..."
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-base bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 relative z-50 ${
            errors.medicineId
              ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
              : 'border-slate-300 dark:border-slate-600 focus:ring-slate-700 dark:focus:ring-slate-500'
          }`}
        />

        {/* Dropdown with filtered medicines */}
        {showMedicineDropdown && filteredMedicines.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto">
            {filteredMedicines.map((med) => {
              const qty = parseInt(med.quantity) || 0;
              
              return (
                <button
                  key={med._id || med.id}
                  type="button"
                  onClick={() => selectMedicine(med)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border-b border-slate-200 dark:border-slate-700 last:border-b-0 transition-colors"
                >
                  <p className="font-semibold text-slate-900 dark:text-white">{med.name}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    ₹{med.price} per unit • {qty} units available
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {showMedicineDropdown && formData.medicineName && filteredMedicines.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg z-50 p-3 max-h-96 overflow-y-auto">
            <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold mb-3 px-2">Search: "{formData.medicineName}" - No exact match</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 px-2">Available medicines:</p>
            <div className="space-y-1">
              {medicines
                .slice(0, 15)
                .map(med => {
                  const qty = parseInt(med.quantity) || 0;
                  
                  return (
                    <button
                      key={med._id || med.id}
                      type="button"
                      onClick={() => selectMedicine(med)}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 rounded transition-colors text-sm border border-slate-100 dark:border-slate-700"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-900 dark:text-white">{med.name}</span>
                        <span className="text-xs text-slate-600 dark:text-slate-400">{qty} units</span>
                      </div>
                    </button>
                  );
                })}
            </div>
            {medicines.length > 15 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2 px-2">...and {medicines.length - 15} more medicines</p>
            )}
          </div>
        )}

        {showMedicineDropdown && !formData.medicineName && medicines.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg z-50 p-3 max-h-96 overflow-y-auto">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 px-2">All available medicines:</p>
            <div className="space-y-1">
              {medicines
                .slice(0, 15)
                .map(med => {
                  const qty = parseInt(med.quantity) || 0;
                  
                  return (
                    <button
                      key={med._id || med.id}
                      type="button"
                      onClick={() => selectMedicine(med)}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 rounded transition-colors text-sm border border-slate-100 dark:border-slate-700"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-900 dark:text-white">{med.name}</span>
                        <span className="text-xs text-slate-600 dark:text-slate-400">{qty} units</span>
                      </div>
                    </button>
                  );
                })}
            </div>
            {medicines.length > 15 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2 px-2">...and {medicines.length - 15} more medicines</p>
            )}
          </div>
        )}

        {errors.medicineId && (
          <span className="text-sm text-red-600 dark:text-red-400 mt-2 block">{errors.medicineId}</span>
        )}
      </div>
      {selectedMedicineDetail && (
        <>
          <div className="p-5 bg-gradient-to-br from-blue-50 dark:from-blue-900/30 to-blue-100 dark:to-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mb-2 font-semibold">Price per Unit</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  ₹{selectedMedicineDetail.price}
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mb-2 font-semibold">Available Stock</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {selectedMedicineDetail.quantity} units
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mb-2 font-semibold">Total Amount</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">₹{totalAmount}</p>
              </div>
            </div>
          </div>
          
          {/* Stock warning if quantity exceeds available */}
          {formData.quantity && parseInt(formData.quantity) > selectedMedicineDetail.quantity && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400 font-semibold">⚠️ Warning: Requested quantity ({formData.quantity}) exceeds available stock ({selectedMedicineDetail.quantity})</p>
            </div>
          )}
        </>
      )}

      {/* Quantity */}
      <div>
        <label className="block text-sm sm:text-base font-semibold text-slate-900 dark:text-white mb-2">
          Quantity (units) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          name="quantity"
          value={formData.quantity}
          onChange={handleChange}
          min="1"
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-base font-medium bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 ${
            errors.quantity
              ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
              : 'border-slate-300 dark:border-slate-600 focus:ring-slate-700 dark:focus:ring-slate-500'
          }`}
          placeholder="Enter quantity"
        />
        {errors.quantity && (
          <span className="text-sm text-red-600 dark:text-red-400 mt-2 block">{errors.quantity}</span>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm sm:text-base font-semibold text-slate-900 dark:text-white mb-2">
          Notes (Optional)
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Add any additional notes..."
          rows="3"
          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 dark:focus:ring-slate-500 text-base resize-vertical bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-5 py-3.5 bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 text-white font-bold rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 text-base shadow-md hover:shadow-lg"
      >
        {isLoading ? 'Recording Sale...' : 'Record Sale'}
      </button>
    </form>
  );
}
