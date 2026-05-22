'use client';

import { useState, useRef, useEffect } from 'react';
import { IconBell } from '@tabler/icons-react';
import NotificationList from './NotificationList';

export default function NotificationBell({ medicines = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const bellRef = useRef(null);

  // Generate notifications based on medicines
  useEffect(() => {
    const generatedNotifications = [];
    const today = new Date();

    medicines.forEach((medicine) => {
      // Out of stock alert
      if (medicine.quantity === 0) {
        generatedNotifications.push({
          id: `out-of-stock-${medicine._id || medicine.id}`,
          type: 'out_of_stock',
          title: 'Out of Stock',
          message: `${medicine.name} is now out of stock!`,
          medicineName: medicine.name,
          timestamp: new Date().toISOString(),
          read: false,
        });
      }

      // Low stock alert (< 20 units but > 0)
      if (medicine.quantity > 0 && medicine.quantity < 20) {
        generatedNotifications.push({
          id: `low-stock-${medicine._id || medicine.id}`,
          type: 'low_stock',
          title: 'Low Stock Alert',
          message: `${medicine.name} has only ${medicine.quantity} units left`,
          medicineName: medicine.name,
          timestamp: new Date().toISOString(),
          read: false,
        });
      }

      // Expiry alert (within 30 days)
      if (medicine.expiryDate) {
        const expiryDate = new Date(medicine.expiryDate);
        const daysUntilExpiry = Math.ceil(
          (expiryDate - today) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
          generatedNotifications.push({
            id: `expiry-${medicine._id || medicine.id}`,
            type: 'expiry',
            title: 'Expiry Alert',
            message: `${medicine.name} expires in ${daysUntilExpiry} days`,
            medicineName: medicine.name,
            timestamp: new Date().toISOString(),
            read: false,
          });
        } else if (daysUntilExpiry <= 0) {
          generatedNotifications.push({
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

    setNotifications(generatedNotifications);
  }, [medicines]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const handleClearAll = () => {
    setNotifications([]);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={bellRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <IconBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
          <NotificationList
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onClearAll={handleClearAll}
          />
        </div>
      )}
    </div>
  );
}
