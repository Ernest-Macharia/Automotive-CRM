import { apiClient } from '@/lib/api/client';
import { handleUnauthorizedRedirect } from '@/lib/auth/unauthorized';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'escalated';
export type ApprovalType = 'sequential' | 'parallel' | 'any-one';
export type ApprovalDecision = 'approve' | 'reject';

export interface Approver {
  type: 'user' | 'role' | 'manager';
  id: string;
  name: string;
  order: number;
  conditions?: any;
}

export interface EscalationRules {
  enabled: boolean;
  timeoutAction: 'escalate' | 'auto-approve' | 'auto-reject';
  escalateTo: Approver[];
}

export interface CreateApprovalWorkflowDto {
  name: string;
  description?: string;
  blueprintId: string;
  triggerStage?: string;
  approvers: Approver[];
  approvalType: ApprovalType;
  timeoutHours?: number;
  escalationRules?: EscalationRules;
  onApproveActions?: any[];
  onRejectActions?: any[];
  active?: boolean;
}

export interface ApprovalWorkflow {
  _id: string;
  name: string;
  description?: string;
  blueprintId: string;
  triggerStage?: string;
  approvers: Approver[];
  approvalType: ApprovalType;
  timeoutHours?: number;
  escalationRules?: EscalationRules;
  onApproveActions?: any[];
  onRejectActions?: any[];
  active: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ApprovalRequest {
  _id: string;
  workflowId: string;
  recordId: string;
  module: string;
  recordSnapshot: any;
  approvers: Array<{
    userId: string;
    userRole: string;
    requiredRole?: string;
    status: ApprovalStatus;
    order: number;
    comments?: string;
    actedAt?: string | Date;
  }>;
  status: ApprovalStatus;
  currentApproverIndex?: number;
  dueDate?: string | Date;
  context: any;
  completedAt?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface InitiateApprovalDto {
  workflowId: string;
  record: any;
  context: any;
}

export interface ProcessApprovalDto {
  decision: ApprovalDecision;
  comments?: string;
}

export interface ApprovalHistory {
  _id: string;
  approvalRequestId: string;
  action: string;
  userId: string;
  metadata?: any;
  createdAt: string | Date;
}

export interface ApprovalStatistics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  escalated: number;
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

// Extended ApiClient for approvals service
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

class ApprovalsService {
  // 1. Create a new approval workflow
  async createWorkflow(data: CreateApprovalWorkflowDto): Promise<ApprovalWorkflow> {
    try {
      return await extendedApiClient.post<CreateApprovalWorkflowDto, ApprovalWorkflow>(
        '/approvals/workflows',
        data
      );
    } catch (error) {
      console.error('Error creating approval workflow:', error);
      throw error;
    }
  }

  // 2. Get all approval workflows
  async getAllWorkflows(): Promise<ApprovalWorkflow[]> {
    try {
      return await extendedApiClient.get<ApprovalWorkflow[]>('/approvals/workflows');
    } catch (error) {
      console.error('Error getting approval workflows:', error);
      throw error;
    }
  }

  // 3. Initiate a new approval request
  async initiateApproval(data: InitiateApprovalDto): Promise<ApprovalRequest> {
    try {
      return await extendedApiClient.post<InitiateApprovalDto, ApprovalRequest>(
        '/approvals/requests/initiate',
        data
      );
    } catch (error) {
      console.error('Error initiating approval request:', error);
      throw error;
    }
  }

  // 4. Process an approval decision
  async processApproval(
    requestId: string,
    data: ProcessApprovalDto
  ): Promise<ApprovalRequest> {
    try {
      return await extendedApiClient.put<ProcessApprovalDto, ApprovalRequest>(
        `/approvals/requests/${requestId}/process`,
        data
      );
    } catch (error) {
      console.error(`Error processing approval request ${requestId}:`, error);
      throw error;
    }
  }

  // 5. Get pending approvals for current user
  async getPendingApprovals(): Promise<ApprovalRequest[]> {
    try {
      return await extendedApiClient.get<ApprovalRequest[]>('/approvals/requests/pending');
    } catch (error) {
      console.error('Error getting pending approvals:', error);
      throw error;
    }
  }

  // 6. Get approval request details
  async getApprovalRequest(requestId: string): Promise<ApprovalRequest> {
    try {
      return await extendedApiClient.get<ApprovalRequest>(`/approvals/requests/${requestId}`);
    } catch (error) {
      console.error(`Error getting approval request ${requestId}:`, error);
      throw error;
    }
  }

  // 7. Get roles allowed to approve
  async getAllowedRoles(): Promise<string[]> {
    try {
      return await extendedApiClient.get<string[]>('/approvals/allowed-roles');
    } catch (error) {
      console.error('Error getting allowed roles:', error);
      throw error;
    }
  }

  // 8. Get approval history for a record
  async getApprovalHistory(recordId: string): Promise<ApprovalRequest[]> {
    try {
      return await extendedApiClient.get<ApprovalRequest[]>(`/approvals/requests/history/${recordId}`);
    } catch (error) {
      console.error(`Error getting approval history for record ${recordId}:`, error);
      throw error;
    }
  }

  // 9. Get approval request history (separate from approval history)
  async getRequestHistory(requestId: string): Promise<ApprovalHistory[]> {
    try {
      // Note: This would need a dedicated endpoint
      const request = await this.getApprovalRequest(requestId);
      
      const mockHistory: ApprovalHistory[] = [
        {
          _id: 'history-1',
          approvalRequestId: requestId,
          action: 'created',
          userId: request.context?.userId || 'system',
          metadata: {
            workflowName: 'Approval Workflow',
            recordId: request.recordId
          },
          createdAt: request.createdAt
        },
        ...request.approvers
          .filter(approver => approver.actedAt)
          .map((approver, index) => ({
            _id: `history-${index + 2}`,
            approvalRequestId: requestId,
            action: approver.status === 'approved' ? 'approved' : 'rejected',
            userId: approver.userId,
            metadata: {
              comments: approver.comments,
              userRole: approver.userRole
            },
            createdAt: approver.actedAt!
          }))
      ];
      
      return mockHistory;
    } catch (error) {
      console.error(`Error getting request history for ${requestId}:`, error);
      throw error;
    }
  }

  // Utility methods
  async getWorkflow(workflowId: string): Promise<ApprovalWorkflow> {
    try {
      // Note: This would need a dedicated endpoint or we filter from getAllWorkflows
      const workflows = await this.getAllWorkflows();
      const workflow = workflows.find(w => w._id === workflowId);
      
      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }
      
      return workflow;
    } catch (error) {
      console.error(`Error getting workflow ${workflowId}:`, error);
      throw error;
    }
  }

  async getApprovalsByStatus(status: ApprovalStatus): Promise<ApprovalRequest[]> {
    try {
      // Note: This would need a dedicated endpoint or we filter client-side
      const allRequests = await this.getAllApprovals();
      return allRequests.filter(request => request.status === status);
    } catch (error) {
      console.error(`Error getting approvals by status ${status}:`, error);
      throw error;
    }
  }

  async getAllApprovals(): Promise<ApprovalRequest[]> {
    try {
      // Note: This would need a dedicated endpoint
      const pending = await this.getPendingApprovals();
      
      // In a real scenario, you'd have a separate endpoint for all approvals
      return pending;
    } catch (error) {
      console.error('Error getting all approvals:', error);
      throw error;
    }
  }

  async cancelApprovalRequest(
    requestId: string,
    reason?: string
  ): Promise<ApprovalRequest> {
    try {
      // Note: This would need a dedicated endpoint
      const request = await this.getApprovalRequest(requestId);
      
      if (request.status !== 'pending') {
        throw new Error(`Cannot cancel approval request with status: ${request.status}`);
      }
      
      // In a real scenario, you'd call DELETE /approvals/requests/{requestId}/cancel
      const cancelledRequest = {
        ...request,
        status: 'cancelled' as ApprovalStatus,
        completedAt: new Date().toISOString()
      };
      
      return cancelledRequest;
    } catch (error) {
      console.error(`Error cancelling approval request ${requestId}:`, error);
      throw error;
    }
  }

  async escalateApprovalRequest(
    requestId: string,
    reason?: string
  ): Promise<ApprovalRequest> {
    try {
      // Note: This would need a dedicated endpoint
      const request = await this.getApprovalRequest(requestId);
      
      if (request.status !== 'pending') {
        throw new Error(`Cannot escalate approval request with status: ${request.status}`);
      }
      
      // In a real scenario, you'd call POST /approvals/requests/{requestId}/escalate
      const escalatedRequest = {
        ...request,
        status: 'escalated' as ApprovalStatus
      };
      
      return escalatedRequest;
    } catch (error) {
      console.error(`Error escalating approval request ${requestId}:`, error);
      throw error;
    }
  }

  async getApprovalStatistics(): Promise<ApprovalStatistics> {
    try {
      // Note: This would need a dedicated endpoint
      const allApprovals = await this.getAllApprovals();
      
      const total = allApprovals.length;
      const pending = allApprovals.filter(a => a.status === 'pending').length;
      const approved = allApprovals.filter(a => a.status === 'approved').length;
      const rejected = allApprovals.filter(a => a.status === 'rejected').length;
      const cancelled = allApprovals.filter(a => a.status === 'cancelled').length;
      const escalated = allApprovals.filter(a => a.status === 'escalated').length;
      
      return {
        total,
        pending,
        approved,
        rejected,
        cancelled,
        escalated
      };
    } catch (error) {
      console.error('Error getting approval statistics:', error);
      throw error;
    }
  }

  async canUserApprove(userRole: string): Promise<boolean> {
    try {
      const allowedRoles = await this.getAllowedRoles();
      return allowedRoles.includes(userRole);
    } catch (error) {
      console.error(`Error checking if user role ${userRole} can approve:`, error);
      throw error;
    }
  }

  async approveRequest(
    requestId: string,
    comments?: string
  ): Promise<ApprovalRequest> {
    try {
      return await this.processApproval(requestId, {
        decision: 'approve',
        comments
      });
    } catch (error) {
      console.error(`Error approving request ${requestId}:`, error);
      throw error;
    }
  }

  async rejectRequest(
    requestId: string,
    comments?: string
  ): Promise<ApprovalRequest> {
    try {
      return await this.processApproval(requestId, {
        decision: 'reject',
        comments
      });
    } catch (error) {
      console.error(`Error rejecting request ${requestId}:`, error);
      throw error;
    }
  }

  async getMyApprovalRequests(): Promise<{
    pending: ApprovalRequest[];
    approved: ApprovalRequest[];
    rejected: ApprovalRequest[];
    all: ApprovalRequest[];
  }> {
    try {
      // Get all requests where user is an approver
      const allRequests = await this.getAllApprovals();
      const userId = this.getCurrentUserId(); // Would come from auth context
      
      const myRequests = allRequests.filter(request => 
        request.approvers.some(approver => approver.userId === userId)
      );
      
      const pending = myRequests.filter(r => r.status === 'pending');
      const approved = myRequests.filter(r => r.status === 'approved');
      const rejected = myRequests.filter(r => r.status === 'rejected');
      
      return {
        pending,
        approved,
        rejected,
        all: myRequests
      };
    } catch (error) {
      console.error('Error getting my approval requests:', error);
      throw error;
    }
  }

  private getCurrentUserId(): string {
    // This would come from your authentication context
    // For now, return a placeholder
    const userData = sessionStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      return user.id || user._id || 'current-user';
    }
    return 'current-user';
  }

