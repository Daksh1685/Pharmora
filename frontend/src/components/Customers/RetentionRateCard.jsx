'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import apiClient from '@/utils/apiClient';

export function RetentionRateCard({ refreshTrigger }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retentionRate, setRetentionRate] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const fetchRetentionData = async () => {
      try {
        setLoading(true);
        
        // Detect dark mode
        const checkDarkMode = () => {
          setIsDarkMode(document.documentElement.classList.contains('dark'));
        };
        
        checkDarkMode();
        
        // Watch for theme changes
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        
        const response = await apiClient.get('/sales');
        const salesData = response.data?.data?.sales || [];

        if (!salesData || salesData.length === 0) {
          const zeroData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
            name: day,
            rate: 0,
            fullDate: '',
            repeatCount: 0,
            totalCount: 0
          }));
          setChartData(zeroData);
          setRetentionRate(0);
          setLoading(false);
          return;
        }

        // Track customer purchases by customer name and date
        const customerPurchases = {}; // { customerName: count }
        const customerDates = {}; // { customerName: [dates] }
        const salesByDate = {}; // { dateStr: [ customerNames ] }
        
        const sortedSales = [...salesData].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        // First pass: organize data by date and customer
        sortedSales.forEach(sale => {
          const saleDate = new Date(sale.createdAt);
          const dateStr = saleDate.toLocaleDateString('en-IN');
          const customerName = sale.customerName || 'Unknown';

          // Track customers per date
          if (!salesByDate[dateStr]) {
            salesByDate[dateStr] = [];
          }
          salesByDate[dateStr].push(customerName);

          // Track unique dates per customer
          if (!customerDates[customerName]) {
            customerDates[customerName] = new Set();
          }
          customerDates[customerName].add(dateStr);

          // Track total purchases per customer
          if (!customerPurchases[customerName]) {
            customerPurchases[customerName] = 0;
          }
          customerPurchases[customerName]++;
        });

        // Calculate overall retention: customers with purchases on 2+ different dates
        const totalUniqueCustomers = Object.keys(customerPurchases).length;
        const repeatCustomers = Object.keys(customerDates).filter(name => customerDates[name].size >= 2).length;
        const retentionPercent = totalUniqueCustomers > 0 
          ? ((repeatCustomers / totalUniqueCustomers) * 100).toFixed(1) 
          : 0;

        console.log('📊 Customer Retention Analysis:', {
          totalSales: salesData.length,
          totalUniqueCustomers,
          repeatCustomers,
          retentionPercent: `${retentionPercent}%`,
          customerBreakdown: Object.fromEntries(
            Object.entries(customerDates)
              .map(([name, dates]) => [name, `${dates.size} dates`])
              .slice(0, 5)
          )
        });

        setRetentionRate(retentionPercent);

        // Generate chart data for last 7 days - showing daily retention rate
        const today = new Date();
        const chartLast7Days = [];
        const allDatesSet = new Set(Object.keys(salesByDate));
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toLocaleDateString('en-IN');
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          
          const customersToday = salesByDate[dateStr] || [];
          const uniqueCustomersToday = [...new Set(customersToday)]; // Get unique customers for this day
          
          // Count repeat customers on this day (those who appear on other dates too)
          const repeatCustomersToday = uniqueCustomersToday.filter(name => {
            return customerDates[name] && customerDates[name].size > 1;
          }).length;
          
          // Calculate retention rate for this day
          let dailyRetention = 0;
          if (uniqueCustomersToday.length > 0) {
            dailyRetention = Math.round((repeatCustomersToday / uniqueCustomersToday.length) * 100);
          }

          chartLast7Days.push({
            name: dayName,
            rate: dailyRetention,
            fullDate: dateStr,
            repeatCount: repeatCustomersToday,
            totalCount: uniqueCustomersToday.length
          });
        }

        setChartData(chartLast7Days.length > 0 ? chartLast7Days : getDefaultData());
      } catch (error) {
        console.error('Failed to fetch retention data:', error);
        setChartData(getDefaultData());
        setRetentionRate(0);
      } finally {
        setLoading(false);
      }
    };

    fetchRetentionData();
  }, [refreshTrigger]);

  const getDefaultData = () => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
    name: day,
    rate: 0,
    fullDate: '',
    repeatCount: 0,
    totalCount: 0
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{data.name}</p>
          <p className="text-sm text-slate-700 dark:text-slate-300 dark:text-blue-400 font-medium">Retention: {data.rate}%</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">({data.repeatCount} repeat / {data.totalCount} total)</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 border border-slate-100 dark:border-slate-700 shadow-sm animate-pulse">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-8"></div>
        <div className="h-72 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-lg transition-shadow duration-300">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Retention Rate</h3>
        <div className="mt-3 flex items-baseline gap-2">
          <p className="text-3xl sm:text-4xl font-bold text-slate-700 dark:text-slate-300 dark:text-blue-400">{retentionRate}%</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">of customers returned for repeat purchase</p>
        </div>
      </div>

      {/* Line Chart */}
      <div className="w-full h-72 overflow-hidden">
        <ResponsiveContainer width="100%" height={288}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#475569' : '#e5e7eb'} vertical={false} />
            <XAxis dataKey="name" stroke={isDarkMode ? '#94a3b8' : '#9ca3af'} style={{ fontSize: '12px', fill: isDarkMode ? '#cbd5e1' : '#9ca3af' }} />
            <YAxis stroke={isDarkMode ? '#94a3b8' : '#9ca3af'} style={{ fontSize: '12px', fill: isDarkMode ? '#cbd5e1' : '#9ca3af' }} domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#3B82F6"
              strokeWidth={2.5}
              dot={{ fill: '#3B82F6', r: 4 }}
              activeDot={{ r: 6, fill: '#1E40AF' }}
              isAnimationActive={true}
              animationDuration={500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Trend Info */}
      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-300 dark:text-blue-400">Report Graph</span>
        </p>
      </div>
    </div>
  );
}
