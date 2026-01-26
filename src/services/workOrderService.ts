// src/services/workOrderService.ts
import { apiClient } from '@/lib/api/client';
import { lifecycleIntegrationService } from './lifecycleIntegrationService';
import { invoiceService } from './invoiceService';
import { postChecklistService } from './postChecklistService';
import { jobCardService } from './jobCardService';
import { preChecklistService } from './preChecklistService';
import { Opportunity, opportunityService } from './opportunityService';

export interface TechnicianNote {
  content: string;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  createdAt: string;
  isInternal: boolean;
  category: 'customer_communication' | 'observation' | 'issue' | 'other';
}

export interface DelayInfo {
  reason: string;
  detectedAt: string;
  expectedCompletionDate?: string;
  notes?: string;
  resolvedAt?: string;
  daysDelayed?: number;
  hoursDelayed?: number;
  category?: string;
  expectedCompletionDateTime?: string;
}

export interface WorkOrder {
  _id: string;
  workOrderNumber: string;
  opportunityId: string | {
    _id: string;
    subject: string;
    customer: {
      name: string;
      email?: string;
      phone?: string;
      companyName: string;
    };
    assignedTo: string | {
      _id: string;
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
      role?: string;
    };
  };
  quoteId: string | {
    _id: string;
    quoteNumber: string;
    totalAmount: number;
    items?: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
  };
  vehicleId?: string;
  waiverId?: string;
  jobCards?: string[] | Array<{
    _id: string;
    jobTitle?: string;
    status?: string;
  }>;
  preChecklistId?: string;
  postChecklistId?: string;
  invoiceId?: string;
  invoiceGenerated?: boolean;
  status: 'draft' | 'pre_checklist' | 'in_progress' | 'job_card' | 'post_checklist' | 'ready_for_invoice' | 'completed' | 'cancelled' | 'delayed';
  currentStage: 'pre_checklist' | 'job_card' | 'post_checklist' | 'invoice';
  assignedTo?: string | {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  technicianNotes?: TechnicianNote[];
  delayInfo?: DelayInfo | null;
  delayDays?: number;
  startDate?: string;
  estimatedCompletionDate?: string;
  actualCompletionDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  laborCost: number;
  partsCost: number;
  totalCost?: number;
  notes?: string;
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
  isActive?: boolean;

  totalHours?: number;
  delayDuration?: {
    days?: number;
    hours?: number;
    minutes?: number;
  };
  
  // Add the missing properties
  invoicePaid?: boolean;
  invoicePaymentDate?: string;
  
  // Add stage approvals
  stageApprovals?: {
    pre_checklist?: {
      needsApproval?: boolean;
      approved?: boolean;
      rejected?: boolean;
      submittedAt?: string;
      submittedBy?: string;
      approvedAt?: string;
      approvedBy?: string;
      rejectedAt?: string;
      rejectedBy?: string;
    };
    job_card?: {
      needsApproval?: boolean;
      approved?: boolean;
      rejected?: boolean;
      submittedAt?: string;
      submittedBy?: string;
      approvedAt?: string;
      approvedBy?: string;
      rejectedAt?: string;
      rejectedBy?: string;
    };
    post_checklist?: {
      needsApproval?: boolean;
      approved?: boolean;
      rejected?: boolean;
      submittedAt?: string;
      submittedBy?: string;
      approvedAt?: string;
      approvedBy?: string;
      rejectedAt?: string;
      rejectedBy?: string;
    };
    invoice?: {
      needsApproval?: boolean;
      approved?: boolean;
      rejected?: boolean;
      submittedAt?: string;
      submittedBy?: string;
      approvedAt?: string;
      approvedBy?: string;
      rejectedAt?: string;
      rejectedBy?: string;
    };
  };
  
  // Add completion dates for stages
  preChecklistCompletionDate?: string;
  jobCardCompletionDate?: string;
  postChecklistCompletionDate?: string;
  invoiceCompletionDate?: string;
}

export interface CreateWorkOrderData {
  opportunityId: string;
  quoteId: string;
  waiverId?: string;
  jobCards?: string[];
  preChecklistId?: string;
  postChecklistId?: string;
  invoiceId?: string;
  status?: 'draft' | 'pre_checklist' | 'in_progress' | 'job_card' | 'post_checklist' | 'ready_for_invoice' | 'completed' | 'cancelled' | 'delayed';
  currentStage?: 'pre_checklist' | 'job_card' | 'post_checklist' | 'invoice';
  assignedTo?: string;
  startDate?: string;
  estimatedCompletionDate?: string;
  estimatedHours?: number;
  laborCost?: number;
  partsCost?: number;
  notes?: string;
}

export interface UpdateWorkOrderData {
  status?: 'draft' | 'pre_checklist' | 'in_progress' | 'job_card' | 'post_checklist' | 'ready_for_invoice' | 'completed' | 'cancelled' | 'delayed';
  currentStage?: 'pre_checklist' | 'job_card' | 'post_checklist' | 'invoice';
  assignedTo?: string;
  startDate?: string;
  updatedAt?: string;
  estimatedCompletionDate?: string;
  actualCompletionDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  laborCost?: number;
  partsCost?: number;
  totalCost?: number;
  notes?: string;
  jobCards?: string[];
  delayInfo?: Partial<DelayInfo>;
  
  // Add missing properties for stage approvals
  waiverId?: string;
  invoicePaid?: boolean;
  invoicePaymentDate?: string;
  
