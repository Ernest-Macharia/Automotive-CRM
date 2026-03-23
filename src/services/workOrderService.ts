import { apiClient } from '@/lib/api/client';
import { API_BASE_URL } from '@/lib/api/config';
import { handleUnauthorizedRedirect } from '@/lib/auth/unauthorized';
import { lifecycleIntegrationService } from './lifecycleIntegrationService';
import { invoiceService } from './invoiceService';
import { postChecklistService } from './postChecklistService';
import { JobCard, jobCardService } from './jobCardService';
import { preChecklistService } from './preChecklistService';
import { Opportunity, opportunityService } from './opportunityService';

export interface TechnicianNote {
  content: string;
  _id: string;
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
  createdBy?: string;
  expectedCompletionDateTime?: string;
  impact?: string;
  estimatedResolutionHours?: number;
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
  
  // Add missing properties
  additionalCosts?: number; // ADD THIS LINE
  
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

  // Fix the type - should be an array, not a string
  assignedTechnicians?: Array<{
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  } | string>; // FIX THIS LINE
  
  // Add the missing properties
  invoicePaid?: boolean;
  invoicePaymentDate?: string;
  
  // Add preChecklistStatus property
  preChecklistStatus?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  
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
  opportunityId?: string;
  quoteId?: string;
  waiverId?: string;
  jobCards?: string[];
  vehicleId?: string;
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
  
  // Accept either string IDs or full objects, but ensure consistency
  jobCards?: string[] | Array<{
    _id: string;
    jobTitle?: string;
    status?: string;
  }>;
  
  delayInfo?: Partial<DelayInfo>;
  
  // Add missing properties
  waiverId?: string;
  invoicePaid?: boolean;
  autoApproved?: boolean;
  invoiceId?: string;
  invoicePaymentDate?: string;
  preChecklistStatus?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  postChecklistId?: string;
  preChecklistId?: string;
  postChecklistStatus?: string;
  
