import { apiClient } from '@/lib/api/client';
import { Quote, QuoteItem, quoteService } from './quoteService';

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

export interface Invoice {
  id: string;
  invoiceNumber: string;
  opportunityId: string;
  quoteId?: string;
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
  createdAt: string;
  updatedAt: string;
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
}

export interface InvoiceFilterParams {
  page?: number;
  limit?: number;
  paymentStatus?: string;
  search?: string;
  opportunityId?: string;
  quoteId?: string;
  fromDate?: string;
  toDate?: string;
  sort?: string;
}

class InvoiceService {
  async createInvoice(data: CreateInvoiceData): Promise<Invoice> {
    try {
      const processedData = {
        ...data,
        items: data.items.map(item => ({
          ...item,
          total: item.quantity * item.unitPrice
        }))
      };
      
      return await apiClient.post<typeof processedData, Invoice>('/invoices', processedData);
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  async getAllInvoices(params?: InvoiceFilterParams): Promise<Invoice[]> {
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
      
      return await apiClient.get<Invoice[]>(endpoint);
    } catch (error) {
      console.error('Error fetching invoices:', error);
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

  async updateInvoice(id: string, data: Partial<Invoice>): Promise<Invoice> {
    try {
      return await apiClient.patch<Partial<Invoice>, Invoice>(`/invoices/${id}`, data);
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

  async createInvoiceFromQuote(quoteId: string, data?: Partial<CreateInvoiceData>): Promise<Invoice> {
    try {
      const quote = await quoteService.getQuoteById(quoteId);
      
      const invoiceData = {
        opportunityId: quote.opportunityId,
        quoteId: quote.id,
        items: quote.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          sku: item.sku,
          taxRate: item.taxRate,
          discount: item.discount
        })),
        subtotal: quote.subtotal || quote.items.reduce((sum: number, item: QuoteItem) => sum + item.total, 0),
        tax: quote.tax || 0,
        total: quote.totalAmount,
        dueDate: data?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        notes: data?.notes || `Invoice generated from Quote ${quote.quoteNumber}`,
        ...data
      };
      
      return await this.createInvoice(invoiceData);
    } catch (error) {
      console.error(`Error creating invoice from quote ${quoteId}:`, error);
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
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      return `INV-${year}${month}${day}-${random}`;
    }
  }

  async exportInvoiceToPDF(id: string): Promise<Blob> {
    try {
      return await apiClient.get<Blob>(`/invoices/${id}/export/pdf`, {
        // headers: {
        //   'Accept': 'application/pdf',
        // },
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

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2
    }).format(amount);
  }

  isOverdue(dueDate: string): boolean {
    return new Date(dueDate) < new Date();
  }

  daysUntilDue(dueDate: string): number {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

export const invoiceService = new InvoiceService();