// src/lib/api/types.ts
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
  | 'social_media';
export type OpportunityStatus =
  | 'open'
  | 'in_progress'
  | 'won'
  | 'lost'
  | 'qualified'
  | 'negotiation'
  | 'closed';

export interface OpportunityCustomer {
  name: string;
  email: string;
  phone: string;
  companyName?: string;
}

export interface OpportunityVehicle {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  color?: string;
}

export interface Opportunity {
  _id: string;
  type: OpportunityType;
  subject: string;
  source: OpportunitySource;
  status: OpportunityStatus;
  customer: OpportunityCustomer;
  assignedTo: User;
  vehicles: OpportunityVehicle[];
  waivers: Waiver[];
  jobCards: JobCard[];
  quotes: Quote[];
  invoices: Invoice[];
  payments: Payment[];
  createdAt: string;
  updatedAt: string;
}

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
  assignedTo: string;
  vehicles: Array<{
    registrationNumber: string;
    make: string;
    model: string;
    year: number;
  }>;
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

// WAIVERS
export interface Waiver {
  _id: string;
  reason: string;
  opportunityId: string;
  vehicleId: string;
  status: 'pending' | 'signed' | 'declined';
  signedBy?: User;
  dateSigned?: string;
  createdAt: string;
}

// JOB CARDS
export interface JobCard {
  _id: string;
  jobTitle: string;
  opportunityId: string;
  vehicleId: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo: User;
  partsUsed?: Array<{
    name: string;
    quantity: number;
    cost: number;
  }>;
  laborHours: number;
  laborRate: number;
  totalCost: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// BLUEPRINTS
export interface BlueprintStageAction {
  actionType: string;
  params: Record<string, any>;
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
  conditions?: Record<string, any>;
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