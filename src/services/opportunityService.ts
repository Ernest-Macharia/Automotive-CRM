// src/services/opportunityService.ts
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { Opportunity, CreateOpportunityData, OpportunityOverview } from '@/types/opportunity';

export const opportunityService = {
  // Get all opportunities
  async getOpportunities(): Promise<Opportunity[]> {
    return await apiClient.get<Opportunity[]>(API_ENDPOINTS.OPPORTUNITIES);
  },

  // Get opportunity by ID
  async getOpportunity(id: string): Promise<Opportunity> {
    return await apiClient.get<Opportunity>(API_ENDPOINTS.OPPORTUNITY_BY_ID(id));
  },

  // Create new opportunity
  async createOpportunity(data: CreateOpportunityData): Promise<Opportunity> {
    return await apiClient.post<CreateOpportunityData, Opportunity>(API_ENDPOINTS.OPPORTUNITIES, data);
  },

  // Update opportunity
  async updateOpportunity(id: string, data: Partial<CreateOpportunityData>): Promise<Opportunity> {
    return await apiClient.patch<Partial<CreateOpportunityData>, Opportunity>(API_ENDPOINTS.OPPORTUNITY_BY_ID(id), data);
  },

  // Delete opportunity
  async deleteOpportunity(id: string): Promise<void> {
    return await apiClient.delete(API_ENDPOINTS.OPPORTUNITY_BY_ID(id));
  },

  // Get opportunities overview
  async getOverview(): Promise<OpportunityOverview> {
    return await apiClient.patch<{ status: string }, Opportunity>(API_ENDPOINTS.OPPORTUNITY_BY_ID(id), { status });
  },

  // Update opportunity status
  async updateStatus(id: string, status: string): Promise<Opportunity> {
    return await apiClient.patch<Opportunity>(API_ENDPOINTS.OPPORTUNITY_BY_ID(id), { status });
  }
};

function id(id: any): any {
throw new Error('Function not implemented.');
}
