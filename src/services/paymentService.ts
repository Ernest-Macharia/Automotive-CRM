import { apiClient } from '@/lib/api/client';

export interface Payment {
  id: string;
  receiptNumber: string;
  invoiceId: string;
  amountPaid: number;
  method: 'cash' | 'card' | 'bank_transfer' | 'mobile_money' | 'cheque';
  referenceNumber: string;
  notes?: string;
  balanceRemaining: number;
  paymentDate: string;
  recordedBy?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentData {
  receiptNumber?: string;
  invoiceId: string;
  amountPaid: number;
  method: 'cash' | 'card' | 'bank_transfer' | 'mobile_money' | 'cheque';
  referenceNumber: string;
  notes?: string;
  paymentDate?: string;
}

export interface UpdatePaymentData {
  amountPaid?: number;
  method?: 'cash' | 'card' | 'bank_transfer' | 'mobile_money' | 'cheque';
  referenceNumber?: string;
  notes?: string;
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
}

export interface PaymentFilterParams {
  page?: number;
  limit?: number;
  method?: string;
  status?: string;
  search?: string;
  invoiceId?: string;
  fromDate?: string;
  toDate?: string;
  sort?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface PaymentsResponse {
  data: Payment[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats?: {
    total: number;
    totalAmount: number;
    byMethod: Record<string, number>;
    byStatus: Record<string, number>;
    todayAmount: number;
    averagePayment: number;
  };
}

export interface PesapalInitiatePaymentData {
  amount: number;
  currency?: string;
  description?: string;
  callbackUrl?: string;
  cancellationUrl?: string;
  notificationId?: string;
  [key: string]: any;
}

class PaymentService {
  async createPayment(data: CreatePaymentData): Promise<Payment> {
    try {
      const processedData = {
        ...data,
        receiptNumber: data.receiptNumber || await this.generateReceiptNumber(),
        paymentDate: data.paymentDate || new Date().toISOString(),
      };

      return await apiClient.post<typeof processedData, Payment>('/payments', processedData);
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  async getPaymentById(id: string): Promise<Payment> {
    try {
      return await apiClient.get<Payment>(`/payments/${id}`);
    } catch (error) {
      console.error(`Error fetching payment ${id}:`, error);
      throw error;
    }
  }

  async updatePayment(id: string, data: UpdatePaymentData): Promise<Payment> {
    try {
      return await apiClient.patch<UpdatePaymentData, Payment>(`/payments/${id}`, data);
    } catch (error) {
      console.error(`Error updating payment ${id}:`, error);
      throw error;
    }
  }

  async deletePayment(id: string): Promise<{ message: string }> {
    try {
      return await apiClient.delete<{ message: string }>(`/payments/${id}`);
    } catch (error) {
      console.error(`Error deleting payment ${id}:`, error);
      throw error;
    }
  }

  async getAllPayments(params?: PaymentFilterParams): Promise<PaymentsResponse> {
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
      const endpoint = `/payments${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get<any>(endpoint);

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
      
      return {
        data: response.data || response,
        pagination: response.pagination,
        stats: response.stats
      };
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  }

  async getPaymentsByPage(page: number, limit: number = 10, filters?: Omit<PaymentFilterParams, 'page' | 'limit'>): Promise<PaymentsResponse> {
    try {
      const params: PaymentFilterParams = {
        page,
        limit,
        ...filters
      };
      return await this.getAllPayments(params);
    } catch (error) {
      console.error(`Error fetching payments for page ${page}:`, error);
      throw error;
    }
  }

  async searchPayments(query: string, page?: number, limit?: number): Promise<PaymentsResponse> {
    try {
      const params: PaymentFilterParams = {
        search: query,
        page,
        limit
      };
      return await this.getAllPayments(params);
    } catch (error) {
      console.error('Error searching payments:', error);
      throw error;
    }
  }

  async getPaymentsByMethod(method: string, page?: number, limit?: number): Promise<PaymentsResponse> {
    try {
      const params: PaymentFilterParams = {
        method,
        page,
        limit
      };
      return await this.getAllPayments(params);
    } catch (error) {
      console.error(`Error fetching payments by method ${method}:`, error);
      throw error;
    }
  }

  async getPaymentsByStatus(status: string, page?: number, limit?: number): Promise<PaymentsResponse> {
    try {
      const params: PaymentFilterParams = {
        status,
        page,
        limit
      };
      return await this.getAllPayments(params);
    } catch (error) {
      console.error(`Error fetching payments by status ${status}:`, error);
      throw error;
    }
  }

  async getPaymentsByInvoice(invoiceId: string, page?: number, limit?: number): Promise<PaymentsResponse> {
    try {
      const params: PaymentFilterParams = {
        invoiceId,
        page,
        limit
      };
      return await this.getAllPayments(params);
    } catch (error) {
      console.error(`Error fetching payments for invoice ${invoiceId}:`, error);
      throw error;
    }
  }

  async getTodayPayments(): Promise<PaymentsResponse> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const params: PaymentFilterParams = {
        fromDate: today,
        toDate: today
      };
      return await this.getAllPayments(params);
    } catch (error) {
      console.error('Error fetching today\'s payments:', error);
      throw error;
    }
  }

  async getPaymentStats(): Promise<any> {
    try {
      return await apiClient.get('/payments/stats');
    } catch (error) {
      console.error('Error fetching payment stats:', error);
      throw error;
    }
  }

  async initiatePesapalPayment(data: PesapalInitiatePaymentData): Promise<any> {
    try {
      return await apiClient.post<PesapalInitiatePaymentData, any>('/payments/pesapal/initiate', data);
    } catch (error) {
      console.error('Error initiating Pesapal payment:', error);
      throw error;
    }
  }

  async initiatePesapalMpesaQuotePayment(quoteId: string, data: Record<string, any> = {}): Promise<any> {
    try {
      return await apiClient.post<Record<string, any>, any>(
        `/payments/pesapal/mpesa/quote/${quoteId}`,
        data
      );
    } catch (error) {
      console.error(`Error initiating Pesapal M-Pesa payment for quote ${quoteId}:`, error);
      throw error;
    }
  }

  async getPesapalPaymentStatus(orderTrackingId: string): Promise<any> {
    try {
      return await apiClient.get<any>(`/payments/pesapal/status/${orderTrackingId}`);
    } catch (error) {
      console.error(`Error fetching Pesapal payment status ${orderTrackingId}:`, error);
      throw error;
    }
  }

  async generateReceiptNumber(): Promise<string> {
    try {
      const response = await apiClient.get<{ nextNumber: string }>('/payments/generate-receipt');
      return response.nextNumber;
    } catch (error) {
      console.error('Error generating receipt number:', error);
      // Fallback to timestamp-based number
      const date = new Date();
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `RCPT-${year}${month}${day}-001`;
    }
  }

  async exportPaymentToPDF(id: string): Promise<Blob> {
    try {
      return await apiClient.get<Blob>(`/payments/${id}/export/receipt`, {
        responseType: 'blob'
      });
    } catch (error) {
      console.error(`Error exporting payment receipt ${id}:`, error);
      throw error;
    }
  }

  async reconcilePayment(id: string): Promise<Payment> {
    try {
      return await apiClient.post<any, Payment>(`/payments/${id}/reconcile`, {});
    } catch (error) {
      console.error(`Error reconciling payment ${id}:`, error);
      throw error;
    }
  }

  async refundPayment(id: string, refundData: { amount: number; reason: string }): Promise<Payment> {
    try {
      return await apiClient.post<typeof refundData, Payment>(`/payments/${id}/refund`, refundData);
    } catch (error) {
      console.error(`Error refunding payment ${id}:`, error);
      throw error;
    }
  }

  // Build filter query for UI components
  buildPaymentFilterQuery(params: PaymentFilterParams): string {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    return queryParams.toString();
  }

  // Get filter options (for UI dropdowns)
  async getFilterOptions() {
    try {
      const stats = await this.getPaymentStats();
      
      return {
        methods: ['cash', 'card', 'bank_transfer', 'mobile_money', 'cheque'],
        statuses: ['pending', 'completed', 'failed', 'refunded'],
        stats,
      };
    } catch (error) {
      console.error('Error fetching filter options:', error);
      return {
        methods: ['cash', 'card', 'bank_transfer', 'mobile_money', 'cheque'],
        statuses: ['pending', 'completed', 'failed', 'refunded'],
        stats: null,
      };
    }
  }

  // Format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2
    }).format(amount);
  }

  // Format date
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Get payment method color
  getMethodColor(method: string): string {
    switch (method) {
      case 'mobile_money':
        return 'bg-yellow-100 text-yellow-800';
      case 'card':
        return 'bg-blue-100 text-blue-800';
      case 'bank_transfer':
        return 'bg-green-100 text-green-800';
      case 'cash':
        return 'bg-gray-100 text-gray-800';
      case 'cheque':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // Get status color
  getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // Format method name
  formatMethodName(method: string): string {
    return method
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Format status name
  formatStatusName(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

export const paymentService = new PaymentService();
