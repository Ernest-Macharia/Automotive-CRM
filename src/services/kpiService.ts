import { apiClient } from '@/lib/api/client';
import { handleUnauthorizedRedirect } from '@/lib/auth/unauthorized';
import { format, endOfMonth } from 'date-fns';

// Interfaces
export interface KPIFormData {
  title: string;
  description?: string;
  assignedTo: string;
  role: string;
  metrics: Array<{
    name: string;
    description?: string;
    type: 'quantitative' | 'qualitative' | 'percentage' | 'binary';
    targetValue?: number;
    currentValue?: number;
    unit?: string;
    weight: number;
  }>;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  periodStart: string;
  periodEnd: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  isTemplate?: boolean;
  distributeToSubordinates?: boolean;
  notes?: string;
  priority?: string;
}

export interface KPIMetric {
  id?: string;
  _id?: string;
  name: string;
  description?: string;
  type: 'quantitative' | 'qualitative' | 'percentage' | 'binary' | 'scale' | 'currency';
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  weight: number;
  score?: number;
  status?: 'pending' | 'in_progress' | 'completed' | 'not_started';
  progress?: number;
  notes?: string;
  updatedAt?: string;
  createdBy?: string;
  scoringMethod?: 'linear' | 'threshold' | 'range';
  thresholds?: {
    excellent: number;
    good: number;
    average: number;
    poor: number;
  };
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
}

export interface UserRef {
  _id: string;
  id?: string;
  name: string;
  email: string;
  employeeId?: string;
  avatar?: string;
  role: string;
  department?: string;
  designation?: string;
  reportingTo?: string;
  isActive: boolean;
  phone?: string;
}

export interface DepartmentRef {
  _id: string;
  name: string;
  code?: string;
  manager?: UserRef;
  parentDepartment?: string;
}

export interface RoleRef {
  _id: string;
  name: string;
  displayName: string;
  permissions: string[];
  isSystemRole: boolean;
}

export interface Kpi {
  _id: string;
  id?: string;
  kpiId: string;
  title: string;
  description?: string;
  assignedTo: UserRef;
  assignedBy: UserRef;
  approver?: UserRef;
  profile?: UserRef;
  role: RoleRef;
  department?: DepartmentRef;
  metrics: KPIMetric[];
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom' | 'adhoc';
  periodStart: string;
  periodEnd: string;
  status: 'draft' | 'pending' | 'in_progress' | 'under_review' | 'approved' | 'rejected' | 'completed' | 'overdue' | 'cancelled';
  overallScore?: number;
  targetScore?: number;
  achievedScore?: number;
  performanceRating?: 'excellent' | 'good' | 'average' | 'poor' | 'needs_improvement';
  notes?: string;
  comments?: Array<{
    user: UserRef;
    comment: string;
    timestamp: string;
    type: 'comment' | 'review' | 'approval';
  }>;
  completedAt?: string;
  reviewedBy?: UserRef;
  reviewedAt?: string;
  approvedBy?: UserRef;
  approvedAt?: string;
  reviewComments?: string;
  isTemplate: boolean;
  templateId?: string;
  parentKpi?: string;
  childKpis?: string[];
  tags?: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  visibility: 'private' | 'team' | 'department' | 'organization';
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedBy: UserRef;
    uploadedAt: string;
  }>;
  reminders?: Array<{
    type: 'email' | 'notification';
    sentAt: string;
    sentTo: string[];
  }>;
  lastUpdated?: string;
  createdAt: string;
  updatedAt: string;
  version?: number;
  history?: Array<{
    version: number;
    changes: Record<string, any>;
    changedBy: UserRef;
    changedAt: string;
  }>;
}

export interface KpiTemplate {
  _id: string;
  id?: string;
  templateId: string;
  name: string;
  description?: string;
  role: RoleRef;
  department?: DepartmentRef;
  category: string;
  subCategory?: string;
  metrics: KPIMetric[];
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  defaultWeight: number;
  scoringCriteria?: Record<string, any>;
  tags?: string[];
  isActive: boolean;
  isSystemTemplate: boolean;
  usageCount: number;
  lastUsed?: string;
  createdBy: UserRef;
  createdAt: string;
  updatedAt: string;
  version: number;
  approvalWorkflow?: {
    requiresApproval: boolean;
    approvers: UserRef[];
    autoApprove?: boolean;
  };
}

export interface CreateKpiData {
  title: string;
  description?: string;
  assignedTo: string;
  role: string;
  department?: string;
  metrics: Array<{
    name: string;
    description?: string;
    type: 'quantitative' | 'qualitative' | 'percentage' | 'binary' | 'scale' | 'currency';
    targetValue?: number;
    unit?: string;
    weight: number;
    scoringMethod?: 'linear' | 'threshold' | 'range';
    thresholds?: {
      excellent: number;
      good: number;
      average: number;
      poor: number;
    };
  }>;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom' | 'adhoc';
  periodStart: string;
  periodEnd: string;
  status?: 'draft' | 'pending' | 'in_progress';
  isTemplate?: boolean;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  visibility?: 'private' | 'team' | 'department' | 'organization';
  tags?: string[];
  templateId?: string;
}

