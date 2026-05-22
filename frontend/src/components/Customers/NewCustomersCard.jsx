'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import apiClient from '@/utils/apiClient';

export function NewCustomersCard({ refreshTrigger }) {
  const [chartData, setChartData] = useState([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/sales');
        const salesData = response.data?.data?.sales || [];

        // Group sales by paymentMethod to categorize customer types
        const inStore = salesData.filter(sale => ['cash', 'check', 'upi'].includes(sale.paymentMethod)).length;
        const online = salesData.filter(sale => ['online', 'card', 'net_banking'].includes(sale.paymentMethod)).length;
        const offline = salesData.filter(sale => ['credit', 'store_credit'].includes(sale.paymentMethod)).length;

        const total = inStore + online + offline;

        const data = [
          { name: 'In-Store', value: inStore, fill: '#4A90E2' },
          { name: 'Online', value: online, fill: '#7DB8E8' },
          { name: 'Off Line', value: offline, fill: '#B8D4F1' }
        ];

        setChartData(data);
        setTotalCustomers(total);
      } catch (error) {
        console.error('Failed to fetch customer data:', error);
        setChartData([
          { name: 'In-Store', value: 0, fill: '#4A90E2' },
          { name: 'Online', value: 0, fill: '#7DB8E8' },
          { name: 'Off Line', value: 0, fill: '#B8D4F1' }
        ]);
        setTotalCustomers(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [refreshTrigger]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg animate-in fade-in duration-200 -translate-x-1/2 -translate-y-full mb-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-white whitespace-nowrap">{payload[0].name}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">{payload[0].value} customers</p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 whitespace-nowrap">
            {((payload[0].value / totalCustomers) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = () => {
    return null; // We'll use a static label instead
  };

  if (loading) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800 dark:bg-blue-900/20 rounded-2xl p-6 sm:p-8 border border-slate-100 dark:border-blue-900/40 shadow-sm animate-pulse">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-8"></div>
        <div className="h-72 bg-slate-200 dark:bg-slate-700 rounded-lg mb-4"></div>
        <div className="grid grid-cols-3 gap-3">
          <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
          <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
          <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-800 dark:bg-blue-900/20 rounded-2xl p-6 sm:p-8 border border-slate-100 dark:border-blue-900/40 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Header with title */}
      <div className="mb-6">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">New Customers</h3>
      </div>

      {/* Donut Chart */}
      <div className="w-full h-72 flex items-center justify-center relative overflow-visible mb-4">
        <ResponsiveContainer width="100%" height={288}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={120}
              paddingAngle={3}
              dataKey="value"
              animationDuration={600}
              animationEasing="ease-in-out"
              strokeWidth={2}
              stroke={typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff'}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.fill}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center Text Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium transition-all duration-300">Total Customers</p>
          <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white transition-all duration-300">{totalCustomers}</p>
        </div>
      </div>

      {/* Customer Breakdown */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        {chartData.map((item, index) => (
          <div 
            key={index} 
            className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800 dark:bg-slate-700 border border-blue-200 dark:border-slate-600 transition-shadow duration-200 hover:shadow-md"
          >
            <div className="flex items-center justify-center mb-2">
              <div 
                className="w-3 h-3 rounded-full shadow-sm" 
                style={{ backgroundColor: item.fill }}
              ></div>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 mb-1 font-semibold">{item.name}</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {item.value}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {totalCustomers > 0 ? ((item.value / totalCustomers) * 100).toFixed(1) : 0}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
