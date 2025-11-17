// src/lib/api/config.ts
/**
 * API Configuration — Kenya Production
 * All Swagger Endpoints + Base URL
 * Fully synced with MAG Backend
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

  // === INVOICES ===
  INVOICES: '/invoices',
  INVOICE_BY_ID: (id: string) => `/invoices/${id}`,
  INVOICE_FROM_QUOTE: (quoteId: string) => `/invoices/from-quote/${quoteId}`,

  // === PAYMENTS ===
  PAYMENTS: '/payments',
  PAYMENT_BY_ID: (id: string) => `/payments/${id}`,

  // === VEHICLES ===
  VEHICLES: '/vehicles',
  VEHICLE_BY_ID: (id: string) => `/vehicles/${id}`,
  VEHICLES_BY_OPPORTUNITY: (oppId: string) => `/vehicles/opportunity/${oppId}`,

  // === WAIVERS ===
  WAIVERS: '/waivers',
  WAIVER_BY_ID: (id: string) => `/waivers/${id}`,
  WAIVERS_BY_VEHICLE: (vehicleId: string) => `/waivers/vehicle/${vehicleId}`,

  // === JOB CARDS ===
  JOB_CARDS: '/jobcards',
  JOB_CARD_BY_ID: (id: string) => `/jobcards/${id}`,
  JOB_CARDS_BY_VEHICLE: (vehicleId: string) => `/jobcards/vehicle/${vehicleId}`,

  // === REPORTS ===
  REPORTS_SUMMARY: '/reports/summary',
  REPORTS_REVENUE: '/reports/revenue-timeline',
  REPORTS_PERFORMANCE: '/reports/sales-performance',
  REPORTS_TOP_CUSTOMERS: '/reports/top-customers',
  REPORTS_OPPORTUNITY_SOURCES: '/reports/opportunity-sources',

  // === BLUEPRINTS === FIXED: Remove /api/v1
  BLUEPRINTS: '/blueprints',
  BLUEPRINT_BY_ID: (id: string) => `/blueprints/${id}`,

  // === NOTIFICATIONS ===
  NOTIFICATIONS: '/notifications',
  NOTIFICATIONS_ME: '/notifications/me',

  // === UPLOADS ===
  UPLOAD_FILE: '/uploads',

  // === TRANSITIONS ===
  TRANSITIONS: '/transitions',
  TRANSITION_BY_MODULE_AND_ID: (module: string, id: string) => `/transitions/${module}/${id}`,
} as const;