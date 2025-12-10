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
  notes?: string;
  leadScore?: {
    totalScore: number;
    tier: 'hot' | 'warm' | 'cold';
    priority: number;
    lastCalculated: string;
    scoreChange?: number;
    autoAssigned?: boolean;
  };
  scoreHistory?: Array<{
    date: string;
    score: number;
    tier: string;
    reason: string;
    triggeredBy?: string;
  }>;
  
  // New properties for opportunity types
  opportunityType?: 'SERVICE' | 'PRODUCT';
  servicesProducts?: Array<{
    id?: string;
    title: string;
    description?: string;
    type: 'SERVICE' | 'PRODUCT';
    quantity: number;
    unitPrice: number;
    discount: number;
    subtotal: number;
    total: number;
  }>;
  subtotal?: number;
  totalDiscount?: number;
  total?: number;
  companyAddress?: string;
  companyTaxId?: string;
  companyPhone?: string;
  companyEmail?: string;
}

export interface CreateOpportunityData {
  type: 'individual' | 'organization';
  subject: string;
  status?: 'new' | 'contacted' | 'qualified' | 'quotation' | 'won' | 'lost';
  source?: string;
  customer: {
    name: string;
    email?: string;
    phone?: string;
    companyName?: string;
    companyAddress?: string;
    companyTaxId?: string;
    companyPhone?: string;
    companyEmail?: string;
  };
  vehicles?: Array<{
    vin?: string;
    registrationNumber?: string;
    licensePlate?: string;
    make: string;
    model: string;
    year?: string | number;
    color?: string;
    engineSize?: string;
    fuelType?: string;
    transmission?: string;
    mileage?: string;
    chassisNumber?: string;
    bodyType?: string;
  }>;
  notes?: string;
  opportunityType?: 'SERVICE' | 'PRODUCT';
  servicesProducts?: Array<{
    title: string;
    description?: string;
    type: 'SERVICE' | 'PRODUCT';
    quantity: number;
    unitPrice: number;
    discount: number;
    subtotal: number;
    total: number;
  }>;
  subtotal?: number;
  totalDiscount?: number;
  total?: number;
}

export interface UpdateOpportunityData {
  subject?: string;
  type?: 'individual' | 'organization';
  status?: 'new' | 'contacted' | 'qualified' | 'quotation' | 'won' | 'lost';
  source?: string;
  assignedTo?: string;
  isNurturing?: boolean;
  notes?: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    companyName?: string;
    companyAddress?: string;
    companyTaxId?: string;
    companyPhone?: string;
    companyEmail?: string;
  };
  vehicles?: Array<{
    vin?: string;
    registrationNumber?: string;
    licensePlate?: string;
    make: string;
    model: string;
    year?: number | string;
    color?: string;
    engineSize?: string;
    fuelType?: string;
    transmission?: string;
    mileage?: string;
    chassisNumber?: string;
    bodyType?: string;
  }>;
  opportunityType?: 'SERVICE' | 'PRODUCT';
  servicesProducts?: Array<{
    title: string;
    description?: string;
    type: 'SERVICE' | 'PRODUCT';
    quantity: number;
    unitPrice: number;
    discount: number;
    subtotal: number;
    total: number;
  }>;
  subtotal?: number;
  totalDiscount?: number;
  total?: number;
}

export interface FilterParams {
  // Basic filters
  status?: string;
  source?: string;
  type?: string;
  tier?: string;
  opportunityType?: 'SERVICE' | 'PRODUCT';
  
  // Advanced filters
  search?: string;
  minScore?: number;
  maxScore?: number;
  fromDate?: string;
  toDate?: string;
  assignedTo?: string | null;
  minTotal?: number;
  maxTotal?: number;
  hasServicesProducts?: boolean;
  
  // Multiple values
  statuses?: string[];
  sources?: string[];
  types?: string[];
  opportunityTypes?: ('SERVICE' | 'PRODUCT')[];
  
  // Sorting
  sort?: string;
  
  // Pagination
  page?: number;
  limit?: number;
  
  // Additional filters
  customerName?: string;
  subject?: string;
  priority?: number;
  hasVehicles?: boolean;
  hasQuotes?: boolean;
  hasJobCards?: boolean;
  isNurturing?: boolean;
  vehicleMake?: string;
  vehicleModel?: string;
}

