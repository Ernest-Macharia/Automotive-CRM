import { apiClient } from '@/lib/api/client';

// ================ Types & Interfaces ================

export interface Permission {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  category: string;
  module: string;
  action: string;
  scope?: 'global' | 'own' | 'team';
}

export interface Role {
  _id: string;
  id: string;
  name: string;
  display_name: string;
  description?: string;
  category: 'system' | 'sales' | 'technical' | 'management' | 'finance' | 'support';
  employee_type?: 'manager' | 'technician' | 'sales' | 'admin' | 'support';
  permissions: string[];
  additionalPermissions?: string[];
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface UserRoleAssignment {
  userId: string;
  roleName: string;
}

export interface RoleAssignmentResponse {
  message: string;
  user: {
    id: string;
    customId: string;
    name: string;
    email: string;
    role: string;
    permissions: string[];
    additionalPermissions: string[];
  };
}

export interface PermissionsListResponse {
  permissions: string[];
}

export interface RoleCreationData {
  name: string;
  display_name: string;
  description?: string;
  category: Role['category'];
  employee_type?: Role['employee_type'];
  permissions: string[];
  additionalPermissions?: string[];
  active?: boolean;
}

export interface RoleUpdateData {
  display_name?: string;
  description?: string;
  category?: Role['category'];
  employee_type?: Role['employee_type'];
  permissions?: string[];
  additionalPermissions?: string[];
  active?: boolean;
}

export interface RoleFilterParams {
  category?: string;
  employee_type?: string;
  active?: boolean;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface RolesResponse {
  data: Role[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats?: {
    total: number;
    byCategory: Array<{
      _id: string;
      count: number;
    }>;
    active: number;
    inactive: number;
  };
}

export interface PermissionCheck {
  hasPermission: (permission: string, scope?: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasRole: (roleName: string) => boolean;
  hasAnyRole: (roleNames: string[]) => boolean;
}

// ================ Service Class ================

class RoleService {
  // ================ Role Management ================
  
  /**
   * Get all roles with optional filtering
   */
  async getAllRoles(params?: RoleFilterParams): Promise<RolesResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const endpoint = `/roles${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiClient.get<any>(endpoint);
      
      return {
        data: response.data || response,
        pagination: response.pagination,
        stats: response.stats
      };
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  }

  /**
   * Get role by name
   */
  async getRoleByName(name: string): Promise<Role> {
    try {
      const response = await apiClient.post<{ name: string }, Role>('/roles/find', { name });
      return response;
    } catch (error) {
      console.error(`Error fetching role ${name}:`, error);
      throw error;
    }
  }

  /**
   * Get role by ID
   */
  async getRoleById(id: string): Promise<Role> {
    try {
      const response = await apiClient.get<Role>(`/roles/${id}`);
      return response;
    } catch (error) {
      console.error(`Error fetching role ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new role
   */
  async createRole(data: RoleCreationData): Promise<Role> {
    try {
      const formattedData = {
        name: data.name,
        display_name: data.display_name,
        description: data.description || '',
        category: data.category,
        employee_type: data.employee_type,
        permissions: data.permissions || [],
        additionalPermissions: data.additionalPermissions || [],
        active: data.active !== undefined ? data.active : true
      };

      return await apiClient.post<typeof formattedData, Role>('/roles', formattedData);
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  }

  /**
   * Update an existing role
   */
  async updateRole(id: string, data: RoleUpdateData): Promise<Role> {
    try {
      return await apiClient.patch<RoleUpdateData, Role>(`/roles/${id}`, data);
    } catch (error) {
      console.error(`Error updating role ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a role
   */
  async deleteRole(id: string): Promise<void> {
    try {
      await apiClient.delete(`/roles/${id}`);
    } catch (error) {
      console.error(`Error deleting role ${id}:`, error);
      throw error;
    }
  }

  /**
   * Toggle role active status
   */
  async toggleRoleActive(id: string, active: boolean): Promise<Role> {
    try {
      return await apiClient.patch<any, Role>(`/roles/${id}/toggle-active`, { active });
    } catch (error) {
      console.error(`Error toggling role active status ${id}:`, error);
      throw error;
    }
  }

  // ================ Permission Management ================

  /**
   * Get all available permissions
   */
  async getAllPermissions(): Promise<PermissionsListResponse> {
    try {
      return await apiClient.get<PermissionsListResponse>('/roles/permissions');
    } catch (error) {
      console.error('Error fetching permissions:', error);
      throw error;
    }
  }

  /**
   * Get permissions grouped by category
   */
  async getPermissionsByCategory(): Promise<Record<string, Permission[]>> {
    try {
      // This endpoint might not exist in your API, so we'll simulate it
      const permissions = await this.getAllPermissions();
      
      // Group permissions by their prefix (e.g., 'users.', 'dashboard.', etc.)
      const grouped: Record<string, Permission[]> = {};
      
      // This is a simplified grouping - you might want to customize this
      permissions.permissions.forEach(permission => {
        const parts = permission.split('.');
        const category = parts[0] || 'general';
        
        if (!grouped[category]) {
          grouped[category] = [];
        }
        
        // Create a Permission object from the string
        const perm: Permission = {
          id: permission,
          name: permission,
          displayName: this.formatPermissionDisplayName(permission),
          category: category,
          module: parts[0] || 'general',
          action: parts[1] || 'access'
        };
        
        grouped[category].push(perm);
      });
      
      return grouped;
    } catch (error) {
      console.error('Error grouping permissions:', error);
      throw error;
    }
  }

  /**
   * Check if user has specific permission
   */
  async checkUserPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const response = await apiClient.get<any>(`/roles/user/${userId}/check-permission/${permission}`);
      return response.hasPermission || false;
    } catch (error) {
      console.error(`Error checking permission for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get user's permissions
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const response = await apiClient.get<{ permissions: string[] }>(`/roles/user/${userId}/permissions`);
      return response.permissions || [];
    } catch (error) {
      console.error(`Error fetching permissions for user ${userId}:`, error);
      throw error;
    }
  }

  // ================ User Role Assignment ================

  /**
   * Assign role to user
   */
  async assignRoleToUser(data: UserRoleAssignment): Promise<RoleAssignmentResponse> {
    try {
      return await apiClient.post<UserRoleAssignment, RoleAssignmentResponse>('/roles/assign', data);
    } catch (error) {
      console.error('Error assigning role to user:', error);
      throw error;
    }
  }

  /**
   * Remove role from user
   */
  async removeRoleFromUser(userId: string, roleName: string): Promise<void> {
    try {
      await apiClient.post<any, void>('/roles/remove', { userId, roleName });
    } catch (error) {
      console.error(`Error removing role from user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get user's roles
   */
  async getUserRoles(userId: string): Promise<Role[]> {
    try {
      const response = await apiClient.get<Role[]>(`/roles/user/${userId}/roles`);
      return Array.isArray(response) ? response : [response];
    } catch (error) {
      console.error(`Error fetching roles for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get all users with a specific role
   */
  async getUsersByRole(roleName: string): Promise<any[]> {
    try {
      const response = await apiClient.get<any[]>(`/roles/${roleName}/users`);
      return Array.isArray(response) ? response : [response];
    } catch (error) {
      console.error(`Error fetching users with role ${roleName}:`, error);
      throw error;
    }
  }

  // ================ System Operations ================

  /**
   * Seed default roles and permissions
   */
  async seedDefaultRoles(): Promise<{ message: string }> {
    try {
      return await apiClient.post<any, { message: string }>('/roles/seed', {});
    } catch (error) {
      console.error('Error seeding default roles:', error);
      throw error;
    }
  }

  /**
   * Sync permissions from configuration
   */
  async syncPermissions(permissions: Permission[]): Promise<{ message: string }> {
    try {
      return await apiClient.post<Permission[], { message: string }>('/roles/sync-permissions', permissions);
    } catch (error) {
      console.error('Error syncing permissions:', error);
      throw error;
    }
  }

  /**
   * Get role statistics
   */
  async getRoleStats(): Promise<any> {
    try {
      return await apiClient.get<any>('/roles/stats');
    } catch (error) {
      console.error('Error fetching role stats:', error);
      throw error;
    }
  }

  // ================ Permission Checking Utilities ================

  /**
   * Create a permission checker for a user
   */
  createPermissionChecker(
    userRoles: Role[],
    userAdditionalPermissions: string[] = []
    ): PermissionCheck {

    const allPermissions = new Set<string>();

    userRoles.forEach(role => {
        role.permissions.forEach(p => allPermissions.add(p));
    });

    userAdditionalPermissions.forEach(p => allPermissions.add(p));

    const hasPermission = (permission: string, scope?: string): boolean => {
        if (allPermissions.has(permission)) return true;

        const parts = permission.split('.');
        if (parts.length >= 2) {
        const wildcard = `${parts[0]}.*`;
        if (allPermissions.has(wildcard)) return true;
        }

        if (scope) {
        if (allPermissions.has(`${permission}.${scope}`)) return true;
        }

        return false;
    };

    return {
        hasPermission,

        hasAnyPermission: (permissions: string[]) =>
        permissions.some(p => hasPermission(p)),

        hasAllPermissions: (permissions: string[]) =>
        permissions.every(p => hasPermission(p)),

        hasRole: (roleName: string) =>
        userRoles.some(role => role.name === roleName),

        hasAnyRole: (roleNames: string[]) =>
        roleNames.some(roleName =>
            userRoles.some(role => role.name === roleName)
        ),
    };
    }

  // ================ Utility Methods ================

  /**
   * Format permission display name
   */
  private formatPermissionDisplayName(permission: string): string {
    const parts = permission.split('.');
    
    if (parts.length === 2) {
      const [module, action] = parts;
      const actionDisplay = action.charAt(0).toUpperCase() + action.slice(1);
      const moduleDisplay = module.charAt(0).toUpperCase() + module.slice(1);
      return `${actionDisplay} ${moduleDisplay}`;
    }
    
    return permission.split('.').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ');
  }

  /**
   * Get permission categories
   */
  getPermissionCategories(): Array<{
    id: string;
    name: string;
    displayName: string;
    description?: string;
  }> {
    return [
      {
        id: 'users',
        name: 'users',
        displayName: 'User Management',
        description: 'Manage users, roles, and permissions'
      },
      {
        id: 'dashboard',
        name: 'dashboard',
        displayName: 'Dashboard',
        description: 'Access to dashboard features'
      },
      {
        id: 'leads',
        name: 'leads',
        displayName: 'Leads',
        description: 'Manage leads and prospects'
      },
      {
        id: 'opportunities',
        name: 'opportunities',
        displayName: 'Opportunities',
        description: 'Manage sales opportunities'
      },
      {
        id: 'quotes',
        name: 'quotes',
        displayName: 'Quotes',
        description: 'Create and manage quotes'
      },
      {
        id: 'sales_orders',
        name: 'sales_orders',
        displayName: 'Sales Orders',
        description: 'Manage sales orders'
      },
      {
        id: 'work_orders',
        name: 'work_orders',
        displayName: 'Work Orders',
        description: 'Manage work orders and jobs'
      },
      {
        id: 'inventory',
        name: 'inventory',
        displayName: 'Inventory',
        description: 'Manage inventory and stock'
      },
      {
        id: 'reports',
        name: 'reports',
        displayName: 'Reports',
        description: 'Generate and view reports'
      },
      {
        id: 'settings',
        name: 'settings',
        displayName: 'Settings',
        description: 'System settings and configuration'
      }
    ];
  }

  /**
   * Get default system roles
   */
  getDefaultRoles(): RoleCreationData[] {
    return [
      {
        name: 'admin',
        display_name: 'Administrator',
        description: 'Full system access with all permissions',
        category: 'system',
        employee_type: 'admin',
        permissions: ['*'], // Wildcard for all permissions
        active: true
      },
      {
        name: 'sales_manager',
        display_name: 'Sales Manager',
        description: 'Manage sales team and oversee all sales activities',
        category: 'sales',
        employee_type: 'manager',
        permissions: [
          'leads.*',
          'opportunities.*',
          'quotes.*',
          'sales_orders.*',
          'dashboard.view',
          'reports.view'
        ],
        active: true
      },
      {
        name: 'sales_rep',
        display_name: 'Sales Representative',
        description: 'Manage own leads, opportunities, and quotes',
        category: 'sales',
        employee_type: 'sales',
        permissions: [
          'leads.create',
          'leads.read.own',
          'leads.update.own',
          'opportunities.create',
          'opportunities.read.own',
          'opportunities.update.own',
          'quotes.create',
          'quotes.read.own',
          'quotes.update.own',
          'dashboard.view'
        ],
        active: true
      },
      {
        name: 'technical_manager',
        display_name: 'Technical Manager',
        description: 'Oversee all technical operations and team',
        category: 'technical',
        employee_type: 'manager',
        permissions: [
          'work_orders.*',
          'inventory.*',
          'dashboard.view',
          'reports.view'
        ],
        active: true
      },
      {
        name: 'technician',
        display_name: 'Technician',
        description: 'Perform technical work and update job status',
        category: 'technical',
        employee_type: 'technician',
        permissions: [
          'work_orders.read.assigned',
          'work_orders.update.assigned',
          'dashboard.view'
        ],
        active: true
      }
    ];
  }

  /**
   * Get role categories for dropdowns
   */
  getRoleCategories(): Array<{ id: string; name: string; description: string }> {
    return [
      { id: 'system', name: 'System', description: 'System administration roles' },
      { id: 'sales', name: 'Sales', description: 'Sales and business development roles' },
      { id: 'technical', name: 'Technical', description: 'Technical and operational roles' },
      { id: 'management', name: 'Management', description: 'Management and supervisory roles' },
      { id: 'finance', name: 'Finance', description: 'Financial and accounting roles' },
      { id: 'support', name: 'Support', description: 'Customer support roles' }
    ];
  }

  /**
   * Get employee types for dropdowns
   */
  getEmployeeTypes(): Array<{ id: string; name: string; description: string }> {
    return [
      { id: 'admin', name: 'Admin', description: 'System administrator' },
      { id: 'manager', name: 'Manager', description: 'Team or department manager' },
      { id: 'sales', name: 'Sales', description: 'Sales representative' },
      { id: 'technician', name: 'Technician', description: 'Technical staff' },
      { id: 'support', name: 'Support', description: 'Customer support staff' },
      { id: 'finance', name: 'Finance', description: 'Financial staff' }
    ];
  }
}

// Export singleton instance
export const roleService = new RoleService();

// ================ Permission Constants ================
// You can use these constants in your components for consistent permission checking

export const PERMISSIONS = {
  // User Management
  USERS_CREATE: 'users.create',
  USERS_READ: 'users.read',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  USERS_READ_ALL: 'users.read.all',
  USERS_UPDATE_ALL: 'users.update.all',
  
  // Roles & Permissions
  ROLES_CREATE: 'roles.create',
  ROLES_READ: 'roles.read',
  ROLES_UPDATE: 'roles.update',
  ROLES_DELETE: 'roles.delete',
  ROLES_ASSIGN: 'roles.assign',
  
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',
  DASHBOARD_EXPORT: 'dashboard.export',
  
  // Leads
  LEADS_CREATE: 'leads.create',
  LEADS_READ: 'leads.read',
  LEADS_UPDATE: 'leads.update',
  LEADS_DELETE: 'leads.delete',
  LEADS_READ_ALL: 'leads.read.all',
  LEADS_UPDATE_ALL: 'leads.update.all',
  LEADS_ASSIGN: 'leads.assign',
  
  // Opportunities
  OPPORTUNITIES_CREATE: 'opportunities.create',
  OPPORTUNITIES_READ: 'opportunities.read',
  OPPORTUNITIES_UPDATE: 'opportunities.update',
  OPPORTUNITIES_DELETE: 'opportunities.delete',
  OPPORTUNITIES_READ_ALL: 'opportunities.read.all',
  OPPORTUNITIES_UPDATE_ALL: 'opportunities.update.all',
  
  // Quotes
  QUOTES_CREATE: 'quotes.create',
  QUOTES_READ: 'quotes.read',
  QUOTES_UPDATE: 'quotes.update',
  QUOTES_DELETE: 'quotes.delete',
  QUOTES_READ_ALL: 'quotes.read.all',
  QUOTES_UPDATE_ALL: 'quotes.update.all',
  QUOTES_APPROVE: 'quotes.approve',
  QUOTES_CONVERT: 'quotes.convert',
  
  // Sales Orders
  SALES_ORDERS_CREATE: 'sales_orders.create',
  SALES_ORDERS_READ: 'sales_orders.read',
  SALES_ORDERS_UPDATE: 'sales_orders.update',
  SALES_ORDERS_DELETE: 'sales_orders.delete',
  SALES_ORDERS_READ_ALL: 'sales_orders.read.all',
  SALES_ORDERS_UPDATE_ALL: 'sales_orders.update.all',
  
  // Work Orders
  WORK_ORDERS_CREATE: 'work_orders.create',
  WORK_ORDERS_READ: 'work_orders.read',
  WORK_ORDERS_UPDATE: 'work_orders.update',
  WORK_ORDERS_DELETE: 'work_orders.delete',
  WORK_ORDERS_READ_ALL: 'work_orders.read.all',
  WORK_ORDERS_UPDATE_ALL: 'work_orders.update.all',
  WORK_ORDERS_ASSIGN: 'work_orders.assign',
  WORK_ORDERS_COMPLETE: 'work_orders.complete',
  
  // Inventory
  INVENTORY_CREATE: 'inventory.create',
  INVENTORY_READ: 'inventory.read',
  INVENTORY_UPDATE: 'inventory.update',
  INVENTORY_DELETE: 'inventory.delete',
  INVENTORY_READ_ALL: 'inventory.read.all',
  INVENTORY_UPDATE_ALL: 'inventory.update.all',
  
  // Reports
  REPORTS_GENERATE: 'reports.generate',
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',
  
  // Settings
  SETTINGS_READ: 'settings.read',
  SETTINGS_UPDATE: 'settings.update',
  
  // Audit
  AUDIT_LOGS_VIEW: 'audit_logs.view',
  
  // Notifications
  NOTIFICATIONS_SEND: 'notifications.send',
  NOTIFICATIONS_READ_ALL: 'notifications.read.all',
};

export const ROLE_NAMES = {
  ADMIN: 'admin',
  SALES_MANAGER: 'sales_manager',
  SALES_REP: 'sales_rep',
  TECHNICAL_MANAGER: 'technical_manager',
  TECHNICIAN: 'technician',
  FINANCE_MANAGER: 'finance_manager',
  SUPPORT_AGENT: 'support_agent',
};

// ================ Permission Check Hooks ================
// You can create React hooks using this service in a separate file

export const usePermissions = (userRoles: Role[], additionalPermissions: string[] = []) => {
  return roleService.createPermissionChecker(userRoles, additionalPermissions);
};

// ================ Sample Usage in Components ================
/*
// Example 1: Checking permissions
const { hasPermission } = roleService.createPermissionChecker(userRoles, additionalPermissions);

if (hasPermission(PERMISSIONS.USERS_CREATE)) {
  // Show create user button
}

// Example 2: Fetching all roles
const roles = await roleService.getAllRoles({ active: true, category: 'sales' });

// Example 3: Assigning role to user
await roleService.assignRoleToUser({
  userId: '123',
  roleName: ROLE_NAMES.SALES_REP
});

// Example 4: Getting permissions by category
const groupedPermissions = await roleService.getPermissionsByCategory();
*/