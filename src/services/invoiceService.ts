import { apiClient } from '@/lib/api/client';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  id?: string;
  _id?: string;
}

export interface CustomerRef {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface OpportunityRef {
  _id?: string;
  id?: string;
  subject?: string;
  companyName?: string;
  customer?: CustomerRef;
}

export interface QuoteRef {
  _id?: string;
  id?: string;
  quoteNumber?: string;
}

export interface WorkOrderRef {
  _id?: string;
  id?: string;
  workOrderNumber?: string;
}

export interface JobCardRef {
  _id?: string;
  id?: string;
  jobTitle?: string;
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

export interface Invoice {
  id: string;
  _id?: string;
  invoiceNumber: string;
  opportunityId: OpportunityRef | string;
  workOrderId?: WorkOrderRef | string;
  quoteId?: QuoteRef | string;
  jobCardId?: JobCardRef | string;
  vehicleId?: VehicleRef | string;
  salesOrderId?: VehicleRef | string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total?: number;
  status: 'draft' | 'sent' | 'approved' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid' | 'partially_paid';
  dueDate?: string;
  paymentMethod?: string;
  paymentReference?: string;
  paidAt?: string;
  createdBy: UserRef | string;
  approvedBy?: UserRef | string;
  dateApproved?: string;
  active?: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateInvoiceData {
  opportunityId: string;
  quoteId?: string;
  jobCardId?: string;
  vehicleId?: string;
  items: Omit<InvoiceItem, 'id' | 'total'>[];
  dueDate?: string;
  paymentMethod?: string;
  notes?: string;
}

export interface UpdateInvoiceData {
  opportunityId?: string;
  quoteId?: string;
  jobCardId?: string;
  vehicleId?: string;
  items?: Omit<InvoiceItem, 'id'>[];
  dueDate?: string;
  paymentMethod?: string;
  paymentReference?: string;
  status?: 'draft' | 'sent' | 'approved' | 'cancelled';
  paymentStatus?: 'unpaid' | 'paid' | 'partially_paid';
  notes?: string;
  active?: boolean;
  paidAt?: string;
  sentAt?: string;
}

export interface InvoiceFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
  opportunityId?: string;
  quoteId?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  sort?: string;
}

export interface InvoiceStatistics {
  total: number;
  draft: number;
  sent: number;
  approved: number;
  cancelled: number;
  unpaid: number;
  paid: number;
  partially_paid: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  lastUpdated: string;
}

class InvoiceService {
  /**
   * Create a new invoice
   * POST /api/v1/invoices
   */
  async createInvoice(data: CreateInvoiceData): Promise<Invoice> {
    try {
      // Backend calculates totals automatically, but we need to provide item totals
      const processedItems = data.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice // Calculate each item's total
      }));

      const requestData = {
        opportunityId: data.opportunityId,
        quoteId: data.quoteId,
        jobCardId: data.jobCardId,
        vehicleId: data.vehicleId,
        items: processedItems,
        dueDate: data.dueDate,
        paymentMethod: data.paymentMethod,
        notes: data.notes
      };

      // Remove the type argument <any> since apiClient.post doesn't expect it
      const response = await apiClient.post('/invoices', requestData);
      return this.normalizeInvoice(response);
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  /**
   * Get all invoices
   * GET /api/v1/invoices
   */
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
      
      const response = await apiClient.get<any[]>(endpoint);
      return response.map(invoice => this.normalizeInvoice(invoice));
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  }

  /**
   * Create invoice from quote
   * POST /api/v1/invoices/from-quote/{quoteId}
   */
  async createInvoiceFromQuote(quoteId: string, userId?: string): Promise<Invoice> {
    try {
      const response = await apiClient.post<any, any>(`/invoices/from-quote/${quoteId}`, {});
      return this.normalizeInvoice(response);
    } catch (error) {
      console.error(`Error creating invoice from quote ${quoteId}:`, error);
      throw error;
    }
  }

