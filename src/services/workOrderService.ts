// src/services/workOrderService.ts
import { apiClient } from '@/lib/api/client';

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

// In src/services/workOrderService.ts - Update the UpdateWorkOrderData interface:

export interface UpdateWorkOrderData {
  status?: 'draft' | 'pre_checklist' | 'in_progress' | 'job_card' | 'post_checklist' | 'ready_for_invoice' | 'completed' | 'cancelled' | 'delayed';
  currentStage?: 'pre_checklist' | 'job_card' | 'post_checklist' | 'invoice';
  assignedTo?: string;
  startDate?: string;
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
  async getAllWorkOrders(params?: WorkOrderFilterParams): Promise<WorkOrder[]> {
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
      return await apiClient.get<WorkOrder[]>(endpoint);
    } catch (error) {
      console.error('Error fetching work orders:', error);
      throw error;
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

  // Utility methods for UI
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

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'draft': '📝',
      'pre_checklist': '📋',
      'in_progress': '⚙️',
      'job_card': '🔧',
      'post_checklist': '✅',
      'ready_for_invoice': '🧾',
      'completed': '🏁',
      'cancelled': '❌',
      'delayed': '⏸️'
    };
    return icons[status] || '📝';
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
    if (amount === undefined || amount === null) return 'KES 0.00';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2
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