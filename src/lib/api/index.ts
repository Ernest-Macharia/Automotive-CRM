// src/lib/api/index.ts
import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import type {
  Opportunity, CreateOpportunityData,
  Contact, Vehicle, Quote, Invoice, Payment,
  WorkOrder, Waiver, JobCard,
  Blueprint, Transition, ReportSummary
} from './types';

export const api = {
  // AUTH
  auth: {
    login: (email: string, password: string) =>
      apiClient.post(API_ENDPOINTS.LOGIN, { email, password }),
    me: () => apiClient.get(API_ENDPOINTS.GET_ME),
  },

  // OPPORTUNITIES
  opportunities: {
    list: () => apiClient.get<Opportunity[]>(API_ENDPOINTS.OPPORTUNITIES),
    overview: () => apiClient.get(API_ENDPOINTS.OPPORTUNITIES_OVERVIEW),
    get: (id: string) => apiClient.get<Opportunity>(API_ENDPOINTS.OPPORTUNITY_BY_ID(id)),
    create: (data: CreateOpportunityData) =>
      apiClient.post<Opportunity>(API_ENDPOINTS.OPPORTUNITIES, data),
    update: (id: string, data: Partial<Opportunity>) =>
      apiClient.patch<Opportunity>(API_ENDPOINTS.OPPORTUNITY_BY_ID(id), data),
    delete: (id: string) => apiClient.delete(API_ENDPOINTS.OPPORTUNITY_BY_ID(id)),
  },

  // CONTACTS
  contacts: {
    list: () => apiClient.get<Contact[]>(API_ENDPOINTS.CONTACTS),
    get: (id: string) => apiClient.get<Contact>(API_ENDPOINTS.CONTACT_BY_ID(id)),
  },

  // WORK ORDERS
  workOrders: {
    list: () => apiClient.get<WorkOrder[]>(API_ENDPOINTS.WORK_ORDERS),
    get: (id: string) => apiClient.get<WorkOrder>(API_ENDPOINTS.WORK_ORDER_BY_ID(id)),
  },

  // QUOTES
  quotes: {
    list: () => apiClient.get<Quote[]>(API_ENDPOINTS.QUOTES),
    get: (id: string) => apiClient.get<Quote>(API_ENDPOINTS.QUOTE_BY_ID(id)),
  },

  // INVOICES
  invoices: {
    list: () => apiClient.get<Invoice[]>(API_ENDPOINTS.INVOICES),
    get: (id: string) => apiClient.get<Invoice>(API_ENDPOINTS.INVOICE_BY_ID(id)),
    fromQuote: (quoteId: string) =>
      apiClient.post<Invoice>(API_ENDPOINTS.INVOICE_FROM_QUOTE(quoteId)),
  },

  // PAYMENTS
  payments: {
    list: () => apiClient.get<Payment[]>(API_ENDPOINTS.PAYMENTS),
    get: (id: string) => apiClient.get<Payment>(API_ENDPOINTS.PAYMENT_BY_ID(id)),
  },

  // VEHICLES
  vehicles: {
    list: () => apiClient.get<Vehicle[]>(API_ENDPOINTS.VEHICLES),
    get: (id: string) => apiClient.get<Vehicle>(API_ENDPOINTS.VEHICLE_BY_ID(id)),
    byOpportunity: (oppId: string) =>
      apiClient.get<Vehicle[]>(API_ENDPOINTS.VEHICLES_BY_OPPORTUNITY(oppId)),
  },

  // WAIVERS
  waivers: {
    list: () => apiClient.get<Waiver[]>(API_ENDPOINTS.WAIVERS),
    get: (id: string) => apiClient.get<Waiver>(API_ENDPOINTS.WAIVER_BY_ID(id)),
    byVehicle: (vehicleId: string) =>
      apiClient.get<Waiver[]>(API_ENDPOINTS.WAIVERS_BY_VEHICLE(vehicleId)),
  },

  // JOB CARDS
  jobCards: {
    list: () => apiClient.get<JobCard[]>(API_ENDPOINTS.JOB_CARDS),
    get: (id: string) => apiClient.get<JobCard>(API_ENDPOINTS.JOB_CARD_BY_ID(id)),
    byVehicle: (vehicleId: string) =>
      apiClient.get<JobCard[]>(API_ENDPOINTS.JOB_CARDS_BY_VEHICLE(vehicleId)),
  },

  // BLUEPRINTS
  blueprints: {
    list: () => apiClient.get<Blueprint[]>(API_ENDPOINTS.BLUEPRINTS),
    get: (id: string) => apiClient.get<Blueprint>(API_ENDPOINTS.BLUEPRINT_BY_ID(id)),
  },

  // NOTIFICATIONS
  notifications: {
    me: () => apiClient.get<any[]>(API_ENDPOINTS.NOTIFICATIONS_ME),
  },

  // UPLOADS
  uploads: {
    file: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return apiClient.post(API_ENDPOINTS.UPLOAD_FILE, form);
    },
  },

  // TRANSITIONS
  transitions: {
    get: (module: string, recordId: string) =>
      apiClient.get<Transition[]>(API_ENDPOINTS.TRANSITION_BY_MODULE_AND_ID(module, recordId)),
  },

  // REPORTS
  reports: {
    summary: () => apiClient.get<ReportSummary>(API_ENDPOINTS.REPORTS_SUMMARY),
    revenue: () => apiClient.get(API_ENDPOINTS.REPORTS_REVENUE),
    performance: () => apiClient.get(API_ENDPOINTS.REPORTS_PERFORMANCE),
    topCustomers: () => apiClient.get(API_ENDPOINTS.REPORTS_TOP_CUSTOMERS),
    opportunitySources: () => apiClient.get(API_ENDPOINTS.REPORTS_OPPORTUNITY_SOURCES),
  },
};