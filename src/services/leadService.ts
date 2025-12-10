// services/leadService.ts
import { apiClient } from '@/lib/api/client';

// In your leadService.ts, update the CreateLeadData interface
export interface CreateLeadData {
  name: string;
  email: string;
  phone: string;
  type: 'individual' | 'organization';
  companyName?: string;
  source: string;
  notes?: string;
  opportunityId?: string;
  address?: string;
  city?: string;
  stage?: string;
  sourceDetails?: string;
  prospectingReason?: string;
  gender?: string;
  firstName?: string;
  lastName?: string;
  productsInterested?: string[];
  vehicleInfo?: any;
  leadOwner?: string;
}

export interface Lead {
  _id: string;
  name: string;
  email: string;
  phone: string;
  type: 'individual' | 'organization';
  companyName?: string;
  source: string;
  status: string;
  notes?: string;
  opportunityId?: string;
  createdAt: string;
  updatedAt: string;
}

class LeadService {
  async createLead(data: CreateLeadData): Promise<Lead> {
    try {
      return await apiClient.post<CreateLeadData, Lead>('/leads', data);
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  }

  async getOpportunityLeads(opportunityId: string): Promise<Lead[]> {
    try {
      return await apiClient.get<Lead[]>(`/opportunities/${opportunityId}/leads`);
    } catch (error) {
      console.error('Error fetching opportunity leads:', error);
      throw error;
    }
  }

  async checkLeadExists(opportunityId: string): Promise<boolean> {
    try {
      const leads = await this.getOpportunityLeads(opportunityId);
      return leads && leads.length > 0;
    } catch (error) {
      console.error('Error checking lead existence:', error);
      return false;
    }
  }

  async getLeadById(id: string): Promise<Lead> {
    try {
      return await apiClient.get<Lead>(`/leads/${id}`);
    } catch (error) {
      console.error(`Error fetching lead ${id}:`, error);
      throw error;
    }
  }

  async updateLead(id: string, data: Partial<CreateLeadData>): Promise<Lead> {
    try {
      return await apiClient.patch<Partial<CreateLeadData>, Lead>(`/leads/${id}`, data);
    } catch (error) {
      console.error(`Error updating lead ${id}:`, error);
      throw error;
    }
  }

  async deleteLead(id: string): Promise<void> {
    try {
      await apiClient.delete(`/leads/${id}`);
    } catch (error) {
      console.error(`Error deleting lead ${id}:`, error);
      throw error;
    }
  }

  async searchLeads(query: string): Promise<Lead[]> {
    try {
      return await apiClient.get<Lead[]>(`/leads/search?q=${encodeURIComponent(query)}`);
    } catch (error) {
      console.error('Error searching leads:', error);
      throw error;
    }
  }
}

export const leadService = new LeadService();