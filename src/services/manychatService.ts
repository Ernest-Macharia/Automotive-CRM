import { apiClient } from '@/lib/api/client';

export interface ManyChatContact {
  id: string;
  phone?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  country?: string;
  customFields?: Record<string, any>;
  tags?: string[];
  subscribed?: boolean;
  lastInteraction?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ManyChatTag {
  id: string;
  name: string;
  description?: string;
  color?: string;
  subscribersCount?: number;
  createdAt?: string;
}

export interface ManyChatMessage {
  id?: string;
  type: 'text' | 'image' | 'file' | 'quick_reply' | 'card' | 'carousel';
  content: string;
  buttons?: Array<{
    type: 'url' | 'phone' | 'quick_reply' | 'postback';
    caption: string;
    value: string;
  }>;
  quickReplies?: string[];
  metadata?: Record<string, any>;
}

export interface SendMessageData {
  subscriberId?: string;
  phone?: string;
  email?: string;
  message: ManyChatMessage | string;
  tagIds?: string[];
  broadcast?: boolean;
  scheduledAt?: string;
  token?: string; // Add token to data
}

export interface ManyChatWebhook {
  id: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface ManyChatStats {
  totalSubscribers: number;
  activeSubscribers: number;
  messagesSent: number;
  messagesReceived: number;
  tagsCount: number;
  broadcastCount: number;
}

export interface ManyChatConnectionStatus {
  connected: boolean;
  configured?: boolean;
  pageName?: string;
  pageId?: string;
  token?: string;
  lastSynced?: string;
  error?: string;
}

export interface ManyChatFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  tag?: string;
  subscribed?: boolean;
  sort?: string;
  fromDate?: string;
  toDate?: string;
  token?: string; // Add token to filter params
}

class ManyChatService {
  private baseUrl = '/manychat';
  private testBaseUrl = '/manychat-test';
  private token: string | null = null;

  /**
   * Initialize ManyChat service with token
   */
  initialize(token: string) {
    this.token = token;
    // Store token in sessionStorage for persistence
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('manychat_token', token);
    }
  }

  /**
   * Get token from storage
   */
  private getToken(): string | null {
    if (this.token) return this.token;
    
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('manychat_token');
    }
    
