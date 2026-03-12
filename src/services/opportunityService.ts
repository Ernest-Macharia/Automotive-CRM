import { apiClient } from '@/lib/api/client';
import { handleUnauthorizedRedirect } from '@/lib/auth/unauthorized';
import { API_BASE_URL } from '@/lib/api/config';
import { 
  Note, 
  CreateNoteData, 
  UpdateNoteData, 
  NoteSearchParams, 
  NoteSummary,
  NoteType 
} from '@/types/note';

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
  forceCreate?: boolean;
}

export interface UpdateOpportunityData {
  subject?: string;
  type?: 'individual' | 'organization';
  status?: 'new' | 'attempted_to_contact' | 'prospecting' | 'appointment_scheduled' | 'non_progressive' | 'lost' | 'won';
  source?: 'web' | 'email' | 'call' | 'walk_in' | 'referral' | 'partner';
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

export interface ZohoOpportunityRecord {
  id?: string;
  _id?: string;
  subject?: string;
  customerName?: string;
  email?: string;
  phone?: string;
  source?: string;
  status?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface ZohoOpportunitySearchResponse {
  data: ZohoOpportunityRecord[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface StageHistory {
  stage: string;
  date: Date;
  triggeredBy: any;
  metadata?: any;
}

export interface DuplicateCheckRequest {
  customer?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
  };
  vehicles?: Array<{
    vin?: string;
    registrationNumber?: string;
    make?: string;
    model?: string;
  }>;
  subject?: string;
}

export interface DuplicateCheckResponse {
  isDuplicate: boolean;
  existingOpportunities: Opportunity[];
  confidenceScore: number;
  duplicateReasons: string[];
}

export interface ValidateWithDuplicatesRequest extends DuplicateCheckRequest {
  // Include all opportunity creation fields for validation
  type?: 'individual' | 'organization';
  subject?: string;
  status?: string;
  source?: string;
  customer: {
    name: string;
    email?: string;
    phone?: string;
    companyName?: string;
  };
  vehicles?: Array<{
    vin?: string;
    registrationNumber?: string;
    make: string;
    model: string;
  }>;
  opportunityType?: 'SERVICE' | 'SALE' | 'REPAIR' | 'MAINTENANCE' | 'INSPECTION';
}

export interface ValidateWithDuplicatesResponse {
  isValid: boolean;
  validationErrors: string[];
  lisStatus: {
    canProgress: boolean;
    status: 'green' | 'amber' | 'red';
    missingFields: string[];
  };
  duplicates: {
    isDuplicate: boolean;
    existingOpportunities: Opportunity[];
    confidenceScore: number;
  };
}

export interface SimilarOpportunitiesRequest {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  subject?: string;
  limit?: number;
}

export interface MergeDuplicatesRequest {
  sourceOpportunityId: string;
  duplicateOpportunityIds: string[];
  mergeNotes: boolean;
  mergeVehicles: boolean;
  keepSourceStatus: boolean;
}

export interface MergeDuplicatesResponse {
  success: boolean;
  mergedOpportunity: Opportunity;
  mergedCount: number;
  mergedOpportunities: string[];
  notes?: string;
}

export interface CsvMappingPayload {
  name: string;
  description?: string;
  fieldMappings: Record<string, string>;
  options?: Record<string, any>;
}

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
  error?: any;
  message?: string;
}

interface BackendDuplicateCheckData {
  isDuplicate: boolean;
  duplicate?: any;
  potentialDuplicates?: any[];
  message?: string;
}

interface BackendValidateWithDuplicatesData {
  validation: {
    isValid: boolean;
    lisResult?: {
      canProgress?: boolean;
      status?: 'green' | 'amber' | 'red';
      missingFields?: string[];
    };
    errors: string[];
  };
  duplicates: {
    found: boolean;
    count: number;
    items: any[];
    highSimilarity: number;
  };
}

// Extended ApiClient with headers support
class ExtendedApiClient {
  private getApiBaseUrl(): string {
    return API_BASE_URL;
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
        handleUnauthorizedRedirect();
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

function normalizeNoteAuthor(rawNote: any): { _id: string; name: string; email: string } {
  const createdByValue = rawNote?.createdBy;
  const createdByObj =
    createdByValue && typeof createdByValue === 'object'
      ? createdByValue
      : rawNote?.author && typeof rawNote.author === 'object'
        ? rawNote.author
        : null;

  const id =
    createdByObj?._id ||
    createdByObj?.id ||
    (typeof createdByValue === 'string' ? createdByValue : null) ||
    rawNote?.author?._id ||
    'unknown';

  const email =
    createdByObj?.email ||
    rawNote?.createdByEmail ||
    rawNote?.author?.email ||
    'unknown@example.com';

  const composedName = `${createdByObj?.firstName || ''} ${createdByObj?.lastName || ''}`.trim();
  const name =
    createdByObj?.name ||
    composedName ||
    rawNote?.createdByName ||
    rawNote?.author?.name ||
    (typeof email === 'string' && email.includes('@') ? email.split('@')[0] : '') ||
    'Unknown User';

  return {
    _id: String(id),
    name: String(name),
    email: String(email),
  };
}

class OpportunityService {
  private async uploadCsvFile<T>(
    endpoint: string,
    file: File,
    extraFields?: Record<string, string>
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    if (extraFields) {
      Object.entries(extraFields).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, value);
        }
      });
    }

