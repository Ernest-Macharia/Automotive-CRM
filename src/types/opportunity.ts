// src/types/opportunity.ts
export type OpportunityStatus = 'open' | 'in_progress' | 'won' | 'lost';

export interface Customer {
  name: string;
  email: string;
  phone: string;
  companyName?: string;
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  color?: string;
}

export interface Waiver {
  id: string;
  reason: string;
  status: 'pending' | 'signed' | 'declined';
  signedBy?: string;
  dateSigned?: string;
}

export interface JobCard {
  id: string;
  jobTitle: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo?: string;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  totalAmount: number;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: 'unpaid' | 'partially_paid' | 'paid';
}

export interface Payment {
  id: string;
  receiptNumber: string;
  amountPaid: number;
  method: 'cash' | 'mobile_money' | 'bank_transfer' | 'card';
  balanceRemaining: number;
}

export interface Opportunity {
  id: string;
  type: 'individual' | 'organization';
  subject: string;
  source: string;
  status: OpportunityStatus;
  customer: Customer;
  assignedTo: {
    id: string;
    email: string;
    role: string;
    active: boolean;
  };
  vehicles: Vehicle[];
  waivers: Waiver[];
  jobCards: JobCard[];
  quotes: Quote[];
  invoices: Invoice[];
  payments: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOpportunityData {
  type: 'individual' | 'organization';
  subject: string;
  source: string;
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

export interface OpportunityOverview {
  total: number;
  open: number;
  in_progress: number;
  won: number;
  lost: number;
  conversion_rate: number;
}