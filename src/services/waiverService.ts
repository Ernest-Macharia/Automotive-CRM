import { apiClient } from '@/lib/api/client';

export interface Waiver {
  _id: string;
  id: string;
  opportunityId: string | {
    _id: string;
    subject?: string;
    type?: string;
    companyName?: string;
  };
  vehicleId: string | {
    _id: string;
    registrationNumber?: string;
    make?: string;
    model?: string;
    vin?: string;
  };
  type: 'service' | 'repair' | 'diagnostic' | 'inspection' | 'other';
  reason: string;
  notes?: string;
  createdBy: string | {
    _id: string;
    email?: string;
    role?: string;
  };
  signedBy?: string | {
    _id: string;
    email?: string;
    role?: string;
  };
  status: 'pending' | 'signed' | 'expired';
  dateSigned?: Date | string;
  active: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateWaiverDto {
  opportunityId: string;
  vehicleId: string;
  type: 'service' | 'repair' | 'diagnostic' | 'inspection' | 'other';
  reason: string;
  notes?: string;
  status?: 'pending' | 'signed' | 'expired';
}

export interface UpdateWaiverDto {
  type?: 'service' | 'repair' | 'diagnostic' | 'inspection' | 'other';
  reason?: string;
  notes?: string;
  status?: 'pending' | 'signed' | 'expired';
  active?: boolean;
}

export interface SignWaiverResponse {
  message: string;
  waiverId?: string;
  waiver?: {
    id: string;
    status: string;
    signedBy?: string | any;
    dateSigned?: Date | string;
  };
}

export interface WaiverStatistics {
  total: number;
  pending: number;
  signed: number;
  expired: number;
  byType: Record<string, number>;
  recentActivity: Array<{
    date: string;
    created: number;
    signed: number;
  }>;
}

// Extended ApiClient for waiver service
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

class WaiverService {
  // 1. Create a new waiver
  async createWaiver(data: CreateWaiverDto, userId?: string): Promise<Waiver> {
    try {
      const headers: Record<string, string> = {};
      
      if (userId) {
        headers['X-User-Id'] = userId;
      }
      
      return await extendedApiClient.post<CreateWaiverDto, Waiver>('/waivers', data, headers);
    } catch (error) {
      console.error('Error creating waiver:', error);
      throw error;
    }
  }

  // 2. Get all waivers
  async getAllWaivers(): Promise<Waiver[]> {
    try {
      return await extendedApiClient.get<Waiver[]>('/waivers');
    } catch (error) {
      console.error('Error getting all waivers:', error);
      throw error;
    }
  }

  // 3. Get waivers by vehicle ID
  async getWaiversByVehicle(vehicleId: string): Promise<Waiver[]> {
    try {
      return await extendedApiClient.get<Waiver[]>(`/waivers/vehicle/${vehicleId}`);
    } catch (error) {
      console.error(`Error getting waivers for vehicle ${vehicleId}:`, error);
      throw error;
    }
  }

  // 4. Get a waiver by ID
  async getWaiverById(id: string): Promise<Waiver> {
    try {
      return await extendedApiClient.get<Waiver>(`/waivers/${id}`);
    } catch (error) {
      console.error(`Error getting waiver ${id}:`, error);
      throw error;
    }
  }

  // 5. Update a waiver
  async updateWaiver(id: string, data: UpdateWaiverDto): Promise<Waiver> {
    try {
      return await extendedApiClient.put<UpdateWaiverDto, Waiver>(`/waivers/${id}`, data);
    } catch (error) {
      console.error(`Error updating waiver ${id}:`, error);
      throw error;
    }
  }

  // 6. Delete a waiver
  async deleteWaiver(id: string): Promise<void> {
    try {
      await extendedApiClient.delete<void>(`/waivers/${id}`);
    } catch (error) {
      console.error(`Error deleting waiver ${id}:`, error);
      throw error;
    }
  }

