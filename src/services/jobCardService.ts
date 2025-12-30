import { apiClient } from '@/lib/api/client';

export interface UserRef {
  _id?: string;
  id?: string;
  email?: string;
  role?: string;
  name?: string;
}

export interface OpportunityRef {
  _id?: string;
  id?: string;
  subject?: string;
  type?: string;
  companyName?: string;
}

export interface VehicleRef {
  _id?: string;
  id?: string;
  registrationNumber?: string;
  make?: string;
  model?: string;
  vin?: string;
}

export interface JobCard {
  id: string;
  _id?: string;
  opportunityId: OpportunityRef | string;
  vehicleId: VehicleRef | string;
  createdBy: UserRef | string;
  assignedTo?: UserRef | string;
  jobTitle: string;
  jobDescription?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  startDate?: string;
  endDate?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  estimatedHours?: number;
  actualHours?: number;
  laborCost?: number;
  partsCost?: number;
  totalCost?: number;
  jobNumber?: string;
  notes?: string[];
  partsUsed?: any[];
  completedDate?: string;
}

// In your jobCardService.ts file, update the CreateJobCardData interface

export interface CreateJobCardData {
  opportunityId: string;
  vehicleId: string;
  jobTitle: string;
  jobDescription?: string;
  assignedTo?: string;
}

export interface UpdateJobCardData {
  jobTitle?: string;
  jobDescription?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  startDate?: string;
  endDate?: string;
  assignedTo?: string;
  active?: boolean;
}

export interface JobCardFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  vehicleId?: string;
  opportunityId?: string;
  assignedTo?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  sort?: string;
}

class JobCardService {
  /**
   * Create a new job card
   * POST /api/v1/jobcards
   */
  async createJobCard(data: CreateJobCardData, userId?: string): Promise<JobCard> {
    try {
      const response = await apiClient.post<CreateJobCardData, any>('/jobcards', data);
      return this.normalizeJobCard(response);
    } catch (error) {
      console.error('Error creating job card:', error);
      throw error;
    }
  }

