import { apiClient } from '@/lib/api/client';

export interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  id?: string;
  _id?: string;
}

export interface OpportunityRef {
  _id?: string;
  id?: string;
  subject?: string;
  customer?: any;
}

export interface VehicleRef {
  _id?: string;
  id?: string;
  registrationNumber?: string;
  make?: string;
  model?: string;
}

export interface UserRef {
  _id?: string;
  id?: string;
  email?: string;
  role?: string;
  name?: string;
}

export interface Quote {
  id: string;
  _id?: string;
  quoteNumber: string;
  opportunityId: OpportunityRef | string;
  vehicleId?: VehicleRef | string;
  jobCardId?: any;
  items: QuoteItem[];
  subtotal?: number;
  tax?: number;
  totalAmount: number;
  total?: number;
  status: 'pending' | 'approved' | 'rejected' | 'draft';
  notes?: string;
  createdBy: UserRef | string;
  approvedBy?: UserRef | string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuoteData {
  quoteNumber?: string;
  opportunityId: string;
  vehicleId?: string;
  items: Omit<QuoteItem, 'id' | 'total'>[];
  totalAmount: number;
  notes?: string;
}

export interface UpdateQuoteData {
  opportunityId?: string;
  vehicleId?: string;
  items?: Omit<QuoteItem, 'id'>[];
  totalAmount?: number;
  status?: 'pending' | 'approved' | 'rejected' | 'draft';
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

export interface QuoteStatistics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalAmount: number;
  lastUpdated: string;
}

class QuoteService {
  /**
   * Create a new quote
   * POST /api/v1/quotes
   */
  async createQuote(data: CreateQuoteData, userId?: string): Promise<Quote> {
    try {
      // Calculate item totals if not provided
      const processedItems = data.items.map(item => ({
        ...item,
        total: item.quantity * item.unitPrice
      }));

      // Recalculate total amount if items were modified
      const calculatedTotal = processedItems.reduce((sum, item) => sum + item.total, 0);
      const finalTotalAmount = data.totalAmount || calculatedTotal;

      const requestData = {
        ...data,
        items: processedItems,
        totalAmount: finalTotalAmount
      };

      const response = await apiClient.post<typeof requestData, any>('/quotes', requestData);
      return this.normalizeQuote(response);
    } catch (error) {
      console.error('Error creating quote:', error);
      throw error;
    }
  }

  /**
   * List all quotes
   * GET /api/v1/quotes
   */
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
      
