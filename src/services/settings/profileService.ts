import { apiClient } from '@/lib/api/client';

export interface GovernmentDocument {
  type: 'id_card' | 'passport' | 'driving_license' | 'kra_pin' | 'nssf' | 'nhif';
  number: string;
  expiryDate?: string;
  documentUrl?: string;
  active?: boolean;
}

export interface LeaveRecord {
  year: number;
  totalAccrued: number;
  used: number;
  lastUpdated?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
  address?: string;
}

export interface ProfileUser {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  customId?: string;
  role?: string;
}

export interface Profile {
  id: string;
  _id?: string;
  user: ProfileUser | string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: string | Date;
  gender?: 'male' | 'female' | 'other';
  nationality?: string;
  citizenship?: string;
  employeeId: string;
  position: string;
  department: string;
  dateStarted: string | Date;
  contractType?: string;
  contractStartDate?: string | Date;
  contractEndDate?: string | Date;
  contractDocumentUrl?: string;
  reportingManager?: ProfileUser | string;
  employmentStatus?: string;
  personalPhone: string;
  workPhone?: string;
  personalEmail?: string;
  residentialAddress?: string;
  postalAddress?: string;
  county?: string;
  subCounty?: string;
  estate?: string;
  governmentDocuments: GovernmentDocument[];
  leaveRecords: LeaveRecord[];
  totalLeaveAccrued?: number;
  totalLeaveUsed?: number;
  currentLeaveBalance?: number;
  bankName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  emergencyContacts: EmergencyContact[];
  nextOfKinName?: string;
  nextOfKinRelationship?: string;
  nextOfKinPhone?: string;
  nextOfKinAddress?: string;
  maritalStatus?: string;
  spouseName?: string;
  childrenCount?: number;
  skills: string[];
  qualifications: string[];
  certifications: string[];
  languages: string[];
  active?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProfileData {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: string | Date;
  gender?: 'male' | 'female' | 'other';
  nationality?: string;
  citizenship?: string;
  employeeId: string;
  position: string;
  department: string;
  dateStarted: string | Date;
  contractType?: string;
  contractStartDate?: string | Date;
  contractEndDate?: string | Date;
  contractDocumentUrl?: string;
  reportingManager?: string;
  employmentStatus?: string;
  personalPhone: string;
  workPhone?: string;
  personalEmail?: string;
  residentialAddress?: string;
  postalAddress?: string;
  county?: string;
  subCounty?: string;
  estate?: string;
  governmentDocuments?: GovernmentDocument[];
  leaveRecords?: LeaveRecord[];
  bankName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  emergencyContacts?: EmergencyContact[];
  nextOfKinName?: string;
  nextOfKinRelationship?: string;
  nextOfKinPhone?: string;
  nextOfKinAddress?: string;
  maritalStatus?: string;
  spouseName?: string;
  childrenCount?: number;
  skills?: string[];
  qualifications?: string[];
  certifications?: string[];
  languages?: string[];
}

export interface UpdateProfileData extends Partial<CreateProfileData> {}

export interface AddLeaveRecordData {
  year: number;
  accrued: number;
  used: number;
}

export interface AddDocumentData {
  type: 'id_card' | 'passport' | 'driving_license' | 'kra_pin' | 'nssf' | 'nhif';
  number: string;
  expiryDate?: string;
  documentUrl?: string;
  active?: boolean;
}

export interface SearchProfilesParams {
  search?: string;
  department?: string;
  position?: string;
  employmentStatus?: string;
  page?: number;
  limit?: number;
}

class ProfileService {
  /**
   * Create a new profile (Admin/Management only)
   * POST /api/v1/profiles/{userId}
   */
  async createProfile(userId: string, data: CreateProfileData): Promise<Profile> {
    try {
      const response = await apiClient.post<CreateProfileData, any>(`/profiles/${userId}`, data);
      return this.normalizeProfile(response);
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  }

  /**
   * Get all profiles (Admin/Management only)
   * GET /api/v1/profiles
   */
  async getProfiles(): Promise<Profile[]> {
    try {
      const response = await apiClient.get<any[]>('/profiles');
      return response.map(profile => this.normalizeProfile(profile));
    } catch (error) {
      console.error('Error fetching profiles:', error);
      throw error;
    }
  }

  /**
   * Get profile by ID
   * GET /api/v1/profiles/{id}
   */
  async getProfile(id: string): Promise<Profile> {
    try {
      const response = await apiClient.get<any>(`/profiles/${id}`);
      return this.normalizeProfile(response);
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  /**
   * Update profile by ID (Admin/Management or self)
   * PUT /api/v1/profiles/{id}
   */
  async updateProfile(id: string, data: UpdateProfileData): Promise<Profile> {
    try {
      const response = await apiClient.put<UpdateProfileData, any>(`/profiles/${id}`, data);
      return this.normalizeProfile(response);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  /**
   * Delete profile (Admin only)
   * DELETE /api/v1/profiles/{id}
   */
  async deleteProfile(id: string): Promise<{ message: string }> {
    try {
      return await apiClient.delete<{ message: string }>(`/profiles/${id}`);
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw error;
    }
  }

  /**
   * Get profile by user ID
   * GET /api/v1/profiles/user/{userId}
   */
  async getProfileByUserId(userId: string): Promise<Profile> {
    try {
      const response = await apiClient.get<any>(`/profiles/user/${userId}`);
      return this.normalizeProfile(response);
    } catch (error) {
      console.error('Error fetching profile by user ID:', error);
      throw error;
    }
  }

  /**
   * Get my profile
   * GET /api/v1/profiles/me/profile
   */
  async getMyProfile(): Promise<Profile> {
    try {
      const response = await apiClient.get<any>('/profiles/me/profile');
      return this.normalizeProfile(response);
    } catch (error) {
      console.error('Error fetching my profile:', error);
      throw error;
    }
  }

  /**
   * Update my profile
   * PUT /api/v1/profiles/me/update
   */
  async updateMyProfile(data: UpdateProfileData): Promise<Profile> {
    try {
      const response = await apiClient.put<UpdateProfileData, any>('/profiles/me/update', data);
      return this.normalizeProfile(response);
    } catch (error) {
      console.error('Error updating my profile:', error);
      throw error;
    }
  }

  /**
   * Deactivate profile (Admin/Management only)
   * PUT /api/v1/profiles/{id}/deactivate
   */
  async deactivateProfile(id: string): Promise<Profile> {
    try {
      const response = await apiClient.put<any, any>(`/profiles/${id}/deactivate`, {});
      return this.normalizeProfile(response);
    } catch (error) {
      console.error('Error deactivating profile:', error);
      throw error;
    }
  }

  /**
   * Activate profile (Admin/Management only)
   * PUT /api/v1/profiles/{id}/activate
   */
  async activateProfile(id: string): Promise<Profile> {
    try {
      const response = await apiClient.put<any, any>(`/profiles/${id}/activate`, {});
      return this.normalizeProfile(response);
    } catch (error) {
      console.error('Error activating profile:', error);
      throw error;
    }
  }

  /**
   * Add leave record (Admin/Management only)
   * POST /api/v1/profiles/{userId}/leaves
   */
  async addLeaveRecord(userId: string, data: AddLeaveRecordData): Promise<Profile> {
    try {
      const response = await apiClient.post<AddLeaveRecordData, any>(`/profiles/${userId}/leaves`, data);
      return this.normalizeProfile(response);
    } catch (error) {
      console.error('Error adding leave record:', error);
      throw error;
    }
  }

  /**
   * Add government document (Admin/Management only)
   * POST /api/v1/profiles/{userId}/documents
   */
  async addGovernmentDocument(userId: string, data: AddDocumentData): Promise<Profile> {
    try {
      const response = await apiClient.post<AddDocumentData, any>(`/profiles/${userId}/documents`, data);
      return this.normalizeProfile(response);
    } catch (error) {
      console.error('Error adding government document:', error);
      throw error;
    }
  }

  /**
   * Add emergency contact
   * POST /api/v1/profiles/me/emergency-contacts
   */
  async addEmergencyContact(data: EmergencyContact): Promise<Profile> {
    try {
      const response = await apiClient.post<EmergencyContact, any>('/profiles/me/emergency-contacts', data);
      return this.normalizeProfile(response);
    } catch (error) {
      console.error('Error adding emergency contact:', error);
      throw error;
    }
  }

  /**
   * Get profiles by department (Admin/Management only)
   * GET /api/v1/profiles/department/{department}
   */
  async getProfilesByDepartment(department: string): Promise<Profile[]> {
    try {
      const response = await apiClient.get<any[]>(`/profiles/department/${department}`);
      return response.map(profile => this.normalizeProfile(profile));
    } catch (error) {
      console.error('Error fetching profiles by department:', error);
      throw error;
    }
  }

  /**
   * Get profiles by position (Admin/Management only)
   * GET /api/v1/profiles/position/{position}
   */
  async getProfilesByPosition(position: string): Promise<Profile[]> {
    try {
      const response = await apiClient.get<any[]>(`/profiles/position/${position}`);
      return response.map(profile => this.normalizeProfile(profile));
    } catch (error) {
      console.error('Error fetching profiles by position:', error);
      throw error;
    }
  }

  /**
   * Get my team members (For managers)
   * GET /api/v1/profiles/me/team
   */
  async getMyTeam(): Promise<Profile[]> {
    try {
      const response = await apiClient.get<any[]>('/profiles/me/team');
      return response.map(profile => this.normalizeProfile(profile));
    } catch (error) {
      console.error('Error fetching team members:', error);
      throw error;
    }
  }

  /**
   * Search profiles (Admin/Management only)
   * GET /api/v1/profiles/search
   */
  async searchProfiles(params: SearchProfilesParams): Promise<Profile[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.search) queryParams.append('search', params.search);
      if (params.department) queryParams.append('department', params.department);
      if (params.position) queryParams.append('position', params.position);
      if (params.employmentStatus) queryParams.append('employmentStatus', params.employmentStatus);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      
      const url = `/profiles/search${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiClient.get<any[]>(url);
      return response.map(profile => this.normalizeProfile(profile));
    } catch (error) {
      console.error('Error searching profiles:', error);
      throw error;
    }
  }

  /**
   * Get profile by employee ID
   */
  async getProfileByEmployeeId(employeeId: string): Promise<Profile> {
    try {
      const profiles = await this.getProfiles();
      const profile = profiles.find(p => p.employeeId === employeeId);
      if (!profile) {
        throw new Error(`Profile with employee ID ${employeeId} not found`);
      }
      return profile;
    } catch (error) {
      console.error('Error fetching profile by employee ID:', error);
      throw error;
    }
  }

  /**
   * Get active profiles only
   */
  async getActiveProfiles(): Promise<Profile[]> {
    try {
      const profiles = await this.getProfiles();
      return profiles.filter(profile => profile.active === true);
    } catch (error) {
      console.error('Error fetching active profiles:', error);
      throw error;
    }
  }

  /**
   * Normalize profile data from backend
   */
  private normalizeProfile(data: any): Profile {
    return {
      id: data._id || data.id,
      _id: data._id,
      user: data.user,
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      nationality: data.nationality,
      citizenship: data.citizenship,
      employeeId: data.employeeId,
      position: data.position,
      department: data.department,
      dateStarted: data.dateStarted,
      contractType: data.contractType,
      contractStartDate: data.contractStartDate,
      contractEndDate: data.contractEndDate,
      contractDocumentUrl: data.contractDocumentUrl,
      reportingManager: data.reportingManager,
      employmentStatus: data.employmentStatus,
      personalPhone: data.personalPhone,
      workPhone: data.workPhone,
      personalEmail: data.personalEmail,
      residentialAddress: data.residentialAddress,
      postalAddress: data.postalAddress,
      county: data.county,
      subCounty: data.subCounty,
      estate: data.estate,
      governmentDocuments: data.governmentDocuments || [],
      leaveRecords: data.leaveRecords || [],
      totalLeaveAccrued: data.totalLeaveAccrued,
      totalLeaveUsed: data.totalLeaveUsed,
      currentLeaveBalance: data.currentLeaveBalance,
      bankName: data.bankName,
      bankAccountNumber: data.bankAccountNumber,
      bankBranch: data.bankBranch,
      emergencyContacts: data.emergencyContacts || [],
      nextOfKinName: data.nextOfKinName,
      nextOfKinRelationship: data.nextOfKinRelationship,
      nextOfKinPhone: data.nextOfKinPhone,
      nextOfKinAddress: data.nextOfKinAddress,
      maritalStatus: data.maritalStatus,
      spouseName: data.spouseName,
      childrenCount: data.childrenCount,
      skills: data.skills || [],
      qualifications: data.qualifications || [],
      certifications: data.certifications || [],
      languages: data.languages || [],
      active: data.active !== undefined ? data.active : true,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  /**
   * Helper to get full name
   */
  getFullName(profile: Profile): string {
    const parts = [profile.firstName];
    if (profile.middleName) parts.push(profile.middleName);
    parts.push(profile.lastName);
    return parts.join(' ');
  }

  /**
   * Helper to calculate leave balance
   */
  calculateLeaveBalance(profile: Profile): number {
    if (profile.currentLeaveBalance !== undefined) {
      return profile.currentLeaveBalance;
    }
    
    const totalAccrued = profile.leaveRecords.reduce((sum, record) => sum + record.totalAccrued, 0);
    const totalUsed = profile.leaveRecords.reduce((sum, record) => sum + record.used, 0);
    return totalAccrued - totalUsed;
  }
}

export const profileService = new ProfileService();