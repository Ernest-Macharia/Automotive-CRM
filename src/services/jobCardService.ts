import { apiClient } from '@/lib/api/client';

export interface JobCard {
  _id: string;
  jobNumber: string;
  opportunityId: string | {
    _id: string;
    subject: string;
    customer: {
      name: string;
      email?: string;
      phone?: string;
      companyName?: string;
    };
  };
  vehicleId: string | {
    _id: string;
    registrationNumber: string;
    make: string;
    model: string;
    year?: number;
    vin?: string;
    customerId?: string;
  };
  jobTitle: string;
  jobDescription: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: string | {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  estimatedHours?: number;
  actualHours?: number;
  startDate?: string;
  endDate?: string;
  completedDate?: string;
  partsUsed?: Array<{
    partId: string;
    partNumber: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalCost: number;
  }>;
  laborCost?: number;
  partsCost?: number;
  totalCost?: number;
  notes?: string[];
  attachments?: string[];
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobCardData {
  opportunityId: string;
  vehicleId: string;
  jobTitle: string;
  jobDescription: string;
  assignedTo: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  estimatedHours?: number;
  startDate?: string;
  endDate?: string;
  notes?: string[];
}

export interface UpdateJobCardData {
  jobTitle?: string;
  jobDescription?: string;
  status?: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  estimatedHours?: number;
  actualHours?: number;
  startDate?: string;
  endDate?: string;
  completedDate?: string;
  partsUsed?: Array<{
    partId: string;
    partNumber: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalCost: number;
  }>;
  laborCost?: number;
  partsCost?: number;
  totalCost?: number;
  notes?: string[];
  attachments?: string[];
}

export interface FilterParams {
  status?: string;
  priority?: string;
  assignedTo?: string;
  vehicleId?: string;
  opportunityId?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface JobCardsResponse {
  data: JobCard[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats?: JobCardStats;
}

export interface JobCardStats {
  total: number;
  byStatus: Array<{
    _id: string;
    count: number;
    totalHours: number;
  }>;
  byPriority: Array<{
    _id: string;
    count: number;
  }>;
  byTechnician: Array<{
    _id: string;
    count: number;
    completedCount: number;
    totalHours: number;
  }>;
  summary: {
    totalOpen: number;
    totalCompleted: number;
    totalHours: number;
    avgCompletionTime: number;
    pendingCount: number;
    inProgressCount: number;
  };
}

class JobCardService {
  private basePath = '/jobcards';

  async getAllJobCards(params?: FilterParams): Promise<JobCardsResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const endpoint = `${this.basePath}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiClient.get<any>(endpoint);
      
      return {
        data: response.data || response,
        pagination: response.pagination,
        stats: response.stats
      };
    } catch (error) {
      console.error('Error fetching job cards:', error);
      throw error;
    }
  }

  async getJobCardById(id: string): Promise<JobCard> {
    try {
      return await apiClient.get<JobCard>(`${this.basePath}/${id}`);
    } catch (error) {
      console.error(`Error fetching job card ${id}:`, error);
      throw error;
    }
  }

  async getJobCardsByVehicle(vehicleId: string): Promise<JobCardsResponse> {
    try {
      const response = await apiClient.get<any>(`${this.basePath}/vehicle/${vehicleId}`);
      return {
        data: response.data || response,
        pagination: undefined,
        stats: undefined
      };
    } catch (error) {
      console.error(`Error fetching job cards for vehicle ${vehicleId}:`, error);
      throw error;
    }
  }

  async getJobCardsByOpportunity(opportunityId: string): Promise<JobCardsResponse> {
    try {
      const response = await apiClient.get<any>(`${this.basePath}/opportunity/${opportunityId}`);
      return {
        data: response.data || response,
        pagination: undefined,
        stats: undefined
      };
    } catch (error) {
      console.error(`Error fetching job cards for opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  async createJobCard(data: CreateJobCardData): Promise<JobCard> {
    try {
      const formattedData = {
        opportunityId: data.opportunityId,
        vehicleId: data.vehicleId,
        jobTitle: data.jobTitle,
        jobDescription: data.jobDescription,
        assignedTo: data.assignedTo,
        priority: data.priority || 'medium',
        estimatedHours: data.estimatedHours || 0,
        status: 'pending' as const,
        startDate: data.startDate || new Date().toISOString(),
        endDate: data.endDate,
        notes: data.notes || []
      };

      return await apiClient.post<any, JobCard>(this.basePath, formattedData);
    } catch (error) {
      console.error('Error creating job card:', error);
      throw error;
    }
  }

  async updateJobCard(id: string, data: UpdateJobCardData): Promise<JobCard> {
    try {
      return await apiClient.put<UpdateJobCardData, JobCard>(`${this.basePath}/${id}`, data);
    } catch (error) {
      console.error(`Error updating job card ${id}:`, error);
      throw error;
    }
  }

  async deleteJobCard(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.basePath}/${id}`);
    } catch (error) {
      console.error(`Error deleting job card ${id}:`, error);
      throw error;
    }
  }

  async updateJobCardStatus(id: string, status: JobCard['status']): Promise<JobCard> {
    try {
      return await apiClient.patch<any, JobCard>(`${this.basePath}/${id}/status`, { status });
    } catch (error) {
      console.error(`Error updating job card status ${id}:`, error);
      throw error;
    }
  }

  async assignJobCard(id: string, technicianId: string): Promise<JobCard> {
    try {
      return await apiClient.patch<any, JobCard>(`${this.basePath}/${id}/assign`, { assignedTo: technicianId });
    } catch (error) {
      console.error(`Error assigning job card ${id}:`, error);
      throw error;
    }
  }

  async addPartToJobCard(id: string, partData: {
    partId: string;
    partNumber: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }): Promise<JobCard> {
    try {
      const totalCost = partData.quantity * partData.unitPrice;
      return await apiClient.post<any, JobCard>(`${this.basePath}/${id}/parts`, {
        ...partData,
        totalCost
      });
    } catch (error) {
      console.error(`Error adding part to job card ${id}:`, error);
      throw error;
    }
  }

  async updateTimeSpent(id: string, actualHours: number): Promise<JobCard> {
    try {
      return await apiClient.patch<any, JobCard>(`${this.basePath}/${id}/time`, { actualHours });
    } catch (error) {
      console.error(`Error updating time for job card ${id}:`, error);
      throw error;
    }
  }

  async getJobCardStats(): Promise<JobCardStats> {
    try {
      return await apiClient.get<JobCardStats>(`${this.basePath}/stats/summary`);
    } catch (error) {
      console.error('Error fetching job card stats:', error);
      throw error;
    }
  }

  async getRecentJobCards(limit: number = 10): Promise<JobCardsResponse> {
    try {
      const response = await apiClient.get<any>(`${this.basePath}/recent?limit=${limit}`);
      return {
        data: response.data || response,
        pagination: undefined,
        stats: undefined
      };
    } catch (error) {
      console.error('Error fetching recent job cards:', error);
      throw error;
    }
  }

  // Utility methods for UI
  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'on_hold': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-yellow-100 text-yellow-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return '⏰';
      case 'assigned': return '👤';
      case 'in_progress': return '⚙️';
      case 'completed': return '✅';
      case 'cancelled': return '❌';
      case 'on_hold': return '⏸️';
      default: return '📝';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2
    }).format(amount);
  }

  generateJobNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `JC-${timestamp}-${random.toString().padStart(3, '0')}`;
  }

  calculateCompletionPercentage(jobCard: JobCard): number {
    if (jobCard.status === 'completed') return 100;
    if (jobCard.status === 'cancelled') return 0;
    
    // Simple progress calculation based on status
    const statusProgress = {
      'pending': 10,
      'assigned': 30,
      'in_progress': 60,
      'on_hold': 40
    };
    
    return statusProgress[jobCard.status] || 0;
  }
}

export const jobCardService = new JobCardService();