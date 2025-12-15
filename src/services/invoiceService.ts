import { apiClient } from '@/lib/api/client';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  id?: string;
  sku?: string;
  taxRate?: number;
  discount?: number;
}

export interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'mobile_money' | 'cheque';
  reference: string;
  notes?: string;
  receivedBy?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  opportunityId: string;
  quoteId?: string;
  customerId?: string;
  vehicleId?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  paymentStatus: 'draft' | 'pending' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  issueDate: string;
  notes?: string;
  terms?: string;
  payments: Payment[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  metadata?: Record<string, any>;
}

export interface CreateInvoiceData {
  opportunityId: string;
  quoteId?: string;
  items: Omit<InvoiceItem, 'id' | 'total'>[];
  subtotal?: number;
  tax?: number;
  total: number;
  dueDate?: string;
  notes?: string;
  terms?: string;
  paymentStatus?: 'draft' | 'pending';
}

export interface UpdateInvoiceData {
  items?: InvoiceItem[];
  subtotal?: number;
  tax?: number;
  totalAmount?: number;
  dueDate?: string;
  notes?: string;
  terms?: string;
  paymentStatus?: 'draft' | 'pending' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
}

export interface AddPaymentData {
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'mobile_money' | 'cheque';
  reference: string;
  notes?: string;
}

export interface InvoiceFilterParams {
  page?: number;
  limit?: number;
  paymentStatus?: string;
  search?: string;
  opportunityId?: string;
  quoteId?: string;
  customerId?: string;
  fromDate?: string;
  toDate?: string;
  sort?: string;
  overdue?: boolean;
}