      const response = await apiClient.get<any[]>(endpoint);
      return response.map(quote => this.normalizeQuote(quote));
    } catch (error) {
      console.error('Error fetching quotes:', error);
      throw error;
    }
  }

  /**
   * Get quote statistics
   * GET /api/v1/quotes/stats
   */
  async getQuoteStatistics(): Promise<QuoteStatistics> {
    try {
      const response = await apiClient.get<any>('/quotes/stats');
      return {
        total: response.total || 0,
        pending: response.pending || 0,
        approved: response.approved || 0,
        rejected: response.rejected || 0,
        totalAmount: response.totalAmount || 0,
        lastUpdated: response.lastUpdated || new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching quote stats:', error);
      throw error;
    }
  }

  /**
   * Get a single quote by ID
   * GET /api/v1/quotes/{id}
   */
  async getQuoteById(id: string): Promise<Quote> {
    try {
      const response = await apiClient.get<any>(`/quotes/${id}`);
      return this.normalizeQuote(response);
    } catch (error) {
      console.error(`Error fetching quote ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update a quote
   * PATCH /api/v1/quotes/{id}
   */
  async updateQuote(id: string, data: UpdateQuoteData, userRole?: string, userId?: string): Promise<Quote> {
    try {
      // If items are being updated, recalculate totals
      if (data.items) {
        const processedItems = data.items.map(item => ({
          ...item,
          total: item.quantity * item.unitPrice
        }));

        const calculatedTotal = processedItems.reduce((sum, item) => sum + item.total, 0);
        data.totalAmount = calculatedTotal;
        data.items = processedItems;
      }

      const response = await apiClient.patch<UpdateQuoteData, any>(`/quotes/${id}`, data);
      return this.normalizeQuote(response);
    } catch (error) {
      console.error(`Error updating quote ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a quote
   * DELETE /api/v1/quotes/{id}
   */
  async deleteQuote(id: string, userId?: string): Promise<{ message: string }> {
    try {
      return await apiClient.delete<{ message: string }>(`/quotes/${id}`);
    } catch (error) {
      console.error(`Error deleting quote ${id}:`, error);
      throw error;
    }
  }

  /**
   * Approve a quote
   * PATCH /api/v1/quotes/{id}/approve
   */
  async approveQuote(id: string, userId?: string, userRole?: string): Promise<Quote> {
    try {
      const response = await apiClient.patch<any, any>(`/quotes/${id}/approve`, {});
      return this.normalizeQuote(response);
    } catch (error) {
      console.error(`Error approving quote ${id}:`, error);
      throw error;
    }
  }

  /**
   * Generate quote number (simulate backend logic)
   */
  async generateQuoteNumber(): Promise<string> {
    try {
      // First try to get the latest quote number from backend
      const quotes = await this.getAllQuotes();
      
      if (quotes.length === 0) {
        const year = new Date().getFullYear();
        return `Q-${year}-0001`;
      }
      
      // Find the latest quote by creation date
      const latestQuote = quotes.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      
      const year = new Date().getFullYear();
      const lastNumberMatch = latestQuote.quoteNumber?.match(`Q-${year}-(\\d{4})`);
      
      if (!lastNumberMatch) {
        return `Q-${year}-0001`;
      }
      
      const lastNumber = parseInt(lastNumberMatch[1], 10) || 0;
      const nextNumber = (lastNumber + 1).toString().padStart(4, '0');
      return `Q-${year}-${nextNumber}`;
    } catch (error) {
      console.error('Error generating quote number:', error);
      // Fallback to timestamp-based number
      const date = new Date();
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `Q-${year}${month}${day}-${random}`;
    }
  }

  /**
   * Get quotes by status
   */
  async getQuotesByStatus(status: string): Promise<Quote[]> {
    try {
      const quotes = await this.getAllQuotes({ status });
      return quotes.filter(quote => quote.status === status);
    } catch (error) {
      console.error(`Error fetching quotes by status ${status}:`, error);
      throw error;
    }
  }

  /**
   * Get pending quotes
   */
  async getPendingQuotes(): Promise<Quote[]> {
    return this.getQuotesByStatus('pending');
  }

  /**
   * Get approved quotes
   */
  async getApprovedQuotes(): Promise<Quote[]> {
    return this.getQuotesByStatus('approved');
  }

  /**
   * Get rejected quotes
   */
  async getRejectedQuotes(): Promise<Quote[]> {
    return this.getQuotesByStatus('rejected');
  }

  /**
   * Search quotes
   */
  async searchQuotes(searchTerm: string): Promise<Quote[]> {
    try {
      const quotes = await this.getAllQuotes();
      return quotes.filter(quote => 
        quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof quote.opportunityId === 'object' && 
         quote.opportunityId.subject?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        quote.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching quotes:', error);
      throw error;
    }
  }

  /**
   * Get quotes by opportunity ID
   */
  async getQuotesByOpportunity(opportunityId: string): Promise<Quote[]> {
    try {
      const quotes = await this.getAllQuotes();
      return quotes.filter(quote => {
        if (typeof quote.opportunityId === 'string') {
          return quote.opportunityId === opportunityId;
        }
        return quote.opportunityId._id === opportunityId || quote.opportunityId.id === opportunityId;
      });
    } catch (error) {
      console.error(`Error fetching quotes for opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  /**
   * Normalize quote data from backend
   */
  private normalizeQuote(data: any): Quote {
    // Calculate item totals if not present
    const normalizedItems = (data.items || []).map((item: any) => ({
      id: item._id || item.id,
      _id: item._id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total || (item.quantity * item.unitPrice)
    }));

    // Calculate totals if not present
    const itemsTotal = normalizedItems.reduce((sum: number, item: QuoteItem) => sum + item.total, 0);
    const subtotal = data.subtotal || itemsTotal;
    const tax = data.tax || 0;
    const totalAmount = data.totalAmount || (subtotal + tax);

    return {
      id: data._id || data.id,
      _id: data._id,
      quoteNumber: data.quoteNumber,
      opportunityId: data.opportunityId,
      vehicleId: data.vehicleId,
      jobCardId: data.jobCardId,
      items: normalizedItems,
      subtotal,
      tax,
      totalAmount,
      total: data.total || totalAmount,
      status: data.status || 'pending',
      notes: data.notes,
      createdBy: data.createdBy,
      approvedBy: data.approvedBy,
      approvedAt: data.approvedAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  /**
   * Helper to calculate item total
   */
  calculateItemTotal(quantity: number, unitPrice: number): number {
    return quantity * unitPrice;
  }

  /**
   * Helper to calculate quote totals
   */
  calculateQuoteTotals(items: QuoteItem[]): {
    subtotal: number;
    tax: number;
    total: number;
  } {
    const subtotal = items.reduce((sum, item) => sum + this.calculateItemTotal(item.quantity, item.unitPrice), 0);
    const tax = 0; // Default tax rate, can be extended
    const total = subtotal + tax;
    
    return { subtotal, tax, total };
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number, currency: string = 'KES'): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Check if quote can be approved
   */
  canApproveQuote(quote: Quote, userRole?: string): boolean {
    if (quote.status !== 'pending') return false;
    
    // Check user role permissions
    const allowedRoles = ['admin', 'management', 'finance'];
    if (userRole && !allowedRoles.includes(userRole)) return false;
    
    // Additional business rules
    if (quote.totalAmount <= 0) return false;
    if (quote.items.length === 0) return false;
    
    return true;
  }

  /**
   * Get status color
   */
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'pending': 'warning',
      'approved': 'success',
      'rejected': 'error',
      'draft': 'default'
    };
    return colors[status] || 'default';
  }

  /**
   * Get status text
   */
  getStatusText(status: string): string {
    const texts: Record<string, string> = {
      'pending': 'Pending Approval',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'draft': 'Draft'
    };
    return texts[status] || status;
  }
}

export const quoteService = new QuoteService();