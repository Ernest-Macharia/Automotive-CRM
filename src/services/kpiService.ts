import { apiClient } from '@/lib/api/client';

export interface KPIUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
}

export interface KPIMetric {
  name: string;
  description: string;
  type: 'quantitative' | 'qualitative' | 'percentage';
  targetValue: number;
  currentValue: number;
  unit: string;
  weight: number;
  completedAt?: string;
  notes?: string;
}

export interface KPI {
  _id: string;
  id: string;
  title: string;
  description: string;
  assignedTo: KPIUser | string;
  role: {
    _id: string;
    name: string;
  };
  metrics: KPIMetric[];
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  periodStart: string;
  periodEnd: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  isTemplate: boolean;
  distributeToSubordinates: boolean;
  notes?: string;
  progress?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  reviewedAt?: string;
  reviewedBy?: KPIUser;
  reviewNotes?: string;
}

export interface KPITemplate extends Omit<KPI, 'assignedTo' | 'periodStart' | 'periodEnd' | 'status'> {
  templateName: string;
  category: string;
}

export interface KPIReport {
  kpis: KPI[];
  summary: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    overdue: number;
    averageProgress: number;
    totalScore: number;
    maxScore: number;
  };
  metrics: {
    name: string;
    averageValue: number;
    targetValue: number;
    achievement: number;
  }[];
}

export interface DashboardStats {
  totalKPIs: number;
  completedKPIs: number;
  pendingKPIs: number;
  inProgressKPIs: number;
  overdueKPIs: number;
  averageCompletion: number;
  thisMonth: {
    created: number;
    completed: number;
    overdue: number;
  };
  byFrequency: Record<string, number>;
  byStatus: Record<string, number>;
  topPerformers: Array<{
    user: KPIUser;
    averageProgress: number;
    completed: number;
  }>;
}

export interface KPIFormData {
  title: string;
  description: string;
  assignedTo: string;
  role: string;
  metrics: Omit<KPIMetric, 'completedAt'>[];
  frequency: KPI['frequency'];
  periodStart: string;
  periodEnd: string;
  status?: KPI['status'];
  isTemplate?: boolean;
  distributeToSubordinates?: boolean;
  notes?: string;
}

export interface KPIUpdateData {
  title?: string;
  description?: string;
  assignedTo?: string;
  role?: string;
  metrics?: KPIMetric[];
  frequency?: KPI['frequency'];
  periodStart?: string;
  periodEnd?: string;
  status?: KPI['status'];
  notes?: string;
  reviewNotes?: string;
}

export interface KPIFilterParams {
  page?: number;
  limit?: number;
  status?: KPI['status'];
  frequency?: KPI['frequency'];
  role?: string;
  periodStart?: string;
  periodEnd?: string;
  assignedTo?: string;
  search?: string;
  isTemplate?: boolean;
  sort?: string;
}

class KpiService {
  // Create a new KPI (Admin/Management only)
  async createKPI(data: KPIFormData): Promise<KPI> {
    try {
      return await apiClient.post<KPIFormData, KPI>('/kpi', data);
    } catch (error) {
      console.error('Error creating KPI:', error);
      throw error;
    }
  }

