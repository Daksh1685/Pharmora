import apiClient from '@/utils/apiClient';

/**
 * Check inventory levels and send notifications for low stock
 * @param {number} threshold - Stock threshold (default 10)
 * @returns {Promise<Array>} - Array of medicines below threshold
 */
export async function checkInventoryAlerts(threshold = 10) {
  try {
    const response = await apiClient.get('/medicines?limit=1000');
    const medicines = response.data?.data?.medicines || [];
    
    // Filter medicines below threshold
    const lowStockMedicines = medicines.filter(medicine => 
      medicine.quantity < threshold && medicine.quantity > 0
    );
    
    const outOfStockMedicines = medicines.filter(medicine => 
      medicine.quantity === 0
    );

    // Create notifications for low stock items
    const notifications = [];

    if (outOfStockMedicines.length > 0) {
      outOfStockMedicines.forEach(medicine => {
        notifications.push({
          id: `out-of-stock-${medicine._id}`,
          medicineId: medicine._id,
          medicineName: medicine.name,
          type: 'critical',
          status: 'active',
          title: 'Out of Stock Alert',
          message: `${medicine.name} is completely out of stock!`,
          severity: 'high',
          createdAt: new Date().toISOString(),
          actionRequired: true,
        });
      });
    }

    if (lowStockMedicines.length > 0) {
      lowStockMedicines.forEach(medicine => {
        notifications.push({
          id: `low-stock-${medicine._id}`,
          medicineId: medicine._id,
          medicineName: medicine.name,
          type: 'warning',
          status: 'active',
          title: 'Low Stock Alert',
          message: `${medicine.name} has only ${medicine.quantity} units left (threshold: ${threshold})`,
          severity: 'medium',
          createdAt: new Date().toISOString(),
          actionRequired: false,
        });
      });
    }

    // Save notifications to localStorage and notification store
    if (notifications.length > 0) {
      const existingNotifications = JSON.parse(
        localStorage.getItem('inventoryNotifications') || '[]'
      );
      
      // Merge new notifications with existing ones (avoid duplicates)
      const mergedNotifications = [
        ...notifications,
        ...existingNotifications.filter(
          existing => !notifications.some(n => n.id === existing.id)
        ),
      ];
      
      localStorage.setItem('inventoryNotifications', JSON.stringify(mergedNotifications));
    }

    return {
      lowStock: lowStockMedicines,
      outOfStock: outOfStockMedicines,
      notifications: notifications,
    };
  } catch (error) {
    console.error('Failed to check inventory alerts:', error);
    return {
      lowStock: [],
      outOfStock: [],
      notifications: [],
      error: error.message,
    };
  }
}

/**
 * Get all active inventory notifications
 * @returns {Array} - Array of active notifications
 */
export function getInventoryNotifications() {
  try {
    return JSON.parse(localStorage.getItem('inventoryNotifications') || '[]');
  } catch (error) {
    console.error('Failed to get inventory notifications:', error);
    return [];
  }
}

/**
 * Mark notification as read/dismissed
 * @param {string} notificationId - ID of the notification to dismiss
 */
export function dismissInventoryNotification(notificationId) {
  try {
    const notifications = JSON.parse(localStorage.getItem('inventoryNotifications') || '[]');
    const updated = notifications.filter(n => n.id !== notificationId);
    localStorage.setItem('inventoryNotifications', JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to dismiss notification:', error);
  }
}

/**
 * Clear all inventory notifications
 */
export function clearAllInventoryNotifications() {
  try {
    localStorage.setItem('inventoryNotifications', JSON.stringify([]));
  } catch (error) {
    console.error('Failed to clear notifications:', error);
  }
}