export interface UpdateKpiData {
  title?: string;
  description?: string;
  assignedTo?: string;
  role?: string;
  department?: string;
  metrics?: KPIMetric[];
  frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom' | 'adhoc';
  periodStart?: string;
  periodEnd?: string;
  status?: 'draft' | 'pending' | 'in_progress' | 'under_review' | 'approved' | 'rejected' | 'completed' | 'overdue' | 'cancelled';
  notes?: string;
  overallScore?: number;
  reviewComments?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  visibility?: 'private' | 'team' | 'department' | 'organization';
  tags?: string[];
}

export interface UpdateKpiMetricData {
  metricId: string;
  currentValue?: number;
  progress?: number;
  status?: 'pending' | 'in_progress' | 'completed' | 'not_started';
  notes?: string;
  attachments?: File[];
}

export interface ReviewKpiData {
  overallScore: number;
  reviewComments?: string;
  approved: boolean;
  performanceRating?: 'excellent' | 'good' | 'average' | 'poor' | 'needs_improvement';
  nextSteps?: string;
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  role: string;
  department?: string;
  category: string;
  subCategory?: string;
  metrics: Array<{
    name: string;
    description?: string;
    type: 'quantitative' | 'qualitative' | 'percentage' | 'binary' | 'scale' | 'currency';
    targetValue?: number;
    unit?: string;
    weight: number;
    scoringMethod?: 'linear' | 'threshold' | 'range';
    thresholds?: {
      excellent: number;
      good: number;
      average: number;
      poor: number;
    };
  }>;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  defaultWeight?: number;
  tags?: string[];
  scoringCriteria?: Record<string, any>;
}

export interface KpiFilterParams {
  status?: string | string[];
  frequency?: string | string[];
  role?: string | string[];
  department?: string | string[];
  periodStart?: string;
  periodEnd?: string;
  assignedTo?: string;
  assignedBy?: string;
  search?: string;
  priority?: string;
  visibility?: string;
  tags?: string | string[];
  page?: number;
  limit?: number;
  sort?: string;
  sortOrder?: 'asc' | 'desc';
  includeCompleted?: boolean;
  includeOverdue?: boolean;
  year?: number;
  quarter?: number;
  month?: number;
}

export interface TemplateFilterParams {
  role?: string;
  department?: string;
  category?: string;
  isActive?: boolean;
  search?: string;
}

export interface DashboardStats {
  totalKpis: number;
  completedKpis: number;
  pendingKpis: number;
  overdueKpis: number;
  inProgressKpis: number;
  draftKpis: number;
  underReviewKpis: number;
  completionRate: number;
  averageScore: number;
  onTimeCompletionRate: number;
  recentKpis: number;
  upcomingDeadlines: number;
  thisMonth: {
    created: number;
    completed: number;
    overdue: number;
    averageScore: number;
  };
  lastMonth: {
    created: number;
    completed: number;
    overdue: number;
    averageScore: number;
  };
  byFrequency: Record<string, number>;
  byStatus: Record<string, number>;
  byDepartment: Array<{
    department: string;
    total: number;
    completed: number;
    averageScore: number;
  }>;
  byRole: Array<{
    role: string;
    total: number;
    completed: number;
    averageScore: number;
  }>;
  topPerformers: Array<{
    user: UserRef;
    totalKpis: number;
    completedKpis: number;
    averageScore: number;
    onTimeRate: number;
  }>;
  performanceTrend: Array<{
    period: string;
    score: number;
    completed: number;
    total: number;
  }>;
  alerts: {
    overdue: number;
    dueSoon: number;
    needsAttention: number;
  };
}

export interface RoleReport {
  roleId: string;
  roleName: string;
  periodStart: string;
  periodEnd: string;
  totalKpis: number;
  completedKpis: number;
  inProgressKpis: number;
  averageScore: number;
  completionRate: number;
  onTimeCompletionRate: number;
  kpisByStatus: Record<string, number>;
  kpisByFrequency: Record<string, number>;
  kpisByUser: Array<{
    user: UserRef;
    totalKpis: number;
    completedKpis: number;
    inProgressKpis: number;
    averageScore: number;
    performanceRating: string;
  }>;
  metricsBreakdown: Array<{
    metricName: string;
    averageScore: number;
    completionRate: number;
    weight: number;
  }>;
  trends: {
    quarterly: Array<{
      quarter: string;
      averageScore: number;
      completionRate: number;
    }>;
    monthly: Array<{
      month: string;
      averageScore: number;
      completionRate: number;
    }>;
  };
  recommendations?: string[];
}