    return null;
  }

  /**
   * Add token to request data
   */
  private addTokenToData<T extends Record<string, any>>(data: T): T & { token?: string } {
    const token = this.getToken();
    if (token) {
      return { ...data, token };
    }
    return data;
  }

  /**
   * Add token to endpoint URL as query parameter
   */
  private addTokenToEndpoint(endpoint: string, token?: string): string {
    const useToken = token || this.getToken();
    if (!useToken) return endpoint;
    
    const separator = endpoint.includes('?') ? '&' : '?';
    return `${endpoint}${separator}token=${encodeURIComponent(useToken)}`;
  }

  /**
   * Add token to query params for GET requests
   */
  private addTokenToParams(params?: Record<string, any>): Record<string, any> {
    const token = this.getToken();
    if (token) {
      return { ...params, token };
    }
    return params || {};
  }

  /**
   * Check ManyChat connection health
   * GET /api/v1/manychat/health
   */
  async checkHealth(token?: string): Promise<ManyChatConnectionStatus> {
    try {
      const useToken = token || this.getToken();
      const params = useToken ? { token: useToken } : {};
      
      const response = await apiClient.get<any>(`${this.baseUrl}/health`, params);
      return {
        connected: response?.connected ?? response?.success ?? false,
        configured: response?.configured ?? response?.success ?? false,
        pageName: response?.pageName || response?.data?.name || response?.data?.page_name,
        pageId: response?.pageId || response?.data?.page_id || response?.data?.id,
        lastSynced: response?.lastSynced || new Date().toISOString(),
        error: response?.success === false ? response?.message : undefined,
      };
    } catch (error) {
      console.error('Error checking ManyChat health:', error);
      throw error;
    }
  }

  /**
   * Basic ping endpoint
   * GET /api/v1/manychat/ping
   */
  async ping(): Promise<{ message?: string; status?: string }> {
    try {
      return await apiClient.get<{ message?: string; status?: string }>(`${this.baseUrl}/ping`);
    } catch (error) {
      console.error('Error pinging ManyChat service:', error);
      throw error;
    }
  }

  /**
   * ManyChat test module endpoints
   */
  async getTestConnection(token?: string): Promise<any> {
    const params = this.addTokenToParams(token ? { token } : undefined);
    return apiClient.get<any>(`${this.testBaseUrl}/connection`, params);
  }

  async getTestConfig(token?: string): Promise<any> {
    const params = this.addTokenToParams(token ? { token } : undefined);
    return apiClient.get<any>(`${this.testBaseUrl}/config`, params);
  }

  async getTestPing(token?: string): Promise<any> {
    const params = this.addTokenToParams(token ? { token } : undefined);
    return apiClient.get<any>(`${this.testBaseUrl}/ping`, params);
  }

  async getTestDebugConnection(token?: string): Promise<any> {
    const params = this.addTokenToParams(token ? { token } : undefined);
    return apiClient.get<any>(`${this.testBaseUrl}/debug-connection`, params);
  }

  async getTestFull(token?: string): Promise<any> {
    const params = this.addTokenToParams(token ? { token } : undefined);
    return apiClient.get<any>(`${this.testBaseUrl}/full-test`, params);
  }

  async getTestCustomFields(token?: string): Promise<any> {
    const params = this.addTokenToParams(token ? { token } : undefined);
    return apiClient.get<any>(`${this.testBaseUrl}/custom-fields`, params);
  }

  async getTestTags(token?: string): Promise<any> {
    const params = this.addTokenToParams(token ? { token } : undefined);
    return apiClient.get<any>(`${this.testBaseUrl}/tags`, params);
  }

  async getTestFlows(token?: string): Promise<any> {
    const params = this.addTokenToParams(token ? { token } : undefined);
    return apiClient.get<any>(`${this.testBaseUrl}/flows`, params);
  }

  async getTestWidgets(token?: string): Promise<any> {
    const params = this.addTokenToParams(token ? { token } : undefined);
    return apiClient.get<any>(`${this.testBaseUrl}/widgets`, params);
  }

  async getTestSubscriber(id: string, token?: string): Promise<any> {
    const params = this.addTokenToParams(token ? { token } : undefined);
    return apiClient.get<any>(`${this.testBaseUrl}/subscriber/${id}`, params);
  }

  async findTestSubscriber(params?: { phone?: string; email?: string; token?: string }): Promise<any> {
    const finalParams = this.addTokenToParams(params);
    return apiClient.get<any>(`${this.testBaseUrl}/find-subscriber`, finalParams);
  }

  async createTestSubscriber(data: Record<string, any>, token?: string): Promise<any> {
    const dataWithToken = this.addTokenToData(data);
    const finalData = token ? { ...dataWithToken, token } : dataWithToken;
    return apiClient.post<typeof finalData, any>(`${this.testBaseUrl}/create-subscriber`, finalData);
  }

  async sendTestMessage(data: Record<string, any>, token?: string): Promise<any> {
    const dataWithToken = this.addTokenToData(data);
    const finalData = token ? { ...dataWithToken, token } : dataWithToken;
    return apiClient.post<typeof finalData, any>(`${this.testBaseUrl}/send-message`, finalData);
  }

  async sendTestFlow(data: Record<string, any>, token?: string): Promise<any> {
    const dataWithToken = this.addTokenToData(data);
    const finalData = token ? { ...dataWithToken, token } : dataWithToken;
    return apiClient.post<typeof finalData, any>(`${this.testBaseUrl}/send-flow`, finalData);
  }

  async addTestTag(data: Record<string, any>, token?: string): Promise<any> {
    const dataWithToken = this.addTokenToData(data);
    const finalData = token ? { ...dataWithToken, token } : dataWithToken;
    return apiClient.post<typeof finalData, any>(`${this.testBaseUrl}/add-tag`, finalData);
  }

  async createTestTag(data: Record<string, any>, token?: string): Promise<any> {
    const dataWithToken = this.addTokenToData(data);
    const finalData = token ? { ...dataWithToken, token } : dataWithToken;
    return apiClient.post<typeof finalData, any>(`${this.testBaseUrl}/tags/create`, finalData);
  }

  async setTestField(data: Record<string, any>, token?: string): Promise<any> {
    const dataWithToken = this.addTokenToData(data);
    const finalData = token ? { ...dataWithToken, token } : dataWithToken;
    return apiClient.post<typeof finalData, any>(`${this.testBaseUrl}/set-field`, finalData);
  }

  /**
   * Get all ManyChat tags
   * GET /api/v1/manychat/tags
   */
  async getTags(token?: string): Promise<ManyChatTag[]> {
    try {
      const params = this.addTokenToParams(token ? { token } : undefined);
      const response = await apiClient.get<any>(`${this.baseUrl}/tags`, params);
      if (Array.isArray(response)) return response;
      if (Array.isArray(response?.tags)) return response.tags;
      if (Array.isArray(response?.data)) return response.data;
      return [];
    } catch (error) {
      console.error('Error fetching ManyChat tags:', error);
      throw error;
    }
  }

  /**
   * Create a new ManyChat tag
   * POST /api/v1/manychat/tags
   */
  async createTag(tagData: { name: string; description?: string; color?: string }, token?: string): Promise<ManyChatTag> {
    try {
      const dataWithToken = this.addTokenToData(tagData);
      const finalData = token ? { ...dataWithToken, token } : dataWithToken;
      const response = await apiClient.post<typeof finalData, any>(`${this.baseUrl}/tags`, finalData);
      return response?.tag || response;
    } catch (error) {
      console.error('Error creating ManyChat tag:', error);
      throw error;
    }
  }

  /**
   * Send message via ManyChat
   * POST /api/v1/manychat/send
   */
  async sendMessage(data: SendMessageData, token?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const dataWithToken = this.addTokenToData(data);
      const finalData = token ? { ...dataWithToken, token } : dataWithToken;
      return await apiClient.post<typeof finalData, any>(`${this.baseUrl}/send`, finalData);
    } catch (error) {
      console.error('Error sending ManyChat message:', error);
      throw error;
    }
  }

  /**
   * Get ManyChat contacts
   */
  async getContacts(params?: ManyChatFilterParams): Promise<ManyChatContact[]> {
    try {
      const queryParams = new URLSearchParams();
      const finalParams = this.addTokenToParams(params);
      
      if (finalParams) {
        Object.entries(finalParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const queryString = queryParams.toString();
      const endpoint = `${this.baseUrl}/contacts${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get<ManyChatContact[]>(endpoint);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching ManyChat contacts:', error);
      throw error;
    }
  }

  /**
   * Get contact by ID
   */
  async getContactById(id: string, token?: string): Promise<ManyChatContact> {
    try {
      const params = this.addTokenToParams(token ? { token } : undefined);
      return await apiClient.get<ManyChatContact>(`${this.baseUrl}/contacts/${id}`, params);
    } catch (error) {
      console.error(`Error fetching ManyChat contact ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update contact
   */
  async updateContact(id: string, data: Partial<ManyChatContact>, token?: string): Promise<ManyChatContact> {
    try {
      const dataWithToken = this.addTokenToData(data);
      const finalData = token ? { ...dataWithToken, token } : dataWithToken;
      return await apiClient.put<typeof finalData, ManyChatContact>(`${this.baseUrl}/contacts/${id}`, finalData);
    } catch (error) {
      console.error(`Error updating ManyChat contact ${id}:`, error);
      throw error;
    }
  }

  /**
   * Add tag to contact
   */
  async addTagToContact(contactId: string, tagId: string, token?: string): Promise<{ success: boolean }> {
    try {
      const data = { tagId };
      const dataWithToken = this.addTokenToData(data);
      const finalData = token ? { ...dataWithToken, token } : dataWithToken;
      
      return await apiClient.post<typeof finalData, { success: boolean }>(
        `${this.baseUrl}/contacts/${contactId}/tags`,
        finalData
      );
    } catch (error) {
      console.error(`Error adding tag to contact ${contactId}:`, error);
      throw error;
    }
  }

  /**
   * Remove tag from contact
   */
  async removeTagFromContact(contactId: string, tagId: string, token?: string): Promise<{ success: boolean }> {
    try {
      // For DELETE requests, we need to add token to the endpoint URL
      const endpoint = this.addTokenToEndpoint(
        `${this.baseUrl}/contacts/${contactId}/tags/${tagId}`,
        token
      );
      
      return await apiClient.delete<{ success: boolean }>(endpoint);
    } catch (error) {
      console.error(`Error removing tag from contact ${contactId}:`, error);
      throw error;
    }
  }

  /**
   * Broadcast message to multiple contacts
   */
  async broadcastMessage(data: {
    tagIds?: string[];
    segment?: string;
    message: ManyChatMessage | string;
    scheduledAt?: string;
  }, token?: string): Promise<{ success: boolean; broadcastId?: string }> {
    try {
      const dataWithToken = this.addTokenToData(data);
      const finalData = token ? { ...dataWithToken, token } : dataWithToken;
      return await apiClient.post<typeof finalData, any>(`${this.baseUrl}/broadcast`, finalData);
    } catch (error) {
      console.error('Error sending broadcast message:', error);
      throw error;
    }
  }

  /**
   * Get statistics
   */
  async getStats(token?: string): Promise<ManyChatStats> {
    try {
      const params = this.addTokenToParams(token ? { token } : undefined);
      const response = await apiClient.get<any>(`${this.baseUrl}/stats`, params);
      return response?.stats || response || {
        totalSubscribers: 0,
        activeSubscribers: 0,
        messagesSent: 0,
        messagesReceived: 0,
        tagsCount: 0,
        broadcastCount: 0,
      };
    } catch (error) {
      console.error('Error fetching ManyChat stats:', error);
      throw error;
    }
  }

  /**
   * Get webhooks
   */
  async getWebhooks(token?: string): Promise<ManyChatWebhook[]> {
    try {
      const params = this.addTokenToParams(token ? { token } : undefined);
      const response = await apiClient.get<ManyChatWebhook[]>(`${this.baseUrl}/webhooks`, params);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching ManyChat webhooks:', error);
      throw error;
    }
  }

  /**
   * Create webhook
   */
  async createWebhook(data: { url: string; events: string[] }, token?: string): Promise<ManyChatWebhook> {
    try {
      const dataWithToken = this.addTokenToData(data);
      const finalData = token ? { ...dataWithToken, token } : dataWithToken;
      return await apiClient.post<typeof finalData, ManyChatWebhook>(`${this.baseUrl}/webhooks`, finalData);
    } catch (error) {
      console.error('Error creating ManyChat webhook:', error);
      throw error;
    }
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(id: string, token?: string): Promise<{ success: boolean }> {
    try {
      // For DELETE requests, we need to add token to the endpoint URL
      const endpoint = this.addTokenToEndpoint(
        `${this.baseUrl}/webhooks/${id}`,
        token
      );
      
      return await apiClient.delete<{ success: boolean }>(endpoint);
    } catch (error) {
      console.error(`Error deleting ManyChat webhook ${id}:`, error);
      throw error;
    }
  }

  /**
   * Search contacts
   */
  async searchContacts(searchTerm: string, token?: string): Promise<ManyChatContact[]> {
    try {
      const params = this.addTokenToParams({ 
        q: searchTerm,
        ...(token ? { token } : {})
      });
      
      const response = await apiClient.get<ManyChatContact[]>(`${this.baseUrl}/contacts/search`, params);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error searching ManyChat contacts:', error);
      throw error;
    }
  }

  /**
   * Sync contacts with local database
   */
  async syncContacts(token?: string): Promise<{ success: boolean; syncedCount: number }> {
    try {
      const dataWithToken = this.addTokenToData({});
      const finalData = token ? { ...dataWithToken, token } : dataWithToken;
      return await apiClient.post<typeof finalData, any>(`${this.baseUrl}/sync`, finalData);
    } catch (error) {
      console.error('Error syncing ManyChat contacts:', error);
      throw error;
    }
  }

  /**
   * Get message templates
   */
  async getTemplates(token?: string): Promise<any[]> {
    try {
      const params = this.addTokenToParams(token ? { token } : undefined);
      const response = await apiClient.get<any[]>(`${this.baseUrl}/templates`, params);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching ManyChat templates:', error);
      throw error;
    }
  }

  /**
   * Create message template
   */
  async createTemplate(data: {
    name: string;
    content: ManyChatMessage;
    category?: string;
  }, token?: string): Promise<any> {
    try {
      const dataWithToken = this.addTokenToData(data);
      const finalData = token ? { ...dataWithToken, token } : dataWithToken;
      return await apiClient.post<typeof finalData, any>(`${this.baseUrl}/templates`, finalData);
    } catch (error) {
      console.error('Error creating ManyChat template:', error);
      throw error;
    }
  }

  /**
   * Test connection
   */
  async testConnection(token: string): Promise<ManyChatConnectionStatus> {
    try {
      const result = await this.checkHealth(token);
      
      if (result.connected) {
        // If successful, store the token
        this.initialize(token);
      }
      
      return result;
    } catch (error) {
      console.error('Error testing ManyChat connection:', error);
      throw error;
    }
  }

  /**
   * Disconnect ManyChat
   */
  disconnect(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('manychat_token');
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return !!this.getToken();
  }

  /**
   * Load token on initialization
   */
  loadToken(): void {
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('manychat_token');
      if (token) {
        this.token = token;
      }
    }
  }

  /**
   * Format tag color for UI
   */
  getTagColor(tag: ManyChatTag): string {
    if (tag.color) return tag.color;
    
    // Generate consistent color based on tag name
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-red-100 text-red-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-teal-100 text-teal-800',
      'bg-orange-100 text-orange-800',
      'bg-cyan-100 text-cyan-800',
    ];
    
    const index = tag.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  }

  /**
   * Format date
   */
  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid date';
    }
  }

  /**
   * Format message type
   */
  formatMessageType(type: string): string {
    const types: Record<string, string> = {
      'text': 'Text',
      'image': 'Image',
      'file': 'File',
      'quick_reply': 'Quick Reply',
      'card': 'Card',
      'carousel': 'Carousel',
    };
    return types[type] || type;
  }

  /**
   * Validate phone number for ManyChat
   */
  validatePhoneNumber(phone: string): boolean {
    // Simple validation - adjust based on your needs
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validate email for ManyChat
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get subscriber status color
   */
  getSubscriberStatusColor(subscribed: boolean): string {
    return subscribed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  }
}

export const manychatService = new ManyChatService();

// Auto-load token on initialization
if (typeof window !== 'undefined') {
  manychatService.loadToken();
}
