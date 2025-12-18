import { apiClient } from '@/lib/api/client';

// Keep your Profile interfaces from the original settingsService

export interface Profile {
  id: string;
  userId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  citizenship?: string;
  employeeId: string;
  position: string;
  department: string;
  dateStarted: string;
  contractType: string;
  contractStartDate?: string;
  contractEndDate?: string;
  contractDocumentUrl?: string;
  reportingManager?: string;
  employmentStatus: string;
  personalPhone: string;
  workPhone?: string;
  personalEmail?: string;
  residentialAddress?: string;
  postalAddress?: string;
  county?: string;
  subCounty?: string;
  estate?: string;
  governmentDocuments: any[];
  leaveRecords: any[];
  bankName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  emergencyContacts: any[];
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
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

class ProfileService {
  async getProfiles(): Promise<Profile[]> {
    try {
      return await apiClient.get<Profile[]>('/profiles');
    } catch (error) {
      console.error('Error fetching profiles:', error);
      throw error;
    }
  }

  async getProfileByUserId(userId: string): Promise<Profile> {
    try {
      return await apiClient.get<Profile>(`/profiles/user/${userId}`);
    } catch (error) {
      console.error('Error fetching profile by user ID:', error);
      throw error;
    }
  }

  async createProfile(userId: string, data: any): Promise<Profile> {
    try {
      return await apiClient.post<any, Profile>(`/profiles/${userId}`, data);
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  }

  async getProfile(id: string): Promise<Profile> {
    try {
      return await apiClient.get<Profile>(`/profiles/${id}`);
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  async updateProfile(id: string, data: any): Promise<Profile> {
    try {
      return await apiClient.put<any, Profile>(`/profiles/${id}`, data);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }
}

export const profileService = new ProfileService();