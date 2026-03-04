import { apiClient } from '@/lib/api/client';

export interface UserRef {
  _id?: string;
  id?: string;
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
}

export interface FeedbackComment {
  _id?: string;
  content: string;
  userName?: string;
  userEmail?: string;
  isInternal?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Feedback {
  id: string;
  _id?: string;
  section: string;
  type: string;
  title: string;
  description: string;
  suggestion?: string;
  status?: 'new' | 'reviewed' | 'in_progress' | 'resolved' | 'rejected' | 'duplicate';
  priority: 'low' | 'medium' | 'high' | 'critical';
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  tags?: string[];
  currentUrl?: string;
  isAnonymous?: boolean;
  allowContact?: boolean;
  browserInfo?: string;
  deviceInfo?: string;
  voteCount: number;
  votedBy?: string[];
  assignedTo?: UserRef | string | null;
  assignedAt?: string;
  comments?: FeedbackComment[];
  screenshot?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFeedbackData {
  section: string;
  type: string;
  title: string;
  description: string;
  suggestion?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
  currentUrl?: string;
  isAnonymous?: boolean;
  allowContact?: boolean;
  browserInfo?: string;
  deviceInfo?: string;
}

export interface CreateFeedbackWithScreenshotData {
  section: string;
  type: string;
  title: string;
  description: string;
  suggestion?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  currentUrl?: string;
  screenshot?: File;
}

export interface UpdateFeedbackData {
  section?: string;
  type?: string;
  title?: string;
  description?: string;
  suggestion?: string;
  status?: 'new' | 'reviewed' | 'in_progress' | 'resolved' | 'rejected' | 'duplicate';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  tags?: string[];
}

export interface FeedbackFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  section?: string;
  type?: string;
  priority?: string;
  assignedTo?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  sort?: string;
}

export interface FeedbackStats {
  total: number;
  new: number;
  reviewed: number;
  in_progress: number;
  resolved: number;
  rejected: number;
  duplicate: number;
  bySection: Record<string, number>;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  byAssignedTo: Record<string, number>;
}

export interface SectionOption {
  value: string;
  label: string;
}

export interface TypeOption {
  value: string;
  label: string;
}

class FeedbackService {
  /**
   * Submit new feedback
   * POST /api/v1/feedback
   */
  async createFeedback(data: CreateFeedbackData): Promise<Feedback> {
    try {
      const response = await apiClient.post<CreateFeedbackData, any>('/feedback', data);
      
      if (response.success && response.data) {
        return this.normalizeFeedback(response.data);
      } else if (response._id || response.id) {
        return this.normalizeFeedback(response);
      } else {
        throw new Error('Feedback creation failed: No ID returned');
      }
    } catch (error) {
      console.error('Error creating feedback:', error);
      throw error;
    }
  }

  /**
   * Submit feedback with screenshot
   * POST /api/v1/feedback/with-screenshot
   */

async createFeedbackWithScreenshot(data: FormData): Promise<Feedback> {
    try {
        // If apiClient.post doesn't accept headers as third param, you might need to:
        const response = await apiClient.post<FormData, any>(
        '/feedback/with-screenshot', 
        data
        // If headers need to be passed differently, check your apiClient implementation
        );
        
        return this.normalizeFeedback(response);
    } catch (error) {
        console.error('Error creating feedback with screenshot:', error);
        throw error;
    }
}

  /**
   * Get all feedback (Admin/Support only)
   * GET /api/v1/feedback
   */
  async getAllFeedback(params?: FeedbackFilterParams): Promise<Feedback[]> {
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
      const endpoint = `/feedback${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get<any[]>(endpoint);
      
      let feedbackData: any[] = [];
      
      if (Array.isArray(response)) {
        feedbackData = response;
      } else if (response && Array.isArray(response)) {
        feedbackData = response;
      } else {
        return [];
      }
      
      return feedbackData.map(feedback => this.normalizeFeedback(feedback));
    } catch (error) {
      console.error('Error fetching feedback:', error);
      throw error;
    }
  }

  /**
   * Get public feedback
   * GET /api/v1/feedback/public
   */
  async getPublicFeedback(params?: {
    section?: string;
    type?: string;
    sort?: string;
  }): Promise<Feedback[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value) queryParams.append(key, value);
        });
      }
      
      const queryString = queryParams.toString();
      const endpoint = `/feedback/public${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get<any[]>(endpoint);
      return response.map(feedback => this.normalizeFeedback(feedback));
    } catch (error) {
      console.error('Error fetching public feedback:', error);
      throw error;
    }
  }

