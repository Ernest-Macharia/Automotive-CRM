import { apiClient } from '@/lib/api/client';

// User Management Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  active: boolean;
  canViewSummary?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserData {
  name?: string;
  email: string;
  password?: string;
  role: string;
  permissions?: string[];
  active?: boolean;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  roleName?: string;
  permissions?: string[];
  active?: boolean;
  canViewSummary?: boolean;
}

// Role Management Types
export interface Role {
  id: string;
  _id: string;
  name: string;
  display_name: string;
  category: string;
  permissions: string[];
  description?: string;
  isDefault?: boolean;
}

export interface AssignRoleData {
  userId: string;
  roleId: string;
  permissions?: string[];
}

// Blueprint Types
export interface BlueprintStage {
  id?: string;
  name: string;
  order: number;
  allowedRoles: string[];
  entryActions: BlueprintAction[];
  exitActions: BlueprintAction[];
}

export interface BlueprintAction {
  actionType: string;
  params: Record<string, any>;
  id?: string;
}

export interface Blueprint {
  id: string;
  name: string;
  module: string;
  stages: BlueprintStage[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  description?: string;
}

export interface CreateBlueprintData {
  name: string;
  module: string;
  stages: Omit<BlueprintStage, 'id'>[];
  description?: string;
  isActive?: boolean;
}

// Workflow Types
export interface WorkflowCondition {
  field: string;
  operator: string;
  value: any;
}

export interface WorkflowAction {
  actionType: string;
  params: Record<string, any>;
  id?: string;
}

export interface Workflow {
  id: string;
  name: string;
  module: string;
  triggerEvent: string;
  conditions: Record<string, any> | WorkflowCondition[];
  actions: WorkflowAction[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  description?: string;
}

export interface CreateWorkflowData {
  name: string;
  module: string;
  triggerEvent: string;
  conditions: Record<string, any> | WorkflowCondition[];
  actions: Omit<WorkflowAction, 'id'>[];
  description?: string;
  isActive?: boolean;
}

// Profile Types
export interface GovernmentDocument {
  type: string;
  number: string;
  expiryDate: string;
  documentUrl: string;
  active: boolean;
}

export interface LeaveRecord {
  year: number;
  totalAccrued: number;
  used: number;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
  email: string;
  address: string;
}

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
  governmentDocuments: GovernmentDocument[];
  leaveRecords: LeaveRecord[];
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
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProfileData {
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

class SettingsService {
  async getSettingsSummary(): Promise<any> {
    try {
      return await apiClient.get<any>('/settings/summary');
    } catch (error) {
      console.error('Error fetching settings summary:', error);
      throw error;
    }
  }

  async getValidationRules(module: string): Promise<any> {
    try {
      return await apiClient.get<any>(`/settings/validation-rules/${module}`);
    } catch (error) {
      console.error(`Error fetching validation rules for module ${module}:`, error);
      throw error;
    }
  }

  async updateValidationRules(module: string, data: Record<string, any>): Promise<any> {
    try {
      return await apiClient.patch<Record<string, any>, any>(`/settings/validation-rules/${module}`, data);
    } catch (error) {
      console.error(`Error updating validation rules for module ${module}:`, error);
      throw error;
    }
  }

  // User Management Methods
  async getUsers(): Promise<User[]> {
    try {
      return await apiClient.get<User[]>('/users');
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async getUser(id: string): Promise<User> {
    try {
      // If you have a specific endpoint for single user, use it
      const users = await this.getUsers();
      const user = users.find(u => u.id === id);
      if (!user) throw new Error('User not found');
      return user;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  async createUser(data: CreateUserData): Promise<User> {
    try {
      return await apiClient.post<CreateUserData, User>('/users', data);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async registerUser(data: CreateUserData): Promise<User> {
    try {
      return await apiClient.post<CreateUserData, User>('/users/register', data);
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }

  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    try {
      // Note: You need to add this endpoint to your API
      // For now, I'll create a simulated endpoint path
      return await apiClient.patch<UpdateUserData, User>(
        `/users/${id}`,
        data
      );
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    try {
      // Note: You need to add this endpoint to your API
      return await apiClient.delete<{ message: string }>(`/users/${id}`);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async updateUserSummaryAccess(id: string, canViewSummary: boolean): Promise<User> {
    try {
      return await apiClient.patch<{ canViewSummary: boolean }, User>(
        `/users/${id}/summary-access`,
        { canViewSummary }
      );
    } catch (error) {
      console.error('Error updating user summary access:', error);
      throw error;
    }
  }

  async activateUser(id: string): Promise<User> {
    try {
      return await this.updateUser(id, { active: true });
    } catch (error) {
      console.error('Error activating user:', error);
      throw error;
    }
  }

  async deactivateUser(id: string): Promise<User> {
    try {
      return await this.updateUser(id, { active: false });
    } catch (error) {
      console.error('Error deactivating user:', error);
      throw error;
    }
  }

  // Role Management Methods
  async getRoles(): Promise<Role[]> {
    try {
      return await apiClient.get<Role[]>('/roles');
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  }

  async seedDefaultRoles(): Promise<{ message: string }> {
    try {
        return await apiClient.post<any, { message: string }>('/roles/seed', {});
    } catch (error) {
        console.error('Error seeding default roles:', error);
        throw error;
    }
  }

  async assignRole(data: AssignRoleData): Promise<{ message: string }> {
    try {
      return await apiClient.post<AssignRoleData, { message: string }>('/roles/assign', data);
    } catch (error) {
      console.error('Error assigning role:', error);
      throw error;
    }
  }

  // Blueprint Methods
  async getBlueprints(): Promise<Blueprint[]> {
    try {
      return await apiClient.get<Blueprint[]>('/blueprints');
    } catch (error) {
      console.error('Error fetching blueprints:', error);
      throw error;
    }
  }

  async getBlueprint(id: string): Promise<Blueprint> {
    try {
      return await apiClient.get<Blueprint>(`/blueprints/${id}`);
    } catch (error) {
      console.error('Error fetching blueprint:', error);
      throw error;
    }
  }

  async createBlueprint(data: CreateBlueprintData): Promise<Blueprint> {
    try {
      return await apiClient.post<CreateBlueprintData, Blueprint>('/blueprints', data);
    } catch (error) {
      console.error('Error creating blueprint:', error);
      throw error;
    }
  }

  async updateBlueprint(id: string, data: Partial<CreateBlueprintData>): Promise<Blueprint> {
    try {
      return await apiClient.patch<Partial<CreateBlueprintData>, Blueprint>(
        `/blueprints/${id}`,
        data
      );
    } catch (error) {
      console.error('Error updating blueprint:', error);
      throw error;
    }
  }

  async deleteBlueprint(id: string): Promise<{ message: string }> {
    try {
      return await apiClient.delete<{ message: string }>(`/blueprints/${id}`);
    } catch (error) {
      console.error('Error deleting blueprint:', error);
      throw error;
    }
  }

  async testBlueprintAutomation(data: any): Promise<any> {
    try {
      return await apiClient.post<any, any>('/blueprints/test/automation', data);
    } catch (error) {
      console.error('Error testing blueprint automation:', error);
      throw error;
    }
  }

  // Workflow Methods
  async getWorkflows(): Promise<Workflow[]> {
    try {
      return await apiClient.get<Workflow[]>('/workflows');
    } catch (error) {
      console.error('Error fetching workflows:', error);
      throw error;
    }
  }

  async getWorkflow(id: string): Promise<Workflow> {
    try {
      return await apiClient.get<Workflow>(`/workflows/${id}`);
    } catch (error) {
      console.error('Error fetching workflow:', error);
      throw error;
    }
  }

  async createWorkflow(data: CreateWorkflowData): Promise<Workflow> {
    try {
      return await apiClient.post<CreateWorkflowData, Workflow>('/workflows', data);
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }
  }

  async updateWorkflow(id: string, data: Partial<CreateWorkflowData>): Promise<Workflow> {
    try {
      return await apiClient.patch<Partial<CreateWorkflowData>, Workflow>(
        `/workflows/${id}`,
        data
      );
    } catch (error) {
      console.error('Error updating workflow:', error);
      throw error;
    }
  }

  async deleteWorkflow(id: string): Promise<{ message: string }> {
    try {
      return await apiClient.delete<{ message: string }>(`/workflows/${id}`);
    } catch (error) {
      console.error('Error deleting workflow:', error);
      throw error;
    }
  }

  async testWorkflowAutomation(): Promise<any> {
    try {
        return await apiClient.post<any, any>('/workflows/test/automation', {});
    } catch (error) {
        console.error('Error testing workflow automation:', error);
        throw error;
    }
  }

  // Profile Methods
  async getProfiles(): Promise<Profile[]> {
    try {
      return await apiClient.get<Profile[]>('/profiles');
    } catch (error) {
      console.error('Error fetching profiles:', error);
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

  async getProfileByUserId(userId: string): Promise<Profile> {
    try {
      return await apiClient.get<Profile>(`/profiles/user/${userId}`);
    } catch (error) {
      console.error('Error fetching profile by user ID:', error);
      throw error;
    }
  }

  async getMyProfile(): Promise<Profile> {
    try {
      return await apiClient.get<Profile>('/profiles/me/profile');
    } catch (error) {
      console.error('Error fetching my profile:', error);
      throw error;
    }
  }

  async createProfile(userId: string, data: Omit<CreateProfileData, 'userId'>): Promise<Profile> {
    try {
      return await apiClient.post<Omit<CreateProfileData, 'userId'>, Profile>(
        `/profiles/${userId}`,
        data
      );
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  }

  async updateProfile(id: string, data: Partial<CreateProfileData>): Promise<Profile> {
    try {
      return await apiClient.put<Partial<CreateProfileData>, Profile>(
        `/profiles/${id}`,
        data
      );
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  async updateMyProfile(data: Partial<CreateProfileData>): Promise<Profile> {
    try {
      return await apiClient.put<Partial<CreateProfileData>, Profile>(
        '/profiles/me/update',
        data
      );
    } catch (error) {
      console.error('Error updating my profile:', error);
      throw error;
    }
  }

  async deleteProfile(id: string): Promise<{ message: string }> {
    try {
      return await apiClient.delete<{ message: string }>(`/profiles/${id}`);
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw error;
    }
  }

  async activateProfile(id: string): Promise<Profile> {
  try {
    return await apiClient.put<any, Profile>(`/profiles/${id}/activate`, {});
  } catch (error) {
    console.error('Error activating profile:', error);
    throw error;
  }
}

async deactivateProfile(id: string): Promise<Profile> {
  try {
    return await apiClient.put<any, Profile>(`/profiles/${id}/deactivate`, {});
  } catch (error) {
    console.error('Error deactivating profile:', error);
    throw error;
  }
}

  async addEmergencyContact(
    data: Omit<EmergencyContact, 'id'>
  ): Promise<{ message: string }> {
    try {
      return await apiClient.post<Omit<EmergencyContact, 'id'>, { message: string }>(
        '/profiles/me/emergency-contacts',
        data
      );
    } catch (error) {
      console.error('Error adding emergency contact:', error);
      throw error;
    }
  }

  async getProfilesByDepartment(department: string): Promise<Profile[]> {
    try {
      return await apiClient.get<Profile[]>(`/profiles/department/${department}`);
    } catch (error) {
      console.error('Error fetching profiles by department:', error);
      throw error;
    }
  }

  async searchProfiles(query: string): Promise<Profile[]> {
    try {
      const params = new URLSearchParams({ q: query });
      return await apiClient.get<Profile[]>(`/profiles/search?${params}`);
    } catch (error) {
      console.error('Error searching profiles:', error);
      throw error;
    }
  }

  async getMyTeam(): Promise<Profile[]> {
    try {
      return await apiClient.get<Profile[]>('/profiles/me/team');
    } catch (error) {
      console.error('Error fetching team members:', error);
      throw error;
    }
  }

  // Helper Methods
  async getAvailableModules(): Promise<string[]> {
    // This would typically come from your backend
    return ['leads', 'opportunities', 'quotes', 'customers', 'jobs', 'inventory'];
  }

  async getAvailableActions(): Promise<Array<{ value: string; label: string }>> {
    return [
      { value: 'sendEmail', label: 'Send Email' },
      { value: 'createTask', label: 'Create Task' },
      { value: 'sendNotification', label: 'Send Notification' },
      { value: 'updateRecord', label: 'Update Record' },
      { value: 'assignToUser', label: 'Assign to User' },
      { value: 'changeStatus', label: 'Change Status' },
    ];
  }

  async getAvailableRoles(): Promise<Role[]> {
    return await this.getRoles();
  }

  async getPermissionOptions(): Promise<Array<{ value: string; label: string }>> {
    // Grouped permissions
    return [
      { value: 'leads.create', label: 'Create Leads' },
      { value: 'leads.read', label: 'View Leads' },
      { value: 'leads.update', label: 'Edit Leads' },
      { value: 'leads.delete', label: 'Delete Leads' },
      { value: 'opportunities.create', label: 'Create Opportunities' },
      { value: 'opportunities.read', label: 'View Opportunities' },
      { value: 'opportunities.update', label: 'Edit Opportunities' },
      { value: 'opportunities.delete', label: 'Delete Opportunities' },
      { value: 'quotes.create', label: 'Create Quotes' },
      { value: 'quotes.read', label: 'View Quotes' },
      { value: 'quotes.update', label: 'Edit Quotes' },
      { value: 'quotes.delete', label: 'Delete Quotes' },
      { value: 'customers.create', label: 'Create Customers' },
      { value: 'customers.read', label: 'View Customers' },
      { value: 'customers.update', label: 'Edit Customers' },
      { value: 'customers.delete', label: 'Delete Customers' },
      { value: 'jobs.create', label: 'Create Jobs' },
      { value: 'jobs.read', label: 'View Jobs' },
      { value: 'jobs.update', label: 'Edit Jobs' },
      { value: 'jobs.delete', label: 'Delete Jobs' },
      { value: 'inventory.create', label: 'Create Inventory Items' },
      { value: 'inventory.read', label: 'View Inventory' },
      { value: 'inventory.update', label: 'Edit Inventory' },
      { value: 'inventory.delete', label: 'Delete Inventory' },
      { value: 'users.manage', label: 'Manage Users' },
      { value: 'roles.manage', label: 'Manage Roles' },
      { value: 'settings.manage', label: 'Manage Settings' },
    ];
  }
}

export const settingsService = new SettingsService();
