import { apiClient } from '@/lib/api/client';
import { API_BASE_URL } from '@/lib/api/config';
import { handleUnauthorizedRedirect } from '@/lib/auth/unauthorized';

export interface CsvMappingProfilePayload {
  name: string;
  description?: string;
  entity?: string;
  fieldMappings: Record<string, string>;
  options?: Record<string, any>;
}

class CsvImportService {
  private async uploadCsvFile<T>(
    endpoint: string,
    file: File,
    extraFields?: Record<string, string>
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    if (extraFields) {
      Object.entries(extraFields).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, value);
        }
      });
    }

    const token = sessionStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      body: formData,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
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
  }

  async preview(file: File): Promise<any> {
    return this.uploadCsvFile('/csv-import/preview', file);
  }

  async upsertMappingProfile(data: CsvMappingProfilePayload): Promise<any> {
    return apiClient.post<CsvMappingProfilePayload, any>('/csv-import/mappings', data);
  }

  async listMappingProfiles(): Promise<any> {
    return apiClient.get<any>('/csv-import/mappings');
  }

  async getMappingProfile(id: string): Promise<any> {
    return apiClient.get<any>(`/csv-import/mappings/${id}`);
  }

  async execute(
    file: File,
    options?: { mappingId?: string; fieldMappings?: Record<string, string>; dryRun?: boolean }
  ): Promise<any> {
    const extraFields: Record<string, string> = {};

    if (options?.mappingId) {
      extraFields.mappingId = options.mappingId;
    }
    if (options?.fieldMappings) {
      extraFields.fieldMappings = JSON.stringify(options.fieldMappings);
    }
    if (typeof options?.dryRun === 'boolean') {
      extraFields.dryRun = String(options.dryRun);
    }

    return this.uploadCsvFile('/csv-import/execute', file, extraFields);
  }
}

export const csvImportService = new CsvImportService();