  /**
   * Get feedback by ID
   * GET /api/v1/feedback/{id}
   */
  async getFeedbackById(id: string): Promise<Feedback> {
    try {
      const response = await apiClient.get<any>(`/feedback/${id}`);
      
      let feedbackData = response;
      if (response.success && response.data) {
        feedbackData = response.data;
      }
      
      return this.normalizeFeedback(feedbackData);
    } catch (error) {
      console.error(`Error fetching feedback ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update feedback (Admin/Support only)
   * PATCH /api/v1/feedback/{id}
   */
  async updateFeedback(id: string, data: UpdateFeedbackData): Promise<Feedback> {
    try {
      const response = await apiClient.patch<UpdateFeedbackData, any>(`/feedback/${id}`, data);
      return this.normalizeFeedback(response);
    } catch (error) {
      console.error(`Error updating feedback ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete feedback (Admin only)
   * DELETE /api/v1/feedback/{id}
   */
  async deleteFeedback(id: string): Promise<{ message: string }> {
    try {
      return await apiClient.delete<{ message: string }>(`/feedback/${id}`);
    } catch (error) {
      console.error(`Error deleting feedback ${id}:`, error);
      throw error;
    }
  }

  /**
   * Assign feedback to user
   * PATCH /api/v1/feedback/{id}/assign/{userId}
   */
  async assignFeedback(feedbackId: string, userId: string): Promise<Feedback> {
    try {
      const response = await apiClient.patch<any, any>(`/feedback/${feedbackId}/assign/${userId}`, {});
      return this.normalizeFeedback(response);
    } catch (error) {
      console.error(`Error assigning feedback ${feedbackId}:`, error);
      throw error;
    }
  }

  /**
   * Add comment to feedback
   * POST /api/v1/feedback/{id}/comments
   */
  async addComment(feedbackId: string, comment: {
    content: string;
    isInternal?: boolean;
    userName?: string;
    userEmail?: string;
  }): Promise<FeedbackComment> {
    try {
      const response = await apiClient.post<any, any>(`/feedback/${feedbackId}/comments`, comment);
      return response;
    } catch (error) {
      console.error(`Error adding comment to feedback ${feedbackId}:`, error);
      throw error;
    }
  }

  /**
   * Vote on feedback
   * POST /api/v1/feedback/{id}/vote
   */
  async voteFeedback(feedbackId: string): Promise<{ voted: boolean; voteCount: number }> {
    try {
      return await apiClient.post<any, any>(`/feedback/${feedbackId}/vote`, {});
    } catch (error) {
      console.error(`Error voting on feedback ${feedbackId}:`, error);
      throw error;
    }
  }

  /**
   * Get feedback statistics
   * GET /api/v1/feedback/stats/summary
   */
  async getFeedbackStats(): Promise<FeedbackStats> {
    try {
      const response = await apiClient.get<any>('/feedback/stats/summary');
      return response;
    } catch (error) {
      console.error('Error fetching feedback stats:', error);
      throw error;
    }
  }

  /**
   * Get my submitted feedback
   * GET /api/v1/feedback/my/feedback
   */
  async getMyFeedback(): Promise<Feedback[]> {
    try {
      const response = await apiClient.get<any[]>('/feedback/my/feedback');
      return response.map(feedback => this.normalizeFeedback(feedback));
    } catch (error) {
      console.error('Error fetching my feedback:', error);
      throw error;
    }
  }

  /**
   * Get feedback assigned to me
   * GET /api/v1/feedback/my/assigned
   */
  async getAssignedToMe(): Promise<Feedback[]> {
    try {
      const response = await apiClient.get<any[]>('/feedback/my/assigned');
      return response.map(feedback => this.normalizeFeedback(feedback));
    } catch (error) {
      console.error('Error fetching assigned feedback:', error);
      throw error;
    }
  }

  /**
   * Search feedback
   * GET /api/v1/feedback/search/{term}
   */
  async searchFeedback(term: string): Promise<Feedback[]> {
    try {
      const response = await apiClient.get<any[]>(`/feedback/search/${encodeURIComponent(term)}`);
      return response.map(feedback => this.normalizeFeedback(feedback));
    } catch (error) {
      console.error(`Error searching feedback: ${term}`, error);
      throw error;
    }
  }

  /**
   * Get available sections
   * GET /api/v1/feedback/sections/list
   */
  async getSections(): Promise<SectionOption[]> {
    try {
      const response = await apiClient.get<SectionOption[]>('/feedback/sections/list');
      return response;
    } catch (error) {
      console.error('Error fetching sections:', error);
      // Return default sections if API fails
      return [
        { value: 'dashboard', label: 'Dashboard' },
        { value: 'opportunities', label: 'Opportunities' },
        { value: 'quotes', label: 'Quotes' },
        { value: 'work_orders', label: 'Work Orders' },
        { value: 'invoices', label: 'Invoices' },
        { value: 'job_cards', label: 'Job Cards' },
        { value: 'checklists', label: 'Checklists' },
        { value: 'customers', label: 'Customers' },
        { value: 'vehicles', label: 'Vehicles' },
        { value: 'reports', label: 'Reports' },
        { value: 'finance', label: 'Finance' },
        { value: 'settings', label: 'Settings' },
        { value: 'general', label: 'General' },
        { value: 'other', label: 'Other' },
      ];
    }
  }

  /**
   * Get available types
   * GET /api/v1/feedback/types/list
   */
  async getTypes(): Promise<TypeOption[]> {
    try {
      const response = await apiClient.get<TypeOption[]>('/feedback/types/list');
      return response;
    } catch (error) {
      console.error('Error fetching types:', error);
      // Return default types if API fails
      return [
        { value: 'bug', label: 'Bug Report' },
        { value: 'feature_request', label: 'Feature Request' },
        { value: 'improvement', label: 'Improvement' },
        { value: 'complaint', label: 'Complaint' },
        { value: 'compliment', label: 'Compliment' },
        { value: 'question', label: 'Question' },
        { value: 'other', label: 'Other' },
      ];
    }
  }

  /**
   * Normalize feedback data from backend
   */
  private normalizeFeedback(data: any): Feedback {
    let feedbackData = data;
    if (data.data && (data.data._id || data.data.id)) {
      feedbackData = data.data;
    }
    
    const id = feedbackData._id || feedbackData.id;
    
    if (!id) {
      throw new Error('Feedback data missing ID');
    }
    
    // Extract assignedTo
    let assignedTo: UserRef | string | undefined;
    if (typeof feedbackData.assignedTo === 'string') {
      assignedTo = feedbackData.assignedTo;
    } else if (feedbackData.assignedTo?._id) {
      assignedTo = {
        _id: feedbackData.assignedTo._id,
        id: feedbackData.assignedTo._id,
        name: feedbackData.assignedTo.name || 
          (feedbackData.assignedTo.firstName && feedbackData.assignedTo.lastName 
            ? `${feedbackData.assignedTo.firstName} ${feedbackData.assignedTo.lastName}` 
            : ''),
        email: feedbackData.assignedTo.email || '',
        firstName: feedbackData.assignedTo.firstName || '',
        lastName: feedbackData.assignedTo.lastName || '',
      };
    } else if (feedbackData.assignedTo === null || feedbackData.assignedTo === undefined) {
      assignedTo = undefined;
    }
    
    return {
      id: id,
      _id: feedbackData._id,
      section: feedbackData.section || 'general',
      type: feedbackData.type || 'other',
      title: feedbackData.title || 'Untitled Feedback',
      description: feedbackData.description || '',
      suggestion: feedbackData.suggestion || '',
      status: feedbackData.status || 'new',
      priority: feedbackData.priority || 'medium',
      userName: feedbackData.userName,
      userEmail: feedbackData.userEmail,
      userPhone: feedbackData.userPhone,
      tags: feedbackData.tags || [],
      currentUrl: feedbackData.currentUrl,
      isAnonymous: feedbackData.isAnonymous || false,
      allowContact: feedbackData.allowContact || false,
      browserInfo: feedbackData.browserInfo,
      deviceInfo: feedbackData.deviceInfo,
      voteCount: feedbackData.voteCount || 0,
      votedBy: feedbackData.votedBy || [],
      assignedTo: assignedTo,
      assignedAt: feedbackData.assignedAt,
      comments: feedbackData.comments || [],
      screenshot: feedbackData.screenshot,
      createdAt: feedbackData.createdAt,
      updatedAt: feedbackData.updatedAt,
    };
  }

  /**
   * Get status color for UI
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'new': return 'warning';
      case 'reviewed': return 'info';
      case 'in_progress': return 'primary';
      case 'resolved': return 'success';
      case 'rejected': return 'error';
      case 'duplicate': return 'secondary';
      default: return 'default';
    }
  }

  /**
   * Get status text for UI
   */
  getStatusText(status: string): string {
    switch (status) {
      case 'new': return 'New';
      case 'reviewed': return 'Reviewed';
      case 'in_progress': return 'In Progress';
      case 'resolved': return 'Resolved';
      case 'rejected': return 'Rejected';
      case 'duplicate': return 'Duplicate';
      default: return status;
    }
  }

  /**
   * Get priority color for UI
   */
  getPriorityColor(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'high': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  /**
   * Get type icon
   */
  getTypeIcon(type: string): string {
    switch (type) {
      case 'bug': return '🐛';
      case 'feature_request': return '✨';
      case 'improvement': return '🔧';
      case 'complaint': return '😠';
      case 'compliment': return '👍';
      case 'question': return '❓';
      default: return '💭';
    }
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Get relative time (e.g., "2 hours ago")
   */
  getRelativeTime(dateString: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    
    return this.formatDate(dateString);
  }

  /**
   * Check if user can edit feedback
   */
  canEditFeedback(feedback: Feedback, userId?: string): boolean {
    if (!feedback) return false;
    
    // Admins and support can always edit
    return true;
  }

  /**
   * Check if user can delete feedback
   */
  canDeleteFeedback(feedback: Feedback, userId?: string): boolean {
    if (!feedback) return false;
    
    // Only admins can delete
    return true;
  }

  /**
   * Format feedback for select dropdown
   */
  formatFeedbackForSelect(feedback: Feedback): { value: string; label: string } {
    return {
      value: feedback.id,
      label: `${feedback.title} (${this.getStatusText(feedback.status)})`
    };
  }

  /**
   * Get section display name
   */
  getSectionDisplayName(section: string): string {
    const sectionMap: Record<string, string> = {
      'dashboard': 'Dashboard',
      'opportunities': 'Opportunities',
      'quotes': 'Quotes',
      'work_orders': 'Work Orders',
      'invoices': 'Invoices',
      'job_cards': 'Job Cards',
      'checklists': 'Checklists',
      'customers': 'Customers',
      'vehicles': 'Vehicles',
      'reports': 'Reports',
      'finance': 'Finance',
      'settings': 'Settings',
      'general': 'General',
      'other': 'Other',
    };
    
    return sectionMap[section] || section.replace('_', ' ').toUpperCase();
  }

  /**
   * Get type display name
   */
  getTypeDisplayName(type: string): string {
    const typeMap: Record<string, string> = {
      'bug': 'Bug Report',
      'feature_request': 'Feature Request',
      'improvement': 'Improvement',
      'complaint': 'Complaint',
      'compliment': 'Compliment',
      'question': 'Question',
      'other': 'Other',
    };
    
    return typeMap[type] || type.replace('_', ' ').toUpperCase();
  }
}

export const feedbackService = new FeedbackService();

// Status constants for easier reference
export const FEEDBACK_STATUS = {
  NEW: 'new',
  REVIEWED: 'reviewed',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
  DUPLICATE: 'duplicate',
};

// Priority constants
export const FEEDBACK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

// Type constants
export const FEEDBACK_TYPE = {
  BUG: 'bug',
  FEATURE_REQUEST: 'feature_request',
  IMPROVEMENT: 'improvement',
  COMPLAINT: 'complaint',
  COMPLIMENT: 'compliment',
  QUESTION: 'question',
  OTHER: 'other',
};

// Helper function to create a feedback status checker
export const createFeedbackStatusChecker = (feedback: Feedback) => {
  return {
    isNew: () => feedback.status === FEEDBACK_STATUS.NEW,
    isReviewed: () => feedback.status === FEEDBACK_STATUS.REVIEWED,
    isInProgress: () => feedback.status === FEEDBACK_STATUS.IN_PROGRESS,
    isResolved: () => feedback.status === FEEDBACK_STATUS.RESOLVED,
    isRejected: () => feedback.status === FEEDBACK_STATUS.REJECTED,
    isDuplicate: () => feedback.status === FEEDBACK_STATUS.DUPLICATE,
    canEdit: (userId?: string) => feedbackService.canEditFeedback(feedback, userId),
    canDelete: (userId?: string) => feedbackService.canDeleteFeedback(feedback, userId),
    getStatusColor: () => feedbackService.getStatusColor(feedback.status),
    getStatusText: () => feedbackService.getStatusText(feedback.status),
    getPriorityColor: () => feedbackService.getPriorityColor(feedback.priority),
    getTypeIcon: () => feedbackService.getTypeIcon(feedback.type),
    getRelativeTime: () => feedback.createdAt ? feedbackService.getRelativeTime(feedback.createdAt) : '',
  };
};