export interface OpportunitiesResponse {
  data: Opportunity[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats?: {
    total: number;
    open: number;
    closed: number;
    hot: number;
    warm: number;
    cold: number;
    service: number;
    product: number;
    byOpportunityType?: {
      SERVICE: number;
      PRODUCT: number;
    };
  };
}

export interface OpportunityStats {
  total: number;
  byStatus: Record<string, number>;
  byTier: Record<string, number>;
  hotLeads: number;
  totalopportunities?: number;
  openopportunities?: number;
  closedopportunities?: number;
  inProgress?: number;
  byType?: Array<{
    _id: 'individual' | 'organization' | null;
    count: number;
  }>;
  bySource?: Array<{
    _id: string | null;
    count: number;
  }>;
  byOpportunityType?: Array<{
    _id: 'SERVICE' | 'PRODUCT' | null;
    count: number;
  }>;
  totalRevenue?: number;
  averageDealSize?: number;
  lastUpdated?: string;
}

interface FormattedOpportunityData {
  type: 'individual' | 'organization';
  subject: string;
  status: 'new' | 'contacted' | 'qualified' | 'quotation' | 'won' | 'lost';
  source: string;
  customer: {
    name: string;
    email?: string;
    phone?: string;
    companyName?: string;
    companyAddress?: string;
    companyTaxId?: string;
    companyPhone?: string;
    companyEmail?: string;
  };
  vehicles?: Array<{
    vin?: string;
    registrationNumber?: string;
    licensePlate?: string;
    make: string;
    model: string;
    year?: number | string;
    color?: string;
    engineSize?: string;
    fuelType?: string;
    transmission?: string;
    mileage?: string;
    chassisNumber?: string;
    bodyType?: string;
  }>;
  notes?: string;
  opportunityType?: 'SERVICE' | 'PRODUCT';
  servicesProducts?: Array<{
    title: string;
    description?: string;
    type: 'SERVICE' | 'PRODUCT';
    quantity: number;
    unitPrice: number;
    discount: number;
    subtotal: number;
    total: number;
  }>;
  subtotal?: number;
  totalDiscount?: number;
  total?: number;
}

class OpportunityService {
  // Main method to get opportunities with filtering, searching, and sorting
  async getAllOpportunities(params?: FilterParams): Promise<OpportunitiesResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      // Add all filter parameters if they exist
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
              // Handle array parameters (for multiple statuses, sources, etc.)
              value.forEach(item => queryParams.append(`${key}[]`, item));
            } else if (key === 'assignedTo' && value === 'null') {
              // Special handling for unassigned filter
              queryParams.append(key, 'null');
            } else if (typeof value === 'object') {
              // Handle nested objects (like date ranges)
              Object.entries(value).forEach(([nestedKey, nestedValue]) => {
                if (nestedValue !== undefined && nestedValue !== null && nestedValue !== '') {
                  queryParams.append(`${key}.${nestedKey}`, nestedValue.toString());
                }
              });
            } else {
              queryParams.append(key, value.toString());
            }
          }
        });
      }
      
      // Use the search/filter endpoint for advanced filtering
      const endpoint = `/opportunities/search/filter${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await apiClient.get<any>(endpoint);
      
      // Ensure response has proper structure
      if (response.data && Array.isArray(response.data)) {
        return {
          data: response.data,
          pagination: response.pagination,
          stats: response.stats
        };
      } else if (Array.isArray(response)) {
        return {
          data: response,
          pagination: undefined,
          stats: undefined
        };
      } else {
        return response;
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      throw error;
    }
  }

  // Get opportunities with simple parameters (backward compatibility)
  async getOpportunitiesSimple(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<OpportunitiesResponse> {
    const filterParams: FilterParams = {
      ...params,
      search: params?.search
    };
    return this.getAllOpportunities(filterParams);
  }

  // Get opportunities by opportunity type
  async getOpportunitiesByType(opportunityType: 'SERVICE' | 'PRODUCT'): Promise<OpportunitiesResponse> {
    return this.getAllOpportunities({
      opportunityType,
      sort: 'createdAt:desc',
      limit: 50
    });
  }

  // Get service opportunities
  async getServiceOpportunities(): Promise<OpportunitiesResponse> {
    return this.getOpportunitiesByType('SERVICE');
  }

  // Get product opportunities
  async getProductOpportunities(): Promise<OpportunitiesResponse> {
    return this.getOpportunitiesByType('PRODUCT');
  }

  // Get opportunities with services/products
  async getOpportunitiesWithServicesProducts(): Promise<OpportunitiesResponse> {
    return this.getAllOpportunities({
      hasServicesProducts: true,
      sort: 'createdAt:desc',
      limit: 50
    });
  }

  // Get opportunities by total range
  async getOpportunitiesByTotalRange(minTotal: number, maxTotal: number): Promise<OpportunitiesResponse> {
    return this.getAllOpportunities({
      minTotal,
      maxTotal,
      sort: 'total:desc',
      limit: 50
    });
  }

  // Get high-value opportunities (total > certain amount)
  async getHighValueOpportunities(minTotal: number = 100000): Promise<OpportunitiesResponse> {
    return this.getAllOpportunities({
      minTotal,
      sort: 'total:desc',
      limit: 50
    });
  }

  // Get opportunities by vehicle make/model
  async getOpportunitiesByVehicle(make?: string, model?: string): Promise<OpportunitiesResponse> {
    const params: FilterParams = {
      sort: 'createdAt:desc',
      limit: 50
    };
    
    if (make) params.vehicleMake = make;
    if (model) params.vehicleModel = model;
    
    return this.getAllOpportunities(params);
  }

  // Common filter presets from documentation
  async getNewWebLeads(): Promise<OpportunitiesResponse> {
    return this.getAllOpportunities({ 
      status: 'new', 
      source: 'web',
      sort: 'createdAt:desc',
      limit: 50
    });
  }

  async searchOpportunities(searchTerm: string): Promise<OpportunitiesResponse> {
    return this.getAllOpportunities({
      search: searchTerm,
      sort: 'leadScore.totalScore:desc',
      limit: 50
    });
  }

  async getHotLeadsWithHighScores(): Promise<OpportunitiesResponse> {
    return this.getAllOpportunities({ 
      tier: 'hot', 
      minScore: 70,
      sort: 'leadScore.totalScore:desc',
      limit: 50
    });
  }

  async getThisMonthsOpportunities(): Promise<OpportunitiesResponse> {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    return this.getAllOpportunities({
      fromDate: firstDay.toISOString().split('T')[0],
      toDate: today.toISOString().split('T')[0],
      sort: 'createdAt:desc',
      limit: 100
    });
  }

  async getUnassignedNewLeads(): Promise<OpportunitiesResponse> {
    return this.getAllOpportunities({ 
      status: 'new', 
      assignedTo: 'null',
      sort: 'createdAt:desc',
      limit: 50
    });
  }

  async getPaginatedResults(page: number = 1, limit: number = 20): Promise<OpportunitiesResponse> {
    return this.getAllOpportunities({
      page,
      limit,
      sort: 'createdAt:desc'
    });
  }

  async getMultipleStatuses(statuses: string[]): Promise<OpportunitiesResponse> {
    return this.getAllOpportunities({
      statuses,
      sort: 'leadScore.priority:desc',
      limit: 50
    });
  }

  // Hot leads with priority
  async getHotPriorityOpportunities(): Promise<OpportunitiesResponse> {
    return this.getAllOpportunities({ 
      tier: 'hot', 
      sort: 'leadScore.priority:desc',
      limit: 50
    });
  }

  // Get opportunities by date range
  async getOpportunitiesByDateRange(fromDate: string, toDate: string): Promise<OpportunitiesResponse> {
    return this.getAllOpportunities({
      fromDate,
      toDate,
      sort: 'createdAt:desc',
      limit: 100
    });
  }

  // Get opportunities by score range
  async getOpportunitiesByScoreRange(minScore: number, maxScore: number): Promise<OpportunitiesResponse> {
    return this.getAllOpportunities({
      minScore,
      maxScore,
      sort: 'leadScore.totalScore:desc',
      limit: 50
    });
  }

  // Get opportunities with vehicles
  async getOpportunitiesWithVehicles(): Promise<OpportunitiesResponse> {
    return this.getAllOpportunities({
      hasVehicles: true,
      sort: 'createdAt:desc',
      limit: 50
    });
  }

  // Get opportunities with quotes
  async getOpportunitiesWithQuotes(): Promise<OpportunitiesResponse> {
    return this.getAllOpportunities({
      hasQuotes: true,
      sort: 'createdAt:desc',
      limit: 50
    });
  }

  // Get nurturing opportunities
  async getNurturingOpportunities(): Promise<OpportunitiesResponse> {
    return this.getAllOpportunities({
      isNurturing: true,
      sort: 'createdAt:desc',
      limit: 50
    });
  }

  // Get opportunities by customer name
  async getOpportunitiesByCustomerName(customerName: string): Promise<OpportunitiesResponse> {
    return this.getAllOpportunities({
      customerName,
      sort: 'createdAt:desc',
      limit: 50
    });
  }

  // Existing methods (keep for backward compatibility)
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
      const formattedData: FormattedOpportunityData = {
        type: data.type,
        subject: data.subject,
        status: data.status || 'new',
        source: data.source || 'walk_in',
        customer: {
          name: data.customer.name,
          ...(data.customer.email && { email: data.customer.email }),
          ...(data.customer.phone && { phone: data.customer.phone }),
          ...(data.customer.companyName && { companyName: data.customer.companyName }),
          ...(data.customer.companyAddress && { companyAddress: data.customer.companyAddress }),
          ...(data.customer.companyTaxId && { companyTaxId: data.customer.companyTaxId }),
          ...(data.customer.companyPhone && { companyPhone: data.customer.companyPhone }),
          ...(data.customer.companyEmail && { companyEmail: data.customer.companyEmail }),
        },
      };

      if (data.vehicles && data.vehicles.length > 0) {
        formattedData.vehicles = data.vehicles.map(vehicle => ({
          ...(vehicle.vin && { vin: vehicle.vin }),
          ...(vehicle.registrationNumber && { registrationNumber: vehicle.registrationNumber }),
          ...(vehicle.licensePlate && { licensePlate: vehicle.licensePlate }),
          make: vehicle.make,
          model: vehicle.model,
          ...(vehicle.year && { year: parseInt(vehicle.year as string) || vehicle.year }),
          ...(vehicle.color && { color: vehicle.color }),
          ...(vehicle.engineSize && { engineSize: vehicle.engineSize }),
          ...(vehicle.fuelType && { fuelType: vehicle.fuelType }),
          ...(vehicle.transmission && { transmission: vehicle.transmission }),
          ...(vehicle.mileage && { mileage: vehicle.mileage }),
          ...(vehicle.chassisNumber && { chassisNumber: vehicle.chassisNumber }),
          ...(vehicle.bodyType && { bodyType: vehicle.bodyType }),
        }));
      }

      if (data.notes) {
        formattedData.notes = data.notes;
      }

      if (data.opportunityType) {
        formattedData.opportunityType = data.opportunityType;
      }

      if (data.servicesProducts && data.servicesProducts.length > 0) {
        formattedData.servicesProducts = data.servicesProducts;
      }

      if (data.subtotal !== undefined) {
        formattedData.subtotal = data.subtotal;
      }

      if (data.totalDiscount !== undefined) {
        formattedData.totalDiscount = data.totalDiscount;
      }

      if (data.total !== undefined) {
        formattedData.total = data.total;
      }
      
      return await apiClient.post<FormattedOpportunityData, Opportunity>('/opportunities', formattedData);
    } catch (error) {
      console.error('Error creating opportunity:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('CORS')) {
          throw new Error('CORS configuration issue. Please contact the backend team to allow requests from localhost:3000.');
        } else if (error.message.includes('502')) {
          throw new Error('Backend server is currently unavailable. Please try again later.');
        } else if (error.message.includes('401') || error.message.includes('403')) {
          sessionStorage.removeItem('accessToken');
          window.location.href = '/login';
          throw new Error('Session expired. Please log in again.');
        } else if (error.message.includes('NetworkError')) {
          throw new Error('Network error. Please check your internet connection and try again.');
        }
      }
      
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
      return this.getAllOpportunities({ 
        tier, 
        sort: 'leadScore.totalScore:desc',
        limit: 50
      });
    } catch (error) {
      console.error(`Error fetching opportunities by tier ${tier}:`, error);
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

  // Get revenue statistics
  async getRevenueStats() {
    try {
      return await apiClient.get('/opportunities/stats/revenue');
    } catch (error) {
      console.error('Error fetching revenue stats:', error);
      throw error;
    }
  }

  // Get opportunity type statistics
  async getOpportunityTypeStats() {
    try {
      return await apiClient.get('/opportunities/stats/types');
    } catch (error) {
      console.error('Error fetching opportunity type stats:', error);
      throw error;
    }
  }

  // Get top performing opportunities
  async getTopOpportunities(limit: number = 10) {
    try {
      return await apiClient.get(`/opportunities/stats/top?limit=${limit}`);
    } catch (error) {
      console.error('Error fetching top opportunities:', error);
      throw error;
    }
  }

  // Utility method to build filter query
  buildFilterQuery(params: FilterParams): string {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(item => queryParams.append(`${key}[]`, item));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });
    
    return queryParams.toString();
  }

  // Get all available filter options (for UI dropdowns)
  async getFilterOptions() {
    try {
      const [overview, scoringStats, typeStats] = await Promise.all([
        this.getOpportunitiesOverview(),
        this.getScoringStats(),
        this.getOpportunityTypeStats()
      ]);
      
      return {
        statuses: Object.keys(overview.byStatus || {}),
        tiers: Object.keys(overview.byTier || {}),
        sources: (overview.bySource || []).map((source: any) => source._id).filter(Boolean),
        types: (overview.byType || []).map((type: any) => type._id).filter(Boolean),
        opportunityTypes: (overview.byOpportunityType || []).map((type: any) => type._id).filter(Boolean),
        scoringStats,
        typeStats
      };
    } catch (error) {
      console.error('Error fetching filter options:', error);
      return {
        statuses: [],
        tiers: [],
        sources: [],
        types: [],
        opportunityTypes: [],
        scoringStats: null,
        typeStats: null
      };
    }
  }
}

export const opportunityService = new OpportunityService();