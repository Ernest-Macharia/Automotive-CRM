import { apiClient } from '@/lib/api/client';

export interface Opportunity {
  _id: string;
  id: string;
  type: 'individual' | 'organization';
  subject: string;
  status: 'new' | 'contacted' | 'qualified' | 'quotation' | 'won' | 'lost';
  source?: string;
  customer: {
    name: string;
    email?: string;
    companyName?: string;
    phone?: string;
    _id: string;
    id: string;
  };
  vehicles: any[];
  jobCards: any[];
  waivers: any[];
  quotes: any[];
  assignedTo: any | null;
  createdAt: string;
  updatedAt: string;
  isNurturing: boolean;
  leadScore?: {
    totalScore: number;
    tier: 'hot' | 'warm' | 'cold';
    priority: number;
    lastCalculated: string;
  };
  scoreHistory?: Array<{
    date: string;
    score: number;
    tier: string;
    reason: string;
  }>;
}

export interface CreateOpportunityData {
  type: 'individual' | 'organization';
  subject: string;
  status: 'new' | 'contacted' | 'qualified' | 'quotation' | 'won' | 'lost';
  source?: string;
  customer: {
    name: string;
    email?: string;
    companyName?: string;
    phone?: string;
  };
}

export interface UpdateOpportunityData {
  subject?: string;
  status?: 'new' | 'contacted' | 'qualified' | 'quotation' | 'won' | 'lost';
  source?: string;
  assignedTo?: string;
}

export interface OpportunitiesResponse {
  data: Opportunity[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface OpportunityStats {
  total: number;
  byStatus: Record<string, number>;
  byTier: Record<string, number>;
  hotLeads: number;
}

class OpportunityService {
  async getAllOpportunities(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<OpportunitiesResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.search) queryParams.append('search', params.search);

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/opportunities?${queryString}` : '/opportunities';
      
      return await apiClient.get<OpportunitiesResponse>(endpoint);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      throw error;
    }
  }

  async getOpportunityById(id: string): Promise<Opportunity> {
    try {
      return await apiClient.get<Opportunity>(`/opportunities/${id}`);
    } catch (error) {
      console.error(`Error fetching opportunity ${id}:`, error);
      throw error;
    }
  }

  async createOpportunity(data: CreateOpportunityData): Promise<Opportunity> {
    try {
      return await apiClient.post<CreateOpportunityData, Opportunity>('/opportunities', data);
    } catch (error) {
      console.error('Error creating opportunity:', error);
      throw error;
    }
  }

  async updateOpportunity(id: string, data: UpdateOpportunityData): Promise<Opportunity> {
    try {
      return await apiClient.patch<UpdateOpportunityData, Opportunity>(`/opportunities/${id}`, data);
    } catch (error) {
      console.error(`Error updating opportunity ${id}:`, error);
      throw error;
    }
  }

  async deleteOpportunity(id: string): Promise<void> {
    try {
      await apiClient.delete(`/opportunities/${id}`);
    } catch (error) {
      console.error(`Error deleting opportunity ${id}:`, error);
      throw error;
    }
  }

  async getOpportunitiesOverview(): Promise<OpportunityStats> {
    try {
      return await apiClient.get<OpportunityStats>('/opportunities/overview');
    } catch (error) {
      console.error('Error fetching opportunities overview:', error);
      throw error;
    }
  }

  async getAvailableSalesReps() {
    try {
      return await apiClient.get('/opportunities/sales-reps/available');
    } catch (error) {
      console.error('Error fetching available sales reps:', error);
      throw error;
    }
  }

  async getOpportunitiesByTier(tier: string) {
    try {
      return await apiClient.get(`/opportunities/tier/${tier}`);
    } catch (error) {
      console.error(`Error fetching opportunities by tier ${tier}:`, error);
      throw error;
    }
  }

  async getHotPriorityOpportunities() {
    try {
      return await apiClient.get('/opportunities/hot/priority');
    } catch (error) {
      console.error('Error fetching hot priority opportunities:', error);
      throw error;
    }
  }

  async recalculateLeadScore(id: string) {
    try {
      return await apiClient.post(`/opportunities/${id}/recalculate-score`, {});
    } catch (error) {
      console.error(`Error recalculating lead score for ${id}:`, error);
      throw error;
    }
  }

  async getScoringStats() {
    try {
      return await apiClient.get('/opportunities/scoring/stats');
    } catch (error) {
      console.error('Error fetching scoring stats:', error);
      throw error;
    }
  }

  async recalculateAllScores() {
    try {
      return await apiClient.post('/opportunities/scoring/recalculate-all', {});
    } catch (error) {
      console.error('Error recalculating all scores:', error);
      throw error;
    }
  }

  async getLeadScore(id: string) {
    try {
      return await apiClient.get(`/opportunities/${id}/lead-score`);
    } catch (error) {
      console.error(`Error fetching lead score for ${id}:`, error);
      throw error;
    }
  }
}

export const opportunityService = new OpportunityService();