import { apiClient } from '@/lib/api/client';
import { handleUnauthorizedRedirect } from '@/lib/auth/unauthorized';
import { getStoredAccessToken } from '@/lib/auth/tokenStorage';
import {
  buildRequestCacheKey,
  clearPendingRequest,
  clearRequestCache,
  getCachedResponse,
  getPendingRequest,
  setCachedResponse,
  setPendingRequest,
} from '@/lib/api/requestCache';

// Added file interfaces
export interface ChecklistFile {
  _id: string;
  filename: string;
  originalName: string;
  fileType: string;
  mimeType: string;
  size: number;
  path: string;
  uploadedBy: string | {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  uploadedAt: string;
  thumbnailPath?: string;
  itemIndex?: number;
  itemId?: string;
  tags?: string[];
  description?: string;
}

export interface FileUploadResponse {
  file: ChecklistFile;
  message: string;
  success: boolean;
}

export interface BulkUploadResponse {
  files: ChecklistFile[];
  message: string;
  success: boolean;
  failedFiles?: Array<{
    filename: string;
    error: string;
  }>;
}

export interface FileStats {
  totalFiles: number;
  totalSize: number;
  byType: Record<string, number>;
  byItem: Record<string, number>;
  recentFiles: ChecklistFile[];
}

export interface InspectionItem {
  _id?: string;
  item: string;
  status: 'ok' | 'fault' | 'n/a';
  remarks?: string;
  side?: string;
  files?: ChecklistFile[]; // Added for file attachments
}

export interface PreChecklist {
  _id: string;
  id: string;
  opportunityId: string | {
    _id: string;
    subject: string;
    type?: string;
    status?: string;
    customer?: {
      name: string;
      email?: string;
      phone?: string;
      companyName?: string;
      companyEmail?: string;
      contactPersonName?: string;
      contactPersonEmail?: string;
    };
  };
  vehicleId: string | {
    _id: string;
    registrationNumber?: string;
    make?: string;
    model?: string;
    year?: number;
    vin?: string;
    mileage?: number;
  };
  checklistType?: string;
  tags?: string[];
  inspectedBy?: string | null;
  inspectorName?: string;
  remarks?: string;
  approved?: boolean;
  pricingSnapshot?: {
    currency?: string;
    items?: Array<{
      name: string;
      itemType: 'service' | 'product';
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
    subtotal?: number;
    total?: number;
  };
  
  serviceIntake?: {
    date: string;
    customerServiceRep: string;
    inspectorNotes?: string;
    backendAccessCode?: string;
    priorityLevel?: 'normal' | 'high' | 'urgent';
    specialInstructions?: string;
  };
  
  customerDetails?: {
    name?: string;
    firstName?: string;
    lastName?: string;
    mobile?: string;
    email?: string;
  };
  
  carDetails?: {
    carMake: string;
    carModel: string;
    mileage: string;
    yearOfManufacture: string;
    licensePlate: string;
    vehicleType?: string;
    color: string;
    engineSize?: string;
    fuelType?: string;
  };
  
  services?: {
    actualService: string[];
  };

  serviceType?: string;
  productServiceNeeded?: string;
  productPrice?: number;
  servicePrice?: number;
  installationDetails?: string;
  deliveryPickupMethod?: string;
  acceptDiagnosticCharges?: boolean;
  
  preServiceInspection?: {
    condition: string[];
    inspectorAccessNotes?: string;
    inspectionNotes?: string;
    photosRequired?: boolean;
    videoRequired?: boolean;
  };
  
  powderCoating?: {
    colourRAL?: string;
  };
  
  deliveryMode?: string;
  tpmsSensorsFitted?: boolean;
  wheelNutsTotal?: number;
  nozzleCapsTotal?: number;
  nozzleCapsType?: string;
  lockNutsTotal?: number;
  
  centerCaps?: {
    present?: boolean;
    quantity?: number;
    condition?: string;
    type?: string;
    notes?: string;
  };
  
  rimOrTireSelection?: string;
  rimsDetails?: {
    quantity?: number;
    size?: string;
    type?: string;
    condition?: string;
  };
  tiresDetails?: {
    quantity?: number;
    size?: string;
    type?: string;
    treadDepth?: string;
  };
  
  tireBrands?: {
    fr?: string;
    fl?: string;
    br?: string;
    bl?: string;
    spare?: string;
  };
  
  tireDOT?: {
    fr?: {
      code?: string;
      week?: string;
      year?: string;
      plant?: string;
    };
    fl?: {
      code?: string;
      week?: string;
      year?: string;
      plant?: string;
    };
    br?: {
      code?: string;
      week?: string;
      year?: string;
      plant?: string;
    };
    bl?: {
      code?: string;
      week?: string;
      year?: string;
      plant?: string;
    };
    spare?: {
      code?: string;
      week?: string;
      year?: string;
      plant?: string;
    };
  };
  
  suitability?: {
    skimming?: string;
    powderCoating?: string;
    straightening?: string;
    welding?: string;
    diamondCutting?: string;
    notes?: string;
    recommendations?: string;
  };
  
  declaredValuable?: {
    value?: boolean;
    declaredValue?: number;
    insuranceRequired?: boolean;
    insuranceProvider?: string;
    policyNumber?: string;
    notes?: string;
  };
  
  agreedAmount?: {
    total?: number;
    breakdown?: string;
  };
  
  additionalInformation?: string;
  mustKnowAccepted?: boolean;
  
  clientUpdate?: {
    associatedRisks?: {
      brakeDiscSkimming?: boolean;
      powderCoating?: boolean;
      straightening?: boolean;
      welding?: boolean;
      diamondCutting?: boolean;
      general?: boolean;
    };
    mustKnows?: {
      processExplained?: boolean;
      clientRiskAcceptance?: boolean;
      personalBelongings?: boolean;
      timelineEstimates?: boolean;
      fullPaymentRequired?: boolean;
      storageFees?: boolean;
      storageRisk?: boolean;
    };
  };
  
  acceptTerms?: boolean;
  clientSignature?: string;
  inspectorSignature?: string;
  uploadedImages?: string[];
  clientSigningMethod?: string;
  clientEmail?: string;
  inspectionItems?: InspectionItem[];
  createdAt?: string;
  createdBy: string | null;
  updatedAt?: string;
  approvedBy?: string | {
    _id: string;
    firstName: string;
    lastName: string;
  };
  approvedAt?: string;
  
  // Added for file attachments
  files?: ChecklistFile[];
}

export interface CreatePreChecklistDto {
  opportunityId: string;
  vehicleId?: string;
  tags?: string[];
  pricingSnapshot?: {
    currency?: string;
    items?: Array<{
      name: string;
      itemType: 'service' | 'product';
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
    subtotal?: number;
    total?: number;
  };
  inspectionItems?: InspectionItem[];
  remarks?: string;
  approved?: boolean;
  
  checklistType?: string;
  inspectedBy?: string;
  inspectorName?: string;
  
  customerDetails?: {
    name?: string;
    firstName?: string;
    lastName?: string;
    mobile?: string;
    email?: string;
  };
  
  carDetails?: {
    carMake: string;
    carModel: string;
    mileage: string;
    yearOfManufacture: string;
    licensePlate: string;
    color: string;
    vehicleType?: string;
    engineSize?: string;
    fuelType?: string;
    vin?: string;
  };
  
  serviceIntake?: {
    date: string;
    customerServiceRep: string;
    inspectorNotes?: string;
    backendAccessCode?: string;
    priorityLevel?: string;
    specialInstructions?: string;
  };
  
  services?: {
    actualService: string[];
  };
  
  preServiceInspection?: {
    condition: string[];
    inspectorAccessNotes?: string;
    inspectionNotes?: string;
    photosRequired?: boolean;
    videoRequired?: boolean;
  };
  
  powderCoating?: {
    colourRAL?: string;
  };
  
  deliveryMode?: string;
  tpmsSensorsFitted?: boolean;
  wheelNutsTotal?: number;
  nozzleCapsTotal?: number;
  nozzleCapsType?: string;
  lockNutsTotal?: number;
  
  centerCaps?: {
    present?: boolean;
    quantity?: number;
    condition?: string;
    type?: string;
    notes?: string;
  };
  
  rimOrTireSelection?: string;
  rimsDetails?: {
    quantity?: number;
    size?: string;
    type?: string;
    condition?: string;
  };
  tiresDetails?: {
    quantity?: number;
    size?: string;
    type?: string;
    treadDepth?: string;
  };
  
  tireBrands?: {
    fr?: string;
    fl?: string;
    br?: string;
    bl?: string;
    spare?: string;
  };
  
  tireDOT?: {
    fr?: { code?: string; week?: string; year?: string; plant?: string };
    fl?: { code?: string; week?: string; year?: string; plant?: string };
    br?: { code?: string; week?: string; year?: string; plant?: string };
    bl?: { code?: string; week?: string; year?: string; plant?: string };
    spare?: { code?: string; week?: string; year?: string; plant?: string };
  };
  
  suitability?: {
    skimming?: string;
    powderCoating?: string;
    straightening?: string;
    welding?: string;
    diamondCutting?: string;
    notes?: string;
    recommendations?: string;
  };
  
  declaredValuable?: {
    value?: boolean;
    declaredValue?: number;
    insuranceRequired?: boolean;
    insuranceProvider?: string;
    policyNumber?: string;
    notes?: string;
  };
  
  agreedAmount?: {
    total?: number;
    breakdown?: string;
  };
  
  additionalInformation?: string;
  mustKnowAccepted?: boolean;
  
  clientUpdate?: {
    associatedRisks?: {
      brakeDiscSkimming?: boolean;
      powderCoating?: boolean;
      straightening?: boolean;
      welding?: boolean;
      diamondCutting?: boolean;
      general?: boolean;
    };
    mustKnows?: {
      processExplained?: boolean;
      clientRiskAcceptance?: boolean;
      personalBelongings?: boolean;
      timelineEstimates?: boolean;
      fullPaymentRequired?: boolean;
      storageFees?: boolean;
      storageRisk?: boolean;
    };
  };
  
  acceptTerms?: boolean;
  clientSignature?: string;
  inspectorSignature?: string;
  uploadedImages?: string[];
  clientSigningMethod?: string;
  clientEmail?: string;
  
  // Added for file attachments
  files?: ChecklistFile[];
}

export interface UpdatePreChecklistDto {
  inspectionItems?: InspectionItem[];
  remarks?: string;
  approved?: boolean;
  autoApproved?: boolean;
  approvedBy?: string;
  approvedAt?: string;
  tags?: string[];
  pricingSnapshot?: {
    currency?: string;
    items?: Array<{
      name: string;
      itemType: 'service' | 'product';
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
    subtotal?: number;
    total?: number;
  };
  clientEmail?: string;
  serviceType?: 'pickup_only' | 'workshop_installation' | 'mobile_service';
  inspectorName?: string;
  customerDetails?: {
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    mobile?: string;
  };
  carDetails?: {
    regNo: string;
    make: string;
    year: string;
    model: string;
    vin: string;
  };
  productServiceNeeded?: string;
  productPrice?: number;
  servicePrice?: number;
  agreedAmount?: {
    total?: number;
    breakdown?: string;
  };
  additionalInformation?: string;
  installationDetails?: {
    estimatedTime: 'less_1_hour' | '1_2_hours' | '3_hours' | 'more_3_hours';
    assignedTechnician: string;
    workStartTime: string;
  };
  deliveryPickupMethod?: 'customer_pickup' | 'courier_delivery' | 'mobile_delivery_install';
  acceptTerms?: boolean;
  acceptDiagnosticCharges?: boolean;
  clientSignature?: string;
  inspectorSignature?: string;
  uploadedImages?: string[];
  status?: string;
}

export interface PreChecklistStats {
  total: number;
  approved: number;
  pending: number;
  withFaults: number;
  byVehicle: Array<{
    vehicleId: string;
    vehicleInfo?: {
      make?: string;
      model?: string;
      registrationNumber?: string;
    };
    count: number;
  }>;
  byInspector: Array<{
    inspectorId: string;
    inspectorInfo?: {
      email?: string;
      firstName?: string;
    };
    count: number;
  }>;
  recentActivity: Array<{
    date: string;
    count: number;
    approved: number;
  }>;
}

export interface SignatureData {
  name: string;
  signatureData: string;
  role: 'Vehicle Owner' | 'Inspector' | 'Customer Service' | 'Manager' | string;
  ipAddress?: string;
  userAgent?: string;
}

export interface SignedPreChecklist {
  _id: string;
  signature: {
    name: string;
    signedAt: string;
    role: string;
    ipAddress?: string;
  };
  updatedAt: string;
}

export interface SendChecklistEmailOptions {
  email: string;
  clientName?: string;
  message?: string;
  subject?: string;
  includePdf?: boolean;
  includeSecureLink?: boolean;
  pdfBase64?: string;
  pdfFilename?: string;
  pdfMimeType?: string;
}

const normalizeObjectId = (value: unknown): string => {
  let candidate = '';

  if (typeof value === 'string') {
    candidate = value.trim();
  }

  if (!candidate && value && typeof value === 'object') {
    const rawId = (value as Record<string, unknown>)._id ?? (value as Record<string, unknown>).id;
    if (typeof rawId === 'string') {
      candidate = rawId.trim();
    }
  }

  if (!candidate) {
    return '';
  }

  const invalidTokens = new Set(['undefined', 'null', '[object Object]', 'NaN']);
  return invalidTokens.has(candidate) ? '' : candidate;
};

const isValidEmailAddress = (value: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

const normalizeOptionalEmail = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return isValidEmailAddress(trimmed) ? trimmed : undefined;
};

const sanitizePreChecklistPayload = <T extends Record<string, any>>(payload: T): T => {
  const vehicleId = normalizeObjectId(payload.vehicleId);
  const opportunityId = normalizeObjectId(payload.opportunityId);
  const inspectedBy = normalizeObjectId(payload.inspectedBy);
  const customerEmail = normalizeOptionalEmail(payload.customerDetails?.email);
  const clientEmail = normalizeOptionalEmail(payload.clientEmail);

  const sanitizedPayload: Record<string, any> = {
    ...payload,
    ...(opportunityId ? { opportunityId } : {}),
    ...(vehicleId ? { vehicleId } : {}),
    ...(inspectedBy ? { inspectedBy } : {}),
    ...(payload.customerDetails
      ? {
          customerDetails: {
            ...payload.customerDetails,
            ...(customerEmail ? { email: customerEmail } : { email: undefined }),
          },
        }
      : {}),
    ...(clientEmail ? { clientEmail } : { clientEmail: undefined }),
  };

  // Avoid sending empty identifiers to the API.
  if (!opportunityId) {
    delete sanitizedPayload.opportunityId;
  }
  if (!vehicleId) {
    delete sanitizedPayload.vehicleId;
  }
  if (!inspectedBy) {
    delete sanitizedPayload.inspectedBy;
  }

  return sanitizedPayload as T;
};

const MAX_INLINE_PRECHECKLIST_CREATE_BYTES = 900 * 1024; // 900KB safety ceiling for JSON create payload

type DeferredChecklistMediaPayload = Pick<
  UpdatePreChecklistDto,
  'clientSignature' | 'inspectorSignature' | 'uploadedImages'
>;

const estimateJsonPayloadSize = (payload: unknown): number => {
  try {
    return JSON.stringify(payload || {}).length;
  } catch {
    return 0;
  }
};

const parseErrorStatusCode = (error: any): number | null => {
  const status = Number(error?.status ?? error?.response?.status);
  if (Number.isFinite(status) && status > 0) {
    return status;
  }

  const messageMatch = String(error?.message || '').match(/API Error \((\d{3})\)/);
  if (!messageMatch) {
    return null;
  }

  const parsedStatus = Number(messageMatch[1]);
  return Number.isFinite(parsedStatus) ? parsedStatus : null;
};

const parseApiErrorMessage = (error: any, fallback: string): string => {
  const rawMessage = String(error?.message || '').trim();
  if (!rawMessage) {
    return fallback;
  }

  const withoutPrefix = rawMessage.replace(/^API Error \(\d{3}\):\s*/i, '').trim();
  if (!withoutPrefix) {
    return fallback;
  }

  if (withoutPrefix.startsWith('{')) {
    try {
      const parsed = JSON.parse(withoutPrefix);
      const parsedMessage = parsed?.message || parsed?.error;
      if (parsedMessage) {
        return String(parsedMessage);
      }
    } catch {
      // Ignore parse errors and continue with normalized text.
    }
  }

  const looksLikeHtml = /<(?:!DOCTYPE|html|head|body|title|meta|style|script)\b/i.test(withoutPrefix);
  if (looksLikeHtml) {
    const flattened = withoutPrefix
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return flattened || fallback;
  }

  return withoutPrefix;
};

const shouldRetryChecklistCreateWithoutMedia = (error: any): boolean => {
  const statusCode = parseErrorStatusCode(error);
  if (!statusCode) {
    return false;
  }

  // Retry by stripping heavy media payload on server/size pressure and transient server errors.
  return [413, 414, 431, 500, 502, 503, 504].includes(statusCode);
};

const normalizeNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
};

const normalizeImageArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeNonEmptyString(item))
    .filter((item): item is string => Boolean(item));
};

const buildDeferredChecklistMediaPayload = (
  payload: Record<string, any>
): DeferredChecklistMediaPayload | null => {
  const clientSignature = normalizeNonEmptyString(payload.clientSignature);
  const inspectorSignature = normalizeNonEmptyString(payload.inspectorSignature);
  const uploadedImages = normalizeImageArray(payload.uploadedImages);

  if (!clientSignature && !inspectorSignature && uploadedImages.length === 0) {
    return null;
  }

  return {
    ...(clientSignature ? { clientSignature } : {}),
    ...(inspectorSignature ? { inspectorSignature } : {}),
    ...(uploadedImages.length > 0 ? { uploadedImages } : {}),
  };
};

const omitDeferredChecklistMediaFromPayload = <T extends Record<string, any>>(payload: T): T => {
  const clonedPayload: Record<string, any> = { ...payload };
  delete clonedPayload.clientSignature;
  delete clonedPayload.inspectorSignature;
  delete clonedPayload.uploadedImages;
  return clonedPayload as T;
};

// Extended ApiClient for pre-checklist service
class ExtendedApiClient {
  private getApiBaseUrl(): string {
    if ((apiClient as any).API_BASE_URL) {
      return (apiClient as any).API_BASE_URL;
    }
    try {
      const config = require('@/lib/api/config');
      return config.API_BASE_URL || '';
    } catch {
      return '';
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = getStoredAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async requestWithHeaders<T>(
    endpoint: string, 
    options: RequestInit = {},
    customHeaders?: Record<string, string>
  ): Promise<T> {
    const url = `${this.getApiBaseUrl()}${endpoint}`;
    
    const headers = {
      ...this.getHeaders(),
      ...options.headers,
      ...customHeaders,
    };

    const config: RequestInit = {
      ...options,
      headers,
      mode: 'cors',
      credentials: 'include',
    };

    const method = (config.method || 'GET').toUpperCase();
    const cacheKey = buildRequestCacheKey(method, url, headers);

    if (method === 'GET') {
      const cached = getCachedResponse<T>(cacheKey);
      if (cached !== null) {
        return cached;
      }

      const pending = getPendingRequest<T>(cacheKey);
      if (pending) {
        return pending;
      }
    } else {
      clearRequestCache();
    }

    const executeRequest = async (): Promise<T> => {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        
        if (response.status === 401) {
          handleUnauthorizedRedirect();
        }
        
        throw new Error(`API Error (${response.status}): ${errorText || response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (method === 'GET') {
          setCachedResponse(cacheKey, data);
        }
        return data;
      }

      const emptyResponse = {} as T;
      if (method === 'GET') {
        setCachedResponse(cacheKey, emptyResponse);
      }
      return emptyResponse;
    };

    if (method === 'GET') {
      const pendingPromise = executeRequest().finally(() => clearPendingRequest(cacheKey));
      setPendingRequest(cacheKey, pendingPromise);
      return pendingPromise;
    }

    return executeRequest();
  }

  async get<T>(endpoint: string, params?: Record<string, string>, headers?: Record<string, string>): Promise<T> {
    let url = endpoint;
    if (params) {
      const queryParams = new URLSearchParams(params);
      url += `?${queryParams.toString()}`;
    }
    return this.requestWithHeaders<T>(url, { method: 'GET' }, headers);
  }

  async post<D, T>(endpoint: string, data: D, headers?: Record<string, string>): Promise<T> {
    return this.requestWithHeaders<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }, headers);
  }

  async put<D, T>(endpoint: string, data: D, headers?: Record<string, string>): Promise<T> {
    return this.requestWithHeaders<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, headers);
  }

  async patch<D, T>(endpoint: string, data: D, headers?: Record<string, string>): Promise<T> {
    return this.requestWithHeaders<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, headers);
  }

  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.requestWithHeaders<T>(endpoint, {
      method: 'DELETE',
    }, headers);
  }

  // Added method for file uploads
  async uploadFile<T>(endpoint: string, formData: FormData, headers?: Record<string, string>): Promise<T> {
    const url = `${this.getApiBaseUrl()}${endpoint}`;
    
    const defaultHeaders = this.getHeaders();
    delete defaultHeaders['Content-Type'];
    
    const mergedHeaders = {
      ...defaultHeaders,
      ...headers,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: mergedHeaders,
      body: formData,
      mode: 'cors',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      
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
}

const extendedApiClient = new ExtendedApiClient();

class PreChecklistService {
  private getApiBaseUrl(): string {
    if ((extendedApiClient as any).getApiBaseUrl) {
      return (extendedApiClient as any).getApiBaseUrl();
    }
    
    try {
      const config = require('@/lib/api/config');
      return config.API_BASE_URL || '';
    } catch {
      return '';
    }
  }

  private getHeaders(): Record<string, string> {
    if ((extendedApiClient as any).getHeaders) {
      return (extendedApiClient as any).getHeaders();
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = getStoredAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async syncDeferredChecklistMedia(
    checklistId: string,
    mediaPayload: DeferredChecklistMediaPayload
  ): Promise<void> {
    const hasSignatures = Boolean(mediaPayload.clientSignature || mediaPayload.inspectorSignature);
    const hasImages = Array.isArray(mediaPayload.uploadedImages) && mediaPayload.uploadedImages.length > 0;

    if (!checklistId || (!hasSignatures && !hasImages)) {
      return;
    }

    const pushMediaUpdate = async (payload: UpdatePreChecklistDto): Promise<void> => {
      const normalizedPayload = sanitizePreChecklistPayload(payload as Record<string, any>) as UpdatePreChecklistDto;
      const requestBody: UpdatePreChecklistDto & { updatedAt: string } = {
        ...normalizedPayload,
        updatedAt: new Date().toISOString()
      };
      await extendedApiClient.put<UpdatePreChecklistDto, PreChecklist>(
        `/prechecklists/${checklistId}`,
        requestBody
      );
    };

    try {
      await pushMediaUpdate(mediaPayload);
      return;
    } catch (primarySyncError) {
      console.warn('Deferred checklist media sync failed, retrying with smaller update chunks:', primarySyncError);
    }

    if (hasSignatures) {
      try {
        await pushMediaUpdate({
          ...(mediaPayload.clientSignature ? { clientSignature: mediaPayload.clientSignature } : {}),
          ...(mediaPayload.inspectorSignature ? { inspectorSignature: mediaPayload.inspectorSignature } : {}),
        });
      } catch (signatureSyncError) {
        console.warn('Deferred checklist signature sync failed:', signatureSyncError);
      }
    }

    if (hasImages) {
      try {
        await pushMediaUpdate({
          uploadedImages: mediaPayload.uploadedImages,
        });
      } catch (imageSyncError) {
        console.warn('Deferred checklist image sync failed:', imageSyncError);
      }
    }
  }

  // 1. Create a new pre-checklist
  async createPreChecklist(data: CreatePreChecklistDto, userId?: string): Promise<PreChecklist> {
    const headers: Record<string, string> = {};
    if (userId) {
      headers['X-User-Id'] = userId;
    }

    const sanitizedData = sanitizePreChecklistPayload(
      data as Record<string, any>
    ) as CreatePreChecklistDto;

    if (!sanitizedData.checklistType && (sanitizedData.services || sanitizedData.carDetails)) {
      sanitizedData.checklistType = 'diamond_rims';
    }

    const deferredMediaPayload = buildDeferredChecklistMediaPayload(
      sanitizedData as Record<string, any>
    );
    const payloadSize = estimateJsonPayloadSize(sanitizedData);
    const shouldSplitPayloadOnCreate =
      Boolean(deferredMediaPayload) && payloadSize > MAX_INLINE_PRECHECKLIST_CREATE_BYTES;

    const createWithPayload = async (payload: CreatePreChecklistDto): Promise<PreChecklist> =>
      extendedApiClient.post<CreatePreChecklistDto, PreChecklist>(
        '/prechecklists',
        payload,
        headers
      );

    let createdChecklist: PreChecklist | null = null;
    let usedDeferredMediaCreate = false;

    try {
      if (shouldSplitPayloadOnCreate) {
        usedDeferredMediaCreate = true;
        const payloadWithoutMedia = omitDeferredChecklistMediaFromPayload(
          sanitizedData as Record<string, any>
        ) as CreatePreChecklistDto;
        createdChecklist = await createWithPayload(payloadWithoutMedia);
      } else {
        createdChecklist = await createWithPayload(sanitizedData);
      }
    } catch (primaryError: any) {
      const shouldRetryWithoutMedia =
        !shouldSplitPayloadOnCreate &&
        Boolean(deferredMediaPayload) &&
        shouldRetryChecklistCreateWithoutMedia(primaryError);

      if (!shouldRetryWithoutMedia) {
        console.error('Error creating pre-checklist:', primaryError);
        console.error('Error response:', primaryError?.response?.data || primaryError?.message);
        console.error('Pre-checklist create diagnostics:', {
          apiBaseUrl: this.getApiBaseUrl(),
          payloadSize,
          hasDeferredMedia: Boolean(deferredMediaPayload),
          imageCount: deferredMediaPayload?.uploadedImages?.length || 0,
        });
        throw new Error(primaryError?.message || 'Failed to create pre-checklist');
      }

      try {
        usedDeferredMediaCreate = true;
        const payloadWithoutMedia = omitDeferredChecklistMediaFromPayload(
          sanitizedData as Record<string, any>
        ) as CreatePreChecklistDto;
        createdChecklist = await createWithPayload(payloadWithoutMedia);
        console.warn(
          'Pre-checklist created without inline signatures/images due create payload failure; syncing media in follow-up update.'
        );
      } catch (retryError: any) {
        console.error('Error creating pre-checklist after media-split retry:', retryError);
        console.error('Retry error response:', retryError?.response?.data || retryError?.message);
        throw new Error(retryError?.message || 'Failed to create pre-checklist');
      }
    }

    if (!createdChecklist) {
      throw new Error('Failed to create pre-checklist');
    }

    if (usedDeferredMediaCreate && deferredMediaPayload && createdChecklist._id) {
      await this.syncDeferredChecklistMedia(createdChecklist._id, deferredMediaPayload);
    }

    return createdChecklist;
  }

  // 2. Get all pre-checklists
  async getAllPreChecklists(): Promise<PreChecklist[]> {
    try {
      return await extendedApiClient.get<PreChecklist[]>('/prechecklists');
    } catch (error) {
      console.error('Error getting all pre-checklists:', error);
      throw error;
    }
  }

  // 3. Get pre-checklists by vehicle ID
  async getPreChecklistsByVehicle(vehicleId: string): Promise<PreChecklist[]> {
    try {
      return await extendedApiClient.get<PreChecklist[]>(`/prechecklists/vehicle/${vehicleId}`);
    } catch (error) {
      console.error(`Error getting pre-checklists for vehicle ${vehicleId}:`, error);
      throw error;
    }
  }

  // 4. Get a pre-checklist by ID
  async getPreChecklistById(id: string): Promise<PreChecklist> {
    try {
      return await extendedApiClient.get<PreChecklist>(`/prechecklists/${id}`);
    } catch (error) {
      console.error(`Error getting pre-checklist ${id}:`, error);
      throw error;
    }
  }

  // 5. Update a pre-checklist
  async updatePreChecklist(id: string, data: UpdatePreChecklistDto): Promise<PreChecklist> {
    const updateData: UpdatePreChecklistDto & { updatedAt: string } = {
      ...(sanitizePreChecklistPayload(data as Record<string, any>) as UpdatePreChecklistDto),
      updatedAt: new Date().toISOString()
    };

    const deferredMediaPayload = buildDeferredChecklistMediaPayload(updateData as Record<string, any>);
    const payloadSize = estimateJsonPayloadSize(updateData);
    const shouldSplitPayloadOnUpdate =
      Boolean(deferredMediaPayload) && payloadSize > MAX_INLINE_PRECHECKLIST_CREATE_BYTES;

    const updateWithPayload = async (payload: UpdatePreChecklistDto): Promise<PreChecklist> =>
      extendedApiClient.put<UpdatePreChecklistDto, PreChecklist>(
        `/prechecklists/${id}`,
        payload
      );

    let updatedChecklist: PreChecklist | null = null;
    let usedDeferredMediaUpdate = false;

    try {
      if (shouldSplitPayloadOnUpdate) {
        usedDeferredMediaUpdate = true;
        const payloadWithoutMedia = omitDeferredChecklistMediaFromPayload(
          updateData as Record<string, any>
        ) as UpdatePreChecklistDto;
        updatedChecklist = await updateWithPayload(payloadWithoutMedia);
      } else {
        updatedChecklist = await updateWithPayload(updateData);
      }
    } catch (primaryError: any) {
      const shouldRetryWithoutMedia =
        !shouldSplitPayloadOnUpdate &&
        Boolean(deferredMediaPayload) &&
        shouldRetryChecklistCreateWithoutMedia(primaryError);

      if (!shouldRetryWithoutMedia) {
        console.error(`Error updating pre-checklist ${id}:`, primaryError);
        console.error('Error response:', primaryError?.response?.data || primaryError?.message);
        throw new Error(primaryError?.message || 'Failed to update pre-checklist');
      }

      try {
        usedDeferredMediaUpdate = true;
        const payloadWithoutMedia = omitDeferredChecklistMediaFromPayload(
          updateData as Record<string, any>
        ) as UpdatePreChecklistDto;
        updatedChecklist = await updateWithPayload(payloadWithoutMedia);
        console.warn(
          `Pre-checklist ${id} updated without inline signatures/images due payload failure; syncing media in follow-up update.`
        );
      } catch (retryError: any) {
        console.error(`Error updating pre-checklist ${id} after media-split retry:`, retryError);
        console.error('Retry error response:', retryError?.response?.data || retryError?.message);
        throw new Error(retryError?.message || 'Failed to update pre-checklist');
      }
    }

    if (!updatedChecklist) {
      throw new Error('Failed to update pre-checklist');
    }

    if (usedDeferredMediaUpdate && deferredMediaPayload) {
      await this.syncDeferredChecklistMedia(id, deferredMediaPayload);
    }

    return updatedChecklist;
  }

  // 6. Delete a pre-checklist
  async deletePreChecklist(id: string): Promise<{ message: string; endpoint?: string; fallbackUsed?: boolean }> {
    const checklistId = String(id || '').trim();
    if (!checklistId) {
      throw new Error('Checklist ID is required for deletion');
    }

    const deleteEndpoints = [
      `/prechecklists/${checklistId}`,
      `/prechecklists/${checklistId}/delete`,
      `/pre-checklists/${checklistId}`,
      `/pre-checklists/${checklistId}/delete`,
    ];

    const softDeleteVariants: Array<{
      endpoint: string;
      payload: Record<string, unknown>;
      method: 'PATCH' | 'POST';
    }> = [
      {
        endpoint: `/prechecklists/${checklistId}`,
        payload: { status: 'deleted', remarks: 'Deleted by user action' },
        method: 'PATCH',
      },
      {
        endpoint: `/prechecklists/${checklistId}/status`,
        payload: { status: 'deleted' },
        method: 'PATCH',
      },
      {
        endpoint: `/prechecklists/${checklistId}/archive`,
        payload: { archived: true, status: 'deleted' },
        method: 'POST',
      },
      {
        endpoint: `/prechecklists/${checklistId}/cancel`,
        payload: { status: 'cancelled', remarks: 'Cancelled by user action' },
        method: 'PATCH',
      },
    ];

    let lastError: any = null;

    for (const endpoint of deleteEndpoints) {
      try {
        const response = await extendedApiClient.delete<any>(endpoint);
        return {
          message: response?.message || 'Pre-checklist deleted successfully',
          endpoint,
        };
      } catch (error: any) {
        lastError = error;
        const statusCode = parseErrorStatusCode(error);

        if (statusCode === 401 || statusCode === 403) {
          throw new Error('You do not have permission to delete this pre-checklist');
        }

        // Continue trying alternate endpoint variants.
      }
    }

    for (const variant of softDeleteVariants) {
      try {
        const response =
          variant.method === 'PATCH'
            ? await extendedApiClient.patch<Record<string, unknown>, any>(variant.endpoint, variant.payload)
            : await extendedApiClient.post<Record<string, unknown>, any>(variant.endpoint, variant.payload);

        return {
          message: response?.message || 'Pre-checklist removed successfully',
          endpoint: variant.endpoint,
          fallbackUsed: true,
        };
      } catch (error: any) {
        lastError = error;
        const statusCode = parseErrorStatusCode(error);

        if (statusCode === 401 || statusCode === 403) {
          throw new Error('You do not have permission to delete this pre-checklist');
        }
      }
    }

    console.error(`Error deleting pre-checklist ${checklistId}:`, lastError);
    throw new Error(parseApiErrorMessage(lastError, 'Failed to delete pre-checklist'));
  }

  // 7. Sign a pre-checklist
  async signPreChecklist(id: string, signatureData: SignatureData): Promise<SignedPreChecklist> {
    try {
      const clientInfo = await this.getClientInfo();
      
      const signatureSubmission = {
        ...signatureData,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      };
      
      return await extendedApiClient.post<typeof signatureSubmission, SignedPreChecklist>(
        `/prechecklists/${id}/sign`,
        signatureSubmission
      );
    } catch (error: any) {
      console.error(`Error signing pre-checklist ${id}:`, error);
      throw new Error(error.message || 'Failed to sign pre-checklist');
    }
  }

  // 8. Request email approval for pre-checklist
  async requestEmailApproval(
    id: string,
    email: string,
    message?: string,
    subject?: string,
    clientName?: string
  ): Promise<{ success: boolean; message: string }> {
    const normalizedChecklistId = String(id || '').trim();
    if (!normalizedChecklistId) {
      throw new Error('Checklist ID is required to send an approval email');
    }

    const normalizedEmail = String(email || '').trim();
    if (!isValidEmailAddress(normalizedEmail)) {
      throw new Error('Please provide a valid client email address');
    }

    const normalizedMessage = String(message || '').trim();
    const normalizedSubject = String(subject || '').trim();
    const resolvedClientName = String(clientName || 'Client').trim() || 'Client';

    const approvalEndpoints = [
      `/prechecklists/${normalizedChecklistId}/request-email-approval`,
      `/prechecklist/${normalizedChecklistId}/request-email-approval`,
      `/prechecklists/${normalizedChecklistId}/email/request-approval`,
    ];

    const payload = {
      email: normalizedEmail,
      clientEmail: normalizedEmail,
      recipientEmail: normalizedEmail,
      to: normalizedEmail,
      clientName: resolvedClientName,
      customerName: resolvedClientName,
      ...(normalizedMessage
        ? {
            message: normalizedMessage,
            body: normalizedMessage,
            text: normalizedMessage,
          }
        : {}),
      ...(normalizedSubject ? { subject: normalizedSubject } : {}),
    };

    let lastError: any = null;

    for (const endpoint of approvalEndpoints) {
      try {
        const response = await extendedApiClient.post<typeof payload, any>(endpoint, payload);
        const normalizedSuccess = typeof response?.success === 'boolean' ? response.success : true;
        const normalizedMessage = response?.message || 'Checklist email request sent successfully';

        if (!normalizedSuccess) {
          lastError = new Error(normalizedMessage || 'Checklist email request failed');
          continue;
        }

        return {
          success: true,
          message: normalizedMessage,
        };
      } catch (error: any) {
        lastError = error;
        const statusCode = parseErrorStatusCode(error);
        if (statusCode === 401 || statusCode === 403) {
          throw error;
        }
        if (statusCode === 404 || statusCode === 405) {
          continue;
        }

        throw new Error(parseApiErrorMessage(error, 'Failed to request checklist email approval'));
      }
    }

    console.error(`Error requesting email approval for pre-checklist ${id}:`, lastError);
    throw new Error(parseApiErrorMessage(lastError, 'Failed to request checklist email approval'));
  }

  /**
   * Send checklist copy email with PDF attachment when supported by backend.
   * Falls back to the approval-email flow when copy-email endpoints are unavailable.
   */
  async sendChecklistCopyEmail(
    id: string,
    options: SendChecklistEmailOptions
  ): Promise<{ success: boolean; message: string; endpoint?: string; fallbackUsed?: boolean }> {
    const normalizedChecklistId = String(id || '').trim();
    if (!normalizedChecklistId) {
      throw new Error('Checklist ID is required to send checklist email');
    }

    const normalizedEmail = String(options.email || '').trim();
    if (!isValidEmailAddress(normalizedEmail)) {
      throw new Error('Please provide a valid client email address');
    }

    const normalizedMessage = String(options.message || '').trim();
    const normalizedSubject = String(options.subject || 'Service Intake Form').trim();
    const normalizedPdfBase64 =
      typeof options.pdfBase64 === 'string'
        ? options.pdfBase64.replace(/^data:application\/pdf;base64,/i, '').trim()
        : '';
    const resolvedPdfFilename =
      options.pdfFilename || `SERVICE-INTAKE-${normalizedChecklistId.slice(-8) || 'CHECKLIST'}.pdf`;
    const resolvedPdfMimeType = options.pdfMimeType || 'application/pdf';
    const resolvedClientName = String(options.clientName || 'Client').trim() || 'Client';

    const basePayload = {
      email: normalizedEmail,
      clientEmail: normalizedEmail,
      recipientEmail: normalizedEmail,
      to: normalizedEmail,
      clientName: resolvedClientName,
      customerName: resolvedClientName,
      message: normalizedMessage,
      body: normalizedMessage,
      text: normalizedMessage,
      subject: normalizedSubject,
      includePdf: options.includePdf ?? true,
      includeSecureLink: options.includeSecureLink ?? true,
    };

    const attachmentPayload = normalizedPdfBase64
      ? {
          pdfBase64: normalizedPdfBase64,
          pdfContent: normalizedPdfBase64,
          pdfFilename: resolvedPdfFilename,
          pdfMimeType: resolvedPdfMimeType,
          attachment: {
            filename: resolvedPdfFilename,
            content: normalizedPdfBase64,
            encoding: 'base64',
            contentType: resolvedPdfMimeType,
          },
          attachments: [
            {
              filename: resolvedPdfFilename,
              content: normalizedPdfBase64,
              encoding: 'base64',
              contentType: resolvedPdfMimeType,
            },
          ],
        }
      : {};

    const payload = {
      ...basePayload,
      ...attachmentPayload,
    };

    const directSendEndpoints = [
      `/prechecklists/${normalizedChecklistId}/send-email`,
      ...(normalizedPdfBase64 ? [`/prechecklists/${normalizedChecklistId}/send-pdf-email`] : []),
      `/prechecklists/${normalizedChecklistId}/send-client-email`,
      `/prechecklists/${normalizedChecklistId}/send-client-copy`,
      `/prechecklists/${normalizedChecklistId}/send-signed-copy`,
      `/prechecklists/${normalizedChecklistId}/email/send-client`,
      `/prechecklists/${normalizedChecklistId}/email/send-copy`,
      `/prechecklists/${normalizedChecklistId}/email/send`,
      `/prechecklist/${normalizedChecklistId}/send-email`,
    ];

    let lastDirectSendError: any = null;
    for (const endpoint of directSendEndpoints) {
      try {
        const response = await extendedApiClient.post<typeof payload, any>(endpoint, payload);
        const normalizedSuccess = typeof response?.success === 'boolean' ? response.success : true;
        const normalizedResponseMessage = response?.message || 'Checklist email sent successfully';

        if (!normalizedSuccess) {
          lastDirectSendError = new Error(normalizedResponseMessage || 'Checklist email endpoint returned unsuccessful response');
          continue;
        }

        return {
          success: true,
          message: normalizedResponseMessage,
          endpoint,
          fallbackUsed: false,
        };
      } catch (error: any) {
        lastDirectSendError = error;
        const statusCode = parseErrorStatusCode(error);
        if (statusCode === 401 || statusCode === 403) {
          throw error;
        }

        if (statusCode === 404 || statusCode === 405) {
          continue;
        }

        throw new Error(parseApiErrorMessage(error, 'Failed to send checklist email'));
      }
    }

    if (lastDirectSendError) {
      console.warn(`Checklist copy email direct endpoints failed for ${normalizedChecklistId}:`, lastDirectSendError);
    }

    try {
      const approvalResult = await this.requestEmailApproval(
        normalizedChecklistId,
        normalizedEmail,
        normalizedMessage,
        normalizedSubject,
        resolvedClientName
      );

      return {
        success: approvalResult.success,
        message: approvalResult.message || 'Checklist email approval requested successfully',
        endpoint: `/prechecklists/${normalizedChecklistId}/request-email-approval`,
        fallbackUsed: true,
      };
    } catch (approvalError: any) {
      const approvalStatusCode = parseErrorStatusCode(approvalError);
      if (approvalStatusCode === 401 || approvalStatusCode === 403) {
        throw approvalError;
      }

      if (approvalStatusCode !== 404 && approvalStatusCode !== 405) {
        throw new Error(parseApiErrorMessage(approvalError, 'Failed to request checklist email approval'));
      }
    }

    const unavailableError = new Error(
      'Checklist email backend endpoint is not available and the approval email fallback also failed.'
    );
    (unavailableError as any).code = 'CHECKLIST_EMAIL_BACKEND_UNAVAILABLE';
    throw unavailableError;
  }

  // 9. Approve pre-checklist via email token
  async approveViaEmail(token: string, approved: boolean = true, remarks?: string): Promise<PreChecklist> {
    try {
      return await extendedApiClient.post<{ approved: boolean; remarks?: string }, PreChecklist>(
        `/prechecklists/email-approve/${token}`,
        { approved, remarks }
      );
    } catch (error: any) {
      console.error(`Error approving pre-checklist via email token ${token}:`, error);
      throw error;
    }
  }

  // 10. Upload file to pre-checklist
  async uploadFile(id: string, file: File, description?: string, tags?: string[]): Promise<FileUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (description) {
        formData.append('description', description);
      }
      
      if (tags && tags.length > 0) {
        formData.append('tags', JSON.stringify(tags));
      }
      
      return await extendedApiClient.uploadFile<FileUploadResponse>(
        `/prechecklists/${id}/upload-file`,
        formData
      );
    } catch (error: any) {
      console.error(`Error uploading file to pre-checklist ${id}:`, error);
      throw error;
    }
  }

  async approvePreChecklist(id: string, approvedByOrRemarks?: string, remarksArg?: string): Promise<PreChecklist> {
    try {
      const normalizedApprovedByOrRemarks = String(approvedByOrRemarks || '').trim();
      const normalizedRemarksArg = String(remarksArg || '').trim();
      const resemblesUserIdOrEmail =
        /^[a-fA-F0-9]{24}$/.test(normalizedApprovedByOrRemarks) ||
        normalizedApprovedByOrRemarks.includes('@');

      const approvedBy = resemblesUserIdOrEmail
        ? normalizedApprovedByOrRemarks
        : '';
      const remarks = normalizedRemarksArg || (!resemblesUserIdOrEmail ? normalizedApprovedByOrRemarks : '');

      const payloadVariants: Array<Record<string, unknown>> = [
        { approved: true, approvedBy, remarks },
        { approved: true, approvedBy },
        { approved: true, remarks },
        { approved: true },
        { status: 'approved', approvedBy, remarks },
      ];
      const endpoints: Array<{ path: string; method: 'patch' | 'post' }> = [
        { path: `/prechecklists/${id}/approve`, method: 'patch' },
        { path: `/prechecklists/${id}/approve`, method: 'post' },
        { path: `/prechecklists/${id}/approval`, method: 'patch' },
        { path: `/prechecklists/${id}/approval`, method: 'post' },
      ];

      let lastError: any = null;
      for (const endpoint of endpoints) {
        for (const payload of payloadVariants) {
          try {
            if (endpoint.method === 'patch') {
              return await extendedApiClient.patch<Record<string, unknown>, PreChecklist>(
                endpoint.path,
                payload
              );
            }
            return await extendedApiClient.post<Record<string, unknown>, PreChecklist>(
              endpoint.path,
              payload
            );
          } catch (error: any) {
            lastError = error;
            const statusCode = parseErrorStatusCode(error);
            if (statusCode === 401 || statusCode === 403) {
              throw error;
            }
            if (statusCode !== null && statusCode >= 400 && statusCode < 500 && statusCode !== 404 && statusCode !== 405) {
              continue;
            }
          }
        }
      }

      if (lastError) {
        console.warn(`Dedicated approval routes failed for pre-checklist ${id}; falling back to checklist update.`, lastError);
      }

      return await this.updatePreChecklist(id, {
        approved: true,
        approvedBy,
        approvedAt: new Date().toISOString(),
        ...(remarks ? { remarks } : {}),
      });
    } catch (error) {
      console.error(`Error approving pre-checklist ${id}:`, error);
      throw error;
    }
  }

  // 8. Reject a pre-checklist (could be PATCH /api/v1/prechecklists/{id}/reject)
  async rejectPreChecklist(id: string, reason?: string): Promise<PreChecklist> {
    try {
      const headers: Record<string, string> = {};
      
      if (reason) {
        headers['X-Rejection-Reason'] = reason;
      }
      
      // Use the right type for the API call
      return await extendedApiClient.patch<UpdatePreChecklistDto, PreChecklist>(
        `/prechecklists/${id}/approve`,
        { 
          approved: false,
          ...(reason && { remarks: `Rejected: ${reason}` })
        }, 
        headers
      );
    } catch (error) {
      console.error(`Error rejecting pre-checklist ${id}:`, error);
      throw error;
    }
  }

  // 9. Mark stage complete after approval
  async markStageCompleteAfterApproval(checklistId: string, stageName: string): Promise<{ 
    success: boolean; 
    message: string; 
    stageCompleted: boolean 
  }> {
    try {
      // This would typically call your workflow/stage management API
      // to mark the corresponding stage as complete
      return await extendedApiClient.post<{
        checklistId: string;
        stageName: string;
        action: 'complete-stage';
      }, { success: boolean; message: string; stageCompleted: boolean }>(
        `/workflow/stages/complete`,
        {
          checklistId,
          stageName,
          action: 'complete-stage'
        }
      );
    } catch (error) {
      console.error(`Error marking stage complete for checklist ${checklistId}:`, error);
      throw error;
    }
  }

  // 10. Get approval workflow status
  async getApprovalWorkflowStatus(checklistId: string): Promise<{
    checklistId: string;
    approved: boolean;
    stageName: string;
    stageStatus: 'pending' | 'in-progress' | 'completed' | 'blocked';
    nextStage?: string;
    canProceed: boolean;
  }> {
    try {
      return await extendedApiClient.get<{
        checklistId: string;
        approved: boolean;
        stageName: string;
        stageStatus: 'pending' | 'in-progress' | 'completed' | 'blocked';
        nextStage?: string;
        canProceed: boolean;
      }>(`/prechecklists/${checklistId}/workflow-status`);
    } catch (error) {
      console.error(`Error getting workflow status for checklist ${checklistId}:`, error);
      throw error;
    }
  }

  // 11. Upload and attach file to specific inspection item
  async attachFileToItem(id: string, itemIndex: number, file: File, description?: string): Promise<FileUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('itemIndex', itemIndex.toString());
      
      if (description) {
        formData.append('description', description);
      }
      
      return await extendedApiClient.uploadFile<FileUploadResponse>(
        `/prechecklists/${id}/attach-to-item`,
        formData
      );
    } catch (error: any) {
      console.error(`Error attaching file to item ${itemIndex} in pre-checklist ${id}:`, error);
      throw error;
    }
  }

  // 12. Get all files for a pre-checklist
  async getFiles(id: string): Promise<ChecklistFile[]> {
    try {
      return await extendedApiClient.get<ChecklistFile[]>(`/prechecklists/${id}/files`);
    } catch (error: any) {
      console.error(`Error getting files for pre-checklist ${id}:`, error);
      throw error;
    }
  }

  // 13. Get files for specific inspection item
  async getFilesForItem(id: string, itemIndex: number): Promise<ChecklistFile[]> {
    try {
      return await extendedApiClient.get<ChecklistFile[]>(`/prechecklists/${id}/files/${itemIndex}`);
    } catch (error: any) {
      console.error(`Error getting files for item ${itemIndex} in pre-checklist ${id}:`, error);
      throw error;
    }
  }

  // 14. Get file statistics for pre-checklist
  async getFileStats(id: string): Promise<FileStats> {
    try {
      return await extendedApiClient.get<FileStats>(`/prechecklists/${id}/file-stats`);
    } catch (error: any) {
      console.error(`Error getting file stats for pre-checklist ${id}:`, error);
      throw error;
    }
  }

  // 15. Delete a file
  async deleteFile(fileId: string): Promise<{ success: boolean; message: string }> {
    try {
      return await extendedApiClient.delete<{ success: boolean; message: string }>(
        `/prechecklists/files/${fileId}`
      );
    } catch (error: any) {
      console.error(`Error deleting file ${fileId}:`, error);
      throw error;
    }
  }

  // 16. Download a file
  async downloadFile(fileId: string): Promise<Blob> {
    try {
      const token = getStoredAccessToken();
      const headers: Record<string, string> = {
        'Authorization': token ? `Bearer ${token}` : '',
      };
      
      const response = await fetch(`${this.getApiBaseUrl()}/prechecklists/files/${fileId}/download`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }
      
      return await response.blob();
    } catch (error: any) {
      console.error(`Error downloading file ${fileId}:`, error);
      throw error;
    }
  }

  // 17. View a file in browser
  async viewFile(fileId: string): Promise<Blob> {
    try {
      const token = getStoredAccessToken();
      const headers: Record<string, string> = {
        'Authorization': token ? `Bearer ${token}` : '',
      };
      
      const response = await fetch(`${this.getApiBaseUrl()}/prechecklists/files/${fileId}/view`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to view file: ${response.statusText}`);
      }
      
      return await response.blob();
    } catch (error: any) {
      console.error(`Error viewing file ${fileId}:`, error);
      throw error;
    }
  }

  // 18. Get file thumbnail
  async getFileThumbnail(fileId: string): Promise<Blob> {
    try {
      const token = getStoredAccessToken();
      const headers: Record<string, string> = {
        'Authorization': token ? `Bearer ${token}` : '',
      };
      
      const response = await fetch(`${this.getApiBaseUrl()}/prechecklists/files/${fileId}/thumbnail`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get file thumbnail: ${response.statusText}`);
      }
      
      return await response.blob();
    } catch (error: any) {
      console.error(`Error getting thumbnail for file ${fileId}:`, error);
      throw error;
    }
  }

  // 19. Bulk upload multiple files
  async bulkUpload(id: string, files: File[]): Promise<BulkUploadResponse> {
    try {
      const formData = new FormData();
      
      files.forEach((file, index) => {
        formData.append(`files`, file);
      });
      
      return await extendedApiClient.uploadFile<BulkUploadResponse>(
        `/prechecklists/${id}/bulk-upload`,
        formData
      );
    } catch (error: any) {
      console.error(`Error bulk uploading files to pre-checklist ${id}:`, error);
      throw error;
    }
  }

  // 20. Bulk attach files to specific inspection items
  async bulkAttachToItems(id: string, attachments: Array<{ itemIndex: number; file: File }>): Promise<BulkUploadResponse> {
    try {
      const formData = new FormData();
      
      attachments.forEach((attachment, index) => {
        formData.append(`files`, attachment.file);
        formData.append(`itemIndices`, attachment.itemIndex.toString());
      });
      
      return await extendedApiClient.uploadFile<BulkUploadResponse>(
        `/prechecklists/${id}/bulk-attach-to-items`,
        formData
      );
    } catch (error: any) {
      console.error(`Error bulk attaching files to items in pre-checklist ${id}:`, error);
      throw error;
    }
  }

  // Get client information for signatures
  private async getClientInfo(): Promise<{ ipAddress: string; userAgent: string }> {
    try {
      let ipAddress = 'unknown';
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        ipAddress = ipData.ip;
      } catch (ipError) {
        console.warn('Could not fetch IP address:', ipError);
      }
      
      const userAgent = navigator.userAgent || 'unknown';
      
      return { ipAddress, userAgent };
    } catch (error) {
      console.error('Error getting client info:', error);
      return { ipAddress: 'unknown', userAgent: 'unknown' };
    }
  }

  // Utility methods (rest of the existing methods remain the same)
  async getPreChecklistsByOpportunity(opportunityId: string): Promise<PreChecklist[]> {
    try {
      try {
        const list = await extendedApiClient.get<PreChecklist[]>('/prechecklists', { opportunityId });
        return Array.isArray(list) ? list : [];
      } catch {}

      try {
        const list = await extendedApiClient.get<PreChecklist[]>(`/prechecklists/opportunity/${opportunityId}`);
        return Array.isArray(list) ? list : [];
      } catch {}

      const allChecklists = await this.getAllPreChecklists();
      return allChecklists.filter(checklist => {
        const oppId = typeof checklist.opportunityId === 'object'
          ? checklist.opportunityId._id
          : checklist.opportunityId;
        return oppId === opportunityId;
      });
    } catch (error) {
      console.error(`Error getting pre-checklists for opportunity ${opportunityId}:`, error);
      return [];
    }
  }

  // ... [All other existing utility methods remain exactly the same] ...
  // Note: I've truncated the rest of the methods for brevity, but they should remain unchanged

  async downloadPDF(id: string): Promise<Blob> {
    try {
      const token = getStoredAccessToken();
      const headers: Record<string, string> = {
        'Authorization': token ? `Bearer ${token}` : '',
      };
      
      const response = await fetch(`${this.getApiBaseUrl()}/prechecklists/${id}/download-pdf`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.statusText}`);
      }
      
      return await response.blob();
    } catch (error: any) {
      console.error(`Error downloading PDF for pre-checklist ${id}:`, error);
      throw error;
    }
  }

