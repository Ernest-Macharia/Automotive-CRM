import { apiClient } from '@/lib/api/client';
import { roleService } from './roleService';

export interface UserRole {
  _id?: string;
  id?: string;
  name: string;
  display_name: string;
  permissions?: string[];
}

export interface User {
  id: string;
  _id?: string;
  customId?: string;
  name: string;
  email: string;
  role: UserRole | string;
  permissions: string[];
  additionalPermissions?: string[];
  canViewSummary?: boolean;
  active: boolean;
  requiresPasswordChange?: boolean;
  isFirstLogin?: boolean;
  allPermissions?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterUserData {
  name: string;
  email: string;
  password: string;
  roleName: string;
}

export interface CreateUserData {
  name?: string;
  email?: string;
  role?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: string;
  permissions?: string[];
  active?: boolean;
  canViewSummary?: boolean;
  requiresPasswordChange?: boolean;
  isFirstLogin?: boolean;
}

export interface SummaryAccessData {
  canViewSummary: boolean;
}

export interface PermissionOperationData {
  permissions: string[];
}

export interface PermissionOperationResponse {
  message: string;
  user: {
    id: string;
    customId?: string;
    name?: string;
    email: string;
    role: string;
    permissions: string[];
    additionalPermissions?: string[];
  };
}

export interface SetRoleData {
  roleId: string;
}

export interface SetRoleResponse {
  message: string;
  user: {
    id: string;
    customId?: string;
    name?: string;
    email: string;
    role: string;
    displayName?: string;
    permissions: string[];
    additionalPermissions?: string[];
  };
}

export interface PermissionsResponse {
  permissions: string[];
}

export interface UserPermissionsResponse {
  _id: string;
  customId?: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
  additionalPermissions?: string[];
  canViewSummary?: boolean;
  active: boolean;
  requiresPasswordChange?: boolean;
  isFirstLogin?: boolean;
  allPermissions?: string[];
  createdAt?: string;
  updatedAt?: string;
}

class UserService {
  /**
   * Register a new user (Admin only)
   * POST /api/v1/users/register
   */
  async registerUser(data: RegisterUserData): Promise<User> {
    try {
      const response = await apiClient.post<RegisterUserData, any>('/users/register', data);
      return this.normalizeUser(response);
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }

  /**
   * Create a user (Admin or Management)
   * POST /api/v1/users
   */
  async createUser(data: CreateUserData): Promise<User> {
    try {
      const response = await apiClient.post<CreateUserData, any>('/users', data);
      return this.normalizeUser(response);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * List all users (Admin or Management)
   * GET /api/v1/users
   */
  async getAllUsers(): Promise<User[]> {
    try {
      const response = await apiClient.get<any[]>('/users');
      return response.map(user => this.normalizeUser(user));
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   * GET /api/v1/users/{id}
   */
  async getUserById(id: string): Promise<User> {
    try {
      const response = await apiClient.get<any>(`/users/${id}`);
      return this.normalizeUser(response);
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update summary access (Admin only)
   * PATCH /api/v1/users/{id}/summary-access
   */
  async updateSummaryAccess(id: string, canViewSummary: boolean): Promise<User> {
    try {
      const response = await apiClient.patch<SummaryAccessData, any>(
        `/users/${id}/summary-access`,
        { canViewSummary }
      );
      return this.normalizeUser(response);
    } catch (error) {
      console.error(`Error updating summary access for user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Add permissions to user (Admin only)
   * POST /api/v1/users/{id}/permissions/add
   */
  async addPermissions(id: string, permissions: string[]): Promise<PermissionOperationResponse> {
    try {
      return await apiClient.post<PermissionOperationData, PermissionOperationResponse>(
        `/users/${id}/permissions/add`,
        { permissions }
      );
    } catch (error) {
      console.error(`Error adding permissions to user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Remove permissions from user (Admin only)
   * POST /api/v1/users/{id}/permissions/remove
   */
  async removePermissions(id: string, permissions: string[]): Promise<PermissionOperationResponse> {
    try {
      return await apiClient.post<PermissionOperationData, PermissionOperationResponse>(
        `/users/${id}/permissions/remove`,
        { permissions }
      );
    } catch (error) {
      console.error(`Error removing permissions from user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Reset additional permissions (Admin only)
   * DELETE /api/v1/users/{id}/permissions/reset
   */
  async resetAdditionalPermissions(id: string): Promise<PermissionOperationResponse> {
    try {
      return await apiClient.delete<PermissionOperationResponse>(`/users/${id}/permissions/reset`);
    } catch (error) {
      console.error(`Error resetting additional permissions for user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get user permissions (Admin only)
   * GET /api/v1/users/{id}/permissions
   */
  async getUserPermissions(id: string): Promise<UserPermissionsResponse> {
    try {
      const response = await apiClient.get<UserPermissionsResponse>(`/users/${id}/permissions`);
      return response;
    } catch (error) {
      console.error(`Error fetching permissions for user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Set user role (Admin only)
   * PATCH /api/v1/users/{id}/role
   */
  async setUserRole(id: string, roleId: string): Promise<SetRoleResponse> {
    try {
      return await apiClient.patch<SetRoleData, SetRoleResponse>(
        `/users/${id}/role`,
        { roleId }
      );
    } catch (error) {
      console.error(`Error setting role for user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get available permissions (Admin only)
   * GET /api/v1/users/available-permissions
   */
  async getAvailablePermissions(): Promise<PermissionsResponse> {
    try {
      return await apiClient.get<PermissionsResponse>('/users/available-permissions');
    } catch (error) {
      console.error('Error fetching available permissions:', error);
      throw error;
    }
  }

  /**
   * Get users by role (Admin or Management)
   * GET /api/v1/users/role/{roleName}
   */
  async getUsersByRole(roleName: string): Promise<User[]> {
    try {
      const response = await apiClient.get<any[]>(`/users/role/${roleName}`);
      return response.map(user => this.normalizeUser(user));
    } catch (error) {
      console.error(`Error fetching users with role ${roleName}:`, error);
      throw error;
    }
  }

  /**
   * Normalize user data from backend
   */
  private normalizeUser(data: any): User {
    // Extract role name from role object or string
    let roleName = 'unknown';
    let roleObject: UserRole | string = 'unknown';
    
    if (data.role) {
      if (typeof data.role === 'object' && data.role !== null) {
        roleName = data.role.name || 'unknown';
        roleObject = {
          _id: data.role._id,
          id: data.role._id || data.role.id,
          name: data.role.name,
          display_name: data.role.display_name || data.role.displayName,
          permissions: data.role.permissions || []
        };
      } else if (typeof data.role === 'string') {
        roleName = data.role;
        roleObject = data.role;
      }
    }

    // Calculate all permissions
    const rolePermissions = (typeof data.role === 'object' && data.role !== null) 
      ? (data.role.permissions || []) 
      : [];
    const additionalPermissions = data.additionalPermissions || [];
    const allPermissions = [...new Set([...rolePermissions, ...additionalPermissions])];

    return {
      id: data._id || data.id,
      _id: data._id,
      customId: data.customId,
      name: data.name,
      email: data.email,
      role: roleObject,
      permissions: data.permissions || allPermissions,
      additionalPermissions: data.additionalPermissions,
      canViewSummary: data.canViewSummary || false,
      active: data.active !== undefined ? data.active : true,
      requiresPasswordChange: data.requiresPasswordChange || false,
      isFirstLogin: data.isFirstLogin || false,
      allPermissions,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  /**
   * Update user information
   */
  /**
 * Update user information
 */
  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    try {
      // First update basic user info if endpoint exists
      const userData: any = {};
      if (data.name !== undefined) userData.name = data.name;
      if (data.email !== undefined) userData.email = data.email;
      if (data.active !== undefined) userData.active = data.active;
      if (data.canViewSummary !== undefined) userData.canViewSummary = data.canViewSummary;
      if (data.requiresPasswordChange !== undefined) userData.requiresPasswordChange = data.requiresPasswordChange;
      if (data.isFirstLogin !== undefined) userData.isFirstLogin = data.isFirstLogin;

      let user = await this.getUserById(id);

      // Update role if provided
      if (data.role) {
        // We need to get the role ID from the role name
        const role = await roleService.getRoleByName(data.role);
        if (role) {
          await this.setUserRole(id, role.id);
        }
      }

      // Update permissions if provided
      if (data.permissions && Array.isArray(data.permissions)) {
        const currentPermissions = user.permissions || [];
        const currentAdditional = user.additionalPermissions || [];
        
        // Calculate permissions to add and remove
        const permissionsToAdd = data.permissions.filter(p => !currentPermissions.includes(p));
        const permissionsToRemove = currentAdditional.filter(p => !data.permissions!.includes(p));
        
        if (permissionsToAdd.length > 0) {
          await this.addPermissions(id, permissionsToAdd);
        }
        
        if (permissionsToRemove.length > 0) {
          await this.removePermissions(id, permissionsToRemove);
        }
      }

      // Fetch updated user
      return await this.getUserById(id);
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete user
   * (Note: This endpoint might not exist in your API, but added for completeness)
   */
  async deleteUser(id: string): Promise<{ message: string }> {
    try {
      return await apiClient.delete<{ message: string }>(`/users/${id}`);
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get active users only
   */
  async getActiveUsers(): Promise<User[]> {
    try {
      const users = await this.getAllUsers();
      return users.filter(user => user.active === true);
    } catch (error) {
      console.error('Error fetching active users:', error);
      throw error;
    }
  }

  /**
   * Get users by permission
   */
  async getUsersByPermission(permission: string): Promise<User[]> {
    try {
      const users = await this.getAllUsers();
      return users.filter(user => 
        user.permissions?.includes(permission) || 
        user.allPermissions?.includes(permission)
      );
    } catch (error) {
      console.error(`Error fetching users with permission ${permission}:`, error);
      throw error;
    }
  }

  /**
   * Search users
   */
  async searchUsers(searchTerm: string): Promise<User[]> {
    try {
      const users = await this.getAllUsers();
      return users.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.customId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const users = await this.getAllUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      return user || null;
    } catch (error) {
      console.error(`Error fetching user by email ${email}:`, error);
      throw error;
    }
  }

  /**
   * Check if user has permission
   */
  userHasPermission(user: User, permission: string): boolean {
    if (!user) return false;
    
    // Check direct permissions
    if (user.permissions?.includes(permission)) {
      return true;
    }
    
    // Check all permissions
    if (user.allPermissions?.includes(permission)) {
      return true;
    }
    
    // Check for wildcard permissions (e.g., users.* should match users.create)
    const parts = permission.split('.');
    if (parts.length >= 2) {
      const module = parts[0];
      const wildcardPermission = `${module}.*`;
      
      if (user.permissions?.includes(wildcardPermission) || 
          user.allPermissions?.includes(wildcardPermission)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if user has any of the permissions
   */
  userHasAnyPermission(user: User, permissions: string[]): boolean {
    if (!user || !permissions || permissions.length === 0) return false;
    
    return permissions.some(permission => this.userHasPermission(user, permission));
  }

  /**
   * Check if user has all permissions
   */
  userHasAllPermissions(user: User, permissions: string[]): boolean {
    if (!user || !permissions || permissions.length === 0) return false;
    
    return permissions.every(permission => this.userHasPermission(user, permission));
  }

  /**
   * Check if user can view summary
   */
  canViewSummary(user: User): boolean {
    return user.canViewSummary === true || 
           this.userHasPermission(user, 'summary.view') || 
           this.userHasPermission(user, 'dashboard.view');
  }

  /**
   * Get user's display name
   */
  getUserDisplayName(user: User): string {
    if (!user) return 'Unknown User';
    
    if (user.name) return user.name;
    if (user.customId) return user.customId;
    if (user.email) return user.email.split('@')[0];
    
    return 'Unknown User';
  }

  /**
   * Get user's role name
   */
  getUserRoleName(user: User): string {
    if (!user) return 'unknown';
    
    if (typeof user.role === 'object' && user.role !== null) {
      return user.role.name || 'unknown';
    }
    
    if (typeof user.role === 'string') {
      return user.role;
    }
    
    return 'unknown';
  }

  /**
   * Get user's role display name
   */
  getUserRoleDisplayName(user: User): string {
    if (!user) return 'Unknown Role';
    
    if (typeof user.role === 'object' && user.role !== null) {
      return user.role.display_name || this.getUserRoleName(user);
    }
    
    return this.getUserRoleName(user);
  }

  /**
   * Format user for select dropdown
   */
  formatUserForSelect(user: User): { value: string; label: string } {
    return {
      value: user.id,
      label: `${this.getUserDisplayName(user)} (${user.email})`
    };
  }

  /**
   * Get users for select dropdown
   */
  async getUsersForSelect(): Promise<Array<{ value: string; label: string }>> {
    try {
      const users = await this.getActiveUsers();
      return users.map(user => this.formatUserForSelect(user));
    } catch (error) {
      console.error('Error getting users for select:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
    withSummaryAccess: number;
    requiresPasswordChange: number;
  }> {
    try {
      const users = await this.getAllUsers();
      
      const byRole: Record<string, number> = {};
      let active = 0;
      let inactive = 0;
      let withSummaryAccess = 0;
      let requiresPasswordChange = 0;
      
      users.forEach(user => {
        const roleName = this.getUserRoleName(user);
        byRole[roleName] = (byRole[roleName] || 0) + 1;
        
        if (user.active) active++;
        else inactive++;
        
        if (user.canViewSummary) withSummaryAccess++;
        if (user.requiresPasswordChange) requiresPasswordChange++;
      });
      
      return {
        total: users.length,
        active,
        inactive,
        byRole,
        withSummaryAccess,
        requiresPasswordChange,
      };
    } catch (error) {
      console.error('Error calculating user statistics:', error);
      throw error;
    }
  }
}

export const userService = new UserService();

// Permission constants for user management
export const USER_PERMISSIONS = {
  // User management
  USERS_CREATE: 'users.create',
  USERS_READ: 'users.read',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  
  // Role management
  ROLES_ASSIGN: 'roles.assign',
  ROLES_MANAGE: 'roles.manage',
  
  // Permission management
  PERMISSIONS_ADD: 'permissions.add',
  PERMISSIONS_REMOVE: 'permissions.remove',
  PERMISSIONS_RESET: 'permissions.reset',
  
  // Summary access
  SUMMARY_VIEW: 'summary.view',
  
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',
};

// Role constants
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGEMENT: 'management',
  SALES_REPRESENTATIVE: 'sales_representative',
  TECHNICIAN: 'technician',
  SUPPORT: 'support',
  CUSTOMER: 'customer',
  DEVELOPER: 'developer',
};

// Helper function to create a user permission checker
export const createUserPermissionChecker = (user: User) => {
  return {
    hasPermission: (permission: string) => userService.userHasPermission(user, permission),
    hasAnyPermission: (permissions: string[]) => userService.userHasAnyPermission(user, permissions),
    hasAllPermissions: (permissions: string[]) => userService.userHasAllPermissions(user, permissions),
    canViewSummary: () => userService.canViewSummary(user),
    getRoleName: () => userService.getUserRoleName(user),
    getRoleDisplayName: () => userService.getUserRoleDisplayName(user),
    getDisplayName: () => userService.getUserDisplayName(user),
  };
};