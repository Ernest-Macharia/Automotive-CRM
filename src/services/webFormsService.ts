import { apiClient } from '@/lib/api/client';

export type WebFormState = 'draft' | 'published' | 'archived';

export interface WebFormCondition {
  field?: string;
  targetField?: string;
  operator?: string;
  value?: any;
  all?: WebFormCondition[];
  any?: WebFormCondition[];
  not?: WebFormCondition;
}

export interface WebFormFieldOption {
  label: string;
  value: string;
  description?: string;
}

export interface WebFormFieldDefinition {
  id?: string;
  key?: string;
  name?: string;
  label: string;
  type: string;
  targetField?: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  defaultValue?: any;
  sensitivityClass?: 'public' | 'internal' | 'sensitive' | 'restricted';
  options?: WebFormFieldOption[];
  validation?: Record<string, any>;
  visibleWhen?: WebFormCondition | WebFormCondition[] | null;
  requiredWhen?: WebFormCondition | WebFormCondition[] | null;
  layout?: Record<string, any>;
  theme?: Record<string, any>;
  policy?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface WebFormDefinition {
  _id: string;
  id?: string;
  name?: string;
  title?: string;
  description?: string;
  formKey?: string;
  publicKey?: string;
  versionId?: string;
  versionNumber?: number;
  state?: WebFormState;
  createdAt?: string;
  updatedAt?: string;
  fields?: WebFormFieldDefinition[];
  rules?: any[];
  mappings?: Record<string, any>;
  layout?: Record<string, any>;
  theme?: Record<string, any>;
  policy?: Record<string, any>;
  assignment?: Record<string, any>;
  spamProtection?: Record<string, any>;
  createdBy?: any;
  updatedBy?: any;
  [key: string]: any;
}

export interface WebFormRuntimeResponse {
  _id?: string;
  id?: string;
  formId?: string;
  versionId?: string;
  versionNumber?: number;
  formKey?: string;
  publicKey?: string;
  name?: string;
  title?: string;
  description?: string;
  state?: WebFormState;
  fields?: WebFormFieldDefinition[];
  rules?: any[];
  mappings?: Record<string, any>;
  layout?: Record<string, any>;
  theme?: Record<string, any>;
  policy?: Record<string, any>;
  assignment?: Record<string, any>;
  spamProtection?: Record<string, any>;
  [key: string]: any;
}

export interface CreateWebFormDto {
  name?: string;
  title: string;
  description?: string;
  formKey?: string;
  publicKey?: string;
  fields?: WebFormFieldDefinition[];
  rules?: any[];
  mappings?: Record<string, any>;
  layout?: Record<string, any>;
  theme?: Record<string, any>;
  policy?: Record<string, any>;
  assignment?: Record<string, any>;
  spamProtection?: Record<string, any>;
}

export interface UpdateWebFormDto {
  name?: string;
  title?: string;
  description?: string;
  formKey?: string;
  publicKey?: string;
  fields?: WebFormFieldDefinition[];
  rules?: any[];
  mappings?: Record<string, any>;
  layout?: Record<string, any>;
  theme?: Record<string, any>;
  policy?: Record<string, any>;
  assignment?: Record<string, any>;
  spamProtection?: Record<string, any>;
}

const unwrapPayload = <T>(response: any): T => {
  if (response?.data !== undefined) return response.data as T;
  if (response?.form !== undefined) return response.form as T;
  if (response?.result !== undefined) return response.result as T;
  return response as T;
};

const normalizeForm = (raw: any): WebFormDefinition => {
  const form = raw || {};
  const normalizedId = String(form._id || form.id || '').trim();
  return {
    ...form,
    _id: normalizedId || form._id,
    id: String(form.id || form._id || '').trim() || undefined,
    state: form.state || form.status || 'draft',
    versionNumber:
      typeof form.versionNumber === 'number'
        ? form.versionNumber
        : Number.isFinite(Number(form.versionNumber))
        ? Number(form.versionNumber)
        : undefined,
    fields: Array.isArray(form.fields) ? form.fields : [],
    rules: Array.isArray(form.rules) ? form.rules : [],
    mappings: form.mappings && typeof form.mappings === 'object' ? form.mappings : {},
    layout: form.layout && typeof form.layout === 'object' ? form.layout : {},
    theme: form.theme && typeof form.theme === 'object' ? form.theme : {},
    policy: form.policy && typeof form.policy === 'object' ? form.policy : {},
    assignment: form.assignment && typeof form.assignment === 'object' ? form.assignment : {},
    spamProtection:
      form.spamProtection && typeof form.spamProtection === 'object' ? form.spamProtection : {},
  };
};

class WebFormsService {
  async getAllForms(): Promise<WebFormDefinition[]> {
    const response = await apiClient.get<any>('/webforms');
    const payload = unwrapPayload<any>(response);

    const list = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload?.rows)
      ? payload.rows
      : Array.isArray(payload?.results)
      ? payload.results
      : [];

