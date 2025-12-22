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
      
      console.log('Creating invoice with data:', processedData);
      const response = await apiClient.post<typeof processedData, any>('/invoices', processedData);
      console.log('Invoice creation response:', response);
      return this.mapApiResponseToInvoice(response);
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  async getAllInvoices(params?: InvoiceFilterParams): Promise<Invoice[]> {
    try {
      console.log('Fetching invoices with params:', params);
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
      
      console.log('API endpoint:', endpoint);
      const response = await apiClient.get<any[]>(endpoint);
      console.log('Invoices API response:', response);
      
      if (!Array.isArray(response)) {
        console.error('Expected array but got:', response);
        return [];
      }
      
      return response.map(item => this.mapApiResponseToInvoice(item));
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      console.error('Error details:', error.message, error.response?.data, error.status);
      showToast('Failed to load invoices', 'error');
      throw error;
    }
  }

  async getInvoiceById(id: string): Promise<Invoice> {
    try {
      console.log('Fetching invoice by ID:', id);
      const response = await apiClient.get<any>(`/invoices/${id}`);
      console.log('Invoice by ID response:', response);
      return this.mapApiResponseToInvoice(response);
    } catch (error) {
      console.error(`Error fetching invoice ${id}:`, error);
      throw error;
    }
  }

  async updateInvoice(id: string, data: Partial<Invoice>): Promise<Invoice> {
    try {
      const response = await apiClient.patch<Partial<Invoice>, any>(`/invoices/${id}`, data);
      return this.mapApiResponseToInvoice(response);
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
      console.log('Creating invoice from quote:', quoteId);
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

  // Helper method to map API response to Invoice interface
  private mapApiResponseToInvoice(apiResponse: any): Invoice {
    console.log('Mapping API response to invoice:', apiResponse);
    
    // Calculate balance if not provided
    const totalAmount = apiResponse.totalAmount || apiResponse.total || 0;
    const paidAmount = apiResponse.paidAmount || 0;
    const balance = apiResponse.balance !== undefined 
      ? apiResponse.balance 
      : totalAmount - paidAmount;
    
    // Parse payment status
    let paymentStatus: Invoice['paymentStatus'] = 'pending';
    if (apiResponse.paymentStatus) {
      const status = apiResponse.paymentStatus.toLowerCase();
      if (['draft', 'pending', 'partially_paid', 'paid', 'overdue', 'cancelled'].includes(status)) {
        paymentStatus = status as Invoice['paymentStatus'];
      }
    }
    
    // Parse items
    const items: InvoiceItem[] = apiResponse.items || [];
    
    // Calculate subtotal if not provided
    const subtotal = apiResponse.subtotal || items.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
    
    // Parse dates
    const now = new Date().toISOString();
    const dueDate = apiResponse.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    // Use default values for missing fields
    return {
      id: apiResponse.id || `temp-${Date.now()}`,
      invoiceNumber: apiResponse.invoiceNumber || `INV-${Date.now()}`,
      opportunityId: apiResponse.opportunityId || '',
      quoteId: apiResponse.quoteId,
      items: items,
      subtotal: subtotal,
      tax: apiResponse.tax || 0,
      totalAmount: totalAmount,
      paidAmount: paidAmount,
      balance: balance,
      paymentStatus: paymentStatus,
      dueDate: dueDate,
      issueDate: apiResponse.issueDate || apiResponse.createdAt || now,
      notes: apiResponse.notes,
      terms: apiResponse.terms || '',
      createdAt: apiResponse.createdAt || now,
      updatedAt: apiResponse.updatedAt || now
    };
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2
    }).format(amount);
  }

  isOverdue(dueDate: string): boolean {
    try {
      return new Date(dueDate) < new Date();
    } catch (error) {
      console.error('Error checking if date is overdue:', error, dueDate);
      return false;
    }
  }

  daysUntilDue(dueDate: string): number {
    try {
      const due = new Date(dueDate);
      const now = new Date();
      const diffTime = due.getTime() - now.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (error) {
      console.error('Error calculating days until due:', error, dueDate);
      return 0;
    }
  }

  formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Invalid date';
    }
  }
}

export const invoiceService = new InvoiceService();

// Helper function for toast (temporary)
function showToast(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
  console.log(`Toast: ${type}: ${message}`);
}