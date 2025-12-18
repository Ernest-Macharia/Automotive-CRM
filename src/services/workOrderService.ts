import { apiClient } from '@/lib/api/client';

export interface WorkOrder {
  _id: string;
  id: string;
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
  jobCards?: string[];
  preChecklistId?: string;
  postChecklistId?: string;
  invoiceId?: string;
  status: 'draft' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  assignedTo?: string | {
    _id: string;
    firstName: string;
    lastName: string;
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
}

export interface CreateWorkOrderData {
  opportunityId: string;
  quoteId: string;
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
  laborCost: number;
  partsCost: number;
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
  notes?: string;
}

export interface FilterParams {
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

class WorkOrderService {
  async getAllWorkOrders(params?: FilterParams): Promise<WorkOrdersResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const endpoint = `/workorder${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiClient.get<any>(endpoint);
      
      return {
        data: response.data || response,
        pagination: response.pagination,
        stats: response.stats
      };
    } catch (error) {
      console.error('Error fetching work orders:', error);
      throw error;
    }
  }

  async getWorkOrderById(id: string): Promise<WorkOrder> {
    try {
      return await apiClient.get<WorkOrder>(`/workorder/${id}`);
    } catch (error) {
      console.error(`Error fetching work order ${id}:`, error);
      throw error;
    }
  }

  async getWorkOrdersByOpportunity(opportunityId: string): Promise<WorkOrdersResponse> {
    try {
      const response = await apiClient.get<any>(`/workorder/opportunity/${opportunityId}`);
      return {
        data: response.data || response,
        pagination: undefined,
        stats: undefined
      };
    } catch (error) {
      console.error(`Error fetching work orders for opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  async createWorkOrder(data: CreateWorkOrderData): Promise<WorkOrder> {
    try {
      const formattedData = {
        opportunityId: data.opportunityId,
        quoteId: data.quoteId,
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
        laborCost: data.laborCost || 0,
        partsCost: data.partsCost || 0,
        notes: data.notes
      };

      console.log('Creating work order with data:', JSON.stringify(formattedData, null, 2));
      
      return await apiClient.post<any, WorkOrder>('/workorder', formattedData);
    } catch (error) {
      console.error('Error creating work order:', error);
      throw error;
    }
  }

  async updateWorkOrder(id: string, data: UpdateWorkOrderData): Promise<WorkOrder> {
    try {
      return await apiClient.patch<UpdateWorkOrderData, WorkOrder>(`/workorder/${id}`, data);
    } catch (error) {
      console.error(`Error updating work order ${id}:`, error);
      throw error;
    }
  }

  async deleteWorkOrder(id: string): Promise<void> {
    try {
      await apiClient.delete(`/workorder/${id}`);
    } catch (error) {
      console.error(`Error deleting work order ${id}:`, error);
      throw error;
    }
  }

  async updateWorkOrderStatus(id: string, status: string): Promise<WorkOrder> {
    try {
      return await apiClient.patch<any, WorkOrder>(`/workorder/${id}/status/${status}`, {});
    } catch (error) {
      console.error(`Error updating work order status ${id}:`, error);
      throw error;
    }
  }

  async addJobCardToWorkOrder(workOrderId: string, jobCardId: string): Promise<WorkOrder> {
    try {
      return await apiClient.post<any, WorkOrder>(`/workorder/${workOrderId}/jobcards/${jobCardId}`, {});
    } catch (error) {
      console.error(`Error adding job card to work order ${workOrderId}:`, error);
      throw error;
    }
  }

  async removeJobCardFromWorkOrder(workOrderId: string, jobCardId: string): Promise<WorkOrder> {
    try {
      return await apiClient.delete<WorkOrder>(`/workorder/${workOrderId}/jobcards/${jobCardId}`);
    } catch (error) {
      console.error(`Error removing job card from work order ${workOrderId}:`, error);
      throw error;
    }
  }

  async getWorkOrderStats(): Promise<WorkOrderStats> {
    try {
      return await apiClient.get<WorkOrderStats>('/workorder/stats/summary');
    } catch (error) {
      console.error('Error fetching work order stats:', error);
      throw error;
    }
  }

  // Utility methods for UI
  getStatusColor(status: string): string {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'draft': return '📝';
      case 'in_progress': return '⚙️';
      case 'on_hold': return '⏸️';
      case 'completed': return '✅';
      case 'cancelled': return '❌';
      default: return '📝';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2
    }).format(amount);
  }

  calculateTotalCost(laborCost: number, partsCost: number): number {
    return laborCost + partsCost;
  }
}

export const workOrderService = new WorkOrderService();