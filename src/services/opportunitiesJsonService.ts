import { apiClient } from '@/lib/api/client';
import { API_BASE_URL } from '@/lib/api/config';
import { handleUnauthorizedRedirect } from '@/lib/auth/unauthorized';

export interface OpportunitiesJsonRecord {
  _id?: string;
  subject?: string;
  customerName?: string;
  phone?: string | null;
  email?: string | null;
  status?: string;
  source?: string | null;
  dataSource?: string | null;
  currentStage?: string | null;
  customer?: {
    name?: string;
    phone?: string | null;
    email?: string | null;
  };
}

export interface OpportunitiesJsonSearchResponse {
  success: boolean;
  table: 'opportunities_json';
  data: OpportunitiesJsonRecord[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasMore: boolean;
    currentPage: number;
  };
}

export interface OpportunitiesJsonUploadResponse {
  success: boolean;
  table: 'opportunities_json';
  triggeredBy: string;
  file: string;
  imported: number;
  upserted: number;
  updated: number;
  skipped: number;
  replacedExisting: boolean;
}

class OpportunitiesJsonService {
  private readonly basePath = '/opportunities-json';

  async search(params?: {
    q?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    status?: string;
  }): Promise<OpportunitiesJsonSearchResponse> {
    const query: Record<string, string> = {};

    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query[key] = String(value);
      }
    });

    return apiClient.get<OpportunitiesJsonSearchResponse>(this.basePath, query);
  }

  async uploadJsonFile(file: File, replaceExisting = true): Promise<OpportunitiesJsonUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('replaceExisting', String(replaceExisting));

    const token =
      sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${this.basePath}/upload`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Opportunities JSON upload error:', errorText);

      if (response.status === 401) {
        handleUnauthorizedRedirect();
      }

      throw new Error(`Upload Error (${response.status}): ${errorText || response.statusText}`);
    }

    return response.json();
  }
}

export const opportunitiesJsonService = new OpportunitiesJsonService();
