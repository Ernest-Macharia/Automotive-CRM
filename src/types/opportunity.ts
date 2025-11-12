// src/types/opportunity.ts
export type Opportunity = {
  id: string;
  subject: string;
  customerName: string;
  contactEmail: string;
  contactPhone?: string;
  type: 'lead' | 'deal';
  status: 'open' | 'won' | 'lost' | 'abandoned';
  value: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateOpportunityData = {
  subject: string;
  customerName: string;
  contactEmail: string;
  contactPhone?: string;
  type: 'lead' | 'deal';
  value: number;
  currency?: string;
};

export type OpportunityOverview = {
  total: number;
  byType: { lead: number; deal: number };
  byStatus: { open: number; won: number; lost: number; abandoned: number };
  totalValue: number;
  currency: string;
};