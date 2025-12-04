import { API_BASE_URL, API_ENDPOINTS } from '@/lib/api/config';

export interface Quote {
  _id: string;
  id: string;
  opportunityId: string;
  customerId: string;
  amount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  validUntil: string;
  createdAt: string;
  updatedAt: string;
}

class QuoteService {
  private baseUrl = API_BASE_URL;

  async getAllQuotes(params?: any): Promise<Quote[]> {
    try {
      const queryString = params ? new URLSearchParams(params).toString() : '';
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.QUOTES.BASE}${queryString ? `?${queryString}` : ''}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch quotes');
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : data.data || [];
    } catch (error) {
      console.error('Error fetching quotes:', error);
      return [];
    }
  }

  async getQuoteById(id: string): Promise<Quote | null> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.QUOTES.BASE}/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch quote');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching quote:', error);
      return null;
    }
  }

  async createQuote(quoteData: Partial<Quote>): Promise<Quote | null> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.QUOTES.BASE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(quoteData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create quote');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating quote:', error);
      return null;
    }
  }

  async updateQuote(id: string, quoteData: Partial<Quote>): Promise<Quote | null> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.QUOTES.BASE}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(quoteData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update quote');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating quote:', error);
      return null;
    }
  }

  async deleteQuote(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.QUOTES.BASE}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error deleting quote:', error);
      return false;
    }
  }
}

export const quoteService = new QuoteService();