    return list.map((item) => normalizeForm(item));
  }

  async getFormById(id: string): Promise<WebFormDefinition> {
    const response = await apiClient.get<any>(`/webforms/${id}`);
    return normalizeForm(unwrapPayload<any>(response));
  }

  async createForm(data: CreateWebFormDto): Promise<WebFormDefinition> {
    const response = await apiClient.post<CreateWebFormDto, any>('/webforms', data);
    return normalizeForm(unwrapPayload<any>(response));
  }

  async updateForm(id: string, data: UpdateWebFormDto): Promise<WebFormDefinition> {
    try {
      const response = await apiClient.patch<UpdateWebFormDto, any>(`/webforms/${id}`, data);
      return normalizeForm(unwrapPayload<any>(response));
    } catch (error: any) {
      const status = Number(error?.status || error?.response?.status);
      if (status === 404 || status === 405) {
        const fallback = await apiClient.put<UpdateWebFormDto, any>(`/webforms/${id}`, data);
        return normalizeForm(unwrapPayload<any>(fallback));
      }
      throw error;
    }
  }

  async getFormVersions(id: string): Promise<WebFormDefinition[]> {
    const response = await apiClient.get<any>(`/webforms/${id}/versions`);
    const payload = unwrapPayload<any>(response);
    const list = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.versions)
      ? payload.versions
      : [];
    return list.map((item) => normalizeForm(item));
  }

  async createNextVersion(id: string, payload: Record<string, any> = {}): Promise<WebFormDefinition> {
    const response = await apiClient.post<Record<string, any>, any>(`/webforms/${id}/versions`, payload);
    return normalizeForm(unwrapPayload<any>(response));
  }

  async publishForm(id: string, payload: Record<string, any> = {}): Promise<WebFormDefinition> {
    const response = await apiClient.post<Record<string, any>, any>(`/webforms/${id}/publish`, payload);
    return normalizeForm(unwrapPayload<any>(response));
  }

  async archiveForm(id: string, payload: Record<string, any> = {}): Promise<WebFormDefinition> {
    const response = await apiClient.post<Record<string, any>, any>(`/webforms/${id}/archive`, payload);
    return normalizeForm(unwrapPayload<any>(response));
  }

  async getRuntimeForm(key: string): Promise<WebFormRuntimeResponse> {
    const response = await apiClient.get<any>(`/webforms/runtime/${encodeURIComponent(key)}`);
    const payload = unwrapPayload<any>(response);
    return {
      ...payload,
      fields: Array.isArray(payload?.fields) ? payload.fields : [],
      rules: Array.isArray(payload?.rules) ? payload.rules : [],
      mappings: payload?.mappings && typeof payload.mappings === 'object' ? payload.mappings : {},
      layout: payload?.layout && typeof payload.layout === 'object' ? payload.layout : {},
      theme: payload?.theme && typeof payload.theme === 'object' ? payload.theme : {},
      policy: payload?.policy && typeof payload.policy === 'object' ? payload.policy : {},
      assignment: payload?.assignment && typeof payload.assignment === 'object' ? payload.assignment : {},
      spamProtection:
        payload?.spamProtection && typeof payload.spamProtection === 'object'
          ? payload.spamProtection
          : {},
    };
  }

  async submitRuntimeForm(
    key: string,
    payload: {
      values: Record<string, any>;
      targetPayload?: Record<string, any>;
      correlationId?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<any> {
    const requestBody: Record<string, any> = {
      ...payload,
      payload: payload.values,
      data: payload.values,
    };

    const response = await apiClient.post<Record<string, any>, any>(
      `/webforms/submit/${encodeURIComponent(key)}`,
      requestBody
    );
    return unwrapPayload<any>(response);
  }
}

export const webFormsService = new WebFormsService();