  async getApprovalTimeline(requestId: string): Promise<{
    request: ApprovalRequest;
    history: ApprovalHistory[];
    timeline: Array<{
      date: string | Date;
      action: string;
      user: string;
      comments?: string;
    }>;
  }> {
    try {
      const [request, history] = await Promise.all([
        this.getApprovalRequest(requestId),
        this.getRequestHistory(requestId) // Use the new method
      ]);
      
      // Build timeline
      const timeline = [
        {
          date: request.createdAt,
          action: 'Request Created',
          user: request.context?.userId || 'system',
          comments: `Initiated approval workflow for ${request.module}`
        },
        ...request.approvers
          .filter(approver => approver.actedAt)
          .map(approver => ({
            date: approver.actedAt!,
            action: approver.status === 'approved' ? 'Approved' : 'Rejected',
            user: approver.userId,
            comments: approver.comments
          })),
        ...history.map(historyItem => ({
          date: historyItem.createdAt,
          action: historyItem.action,
          user: historyItem.userId,
          comments: historyItem.metadata?.comments
        }))
      ];
      
      // Sort timeline by date
      timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      return {
        request,
        history,
        timeline
      };
    } catch (error) {
      console.error(`Error getting approval timeline for request ${requestId}:`, error);
      throw error;
    }
  }

