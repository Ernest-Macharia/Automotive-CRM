// src/lib/api/client.ts
import { API_BASE_URL, API_ENDPOINTS, buildUrl } from './config';
import type { ApiError, RequestConfig, Tokens } from './types';

class ApiClient {
  private baseURL: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.initializeTokens();
  }

  private initializeTokens(): void {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('access_token');
      this.refreshToken = localStorage.getItem('refresh_token');
    }
  }

  setTokens({ accessToken, refreshToken }: Tokens): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
    }
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;

    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  private async request<T = unknown>(
    endpoint: string,
    options: RequestConfig = {}
  ): Promise<T> {
    if (!endpoint) {
      throw new Error('API endpoint is undefined!');
    }

    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const config: RequestInit = { ...options, headers };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      return await this.handleSuccessResponse<T>(response);
    } catch (error: unknown) {
      throw this.handleRequestError(error);
    }
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = `HTTP error! status: ${response.status}`;

    try {
      const errorData: unknown = await response.json();

      if (this.isErrorWithMessage(errorData)) errorMessage = errorData.message;
      else if (this.isErrorWithError(errorData)) errorMessage = errorData.error;
    } catch {
      // ignore, use default message
    }

    const error: ApiError = new Error(errorMessage);
    error.status = response.status;

    if (response.status !== 401) {
      console.error(`❌ API Error ${response.status}:`, errorMessage);
    }

    throw error;
  }

  private async handleSuccessResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) return (await response.json()) as T;
    return (await response.text()) as unknown as T;
  }

  private handleRequestError(error: unknown): ApiError {
    if (error instanceof Error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('❌ Network error:', error);
        return new Error(
          'Network error. Check your internet connection or if the server is running.'
        );
      }
      return error;
    }

    console.error('❌ Unknown error:', error);
    return new Error('An unexpected error occurred');
  }

  private isErrorWithMessage(error: unknown): error is { message: string } {
    return typeof error === 'object' && error !== null && 'message' in error;
  }

  private isErrorWithError(error: unknown): error is { error: string } {
    return typeof error === 'object' && error !== null && 'error' in error;
  }

  async get<T = unknown>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body: data ? JSON.stringify(data) : undefined });
  }

  async put<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body: data ? JSON.stringify(data) : undefined });
  }

  async patch<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined });
  }

  async delete<T = unknown>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// ---------------------
// Defensive ApiService
// ---------------------
export class ApiService {
  constructor(private client: ApiClient) {}

  private validateEndpoint(endpoint: string | undefined, name: string) {
    if (!endpoint) throw new Error(`${name} endpoint is undefined`);
  }

  // ---------------- Auth ----------------
  async login(credentials: unknown): Promise<unknown> {
    this.validateEndpoint(API_ENDPOINTS.AUTH.LOGIN, 'AUTH.LOGIN');
    console.log('[ApiService] Login called');
    return this.client.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
  }

  async getCurrentUser(): Promise<unknown> {
    this.validateEndpoint(API_ENDPOINTS.AUTH.GET_ME, 'AUTH.GET_ME');
    console.log('[ApiService] Fetching current user');
    return this.client.get(API_ENDPOINTS.AUTH.GET_ME);
  }

