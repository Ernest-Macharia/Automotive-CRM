// src/types/opportunity.ts
export interface Opportunity {
  id: string;
  title?: string;
  description?: string;
  status: 'open' | 'in_progress' | 'won' | 'lost' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  value?: number;
  customer?: Customer;
  vehicles?: Vehicle[];
  quotes?: Quote[];
  invoices?: Invoice[];
  jobCards?: JobCard[];
  createdBy?: User;
  assignedTo?: User;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  licensePlate?: string;
  color?: string;
  mileage?: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  totalAmount: number;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  items: QuoteItem[];
  createdAt: string;
}

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: 'pending' | 'partially_paid' | 'paid' | 'overdue';
  dueDate: string;
  createdAt: string;
}

export interface JobCard {
  id: string;
  jobNumber: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedMechanic?: string;
  estimatedHours?: number;
  actualHours?: number;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface CreateOpportunityData {
  title: string;
  description?: string;
  customerId?: string;
  vehicleId?: string;
  priority: 'low' | 'medium' | 'high';
  value?: number;
  dueDate?: string;
}

export interface OpportunityOverview {
  total: number;
  byStatus: {
    open: number;
    in_progress: number;
    won: number;
    lost: number;
    cancelled: number;
  };
  byPriority: {
    low: number;
    medium: number;
    high: number;
  };
  recent: Opportunity[];
  totalValue: number;
}