  async createSequentialWorkflow(
    name: string,
    blueprintId: string,
    approvers: Approver[],
    options?: {
      description?: string;
      triggerStage?: string;
      timeoutHours?: number;
      escalationRules?: EscalationRules;
      onApproveActions?: any[];
      onRejectActions?: any[];
    }
  ): Promise<ApprovalWorkflow> {
    try {
      const workflowData: CreateApprovalWorkflowDto = {
        name,
        blueprintId,
        approvers,
        approvalType: 'sequential',
        active: true,
        ...options
      };
      
      return await this.createWorkflow(workflowData);
    } catch (error) {
      console.error('Error creating sequential workflow:', error);
      throw error;
    }
  }

  async createParallelWorkflow(
    name: string,
    blueprintId: string,
    approvers: Approver[],
    options?: {
      description?: string;
      triggerStage?: string;
      timeoutHours?: number;
      escalationRules?: EscalationRules;
      onApproveActions?: any[];
      onRejectActions?: any[];
    }
  ): Promise<ApprovalWorkflow> {
    try {
      const workflowData: CreateApprovalWorkflowDto = {
        name,
        blueprintId,
        approvers,
        approvalType: 'parallel',
        active: true,
        ...options
      };
      
      return await this.createWorkflow(workflowData);
    } catch (error) {
      console.error('Error creating parallel workflow:', error);
      throw error;
    }
  }

