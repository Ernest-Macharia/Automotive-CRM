import { apiClient } from '@/lib/api/client';

export interface LisValidationResult {
  status: 'green' | 'amber' | 'red' | string;
  score?: number;
  validatedFields?: string[];
  missingFields?: string[];
  warnings?: string[];
  lastValidated?: string;
}

export interface SlaCheckResult {
  compliant?: boolean;
  status?: string;
  elapsedHours?: number;
  reason?: string;
  [key: string]: unknown;
}

export interface ReassignItemData {
  reason: string;
  forceToAdmin?: boolean;
  specificUserId?: string;
}

export interface LisSlaReport {
  [key: string]: unknown;
}

class LisStandaloneService {
  private basePath = '/lis-standalone';

  async validate(data: Record<string, unknown>): Promise<LisValidationResult> {
    try {
      return await apiClient.post<Record<string, unknown>, LisValidationResult>(`${this.basePath}/validate`, data);
    } catch (error) {
      console.error('Error validating LIS:', error);
      throw error;
    }
  }

  async checkSla(item: Record<string, unknown>): Promise<SlaCheckResult> {
    try {
      return await apiClient.post<Record<string, unknown>, SlaCheckResult>(`${this.basePath}/check-sla`, item);
    } catch (error) {
      console.error('Error checking SLA:', error);
      throw error;
    }
  }

  async reassign(itemType: string, itemId: string, data: ReassignItemData): Promise<Record<string, unknown>> {
    try {
      return await apiClient.post<ReassignItemData, Record<string, unknown>>(
        `${this.basePath}/reassign/${itemType}/${itemId}`,
        data
      );
    } catch (error) {
      console.error('Error performing intelligent reassignment:', error);
      throw error;
    }
  }

  async getCandidates(params?: {
    currentAssignee?: string;
    minSuccessRate?: number;
    maxWorkload?: number;
  }): Promise<Record<string, unknown>[]> {
    try {
      const query: Record<string, string> = {};
      if (params?.currentAssignee) query.currentAssignee = params.currentAssignee;
      if (params?.minSuccessRate !== undefined) query.minSuccessRate = String(params.minSuccessRate);
      if (params?.maxWorkload !== undefined) query.maxWorkload = String(params.maxWorkload);
      return await apiClient.get<Record<string, unknown>[]>(`${this.basePath}/candidates`, query);
    } catch (error) {
      console.error('Error fetching LIS/SLA candidates:', error);
      throw error;
    }
  }

  async getReport(timeframe: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<LisSlaReport> {
    try {
      return await apiClient.get<LisSlaReport>(`${this.basePath}/report`, { timeframe });
    } catch (error) {
      console.error('Error fetching LIS/SLA report:', error);
      throw error;
    }
  }

  async configureLis(rules: Record<string, unknown>): Promise<{ message: string }> {
    try {
      return await apiClient.post<Record<string, unknown>, { message: string }>(`${this.basePath}/configure/lis`, rules);
    } catch (error) {
      console.error('Error configuring LIS rules:', error);
      throw error;
    }
  }

  async configureSla(config: Record<string, unknown>): Promise<{ message: string }> {
    try {
      return await apiClient.post<Record<string, unknown>, { message: string }>(`${this.basePath}/configure/sla`, config);
    } catch (error) {
      console.error('Error configuring SLA rules:', error);
      throw error;
    }
  }

  async getStatus(): Promise<Record<string, unknown>> {
    try {
      return await apiClient.get<Record<string, unknown>>(`${this.basePath}/status`);
    } catch (error) {
      console.error('Error fetching LIS/SLA status:', error);
      throw error;
    }
  }
}

export const lisStandaloneService = new LisStandaloneService();
