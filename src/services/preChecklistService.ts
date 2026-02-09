import { apiClient } from '@/lib/api/client';

export interface InspectionItem {
  _id?: string;
  item: string;
  status: 'ok' | 'fault' | 'n/a';
  remarks?: string;
  side?: string;
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
}

export interface CreatePreChecklistDto {
  opportunityId: string;
  vehicleId: string;
  inspectionItems?: InspectionItem[];
  remarks?: string;
  approved?: boolean;
  
  // Update these interfaces to match Diamond Rims form
  checklistType?: string;
  inspectedBy?: string;
  inspectorName?: string;
  
  // Fix: Update customerDetails to match form
  customerDetails?: {
    name?: string;
    firstName: string;
    lastName: string;
    mobile: string; // Change from phone to mobile
    email: string;
  };
  
  // Fix: Update carDetails to match form
  carDetails?: {
    carMake: string; // Change from make
    carModel: string; // Change from model
    mileage: string; // Added
    yearOfManufacture: string; // Change from year
    licensePlate: string; // Change from regNo
    color: string; // Added
    vehicleType?: string; // Added
    engineSize?: string; // Added
    fuelType?: string; // Added
    vin?: string; // Keep vin
  };
  
  // Add other Diamond Rims fields
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
  signatureData: string; // Base64 image data
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
        sessionStorage.removeItem('accessToken');
        window.location.href = '/login';
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
}

const extendedApiClient = new ExtendedApiClient();

class PreChecklistService {
  private getApiBaseUrl(): string {
    // Access the private method from extendedApiClient if available
    if ((extendedApiClient as any).getApiBaseUrl) {
      return (extendedApiClient as any).getApiBaseUrl();
    }
    
    // Fallback to environment variable or default
    try {
      const config = require('@/lib/api/config');
      return config.API_BASE_URL || '';
    } catch {
      return '';
    }
  }

