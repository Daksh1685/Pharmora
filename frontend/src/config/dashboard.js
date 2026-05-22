// Dashboard configuration - easily customize UI here
import {
  IconPill,
  IconAlertCircle,
  IconShoppingCart,
  IconTruck,
} from '@tabler/icons-react';

export const DASHBOARD_CONFIG = {
  stats: [
    {
      id: 'total-medicines',
      title: 'Total Medicines',
      key: 'totalMedicines',
      icon: IconPill,
      color: 'blue',
      format: (value) => value,
    },
    {
      id: 'low-stock',
      title: 'Low Stock Items',
      key: 'lowStockItems',
      icon: IconAlertCircle,
      color: 'amber',
      format: (value) => value,
    },
    {
      id: 'total-purchases',
      title: 'Total Purchases',
      key: 'totalPurchases',
      icon: IconTruck,
      color: 'green',
      format: (value) => `₹${value.toLocaleString()}`,
    },
    {
      id: 'total-sales',
      title: 'Total Sales',
      key: 'totalSales',
      icon: IconShoppingCart,
      color: 'emerald',
      format: (value) => `₹${value.toLocaleString()}`,
    },
  ],
  sections: [
    {
      id: 'stats',
      title: 'Overview',
      enabled: true,
    },
    {
      id: 'recent-activity',
      title: 'Recent Activity',
      enabled: true,
    },
    {
      id: 'quick-actions',
      title: 'Quick Actions',
      enabled: true,
    },
  ],
};

// API endpoints - centralized for easy updates
export const DASHBOARD_API = {
  getStats: '/api/dashboard/stats',
  getActivities: '/api/dashboard/activities',
  getMetrics: '/api/dashboard/metrics',
};
