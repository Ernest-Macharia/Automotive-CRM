// src/types/opportunity.ts
export type OpportunityStatus = 'new' | 'qualified' | 'proposal' | 'closed';

export type OpportunitySource = 'web' | 'email' | 'call' | 'walk_in' | 'referral' | 'partner';

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

export interface User {
  id: string;
  email: string;
  role: string;
  active: boolean;
  name: string;
}

export interface Opportunity {
  id: string;
  type: 'individual' | 'organization';
  subject: string;
  source: OpportunitySource;
  status: OpportunityStatus;
  customer: Customer;
  assignedTo: User; 
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

export interface OpportunityOverview {
  total: number;
  new: number;
  qualified: number;
  proposal: number;
  closed: number;
  conversion_rate: number;
  totalValue?: number;
  currency?: string;
  byType?: {
    deal?: number;
  };
}

export interface PipelineStats {
  total: number;
  open: number;
  in_progress: number;
  won: number;
  lost: number;
  conversion_rate: number;
}