'use client';

import { useState, useEffect } from 'react';
import useMedicineStore from '@/store/medicineStore';
import axios from 'axios';
import { Card } from '@/components/Common';
import { NotificationList } from '@/components/Notifications';

export default function NotificationsPage() {
  const medicines = useMedicineStore((state) => state.medicines);
  const [backendNotifications, setBackendNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch notifications from backend
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        
        // Use axios instance without interceptor to prevent auto-redirect on 401
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/notifications`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        
        const data = Array.isArray(response.data?.data) ? response.data.data : Array.isArray(response.data) ? response.data : [];
        setBackendNotifications(data);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        // Gracefully handle errors without redirecting
        setBackendNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Generate local notifications from medicines
  const localNotifications = [];
  const today = new Date();

  if (Array.isArray(medicines)) {
    medicines.forEach((medicine) => {
      if (medicine.quantity < 10) {
        localNotifications.push({
          id: `low-stock-${medicine._id || medicine.id}`,
          type: 'low_stock',
          title: 'Low Stock Alert',
          message: `${medicine.name} has only ${medicine.quantity} units left`,
          medicineName: medicine.name,
          timestamp: new Date().toISOString(),
          read: false,
        });
      }

      if (medicine.expiryDate) {
        const expiryDate = new Date(medicine.expiryDate);
        const daysUntilExpiry = Math.ceil(
          (expiryDate - today) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
          localNotifications.push({
            id: `expiry-${medicine._id || medicine.id}`,
            type: 'expiry',
            title: 'Expiry Alert',
            message: `${medicine.name} expires in ${daysUntilExpiry} days`,
            medicineName: medicine.name,
            timestamp: new Date().toISOString(),
            read: false,
          });
        } else if (daysUntilExpiry <= 0) {
          localNotifications.push({
            id: `expired-${medicine._id || medicine.id}`,
            type: 'expired',
            title: 'Product Expired',
            message: `${medicine.name} has expired`,
            medicineName: medicine.name,
            timestamp: new Date().toISOString(),
            read: false,
          });
        }
      }
    });
  }

  // Merge backend and local notifications
  const allNotifications = [...backendNotifications, ...localNotifications];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
        <p className="text-slate-600 mt-1">
          {allNotifications.length} alert{allNotifications.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Notifications Card */}
      <Card className="overflow-hidden">
        <NotificationList
          notifications={allNotifications}
          onMarkAsRead={() => {}}
          onClearAll={() => {}}
        />
      </Card>
    </div>
  );
}
