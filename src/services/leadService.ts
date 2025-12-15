import { apiClient } from '@/lib/api/client';

export interface CreateLeadData {
  name: string;
  email: string;
  phone: string;
  source: string;
  type: 'individual' | 'organization';
  productsInterested?: string[];
  status?: string;
  companyName?: string;
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
  vehicleInfo?: any;
  leadOwner?: string;
}

export interface Lead {
  _id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  type: 'individual' | 'organization';
  productsInterested: string[];
  status: string;
  lisStatus: 'red' | 'yellow' | 'green';
  assignedTo: {
    _id: string;
    email: string;
    role: string;
    name?: string;
  };
  active: boolean;
  firstContactSLA: string;
  failedContactAttempts: number;
  contactAttempts: Array<{
    timestamp: string;
    method: string;
    outcome: string;
  }>;
  createdAt: string;
  updatedAt: string;
  __v: number;
  lisValidation: {
    identityValidated: boolean;
    intentValidated: boolean;
    contactValidated: boolean;
    coreDataValidated: boolean;
    missingFields: string[];
    lastValidation: string;
  };
  // Additional optional fields
  companyName?: string;
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
  vehicleInfo?: any;
  leadOwner?: string;
}

export interface LeadFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  source?: string;
  type?: string;
  search?: string;
  opportunityId?: string;
  stage?: string;
  fromDate?: string;
  toDate?: string;
  sort?: string;
  leadOwner?: string;
}

