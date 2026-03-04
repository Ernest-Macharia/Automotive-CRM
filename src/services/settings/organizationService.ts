import { apiClient } from '@/lib/api/client';

// ============ INTERFACES ============

export interface OrganizationTier {
  name: string;
  displayName: string;
  description?: string;
  price: number;
  maxUsers: number;
  maxStorage?: string;
  features: string[];
}

export interface OrganizationBranding {
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  favicon?: string;
}

export interface OrganizationSettings {
  allowUserRegistration?: boolean;
  requireEmailVerification?: boolean;
  twoFactorAuth?: boolean;
  sessionTimeout?: number;
  customDomain?: string;
  branding?: OrganizationBranding;
  allowedDomains?: string[];
  dataIsolation?: {
    enabled: boolean;
    strictMode: boolean;
  };
  notifications?: {
    email: boolean;
    slack?: boolean;
    webhook?: string;
  };
}

export interface Organization {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  email: string;
  description?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  website?: string;
  logo?: string;
  industry?: string;
  status: 'active' | 'suspended' | 'inactive';
  tier: string;
  plan?: string;
  maxUsers: number;
  currentUsers?: number;
  settings?: OrganizationSettings;
  ownerId?: string;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOrganizationData {
  name: string;
  email: string;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  website?: string;
  industry?: string;
  tier?: string;
  plan?: string;
  description?: string;
}

export interface UpdateOrganizationData {
  name?: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  website?: string;
  industry?: string;
  logo?: string;
  status?: 'active' | 'suspended' | 'inactive';
  tier?: string;
  plan?: string;
  maxUsers?: number;
}

export interface OrganizationListResponse {
  organizations: Organization[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrganizationFilters {
  status?: 'active' | 'suspended' | 'inactive';
  tier?: string;
  industry?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UpgradeTierData {
  targetTier: string;
  subscriptionPlanId?: string;
  reason?: string;
  billingCycle?: 'monthly' | 'yearly';
}

export interface UpgradeCostResponse {
  targetTier: string;
  currentTier: string;
  proratedAmount: number;
  totalAmount: number;
  billingCycle: string;
  effectiveDate: string;
}

export interface CanAddUserResponse {
  canAdd: boolean;
  currentUsers: number;
  maxUsers: number;
  availableSlots: number;
}

export interface InviteUserData {
  email: string;
  roleName: string;
  message?: string;
}

export interface AcceptInvitationData {
  name: string;
  email: string;
  password: string;
}

export interface OrganizationStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalWorkOrders?: number;
  openWorkOrders?: number;
  completedWorkOrders?: number;
  totalQuotes?: number;
  approvedQuotes?: number;
  totalLeads?: number;
  conversionRate?: number;
  storageUsed?: string;
  apiCalls?: number;
  createdAt?: string;
  lastActive?: string;
}

export interface SuspendOrganizationData {
  reason: string;
}

export class OrganizationError extends Error {
  code: string;
  status?: number;

  constructor(message: string, code: string, status?: number) {
    super(message);
    this.name = 'OrganizationError';
    this.code = code;
    this.status = status;
  }
}

// ============ SERVICE CLASS ============

class OrganizationService {
  /**
   * Create a new organization (Superadmin only)
   * POST /api/v1/organizations
   */
  async createOrganization(data: CreateOrganizationData): Promise<{
    organization: Organization;
    owner: {
      id: string;
      customId?: string;
      name: string;
      email: string;
      role: string;
    };
  }> {
    try {
      const response = await apiClient.post<CreateOrganizationData, any>(
        '/organizations',
        data
      );
      return {
        organization: this.normalizeOrganization(response.organization),
        owner: response.owner
      };
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  }

  /**
   * List all organizations (Superadmin only)
   * GET /api/v1/organizations
   */
  async getAllOrganizations(filters?: OrganizationFilters): Promise<OrganizationListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            queryParams.append(key, String(value));
          }
        });
      }
      
