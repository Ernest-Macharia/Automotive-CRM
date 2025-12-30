import { apiClient } from '@/lib/api/client';

export interface Opportunity {
  _id: string;
  id: string;
  type: 'individual' | 'organization';
  subject: string;
  status: 'new' | 'attempted_to_contact' | 'prospecting' | 'appointment_scheduled' | 'non_progressive' | 'lost' | 'won';
  source?: string;
  customer: {
    name: string;
    email?: string;
    companyName?: string;
    phone?: string;
    _id: string;
    id: string;
    companyAddress?: string;
    companyTaxId?: string;
    companyPhone?: string;
    companyEmail?: string;
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
  opportunityType?: 'SERVICE' | 'SALE' | 'REPAIR' | 'MAINTENANCE' | 'INSPECTION';
  packageType?: 'sales_order' | 'work_order';
  servicesProducts?: Array<{
    id?: string;
    _id?: string;
    title: string;
    description?: string;
    type: 'SERVICE' | 'PRODUCT' | 'PART' | 'LABOR';
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
  hasLead?: boolean;
  
  // New backend properties
  currentStage?: string;
  currentQuote?: any;
  currentWaiver?: any;
  currentJobCard?: any;
  currentPreChecklist?: any;
  currentPostChecklist?: any;
  currentInvoice?: any;
  workOrder?: any;
  salesOrder?: any;
  stageHistory?: Array<{
    stage: string;
    date: string;
    triggeredBy: any;
    metadata?: any;
  }>;
}

export interface CreateOpportunityData {
  type: 'individual' | 'organization';
  subject: string;
  status?: 'new' | 'attempted_to_contact' | 'prospecting' | 'appointment_scheduled' | 'non_progressive' | 'lost' | 'won';
  source?: 'web' | 'email' | 'call' | 'walk_in' | 'referral' | 'partner';
  customer: {
    name: string;
    email?: string;
    phone?: string;
    companyName?: string;
    companyAddress?: string;
    companyTaxId?: string;
    companyPhone?: string;
    companyEmail?: string;
    contactPersonName?: string;
    contactPersonEmail?: string;
    contactPersonPhone?: string;
    contactPersonTitle?: string;
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
  opportunityType: 'SERVICE' | 'SALE' | 'REPAIR' | 'MAINTENANCE' | 'INSPECTION';
  packageType?: 'sales_order' | 'work_order';
  servicesProducts?: Array<{
    title: string;
    description?: string;
    type: 'SERVICE' | 'PRODUCT' | 'PART' | 'LABOR';
    quantity: number;
    unitPrice: number;
    discount: number;
    subtotal: number;
    total: number;
  }>;
  subtotal?: number;
  totalDiscount?: number;
  total?: number;
  assignedTo?: string;
}

export interface UpdateOpportunityData {
  subject?: string;
  type?: 'individual' | 'organization';
  status?: 'new' | 'attempted_to_contact' | 'prospecting' | 'appointment_scheduled' | 'non_progressive' | 'lost' | 'won';
  source: 'web' | 'email' | 'call' | 'walk_in' | 'referral' | 'partner';
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
  opportunityType?: 'SERVICE' | 'SALE' | 'REPAIR' | 'MAINTENANCE' | 'INSPECTION';
  packageType?: 'sales_order' | 'work_order';
  servicesProducts?: Array<{
    title: string;
    description?: string;
    type: 'SERVICE' | 'PRODUCT' | 'PART' | 'LABOR';
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
  opportunityType?: 'SERVICE' | 'SALE' | 'REPAIR' | 'MAINTENANCE' | 'INSPECTION';
  
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
  opportunityTypes?: ('SERVICE' | 'SALE' | 'REPAIR' | 'MAINTENANCE' | 'INSPECTION')[];
  packageType?: 'sales_order' | 'work_order';
  
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
  
  // Cache control
  refreshCache?: boolean;
  
  // New backend filter params
  customerEmail?: string;
  customerPhone?: string;
  'leadScore.tier'?: string;
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
    sale: number;
    repair: number;
    maintenance: number;
    inspection: number;
    byOpportunityType?: {
      SERVICE: number;
      SALE: number;
      REPAIR: number;
      MAINTENANCE: number;
      INSPECTION: number;
    };
  };
}

export interface OpportunityStats {
  totalopportunities: number;
  openopportunities: number;
  closedopportunities: number;
  inProgress: number;
  byType?: Array<{
    _id: 'individual' | 'organization' | null;
    count: number;
  }>;
  bySource?: Array<{
    _id: string | null;
    count: number;
  }>;
  byOpportunityType?: Array<{
    _id: 'SERVICE' | 'SALE' | 'REPAIR' | 'MAINTENANCE' | 'INSPECTION' | null;
    count: number;
  }>;
  totalRevenue?: number;
  averageDealSize?: number;
  lastUpdated?: string;
  lisStats?: {
    green: number;
    amber: number;
    red: number;
    total: number;
    validationRate: number;
  };
}

export interface FilteredStats {
  total: number;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  byType: Record<string, number>;
  byTier: Record<string, number>;
  averageScore: number;
  assignedCount: number;
}

export interface LeadScoreResponse {
  score: {
    totalScore: number;
    tier: string;
    behavioral: {
      messageEngagement: number;
      callEngagement: number;
      replyRate: number;
      appointmentAttendance: number;
      websiteVisits: number;
      documentViews: number;
    };
    automotive: {
      vehicleValue: number;
      urgency: number;
      serviceHistory: number;
      premiumBrand: number;
      repeatVehicle: number;
      maintenanceRequired: number;
    };
    commercial: {
      dealValue: number;
      profitMargin: number;
      closingLikelihood: number;
      stockAvailability: number;
      customerTier: number;
      paymentTerms: number;
    };
    lastCalculated: Date;
    previousScore: number;
    scoreChange: number;
    autoAssigned: boolean;
    priority: number;
  };
  history: Array<{
    date: Date;
    score: number;
    tier: string;
    reason: string;
    triggeredBy: string;
  }>;
  lisStatus: {
    canProgress: boolean;
    lisStatus: string;
    missingFields?: string[];
  };
}

export interface ScoringStats {
  averageScore: number;
  scoreDistribution: {
    hot: number;
    warm: number;
    cold: number;
  };
  topScoringOpportunities: Array<{
    _id: string;
    subject: string;
    score: number;
    customer: string;
  }>;
  scoreTrend: Array<{
    date: string;
    averageScore: number;
    count: number;
  }>;
}

export interface LISStatusResponse {
  canProgress: boolean;
  lisStatus: 'green' | 'amber' | 'red';
  missingFields?: string[];
}

export interface VehicleImageUploadResponse {
  success: boolean;
  vehicle: any;
  images: Array<{
    url: string;
    thumbnailUrl: string;
    originalName: string;
    size: number;
    mimeType: string;
    isPrimary: boolean;
    uploadedAt: Date;
  }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface StageHistory {
  stage: string;
  date: Date;
  triggeredBy: any;
  metadata?: any;
}

// Extended ApiClient with headers support
class ExtendedApiClient {
  private getApiBaseUrl(): string {
    // Try to access API_BASE_URL from apiClient
    if ((apiClient as any).API_BASE_URL) {
      return (apiClient as any).API_BASE_URL;
    }
    // Fallback to config import if available
    try {
      const config = require('@/lib/api/config');
      return config.API_BASE_URL || '';
    } catch {
      return '';
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = sessionStorage.getItem('accessToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async requestWithHeaders<T>(
    endpoint: string, 
    options: RequestInit = {},
    customHeaders?: Record<string, string>
  ): Promise<T> {
    const url = `${this.getApiBaseUrl()}${endpoint}`;
    
    const headers = {
      ...this.getHeaders(),
      ...options.headers,
      ...customHeaders,
    };

    const config: RequestInit = {
      ...options,
      headers,
      mode: 'cors',
      credentials: 'include',
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      
      if (response.status === 401) {
        sessionStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
      
      throw new Error(`API Error (${response.status}): ${errorText || response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return {} as T;
  }

  async get<T>(endpoint: string, params?: Record<string, string>, headers?: Record<string, string>): Promise<T> {
    let url = endpoint;
    if (params) {
      const queryParams = new URLSearchParams(params);
      url += `?${queryParams.toString()}`;
    }
    return this.requestWithHeaders<T>(url, { method: 'GET' }, headers);
  }

  async post<D, T>(endpoint: string, data: D, headers?: Record<string, string>): Promise<T> {
    return this.requestWithHeaders<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }, headers);
  }

  async put<D, T>(endpoint: string, data: D, headers?: Record<string, string>): Promise<T> {
    return this.requestWithHeaders<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, headers);
  }

  async patch<D, T>(endpoint: string, data: D, headers?: Record<string, string>): Promise<T> {
    return this.requestWithHeaders<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, headers);
  }

  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.requestWithHeaders<T>(endpoint, {
      method: 'DELETE',
    }, headers);
  }
}

const extendedApiClient = new ExtendedApiClient();

class OpportunityService {
  // Health check endpoint
  async ping(): Promise<{ message: string }> {
    return extendedApiClient.get<{ message: string }>('/opportunities/ping');
  }

  // Main filter endpoint
  async filterOpportunities(params?: FilterParams): Promise<OpportunitiesResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
              value.forEach(item => queryParams.append(`${key}[]`, item));
            } else if (typeof value === 'boolean') {
              queryParams.append(key, value.toString());
            } else if (key === 'assignedTo' && value === 'null') {
              queryParams.append(key, 'null');
            } else if (typeof value === 'object') {
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
      
      const endpoint = `/opportunities/search/filter${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return extendedApiClient.get<OpportunitiesResponse>(endpoint);
    } catch (error) {
      console.error('Error filtering opportunities:', error);
      throw error;
    }
  }

  // Advanced search
  async advancedSearch(params?: FilterParams): Promise<Opportunity[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
              value.forEach(item => queryParams.append(`${key}[]`, item));
            } else if (typeof value === 'boolean') {
              queryParams.append(key, value.toString());
            } else {
              queryParams.append(key, value.toString());
            }
          }
        });
      }
      
      const endpoint = `/opportunities/search/advanced${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return extendedApiClient.get<Opportunity[]>(endpoint);
    } catch (error) {
      console.error('Error in advanced search:', error);
      throw error;
    }
  }

  // Get filtered stats
  async getFilteredStats(params?: FilterParams): Promise<FilteredStats> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
              value.forEach(item => queryParams.append(`${key}[]`, item));
            } else if (typeof value === 'boolean') {
              queryParams.append(key, value.toString());
            } else {
              queryParams.append(key, value.toString());
            }
          }
        });
      }
      
      const endpoint = `/opportunities/stats/filtered${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return extendedApiClient.get<FilteredStats>(endpoint);
    } catch (error) {
      console.error('Error getting filtered stats:', error);
      throw error;
    }
  }

  // Get all opportunities (simple pagination)
  async getAllOpportunities(params?: {
    page?: number;
    limit?: number;
    sort?: string;
    source?: string;
    status?: string;
    search?: string;
  }): Promise<OpportunitiesResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const endpoint = `/opportunities${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return extendedApiClient.get<OpportunitiesResponse>(endpoint);
    } catch (error) {
      console.error('Error getting all opportunities:', error);
      throw error;
    }
  }

  // Create opportunity
  async createOpportunity(data: CreateOpportunityData, userId?: string): Promise<Opportunity> {
    try {
      const headers: Record<string, string> = {};
      
      if (userId) {
        headers['X-User-Id'] = userId;
      }
      
      return await extendedApiClient.post<CreateOpportunityData, Opportunity>('/opportunities', data, headers);
    } catch (error) {
      console.error('Error creating opportunity:', error);
      throw error;
    }
  }

  // Test complete endpoint
  async testComplete(params?: {
    search?: string;
    status?: string;
    minScore?: string;
    maxScore?: string;
  }): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const endpoint = `/opportunities/test/complete${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return extendedApiClient.get<any>(endpoint);
    } catch (error) {
      console.error('Error in test complete:', error);
      throw error;
    }
  }

  // Get overview stats
  async getOpportunitiesOverview(): Promise<OpportunityStats> {
    try {
      return await extendedApiClient.get<OpportunityStats>('/opportunities/overview');
    } catch (error) {
      console.error('Error fetching opportunities overview:', error);
      throw error;
    }
  }

  // Get available sales reps
  async getAvailableSalesReps(): Promise<any[]> {
    try {
      return await extendedApiClient.get<any[]>('/opportunities/sales-reps/available');
    } catch (error) {
      console.error('Error fetching available sales reps:', error);
      throw error;
    }
  }

  // Get opportunity by ID
  async getOpportunityById(id: string, minimal: boolean = false): Promise<Opportunity> {
    try {
      const endpoint = `/opportunities/${id}${minimal ? '?minimal=true' : ''}`;
      return await extendedApiClient.get<Opportunity>(endpoint);
    } catch (error) {
      console.error(`Error fetching opportunity ${id}:`, error);
      throw error;
    }
  }

  // Update opportunity
  async updateOpportunity(id: string, data: UpdateOpportunityData, userId?: string): Promise<Opportunity> {
    try {
      const headers: Record<string, string> = {};
      
      if (userId) {
        headers['X-User-Id'] = userId;
      }
      
      return await extendedApiClient.patch<UpdateOpportunityData, Opportunity>(`/opportunities/${id}`, data, headers);
    } catch (error) {
      console.error(`Error updating opportunity ${id}:`, error);
      throw error;
    }
  }

  // Delete opportunity
  async deleteOpportunity(id: string): Promise<{ message: string }> {
    try {
      return await extendedApiClient.delete<{ message: string }>(`/opportunities/${id}`);
    } catch (error) {
      console.error(`Error deleting opportunity ${id}:`, error);
      throw error;
    }
  }

  // Get lead score
  async getLeadScore(id: string): Promise<LeadScoreResponse> {
    try {
      return await extendedApiClient.get<LeadScoreResponse>(`/opportunities/${id}/lead-score`);
    } catch (error) {
      console.error(`Error fetching lead score for ${id}:`, error);
      throw error;
    }
  }

  // Get opportunities by tier
  async getOpportunitiesByTier(tier: string): Promise<Opportunity[]> {
    try {
      return await extendedApiClient.get<Opportunity[]>(`/opportunities/tier/${tier}`);
    } catch (error) {
      console.error(`Error fetching opportunities by tier ${tier}:`, error);
      throw error;
    }
  }

  // Get hot priority opportunities
  async getHotPriorityOpportunities(): Promise<Opportunity[]> {
    try {
      return await extendedApiClient.get<Opportunity[]>('/opportunities/hot/priority');
    } catch (error) {
      console.error('Error fetching hot priority opportunities:', error);
      throw error;
    }
  }

  // Recalculate lead score
  async recalculateLeadScore(id: string): Promise<any> {
    try {
      return await extendedApiClient.post<any, any>(`/opportunities/${id}/recalculate-score`, {});
    } catch (error) {
      console.error(`Error recalculating lead score for ${id}:`, error);
      throw error;
    }
  }

  // Get scoring stats
  async getScoringStats(): Promise<ScoringStats> {
    try {
      return await extendedApiClient.get<ScoringStats>('/opportunities/scoring/stats');
    } catch (error) {
      console.error('Error fetching scoring stats:', error);
      throw error;
    }
  }

  // Recalculate all scores
  async recalculateAllScores(): Promise<{ updated: number; errors: number }> {
    try {
      return await extendedApiClient.post<any, { updated: number; errors: number }>('/opportunities/scoring/recalculate-all', {});
    } catch (error) {
      console.error('Error recalculating all scores:', error);
      throw error;
    }
  }

  // Upload vehicle image
  async uploadVehicleImage(
    opportunityId: string,
    vehicleId: string,
    file: File
  ): Promise<VehicleImageUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const apiBaseUrl = (apiClient as any).API_BASE_URL || '';
      const response = await fetch(`${apiBaseUrl}/opportunities/${opportunityId}/vehicles/${vehicleId}/upload-image`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error uploading vehicle image:', error);
      throw error;
    }
  }

  // Get vehicle images
  async getVehicleImages(opportunityId: string, vehicleId: string): Promise<any[]> {
    try {
      return await extendedApiClient.get<any[]>(`/opportunities/${opportunityId}/vehicles/${vehicleId}/images`);
    } catch (error) {
      console.error('Error fetching vehicle images:', error);
      throw error;
    }
  }

  // Upload multiple vehicle images
  async uploadVehicleImages(
    opportunityId: string,
    vehicleId: string,
    files: File[]
  ): Promise<VehicleImageUploadResponse> {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });
      
      const apiBaseUrl = (apiClient as any).API_BASE_URL || '';
      const response = await fetch(`${apiBaseUrl}/opportunities/${opportunityId}/vehicles/${vehicleId}/upload-images`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error uploading vehicle images:', error);
      throw error;
    }
  }