  async refreshToken(): Promise<unknown> {
    this.validateEndpoint(API_ENDPOINTS.AUTH.REFRESH_TOKEN, 'AUTH.REFRESH_TOKEN');
    const refreshToken = this.client.getRefreshToken();
    if (!refreshToken) throw new Error('Refresh token missing');
    return this.client.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, { refresh_token: refreshToken });
  }

  // ---------------- Opportunities ----------------
  async getOpportunities(params?: Record<string, string | number | boolean>): Promise<unknown> {
    this.validateEndpoint(API_ENDPOINTS.OPPORTUNITIES.BASE, 'OPPORTUNITIES.BASE');
    const url = buildUrl(API_ENDPOINTS.OPPORTUNITIES.BASE, params || {});
    console.log('[ApiService] Fetching opportunities:', url);
    return this.client.get(url);
  }

  async getOpportunityById(id: string): Promise<unknown> {
    if (!id) throw new Error('Opportunity ID is required');
    this.validateEndpoint(API_ENDPOINTS.OPPORTUNITIES.BY_ID, 'OPPORTUNITIES.BY_ID');
    return this.client.get(API_ENDPOINTS.OPPORTUNITIES.BY_ID(id));
  }

  async getOpportunitiesOverview(): Promise<unknown> {
    this.validateEndpoint(API_ENDPOINTS.OPPORTUNITIES.OVERVIEW, 'OPPORTUNITIES.OVERVIEW');
    return this.client.get(API_ENDPOINTS.OPPORTUNITIES.OVERVIEW);
  }

  // ---------------- Vehicles ----------------
  async getVehiclesByOpportunity(opportunityId: string): Promise<unknown> {
    if (!opportunityId) throw new Error('Opportunity ID is required');
    this.validateEndpoint(API_ENDPOINTS.VEHICLES.BY_OPPORTUNITY, 'VEHICLES.BY_OPPORTUNITY');
    return this.client.get(API_ENDPOINTS.VEHICLES.BY_OPPORTUNITY(opportunityId));
  }

  // ---------------- Quotes ----------------
  async approveQuote(id: string): Promise<unknown> {
    if (!id) throw new Error('Quote ID is required');
    this.validateEndpoint(API_ENDPOINTS.QUOTES.APPROVE, 'QUOTES.APPROVE');
    return this.client.patch(API_ENDPOINTS.QUOTES.APPROVE(id));
  }

  // ---------------- Invoices ----------------
  async createInvoiceFromQuote(quoteId: string): Promise<unknown> {
    if (!quoteId) throw new Error('Quote ID is required');
    this.validateEndpoint(API_ENDPOINTS.INVOICES.FROM_QUOTE, 'INVOICES.FROM_QUOTE');
    return this.client.post(API_ENDPOINTS.INVOICES.FROM_QUOTE(quoteId));
  }

  async payInvoice(id: string, paymentData: unknown): Promise<unknown> {
    if (!id) throw new Error('Invoice ID is required');
    this.validateEndpoint(API_ENDPOINTS.INVOICES.PAY, 'INVOICES.PAY');
    return this.client.post(API_ENDPOINTS.INVOICES.PAY(id), paymentData);
  }

  // ---------------- Job Cards ----------------
  async getJobCardsByVehicle(vehicleId: string): Promise<unknown> {
    if (!vehicleId) throw new Error('Vehicle ID is required');
    this.validateEndpoint(API_ENDPOINTS.JOB_CARDS.BY_VEHICLE, 'JOB_CARDS.BY_VEHICLE');
    return this.client.get(API_ENDPOINTS.JOB_CARDS.BY_VEHICLE(vehicleId));
  }

  // ---------------- Waivers ----------------
  async signWaiver(id: string, signatureData: unknown): Promise<unknown> {
    if (!id) throw new Error('Waiver ID is required');
    this.validateEndpoint(API_ENDPOINTS.WAIVERS.SIGN, 'WAIVERS.SIGN');
    return this.client.post(API_ENDPOINTS.WAIVERS.SIGN(id), signatureData);
  }

  // ---------------- Notifications ----------------
  async getMyNotifications(): Promise<unknown> {
    this.validateEndpoint(API_ENDPOINTS.NOTIFICATIONS.MY_NOTIFICATIONS, 'NOTIFICATIONS.MY_NOTIFICATIONS');
    return this.client.get(API_ENDPOINTS.NOTIFICATIONS.MY_NOTIFICATIONS);
  }
}

// Export singleton instances
export const apiClient = new ApiClient(API_BASE_URL);
export const apiService = new ApiService(apiClient);
