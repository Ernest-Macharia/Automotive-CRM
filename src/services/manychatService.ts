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
  lastSynced?: string;
  error?: string;
}

export interface ManyChatSettings {
  enabled?: boolean;
  configured?: boolean;
  connected?: boolean;
  apiKeyMasked?: string;
  pageName?: string;
  pageId?: string;
  raw?: Record<string, any>;
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

  private extractStatusCode(error: unknown): number | null {
    if (!error || typeof error !== 'object') {
      return null;
    }

    const statusFromResponse = Number((error as any).response?.status ?? (error as any).status);
    if (Number.isFinite(statusFromResponse) && statusFromResponse > 0) {
      return statusFromResponse;
    }

    const message = String((error as any).message || '');
    const match = message.match(/API Error \((\d{3})\)/);
    if (!match) {
      return null;
    }

    const parsed = Number(match[1]);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private normalizeStatsResponse(response: any): ManyChatStats {
    const payload = response?.stats || response?.analytics || response?.summary || response?.data || response || {};

    const toNumber = (value: unknown): number => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    return {
      totalSubscribers: toNumber(
        payload?.totalSubscribers ??
        payload?.subscribers ??
        payload?.subscribersCount
      ),
      activeSubscribers: toNumber(
        payload?.activeSubscribers ??
        payload?.active ??
        payload?.activeCount
      ),
      messagesSent: toNumber(
        payload?.messagesSent ??
        payload?.sentMessages ??
        payload?.sent
      ),
      messagesReceived: toNumber(
        payload?.messagesReceived ??
        payload?.receivedMessages ??
        payload?.received
      ),
      tagsCount: toNumber(
        payload?.tagsCount ??
        payload?.totalTags ??
        payload?.tags?.length ??
        payload?.tags
      ),
      broadcastCount: toNumber(
        payload?.broadcastCount ??
        payload?.broadcasts ??
        payload?.totalBroadcasts
      ),
    };
  }

  private normalizeConnectionErrorMessage(message?: string): string {
    if (!message) {
      return 'ManyChat is not connected. Add a valid API token to continue.';
    }

    const lowerMessage = message.toLowerCase();

    if (
      lowerMessage.includes('401') ||
      lowerMessage.includes('unauthorized') ||
      lowerMessage.includes('invalid api key') ||
      lowerMessage.includes('invalid token') ||
      lowerMessage.includes('access token')
    ) {
      return 'The ManyChat API token is missing, invalid, or expired. Open Settings and connect with a valid token.';
    }

    return message;
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
      return this.normalizeConnectionErrorMessage(error.message);
    }

    if (typeof error === 'object' && error !== null) {
      const maybeError = error as {
        message?: string;
        response?: { data?: unknown; status?: number; statusText?: string };
      };

      if (typeof maybeError.message === 'string' && maybeError.message) {
        return this.normalizeConnectionErrorMessage(maybeError.message);
      }

      if (typeof maybeError.response?.data === 'string' && maybeError.response.data) {
        return this.normalizeConnectionErrorMessage(maybeError.response.data);
      }

      if (typeof maybeError.response?.data === 'object' && maybeError.response?.data) {
        const rawMessage = (maybeError.response.data as any)?.message || (maybeError.response.data as any)?.error;
        if (rawMessage) {
          return this.normalizeConnectionErrorMessage(String(rawMessage));
        }
      }

      if (maybeError.response?.status) {
        return this.normalizeConnectionErrorMessage(
          `Request failed with status code ${maybeError.response.status}`
        );
      }
    }

    return 'Unable to reach ManyChat. Check your token and try again.';
  }

  private normalizeConnectionStatus(response: any): ManyChatConnectionStatus {
    const data = response?.data || response?.status || response || {};
    const configured = Boolean(
      response?.configured ??
      data?.configured ??
      response?.tokenConfigured ??
      data?.tokenConfigured ??
      response?.token_present ??
      data?.token_present ??
      response?.hasApiKey ??
      data?.hasApiKey
    );
    const connected = Boolean(
      response?.connected ??
      data?.connected ??
      response?.success ??
      data?.success ??
      false
    );
    const errorMessage = response?.success === false || response?.connected === false
      ? this.normalizeConnectionErrorMessage(response?.message || response?.error)
      : undefined;

    return {
      connected,
      configured,
      pageName:
        response?.pageName ||
        data?.pageName ||
        response?.page_name ||
        data?.page_name ||
        response?.name ||
        data?.name,
      pageId:
        response?.pageId ||
        data?.pageId ||
        response?.page_id ||
        data?.page_id ||
        response?.id ||
        data?.id,
      lastSynced:
        response?.lastSynced ||
        data?.lastSynced ||
        response?.updatedAt ||
        data?.updatedAt ||
        new Date().toISOString(),
      error: connected ? undefined : errorMessage,
    };
  }

