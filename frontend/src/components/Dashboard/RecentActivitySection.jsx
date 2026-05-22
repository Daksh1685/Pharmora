'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/utils/apiClient';
import { Card } from '@/components/Common';
import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';

const typeColors = {
  sale: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: 'text-emerald-600', label: 'Sale', bgDark: 'bg-gradient-to-br from-emerald-400 to-emerald-600' },
  purchase: { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-blue-700', icon: 'text-slate-700 dark:text-slate-300', label: 'Purchase', bgDark: 'bg-gradient-to-br from-blue-400 to-blue-600' },
  'low-stock': { bg: 'bg-amber-100', text: 'text-amber-700', icon: 'text-amber-600', label: 'Low Stock', bgDark: 'bg-gradient-to-br from-amber-400 to-amber-600' },
};

export default function RecentActivitySection() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ sales: 0, purchases: 0 });

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        
        // Fetch sales and purchases from API
        const [salesRes, purchasesRes] = await Promise.all([
          apiClient.get('/sales'),
          apiClient.get('/purchases')
        ]);

        const salesData = salesRes.data?.data?.sales || [];
        const purchasesData = purchasesRes.data?.data?.purchases || [];

        // Store counts for summary
        setStats({
          sales: salesData.length,
          purchases: purchasesData.length,
        });

        // Combine and convert to activities
        const combinedActivities = [];

        // Add sales as activities
        if (Array.isArray(salesData)) {
          salesData.forEach((sale) => {
            const totalItems = sale.medicines?.reduce((sum, m) => sum + (m.quantity || 0), 0) || 0;
            combinedActivities.push({
              id: `sale-${sale._id}`,
              type: 'sale',
              description: `${totalItems} units sold • ₹${sale.totalAmount?.toLocaleString() || 0}`,
              medicines: sale.medicines?.map((m) => m.medicineName).join(', ') || 'Multiple medicines',
              timestamp: sale.createdAt ? new Date(sale.createdAt) : new Date(),
              date: sale.createdAt,
              amount: sale.totalAmount || 0,
            });
          });
        }

        // Add purchases as activities
        if (Array.isArray(purchasesData)) {
          purchasesData.forEach((purchase) => {
            const totalItems = purchase.medicines?.reduce((sum, m) => sum + (m.quantity || 0), 0) || 0;
            combinedActivities.push({
              id: `purchase-${purchase._id}`,
              type: 'purchase',
              description: `${totalItems} units from ${purchase.supplierName} • ₹${purchase.totalAmount?.toLocaleString() || 0}`,
              medicines: purchase.medicines?.map((m) => m.medicineName).join(', ') || 'Multiple medicines',
              timestamp: purchase.createdAt ? new Date(purchase.createdAt) : new Date(),
              date: purchase.createdAt,
              amount: purchase.totalAmount || 0,
            });
          });
        }

        // Sort by date descending (most recent first)
        combinedActivities.sort((a, b) => {
          const dateA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
          const dateB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
          return dateB - dateA;
        });

        // Keep only the 8 most recent activities
        setActivities(combinedActivities.slice(0, 8));
      } catch (error) {
        console.error('Failed to fetch activities:', error);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const formatTimestamp = (date) => {
    if (!date) return 'Just now';
    
    const activityDate = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffMs = now - activityDate;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return activityDate.toLocaleDateString();
  };

  if (loading) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-6">Recent Activity</h2>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6 bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 mb-6">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900">Recent Activity</h2>
        <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-emerald-600" />
            <span className="text-slate-600 font-medium">{stats.sales} Sales</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-slate-700 dark:bg-slate-600" />
            <span className="text-slate-600 font-medium">{stats.purchases} Purchases</span>
          </div>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-12 sm:py-16">
          <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <svg className="w-6 sm:w-7 h-6 sm:h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-slate-700 font-medium text-sm">No activities yet</p>
          <p className="text-slate-500 text-xs mt-1">Activities from sales and purchases will appear here</p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {activities.map((activity, index) => {
            const colors = typeColors[activity.type] || typeColors.sale;
            const Icon = activity.type === 'sale' ? IconTrendingUp : IconTrendingDown;
            
            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 sm:p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors duration-200"
              >
                <div className={`flex-shrink-0 w-9 h-9 rounded-lg ${colors.bg} flex items-center justify-center`}>
                  <Icon className={`${colors.icon}`} size={18} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {activity.type === 'sale' ? 'Sale' : 'Purchase'}
                      </p>
                      <p className="text-sm text-slate-600 mt-0.5">{activity.description}</p>
                      <p className="text-xs text-slate-500 mt-1.5 truncate">{activity.medicines}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className={`text-sm font-semibold ${colors.text}`}>₹{activity.amount?.toLocaleString()}</p>
                      <p className="text-xs text-slate-500 mt-1">{formatTimestamp(activity.date)}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
