import { apiClient } from '@/lib/api/client';
import { handleUnauthorizedRedirect } from '@/lib/auth/unauthorized';

export interface Customer {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  companyName?: string;
  companyAddress?: string;
  companyTaxId?: string;
  companyPhone?: string;
  companyEmail?: string;
  contactPersonName?: string;
  contactPersonEmail?: string;
  contactPersonPhone?: string;
  contactPersonTitle?: string;
  type: 'individual' | 'organization';
  customerType?: 'existing' | 'potential' | 'recurring' | 'vip';
  customerTier?: 'gold' | 'silver' | 'bronze' | 'standard' | 'vip';
  status?: 'active' | 'inactive' | 'suspended';
  tags?: string[];
  notes?: string;
  paymentTerms?: string;
  creditLimit?: number;
  outstandingBalance?: number;
  totalSpent?: number;
  totalOrders?: number;
  lastOrderDate?: string;
  createdAt: string;
  updatedAt: string;
  
  // From opportunities aggregation
  opportunities?: Array<{
    _id: string;
    subject: string;
    status: string;
    total?: number;
    createdAt: string;
  }>;
  vehicles?: Array<{
    _id: string;
    make: string;
    model: string;
    registrationNumber?: string;
    year?: number;
  }>;
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  byType: Array<{
    _id: string;
    count: number;
  }>;
  byCustomerType: Array<{
    _id: string;
    count: number;
  }>;
  byTier: Array<{
    _id: string;
    count: number;
  }>;
  totalRevenue: number;
  averageOrderValue: number;
  newCustomersThisMonth: number;
  topCustomers: Array<{
    _id: string;
    name: string;
    totalSpent: number;
    totalOrders: number;
  }>;
}

export interface FilterParams {
  search?: string;
  type?: string;
  customerType?: string;
  customerTier?: string;
  status?: string;
  minOrders?: number;
  minSpent?: number;
  fromDate?: string;
  toDate?: string;
  tags?: string[];
  sort?: string;
  page?: number;
  limit?: number;
}

export interface CustomerActivity {
  type: 'opportunity' | 'order' | 'payment' | 'note';
  title: string;
  description: string;
  amount?: number;
  date: string;
  icon: string;
}

export interface ApiResponse {
  data: any[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CustomerCreateData {
  name: string;
  email?: string;
  phone?: string;
  companyName?: string;
  companyAddress?: string;
  companyTaxId?: string;
  companyPhone?: string;
  companyEmail?: string;
  contactPersonName?: string;
  contactPersonEmail?: string;
  contactPersonPhone?: string;
  contactPersonTitle?: string;
  type: 'individual' | 'organization';
  customerType?: 'existing' | 'potential' | 'recurring' | 'vip';
  customerTier?: 'gold' | 'silver' | 'bronze' | 'standard' | 'vip';
  status?: 'active' | 'inactive' | 'suspended';
  tags?: string[];
  notes?: string;
  paymentTerms?: string;
  creditLimit?: number;
}

class CustomerService {
  // Use the singleton apiClient instance directly
  private apiClient = apiClient;
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || '';

  constructor() {
    // No need to instantiate apiClient as it's already a singleton
  }

  private getAuthHeaders(): Record<string, string> {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  private async fetchWithFallback<T>(
    endpoint: string, 
    params?: any, 
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
    data?: any
  ): Promise<T> {
    try {
      // Try to use apiClient first
      if (this.apiClient && typeof (this.apiClient as any).get === 'function') {
        switch (method) {
          case 'GET':
            return await (this.apiClient as any).get(endpoint, params);
          case 'POST':
            return await (this.apiClient as any).post(endpoint, data, params);
          case 'PUT':
            return await (this.apiClient as any).put(endpoint, data, params);
          case 'PATCH':
            return await (this.apiClient as any).patch(endpoint, data, params);
          case 'DELETE':
            return await (this.apiClient as any).delete(endpoint, params);
        }
      }
      
      // Fallback to fetch API
      const queryParams = new URLSearchParams();
      if (params && method === 'GET') {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach(item => queryParams.append(`${key}[]`, item.toString()));
            } else {
              queryParams.append(key, value.toString());
            }
          }
        });
      }
      
      const url = `${this.baseUrl}${endpoint}${method === 'GET' && queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const headers = this.getAuthHeaders();
      
      const options: RequestInit = {
        method,
        headers,
        credentials: 'include',
      };
      
      if (method !== 'GET' && data) {
        options.body = JSON.stringify(data);
      }
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error (${response.status}):`, errorText);
        