  // Get LIS status
  async getOpportunityLISStatus(opportunityId: string): Promise<LISStatusResponse> {
    try {
      return await extendedApiClient.get<LISStatusResponse>(`/leads/opportunity/${opportunityId}/can-progress`);
    } catch (error) {
      console.error('Error fetching LIS status:', error);
      throw error;
    }
  }

  // Check if opportunity can progress
  async canOpportunityProgress(opportunityId: string): Promise<boolean> {
    try {
      const status = await this.getOpportunityLISStatus(opportunityId);
      return status.canProgress;
    } catch (error) {
      console.error('Error checking if opportunity can progress:', error);
      throw error;
    }
  }

  // Get lead by opportunity ID
  async getLeadByOpportunityId(opportunityId: string): Promise<any> {
    try {
      return await extendedApiClient.get(`/leads/opportunity/${opportunityId}`);
    } catch (error: any) {
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        return null;
      }
      throw error;
    }
  }

  // Create lead from opportunity
  async createLeadFromOpportunity(opportunityId: string): Promise<any> {
    try {
      return await extendedApiClient.post('/leads/from-opportunity', { opportunityId });
    } catch (error) {
      console.error('Error creating lead from opportunity:', error);
      throw error;
    }
  }

  // Get detailed opportunity stats
  async getOpportunityStats(): Promise<any> {
    try {
      return await extendedApiClient.get('/opportunities/stats/detailed');
    } catch (error) {
      console.error('Error fetching detailed opportunity stats:', error);
      throw error;
    }
  }

  // Get opportunities by IDs
  async getOpportunitiesByIds(ids: string[], fields: string[] = []): Promise<Opportunity[]> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('ids', ids.join(','));
      if (fields.length > 0) {
        queryParams.append('fields', fields.join(','));
      }
      
      return await extendedApiClient.get<Opportunity[]>(`/opportunities/batch?${queryParams.toString()}`);
    } catch (error) {
      console.error('Error fetching opportunities by IDs:', error);
      throw error;
    }
  }

  // Get paginated opportunities with custom fields
  async getOpportunitiesPaginated(
    page: number = 1,
    limit: number = 20,
    fields: string[] = [],
    sort: string = 'createdAt:desc'
  ): Promise<PaginatedResponse<Opportunity>> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      queryParams.append('sort', sort);
      if (fields.length > 0) {
        queryParams.append('fields', fields.join(','));
      }
      
      return await extendedApiClient.get<PaginatedResponse<Opportunity>>(`/opportunities/paginated?${queryParams.toString()}`);
    } catch (error) {
      console.error('Error fetching paginated opportunities:', error);
      throw error;
    }
  }

  // Search autocomplete
  async searchAutocomplete(query: string, limit: number = 10): Promise<Opportunity[]> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('query', query);
      queryParams.append('limit', limit.toString());
      
      return await extendedApiClient.get<Opportunity[]>(`/opportunities/autocomplete?${queryParams.toString()}`);
    } catch (error) {
      console.error('Error in autocomplete search:', error);
      throw error;
    }
  }

  // Add quote to opportunity
  async addQuote(opportunityId: string, quoteData: any, userId?: string): Promise<Opportunity> {
    try {
      const headers: Record<string, string> = {};
      
      if (userId) {
        headers['X-User-Id'] = userId;
      }
      
      return await extendedApiClient.post<any, Opportunity>(`/opportunities/${opportunityId}/quotes`, quoteData, headers);
    } catch (error) {
      console.error('Error adding quote to opportunity:', error);
      throw error;
    }
  }

  async getOpportunitiesWithServicesProducts(): Promise<OpportunitiesResponse> {
    return this.filterOpportunities({
      hasServicesProducts: true,
      sort: 'createdAt:desc',
      limit: 50
    });
  }

  async getOpportunitiesByTotalRange(minTotal: number, maxTotal: number): Promise<OpportunitiesResponse> {
    return this.filterOpportunities({
      minTotal,
      maxTotal,
      sort: 'total:desc',
      limit: 50
    });
  }

  async getHighValueOpportunities(minTotal: number = 100000): Promise<OpportunitiesResponse> {
    return this.filterOpportunities({
      minTotal,
      sort: 'total:desc',
      limit: 50
    });
  }

  async getOpportunitiesByVehicle(make?: string, model?: string): Promise<OpportunitiesResponse> {
    const params: FilterParams = {
      sort: 'createdAt:desc',
      limit: 50
    };
    
    if (make) params.vehicleMake = make;
    if (model) params.vehicleModel = model;
    
    return this.filterOpportunities(params);
  }

  async getNewWebLeads(): Promise<OpportunitiesResponse> {
    return this.filterOpportunities({ 
      status: 'new', 
      source: 'web',
      sort: 'createdAt:desc',
      limit: 50
    });
  }

  async searchOpportunities(searchTerm: string): Promise<OpportunitiesResponse> {
    return this.filterOpportunities({
      search: searchTerm,
      sort: 'leadScore.totalScore:desc',
      limit: 50
    });
  }

  async getHotLeadsWithHighScores(): Promise<OpportunitiesResponse> {
    return this.filterOpportunities({ 
      tier: 'hot', 
      minScore: 70,
      sort: 'leadScore.totalScore:desc',
      limit: 50
    });
  }

  async getThisMonthsOpportunities(): Promise<OpportunitiesResponse> {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    return this.filterOpportunities({
      fromDate: firstDay.toISOString().split('T')[0],
      toDate: today.toISOString().split('T')[0],
      sort: 'createdAt:desc',
      limit: 100
    });
  }

  async getUnassignedNewLeads(): Promise<OpportunitiesResponse> {
    return this.filterOpportunities({ 
      status: 'new', 
      assignedTo: 'null',
      sort: 'createdAt:desc',
      limit: 50
    });
  }

  async getMultipleStatuses(statuses: string[]): Promise<OpportunitiesResponse> {
    return this.filterOpportunities({
      statuses,
      sort: 'leadScore.priority:desc',
      limit: 50
    });
  }

  async getOpportunitiesByDateRange(fromDate: string, toDate: string): Promise<OpportunitiesResponse> {
    return this.filterOpportunities({
      fromDate,
      toDate,
      sort: 'createdAt:desc',
      limit: 100
    });
  }

  async getOpportunitiesByScoreRange(minScore: number, maxScore: number): Promise<OpportunitiesResponse> {
    return this.filterOpportunities({
      minScore,
      maxScore,
      sort: 'leadScore.totalScore:desc',
      limit: 50
    });
  }

  async getOpportunitiesWithVehicles(): Promise<OpportunitiesResponse> {
    return this.filterOpportunities({
      hasVehicles: true,
      sort: 'createdAt:desc',
      limit: 50
    });
  }

  async getOpportunitiesWithQuotes(): Promise<OpportunitiesResponse> {
    return this.filterOpportunities({
      hasQuotes: true,
      sort: 'createdAt:desc',
      limit: 50
    });
  }

  async getNurturingOpportunities(): Promise<OpportunitiesResponse> {
    return this.filterOpportunities({
      isNurturing: true,
      sort: 'createdAt:desc',
      limit: 50
    });
  }

  async getOpportunitiesByCustomerName(customerName: string): Promise<OpportunitiesResponse> {
    return this.filterOpportunities({
      customerName,
      sort: 'createdAt:desc',
      limit: 50
    });
  }

  async getRevenueStats(): Promise<any> {
    try {
      return await extendedApiClient.get('/opportunities/stats/revenue');
    } catch (error) {
      console.error('Error fetching revenue stats:', error);
      throw error;
    }
  }

  async getOpportunityTypeStats(): Promise<any> {
    try {
      return await extendedApiClient.get('/opportunities/stats/types');
    } catch (error) {
      console.error('Error fetching opportunity type stats:', error);
      throw error;
    }
  }

  async getTopOpportunities(limit: number = 10): Promise<Opportunity[]> {
    try {
      return await extendedApiClient.get(`/opportunities/stats/top?limit=${limit}`);
    } catch (error) {
      console.error('Error fetching top opportunities:', error);
      throw error;
    }
  }

  async getFilterOptions(): Promise<any> {
    try {
      const overview = await this.getOpportunitiesOverview();
      
      return {
        statuses: ['new', 'attempted_to_contact', 'prospecting', 'appointment_scheduled', 'non_progressive', 'lost', 'won'],
        tiers: ['hot', 'warm', 'cold'],
        sources: (overview.bySource || []).map((source: any) => source._id).filter(Boolean),
        types: (overview.byType || []).map((type: any) => type._id).filter(Boolean),
        opportunityTypes: (overview.byOpportunityType || []).map((type: any) => type._id).filter(Boolean),
        scoringStats: await this.getScoringStats().catch(() => null),
        typeStats: await this.getOpportunityTypeStats().catch(() => null)
      };
    } catch (error) {
      console.error('Error fetching filter options:', error);
      return {
        statuses: ['new', 'attempted_to_contact', 'prospecting', 'appointment_scheduled', 'non_progressive', 'lost', 'won'],
        tiers: ['hot', 'warm', 'cold'],
        sources: [],
        types: [],
        opportunityTypes: [],
        scoringStats: null,
        typeStats: null
      };
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
    return this.filterOpportunities(filterParams);
  }

  async getOpportunitiesByType(opportunityType: 'SERVICE' | 'SALE' | 'REPAIR' | 'MAINTENANCE' | 'INSPECTION'): Promise<OpportunitiesResponse> {
    return this.filterOpportunities({
      opportunityType,
      sort: 'createdAt:desc',
      limit: 50
    });
  }

  async getServiceOpportunities(): Promise<OpportunitiesResponse> {
    return this.filterOpportunities({
      opportunityType: 'SERVICE',
      sort: 'createdAt:desc',
      limit: 50
    });
  }

  async getProductOpportunities(): Promise<OpportunitiesResponse> {
    return this.filterOpportunities({
      opportunityType: 'SALE',
      sort: 'createdAt:desc',
      limit: 50
    });
  }

  async getPaginatedResults(page: number = 1, limit: number = 20): Promise<OpportunitiesResponse> {
    return this.filterOpportunities({
      page,
      limit,
      sort: 'createdAt:desc'
    });
  }
}

export const opportunityService = new OpportunityService();