import { create } from 'zustand';

const useUIStore = create((set) => ({
  confirmModal: {
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'danger', // danger, info, warning
  },

  // Toast Notifications
  notifications: [],
  
  addNotification: (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    set((state) => ({
      notifications: [...state.notifications, { id, message, type }]
    }));

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }));
      }, duration);
    }
  },

  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),

  openConfirm: (config) => set({
    confirmModal: {
      isOpen: true,
      title: config.title || 'Confirm Action',
      message: config.message || 'Are you sure you want to proceed?',
      onConfirm: config.onConfirm,
      confirmText: config.confirmText || 'Confirm',
      cancelText: config.cancelText ?? 'Cancel',  // ?? preserves null (hides button), || would replace null with 'Cancel'
      type: config.type || 'danger',
    }
  }),

  closeConfirm: () => set((state) => ({
    confirmModal: { ...state.confirmModal, isOpen: false }
  })),
}));

export default useUIStore;