  async createAnyOneWorkflow(
    name: string,
    blueprintId: string,
    approvers: Approver[],
    options?: {
      description?: string;
      triggerStage?: string;
      timeoutHours?: number;
      escalationRules?: EscalationRules;
      onApproveActions?: any[];
      onRejectActions?: any[];
    }
  ): Promise<ApprovalWorkflow> {
    try {
      const workflowData: CreateApprovalWorkflowDto = {
        name,
        blueprintId,
        approvers,
        approvalType: 'any-one',
        active: true,
        ...options
      };
      
      return await this.createWorkflow(workflowData);
    } catch (error) {
      console.error('Error creating any-one workflow:', error);
      throw error;
    }
  }

  async initiateApprovalForRecord(
    workflowName: string,
    record: any,
    module: string,
    userId: string
  ): Promise<ApprovalRequest> {
    try {
      // Find workflow by name
      const workflows = await this.getAllWorkflows();
      const workflow = workflows.find(w => w.name === workflowName);
      
      if (!workflow) {
        throw new Error(`Workflow "${workflowName}" not found`);
      }
      
      // Initiate approval
      return await this.initiateApproval({
        workflowId: workflow._id,
        record,
        context: {
          module,
          userId,
          trigger: 'manual'
        }
      });
    } catch (error) {
      console.error(`Error initiating approval for record ${record._id}:`, error);
      throw error;
    }
  }

