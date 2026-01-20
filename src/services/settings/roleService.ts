import { apiClient } from '@/lib/api/client';

export interface Role {
  id: string;
  _id?: string;
  name: string;
  display_name: string;
  description?: string;
  category: string;
  employee_type?: string;
  permissions: string[];
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserRoleAssignment {
  userId: string;
  roleName: string;
}

export interface RoleAssignmentResponse {
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

export interface PermissionsListResponse {
  permissions: string[];
}

export interface RoleFindRequest {
  name: string;
}

export interface SeedRolesResponse {
  message: string;
}

export interface PermissionCheckRequest {
  permissions: string[];
  role?: string;
}

export interface PermissionCheckResponse {
  hasAllPermissions: boolean;
  missingPermissions: string[];
  hasRole: boolean;
}

class RoleService {
  async getAllRoles(): Promise<Role[]> {
    try {
      const response = await apiClient.get<any[]>('/roles');
      return response.map(role => this.normalizeRole(role));
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  }

  async seedDefaultRoles(): Promise<SeedRolesResponse> {
    try {
      return await apiClient.post<any, SeedRolesResponse>('/roles/seed', {});
    } catch (error) {
      console.error('Error seeding default roles:', error);
      throw error;
    }
  }

  async assignRoleToUser(data: UserRoleAssignment): Promise<RoleAssignmentResponse> {
    try {
      return await apiClient.post<UserRoleAssignment, RoleAssignmentResponse>('/roles/assign', data);
    } catch (error) {
      console.error('Error assigning role to user:', error);
      throw error;
    }
  }

  async getAllPermissions(): Promise<PermissionsListResponse> {
    try {
      return await apiClient.get<PermissionsListResponse>('/roles/permissions');
    } catch (error) {
      console.error('Error fetching permissions:', error);
      throw error;
    }
  }

  async getRoleByName(name: string): Promise<Role> {
    try {
      const response = await apiClient.post<RoleFindRequest, any>('/roles/find', { name });
      return this.normalizeRole(response);
    } catch (error) {
      console.error(`Error fetching role ${name}:`, error);
      throw error;
    }
  }

  private normalizeRole(data: any): Role {
    return {
      id: data._id || data.id,
      _id: data._id,
      name: data.name,
      display_name: data.display_name,
      description: data.description,
      category: data.category,
      employee_type: data.employee_type,
      permissions: data.permissions || [],
      active: data.active !== undefined ? data.active : true,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  async getRolesForSelect(): Promise<Array<{ value: string; label: string; category: string }>> {
    try {
      const roles = await this.getAllRoles();
      return roles
        .filter(role => role.active !== false)
        .map(role => ({
          value: role.name,
          label: role.display_name || role.name,
          category: role.category
        }));
    } catch (error) {
      console.error('Error getting roles for select:', error);
      throw error;
    }
  }

  async getRolesByCategory(category: string): Promise<Role[]> {
    try {
      const roles = await this.getAllRoles();
      return roles.filter(role => role.category === category && role.active !== false);
    } catch (error) {
      console.error(`Error fetching roles for category ${category}:`, error);
      throw error;
    }
  }

  async getActiveRoles(): Promise<Role[]> {
    try {
      const roles = await this.getAllRoles();
      return roles.filter(role => role.active === true);
    } catch (error) {
      console.error('Error fetching active roles:', error);
      throw error;
    }
  }

  checkPermissions(userPermissions: string[], requiredPermissions: string | string[]): boolean {
    if (!userPermissions || userPermissions.length === 0) {
      return false;
    }

    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    
    return permissions.every(permission => {
      if (userPermissions.includes(permission)) {
        return true;
      }
      
      const parts = permission.split('.');
      if (parts.length >= 2) {
        const module = parts[0];
        const action = parts[1];
        
        if (userPermissions.includes(`${module}.*`)) {
          return true;
        }
        
        if (action === '*') {
          return userPermissions.some(p => p.startsWith(`${module}.`));
        }
      }
      
      return false;
    });
  }

  checkAnyPermission(userPermissions: string[], requiredPermissions: string | string[]): boolean {
    if (!userPermissions || userPermissions.length === 0) {
      return false;
    }

    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    
    return permissions.some(permission => {
      if (userPermissions.includes(permission)) {
        return true;
      }
      
      const parts = permission.split('.');
      if (parts.length >= 2) {
        const module = parts[0];
        
        if (userPermissions.includes(`${module}.*`)) {
          return true;
        }
      }
      
      return false;
    });
  }

  async getPermissionCategories(): Promise<string[]> {
    try {
      const { permissions } = await this.getAllPermissions();
      const categories = new Set<string>();
      
      permissions.forEach(permission => {
        const category = permission.split('.')[0];
        if (category) {
          categories.add(category);
        }
      });
      
      return Array.from(categories);
    } catch (error) {
      console.error('Error getting permission categories:', error);
      return [];
    }
  }

  async getPermissionsGrouped(): Promise<Record<string, string[]>> {
    try {
      const { permissions } = await this.getAllPermissions();
      const grouped: Record<string, string[]> = {};
      
      permissions.forEach(permission => {
        const parts = permission.split('.');
        const module = parts[0];
        
        if (!grouped[module]) {
          grouped[module] = [];
        }
        
        if (!grouped[module].includes(permission)) {
          grouped[module].push(permission);
        }
      });
      
      return grouped;
    } catch (error) {
      console.error('Error grouping permissions:', error);
      return {};
    }
  }

  formatPermission(permission: string): string {
    const parts = permission.split('.');
    if (parts.length === 2) {
      const [module, action] = parts;
      const formattedModule = module.charAt(0).toUpperCase() + module.slice(1);
      const formattedAction = action.charAt(0).toUpperCase() + action.slice(1);
      return `${formattedAction} ${formattedModule}`;
    }
    return permission.split('.').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ');
  }

  async getRoleById(id: string): Promise<Role> {
    try {
      const response = await apiClient.get<any>(`/roles/${id}`);
      return this.normalizeRole(response);
    } catch (error) {
      console.error(`Error fetching role by ID ${id}:`, error);
      throw error;
    }
  }

  async updateRolePermissions(roleName: string, permissions: string[]): Promise<Role> {
    try {
      const role = await this.getRoleByName(roleName);
      const updatedRole = {
        ...role,
        permissions
      };
      
      return await apiClient.patch<any, any>(`/roles/${role.id}`, { permissions });
    } catch (error) {
      console.error(`Error updating permissions for role ${roleName}:`, error);
      throw error;
    }
  }

  async createRole(roleData: Omit<Role, 'id' | '_id' | 'createdAt' | 'updatedAt'>): Promise<Role> {
    try {
      const response = await apiClient.post<any, any>('/roles', roleData);
      return this.normalizeRole(response);
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  }

  async updateRole(id: string, roleData: Partial<Role>): Promise<Role> {
    try {
      const response = await apiClient.patch<any, any>(`/roles/${id}`, roleData);
      return this.normalizeRole(response);
    } catch (error) {
      console.error(`Error updating role ${id}:`, error);
      throw error;
    }
  }

  async deleteRole(id: string): Promise<{ message: string }> {
    try {
      return await apiClient.delete<{ message: string }>(`/roles/${id}`);
    } catch (error) {
      console.error(`Error deleting role ${id}:`, error);
      throw error;
    }
  }

  async getAllRoleNames(): Promise<string[]> {
    try {
      const roles = await this.getAllRoles();
      return roles.map(role => role.name);
    } catch (error) {
      console.error('Error fetching role names:', error);
      throw error;
    }
  }

  async roleExists(roleName: string): Promise<boolean> {
    try {
      const roles = await this.getAllRoleNames();
      return roles.includes(roleName);
    } catch (error) {
      console.error(`Error checking if role ${roleName} exists:`, error);
      return false;
    }
  }

  getDefaultPermissions(): Record<string, string[]> {
    return {
      system: [
        'users.create',
        'users.read',
        'users.update',
        'users.delete',
        'roles.manage',
        'settings.manage',
        'summary.view',
        'dashboard.view',
      ],
      management: ['dashboard.view', 'reports.generate', 'team.manage', 'targets.set'],
      waivers: ['waivers.create', 'waivers.read', 'waivers.update', 'waivers.delete', 'waivers.sign'],
      jobcards: ['jobcards.create', 'jobcards.read', 'jobcards.update', 'jobcards.delete'],
      development: [
        'tasks.read',
        'tasks.update',
        'workflows.read',
        'logs.read',
        'deployments.read'
      ],
      sales: [
        'leads.create',
        'leads.read',
        'leads.update',
        'leads.delete',
        'opportunities.create',
        'opportunities.read',
        'opportunities.update',
        'opportunities.delete',
        'clients.read',
        'clients.update',
        'quotes.create',
        'quotes.read',
        'quotes.update',
        'quotes.delete',
        'sales.dashboard.view',
      ],
      quotes: [
        'quotes.create',
        'quotes.read',
        'quotes.update',
        'quotes.delete',
        'quotes.approve',
      ],
      invoices: [
        'invoices.create',
        'invoices.read',
        'invoices.update',
        'invoices.delete',
        'invoices.approve',
        'invoices.pay',
      ],
      technical: [
        'jobs.create',
        'jobs.read',
        'jobs.update',
        'jobs.delete',
        'vehicles.manage',
        'vehicles.create',
        'vehicles.read',
        'vehicles.update',
        'vehicles.delete',
        'maintenance.schedule',
        'maintenance.update',
      ],
      support: [
        'tickets.create',
        'tickets.read',
        'tickets.update',
        'tickets.close',
        'customer.feedback',
      ],
      contacts: [
        'contacts.create',
        'contacts.read', 
        'contacts.update',
        'contacts.delete',
      ],
      partner: ['partner.clients.read', 'partner.contracts.read', 'partner.contracts.update'],
      customer: ['customer.profile.read', 'customer.orders.view', 'customer.payments.read'],
    };
  }

  getDefaultRolesWithPermissions(): Role[] {
    const permissionMap = this.getDefaultPermissions();
    
    return [
      {
        id: 'admin',
        name: 'admin',
        display_name: 'Administrator',
        description: 'Full system access',
        category: 'system',
        employee_type: 'manager',
        permissions: [
          ...permissionMap.system,
          ...permissionMap.management,
          ...permissionMap.sales,
          ...permissionMap.technical,
          ...permissionMap.support,
          ...permissionMap.partner,
          ...permissionMap.customer,
          ...permissionMap.jobcards,
          ...permissionMap.waivers,
          ...permissionMap.contacts,
          ...permissionMap.development
        ],
        active: true,
      },
      {
        id: 'management',
        name: 'management',
        display_name: 'Management',
        description: 'Company management',
        category: 'management',
        employee_type: 'manager',
        permissions: [
          ...permissionMap.invoices,
          ...permissionMap.quotes,
          ...permissionMap.management,
          ...permissionMap.jobcards,
          ...permissionMap.waivers,
          ...permissionMap.contacts
        ],
        active: true,
      },
      {
        id: 'sales_representative',
        name: 'sales_representative',
        display_name: 'Sales Representative',
        description: 'Sales team member',
        category: 'sales',
        employee_type: 'employee',
        permissions: [...permissionMap.sales],
        active: true,
      },
      {
        id: 'technician',
        name: 'technician',
        display_name: 'Technician',
        description: 'Service technician',
        category: 'technical',
        employee_type: 'employee',
        permissions: [...permissionMap.technical],
        active: true,
      },
      {
        id: 'developer',
        name: 'developer',
        display_name: 'Developer',
        description: 'Software developer',
        category: 'Software Department',
        employee_type: 'employee',
        permissions: [...permissionMap.development],
        active: true,
      }
    ];
  }
}

export const roleService = new RoleService();

export const PERMISSIONS = {
  USERS_CREATE: 'users.create',
  USERS_READ: 'users.read',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  
  ROLES_MANAGE: 'roles.manage',
  
  SETTINGS_MANAGE: 'settings.manage',
  SUMMARY_VIEW: 'summary.view',
  DASHBOARD_VIEW: 'dashboard.view',
  
  REPORTS_GENERATE: 'reports.generate',
  TEAM_MANAGE: 'team.manage',
  TARGETS_SET: 'targets.set',
  
  LEADS_CREATE: 'leads.create',
  LEADS_READ: 'leads.read',
  LEADS_UPDATE: 'leads.update',
  LEADS_DELETE: 'leads.delete',
  OPPORTUNITIES_CREATE: 'opportunities.create',
  OPPORTUNITIES_READ: 'opportunities.read',
  OPPORTUNITIES_UPDATE: 'opportunities.update',
  OPPORTUNITIES_DELETE: 'opportunities.delete',
  CLIENTS_READ: 'clients.read',
  CLIENTS_UPDATE: 'clients.update',
  QUOTES_CREATE: 'quotes.create',
  QUOTES_READ: 'quotes.read',
  QUOTES_UPDATE: 'quotes.update',
  QUOTES_DELETE: 'quotes.delete',
  SALES_DASHBOARD_VIEW: 'sales.dashboard.view',
  
  QUOTES_APPROVE: 'quotes.approve',
  
  INVOICES_CREATE: 'invoices.create',
  INVOICES_READ: 'invoices.read',
  INVOICES_UPDATE: 'invoices.update',
  INVOICES_DELETE: 'invoices.delete',
  INVOICES_APPROVE: 'invoices.approve',
  INVOICES_PAY: 'invoices.pay',
  
  JOBS_CREATE: 'jobs.create',
  JOBS_READ: 'jobs.read',
  JOBS_UPDATE: 'jobs.update',
  JOBS_DELETE: 'jobs.delete',
  VEHICLES_MANAGE: 'vehicles.manage',
  VEHICLES_CREATE: 'vehicles.create',
  VEHICLES_READ: 'vehicles.read',
  VEHICLES_UPDATE: 'vehicles.update',
  VEHICLES_DELETE: 'vehicles.delete',
  MAINTENANCE_SCHEDULE: 'maintenance.schedule',
  MAINTENANCE_UPDATE: 'maintenance.update',
  
  TICKETS_CREATE: 'tickets.create',
  TICKETS_READ: 'tickets.read',
  TICKETS_UPDATE: 'tickets.update',
  TICKETS_CLOSE: 'tickets.close',
  CUSTOMER_FEEDBACK: 'customer.feedback',
  
  CONTACTS_CREATE: 'contacts.create',
  CONTACTS_READ: 'contacts.read',
  CONTACTS_UPDATE: 'contacts.update',
  CONTACTS_DELETE: 'contacts.delete',
  
  JOBCARDS_CREATE: 'jobcards.create',
  JOBCARDS_READ: 'jobcards.read',
  JOBCARDS_UPDATE: 'jobcards.update',
  JOBCARDS_DELETE: 'jobcards.delete',
  
  WAIVERS_CREATE: 'waivers.create',
  WAIVERS_READ: 'waivers.read',
  WAIVERS_UPDATE: 'waivers.update',
  WAIVERS_DELETE: 'waivers.delete',
  WAIVERS_SIGN: 'waivers.sign',
  
  TASKS_READ: 'tasks.read',
  TASKS_UPDATE: 'tasks.update',
  WORKFLOWS_READ: 'workflows.read',
  LOGS_READ: 'logs.read',
  DEPLOYMENTS_READ: 'deployments.read',
  
  PARTNER_CLIENTS_READ: 'partner.clients.read',
  PARTNER_CONTRACTS_READ: 'partner.contracts.read',
  PARTNER_CONTRACTS_UPDATE: 'partner.contracts.update',
  
  CUSTOMER_PROFILE_READ: 'customer.profile.read',
  CUSTOMER_ORDERS_VIEW: 'customer.orders.view',
  CUSTOMER_PAYMENTS_READ: 'customer.payments.read',
};

export const ROLES = {
  ADMIN: 'admin',
  MANAGEMENT: 'management',
  BRANCH_MANAGER: 'branch_manager',
  FLEET_MANAGER: 'fleet_manager',
  FINANCE: 'finance',
  COMPLIANCE: 'compliance',
  SALES_DIRECTOR: 'sales_director',
  SALES_MANAGER: 'sales_manager',
  SALES_LEAD: 'sales_lead',
  SALES_REPRESENTATIVE: 'sales_representative',
  ACCOUNT_EXECUTIVE: 'account_executive',
  BUSINESS_DEVELOPMENT: 'business_development',
  ENGINEER: 'engineer',
  TECHNICIAN: 'technician',
  WORKSHOP: 'workshop',
  SUPPORT: 'support',
  CUSTOMER_SERVICE: 'customer_service',
  DEALER: 'dealer',
  PARTNER: 'partner',
  INSURER: 'insurer',
  CUSTOMER: 'customer',
  DEVELOPER: 'developer',
};

export const createPermissionChecker = (userPermissions: string[]) => {
  return {
    hasPermission: (permission: string) => {
      return roleService.checkPermissions(userPermissions, permission);
    },
    hasAnyPermission: (permissions: string[]) => {
      return roleService.checkAnyPermission(userPermissions, permissions);
    },
    hasAllPermissions: (permissions: string[]) => {
      return roleService.checkPermissions(userPermissions, permissions);
    },
  };
};


