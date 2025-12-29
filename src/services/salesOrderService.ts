// src/services/salesOrderService.ts
import { apiClient } from '@/lib/api/client';

export interface SalesOrder {
  _id?: string;
  id?: string;
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
  invoiceId?: string | {
    _id: string;
    invoiceNumber?: string;
    totalAmount?: number;
    status?: string;
  };
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
  lineItems?: Array<{
    productId?: string;
    productName: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
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
  subtotal?: number;
  tax?: number;
  shipping?: number;
  discount?: number;
  totalAmount?: number;
  salesOrderNumber?: string;
  shippingAddress?: string;
  billingAddress?: string;
  paymentTerms?: string;
  notes?: string;
  lineItems?: Array<{
    productId?: string;
    productName: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

export interface UpdateSalesOrderData {
  status?: 'draft' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  salesRep?: string;
  quoteId?: string;
  invoiceId?: string;
  orderDate?: string;
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
  lineItems?: Array<{
    productId?: string;
    productName: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

export interface SalesOrderFilterParams {
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

class SalesOrderService {
  private basePath = '/salesorder';

  // POST /api/v1/salesorder - Create a new sales order
  async createSalesOrder(data: CreateSalesOrderData): Promise<SalesOrder> {
    try {
      // Ensure required fields are present
      if (!data.opportunityId) {
        throw new Error('Opportunity ID is required');
      }
      if (!data.quoteId) {
        throw new Error('Quote ID is required');
      }

      return await apiClient.post<CreateSalesOrderData, SalesOrder>(this.basePath, data);
    } catch (error) {
      console.error('Error creating sales order:', error);
      throw error;
    }
  }

  // GET /api/v1/salesorder - Get all sales orders with optional filtering
  async getAllSalesOrders(params?: SalesOrderFilterParams): Promise<SalesOrder[]> {
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
      return await apiClient.get<SalesOrder[]>(endpoint);
    } catch (error) {
      console.error('Error fetching sales orders:', error);
      throw error;
    }
  }

  // GET /api/v1/salesorder/opportunity/{opportunityId} - Get sales orders by opportunity
  async getSalesOrdersByOpportunity(opportunityId: string): Promise<SalesOrder[]> {
    try {
      return await apiClient.get<SalesOrder[]>(`${this.basePath}/opportunity/${opportunityId}`);
    } catch (error) {
      console.error(`Error fetching sales orders for opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  // GET /api/v1/salesorder/recent - Get recent sales orders
  async getRecentSalesOrders(limit?: number): Promise<SalesOrder[]> {
    try {
      const endpoint = `${this.basePath}/recent${limit !== undefined ? `?limit=${limit}` : ''}`;
      return await apiClient.get<SalesOrder[]>(endpoint);
    } catch (error) {
      console.error('Error fetching recent sales orders:', error);
      throw error;
    }
  }

  // GET /api/v1/salesorder/{id} - Get a sales order by ID
  async getSalesOrderById(id: string): Promise<SalesOrder> {
    try {
      return await apiClient.get<SalesOrder>(`${this.basePath}/${id}`);
    } catch (error) {
      console.error(`Error fetching sales order ${id}:`, error);
      throw error;
    }
  }

  // PATCH /api/v1/salesorder/{id} - Update a sales order
  async updateSalesOrder(id: string, data: UpdateSalesOrderData): Promise<SalesOrder> {
    try {
      return await apiClient.patch<UpdateSalesOrderData, SalesOrder>(`${this.basePath}/${id}`, data);
    } catch (error) {
      console.error(`Error updating sales order ${id}:`, error);
      throw error;
    }
  }

  // DELETE /api/v1/salesorder/{id} - Delete a sales order (soft delete)
  async deleteSalesOrder(id: string): Promise<{ message: string }> {
    try {
      return await apiClient.delete<{ message: string }>(`${this.basePath}/${id}`);
    } catch (error) {
      console.error(`Error deleting sales order ${id}:`, error);
      throw error;
    }
  }

  // PATCH /api/v1/salesorder/{id}/status/{status} - Update sales order status
  async updateSalesOrderStatus(id: string, status: string): Promise<SalesOrder> {
    try {
      return await apiClient.patch<any, SalesOrder>(
        `${this.basePath}/${id}/status/${status}`,
        {}
      );
    } catch (error) {
      console.error(`Error updating sales order status ${id}:`, error);
      throw error;
    }
  }

  // POST /api/v1/salesorder/{id}/attach-invoice/{invoiceId} - Attach invoice to sales order
  async attachInvoiceToSalesOrder(salesOrderId: string, invoiceId: string): Promise<SalesOrder> {
    try {
      return await apiClient.post<any, SalesOrder>(
        `${this.basePath}/${salesOrderId}/attach-invoice/${invoiceId}`,
        {}
      );
    } catch (error) {
      console.error(`Error attaching invoice to sales order ${salesOrderId}:`, error);
      throw error;
    }
  }

  // GET /api/v1/salesorder/stats/summary - Get sales order statistics
  async getSalesOrderStats(): Promise<SalesOrderStats> {
    try {
      return await apiClient.get<SalesOrderStats>(`${this.basePath}/stats/summary`);
    } catch (error) {
      console.error('Error fetching sales order stats:', error);
      throw error;
    }
  }

  // Utility methods for UI
  getStatusColor(status: string): string {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status.toLowerCase()) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusIcon(status?: string): string {
    if (!status) return '📝';
    switch (status.toLowerCase()) {
      case 'draft': return '📝';
      case 'confirmed': return '✅';
      case 'processing': return '⚙️';
      case 'shipped': return '🚚';
      case 'delivered': return '📦';
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

  getDaysRemaining(deliveryDate?: string): number {
    if (!deliveryDate) return 0;
    const due = new Date(deliveryDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isDeliveryOverdue(deliveryDate?: string): boolean {
    if (!deliveryDate) return false;
    return this.getDaysRemaining(deliveryDate) < 0;
  }

  getOrderProgress(status: string): number {
    switch (status) {
      case 'draft': return 0;
      case 'confirmed': return 20;
      case 'processing': return 40;
      case 'shipped': return 60;
      case 'delivered': return 100;
      case 'cancelled': return 0;
      default: return 0;
    }
  }

  getNextStatus(currentStatus: string): string | null {
    switch (currentStatus) {
      case 'draft': return 'confirmed';
      case 'confirmed': return 'processing';
      case 'processing': return 'shipped';
      case 'shipped': return 'delivered';
      default: return null;
    }
  }

  canChangeStatus(currentStatus: string, newStatus: string): boolean {
    const allowedTransitions: Record<string, string[]> = {
      'draft': ['confirmed', 'cancelled'],
      'confirmed': ['processing', 'cancelled'],
      'processing': ['shipped', 'cancelled'],
      'shipped': ['delivered'],
      'delivered': [],
      'cancelled': []
    };

    return allowedTransitions[currentStatus]?.includes(newStatus) || false;
  }

  // Get customer name from sales order
  getCustomerName(salesOrder: SalesOrder): string {
    if (typeof salesOrder.opportunityId === 'object' && salesOrder.opportunityId.customer) {
      return salesOrder.opportunityId.customer.name;
    }
    return 'Unknown Customer';
  }

  // Get customer email from sales order
  getCustomerEmail(salesOrder: SalesOrder): string | undefined {
    if (typeof salesOrder.opportunityId === 'object' && salesOrder.opportunityId.customer) {
      return salesOrder.opportunityId.customer.email;
    }
    return undefined;
  }

  // Get sales rep name
  getSalesRepName(salesOrder: SalesOrder): string {
    if (typeof salesOrder.salesRep === 'object') {
      return `${salesOrder.salesRep.firstName} ${salesOrder.salesRep.lastName}`;
    }
    return 'Unknown Sales Rep';
  }

  // Calculate total with all adjustments
  calculateTotal(data: {
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
  }): number {
    return data.subtotal + data.tax + data.shipping - data.discount;
  }

  // Get available statuses
  getAvailableStatuses(): Array<{ value: string; label: string }> {
    return [
      { value: 'draft', label: 'Draft' },
      { value: 'confirmed', label: 'Confirmed' },
      { value: 'processing', label: 'Processing' },
      { value: 'shipped', label: 'Shipped' },
      { value: 'delivered', label: 'Delivered' },
      { value: 'cancelled', label: 'Cancelled' }
    ];
  }

  // Get status label
  getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      'draft': 'Draft',
      'confirmed': 'Confirmed',
      'processing': 'Processing',
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  }

  // Validate sales order data
  validateSalesOrderData(data: Partial<CreateSalesOrderData>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.opportunityId) {
      errors.push('Opportunity ID is required');
    }

    if (!data.quoteId) {
      errors.push('Quote ID is required');
    }

    if (data.totalAmount !== undefined && data.totalAmount < 0) {
      errors.push('Total amount cannot be negative');
    }

    if (data.tax !== undefined && data.tax < 0) {
      errors.push('Tax cannot be negative');
    }

    if (data.shipping !== undefined && data.shipping < 0) {
      errors.push('Shipping cannot be negative');
    }

    if (data.discount !== undefined && data.discount < 0) {
      errors.push('Discount cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Generate sales order number (frontend fallback)
  generateSalesOrderNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `SO-${timestamp}-${random.toString().padStart(3, '0')}`;
  }

  // Calculate order age in days
  getOrderAge(orderDate: string): number {
    const order = new Date(orderDate);
    const now = new Date();
    const diffTime = now.getTime() - order.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  // Check if order is recent (within 7 days)
  isRecentOrder(orderDate: string): boolean {
    return this.getOrderAge(orderDate) <= 7;
  }

  // Get line items total
  getLineItemsTotal(lineItems?: Array<{ total: number }>): number {
    if (!lineItems || lineItems.length === 0) return 0;
    return lineItems.reduce((sum, item) => sum + (item.total || 0), 0);
  }

  // Calculate totals from line items
  calculateTotalsFromLineItems(lineItems: Array<{ quantity: number; unitPrice: number }>) {
    const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const tax = subtotal * 0.16; // Assuming 16% VAT
    const shipping = subtotal > 10000 ? 0 : 500; // Free shipping over 10,000
    const discount = 0; // Could add discount logic
    const totalAmount = subtotal + tax + shipping - discount;

    return {
      subtotal,
      tax,
      shipping,
      discount,
      totalAmount
    };
  }
}

export const salesOrderService = new SalesOrderService();