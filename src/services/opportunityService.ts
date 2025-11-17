// src/services/opportunityService.ts
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import {
  Opportunity,
  CreateOpportunityData,
  OpportunityOverview,
  OpportunityStatus, // ← IMPORT THIS
} from '@/types/opportunity';

export const opportunityService = {
  // GET ALL
  async getOpportunities(): Promise<Opportunity[]> {
    return apiClient.get<Opportunity[]>(API_ENDPOINTS.OPPORTUNITIES);
  },

  // GET ONE
  async getOpportunity(id: string): Promise<Opportunity> {
    return apiClient.get<Opportunity>(API_ENDPOINTS.OPPORTUNITY_BY_ID(id));
  },

  // CREATE
  async createOpportunity(data: CreateOpportunityData): Promise<Opportunity> {
    return apiClient.post<CreateOpportunityData, Opportunity>(API_ENDPOINTS.OPPORTUNITIES, data);
  },

  // UPDATE
  async updateOpportunity(
    id: string,
    data: Partial<CreateOpportunityData>
  ): Promise<Opportunity> {
    return apiClient.patch<Partial<CreateOpportunityData>, Opportunity>(
      API_ENDPOINTS.OPPORTUNITY_BY_ID(id),
      data
    );
  },

  // DELETE
  async deleteOpportunity(id: string): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.OPPORTUNITY_BY_ID(id));
  },

  // OVERVIEW
  async getOverview(): Promise<OpportunityOverview> {
    return apiClient.get<OpportunityOverview>(API_ENDPOINTS.OPPORTUNITIES_OVERVIEW);
  },

  // UPDATE STATUS — **TYPE-SAFE**
  async updateStatus(id: string, status: OpportunityStatus): Promise<Opportunity> {
    return apiClient.patch<{ status: OpportunityStatus }, Opportunity>(
      API_ENDPOINTS.OPPORTUNITY_BY_ID(id),
      { status }
    );
  },
};