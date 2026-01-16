import { apiClient } from '@/lib/api/client';

export enum ChecklistItemStatus {
  COMPLETED = 'completed',
  INCOMPLETE = 'incomplete',
  NOT_APPLICABLE = 'n/a'
}

export interface ChecklistItem {
  _id?: string;
  item: string;
  status: ChecklistItemStatus;
  remarks?: string;
  required?: boolean;
  category?: string;
  side?: string;
  checkedBy?: string | {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  checkedAt?: Date | string;
}

export interface PostChecklist {
  _id: string;
  id: string;
  opportunityId: string | {
    _id: string;
    subject?: string;
    customer?: {
      name: string;
      email?: string;
      phone?: string;
    };
  };
  vehicleId: string | {
    _id: string;
    make?: string;
    model?: string;
    year?: number;
    licensePlate?: string;
    vin?: string;
    color?: string;
  };
  jobCardId: string | {
    _id: string;
    jobTitle?: string;
    jobDescription?: string;
    status?: string;
    assignedTo?: {
      _id: string;
      firstName?: string;
      lastName?: string;
    };
  };
  preChecklistId?: string;
  inspectedBy: string | {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  inspectionItems: ChecklistItem[];
  notes?: string;
  overallCondition?: 'pending' | 'satisfactory' | 'needs_attention' | 'excellent';
  recommendations?: string;
  approved: boolean;
  approvedBy?: string | {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  approvedAt?: Date | string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  
  customerName?: string;
  dateTime?: string;
  warrantyDuration?: string;
  beforePhotos?: string[];
  afterPhotos?: string[];
  rating?: number;
  comments?: string;
  acceptTerms?: boolean;
  customerSignature?: string;
  warrantyStartDate?: string;
  warrantyEndDate?: string;
  warrantyNotes?: string;
  productServiceNeeded?: string;
  acceptDiagnosticCharges?: boolean;
}

export interface CreatePostChecklistDto {
  opportunityId: string;
  vehicleId: string;
  jobCardId: string;
  preChecklistId?: string; // Add this
  inspectedBy?: string;
  inspectionItems?: ChecklistItem[];
  notes?: string;
  overallCondition?: 'pending' | 'satisfactory' | 'needs_attention' | 'excellent';
  recommendations?: string;
  // Add these new properties
  customerName?: string;
  dateTime?: string;
  warrantyDuration?: string;
  beforePhotos?: string[];
  afterPhotos?: string[];
  rating?: number;
  comments?: string;
  acceptTerms?: boolean;
  customerSignature?: string;
  warrantyStartDate?: string;
  warrantyEndDate?: string;
  warrantyNotes?: string;
  productServiceNeeded?: string;
  acceptDiagnosticCharges?: boolean;
}

export interface UpdatePostChecklistDto {
  inspectionItems?: ChecklistItem[];
  notes?: string;
  overallCondition?: 'pending' | 'satisfactory' | 'needs_attention' | 'excellent';
  recommendations?: string;
  approved?: boolean;
  approvedBy?: string;
  customerName?: string;
  dateTime?: string;
  warrantyDuration?: string;
  beforePhotos?: string[];
  afterPhotos?: string[];
  rating?: number;
  comments?: string;
  acceptTerms?: boolean;
  customerSignature?: string;
  warrantyStartDate?: string;
  warrantyEndDate?: string;
  warrantyNotes?: string;
  productServiceNeeded?: string;
  acceptDiagnosticCharges?: boolean;
}

export interface CheckItemDto {
  status: ChecklistItemStatus;
  remarks?: string;
}

export interface PostChecklistStats {
  total: number;
  byApprovalStatus: Array<{
    _id: boolean;
    count: number;
  }>;
  completionStats: {
    avgCompletion: number;
    totalCompletedItems: number;
    totalItems: number;
    completionPercentage: number;
  };
  recentChecklists: Array<{
    _id: string;
    opportunityId: string;
    vehicleId: string;
    inspectedBy: string;
    approved: boolean;
    createdAt: Date | string;
    completionRate: number;
  }>;
  itemsByCategory: Record<string, number>;
  itemsByStatus: Record<ChecklistItemStatus, number>;
}

// Extended ApiClient for post-checklist service
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

class PostChecklistService {
  // 1. Create a new post-checklist
  async createPostChecklist(data: CreatePostChecklistDto, userId?: string): Promise<PostChecklist> {
    try {
      const headers: Record<string, string> = {};
      
      if (userId) {
        headers['X-User-Id'] = userId;
      }
      
      return await extendedApiClient.post<CreatePostChecklistDto, PostChecklist>('/postchecklist', data, headers);
    } catch (error) {
      console.error('Error creating post-checklist:', error);
      throw error;
    }
  }

  // 2. Get all post-checklists for an opportunity
  async getPostChecklistsByOpportunity(opportunityId: string): Promise<PostChecklist[]> {
    try {
      // Try direct endpoint first
      try {
        return await extendedApiClient.get<PostChecklist[]>(`/postchecklist/opportunity/${opportunityId}`);
      } catch (endpointError) {
        // Fallback to filtering all checklists
        console.warn('Direct endpoint failed, falling back to filtering:', endpointError);
        const allChecklists = await this.getAllPostChecklists();
        return allChecklists.filter(checklist => {
          const oppId = typeof checklist.opportunityId === 'object' 
            ? checklist.opportunityId._id 
            : checklist.opportunityId;
          return oppId === opportunityId;
        });
      }
    } catch (error) {
      console.error(`Error getting post-checklists for opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  // 3. Get a post-checklist by ID
  async getPostChecklistById(id: string): Promise<PostChecklist> {
    try {
      return await extendedApiClient.get<PostChecklist>(`/postchecklist/${id}`);
    } catch (error) {
      console.error(`Error getting post-checklist ${id}:`, error);
      throw error;
    }
  }

  // 4. Update a post-checklist
  async updatePostChecklist(id: string, data: UpdatePostChecklistDto, userId?: string): Promise<PostChecklist> {
    try {
      const headers: Record<string, string> = {};
      
      if (userId) {
        headers['X-User-Id'] = userId;
      }
      
      // Get current checklist first (like pre-checklist does)
      const currentChecklist = await this.getPostChecklistById(id);
      
      // If approved and updating items, handle specially
      if (currentChecklist.approved && data.inspectionItems) {
        // Create audit log entry
        console.log(`Audit: Post-checklist ${id} updated after approval`, {
          previousItems: currentChecklist.inspectionItems,
          newItems: data.inspectionItems,
          timestamp: new Date().toISOString()
        });
        
        // Keep approval status
        const updateData: UpdatePostChecklistDto = {
          ...data,
          approved: true,
          approvedBy: typeof currentChecklist.approvedBy === 'object' 
            ? currentChecklist.approvedBy._id 
            : currentChecklist.approvedBy,
        };
        
        return await extendedApiClient.patch<UpdatePostChecklistDto, PostChecklist>(
          `/postchecklist/${id}`, 
          updateData, 
          headers
        );
      }
      
      // Normal update
      return await extendedApiClient.patch<UpdatePostChecklistDto, PostChecklist>(
        `/postchecklist/${id}`, 
        data, 
        headers
      );
    } catch (error) {
      console.error(`Error updating post-checklist ${id}:`, error);
      throw error;
    }
  }

  // 5. Delete a post-checklist (soft delete)
  async deletePostChecklist(id: string): Promise<{ message: string }> {
    try {
      return await extendedApiClient.delete<{ message: string }>(`/postchecklist/${id}`);
    } catch (error) {
      console.error(`Error deleting post-checklist ${id}:`, error);
      throw error;
    }
  }

  // 6. Check/update a specific item in the checklist
  async checkItem(id: string, itemIndex: number, data: CheckItemDto, userId?: string): Promise<PostChecklist> {
    try {
      const headers: Record<string, string> = {};
      
      if (userId) {
        headers['X-User-Id'] = userId;
      }
      
      return await extendedApiClient.post<CheckItemDto, PostChecklist>(
        `/postchecklist/${id}/check-item/${itemIndex}`, 
        data, 
        headers
      );
    } catch (error) {
      console.error(`Error checking item ${itemIndex} in post-checklist ${id}:`, error);
      throw error;
    }
  }

  // 7. Get post-checklist statistics
  async getPostChecklistStats(opportunityId?: string): Promise<PostChecklistStats> {
    try {
      const endpoint = opportunityId 
        ? `/postchecklist/stats/${opportunityId}`
        : '/postchecklist/stats';
      
      return await extendedApiClient.get<PostChecklistStats>(endpoint);
    } catch (error) {
      console.error(`Error getting post-checklist stats${opportunityId ? ` for opportunity ${opportunityId}` : ''}:`, error);
      throw error;
    }
  }

  // Utility methods
  async getApprovedPostChecklists(): Promise<PostChecklist[]> {
    try {
      const allChecklists = await this.getAllPostChecklists();
      return allChecklists.filter(checklist => checklist.approved);
    } catch (error) {
      console.error('Error getting approved post-checklists:', error);
      throw error;
    }
  }

  async getPendingPostChecklists(): Promise<PostChecklist[]> {
    try {
      const allChecklists = await this.getAllPostChecklists();
      return allChecklists.filter(checklist => !checklist.approved);
    } catch (error) {
      console.error('Error getting pending post-checklists:', error);
      throw error;
    }
  }

  async getActivePostChecklists(): Promise<PostChecklist[]> {
    try {
      const allChecklists = await this.getAllPostChecklists();
      return allChecklists.filter(checklist => checklist.isActive);
    } catch (error) {
      console.error('Error getting active post-checklists:', error);
      throw error;
    }
  }

  async getAllPostChecklists(): Promise<PostChecklist[]> {
    try {
      // Use the same pattern as pre-checklist
      return await extendedApiClient.get<PostChecklist[]>('/postchecklist');
    } catch (error) {
      console.error('Error getting all post-checklists:', error);
      throw error;
    }
  }

  async getPostChecklistsByVehicle(vehicleId: string): Promise<PostChecklist[]> {
    try {
      // This would need backend support or we filter client-side
      const allChecklists = await this.getAllPostChecklists();
      return allChecklists.filter(checklist => {
        const vId = typeof checklist.vehicleId === 'object' 
          ? checklist.vehicleId._id 
          : checklist.vehicleId;
        return vId === vehicleId;
      });
    } catch (error) {
      console.error(`Error getting post-checklists for vehicle ${vehicleId}:`, error);
      throw error;
    }
  }

  async getPostChecklistsByJobCard(jobCardId: string): Promise<PostChecklist[]> {
    try {
      const allChecklists = await this.getAllPostChecklists();
      return allChecklists.filter(checklist => {
        const jcId = typeof checklist.jobCardId === 'object' 
          ? checklist.jobCardId._id 
          : checklist.jobCardId;
        return jcId === jobCardId;
      });
    } catch (error) {
      console.error(`Error getting post-checklists for job card ${jobCardId}:`, error);
      throw error;
    }
  }

  async getPostChecklistsByInspector(inspectorId: string): Promise<PostChecklist[]> {
    try {
      const allChecklists = await this.getAllPostChecklists();
      return allChecklists.filter(checklist => {
        const inspId = typeof checklist.inspectedBy === 'object' 
          ? checklist.inspectedBy._id 
          : checklist.inspectedBy;
        return inspId === inspectorId;
      });
    } catch (error) {
      console.error(`Error getting post-checklists by inspector ${inspectorId}:`, error);
      throw error;
    }
  }

  async approveOrRejectPostChecklist(
    id: string, 
    approved: boolean, 
    approvedBy?: string, 
    comments?: string
  ): Promise<PostChecklist> {
    try {
      const endpoint = `/postchecklist/${id}/approve`;
      
      const requestData: any = { approved };
      
      // Add optional fields only if provided
      if (approvedBy) {
        requestData.approvedBy = approvedBy;
      }
      
      if (comments) {
        requestData.comments = comments;
      }
      
      // Try PATCH first, fallback to PUT if needed
      try {
        return await extendedApiClient.patch<typeof requestData, PostChecklist>(
          endpoint, 
          requestData
        );
      } catch (patchError) {
        console.warn('PATCH failed, trying PUT:', patchError);
        return await extendedApiClient.put<typeof requestData, PostChecklist>(
          endpoint, 
          requestData
        );
      }
    } catch (error) {
      console.error(`Error ${approved ? 'approving' : 'rejecting'} post-checklist ${id}:`, error);
      throw error;
    }
  }

  // 9. Approve a post-checklist
  async approvePostChecklist(id: string, approvedBy?: string, comments?: string): Promise<PostChecklist> {
    try {
      console.log('🔍 Approving post-checklist:', {
        id,
        approvedBy,
        comments,
        endpoint: `/postchecklist/${id}/approve`
      });
      
      // Create request body matching the API spec
      const requestBody = {
        isApproved: true,
        overallRemarks: comments || 'Post-service verification approved',
        approvalNotes: `Approved by: ${approvedBy || 'system'}`
      };
      
      console.log('🔍 Request body:', requestBody);
      
      const headers: Record<string, string> = {};
      if (approvedBy) {
        headers['X-Approved-By'] = approvedBy;
      }
      
      // Call the API
      const approvalResult = await extendedApiClient.patch<typeof requestBody, any>(
        `/postchecklist/${id}/approve`,
        requestBody,
        headers
      );
      
      console.log('✅ Approval response:', approvalResult);
      
      // IMPORTANT: The API returns approval details, not the full checklist
      // We need to fetch the updated checklist
      const updatedChecklist = await this.getPostChecklistById(id);
      console.log('✅ Updated checklist:', updatedChecklist);
      
      return updatedChecklist;
      
    } catch (error) {
      console.error(`❌ Error approving post-checklist ${id}:`, error);
      throw error;
    }
  }

  // Reject a post-checklist
  async rejectPostChecklist(id: string, reason?: string, rejectedBy?: string): Promise<PostChecklist> {
    try {
      const requestBody = {
        isApproved: false,
        overallRemarks: reason || 'Post-checklist rejected',
        approvalNotes: `Rejected by: ${rejectedBy || 'system'}`
      };
      
      const headers: Record<string, string> = {};
      if (rejectedBy) {
        headers['X-Rejected-By'] = rejectedBy;
      }
      
      await extendedApiClient.patch<typeof requestBody, any>(
        `/postchecklist/${id}/approve`,
        requestBody,
        headers
      );
      
      // Fetch the updated checklist
      return await this.getPostChecklistById(id);
    } catch (error) {
      console.error(`Error rejecting post-checklist ${id}:`, error);
      throw error;
    }
  }

  // Mark stage complete after approval
  async markStageCompleteAfterApproval(checklistId: string, stageName: string): Promise<{ 
    success: boolean; 
    message: string; 
    stageCompleted: boolean 
  }> {
    try {
      // This would typically call your workflow/stage management API
      return await extendedApiClient.post<{
        checklistId: string;
        stageName: string;
        checklistType: 'post';
        action: 'complete-stage';
      }, { success: boolean; message: string; stageCompleted: boolean }>(
        `/workflow/stages/complete`,
        {
          checklistId,
          stageName,
          checklistType: 'post',
          action: 'complete-stage'
        }
      );
    } catch (error) {
      console.error(`Error marking stage complete for post-checklist ${checklistId}:`, error);
      throw error;
    }
  }

  // Get post-checklist approval workflow status
  async getApprovalWorkflowStatus(checklistId: string): Promise<{
    checklistId: string;
    approved: boolean;
    stageName: string;
    stageStatus: 'pending' | 'in-progress' | 'completed' | 'blocked';
    nextStage?: string;
    canProceed: boolean;
    requiresCustomerApproval: boolean;
  }> {
    try {
      return await extendedApiClient.get<{
        checklistId: string;
        approved: boolean;
        stageName: string;
        stageStatus: 'pending' | 'in-progress' | 'completed' | 'blocked';
        nextStage?: string;
        canProceed: boolean;
        requiresCustomerApproval: boolean;
      }>(`/postchecklist/${checklistId}/workflow-status`);
    } catch (error) {
      console.error(`Error getting workflow status for post-checklist ${checklistId}:`, error);
      throw error;
    }
  }

  async approvePostChecklistWithLifecycle(
    id: string, 
    approvedBy?: string,
    comments?: string
  ): Promise<{
    checklist: PostChecklist;
    lifecycleUpdate?: any;
  }> {
    try {
      // First, approve the checklist using simple method
      const approvedChecklist = await this.approvePostChecklist(id, approvedBy, comments);
      
      // Try lifecycle integration, but don't fail if it doesn't work
      try {
        const { lifecycleIntegrationService } = require('./lifecycleIntegrationService');
        const lifecycleUpdate = await lifecycleIntegrationService.handleChecklistApproval(
          id,
          'postchecklist',
          approvedBy
        );
        
        return {
          checklist: approvedChecklist,
          lifecycleUpdate
        };
      } catch (lifecycleError) {
        console.warn('Lifecycle integration failed, but checklist approved:', lifecycleError);
        return {
          checklist: approvedChecklist
        };
      }
    } catch (error) {
      console.error(`Error approving post-checklist with lifecycle:`, error);
      throw error;
    }
  }

  // Method to check if post-checklist is required for stage transition
  async isRequiredForStageTransition(opportunityId: string): Promise<{
    required: boolean;
    reason: string;
    hasChecklist: boolean;
    hasApprovedChecklist: boolean;
    isComplete: boolean;
  }> {
    try {
      const checklists = await this.getPostChecklistsByOpportunity(opportunityId);
      
      const hasChecklist = checklists.length > 0;
      const hasApprovedChecklist = checklists.some(c => c.approved);
      
      // Check if any checklist is complete (all items completed or N/A)
      const isComplete = checklists.some(checklist => 
        checklist.inspectionItems.every(item => 
          item.status === ChecklistItemStatus.COMPLETED || 
          item.status === ChecklistItemStatus.NOT_APPLICABLE
        )
      );
      
      return {
        required: true, // Post-checklist is always required for work orders
        reason: 'Post-service quality check is mandatory before final invoice',
        hasChecklist,
        hasApprovedChecklist,
        isComplete
      };
    } catch (error) {
      console.error(`Error checking post-checklist requirements:`, error);
      throw error;
    }
  }

  async addInspectionItem(id: string, item: ChecklistItem): Promise<PostChecklist> {
    try {
      const checklist = await this.getPostChecklistById(id);
      const inspectionItems = [...checklist.inspectionItems, item];
      return await this.updatePostChecklist(id, { inspectionItems });
    } catch (error) {
      console.error(`Error adding inspection item to post-checklist ${id}:`, error);
      throw error;
    }
  }

  async updateInspectionItem(id: string, itemIndex: number, updates: Partial<ChecklistItem>): Promise<PostChecklist> {
    try {
      const checklist = await this.getPostChecklistById(id);
      if (itemIndex < 0 || itemIndex >= checklist.inspectionItems.length) {
        throw new Error(`Item index ${itemIndex} out of bounds`);
      }
      
      const inspectionItems = [...checklist.inspectionItems];
      inspectionItems[itemIndex] = { ...inspectionItems[itemIndex], ...updates };
      
      return await this.updatePostChecklist(id, { inspectionItems });
    } catch (error) {
      console.error(`Error updating inspection item at index ${itemIndex} in post-checklist ${id}:`, error);
      throw error;
    }
  }

  async removeInspectionItem(id: string, itemIndex: number): Promise<PostChecklist> {
    try {
      const checklist = await this.getPostChecklistById(id);
      if (itemIndex < 0 || itemIndex >= checklist.inspectionItems.length) {
        throw new Error(`Item index ${itemIndex} out of bounds`);
      }
      
      const inspectionItems = checklist.inspectionItems.filter((_, index) => index !== itemIndex);
      return await this.updatePostChecklist(id, { inspectionItems });
    } catch (error) {
      console.error(`Error removing inspection item at index ${itemIndex} from post-checklist ${id}:`, error);
      throw error;
    }
  }

  async getChecklistCompletionRate(id: string): Promise<{
    totalItems: number;
    completedItems: number;
    incompleteItems: number;
    naItems: number;
    completionPercentage: number;
  }> {
    try {
      const checklist = await this.getPostChecklistById(id);
      const totalItems = checklist.inspectionItems.length;
      const completedItems = checklist.inspectionItems.filter(item => item.status === ChecklistItemStatus.COMPLETED).length;
      const incompleteItems = checklist.inspectionItems.filter(item => item.status === ChecklistItemStatus.INCOMPLETE).length;
      const naItems = checklist.inspectionItems.filter(item => item.status === ChecklistItemStatus.NOT_APPLICABLE).length;
      
      const requiredItems = checklist.inspectionItems.filter(item => item.required !== false);
      const requiredCompleted = requiredItems.filter(item => item.status === ChecklistItemStatus.COMPLETED).length;
      const completionPercentage = requiredItems.length > 0 
        ? Math.round((requiredCompleted / requiredItems.length) * 100) 
        : 0;
      
      return {
        totalItems,
        completedItems,
        incompleteItems,
        naItems,
        completionPercentage
      };
    } catch (error) {
      console.error(`Error getting completion rate for post-checklist ${id}:`, error);
      throw error;
    }
  }

  async getRecentPostChecklists(limit: number = 10): Promise<PostChecklist[]> {
    try {
      const allChecklists = await this.getAllPostChecklists();
      return allChecklists
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent post-checklists:', error);
      throw error;
    }
  }

  async searchPostChecklists(searchTerm: string): Promise<PostChecklist[]> {
    try {
      const allChecklists = await this.getAllPostChecklists();
      const searchLower = searchTerm.toLowerCase();
      
      return allChecklists.filter(checklist => {
        // Search in notes
        if (checklist.notes?.toLowerCase().includes(searchLower)) {
          return true;
        }
        
        // Search in inspection items
        if (checklist.inspectionItems.some(item => 
          item.item.toLowerCase().includes(searchLower) || 
          item.remarks?.toLowerCase().includes(searchLower)
        )) {
          return true;
        }
        
        // Search in vehicle info
        if (typeof checklist.vehicleId === 'object') {
          if (
            checklist.vehicleId.make?.toLowerCase().includes(searchLower) ||
            checklist.vehicleId.model?.toLowerCase().includes(searchLower) ||
            checklist.vehicleId.licensePlate?.toLowerCase().includes(searchLower)
          ) {
            return true;
          }
        }
        
        // Search in opportunity info
        if (typeof checklist.opportunityId === 'object') {
          if (
            checklist.opportunityId.subject?.toLowerCase().includes(searchLower) ||
            checklist.opportunityId.customer?.name?.toLowerCase().includes(searchLower)
          ) {
            return true;
          }
        }
        
        return false;
      });
    } catch (error) {
      console.error(`Error searching post-checklists for "${searchTerm}":`, error);
      throw error;
    }
  }

  async getPostChecklistsByDateRange(startDate: Date, endDate: Date): Promise<PostChecklist[]> {
    try {
      const allChecklists = await this.getAllPostChecklists();
      const start = startDate.getTime();
      const end = endDate.getTime();
      
      return allChecklists.filter(checklist => {
        const checklistDate = new Date(checklist.createdAt).getTime();
        return checklistDate >= start && checklistDate <= end;
      });
    } catch (error) {
      console.error(`Error getting post-checklists by date range ${startDate.toISOString()} to ${endDate.toISOString()}:`, error);
      throw error;
    }
  }

  async createQuickPostChecklist(
    opportunityId: string, 
    vehicleId: string, 
    jobCardId: string,
    userId: string,
    notes?: string
  ): Promise<PostChecklist> {
    try {
      const defaultItems: ChecklistItem[] = [
        { 
          item: 'Work Quality Check', 
          status: ChecklistItemStatus.INCOMPLETE, 
          required: true,
          category: 'quality'
        },
        { 
          item: 'Safety Inspection', 
          status: ChecklistItemStatus.INCOMPLETE, 
          required: true,
          category: 'safety'
        },
        { 
          item: 'Cleanliness Verification', 
          status: ChecklistItemStatus.INCOMPLETE, 
          required: true,
          category: 'cleanliness'
        },
        { 
          item: 'Tools Returned', 
          status: ChecklistItemStatus.INCOMPLETE, 
          required: false,
          category: 'tools'
        },
        { 
          item: 'Documentation Complete', 
          status: ChecklistItemStatus.INCOMPLETE, 
          required: true,
          category: 'documentation'
        }
      ];
      
      const checklistData: CreatePostChecklistDto = {
        opportunityId,
        vehicleId,
        jobCardId,
        inspectedBy: userId,
        inspectionItems: defaultItems,
        notes: notes || 'Post-service quality inspection',
        overallCondition: 'pending'
      };
      
      return await this.createPostChecklist(checklistData, userId);
    } catch (error) {
      console.error('Error creating quick post-checklist:', error);
      throw error;
    }
  }

  async markItemAsComplete(id: string, itemIndex: number, remarks?: string, userId?: string): Promise<PostChecklist> {
    try {
      return await this.checkItem(id, itemIndex, {
        status: ChecklistItemStatus.COMPLETED,
        remarks: remarks || 'Item completed and verified'
      }, userId);
    } catch (error) {
      console.error(`Error marking item ${itemIndex} as complete in post-checklist ${id}:`, error);
      throw error;
    }
  }

  async markItemAsIncomplete(id: string, itemIndex: number, remarks?: string, userId?: string): Promise<PostChecklist> {
    try {
      return await this.checkItem(id, itemIndex, {
        status: ChecklistItemStatus.INCOMPLETE,
        remarks: remarks || 'Item requires attention'
      }, userId);
    } catch (error) {
      console.error(`Error marking item ${itemIndex} as incomplete in post-checklist ${id}:`, error);
      throw error;
    }
  }

  async markItemAsNotApplicable(id: string, itemIndex: number, remarks?: string, userId?: string): Promise<PostChecklist> {
    try {
      return await this.checkItem(id, itemIndex, {
        status: ChecklistItemStatus.NOT_APPLICABLE,
        remarks: remarks || 'Item not applicable to this service'
      }, userId);
    } catch (error) {
      console.error(`Error marking item ${itemIndex} as not applicable in post-checklist ${id}:`, error);
      throw error;
    }
  }

  async getChecklistSummary(id: string): Promise<{
    checklist: PostChecklist;
    completionRate: number;
    approved: boolean;
    itemsByStatus: Record<ChecklistItemStatus, number>;
    itemsByCategory: Record<string, number>;
    nextSteps: string[];
  }> {
    try {
      const checklist = await this.getPostChecklistById(id);
      const completion = await this.getChecklistCompletionRate(id);
      
      // Count items by status
      const itemsByStatus: Record<ChecklistItemStatus, number> = {
        [ChecklistItemStatus.COMPLETED]: 0,
        [ChecklistItemStatus.INCOMPLETE]: 0,
        [ChecklistItemStatus.NOT_APPLICABLE]: 0
      };
      
      checklist.inspectionItems.forEach(item => {
        itemsByStatus[item.status]++;
      });
      
      // Count items by category
      const itemsByCategory: Record<string, number> = {};
      checklist.inspectionItems.forEach(item => {
        const category = item.category || 'uncategorized';
        itemsByCategory[category] = (itemsByCategory[category] || 0) + 1;
      });
      
      // Determine next steps
      const nextSteps: string[] = [];
      if (!checklist.approved) {
        if (completion.completionPercentage === 100) {
          nextSteps.push('Submit checklist for approval');
        } else {
          nextSteps.push(`Complete ${completion.incompleteItems} remaining items`);
        }
      } else {
        nextSteps.push('Checklist approved - ready for customer delivery');
      }
      
      if (completion.incompleteItems > 0) {
        nextSteps.push('Address incomplete items');
      }
      
      if (checklist.overallCondition === 'needs_attention') {
        nextSteps.push('Review items marked as needing attention');
      }
      
      return {
        checklist,
        completionRate: completion.completionPercentage,
        approved: checklist.approved,
        itemsByStatus,
        itemsByCategory,
        nextSteps
      };
    } catch (error) {
      console.error(`Error getting summary for post-checklist ${id}:`, error);
      throw error;
    }
  }

  async exportPostChecklistToHtml(id: string): Promise<string> {
    try {
      const checklist = await this.getPostChecklistById(id);
      const summary = await this.getChecklistSummary(id);
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Post-Service Checklist - ${checklist._id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #333; }
            .subtitle { font-size: 18px; color: #666; margin-top: 5px; }
            .info-section { margin-bottom: 20px; }
            .info-label { font-weight: bold; color: #555; }
            .info-value { margin-left: 10px; }
            .status-approved { color: green; font-weight: bold; }
            .status-pending { color: orange; font-weight: bold; }
            .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .table th { background-color: #f5f5f5; padding: 12px; text-align: left; border: 1px solid #ddd; }
            .table td { padding: 10px; border: 1px solid #ddd; }
            .status-completed { color: green; }
            .status-incomplete { color: red; font-weight: bold; }
            .status-na { color: #999; }
            .required-true::before { content: "★ "; color: red; }
            .summary { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .summary-item { margin: 5px 0; }
            .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #777; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Post-Service Inspection Checklist</div>
            <div class="subtitle">ID: ${checklist._id} | Status: <span class="status-${checklist.approved ? 'approved' : 'pending'}">${checklist.approved ? 'APPROVED' : 'PENDING APPROVAL'}</span></div>
          </div>
          
          <div class="info-section">
            <div><span class="info-label">Date:</span> <span class="info-value">${new Date(checklist.createdAt).toLocaleDateString()}</span></div>
            <div><span class="info-label">Inspected By:</span> <span class="info-value">${typeof checklist.inspectedBy === 'object' ? `${checklist.inspectedBy.firstName} ${checklist.inspectedBy.lastName}` : 'N/A'}</span></div>
            <div><span class="info-label">Overall Condition:</span> <span class="info-value">${checklist.overallCondition || 'Not specified'}</span></div>
            ${checklist.notes ? `<div><span class="info-label">Notes:</span> <span class="info-value">${checklist.notes}</span></div>` : ''}
            ${checklist.recommendations ? `<div><span class="info-label">Recommendations:</span> <span class="info-value">${checklist.recommendations}</span></div>` : ''}
          </div>
          
          <div class="summary">
            <div class="title">Summary</div>
            <div class="summary-item">Completion Rate: ${summary.completionRate}%</div>
            <div class="summary-item">Completed Items: ${summary.itemsByStatus.completed}</div>
            <div class="summary-item">Incomplete Items: ${summary.itemsByStatus.incomplete}</div>
          </div>
          
          <table class="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Status</th>
                <th>Category</th>
                <th>Remarks</th>
                <th>Required</th>
              </tr>
            </thead>
            <tbody>
              ${checklist.inspectionItems.map(item => `
                <tr>
                  <td class="${item.required ? 'required-true' : ''}">${item.item}</td>
                  <td class="status-${item.status}">${item.status.toUpperCase()}</td>
                  <td>${item.category || 'General'}</td>
                  <td>${item.remarks || 'N/A'}</td>
                  <td>${item.required ? 'Yes' : 'No'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            <p>Completion Rate: ${summary.completionRate}% | Approved: ${checklist.approved ? 'Yes' : 'No'}</p>
            <p>This is an auto-generated report. Please refer to the original checklist for official records.</p>
          </div>
        </body>
        </html>
      `;
      
      return htmlContent;
    } catch (error) {
      console.error(`Error exporting post-checklist ${id} to HTML:`, error);
      throw error;
    }
  }

  async clonePostChecklist(id: string, userId: string): Promise<PostChecklist> {
    try {
      const original = await this.getPostChecklistById(id);
      
      const cloneData: CreatePostChecklistDto = {
        opportunityId: typeof original.opportunityId === 'object' 
          ? original.opportunityId._id 
          : original.opportunityId,
        vehicleId: typeof original.vehicleId === 'object' 
          ? original.vehicleId._id 
          : original.vehicleId,
        jobCardId: typeof original.jobCardId === 'object' 
          ? original.jobCardId._id 
          : original.jobCardId,
        inspectedBy: userId,
        inspectionItems: original.inspectionItems.map(item => ({
          item: item.item,
          status: ChecklistItemStatus.INCOMPLETE, // Reset status for clone
          remarks: item.remarks,
          required: item.required,
          category: item.category
        })),
        notes: original.notes ? `${original.notes} (Cloned)` : 'Cloned checklist',
        overallCondition: 'pending'
      };
      
      return await this.createPostChecklist(cloneData, userId);
    } catch (error) {
      console.error(`Error cloning post-checklist ${id}:`, error);
      throw error;
    }
  }

  async validatePostChecklist(data: CreatePostChecklistDto): Promise<{
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

    if (!data.jobCardId?.trim()) {
      errors.push('Job Card ID is required');
    }

    // Inspection items validation
    if (data.inspectionItems) {
      data.inspectionItems.forEach((item, index) => {
        if (!item.item?.trim()) {
          errors.push(`Inspection item ${index + 1}: Item name is required`);
        }
        if (item.status && !Object.values(ChecklistItemStatus).includes(item.status)) {
          errors.push(`Inspection item ${index + 1}: Invalid status. Must be 'completed', 'incomplete', or 'n/a'`);
        }
      });
    } else {
      warnings.push('No inspection items specified - checklist will be empty');
    }

    // Notes validation
    if (data.notes && data.notes.length > 2000) {
      warnings.push('Notes are very long (over 2000 characters)');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export const postChecklistService = new PostChecklistService();