  async getCurrentApprover(requestId: string): Promise<{
    approver: any;
    index: number;
    isCurrent: boolean;
  } | null> {
    try {
      const request = await this.getApprovalRequest(requestId);
      
      if (request.status !== 'pending') {
        return null;
      }
      
      if (request.currentApproverIndex !== undefined && request.currentApproverIndex >= 0) {
        const approver = request.approvers[request.currentApproverIndex];
        return {
          approver,
          index: request.currentApproverIndex,
          isCurrent: approver.status === 'pending'
        };
      }
      
      // For parallel or any-one workflows, find first pending approver
      const pendingApprover = request.approvers.find(a => a.status === 'pending');
      if (pendingApprover) {
        const index = request.approvers.indexOf(pendingApprover);
        return {
          approver: pendingApprover,
          index,
          isCurrent: true
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting current approver for request ${requestId}:`, error);
      throw error;
    }
  }

  async getApprovalProgress(requestId: string): Promise<{
    totalSteps: number;
    completedSteps: number;
    currentStep: number;
    progressPercentage: number;
    status: ApprovalStatus;
    nextApprover?: any;
  }> {
    try {
      const request = await this.getApprovalRequest(requestId);
      const workflow = await this.getWorkflow(request.workflowId);
      
      const totalSteps = request.approvers.length;
      const completedSteps = request.approvers.filter(a => 
        a.status === 'approved' || a.status === 'rejected'
      ).length;
      
      let currentStep = 0;
      let nextApprover: any = undefined;
      
      if (workflow.approvalType === 'sequential') {
        currentStep = request.currentApproverIndex || 0;
        nextApprover = request.approvers[currentStep];
      } else {
        // For parallel, current step is completed steps
        currentStep = completedSteps;
        nextApprover = request.approvers.find(a => a.status === 'pending');
      }
      
      const progressPercentage = totalSteps > 0 
        ? Math.round((completedSteps / totalSteps) * 100)
        : 0;
      
      return {
        totalSteps,
        completedSteps,
        currentStep: currentStep + 1, // Convert to 1-based for display
        progressPercentage,
        status: request.status,
        nextApprover
      };
    } catch (error) {
      console.error(`Error getting approval progress for request ${requestId}:`, error);
      throw error;
    }
  }

  async getExpiredApprovals(): Promise<ApprovalRequest[]> {
    try {
      const pendingApprovals = await this.getApprovalsByStatus('pending');
      const now = new Date();
      
      return pendingApprovals.filter(request => {
        if (!request.dueDate) return false;
        return new Date(request.dueDate) < now;
      });
    } catch (error) {
      console.error('Error getting expired approvals:', error);
      throw error;
    }
  }

  async cleanupExpiredApprovals(): Promise<{
    processed: number;
    expiredRequests: ApprovalRequest[];
  }> {
    try {
      const expiredRequests = await this.getExpiredApprovals();
      let processed = 0;
      
      for (const request of expiredRequests) {
        try {
          // Get workflow to check escalation rules
          const workflow = await this.getWorkflow(request.workflowId);
          
          if (workflow.escalationRules?.enabled) {
            await this.escalateApprovalRequest(request._id, 'Request expired - auto-escalated');
          } else {
            await this.rejectRequest(request._id, 'Request expired - auto-rejected');
          }
          
          processed++;
        } catch (error) {
          console.error(`Failed to process expired approval ${request._id}:`, error);
        }
      }
      
      return {
        processed,
        expiredRequests
      };
    } catch (error) {
      console.error('Error cleaning up expired approvals:', error);
      throw error;
    }
  }

  async exportApprovalReport(
    format: 'csv' | 'json' = 'json',
    filters?: {
      status?: ApprovalStatus;
      workflowId?: string;
      module?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<string> {
    try {
      let approvals = await this.getAllApprovals();
      
      // Apply filters
      if (filters?.status) {
        approvals = approvals.filter(a => a.status === filters.status);
      }
      
      if (filters?.workflowId) {
        approvals = approvals.filter(a => a.workflowId === filters.workflowId);
      }
      
      if (filters?.module) {
        approvals = approvals.filter(a => a.module === filters.module);
      }
      
      if (filters?.startDate) {
        const startDate = new Date(filters.startDate);
        approvals = approvals.filter(a => new Date(a.createdAt) >= startDate);
      }
      
      if (filters?.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        approvals = approvals.filter(a => new Date(a.createdAt) <= endDate);
      }
      
      if (format === 'csv') {
        const headers = [
          'Request ID',
          'Module',
          'Record ID',
          'Status',
          'Created At',
          'Completed At',
          'Approvers Count',
          'Approved Count',
          'Rejected Count',
          'Pending Count'
        ];
        
        const rows = approvals.map(request => [
          request._id,
          request.module,
          request.recordId,
          request.status,
          new Date(request.createdAt).toLocaleString(),
          request.completedAt ? new Date(request.completedAt).toLocaleString() : 'N/A',
          request.approvers.length.toString(),
          request.approvers.filter(a => a.status === 'approved').length.toString(),
          request.approvers.filter(a => a.status === 'rejected').length.toString(),
          request.approvers.filter(a => a.status === 'pending').length.toString()
        ]);
        
        return [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
      } else {
        return JSON.stringify(approvals, null, 2);
      }
    } catch (error) {
      console.error('Error exporting approval report:', error);
      throw error;
    }
  }

  async bulkProcessApprovals(
    requestIds: string[],
    decision: ApprovalDecision,
    comments?: string
  ): Promise<Array<{
    requestId: string;
    success: boolean;
    result?: ApprovalRequest;
    error?: string;
  }>> {
    try {
      const results = [];
      
      for (const requestId of requestIds) {
        try {
          const result = await this.processApproval(requestId, {
            decision,
            comments
          });
          
          results.push({
            requestId,
            success: true,
            result
          });
        } catch (error: any) {
          results.push({
            requestId,
            success: false,
            error: error.message || 'Unknown error'
          });
        }
        
        // Small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      return results;
    } catch (error) {
      console.error('Error bulk processing approvals:', error);
      throw error;
    }
  }

  async validateApprover(approver: Approver): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validate required fields
    if (!approver.type) {
      errors.push('Type is required');
    }
    
    if (!approver.id) {
      errors.push('ID is required');
    }
    
    if (!approver.name) {
      warnings.push('Name is missing');
    }
    
    if (approver.order === undefined || approver.order < 0) {
      errors.push('Valid order is required');
    }
    
    // Validate type-specific rules
    if (approver.type === 'role') {
      // Check if role is in allowed roles
      const allowedRoles = await this.getAllowedRoles();
      if (!allowedRoles.includes(approver.id)) {
        warnings.push(`Role "${approver.id}" may not have approval permissions`);
      }
    }
    
    if (approver.type === 'manager') {
      // Manager type needs additional context validation
      if (!approver.conditions?.managerOfField) {
        warnings.push('Manager approver should specify managerOfField condition');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export const approvalsService = new ApprovalsService();