export interface DepartmentReport {
  departmentId: string;
  departmentName: string;
  periodStart: string;
  periodEnd: string;
  totalEmployees: number;
  activeEmployees: number;
  totalKpis: number;
  completedKpis: number;
  averageScore: number;
  completionRate: number;
  departmentHead?: UserRef;
  kpisByRole: Record<string, {
    total: number;
    completed: number;
    averageScore: number;
  }>;
  kpisByStatus: Record<string, number>;
  performanceTrend: Array<{
    period: string;
    score: number;
    completed: number;
    total: number;
  }>;
  topPerformers: Array<{
    user: UserRef;
    role: string;
    totalKpis: number;
    completedKpis: number;
    averageScore: number;
  }>;
  areasForImprovement: Array<{
    metricName: string;
    averageScore: number;
    targetScore: number;
    gap: number;
  }>;
  budgetUtilization?: {
    allocated: number;
    utilized: number;
    percentage: number;
  };
}

export interface IndividualReport {
  userId: string;
  user: UserRef;
  periodStart: string;
  periodEnd: string;
  totalKpis: number;
  completedKpis: number;
  inProgressKpis: number;
  pendingKpis: number;
  averageScore: number;
  targetScore: number;
  achievedScore: number;
  completionRate: number;
  onTimeCompletionRate: number;
  performanceRating: string;
  kpisByStatus: Record<string, number>;
  kpisByFrequency: Record<string, number>;
  kpisByPriority: Record<string, number>;
  metricsBreakdown: {
    totalMetrics: number;
    metricsByType: Record<string, number>;
    averageWeight: number;
    completionRate: number;
    topPerformingMetrics: Array<{
      name: string;
      score: number;
      weight: number;
      status: string;
    }>;
    needsImprovement: Array<{
      name: string;
      score: number;
      target: number;
      gap: number;
    }>;
  };
  trends: {
    monthly: Array<{
      month: string;
      score: number;
      completed: number;
      total: number;
    }>;
    quarterly: Array<{
      quarter: string;
      score: number;
      completed: number;
      total: number;
    }>;
  };
  achievements: Array<{
    kpiId: string;
    title: string;
    score: number;
    completedAt: string;
  }>;
  supervisorComments?: Array<{
    comment: string;
    timestamp: string;
    supervisor: UserRef;
  }>;
  developmentAreas: string[];
  strengths: string[];
  nextQuarterGoals: string[];
}