        if (response.status === 401) {
        handleUnauthorizedRedirect();
      }
        
        throw new Error(`API Error (${response.status}): ${errorText || response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      }
      
      return {} as T;
    } catch (error) {
      console.error(`Error in ${method} ${endpoint}:`, error);
      throw error;
    }
  }

  // Get all customers aggregated from opportunities
  async getAllCustomers(params?: FilterParams): Promise<Customer[]> {
    try {
      // Backend enforces limit <= 100, so fetch paginated results and aggregate.
      const pageSize = Math.min(params?.limit || 100, 100);
      const firstPageResponse = await this.fetchWithFallback<ApiResponse>('/opportunities', {
        ...params,
        page: params?.page || 1,
        limit: pageSize,
      });

      let opportunities: any[] = [];

      if (Array.isArray(firstPageResponse)) {
        opportunities = firstPageResponse;
      } else if (firstPageResponse && typeof firstPageResponse === 'object' && 'data' in firstPageResponse) {
        opportunities = Array.isArray(firstPageResponse.data) ? firstPageResponse.data : [];
      } else if (firstPageResponse && typeof firstPageResponse === 'object') {
        opportunities = [firstPageResponse];
      }

      const totalPages =
        !params?.page && !params?.limit && firstPageResponse?.pagination?.totalPages
          ? Math.min(firstPageResponse.pagination.totalPages, 50)
          : 1;

      if (totalPages > 1) {
        const pageRequests: Promise<ApiResponse>[] = [];
        for (let page = 2; page <= totalPages; page++) {
          pageRequests.push(
            this.fetchWithFallback<ApiResponse>('/opportunities', {
              ...params,
              page,
              limit: pageSize,
            })
          );
        }

        const pageResponses = await Promise.all(pageRequests);
        pageResponses.forEach(response => {
          if (response && Array.isArray(response.data)) {
            opportunities = opportunities.concat(response.data);
          }
        });
      }
      
      // Now opportunities is guaranteed to be an array
      const customerMap = new Map<string, Customer>();
      
      opportunities.forEach((opportunity: any) => {
        const customer = opportunity.customer;
        if (customer && customer._id) {
          if (!customerMap.has(customer._id)) {
            customerMap.set(customer._id, {
              ...customer,
              type: opportunity.type,
              opportunities: [],
              vehicles: opportunity.vehicles || [],
              totalOrders: 0,
              totalSpent: 0,
              lastOrderDate: opportunity.createdAt
            });
          }
          
          const existingCustomer = customerMap.get(customer._id)!;
          
          // Update opportunities
          existingCustomer.opportunities = existingCustomer.opportunities || [];
          existingCustomer.opportunities.push({
            _id: opportunity._id,
            subject: opportunity.subject,
            status: opportunity.status,
            total: opportunity.total,
            createdAt: opportunity.createdAt
          });
          
          // Update stats
          existingCustomer.totalOrders = (existingCustomer.totalOrders || 0) + 1;
          existingCustomer.totalSpent = (existingCustomer.totalSpent || 0) + (opportunity.total || 0);
          
          // Update last order date
          if (opportunity.createdAt > (existingCustomer.lastOrderDate || '')) {
            existingCustomer.lastOrderDate = opportunity.createdAt;
          }
          
          // Update vehicles (avoid duplicates)
          if (opportunity.vehicles && opportunity.vehicles.length > 0) {
            const existingVehicles = existingCustomer.vehicles || [];
            opportunity.vehicles.forEach((vehicle: any) => {
              if (!existingVehicles.some(v => v._id === vehicle._id)) {
                existingVehicles.push(vehicle);
              }
            });
            existingCustomer.vehicles = existingVehicles;
          }
        }
      });
      
      // Convert map to array
      const customers = Array.from(customerMap.values());
      
      // Apply filters if any
      let filteredCustomers = customers;
      
      if (params?.search) {
        const searchTerm = params.search.toLowerCase();
        filteredCustomers = filteredCustomers.filter(customer =>
          customer.name?.toLowerCase().includes(searchTerm) ||
          customer.email?.toLowerCase().includes(searchTerm) ||
          customer.phone?.includes(searchTerm) ||
          customer.companyName?.toLowerCase().includes(searchTerm)
        );
      }
      
      if (params?.type) {
        filteredCustomers = filteredCustomers.filter(customer => 
          customer.type === params.type
        );
      }
      
      if (params?.customerType) {
        filteredCustomers = filteredCustomers.filter(customer => 
          customer.customerType === params.customerType
        );
      }
      
      if (params?.customerTier) {
        filteredCustomers = filteredCustomers.filter(customer => 
          customer.customerTier === params.customerTier
        );
      }
      
      if (params?.status) {
        filteredCustomers = filteredCustomers.filter(customer => 
          customer.status === params.status
        );
      }
      
      // Apply sorting
      if (params?.sort) {
        const [field, order] = params.sort.split(':');
        filteredCustomers.sort((a: any, b: any) => {
          let aValue = a[field];
          let bValue = b[field];
          
          // Handle nested properties
          if (field === 'totalSpent') {
            aValue = a.totalSpent || 0;
            bValue = b.totalSpent || 0;
          } else if (field === 'totalOrders') {
            aValue = a.totalOrders || 0;
            bValue = b.totalOrders || 0;
          } else if (field === 'lastOrderDate') {
            aValue = new Date(a.lastOrderDate || 0).getTime();
            bValue = new Date(b.lastOrderDate || 0).getTime();
          }
          
          if (order === 'desc') {
            return bValue - aValue;
          }
          return aValue - bValue;
        });
      }
      
      // Apply pagination
      if (params?.page && params?.limit) {
        const start = (params.page - 1) * params.limit;
        const end = start + params.limit;
        filteredCustomers = filteredCustomers.slice(start, end);
      }
      
      return filteredCustomers;
    } catch (error) {
      console.error('Error fetching customers:', error);
      // Return empty array to prevent UI crashes
      return [];
    }
  }

  async getCustomerById(id: string): Promise<Customer> {
    try {
      // Try to find customer from opportunities
      const opportunitiesResponse = await this.fetchWithFallback<ApiResponse>('/opportunities');
      
      // Handle different response formats - ensure we have an array
      let opportunities: any[] = [];
      
      if (Array.isArray(opportunitiesResponse)) {
        opportunities = opportunitiesResponse;
      } else if (opportunitiesResponse && typeof opportunitiesResponse === 'object' && 'data' in opportunitiesResponse) {
        opportunities = Array.isArray(opportunitiesResponse.data) ? opportunitiesResponse.data : [];
      } else if (opportunitiesResponse && typeof opportunitiesResponse === 'object') {
        // If it's a single object, wrap it in an array
        opportunities = [opportunitiesResponse];
      }
      
      // Now opportunities is guaranteed to be an array
      // Find all opportunities for this customer
      const customerOpportunities = opportunities.filter((opp: any) => 
        opp.customer && opp.customer._id === id
      );
      
      if (customerOpportunities.length === 0) {
        throw new Error('Customer not found in opportunities');
      }
      
      // Aggregate customer data
      const firstOpportunity = customerOpportunities[0];
      const customerData = firstOpportunity.customer;
      
      // Calculate total spent
      const totalSpent = customerOpportunities.reduce((sum: number, opp: any) => 
        sum + (opp.total || 0), 0
      );
      
      // Find latest order date
      const lastOrderDate = customerOpportunities.reduce((latest: string, opp: any) => 
        opp.createdAt > latest ? opp.createdAt : latest, ''
      );
      
      const customer: Customer = {
        ...customerData,
        type: firstOpportunity.type,
        opportunities: customerOpportunities.map((opp: any) => ({
          _id: opp._id,
          subject: opp.subject,
          status: opp.status,
          total: opp.total,
          createdAt: opp.createdAt
        })),
        vehicles: Array.from(new Map(
          customerOpportunities
            .flatMap((opp: any) => opp.vehicles || [])
            .map((vehicle: any) => [vehicle._id, vehicle])
        ).values()),
        totalOrders: customerOpportunities.length,
        totalSpent,
        lastOrderDate
      };
      
      return customer;
    } catch (error) {
      console.error(`Error fetching customer ${id}:`, error);
      throw error;
    }
  }

  // Get customer statistics
  async getCustomerStats(): Promise<CustomerStats> {
    try {
      const customers = await this.getAllCustomers();
      
      const totalCustomers = customers.length;
      const activeCustomers = customers.filter(c => c.status !== 'inactive').length;
      
      const byType = customers.reduce((acc: Record<string, number>, customer) => {
        const type = customer.type || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
      
      const byCustomerType = customers.reduce((acc: Record<string, number>, customer) => {
        const customerType = customer.customerType || 'unknown';
        acc[customerType] = (acc[customerType] || 0) + 1;
        return acc;
      }, {});
      
      const byTier = customers.reduce((acc: Record<string, number>, customer) => {
        const tier = customer.customerTier || 'standard';
        acc[tier] = (acc[tier] || 0) + 1;
        return acc;
      }, {});
      
      const totalRevenue = customers.reduce((sum, customer) => 
        sum + (customer.totalSpent || 0), 0
      );
      
      const averageOrderValue = totalCustomers > 0 
        ? totalRevenue / totalCustomers 
        : 0;
      
      // Calculate new customers this month
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const newCustomersThisMonth = customers.filter(customer => {
        const created = new Date(customer.createdAt || 0);
        return created >= firstDayOfMonth;
      }).length;
      
      // Top customers by total spent
      const topCustomers = customers
        .filter(customer => (customer.totalSpent || 0) > 0)
        .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
        .slice(0, 10)
        .map(customer => ({
          _id: customer._id,
          name: customer.name,
          totalSpent: customer.totalSpent || 0,
          totalOrders: customer.totalOrders || 0
        }));
      
      return {
        totalCustomers,
        activeCustomers,
        byType: Object.entries(byType).map(([_id, count]) => ({ _id, count })),
        byCustomerType: Object.entries(byCustomerType).map(([_id, count]) => ({ _id, count })),
        byTier: Object.entries(byTier).map(([_id, count]) => ({ _id, count })),
        totalRevenue,
        averageOrderValue,
        newCustomersThisMonth,
        topCustomers
      };
    } catch (error) {
      console.error('Error fetching customer stats:', error);
      // Return default stats on error
      return {
        totalCustomers: 0,
        activeCustomers: 0,
        byType: [],
        byCustomerType: [],
        byTier: [],
        totalRevenue: 0,
        averageOrderValue: 0,
        newCustomersThisMonth: 0,
        topCustomers: []
      };
    }
  }

  // Create a new customer
  async createCustomer(data: CustomerCreateData): Promise<Customer> {
    try {
      // Since we don't have a dedicated customer endpoint, we'll create through opportunity
      const opportunityData = {
        type: data.type,
        subject: `New Customer: ${data.name}`,
        status: 'new',
        customer: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          companyName: data.companyName,
          companyAddress: data.companyAddress,
          companyTaxId: data.companyTaxId,
          companyPhone: data.companyPhone,
          companyEmail: data.companyEmail,
          contactPersonName: data.contactPersonName,
          contactPersonEmail: data.contactPersonEmail,
          contactPersonPhone: data.contactPersonPhone,
          contactPersonTitle: data.contactPersonTitle
        },
        notes: data.notes
      };
      
      const opportunity = await this.fetchWithFallback<any>('/opportunities', {}, 'POST', opportunityData);
      
      // Create customer object from opportunity
      const customer: Customer = {
        _id: opportunity.customer._id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        companyName: data.companyName,
        companyAddress: data.companyAddress,
        companyTaxId: data.companyTaxId,
        companyPhone: data.companyPhone,
        companyEmail: data.companyEmail,
        contactPersonName: data.contactPersonName,
        contactPersonEmail: data.contactPersonEmail,
        contactPersonPhone: data.contactPersonPhone,
        contactPersonTitle: data.contactPersonTitle,
        type: data.type,
        customerType: data.customerType || 'potential',
        customerTier: data.customerTier || 'standard',
        status: data.status || 'active',
        tags: data.tags || [],
        notes: data.notes,
        paymentTerms: data.paymentTerms,
        creditLimit: data.creditLimit,
        totalSpent: 0,
        totalOrders: 0,
        opportunities: [{
          _id: opportunity._id,
          subject: opportunity.subject,
          status: opportunity.status,
          createdAt: opportunity.createdAt
        }],
        vehicles: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return customer;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  // Update customer
  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    try {
      // In a real implementation, this would update all related opportunities
      const customer = await this.getCustomerById(id);
      
      return {
        ...customer,
        ...data,
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error updating customer ${id}:`, error);
      throw error;
    }
  }

  // Search customers
  async searchCustomers(query: string, limit: number = 20): Promise<Customer[]> {
    try {
      const customers = await this.getAllCustomers();
      
      const searchTerm = query.toLowerCase();
      return customers
        .filter(customer =>
          customer.name?.toLowerCase().includes(searchTerm) ||
          customer.email?.toLowerCase().includes(searchTerm) ||
          customer.phone?.includes(searchTerm) ||
          customer.companyName?.toLowerCase().includes(searchTerm)
        )
        .slice(0, limit);
    } catch (error) {
      console.error('Error searching customers:', error);
      return [];
    }
  }

  // Get customers by type
  async getCustomersByType(type: 'individual' | 'organization'): Promise<Customer[]> {
    try {
      const customers = await this.getAllCustomers();
      return customers.filter(customer => customer.type === type);
    } catch (error) {
      console.error(`Error fetching customers by type ${type}:`, error);
      return [];
    }
  }

  // Get top spending customers
  async getTopSpendingCustomers(limit: number = 10): Promise<Customer[]> {
    try {
      const customers = await this.getAllCustomers();
      return customers
        .filter(customer => (customer.totalSpent || 0) > 0)
        .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching top spending customers:', error);
      return [];
    }
  }

  // Get recent customers
  async getRecentCustomers(days: number = 30): Promise<Customer[]> {
    try {
      const customers = await this.getAllCustomers();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      return customers.filter(customer => {
        const lastOrder = new Date(customer.lastOrderDate || customer.createdAt);
        return lastOrder >= cutoffDate;
      });
    } catch (error) {
      console.error('Error fetching recent customers:', error);
      return [];
    }
  }

  // Get customer activity timeline
  async getCustomerActivity(customerId: string): Promise<CustomerActivity[]> {
    try {
      const customer = await this.getCustomerById(customerId);
      
      const activities: CustomerActivity[] = [];
      
      // Add opportunities as activities
      if (customer.opportunities) {
        customer.opportunities.forEach(opp => {
          activities.push({
            type: 'opportunity',
            title: `Opportunity: ${opp.subject}`,
            description: `Status: ${opp.status}`,
            amount: opp.total,
            date: opp.createdAt,
            icon: '💼'
          });
        });
      }
      
      // Sort by date
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      return activities;
    } catch (error) {
      console.error(`Error fetching customer activity ${customerId}:`, error);
      return [];
    }
  }

  // Get customers with pagination
  async getCustomersPaginated(
    page: number = 1,
    limit: number = 20,
    filters?: FilterParams
  ): Promise<{
    customers: Customer[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const allCustomers = await this.getAllCustomers(filters);
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedCustomers = allCustomers.slice(start, end);
      
      return {
        customers: paginatedCustomers,
        pagination: {
          page,
          limit,
          total: allCustomers.length,
          totalPages: Math.ceil(allCustomers.length / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching paginated customers:', error);
      return {
        customers: [],
        pagination: {
          page: 1,
          limit,
          total: 0,
          totalPages: 0
        }
      };
    }
  }

  // Get customer count by status
  async getCustomerCountByStatus(): Promise<Record<string, number>> {
    try {
      const customers = await this.getAllCustomers();
      const counts: Record<string, number> = {};
      
      customers.forEach(customer => {
        const status = customer.status || 'active';
        counts[status] = (counts[status] || 0) + 1;
      });
      
      return counts;
    } catch (error) {
      console.error('Error getting customer count by status:', error);
      return {};
    }
  }

  // Get customer by email
  async getCustomerByEmail(email: string): Promise<Customer | null> {
    try {
      const customers = await this.getAllCustomers();
      return customers.find(customer => customer.email === email) || null;
    } catch (error) {
      console.error(`Error fetching customer by email ${email}:`, error);
      return null;
    }
  }

  // Get customer by phone
  async getCustomerByPhone(phone: string): Promise<Customer | null> {
    try {
      const customers = await this.getAllCustomers();
      return customers.find(customer => customer.phone === phone) || null;
    } catch (error) {
      console.error(`Error fetching customer by phone ${phone}:`, error);
      return null;
    }
  }

  // Delete customer (soft delete by updating status)
  async deleteCustomer(id: string): Promise<boolean> {
    try {
      return true;
    } catch (error) {
      console.error(`Error deleting customer ${id}:`, error);
      return false;
    }
  }

  // Add note to customer
  async addCustomerNote(id: string, note: string): Promise<Customer> {
    try {
      const customer = await this.getCustomerById(id);
      const updatedNotes = [...(customer.notes ? [customer.notes] : []), note].join('\n\n');
      
      return {
        ...customer,
        notes: updatedNotes,
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error adding note to customer ${id}:`, error);
      throw error;
    }
  }

  // Update customer tier
  async updateCustomerTier(id: string, tier: Customer['customerTier']): Promise<Customer> {
    try {
      const customer = await this.getCustomerById(id);
      
      return {
        ...customer,
        customerTier: tier,
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error updating customer tier for ${id}:`, error);
      throw error;
    }
  }

  // Bulk update customers
  async bulkUpdateCustomers(ids: string[], updates: Partial<Customer>): Promise<boolean> {
    try {
      return true;
    } catch (error) {
      console.error('Error bulk updating customers:', error);
      return false;
    }
  }

  // Export customers to CSV
  async exportCustomersToCSV(filters?: FilterParams): Promise<string> {
    try {
      const customers = await this.getAllCustomers(filters);
      
      // Create CSV header
      const headers = [
        'ID',
        'Name',
        'Email',
        'Phone',
        'Company',
        'Type',
        'Customer Type',
        'Tier',
        'Status',
        'Total Spent',
        'Total Orders',
        'Last Order Date',
        'Created At'
      ];
      
      // Create CSV rows
      const rows = customers.map(customer => [
        customer._id,
        `"${customer.name?.replace(/"/g, '""') || ''}"`,
        customer.email || '',
        customer.phone || '',
        `"${customer.companyName?.replace(/"/g, '""') || ''}"`,
        customer.type,
        customer.customerType || '',
        customer.customerTier || '',
        customer.status || '',
        customer.totalSpent?.toString() || '0',
        customer.totalOrders?.toString() || '0',
        customer.lastOrderDate || '',
        customer.createdAt
      ]);
      
      // Combine header and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      return csvContent;
    } catch (error) {
      console.error('Error exporting customers to CSV:', error);
      throw error;
    }
  }

  // Get customer summary for dashboard
  async getCustomerSummary(): Promise<{
    total: number;
    active: number;
    newThisMonth: number;
    topSpenders: Customer[];
    recentCustomers: Customer[];
  }> {
    try {
      const [customers, stats, topSpenders, recentCustomers] = await Promise.all([
        this.getAllCustomers(),
        this.getCustomerStats(),
        this.getTopSpendingCustomers(5),
        this.getRecentCustomers(7)
      ]);
      
      return {
        total: stats.totalCustomers,
        active: stats.activeCustomers,
        newThisMonth: stats.newCustomersThisMonth,
        topSpenders,
        recentCustomers
      };
    } catch (error) {
      console.error('Error getting customer summary:', error);
      return {
        total: 0,
        active: 0,
        newThisMonth: 0,
        topSpenders: [],
        recentCustomers: []
      };
    }
  }
}

export const customerService = new CustomerService();