  /**
   * Keep a temporary in-memory token only for this runtime session.
   * The backend persists the organization token securely.
   */
  initialize(token: string) {
    const trimmedToken = token.trim();
    this.token = trimmedToken || null;
  }

  /**
   * Get temporary in-memory token (never persisted to browser storage)
   */
  private getToken(): string | null {
    return this.token;
  }

  getStoredToken(): string | null {
    return this.getToken();
  }

  hasStoredToken(): boolean {
    return !!this.getToken();
  }

  /**
   * Add token to request data
   */
  private addTokenToData<T extends Record<string, any>>(data: T, token?: string): T & { token?: string } {
    if (token?.trim()) {
      return { ...data, token: token.trim() };
    }
    return data;
  }

  /**
   * Add token to endpoint URL as query parameter
   */
  private addTokenToEndpoint(endpoint: string, token?: string): string {
    const useToken = token?.trim();
    if (!useToken) return endpoint;
    
    const separator = endpoint.includes('?') ? '&' : '?';
    return `${endpoint}${separator}token=${encodeURIComponent(useToken)}`;
  }

  /**
   * Add token to query params for GET requests
   */
  private addTokenToParams(params?: Record<string, any>, token?: string): Record<string, any> {
    if (token?.trim()) {
      return { ...(params || {}), token: token.trim() };
    }
    return params || {};
  }

  /**
   * Check ManyChat connection health.
   * Prefers /status, then falls back to compatibility endpoints.
   */
  async checkHealth(): Promise<ManyChatConnectionStatus> {
    const statusEndpoints = [
      `${this.baseUrl}/status`,
      `${this.baseUrl}/health`,
      `${this.baseUrl}/connection`,
    ];

    let lastError: unknown = null;

    for (const endpoint of statusEndpoints) {
      try {
        const response = await apiClient.get<any>(endpoint);
        return this.normalizeConnectionStatus(response);
      } catch (error) {
        lastError = error;
        const statusCode = this.extractStatusCode(error);
        if (statusCode === 404 || statusCode === 405) {
          continue;
        }
      }
    }

    try {
      const settings = await this.getSettings();
      return {
        connected: false,
        configured: Boolean(settings.configured || settings.enabled),
        pageName: settings.pageName,
        pageId: settings.pageId,
        error: this.extractErrorMessage(lastError),
      };
    } catch {
      console.error('Error checking ManyChat health:', lastError);
      return {
        connected: false,
        configured: false,
        error: this.extractErrorMessage(lastError),
      };
    }
  }

  /**
   * Basic ping endpoint
   * POST /api/v1/manychat/ping
   */
  async ping(): Promise<{ message?: string; status?: string }> {
    try {
      return await apiClient.post<Record<string, never>, { message?: string; status?: string }>(
        `${this.baseUrl}/ping`,
        {}
      );
    } catch (error) {
      const statusCode = this.extractStatusCode(error);
      if (statusCode !== 404 && statusCode !== 405) {
        console.error('Error pinging ManyChat service:', error);
        throw error;
      }

      return await apiClient.get<{ message?: string; status?: string }>(`${this.baseUrl}/ping`);
    }
  }

  private normalizeSettings(response: any): ManyChatSettings {
    const payload = response?.settings || response?.config || response?.data || response || {};

    return {
      enabled: Boolean(
        payload?.enabled ??
        response?.enabled ??
        false
      ),
      configured: Boolean(
        payload?.configured ??
        payload?.tokenConfigured ??
        payload?.hasApiKey ??
        response?.configured ??
        response?.tokenConfigured ??
        response?.hasApiKey ??
        false
      ),
      connected: Boolean(
        payload?.connected ??
        response?.connected ??
        false
      ),
      apiKeyMasked:
        payload?.apiKeyMasked ||
        payload?.maskedApiKey ||
        payload?.apiKeyPreview ||
        response?.apiKeyMasked ||
        response?.maskedApiKey,
      pageName:
        payload?.pageName ||
        payload?.page_name ||
        response?.pageName ||
        response?.page_name,
      pageId:
        payload?.pageId ||
        payload?.page_id ||
        response?.pageId ||
        response?.page_id,
      raw: payload,
    };
  }

