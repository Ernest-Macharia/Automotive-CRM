import { apiClient } from '@/lib/api/client';
import { handleUnauthorizedRedirect } from '@/lib/auth/unauthorized';

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
  inspectedBy?: string | null;
  inspectorName?: string;
  remarks?: string;
  approved?: boolean;
  
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
    firstName: string;
    lastName: string;
    mobile: string;
    email: string;
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
  vehicleId: string;
  inspectionItems?: InspectionItem[];
  remarks?: string;
  approved?: boolean;
  
  checklistType?: string;
  inspectedBy?: string;
  inspectorName?: string;
  
  customerDetails?: {
    name?: string;
    firstName: string;
    lastName: string;
    mobile: string;
    email: string;
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
  serviceType?: 'pickup_only' | 'workshop_installation' | 'mobile_service';
  inspectorName?: string;
  customerDetails?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
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

    const token = sessionStorage.getItem('accessToken');
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
      return response.json();
    }
    return {} as T;
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

    const token = sessionStorage.getItem('accessToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // 1. Create a new pre-checklist
  async createPreChecklist(data: CreatePreChecklistDto, userId?: string): Promise<PreChecklist> {
    try {
      const headers: Record<string, string> = {};
      
      if (userId) {
        headers['X-User-Id'] = userId;
      }
      
      if (!data.checklistType && (data.services || data.carDetails)) {
        data.checklistType = 'diamond_rims';
      }
      
      const submissionData = {
        ...data,
        createdBy: userId || data.inspectedBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return await extendedApiClient.post<CreatePreChecklistDto, PreChecklist>(
        '/prechecklists', 
        submissionData, 
        headers
      );
    } catch (error: any) {
      console.error('Error creating pre-checklist:', error);
      console.error('Error response:', error.response?.data || error.message);
      throw new Error(error.message || 'Failed to create pre-checklist');
    }
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
    try {
      const updateData = {
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      return await extendedApiClient.put<UpdatePreChecklistDto, PreChecklist>(
        `/prechecklists/${id}`, 
        updateData
      );
    } catch (error: any) {
      console.error(`Error updating pre-checklist ${id}:`, error);
      console.error('Error response:', error.response?.data || error.message);
      throw new Error(error.message || 'Failed to update pre-checklist');
    }
  }

  // 6. Delete a pre-checklist
  async deletePreChecklist(id: string): Promise<{ message: string }> {
    try {
      return await extendedApiClient.delete<{ message: string }>(`/prechecklists/${id}`);
    } catch (error) {
      console.error(`Error deleting pre-checklist ${id}:`, error);
      throw error;
    }
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
  async requestEmailApproval(id: string, email: string, message?: string): Promise<{ success: boolean; message: string }> {
    try {
      return await extendedApiClient.post<{ email: string; message?: string }, { success: boolean; message: string }>(
        `/prechecklists/${id}/request-email-approval`,
        { email, message }
      );
    } catch (error: any) {
      console.error(`Error requesting email approval for pre-checklist ${id}:`, error);
      throw error;
    }
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

  async approvePreChecklist(id: string, remarks?: string): Promise<PreChecklist> {
    try {
      return await extendedApiClient.patch<{
        approved: boolean;
        remarks?: string;
      }, PreChecklist>(
        `/prechecklists/${id}/approve`, 
        { 
          approved: true,
          remarks
        }
      );
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
      const token = sessionStorage.getItem('accessToken');
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
      const token = sessionStorage.getItem('accessToken');
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
      const token = sessionStorage.getItem('accessToken');
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
        const list = await extendedApiClient.get<PreChecklist[]>(`/prechecklists/opportunity/${opportunityId}`);
        return Array.isArray(list) ? list : [];
      } catch {}

      try {
        const list = await extendedApiClient.get<PreChecklist[]>('/prechecklists', { opportunityId });
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
      const token = sessionStorage.getItem('accessToken');
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
}

export const preChecklistService = new PreChecklistService();