  // 7. Sign a waiver
  async signWaiver(id: string, userId?: string): Promise<SignWaiverResponse> {
    try {
      const headers: Record<string, string> = {};
      
      if (userId) {
        headers['X-User-Id'] = userId;
      }
      
      return await extendedApiClient.patch<any, SignWaiverResponse>(`/waivers/${id}/sign`, {}, headers);
    } catch (error) {
      console.error(`Error signing waiver ${id}:`, error);
      throw error;
    }
  }

  // 8. Get waivers by opportunity ID
  async getWaiversByOpportunity(opportunityId: string): Promise<Waiver[]> {
    try {
      return await extendedApiClient.get<Waiver[]>(`/waivers/opportunity/${opportunityId}`);
    } catch (error) {
      console.error(`Error getting waivers for opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  // Utility methods
  async getActiveWaivers(): Promise<Waiver[]> {
    try {
      const allWaivers = await this.getAllWaivers();
      return allWaivers.filter(waiver => waiver.active);
    } catch (error) {
      console.error('Error getting active waivers:', error);
      throw error;
    }
  }

  async getPendingWaivers(): Promise<Waiver[]> {
    try {
      const allWaivers = await this.getAllWaivers();
      return allWaivers.filter(waiver => waiver.status === 'pending');
    } catch (error) {
      console.error('Error getting pending waivers:', error);
      throw error;
    }
  }

  async getSignedWaivers(): Promise<Waiver[]> {
    try {
      const allWaivers = await this.getAllWaivers();
      return allWaivers.filter(waiver => waiver.status === 'signed');
    } catch (error) {
      console.error('Error getting signed waivers:', error);
      throw error;
    }
  }

  async getExpiredWaivers(): Promise<Waiver[]> {
    try {
      const allWaivers = await this.getAllWaivers();
      return allWaivers.filter(waiver => waiver.status === 'expired');
    } catch (error) {
      console.error('Error getting expired waivers:', error);
      throw error;
    }
  }

  async getWaiversByType(type: 'service' | 'repair' | 'diagnostic' | 'inspection' | 'other'): Promise<Waiver[]> {
    try {
      const allWaivers = await this.getAllWaivers();
      return allWaivers.filter(waiver => waiver.type === type);
    } catch (error) {
      console.error(`Error getting waivers by type ${type}:`, error);
      throw error;
    }
  }

  async getRecentWaivers(limit: number = 10): Promise<Waiver[]> {
    try {
      const allWaivers = await this.getAllWaivers();
      return allWaivers
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent waivers:', error);
      throw error;
    }
  }

  async getRecentSignedWaivers(limit: number = 10): Promise<Waiver[]> {
    try {
      const signedWaivers = await this.getSignedWaivers();
      return signedWaivers
        .sort((a, b) => new Date(b.dateSigned || b.createdAt).getTime() - new Date(a.dateSigned || a.createdAt).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent signed waivers:', error);
      throw error;
    }
  }

  async searchWaivers(searchTerm: string): Promise<Waiver[]> {
    try {
      const allWaivers = await this.getAllWaivers();
      const searchLower = searchTerm.toLowerCase();
      
      return allWaivers.filter(waiver => {
        // Search in reason
        if (waiver.reason.toLowerCase().includes(searchLower)) {
          return true;
        }
        
        // Search in notes
        if (waiver.notes?.toLowerCase().includes(searchLower)) {
          return true;
        }
        
        // Search in vehicle info
        if (typeof waiver.vehicleId === 'object') {
          if (
            waiver.vehicleId.registrationNumber?.toLowerCase().includes(searchLower) ||
            waiver.vehicleId.make?.toLowerCase().includes(searchLower) ||
            waiver.vehicleId.model?.toLowerCase().includes(searchLower)
          ) {
            return true;
          }
        }
        
        return false;
      });
    } catch (error) {
      console.error(`Error searching waivers for "${searchTerm}":`, error);
      throw error;
    }
  }

  async getWaiversByDateRange(startDate: Date, endDate: Date): Promise<Waiver[]> {
    try {
      const allWaivers = await this.getAllWaivers();
      const start = startDate.getTime();
      const end = endDate.getTime();
      
      return allWaivers.filter(waiver => {
        const waiverDate = new Date(waiver.createdAt).getTime();
        return waiverDate >= start && waiverDate <= end;
      });
    } catch (error) {
      console.error(`Error getting waivers by date range ${startDate.toISOString()} to ${endDate.toISOString()}:`, error);
      throw error;
    }
  }

  async activateWaiver(id: string): Promise<Waiver> {
    try {
      return await this.updateWaiver(id, { active: true });
    } catch (error) {
      console.error(`Error activating waiver ${id}:`, error);
      throw error;
    }
  }

  async deactivateWaiver(id: string): Promise<Waiver> {
    try {
      return await this.updateWaiver(id, { active: false });
    } catch (error) {
      console.error(`Error deactivating waiver ${id}:`, error);
      throw error;
    }
  }

  async markWaiverAsExpired(id: string): Promise<Waiver> {
    try {
      return await this.updateWaiver(id, { status: 'expired' });
    } catch (error) {
      console.error(`Error marking waiver ${id} as expired:`, error);
      throw error;
    }
  }

  async createServiceWaiver(
    opportunityId: string,
    vehicleId: string,
    reason: string,
    notes?: string,
    userId?: string
  ): Promise<Waiver> {
    try {
      const waiverData: CreateWaiverDto = {
        opportunityId,
        vehicleId,
        type: 'service',
        reason,
        notes,
        status: 'pending'
      };
      
      return await this.createWaiver(waiverData, userId);
    } catch (error) {
      console.error('Error creating service waiver:', error);
      throw error;
    }
  }

  async createRepairWaiver(
    opportunityId: string,
    vehicleId: string,
    reason: string,
    notes?: string,
    userId?: string
  ): Promise<Waiver> {
    try {
      const waiverData: CreateWaiverDto = {
        opportunityId,
        vehicleId,
        type: 'repair',
        reason,
        notes,
        status: 'pending'
      };
      
      return await this.createWaiver(waiverData, userId);
    } catch (error) {
      console.error('Error creating repair waiver:', error);
      throw error;
    }
  }

  async getWaiverStatistics(): Promise<WaiverStatistics> {
    try {
      const allWaivers = await this.getAllWaivers();
      
      const stats: WaiverStatistics = {
        total: allWaivers.length,
        pending: allWaivers.filter(w => w.status === 'pending').length,
        signed: allWaivers.filter(w => w.status === 'signed').length,
        expired: allWaivers.filter(w => w.status === 'expired').length,
        byType: {},
        recentActivity: []
      };

      // Count by type
      allWaivers.forEach(waiver => {
        stats.byType[waiver.type] = (stats.byType[waiver.type] || 0) + 1;
      });

      // Recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentWaivers = allWaivers.filter(w => 
        new Date(w.createdAt) >= thirtyDaysAgo
      );
      
      const activityByDate = new Map<string, { created: number; signed: number }>();
      recentWaivers.forEach(waiver => {
        const date = new Date(waiver.createdAt).toISOString().split('T')[0];
        if (!activityByDate.has(date)) {
          activityByDate.set(date, { created: 0, signed: 0 });
        }
        const data = activityByDate.get(date)!;
        data.created++;
        if (waiver.status === 'signed' && waiver.dateSigned) {
          const signedDate = new Date(waiver.dateSigned).toISOString().split('T')[0];
          if (signedDate === date) {
            data.signed++;
          }
        }
      });
      
      stats.recentActivity = Array.from(activityByDate.entries())
        .map(([date, data]) => ({
          date,
          created: data.created,
          signed: data.signed
        }))
        .sort((a, b) => b.date.localeCompare(a.date));

      return stats;
    } catch (error) {
      console.error('Error getting waiver statistics:', error);
      throw error;
    }
  }

  async getWaiverCompletionRate(): Promise<{
    total: number;
    signed: number;
    pending: number;
    expired: number;
    signingRate: number;
    averageSigningTime?: number; // in hours
  }> {
    try {
      const allWaivers = await this.getAllWaivers();
      const signedWaivers = allWaivers.filter(w => w.status === 'signed');
      
      let totalSigningTime = 0;
      let signedWithDateCount = 0;
      
      signedWaivers.forEach(waiver => {
        if (waiver.dateSigned && waiver.createdAt) {
          const createdDate = new Date(waiver.createdAt);
          const signedDate = new Date(waiver.dateSigned);
          const hoursToSign = (signedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
          
          if (hoursToSign > 0) {
            totalSigningTime += hoursToSign;
            signedWithDateCount++;
          }
        }
      });
      
      const averageSigningTime = signedWithDateCount > 0 
        ? Math.round(totalSigningTime / signedWithDateCount) 
        : undefined;
      
      const signingRate = allWaivers.length > 0 
        ? Math.round((signedWaivers.length / allWaivers.length) * 100) 
        : 0;
      
      return {
        total: allWaivers.length,
        signed: signedWaivers.length,
        pending: allWaivers.filter(w => w.status === 'pending').length,
        expired: allWaivers.filter(w => w.status === 'expired').length,
        signingRate,
        averageSigningTime
      };
    } catch (error) {
      console.error('Error getting waiver completion rate:', error);
      throw error;
    }
  }

  async exportWaiverToHtml(id: string): Promise<string> {
    try {
      const waiver = await this.getWaiverById(id);
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Waiver - ${waiver._id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #333; }
            .subtitle { font-size: 18px; color: #666; margin-top: 5px; }
            .info-section { margin-bottom: 20px; }
            .info-label { font-weight: bold; color: #555; }
            .info-value { margin-left: 10px; }
            .status-signed { color: green; font-weight: bold; }
            .status-pending { color: orange; font-weight: bold; }
            .status-expired { color: red; font-weight: bold; }
            .content-box { background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #007bff; }
            .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #777; }
            .signature-area { margin-top: 50px; border-top: 1px dashed #333; padding-top: 20px; }
            .signature-line { width: 300px; border-bottom: 1px solid #333; margin: 40px 0 10px; }
            .signature-label { font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Service Waiver Agreement</div>
            <div class="subtitle">ID: ${waiver._id} | Status: <span class="status-${waiver.status}">${waiver.status.toUpperCase()}</span></div>
          </div>
          
          <div class="info-section">
            <div><span class="info-label">Type:</span> <span class="info-value">${waiver.type.toUpperCase()} WAIVER</span></div>
            <div><span class="info-label">Created:</span> <span class="info-value">${new Date(waiver.createdAt).toLocaleDateString()}</span></div>
            ${waiver.dateSigned ? `<div><span class="info-label">Signed:</span> <span class="info-value">${new Date(waiver.dateSigned).toLocaleDateString()}</span></div>` : ''}
            <div><span class="info-label">Active:</span> <span class="info-value">${waiver.active ? 'Yes' : 'No'}</span></div>
          </div>
          
          <div class="content-box">
            <h3>Waiver Reason</h3>
            <p>${waiver.reason}</p>
            
            ${waiver.notes ? `
              <h3>Additional Notes</h3>
              <p>${waiver.notes}</p>
            ` : ''}
          </div>
          
          <div class="signature-area">
            <h3>Customer Acknowledgment</h3>
            <p>By signing this waiver, I acknowledge that I have read and understand the above information and accept the terms outlined.</p>
            
            <div class="signature-line"></div>
            <div class="signature-label">Customer Signature</div>
            
            ${waiver.signedBy ? `
              <div style="margin-top: 20px;">
                <div><strong>Signed By:</strong> ${typeof waiver.signedBy === 'object' ? waiver.signedBy.email : 'Customer'}</div>
                <div><strong>Date Signed:</strong> ${waiver.dateSigned ? new Date(waiver.dateSigned).toLocaleDateString() : 'N/A'}</div>
              </div>
            ` : `
              <div style="margin-top: 20px; color: #999; font-style: italic;">
                [Awaiting customer signature]
              </div>
            `}
          </div>
          
          <div class="footer">
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            <p>Waiver ID: ${waiver._id} | Status: ${waiver.status}</p>
            <p>This document is for record-keeping purposes only.</p>
          </div>
        </body>
        </html>
      `;
      
      return htmlContent;
    } catch (error) {
      console.error(`Error exporting waiver ${id} to HTML:`, error);
      throw error;
    }
  }

  async cloneWaiver(id: string, userId?: string): Promise<Waiver> {
    try {
      const original = await this.getWaiverById(id);
      
      const cloneData: CreateWaiverDto = {
        opportunityId: typeof original.opportunityId === 'object' 
          ? original.opportunityId._id 
          : original.opportunityId,
        vehicleId: typeof original.vehicleId === 'object' 
          ? original.vehicleId._id 
          : original.vehicleId,
        type: original.type,
        reason: `${original.reason} (Copy)`,
        notes: original.notes,
        status: 'pending' // Reset status for clone
      };
      
      return await this.createWaiver(cloneData, userId);
    } catch (error) {
      console.error(`Error cloning waiver ${id}:`, error);
      throw error;
    }
  }

  async bulkUpdateWaiverStatus(waiverIds: string[], status: 'pending' | 'signed' | 'expired'): Promise<{ updated: number; failed: number }> {
    try {
      const results = await Promise.allSettled(
        waiverIds.map(id => this.updateWaiver(id, { status }))
      );

      const updated = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return { updated, failed };
    } catch (error) {
      console.error('Error in bulk update waiver status:', error);
      throw error;
    }
  }

  async validateWaiverData(data: CreateWaiverDto): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!data.opportunityId?.trim()) {
      errors.push('Opportunity ID is required');
    }