  async getSettings(): Promise<ManyChatSettings> {
    const endpoints = [
      `${this.baseUrl}/settings`,
      `${this.baseUrl}/config`,
    ];

    let lastError: unknown = null;
    for (const endpoint of endpoints) {
      try {
        const response = await apiClient.get<any>(endpoint);
        return this.normalizeSettings(response);
      } catch (error) {
        lastError = error;
        const statusCode = this.extractStatusCode(error);
        if (statusCode === 404 || statusCode === 405) {
          continue;
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Failed to load ManyChat settings');
  }

  async saveSettings(data: { apiKey?: string; enabled?: boolean }): Promise<ManyChatSettings> {
    const normalizedApiKey = String(data.apiKey || '').trim();
    const payload: { apiKey?: string; enabled?: boolean } = {};

    if (normalizedApiKey) {
      payload.apiKey = normalizedApiKey;
    }

    if (typeof data.enabled === 'boolean') {
      payload.enabled = data.enabled;
    }

    const endpoints = [
      `${this.baseUrl}/settings`,
      `${this.baseUrl}/config`,
    ];

    let lastError: unknown = null;
    for (const endpoint of endpoints) {
      try {
        const response = await apiClient.patch<typeof payload, any>(endpoint, payload);
        return this.normalizeSettings(response);
      } catch (error) {
        lastError = error;
        const statusCode = this.extractStatusCode(error);
        if (statusCode === 404 || statusCode === 405) {
          continue;
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Failed to save ManyChat settings');
  }

  async connect(apiKey: string, enabled: boolean = true): Promise<ManyChatConnectionStatus> {
    const normalizedApiKey = String(apiKey || '').trim();
    if (!normalizedApiKey) {
      throw new Error('ManyChat API token is required');
    }

    const payload = {
      apiKey: normalizedApiKey,
      enabled,
    };

    try {
      await apiClient.post<typeof payload, any>(`${this.baseUrl}/connect`, payload);
    } catch (error) {
      const statusCode = this.extractStatusCode(error);
      if (statusCode !== 404 && statusCode !== 405) {
        throw error;
      }

      await this.saveSettings(payload);
    }

    // Keep token in memory only for any explicit per-request fallback scenarios.
    this.initialize(normalizedApiKey);
    return await this.checkHealth();
  }

  async reconnect(): Promise<ManyChatConnectionStatus> {
    try {
      await apiClient.post<Record<string, never>, any>(`${this.baseUrl}/reconnect`, {});
    } catch (error) {
      const statusCode = this.extractStatusCode(error);
      if (statusCode !== 404 && statusCode !== 405) {
        throw error;
      }

      await this.ping();
    }

    return await this.checkHealth();
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
      const response = await apiClient.post<typeof finalData, any>(`${this.baseUrl}/send`, finalData);
      const normalizedSuccess =
        typeof response?.success === 'boolean'
          ? response.success
          : response?.status === 'ok';
      return {
        success: normalizedSuccess,
        messageId: response?.messageId || response?.id,
        error: response?.error,
      };
    } catch (error) {
      const statusCode = this.extractStatusCode(error);
      if (statusCode !== 404 && statusCode !== 405) {
        console.error('Error sending ManyChat message:', error);
        throw error;
      }

      const dataWithToken = this.addTokenToData(data);
      const finalData = token ? { ...dataWithToken, token } : dataWithToken;
      const fallbackResponse = await apiClient.post<typeof finalData, any>(`${this.baseUrl}/send-message`, finalData);
      const normalizedFallbackSuccess =
        typeof fallbackResponse?.success === 'boolean'
          ? fallbackResponse.success
          : fallbackResponse?.status === 'ok';
      return {
        success: normalizedFallbackSuccess,
        messageId: fallbackResponse?.messageId || fallbackResponse?.id,
        error: fallbackResponse?.error,
      };
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
      const response = await apiClient.get<any>(`${this.baseUrl}/analytics`, params);
      return this.normalizeStatsResponse(response);
    } catch (error) {
      const statusCode = this.extractStatusCode(error);
      if (statusCode !== 404 && statusCode !== 405) {
        console.error('Error fetching ManyChat stats:', error);
        throw error;
      }

      const params = this.addTokenToParams(token ? { token } : undefined);
      const fallbackResponse = await apiClient.get<any>(`${this.baseUrl}/stats`, params);
      return this.normalizeStatsResponse(fallbackResponse);
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
      const trimmedToken = token.trim();
      return await this.connect(trimmedToken, true);
    } catch (error) {
      console.error('Error testing ManyChat connection:', error);
      throw error;
    }
  }

  /**
   * Disconnect ManyChat
   */
  async disconnect(): Promise<{ success?: boolean; message?: string }> {
    try {
      const response = await apiClient.post<Record<string, never>, any>(`${this.baseUrl}/disconnect`, {});
      this.token = null;
      return response || { success: true };
    } catch (error) {
      const statusCode = this.extractStatusCode(error);
      if (statusCode !== 404 && statusCode !== 405) {
        throw error;
      }

      this.token = null;
      return { success: true, message: 'Disconnected locally' };
    }
  }

  /**
   * Clear local in-memory token only
   */
  clearLocalToken(): void {
    this.token = null;
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
    // No-op: tokens are persisted on the backend, not in browser storage.
    this.token = null;
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
