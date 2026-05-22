'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/Common';
import ReportTable from '@/components/Reports/ReportTable';
import { IconCalendar, IconCreditCard } from '@tabler/icons-react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import apiClient from '@/utils/apiClient';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('sales'); // sales or purchases
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [medicines, setMedicines] = useState({});
  const [paymentMethodData, setPaymentMethodData] = useState([]);

  // Initialize dates to last 30 days
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    
    fetchData('sales', thirtyDaysAgo.toISOString().split('T')[0], today.toISOString().split('T')[0]);
  }, []);

  // Fetch medicines for reference
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const response = await apiClient.get('/medicines');
        const medicinesData = Array.isArray(response.data?.data) ? response.data.data : Array.isArray(response.data) ? response.data : [];

        const medicinesMap = Array.isArray(medicinesData) ? medicinesData.reduce((acc, med) => {
          acc[med._id] = med.name;
          return acc;
        }, {}) : {};

        setMedicines(medicinesMap);
      } catch (error) {
        console.error('Failed to fetch medicines:', error);
      }
    };

    fetchMedicines();
  }, []);

  // Calculate payment method data for sales or supplier breakdown for purchases
  useEffect(() => {
    if (Array.isArray(reportData) && reportData.length > 0) {
      const methodBreakdown = {};
      
      reportData.forEach(item => {
        let key, amount;
        
        if (reportType === 'sales') {
          key = item.paymentMethod ? 
            (item.paymentMethod).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 
            'Cash';
          amount = (item.totalAmount || item.amount || 0);
        } else {
          // For purchases, breakdown by supplier
          key = item.supplier || 'Unknown Supplier';
          amount = item.amount || 0;
        }
        
        if (!methodBreakdown[key]) {
          methodBreakdown[key] = 0;
        }
        methodBreakdown[key] += amount;
      });
      
      const chartData = Object.entries(methodBreakdown).map(([name, value]) => ({
        name,
        value: parseFloat(value.toFixed(2))
      }));
      
      setPaymentMethodData(chartData);
    } else {
      setPaymentMethodData([]);
    }
  }, [reportData, reportType]);

  const fetchData = async (type, start, end) => {
    try {
      setLoading(true);

      if (type === 'sales') {
        // Fetch sales report from API
        const response = await apiClient.get('/sales/customers/list');
        const salesData = response.data?.data?.sales || response.data?.data || response.data || [];
        
        // Filter by date range
        const filteredData = (Array.isArray(salesData) ? salesData : []).filter(sale => {
          const saleDate = new Date(sale.createdAt).toISOString().split('T')[0];
          return saleDate >= start && saleDate <= end;
        });

        // Map the data to the expected format
        const formattedData = filteredData.map(sale => ({
          _id: sale._id,
          date: new Date(sale.createdAt).toISOString().split('T')[0],
          orderId: sale.orderId,
          medicineName: sale.medicines && sale.medicines.length > 0 
            ? sale.medicines.map(m => m.medicineId?.name || 'Unknown').join(', ')
            : 'N/A',
          quantity: sale.medicines ? sale.medicines.reduce((sum, m) => sum + (m.quantity || 0), 0) : 0,
          unitPrice: sale.medicines && sale.medicines.length > 0 
            ? sale.medicines[0].price || 0
            : 0,
          amount: sale.totalAmount || 0,
          paymentMethod: sale.paymentMethod || 'cash',
          customerName: sale.customerName || 'Unknown'
        }));
        
        console.log('Formatted Sales Data:', formattedData);
        setReportData(formattedData);
      } else {
        // Fetch purchases report from API
        const response = await apiClient.get('/purchases?limit=500');
        const purchasesData = response.data?.data?.purchases || response.data?.data || response.data || [];
        
        // Filter by date range
        const filteredData = (Array.isArray(purchasesData) ? purchasesData : []).filter(purchase => {
          try {
            const purchaseDate = new Date(purchase.createdAt).toISOString().split('T')[0];
            return purchaseDate >= start && purchaseDate <= end;
          } catch (e) {
            return false;
          }
        });

        // Map the data to the expected format
        const formattedData = filteredData.map(purchase => ({
          _id: purchase._id,
          date: new Date(purchase.createdAt).toISOString().split('T')[0],
          supplier: purchase.supplierName || 'Unknown Supplier',
          medicines: purchase.medicines || [],
          quantity: purchase.medicines ? purchase.medicines.reduce((sum, m) => sum + (m.quantity || 0), 0) : 0,
          amount: purchase.totalAmount || 0,
          paymentMethod: purchase.paymentMethod || 'bank_transfer',
          paymentStatus: purchase.paymentStatus || 'pending'
        }));
        
        console.log('Formatted Purchase Data:', formattedData);
        setReportData(formattedData);
      }
    } catch (error) {
      console.error('Failed to fetch report data:', error);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (type) => {
    setReportType(type);
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const start = thirtyDaysAgo.toISOString().split('T')[0];
    const end = today.toISOString().split('T')[0];
    fetchData(type, start, end);
  };

  const handleFilterChange = (newStartDate = startDate, newEndDate = endDate) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    fetchData(reportType, newStartDate, newEndDate);
  };

  const getSalesColumns = () => [
    { key: 'date', label: 'Date' },
    { key: 'medicineName', label: 'Medicine' },
    { key: 'quantity', label: 'Quantity', align: 'right' },
    { key: 'unitPrice', label: 'Unit Price', align: 'right', render: (val) => `₹${val.toFixed(2)}` },
    { key: 'amount', label: 'Amount', align: 'right', render: (val) => `₹${val.toFixed(2)}` },
  ];

  const getPurchaseColumns = () => [
    { key: 'date', label: 'Date' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'quantity', label: 'Quantity', align: 'right' },
    { key: 'amount', label: 'Amount', align: 'right', render: (val) => `₹${val.toFixed(2)}` },
  ];

  const columns = reportType === 'sales' ? getSalesColumns() : getPurchaseColumns();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Reports
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          View sales and purchase reports with filters
        </p>
      </div>

      {/* Controls Card */}
      <Card className="p-6 sm:p-8 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        {/* Tabs */}
        <div className="flex gap-8 border-b border-slate-200 dark:border-slate-700 mb-6">
          <button
            onClick={() => handleTypeChange('sales')}
            className={`pb-4 font-semibold transition-all ${
              reportType === 'sales'
                ? 'text-[#4a5f7f] dark:text-blue-400 border-b-2 border-[#4a5f7f] dark:border-slate-700 dark:border-slate-500'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 border-b-2 border-transparent'
            }`}
          >
            Sales Report
          </button>
          <button
            onClick={() => handleTypeChange('purchases')}
            className={`pb-4 font-semibold transition-all ${
              reportType === 'purchases'
                ? 'text-[#4a5f7f] dark:text-blue-400 border-b-2 border-[#4a5f7f] dark:border-slate-700 dark:border-slate-500'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 border-b-2 border-transparent'
            }`}
          >
            Purchase Report
          </button>
        </div>

        {/* Date Range Filter */}
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleFilterChange(e.target.value, endDate)}
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleFilterChange(startDate, e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 focus:border-transparent transition-all"
            />
          </div>

          <button
            onClick={() => {
              const today = new Date();
              const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
              handleFilterChange(
                thirtyDaysAgo.toISOString().split('T')[0],
                today.toISOString().split('T')[0]
              );
            }}
            className="px-4 py-2.5 bg-[#4a5f7f] dark:bg-[#3d4d63] hover:bg-[#3d4d63] dark:hover:bg-[#2d3d53] text-white rounded-md font-medium transition-colors text-sm"
          >
            Last 30 Days
          </button>
        </div>
      </Card>

      {/* Revenue/Cost Breakdown Card - For Both Sales and Purchases */}
      <Card className="p-6 sm:p-8 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {reportType === 'sales' ? 'Revenue by Payment Method' : 'Cost by Supplier'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
              {reportType === 'sales' 
                ? 'Distribution of revenue across payment channels' 
                : 'Distribution of costs across suppliers'}
            </p>
          </div>
          <div className="p-3 rounded-md bg-slate-100 dark:bg-slate-700">
            <IconCreditCard size={24} className="text-slate-600 dark:text-slate-400" />
          </div>
        </div>

        {paymentMethodData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={130}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][index % 6]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '6px', padding: '8px 12px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', color: '#e2e8f0' }}
                  position="right"
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Payment Method Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
              {paymentMethodData.map((item, index) => {
                const totalAmount = paymentMethodData.reduce((sum, d) => sum + d.value, 0);
                const percentage = ((item.value / totalAmount) * 100).toFixed(0);
                const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                const color = colors[index % colors.length];

                return (
                  <div key={index} className="p-4 rounded-md border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all flex items-center justify-between bg-white dark:bg-slate-700">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      ></div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">{item.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">₹{item.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                      </div>
                    </div>
                    <div className="bg-slate-700 dark:bg-slate-600 text-white px-2.5 py-1.5 rounded-sm text-xs font-semibold">
                      {percentage}%
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-slate-600 dark:text-slate-400">
            <p className="text-sm">No data available</p>
          </div>
        )}

        {paymentMethodData.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Revenue</span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                ₹{paymentMethodData.reduce((sum, d) => sum + d.value, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Payment Summary Card - Only for Sales */}
      {reportType === 'sales' && (
        <Card className="p-6 sm:p-8 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Payment Summary</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">Current sales statistics</p>
            </div>
            <div className="p-3 rounded-md bg-slate-100 dark:bg-slate-700">
              <IconCreditCard size={24} className="text-slate-600 dark:text-slate-400" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-white dark:bg-slate-700 rounded-md p-4 border border-slate-200 dark:border-slate-600 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Records</span>
                <span className="font-semibold text-slate-900 dark:text-white">{reportData.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">Total Quantity</span>
                <span className="font-semibold text-slate-900 dark:text-white">{reportData.reduce((sum, item) => sum + (item.quantity || 0), 0)} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Amount</span>
                <span className="font-semibold text-slate-900 dark:text-white">₹{reportData.reduce((sum, item) => sum + ((item.amount || 0)), 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-600 pt-3 flex justify-between items-center">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Average Transaction</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  ₹{reportData.length > 0 ? (reportData.reduce((sum, item) => sum + ((item.amount || 0)), 0) / reportData.length).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : 0}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => {
                  const csvContent = "data:text/csv;charset=utf-8," + 
                    [reportType === 'sales' ? "Date,Medicine,Quantity,Unit Price,Amount" : "Date,Supplier,Medicine,Quantity,Unit Price,Amount"]
                      .concat(
                        reportData.map(item => 
                          reportType === 'sales' 
                            ? `${item.date},${item.medicineName},${item.quantity},${item.unitPrice},${item.quantity * item.unitPrice}`
                            : `${item.date},${item.supplier},${item.medicineName},${item.quantity},${item.unitPrice},${item.quantity * item.unitPrice}`
                        )
                      )
                      .join("\n");

                  const link = document.createElement("a");
                  link.setAttribute("href", encodeURI(csvContent));
                  link.setAttribute("download", `${reportType}-report-${Date.now()}.csv`);
                  link.click();
                }}
                className="flex-1 px-3 sm:px-4 py-2.5 border border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50 rounded-md transition-colors text-xs sm:text-sm font-medium">
                Export Report
              </button>
              <button className="flex-1 px-3 sm:px-4 py-2.5 bg-[#4a5f7f] hover:bg-[#3d4d63] text-white rounded-md transition-colors text-xs sm:text-sm font-medium">
                View Analytics
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Report Table Card */}
      <Card className="overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="p-6 sm:p-8 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {reportType === 'sales' ? 'Sales Details' : 'Purchase Details'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            {startDate && endDate
              ? `${startDate} to ${endDate}`
              : 'Select date range'}
          </p>
        </div>
        <ReportTable
          data={reportData}
          columns={columns}
          loading={loading}
          emptyMessage={`No ${reportType} found for the selected date range`}
        />
      </Card>
    </div>
  );
}
