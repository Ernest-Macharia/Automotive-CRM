// src/services/workOrderService.ts
import { apiClient } from '@/lib/api/client';

export interface WorkOrder {
  _id?: string;
  id?: string;
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
  status: 'draft' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  assignedTo?: string | {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
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
  workOrderNumber?: string;
  waiverId?: string;
  jobCards?: string[];
  preChecklistId?: string;
  postChecklistId?: string;
  invoiceId?: string;
  status?: 'draft' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  assignedTo?: string;
  startDate?: string;
  estimatedCompletionDate?: string;
  estimatedHours?: number;
  laborCost?: number;
  partsCost?: number;
  notes?: string;
}

export interface UpdateWorkOrderData {
  status?: 'draft' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
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
}

export interface WorkOrderFilterParams {
  status?: string;
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
    totalCost?: number;
  }>;
  byMonth: Array<{
    _id: {
      year: number;
      month: number;
    };
    count: number;
    totalCost: number;
  }>;
  totalCost: number;
  avgHours: number;
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

class WorkOrderService {
  private basePath = '/workorder';

  // POST /api/v1/workorder - Create a new work order
  async createWorkOrder(data: CreateWorkOrderData): Promise<WorkOrder> {
    try {
      const laborCost = data.laborCost || 0;
      const partsCost = data.partsCost || 0;
      const totalCost = laborCost + partsCost;

      const formattedData = {
        opportunityId: data.opportunityId,
        quoteId: data.quoteId,
        workOrderNumber: data.workOrderNumber || `WO-${Date.now()}`,
        waiverId: data.waiverId,
        jobCards: data.jobCards || [],
        preChecklistId: data.preChecklistId,
        postChecklistId: data.postChecklistId,
        invoiceId: data.invoiceId,
        status: data.status || 'draft',
        assignedTo: data.assignedTo,
        startDate: data.startDate || new Date().toISOString(),
        estimatedCompletionDate: data.estimatedCompletionDate,
        estimatedHours: data.estimatedHours || 0,
        laborCost,
        partsCost,
        totalCost,
        notes: data.notes
      };

      return await apiClient.post<CreateWorkOrderData, WorkOrder>(this.basePath, formattedData);
    } catch (error) {
      console.error('Error creating work order:', error);
      throw error;
    }
  }

  // GET /api/v1/workorder - Get all work orders
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

