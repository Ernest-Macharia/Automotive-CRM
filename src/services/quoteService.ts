import { apiClient } from '@/lib/api/client';

export interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  id?: string;
  sku?: string;
  taxRate?: number;
  discount?: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  opportunityId: string;
  vehicleId?: string;
  customerId?: string;
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'expired';
  notes?: string;
  terms?: string;
  validUntil?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  metadata?: Record<string, any>;
}

export interface CreateQuoteData {
  quoteNumber?: string;
  opportunityId: string;
  vehicleId?: string;
  items: Omit<QuoteItem, 'id' | 'total'>[];
  subtotal?: number;
  tax?: number;
  totalAmount: number;
  notes?: string;
  terms?: string;
  validUntil?: string;
  status?: 'draft' | 'pending';
}

export interface UpdateQuoteData {
  items?: QuoteItem[];
  subtotal?: number;
  tax?: number;
  totalAmount?: number;
  notes?: string;
  terms?: string;
  validUntil?: string;
  status?: 'draft' | 'pending' | 'approved' | 'rejected' | 'expired';
  rejectionReason?: string;
}

export interface QuoteFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  opportunityId?: string;
  fromDate?: string;
  toDate?: string;
  sort?: string;
  customerId?: string;
}

export interface QuotesResponse {
  data: Quote[];
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
    averageAmount: number;
    pendingApproval: number;
  };
}

class QuoteService {
  async createQuote(data: CreateQuoteData): Promise<Quote> {
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
        status: data.status || 'draft'
      };

      return await apiClient.post<typeof processedData, Quote>('/quotes', processedData);
    } catch (error) {
      console.error('Error creating quote:', error);
      throw error;
    }
  }

  async getQuoteById(id: string): Promise<Quote> {
    try {
      return await apiClient.get<Quote>(`/quotes/${id}`);
    } catch (error) {
      console.error(`Error fetching quote ${id}:`, error);
      throw error;
    }
  }

  async updateQuote(id: string, data: UpdateQuoteData): Promise<Quote> {
    try {
      return await apiClient.patch<UpdateQuoteData, Quote>(`/quotes/${id}`, data);
    } catch (error) {
      console.error(`Error updating quote ${id}:`, error);
      throw error;
    }
  }

  async deleteQuote(id: string): Promise<{ message: string }> {
    try {
      return await apiClient.delete<{ message: string }>(`/quotes/${id}`);
    } catch (error) {
      console.error(`Error deleting quote ${id}:`, error);
      throw error;
    }
  }

  async approveQuote(id: string): Promise<Quote> {
    try {
      return await apiClient.patch<object, Quote>(`/quotes/${id}/approve`, {});
    } catch (error) {
      console.error(`Error approving quote ${id}:`, error);
      throw error;
    }
  }

  async getAllQuotes(params?: QuoteFilterParams): Promise<QuotesResponse> {
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
      const endpoint = `/quotes${queryString ? `?${queryString}` : ''}`;
      
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
      console.error('Error fetching quotes:', error);
      throw error;
    }
  }

  async getQuotesByPage(page: number, limit: number = 10, filters?: Omit<QuoteFilterParams, 'page' | 'limit'>): Promise<QuotesResponse> {
    try {
      const params: QuoteFilterParams = {
        page,
        limit,
        ...filters
      };
      return await this.getAllQuotes(params);
    } catch (error) {
      console.error(`Error fetching quotes for page ${page}:`, error);
      throw error;
    }
  }

  async searchQuotes(query: string, page?: number, limit?: number): Promise<QuotesResponse> {
    try {
      const params: QuoteFilterParams = {
        search: query,
        page,
        limit
      };
      return await this.getAllQuotes(params);
    } catch (error) {
      console.error('Error searching quotes:', error);
      throw error;
    }
  }

  async getQuotesByStatus(status: string, page?: number, limit?: number): Promise<QuotesResponse> {
    try {
      const params: QuoteFilterParams = {
        status,
        page,
        limit
      };
      return await this.getAllQuotes(params);
    } catch (error) {
      console.error(`Error fetching quotes by status ${status}:`, error);
      throw error;
    }
  }

  async getQuotesByOpportunity(opportunityId: string, page?: number, limit?: number): Promise<QuotesResponse> {
    try {
      const params: QuoteFilterParams = {
        opportunityId,
        page,
        limit
      };
      return await this.getAllQuotes(params);
    } catch (error) {
      console.error(`Error fetching quotes for opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  async getQuoteStats(): Promise<any> {
    try {
      return await apiClient.get('/quotes/stats');
    } catch (error) {
      console.error('Error fetching quote stats:', error);
      throw error;
    }
  }

  async generateQuoteNumber(): Promise<string> {
    try {
      const response = await apiClient.get<{ nextNumber: string }>('/quotes/generate-number');
      return response.nextNumber;
    } catch (error) {
      console.error('Error generating quote number:', error);
      // Fallback to timestamp-based number
      const date = new Date();
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `Q-${year}${month}${day}-001`;
    }
  }

  async exportQuoteToPDF(id: string): Promise<Blob> {
    try {
      return await apiClient.get<Blob>(`/quotes/${id}/export/pdf`, {
        responseType: 'blob'
      });
    } catch (error) {
      console.error(`Error exporting quote ${id} to PDF:`, error);
      throw error;
    }
  }

  async sendQuoteEmail(id: string, emailData: { to: string; subject?: string; message?: string }): Promise<{ message: string }> {
    try {
      return await apiClient.post<typeof emailData, { message: string }>(
        `/quotes/${id}/send-email`,
        emailData
      );
    } catch (error) {
      console.error(`Error sending quote email ${id}:`, error);
      throw error;
    }
  }

  // Build filter query for UI components
  buildQuoteFilterQuery(params: QuoteFilterParams): string {
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
      const stats = await this.getQuoteStats();
      
      return {
        statuses: ['draft', 'pending', 'approved', 'rejected', 'expired'],
        stats,
      };
    } catch (error) {
      console.error('Error fetching filter options:', error);
      return {
        statuses: ['draft', 'pending', 'approved', 'rejected', 'expired'],
        stats: null,
      };
    }
  }

  // Calculate item total
  calculateItemTotal(quantity: number, unitPrice: number, taxRate: number = 0, discount: number = 0): number {
    const subtotal = quantity * unitPrice;
    const discountAmount = subtotal * (discount / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (taxRate / 100);
    return afterDiscount + taxAmount;
  }

  // Format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2
    }).format(amount);
  }
}

export const quoteService = new QuoteService();