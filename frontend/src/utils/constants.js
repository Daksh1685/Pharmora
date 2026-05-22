export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  MEDICINES: '/dashboard/medicines',
  BATCHES: '/dashboard/batches',
  PURCHASES: '/dashboard/purchases',
  SALES: '/dashboard/sales',
  REPORTS: '/dashboard/reports',
  NOTIFICATIONS: '/dashboard/notifications',
  PROFILE: '/dashboard/profile',
  SETTINGS: '/dashboard/settings',
};

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
  GOOGLE_LOGIN: '/auth/google',

  // Medicines
  GET_MEDICINES: '/medicines',
  GET_MEDICINE: (id) => `/medicines/${id}`,
  CREATE_MEDICINE: '/medicines',
  UPDATE_MEDICINE: (id) => `/medicines/${id}`,
  DELETE_MEDICINE: (id) => `/medicines/${id}`,

  // Batches
  GET_BATCHES: '/batches',
  GET_BATCH: (id) => `/batches/${id}`,
  CREATE_BATCH: '/batches',
  UPDATE_BATCH: (id) => `/batches/${id}`,
  DELETE_BATCH: (id) => `/batches/${id}`,

  // Purchases
  GET_PURCHASES: '/purchases',
  GET_PURCHASE: (id) => `/purchases/${id}`,
  CREATE_PURCHASE: '/purchases',
  UPDATE_PURCHASE: (id) => `/purchases/${id}`,
  DELETE_PURCHASE: (id) => `/purchases/${id}`,

  // Sales
  GET_SALES: '/sales',
  GET_SALE: (id) => `/sales/${id}`,
  CREATE_SALE: '/sales',
  UPDATE_SALE: (id) => `/sales/${id}`,
  DELETE_SALE: (id) => `/sales/${id}`,

  // Reports
  GET_REPORTS: '/reports',
  GET_INVENTORY_REPORT: '/reports/inventory',
  GET_SALES_REPORT: '/reports/sales',

  // Notifications
  GET_NOTIFICATIONS: '/notifications',
  MARK_NOTIFICATION_READ: (id) => `/notifications/${id}/read`,
};

export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  STAFF: 'staff',
};

export const MEDICINE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DISCONTINUED: 'discontinued',
};

export const BATCH_STATUS = {
  AVAILABLE: 'available',
  LOW_STOCK: 'low_stock',
  EXPIRED: 'expired',
  OUT_OF_STOCK: 'out_of_stock',
};