export interface KpisResponse {
  data: Kpi[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats?: DashboardStats;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Extended ApiClient with headers support (matching opportunity service pattern)
class ExtendedApiClient {
  private getApiBaseUrl(): string {
    if ((apiClient as any).API_BASE_URL) {
      return (apiClient as any).API_BASE_URL;
    }
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

class KpiService {
  // Health check endpoint
  async ping(): Promise<{ message: string }> {
    return extendedApiClient.get<{ message: string }>('/kpi/ping');
  }

  // Main filter endpoint
  async filterKpis(params?: KpiFilterParams): Promise<KpisResponse> {
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
      
      const endpoint = `/kpi/search/filter${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await extendedApiClient.get<KpisResponse>(endpoint);
      return response;
    } catch (error) {
      console.error('Error filtering KPIs:', error);
      throw error;
    }
  }

  // Get all KPIs (simple pagination)
  async getAllKpis(params?: {
    page?: number;
    limit?: number;
    sort?: string;
    status?: string;
    search?: string;
  }): Promise<KpisResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const endpoint = `/kpi${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await extendedApiClient.get<KpisResponse>(endpoint);
      return response;
    } catch (error) {
      console.error('Error getting all KPIs:', error);
      throw error;
    }
  }

  // Create KPI - Modal compatible
  async createKPI(data: KPIFormData): Promise<Kpi> {
    try {
      const requestData = {
        ...data,
        metrics: data.metrics.map(metric => ({
          ...metric,
          currentValue: metric.currentValue || 0,
          weight: Number(metric.weight) || 0,
          targetValue: metric.targetValue || 0
        })),
        status: data.status || 'pending',
        isTemplate: data.isTemplate || false,
        distributeToSubordinates: data.distributeToSubordinates || false,
        notes: data.notes || ''
      };

      const response = await extendedApiClient.post<typeof requestData, Kpi>('/kpi', requestData);
      return this.normalizeKpi(response);
    } catch (error: any) {
      console.error('Error creating KPI:', error);
      
      if (error.response) {
        const errorMsg = error.response.data?.message || 'Failed to create KPI';
        throw new Error(`${errorMsg} (${error.response.status})`);
      } else if (error.request) {
        throw new Error('Network error: Unable to connect to server');
      } else {
        throw new Error('An unexpected error occurred');
      }
    }
  }

  // Create KPI - Enhanced version
  async createKpi(data: CreateKpiData, assignedBy?: string): Promise<Kpi> {
    try {
      const requestData = {
        ...data,
        assignedBy,
        kpiId: this.generateKpiId()
      };

      const response = await extendedApiClient.post<typeof requestData, Kpi>(
        '/kpi',
        requestData
      );
      
      return this.normalizeKpi(response);
    } catch (error: any) {
      console.error('Error creating KPI:', error);
      throw error;
    }
  }

  // Get KPI by ID
  async getKpiById(id: string, minimal: boolean = false): Promise<Kpi> {
    try {
      const endpoint = `/kpi/${id}${minimal ? '?minimal=true' : ''}`;
      const response = await extendedApiClient.get<Kpi>(endpoint);
      return this.normalizeKpi(response);
    } catch (error) {
      console.error(`Error fetching KPI ${id}:`, error);
      throw error;
    }
  }

  // Update KPI
  async updateKpi(id: string, data: UpdateKpiData, userId?: string): Promise<Kpi> {
    try {
      const headers: Record<string, string> = {};
      
      if (userId) {
        headers['X-User-Id'] = userId;
      }
      
      const response = await extendedApiClient.patch<UpdateKpiData, Kpi>(
        `/kpi/${id}`,
        data,
        headers
      );
      return this.normalizeKpi(response);
    } catch (error) {
      console.error(`Error updating KPI ${id}:`, error);
      throw error;
    }
  }

  // Update KPI - Modal compatible
  async updateKPI(id: string, data: Partial<KPIFormData>): Promise<Kpi> {
    try {
      const response = await extendedApiClient.patch<Partial<KPIFormData>, Kpi>(`/kpi/${id}`, data);
      return this.normalizeKpi(response);
    } catch (error) {
      console.error(`Error updating KPI ${id}:`, error);
      throw error;
    }
  }

  // Delete KPI
  async deleteKpi(id: string): Promise<{ message: string }> {
    try {
      const response = await extendedApiClient.delete<{ message: string }>(`/kpi/${id}`);
      return response;
    } catch (error) {
      console.error(`Error deleting KPI ${id}:`, error);
      throw error;
    }
  }

  // Get my KPIs
  async getMyKPIs(params?: {
    status?: string;
    limit?: number;
    sort?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<Kpi[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const queryString = queryParams.toString();
      const endpoint = `/kpi/me${queryString ? `?${queryString}` : ''}`;
      
      const response = await extendedApiClient.get<Kpi[]>(endpoint);
      return response.map(kpi => this.normalizeKpi(kpi));
    } catch (error: any) {
      console.error('Error fetching my KPIs:', error);
      throw error;
    }
  }

  // Get my KPIs with pagination
  async getMyKPIsPaginated(params?: KpiFilterParams): Promise<PaginatedResponse<Kpi>> {
    try {
      const queryParams = this.buildQueryParams(params);
      const endpoint = `/kpi/me${queryParams}`;
      
      const response = await extendedApiClient.get<PaginatedResponse<Kpi>>(endpoint);
      return {
        ...response,
        data: response.data.map(kpi => this.normalizeKpi(kpi))
      };
    } catch (error: any) {
      console.error('Error fetching my KPIs:', error);
      throw error;
    }
  }

  // Update KPI metric
  async updateKpiMetric(
    kpiId: string,
    metricId: string,
    data: UpdateKpiMetricData,
    attachments?: File[]
  ): Promise<Kpi> {
    try {
      const formData = new FormData();
      formData.append('metricId', metricId);
      
      if (data.currentValue !== undefined) {
        formData.append('currentValue', data.currentValue.toString());
      }
      if (data.progress !== undefined) {
        formData.append('progress', data.progress.toString());
      }
      if (data.status) {
        formData.append('status', data.status);
      }
      if (data.notes) {
        formData.append('notes', data.notes);
      }
      
      if (attachments) {
        attachments.forEach((file, index) => {
          formData.append(`attachments[${index}]`, file);
        });
      }
      
      // Use the base apiClient for FormData
      const apiBaseUrl = (apiClient as any).API_BASE_URL || '';
      const token = sessionStorage.getItem('accessToken');
      
      const response = await fetch(`${apiBaseUrl}/kpi/${kpiId}/metrics`, {
        method: 'PUT',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      return this.normalizeKpi(result);
    } catch (error: any) {
      console.error(`Error updating metric ${metricId} for KPI ${kpiId}:`, error);
      throw error;
    }
  }

  // Submit KPI for review
  async submitForReview(kpiId: string, userId: string): Promise<Kpi> {
    try {
      const response = await extendedApiClient.post<{ submittedBy: string }, Kpi>(
        `/kpi/${kpiId}/submit-review`,
        { submittedBy: userId }
      );
      return this.normalizeKpi(response);
    } catch (error: any) {
      console.error(`Error submitting KPI ${kpiId} for review:`, error);
      throw error;
    }
  }

  // Review KPI
  async reviewKpi(
    kpiId: string,
    data: ReviewKpiData,
    reviewedBy: string
  ): Promise<Kpi> {
    try {
      const response = await extendedApiClient.post<any, Kpi>(
        `/kpi/${kpiId}/review`,
        {
          ...data,
          reviewedBy,
          reviewedAt: new Date().toISOString()
        }
      );
      return this.normalizeKpi(response);
    } catch (error: any) {
      console.error(`Error reviewing KPI ${kpiId}:`, error);
      throw error;
    }
  }

  // Approve KPI
  async approveKpi(kpiId: string, approvedBy: string, comments?: string): Promise<Kpi> {
    try {
      const response = await extendedApiClient.post<any, Kpi>(
        `/kpi/${kpiId}/approve`,
        {
          approvedBy,
          approvedAt: new Date().toISOString(),
          comments
        }
      );
      return this.normalizeKpi(response);
    } catch (error: any) {
      console.error(`Error approving KPI ${kpiId}:`, error);
      throw error;
    }
  }

  // Reject KPI
  async rejectKpi(kpiId: string, rejectedBy: string, reason: string): Promise<Kpi> {
    try {
      const response = await extendedApiClient.post<any, Kpi>(
        `/kpi/${kpiId}/reject`,
        {
          rejectedBy,
          rejectedAt: new Date().toISOString(),
          reason
        }
      );
      return this.normalizeKpi(response);
    } catch (error: any) {
      console.error(`Error rejecting KPI ${kpiId}:`, error);
      throw error;
    }
  }

  // Create template
  async createTemplate(data: CreateTemplateData, createdBy: string): Promise<KpiTemplate> {
    try {
      const requestData = {
        ...data,
        createdBy,
        templateId: this.generateTemplateId()
      };

      const response = await extendedApiClient.post<typeof requestData, KpiTemplate>(
        '/kpi/templates',
        requestData
      );
      return this.normalizeTemplate(response);
    } catch (error: any) {
      console.error('Error creating KPI template:', error);
      throw error;
    }
  }

  // Get all templates
  async getAllTemplates(params?: TemplateFilterParams): Promise<PaginatedResponse<KpiTemplate>> {
    try {
      const queryParams = this.buildQueryParams(params);
      const endpoint = `/kpi/templates${queryParams}`;
      
      const response = await extendedApiClient.get<PaginatedResponse<KpiTemplate>>(endpoint);
      return {
        ...response,
        data: response.data.map(template => this.normalizeTemplate(template))
      };
    } catch (error: any) {
      console.error('Error fetching KPI templates:', error);
      throw error;
    }
  }

  // Create KPI from template
  async createKpiFromTemplate(
    templateId: string,
    assignedTo: string,
    periodStart: string,
    periodEnd: string,
    assignedBy?: string,
    overrides?: Partial<CreateKpiData>
  ): Promise<Kpi> {
    try {
      const response = await extendedApiClient.post<any, Kpi>(
        `/kpi/templates/${templateId}/assign`,
        {
          assignedTo,
          periodStart,
          periodEnd,
          assignedBy,
          overrides
        }
      );
      return this.normalizeKpi(response);
    } catch (error: any) {
      console.error(`Error creating KPI from template ${templateId}:`, error);
      throw error;
    }
  }

  // Get dashboard stats
  async getDashboardStats(userId?: string, period?: { start: string; end: string }): Promise<DashboardStats> {
    try {
      const queryParams = new URLSearchParams();
      if (userId) queryParams.append('userId', userId);
      if (period) {
        queryParams.append('start', period.start);
        queryParams.append('end', period.end);
      }
      
      const queryString = queryParams.toString();
      const endpoint = `/kpi/dashboard/stats${queryString ? `?${queryString}` : ''}`;
      
      const response = await extendedApiClient.get<DashboardStats>(endpoint);
      return this.normalizeDashboardStats(response);
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  // Get overdue KPIs
  async getOverdueKPIs(limit?: number): Promise<Kpi[]> {
    try {
      const queryParams = new URLSearchParams();
      if (limit) queryParams.append('limit', limit.toString());
      
      const queryString = queryParams.toString();
      const endpoint = `/kpi/overdue${queryString ? `?${queryString}` : ''}`;
      
      const response = await extendedApiClient.get<Kpi[]>(endpoint);
      return response.map(kpi => this.normalizeKpi(kpi));
    } catch (error: any) {
      console.error('Error fetching overdue KPIs:', error);
      throw error;
    }
  }

  // Get KPIs due soon
  async getDueSoonKPIs(limit?: number): Promise<Kpi[]> {
    try {
      const queryParams = new URLSearchParams();
      if (limit) queryParams.append('limit', limit.toString());
      
      const queryString = queryParams.toString();
      const endpoint = `/kpi/due-soon${queryString ? `?${queryString}` : ''}`;
      
      const response = await extendedApiClient.get<Kpi[]>(endpoint);
      return response.map(kpi => this.normalizeKpi(kpi));
    } catch (error: any) {
      console.error('Error fetching due soon KPIs:', error);
      throw error;
    }
  }

  // Add comment
  async addComment(kpiId: string, comment: string, userId: string): Promise<Kpi> {
    try {
      const response = await extendedApiClient.post<any, Kpi>(
        `/kpi/${kpiId}/comments`,
        {
          comment,
          userId,
          timestamp: new Date().toISOString()
        }
      );
      return this.normalizeKpi(response);
    } catch (error: any) {
      console.error(`Error adding comment to KPI ${kpiId}:`, error);
      throw error;
    }
  }

  // Add attachment
  async addAttachment(kpiId: string, file: File, uploadedBy: string): Promise<Kpi> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadedBy', uploadedBy);
      
      const apiBaseUrl = (apiClient as any).API_BASE_URL || '';
      const token = sessionStorage.getItem('accessToken');
      
      const response = await fetch(`${apiBaseUrl}/kpi/${kpiId}/attachments`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      return this.normalizeKpi(result);
    } catch (error: any) {
      console.error(`Error adding attachment to KPI ${kpiId}:`, error);
      throw error;
    }
  }

  // Clone KPI
  async cloneKpi(kpiId: string, clonedBy: string, overrides?: Partial<CreateKpiData>): Promise<Kpi> {
    try {
      const response = await extendedApiClient.post<any, Kpi>(
        `/kpi/${kpiId}/clone`,
        {
          clonedBy,
          overrides,
          periodStart: overrides?.periodStart || format(new Date(), 'yyyy-MM-dd'),
          periodEnd: overrides?.periodEnd || format(endOfMonth(new Date()), 'yyyy-MM-dd')
        }
      );
      return this.normalizeKpi(response);
    } catch (error: any) {
      console.error(`Error cloning KPI ${kpiId}:`, error);
      throw error;
    }
  }

  // Export KPIs
  async exportKPIs(format: 'excel' | 'pdf' | 'csv', params?: KpiFilterParams): Promise<Blob> {
    try {
      const queryParams = this.buildQueryParams(params);
      const endpoint = `/kpi/export/${format}${queryParams}`;
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }
      
      return await response.blob();
    } catch (error: any) {
      console.error(`Error exporting KPIs to ${format}:`, error);
      throw error;
    }
  }

  // Bulk update status
  async bulkUpdateStatus(kpiIds: string[], status: string, updatedBy: string): Promise<{ updated: number; failed: number }> {
    try {
      const response = await extendedApiClient.post<any, { updated: number; failed: number }>(
        '/kpi/bulk-update',
        {
          kpiIds,
          status,
          updatedBy
        }
      );
      return response;
    } catch (error: any) {
      console.error('Error bulk updating KPI status:', error);
      throw error;
    }
  }

  // Get analytics
  async getAnalytics(params?: {
    periodStart?: string;
    periodEnd?: string;
    department?: string;
    role?: string;
  }): Promise<any> {
    try {
      const queryParams = this.buildQueryParams(params);
      const endpoint = `/kpi/dashboard/analytics${queryParams}`;
      
      const response = await extendedApiClient.get<any>(endpoint);
      return response;
    } catch (error: any) {
      console.error('Error fetching KPI analytics:', error);
      throw error;
    }
  }

  // Get completion trends
  async getCompletionTrends(
    periodStart: string,
    periodEnd: string,
    interval: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  ): Promise<Array<{ period: string; completed: number; total: number; rate: number }>> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('periodStart', periodStart);
      queryParams.append('periodEnd', periodEnd);
      queryParams.append('interval', interval);
      
      const response = await extendedApiClient.get<any>(
        `/kpi/dashboard/trends?${queryParams.toString()}`
      );
      return response;
    } catch (error: any) {
      console.error('Error fetching completion trends:', error);
      throw error;
    }
  }

  // Delete KPI - Modal compatible
  async deleteKPI(id: string): Promise<void> {
    try {
      await extendedApiClient.delete(`/kpi/${id}`);
    } catch (error) {
      console.error(`Error deleting KPI ${id}:`, error);
      throw error;
    }
  }

  // Helper methods
  calculateMetricProgress(metric: KPIMetric): number {
    if (!metric.targetValue || metric.currentValue === undefined) return 0;
    if (metric.targetValue === 0) return 0;
    
    const progress = (metric.currentValue / metric.targetValue) * 100;
    return Math.min(100, Math.max(0, Math.round(progress)));
  }

  calculateTotalWeight(metrics: KPIMetric[]): number {
    return metrics.reduce((sum, metric) => sum + (metric.weight || 0), 0);
  }

  validateMetrics(metrics: KPIMetric[]): string[] {
    const errors: string[] = [];
    
    if (metrics.length === 0) {
      errors.push('At least one metric is required');
      return errors;
    }
    
    const totalWeight = this.calculateTotalWeight(metrics);
    if (Math.abs(totalWeight - 100) > 0.01) {
      errors.push(`Total weight must be 100% (currently ${totalWeight.toFixed(1)}%)`);
    }
    
    metrics.forEach((metric, index) => {
      if (!metric.name?.trim()) {
        errors.push(`Metric ${index + 1}: Name is required`);
      }
      if (metric.weight <= 0) {
        errors.push(`Metric ${index + 1}: Weight must be greater than 0`);
      }
      if (metric.targetValue !== undefined && metric.targetValue <= 0) {
        errors.push(`Metric ${index + 1}: Target value must be greater than 0`);
      }
      if (metric.type === 'percentage' && metric.targetValue && metric.targetValue > 100) {
        errors.push(`Metric ${index + 1}: Percentage target cannot exceed 100%`);
      }
    });
    
    return errors;
  }

  // Private helper methods
  private buildQueryParams(params?: Record<string, any>): string {
    if (!params) return '';
    
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(item => queryParams.append(`${key}[]`, item.toString()));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });
    
    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  private generateKpiId(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `KPI-${year}-${random}`;
  }

  private generateTemplateId(): string {
    const random = Math.floor(100 + Math.random() * 900);
    return `TEMPLATE-${random}`;
  }

  private normalizeKpi(data: any): Kpi {
    const metrics = (data.metrics || []).map((metric: any) => ({
      ...metric,
      id: metric._id || metric.id,
      _id: metric._id,
      score: metric.score || this.calculateMetricScoreInternal(metric),
      progress: metric.progress || this.calculateMetricProgressInternal(metric)
    }));

    const overallScore = data.overallScore || this.calculateOverallScore(metrics);
    const performanceRating = this.getPerformanceRating(overallScore);

    return {
      _id: data._id || data.id,
      id: data._id || data.id,
      kpiId: data.kpiId || this.generateKpiId(),
      title: data.title,
      description: data.description,
      assignedTo: data.assignedTo,
      assignedBy: data.assignedBy,
      approver: data.approver,
      profile: data.profile,
      role: data.role,
      department: data.department,
      metrics,
      frequency: data.frequency,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      status: data.status || 'draft',
      overallScore,
      targetScore: data.targetScore || 100,
      achievedScore: data.achievedScore || overallScore,
      performanceRating: data.performanceRating || performanceRating,
      notes: data.notes,
      comments: data.comments || [],
      completedAt: data.completedAt,
      reviewedBy: data.reviewedBy,
      reviewedAt: data.reviewedAt,
      approvedBy: data.approvedBy,
      approvedAt: data.approvedAt,
      reviewComments: data.reviewComments,
      isTemplate: data.isTemplate || false,
      templateId: data.templateId,
      parentKpi: data.parentKpi,
      childKpis: data.childKpis || [],
      tags: data.tags || [],
      priority: data.priority || 'medium',
      visibility: data.visibility || 'private',
      attachments: data.attachments || [],
      reminders: data.reminders || [],
      lastUpdated: data.lastUpdated || data.updatedAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      version: data.version || 1,
      history: data.history || []
    };
  }

  private normalizeTemplate(data: any): KpiTemplate {
    return {
      _id: data._id || data.id,
      id: data._id || data.id,
      templateId: data.templateId || this.generateTemplateId(),
      name: data.name,
      description: data.description,
      role: data.role,
      department: data.department,
      category: data.category || 'general',
      subCategory: data.subCategory,
      metrics: data.metrics || [],
      frequency: data.frequency,
      defaultWeight: data.defaultWeight || 1,
      scoringCriteria: data.scoringCriteria || {},
      tags: data.tags || [],
      isActive: data.isActive !== undefined ? data.isActive : true,
      isSystemTemplate: data.isSystemTemplate || false,
      usageCount: data.usageCount || 0,
      lastUsed: data.lastUsed,
      createdBy: data.createdBy,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      version: data.version || 1,
      approvalWorkflow: data.approvalWorkflow || {
        requiresApproval: false,
        approvers: [],
        autoApprove: false
      }
    };
  }

  private normalizeDashboardStats(data: any): DashboardStats {
    return {
      totalKpis: data.totalKpis || 0,
      completedKpis: data.completedKpis || 0,
      pendingKpis: data.pendingKpis || 0,
      overdueKpis: data.overdueKpis || 0,
      inProgressKpis: data.inProgressKpis || 0,
      draftKpis: data.draftKpis || 0,
      underReviewKpis: data.underReviewKpis || 0,
      completionRate: data.completionRate || 0,
      averageScore: data.averageScore || 0,
      onTimeCompletionRate: data.onTimeCompletionRate || 0,
      recentKpis: data.recentKpis || 0,
      upcomingDeadlines: data.upcomingDeadlines || 0,
      thisMonth: data.thisMonth || {
        created: 0,
        completed: 0,
        overdue: 0,
        averageScore: 0
      },
      lastMonth: data.lastMonth || {
        created: 0,
        completed: 0,
        overdue: 0,
        averageScore: 0
      },
      byFrequency: data.byFrequency || {},
      byStatus: data.byStatus || {},
      byDepartment: data.byDepartment || [],
      byRole: data.byRole || [],
      topPerformers: data.topPerformers || [],
      performanceTrend: data.performanceTrend || [],
      alerts: data.alerts || {
        overdue: 0,
        dueSoon: 0,
        needsAttention: 0
      }
    };
  }

  private calculateMetricScoreInternal(metric: any): number {
    if (!metric.targetValue || metric.currentValue === undefined || metric.currentValue === null) {
      return 0;
    }

    switch (metric.type) {
      case 'quantitative':
        if (metric.targetValue === 0) return 0;
        const percentage = (metric.currentValue / metric.targetValue) * 100;
        return Math.min(100, Math.max(0, percentage));
      
      case 'percentage':
        return Math.min(100, Math.max(0, metric.currentValue));
      
      case 'binary':
        return metric.currentValue ? 100 : 0;
      
      case 'scale':
        if (!metric.thresholds) return metric.currentValue || 0;
        return this.calculateScaleScore(metric.currentValue, metric.thresholds);
      
      case 'currency':
        if (metric.targetValue === 0) return 0;
        const costEfficiency = (metric.targetValue / metric.currentValue) * 100;
        return Math.min(100, Math.max(0, costEfficiency));
      
      case 'qualitative':
        const qualitativeScores: Record<string, number> = {
          'excellent': 100,
          'good': 80,
          'average': 60,
          'poor': 40,
          'unsatisfactory': 20
        };
        return qualitativeScores[metric.currentValue?.toLowerCase()] || 0;
      
      default:
        return 0;
    }
  }

  private calculateScaleScore(value: number, thresholds: any): number {
    if (value >= thresholds.excellent) return 100;
    if (value >= thresholds.good) return 80;
    if (value >= thresholds.average) return 60;
    if (value >= thresholds.poor) return 40;
    return 20;
  }

  private calculateMetricProgressInternal(metric: any): number {
    if (!metric.targetValue || metric.currentValue === undefined || metric.currentValue === null) {
      return 0;
    }

    if (metric.targetValue === 0) return 0;
    
    const progress = (metric.currentValue / metric.targetValue) * 100;
    return Math.min(100, Math.max(0, progress));
  }

  private calculateOverallScore(metrics: KPIMetric[]): number {
    if (metrics.length === 0) return 0;

    const totalWeight = metrics.reduce((sum, metric) => sum + (metric.weight || 0), 0);
    if (totalWeight === 0) return 0;

    const weightedSum = metrics.reduce((sum, metric) => {
      const score = metric.score || 0;
      const weight = metric.weight || 0;
      return sum + (score * (weight / totalWeight));
    }, 0);

    return Math.round(Math.min(100, Math.max(0, weightedSum)) * 10) / 10;
  }

  private getPerformanceRating(score: number): 'excellent' | 'good' | 'average' | 'poor' | 'needs_improvement' {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 70) return 'average';
    if (score >= 60) return 'poor';
    return 'needs_improvement';
  }

  // Public helper methods
  calculateKpiProgress(kpi: Kpi): number {
    if (kpi.status === 'completed' || kpi.status === 'approved') return 100;
    if (kpi.status === 'draft') return 0;
    
    const totalWeight = kpi.metrics.reduce((sum, metric) => sum + (metric.weight || 0), 0);
    if (totalWeight === 0) return 0;
    
    const weightedProgress = kpi.metrics.reduce((sum, metric) => {
      const metricProgress = metric.progress || 0;
      return sum + (metricProgress * (metric.weight / totalWeight));
    }, 0);
    
    return Math.min(100, Math.round(weightedProgress));
  }

  calculateDaysRemaining(periodEnd: string): number {
    try {
      const end = new Date(periodEnd);
      const now = new Date();
      const diffTime = end.getTime() - now.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (error) {
      return 0;
    }
  }

  isKpiOverdue(kpi: Kpi): boolean {
    if (!kpi.periodEnd || ['completed', 'approved', 'cancelled'].includes(kpi.status)) {
      return false;
    }
    
    try {
      const periodEnd = new Date(kpi.periodEnd);
      const now = new Date();
      return periodEnd < now;
    } catch (error) {
      return false;
    }
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      review: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      approved: 'bg-emerald-100 text-emerald-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || colors.draft;
  }

  getFrequencyLabel(frequency: string): string {
    const labels: Record<string, string> = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly',
      custom: 'Custom',
      adhoc: 'Ad-hoc'
    };
    return labels[frequency] || frequency;
  }
}

export const kpiService = new KpiService();

// Constants
export const KPI_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
} as const;

export const KPI_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export const KPI_FREQUENCY = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
  CUSTOM: 'custom',
  ADHOC: 'adhoc',
} as const;

export const METRIC_TYPE = {
  QUANTITATIVE: 'quantitative',
  QUALITATIVE: 'qualitative',
  PERCENTAGE: 'percentage',
  BINARY: 'binary',
  SCALE: 'scale',
  CURRENCY: 'currency',
} as const;

export const PERFORMANCE_RATING = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  AVERAGE: 'average',
  POOR: 'poor',
  NEEDS_IMPROVEMENT: 'needs_improvement',
} as const;

