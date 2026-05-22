import { create } from 'zustand';

const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  inventoryAlerts: [],

  setNotifications: (notifications) => {
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    set({ notifications, unreadCount });
  },
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + (!notification.isRead ? 1 : 0),
    })),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n._id !== id),
    })),
  
  // Inventory alert methods
  setInventoryAlerts: (alerts) => set({ inventoryAlerts: alerts }),
  addInventoryAlert: (alert) =>
    set((state) => ({
      inventoryAlerts: [alert, ...state.inventoryAlerts],
    })),
  dismissInventoryAlert: (alertId) =>
    set((state) => ({
      inventoryAlerts: state.inventoryAlerts.filter((a) => a.id !== alertId),
    })),
  clearInventoryAlerts: () => set({ inventoryAlerts: [] }),
  
  setLoading: (isLoading) => set({ isLoading }),
  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
}));

export default useNotificationStore;