    if (!data.vehicleId?.trim()) {
      errors.push('Vehicle ID is required');
    }

    if (!data.type?.trim()) {
      errors.push('Waiver type is required');
    } else if (!['service', 'repair', 'diagnostic', 'inspection', 'other'].includes(data.type)) {
      errors.push('Invalid waiver type');
    }

    if (!data.reason?.trim()) {
      errors.push('Waiver reason is required');
    }

    // Reason length validation
    if (data.reason && data.reason.length > 1000) {
      warnings.push('Waiver reason is very long (over 1000 characters)');
    }

    // Notes validation
    if (data.notes && data.notes.length > 2000) {
      warnings.push('Notes are very long (over 2000 characters)');
    }

    // Status validation
    if (data.status && !['pending', 'signed', 'expired'].includes(data.status)) {
      errors.push('Invalid waiver status');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  async getUnsignedWaiversOlderThan(days: number): Promise<Waiver[]> {
    try {
      const allWaivers = await this.getAllWaivers();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      return allWaivers.filter(waiver => 
        waiver.status === 'pending' && 
        new Date(waiver.createdAt) < cutoffDate
      );
    } catch (error) {
      console.error(`Error getting unsigned waivers older than ${days} days:`, error);
      throw error;
    }
  }

  async autoExpireOldWaivers(days: number = 30): Promise<{ expired: number }> {
    try {
      const oldWaivers = await this.getUnsignedWaiversOlderThan(days);
      const results = await this.bulkUpdateWaiverStatus(
        oldWaivers.map(w => w._id),
        'expired'
      );
      
      return { expired: results.updated };
    } catch (error) {
      console.error(`Error auto-expiring waivers older than ${days} days:`, error);
      throw error;
    }
  }
}

export const waiverService = new WaiverService();