      const url = `/organizations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiClient.get<any>(url);
      
      // Handle both paginated and non-paginated responses
      if (response.organizations) {
        return {
          organizations: response.organizations.map((org: any) => this.normalizeOrganization(org)),
          total: response.total || response.organizations.length,
          page: response.page || 1,
          limit: response.limit || 20,
          totalPages: response.totalPages || 1
        };
      } else {
        // Non-paginated response
        return {
          organizations: response.map((org: any) => this.normalizeOrganization(org)),
          total: response.length,
          page: 1,
          limit: response.length,
          totalPages: 1
        };
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
      throw error;
    }
  }

  /**
   * Get organization by ID (Superadmin or Org Admin)
   * GET /api/v1/organizations/{id}
   */
  async getOrganizationById(id: string): Promise<Organization> {
    try {
      const response = await apiClient.get<any>(`/organizations/${id}`);
      return this.normalizeOrganization(response);
    } catch (error: any) {
      console.error(`Error fetching organization ${id}:`, error);
      
      // Check if it's an ApiError with organization-specific message
      if (error.status === 403) {
        if (error.message?.includes('does not belong in this organization') || 
            error.code === 'USER_NOT_IN_ORGANIZATION') {
          throw new OrganizationError(
            'User does not belong in this organization',
            'USER_NOT_IN_ORGANIZATION',
            403
          );
        }
      }
      
      throw error;
    }
  }

  /**
   * Get organization by slug (Public)
   * GET /api/v1/organizations/slug/{slug}
   */
  async getOrganizationBySlug(slug: string): Promise<Organization> {
    try {
      const response = await apiClient.get<any>(`/organizations/slug/${slug}`);
      return this.normalizeOrganization(response);
    } catch (error) {
      console.error(`Error fetching organization by slug ${slug}:`, error);
      throw error;
    }
  }

  /**
   * Get organizations by owner (Superadmin or Owner)
   * GET /api/v1/organizations/owner/{ownerId}
   */
  async getOrganizationsByOwner(ownerId: string): Promise<Organization[]> {
    try {
      const response = await apiClient.get<any[]>(`/organizations/owner/${ownerId}`);
      return response.map(org => this.normalizeOrganization(org));
    } catch (error) {
      console.error(`Error fetching organizations for owner ${ownerId}:`, error);
      throw error;
    }
  }

  /**
   * Update organization (Superadmin only)
   * PUT /api/v1/organizations/{id}
   */
  async updateOrganization(id: string, data: UpdateOrganizationData): Promise<Organization> {
    try {
      const response = await apiClient.put<UpdateOrganizationData, any>(
        `/organizations/${id}`,
        data
      );
      return this.normalizeOrganization(response);
    } catch (error) {
      console.error(`Error updating organization ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update organization settings (Organization Admin only)
   * PATCH /api/v1/organizations/{id}/settings
   */
  async updateOrganizationSettings(id: string, settings: OrganizationSettings): Promise<Organization> {
    try {
      const response = await apiClient.patch<OrganizationSettings, any>(
        `/organizations/${id}/settings`,
        settings
      );
      return this.normalizeOrganization(response);
    } catch (error: any) {
      console.error(`Error updating organization settings ${id}:`, error);
      
      if (error.status === 403) {
        if (error.message?.includes('does not belong in this organization') || 
            error.code === 'USER_NOT_IN_ORGANIZATION') {
          throw new OrganizationError(
            'User does not belong in this organization',
            'USER_NOT_IN_ORGANIZATION',
            403
          );
        }
      }
      
      throw error;
    }
  }

  /**
   * Delete organization (Superadmin only)
   * DELETE /api/v1/organizations/{id}
   */
  async deleteOrganization(id: string): Promise<{ message: string }> {
    try {
      return await apiClient.delete<{ message: string }>(`/organizations/${id}`);
    } catch (error) {
      console.error(`Error deleting organization ${id}:`, error);
      throw error;
    }
  }

