// src/lib/api/config.ts
/**
 * API Configuration — Kenya Production
 * All Swagger Endpoints + Base URL
 */
export const API_BASE_URL = 'https://mag-backend-0gn4.onrender.com/api/v1';

export const API_ENDPOINTS = {
  // === AUTH ===
  LOGIN: '/auth/login',
  REFRESH_TOKEN: '/auth/refresh',
  GET_ME: '/auth/me',
  LOGOUT: '/auth/logout',

  // === OPPORTUNITIES ===
  OPPORTUNITIES: '/opportunities',
  OPPORTUNITIES_OVERVIEW: '/opportunities/overview',
  OPPORTUNITY_BY_ID: (id: string) => `/opportunities/${id}`,

  // === CONTACTS ===
  CONTACTS: '/contacts',
  CONTACT_BY_ID: (id: string) => `/contacts/${id}`,

  // === WORK ORDERS ===
  WORK_ORDERS: '/work-orders',
  WORK_ORDER_BY_ID: (id: string) => `/work-orders/${id}`,

  // === QUOTES ===
  QUOTES: '/quotes',
  QUOTE_BY_ID: (id: string) => `/quotes/${id}`,

  // === REPORTS ===
  REPORTS_SUMMARY: '/reports/summary',
  REPORTS_REVENUE: '/reports/revenue',
  REPORTS_PERFORMANCE: '/reports/performance',

  // === SETTINGS ===
  SETTINGS: '/settings',
  SETTINGS_PROFILE: '/settings/profile',
  SETTINGS_NOTIFICATIONS: '/settings/notifications',

  // === NOTIFICATIONS ===
  NOTIFICATIONS: '/notifications',
  NOTIFICATIONS_UNREAD_COUNT: '/notifications/unread-count',

  // === UPLOADS ===
  UPLOAD_FILE: '/uploads',
} as const;