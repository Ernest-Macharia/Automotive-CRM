import { API_BASE_URL, API_ENDPOINTS } from '@/lib/api/config';

export interface Invoice {
  _id: string;
  id: string;
  quoteId?: string;
  opportunityId: string;
  customerId: string;
  invoiceNumber: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

class InvoiceService {
  private baseUrl = API_BASE_URL;

  async getAllInvoices(params?: any): Promise<Invoice[]> {
    try {
      const queryString = params ? new URLSearchParams(params).toString() : '';
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.INVOICES.BASE}${queryString ? `?${queryString}` : ''}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : data.data || [];
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.INVOICES.BASE}/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch invoice');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching invoice:', error);
      return null;
    }
  }

  async createInvoice(invoiceData: Partial<Invoice>): Promise<Invoice | null> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.INVOICES.BASE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(invoiceData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create invoice');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating invoice:', error);
      return null;
    }
  }

  async updateInvoice(id: string, invoiceData: Partial<Invoice>): Promise<Invoice | null> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.INVOICES.BASE}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(invoiceData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update invoice');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating invoice:', error);
      return null;
    }
  }
}

export const invoiceService = new InvoiceService();