'use client';

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import useAuthStore from '@/store/authStore';
import useMedicineStore from '@/store/medicineStore';
import apiClient from '@/utils/apiClient';
import StatCardNew from '@/components/Dashboard/StatCardNew';
import RecentSalesList from '@/components/Dashboard/RecentSalesList';
import SearchResults from '@/components/Dashboard/SearchResults';

// Lazy load heavy chart components
const DonutChart = dynamic(() => import('@/components/Dashboard/DonutChart'), {
  loading: () => <div className="h-80 bg-slate-200 rounded-2xl animate-pulse" />,
});

const WeeklySalesChart = dynamic(() => import('@/components/Sales/WeeklySalesChart'), {
  loading: () => <div className="h-80 bg-slate-200 rounded-2xl animate-pulse" />,
});

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('days');
  const user = useAuthStore((state) => state.user);
  const setMedicines = useMedicineStore((state) => state.setMedicines);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Use optimized single endpoint for dashboard stats
        const response = await apiClient.get('/reports/dashboard-stats');
        const data = response.data?.data || {};

        setStats({
          totalMedicines: data.totalMedicines || 0,
          lowStockItems: data.lowStockItems || 0,
          availableCategories: data.availableCategories || 0,
          expiredMedicines: data.expiredMedicines || 0,
          systemUsers: data.systemUsers || 0,
          totalPurchases: data.totalPurchases || 0,
          totalSales: data.totalSales || 0,
          salesCount: data.salesCount || 0,
          purchasesCount: data.purchasesCount || 0,
          batchesCount: data.batchesCount || 0,
          salesData: data.salesData || [],
          recentSales: data.recentSales || [],
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const getUserGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Helper function to aggregate sales by actual date (Monday-Sunday week)
  const aggregateSalesByDay = (salesData) => {
    try {
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Find Monday of current week (0 = Sunday, so Monday is 1)
      const dayOfWeek = today.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Go back to Monday
      const monday = new Date(today);
      monday.setDate(monday.getDate() - daysToMonday);
      
      // Create map for Monday to Sunday of current week
      const dayTotals = {};
      const dateKeys = [];
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(date.getDate() + i);
        const dateKey = date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
        dayTotals[dateKey] = {
          amount: 0,
          dayName: dayNames[i]
        };
        dateKeys.push({ dateKey, dayName: dayNames[i] });
      }

      console.log('Week range (Mon-Sun):', dateKeys.map(d => `${d.dayName} (${d.dateKey})`));
      console.log('Sales data received:', salesData?.length || 0);

      // Aggregate sales by actual date
      if (Array.isArray(salesData) && salesData.length > 0) {
        salesData.forEach((sale, idx) => {
          try {
            const dateStr = sale.createdAt || sale.date || sale.updatedAt;
            if (!dateStr) return;
            
            const saleDate = new Date(dateStr);
            if (isNaN(saleDate.getTime())) return;
            
            saleDate.setHours(0, 0, 0, 0);
            const dateKey = saleDate.toLocaleDateString('en-CA');
            const amount = sale.totalAmount || 0;
            
            if (dateKey in dayTotals) {
              dayTotals[dateKey].amount += amount;
              console.log(`Sale: ${dateKey} (${dayTotals[dateKey].dayName}) = ₹${amount}`);
            }
          } catch (e) {
            console.warn('Error processing sale:', e);
          }
        });
      }

      // Convert to array - 7 days Monday to Sunday with NUMERIC amount field
      const daysData = dateKeys.map(({ dateKey, dayName }) => {
        const amount = dayTotals[dateKey].amount || 0;
        return {
          day: dayName,
          amount: amount, // NUMERIC VALUE for chart
          displayAmount: amount > 0 ? `₹${Math.round(amount).toLocaleString('en-IN')}` : '₹0'
        };
      });

      console.log('Final chart data (Mon-Sun):', daysData);
      return daysData;
    } catch (error) {
      console.error('Error aggregating sales:', error);
      // Default Monday-Sunday fallback
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const daysData = [];
      const today = new Date();
      const dayOfWeek = today.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(today);
      monday.setDate(monday.getDate() - daysToMonday);
      
      for (let i = 0; i < 7; i++) {
        daysData.push({
          day: dayNames[i],
          amount: 0,
          displayAmount: '₹0'
        });
      }
      return daysData;
    }
  };

  // Aggregate sales data based on time filter
  const getFilteredChartData = () => {
    if (timeFilter === 'days') {
      return aggregateSalesByDay(stats?.salesData || []);
    } else if (timeFilter === 'weekly') {
      // Show even weeks: Week 2, 4, 6, 8, 10, 12
      const evenWeekNames = ['Week 2', 'Week 4', 'Week 6', 'Week 8', 'Week 10', 'Week 12'];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekTotals = {};

      // Initialize even weeks
      evenWeekNames.forEach(week => {
        weekTotals[week] = 0;
      });

      if (Array.isArray(stats?.salesData) && stats.salesData.length > 0) {
        stats.salesData.forEach(sale => {
          const saleDate = new Date(sale.createdAt || sale.date);
          saleDate.setHours(0, 0, 0, 0);
          
          // Find the week start (Monday of that week)
          const weekStart = new Date(saleDate);
          weekStart.setDate(weekStart.getDate() - (weekStart.getDay() || 7) + 1);

          // Calculate week number
          const weekNum = Math.ceil((today - weekStart) / (7 * 24 * 60 * 60 * 1000)) + 1;
          
          // Only count even weeks within range
          if (weekNum % 2 === 0 && weekNum <= 12) {
            const weekKey = `Week ${weekNum}`;
            if (weekKey in weekTotals) {
              weekTotals[weekKey] += sale.totalAmount || 0;
            }
          }
        });
      }

      return evenWeekNames.map(week => ({
        day: week,
        amount: weekTotals[week] || 0,
        displayAmount: weekTotals[week] > 0 ? `₹${Math.round(weekTotals[week]).toLocaleString('en-IN')}` : '₹0'
      }));
    } else if (timeFilter === 'monthly') {
      // Calendar year (Jan to Dec)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthTotals = {};

      // Initialize all months to 0 in order
      for (let i = 0; i < 12; i++) {
        monthTotals[monthNames[i]] = 0;
      }

      if (Array.isArray(stats?.salesData) && stats.salesData.length > 0) {
        stats.salesData.forEach(sale => {
          const saleDate = new Date(sale.createdAt || sale.date);
          const monthKey = monthNames[saleDate.getMonth()];
          monthTotals[monthKey] = (monthTotals[monthKey] || 0) + (sale.totalAmount || 0);
        });
      }

      // Return in calendar order (Jan-Dec)
      return monthNames.map(month => ({
        day: month,
        amount: monthTotals[month] || 0,
        displayAmount: monthTotals[month] > 0 ? `₹${Math.round(monthTotals[month]).toLocaleString('en-IN')}` : '₹0'
      }));
    } else if (timeFilter === 'yearly') {
      // Last 5 years
      const today = new Date();
      const yearTotals = {};

      for (let i = 4; i >= 0; i--) {
        const year = today.getFullYear() - i;
        yearTotals[year] = 0;
      }

      if (Array.isArray(stats?.salesData) && stats.salesData.length > 0) {
        stats.salesData.forEach(sale => {
          const saleDate = new Date(sale.createdAt || sale.date);
          const year = saleDate.getFullYear();
          if (year in yearTotals) {
            yearTotals[year] += sale.totalAmount || 0;
          }
        });
      }

      return Object.entries(yearTotals).map(([year, amount]) => ({
        day: year.toString(),
        amount: amount || 0,
        displayAmount: amount > 0 ? `₹${Math.round(amount).toLocaleString('en-IN')}` : '₹0'
      }));
    }

    return aggregateSalesByDay(stats?.salesData || []);
  };

  return (
    <div className="space-y-8">
      {/* Security Alert for Google Users */}
      {user?.hasPassword === false && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-900/40 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-orange-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <div>
              <h4 className="text-sm font-bold text-orange-900 dark:text-orange-200">Secure Your Account</h4>
              <p className="text-xs text-orange-700 dark:text-orange-300 mt-0.5">
                You signed in with Google. Set a local password to add an extra layer of security.
              </p>
            </div>
          </div>
          <button 
            onClick={() => window.location.href = '/dashboard/settings'}
            className="whitespace-nowrap px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-orange-600/20"
          >
            Set Password
          </button>
        </motion.div>
      )}

      {/* Header */}
      <div className="transition-all duration-300 ease-out">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
          {getUserGreeting()} {user?.name || 'User'}!
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-1">
          Welcome to your Pharmora Dashboard
        </p>
      </div>

      {/* Search Results */}
      <SearchResults />

      {/* Section Title */}
      <div className="transition-all duration-300 ease-out">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Pharmora Sales Results</h2>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 transition-all duration-300 ease-out">
          <StatCardNew
            title="Total Medicines"
            value={stats?.totalMedicines || 0}
            percentageChange="+2.5%"
            timeframe="This Month"
            gradientColor="from-cyan-400 to-cyan-600"
            backgroundColor="bg-cyan-50"
          />
          <StatCardNew
            title="Low Stock Items"
            value={stats?.lowStockItems || 0}
            percentageChange="+3.5%"
            timeframe="This Month"
            gradientColor="from-gray-400 to-gray-600"
            backgroundColor="bg-gray-50"
          />
          <StatCardNew
            title="Total Purchases"
            value={stats?.totalPurchases ? `₹${stats.totalPurchases.toLocaleString('en-IN')}` : '₹0'}
            percentageChange="Current"
            timeframe="Total"
            gradientColor="from-green-400 to-emerald-600"
            backgroundColor="bg-green-50"
          />
          <StatCardNew
            title="Total Sales"
            value={stats?.totalSales ? `₹${stats.totalSales.toLocaleString('en-IN')}` : '₹0'}
            percentageChange="Current"
            timeframe="Total"
            gradientColor="from-orange-400 to-orange-600"
            backgroundColor="bg-orange-50"
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all duration-300 ease-out">
        <DonutChart
          data={{
            total: stats?.totalMedicines || 0,
            items: [
              { 
                label: 'Purchases', 
                count: stats?.purchasesCount || 0,
                color: '#d4f5dc',
                darkColor: '#10b981'
              },
              { 
                label: 'Sales', 
                count: stats?.salesCount || 0,
                color: '#fed7aa',
                darkColor: '#ea580c'
              },
              { 
                label: 'Medicines', 
                count: stats?.totalMedicines || 0,
                color: '#b3e5fc',
                darkColor: '#06b6d4'
              },
              { 
                label: 'Batches', 
                count: stats?.batchesCount || 0,
                color: '#e0e0e0',
                darkColor: '#9ca3af'
              },
            ],
          }}
        />

        {/* Total Sales Overview Card */}
        <div className="bg-slate-50 dark:bg-slate-800 dark:bg-blue-900/20 rounded-2xl border border-slate-100 dark:border-blue-900/40 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col">
          <div className="p-4 pb-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
            <div className="flex flex-col gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Total Sales Overview</h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {timeFilter === 'days' && 'Weekly sales breakdown (Mon-Sun)'}
                  {timeFilter === 'weekly' && 'Last 12 weeks performance'}
                  {timeFilter === 'monthly' && 'Calendar year breakdown (Jan-Dec)'}
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

      {/* Recent Sales List */}
      <div className="transition-all duration-300 ease-out">
        <RecentSalesList data={stats?.recentSales} />
      </div>
    </div>
  );
}