  stageApprovals?: {
    pre_checklist?: {
      needsApproval?: boolean;
      approved?: boolean;
      autoApproved?: boolean;
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
      autoApproved?: boolean;
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
  
  preChecklistCompletionDate?: string;
  jobCardCompletionDate?: string;
  postChecklistCompletionDate?: string;
  invoiceCompletionDate?: string;
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

export interface CsvMappingPayload {
  name: string;
  description?: string;
  fieldMappings: Record<string, string>;
  options?: Record<string, any>;
}

const workOrderCache = {
  data: null as any[] | null,
  timestamp: 0,
  params: null as any
};
const CACHE_TTL = 30000;

class WorkOrderService {
  private basePath = '/workorder';

    private opportunityCache = new Map<string, { value: Opportunity; expiresAt: number }>();
  private opportunityInFlight = new Map<string, Promise<Opportunity>>();

  // Tune this: longer = fewer requests, shorter = fresher data
  private OPPORTUNITY_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

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
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
    return this.uploadCsvFile(`${this.basePath}/csv/preview`, file);
  }

  async saveCsvMapping(data: CsvMappingPayload): Promise<any> {
    return apiClient.post<CsvMappingPayload, any>(`${this.basePath}/csv/mappings`, data);
  }

  async listCsvMappings(): Promise<any> {
    return apiClient.get<any>(`${this.basePath}/csv/mappings`);
  }

  async getCsvMapping(id: string): Promise<any> {
    return apiClient.get<any>(`${this.basePath}/csv/mappings/${id}`);
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

    return this.uploadCsvFile(`${this.basePath}/csv/execute`, file, extraFields);
  }

  private getCachedOpportunity(id: string): Promise<Opportunity> {
    const now = Date.now();
    const cached = this.opportunityCache.get(id);

    if (cached && cached.expiresAt > now) {
      return Promise.resolve(cached.value);
    }

    const inFlight = this.opportunityInFlight.get(id);
    if (inFlight) return inFlight;

    const promise = (async () => {
      try {
        const opp = await opportunityService.getOpportunityById(id, false /* keep your existing arg */);
        this.opportunityCache.set(id, { value: opp, expiresAt: now + this.OPPORTUNITY_CACHE_TTL_MS });
        return opp;
      } finally {
        this.opportunityInFlight.delete(id);
      }
    })();

    this.opportunityInFlight.set(id, promise);
    return promise;
  }

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
  async getAllWorkOrders(
    params?: WorkOrderFilterParams & { page?: number; limit?: number }
  ): Promise<WorkOrdersResponse> {
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
      const endpoint = `${this.basePath}${queryString ? `?${queryString}` : ''}`;
      
      // Check cache first (only for full unfiltered requests)
      const now = Date.now();
      const isFullRequest = !params?.search && (!params?.status || params.status === 'all') && 
                          (!params?.stage || params.stage === 'all');
      
      if (isFullRequest && workOrderCache.data && 
          (now - workOrderCache.timestamp) < CACHE_TTL) {
        
        // Apply pagination to cached data
        const page = params?.page || 1;
        const limit = params?.limit || 10;
        const start = (page - 1) * limit;
        const end = start + limit;
        
        return {
          data: workOrderCache.data.slice(start, end),
          pagination: {
            total: workOrderCache.data.length,
            page,
            limit,
            totalPages: Math.ceil(workOrderCache.data.length / limit)
          }
        };
      }
      const response = await apiClient.get<any>(endpoint);
      
      if (Array.isArray(response)) {
        
        // Cache the full response
        if (isFullRequest) {
          workOrderCache.data = response;
          workOrderCache.timestamp = now;
          workOrderCache.params = { ...params };
        }
        
        // Apply filters
        let filteredData = [...response];
        
        if (params?.search) {
          const searchLower = params.search.toLowerCase();
          filteredData = filteredData.filter(wo => 
            wo.workOrderNumber?.toLowerCase().includes(searchLower) ||
            (typeof wo.opportunityId === 'object' && 
            wo.opportunityId.customer?.name?.toLowerCase().includes(searchLower))
          );
        }
        
        if (params?.status && params.status !== 'all') {
          filteredData = filteredData.filter(wo => wo.status === params.status);
        }
        
        if (params?.stage && params.stage !== 'all') {
          filteredData = filteredData.filter(wo => wo.currentStage === params.stage);
        }
        
        // Sort by newest first
        filteredData.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        const total = filteredData.length;
        const page = params?.page || 1;
        const limit = params?.limit || 10;
        const start = (page - 1) * limit;
        const end = start + limit;
        
        return {
          data: filteredData.slice(start, end),
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
          }
        };
      }

      return response as WorkOrdersResponse;
    } catch (error) {
      console.error('Error fetching work orders:', error);
      return {
        data: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0 }
      };
    }
  }

  // GET /api/v1/workorder/{id}
  async getWorkOrderById(id: string): Promise<WorkOrder> {
    try {
        const response = await apiClient.get<WorkOrder>(`${this.basePath}/${id}`);
        
        return response;
      } catch (error) {
        return 
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

    // Fix in generateInvoice method (around line 629):
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
      // Use the invoice service to create invoice from work order
      const result = await invoiceService.createInvoiceFromWorkOrder(id);
      
      // Map the invoice to match the expected type
      const mappedInvoice = {
        _id: result.invoice._id || result.invoice.id || '',
        invoiceNumber: result.invoice.invoiceNumber || '',
        total: result.invoice.total || 0,
        status: result.invoice.status || 'draft'
      };
      
      // Try to send email
      try {
        await invoiceService.sendInvoiceEmail(result.invoice.id || result.invoice._id);
      } catch (emailError) {
        console.warn('Invoice created but email sending failed:', emailError);
      }
      
      return {
        workOrder: result.workOrder,
        invoice: mappedInvoice
      };
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
      const response = await apiClient.post<any, any>(
        `${this.basePath}/${workOrderId}/jobcards/${jobCardId}`,
        {}
      );
      
      // Handle nested structure
      if (response.success && response.data) {
        return response.data;
      }
      return response;
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

  // POST /api/v1/workorder/{id}/test-start-notification
  async testStartNotification(workOrderId: string): Promise<{ success?: boolean; message: string }> {
    try {
      return await apiClient.post<any, { success?: boolean; message: string }>(
        `${this.basePath}/${workOrderId}/test-start-notification`,
        {}
      );
    } catch (error) {
      console.error(`Error triggering test start notification for work order ${workOrderId}:`, error);
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
async getChecklistStatus(checklistId: string, checklistType: 'prechecklist' | 'postchecklist'): Promise<{
  approved: boolean;
  autoApproved: boolean;
  status: string;
  canTransition: boolean;
}> {
  try {
    let checklist;
    
    if (checklistType === 'prechecklist') {
      const preChecklistService = require('./preChecklistService').preChecklistService;
      checklist = await preChecklistService.getPreChecklistById(checklistId);
    } else {
      const postChecklistService = require('./postChecklistService').postChecklistService;
      checklist = await postChecklistService.getPostChecklistById(checklistId);
    }
    
    // Check for auto-approval indicators
    const isAutoApproved = checklist.autoApproved || 
                          checklist.approvedBy === 'system-auto' ||
                          checklist.approvedBy === 'auto-approval-system' ||
                          checklist.remarks?.includes('Auto-approved') ||
                          checklist.notes?.includes('Auto-approved') ||
                          (checklist.approved && checklist.approvedAt && 
                           checklist.approvedBy === 'system');
    
    // For pre-checklists, also check if all items are OK/N/A
    const allItemsOk = checklistType === 'prechecklist' ? 
      checklist.inspectionItems?.every((item: any) => 
        item.status === 'ok' || item.status === 'n/a'
      ) || false : true;
    
    // For post-checklists, check if all required items are completed
    const allRequiredCompleted = checklistType === 'postchecklist' ?
      checklist.inspectionItems?.every((item: any) => 
        !item.required || item.status === 'completed' || item.status === 'n/a'
      ) || false : true;
    
    const isApproved = checklist.approved || isAutoApproved || allItemsOk || allRequiredCompleted;
    
    return {
      approved: isApproved,
      autoApproved: isAutoApproved,
      status: isApproved ? 'approved' : 'pending',
      canTransition: isApproved
    };
  } catch (error) {
    console.error(`Error getting ${checklistType} status:`, error);
    return {
      approved: false,
      autoApproved: false,
      status: 'unknown',
      canTransition: false
    };
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
    
    // Use enhanced validation that considers auto-approval
    return await this.validateStageCompletionWithAutoApproval(workOrder, stage, document);
  } catch (error) {
    console.error('Error getting stage validation:', error);
    throw error;
  }
}

async getPreChecklistApprovalStatus(workOrderId: string): Promise<{
  hasPreChecklist: boolean;
  isApproved: boolean;
  needsApproval: boolean;
  preChecklistId?: string;
  details?: string;
}> {
  try {
    const workOrder = await this.getWorkOrderById(workOrderId);
    
    if (!workOrder.preChecklistId) {
      return {
        hasPreChecklist: false,
        isApproved: false,
        needsApproval: false
      };
    }
    
    // Get pre-checklist details
    const preChecklist = await preChecklistService.getPreChecklistById(workOrder.preChecklistId);
    
    return {
      hasPreChecklist: true,
      isApproved: preChecklist.approved || false,
      needsApproval: !preChecklist.approved,
      preChecklistId: workOrder.preChecklistId
    };
  } catch (error) {
    console.error('Error getting pre-checklist approval status:', error);
    return {
      hasPreChecklist: false,
      isApproved: false,
      needsApproval: false
    };
  }
}

// Add method to approve pre-checklist manually
async approvePreChecklistManually(workOrderId: string, approvedBy?: string): Promise<{
  success: boolean;
  message: string;
  nextAction?: string;
}> {
  try {
    const workOrder = await this.getWorkOrderById(workOrderId);
    
    if (!workOrder.preChecklistId) {
      return {
        success: false,
        message: 'No pre-checklist found to approve'
      };
    }
    
    // Approve the pre-checklist
    await preChecklistService.approvePreChecklist(
      workOrder.preChecklistId,
      approvedBy
    );
    
    // Update work order stage approvals
    await this.updateWorkOrder(workOrderId, {
      stageApprovals: {
        ...workOrder.stageApprovals,
        pre_checklist: {
          ...workOrder.stageApprovals?.pre_checklist,
          approved: true,
          approvedAt: new Date().toISOString(),
          approvedBy: approvedBy || 'manual'
        }
      },
      preChecklistCompletionDate: new Date().toISOString()
    });
    
    return {
      success: true,
      message: 'Pre-checklist approved successfully',
      nextAction: 'create_job_card'
    };
    
  } catch (error) {
    console.error('Error approving pre-checklist:', error);
    return {
      success: false,
      message: 'Failed to approve pre-checklist'
    };
  }
}

// Add new validation method that considers auto-approval
async validateStageCompletionWithAutoApproval(
  workOrder: WorkOrder, 
  stage: string, 
  document: any
): Promise<{ 
  isValid: boolean; 
  message?: string; 
  requirements?: string[];
  autoApproved?: boolean;
}> {
  switch (stage) {
    case 'prechecklist':
      if (!document) {
        return { 
          isValid: false, 
          message: 'Pre-checklist document not found',
          requirements: ['Create pre-checklist document']
        };
      }
      
      // Check for auto-approval
      const preChecklistStatus = await this.getChecklistStatus(document._id, 'prechecklist');
      
      return {
        isValid: preChecklistStatus.approved,
        message: preChecklistStatus.approved 
          ? (preChecklistStatus.autoApproved ? 'Auto-approved ✓' : 'Approved')
          : 'Pre-checklist needs completion',
        requirements: preChecklistStatus.approved ? [] : ['Complete pre-checklist items'],
        autoApproved: preChecklistStatus.autoApproved
      };

    case 'jobcard':
      if (!document) {
        return { 
          isValid: false, 
          message: 'Job card not found',
          requirements: ['Create job card document']
        };
      }
      
      const isCompleted = document.status === 'completed' || document.status === 'closed';
      
      return {
        isValid: isCompleted,
        message: isCompleted ? 'Job card completed' : 'Job card in progress',
        requirements: isCompleted ? [] : ['Complete job card tasks']
      };

    case 'postchecklist':
      if (!document) {
        return { 
          isValid: false, 
          message: 'Post-checklist not found',
          requirements: ['Create post-checklist document']
        };
      }
      
      // Check for auto-approval
      const postChecklistStatus = await this.getChecklistStatus(document._id, 'postchecklist');
      
      return {
        isValid: postChecklistStatus.approved,
        message: postChecklistStatus.approved 
          ? (postChecklistStatus.autoApproved ? 'Auto-approved ✓' : 'Approved')
          : 'Post-checklist needs completion',
        requirements: postChecklistStatus.approved ? [] : ['Complete post-checklist items'],
        autoApproved: postChecklistStatus.autoApproved
      };

    case 'invoice':
      if (!document) {
        return { 
          isValid: false, 
          message: 'Invoice not found',
          requirements: ['Create invoice document']
        };
      }
      
      const isSentOrPaid = document.status === 'sent' || document.status === 'paid';
      
      return {
        isValid: isSentOrPaid,
        message: isSentOrPaid ? 'Invoice sent/paid' : 'Invoice pending',
        requirements: isSentOrPaid ? [] : ['Send or mark invoice as paid']
      };

    default:
      return { 
        isValid: false, 
        message: `Unknown stage: ${stage}`,
        requirements: ['Valid stage required']
      };
  }
}
async autoApproveAndTransition(
  workOrderId: string,
  checklistType: 'prechecklist' | 'postchecklist',
  userId?: string
): Promise<{
  success: boolean;
  message: string;
  nextStage?: string;
  autoApproved: boolean;
}> {
  try {
    // Get work order
    const workOrder = await this.getWorkOrderById(workOrderId);
    
    // Get checklist ID
    const checklistId = checklistType === 'prechecklist' 
      ? workOrder.preChecklistId 
      : workOrder.postChecklistId;
    
    if (!checklistId) {
      return { 
        success: false, 
        message: `${checklistType} not found`,
        autoApproved: false
      };
    }
    
    // Auto-approve the checklist with auto-approval flag
    if (checklistType === 'prechecklist') {
      await preChecklistService.updatePreChecklist(checklistId, {
        approved: true,
        autoApproved: true, // Add this flag
        approvedBy: 'system-auto',
        approvedAt: new Date().toISOString(),
        status: 'completed',
        remarks: workOrder.notes ? `${workOrder.notes} (Auto-approved)` : 'Auto-approved by system'
      });
    } else {
      await postChecklistService.updatePostChecklist(checklistId, {
        approved: true,
        autoApproved: true, // Add this flag
        approvedBy: 'system-auto',
        approvedAt: new Date().toISOString(),
        status: 'completed',
        remarks: workOrder.notes ? `${workOrder.notes} (Auto-approved)` : 'Auto-approved by system'
      });
    }
    
    // Get opportunity ID
    const opportunityId = typeof workOrder.opportunityId === 'object' 
      ? workOrder.opportunityId._id 
      : workOrder.opportunityId;
    
    // Auto-transition to next stage
    let nextStage: string;
    if (checklistType === 'prechecklist') {
      nextStage = 'jobcard';
      await this.updateWorkOrder(workOrderId, {
        currentStage: 'job_card',
        stageApprovals: {
          ...workOrder.stageApprovals,
          pre_checklist: {
            ...workOrder.stageApprovals?.pre_checklist,
            approved: true,
            autoApproved: true,
            approvedAt: new Date().toISOString(),
            approvedBy: 'system-auto'
          }
        },
        preChecklistCompletionDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else {
      nextStage = 'invoice';
      await this.updateWorkOrder(workOrderId, {
        currentStage: 'invoice',
        stageApprovals: {
          ...workOrder.stageApprovals,
          post_checklist: {
            ...workOrder.stageApprovals?.post_checklist,
            approved: true,
            autoApproved: true,
            approvedAt: new Date().toISOString(),
            approvedBy: 'system-auto'
          }
        },
        postChecklistCompletionDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Auto-generate invoice if not exists
      if (!workOrder.invoiceId) {
        setTimeout(async () => {
          try {
            const invoiceResult = await this.generateInvoice(workOrderId);
            if (invoiceResult.invoice._id) {
              await this.updateWorkOrder(workOrderId, {
                invoiceId: invoiceResult.invoice._id,
                updatedAt: new Date().toISOString()
              });
            }
          } catch (error) {
            console.error('Error auto-generating invoice:', error);
          }
        }, 1000);
      }
    }
    
    // Update lifecycle
    await lifecycleIntegrationService.transitionToStage(opportunityId, nextStage, {
      skipValidation: true,
      metadata: {
        autoApproved: true,
        checklistType,
        checklistId,
        triggeredBy: 'system-auto'
      }
    });
    
    return {
      success: true,
      message: `${checklistType} auto-approved and moved to ${nextStage}`,
      nextStage,
      autoApproved: true
    };
    
  } catch (error) {
    console.error('Auto-approval error:', error);
    return {
      success: false,
      message: `Failed to auto-approve ${checklistType}`,
      autoApproved: false
    };
  }
}

// Add method to check if checklist needs approval (should return false for auto-approved)
async checkIfChecklistNeedsApproval(checklistId: string, checklistType: 'prechecklist' | 'postchecklist'): Promise<boolean> {
  try {
    const status = await this.getChecklistStatus(checklistId, checklistType);
    // Return false if already approved (especially auto-approved)
    return !status.approved;
  } catch (error) {
    console.error('Error checking checklist approval status:', error);
    return true; // Assume needs approval if error
  }
}
async getWorkflowProgress(workOrderId: string) {
  try {
    const workOrder = await this.getWorkOrderById(workOrderId);
    const opportunityId = typeof workOrder.opportunityId === 'object' 
      ? workOrder.opportunityId._id 
      : workOrder.opportunityId;
    
    const workflow = await lifecycleIntegrationService.getEnhancedWorkflowUI(opportunityId);
    
    // Enhance workflow data with auto-approval status
    if (workflow.stages) {
      workflow.stages = await Promise.all(workflow.stages.map(async (stage: any) => {
        if ((stage.stage === 'prechecklist' || stage.stage === 'postchecklist') && stage.documentId) {
          const checklistType = stage.stage === 'prechecklist' ? 'prechecklist' : 'postchecklist';
          const status = await this.getChecklistStatus(stage.documentId, checklistType);
          
          return {
            ...stage,
            approved: status.approved,
            autoApproved: status.autoApproved,
            status: status.approved ? 'approved' : 'pending',
            canTransition: status.canTransition,
            validation: {
              isValid: status.approved,
              message: status.approved 
                ? (status.autoApproved ? 'Auto-approved ✓' : 'Approved')
                : 'Needs completion'
            }
          };
        }
        return stage;
      }));
    }
    
    return workflow;
  } catch (error) {
    console.error('Error getting workflow progress:', error);
    throw error;
  }
}

// Add method to force refresh checklist approval status
async refreshChecklistApprovalStatus(
  workOrderId: string,
  checklistType: 'prechecklist' | 'postchecklist'
): Promise<{
  success: boolean;
  approved: boolean;
  autoApproved: boolean;
  message: string;
}> {
  try {
    const workOrder = await this.getWorkOrderById(workOrderId);
    const checklistId = checklistType === 'prechecklist' 
      ? workOrder.preChecklistId 
      : workOrder.postChecklistId;
    
    if (!checklistId) {
      return {
        success: false,
        approved: false,
        autoApproved: false,
        message: `${checklistType} not found`
      };
    }
    
    const status = await this.getChecklistStatus(checklistId, checklistType);
    
    // If auto-approved but work order stage hasn't been updated
    if (status.approved && status.autoApproved) {
      // Update work order stage approvals
      const updateData: UpdateWorkOrderData = {
        updatedAt: new Date().toISOString()
      };
      
      if (checklistType === 'prechecklist') {
        (updateData.stageApprovals as any) = {
          ...workOrder.stageApprovals,
          pre_checklist: {
            ...workOrder.stageApprovals?.pre_checklist,
            approved: true,
            autoApproved: true,
            approvedAt: new Date().toISOString(),
            approvedBy: 'system-auto'
          }
        };
        updateData.preChecklistCompletionDate = new Date().toISOString();
      } else {
        (updateData.stageApprovals as any) = {
          ...workOrder.stageApprovals,
          post_checklist: {
            ...workOrder.stageApprovals?.post_checklist,
            approved: true,
            autoApproved: true,
            approvedAt: new Date().toISOString(),
            approvedBy: 'system-auto'
          }
        };
        updateData.postChecklistCompletionDate = new Date().toISOString();
      }
      
      await this.updateWorkOrder(workOrderId, updateData);
    }
    
    return {
      success: true,
      approved: status.approved,
      autoApproved: status.autoApproved,
      message: status.approved 
        ? (status.autoApproved ? 'Auto-approved' : 'Approved')
        : 'Pending approval'
    };
  } catch (error) {
    console.error('Error refreshing checklist approval:', error);
    return {
      success: false,
      approved: false,
      autoApproved: false,
      message: 'Error checking approval status'
    };
  }
}
getStageStatusConfig(stage: any) {
  if (!stage) return {
    label: 'Unknown',
    className: 'bg-gray-100 text-gray-800',
    icon: '❓'
  };
  
  if (stage.completed || stage.approved) {
    return {
      label: stage.autoApproved ? 'Auto-Approved' : 'Approved',
      className: stage.autoApproved ? 'bg-green-100 text-green-800' : 'bg-green-100 text-green-800',
      icon: stage.autoApproved ? '⚡✅' : '✅'
    };
  }
  
  if (stage.isCurrent) {
    if (stage.status === 'needs_approval') {
      return {
        label: 'Needs Action',
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


  /**
   * Add a job card to work order
   */
  // Fix in addJobCard method (around line 1590):
async addJobCard(workOrderId: string, jobCardId: string): Promise<WorkOrder> {
  try {
    const workOrder = await this.getWorkOrderById(workOrderId);
    
    const existingJobCards = workOrder.jobCards || [];
    
    // Ensure we only store job card IDs (strings)
    let existingIds: string[] = [];
    
    if (Array.isArray(existingJobCards)) {
      existingIds = existingJobCards.map(jc => {
        if (typeof jc === 'string') return jc;
        if (jc && typeof jc === 'object') return jc._id || '';
        return '';
      }).filter(id => id); // Remove empty strings
    }
    
    // Add the new job card ID if not already present
    if (!existingIds.includes(jobCardId)) {
      existingIds.push(jobCardId);
    }
    
    return await this.updateWorkOrder(workOrderId, {
      jobCards: existingIds, // Pass as string array
      currentStage: 'job_card',
      status: 'in_progress',
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error adding job card to work order ${workOrderId}:`, error);
    throw error;
  }
}

  /**
   * Get all job cards for a work order (populated)
   */
  // In workOrderService.ts - Fix the getWorkOrderJobCards method:
/**
 * Get all job cards for a work order (populated)
 */
// In workOrderService.ts - Update the getWorkOrderJobCards method:
// Fix the normalizeJobCardId method to be more robust
private normalizeJobCardId(ref: any): string | null {
  if (typeof ref === 'string') return ref.trim() || null;
  if (ref && typeof ref === 'object') return (ref._id || ref.id || '').toString().trim() || null;
  return null;
}

// Update getWorkOrderJobCards method to handle mixed types
async getWorkOrderJobCards(workOrderId: string): Promise<JobCard[]> {
  try {
    const workOrder = await this.getWorkOrderById(workOrderId);

    if (!Array.isArray(workOrder.jobCards) || workOrder.jobCards.length === 0) return [];

    // Extract all job card IDs from mixed array
    const jobCardIds = workOrder.jobCards
      .map(ref => this.normalizeJobCardId(ref))
      .filter((id): id is string => !!id); // Type guard to filter out nulls

    // Deduplicate IDs
    const uniqueIds = Array.from(new Set(jobCardIds));

    // Fetch all job cards
    const jobCards = await Promise.all(
      uniqueIds.map(async (id) => {
        try {
          return await jobCardService.getJobCardById(id);
        } catch (error) {
          console.error(`Error fetching job card ${id}:`, error);
          return null;
        }
      })
    );

    return jobCards.filter((jc): jc is JobCard => jc !== null);
  } catch (error) {
    console.error(`Error fetching job cards for work order ${workOrderId}:`, error);
    throw error;
  }
}

  /**
   * Check if job card exists for work order
   */
  async hasJobCard(workOrderId: string): Promise<boolean> {
    try {
      const workOrder = await this.getWorkOrderById(workOrderId);
      return !!(workOrder.jobCards && workOrder.jobCards.length > 0);
    } catch (error) {
      console.error(`Error checking job cards for work order ${workOrderId}:`, error);
      return false;
    }
  }

  /**
   * Update work order when job card is completed
   */
  async onJobCardCompleted(workOrderId: string, jobCardId: string): Promise<WorkOrder> {
    try {
      const workOrder = await this.getWorkOrderById(workOrderId);
      const jobCards = await this.getWorkOrderJobCards(workOrderId);
      
      // Check if all job cards are completed
      const allCompleted = jobCards.every(jc => 
        jc.status === 'completed' || jc._id === jobCardId 
      );
      
      const updateData: UpdateWorkOrderData = {
        updatedAt: new Date().toISOString()
      };
      
      // If all job cards are completed, move to next stage
      if (allCompleted && workOrder.currentStage === 'job_card') {
        updateData.currentStage = 'post_checklist';
        updateData.jobCardCompletionDate = new Date().toISOString();
        updateData.stageApprovals = {
          ...workOrder.stageApprovals,
          job_card: {
            ...workOrder.stageApprovals?.job_card,
            approved: true,
            approvedAt: new Date().toISOString()
          }
        };
      }
      
      return await this.updateWorkOrder(workOrderId, updateData);
    } catch (error) {
      console.error(`Error updating work order on job card completion ${workOrderId}:`, error);
      throw error;
    }
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
  async getFullOpportunityDetails(opportunityId: string): Promise<Opportunity> {
    try {
      return await this.getCachedOpportunity(opportunityId);
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
      // If opportunityId is already populated, DO NOT fetch anything.
      if (typeof workOrder.opportunityId === 'object' && workOrder.opportunityId) {
        const opp: any = workOrder.opportunityId;
        return {
          name: opp.customer?.name || opp.subject || 'Unknown Customer',
          email: opp.customer?.email || '',
          phone: opp.customer?.phone || '',
          companyName: opp.customer?.companyName || '',
          address: opp.customer?.companyAddress || '',
          taxId: opp.customer?.companyTaxId || ''
        };
      }

      // Otherwise use cached/deduped fetch
      if (typeof workOrder.opportunityId === 'string' && workOrder.opportunityId.trim()) {
        const opportunity = await this.getFullOpportunityDetails(workOrder.opportunityId);
        return {
          name: opportunity?.customer?.name || 'Customer',
          email: opportunity?.customer?.email || '',
          phone: opportunity?.customer?.phone || '',
          companyName: opportunity?.customer?.companyName || '',
          address: (opportunity as any)?.customer?.companyAddress || '',
          taxId: (opportunity as any)?.customer?.companyTaxId || ''
        };
      }

      return { name: 'Unknown Customer', email: '', phone: '', companyName: '' };
    } catch (error) {
      console.error('Error in getCustomerDetails:', error);
      return { name: 'Error loading customer', email: '', phone: '', companyName: '' };
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
      const displayName = (u: any) => {
        const full = `${u?.firstName || ''} ${u?.lastName || ''}`.trim();
        if (full) return full;
        const email = (u?.email || '').trim();
        if (email) return email.split('@')[0];
        return 'Assigned';
      };

      // 1) Prefer workOrder.assignedTo if populated
      if (workOrder.assignedTo && typeof workOrder.assignedTo === 'object') {
        return {
          name: displayName(workOrder.assignedTo),
          email: workOrder.assignedTo.email || '',
          id: workOrder.assignedTo._id || '',
          phone: '',
          role: ''
        };
      }

      // 2) If opportunity is populated, use it without fetching
      if (typeof workOrder.opportunityId === 'object' && workOrder.opportunityId) {
        const opp: any = workOrder.opportunityId;
        if (opp.assignedTo) {
          return {
            name: displayName(opp.assignedTo),
            email: opp.assignedTo.email || '',
            id: opp.assignedTo._id || '',
            phone: opp.assignedTo.phone || '',
            role: opp.assignedTo.role || ''
          };
        }
      }

      // 3) Otherwise fetch opportunity (cached/deduped)
      if (typeof workOrder.opportunityId === 'string' && workOrder.opportunityId.trim()) {
        const opportunity = await this.getFullOpportunityDetails(workOrder.opportunityId);
        if (opportunity?.assignedTo) {
          return {
            name: displayName(opportunity.assignedTo),
            email: opportunity.assignedTo.email || '',
            id: (opportunity.assignedTo as any)._id || (opportunity.assignedTo as any).id || '',
            phone: (opportunity.assignedTo as any).phone || '',
            role: (opportunity.assignedTo as any).role || ''
          };
        }
      }

      return { name: 'Unassigned', email: '', id: '' };
    } catch (error) {
      console.error('Error extracting assigned to details:', error);
      return { name: 'Error loading assignee', email: '', id: '' };
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
