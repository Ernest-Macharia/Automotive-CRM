import { apiClient } from '@/lib/api/client';
import { roleService, Role } from '@/services/settings/roleService';

export interface User {
  id: string;
  _id?: string;
  customId?: string;
  name: string | null;
  email: string;
  roleName: string;
  role?: {
    _id: string;
    name: string;
    display_name: string;
  };
  permissions: string[];
  additionalPermissions?: string[];
  active: boolean;
  canViewSummary?: boolean;
  requiresPasswordChange?: boolean;
  isFirstLogin?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserData {
  name?: string;
  email: string;
  password?: string;
  roleName: string;
  permissions?: string[];
  active?: boolean;
  canViewSummary?: boolean;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  roleName?: string;
  permissions?: string[];
  active?: boolean;
  canViewSummary?: boolean;
}

class UserService {
  async getUsers(): Promise<User[]> {
    try {
      const users = await apiClient.get<User[]>('/users');
      
      return users.map((user, index) => ({
        ...user,
        id: user.id || user._id || `temp-id-${Date.now()}-${index}`,
        name: user.name || null,
        roleName: user.roleName || 'user',
        canViewSummary: user.canViewSummary || false,
        permissions: user.permissions || []
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async getUser(id: string): Promise<User> {
    try {
      const user = await apiClient.get<User>(`/users/${id}`);
      return {
        ...user,
        id: user.id || user._id || id,
        name: user.name || null,
        roleName: user.roleName || 'user',
        canViewSummary: user.canViewSummary || false,
        permissions: user.permissions || []
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      const users = await this.getUsers();
      const foundUser = users.find(u => u.id === id);
      if (!foundUser) throw new Error('User not found');
      return foundUser;
    }
  }

  async createUser(data: CreateUserData): Promise<User> {
    try {
      console.log('🚀 Creating user with data:', data);

      // Backend expects exactly these 4 fields
      const userData = {
        name: data.name?.trim() || '',
        email: data.email?.trim().toLowerCase() || '',
        password: data.password || '',
        roleName: data.roleName || '',
      };
      
      console.log('📤 Sending to API:', userData);
      console.log('🔍 Role name being sent:', userData.roleName);
      console.log('🔍 Email being sent:', userData.email);
      
      // Make the API call
      const response = await apiClient.post<any, any>('/users/register', userData);
      
      console.log('✅ API Response:', response);
      
      // Handle different response formats
      if (response.user) {
        const newUser = {
          id: response.user.id || response.user._id || '',
          _id: response.user._id,
          customId: response.user.customId || '',
          name: response.user.name || '',
          email: response.user.email,
          roleName: response.user.role || data.roleName,
          permissions: response.user.permissions || [],
          active: true,
          requiresPasswordChange: response.user.requiresPasswordChange || false,
        };
        console.log('🎉 Created user successfully:', newUser);
        return newUser;
      }
      
      // If response has success message
      if (response.message && response.message.includes('success')) {
        console.log('✅ Success message:', response.message);
        return {
          id: Date.now().toString(),
          name: data.name || '',
          email: data.email,
          roleName: data.roleName,
          permissions: [],
          active: true,
          requiresPasswordChange: true,
        };
      }
      
      console.warn('⚠️ Unexpected response format:', response);
      return {
        id: Date.now().toString(),
        name: data.name || '',
        email: data.email,
        roleName: data.roleName,
        permissions: [],
        active: true,
        requiresPasswordChange: true,
      };
      
    } catch (error: any) {
      console.error('❌ Error creating user:', error);
      
      // Log the full error object
      console.error('🔍 Full error object:', error);
      
      let errorMessage = 'Failed to create user';
      
      // Check for specific error patterns
      if (error.response) {
        console.error('📊 Error response details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
        });
        
        if (error.response.data) {
          if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          } else if (error.response.data.message) {
            errorMessage = error.response.data.message;
          } else if (error.response.data.error) {
            errorMessage = error.response.data.error;
          } else {
            errorMessage = JSON.stringify(error.response.data);
          }
        } else if (error.response.status === 500) {
          errorMessage = 'Server error (500). Please check backend logs.';
        }
      } else if (error.message) {
        errorMessage = error.message;
        console.error('📝 Error message:', error.message);
      }
      
      // Clean up the error message
      if (errorMessage.includes('{"statusCode":')) {
        try {
          const parsed = JSON.parse(errorMessage);
          errorMessage = parsed.message || errorMessage;
        } catch {
          // Keep original
        }
      }
      
      console.log('🎯 Final error to display:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    try {
      // Update user basic info
      const userData: any = {};
      if (data.name !== undefined) userData.name = data.name;
      if (data.email !== undefined) userData.email = data.email;
      if (data.active !== undefined) userData.active = data.active;
      if (data.canViewSummary !== undefined) userData.canViewSummary = data.canViewSummary;
      
      let user: User;
      
      if (Object.keys(userData).length > 0) {
        user = await apiClient.patch<any, User>(`/users/${id}`, userData);
      } else {
        user = await this.getUser(id);
      }
      
      // Update role if provided
      if (data.roleName) {
        await roleService.assignRoleToUser({
          userId: id,
          roleName: data.roleName
        });
        
        // Fetch updated user data
        user = await this.getUser(id);
      }
      
      // Update permissions if provided
      if (data.permissions) {
        await this.updateUserPermissions(id, data.permissions);
        user.permissions = data.permissions;
      }
      
      return {
        ...user,
        id: user.id || user._id || id,
        roleName: user.roleName || data.roleName || 'user'
      };
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    try {
      return await apiClient.delete<{ message: string }>(`/users/${id}`);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async updateUserSummaryAccess(id: string, canViewSummary: boolean): Promise<User> {
    try {
      const response = await apiClient.patch<{ canViewSummary: boolean }, User>(
        `/users/${id}/summary-access`,
        { canViewSummary }
      );
      return {
        ...response,
        id: response.id || response._id || id,
        roleName: response.roleName || 'user'
      };
    } catch (error) {
      console.error('Error updating user summary access:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      return await apiClient.get<User>('/users/me');
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  }

  // Permission management
  async assignPermissions(userId: string, permissions: string[]): Promise<void> {
    try {
      await apiClient.post('/users/permissions/add', {
        userId,
        permissions
      });
    } catch (error) {
      console.error('Error assigning permissions:', error);
      throw error;
    }
  }

  async removePermissions(userId: string, permissions: string[]): Promise<void> {
    try {
      await apiClient.post('/users/permissions/remove', {
        userId,
        permissions
      });
    } catch (error) {
      console.error('Error removing permissions:', error);
      throw error;
    }
  }

  async updateUserPermissions(userId: string, permissions: string[]): Promise<void> {
    try {
      const user = await this.getUser(userId);
      const currentPermissions = user.permissions || [];
      
      const permissionsToAdd = permissions.filter(p => !currentPermissions.includes(p));
      const permissionsToRemove = currentPermissions.filter(p => !permissions.includes(p));
      
      if (permissionsToAdd.length > 0) {
        await this.assignPermissions(userId, permissionsToAdd);
      }
      
      if (permissionsToRemove.length > 0) {
        await this.removePermissions(userId, permissionsToRemove);
      }
    } catch (error) {
      console.error('Error updating user permissions:', error);
      throw error;
    }
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const response = await apiClient.get<{ permissions: string[] }>(`/users/${userId}/permissions`);
      return response.permissions || [];
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      return [];
    }
  }

  // Role management
  async getRoles(): Promise<Role[]> {
    try {
      const response = await roleService.getAllRoles({ active: true });
      console.log('Roles response:', response);
      
      // Handle response format
      let rolesArray: any[] = [];
      
      if (response && response.data && Array.isArray(response.data)) {
        rolesArray = response.data;
      } else if (Array.isArray(response)) {
        rolesArray = response;
      }
      
      console.log('Extracted roles:', rolesArray.length);
      
      // Format roles
      return rolesArray.map((role: any, index: number) => ({
        ...role,
        id: role.id || role._id || `role-${index}`,
        name: role.name || '',
        display_name: role.display_name || role.displayName || role.name || 'Unnamed Role',
        permissions: role.permissions || []
      }));
      
    } catch (error) {
      console.error('Error fetching roles:', error);
      // Return empty array to avoid breaking the UI
      return [];
    }
  }

  async getPermissionOptions(): Promise<Array<{ value: string; label: string; category: string }>> {
    try {
      const permissions = await roleService.getAllPermissions();
      return (permissions.permissions || []).map(perm => ({
        value: perm,
        label: perm.split('.').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1).replace('_', ' ')
        ).join(' '),
        category: perm.split('.')[0] || 'general'
      }));
    } catch (error) {
      console.error('Error fetching permissions:', error);
      return [
        { value: 'users.read', label: 'Read Users', category: 'users' },
        { value: 'users.create', label: 'Create Users', category: 'users' },
        { value: 'users.update', label: 'Update Users', category: 'users' },
        { value: 'users.delete', label: 'Delete Users', category: 'users' },
        { value: 'dashboard.view', label: 'View Dashboard', category: 'dashboard' },
      ];
    }
  }
}

export const userService = new UserService();