  /**
   * Get all job cards
   * GET /api/v1/jobcards
   */
  async getAllJobCards(params?: JobCardFilterParams): Promise<JobCard[]> {
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
      const endpoint = `/jobcards${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get<any[]>(endpoint);
      return response.map(jobCard => this.normalizeJobCard(jobCard));
    } catch (error) {
      console.error('Error fetching job cards:', error);
      throw error;
    }
  }

  /**
   * Get a job card by ID
   * GET /api/v1/jobcards/{id}
   */
  async getJobCardById(id: string): Promise<JobCard> {
    try {
      const response = await apiClient.get<any>(`/jobcards/${id}`);
      return this.normalizeJobCard(response);
    } catch (error) {
      console.error(`Error fetching job card ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update a job card
   * PUT /api/v1/jobcards/{id}
   */
  async updateJobCard(id: string, data: UpdateJobCardData, userRole?: string, userId?: string): Promise<JobCard> {
    try {
      const response = await apiClient.put<UpdateJobCardData, any>(`/jobcards/${id}`, data);
      return this.normalizeJobCard(response);
    } catch (error) {
      console.error(`Error updating job card ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a job card
   * DELETE /api/v1/jobcards/{id}
   */
  async deleteJobCard(id: string, userId?: string): Promise<{ message: string }> {
    try {
      return await apiClient.delete<{ message: string }>(`/jobcards/${id}`);
    } catch (error) {
      console.error(`Error deleting job card ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get job cards by vehicle ID
   * GET /api/v1/jobcards/vehicle/{vehicleId}
   */
  async getJobCardsByVehicle(vehicleId: string): Promise<JobCard[]> {
    try {
      const response = await apiClient.get<any[]>(`/jobcards/vehicle/${vehicleId}`);
      return response.map(jobCard => this.normalizeJobCard(jobCard));
    } catch (error) {
      console.error(`Error fetching job cards for vehicle ${vehicleId}:`, error);
      throw error;
    }
  }

  /**
   * Normalize job card data from backend
   */
  private normalizeJobCard(data: any): JobCard {
    return {
      id: data._id || data.id,
      _id: data._id,
      opportunityId: data.opportunityId,
      vehicleId: data.vehicleId,
      createdBy: data.createdBy,
      assignedTo: data.assignedTo,
      jobTitle: data.jobTitle,
      jobDescription: data.jobDescription,
      status: data.status || 'pending',
      startDate: data.startDate,
      endDate: data.endDate,
      active: data.active !== undefined ? data.active : true,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      priority: data.priority || 'medium',
      estimatedHours: data.estimatedHours || 0,
      actualHours: data.actualHours || 0,
      laborCost: data.laborCost || 0,
      partsCost: data.partsCost || 0,
      totalCost: data.totalCost || 0,
      jobNumber: data.jobNumber || `JC-${(data._id || data.id).slice(-6)}`,
      notes: data.notes || [],
      partsUsed: data.partsUsed || [],
      completedDate: data.completedDate
    };
  }

  /**
   * Get job cards by status
   */
  async getJobCardsByStatus(status: string): Promise<JobCard[]> {
    try {
      const jobCards = await this.getAllJobCards({ status });
      return jobCards.filter(jobCard => jobCard.status === status);
    } catch (error) {
      console.error(`Error fetching job cards with status ${status}:`, error);
      throw error;
    }
  }

  /**
   * Get pending job cards
   */
  async getPendingJobCards(): Promise<JobCard[]> {
    return this.getJobCardsByStatus('pending');
  }

  /**
   * Get in-progress job cards
   */
  async getInProgressJobCards(): Promise<JobCard[]> {
    return this.getJobCardsByStatus('in_progress');
  }

  /**
   * Get completed job cards
   */
  async getCompletedJobCards(): Promise<JobCard[]> {
    return this.getJobCardsByStatus('completed');
  }

  /**
   * Get cancelled job cards
   */
  async getCancelledJobCards(): Promise<JobCard[]> {
    return this.getJobCardsByStatus('cancelled');
  }

  /**
   * Search job cards
   */
  async searchJobCards(searchTerm: string): Promise<JobCard[]> {
    try {
      const jobCards = await this.getAllJobCards();
      return jobCards.filter(jobCard => 
        jobCard.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        jobCard.jobDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof jobCard.vehicleId === 'object' && 
         jobCard.vehicleId.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (typeof jobCard.opportunityId === 'object' && 
         jobCard.opportunityId.subject?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    } catch (error) {
      console.error('Error searching job cards:', error);
      throw error;
    }
  }

  /**
   * Get job cards by assigned user
   */
  async getJobCardsByAssignedUser(userId: string): Promise<JobCard[]> {
    try {
      const jobCards = await this.getAllJobCards();
      return jobCards.filter(jobCard => {
        if (typeof jobCard.assignedTo === 'string') {
          return jobCard.assignedTo === userId;
        }
        return jobCard.assignedTo?._id === userId || jobCard.assignedTo?.id === userId;
      });
    } catch (error) {
      console.error(`Error fetching job cards for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get job cards by creator
   */
  async getJobCardsByCreator(userId: string): Promise<JobCard[]> {
    try {
      const jobCards = await this.getAllJobCards();
      return jobCards.filter(jobCard => {
        if (typeof jobCard.createdBy === 'string') {
          return jobCard.createdBy === userId;
        }
        return jobCard.createdBy?._id === userId || jobCard.createdBy?.id === userId;
      });
    } catch (error) {
      console.error(`Error fetching job cards created by user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get active job cards only
   */
  async getActiveJobCards(): Promise<JobCard[]> {
    try {
      const jobCards = await this.getAllJobCards();
      return jobCards.filter(jobCard => jobCard.active !== false);
    } catch (error) {
      console.error('Error fetching active job cards:', error);
      throw error;
    }
  }

  /**
   * Get job cards statistics
   */
  async getJobCardStatistics(): Promise<{
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    cancelled: number;
    byVehicle: Record<string, number>;
    byStatus: Record<string, number>;
    byAssignedTo: Record<string, number>;
  }> {
    try {
      const jobCards = await this.getAllJobCards();
      
      const byVehicle: Record<string, number> = {};
      const byStatus: Record<string, number> = {};
      const byAssignedTo: Record<string, number> = {};
      
      let pending = 0;
      let in_progress = 0;
      let completed = 0;
      let cancelled = 0;
      
      jobCards.forEach(jobCard => {
        // Count by status
        byStatus[jobCard.status] = (byStatus[jobCard.status] || 0) + 1;
        
        switch (jobCard.status) {
          case 'pending': pending++; break;
          case 'in_progress': in_progress++; break;
          case 'completed': completed++; break;
          case 'cancelled': cancelled++; break;
        }
        
        // Count by vehicle
        let vehicleId: string;
        if (typeof jobCard.vehicleId === 'string') {
          vehicleId = jobCard.vehicleId;
        } else {
          vehicleId = jobCard.vehicleId?._id || jobCard.vehicleId?.id || 'unknown';
        }
        byVehicle[vehicleId] = (byVehicle[vehicleId] || 0) + 1;
        
        // Count by assigned user
        if (jobCard.assignedTo) {
          let assignedToId: string;
          if (typeof jobCard.assignedTo === 'string') {
            assignedToId = jobCard.assignedTo;
          } else {
            assignedToId = jobCard.assignedTo._id || jobCard.assignedTo.id || 'unknown';
          }
          byAssignedTo[assignedToId] = (byAssignedTo[assignedToId] || 0) + 1;
        }
      });
      
      return {
        total: jobCards.length,
        pending,
        in_progress,
        completed,
        cancelled,
        byVehicle,
        byStatus,
        byAssignedTo,
      };
    } catch (error) {
      console.error('Error calculating job card statistics:', error);
      throw error;
    }
  }

  /**
   * Get job card status color for UI
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'warning';
      case 'in_progress': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  }

  /**
   * Get job card status text for UI
   */
  getStatusText(status: string): string {
    switch (status) {
      case 'pending': return 'Pending';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  }

  /**
   * Get job card status icon
   */
  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return '⏰';
      case 'in_progress': return '⚙️';
      case 'completed': return '✅';
      case 'cancelled': return '❌';
      default: return '📋';
    }
  }

  /**
   * Calculate job card duration
   */
  calculateDuration(startDate?: string, endDate?: string): string {
    if (!startDate) return 'Not started';
    
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    if (isNaN(start.getTime())) return 'Invalid date';
    
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  }

  /**
   * Check if job card can be updated
   */
  canUpdateJobCard(jobCard: JobCard, userRole?: string): boolean {
    if (jobCard.status === 'completed' || jobCard.status === 'cancelled') {
      return false;
    }
    
    // Add role-based permissions if needed
    if (userRole) {
      const allowedRoles = ['admin', 'management', 'technician'];
      if (!allowedRoles.includes(userRole)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Check if job card can be deleted
   */
  canDeleteJobCard(jobCard: JobCard, userRole?: string): boolean {
    if (jobCard.status === 'completed') {
      return false;
    }
    
    // Add role-based permissions if needed
    if (userRole) {
      const allowedRoles = ['admin', 'management'];
      if (!allowedRoles.includes(userRole)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get assigned user display name
   */
  getAssignedUserDisplayName(jobCard: JobCard): string {
    if (!jobCard.assignedTo) return 'Unassigned';
    
    if (typeof jobCard.assignedTo === 'object' && jobCard.assignedTo !== null) {
      return jobCard.assignedTo.name || jobCard.assignedTo.email || 'Unknown User';
    }
    
    return 'User ID: ' + jobCard.assignedTo;
  }

  /**
   * Get vehicle display name
   */
  getVehicleDisplayName(jobCard: JobCard): string {
    if (!jobCard.vehicleId) return 'No Vehicle';
    
    if (typeof jobCard.vehicleId === 'object' && jobCard.vehicleId !== null) {
      return `${jobCard.vehicleId.registrationNumber} - ${jobCard.vehicleId.make} ${jobCard.vehicleId.model}`;
    }
    
    return 'Vehicle ID: ' + jobCard.vehicleId;
  }

  /**
   * Get opportunity display name
   */
  getOpportunityDisplayName(jobCard: JobCard): string {
    if (!jobCard.opportunityId) return 'No Opportunity';
    
    if (typeof jobCard.opportunityId === 'object' && jobCard.opportunityId !== null) {
      return jobCard.opportunityId.subject || 'Opportunity';
    }
    
    return 'Opportunity ID: ' + jobCard.opportunityId;
  }

  /**
   * Format job card for select dropdown
   */
  formatJobCardForSelect(jobCard: JobCard): { value: string; label: string } {
    return {
      value: jobCard.id,
      label: `${jobCard.jobTitle} (${this.getVehicleDisplayName(jobCard)})`
    };
  }

  /**
   * Get job cards for select dropdown
   */
  async getJobCardsForSelect(): Promise<Array<{ value: string; label: string }>> {
    try {
      const jobCards = await this.getActiveJobCards();
      return jobCards.map(jobCard => this.formatJobCardForSelect(jobCard));
    } catch (error) {
      console.error('Error getting job cards for select:', error);
      throw error;
    }
  }

  /**
   * Get job card statistics
   */
  async getJobCardStats(): Promise<any> {
    try {
      const jobCards = await this.getAllJobCards();
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Calculate statistics
      const byStatus = [
        { _id: 'pending', count: jobCards.filter(jc => jc.status === 'pending').length },
        { _id: 'assigned', count: jobCards.filter(jc => jc.status === 'pending' && jc.assignedTo).length },
        { _id: 'in_progress', count: jobCards.filter(jc => jc.status === 'in_progress').length },
        { _id: 'completed', count: jobCards.filter(jc => jc.status === 'completed').length },
        { _id: 'cancelled', count: jobCards.filter(jc => jc.status === 'cancelled').length },
        { _id: 'on_hold', count: 0 } // Default to 0 if not in your model
      ].filter(item => item.count > 0);

      const todayCompleted = jobCards.filter(jc => {
        if (jc.status !== 'completed' || !jc.endDate) return false;
        const endDate = new Date(jc.endDate);
        return endDate >= today;
      }).length;

      return {
        total: jobCards.length,
        byStatus,
        todayCompleted
      };
    } catch (error) {
      console.error('Error fetching job card stats:', error);
      throw error;
    }
  }

  /**
   * Get priority color
   */
  getPriorityColor(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'high': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  /**
   * Calculate completion percentage
   */
  calculateCompletionPercentage(jobCard: any): number {
    switch (jobCard.status) {
      case 'pending': return 0;
      case 'assigned': return 10;
      case 'in_progress': return 50;
      case 'on_hold': return 25;
      case 'completed': return 100;
      case 'cancelled': return 0;
      default: return 0;
    }
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2
    }).format(amount || 0);
  }

  /**
   * Update job card status (wrapper for updateJobCard)
   */
  async updateJobCardStatus(id: string, status: string): Promise<JobCard> {
    return this.updateJobCard(id, { status: status as any });
  }
}

export const jobCardService = new JobCardService();

// Status constants for easier reference
export const JOB_CARD_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Helper function to create a job card status checker
export const createJobCardStatusChecker = (jobCard: JobCard) => {
  return {
    isPending: () => jobCard.status === JOB_CARD_STATUS.PENDING,
    isInProgress: () => jobCard.status === JOB_CARD_STATUS.IN_PROGRESS,
    isCompleted: () => jobCard.status === JOB_CARD_STATUS.COMPLETED,
    isCancelled: () => jobCard.status === JOB_CARD_STATUS.CANCELLED,
    canUpdate: (userRole?: string) => jobCardService.canUpdateJobCard(jobCard, userRole),
    canDelete: (userRole?: string) => jobCardService.canDeleteJobCard(jobCard, userRole),
    getStatusColor: () => jobCardService.getStatusColor(jobCard.status),
    getStatusText: () => jobCardService.getStatusText(jobCard.status),
    getStatusIcon: () => jobCardService.getStatusIcon(jobCard.status),
    getDuration: () => jobCardService.calculateDuration(jobCard.startDate, jobCard.endDate),
  };
};