  /**
   * Get invoices by opportunity
   * GET /api/v1/invoices/opportunity/{opportunityId}
   */
  async getInvoicesByOpportunity(opportunityId: string): Promise<Invoice[]> {
    try {
      const response = await apiClient.get<any[]>(`/invoices/opportunity/${opportunityId}`);
      return response.map(invoice => this.normalizeInvoice(invoice));
    } catch (error) {
      console.error(`Error fetching invoices for opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  /**
   * Get invoice by ID
   * GET /api/v1/invoices/{id}
   */
  async getInvoiceById(id: string): Promise<Invoice> {
    try {
      const response = await apiClient.get<any>(`/invoices/${id}`);
      return this.normalizeInvoice(response);
    } catch (error) {
      console.error(`Error fetching invoice ${id}:`, error);
      throw error;
    }
  }

  /**
 * Update invoice
 * PATCH /api/v1/invoices/{id}
 */
  async updateInvoice(id: string, data: UpdateInvoiceData): Promise<Invoice> {
    try {
      // If items are being updated, recalculate item totals
      if (data.items) {
        const processedItems = data.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice
        }));
        data.items = processedItems;
      }

      const response = await apiClient.patch(`/invoices/${id}`, data);
      return this.normalizeInvoice(response);
    } catch (error) {
      console.error(`Error updating invoice ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete invoice
   * DELETE /api/v1/invoices/{id}
   */
  async deleteInvoice(id: string, userId?: string): Promise<{ message: string }> {
    try {
      return await apiClient.delete<{ message: string }>(`/invoices/${id}`);
    } catch (error) {
      console.error(`Error deleting invoice ${id}:`, error);
      throw error;
    }
  }

  /**
   * Approve invoice
   * PATCH /api/v1/invoices/{id}/approve
   */
  async approveInvoice(id: string, userId?: string, userRole?: string): Promise<Invoice> {
    try {
      const response = await apiClient.patch<any, any>(`/invoices/${id}/approve`, {});
      return this.normalizeInvoice(response);
    } catch (error) {
      console.error(`Error approving invoice ${id}:`, error);
      throw error;
    }
  }

  /**
   * Mark invoice as paid
   * PATCH /api/v1/invoices/{id}/pay
   */
  async markInvoiceAsPaid(
    id: string,
    userId?: string | { // Accept either string or object
      userId?: string;
      userRole?: string;
      paymentMethod?: string;
      paymentReference?: string;
      amount?: number;
    },
    userRole?: string, // Keep as optional third param for backward compatibility
    paymentMethod?: string, // Optional fourth param
    paymentReference?: string // Optional fifth param
  ): Promise<Invoice> {
    try {
      let options: any = {};
      
      // Handle both signatures
      if (typeof userId === 'object') {
        // New signature: second param is options object
        options = userId;
      } else {
        // Old signature: individual params
        options = {
          userId: userId,
          userRole: userRole,
          paymentMethod: paymentMethod,
          paymentReference: paymentReference
        };
      }
      
      const requestData: any = {};
      if (options?.paymentMethod) requestData.paymentMethod = options.paymentMethod;
      if (options?.paymentReference) requestData.paymentReference = options.paymentReference;
      if (options?.amount) requestData.amount = options.amount;

      const response = await apiClient.patch<any, any>(`/invoices/${id}/pay`, requestData);
      return this.normalizeInvoice(response);
    } catch (error) {
      console.error(`Error marking invoice ${id} as paid:`, error);
      throw error;
    }
  }

  /**
   * Normalize invoice data from backend
   */
  private normalizeInvoice(data: any): Invoice {
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
    const itemsTotal = normalizedItems.reduce((sum: number, item: InvoiceItem) => sum + item.total, 0);
    const subtotal = data.subtotal || itemsTotal;
    const tax = data.tax || 0;
    const total = data.total || (subtotal + tax);

    return {
      id: data._id || data.id,
      _id: data._id,
      invoiceNumber: data.invoiceNumber,
      opportunityId: data.opportunityId,
      quoteId: data.quoteId,
      jobCardId: data.jobCardId,
      vehicleId: data.vehicleId,
      items: normalizedItems,
      subtotal,
      tax,
      total,
      status: data.status || 'draft',
      paymentStatus: data.paymentStatus || 'unpaid',
      dueDate: data.dueDate,
      paymentMethod: data.paymentMethod,
      paymentReference: data.paymentReference,
      paidAt: data.paidAt,
      createdBy: data.createdBy,
      approvedBy: data.approvedBy,
      dateApproved: data.dateApproved,
      active: data.active !== undefined ? data.active : true,
      notes: data.notes,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  /**
   * Generate invoice number (simulate backend logic)
   */
  async generateInvoiceNumber(): Promise<string> {
    try {
      // First try to get the latest invoice number from backend
      const invoices = await this.getAllInvoices();
      
      if (invoices.length === 0) {
        const timestamp = Date.now();
        const random = Math.floor(1000 + Math.random() * 9000);
        return `INV-${timestamp}-${random}`;
      }
      
      // Find the latest invoice by creation date
      const latestInvoice = invoices.sort((a, b) => 
        new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
      )[0];
      
      // Parse existing invoice number or generate new one
      if (latestInvoice.invoiceNumber?.startsWith('INV-')) {
        // Try to increment the number
        const match = latestInvoice.invoiceNumber.match(/INV-(\d+)-(\d+)/);
        if (match) {
          const timestamp = Date.now();
          const random = Math.floor(1000 + Math.random() * 9000);
          return `INV-${timestamp}-${random}`;
        }
      }
      
      // Fallback to new number
      const timestamp = Date.now();
      const random = Math.floor(1000 + Math.random() * 9000);
      return `INV-${timestamp}-${random}`;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      // Fallback
      const timestamp = Date.now();
      const random = Math.floor(1000 + Math.random() * 9000);
      return `INV-${timestamp}-${random}`;
    }
  }

  /**
   * Get invoices by status
   */
  async getInvoicesByStatus(status: string): Promise<Invoice[]> {
    try {
      const invoices = await this.getAllInvoices({ status });
      return invoices.filter(invoice => invoice.status === status);
    } catch (error) {
      console.error(`Error fetching invoices with status ${status}:`, error);
      throw error;
    }
  }

  async createInvoiceFromWorkOrder(workOrderId: string): Promise<{
    workOrder: any;
    invoice: Invoice;
  }> {
    try {
      const response = await apiClient.post<any, any>(
        `/invoices/from-workorder/${workOrderId}`,
        {}
      );
      return {
        workOrder: response.workOrder,
        invoice: this.normalizeInvoice(response.invoice)
      };
    } catch (error) {
      console.error(`Error creating invoice from work order ${workOrderId}:`, error);
      throw error;
    }
  }

  /**
   * Get invoices by work order
   * GET /api/v1/invoices/workorder/{workOrderId}
   */
  async getInvoicesByWorkOrder(workOrderId: string): Promise<Invoice[]> {
    try {
      const response = await apiClient.get<any[]>(`/invoices/workorder/${workOrderId}`);
      return response.map(invoice => this.normalizeInvoice(invoice));
    } catch (error) {
      console.error(`Error fetching invoices for work order ${workOrderId}:`, error);
      throw error;
    }
  }

  /**
   * Send invoice email to customer
   * This triggers the email sending via the backend
   */
  async sendInvoiceEmail(invoiceId: string): Promise<{ success: boolean; message: string }> {
    try {
      // The backend should handle email sending when invoice is created/updated
      // But we can also trigger it manually if needed
      const response = await apiClient.post<any, any>(
        `/invoices/${invoiceId}/trigger-receipt`,
        {}
      );
      return {
        success: true,
        message: 'Invoice email sent successfully'
      };
    } catch (error) {
      console.error(`Error sending invoice email for ${invoiceId}:`, error);
      throw error;
    }
  }

  /**
   * Test email sending
   * POST /api/v1/invoices/test-email/{email}
   */
  async testInvoiceEmail(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post<any, any>(
        `/invoices/test-email/${email}`,
        {}
      );
      return {
        success: true,
        message: 'Test email sent successfully'
      };
    } catch (error) {
      console.error('Error sending test email:', error);
      throw error;
    }
  }

  /**
   * Debug email for invoice
   * GET /api/v1/invoices/{id}/debug-email
   */
  async debugInvoiceEmail(invoiceId: string): Promise<any> {
    try {
      const response = await apiClient.get<any>(`/invoices/${invoiceId}/debug-email`);
      return response;
    } catch (error) {
      console.error(`Error debugging email for invoice ${invoiceId}:`, error);
      throw error;
    }
  }

  /**
   * Get invoices by payment status
   */
  async getInvoicesByPaymentStatus(paymentStatus: string): Promise<Invoice[]> {
    try {
      const invoices = await this.getAllInvoices({ paymentStatus });
      return invoices.filter(invoice => invoice.paymentStatus === paymentStatus);
    } catch (error) {
      console.error(`Error fetching invoices with payment status ${paymentStatus}:`, error);
      throw error;
    }
  }

  /**
   * Get draft invoices
   */
  async getDraftInvoices(): Promise<Invoice[]> {
    return this.getInvoicesByStatus('draft');
  }

  /**
   * Get sent invoices
   */
  async getSentInvoices(): Promise<Invoice[]> {
    return this.getInvoicesByStatus('sent');
  }

  /**
   * Get approved invoices
   */
  async getApprovedInvoices(): Promise<Invoice[]> {
    return this.getInvoicesByStatus('approved');
  }

  /**
   * Get unpaid invoices
   */
  async getUnpaidInvoices(): Promise<Invoice[]> {
    return this.getInvoicesByPaymentStatus('unpaid');
  }

  /**
   * Get paid invoices
   */
  async getPaidInvoices(): Promise<Invoice[]> {
    return this.getInvoicesByPaymentStatus('paid');
  }

  /**
   * Search invoices
   */
  async searchInvoices(searchTerm: string): Promise<Invoice[]> {
    try {
      const invoices = await this.getAllInvoices();
      return invoices.filter(invoice => 
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof invoice.opportunityId === 'object' && 
         invoice.opportunityId.subject?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        invoice.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching invoices:', error);
      throw error;
    }
  }

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices(): Promise<Invoice[]> {
    try {
      const invoices = await this.getUnpaidInvoices();
      const today = new Date();
      
      return invoices.filter(invoice => {
        if (!invoice.dueDate) return false;
        const dueDate = new Date(invoice.dueDate);
        return dueDate < today;
      });
    } catch (error) {
      console.error('Error fetching overdue invoices:', error);
      throw error;
    }
  }

  /**
   * Get active invoices only
   */
  async getActiveInvoices(): Promise<Invoice[]> {
    try {
      const invoices = await this.getAllInvoices();
      return invoices.filter(invoice => invoice.active !== false);
    } catch (error) {
      console.error('Error fetching active invoices:', error);
      throw error;
    }
  }

  /**
   * Get invoice statistics
   */
  async getInvoiceStatistics(): Promise<InvoiceStatistics> {
    try {
      const invoices = await this.getAllInvoices();
      
      let draft = 0;
      let sent = 0;
      let approved = 0;
      let cancelled = 0;
      let unpaid = 0;
      let paid = 0;
      let partially_paid = 0;
      let totalAmount = 0;
      let paidAmount = 0;
      let outstandingAmount = 0;
      
      invoices.forEach(invoice => {
        // Count by status
        switch (invoice.status) {
          case 'draft': draft++; break;
          case 'sent': sent++; break;
          case 'approved': approved++; break;
          case 'cancelled': cancelled++; break;
        }
        
        // Count by payment status
        switch (invoice.paymentStatus) {
          case 'unpaid': unpaid++; break;
          case 'paid': paid++; break;
          case 'partially_paid': partially_paid++; break;
        }
        
        // Calculate amounts
        totalAmount += invoice.total || 0;
        
        if (invoice.paymentStatus === 'paid') {
          paidAmount += invoice.total || 0;
        } else if (invoice.paymentStatus === 'partially_paid') {
          // Assuming half paid for partially paid
          paidAmount += (invoice.total || 0) / 2;
        }
      });
      
      outstandingAmount = totalAmount - paidAmount;
      
      return {
        total: invoices.length,
        draft,
        sent,
        approved,
        cancelled,
        unpaid,
        paid,
        partially_paid,
        totalAmount,
        paidAmount,
        outstandingAmount,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error calculating invoice statistics:', error);
      throw error;
    }
  }

  /**
   * Get status color for UI
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'draft': return 'warning';
      case 'sent': return 'info';
      case 'approved': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  }

  /**
   * Get payment status color for UI
   */
  getPaymentStatusColor(paymentStatus: string): string {
    switch (paymentStatus) {
      case 'unpaid': return 'error';
      case 'paid': return 'success';
      case 'partially_paid': return 'warning';
      default: return 'default';
    }
  }

  /**
   * Get status text for UI
   */
  getStatusText(status: string): string {
    switch (status) {
      case 'draft': return 'Draft';
      case 'sent': return 'Sent';
      case 'approved': return 'Approved';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  }

  /**
   * Get payment status text for UI
   */
  getPaymentStatusText(paymentStatus: string): string {
    switch (paymentStatus) {
      case 'unpaid': return 'Unpaid';
      case 'paid': return 'Paid';
      case 'partially_paid': return 'Partially Paid';
      default: return paymentStatus;
    }
  }

  /**
   * Calculate days until due
   */
  calculateDaysUntilDue(dueDate?: string): number | null {
    if (!dueDate) return null;
    
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  /**
   * Check if invoice is overdue
   */
  isOverdue(invoice: Invoice): boolean {
    if (!invoice.dueDate || invoice.paymentStatus === 'paid') return false;
    
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    
    return dueDate < today;
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
   * Calculate item total
   */
  calculateItemTotal(quantity: number, unitPrice: number): number {
    return quantity * unitPrice;
  }

  /**
   * Calculate invoice totals
   */
  calculateInvoiceTotals(items: InvoiceItem[]): {
    subtotal: number;
    tax: number;
    total: number;
  } {
    const subtotal = items.reduce((sum, item) => sum + this.calculateItemTotal(item.quantity, item.unitPrice), 0);
    const tax = parseFloat((subtotal * 0.16).toFixed(2)); // 16% VAT
    const total = parseFloat((subtotal + tax).toFixed(2));
    
    return { subtotal, tax, total };
  }

  /**
   * Check if invoice can be approved
   */
  canApproveInvoice(invoice: Invoice, userRole?: string): boolean {
    if (invoice.status !== 'sent' && invoice.status !== 'draft') return false;
    
    // Check user role permissions
    const allowedRoles = ['admin', 'management', 'finance'];
    if (userRole && !allowedRoles.includes(userRole)) return false;
    
    // Additional business rules
    if (invoice.total <= 0) return false;
    if (invoice.items.length === 0) return false;
    
    return true;
  }

  /**
   * Check if invoice can be marked as paid
   */
  canMarkAsPaid(invoice: Invoice, userRole?: string): boolean {
    if (invoice.paymentStatus === 'paid') return false;
    if (invoice.status !== 'approved') return false;
    
    // Check user role permissions
    const allowedRoles = ['admin', 'management', 'finance'];
    if (userRole && !allowedRoles.includes(userRole)) return false;
    
    return true;
  }

  /**
   * Get invoice display name
   */
  getInvoiceDisplayName(invoice: Invoice): string {
    return `${invoice.invoiceNumber} - ${this.formatCurrency(invoice.total)}`;
  }

  /**
   * Format invoice for select dropdown
   */
  formatInvoiceForSelect(invoice: Invoice): { value: string; label: string } {
    return {
      value: invoice.id,
      label: this.getInvoiceDisplayName(invoice)
    };
  }

  /**
   * Get invoices for select dropdown
   */
  async getInvoicesForSelect(): Promise<Array<{ value: string; label: string }>> {
    try {
      const invoices = await this.getActiveInvoices();
      return invoices.map(invoice => this.formatInvoiceForSelect(invoice));
    } catch (error) {
      console.error('Error getting invoices for select:', error);
      throw error;
    }
  }
}

export const invoiceService = new InvoiceService();

// Status constants for easier reference
export const INVOICE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  APPROVED: 'approved',
  CANCELLED: 'cancelled',
};

export const PAYMENT_STATUS = {
  UNPAID: 'unpaid',
  PAID: 'paid',
  PARTIALLY_PAID: 'partially_paid',
};

// Helper function to create an invoice status checker
export const createInvoiceStatusChecker = (invoice: Invoice) => {
  return {
    isDraft: () => invoice.status === INVOICE_STATUS.DRAFT,
    isSent: () => invoice.status === INVOICE_STATUS.SENT,
    isApproved: () => invoice.status === INVOICE_STATUS.APPROVED,
    isCancelled: () => invoice.status === INVOICE_STATUS.CANCELLED,
    isUnpaid: () => invoice.paymentStatus === PAYMENT_STATUS.UNPAID,
    isPaid: () => invoice.paymentStatus === PAYMENT_STATUS.PAID,
    isPartiallyPaid: () => invoice.paymentStatus === PAYMENT_STATUS.PARTIALLY_PAID,
    isOverdue: () => invoiceService.isOverdue(invoice),
    canApprove: (userRole?: string) => invoiceService.canApproveInvoice(invoice, userRole),
    canMarkAsPaid: (userRole?: string) => invoiceService.canMarkAsPaid(invoice, userRole),
    getStatusColor: () => invoiceService.getStatusColor(invoice.status),
    getPaymentStatusColor: () => invoiceService.getPaymentStatusColor(invoice.paymentStatus),
    getStatusText: () => invoiceService.getStatusText(invoice.status),
    getPaymentStatusText: () => invoiceService.getPaymentStatusText(invoice.paymentStatus),
    getDaysUntilDue: () => invoiceService.calculateDaysUntilDue(invoice.dueDate),
    getDisplayName: () => invoiceService.getInvoiceDisplayName(invoice),
  };
};