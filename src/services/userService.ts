import { apiClient } from '@/lib/api/client';

export interface Role {
  _id?: string;
  id?: string;
  name: string;
  display_name?: string;
  description?: string;
  category?: string;
  employee_type?: string;
  permissions?: string[];
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: string | Role;
  permissions: string[];
  active: boolean;
  phone?: string;
  department?: string;
  lastLogin?: string;
  canViewSummary?: boolean;
  createdAt?: string;
  updatedAt?: string;
  password?: string;
}

export interface CreateUserData {
  name?: string;
  email: string;
  password?: string;
  roleName: string | Role;
  permissions?: string[];
  phone?: string;
  department?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: string | Role;
  permissions?: string[];
  active?: boolean;
  phone?: string;
  department?: string;
  canViewSummary?: boolean;
}

export interface FilterParams {
  role?: string;
  status?: 'active' | 'inactive' | string;
  department?: string;
  search?: string;

  roles?: string[];
  statuses?: string[];
  departments?: string[];

  sort?: string;
  sortBy?: 'name' | 'email' | 'role' | 'createdAt' | 'lastLogin';
  sortOrder?: 'asc' | 'desc';
  
  page?: number;
  limit?: number;

  hasPermission?: string;
  canViewSummary?: boolean;

  fromDate?: string;
  toDate?: string;
  lastLoginAfter?: string;
  lastLoginBefore?: string;
}