  // Get all KPIs (Admin/Management only)
  async getAllKPIs(params?: KPIFilterParams): Promise<{ data: KPI[]; pagination?: any }> {
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
      
      const response = await apiClient.get<any>(endpoint);
      return {
        data: response.data || response,
        pagination: response.pagination
      };
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      throw error;
    }
  }

  // Get my KPIs
  async getMyKPIs(params?: {
    status?: KPI['status'];
    periodStart?: string;
    periodEnd?: string;
  }): Promise<KPI[]> {
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
      
      return await apiClient.get<KPI[]>(endpoint);
    } catch (error) {
      console.error('Error fetching my KPIs:', error);
      throw error;
    }
  }

  // Get KPI by ID
  async getKPIById(id: string): Promise<KPI> {
    try {
      return await apiClient.get<KPI>(`/kpi/${id}`);
    } catch (error) {
      console.error(`Error fetching KPI ${id}:`, error);
      throw error;
    }
  }

  // Update KPI
  async updateKPI(id: string, data: KPIUpdateData): Promise<KPI> {
    try {
      return await apiClient.put<KPIUpdateData, KPI>(`/kpi/${id}`, data);
    } catch (error) {
      console.error(`Error updating KPI ${id}:`, error);
      throw error;
    }
  }

  // Delete KPI (Admin only)
  async deleteKPI(id: string): Promise<void> {
    try {
      await apiClient.delete(`/kpi/${id}`);
    } catch (error) {
      console.error(`Error deleting KPI ${id}:`, error);
      throw error;
    }
  }

  // Update KPI metric progress
  async updateKPIMetric(
    kpiId: string,
    metricIndex: number,
    data: { currentValue: number; notes?: string }
  ): Promise<KPI> {
    try {
      return await apiClient.put<typeof data, KPI>(
        `/kpi/${kpiId}/metrics/${metricIndex}`,
        data
      );
    } catch (error) {
      console.error(`Error updating KPI metric:`, error);
      throw error;
    }
  }

  // Mark KPI as completed
  async completeKPI(kpiId: string): Promise<KPI> {
    try {
      return await apiClient.put<{}, KPI>(`/kpi/${kpiId}/complete`, {});
    } catch (error) {
      console.error(`Error completing KPI ${kpiId}:`, error);
      throw error;
    }
  }

  // Review KPI (Admin/Management only)
  async reviewKPI(kpiId: string, data: { reviewNotes: string; approved: boolean }): Promise<KPI> {
    try {
      return await apiClient.put<typeof data, KPI>(`/kpi/${kpiId}/review`, data);
    } catch (error) {
      console.error(`Error reviewing KPI ${kpiId}:`, error);
      throw error;
    }
  }

  // Create KPI template (Admin only)
  async createTemplate(data: Partial<KPIFormData> & { templateName: string; category: string }): Promise<KPITemplate> {
    try {
      return await apiClient.post<typeof data, KPITemplate>('/kpi/templates', data);
    } catch (error) {
      console.error('Error creating KPI template:', error);
      throw error;
    }
  }

  // Get all KPI templates
  async getTemplates(): Promise<KPITemplate[]> {
    try {
      return await apiClient.get<KPITemplate[]>('/kpi/templates');
    } catch (error) {
      console.error('Error fetching KPI templates:', error);
      throw error;
    }
  }

  // Create KPI from template
  async createKPIFromTemplate(templateId: string, data: {
    assignedTo: string;
    periodStart: string;
    periodEnd: string;
  }): Promise<KPI> {
    try {
      return await apiClient.post<typeof data, KPI>(
        `/kpi/templates/${templateId}/assign`,
        data
      );
    } catch (error) {
      console.error('Error creating KPI from template:', error);
      throw error;
    }
  }

  // Generate role-based report
  async getRoleReport(roleId: string, periodStart?: string, periodEnd?: string): Promise<KPIReport> {
    try {
      const queryParams = new URLSearchParams();
      if (periodStart) queryParams.append('periodStart', periodStart);
      if (periodEnd) queryParams.append('periodEnd', periodEnd);
      
      const queryString = queryParams.toString();
      const endpoint = `/kpi/reports/role/${roleId}${queryString ? `?${queryString}` : ''}`;
      
      return await apiClient.get<KPIReport>(endpoint);
    } catch (error) {
      console.error(`Error fetching role report for ${roleId}:`, error);
      throw error;
    }
  }

  // Generate department report
  async getDepartmentReport(department: string, periodStart?: string, periodEnd?: string): Promise<KPIReport> {
    try {
      const queryParams = new URLSearchParams();
      if (periodStart) queryParams.append('periodStart', periodStart);
      if (periodEnd) queryParams.append('periodEnd', periodEnd);
      
      const queryString = queryParams.toString();
      const endpoint = `/kpi/reports/department/${department}${queryString ? `?${queryString}` : ''}`;
      
      return await apiClient.get<KPIReport>(endpoint);
    } catch (error) {
      console.error(`Error fetching department report for ${department}:`, error);
      throw error;
    }
  }

  // Generate individual report
  async getIndividualReport(userId: string, periodStart?: string, periodEnd?: string): Promise<KPIReport> {
    try {
      const queryParams = new URLSearchParams();
      if (periodStart) queryParams.append('periodStart', periodStart);
      if (periodEnd) queryParams.append('periodEnd', periodEnd);
      
      const queryString = queryParams.toString();
      const endpoint = `/kpi/reports/individual/${userId}${queryString ? `?${queryString}` : ''}`;
      
      return await apiClient.get<KPIReport>(endpoint);
    } catch (error) {
      console.error(`Error fetching individual report for ${userId}:`, error);
      throw error;
    }
  }

  // Generate monthly KPIs for all users (Admin only)
  async generateMonthlyKPIs(): Promise<{ message: string; generated: number }> {
    try {
      return await apiClient.post<{}, { message: string; generated: number }>(
        '/kpi/generate/monthly',
        {}
      );
    } catch (error) {
      console.error('Error generating monthly KPIs:', error);
      throw error;
    }
  }

  // Get KPI dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      return await apiClient.get<DashboardStats>('/kpi/dashboard/stats');
    } catch (error) {
      console.error('Error fetching KPI dashboard stats:', error);
      throw error;
    }
  }

  // Get overdue KPIs
  async getOverdueKPIs(): Promise<KPI[]> {
    try {
      return await apiClient.get<KPI[]>('/kpi/overdue');
    } catch (error) {
      console.error('Error fetching overdue KPIs:', error);
      throw error;
    }
  }

  // Calculate progress for a KPI
  calculateKPIProgress(kpi: KPI): number {
    if (!kpi.metrics || kpi.metrics.length === 0) return 0;
    
    const totalWeight = kpi.metrics.reduce((sum, metric) => sum + metric.weight, 0);
    if (totalWeight === 0) return 0;
    
    const progress = kpi.metrics.reduce((sum, metric) => {
      const metricProgress = (metric.currentValue / metric.targetValue) * 100;
      return sum + (metricProgress * metric.weight) / totalWeight;
    }, 0);
    
    return Math.min(Math.round(progress), 100);
  }

  // Get status color
  getStatusColor(status: KPI['status']): string {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status];
  }

  getFrequencyLabel(frequency: KPI['frequency']): string {
    const labels = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly'
    };
    return labels[frequency];
  }
}

export const kpiService = new KpiService();