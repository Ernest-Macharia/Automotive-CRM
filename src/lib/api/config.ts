// src/lib/api/config.ts

// Base URL now includes /api/v1 to match backend routes
export const API_BASE_URL = 'https://mag-backend-0gn4.onrender.com/api/v1';

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: '/auth/login',
  REFRESH_TOKEN: '/auth/refresh',
  GET_ME: '/auth/me',
  
  // Users
  USERS: '/users',
  
  // Opportunities
  OPPORTUNITIES: '/opportunities',
  OPPORTUNITIES_OVERVIEW: '/opportunities/overview',
  OPPORTUNITY_BY_ID: (id: string) => `/opportunities/${id}`,
  
  // Vehicles
  VEHICLES: '/vehicles',
  VEHICLE_BY_ID: (id: string) => `/vehicles/${id}`,
  VEHICLES_BY_OPPORTUNITY: (opportunityId: string) => `/vehicles/opportunity/${opportunityId}`,
  
  // Quotes
  QUOTES: '/quotes',
  QUOTE_BY_ID: (id: string) => `/quotes/${id}`,
  APPROVE_QUOTE: (id: string) => `/quotes/${id}/approve`,
  
  // Invoices
  INVOICES: '/invoices',
  INVOICE_BY_ID: (id: string) => `/invoices/${id}`,
  INVOICE_FROM_QUOTE: (quoteId: string) => `/invoices/from-quote/${quoteId}`,
  INVOICES_BY_OPPORTUNITY: (opportunityId: string) => `/invoices/opportunity/${opportunityId}`,
  APPROVE_INVOICE: (id: string) => `/invoices/${id}/approve`,
  PAY_INVOICE: (id: string) => `/invoices/${id}/pay`,
  
  // Payments
  PAYMENTS: '/payments',
  
  // Job Cards
  JOB_CARDS: '/jobcards',
  JOB_CARD_BY_ID: (id: string) => `/jobcards/${id}`,
  JOB_CARDS_BY_VEHICLE: (vehicleId: string) => `/jobcards/vehicle/${vehicleId}`,
  
  // Waivers
  WAIVERS: '/waivers',
  WAIVER_BY_ID: (id: string) => `/waivers/${id}`,
  WAIVERS_BY_VEHICLE: (vehicleId: string) => `/waivers/vehicle/${vehicleId}`,
  SIGN_WAIVER: (id: string) => `/waivers/${id}/sign`,
  
  // Notifications
  NOTIFICATIONS: '/notifications',
  MY_NOTIFICATIONS: '/notifications/me',
  
  // Roles
  ROLES: '/roles',
  SEED_ROLES: '/roles/seed',
};