  // Add stage approvals object
  stageApprovals?: {
    pre_checklist?: {
      needsApproval?: boolean;
      approved?: boolean;
      rejected?: boolean;
      submittedAt?: string;
      submittedBy?: string;
      approvedAt?: string;
      approvedBy?: string;
      rejectedAt?: string;
      rejectedBy?: string;
    };
    job_card?: {
      needsApproval?: boolean;
      approved?: boolean;
      rejected?: boolean;
      submittedAt?: string;
      submittedBy?: string;
      approvedAt?: string;
      approvedBy?: string;
      rejectedAt?: string;
      rejectedBy?: string;
    };
    post_checklist?: {
      needsApproval?: boolean;
      approved?: boolean;
      rejected?: boolean;
      submittedAt?: string;
      submittedBy?: string;
      approvedAt?: string;
      approvedBy?: string;
      rejectedAt?: string;
      rejectedBy?: string;
    };
    invoice?: {
      needsApproval?: boolean;
      approved?: boolean;
      rejected?: boolean;
      submittedAt?: string;
      submittedBy?: string;
      approvedAt?: string;
      approvedBy?: string;
      rejectedAt?: string;
      rejectedBy?: string;
    };
  };
  
  // Add completion dates for stages
  preChecklistCompletionDate?: string;
  jobCardCompletionDate?: string;
  postChecklistCompletionDate?: string;
  invoiceCompletionDate?: string;
  preChecklistId?: string;
  postChecklistId?: string;
}

export interface AddNoteData {
  content: string;
  isInternal?: boolean;
  category?: 'customer_communication' | 'observation' | 'issue' | 'other';
}

export interface DelayCheckResponse {
  checked: number;
  delayed: number;
  timestamp: string;
}

export interface WorkOrderFilterParams {
  status?: string;
  stage?: string;
  assignedTo?: string;
  fromDate?: string;
  toDate?: string;
  opportunityId?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface WorkOrderStats {
  total: number;
  byStatus: Array<{
    _id: string;
    count: number;
  }>;
  byStage: Array<{
    _id: string;
    count: number;
  }>;
  byMonth: Array<{
    _id: {
      year: number;
      month: number;
    };
    count: number;
    totalCost: number;
  }>;
  delayedOrders: number;
  avgDelayDays: number;
  costSummary: {
    totalLaborCost: number;
    totalPartsCost: number;
    totalRevenue: number;
    avgCostPerOrder: number;
  };
}

export interface WorkOrdersResponse {
  data: WorkOrder[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats?: WorkOrderStats;
}

export interface StageStats {
  pre_checklist: number;
  job_card: number;
  post_checklist: number;
  invoice: number;
  total: number;
}

export interface StatusSummary {
  draft: number;
  pre_checklist: number;
  in_progress: number;
  job_card: number;
  post_checklist: number;
  ready_for_invoice: number;
  completed: number;
  delayed: number;
  cancelled: number;
  total: number;
}

export interface NotificationLog {
  _id: string;
  eventType: string;
  recipients: string[];
  sentAt: string;
  emailDeliveries: Array<{
    recipient: string;
    recipientType: string;
    sentAt: string;
    success: boolean;
    messageId: string;
  }>;
  data: {
    workOrderNumber: string;
    reason?: string;
    delayDays?: number;
  };
}

class WorkOrderService {
  private basePath = '/workorder';

  // POST /api/v1/workorder - Create a new work order
  async createWorkOrder(data: CreateWorkOrderData): Promise<WorkOrder> {
    try {
      const formattedData = {
        ...data,
        status: data.status || 'draft',
        currentStage: data.currentStage || 'pre_checklist',
        startDate: data.startDate || new Date().toISOString(),
        laborCost: data.laborCost || 0,
        partsCost: data.partsCost || 0
      };

      return await apiClient.post<CreateWorkOrderData, WorkOrder>(this.basePath, formattedData);
    } catch (error) {
      console.error('Error creating work order:', error);
      throw error;
    }
  }

