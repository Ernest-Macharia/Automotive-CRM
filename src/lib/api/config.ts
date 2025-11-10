// src/lib/api/config.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mag-backend-0gn4.onrender.com/api/v1';

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REFRESH_TOKEN: '/auth/refresh',
    GET_ME: '/auth/me',
  },
  
  // Users
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
  },
  
  // Opportunities
  OPPORTUNITIES: {
    BASE: '/opportunities',
    OVERVIEW: '/opportunities/overview',
    BY_ID: (id: string) => `/opportunities/${id}`,
  },
  
  // Vehicles
  VEHICLES: {
    BASE: '/vehicles',
    BY_ID: (id: string) => `/vehicles/${id}`,
    BY_OPPORTUNITY: (opportunityId: string) => `/vehicles/opportunity/${opportunityId}`,
  },
  
  // Quotes
  QUOTES: {
    BASE: '/quotes',
    BY_ID: (id: string) => `/quotes/${id}`,
    APPROVE: (id: string) => `/quotes/${id}/approve`,
  },
  
  // Invoices
  INVOICES: {
    BASE: '/invoices',
    BY_ID: (id: string) => `/invoices/${id}`,
    FROM_QUOTE: (quoteId: string) => `/invoices/from-quote/${quoteId}`,
    BY_OPPORTUNITY: (opportunityId: string) => `/invoices/opportunity/${opportunityId}`,
    APPROVE: (id: string) => `/invoices/${id}/approve`,
    PAY: (id: string) => `/invoices/${id}/pay`,
  },
  
  // Payments
  PAYMENTS: {
    BASE: '/payments',
  },
  
  // Job Cards
  JOB_CARDS: {
    BASE: '/jobcards',
    BY_ID: (id: string) => `/jobcards/${id}`,
    BY_VEHICLE: (vehicleId: string) => `/jobcards/vehicle/${vehicleId}`,
  },
  
  // Waivers
  WAIVERS: {
    BASE: '/waivers',
    BY_ID: (id: string) => `/waivers/${id}`,
    BY_VEHICLE: (vehicleId: string) => `/waivers/vehicle/${vehicleId}`,
    SIGN: (id: string) => `/waivers/${id}/sign`,
  },
  
  // Notifications
  NOTIFICATIONS: {
    BASE: '/notifications',
    MY_NOTIFICATIONS: '/notifications/me',
  },
  
  // Roles
  ROLES: {
    BASE: '/roles',
    SEED: '/roles/seed',
  },
} as const;

export const buildUrl = (
  endpoint: string, 
  params?: Record<string, string | number | boolean>
): string => {
  if (!params) return endpoint;
  
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `${endpoint}?${queryString}` : endpoint;
};