  /**
   * Upgrade organization tier (Superadmin only)
   * POST /api/v1/organizations/{id}/upgrade-tier
   */
  async upgradeTier(id: string, data: UpgradeTierData): Promise<Organization> {
    try {
      const response = await apiClient.post<UpgradeTierData, any>(
        `/organizations/${id}/upgrade-tier`,
        data
      );
      return this.normalizeOrganization(response);
    } catch (error) {
      console.error(`Error upgrading tier for organization ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get available tiers
   * GET /api/v1/organizations/tiers/available
   */
  async getAvailableTiers(): Promise<OrganizationTier[]> {
    try {
      const response = await apiClient.get<OrganizationTier[]>('/organizations/tiers/available');
      return response;
    } catch (error) {
      console.error('Error fetching available tiers:', error);
      throw error;
    }
  }

  /**
   * Check if organization can add more users (Org Admin)
   * GET /api/v1/organizations/{id}/can-add-user
   */
  async canAddUser(id: string): Promise<CanAddUserResponse> {
    try {
      return await apiClient.get<CanAddUserResponse>(`/organizations/${id}/can-add-user`);
    } catch (error) {
      console.error(`Error checking user limit for organization ${id}:`, error);
      throw error;
    }
  }

  /**
   * Calculate upgrade cost (Superadmin or Org Admin)
   * GET /api/v1/organizations/{id}/upgrade-cost/{targetTier}
   */
  async calculateUpgradeCost(
    id: string,
    targetTier: string,
    billingCycle: string
  ): Promise<UpgradeCostResponse> {
    try {
      return await apiClient.get<UpgradeCostResponse>(
        `/organizations/${id}/upgrade-cost/${targetTier}?billingCycle=${billingCycle}`
      );
    } catch (error) {
      console.error(`Error calculating upgrade cost for organization ${id}:`, error);
      throw error;
    }
  }

  /**
   * Invite user to organization (Organization Admin only)
   * POST /api/v1/organizations/{id}/invite
   */
  async inviteUser(id: string, data: InviteUserData): Promise<{ message: string; invitationId: string }> {
    try {
      return await apiClient.post<InviteUserData, any>(
        `/organizations/${id}/invite`,
        data
      );
    } catch (error: any) {
      console.error(`Error inviting user to organization ${id}:`, error);
      
      if (error.status === 403) {
        if (error.message?.includes('does not belong in this organization') || 
            error.code === 'USER_NOT_IN_ORGANIZATION') {
          throw new OrganizationError(
            'User does not belong in this organization',
            'USER_NOT_IN_ORGANIZATION',
            403
          );
        }
      }
      
      throw error;
    }
  }

  /**
   * Accept organization invitation
   * POST /api/v1/organizations/invitations/accept/{token}
   */
  async acceptInvitation(token: string, data: AcceptInvitationData): Promise<{
    organization: Organization;
    user: any;
  }> {
    try {
      const response = await apiClient.post<AcceptInvitationData, any>(
        `/organizations/invitations/accept/${token}`,
        data
      );
      return {
        organization: this.normalizeOrganization(response.organization),
        user: response.user
      };
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }

  /**
   * Get organization users (Organization Admin or Superadmin)
   * GET /api/v1/organizations/{id}/users
   */
  async getOrganizationUsers(id: string): Promise<any[]> {
    try {
      const response = await apiClient.get<any[]>(`/organizations/${id}/users`);
      return response;
    } catch (error: any) {
      console.error(`Error fetching users for organization ${id}:`, error);
      
      if (error.status === 403) {
        if (error.message?.includes('does not belong in this organization') || 
            error.code === 'USER_NOT_IN_ORGANIZATION') {
          throw new OrganizationError(
            'User does not belong in this organization',
            'USER_NOT_IN_ORGANIZATION',
            403
          );
        }
      }
      
      throw error;
    }
  }

  /**
   * Get organization statistics (Organization Admin or Superadmin)
   * GET /api/v1/organizations/{id}/stats
   */
  async getOrganizationStats(id: string): Promise<OrganizationStats> {
    try {
      return await apiClient.get<OrganizationStats>(`/organizations/${id}/stats`);
    } catch (error) {
      console.error(`Error fetching stats for organization ${id}:`, error);
      if (error.status === 403) {
        if (error.message?.includes('does not belong in this organization') || 
            error.code === 'USER_NOT_IN_ORGANIZATION') {
          throw new OrganizationError(
            'User does not belong in this organization',
            'USER_NOT_IN_ORGANIZATION',
            403
          );
        }
      }
      throw error;
    }
  }

  /**
   * Suspend organization (Superadmin only)
   * POST /api/v1/organizations/{id}/suspend
   */
  async suspendOrganization(id: string, data: SuspendOrganizationData): Promise<Organization> {
    try {
      const response = await apiClient.post<SuspendOrganizationData, any>(
        `/organizations/${id}/suspend`,
        data
      );
      return this.normalizeOrganization(response);
    } catch (error) {
      console.error(`Error suspending organization ${id}:`, error);
      if (error.status === 403) {
        if (error.message?.includes('does not belong in this organization') || 
            error.code === 'USER_NOT_IN_ORGANIZATION') {
          throw new OrganizationError(
            'User does not belong in this organization',
            'USER_NOT_IN_ORGANIZATION',
            403
          );
        }
      }
      throw error;
    }
  }

  /**
   * Activate organization (Superadmin only)
   * POST /api/v1/organizations/{id}/activate
   */
  async activateOrganization(id: string): Promise<Organization> {
    try {
      const response = await apiClient.post<any, any>(`/organizations/${id}/activate`, {});
      return this.normalizeOrganization(response);
    } catch (error) {
      console.error(`Error activating organization ${id}:`, error);
      if (error.status === 403) {
        if (error.message?.includes('does not belong in this organization') || 
            error.code === 'USER_NOT_IN_ORGANIZATION') {
          throw new OrganizationError(
            'User does not belong in this organization',
            'USER_NOT_IN_ORGANIZATION',
            403
          );
        }
      }
      throw error;
    }
  }

  /**
   * Normalize organization data from backend
   */
  private normalizeOrganization(data: any): Organization {
    return {
      id: data._id || data.id,
      _id: data._id,
      name: data.name || '',
      slug: data.slug || this.generateSlug(data.name),
      email: data.email || '',
      description: data.description,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      website: data.website,
      logo: data.logo,
      industry: data.industry,
      status: data.status || 'active',
      tier: data.tier || 'basic',
      plan: data.plan,
      maxUsers: data.maxUsers || 25,
      currentUsers: data.currentUsers,
      settings: data.settings,
      ownerId: data.ownerId,
      owner: data.owner,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
  }

  /**
   * Generate slug from organization name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '-');
  }

  // ============ HELPER METHODS ============

  /**
   * Get active organizations only
   */
  async getActiveOrganizations(): Promise<Organization[]> {
    try {
      const response = await this.getAllOrganizations({ status: 'active' });
      return response.organizations;
    } catch (error) {
      console.error('Error fetching active organizations:', error);
      throw error;
    }
  }

  /**
   * Search organizations
   */
  async searchOrganizations(searchTerm: string): Promise<Organization[]> {
    try {
      const response = await this.getAllOrganizations({ search: searchTerm });
      return response.organizations;
    } catch (error) {
      console.error('Error searching organizations:', error);
      throw error;
    }
  }

  /**
   * Get organization by email domain
   */
  async getOrganizationByEmailDomain(email: string): Promise<Organization | null> {
    try {
      const domain = email.split('@')[1];
      const organizations = await this.getAllOrganizations();
      
      // Find organization with matching allowed domain
      for (const org of organizations.organizations) {
        const allowedDomains = org.settings?.allowedDomains || [];
        if (allowedDomains.some(d => domain.includes(d.replace('@', '')))) {
          return org;
        }
      }
      return null;
    } catch (error) {
      console.error('Error finding organization by email domain:', error);
      return null;
    }
  }

  /**
   * Get organization status badge color
   */
  getStatusBadgeColor(status: string): string {
    const colors: Record<string, string> = {
      'active': 'bg-green-500/10 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
      'suspended': 'bg-red-500/10 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
      'inactive': 'bg-gray-500/10 text-gray-700 border-gray-200 dark:bg-gray-700/50 dark:text-gray-300 dark:border-gray-600',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300';
  }

  /**
   * Get tier badge color
   */
  getTierBadgeColor(tier: string): string {
    const colors: Record<string, string> = {
      'basic': 'bg-gray-500/10 text-gray-700 border-gray-200 dark:bg-gray-700/50 dark:text-gray-300',
      'pro': 'bg-blue-500/10 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
      'enterprise': 'bg-purple-500/10 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400',
      'premium': 'bg-amber-500/10 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400',
    };
    return colors[tier?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Format organization for select dropdown
   */
  formatOrganizationForSelect(organization: Organization): { value: string; label: string } {
    return {
      value: organization.id,
      label: `${organization.name} (${organization.slug})`
    };
  }

  /**
   * Get organizations for select dropdown
   */
  async getOrganizationsForSelect(): Promise<Array<{ value: string; label: string }>> {
    try {
      const response = await this.getAllOrganizations({ status: 'active' });
      return response.organizations.map(org => this.formatOrganizationForSelect(org));
    } catch (error) {
      console.error('Error getting organizations for select:', error);
      throw error;
    }
  }

  /**
   * Get organization statistics summary
   */
  async getOrganizationStatistics(): Promise<{
    total: number;
    active: number;
    suspended: number;
    inactive: number;
    byTier: Record<string, number>;
    byIndustry: Record<string, number>;
    totalUsers: number;
    averageUsersPerOrg: number;
  }> {
    try {
      const response = await this.getAllOrganizations();
      const organizations = response.organizations;
      
      const byTier: Record<string, number> = {};
      const byIndustry: Record<string, number> = {};
      let totalUsers = 0;
      let active = 0;
      let suspended = 0;
      let inactive = 0;
      
      organizations.forEach(org => {
        const tier = org.tier || 'basic';
        byTier[tier] = (byTier[tier] || 0) + 1;
        
        if (org.industry) {
          byIndustry[org.industry] = (byIndustry[org.industry] || 0) + 1;
        }
        
        if (org.status === 'active') active++;
        else if (org.status === 'suspended') suspended++;
        else inactive++;
        
        totalUsers += org.currentUsers || 0;
      });
      
      return {
        total: organizations.length,
        active,
        suspended,
        inactive,
        byTier,
        byIndustry,
        totalUsers,
        averageUsersPerOrg: organizations.length ? Math.round(totalUsers / organizations.length) : 0
      };
    } catch (error) {
      console.error('Error calculating organization statistics:', error);
      throw error;
    }
  }

  /**
   * Check if user can manage organization
   */
  canManageOrganization(user: any, organization: Organization): boolean {
    // Superadmin can manage all organizations
    if (user.role === 'superadmin') return true;
    
    // Organization admin can manage their own organization
    if (user.role === 'admin' && user.organizationId === organization.id) return true;
    
    // Owner can manage their organization
    if (organization.ownerId === user.id) return true;
    
    return false;
  }

  /**
   * Check if user can view organization
   */
  canViewOrganization(user: any, organization: Organization): boolean {
    // Superadmin can view all
    if (user.role === 'superadmin') return true;
    
    // Users can view their own organization
    if (user.organizationId === organization.id) return true;
    
    return false;
  }

  /**
   * Get organization display name with tier
   */
  getOrganizationDisplayName(organization: Organization): string {
    const tier = organization.tier ? ` (${organization.tier})` : '';
    return `${organization.name}${tier}`;
  }

  /**
   * Get organization usage percentage
   */
  getOrganizationUsagePercentage(organization: Organization): number {
    if (!organization.maxUsers) return 0;
    const current = organization.currentUsers || 0;
    return Math.min(Math.round((current / organization.maxUsers) * 100), 100);
  }

  /**
   * Check if organization is at user limit
   */
  isAtUserLimit(organization: Organization): boolean {
    const current = organization.currentUsers || 0;
    return current >= organization.maxUsers;
  }

  /**
   * Get available user slots
   */
  getAvailableUserSlots(organization: Organization): number {
    const current = organization.currentUsers || 0;
    return Math.max(organization.maxUsers - current, 0);
  }

  /**
   * Format organization creation date
   */
  formatCreationDate(organization: Organization): string {
    if (!organization.createdAt) return 'N/A';
    
    try {
      return new Date(organization.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  }
}

export const organizationService = new OrganizationService();

// ============ CONSTANTS ============

export const ORGANIZATION_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  INACTIVE: 'inactive'
} as const;

export const ORGANIZATION_TIERS = {
  BASIC: 'basic',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
  PREMIUM: 'premium'
} as const;

export const BILLING_CYCLES = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly'
} as const;

export const ORGANIZATION_PERMISSIONS = {
  // Organization management
  ORGS_CREATE: 'organizations.create',
  ORGS_READ: 'organizations.read',
  ORGS_UPDATE: 'organizations.update',
  ORGS_DELETE: 'organizations.delete',
  
  // Organization settings
  ORGS_SETTINGS: 'organizations.settings',
  ORGS_UPGRADE: 'organizations.upgrade',
  ORGS_SUSPEND: 'organizations.suspend',
  ORGS_ACTIVATE: 'organizations.activate',
  
  // User management within organization
  ORGS_INVITE_USERS: 'organizations.invite_users',
  ORGS_MANAGE_USERS: 'organizations.manage_users',
  
  // Organization data
  ORGS_VIEW_STATS: 'organizations.view_stats',
  ORGS_VIEW_USERS: 'organizations.view_users'
} as const;

// Default organization tiers with features
export const DEFAULT_ORGANIZATION_TIERS: OrganizationTier[] = [
  {
    name: ORGANIZATION_TIERS.BASIC,
    displayName: 'Basic',
    description: 'For small teams getting started',
    price: 0,
    maxUsers: 25,
    maxStorage: '10GB',
    features: [
      'Up to 25 users',
      'Basic reporting',
      'Email support',
      '10GB storage'
    ]
  },
  {
    name: ORGANIZATION_TIERS.PRO,
    displayName: 'Professional',
    description: 'For growing businesses',
    price: 99,
    maxUsers: 100,
    maxStorage: '50GB',
    features: [
      'Up to 100 users',
      'Advanced analytics',
      'Priority support',
      '50GB storage',
      'API access',
      'Custom branding'
    ]
  },
  {
    name: ORGANIZATION_TIERS.ENTERPRISE,
    displayName: 'Enterprise',
    description: 'For large organizations',
    price: 499,
    maxUsers: 500,
    maxStorage: '200GB',
    features: [
      'Up to 500 users',
      'Custom reports',
      '24/7 phone support',
      '200GB storage',
      'Advanced API',
      'SSO integration',
      'SLA guarantee'
    ]
  },
  {
    name: ORGANIZATION_TIERS.PREMIUM,
    displayName: 'Premium',
    description: 'For enterprise with custom needs',
    price: 999,
    maxUsers: 1000,
    maxStorage: '1TB',
    features: [
      'Unlimited users',
      'Custom development',
      'Dedicated account manager',
      '1TB+ storage',
      'On-premise option',
      'Custom integrations',
      'Advanced security'
    ]
  }
];

// Helper function to create an organization permission checker
export const createOrganizationPermissionChecker = (user: any) => {
  return {
    canCreate: () => user.role === 'superadmin',
    canUpdate: (organization: Organization) => 
      user.role === 'superadmin' || 
      (user.role === 'admin' && user.organizationId === organization.id) ||
      organization.ownerId === user.id,
    canDelete: () => user.role === 'superadmin',
    canManageSettings: (organization: Organization) =>
      user.role === 'superadmin' || 
      (user.role === 'admin' && user.organizationId === organization.id) ||
      organization.ownerId === user.id,
    canUpgradeTier: () => user.role === 'superadmin',
    canSuspend: () => user.role === 'superadmin',
    canActivate: () => user.role === 'superadmin',
    canInviteUsers: (organization: Organization) =>
      user.role === 'superadmin' || 
      (user.role === 'admin' && user.organizationId === organization.id) ||
      organization.ownerId === user.id,
    canViewStats: (organization: Organization) =>
      user.role === 'superadmin' || 
      user.organizationId === organization.id,
    canView: (organization: Organization) =>
      user.role === 'superadmin' || 
      user.organizationId === organization.id,
  };
};