  // GET /api/v1/workorder - Get all work orders with filtering
  // In workOrderService.ts - Update the getAllWorkOrders method:
  async getAllWorkOrders(params?: WorkOrderFilterParams): Promise<WorkOrdersResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (key === 'page' || key === 'limit' || key === 'search' || key === 'status' || 
                key === 'fromDate' || key === 'toDate' || key === 'sort') {
              queryParams.append(key, value.toString());
            }
          }
        });
      }
      
      // Default pagination
      if (!params?.page) queryParams.append('page', '1');
      if (!params?.limit) queryParams.append('limit', '20');
      
      
      const queryString = queryParams.toString();
      const endpoint = `${this.basePath}${queryString ? `?${queryString}` : ''}`;

      console.log('Fetching from:', endpoint);
      
      const response = await apiClient.get<WorkOrdersResponse>(endpoint);
      
      // Ensure response has proper structure
      if (!response) {
        return {
          data: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 0
          }
        };
      }
      
      // If response is an array, wrap it in WorkOrdersResponse
      if (Array.isArray(response)) {
        return {
          data: response,
          pagination: {
            total: response.length,
            page: 1,
            limit: response.length,
            totalPages: 1
          }
        };
      }
      
      // Ensure pagination exists
      if (!response.pagination && 'data' in response) {
        response.pagination = {
          total: response.data?.length || 0,
          page: params?.page || 1,
          limit: params?.limit || 20,
          totalPages: Math.ceil((response.data?.length || 0) / (params?.limit || 20))
        };
      }
      
      return response as WorkOrdersResponse;
    } catch (error) {
      console.error('Error fetching work orders:', error);
      // Return empty response structure instead of throwing
      return {
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0
        }
      };
    }
  }

  // GET /api/v1/workorder/{id}
  async getWorkOrderById(id: string): Promise<WorkOrder> {
    try {
      return await apiClient.get<WorkOrder>(`${this.basePath}/${id}`);
    } catch (error) {
      console.error(`Error fetching work order ${id}:`, error);
      throw error;
    }
  }

  // PATCH /api/v1/workorder/{id}
  async updateWorkOrder(id: string, data: UpdateWorkOrderData): Promise<WorkOrder> {
    try {
      return await apiClient.patch<UpdateWorkOrderData, WorkOrder>(`${this.basePath}/${id}`, data);
    } catch (error) {
      console.error(`Error updating work order ${id}:`, error);
      throw error;
    }
  }

  // DELETE /api/v1/workorder/{id}
  async deleteWorkOrder(id: string): Promise<{ message: string }> {
    try {
      return await apiClient.delete<{ message: string }>(`${this.basePath}/${id}`);
    } catch (error) {
      console.error(`Error deleting work order ${id}:`, error);
      throw error;
    }
  }

  // GET /api/v1/workorder/stage/{stage}
  async getWorkOrdersByStage(stage: string): Promise<WorkOrder[]> {
    try {
      return await apiClient.get<WorkOrder[]>(`${this.basePath}/stage/${stage}`);
    } catch (error) {
      console.error(`Error fetching work orders for stage ${stage}:`, error);
      throw error;
    }
  }

  // PATCH /api/v1/workorder/{id}/stage/{stage}
  async updateWorkOrderStage(id: string, stage: string): Promise<WorkOrder> {
    try {
      return await apiClient.patch<any, WorkOrder>(
        `${this.basePath}/${id}/stage/${stage}`,
        {}
      );
    } catch (error) {
      console.error(`Error updating work order stage ${id}:`, error);
      throw error;
    }
  }

  // PATCH /api/v1/workorder/{id}/status/{status}
  async updateWorkOrderStatus(id: string, status: string): Promise<WorkOrder> {
    try {
      return await apiClient.patch<any, WorkOrder>(
        `${this.basePath}/${id}/status/${status}`,
        {}
      );
    } catch (error) {
      console.error(`Error updating work order status ${id}:`, error);
      throw error;
    }
  }

  // GET /api/v1/workorder/opportunity/{opportunityId}
  async getWorkOrdersByOpportunity(opportunityId: string): Promise<WorkOrder[]> {
    try {
      return await apiClient.get<WorkOrder[]>(`${this.basePath}/opportunity/${opportunityId}`);
    } catch (error) {
      console.error(`Error fetching work orders for opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  // GET /api/v1/workorder/{id}/notifications
  async getWorkOrderNotifications(id: string): Promise<any> {
    try {
      return await apiClient.get<any>(`${this.basePath}/${id}/notifications`);
    } catch (error) {
      console.error(`Error fetching notifications for work order ${id}:`, error);
      throw error;
    }
  }

  // POST /api/v1/workorder/{id}/generate-invoice
  async generateInvoice(id: string): Promise<{
    workOrder: WorkOrder;
    invoice: {
      _id: string;
      invoiceNumber: string;
      total: number;
      status: string;
    };
  }> {
    try {
      return await apiClient.post<any, any>(
        `${this.basePath}/${id}/generate-invoice`,
        {}
      );
    } catch (error) {
      console.error(`Error generating invoice for work order ${id}:`, error);
      throw error;
    }
  }

  // GET /api/v1/workorder/{id}/invoice
  async getInvoiceDetails(id: string): Promise<any> {
    try {
      return await apiClient.get<any>(`${this.basePath}/${id}/invoice`);
    } catch (error) {
      console.error(`Error fetching invoice details for work order ${id}:`, error);
      throw error;
    }
  }

  // PATCH /api/v1/workorder/{id}/invoice/{invoiceId}
  async linkInvoice(id: string, invoiceId: string): Promise<WorkOrder> {
    try {
      return await apiClient.patch<any, WorkOrder>(
        `${this.basePath}/${id}/invoice/${invoiceId}`,
        {}
      );
    } catch (error) {
      console.error(`Error linking invoice to work order ${id}:`, error);
      throw error;
    }
  }

  // POST /api/v1/workorder/{id}/jobcards/{jobCardId}
  async addJobCardToWorkOrder(workOrderId: string, jobCardId: string): Promise<WorkOrder> {
    try {
      return await apiClient.post<any, WorkOrder>(
        `${this.basePath}/${workOrderId}/jobcards/${jobCardId}`,
        {}
      );
    } catch (error) {
      console.error(`Error adding job card to work order ${workOrderId}:`, error);
      throw error;
    }
  }

  // DELETE /api/v1/workorder/{id}/jobcards/{jobCardId}
  async removeJobCardFromWorkOrder(workOrderId: string, jobCardId: string): Promise<WorkOrder> {
    try {
      return await apiClient.delete<WorkOrder>(`${this.basePath}/${workOrderId}/jobcards/${jobCardId}`);
    } catch (error) {
      console.error(`Error removing job card from work order ${workOrderId}:`, error);
      throw error;
    }
  }

  // PATCH /api/v1/workorder/{id}/delay
  async markAsDelayed(id: string, data: {
    reason: string;
    expectedCompletionDate?: string;
    notes?: string;
  }): Promise<WorkOrder> {
    try {
      return await apiClient.patch<any, WorkOrder>(
        `${this.basePath}/${id}/delay`,
        data
      );
    } catch (error) {
      console.error(`Error marking work order ${id} as delayed:`, error);
      throw error;
    }
  }

  // PATCH /api/v1/workorder/{id}/delay/resolve
  async resolveDelay(id: string): Promise<WorkOrder> {
    try {
      return await apiClient.patch<any, WorkOrder>(
        `${this.basePath}/${id}/delay/resolve`,
        {}
      );
    } catch (error) {
      console.error(`Error resolving delay for work order ${id}:`, error);
      throw error;
    }
  }

  // POST /api/v1/workorder/{id}/notes
  async addTechnicianNote(id: string, data: AddNoteData): Promise<WorkOrder> {
    try {
      return await apiClient.post<AddNoteData, WorkOrder>(
        `${this.basePath}/${id}/notes`,
        data
      );
    } catch (error) {
      console.error(`Error adding note to work order ${id}:`, error);
      throw error;
    }
  }

  // GET /api/v1/workorder/{id}/notes
  async getTechnicianNotes(id: string, includeInternal?: boolean): Promise<TechnicianNote[]> {
    try {
      const query = includeInternal !== undefined ? `?includeInternal=${includeInternal}` : '';
      return await apiClient.get<TechnicianNote[]>(`${this.basePath}/${id}/notes${query}`);
    } catch (error) {
      console.error(`Error fetching notes for work order ${id}:`, error);
      throw error;
    }
  }

  // PATCH /api/v1/workorder/{id}/notes/{noteIndex}
  async updateTechnicianNote(id: string, noteIndex: number, data: Partial<AddNoteData>): Promise<WorkOrder> {
    try {
      return await apiClient.patch<Partial<AddNoteData>, WorkOrder>(
        `${this.basePath}/${id}/notes/${noteIndex}`,
        data
      );
    } catch (error) {
      console.error(`Error updating note ${noteIndex} for work order ${id}:`, error);
      throw error;
    }
  }

  // DELETE /api/v1/workorder/{id}/notes/{noteIndex}
  async deleteTechnicianNote(id: string, noteIndex: number): Promise<WorkOrder> {
    try {
      return await apiClient.delete<WorkOrder>(`${this.basePath}/${id}/notes/${noteIndex}`);
    } catch (error) {
      console.error(`Error deleting note ${noteIndex} for work order ${id}:`, error);
      throw error;
    }
  }

  // POST /api/v1/workorder/delay/check
  async checkDelays(): Promise<DelayCheckResponse> {
    try {
      return await apiClient.post<any, DelayCheckResponse>(`${this.basePath}/delay/check`, {});
    } catch (error) {
      console.error('Error checking delays:', error);
      throw error;
    }
  }

  // GET /api/v1/workorder/status/delayed
  async getDelayedWorkOrders(minDelayDays?: number, maxDelayDays?: number): Promise<WorkOrder[]> {
    try {
      const queryParams = new URLSearchParams();
      if (minDelayDays !== undefined) queryParams.append('minDelayDays', minDelayDays.toString());
      if (maxDelayDays !== undefined) queryParams.append('maxDelayDays', maxDelayDays.toString());
      
      const queryString = queryParams.toString();
      const endpoint = `${this.basePath}/status/delayed${queryString ? `?${queryString}` : ''}`;
      return await apiClient.get<WorkOrder[]>(endpoint);
    } catch (error) {
      console.error('Error fetching delayed work orders:', error);
      throw error;
    }
  }

  async updateWorkOrderByOpportunity(
    opportunityId: string, 
    data: UpdateWorkOrderData
  ): Promise<WorkOrder> {
    try {
      // First get all work orders for the opportunity
      const workOrders = await this.getWorkOrdersByOpportunity(opportunityId);
      
      if (workOrders.length === 0) {
        throw new Error(`No work order found for opportunity ${opportunityId}`);
      }
      
      // Update the first work order (assuming one work order per opportunity)
      const workOrder = workOrders[0];
      return await this.updateWorkOrder(workOrder._id, data);
    } catch (error) {
      console.error(`Error updating work order by opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  // GET /api/v1/workorder/summary/status
  async getStatusSummary(): Promise<StatusSummary> {
    try {
      return await apiClient.get<StatusSummary>(`${this.basePath}/summary/status`);
    } catch (error) {
      console.error('Error fetching status summary:', error);
      throw error;
    }
  }

  // GET /api/v1/workorder/assigned/{userId}
  async getWorkOrdersAssignedToUser(userId: string, filters?: { status?: string; stage?: string }): Promise<WorkOrder[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.stage) queryParams.append('stage', filters.stage);
      
      const queryString = queryParams.toString();
      const endpoint = `${this.basePath}/assigned/${userId}${queryString ? `?${queryString}` : ''}`;
      return await apiClient.get<WorkOrder[]>(endpoint);
    } catch (error) {
      console.error(`Error fetching work orders assigned to user ${userId}:`, error);
      throw error;
    }
  }

  // GET /api/v1/workorder/stats/summary
  async getWorkOrderStats(): Promise<WorkOrderStats> {
    try {
      return await apiClient.get<WorkOrderStats>(`${this.basePath}/stats/summary`);
    } catch (error) {
      console.error('Error fetching work order stats:', error);
      throw error;
    }
  }

  // GET /api/v1/workorder/stats/stages
  async getStageStats(): Promise<StageStats> {
    try {
      return await apiClient.get<StageStats>(`${this.basePath}/stats/stages`);
    } catch (error) {
      console.error('Error fetching stage stats:', error);
      throw error;
    }
  }

  async getEnhancedWorkflowUI(workOrderId: string) {
    try {
      const workOrder = await this.getWorkOrderById(workOrderId);
      const opportunityId = typeof workOrder.opportunityId === 'object' 
        ? workOrder.opportunityId._id 
        : workOrder.opportunityId;
      
      // Use lifecycle integration service
      return await lifecycleIntegrationService.getEnhancedWorkflowUI(opportunityId);
    } catch (error) {
      console.error('Error getting enhanced workflow UI:', error);
      throw error;
    }
  }

  async autoApproveAndTransition(
    workOrderId: string,
    checklistType: 'prechecklist' | 'postchecklist',
    approvedBy?: string
  ) {
    try {
      const workOrder = await this.getWorkOrderById(workOrderId);
      
      // Get the checklist ID based on type
      const checklistId = checklistType === 'prechecklist' 
        ? workOrder.preChecklistId 
        : workOrder.postChecklistId;
      
      if (!checklistId) {
        throw new Error(`${checklistType} not found for work order`);
      }
      
      // Use lifecycle integration service
      const result = await lifecycleIntegrationService.autoTransitionOnApproval(
        checklistId,
        checklistType,
        approvedBy
      );
      
      if (result.success && result.transition) {
        // Update work order with new stage
        await this.updateWorkOrder(workOrderId, {
          currentStage: result.transition.toStage,
          updatedAt: new Date().toISOString()
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error in auto-approve and transition:', error);
      throw error;
    }
  }

  async getStageValidation(workOrderId: string, stage: string) {
    try {
      const workOrder = await this.getWorkOrderById(workOrderId);
      const opportunityId = typeof workOrder.opportunityId === 'object' 
        ? workOrder.opportunityId._id 
        : workOrder.opportunityId;
      
      // Get document for the stage
      let document = null;
      switch (stage) {
        case 'prechecklist':
          if (workOrder.preChecklistId) {
            document = await preChecklistService.getPreChecklistById(workOrder.preChecklistId);
          }
          break;
        case 'jobcard':
          const jobCards = await jobCardService.getJobCardsByOpportunity(opportunityId);
          if (jobCards.length > 0) {
            document = jobCards[0];
          }
          break;
        case 'postchecklist':
          if (workOrder.postChecklistId) {
            document = await postChecklistService.getPostChecklistById(workOrder.postChecklistId);
          }
          break;
        case 'invoice':
          if (workOrder.invoiceId) {
            document = await invoiceService.getInvoiceById(workOrder.invoiceId);
          }
          break;
      }
      
      return await lifecycleIntegrationService.validateStageCompletion(opportunityId, stage, document);
    } catch (error) {
      console.error('Error getting stage validation:', error);
      throw error;
    }
  }

  async getWorkflowProgress(workOrderId: string) {
    try {
      const workOrder = await this.getWorkOrderById(workOrderId);
      const opportunityId = typeof workOrder.opportunityId === 'object' 
        ? workOrder.opportunityId._id 
        : workOrder.opportunityId;
      
      return await lifecycleIntegrationService.getEnhancedWorkflowUI(opportunityId);
    } catch (error) {
      console.error('Error getting workflow progress:', error);
      throw error;
    }
  }

  async getNextStageAction(workOrderId: string) {
    try {
      const workflow = await this.getWorkflowProgress(workOrderId);
      const currentStage = workflow.currentStageDetails;
      
      if (!currentStage) {
        return null;
      }
      
      return {
        stage: currentStage.stage,
        label: currentStage.label,
        nextAction: currentStage.nextAction,
        actions: currentStage.actions,
        canTransition: currentStage.canTransition,
        validation: currentStage.validation
      };
    } catch (error) {
      console.error('Error getting next stage action:', error);
      throw error;
    }
  }

  // Utility methods for UI

    getStageStatusConfig(stage: any) {
    if (!stage) return {
      label: 'Unknown',
      className: 'bg-gray-100 text-gray-800',
      icon: '❓'
    };
    
    if (stage.completed) {
      return {
        label: 'Completed',
        className: 'bg-green-100 text-green-800',
        icon: '✅'
      };
    }
    
    if (stage.isCurrent) {
      if (stage.status === 'needs_approval') {
        return {
          label: 'Needs Approval',
          className: 'bg-yellow-100 text-yellow-800',
          icon: '⚠️'
        };
      }
      if (stage.status === 'ready') {
        return {
          label: 'Ready',
          className: 'bg-blue-100 text-blue-800',
          icon: '⚡'
        };
      }
      return {
        label: 'In Progress',
        className: 'bg-blue-100 text-blue-800',
        icon: '🔄'
      };
    }
    
    return {
      label: 'Pending',
      className: 'bg-gray-100 text-gray-800',
      icon: '⏳'
    };
  }

  getStageProgressBar(stage: any) {
    const progress = stage.progress || 0;
    
    if (stage.completed) {
      return {
        width: '100%',
        color: 'bg-green-500',
        label: '100%'
      };
    }
    
    return {
      width: `${progress}%`,
      color: stage.isCurrent ? 'bg-blue-500' : 'bg-gray-300',
      label: `${progress}%`
    };
  }

  getActionButtonConfig(stage: any, action: any) {
    const colorMap: Record<string, string> = {
      'create': 'bg-green-600 hover:bg-green-700',
      'edit': 'bg-yellow-600 hover:bg-yellow-700',
      'view': 'bg-blue-600 hover:bg-blue-700',
      'approve': 'bg-green-600 hover:bg-green-700',
      'transition': 'bg-purple-600 hover:bg-purple-700',
      'complete': 'bg-green-600 hover:bg-green-700'
    };
    
    const iconMap: Record<string, string> = {
      'create': '➕',
      'edit': '✏️',
      'view': '👁️',
      'approve': '✅',
      'transition': '➡️',
      'complete': '🏁'
    };
    
    return {
      className: colorMap[action.action] || 'bg-gray-600 hover:bg-gray-700',
      icon: iconMap[action.action] || '⚡',
      disabled: action.disabled || false
    };
  }

  // ============ ENHANCED HELPER METHODS ============
  
  getWorkflowStageDetails(workOrder: WorkOrder, stage: string) {
    const stages = {
      'pre_checklist': {
        label: 'Pre-Checklist',
        description: 'Pre-service inspection and validation',
        icon: '📋',
        nextStage: 'job_card',
        requiredDocs: ['preChecklistId'],
        canSkip: false
      },
      'job_card': {
        label: 'Job Card',
        description: 'Detailed job tasks and technician assignments',
        icon: '🔧',
        nextStage: 'post_checklist',
        requiredDocs: ['jobCards'],
        canSkip: false
      },
      'post_checklist': {
        label: 'Post-Checklist',
        description: 'Post-service verification and quality check',
        icon: '✅',
        nextStage: 'invoice',
        requiredDocs: ['postChecklistId'],
        canSkip: false
      },
      'invoice': {
        label: 'Invoice',
        description: 'Generate and manage billing',
        icon: '💰',
        nextStage: null,
        requiredDocs: ['invoiceId'],
        canSkip: false
      }
    };
    
    return stages[stage as keyof typeof stages] || null;
  }

  getStageCompletionStatus(workOrder: WorkOrder, stage: string) {
    switch (stage) {
      case 'pre_checklist':
        return {
          hasDocument: !!workOrder.preChecklistId,
          isComplete: !!workOrder.preChecklistCompletionDate,
          completionDate: workOrder.preChecklistCompletionDate,
          approved: workOrder.stageApprovals?.pre_checklist?.approved || false
        };
      case 'job_card':
        return {
          hasDocument: !!(workOrder.jobCards && workOrder.jobCards.length > 0),
          isComplete: !!workOrder.jobCardCompletionDate,
          completionDate: workOrder.jobCardCompletionDate,
          approved: workOrder.stageApprovals?.job_card?.approved || false
        };
      case 'post_checklist':
        return {
          hasDocument: !!workOrder.postChecklistId,
          isComplete: !!workOrder.postChecklistCompletionDate,
          completionDate: workOrder.postChecklistCompletionDate,
          approved: workOrder.stageApprovals?.post_checklist?.approved || false
        };
      case 'invoice':
        return {
          hasDocument: !!workOrder.invoiceId,
          isComplete: !!workOrder.invoiceCompletionDate,
          completionDate: workOrder.invoiceCompletionDate,
          approved: workOrder.stageApprovals?.invoice?.approved || false
        };
      default:
        return {
          hasDocument: false,
          isComplete: false,
          completionDate: null,
          approved: false
        };
    }
  }

  getStageActions(workOrder: WorkOrder, stage: string) {
    const status = this.getStageCompletionStatus(workOrder, stage);
    const isCurrentStage = workOrder.currentStage === stage;
    
    const actions = [];
    
    // View action if document exists
    if (status.hasDocument) {
      actions.push({
        label: 'View',
        action: 'view',
        color: 'blue',
        icon: '👁️'
      });
    }
    
    // Edit action if document exists and stage is current
    if (status.hasDocument && isCurrentStage && !status.isComplete) {
      actions.push({
        label: 'Edit',
        action: 'edit',
        color: 'yellow',
        icon: '✏️'
      });
    }
    
    // Create action if no document and stage is current
    if (!status.hasDocument && isCurrentStage) {
      actions.push({
        label: 'Create',
        action: 'create',
        color: 'green',
        icon: '➕'
      });
    }
    
    // Approve action if document exists, not approved, and stage is current
    if (status.hasDocument && !status.approved && isCurrentStage) {
      actions.push({
        label: 'Approve',
        action: 'approve',
        color: 'green',
        icon: '✅'
      });
    }
    
    // Complete & Next action if stage is complete but not transitioned
    if (status.isComplete && isCurrentStage && workOrder.currentStage !== 'invoice') {
      actions.push({
        label: 'Next Stage →',
        action: 'transition',
        color: 'purple',
        icon: '➡️'
      });
    }
    
    return actions;
  }

  calculateWorkflowProgress(workOrder: WorkOrder) {
    const stages = ['pre_checklist', 'job_card', 'post_checklist', 'invoice'];
    let completed = 0;
    
    stages.forEach(stage => {
      const status = this.getStageCompletionStatus(workOrder, stage);
      if (status.isComplete) completed++;
    });
    
    return {
      completed,
      total: stages.length,
      percentage: Math.round((completed / stages.length) * 100)
    };
  }

  validateWorkflowTransition(workOrder: WorkOrder, fromStage: string, toStage: string) {
    const stageOrder = ['pre_checklist', 'job_card', 'post_checklist', 'invoice'];
    const fromIndex = stageOrder.indexOf(fromStage);
    const toIndex = stageOrder.indexOf(toStage);
    
    if (fromIndex === -1 || toIndex === -1) {
      return {
        isValid: false,
        message: 'Invalid stage'
      };
    }
    
    if (toIndex <= fromIndex) {
      return {
        isValid: false,
        message: 'Cannot move backwards in workflow'
      };
    }
    
    // Check if current stage is complete
    const currentStatus = this.getStageCompletionStatus(workOrder, fromStage);
    if (!currentStatus.isComplete && fromStage !== 'invoice') {
      return {
        isValid: false,
        message: `Complete ${fromStage.replace('_', ' ')} before moving to next stage`
      };
    }
    
    return {
      isValid: true,
      message: 'Valid transition'
    };
  }
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'draft': 'bg-gray-100 text-gray-800',
      'pre_checklist': 'bg-purple-100 text-purple-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'job_card': 'bg-indigo-100 text-indigo-800',
      'post_checklist': 'bg-teal-100 text-teal-800',
      'ready_for_invoice': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'delayed': 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  getStageLabel(stage: string): string {
    const labels: Record<string, string> = {
      'pre_checklist': 'Pre-Checklist',
      'job_card': 'Job Card',
      'post_checklist': 'Post-Checklist',
      'invoice': 'Invoice'
    };
    return labels[stage] || stage;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'draft': 'Draft',
      'pre_checklist': 'Pre-Checklist',
      'in_progress': 'In Progress',
      'job_card': 'Job Card',
      'post_checklist': 'Post-Checklist',
      'ready_for_invoice': 'Ready for Invoice',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'delayed': 'Delayed'
    };
    return labels[status] || status;
  }

  formatCurrency(amount?: number): string {
    if (amount === undefined || amount === null || isNaN(amount)) return 'KES 0.00';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  formatDateTime(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  calculateTotalCost(laborCost: number, partsCost: number): number {
    return laborCost + partsCost;
  }

  getHoursRemaining(completionDate?: string): number {
    if (!completionDate) return 0;
    const due = new Date(completionDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60));
  }

  isOverdue(completionDate?: string): boolean {
    if (!completionDate) return false;
    return this.getHoursRemaining(completionDate) < 0;
  }

  getAvailableStages(): Array<{ value: string; label: string }> {
    return [
      { value: 'pre_checklist', label: 'Pre-Checklist' },
      { value: 'job_card', label: 'Job Card' },
      { value: 'post_checklist', label: 'Post-Checklist' },
      { value: 'invoice', label: 'Invoice' }
    ];
  }

  getAvailableStatuses(): Array<{ value: string; label: string }> {
    return [
      { value: 'draft', label: 'Draft' },
      { value: 'pre_checklist', label: 'Pre-Checklist' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'job_card', label: 'Job Card' },
      { value: 'post_checklist', label: 'Post-Checklist' },
      { value: 'ready_for_invoice', label: 'Ready for Invoice' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' },
      { value: 'delayed', label: 'Delayed' }
    ];
  }

  getNextStage(currentStage: string): string | null {
    const stageOrder = ['pre_checklist', 'job_card', 'post_checklist', 'invoice'];
    const currentIndex = stageOrder.indexOf(currentStage);
    return currentIndex < stageOrder.length - 1 ? stageOrder[currentIndex + 1] : null;
  }

  canMoveToStage(currentStage: string, targetStage: string): boolean {
    const stageOrder = ['pre_checklist', 'job_card', 'post_checklist', 'invoice'];
    const currentIndex = stageOrder.indexOf(currentStage);
    const targetIndex = stageOrder.indexOf(targetStage);
    return targetIndex >= currentIndex;
  }

  getStageProgress(stage: string): number {
    const stages = ['pre_checklist', 'job_card', 'post_checklist', 'invoice'];
    const index = stages.indexOf(stage);
    return index >= 0 ? Math.round(((index + 1) / stages.length) * 100) : 0;
  }

  // Add this method to workOrderService to fetch opportunity with proper typing
async getFullOpportunityDetails(opportunityId: string): Promise<Opportunity> {
  try {
    return await opportunityService.getOpportunityById(opportunityId, false);
  } catch (error) {
    console.error(`Error fetching opportunity ${opportunityId}:`, error);
    throw error;
  }
}

// Enhanced createWorkOrder that pulls data from opportunity
async createWorkOrderFromOpportunity(
  opportunityId: string, 
  additionalData?: Omit<CreateWorkOrderData, 'opportunityId'>
): Promise<WorkOrder> {
  try {
    // Fetch opportunity details
    const opportunity = await this.getFullOpportunityDetails(opportunityId);
    
    // Get the latest quote from opportunity
    const latestQuote = opportunity.quotes && opportunity.quotes.length > 0 
      ? opportunity.quotes[opportunity.quotes.length - 1] 
      : null;
    
    if (!latestQuote) {
      throw new Error('No quote found for this opportunity');
    }
    
    // Build work order data from opportunity
    const workOrderData: CreateWorkOrderData = {
      opportunityId,
      quoteId: latestQuote._id || latestQuote.id,
      // Get assignedTo from opportunity if available
      assignedTo: opportunity.assignedTo?._id || opportunity.assignedTo?.id,
      status: 'draft',
      currentStage: 'pre_checklist',
      startDate: new Date().toISOString(),
      laborCost: 0,
      partsCost: 0,
      notes: `Created from opportunity: ${opportunity.subject}`,
      ...additionalData
    };
    
    // Calculate estimated hours based on opportunity services
    if (opportunity.servicesProducts && opportunity.servicesProducts.length > 0) {
      const totalHours = opportunity.servicesProducts
        .filter(item => item.type === 'SERVICE' || item.type === 'LABOR')
        .reduce((sum, item) => sum + (item.quantity || 1), 0);
      
      workOrderData.estimatedHours = Math.max(totalHours, 2); // Minimum 2 hours
    }
    
    return await this.createWorkOrder(workOrderData);
  } catch (error) {
    console.error('Error creating work order from opportunity:', error);
    throw error;
  }
}

// Enhanced getCustomerDetails method
async getCustomerDetails(workOrder: WorkOrder): Promise<{
  name: string;
  email: string;
  phone: string;
  companyName: string;
  address?: string;
  taxId?: string;
}> {
  try {
    let opportunity: Opportunity | null = null;
    
    // Get opportunity data
    if (typeof workOrder.opportunityId === 'object' && workOrder.opportunityId) {
      // Opportunity is already populated
      const oppData = workOrder.opportunityId as any;
      return {
        name: oppData.customer?.name || oppData.subject || 'Unknown Customer',
        email: oppData.customer?.email || '',
        phone: oppData.customer?.phone || '',
        companyName: oppData.customer?.companyName || '',
        address: oppData.customer?.companyAddress || '',
        taxId: oppData.customer?.companyTaxId || ''
      };
    } else if (typeof workOrder.opportunityId === 'string') {
      // Fetch opportunity
      opportunity = await this.getFullOpportunityDetails(workOrder.opportunityId);
      if (opportunity && opportunity.customer) {
        return {
          name: opportunity.customer.name || 'Customer',
          email: opportunity.customer.email || '',
          phone: opportunity.customer.phone || '',
          companyName: opportunity.customer.companyName || '',
          address: opportunity.customer.companyAddress || '',
          taxId: opportunity.customer.companyTaxId || ''
        };
      }
    }
    
    // Fallback
    return {
      name: 'Unknown Customer',
      email: '',
      phone: '',
      companyName: ''
    };
  } catch (error) {
    console.error('Error in getCustomerDetails:', error);
    return {
      name: 'Error loading customer',
      email: '',
      phone: '',
      companyName: ''
    };
  }
}

// Enhanced getAssignedToDetails method
async getAssignedToDetails(workOrder: WorkOrder): Promise<{
  name: string;
  email: string;
  id: string;
  phone?: string;
  role?: string;
}> {
  try {
    // First, check if assignedTo is directly populated on work order

    const displayName = (u: any) => {
      const full = `${u?.firstName || ''} ${u?.lastName || ''}`.trim();
      if (full) return full;

      const email = (u?.email || '').trim();
      if (email) return email.split('@')[0]; // or return email to be explicit

      return 'Assigned';
    };
    if (workOrder.assignedTo) {
      if (typeof workOrder.assignedTo === 'object') {
        return {
          name: displayName(workOrder.assignedTo),
          email: workOrder.assignedTo.email || '',
          id: workOrder.assignedTo._id || '',
          phone: '',
          role: ''
        };
      }
    }
    
    // If not assigned on work order, check opportunity's assignedTo
    let opportunity: Opportunity | null = null;
    
    if (typeof workOrder.opportunityId === 'object' && workOrder.opportunityId) {
      // Check if opportunity has assignedTo
      const oppData = workOrder.opportunityId as any;
      if (oppData.assignedTo) {
        return {
          name: displayName(oppData.assignedTo),
          email: oppData.assignedTo.email || '',
          id: oppData.assignedTo._id || '',
          phone: oppData.assignedTo.phone || '',
          role: oppData.assignedTo.role || ''
        };
      }
    } else if (typeof workOrder.opportunityId === 'string') {
      // Fetch opportunity to check assignedTo
      opportunity = await this.getFullOpportunityDetails(workOrder.opportunityId);
      if (opportunity && opportunity.assignedTo) {
        return {
          name: displayName(opportunity.assignedTo),
          email: opportunity.assignedTo.email || '',
          id: opportunity.assignedTo._id || opportunity.assignedTo.id || '',
          phone: opportunity.assignedTo.phone || '',
          role: opportunity.assignedTo.role || ''
        };
      }
    }
    
    return {
      name: 'Unassigned',
      email: '',
      id: ''
    };
  } catch (error) {
    console.error('Error extracting assigned to details:', error);
    return {
      name: 'Error loading assignee',
      email: '',
      id: ''
    };
  }
}

// Method to sync opportunity data to work order
async syncOpportunityDataToWorkOrder(workOrderId: string): Promise<WorkOrder> {
  try {
    const workOrder = await this.getWorkOrderById(workOrderId);
    const opportunityId = typeof workOrder.opportunityId === 'object' 
      ? workOrder.opportunityId._id 
      : workOrder.opportunityId;
    
    if (!opportunityId) {
      throw new Error('No opportunity ID found for work order');
    }
    
    // Fetch latest opportunity data
    const opportunity = await this.getFullOpportunityDetails(opportunityId);
    
    // Update work order with latest opportunity data
    const updateData: UpdateWorkOrderData = {};
    
    // Update assignedTo if not already set on work order
    if (!workOrder.assignedTo && opportunity.assignedTo) {
      updateData.assignedTo = opportunity.assignedTo._id || opportunity.assignedTo.id;
    }
    
    // Update notes with opportunity reference
    if (opportunity.subject) {
      updateData.notes = `${workOrder.notes || ''}\n\nLinked to Opportunity: ${opportunity.subject}`.trim();
    }
    
    // If there are updates, apply them
    if (Object.keys(updateData).length > 0) {
      return await this.updateWorkOrder(workOrderId, updateData);
    }
    
    return workOrder;
  } catch (error) {
    console.error(`Error syncing opportunity data to work order ${workOrderId}:`, error);
    throw error;
  }
}

  getCustomerName(workOrder: WorkOrder): string {
    if (typeof workOrder.opportunityId === 'object' && workOrder.opportunityId.customer) {
      return workOrder.opportunityId.customer.name;
    }
    return 'Unknown Customer';
  }

  getCustomerEmail(workOrder: WorkOrder): string | undefined {
    if (typeof workOrder.opportunityId === 'object' && workOrder.opportunityId.customer) {
      return workOrder.opportunityId.customer.email;
    }
    return undefined;
  }

  getAssignedToName(workOrder: WorkOrder): string {
    if (typeof workOrder.assignedTo === 'object') {
      return `${workOrder.assignedTo.firstName} ${workOrder.assignedTo.lastName}`;
    }
    return 'Unassigned';
  }

  validateWorkOrderData(data: Partial<CreateWorkOrderData>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.opportunityId) {
      errors.push('Opportunity ID is required');
    }

    if (!data.quoteId) {
      errors.push('Quote ID is required');
    }

    if (data.laborCost !== undefined && data.laborCost < 0) {
      errors.push('Labor cost cannot be negative');
    }

    if (data.partsCost !== undefined && data.partsCost < 0) {
      errors.push('Parts cost cannot be negative');
    }

    if (data.estimatedHours !== undefined && data.estimatedHours < 0) {
      errors.push('Estimated hours cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  generateWorkOrderNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `WO-${timestamp}-${random.toString().padStart(3, '0')}`;
  }

  getOrderAge(createdAt: string): number {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = now.getTime() - created.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  isRecentOrder(createdAt: string): boolean {
    return this.getOrderAge(createdAt) <= 3;
  }

  getJobCardsCount(workOrder: WorkOrder): number {
    if (!workOrder.jobCards) return 0;
    if (Array.isArray(workOrder.jobCards)) {
      return workOrder.jobCards.length;
    }
    return 0;
  }

  getDelaySeverity(delayDays?: number): 'none' | 'minor' | 'moderate' | 'severe' {
    if (!delayDays || delayDays <= 0) return 'none';
    if (delayDays <= 2) return 'minor';
    if (delayDays <= 5) return 'moderate';
    return 'severe';
  }

  getDelayColor(delayDays?: number): string {
    const severity = this.getDelaySeverity(delayDays);
    const colors = {
      'none': 'bg-green-100 text-green-800',
      'minor': 'bg-yellow-100 text-yellow-800',
      'moderate': 'bg-orange-100 text-orange-800',
      'severe': 'bg-red-100 text-red-800'
    };
    return colors[severity];
  }

  getNoteCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'customer_communication': 'Customer Communication',
      'observation': 'Observation',
      'issue': 'Issue',
      'other': 'Other'
    };
    return labels[category] || category;
  }

  canAddJobCard(workOrder: WorkOrder): boolean {
    return workOrder.currentStage === 'job_card' || workOrder.status === 'in_progress';
  }

  canGenerateInvoice(workOrder: WorkOrder): boolean {
    return workOrder.currentStage === 'invoice' && 
           !workOrder.invoiceGenerated && 
           workOrder.status !== 'cancelled';
  }

  isWorkOrderActive(workOrder: WorkOrder): boolean {
    return workOrder.status !== 'completed' && 
           workOrder.status !== 'cancelled' &&
           workOrder.isActive !== false;
  }
}

export const workOrderService = new WorkOrderService();