  async generatePDF(id: string): Promise<{ pdfPath: string; message: string }> {
    try {
      return await extendedApiClient.get<{ pdfPath: string; message: string }>(
        `/prechecklists/${id}/generate-pdf`
      );
    } catch (error: any) {
      console.error(`Error generating PDF for pre-checklist ${id}:`, error);
      throw error;
    }
  }

  /**
   * Check or uncheck a specific checklist item
   * PATCH /api/v1/prechecklists/{id}/check-item/{itemIndex}
   */
  async checkItem(
    id: string,
    itemIndex: number,
    data: { checked?: boolean; remarks?: string } = {}
  ): Promise<PreChecklist> {
    try {
      return await extendedApiClient.patch<typeof data, PreChecklist>(
        `/prechecklists/${id}/check-item/${itemIndex}`,
        data
      );
    } catch (error: any) {
      console.error(`Error checking item ${itemIndex} for pre-checklist ${id}:`, error);
      throw error;
    }
  }

  /**
   * View generated checklist PDF inline
   * GET /api/v1/prechecklists/{id}/view-pdf
   */
  async viewPDF(id: string): Promise<Blob> {
    try {
      const token = getStoredAccessToken();
      const headers: HeadersInit = {
        'Authorization': token ? `Bearer ${token}` : '',
      };

      const response = await fetch(`${this.getApiBaseUrl()}/prechecklists/${id}/view-pdf`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to view PDF: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error: any) {
      console.error(`Error viewing PDF for pre-checklist ${id}:`, error);
      throw error;
    }
  }
}

export const preChecklistService = new PreChecklistService();
