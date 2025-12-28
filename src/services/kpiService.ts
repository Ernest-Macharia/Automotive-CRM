import { apiClient } from '@/lib/api/client';

export interface KpiMetric {
  name: string;
  description?: string;
  type: 'quantitative' | 'qualitative' | 'percentage' | 'binary';
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  weight: number;
  score?: number;
  id?: string;
  _id?: string;
}

export interface UserRef {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  customId?: string;
  role?: string;
}

export interface ProfileRef {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  department?: string;
}

export interface RoleRef {
  _id?: string;
  id?: string;
  name?: string;
  display_name?: string;
}

export interface Kpi {
  id: string;
  _id?: string;
  title: string;
  description?: string;
  assignedTo: UserRef | string;
  assignedBy?: UserRef | string;
  profile?: ProfileRef | string;
  role?: RoleRef | string;
  metrics: KpiMetric[];
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  periodStart: string;
  periodEnd: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  overallScore?: number;
  notes?: string;
  completedAt?: string;
  reviewedBy?: UserRef | string;
  reviewedAt?: string;
  reviewComments?: string;
  isTemplate?: boolean;
  parentKpi?: Kpi | string;
  childKpis?: Kpi[] | string[];
  active?: boolean;
  lastUpdated?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface KpiTemplate {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  role?: RoleRef | string;
  category?: string;
  metrics: KpiMetric[];
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  tags?: string[];
  isActive?: boolean;
  usageCount?: number;
  createdBy?: UserRef | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateKpiData {
  title: string;
  description?: string;
  assignedTo: string;
  role?: string;
  metrics: Omit<KpiMetric, 'id' | 'score'>[];
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  periodStart: string;
  periodEnd: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  isTemplate?: boolean;
  distributeToSubordinates?: boolean;
  notes?: string;
}

export interface UpdateKpiData {
  title?: string;
  description?: string;
  assignedTo?: string;
  role?: string;
  metrics?: Omit<KpiMetric, 'id'>[];
  frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  periodStart?: string;
  periodEnd?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  notes?: string;
  overallScore?: number;
  reviewComments?: string;
  active?: boolean;
}

export interface UpdateKpiMetricData {
  currentValue?: number;
  notes?: string;
}

export interface ReviewKpiData {
  overallScore: number;
  reviewComments?: string;
  approved: boolean;
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  role?: string;
  category?: string;
  metrics: Omit<KpiMetric, 'id' | 'score'>[];
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  tags?: string[];
}

export interface KpiFilterParams {
  status?: string;
  frequency?: string;
  role?: string;
  periodStart?: string;
  periodEnd?: string;
  assignedTo?: string;
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
}

export interface TemplateFilterParams {
  role?: string;
  category?: string;
  isActive?: boolean;
}

export interface DashboardStats {
  totalKpis: number;
  completedKpis: number;
  pendingKpis: number;
  overdueKpis: number;
  recentKpis: number;
  completionRate: number;
  averageScore: number;
}

export interface RoleReport {
  roleId: string;
  periodStart: string;
  periodEnd: string;
  totalKpis: number;
  completedKpis: number;
  averageScore: number;
  kpisByStatus: Record<string, number>;
  kpisByUser: Array<{
    user: UserRef;
    totalKpis: number;
    completedKpis: number;
    averageScore: number;
  }>;
}

export interface DepartmentReport {
  department: string;
  periodStart: string;
  periodEnd: string;
  totalEmployees: number;
  totalKpis: number;
  completedKpis: number;
  averageScore: number;
  kpisByRole: Record<string, any>;
  performanceTrend: Array<{
    period: string;
    score: number;
    status: string;
  }>;
}

export interface IndividualReport {
  user: UserRef;
  profile: ProfileRef;
  periodStart: string;
  periodEnd: string;
  totalKpis: number;
  completedKpis: number;
  averageScore: number;
  kpisByStatus: Record<string, number>;
  kpisByFrequency: Record<string, number>;
  metricsBreakdown: {
    totalMetrics: number;
    metricsByType: Record<string, number>;
    averageWeight: number;
    completionRate: number;
  };
}

class KpiService {
  /**
   * Create a new KPI (Admin/Management only)
   * POST /api/v1/kpi
   */
  async createKpi(data: CreateKpiData, assignedBy?: string): Promise<Kpi> {
    try {
      const requestData = {
        ...data,
        assignedBy
      };

      const response = await apiClient.post<typeof requestData, any>('/kpi', requestData);
      return this.normalizeKpi(response);
    } catch (error) {
      console.error('Error creating KPI:', error);
      throw error;
    }
  }

  /**
   * Get all KPIs (Admin/Management only)
   * GET /api/v1/kpi
   */
  async getAllKpis(params?: KpiFilterParams): Promise<Kpi[]> {
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
      const endpoint = `/kpi${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get<any[]>(endpoint);
      return response.map(kpi => this.normalizeKpi(kpi));
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      throw error;
    }
  }

  /**
   * Get my KPIs
   * GET /api/v1/kpi/me
   */
  async getMyKpis(params?: {
    status?: string;
    periodStart?: string;
    periodEnd?: string;
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
      
      const response = await apiClient.get<any[]>(endpoint);
      return response.map(kpi => this.normalizeKpi(kpi));
    } catch (error) {
      console.error('Error fetching my KPIs:', error);
      throw error;
    }
  }

  /**
   * Get KPI by ID
   * GET /api/v1/kpi/{id}
   */
  async getKpiById(id: string): Promise<Kpi> {
    try {
      const response = await apiClient.get<any>(`/kpi/${id}`);
      return this.normalizeKpi(response);
    } catch (error) {
      console.error(`Error fetching KPI ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update KPI (Admin/Management or assigned user)
   * PUT /api/v1/kpi/{id}
   */
  async updateKpi(id: string, data: UpdateKpiData): Promise<Kpi> {
    try {
      const response = await apiClient.put<UpdateKpiData, any>(`/kpi/${id}`, data);
      return this.normalizeKpi(response);
    } catch (error) {
      console.error(`Error updating KPI ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete KPI (Admin only)
   * DELETE /api/v1/kpi/{id}
   */
  async deleteKpi(id: string): Promise<{ message: string }> {
    try {
      return await apiClient.delete<{ message: string }>(`/kpi/${id}`);
    } catch (error) {
      console.error(`Error deleting KPI ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update KPI metric progress
   * PUT /api/v1/kpi/{id}/metrics/{index}
   */
  async updateKpiMetric(
    id: string,
    metricIndex: number,
    data: UpdateKpiMetricData
  ): Promise<Kpi> {
    try {
      const response = await apiClient.put<UpdateKpiMetricData, any>(
        `/kpi/${id}/metrics/${metricIndex}`,
        data
      );
      return this.normalizeKpi(response);
    } catch (error) {
      console.error(`Error updating KPI metric ${metricIndex} for KPI ${id}:`, error);
      throw error;
    }
  }

  /**
   * Mark KPI as completed
   * PUT /api/v1/kpi/{id}/complete
   */
  async completeKpi(id: string, userId?: string): Promise<Kpi> {
    try {
      const response = await apiClient.put<any, any>(`/kpi/${id}/complete`, { userId });
      return this.normalizeKpi(response);
    } catch (error) {
      console.error(`Error completing KPI ${id}:`, error);
      throw error;
    }
  }

  /**
   * Review KPI (Admin/Management only)
   * PUT /api/v1/kpi/{id}/review
   */
  async reviewKpi(id: string, data: ReviewKpiData, reviewedBy?: string): Promise<Kpi> {
    try {
      const requestData = {
        ...data,
        reviewedBy
      };

      const response = await apiClient.put<typeof requestData, any>(`/kpi/${id}/review`, requestData);
      return this.normalizeKpi(response);
    } catch (error) {
      console.error(`Error reviewing KPI ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create KPI template (Admin only)
   * POST /api/v1/kpi/templates
   */
  async createTemplate(data: CreateTemplateData, createdBy?: string): Promise<KpiTemplate> {
    try {
      const requestData = {
        ...data,
        createdBy
      };

      const response = await apiClient.post<typeof requestData, any>('/kpi/templates', requestData);
      return this.normalizeTemplate(response);
    } catch (error) {
      console.error('Error creating KPI template:', error);
      throw error;
    }
  }

  /**
   * Get all KPI templates
   * GET /api/v1/kpi/templates
   */
  async getAllTemplates(params?: TemplateFilterParams): Promise<KpiTemplate[]> {
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
      const endpoint = `/kpi/templates${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get<any[]>(endpoint);
      return response.map(template => this.normalizeTemplate(template));
    } catch (error) {
      console.error('Error fetching KPI templates:', error);
      throw error;
    }
  }

  /**
   * Create KPI from template (Admin/Management only)
   * POST /api/v1/kpi/templates/{templateId}/assign
   */
  async createKpiFromTemplate(
    templateId: string,
    assignedTo: string,
    periodStart: string,
    periodEnd: string,
    assignedBy?: string
  ): Promise<Kpi> {
    try {
      const requestData = {
        assignedTo,
        periodStart,
        periodEnd,
        assignedBy
      };

      const response = await apiClient.post<typeof requestData, any>(
        `/kpi/templates/${templateId}/assign`,
        requestData
      );
      return this.normalizeKpi(response);
    } catch (error) {
      console.error(`Error creating KPI from template ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Generate role-based KPI report (Admin only)
   * GET /api/v1/kpi/reports/role/{roleId}
   */
  async generateRoleReport(
    roleId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<RoleReport> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('periodStart', periodStart);
      queryParams.append('periodEnd', periodEnd);
      
      const response = await apiClient.get<any>(
        `/kpi/reports/role/${roleId}?${queryParams.toString()}`
      );
      return response;
    } catch (error) {
      console.error(`Error generating role report for role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Generate department KPI report (Admin/Management only)
   * GET /api/v1/kpi/reports/department/{department}
   */
  async generateDepartmentReport(
    department: string,
    periodStart: string,
    periodEnd: string
  ): Promise<DepartmentReport> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('periodStart', periodStart);
      queryParams.append('periodEnd', periodEnd);
      
      const response = await apiClient.get<any>(
        `/kpi/reports/department/${department}?${queryParams.toString()}`
      );
      return response;
    } catch (error) {
      console.error(`Error generating department report for ${department}:`, error);
      throw error;
    }
  }

  /**
   * Generate individual KPI report
   * GET /api/v1/kpi/reports/individual/{userId}
   */
  async generateIndividualReport(
    userId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<IndividualReport> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('periodStart', periodStart);
      queryParams.append('periodEnd', periodEnd);
      
      const response = await apiClient.get<any>(
        `/kpi/reports/individual/${userId}?${queryParams.toString()}`
      );
      return response;
    } catch (error) {
      console.error(`Error generating individual report for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Generate monthly KPIs for all users (Admin only)
   * POST /api/v1/kpi/generate/monthly
   */
  async generateMonthlyKpis(month: string, assignedBy?: string): Promise<{ message: string; generated: number }> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('month', month);
      if (assignedBy) queryParams.append('assignedBy', assignedBy);
      
      const response = await apiClient.post<any, any>(
        `/kpi/generate/monthly?${queryParams.toString()}`,
        {}
      );
      return response;
    } catch (error) {
      console.error('Error generating monthly KPIs:', error);
      throw error;
    }
  }

  /**
   * Get KPI dashboard statistics
   * GET /api/v1/kpi/dashboard/stats
   */
  async getDashboardStats(userId?: string): Promise<DashboardStats> {
    try {
      const queryParams = new URLSearchParams();
      if (userId) queryParams.append('userId', userId);
      
      const queryString = queryParams.toString();
      const endpoint = `/kpi/dashboard/stats${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get<any>(endpoint);
      return response;
    } catch (error) {
      console.error('Error fetching KPI dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get overdue KPIs
   * GET /api/v1/kpi/overdue
   */
  async getOverdueKpis(): Promise<Kpi[]> {
    try {
      const response = await apiClient.get<any[]>('/kpi/overdue');
      return response.map(kpi => this.normalizeKpi(kpi));
    } catch (error) {
      console.error('Error fetching overdue KPIs:', error);
      throw error;
    }
  }

  /**
   * Normalize KPI data from backend
   */
  private normalizeKpi(data: any): Kpi {
    // Calculate metric scores if not present
    const normalizedMetrics = (data.metrics || []).map((metric: any, index: number) => {
      const score = metric.score || this.calculateMetricScore(metric);
      return {
        id: metric._id || metric.id || `metric-${index}`,
        _id: metric._id,
        name: metric.name,
        description: metric.description,
        type: metric.type,
        targetValue: metric.targetValue,
        currentValue: metric.currentValue,
        unit: metric.unit,
        weight: metric.weight || 0,
        score
      };
    });

    // Calculate overall score if not present
    const overallScore = data.overallScore || this.calculateOverallScore(normalizedMetrics);

    return {
      id: data._id || data.id,
      _id: data._id,
      title: data.title,
      description: data.description,
      assignedTo: data.assignedTo,
      assignedBy: data.assignedBy,
      profile: data.profile,
      role: data.role,
      metrics: normalizedMetrics,
      frequency: data.frequency,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      status: data.status || 'pending',
      overallScore,
      notes: data.notes,
      completedAt: data.completedAt,
      reviewedBy: data.reviewedBy,
      reviewedAt: data.reviewedAt,
      reviewComments: data.reviewComments,
      isTemplate: data.isTemplate || false,
      parentKpi: data.parentKpi,
      childKpis: data.childKpis,
      active: data.active !== undefined ? data.active : true,
      lastUpdated: data.lastUpdated,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  /**
   * Normalize template data from backend
   */
  private normalizeTemplate(data: any): KpiTemplate {
    return {
      id: data._id || data.id,
      _id: data._id,
      name: data.name,
      description: data.description,
      role: data.role,
      category: data.category,
      metrics: data.metrics || [],
      frequency: data.frequency,
      tags: data.tags || [],
      isActive: data.isActive !== undefined ? data.isActive : true,
      usageCount: data.usageCount || 0,
      createdBy: data.createdBy,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  /**
   * Calculate metric score
   */
  private calculateMetricScore(metric: KpiMetric): number {
    if (!metric.targetValue || metric.currentValue === undefined || metric.currentValue === null) {
      return 0;
    }

    switch (metric.type) {
      case 'quantitative':
        return (metric.currentValue / metric.targetValue) * 100;
      case 'percentage':
        return metric.currentValue;
      case 'binary':
        return metric.currentValue ? 100 : 0;
      case 'qualitative':
        return metric.currentValue || 0;
      default:
        return 0;
    }
  }

  /**
   * Calculate overall score from metrics
   */
  private calculateOverallScore(metrics: KpiMetric[]): number {
    if (metrics.length === 0) return 0;

    const totalWeight = metrics.reduce((sum, metric) => sum + (metric.weight || 0), 0);
    if (totalWeight === 0) return 0;

    const weightedSum = metrics.reduce((sum, metric) => {
      const score = metric.score || 0;
      const weight = metric.weight || 0;
      return sum + (score * (weight / totalWeight));
    }, 0);

    return Math.min(100, Math.max(0, weightedSum));
  }

  /**
   * Get KPIs by status
   */
  async getKpisByStatus(status: string): Promise<Kpi[]> {
    try {
      const kpis = await this.getAllKpis({ status });
      return kpis.filter(kpi => kpi.status === status);
    } catch (error) {
      console.error(`Error fetching KPIs with status ${status}:`, error);
      throw error;
    }
  }

  /**
   * Get pending KPIs
   */
  async getPendingKpis(): Promise<Kpi[]> {
    return this.getKpisByStatus('pending');
  }

  /**
   * Get in-progress KPIs
   */
  async getInProgressKpis(): Promise<Kpi[]> {
    return this.getKpisByStatus('in_progress');
  }

  /**
   * Get completed KPIs
   */
  async getCompletedKpis(): Promise<Kpi[]> {
    return this.getKpisByStatus('completed');
  }

  /**
   * Get overdue KPIs (with calculation)
   */
  async getOverdueKpisWithCalculation(): Promise<Kpi[]> {
    try {
      const kpis = await this.getAllKpis({ status: 'in_progress' });
      const now = new Date();
      
      return kpis.filter(kpi => {
        if (!kpi.periodEnd) return false;
        const periodEnd = new Date(kpi.periodEnd);
        return periodEnd < now;
      }).map(kpi => ({
        ...kpi,
        status: 'overdue' as const
      }));
    } catch (error) {
      console.error('Error calculating overdue KPIs:', error);
      throw error;
    }
  }

  /**
   * Search KPIs
   */
  async searchKpis(searchTerm: string): Promise<Kpi[]> {
    try {
      const kpis = await this.getAllKpis();
      return kpis.filter(kpi => 
        kpi.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        kpi.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof kpi.assignedTo === 'object' && 
         kpi.assignedTo.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (typeof kpi.assignedTo === 'object' && 
         kpi.assignedTo.email?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    } catch (error) {
      console.error('Error searching KPIs:', error);
      throw error;
    }
  }

  /**
   * Get active KPIs only
   */
  async getActiveKpis(): Promise<Kpi[]> {
    try {
      const kpis = await this.getAllKpis();
      return kpis.filter(kpi => kpi.active !== false);
    } catch (error) {
      console.error('Error fetching active KPIs:', error);
      throw error;
    }
  }

  /**
   * Calculate KPI progress percentage
   */
  calculateKpiProgress(kpi: Kpi): number {
    if (kpi.status === 'completed') return 100;
    
    const totalWeight = kpi.metrics.reduce((sum, metric) => sum + (metric.weight || 0), 0);
    if (totalWeight === 0) return 0;
    
    const weightedProgress = kpi.metrics.reduce((sum, metric) => {
      const metricProgress = metric.currentValue !== undefined && metric.targetValue 
        ? (metric.currentValue / metric.targetValue) * 100 
        : 0;
      return sum + (metricProgress * (metric.weight / totalWeight));
    }, 0);
    
    return Math.min(100, Math.round(weightedProgress));
  }

  /**
   * Get status color for UI
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'warning';
      case 'in_progress': return 'primary';
      case 'completed': return 'success';
      case 'overdue': return 'error';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  }

  /**
   * Get status text for UI
   */
  getStatusText(status: string): string {
    switch (status) {
      case 'pending': return 'Pending';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'overdue': return 'Overdue';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  }

  /**
   * Get frequency text for UI
   */
  getFrequencyText(frequency: string): string {
    switch (frequency) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      case 'yearly': return 'Yearly';
      case 'custom': return 'Custom';
      default: return frequency;
    }
  }

  /**
   * Get metric type text for UI
   */
  getMetricTypeText(type: string): string {
    switch (type) {
      case 'quantitative': return 'Quantitative';
      case 'qualitative': return 'Qualitative';
      case 'percentage': return 'Percentage';
      case 'binary': return 'Yes/No';
      default: return type;
    }
  }

  /**
   * Calculate days remaining
   */
  calculateDaysRemaining(periodEnd: string): number {
    const end = new Date(periodEnd);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Check if KPI is overdue
   */
  isKpiOverdue(kpi: Kpi): boolean {
    if (!kpi.periodEnd || kpi.status === 'completed') return false;
    
    const periodEnd = new Date(kpi.periodEnd);
    const now = new Date();
    return periodEnd < now;
  }

  /**
   * Check if KPI can be updated
   */
  canUpdateKpi(kpi: Kpi, userId?: string, userRole?: string): boolean {
    if (kpi.status === 'completed' || kpi.status === 'cancelled') {
      return false;
    }
    
    // Allow assigned user to update
    if (typeof kpi.assignedTo === 'object' && kpi.assignedTo._id === userId) {
      return true;
    }
    
    // Allow admins and management
    if (userRole && ['admin', 'management'].includes(userRole)) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if KPI can be reviewed
   */
  canReviewKpi(kpi: Kpi, userRole?: string): boolean {
    if (kpi.status !== 'completed') return false;
    
    // Only admins and management can review
    if (userRole && ['admin', 'management'].includes(userRole)) {
      return true;
    }
    
    return false;
  }

  /**
   * Get assigned user display name
   */
  getAssignedUserDisplayName(kpi: Kpi): string {
    if (!kpi.assignedTo) return 'Unassigned';
    
    if (typeof kpi.assignedTo === 'object' && kpi.assignedTo !== null) {
      return kpi.assignedTo.name || kpi.assignedTo.email || 'Unknown User';
    }
    
    return 'User ID: ' + kpi.assignedTo;
  }

  /**
   * Format KPI for select dropdown
   */
  formatKpiForSelect(kpi: Kpi): { value: string; label: string } {
    return {
      value: kpi.id,
      label: `${kpi.title} (${this.getAssignedUserDisplayName(kpi)})`
    };
  }

  /**
   * Get KPIs for select dropdown
   */
  async getKpisForSelect(): Promise<Array<{ value: string; label: string }>> {
    try {
      const kpis = await this.getActiveKpis();
      return kpis.map(kpi => this.formatKpiForSelect(kpi));
    } catch (error) {
      console.error('Error getting KPIs for select:', error);
      throw error;
    }
  }

  /**
   * Get templates for select dropdown
   */
  async getTemplatesForSelect(): Promise<Array<{ value: string; label: string }>> {
    try {
      const templates = await this.getAllTemplates({ isActive: true });
      return templates.map(template => ({
        value: template.id,
        label: `${template.name} (${template.category || 'General'})`
      }));
    } catch (error) {
      console.error('Error getting templates for select:', error);
      throw error;
    }
  }
}

export const kpiService = new KpiService();

// Status constants for easier reference
export const KPI_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
};

export const KPI_FREQUENCY = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
  CUSTOM: 'custom',
};

export const METRIC_TYPE = {
  QUANTITATIVE: 'quantitative',
  QUALITATIVE: 'qualitative',
  PERCENTAGE: 'percentage',
  BINARY: 'binary',
};

// Helper function to create a KPI status checker
export const createKpiStatusChecker = (kpi: Kpi) => {
  return {
    isPending: () => kpi.status === KPI_STATUS.PENDING,
    isInProgress: () => kpi.status === KPI_STATUS.IN_PROGRESS,
    isCompleted: () => kpi.status === KPI_STATUS.COMPLETED,
    isOverdue: () => kpi.status === KPI_STATUS.OVERDUE || kpiService.isKpiOverdue(kpi),
    isCancelled: () => kpi.status === KPI_STATUS.CANCELLED,
    canUpdate: (userId?: string, userRole?: string) => kpiService.canUpdateKpi(kpi, userId, userRole),
    canReview: (userRole?: string) => kpiService.canReviewKpi(kpi, userRole),
    getStatusColor: () => kpiService.getStatusColor(kpi.status),
    getStatusText: () => kpiService.getStatusText(kpi.status),
    getProgress: () => kpiService.calculateKpiProgress(kpi),
    getDaysRemaining: () => kpi.periodEnd ? kpiService.calculateDaysRemaining(kpi.periodEnd) : null,
    getAssignedUserName: () => kpiService.getAssignedUserDisplayName(kpi),
  };
};