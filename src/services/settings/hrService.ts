import { apiClient } from '@/lib/api/client';

export interface LeaveAction {
  action: 'approved' | 'denied' | 'pending';
  comments?: string;
  hrUserId?: string;
  date: string;
  leavePeriod?: string;
  days?: number;
}

export interface LeaveBalance {
  employeeId: string;
  name: string;
  department: string;
  position: string;
  email: string;
  leaveRecords: any[];
  pendingActions: LeaveAction[];
  totalLeaveAccrued: number;
  totalLeaveUsed: number;
  currentLeaveBalance: number;
  profileId: string;
}

export interface PerformanceReview {
  reviewDate: string;
  reviewer: string;
  rating: number;
  comments?: string;
  achievements: string[];
  areasForImprovement: string[];
  actionPlan?: string;
  completed: boolean;
}

export interface PerformancePlan {
  id: string;
  _id?: string;
  employee: any;
  employeeProfile?: any;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  goals: string[];
  reviewFrequency: string;
  reviews: PerformanceReview[];
  status: 'draft' | 'active' | 'completed' | 'terminated';
  hrManager: any;
  hrManagerNotes?: string;
  employeeFeedback?: string;
  active: boolean;
  outcome?: 'improved' | 'terminated' | 'transferred' | 'extended' | 'pending';
  completionDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentReport {
  resolutionDate: any;
  id: string;
  _id?: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  involvedEmployees: any[];
  location?: string;
  incidentDate: string;
  reportedDate: string;
  reporter: any;
  investigationNotes?: string;
  correctiveActions: string[];
  category?: 'safety' | 'harassment' | 'misconduct' | 'discrimination' | 'theft' | 'damage' | 'other';
  witnesses: string[];
  evidenceUrls: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyPolicy {
  id: string;
  _id?: string;
  title: string;
  description: string;
  documentUrl: string;
  version: string;
  category: 'hr' | 'finance' | 'operations' | 'safety' | 'it' | 'general' | 'code_of_conduct' | 'leave' | 'attendance';
  effectiveDate: string;
  reviewDate?: string;
  approvedBy: string;
  applicableDepartments: string[];
  applicablePositions: string[];
  active: boolean;
  views: number;
  previousVersion?: string;
  mandatoryAcknowledgement: boolean;
  acknowledgementDeadline?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WelfareProgram {
  id: string;
  _id?: string;
  title: string;
  description: string;
  category: 'health' | 'financial' | 'education' | 'recreational' | 'support' | 'family' | 'wellness' | 'mental_health' | 'fitness';
  startDate: string;
  endDate?: string;
  budget: number;
  coordinator: any;
  eligibleDepartments: string[];
  eligiblePositions: string[];
  participants: any[];
  successMetrics: string[];
  feedback?: string;
  active: boolean;
  utilizedBudget: number;
  location?: string;
  frequency: 'once' | 'monthly' | 'quarterly' | 'annually' | 'ongoing';
  maxParticipants?: number;
  currentParticipants: number;
  registrationDeadline?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecruitmentCandidate {
  id: string;
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  positionApplied: string;
  department: string;
  resumeUrl: string;
  coverLetterUrl?: string;
  status: 'screening' | 'phone_interview' | 'technical_interview' | 'hr_interview' | 'final_interview' | 'background_check' | 'offer_pending' | 'offered' | 'accepted' | 'rejected' | 'withdrawn';
  appliedDate: string;
  source: 'linkedin' | 'website' | 'referral' | 'job_board' | 'agency' | 'campus' | 'social_media' | 'career_fair';
  currentCompany?: string;
  currentPosition?: string;
  expectedSalary?: number;
  noticePeriod?: string;
  skills: string[];
  qualifications: string[];
  yearsOfExperience?: number;
  overallRating?: number;
  recruiterNotes?: string;
  assignedRecruiter?: any;
  offerDetails?: string;
  offerDate?: string;
  acceptanceDate?: string;
  startDate?: string;
  active: boolean;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeContract {
  id: string;
  _id?: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
  contractType?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  employmentStatus?: string;
  contractDocumentUrl?: string;
  probationEndDate?: string;
  onProbation?: boolean;
  user?: any;
  reportingManager?: any;
}

export interface HrDashboardStats {
  totalEmployees: number;
  activePerformancePlans: number;
  openIncidents: number;
  activePolicies: number;
  activeWelfarePrograms: number;
  activeCandidates: number;
  expiringContracts: number;
  lowLeaveBalance: number;
  pendingLeaveRequests: number;
}

export interface HrAlert {
  type: 'danger' | 'warning' | 'info';
  message: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
}

export interface HrDashboard {
  statistics: HrDashboardStats;
  alerts: HrAlert[];
  recentIncidents: IncidentReport[];
  upcomingReviews: PerformancePlan[];
  pendingLeaves: any[];
}

export interface RecruitmentStats {
  total: number;
  screening: number;
  interviewing: number;
  background_check: number;
  offer_pending: number;
  offered: number;
  hired: number;
  rejected: number;
}

export interface RecruitmentPipeline {
  statistics: RecruitmentStats;
  candidates: RecruitmentCandidate[];
}

export interface CreatePerformancePlanData {
  employee: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  goals: string[];
  reviewFrequency?: string;
  reviews?: PerformanceReview[];
  status?: 'draft' | 'active' | 'completed' | 'terminated';
  hrManagerNotes?: string;
}

export interface CreateIncidentReportData {
  title: string;
  description: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  incidentDate: string;
  location?: string;
  involvedEmployees?: string[];
  category?: 'safety' | 'harassment' | 'misconduct' | 'discrimination' | 'theft' | 'damage' | 'other';
  witnesses?: string[];
  correctiveActions?: string[];
}

export interface CreatePolicyData {
  title: string;
  description: string;
  documentUrl: string;
  version?: string;
  category: 'hr' | 'finance' | 'operations' | 'safety' | 'it' | 'general' | 'code_of_conduct' | 'leave' | 'attendance';
  effectiveDate: string;
  approvedBy: string;
  applicableDepartments?: string[];
  applicablePositions?: string[];
  mandatoryAcknowledgement?: boolean;
  acknowledgementDeadline?: string;
}

export interface CreateWelfareProgramData {
  title: string;
  description: string;
  category: 'health' | 'financial' | 'education' | 'recreational' | 'support' | 'family' | 'wellness';
  startDate: string;
  endDate?: string;
  budget: number;
  eligibleDepartments?: string[];
  eligiblePositions?: string[];
  frequency?: string;
  location?: string;
  maxParticipants?: number;
  registrationDeadline?: string;
}

export interface CreateRecruitmentCandidateData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  positionApplied: string;
  department: string;
  resumeUrl: string;
  coverLetterUrl?: string;
  source?: string;
  currentCompany?: string;
  currentPosition?: string;
  expectedSalary?: number;
  noticePeriod?: string;
  skills?: string[];
  qualifications?: string[];
  yearsOfExperience?: number;
}

export interface LeaveActionData {
  action: 'approved' | 'denied';
  comments?: string;
  days?: number;
}

export interface UpdateEmployeeHrInfoData {
  hrNotes?: string;
  lastPerformanceReview?: string;
  nextPerformanceReview?: string;
  probationEndDate?: string;
  onProbation?: boolean;
  employmentStatus?: string;
  currentSalary?: number;
  salaryBand?: string;
  lastPromotionDate?: string;
  disciplinaryActions?: string[];
  yearsOfService?: number;
}

export interface EmployeeHrDetails {
  profile: any;
  hrData: {
    performancePlans: PerformancePlan[];
    incidentReports: IncidentReport[];
    leaveHistory: LeaveAction[];
    disciplinaryActions: string[];
    probationStatus: {
      onProbation: boolean;
      probationEndDate?: string;
    };
    salaryInfo: {
      currentSalary?: number;
      salaryBand?: string;
      lastPromotionDate?: string;
    };
    leaveRequests: any[];
  };
}

export interface EmployeeAsset {
  id: string;
  _id?: string;
  employeeId?: string;
  profileId?: string;
  employeeName?: string;
  assetName: string;
  assetTag?: string;
  assetType?: string;
  serialNumber?: string;
  assignedDate?: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  condition?: string;
  status: 'assigned' | 'returned' | 'maintenance' | string;
  notes?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssignEmployeeAssetData {
  employeeUserId?: string;
  employeeId?: string;
  profileId?: string;
  assetName: string;
  assetTag?: string;
  assetType?: string;
  serialNumber?: string;
  dateTaken?: string;
  assignedDate?: string;
  expectedReturnDate?: string;
  condition?: string;
  notes?: string;
}

export interface UpdateEmployeeAssetData {
  assetName?: string;
  assetTag?: string;
  assetType?: string;
  serialNumber?: string;
  expectedReturnDate?: string;
  condition?: string;
  notes?: string;
  status?: 'assigned' | 'returned' | 'maintenance' | string;
}

export interface ReturnEmployeeAssetData {
  actualReturnDate?: string;
  condition?: string;
  notes?: string;
}

export interface LeaveRequest {
  _id?: string;
  requestId?: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'denied' | 'cancelled';
  submittedDate: string;
  reviewedDate?: string;
  reviewedBy?: any;
  reviewComments?: string;
  supportingDocumentUrl?: string;
  employeeId?: string;
  employeeName?: string;
  department?: string;
  position?: string;
  email?: string;
  profileId?: string;
  userId?: string;
  reportingManager?: any;
  leaveBalance?: number;
  isEmergencyLeave?: boolean;
  emergencyContact?: string;
  contactDuringLeave?: string;
  active: boolean;
}

export interface CreateLeaveRequestDto {
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  supportingDocumentUrl?: string;
  isEmergencyLeave?: boolean;
  emergencyContact?: string;
  contactDuringLeave?: string;
}



class HrService {
  private basePath = '/hr';

  async getDashboard(): Promise<HrDashboard> {
    try {
      const response = await apiClient.get<any>(`${this.basePath}/dashboard`);
      return this.normalizeDashboard(response);
    } catch (error) {
      console.error('Error fetching HR dashboard:', error);
      throw error;
    }
  }

  async submitLeaveRequest(leaveDto: CreateLeaveRequestDto): Promise<{ message: string; requestId: string; days: number; status: string }> {
    try {
      const payload = {
        ...leaveDto,
        startDate: new Date(leaveDto.startDate).toISOString(),
        endDate: new Date(leaveDto.endDate).toISOString(),
      };
      const response = await apiClient.post<CreateLeaveRequestDto, any>(
        `${this.basePath}/leaves/submit`, 
        payload as CreateLeaveRequestDto
      );
      return response;
    } catch (error) {
      console.error('Error submitting leave request:', error);
      throw error;
    }
  }

  async getEmployeeLeaveRequests(status?: string): Promise<LeaveRequest[]> {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      
      const url = `${this.basePath}/leaves/my-requests${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiClient.get<any[]>(url);
      return response.map(item => this.normalizeLeaveRequest(item));
    } catch (error) {
      const maybeStatus = (error as any)?.status;
      if (maybeStatus === 404) {
        return [];
      }
      console.error('Error fetching employee leave requests:', error);
      throw error;
    }
  }

  async getAllLeaveRequests(status?: string, department?: string, startDate?: string, endDate?: string): Promise<LeaveRequest[]> {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (department) params.append('department', department);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const url = `${this.basePath}/leaves${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiClient.get<any[]>(url);
      return response.map(item => this.normalizeLeaveRequest(item));
    } catch (error) {
      console.error('Error fetching all leave requests:', error);
      throw error;
    }
  }

  async handleLeaveAction(profileId: string, requestId: string, data: LeaveActionData): Promise<{ message: string; request: any; newBalance: number; employeeName: string }> {
    try {
      const response = await apiClient.post<LeaveActionData, any>(
        `${this.basePath}/leaves/${profileId}/requests/${requestId}/action`, 
        data
      );
      return response;
    } catch (error) {
      console.error('Error handling leave action:', error);
      throw error;
    }
  }

  async getAllContracts(status?: string): Promise<EmployeeContract[]> {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      
      const url = `${this.basePath}/contracts${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiClient.get<any[]>(url);
      return response.map(contract => this.normalizeContract(contract));
    } catch (error) {
      console.error('Error fetching contracts:', error);
      throw error;
    }
  }

  async createPerformancePlan(employeeId: string, data: CreatePerformancePlanData): Promise<{ message: string; plan: PerformancePlan }> {
    try {
      const payload = {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      };
      const response = await apiClient.post<CreatePerformancePlanData, any>(
        `${this.basePath}/performance-plans/${employeeId}`, 
        payload as CreatePerformancePlanData
      );
      return {
        message: response.message,
        plan: this.normalizePerformancePlan(response.plan)
      };
    } catch (error) {
      console.error('Error creating performance plan:', error);
      throw error;
    }
  }

  async getPerformancePlans(status?: string): Promise<PerformancePlan[]> {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      
      const url = `${this.basePath}/performance-plans${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiClient.get<any[]>(url);
      return response.map(plan => this.normalizePerformancePlan(plan));
    } catch (error) {
      console.error('Error fetching performance plans:', error);
      throw error;
    }
  }

  async createIncidentReport(data: CreateIncidentReportData): Promise<{ message: string; report: IncidentReport }> {
    try {
      const payload = {
        ...data,
        incidentDate: new Date(data.incidentDate).toISOString(),
      };
      const response = await apiClient.post<CreateIncidentReportData, any>(
        `${this.basePath}/incidents`, 
        payload as CreateIncidentReportData
      );
      return {
        message: response.message,
        report: this.normalizeIncidentReport(response.report)
      };
    } catch (error) {
      console.error('Error creating incident report:', error);
      throw error;
    }
  }

  async getIncidentReports(severity?: string, status?: string): Promise<IncidentReport[]> {
    try {
      const params = new URLSearchParams();
      if (severity) params.append('severity', severity);
      if (status) params.append('status', status);
      
      const url = `${this.basePath}/incidents${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiClient.get<any[]>(url);
      return response.map(report => this.normalizeIncidentReport(report));
    } catch (error) {
      console.error('Error fetching incident reports:', error);
      throw error;
    }
  }

  async createPolicy(data: CreatePolicyData): Promise<{ message: string; policy: CompanyPolicy }> {
    try {
      const payload = {
        ...data,
        effectiveDate: new Date(data.effectiveDate).toISOString(),
      };
      const response = await apiClient.post<CreatePolicyData, any>(
        `${this.basePath}/policies`, 
        payload as CreatePolicyData
      );
      return {
        message: response.message,
        policy: this.normalizeCompanyPolicy(response.policy)
      };
    } catch (error) {
      console.error('Error creating policy:', error);
      throw error;
    }
  }

  async getPolicies(category?: string, active?: boolean): Promise<CompanyPolicy[]> {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (active !== undefined) params.append('active', active.toString());
      
      const url = `${this.basePath}/policies${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiClient.get<any[]>(url);
      return response.map(policy => this.normalizeCompanyPolicy(policy));
    } catch (error) {
      console.error('Error fetching policies:', error);
      throw error;
    }
  }

  async createWelfareProgram(data: CreateWelfareProgramData): Promise<{ message: string; program: WelfareProgram }> {
    try {
      const payload = {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
        registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline).toISOString() : undefined,
      };
      const response = await apiClient.post<CreateWelfareProgramData, any>(
        `${this.basePath}/welfare`, 
        payload as CreateWelfareProgramData
      );
      return {
        message: response.message,
        program: this.normalizeWelfareProgram(response.program)
      };
    } catch (error) {
      console.error('Error creating welfare program:', error);
      throw error;
    }
  }

  async getWelfarePrograms(active?: boolean): Promise<WelfareProgram[]> {
    try {
      const params = new URLSearchParams();
      if (active !== undefined) params.append('active', active.toString());
      
      const url = `${this.basePath}/welfare${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiClient.get<any[]>(url);
      return response.map(program => this.normalizeWelfareProgram(program));
    } catch (error) {
      console.error('Error fetching welfare programs:', error);
      throw error;
    }
  }

  async createRecruitmentCandidate(data: CreateRecruitmentCandidateData): Promise<{ message: string; candidate: RecruitmentCandidate }> {
    try {
      const response = await apiClient.post<CreateRecruitmentCandidateData, any>(
        `${this.basePath}/recruitment`, 
        data
      );
      return {
        message: response.message,
        candidate: this.normalizeRecruitmentCandidate(response.candidate)
      };
    } catch (error) {
      console.error('Error adding recruitment candidate:', error);
      throw error;
    }
  }

  async getRecruitmentPipeline(status?: string): Promise<RecruitmentPipeline> {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      
      const url = `${this.basePath}/recruitment${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiClient.get<any>(url);
      return {
        statistics: response.statistics || {
          total: 0,
          screening: 0,
          interviewing: 0,
          background_check: 0,
          offer_pending: 0,
          offered: 0,
          hired: 0,
          rejected: 0,
        },
        candidates: response.candidates?.map((candidate: any) => this.normalizeRecruitmentCandidate(candidate)) || []
      };
    } catch (error) {
      console.error('Error fetching recruitment pipeline:', error);
      throw error;
    }
  }

  async getLeaveBalances(department?: string): Promise<LeaveBalance[]> {
    try {
      const params = new URLSearchParams();
      if (department) params.append('department', department);
      
      const url = `${this.basePath}/leave-balances${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiClient.get<any[]>(url);
      return response.map(balance => this.normalizeLeaveBalance(balance));
    } catch (error) {
      console.error('Error fetching leave balances:', error);
      throw error;
    }
  }

  async assignAsset(data: AssignEmployeeAssetData): Promise<{ message: string; asset: EmployeeAsset }> {
    try {
      const payload = {
        ...data,
        employeeUserId: data.employeeUserId || data.employeeId,
        dateTaken: data.dateTaken || data.assignedDate || new Date().toISOString(),
      };
      const response = await apiClient.post<AssignEmployeeAssetData, any>(
        `${this.basePath}/assets`,
        payload
      );
      return {
        message: response?.message || 'Asset assigned successfully',
        asset: this.normalizeEmployeeAsset(response?.asset || response?.data || response),
      };
    } catch (error) {
      console.error('Error assigning asset:', error);
      throw error;
    }
  }

  async getAssets(status?: string, employeeId?: string): Promise<EmployeeAsset[]> {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (employeeId) params.append('employeeId', employeeId);

      const url = `${this.basePath}/assets${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiClient.get<any>(url);
      const items = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.assets)
            ? response.assets
            : [];
      return items.map((asset: any) => this.normalizeEmployeeAsset(asset));
    } catch (error) {
      console.error('Error fetching assets:', error);
      throw error;
    }
  }

  async getEmployeeAssets(employeeId: string): Promise<EmployeeAsset[]> {
    try {
      const response = await apiClient.get<any>(`${this.basePath}/employees/${employeeId}/assets`);
      const items = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.assets)
            ? response.assets
            : [];
      return items.map((asset: any) => this.normalizeEmployeeAsset(asset));
    } catch (error) {
      console.error(`Error fetching assets for employee ${employeeId}:`, error);
      throw error;
    }
  }

  async updateAsset(assetId: string, data: UpdateEmployeeAssetData): Promise<{ message: string; asset: EmployeeAsset }> {
    try {
      const response = await apiClient.put<UpdateEmployeeAssetData, any>(
        `${this.basePath}/assets/${assetId}`,
        data
      );
      return {
        message: response?.message || 'Asset updated successfully',
        asset: this.normalizeEmployeeAsset(response?.asset || response?.data || response),
      };
    } catch (error) {
      console.error(`Error updating asset ${assetId}:`, error);
      throw error;
    }
  }

  async returnAsset(assetId: string, data: ReturnEmployeeAssetData = {}): Promise<{ message: string; asset: EmployeeAsset }> {
    try {
      const response = await apiClient.patch<ReturnEmployeeAssetData, any>(
        `${this.basePath}/assets/${assetId}/return`,
        data
      );
      return {
        message: response?.message || 'Asset returned successfully',
        asset: this.normalizeEmployeeAsset(response?.asset || response?.data || response),
      };
    } catch (error) {
      console.error(`Error returning asset ${assetId}:`, error);
      throw error;
    }
  }

  async getEmployeeDetails(employeeId: string): Promise<EmployeeHrDetails> {
    try {
      const response = await apiClient.get<any>(`${this.basePath}/employees/${employeeId}`);
      return this.normalizeEmployeeHrDetails(response);
    } catch (error) {
      console.error('Error fetching employee HR details:', error);
      throw error;
    }
  }

  async updateEmployeeHrInfo(profileId: string, data: UpdateEmployeeHrInfoData): Promise<{ message: string; profile: any }> {
    try {
      const response = await apiClient.put<UpdateEmployeeHrInfoData, any>(
        `${this.basePath}/employees/${profileId}/hr-info`, 
        data
      );
      return response;
    } catch (error) {
      console.error('Error updating employee HR info:', error);
      throw error;
    }
  }

  async getHrAlerts(): Promise<HrAlert[]> {
    try {
      const response = await apiClient.get<any[]>(`${this.basePath}/alerts`);
      return response.map(alert => this.normalizeHrAlert(alert));
    } catch (error) {
      console.error('Error fetching HR alerts:', error);
      throw error;
    }
  }

  async getAttendanceSummary(startDate?: string, endDate?: string): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const url = `${this.basePath}/attendance${params.toString() ? `?${params.toString()}` : ''}`;
      return await apiClient.get<any>(url);
    } catch (error) {
      console.error('Error fetching attendance summary:', error);
      throw error;
    }
  }

  // Utility Methods
  getContractStatus(contract: EmployeeContract): 'active' | 'expiring_soon' | 'expired' | 'unknown' {
    if (!contract.contractEndDate) return 'unknown';
    
    const today = new Date();
    const endDate = new Date(contract.contractEndDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    if (endDate < today) return 'expired';
    if (endDate <= thirtyDaysFromNow) return 'expiring_soon';
    return 'active';
  }

  formatDate(dateString?: string, format: 'short' | 'long' = 'short'): string {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (format === 'short') {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }

  getDaysUntilExpiry(endDate?: string): number | null {
    if (!endDate) return null;
    
    const today = new Date();
    const expiryDate = new Date(endDate);
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getRatingColor(rating: number): string {
    if (rating >= 4) return 'bg-green-100 text-green-800';
    if (rating >= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }

  getRatingIcon(rating: number): string {
    if (rating >= 4) return 'Excellent';
    if (rating >= 3) return 'Good';
    if (rating >= 2) return 'Fair';
    return 'Poor';
  }

  getCandidateStatusColor(status: string): string {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'offered': return 'bg-blue-100 text-blue-800';
      case 'interviewing': 
      case 'phone_interview': 
      case 'technical_interview': 
      case 'hr_interview': 
      case 'final_interview':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getAlertPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getWelfareIcon(category: string): string {
    switch (category) {
      case 'health': return '🩺';
      case 'financial': return '💰';
      case 'education': return '🎓';
      case 'recreational': return '🎯';
      case 'wellness': return '🧘';
      case 'fitness': return '💪';
      case 'family': return '🏠';
      case 'support': return '🤝';
      case 'mental_health': return '🧠';
      default: return '❤️';
    }
  }

  filterContractsByStatus(contracts: EmployeeContract[], status: 'active' | 'expiring_soon' | 'expired'): EmployeeContract[] {
    return contracts.filter(contract => this.getContractStatus(contract) === status);
  }

  sortContractsByExpiry(contracts: EmployeeContract[], ascending: boolean = true): EmployeeContract[] {
    return [...contracts].sort((a, b) => {
      if (!a.contractEndDate) return 1;
      if (!b.contractEndDate) return -1;
      
      const dateA = new Date(a.contractEndDate).getTime();
      const dateB = new Date(b.contractEndDate).getTime();
      
      return ascending ? dateA - dateB : dateB - dateA;
    });
  }

  calculateTotalLeaveDays(leaveBalance: LeaveBalance): {
    accrued: number;
    used: number;
    remaining: number;
    pending: number;
  } {
    const pendingDays = leaveBalance.pendingActions.reduce((sum, action) => {
      return action.action === 'pending' ? sum + (action.days || 0) : sum;
    }, 0);
    
    return {
      accrued: leaveBalance.totalLeaveAccrued,
      used: leaveBalance.totalLeaveUsed,
      remaining: leaveBalance.currentLeaveBalance,
      pending: pendingDays,
    };
  }

  // Normalization Methods
  private normalizeDashboard(data: any): HrDashboard {
    return {
      statistics: data.statistics,
      alerts: data.alerts?.map((alert: any) => this.normalizeHrAlert(alert)) || [],
      recentIncidents: data.recentIncidents?.map((incident: any) => this.normalizeIncidentReport(incident)) || [],
      upcomingReviews: data.upcomingReviews?.map((review: any) => this.normalizePerformancePlan(review)) || [],
      pendingLeaves: data.pendingLeaves || [],
    };
  }

  private normalizeLeaveRequest(data: any): LeaveRequest {
    return {
      _id: data._id || data.id,
      requestId: data.requestId || data._id || data.id,
      leaveType: data.leaveType,
      startDate: data.startDate,
      endDate: data.endDate,
      days: data.days,
      reason: data.reason,
      status: data.status,
      submittedDate: data.submittedDate,
      reviewedDate: data.reviewedDate,
      reviewedBy: data.reviewedBy,
      reviewComments: data.reviewComments,
      supportingDocumentUrl: data.supportingDocumentUrl,
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      department: data.department,
      position: data.position,
      email: data.email,
      profileId: data.profileId,
      userId: data.userId,
      reportingManager: data.reportingManager,
      leaveBalance: data.leaveBalance,
      isEmergencyLeave: data.isEmergencyLeave,
      emergencyContact: data.emergencyContact,
      contactDuringLeave: data.contactDuringLeave,
      active: data.active !== undefined ? data.active : true,
    };
  }

  private normalizeContract(data: any): EmployeeContract {
    return {
      id: data._id || data.id,
      _id: data._id,
      employeeId: data.employeeId,
      firstName: data.firstName,
      lastName: data.lastName,
      department: data.department,
      position: data.position,
      contractType: data.contractType,
      contractStartDate: data.contractStartDate,
      contractEndDate: data.contractEndDate,
      employmentStatus: data.employmentStatus,
      contractDocumentUrl: data.contractDocumentUrl,
      probationEndDate: data.probationEndDate,
      onProbation: data.onProbation,
      user: data.user,
      reportingManager: data.reportingManager,
    };
  }

  private normalizePerformancePlan(data: any): PerformancePlan {
    return {
      id: data._id || data.id,
      _id: data._id,
      employee: data.employee,
      employeeProfile: data.employeeProfile,
      title: data.title,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      goals: data.goals || [],
      reviewFrequency: data.reviewFrequency,
      reviews: data.reviews?.map((review: any) => this.normalizePerformanceReview(review)) || [],
      status: data.status,
      hrManager: data.hrManager,
      hrManagerNotes: data.hrManagerNotes,
      employeeFeedback: data.employeeFeedback,
      active: data.active !== undefined ? data.active : true,
      outcome: data.outcome,
      completionDate: data.completionDate,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  private normalizePerformanceReview(data: any): PerformanceReview {
    return {
      reviewDate: data.reviewDate,
      reviewer: data.reviewer,
      rating: data.rating,
      comments: data.comments,
      achievements: data.achievements || [],
      areasForImprovement: data.areasForImprovement || [],
      actionPlan: data.actionPlan,
      completed: data.completed || false,
    };
  }

 private normalizeIncidentReport(data: any): IncidentReport {
  return {
    id: data._id || data.id,
    _id: data._id,
    title: data.title,
    description: data.description,
    severity: data.severity,
    status: data.status,
    involvedEmployees: data.involvedEmployees || [],
    location: data.location,
    incidentDate: data.incidentDate,
    reportedDate: data.reportedDate,
    reporter: data.reporter,
    investigationNotes: data.investigationNotes,
    correctiveActions: data.correctiveActions || [],
    category: data.category,
    witnesses: data.witnesses || [],
    evidenceUrls: data.evidenceUrls || [],
    active: data.active !== undefined ? data.active : true,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    resolutionDate: data.resolutionDate || null,
  };
}

  private normalizeCompanyPolicy(data: any): CompanyPolicy {
    return {
      id: data._id || data.id,
      _id: data._id,
      title: data.title,
      description: data.description,
      documentUrl: data.documentUrl,
      version: data.version,
      category: data.category,
      effectiveDate: data.effectiveDate,
      reviewDate: data.reviewDate,
      approvedBy: data.approvedBy,
      applicableDepartments: data.applicableDepartments || [],
      applicablePositions: data.applicablePositions || [],
      active: data.active !== undefined ? data.active : true,
      views: data.views || 0,
      previousVersion: data.previousVersion,
      mandatoryAcknowledgement: data.mandatoryAcknowledgement || false,
      acknowledgementDeadline: data.acknowledgementDeadline,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  private normalizeWelfareProgram(data: any): WelfareProgram {
    return {
      id: data._id || data.id,
      _id: data._id,
      title: data.title,
      description: data.description,
      category: data.category,
      startDate: data.startDate,
      endDate: data.endDate,
      budget: data.budget,
      coordinator: data.coordinator,
      eligibleDepartments: data.eligibleDepartments || [],
      eligiblePositions: data.eligiblePositions || [],
      participants: data.participants || [],
      successMetrics: data.successMetrics || [],
      feedback: data.feedback,
      active: data.active !== undefined ? data.active : true,
      utilizedBudget: data.utilizedBudget || 0,
      location: data.location,
      frequency: data.frequency || 'once',
      maxParticipants: data.maxParticipants,
      currentParticipants: data.currentParticipants || 0,
      registrationDeadline: data.registrationDeadline,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  private normalizeRecruitmentCandidate(data: any): RecruitmentCandidate {
    return {
      id: data._id || data.id,
      _id: data._id,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      positionApplied: data.positionApplied,
      department: data.department,
      resumeUrl: data.resumeUrl,
      coverLetterUrl: data.coverLetterUrl,
      status: data.status,
      appliedDate: data.appliedDate,
      source: data.source,
      currentCompany: data.currentCompany,
      currentPosition: data.currentPosition,
      expectedSalary: data.expectedSalary,
      noticePeriod: data.noticePeriod,
      skills: data.skills || [],
      qualifications: data.qualifications || [],
      yearsOfExperience: data.yearsOfExperience,
      overallRating: data.overallRating,
      recruiterNotes: data.recruiterNotes,
      assignedRecruiter: data.assignedRecruiter,
      offerDetails: data.offerDetails,
      offerDate: data.offerDate,
      acceptanceDate: data.acceptanceDate,
      startDate: data.startDate,
      active: data.active !== undefined ? data.active : true,
      rejectionReason: data.rejectionReason,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  private normalizeLeaveBalance(data: any): LeaveBalance {
    return {
      employeeId: data.employeeId,
      name: data.name,
      department: data.department,
      position: data.position,
      email: data.email,
      leaveRecords: data.leaveRecords || [],
      pendingActions: data.pendingActions?.map((action: any) => this.normalizeLeaveAction(action)) || [],
      totalLeaveAccrued: data.totalLeaveAccrued || 0,
      totalLeaveUsed: data.totalLeaveUsed || 0,
      currentLeaveBalance: data.currentLeaveBalance || 0,
      profileId: data.profileId,
    };
  }

  private normalizeLeaveAction(data: any): LeaveAction {
    return {
      action: data.action,
      comments: data.comments,
      hrUserId: data.hrUserId,
      date: data.date,
      leavePeriod: data.leavePeriod,
      days: data.days,
    };
  }

  private normalizeEmployeeHrDetails(data: any): EmployeeHrDetails {
    return {
      profile: data.profile,
      hrData: {
        performancePlans: data.hrData?.performancePlans?.map((plan: any) => this.normalizePerformancePlan(plan)) || [],
        incidentReports: data.hrData?.incidentReports?.map((report: any) => this.normalizeIncidentReport(report)) || [],
        leaveHistory: data.hrData?.leaveHistory?.map((action: any) => this.normalizeLeaveAction(action)) || [],
        disciplinaryActions: data.hrData?.disciplinaryActions || [],
        probationStatus: {
          onProbation: data.hrData?.probationStatus?.onProbation || false,
          probationEndDate: data.hrData?.probationStatus?.probationEndDate,
        },
        salaryInfo: {
          currentSalary: data.hrData?.salaryInfo?.currentSalary,
          salaryBand: data.hrData?.salaryInfo?.salaryBand,
          lastPromotionDate: data.hrData?.salaryInfo?.lastPromotionDate,
        },
        leaveRequests: data.hrData?.leaveRequests || [],
      },
    };
  }

  private normalizeHrAlert(data: any): HrAlert {
    return {
      type: data.type,
      message: data.message,
      priority: data.priority,
      action: data.action,
    };
  }

  private normalizeEmployeeAsset(data: any): EmployeeAsset {
    return {
      id: data?._id || data?.id,
      _id: data?._id,
      employeeId: data?.employeeId,
      profileId: data?.profileId,
      employeeName: data?.employeeName || data?.employee?.name,
      assetName: data?.assetName || data?.name || 'Unknown Asset',
      assetTag: data?.assetTag,
      assetType: data?.assetType || data?.type,
      serialNumber: data?.serialNumber,
      assignedDate: data?.assignedDate,
      expectedReturnDate: data?.expectedReturnDate,
      actualReturnDate: data?.actualReturnDate,
      condition: data?.condition,
      status: data?.status || 'assigned',
      notes: data?.notes,
      active: data?.active !== undefined ? data.active : true,
      createdAt: data?.createdAt,
      updatedAt: data?.updatedAt,
    };
  }

  // Static helper methods for compatibility
  static getContractStatus(contract: EmployeeContract): 'active' | 'expiring_soon' | 'expired' | 'unknown' {
    const service = new HrService();
    return service.getContractStatus(contract);
  }

  static getDaysUntilExpiry(endDate?: string): number | null {
    const service = new HrService();
    return service.getDaysUntilExpiry(endDate);
  }

  static formatDate(dateString?: string): string {
    const service = new HrService();
    return service.formatDate(dateString);
  }
}

export const hrService = new HrService();
