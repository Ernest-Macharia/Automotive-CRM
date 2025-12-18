import { apiClient } from '@/lib/api/client';

export interface SalesOrder {
  _id: string;
  id: string;
  salesOrderNumber: string;
  opportunityId: string | {
    _id: string;
    subject: string;
    customer: {
      name: string;
      email?: string;
      phone?: string;
      companyName?: string;
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
  invoiceId?: string;
  status: 'draft' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  salesRep?: string | {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  orderDate: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  totalAmount: number;
  shippingAddress?: string;
  billingAddress?: string;
  paymentTerms?: string;
  notes?: string;
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateSalesOrderData {
  opportunityId: string;
  quoteId: string;
  invoiceId?: string;
  status?: 'draft' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  salesRep?: string;
  orderDate?: string;
  estimatedDeliveryDate?: string;
  subtotal: number;
  tax?: number;
  shipping?: number;
  discount?: number;
  totalAmount: number;
  shippingAddress?: string;
  billingAddress?: string;
  paymentTerms?: string;
  notes?: string;
}

export interface UpdateSalesOrderData {
  status?: 'draft' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  salesRep?: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  subtotal?: number;
  tax?: number;
  shipping?: number;
  discount?: number;
  totalAmount?: number;
  shippingAddress?: string;
  billingAddress?: string;
  paymentTerms?: string;
  notes?: string;
}

export interface FilterParams {
  status?: string;
  salesRep?: string;
  fromDate?: string;
  toDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  opportunityId?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface SalesOrdersResponse {
  data: SalesOrder[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats?: SalesOrderStats;
}

export interface SalesOrderStats {
  total: number;
  byStatus: Array<{
    _id: string;
    count: number;
    totalRevenue: number;
  }>;
  byMonth: Array<{
    _id: {
      year: number;
      month: number;
    };
    count: number;
    totalRevenue: number;
    avgOrderValue: number;
  }>;
  revenueSummary: {
    totalRevenue: number;
    totalTax: number;
    totalShipping: number;
    totalDiscount: number;
    avgOrderValue: number;
    maxOrderValue: number;
    minOrderValue: number;
  };
  bySalesRep?: Array<{
    _id: string;
    count: number;
    totalRevenue: number;
    avgOrderValue: number;
  }>;
}

class SalesOrderService {
  async getAllSalesOrders(params?: FilterParams): Promise<SalesOrdersResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const endpoint = `/salesorder${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiClient.get<any>(endpoint);
      
      return {
        data: response.data || response,
        pagination: response.pagination,
        stats: response.stats
      };
    } catch (error) {
      console.error('Error fetching sales orders:', error);
      throw error;
    }
  }

  async getSalesOrderById(id: string): Promise<SalesOrder> {
    try {
      return await apiClient.get<SalesOrder>(`/salesorder/${id}`);
    } catch (error) {
      console.error(`Error fetching sales order ${id}:`, error);
      throw error;
    }
  }

  async getSalesOrdersByOpportunity(opportunityId: string): Promise<SalesOrdersResponse> {
    try {
      const response = await apiClient.get<any>(`/salesorder/opportunity/${opportunityId}`);
      return {
        data: response.data || response,
        pagination: undefined,
        stats: undefined
      };
    } catch (error) {
      console.error(`Error fetching sales orders for opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  async createSalesOrder(data: CreateSalesOrderData): Promise<SalesOrder> {
    try {
      const formattedData = {
        opportunityId: data.opportunityId,
        quoteId: data.quoteId,
        invoiceId: data.invoiceId,
        status: data.status || 'draft',
        salesRep: data.salesRep,
        orderDate: data.orderDate || new Date().toISOString(),
        estimatedDeliveryDate: data.estimatedDeliveryDate,
        subtotal: data.subtotal,
        tax: data.tax || 0,
        shipping: data.shipping || 0,
        discount: data.discount || 0,
        totalAmount: data.totalAmount,
        shippingAddress: data.shippingAddress,
        billingAddress: data.billingAddress,
        paymentTerms: data.paymentTerms || 'Net 30',
        notes: data.notes
      };

      console.log('Creating sales order with data:', JSON.stringify(formattedData, null, 2));
      
      return await apiClient.post<any, SalesOrder>('/salesorder', formattedData);
    } catch (error) {
      console.error('Error creating sales order:', error);
      throw error;
    }
  }

  async updateSalesOrder(id: string, data: UpdateSalesOrderData): Promise<SalesOrder> {
    try {
      return await apiClient.patch<UpdateSalesOrderData, SalesOrder>(`/salesorder/${id}`, data);
    } catch (error) {
      console.error(`Error updating sales order ${id}:`, error);
      throw error;
    }
  }

  async deleteSalesOrder(id: string): Promise<void> {
    try {
      await apiClient.delete(`/salesorder/${id}`);
    } catch (error) {
      console.error(`Error deleting sales order ${id}:`, error);
      throw error;
    }
  }

  async updateSalesOrderStatus(id: string, status: string): Promise<SalesOrder> {
    try {
      return await apiClient.patch<any, SalesOrder>(`/salesorder/${id}/status/${status}`, {});
    } catch (error) {
      console.error(`Error updating sales order status ${id}:`, error);
      throw error;
    }
  }

  async getSalesOrderStats(): Promise<SalesOrderStats> {
    try {
      return await apiClient.get<SalesOrderStats>('/salesorder/stats/summary');
    } catch (error) {
      console.error('Error fetching sales order stats:', error);
      throw error;
    }
  }

  async getRecentSalesOrders(limit: number = 10): Promise<SalesOrdersResponse> {
    try {
      const response = await apiClient.get<any>(`/salesorder/recent?limit=${limit}`);
      return {
        data: response.data || response,
        pagination: undefined,
        stats: undefined
      };
    } catch (error) {
      console.error('Error fetching recent sales orders:', error);
      throw error;
    }
  }

  async attachInvoiceToSalesOrder(salesOrderId: string, invoiceId: string): Promise<SalesOrder> {
    try {
      return await apiClient.post<any, SalesOrder>(`/salesorder/${salesOrderId}/attach-invoice/${invoiceId}`, {});
    } catch (error) {
      console.error(`Error attaching invoice to sales order ${salesOrderId}:`, error);
      throw error;
    }
  }

  // Utility methods for UI
  getStatusColor(status: string): string {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'draft': return '📝';
      case 'confirmed': return '✅';
      case 'processing': return '⚙️';
      case 'shipped': return '🚚';
      case 'delivered': return '📦';
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
}

export const salesOrderService = new SalesOrderService();