export interface LeadsResponse {
  data: Lead[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats?: {
    total: number;
    byStatus: Record<string, number>;
    bySource: Record<string, number>;
    byStage: Record<string, number>;
    hotLeads: number;
    warmLeads: number;
    coldLeads: number;
  };
}

class LeadService {
  async createLead(data: CreateLeadData): Promise<Lead> {
    try {
      console.log('Creating lead with data:', data);

      const leadData = {
        ...data,
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        status: data.status || 'new',
      };
      
      return await apiClient.post<typeof leadData, Lead>('/leads', leadData);
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
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

  async getAllLeads(params?: LeadFilterParams): Promise<LeadsResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      // Set default pagination if not provided
      if (!params?.page) {
        queryParams.append('page', '1');
      }
      if (!params?.limit) {
        queryParams.append('limit', '10');
      }
      
      const queryString = queryParams.toString();
      const endpoint = `/leads${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get<any>(endpoint);
      
      // Handle paginated response
      return {
        data: response.data || response,
        pagination: response.pagination,
        stats: response.stats
      };
    } catch (error) {
      console.error('Error fetching leads:', error);
      throw error;
    }
  }

  async getLeadsByPage(page: number, limit: number = 10, filters?: Omit<LeadFilterParams, 'page' | 'limit'>): Promise<LeadsResponse> {
    try {
      const params: LeadFilterParams = {
        page,
        limit,
        ...filters
      };
      return await this.getAllLeads(params);
    } catch (error) {
      console.error(`Error fetching leads for page ${page}:`, error);
      throw error;
    }
  }

  async getLeadsByOpportunity(opportunityId: string, page?: number, limit?: number): Promise<LeadsResponse> {
    try {
      const params: LeadFilterParams = {
        opportunityId,
        page,
        limit
      };
      return await this.getAllLeads(params);
    } catch (error) {
      console.error(`Error fetching leads for opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  async checkLeadExistsForOpportunity(opportunityId: string): Promise<boolean> {
    try {
      const response = await this.getLeadsByOpportunity(opportunityId, 1, 1);
      return response.data && response.data.length > 0;
    } catch (error) {
      console.error('Error checking lead existence:', error);
      return false;
    }
  }
  
  async searchLeads(query: string, page?: number, limit?: number): Promise<LeadsResponse> {
    try {
      const params: LeadFilterParams = {
        search: query,
        page,
        limit
      };
      return await this.getAllLeads(params);
    } catch (error) {
      console.error('Error searching leads:', error);
      throw error;
    }
  }
  
  async getLeadsByStatus(status: string, page?: number, limit?: number): Promise<LeadsResponse> {
    try {
      const params: LeadFilterParams = {
        status,
        page,
        limit
      };
      return await this.getAllLeads(params);
    } catch (error) {
      console.error(`Error fetching leads by status ${status}:`, error);
      throw error;
    }
  }

  async getLeadsBySource(source: string, page?: number, limit?: number): Promise<LeadsResponse> {
    try {
      const params: LeadFilterParams = {
        source,
        page,
        limit
      };
      return await this.getAllLeads(params);
    } catch (error) {
      console.error(`Error fetching leads by source ${source}:`, error);
      throw error;
    }
  }

  async getLeadsByType(type: 'individual' | 'organization', page?: number, limit?: number): Promise<LeadsResponse> {
    try {
      const params: LeadFilterParams = {
        type,
        page,
        limit
      };
      return await this.getAllLeads(params);
    } catch (error) {
      console.error(`Error fetching leads by type ${type}:`, error);
      throw error;
    }
  }

  async getHotLeads(page?: number, limit?: number): Promise<LeadsResponse> {
    try {
      const params: LeadFilterParams = {
        status: 'hot',
        sort: 'leadScore.totalScore:desc',
        page,
        limit
      };
      return await this.getAllLeads(params);
    } catch (error) {
      console.error('Error fetching hot leads:', error);
      throw error;
    }
  }

  async getNewLeads(page?: number, limit?: number): Promise<LeadsResponse> {
    try {
      const params: LeadFilterParams = {
        status: 'new',
        sort: 'createdAt:desc',
        page,
        limit
      };
      return await this.getAllLeads(params);
    } catch (error) {
      console.error('Error fetching new leads:', error);
      throw error;
    }
  }
  
  async getLeadStats(): Promise<any> {
    try {
      return await apiClient.get('/leads/stats');
    } catch (error) {
      console.error('Error fetching lead stats:', error);
      throw error;
    }
  }

  async getLeadOverview(): Promise<any> {
    try {
      return await apiClient.get('/leads/overview');
    } catch (error) {
      console.error('Error fetching lead overview:', error);
      throw error;
    }
  }
  
  async createLeadFromOpportunity(opportunity: any): Promise<Lead> {
    try {
      let phoneNumber = opportunity.customer?.phone || '';
      if (phoneNumber.startsWith('+254')) {
        phoneNumber = phoneNumber.substring(4);
      } else if (phoneNumber.startsWith('254')) {
        phoneNumber = phoneNumber.substring(3);
      }
      
      const leadData: CreateLeadData = {
        name: opportunity.customer?.name || '',
        email: opportunity.customer?.email || '',
        phone: phoneNumber,
        type: opportunity.type || 'individual',
        companyName: opportunity.customer?.companyName || '',
        source: opportunity.source || 'manual',
        notes: `Created from opportunity: ${opportunity.subject || ''}`,
        opportunityId: opportunity._id || opportunity.id,
        status: 'new',
        customerName: opportunity.customer?.name,
        customerEmail: opportunity.customer?.email,
        customerPhone: phoneNumber,
        ...(opportunity.vehicles && opportunity.vehicles.length > 0 && {
          vehicleInfo: opportunity.vehicles[0]
        })
      };
      
      return await this.createLead(leadData);
    } catch (error) {
      console.error('Error creating lead from opportunity:', error);
      throw error;
    }
  }

  // Build filter query for UI components
  buildLeadFilterQuery(params: LeadFilterParams): string {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    return queryParams.toString();
  }

  // Get filter options (for UI dropdowns)
  async getFilterOptions() {
    try {
      const [stats, overview] = await Promise.all([
        this.getLeadStats(),
        this.getLeadOverview()
      ]);
      
      return {
        statuses: Object.keys(stats?.byStatus || {}),
        sources: Object.keys(stats?.bySource || {}),
        stages: Object.keys(stats?.byStage || {}),
        types: ['individual', 'organization'],
        stats,
        overview
      };
    } catch (error) {
      console.error('Error fetching filter options:', error);
      return {
        statuses: [],
        sources: [],
        stages: [],
        types: ['individual', 'organization'],
        stats: null,
        overview: null
      };
    }
  }
}

export const leadService = new LeadService();