  // GET /api/v1/workorder/opportunity/{opportunityId} - Get work orders by opportunity
  async getWorkOrdersByOpportunity(opportunityId: string): Promise<WorkOrder[]> {
    try {
      return await apiClient.get<WorkOrder[]>(`${this.basePath}/opportunity/${opportunityId}`);
    } catch (error) {
      console.error(`Error fetching work orders for opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  // GET /api/v1/workorder/{id} - Get a work order by ID
  async getWorkOrderById(id: string): Promise<WorkOrder> {
    try {
      return await apiClient.get<WorkOrder>(`${this.basePath}/${id}`);
    } catch (error) {
      console.error(`Error fetching work order ${id}:`, error);
      throw error;
    }
  }

  // PATCH /api/v1/workorder/{id} - Update a work order
  async updateWorkOrder(id: string, data: UpdateWorkOrderData): Promise<WorkOrder> {
    try {
      return await apiClient.patch<UpdateWorkOrderData, WorkOrder>(`${this.basePath}/${id}`, data);
    } catch (error) {
      console.error(`Error updating work order ${id}:`, error);
      throw error;
    }
  }

  // DELETE /api/v1/workorder/{id} - Delete a work order (soft delete)
  async deleteWorkOrder(id: string): Promise<{ message: string }> {
    try {
      return await apiClient.delete<{ message: string }>(`${this.basePath}/${id}`);
    } catch (error) {
      console.error(`Error deleting work order ${id}:`, error);
      throw error;
    }
  }

  // POST /api/v1/workorder/{id}/jobcards/{jobCardId} - Add a job card to work order
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

  // DELETE /api/v1/workorder/{id}/jobcards/{jobCardId} - Remove a job card from work order
  async removeJobCardFromWorkOrder(workOrderId: string, jobCardId: string): Promise<WorkOrder> {
    try {
      return await apiClient.delete<WorkOrder>(`${this.basePath}/${workOrderId}/jobcards/${jobCardId}`);
    } catch (error) {
      console.error(`Error removing job card from work order ${workOrderId}:`, error);
      throw error;
    }
  }

  // PATCH /api/v1/workorder/{id}/status/{status} - Update work order status
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

  // GET /api/v1/workorder/stats/summary - Get work order statistics
  async getWorkOrderStats(): Promise<WorkOrderStats> {
    try {
      return await apiClient.get<WorkOrderStats>(`${this.basePath}/stats/summary`);
    } catch (error) {
      console.error('Error fetching work order stats:', error);
      throw error;
    }
  }

  // Utility methods for UI
  getStatusColor(status: string): string {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status.toLowerCase()) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusIcon(status?: string): string {
    if (!status) return '📝';
    switch (status.toLowerCase()) {
      case 'draft': return '📝';
      case 'in_progress': return '⚙️';
      case 'on_hold': return '⏸️';
      case 'completed': return '✅';
      case 'cancelled': return '❌';
      default: return '📝';
    }
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

  getOrderProgress(status: string): number {
    switch (status) {
      case 'draft': return 0;
      case 'in_progress': return 50;
      case 'on_hold': return 25;
      case 'completed': return 100;
      case 'cancelled': return 0;
      default: return 0;
    }
  }

  getNextStatus(currentStatus: string): string | null {
    switch (currentStatus) {
      case 'draft': return 'in_progress';
      case 'in_progress': return 'completed';
      case 'on_hold': return 'in_progress';
      default: return null;
    }
  }

  canChangeStatus(currentStatus: string, newStatus: string): boolean {
    const allowedTransitions: Record<string, string[]> = {
      'draft': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'on_hold', 'cancelled'],
      'on_hold': ['in_progress', 'cancelled'],
      'completed': [],
      'cancelled': []
    };

    return allowedTransitions[currentStatus]?.includes(newStatus) || false;
  }

  // Get customer name from work order
  getCustomerName(workOrder: WorkOrder): string {
    if (typeof workOrder.opportunityId === 'object' && workOrder.opportunityId.customer) {
      return workOrder.opportunityId.customer.name;
    }
    return 'Unknown Customer';
  }

  // Get customer email from work order
  getCustomerEmail(workOrder: WorkOrder): string | undefined {
    if (typeof workOrder.opportunityId === 'object' && workOrder.opportunityId.customer) {
      return workOrder.opportunityId.customer.email;
    }
    return undefined;
  }

  // Get assigned technician name
  getAssignedToName(workOrder: WorkOrder): string {
    if (typeof workOrder.assignedTo === 'object') {
      return `${workOrder.assignedTo.firstName} ${workOrder.assignedTo.lastName}`;
    }
    return 'Unassigned';
  }

  // Get available statuses
  getAvailableStatuses(): Array<{ value: string; label: string }> {
    return [
      { value: 'draft', label: 'Draft' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'on_hold', label: 'On Hold' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' }
    ];
  }

  // Get status label
  getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      'draft': 'Draft',
      'in_progress': 'In Progress',
      'on_hold': 'On Hold',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  }

  // Validate work order data
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

  // Generate work order number (frontend fallback)
  generateWorkOrderNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `WO-${timestamp}-${random.toString().padStart(3, '0')}`;
  }

  // Calculate order age in days
  getOrderAge(createdAt: string): number {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = now.getTime() - created.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  // Check if order is recent (within 3 days)
  isRecentOrder(createdAt: string): boolean {
    return this.getOrderAge(createdAt) <= 3;
  }

  // Get job cards count
  getJobCardsCount(workOrder: WorkOrder): number {
    if (!workOrder.jobCards) return 0;
    if (Array.isArray(workOrder.jobCards)) {
      return workOrder.jobCards.length;
    }
    return 0;
  }

  // Calculate efficiency (actual vs estimated hours)
  calculateEfficiency(estimatedHours?: number, actualHours?: number): number {
    if (!estimatedHours || !actualHours || estimatedHours === 0) return 0;
    return ((estimatedHours - actualHours) / estimatedHours) * 100;
  }

  // Get efficiency label
  getEfficiencyLabel(efficiency: number): string {
    if (efficiency > 20) return 'Excellent';
    if (efficiency > 10) return 'Good';
    if (efficiency > 0) return 'On Track';
    if (efficiency === 0) return 'On Time';
    if (efficiency > -10) return 'Slightly Over';
    return 'Delayed';
  }

  // Get efficiency color
  getEfficiencyColor(efficiency: number): string {
    if (efficiency > 20) return 'bg-green-100 text-green-800';
    if (efficiency > 10) return 'bg-blue-100 text-blue-800';
    if (efficiency > 0) return 'bg-yellow-100 text-yellow-800';
    if (efficiency === 0) return 'bg-gray-100 text-gray-800';
    return 'bg-red-100 text-red-800';
  }
}

export const workOrderService = new WorkOrderService();