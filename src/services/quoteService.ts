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
  totalAmount: number;
  notes?: string;
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
}

class QuoteService {
  async createQuote(data: CreateQuoteData): Promise<Quote> {
    try {
      const processedData = {
        ...data,
        items: data.items.map(item => ({
          ...item,
          total: item.quantity * item.unitPrice
        }))
      };
      
      return await apiClient.post<typeof processedData, Quote>('/quotes', processedData);
    } catch (error) {
      console.error('Error creating quote:', error);
      throw error;
    }
  }

  async getAllQuotes(params?: QuoteFilterParams): Promise<Quote[]> {
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
      
      return await apiClient.get<Quote[]>(endpoint);
    } catch (error) {
      console.error('Error fetching quotes:', error);
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

  async updateQuote(id: string, data: Partial<Quote>): Promise<Quote> {
    try {
      return await apiClient.patch<Partial<Quote>, Quote>(`/quotes/${id}`, data);
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
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      return `Q-${year}${month}${day}-${random}`;
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

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2
    }).format(amount);
  }

  calculateItemTotal(quantity: number, unitPrice: number, taxRate: number = 0, discount: number = 0): number {
    const subtotal = quantity * unitPrice;
    const discountAmount = subtotal * (discount / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (taxRate / 100);
    return afterDiscount + taxAmount;
  }
}

export const quoteService = new QuoteService();