    const token = sessionStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE_URL}/opportunities${endpoint}`, {
      method: 'POST',
      body: formData,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 401) {
        handleUnauthorizedRedirect();
      }
      throw new Error(`API Error (${response.status}): ${errorText || response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return {} as T;
  }

  async previewCsvImport(file: File): Promise<any> {
    return this.uploadCsvFile('/csv/preview', file);
  }

  async saveCsvMapping(data: CsvMappingPayload): Promise<any> {
    return extendedApiClient.post<CsvMappingPayload, any>('/opportunities/csv/mappings', data);
  }

  async listCsvMappings(): Promise<any> {
    return extendedApiClient.get<any>('/opportunities/csv/mappings');
  }

  async getCsvMapping(id: string): Promise<any> {
    return extendedApiClient.get<any>(`/opportunities/csv/mappings/${id}`);
  }

  async executeCsvImport(
    file: File,
    options?: { mappingId?: string; fieldMappings?: Record<string, string>; dryRun?: boolean }
  ): Promise<any> {
    const extraFields: Record<string, string> = {};

    if (options?.mappingId) {
      extraFields.mappingId = options.mappingId;
    }
    if (options?.fieldMappings) {
      extraFields.fieldMappings = JSON.stringify(options.fieldMappings);
    }
    if (typeof options?.dryRun === 'boolean') {
      extraFields.dryRun = String(options.dryRun);
    }

    return this.uploadCsvFile('/csv/execute', file, extraFields);
  }

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
      const response = await extendedApiClient.get<any>(endpoint);
      const payload =
        Array.isArray(response?.data)
          ? response
          : Array.isArray(response?.data?.data)
            ? response.data
            : response;