  private getHeaders(): Record<string, string> {
    // Access the private method from extendedApiClient if available
    if ((extendedApiClient as any).getHeaders) {
      return (extendedApiClient as any).getHeaders();
    }
    
    // Fallback implementation
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
      
      // For Diamond Rims checklist, ensure checklistType is set
      if (!data.checklistType && (data.services || data.carDetails)) {
        data.checklistType = 'diamond_rims';
      }
      
      // Add createdBy if not present
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
      
      // Add updatedAt timestamp
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

  // Utility methods
  async getPreChecklistsByOpportunity(opportunityId: string): Promise<PreChecklist[]> {
    // NOTE:
    // The backend has historically been unreliable for GET /prechecklists (500s).
    // To avoid breaking stage overview UI, we try more specific endpoints first.
    // If all attempts fail, we return an empty list (callers should handle gracefully).
    try {
      // 1) Preferred: opportunity-specific endpoint (if available on backend)
      try {
        const list = await extendedApiClient.get<PreChecklist[]>(`/prechecklists/opportunity/${opportunityId}`);
        return Array.isArray(list) ? list : [];
      } catch {
        // ignore, try next
      }

      // 2) Alternative: query param filtering (if backend supports it)
      try {
        const list = await extendedApiClient.get<PreChecklist[]>('/prechecklists', { opportunityId });
        return Array.isArray(list) ? list : [];
      } catch {
        // ignore, try next
      }

      // 3) Fallback: fetch all then filter locally (least preferred)
      const allChecklists = await this.getAllPreChecklists();
      return allChecklists.filter(checklist => {
        const oppId = typeof checklist.opportunityId === 'object'
          ? checklist.opportunityId._id
          : checklist.opportunityId;
        return oppId === opportunityId;
      });
    } catch (error) {
      console.error(`Error getting pre-checklists for opportunity ${opportunityId}:`, error);
      // Don't throw—stage overview should still render even if documents cannot be fetched.
      return [];
    }
  }

  async getApprovedPreChecklists(): Promise<PreChecklist[]> {
    try {
      const allChecklists = await this.getAllPreChecklists();
      return allChecklists.filter(checklist => checklist.approved);
    } catch (error) {
      console.error('Error getting approved pre-checklists:', error);
      throw error;
    }
  }

  async getPendingPreChecklists(): Promise<PreChecklist[]> {
    try {
      const allChecklists = await this.getAllPreChecklists();
      return allChecklists.filter(checklist => !checklist.approved);
    } catch (error) {
      console.error('Error getting pending pre-checklists:', error);
      throw error;
    }
  }

  async getPreChecklistsWithFaults(): Promise<PreChecklist[]> {
    try {
      const allChecklists = await this.getAllPreChecklists();
      return allChecklists.filter(checklist => 
        checklist.inspectionItems.some(item => item.status === 'fault')
      );
    } catch (error) {
      console.error('Error getting pre-checklists with faults:', error);
      throw error;
    }
  }

  async getRecentPreChecklists(limit: number = 10): Promise<PreChecklist[]> {
    try {
      const allChecklists = await this.getAllPreChecklists();
      return allChecklists
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent pre-checklists:', error);
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

  async signPreChecklist(id: string, signatureData: SignatureData): Promise<SignedPreChecklist> {
    try {
      // Get client IP and user agent
      const clientInfo = await this.getClientInfo();
      
      const signatureSubmission = {
        ...signatureData,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      };
      
      return await extendedApiClient.post<SignatureData, SignedPreChecklist>(
        `/prechecklists/${id}/sign`,
        signatureSubmission
      );
    } catch (error: any) {
      console.error(`Error signing pre-checklist ${id}:`, error);
      throw new Error(error.message || 'Failed to sign pre-checklist');
    }
  }

// 8. Get client information
private async getClientInfo(): Promise<{ ipAddress: string; userAgent: string }> {
  try {
    // Get IP address
    let ipAddress = 'unknown';
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      ipAddress = ipData.ip;
    } catch (ipError) {
      console.warn('Could not fetch IP address:', ipError);
    }
    
    // Get user agent from browser
    const userAgent = navigator.userAgent || 'unknown';
    
    return { ipAddress, userAgent };
  } catch (error) {
    console.error('Error getting client info:', error);
    return { ipAddress: 'unknown', userAgent: 'unknown' };
  }
}

// 9. Download PDF
// In preChecklistService.ts, simplify the downloadPDF method:
async downloadPDF(id: string): Promise<Blob> {
  try {
    // Use the existing API client methods if possible
    // If not, create a simple fetch request
    const token = sessionStorage.getItem('accessToken');
    const headers: Record<string, string> = {
      'Authorization': token ? `Bearer ${token}` : '',
    };
    
    // You might need to adjust the URL based on your setup
    const response = await fetch(`/api/v1/prechecklists/${id}/download-pdf`, {
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

// 10. Generate PDF
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

  // Method to check if pre-checklist is required for stage transition
  async isRequiredForStageTransition(opportunityId: string): Promise<{
    required: boolean;
    reason: string;
    hasChecklist: boolean;
    hasApprovedChecklist: boolean;
    isComplete: boolean;
  }> {
    try {
      const checklists = await this.getPreChecklistsByOpportunity(opportunityId);
      
      const hasChecklist = checklists.length > 0;
      const hasApprovedChecklist = checklists.some(c => c.approved);
      
      // Check if any checklist is complete (no faults)
      const isComplete = checklists.some(checklist => 
        checklist.inspectionItems.every(item => item.status !== 'fault')
      );
      
      return {
        required: true, // Pre-checklist is always required for work orders
        reason: 'Pre-service inspection is mandatory for quality assurance',
        hasChecklist,
        hasApprovedChecklist,
        isComplete
      };
    } catch (error) {
      console.error(`Error checking pre-checklist requirements:`, error);
      throw error;
    }
  }

  async addInspectionItem(id: string, item: InspectionItem): Promise<PreChecklist> {
    try {
      const checklist = await this.getPreChecklistById(id);
      const inspectionItems = [...checklist.inspectionItems, item];
      return await this.updatePreChecklist(id, { inspectionItems });
    } catch (error) {
      console.error(`Error adding inspection item to pre-checklist ${id}:`, error);
      throw error;
    }
  }

  async updateInspectionItem(id: string, itemId: string, updates: Partial<InspectionItem>): Promise<PreChecklist> {
    try {
      const checklist = await this.getPreChecklistById(id);
      
      const inspectionItems = checklist.inspectionItems.map(item => 
        item._id === itemId ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
      );
      
      // Use the updated updatePreChecklist method above
      return await this.updatePreChecklist(id, { inspectionItems });
    } catch (error) {
      console.error(`Error updating inspection item ${itemId} in pre-checklist ${id}:`, error);
      throw error;
    }
  }

  async removeInspectionItem(id: string, itemId: string): Promise<PreChecklist> {
    try {
      const checklist = await this.getPreChecklistById(id);
      const inspectionItems = checklist.inspectionItems.filter(item => item._id !== itemId);
      return await this.updatePreChecklist(id, { inspectionItems });
    } catch (error) {
      console.error(`Error removing inspection item ${itemId} from pre-checklist ${id}:`, error);
      throw error;
    }
  }

  async getPreChecklistStats(): Promise<PreChecklistStats> {
    try {
      const allChecklists = await this.getAllPreChecklists();
      
      const stats: PreChecklistStats = {
        total: allChecklists.length,
        approved: allChecklists.filter(c => c.approved).length,
        pending: allChecklists.filter(c => !c.approved).length,
        withFaults: allChecklists.filter(c => 
          c.inspectionItems && c.inspectionItems.some(item => item.status === 'fault')
        ).length,
        byVehicle: [],
        byInspector: [],
        recentActivity: []
      };

      // Group by vehicle
      const vehicleMap = new Map<string, { count: number; vehicleInfo?: any }>();
      allChecklists.forEach(checklist => {
        const vehicleId = typeof checklist.vehicleId === 'object' 
          ? checklist.vehicleId._id 
          : checklist.vehicleId;
          
        if (!vehicleMap.has(vehicleId)) {
          vehicleMap.set(vehicleId, {
            count: 0,
            vehicleInfo: typeof checklist.vehicleId === 'object' ? {
              make: checklist.vehicleId.make,
              model: checklist.vehicleId.model,
              registrationNumber: checklist.vehicleId.registrationNumber
            } : undefined
          });
        }
        vehicleMap.get(vehicleId)!.count++;
      });
      
      stats.byVehicle = Array.from(vehicleMap.entries()).map(([vehicleId, data]) => ({
        vehicleId,
        vehicleInfo: data.vehicleInfo,
        count: data.count
      }));

      const inspectorMap = new Map<string, { count: number; inspectorInfo?: any }>();
      allChecklists.forEach(checklist => {
        const inspector = checklist.inspectedBy || checklist.createdBy;
        
        // Skip if no inspector
        if (!inspector) return;
        
        let inspectorId = '';
        let inspectorInfo: any = undefined;
        
        if (typeof inspector === 'object') {
          // Use optional chaining and nullish coalescing
          inspectorId = (inspector as any)?._id ?? '';
          inspectorInfo = {
            email: (inspector as any)?.email ?? '',
            firstName: (inspector as any)?.firstName ?? ''
          };
        } else {
          inspectorId = inspector;
        }
        
        if (inspectorId) {
          if (!inspectorMap.has(inspectorId)) {
            inspectorMap.set(inspectorId, {
              count: 0,
              inspectorInfo
            });
          }
          inspectorMap.get(inspectorId)!.count++;
        }
      });
      
      stats.byInspector = Array.from(inspectorMap.entries()).map(([inspectorId, data]) => ({
        inspectorId,
        inspectorInfo: data.inspectorInfo,
        count: data.count
      }));

      // Recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentChecklists = allChecklists.filter(c => 
        c.createdAt && new Date(c.createdAt) >= thirtyDaysAgo
      );
      
      const activityByDate = new Map<string, { count: number; approved: number }>();
      recentChecklists.forEach(checklist => {
        if (!checklist.createdAt) return;
        
        const date = new Date(checklist.createdAt).toISOString().split('T')[0];
        if (!activityByDate.has(date)) {
          activityByDate.set(date, { count: 0, approved: 0 });
        }
        const data = activityByDate.get(date)!;
        data.count++;
        if (checklist.approved) {
          data.approved++;
        }
      });
      
      stats.recentActivity = Array.from(activityByDate.entries())
        .map(([date, data]) => ({
          date,
          count: data.count,
          approved: data.approved
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return stats;
    } catch (error) {
      console.error('Error getting pre-checklist stats:', error);
      throw error;
    }
  }

  private isValidInspector(inspector: any): inspector is string | { _id: string; email?: string; firstName?: string } {
    if (inspector === null || inspector === undefined) {
      return false;
    }
    
    if (typeof inspector === 'string') {
      return inspector.trim().length > 0;
    }
    
    if (typeof inspector === 'object' && inspector !== null) {
      return typeof inspector._id === 'string' && inspector._id.trim().length > 0;
    }
    
    return false;
  }
  

  async searchPreChecklists(searchTerm: string): Promise<PreChecklist[]> {
    try {
      const allChecklists = await this.getAllPreChecklists();
      const searchLower = searchTerm.toLowerCase();
      
      return allChecklists.filter(checklist => {
        // Search in remarks
        if (checklist.remarks?.toLowerCase().includes(searchLower)) {
          return true;
        }
        
        // Search in inspection items
        if (checklist.inspectionItems && checklist.inspectionItems.some(item => 
          item.item.toLowerCase().includes(searchLower) || 
          item.remarks?.toLowerCase().includes(searchLower)
        )) {
          return true;
        }
        
        // Search in vehicle info
        if (typeof checklist.vehicleId === 'object' && checklist.vehicleId) {
          if (
            checklist.vehicleId.registrationNumber?.toLowerCase().includes(searchLower) ||
            checklist.vehicleId.make?.toLowerCase().includes(searchLower) ||
            checklist.vehicleId.model?.toLowerCase().includes(searchLower)
          ) {
            return true;
          }
        }
        
        // Search in opportunity info
        if (typeof checklist.opportunityId === 'object' && checklist.opportunityId) {
          if (
            checklist.opportunityId.subject?.toLowerCase().includes(searchLower) ||
            checklist.opportunityId.customer?.name?.toLowerCase().includes(searchLower) ||
            checklist.opportunityId.customer?.companyName?.toLowerCase().includes(searchLower)
          ) {
            return true;
          }
        }
        
        return false;
      });
    } catch (error) {
      console.error(`Error searching pre-checklists for "${searchTerm}":`, error);
      throw error;
    }
  }

    async getPreChecklistsByInspector(inspectorId: string): Promise<PreChecklist[]> {
      try {
        const allChecklists = await this.getAllPreChecklists();
        return allChecklists.filter(checklist => {
          const inspector = checklist.inspectedBy || checklist.createdBy;
          
          if (!inspector) return false;
          
          const inspectorIdToCompare = typeof inspector === 'object' 
            ? (inspector as any)?._id ?? ''
            : inspector;
          
          return inspectorIdToCompare === inspectorId;
        });
      } catch (error) {
        console.error(`Error getting pre-checklists by inspector ${inspectorId}:`, error);
        throw error;
      }
    }

  async getPreChecklistsByDateRange(startDate: Date, endDate: Date): Promise<PreChecklist[]> {
    try {
      const allChecklists = await this.getAllPreChecklists();
      const start = startDate.getTime();
      const end = endDate.getTime();
      
      return allChecklists.filter(checklist => {
        const checklistDate = new Date(checklist.createdAt).getTime();
        return checklistDate >= start && checklistDate <= end;
      });
    } catch (error) {
      console.error(`Error getting pre-checklists by date range ${startDate.toISOString()} to ${endDate.toISOString()}:`, error);
      throw error;
    }
  }

  async createQuickPreChecklist(
    opportunityId: string, 
    vehicleId: string, 
    userId: string,
    remarks?: string
  ): Promise<PreChecklist> {
    try {
      const defaultItems: InspectionItem[] = [
        { item: 'Exterior Condition', status: 'ok', remarks: 'Visual inspection' },
        { item: 'Interior Condition', status: 'ok', remarks: 'Visual inspection' },
        { item: 'Engine Oil', status: 'n/a', remarks: 'To be checked' },
        { item: 'Brake System', status: 'n/a', remarks: 'To be checked' },
        { item: 'Tire Condition', status: 'n/a', remarks: 'To be checked' },
      ];
      
      const checklistData: CreatePreChecklistDto = {
        opportunityId,
        vehicleId,
        inspectionItems: defaultItems,
        remarks: remarks || 'Quick pre-service inspection',
        approved: false
      };
      
      return await this.createPreChecklist(checklistData, userId);
    } catch (error) {
      console.error('Error creating quick pre-checklist:', error);
      throw error;
    }
  }

  async getFaultSummary(id: string): Promise<{
    totalItems: number;
    okItems: number;
    faultItems: number;
    naItems: number;
    faultDetails: InspectionItem[];
    faultPercentage: number;
  }> {
    try {
      const checklist = await this.getPreChecklistById(id);
      const totalItems = checklist.inspectionItems.length;
      const okItems = checklist.inspectionItems.filter(item => item.status === 'ok').length;
      const faultItems = checklist.inspectionItems.filter(item => item.status === 'fault').length;
      const naItems = checklist.inspectionItems.filter(item => item.status === 'n/a').length;
      const faultDetails = checklist.inspectionItems.filter(item => item.status === 'fault');
      
      return {
        totalItems,
        okItems,
        faultItems,
        naItems,
        faultDetails,
        faultPercentage: totalItems > 0 ? Math.round((faultItems / totalItems) * 100) : 0
      };
    } catch (error) {
      console.error(`Error getting fault summary for pre-checklist ${id}:`, error);
      throw error;
    }
  }

  async exportPreChecklistToPdf(id: string): Promise<string> {
    try {
      const checklist = await this.getPreChecklistById(id);
      
      // Create a simple HTML representation for PDF conversion
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Pre-Service Checklist - ${checklist._id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #333; }
            .subtitle { font-size: 18px; color: #666; margin-top: 5px; }
            .info-section { margin-bottom: 20px; }
            .info-label { font-weight: bold; color: #555; }
            .info-value { margin-left: 10px; }
            .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .table th { background-color: #f5f5f5; padding: 12px; text-align: left; border: 1px solid #ddd; }
            .table td { padding: 10px; border: 1px solid #ddd; }
            .status-ok { color: green; }
            .status-fault { color: red; font-weight: bold; }
            .status-na { color: #999; }
            .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #777; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Pre-Service Inspection Checklist</div>
            <div class="subtitle">ID: ${checklist._id}</div>
          </div>
          
          <div class="info-section">
            <div><span class="info-label">Date:</span> <span class="info-value">${new Date(checklist.createdAt).toLocaleDateString()}</span></div>
            <div><span class="info-label">Status:</span> <span class="info-value">${checklist.approved ? 'Approved' : 'Pending Approval'}</span></div>
            ${checklist.remarks ? `<div><span class="info-label">Remarks:</span> <span class="info-value">${checklist.remarks}</span></div>` : ''}
          </div>
          
          <table class="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${checklist.inspectionItems.map(item => `
                <tr>
                  <td>${item.item}</td>
                  <td class="status-${item.status}">${item.status.toUpperCase()}</td>
                  <td>${item.remarks || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            <p>This is an auto-generated report. Please refer to the original checklist for official records.</p>
          </div>
        </body>
        </html>
      `;
      
      return htmlContent;
    } catch (error) {
      console.error(`Error exporting pre-checklist ${id} to PDF:`, error);
      throw error;
    }
  }

  async clonePreChecklist(id: string, userId: string): Promise<PreChecklist> {
    try {
      const original = await this.getPreChecklistById(id);
      
      const cloneData: CreatePreChecklistDto = {
        opportunityId: typeof original.opportunityId === 'object' 
          ? original.opportunityId._id 
          : original.opportunityId,
        vehicleId: typeof original.vehicleId === 'object' 
          ? original.vehicleId._id 
          : original.vehicleId,
        inspectionItems: original.inspectionItems.map(item => ({
          item: item.item,
          status: item.status,
          remarks: item.remarks
        })),
        remarks: original.remarks ? `${original.remarks} (Cloned)` : 'Cloned checklist',
        approved: false
      };
      
      return await this.createPreChecklist(cloneData, userId);
    } catch (error) {
      console.error(`Error cloning pre-checklist ${id}:`, error);
      throw error;
    }
  }

  async validatePreChecklist(data: CreatePreChecklistDto): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!data.opportunityId?.trim()) {
      errors.push('Opportunity ID is required');
    }

    if (!data.vehicleId?.trim()) {
      errors.push('Vehicle ID is required');
    }

    if (!data.inspectionItems || data.inspectionItems.length === 0) {
      warnings.push('No inspection items specified - checklist will be empty');
    }

    // Inspection items validation
    if (data.inspectionItems) {
      data.inspectionItems.forEach((item, index) => {
        if (!item.item?.trim()) {
          errors.push(`Inspection item ${index + 1}: Item name is required`);
        }
        if (!item.status || !['ok', 'fault', 'n/a'].includes(item.status)) {
          errors.push(`Inspection item ${index + 1}: Invalid status. Must be 'ok', 'fault', or 'n/a'`);
        }
      });
    }

    // Remarks validation
    if (data.remarks && data.remarks.length > 1000) {
      warnings.push('Remarks are very long (over 1000 characters)');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export const preChecklistService = new PreChecklistService();