export interface InvoicesResponse {
  data: Invoice[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats?: {
    total: number;
    byStatus: Record<string, number>;
    totalAmount: number;
    paidAmount: number;
    outstandingAmount: number;
    overdueAmount: number;
    averageInvoice: number;
  };
}

class InvoiceService {
  async createInvoice(data: CreateInvoiceData): Promise<Invoice> {
    try {
      // Calculate totals if not provided
      const processedData = {
        ...data,
        items: data.items.map(item => ({
          ...item,
          total: item.quantity * item.unitPrice
        })),
        subtotal: data.subtotal || data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
        tax: data.tax || 0,
        totalAmount: data.total,
        paymentStatus: data.paymentStatus || 'draft',
        dueDate: data.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        issueDate: new Date().toISOString()
      };

      return await apiClient.post<typeof processedData, Invoice>('/invoices', processedData);
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  async getInvoiceById(id: string): Promise<Invoice> {
    try {
      return await apiClient.get<Invoice>(`/invoices/${id}`);
    } catch (error) {
      console.error(`Error fetching invoice ${id}:`, error);
      throw error;
    }
  }

  async updateInvoice(id: string, data: UpdateInvoiceData): Promise<Invoice> {
    try {
      return await apiClient.patch<UpdateInvoiceData, Invoice>(`/invoices/${id}`, data);
    } catch (error) {
      console.error(`Error updating invoice ${id}:`, error);
      throw error;
    }
  }

  async deleteInvoice(id: string): Promise<{ message: string }> {
    try {
      return await apiClient.delete<{ message: string }>(`/invoices/${id}`);
    } catch (error) {
      console.error(`Error deleting invoice ${id}:`, error);
      throw error;
    }
  }

  async getAllInvoices(params?: InvoiceFilterParams): Promise<InvoicesResponse> {
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
      const endpoint = `/invoices${queryString ? `?${queryString}` : ''}`;
      
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
      console.error('Error fetching invoices:', error);
      throw error;
    }
  }

  async getInvoicesByPage(page: number, limit: number = 10, filters?: Omit<InvoiceFilterParams, 'page' | 'limit'>): Promise<InvoicesResponse> {
    try {
      const params: InvoiceFilterParams = {
        page,
        limit,
        ...filters
      };
      return await this.getAllInvoices(params);
    } catch (error) {
      console.error(`Error fetching invoices for page ${page}:`, error);
      throw error;
    }
  }

  async searchInvoices(query: string, page?: number, limit?: number): Promise<InvoicesResponse> {
    try {
      const params: InvoiceFilterParams = {
        search: query,
        page,
        limit
      };
      return await this.getAllInvoices(params);
    } catch (error) {
      console.error('Error searching invoices:', error);
      throw error;
    }
  }

  async getInvoicesByStatus(status: string, page?: number, limit?: number): Promise<InvoicesResponse> {
    try {
      const params: InvoiceFilterParams = {
        paymentStatus: status,
        page,
        limit
      };
      return await this.getAllInvoices(params);
    } catch (error) {
      console.error(`Error fetching invoices by status ${status}:`, error);
      throw error;
    }
  }

  async getInvoicesByOpportunity(opportunityId: string, page?: number, limit?: number): Promise<InvoicesResponse> {
    try {
      const params: InvoiceFilterParams = {
        opportunityId,
        page,
        limit
      };
      return await this.getAllInvoices(params);
    } catch (error) {
      console.error(`Error fetching invoices for opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  async getOverdueInvoices(page?: number, limit?: number): Promise<InvoicesResponse> {
    try {
      const params: InvoiceFilterParams = {
        overdue: true,
        page,
        limit,
        sort: 'dueDate:asc'
      };
      return await this.getAllInvoices(params);
    } catch (error) {
      console.error('Error fetching overdue invoices:', error);
      throw error;
    }
  }

  async addPayment(invoiceId: string, data: AddPaymentData): Promise<Invoice> {
    try {
      return await apiClient.post<AddPaymentData, Invoice>(`/invoices/${invoiceId}/payments`, data);
    } catch (error) {
      console.error(`Error adding payment to invoice ${invoiceId}:`, error);
      throw error;
    }
  }

  async getInvoiceStats(): Promise<any> {
    try {
      return await apiClient.get('/invoices/stats');
    } catch (error) {
      console.error('Error fetching invoice stats:', error);
      throw error;
    }
  }

  async generateInvoiceNumber(): Promise<string> {
    try {
      const response = await apiClient.get<{ nextNumber: string }>('/invoices/generate-number');
      return response.nextNumber;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      // Fallback to timestamp-based number
      const date = new Date();
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `INV-${year}${month}${day}-001`;
    }
  }

  async exportInvoiceToPDF(id: string): Promise<Blob> {
    try {
      return await apiClient.get<Blob>(`/invoices/${id}/export/pdf`, {
        responseType: 'blob'
      });
    } catch (error) {
      console.error(`Error exporting invoice ${id} to PDF:`, error);
      throw error;
    }
  }

  async sendInvoiceEmail(id: string, emailData: { to: string; subject?: string; message?: string }): Promise<{ message: string }> {
    try {
      return await apiClient.post<typeof emailData, { message: string }>(
        `/invoices/${id}/send-email`,
        emailData
      );
    } catch (error) {
      console.error(`Error sending invoice email ${id}:`, error);
      throw error;
    }
  }

  async createInvoiceFromQuote(quoteId: string, data?: Partial<CreateInvoiceData>): Promise<Invoice> {
    try {
      return await apiClient.post<{ quoteId: string; data?: Partial<CreateInvoiceData> }, Invoice>(
        '/invoices/from-quote',
        { quoteId, data }
      );
    } catch (error) {
      console.error(`Error creating invoice from quote ${quoteId}:`, error);
      throw error;
    }
  }

  // Calculate overdue status
  isOverdue(dueDate: string): boolean {
    return new Date(dueDate) < new Date();
  }

  // Calculate days until due
  daysUntilDue(dueDate: string): number {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Build filter query for UI components
  buildInvoiceFilterQuery(params: InvoiceFilterParams): string {
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
      const stats = await this.getInvoiceStats();
      
      return {
        statuses: ['draft', 'pending', 'partially_paid', 'paid', 'overdue', 'cancelled'],
        paymentMethods: ['cash', 'card', 'bank_transfer', 'mobile_money', 'cheque'],
        stats,
      };
    } catch (error) {
      console.error('Error fetching filter options:', error);
      return {
        statuses: ['draft', 'pending', 'partially_paid', 'paid', 'overdue', 'cancelled'],
        paymentMethods: ['cash', 'card', 'bank_transfer', 'mobile_money', 'cheque'],
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
      day: 'numeric'
    });
  }
}

export const invoiceService = new InvoiceService();