      return {
        data: Array.isArray(payload?.data) ? payload.data : [],
        pagination:
          payload?.pagination ||
          (payload?.meta
            ? {
                total: payload.meta.total,
                page: payload.meta.page,
                limit: payload.meta.limit,
                totalPages: payload.meta.totalPages,
              }
            : undefined),
        stats: payload?.stats,
      };
    } catch (error) {
      console.error('Error getting all opportunities:', error);
      throw error;
    }
  }

  async fetchZohoOpportunityData(params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ZohoOpportunitySearchResponse> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('q', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));

    const suffix = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const candidateEndpoints = [
      `/zoho-data/search${suffix}`,
      `/zoho-data${suffix}`,
      `/zoho-data/opportunities${suffix}`,
      `/opportunities/zoho-data/search${suffix}`,
    ];

    for (const endpoint of candidateEndpoints) {
      try {
        const response = await extendedApiClient.get<any>(endpoint);
        if (Array.isArray(response)) {
          return { data: response, total: response.length, page: params?.page || 1, totalPages: 1 };
        }
        return {
          data: response?.data || [],
          total:
            response?.total ??
            response?.count ??
            response?.meta?.total ??
            response?.pagination?.total,
          page:
            response?.page ??
            response?.meta?.page ??
            response?.meta?.currentPage ??
            response?.pagination?.page ??
            params?.page ??
            1,
          limit:
            response?.limit ??
            response?.meta?.limit ??
            response?.pagination?.limit ??
            params?.limit,
          totalPages:
            response?.totalPages ??
            response?.pages ??
            response?.meta?.totalPages ??
            response?.pagination?.totalPages ??
            response?.pagination?.pages,
        };
      } catch {
        // Try next endpoint
      }
    }

    // Final fallback to standard opportunities filter when dedicated Zoho endpoint is unavailable.
    const fallback = await this.filterOpportunities({
      source: 'zoho',
      search: params?.search,
      status: params?.status,
      page: params?.page,
      limit: params?.limit,
    });

    return {
      data: fallback.data || [],
      total: fallback.pagination?.total || fallback.data?.length || 0,
      page: fallback.pagination?.page || 1,
      totalPages: fallback.pagination?.totalPages || 1,
    };
  }

  private mapDuplicateCandidateToOpportunity(raw: any): Opportunity {
    const customer = raw?.customer || {};
    const id = raw?._id || raw?.id || '';

    return {
      _id: String(id),
      id: String(id),
      type: (raw?.type || 'individual') as Opportunity['type'],
      subject: String(raw?.subject || 'Potential duplicate'),
      status: (raw?.status || 'new') as Opportunity['status'],
      source: raw?.source || undefined,
      customer: {
        name: String(customer?.name || ''),
        email: customer?.email || undefined,
        companyName: customer?.companyName || undefined,
        phone: customer?.phone || undefined,
        _id: String(customer?._id || customer?.id || ''),
        id: String(customer?.id || customer?._id || ''),
      },
      vehicles: Array.isArray(raw?.vehicles) ? raw.vehicles : [],
      jobCards: [],
      waivers: [],
      quotes: [],
      assignedTo: raw?.assignedTo || null,
      createdAt: raw?.createdAt || new Date().toISOString(),
      updatedAt: raw?.updatedAt || new Date().toISOString(),
      isNurturing: Boolean(raw?.isNurturing),
      leadScore: raw?.leadScore
        ? {
            totalScore: Number(raw.leadScore.totalScore || 0),
            tier: (raw.leadScore.tier || 'cold') as 'hot' | 'warm' | 'cold',
            priority: Number(raw.leadScore.priority || 0),
            lastCalculated: raw.leadScore.lastCalculated || new Date().toISOString(),
          }
        : undefined,
    };
  }

  // Create opportunity
  async createOpportunity(data: CreateOpportunityData, userId?: string): Promise<Opportunity> {
    try {
      const headers: Record<string, string> = {};
      
      if (userId) {
        headers['X-User-Id'] = userId;
      }

      const response = await extendedApiClient.post<CreateOpportunityData, ApiEnvelope<Opportunity> | Opportunity>(
        '/opportunities',
        data,
        headers
      );

      if (response && typeof response === 'object' && 'success' in (response as any)) {
        const wrapped = response as ApiEnvelope<Opportunity>;
        if (wrapped.success === false) {
          // Backend duplicate responses are returned with HTTP 200 and success=false.
          const errorPayload = wrapped.error || { message: wrapped.message || 'Failed to create opportunity' };
          if (typeof errorPayload === 'string') {
            throw new Error(errorPayload);
          }
          throw new Error(JSON.stringify(errorPayload));
        }
        if (wrapped.data) {
          return wrapped.data;
        }
      }

      return response as Opportunity;
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
      return await extendedApiClient.post<any, any>(
        `/opportunities/${id}/recalculate-score`, 
        {}
      );
    } catch (error: any) {
      console.error(`Error recalculating lead score for ${id}:`, error);
      
      // Parse error message
      let errorMessage = 'Failed to recalculate lead score';
      
      if (error.message) {
        try {
          const parsed = JSON.parse(error.message.replace('API Error (500): ', ''));
          if (parsed.message) {
            errorMessage = parsed.message;
          }
        } catch {
          errorMessage = error.message;
        }
      }
      
      throw new Error(errorMessage);
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
      const response = await fetch(`${apiBaseUrl}/opportunities/${opportunityId}/vehicles/${vehicleId}/image`, {
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
  async initializeWorkflow(opportunityId: string, packageType: 'work_order' | 'sales_order'): Promise<any> {
    try {
      const headers: Record<string, string> = {};
      
      // Get current opportunity
      const opportunity = await this.getOpportunityById(opportunityId);

      const source = opportunity.source as 'web' | 'email' | 'call' | 'walk_in' | 'referral' | 'partner' || 'walk_in';
      
      // Update opportunity with package type and source
      const updatedOpportunity = await this.updateOpportunity(opportunityId, {
        packageType,
        opportunityType: packageType === 'work_order' ? 'SERVICE' : 'SALE',
        source: source
      });
      
      // Initialize lifecycle
      const lifecycleService = require('./lifecycleService');
      const result = await lifecycleService.initializeOpportunity(opportunityId, { packageType });
      
      return {
        opportunity: updatedOpportunity,
        lifecycle: result
      };
    } catch (error) {
      console.error('Error initializing workflow:', error);
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

  async getOrphanedOpportunities(params?: {
    page?: number;
    limit?: number;
    organizationId?: string;
    includeOrphanedUsers?: boolean;
  }): Promise<{
    data: Opportunity[];
    pagination: { page: number; limit: number; total: number; pages: number };
    orphanedUsersCount?: number;
    orphanedUsers?: any[];
    missingOwnerReferences?: Array<{ ownerId: string; count: number }>;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.organizationId) queryParams.append('organizationId', params.organizationId);
    if (typeof params?.includeOrphanedUsers === 'boolean') {
      queryParams.append('includeOrphanedUsers', String(params.includeOrphanedUsers));
    }
    const endpoint = `/opportunities/orphaned-opportunities${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return extendedApiClient.get(endpoint);
  }

  async listAssignmentRules(organizationId?: string): Promise<any[]> {
    const endpoint = organizationId
      ? `/opportunities/assignment-rules?organizationId=${encodeURIComponent(organizationId)}`
      : '/opportunities/assignment-rules';
    return extendedApiClient.get<any[]>(endpoint);
  }

  async createAssignmentRule(data: any, organizationId?: string): Promise<any> {
    const endpoint = organizationId
      ? `/opportunities/assignment-rules?organizationId=${encodeURIComponent(organizationId)}`
      : '/opportunities/assignment-rules';
    return extendedApiClient.post<any, any>(endpoint, data);
  }

  async updateAssignmentRule(ruleId: string, data: any, organizationId?: string): Promise<any> {
    const endpoint = organizationId
      ? `/opportunities/assignment-rules/${ruleId}?organizationId=${encodeURIComponent(organizationId)}`
      : `/opportunities/assignment-rules/${ruleId}`;
    return extendedApiClient.patch<any, any>(endpoint, data);
  }

  async deleteAssignmentRule(ruleId: string, organizationId?: string): Promise<{ message?: string }> {
    const endpoint = organizationId
      ? `/opportunities/assignment-rules/${ruleId}?organizationId=${encodeURIComponent(organizationId)}`
      : `/opportunities/assignment-rules/${ruleId}`;
    return extendedApiClient.delete<{ message?: string }>(endpoint);
  }

  async configureLISRules(rules: any): Promise<{ message: string }> {
    return extendedApiClient.post<any, { message: string }>('/opportunities/configure/lis', rules);
  }

  async configureSLA(config: any): Promise<{ message: string }> {
    return extendedApiClient.post<any, { message: string }>('/opportunities/configure/sla', config);
  }

  async forceReassignStuckOpportunities(organizationId?: string): Promise<any> {
    const endpoint = organizationId
      ? `/opportunities/force-reassign-stuck?organizationId=${encodeURIComponent(organizationId)}`
      : '/opportunities/force-reassign-stuck';
    return extendedApiClient.post<any, any>(endpoint, {});
  }

  async validateOpportunityData(data: CreateOpportunityData): Promise<any> {
    return extendedApiClient.post<CreateOpportunityData, any>('/opportunities/validate/data', data);
  }

  async getRecentSLABreaches(days: number = 7, organizationId?: string): Promise<any> {
    const queryParams = new URLSearchParams();
    queryParams.append('days', String(days));
    if (organizationId) queryParams.append('organizationId', organizationId);
    return extendedApiClient.get(`/opportunities/sla/breaches/recent?${queryParams.toString()}`);
  }

  async getUpcomingSLADeadlines(hours: number = 24): Promise<any> {
    return extendedApiClient.get(`/opportunities/sla/upcoming-deadlines?hours=${hours}`);
  }

  async triggerBulkSLACheck(): Promise<any> {
    return extendedApiClient.post<any, any>('/opportunities/sla/check-all', {});
  }

    /**
   * Get reassignment candidates for an opportunity
   * GET /api/v1/opportunities/{id}/reassignment/candidates
   */
  async getReassignmentCandidates(opportunityId: string): Promise<any[]> {
    try {
      return await extendedApiClient.get<any[]>(
        `/opportunities/${opportunityId}/reassignment/candidates`
      );
    } catch (error) {
      console.error('Error fetching reassignment candidates:', error);
      throw error;
    }
  }

  /**
   * Reassign opportunity to another user
   * POST /api/v1/opportunities/{id}/reassign
   */
  async reassignOpportunity(
    opportunityId: string,
    userId: string,
    notes?: string
  ): Promise<{ message?: string; opportunity?: Opportunity; success?: boolean; [key: string]: any }> {
    try {
      return await extendedApiClient.post<
        { reason: string; specificUserId: string; notifyOldAssignee: boolean },
        { message?: string; opportunity?: Opportunity; success?: boolean; [key: string]: any }
      >(
        `/opportunities/${opportunityId}/reassign`,
        {
          reason: notes?.trim() || 'Manual reassignment from frontend',
          specificUserId: userId,
          notifyOldAssignee: true
        }
      );
    } catch (error) {
      console.error('Error reassigning opportunity:', error);
      throw error;
    }
  }

  async requestAssignment(opportunityId: string, data: Record<string, any> = {}): Promise<any> {
    try {
      return await extendedApiClient.post(`/opportunities/${opportunityId}/request-assignment`, data);
    } catch (error) {
      console.error('Error requesting opportunity assignment:', error);
      throw error;
    }
  }

  /**
   * Refresh LIS validation for opportunity
   * POST /api/v1/opportunities/{id}/lis/refresh
   */
  async refreshLISValidation(opportunityId: string): Promise<any> {
    try {
      return await extendedApiClient.post<any, any>(
        `/opportunities/${opportunityId}/lis/refresh`,
        {}
      );
    } catch (error) {
      console.error('Error refreshing LIS validation:', error);
      throw error;
    }
  }

  async validateOpportunityLIS(opportunityId: string): Promise<any> {
    try {
      return await extendedApiClient.get(`/opportunities/${opportunityId}/lis/validate`);
    } catch (error) {
      console.error('Error validating opportunity LIS:', error);
      throw error;
    }
  }

  async checkOpportunitySLAStatus(opportunityId: string): Promise<any> {
    try {
      return await extendedApiClient.get(`/opportunities/${opportunityId}/sla/check`);
    } catch (error) {
      console.error('Error checking opportunity SLA status:', error);
      throw error;
    }
  }

  /**
   * Check SLA for specific opportunity
   * POST /api/v1/opportunities/{id}/check-sla
   */
  async checkOpportunitySLA(opportunityId: string): Promise<any> {
    try {
      return await extendedApiClient.post<any, any>(
        `/opportunities/${opportunityId}/check-sla`,
        {}
      );
    } catch (error) {
      console.error('Error checking opportunity SLA:', error);
      throw error;
    }
  }

  /**
   * Trigger SLA notification test endpoint
   * POST /api/v1/opportunities/test/sla-notification
   */
  async testSlaNotification(data: Record<string, any> = {}): Promise<any> {
    try {
      return await extendedApiClient.post<Record<string, any>, any>(
        '/opportunities/test/sla-notification',
        data
      );
    } catch (error) {
      console.error('Error testing opportunity SLA notification:', error);
      throw error;
    }
  }

  /**
   * Check both LIS and SLA for opportunity
   * POST /api/v1/opportunities/{id}/lis/sla/check
   */
  async checkLISAndSLA(opportunityId: string): Promise<{
    lis: any;
    sla: any;
  }> {
    try {
      return await extendedApiClient.post<any, { lis: any; sla: any }>(
        `/opportunities/${opportunityId}/lis/sla/check`,
        {}
      );
    } catch (error) {
      console.error('Error checking LIS and SLA:', error);
      throw error;
    }
  }

  /**
   * Get opportunities needing reassignment
   * GET /api/v1/opportunities/needs-reassignment
   */
  async getOpportunitiesNeedingReassignment(): Promise<Opportunity[]> {
    try {
      return await extendedApiClient.get<Opportunity[]>('/opportunities/needs-reassignment');
    } catch (error) {
      console.error('Error fetching opportunities needing reassignment:', error);
      throw error;
    }
  }

  /**
   * Get SLA status summary
   * GET /api/v1/opportunities/sla/status-summary
   */
  async getSLAStatusSummary(): Promise<any> {
    try {
      return await extendedApiClient.get('/opportunities/sla/status-summary');
    } catch (error) {
      console.error('Error fetching SLA status summary:', error);
      throw error;
    }
  }

  /**
   * Get LIS & SLA dashboard stats
   * GET /api/v1/opportunities/dashboard/lis-sla
   */
  async getLISSLADashboardStats(): Promise<any> {
    try {
      return await extendedApiClient.get('/opportunities/dashboard/lis-sla');
    } catch (error) {
      console.error('Error fetching LIS/SLA dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get SLA metrics trend
   * GET /api/v1/opportunities/sla/metrics/trend
   */
  async getSLAMetricsTrend(): Promise<any> {
    try {
      return await extendedApiClient.get('/opportunities/sla/metrics/trend');
    } catch (error) {
      console.error('Error fetching SLA metrics trend:', error);
      throw error;
    }
  }

  async addNote(opportunityId: string, noteData: CreateNoteData): Promise<Note> {
  try {
    // Transform frontend data structure to backend expected format
    const backendData: Record<string, any> = {
      content: noteData.content
    };
    
    // Add type if provided (backend makes it optional)
    if (noteData.type) {
      backendData.type = noteData.type;
    }
    
    // Handle tags - backend expects a comma-separated string, not array
    if (noteData.metadata?.tags && noteData.metadata.tags.length > 0) {
      backendData.tags = noteData.metadata.tags.join(',');
    }
    
    // Note: backend doesn't support attachments or pinned status yet
    // You might want to log a warning if these are being sent
    if (noteData.metadata?.attachments || noteData.metadata?.pinned !== undefined) {
      console.warn('Backend does not support attachments or pinned status yet');
    }
    
    // Make the API call
    const response = await extendedApiClient.post<any, any>(
      `/opportunities/${opportunityId}/notes`,
      backendData
    );

    const createdNote = response?.note || response?.data || response;
    const parsedTags = Array.isArray(createdNote?.tags)
      ? createdNote.tags.filter((t: string) => typeof t === 'string' && t.trim())
      : typeof createdNote?.tags === 'string'
        ? createdNote.tags.split(',').filter((t: string) => t.trim())
        : [];
    
    // Transform backend response back to frontend Note format
    const note: Note = {
      _id: createdNote?._id || createdNote?.id,
      id: createdNote?.id || createdNote?._id,
      opportunityId: opportunityId,
      type: createdNote?.type || noteData.type || 'general',
      content: createdNote?.content || noteData.content,
      author: normalizeNoteAuthor(createdNote),
      metadata: {
        tags: parsedTags,
        pinned: false, // Default to false since backend doesn't support
        attachments: []
      },
      createdAt: createdNote?.createdAt || new Date().toISOString(),
      updatedAt: createdNote?.updatedAt || new Date().toISOString()
    };
    
    return note;
  } catch (error: any) {
    console.error(`Error adding note to opportunity ${opportunityId}:`, error);
    console.error('Original data:', noteData);
    
    let errorMessage = 'Failed to add note';
    
    if (error.message) {
      try {
        const parsed = JSON.parse(error.message.replace('API Error (500): ', ''));
        if (parsed.message) {
          errorMessage = parsed.message;
        }
      } catch {
        errorMessage = error.message;
      }
    }
    
    throw new Error(errorMessage);
  }
}

async getNotes(opportunityId: string): Promise<Note[]> {
  try {
    const response = await extendedApiClient.get<any>(
      `/opportunities/${opportunityId}/notes`
    );
    
    // Handle different response formats
    let notesData: any[] = [];
    if (Array.isArray(response)) {
      notesData = response;
    } else if (response.data && Array.isArray(response.data)) {
      notesData = response.data;
    } else if (response.notes && Array.isArray(response.notes)) {
      notesData = response.notes;
    } else {
      console.warn('Unexpected notes response format:', response);
      return [];
    }
    
    // Transform each note to match frontend Note interface
    const notes: Note[] = notesData.map(note => ({
      _id: note._id || note.id,
      id: note.id || note._id,
      opportunityId: opportunityId,
      type: note.type || 'general',
      content: note.content,
      author: normalizeNoteAuthor(note),
      metadata: {
        tags: note.tags ? 
          (Array.isArray(note.tags) ? note.tags : note.tags.split(',').filter((t: string) => t.trim())) 
          : [],
        pinned: note.pinned || false,
        attachments: note.attachments || []
      },
      createdAt: note.createdAt || new Date().toISOString(),
      updatedAt: note.updatedAt || new Date().toISOString()
    }));
    
    return notes;
  } catch (error) {
    console.error(`Error fetching notes for opportunity ${opportunityId}:`, error);
    return [];
  }
}

async updateNote(opportunityId: string, noteId: string, noteData: UpdateNoteData): Promise<Note> {
  try {
    // Transform update data for backend
    const backendData: Record<string, any> = {};
    
    if (noteData.content) {
      backendData.content = noteData.content;
    }
    
    if (noteData.type) {
      backendData.type = noteData.type;
    }
    
    // Handle tags if present in metadata
    if (noteData.metadata?.tags) {
      backendData.tags = noteData.metadata.tags.join(',');
    }
    
    // Note: pinned and attachments aren't supported by backend yet
    
    const response = await extendedApiClient.patch<any, any>(
      `/opportunities/${opportunityId}/notes/${noteId}`,
      backendData
    );
    
    // Transform response back to frontend format
    return {
      _id: response._id || response.id || noteId,
      id: response.id || response._id || noteId,
      opportunityId: opportunityId,
      type: response.type || noteData.type || 'general',
      content: response.content || noteData.content || '',
      author: normalizeNoteAuthor(response),
      metadata: {
        tags: response.tags ? 
          (Array.isArray(response.tags) ? response.tags : response.tags.split(',').filter((t: string) => t.trim())) 
          : noteData.metadata?.tags || [],
        pinned: noteData.metadata?.pinned || false,
        // attachments: noteData.metadata?.attachments || []
      },
      createdAt: response.createdAt || new Date().toISOString(),
      updatedAt: response.updatedAt || new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error updating note ${noteId}:`, error);
    throw error;
  }
}

  async getNotesSummary(opportunityId: string): Promise<NoteSummary> {
    try {
      const response = await extendedApiClient.get<any>(
        `/opportunities/${opportunityId}/notes/summary`
      );
      
      // Return a default structure if the response is malformed
      if (!response) {
        return {
          totalNotes: 0,
          byType: [],
          recentActivity: [],
          authors: []
        };
      }
      
      // Ensure byType is always an array
      const summary = {
        totalNotes: response.totalNotes || 0,
        byType: Array.isArray(response.byType) ? response.byType : [],
        recentActivity: Array.isArray(response.recentActivity) ? response.recentActivity : [],
        authors: Array.isArray(response.authors) ? response.authors : []
      };
      
      return summary;
    } catch (error) {
      console.error(`Error fetching notes summary for opportunity ${opportunityId}:`, error);
      return {
        totalNotes: 0,
        byType: [],
        recentActivity: [],
        authors: []
      };
    }
  }

  async getNotesByType(opportunityId: string, type: NoteType): Promise<Note[]> {
    try {
      return await extendedApiClient.get<Note[]>(
        `/opportunities/${opportunityId}/notes/type/${type}`
      );
    } catch (error) {
      console.error(`Error fetching notes by type for opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  async deleteNote(opportunityId: string, noteId: string): Promise<{ message: string }> {
    try {
      return await extendedApiClient.delete<{ message: string }>(
        `/opportunities/${opportunityId}/notes/${noteId}`
      );
    } catch (error) {
      console.error(`Error deleting note ${noteId}:`, error);
      throw error;
    }
  }

  async searchNotes(opportunityId: string, params: NoteSearchParams): Promise<Note[]> {
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
      
      const endpoint = `/opportunities/${opportunityId}/notes/search${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await extendedApiClient.get<Note[]>(endpoint);
    } catch (error) {
      console.error(`Error searching notes for opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  async uploadNoteAttachment(
    opportunityId: string,
    noteId: string,
    file: File
  ): Promise<Note> {
    try {
      const formData = new FormData();
      formData.append('attachment', file);
      
      const apiBaseUrl = (apiClient as any).API_BASE_URL || '';
      const response = await fetch(`${apiBaseUrl}/opportunities/${opportunityId}/notes/${noteId}/attachments`, {
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
      console.error('Error uploading note attachment:', error);
      throw error;
    }
  }

  async removeNoteAttachment(opportunityId: string, noteId: string, attachmentId: string): Promise<Note> {
    try {
      return await extendedApiClient.delete<Note>(
        `/opportunities/${opportunityId}/notes/${noteId}/attachments/${attachmentId}`
      );
    } catch (error) {
      console.error('Error removing note attachment:', error);
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

  async checkForDuplicates(data: DuplicateCheckRequest): Promise<DuplicateCheckResponse> {
    try {
      const response = await extendedApiClient.post<
        DuplicateCheckRequest,
        ApiEnvelope<BackendDuplicateCheckData> | BackendDuplicateCheckData
      >(
        '/opportunities/check-duplicate',
        data
      );

      const payload: BackendDuplicateCheckData =
        response && typeof response === 'object' && 'data' in (response as any)
          ? ((response as ApiEnvelope<BackendDuplicateCheckData>).data as BackendDuplicateCheckData)
          : (response as BackendDuplicateCheckData);

      const duplicateItems = [
        ...(payload?.duplicate ? [payload.duplicate] : []),
        ...(Array.isArray(payload?.potentialDuplicates) ? payload.potentialDuplicates : []),
      ];

      const existingOpportunities = duplicateItems.map(item => this.mapDuplicateCandidateToOpportunity(item));
      const confidenceScore = duplicateItems.reduce((max, item: any) => {
        const similarity = Number(item?.similarity || 0);
        return similarity > max ? similarity : max;
      }, 0);

      return {
        isDuplicate: Boolean(payload?.isDuplicate),
        existingOpportunities,
        confidenceScore,
        duplicateReasons: payload?.message ? [payload.message] : [],
      };
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      throw error;
    }
  }

  /**
   * Validate opportunity data and check for duplicates
   * POST /api/v1/opportunities/validate-with-duplicates
   */
  async validateWithDuplicates(
    data: ValidateWithDuplicatesRequest,
    checkDuplicates: boolean = true
  ): Promise<ValidateWithDuplicatesResponse> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('checkDuplicates', checkDuplicates.toString());
      
      const response = await extendedApiClient.post<
        ValidateWithDuplicatesRequest,
        ApiEnvelope<BackendValidateWithDuplicatesData> | BackendValidateWithDuplicatesData
      >(
        `/opportunities/validate-with-duplicates?${queryParams.toString()}`,
        data
      );

      const payload: BackendValidateWithDuplicatesData =
        response && typeof response === 'object' && 'data' in (response as any)
          ? ((response as ApiEnvelope<BackendValidateWithDuplicatesData>).data as BackendValidateWithDuplicatesData)
          : (response as BackendValidateWithDuplicatesData);

      return {
        isValid: Boolean(payload?.validation?.isValid),
        validationErrors: Array.isArray(payload?.validation?.errors) ? payload.validation.errors : [],
        lisStatus: {
          canProgress: payload?.validation?.lisResult?.canProgress ?? Boolean(payload?.validation?.isValid),
          status: payload?.validation?.lisResult?.status || 'green',
          missingFields: Array.isArray(payload?.validation?.lisResult?.missingFields)
            ? payload.validation.lisResult.missingFields
            : [],
        },
        duplicates: {
          isDuplicate: Boolean(payload?.duplicates?.found),
          existingOpportunities: Array.isArray(payload?.duplicates?.items)
            ? payload.duplicates.items.map(item => this.mapDuplicateCandidateToOpportunity(item))
            : [],
          confidenceScore: Number(payload?.duplicates?.highSimilarity || 0),
        },
      };
    } catch (error) {
      console.error('Error validating with duplicates:', error);
      throw error;
    }
  }

  /**
   * Find similar opportunities
   * GET /api/v1/opportunities/find-similar
   */
  async findSimilarOpportunities(params: SimilarOpportunitiesRequest): Promise<Opportunity[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.customerName) queryParams.append('customerName', params.customerName);
      if (params.customerPhone) queryParams.append('customerPhone', params.customerPhone);
      if (params.customerEmail) queryParams.append('customerEmail', params.customerEmail);
      if (params.subject) queryParams.append('subject', params.subject);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      
      const endpoint = `/opportunities/find-similar${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await extendedApiClient.get<any>(endpoint);

      const results = response?.data?.results;
      if (Array.isArray(results)) {
        return results.map((item: any) => this.mapDuplicateCandidateToOpportunity(item));
      }

      if (Array.isArray(response)) {
        return response.map((item: any) => this.mapDuplicateCandidateToOpportunity(item));
      }

      return [];
    } catch (error) {
      console.error('Error finding similar opportunities:', error);
      throw error;
    }
  }

  /**
   * Merge duplicate opportunities
   * POST /api/v1/opportunities/merge-duplicates
   */
  async mergeDuplicates(data: MergeDuplicatesRequest): Promise<MergeDuplicatesResponse> {
    try {
      return await extendedApiClient.post<MergeDuplicatesRequest, MergeDuplicatesResponse>(
        '/opportunities/merge-duplicates',
        data
      );
    } catch (error) {
      console.error('Error merging duplicates:', error);
      throw error;
    }
  }

  /**
   * Enhanced create opportunity with duplicate check and validation
   */
  async createOpportunityWithValidation(
    data: CreateOpportunityData,
    options: {
      checkDuplicates?: boolean;
      validateLIS?: boolean;
      userId?: string;
    } = {}
  ): Promise<{
    opportunity: Opportunity;
    validation?: ValidateWithDuplicatesResponse;
    createdWithDuplicates?: boolean;
  }> {
    try {
      const { checkDuplicates = true, validateLIS = true, userId } = options;
      
      // Step 1: Validate with duplicates if requested
      let validationResult: ValidateWithDuplicatesResponse | undefined;
      if (validateLIS || checkDuplicates) {
        const validationData: ValidateWithDuplicatesRequest = {
          type: data.type,
          subject: data.subject,
          status: data.status || 'new',
          source: data.source,
          customer: data.customer,
          vehicles: data.vehicles?.map(v => ({
            vin: v.vin,
            registrationNumber: v.registrationNumber,
            make: v.make,
            model: v.model
          })),
          opportunityType: data.opportunityType
        };
        
        validationResult = await this.validateWithDuplicates(validationData, checkDuplicates);
        
        if (!validationResult.isValid) {
          throw new Error(`Validation failed: ${validationResult.validationErrors.join(', ')}`);
        }
        
        if (validationResult.duplicates.isDuplicate) {
          // Return validation result so UI can show duplicate modal
          return {
            opportunity: {} as Opportunity, // Empty opportunity since not created yet
            validation: validationResult,
            createdWithDuplicates: false
          };
        }
      }
      
      // Step 2: Create opportunity
      const opportunity = await this.createOpportunity(data, userId);
      
      return {
        opportunity,
        validation: validationResult,
        createdWithDuplicates: false
      };
    } catch (error) {
      console.error('Error creating opportunity with validation:', error);
      throw error;
    }
  }

  /**
   * Helper method to check duplicates with customer data
   * (Kept for backward compatibility)
   */
  async checkForDuplicatesSimple(customerData: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
  }): Promise<{ isDuplicate: boolean; existingOpportunities: Opportunity[] }> {
    try {
      const response = await this.checkForDuplicates({
        customer: customerData
      });
      
      return {
        isDuplicate: response.isDuplicate,
        existingOpportunities: response.existingOpportunities
      };
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      return { isDuplicate: false, existingOpportunities: [] };
    }
  }
}

export const opportunityService = new OpportunityService();
