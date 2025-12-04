import { API_BASE_URL, API_ENDPOINTS } from '@/lib/api/config';

export interface Payment {
  _id: string;
  id: string;
  invoiceId: string;
  opportunityId: string;
  customerId: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'mpesa' | 'bank_transfer';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

class PaymentService {
  private baseUrl = API_BASE_URL;

  async getAllPayments(params?: any): Promise<Payment[]> {
    try {
      const queryString = params ? new URLSearchParams(params).toString() : '';
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.PAYMENTS.BASE}${queryString ? `?${queryString}` : ''}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : data.data || [];
    } catch (error) {
      console.error('Error fetching payments:', error);
      return [];
    }
  }

  async getPaymentById(id: string): Promise<Payment | null> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.PAYMENTS.BASE}/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching payment:', error);
      return null;
    }
  }

  async createPayment(paymentData: Partial<Payment>): Promise<Payment | null> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.PAYMENTS.BASE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(paymentData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create payment');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating payment:', error);
      return null;
    }
  }

  async updatePayment(id: string, paymentData: Partial<Payment>): Promise<Payment | null> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.PAYMENTS.BASE}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(paymentData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update payment');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating payment:', error);
      return null;
    }
  }
}

export const paymentService = new PaymentService();