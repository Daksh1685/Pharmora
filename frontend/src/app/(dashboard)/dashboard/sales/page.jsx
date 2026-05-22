'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/Common';
import SalesForm from '@/components/Sales/SalesForm';
import SalesTable from '@/components/Sales/SalesTable';
import { StatsCard_NeuomorphicGraph } from '@/components/Sales/StatsCardOptions';
import SalesHistory from '@/components/Sales/SalesHistory';
import RevenueByCategory from '@/components/Sales/RevenueByCategory';
import WeeklySalesChart from '@/components/Sales/WeeklySalesChart';
import Modal from '@/components/Medicines/Modal';
import apiClient from '@/utils/apiClient';
import useUIStore from '@/store/uiStore';

// Icon components
function CurrencyIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function BoxIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m0 10v10l8 4m0-10l8-4" />
    </svg>
  );
}

function TrendingIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

export default function SalesPage() {
  const [medicines, setMedicines] = useState([]);
  const [medicinesMap, setMedicinesMap] = useState({});
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState('weekly'); // 'days', 'weekly', 'monthly', 'yearly'
  const { openConfirm, addNotification } = useUIStore();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch medicines and sales from API - ONLY REAL DATA
      const [medicinesRes, salesRes] = await Promise.all([
        apiClient.get('/medicines'),
        apiClient.get('/sales')
      ]);

      console.log('Raw medicines response:', medicinesRes);
      console.log('Raw sales response:', salesRes);

      // Extract medicines data from nested structure: response.data.data.medicines
      let medicinesData = [];
      if (medicinesRes?.data?.data?.medicines && Array.isArray(medicinesRes.data.data.medicines)) {
        medicinesData = medicinesRes.data.data.medicines;
        console.log('✅ Medicines loaded from response.data.data.medicines');
      } else if (medicinesRes?.data?.data && Array.isArray(medicinesRes.data.data)) {
        medicinesData = medicinesRes.data.data;
        console.log('✅ Medicines loaded from response.data.data');
      } else if (medicinesRes?.data && Array.isArray(medicinesRes.data)) {
        medicinesData = medicinesRes.data;
        console.log('✅ Medicines loaded from response.data');
      }

      // Extract sales data - handle nested structure
      let salesData = [];
      if (salesRes?.data?.data?.sales && Array.isArray(salesRes.data.data.sales)) {
        salesData = salesRes.data.data.sales;
      } else if (salesRes?.data?.data && Array.isArray(salesRes.data.data)) {
        salesData = salesRes.data.data;
      } else if (salesRes?.data && Array.isArray(salesRes.data)) {
        salesData = salesRes.data;
      }

      console.log('✅ Sales loaded:', salesData.length, 'sales');
      
      // Log first few sales with notes field
      const salesWithNotes = salesData.slice(0, 3).map(s => ({
        _id: s._id,
        totalAmount: s.totalAmount,
        notes: s.notes,
        hasNotes: !!s.notes,
        medicinesCount: s.medicines?.length || 0
      }));
      console.log('📝 First 3 sales (with notes):', salesWithNotes);
      
      // Log medicines with stock vs without stock
      const medicinesWithStock = medicinesData.filter(m => parseInt(m.quantity) > 0);
      const medicinesOutOfStock = medicinesData.filter(m => !m.quantity || parseInt(m.quantity) === 0);
      
      console.log(`📦 Medicines in stock: ${medicinesWithStock.length}, Out of stock: ${medicinesOutOfStock.length}`);
      
      // Detailed list of all medicines with their quantities
      const medicinesSample = medicinesData.map(m => ({
        _id: m._id,
        name: m.name,
        quantity: m.quantity,
        quantityType: typeof m.quantity,
        quantityInt: parseInt(m.quantity) || 0,
        hasStock: parseInt(m.quantity) > 0
      }));
      console.log('📊 Full medicines list with quantities:', medicinesSample);

      // Convert medicines array to object
      const medicinesMapData = Array.isArray(medicinesData) ? medicinesData.reduce((acc, med) => {
        acc[med._id] = med;
        return acc;
      }, {}) : {};

      console.log('🔄 [STATE UPDATE] About to call setMedicines with:', {
        count: medicinesData.length,
        firstThree: medicinesData.slice(0, 3).map(m => ({
          _id: m._id,
          name: m.name,
          quantity: m.quantity,
          quantityType: typeof m.quantity
        }))
      });

      setMedicines(medicinesData);
      
      console.log('🔄 [STATE UPDATE] setMedicines called');
      
      setMedicinesMap(medicinesMapData);
      setSales(salesData); // Use ONLY real sales data from MongoDB
    } catch (error) {
      console.error('Failed to fetch data:', error);
      console.error('Error details:', error.response?.data || error.message);
      setMedicines([]);
      setSales([]);
      setMedicinesMap({});
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSale = async (formData) => {
    try {
      setIsSubmitting(true);

      const selectedMedicine = medicines.find(
        (m) => m._id === formData.medicineId || m.id === formData.medicineId
      );

      if (!selectedMedicine) {
        openConfirm({ title: 'Medicine Error', message: 'Medicine not found in inventory.', type: 'danger', confirmText: 'OK', cancelText: 'Close' });
        return;
      }

      // Strict validation: medicine must have stock AND quantity must be > 0
      const medicineStock = parseInt(selectedMedicine.quantity) || 0;
      const requestedQty = parseInt(formData.quantity) || 0;

      console.log('🔍 Medicine Found in medicines array:', {
        medicineId: selectedMedicine._id,
        name: selectedMedicine.name,
        quantityInArray: selectedMedicine.quantity,
        quantityType: typeof selectedMedicine.quantity,
        quantityParsedInt: medicineStock,
        requestedQty: requestedQty,
        allMedicinesCount: medicines.length,
      });

      if (medicineStock <= 0) {
        openConfirm({ title: 'Out of Stock', message: `"${selectedMedicine.name}" is currently out of stock.`, type: 'warning', confirmText: 'OK', cancelText: 'Close' });
        return;
      }

      if (requestedQty <= 0) {
        openConfirm({ title: 'Invalid Quantity', message: 'Please enter a quantity greater than zero.', type: 'warning', confirmText: 'OK', cancelText: 'Close' });
        return;
      }

      if (requestedQty > medicineStock) {
        openConfirm({ title: 'Insufficient Stock', message: `Only ${medicineStock} units of "${selectedMedicine.name}" are available.`, type: 'warning', confirmText: 'OK', cancelText: 'Close' });
        return;
      }

      // Log detailed information before API call
      console.log('🔍 Sale Submission Details:', {
        medicineId: formData.medicineId,
        medicineIdType: typeof formData.medicineId,
        medicineIdLength: String(formData.medicineId).length,
        medicineName: selectedMedicine.name,
        medicineStock: medicineStock,
        requestedQty: requestedQty,
        selectedMedicineDetail: {
          _id: selectedMedicine._id,
          name: selectedMedicine.name,
          quantity: selectedMedicine.quantity,
          price: selectedMedicine.price
        }
      });

      // Create sale via API with correct payload structure (medicines array)
      const payload = {
        medicines: [{
          medicineId: String(formData.medicineId).trim(),
          quantity: parseInt(formData.quantity)
        }],
        paymentMethod: 'cash',
        notes: formData.notes || '',
      };

      console.log('📤 API Payload being sent:', JSON.stringify(payload, null, 2));
      console.log('🔑 Auth token present:', !!localStorage.getItem('authToken'));

      const response = await apiClient.post('/sales', payload);

      console.log('✅ API Response received:', response.status, response.data);

      // Extract sale data from response (backend returns nested structure)
      let newSale = response.data?.data?.sale || response.data?.data || response.data || {};
      
      // If we got a successful response, structure it properly for display
      if (response.data?.success && newSale._id) {
        // Sale was created successfully
        console.log('✅ Sale created successfully with ID:', newSale._id);
      } else {
        // Fallback: construct sale object from form data if needed
        newSale = {
          _id: newSale._id || Math.random().toString(),
          medicines: newSale.medicines || [{
            medicineId: formData.medicineId,
            quantity: parseInt(formData.quantity)
          }],
          totalAmount: newSale.totalAmount,
          notes: formData.notes || '',
          createdAt: newSale.createdAt || new Date().toISOString(),
          status: newSale.status || 'completed'
        };
      }

      // Update medicines quantity
      setMedicines((prev) =>
        prev.map((med) =>
          med._id === formData.medicineId || med.id === formData.medicineId
            ? { ...med, quantity: Math.max(0, med.quantity - parseInt(formData.quantity)) }
            : med
        )
      );

      // Add new sale to table - transform backend sale structure for display
      const displaySale = {
        _id: newSale._id,
        medicineId: formData.medicineId,
        medicineName: selectedMedicine.name,
        quantity: parseInt(formData.quantity),
        unitPrice: selectedMedicine.price,
        totalAmount: newSale.totalAmount || (selectedMedicine.price * parseInt(formData.quantity)),
        notes: formData.notes || '',
        createdAt: newSale.createdAt || new Date().toISOString(),
        status: newSale.status || 'completed'
      };
      
      setSales((prev) => [displaySale, ...prev]);

      // Refresh medicines data from backend to get latest stock
      try {
        const medicinesRes = await apiClient.get('/medicines');
        let updatedMedicines = [];
        if (medicinesRes?.data?.data?.medicines && Array.isArray(medicinesRes.data.data.medicines)) {
          updatedMedicines = medicinesRes.data.data.medicines;
        } else if (medicinesRes?.data?.data && Array.isArray(medicinesRes.data.data)) {
          updatedMedicines = medicinesRes.data.data;
        } else if (medicinesRes?.data && Array.isArray(medicinesRes.data)) {
          updatedMedicines = medicinesRes.data;
        }
        
        if (updatedMedicines.length > 0) {
          setMedicines(updatedMedicines);
          console.log('🔄 Medicines refreshed after sale:', updatedMedicines.length, 'medicines loaded');
        }
      } catch (refreshError) {
        console.warn('Could not refresh medicines list:', refreshError);
      }

      // Show success message
      setShowSuccess(true);
      setIsFormModalOpen(false);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('❌ Failed to create sale:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error message:', error.message);
      console.error('Error status:', error.response?.status);
      console.error('Full error object:', error);
      
      // Extract meaningful error message from backend
      const errorMessage = 
        error.response?.data?.message || 
        error.response?.data?.error || 
        error.response?.data?.errors || 
        error.message || 
        'Failed to complete sale. Please check console for details.';
      
      console.log('📍 Showing alert with message:', errorMessage);
      openConfirm({ title: 'Sale Failed', message: typeof errorMessage === 'string' ? errorMessage : 'An error occurred while processing the sale.', type: 'danger', confirmText: 'OK', cancelText: 'Close' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSale = (saleId) => {
    openConfirm({
      title: 'Delete Sale',
      message: 'Are you sure you want to delete this sale record? Stock will be restored automatically.',
      type: 'danger',
      onConfirm: async () => {
        try {
          // Delete sale from API
          await apiClient.delete(`/sales/${saleId}`);

          const saleToDelete = sales.find((s) => s._id === saleId || s.id === saleId);

          if (saleToDelete) {
            // Restore stock
            setMedicines((prev) =>
              prev.map((med) =>
                med._id === saleToDelete.medicineId || med.id === saleToDelete.medicineId
                  ? {
                      ...med,
                      quantity: med.quantity + saleToDelete.quantity,
                    }
                  : med
              )
            );
          }

          setSales((prev) => prev.filter((sale) => sale._id !== saleId && sale.id !== saleId));
          openConfirm({ title: 'Deleted', message: 'Sale record deleted and stock restored.', type: 'info', confirmText: 'OK', cancelText: 'Close' });
        } catch (error) {
          console.error('Failed to delete sale:', error);
          openConfirm({ title: 'Error', message: 'Failed to delete sale record.', type: 'danger', confirmText: 'OK', cancelText: 'Close' });
        }
      }
    });
  };

  const handleEditSale = async (saleId) => {
    const saleToEdit = sales.find((s) => s._id === saleId || s.id === saleId);
    if (!saleToEdit) {
      addNotification('Sale not found', 'error');
      return;
    }

    // Get the quantity to edit
    const currentQuantity = saleToEdit.medicines?.[0]?.quantity || saleToEdit.quantity || 0;
    const currentTotal = saleToEdit.totalAmount || 0;

    const newQuantity = prompt(
      `Edit quantity for sale ${saleId}\n\nCurrent quantity: ${currentQuantity}`,
      currentQuantity
    );

    if (newQuantity === null) {
      return; // User cancelled
    }

    const newQuantityNum = parseInt(newQuantity);
    if (isNaN(newQuantityNum) || newQuantityNum < 1) {
      addNotification('Please enter a valid quantity', 'warning');
      return;
    }

    try {
      console.log(`📝 Editing sale: ${saleId}, new quantity: ${newQuantityNum}`);
      
      const response = await apiClient.put(`/sales/${saleId}`, {
        quantity: newQuantityNum
      });

      console.log('✅ Sale updated successfully:', response.data);
      addNotification('Sale updated successfully', 'success');
      
      // Refresh the sales data
      fetchData();
    } catch (error) {
      console.error('❌ Error editing sale:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to update sale';
      addNotification(`Error: ${errorMsg}`, 'error');
    }
  };

  const totalSales = sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
  const totalQuantity = sales.reduce((sum, sale) => {
    // Get total quantity from medicines array in the sale
    if (sale.medicines && Array.isArray(sale.medicines)) {
      return sum + sale.medicines.reduce((qty, medicine) => qty + (medicine.quantity || 0), 0);
    }
    return sum;
  }, 0);

  // Generate sample sales data for demonstration
  const generateSampleSalesData = (medicinesData, medicinesMap) => {
    // DEPRECATED - Only use real MongoDB data
    console.warn('generateSampleSalesData called - using only real MongoDB data instead');
    return { sampleSales: [], enrichedMedicinesMap: medicinesMap };
  };

  // Calculate revenue by category
  const calculateRevenueByCategory = () => {
    const categoryRevenue = {};
    
    if (!sales || sales.length === 0) {
      console.log('No sales data available');
      return [];
    }

    console.log('Processing sales for category revenue:', sales.length, 'records');

    sales.forEach((sale, saleIdx) => {
      const medicines = sale.medicines || [];
      
      if (medicines.length === 0) {
        console.warn(`Sale ${saleIdx} has no medicines`);
        return;
      }

      medicines.forEach((item, itemIdx) => {
        try {
          const medicineData = item.medicineId;

          if (!medicineData) {
            console.warn(`Sale ${saleIdx}, Medicine ${itemIdx}: No medicineId data`);
            return;
          }

          let categoryName = 'Uncategorized';
          
          // Extract category name from populated medicineId object
          if (medicineData.category) {
            if (typeof medicineData.category === 'object' && medicineData.category.name) {
              // Category is properly populated as an object
              categoryName = medicineData.category.name;
            } else if (typeof medicineData.category === 'string') {
              // Fallback: category is just an ID string
              categoryName = medicineData.category;
            }
          }

          // Calculate revenue
          const revenue = item.subtotal || (item.price && item.quantity ? item.price * item.quantity : 0);
          
          if (revenue <= 0) {
            console.warn(`Sale ${saleIdx}, Medicine ${itemIdx}: Zero or negative revenue`, item);
            return;
          }

          if (!categoryRevenue[categoryName]) {
            categoryRevenue[categoryName] = {
              revenue: 0,
              count: 0
            };
          }

          categoryRevenue[categoryName].revenue += revenue;
          categoryRevenue[categoryName].count += 1;

        } catch (err) {
          console.error(`Error processing sale ${saleIdx}, medicine ${itemIdx}:`, err);
        }
      });
    });

    console.log('=== Category Analysis ===');
    console.log('Aggregated category revenue:', categoryRevenue);

    // Convert to array and sort by revenue
    const categoryArray = Object.entries(categoryRevenue)
      .map(([name, data]) => ({
        label: name,
        value: Math.round(data.revenue),
        count: data.count
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);

    console.log('Final category array:', categoryArray);

    return categoryArray;
  };

  const revenueByCategoryData = calculateRevenueByCategory();
  const totalRevenueByCategory = revenueByCategoryData.reduce((sum, cat) => sum + (cat.value || 0), 0);

  // Aggregate sales data based on time filter
  const getFilteredChartData = () => {
    if (timeFilter === 'days') {
      // Last 7 days
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dayOfWeek = today.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(today);
      monday.setDate(monday.getDate() - daysToMonday);

      const dayTotals = {};
      for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(date.getDate() + i);
        const dateKey = date.toLocaleDateString('en-CA');
        dayTotals[dateKey] = { amount: 0, day: dayNames[i] };
      }

      sales.forEach((sale) => {
        try {
          const dateStr = sale.createdAt || sale.date || sale.updatedAt;
          if (!dateStr) return;
          const saleDate = new Date(dateStr);
          if (isNaN(saleDate.getTime())) return;
          saleDate.setHours(0, 0, 0, 0);
          const dateKey = saleDate.toLocaleDateString('en-CA');

          let amount = 0;
          if (sale.totalAmount) amount = sale.totalAmount;
          else if (sale.subtotal) amount = sale.subtotal;
          else if (sale.medicines && Array.isArray(sale.medicines)) {
            amount = sale.medicines.reduce((sum, item) => sum + (item.subtotal || item.price * item.quantity || 0), 0);
          }

          if (dateKey in dayTotals) {
            dayTotals[dateKey].amount += amount;
          }
        } catch (e) {
          console.warn('Error processing sale:', e);
        }
      });

      return Object.values(dayTotals);
    } else if (timeFilter === 'weekly') {
      // Show even weeks: Week 2, 4, 6, 8, 10, 12
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekTotals = {};
      const evenWeeks = [2, 4, 6, 8, 10, 12];

      // Initialize even weeks
      evenWeeks.forEach(weekNum => {
        const weekKey = `Week ${weekNum}`;
        weekTotals[weekKey] = { amount: 0, day: weekKey };
      });

      sales.forEach((sale) => {
        try {
          const dateStr = sale.createdAt || sale.date || sale.updatedAt;
          if (!dateStr) return;
          const saleDate = new Date(dateStr);
          if (isNaN(saleDate.getTime())) return;
          saleDate.setHours(0, 0, 0, 0);

          const weekStart = new Date(saleDate);
          weekStart.setDate(weekStart.getDate() - (weekStart.getDay() || 7) + 1);

          let amount = 0;
          if (sale.totalAmount) amount = sale.totalAmount;
          else if (sale.subtotal) amount = sale.subtotal;
          else if (sale.medicines && Array.isArray(sale.medicines)) {
            amount = sale.medicines.reduce((sum, item) => sum + (item.subtotal || item.price * item.quantity || 0), 0);
          }

          const weekNum = Math.ceil((today - weekStart) / (7 * 24 * 60 * 60 * 1000)) + 1;
          // Only count even weeks
          if (weekNum % 2 === 0 && weekNum <= 12) {
            const weekKey = `Week ${weekNum}`;
            if (weekKey in weekTotals) {
              weekTotals[weekKey].amount += amount;
            }
          }
        } catch (e) {
          console.warn('Error processing sale:', e);
        }
      });

      // Return even weeks in ascending order
      return evenWeeks.map(weekNum => weekTotals[`Week ${weekNum}`]);
    } else if (timeFilter === 'monthly') {
      // Calendar year (Jan to Dec)
      const today = new Date();
      const monthTotals = {};
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      // Create entries for all months in calendar order (Jan-Dec)
      for (let i = 0; i < 12; i++) {
        monthTotals[monthNames[i]] = { amount: 0, day: monthNames[i] };
      }

      sales.forEach((sale) => {
        try {
          const dateStr = sale.createdAt || sale.date || sale.updatedAt;
          if (!dateStr) return;
          const saleDate = new Date(dateStr);
          if (isNaN(saleDate.getTime())) return;

          let amount = 0;
          if (sale.totalAmount) amount = sale.totalAmount;
          else if (sale.subtotal) amount = sale.subtotal;
          else if (sale.medicines && Array.isArray(sale.medicines)) {
            amount = sale.medicines.reduce((sum, item) => sum + (item.subtotal || item.price * item.quantity || 0), 0);
          }

          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthKey = monthNames[saleDate.getMonth()];
          if (monthKey in monthTotals) {
            monthTotals[monthKey].amount += amount;
          }
        } catch (e) {
          console.warn('Error processing sale:', e);
        }
      });

      // Return in calendar order (Jan-Dec)
      const monthNames_ordered = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return monthNames_ordered.map(month => monthTotals[month]);
    } else if (timeFilter === 'yearly') {
      // Last 5 years
      const today = new Date();
      const yearTotals = {};

      for (let i = 4; i >= 0; i--) {
        const year = today.getFullYear() - i;
        yearTotals[year.toString()] = { amount: 0, day: year.toString() };
      }

      sales.forEach((sale) => {
        try {
          const dateStr = sale.createdAt || sale.date || sale.updatedAt;
          if (!dateStr) return;
          const saleDate = new Date(dateStr);
          if (isNaN(saleDate.getTime())) return;

          let amount = 0;
          if (sale.totalAmount) amount = sale.totalAmount;
          else if (sale.subtotal) amount = sale.subtotal;
          else if (sale.medicines && Array.isArray(sale.medicines)) {
            amount = sale.medicines.reduce((sum, item) => sum + (item.subtotal || item.price * item.quantity || 0), 0);
          }

          const year = saleDate.getFullYear().toString();
          if (year in yearTotals) {
            yearTotals[year].amount += amount;
          }
        } catch (e) {
          console.warn('Error processing sale:', e);
        }
      });

      return Object.values(yearTotals);
    }

    return [];
  };

  // Prepare donut chart data
  const categoryChartData = {
    total: revenueByCategoryData.length > 0 ? `₹${Math.round(totalRevenueByCategory / 1000)}K` : '₹0',
    items: revenueByCategoryData.map((cat, idx) => {
      // Modern "Celebrate" color palette - professionally coordinated colors
      const colors = [
        // Navy Blue Family
        { color: '#E3F2FD', darkColor: '#204369' }, 
        { color: '#D1E7F7', darkColor: '#1A3A5C' },
        // Golden/Amber Family
        { color: '#FFF3E0', darkColor: '#F4A460' }, 
        { color: '#FFE0B2', darkColor: '#D97706' },
        // Green Family
        { color: '#E8F5E9', darkColor: '#2D7A4A' }, 
        { color: '#C8E6C9', darkColor: '#1B5E20' },
        // Purple/Lavender Family
        { color: '#F3E5F5', darkColor: '#7C3AED' }, 
        { color: '#E1BEE7', darkColor: '#6D28D9' },
        // Pink/Rose Family
        { color: '#FCE4EC', darkColor: '#EC4899' }, 
        { color: '#F8BBD0', darkColor: '#BE185D' },
        // Teal/Cyan Family
        { color: '#E0F2F1', darkColor: '#0D9488' }, 
        { color: '#B2DFDB', darkColor: '#0F766E' },
      ];
      const colorPair = colors[idx % colors.length];
      return {
        label: cat.label,
        value: cat.value,
        count: cat.count,
        color: colorPair.color,
        darkColor: colorPair.darkColor
      };
    })
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">Sales Management</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-1">
            Monitor sales analytics and record transactions
          </p>
        </div>
        <button 
          onClick={() => setIsFormModalOpen(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-slate-700 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 transition-all duration-300 shadow-md hover:shadow-lg active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Sale
        </button>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/40 rounded-lg">
          <p className="text-green-800 dark:text-green-200 font-medium">✓ Sale completed successfully</p>
        </div>
      )}

      {/* Stats Cards Grid - 3 Cards with Glassmorphic Line Graph Design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        {/* Total Revenue Card */}
        <StatsCard_NeuomorphicGraph
          title="Total Revenue"
          value={loading ? '...' : `₹${(totalSales || 0).toLocaleString('en-IN')}`}
          unit=""
          color="blue"
          salesData={sales}
          isLoading={loading}
        />

        {/* Units Sold Card */}
        <StatsCard_NeuomorphicGraph
          title="Units Sold"
          value={loading ? '...' : totalQuantity || 0}
          unit="units"
          color="emerald"
          salesData={sales}
          isLoading={loading}
        />

        {/* Average Sale Value Card */}
        <StatsCard_NeuomorphicGraph
          title="Avg Sale Value"
          value={loading ? '...' : `₹${((totalSales / Math.max(sales.length, 1)) || 0).toFixed(0)}`}
          unit=""
          color="orange"
          salesData={sales}
          isLoading={loading}
        />
      </div>

      {/* Analytics Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Category Card */}
        <RevenueByCategory data={categoryChartData} />

        {/* Total Sales Overview Card */}
        <div className="bg-slate-50 dark:bg-slate-800 dark:bg-blue-900/20 rounded-2xl border border-slate-100 dark:border-blue-900/40 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col">
          <div className="p-4 pb-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
            <div className="flex flex-col gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Total Sales Overview</h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {timeFilter === 'days' && 'Weekly sales breakdown (Mon-Sun)'}
                  {timeFilter === 'weekly' && 'Last 12 weeks performance'}
                  {timeFilter === 'monthly' && 'Last 12 months performance'}
                  {timeFilter === 'yearly' && 'Last 5 years performance'}
                </p>
              </div>
              <div className="flex gap-1 sm:gap-2 flex-wrap">
                <button
                  onClick={() => setTimeFilter('days')}
                  className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                    timeFilter === 'days'
                      ? 'bg-slate-700 dark:bg-slate-700 text-white shadow-lg'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:border-slate-500 dark:hover:border-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  Days
                </button>
                <button
                  onClick={() => setTimeFilter('weekly')}
                  className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                    timeFilter === 'weekly'
                      ? 'bg-slate-700 dark:bg-slate-700 text-white shadow-lg'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:border-slate-500 dark:hover:border-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setTimeFilter('monthly')}
                  className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                    timeFilter === 'monthly'
                      ? 'bg-slate-700 dark:bg-slate-700 text-white shadow-lg'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:border-slate-500 dark:hover:border-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setTimeFilter('yearly')}
                  className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                    timeFilter === 'yearly'
                      ? 'bg-slate-700 dark:bg-slate-700 text-white shadow-lg'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:border-slate-500 dark:hover:border-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  Yearly
                </button>
              </div>
            </div>
          </div>
          <div className="flex-1 p-4 min-h-0 overflow-hidden flex flex-col">
            <WeeklySalesChart salesData={getFilteredChartData()} />
          </div>
        </div>
      </div>

      {/* Sales History */}
      <SalesHistory sales={sales} medicines={medicines} onEdit={handleEditSale} onRefresh={fetchData} />

      {/* Create Sale Modal */}
      {isFormModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40" onClick={() => setIsFormModalOpen(false)} />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl z-50 w-full max-w-4xl mx-4 max-h-[93vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 flex items-center justify-between p-5 sm:p-8 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Record New Sale</h2>
              <button 
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 text-3xl leading-none transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-8 sm:p-10 lg:p-12">
              <SalesForm
                onSubmit={handleSubmitSale}
                isLoading={isSubmitting}
                medicines={medicines}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
