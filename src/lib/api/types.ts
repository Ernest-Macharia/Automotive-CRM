/**
 * MAG CRM — Full TypeScript Types
 * Synced with Swagger[](https://mag-backend-0gn4.onrender.com/api/v1)
 * All entities, enums, and nested structures
 */

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  active: boolean;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

// AUTH
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// OPPORTUNITIES
export type OpportunityType = 'individual' | 'organization';
export type OpportunitySource = 
  | 'manual' 
  | 'referral' 
  | 'website' 
  | 'email' 
  | 'phone' 
  | 'social_media'
  | 'walk_in'; // ✅ ADDED: Based on your request
export type OpportunityStatus = 
  | 'open' 
  | 'in_progress' 
  | 'won' 
  | 'lost' 
  | 'qualified' 
  | 'negotiation' 
  | 'closed'
  | 'new'; // ✅ ADDED: Based on your response

export interface OpportunityCustomer {
  _id?: string; // ✅ ADDED: Based on response
  name: string;
  email: string;
  phone: string;
  companyName?: string;
}

export interface OpportunityVehicle {
  _id: string; // ✅ ADDED: Based on response
  vin: string; // ✅ CHANGED: from id to vin
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  opportunityId?: string; // ✅ ADDED: Based on response
  ownerId?: string; // ✅ ADDED: Based on response
  active?: boolean; // ✅ ADDED: Based on response
  createdAt?: string; // ✅ ADDED: Based on response
  updatedAt?: string; // ✅ ADDED: Based on response
}

// ✅ UPDATED: JobCard interface to match response
export interface JobCard {
  _id: string;
  opportunityId: string;
  vehicleId: string;
  createdBy: string;
  jobTitle: string;
  jobDescription: string;
  status: 'pending' | 'in_progress' | 'completed';
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ✅ UPDATED: Waiver interface to match response
export interface Waiver {
  _id: string;
  opportunityId: string;
  vehicleId: string;
  type: string; // ✅ ADDED: Based on response
  reason: string;
  createdBy: string; // ✅ ADDED: Based on response
  status: 'pending' | 'signed' | 'declined';
  active: boolean; // ✅ ADDED: Based on response
  signedBy?: User;
  dateSigned?: string;
  createdAt: string;
  updatedAt: string; // ✅ ADDED: Based on response
}

export interface Opportunity {
  _id: string;
  type: OpportunityType;
  subject: string;
  source: OpportunitySource;
  status: OpportunityStatus;
  customer: OpportunityCustomer;
  assignedTo: User | null; // ✅ UPDATED: Can be null based on response
  vehicles: OpportunityVehicle[];
  waivers: Waiver[];
  jobCards: JobCard[];
  quotes: Quote[];
  invoices: Invoice[];
  payments: Payment[];
  createdAt: string;
  updatedAt: string;
  __v?: number; // ✅ ADDED: Based on response
}

// ✅ UPDATED: CreateOpportunityData to match your request structure
export interface CreateOpportunityData {
  type: OpportunityType;
  subject: string;
  source: OpportunitySource;
  customer: {
    name: string;
    email: string;
    phone: string;
    companyName?: string;
  };
  assignedTo?: string;
  vehicles: Array<{
    vin: string;
    registrationNumber: string;
    make: string;
    model: string;
    year: number;
    color: string;
  }>;
  jobCards: Array<{
    jobTitle: string;
    jobDescription: string;
  }>;
  waivers: Array<{
    type: string;
    reason: string;
  }>;
  quotes: Array<{
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
    totalAmount: number;
    notes?: string;
  }>;
}

// ✅ ADDED: CreateOpportunityResponse interface based on your response
export interface CreateOpportunityResponse {
  _id: string;
  type: OpportunityType;
  subject: string;
  source: OpportunitySource;
  status: OpportunityStatus;
  customer: OpportunityCustomer;
  vehicles: OpportunityVehicle[];
  jobCards: JobCard[];
  waivers: Waiver[];
  quotes: Quote[];
  assignedTo: User | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// CONTACTS
export interface Contact {
  _id: string;
  name: string;
  email: string;
  phone: string;
  companyName?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

// VEHICLES
export interface Vehicle {
  _id: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  vin?: string;
  mileage?: number;
  customerId: string;
  createdAt: string;
  updatedAt: string;
}

// QUOTES
export interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Quote {
  _id: string;
  quoteNumber: string;
  opportunityId: string;
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  validUntil?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// INVOICES
export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  opportunityId: string;
  quoteId?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: 'unpaid' | 'partially_paid' | 'paid';
  dueDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// PAYMENTS
export interface Payment {
  _id: string;
  receiptNumber: string;
  invoiceId: string;
  amountPaid: number;
  method: 'cash' | 'mobile_money' | 'bank_transfer' | 'card';
  referenceNumber?: string;
  notes?: string;
  balanceRemaining: number;
  createdAt: string;
}

// WORK ORDERS
export interface WorkOrder {
  _id: string;
  title: string;
  opportunityId: string;
  vehicleId: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo: User;
  estimatedHours?: number;
  actualHours?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// JOB CARDS - Already defined above

// WAIVERS - Already defined above

// BLUEPRINTS
export interface BlueprintStageAction {
  actionType: string;
  params: Record<string, unknown>;
}

export interface BlueprintStage {
  id?: string;
  name: string;
  order: number;
  allowedRoles: string[];
  entryActions: BlueprintStageAction[];
  exitActions: BlueprintStageAction[];
}

export interface Blueprint {
  _id: string;
  name: string;
  module: string;
  stages: BlueprintStage[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// TRANSITIONS
export interface Transition {
  fromStage: string;
  toStage: string;
  allowedRoles: string[];
  conditions?: Record<string, unknown>;
}

// NOTIFICATIONS
export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  recipient: string;
  read: boolean;
  relatedModule: string;
  relatedId: string;
  createdAt: string;
}

// REPORTS
export interface ReportSummary {
  opportunitiesCount: number;
  quotesCount: number;
  invoicesCount: number;
  totalPayments: number;
  totalOutstanding: number;
  jobcardsCount: number;
  waiversCount: number;
  vehiclesCount: number;
}

export interface RevenueTimelinePoint {
  date: string;
  amount: number;
}

export interface OpportunitySourceReport {
  source: string;
  count: number;
}

export interface SalesPerformance {
  totalOpportunities: number;
  totalQuotes: number;
  totalInvoices: number;
  totalPaid: number;
  conversion: {
    opportunitiesToQuotes: number;
    quotesToInvoices: number;
  };
}

export interface TopCustomer {
  opportunityId: string;
  customer: {
    name: string;
    email: string;
  };
  totalInvoiced: number;
  totalPaid: number;
  invoicesCount: number;
}

export interface DashboardReport {
  title: string;
  period: string;
  totals: {
    opportunities: number;
    quotes: number;
    invoices: number;
    payments: number;
    outstanding: number;
  };
  conversions: {
    opportunitiesToQuotes: number;
    quotesToInvoices: number;
  };
  revenue: {
    total: number;
    timeline: RevenueTimelinePoint[];
  };
  topCustomers: TopCustomer[];
}

// UPLOADS
export interface UploadedFile {
  _id: string;
  filename: string;
  url: string;
  mimetype: string;
  size: number;
  uploadedBy: string;
  createdAt: string;
}

// ✅ ADDITIONAL TYPES for better type safety
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}