export interface UsersResponse {
  data: User[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats?: UserStats;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  byRole: Array<{
    role: string;
    count: number;
  }>;
  byDepartment: Array<{
    department: string;
    count: number;
  }>;
  byStatus: Record<string, number>;
  recentLogins: number;
  withSummaryAccess: number;
  lastUpdated?: string;
}

interface GroupByResult {
  [key: string]: number;
}

class UserService {
  // Main method to get users with filtering, searching, and sorting
  async getAllUsers(params?: FilterParams): Promise<UsersResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      // Add all filter parameters if they exist
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
              // Handle array parameters (for multiple roles, statuses, etc.)
              value.forEach(item => queryParams.append(`${key}[]`, item));
            } else if (typeof value === 'boolean') {
              queryParams.append(key, value.toString());
            } else if (typeof value === 'object' && !Array.isArray(value)) {
              // Handle nested objects (like date ranges)
              Object.entries(value).forEach(([nestedKey, nestedValue]) => {
                if (nestedValue !== undefined && nestedValue !== null && nestedValue !== '') {
                  queryParams.append(`${key}.${nestedKey}`, nestedValue.toString());
                }
              });
            } else {
              queryParams.append(key, value.toString());
            }
          }
        });
      }
      
      // Use the base users endpoint with query params
      const endpoint = `/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await apiClient.get<any>(endpoint);
      return this.formatUsersResponse(response);
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Format the response to match UsersResponse interface
  private formatUsersResponse(response: any): UsersResponse {
    // Handle array response
    if (Array.isArray(response)) {
      return {
        data: response,
        pagination: undefined,
        stats: undefined
      };
    }
    // Handle object response
    else if (response.data && Array.isArray(response.data)) {
      return {
        data: response.data,
        pagination: response.pagination,
        stats: response.stats
      };
    }
    // Single user object
    else if (response.id || response._id) {
      return {
        data: [response],
        pagination: undefined,
        stats: undefined
      };
    }
    // Fallback
    else {
      return {
        data: [],
        pagination: undefined,
        stats: undefined
      };
    }
  }

  // Get users with simple parameters
  async getUsersSimple(params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }): Promise<UsersResponse> {
    const filterParams: FilterParams = {
      ...params,
      search: params?.search
    };
    return this.getAllUsers(filterParams);
  }

  // Common filter presets
  async getActiveUsers(): Promise<UsersResponse> {
    return this.getAllUsers({ 
      status: 'active',
      sort: 'name:asc',
      limit: 100
    });
  }

  async getAdmins(): Promise<UsersResponse> {
    return this.getAllUsers({ 
      role: 'admin',
      sort: 'name:asc',
      limit: 50
    });
  }

  async getTechnicians(): Promise<UsersResponse> {
    return this.getAllUsers({ 
      role: 'technician',
      sort: 'name:asc',
      limit: 50
    });
  }

  async getManagement(): Promise<UsersResponse> {
    return this.getAllUsers({ 
      role: 'management',
      sort: 'name:asc',
      limit: 50
    });
  }

  async searchUsers(searchTerm: string): Promise<UsersResponse> {
    return this.getAllUsers({
      search: searchTerm,
      sort: 'name:asc',
      limit: 50
    });
  }

  async getUsersWithSummaryAccess(): Promise<UsersResponse> {
    return this.getAllUsers({ 
      canViewSummary: true,
      sort: 'name:asc',
      limit: 50
    });
  }

  async getRecentlyActiveUsers(days: number = 7): Promise<UsersResponse> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    
    return this.getAllUsers({
      lastLoginAfter: date.toISOString(),
      sort: 'lastLogin:desc',
      limit: 50
    });
  }

  async getThisMonthsNewUsers(): Promise<UsersResponse> {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    return this.getAllUsers({
      fromDate: firstDay.toISOString().split('T')[0],
      toDate: today.toISOString().split('T')[0],
      sort: 'createdAt:desc',
      limit: 100
    });
  }

  async getUsersByDepartment(department: string): Promise<UsersResponse> {
    return this.getAllUsers({
      department,
      sort: 'name:asc',
      limit: 50
    });
  }

  async getPaginatedUsers(page: number = 1, limit: number = 20): Promise<UsersResponse> {
    return this.getAllUsers({
      page,
      limit,
      sort: 'name:asc'
    });
  }

  async getMultipleRoles(roles: string[]): Promise<UsersResponse> {
    return this.getAllUsers({
      roles,
      sort: 'role:asc,name:asc',
      limit: 50
    });
  }

  // Get users by date range
  async getUsersByDateRange(fromDate: string, toDate: string): Promise<UsersResponse> {
    return this.getAllUsers({
      fromDate,
      toDate,
      sort: 'createdAt:desc',
      limit: 100
    });
  }

  // Get users with specific permission
  async getUsersByPermission(permission: string): Promise<UsersResponse> {
    return this.getAllUsers({
      hasPermission: permission,
      sort: 'name:asc',
      limit: 50
    });
  }

  // Existing CRUD methods
  async getUserById(id: string): Promise<User> {
    try {
      const response = await this.getAllUsers();
      const user = response.data.find(u => u.id === id || u._id === id);
      
      if (!user) {
        throw new Error(`User with id ${id} not found`);
      }
      
      return user;
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  }

  async registerUser(data: CreateUserData): Promise<User> {
    try {
      const formattedData = {
        name: data.name || data.email.split('@')[0],
        email: data.email,
        password: data.password,
        role: data.roleName,
        ...(data.permissions && { permissions: data.permissions }),
        ...(data.phone && { phone: data.phone }),
        ...(data.department && { department: data.department }),
      };
      
      return await apiClient.post<any, User>('/users/register', formattedData);
    } catch (error) {
      console.error('Error registering user:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('403')) {
          sessionStorage.removeItem('accessToken');
          window.location.href = '/login';
          throw new Error('Session expired or insufficient permissions. Please log in again.');
        } else if (error.message.includes('409')) {
          throw new Error('A user with this email already exists.');
        } else if (error.message.includes('400')) {
          throw new Error('Invalid user data. Please check all required fields.');
        }
      }
      
      throw error;
    }
  }

  // Create user (Admin or Management)
  async createUser(data: CreateUserData): Promise<User> {
    try {

      const formattedData = {
        ...data,
        name: data.name || data.email.split('@')[0],
      };
      
      return await apiClient.post<any, User>('/users', formattedData);
    } catch (error) {
      console.error('Error creating user:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('403')) {
          throw new Error('Insufficient permissions to create users.');
        } else if (error.message.includes('409')) {
          throw new Error('A user with this email already exists.');
        }
      }
      
      throw error;
    }
  }

  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    try {
      // Since the API might not have a PATCH /users/{id} endpoint for general updates,
      // we'll need to handle different update types
      // For now, we'll use the summary-access endpoint as an example
      if (data.canViewSummary !== undefined) {
        return await this.updateSummaryAccess(id, data.canViewSummary);
      }
      
      // For other updates, we might need to use a different endpoint
      // This is a placeholder - adjust based on actual API
      return await apiClient.patch<any, User>(`/users/${id}`, data);
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw error;
    }
  }

  async updateSummaryAccess(id: string, canViewSummary: boolean): Promise<User> {
    try {
      return await apiClient.patch<any, User>(`/users/${id}/summary-access`, {
        canViewSummary
      });
    } catch (error) {
      console.error(`Error updating summary access for user ${id}:`, error);
      throw error;
    }
  }

  async toggleUserStatus(id: string, active: boolean): Promise<User> {
    try {
      return await this.updateUser(id, { active });
    } catch (error) {
      console.error(`Error toggling user status ${id}:`, error);
      throw error;
    }
  }

  async updateUserPermissions(id: string, permissions: string[]): Promise<User> {
    try {
      return await this.updateUser(id, { permissions });
    } catch (error) {
      console.error(`Error updating permissions for user ${id}:`, error);
      throw error;
    }
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    try {
      return await this.updateUser(id, { role });
    } catch (error) {
      console.error(`Error updating role for user ${id}:`, error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      // Note: Check if your API has a DELETE endpoint
      await apiClient.delete(`/users/${id}`);
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  }

  async getUsersOverview(): Promise<UserStats> {
    try {
      // Since there might not be a dedicated overview endpoint,
      // we'll calculate stats from the users list
      const response = await this.getAllUsers();
      const users = response.data;
      
      const stats: UserStats = {
        total: users.length,
        active: users.filter(u => u.active).length,
        inactive: users.filter(u => !u.active).length,
        byRole: this.formatGroupByResult(this.groupBy(users, 'role'), 'role'),
        byDepartment: this.formatGroupByResult(this.groupBy(users, 'department'), 'department'),
        byStatus: {
          active: users.filter(u => u.active).length,
          inactive: users.filter(u => !u.active).length
        },
        recentLogins: users.filter(u => {
          if (!u.lastLogin) return false;
          const lastLogin = new Date(u.lastLogin);
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return lastLogin > sevenDaysAgo;
        }).length,
        withSummaryAccess: users.filter(u => u.canViewSummary).length,
        lastUpdated: new Date().toISOString()
      };
      
      return stats;
    } catch (error) {
      console.error('Error fetching users overview:', error);
      // Return default stats
      return {
        total: 0,
        active: 0,
        inactive: 0,
        byRole: [],
        byDepartment: [],
        byStatus: {},
        recentLogins: 0,
        withSummaryAccess: 0
      };
    }
  }

  // Helper method to group by property
  private groupBy(users: User[], property: keyof User): GroupByResult {
    const groups: GroupByResult = {};
    
    users.forEach(user => {
      const value = user[property] || 'Unassigned';
      const key = typeof value === 'string' ? value : String(value);
      groups[key] = (groups[key] || 0) + 1;
    });
    
    return groups;
  }

  // Format group by result to typed arrays
  private formatGroupByResult(groups: GroupByResult, type: 'role' | 'department'): any[] {
    return Object.entries(groups).map(([key, count]) => {
      if (type === 'role') {
        return { role: key, count };
      } else {
        return { department: key, count };
      }
    });
  }

  // Utility method to build filter query
  buildFilterQuery(params: FilterParams): string {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(item => queryParams.append(`${key}[]`, item));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });
    
    return queryParams.toString();
  }

  // Get all available filter options
  async getFilterOptions() {
    try {
      const overview = await this.getUsersOverview();
      
      return {
        roles: Array.from(new Set(overview.byRole.map(item => item.role))),
        departments: Array.from(new Set(overview.byDepartment.map(item => item.department))),
        statuses: ['active', 'inactive'],
        permissions: ['jobs.read', 'jobs.update', 'jobs.create', 'jobs.delete', 'users.read', 'users.create', 'users.update']
      };
    } catch (error) {
      console.error('Error fetching filter options:', error);
      return {
        roles: ['admin', 'management', 'technician', 'sales_representative'],
        departments: [],
        statuses: ['active', 'inactive'],
        permissions: ['jobs.read', 'jobs.update', 'jobs.create', 'jobs.delete', 'users.read', 'users.create', 'users.update']
      };
    }
  }

  // Export users data
  async exportUsers(params?: FilterParams, format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    try {
      const query = params ? this.buildFilterQuery(params) : '';
      // Note: This endpoint might not exist, you'll need to implement it in your backend
      const endpoint = `/users/export/${format}${query ? `?${query}` : ''}`;
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }
      
      return await response.blob();
    } catch (error) {
      console.error('Error exporting users:', error);
      throw error;
    }
  }

  // Get headers for API requests
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
}

export const userService = new UserService();