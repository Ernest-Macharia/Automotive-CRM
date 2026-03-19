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
  originalId?: string | null;
  ownerId?: string | null;
  organizationId?: string | null;
  owner?: {
    id?: string;
    name?: string;
    email?: string;
  } | null;
  raw?: Record<string, any> | null;
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

export interface OpportunitiesJsonBulkReassignResponse {
  success: boolean;
  organizationId: string;
  selectedRecords: number;
  linkedOpportunities: number;
  reassignedCount: number;
  failedCount: number;
  reassigned: Array<Record<string, any>>;
  failed: Array<{ recordId: string; subject?: string; reason: string }>;
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

  async bulkReassign(
    recordIds: string[],
    specificUserId: string,
    reason?: string,
  ): Promise<OpportunitiesJsonBulkReassignResponse> {
    return apiClient.post<
      {
        recordIds: string[];
        specificUserId: string;
        reason?: string;
        notifyOldAssignee: boolean;
      },
      OpportunitiesJsonBulkReassignResponse
    >(`${this.basePath}/bulk-reassign`, {
      recordIds,
      specificUserId,
      reason,
      notifyOldAssignee: true,
    });
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
