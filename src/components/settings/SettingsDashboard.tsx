// apps/settings/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Settings,
  Shield,
  Workflow,
  Layers,
  Grid,
  ShieldCheck,
  Sparkles,
  CheckCircle,
  Activity,
  Search,
  ChevronRight,
  X,
  RefreshCw,
  BookOpen,
  HelpCircle,
  Headphones,
  BarChart,
  Database,
  Key,
  Bell,
  Globe,
  FileText,
  Cpu,
  Zap,
  Server,
  Palette,
  Network,
  Building2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { userService } from '@/services/settings/userService';
import { organizationService } from '@/services/settings/organizationService';
import { blueprintsService } from '@/services/settings/blueprintsService';
import { workflowService } from '@/services/settings/workflowService';
import { roleService } from '@/services/settings/roleService';
import { profileService } from '@/services/settings/profileService';
import { authService } from '@/services/authService';

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  href: string;
  color: string;
  gradient: string;
  badge?: number | string;
  description?: string;
  category: string;
  featured: boolean;
  visible?: boolean;
}

interface ServiceStatus {
  users: boolean;
  organizations: boolean;
  blueprints: boolean;
  workflows: boolean;
  permissions: boolean;
  profiles: boolean;
}

const SettingsCardSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
    <div className="flex items-start justify-between mb-3">
      <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
      <div className="h-5 w-12 bg-gray-200 rounded-full"></div>
    </div>
    <div className="h-4 w-40 bg-gray-200 rounded mb-2"></div>
    <div className="h-8 w-full bg-gray-200 rounded mb-3"></div>
    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
      <div className="h-3 w-16 bg-gray-200 rounded"></div>
      <div className="h-3 w-3 rounded-full"></div>
    </div>
  </div>
);

const StatsCardSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-4 w-20 bg-gray-200 rounded"></div>
        <div className="h-6 w-14 bg-gray-200 rounded"></div>
      </div>
      <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
    </div>
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="h-3 w-24 bg-gray-200 rounded"></div>
    </div>
  </div>
);

const CategorySkeleton = () => (
  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 animate-pulse">
    <div className="h-4 w-4 bg-gray-300 rounded"></div>
    <div className="h-4 w-20 bg-gray-300 rounded"></div>
    <div className="h-4 w-6 bg-gray-300 rounded-full"></div>
  </div>
);

const ErrorBanner = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
    <div className="flex items-center gap-3">
      <AlertCircle className="h-5 w-5 text-red-500" />
      <p className="text-sm text-red-700 flex-1">{message}</p>
      <button
        onClick={onRetry}
        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
      >
        Retry
      </button>
    </div>
  </div>
);

export default function SettingsDashboard() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [userStats, setUserStats] = useState<{ total: number; active: number }>({ total: 0, active: 0 });
  const [organizationsStats, setOrganizationsStats] = useState<{ total: number; active: number }>({ total: 0, active: 0 });
  const [blueprintsCount, setBlueprintsCount] = useState(0);
  const [workflowsCount, setWorkflowsCount] = useState(0);
  const [permissionsCount, setPermissionsCount] = useState(0);
  const [profilesCount, setProfilesCount] = useState(0);
  
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>({
    users: false,
    organizations: false,
    blueprints: false,
    workflows: false,
    permissions: false,
    profiles: false
  });

  const authUser = useMemo(() => authService.getUser() as any, []);

  const normalizedRole = useMemo(() => {
    const rawRole = authUser?.role;
    return typeof rawRole === 'string'
      ? rawRole.toLowerCase()
      : String(rawRole?.name || authUser?.roleName || '').toLowerCase();
  }, [authUser]);

  const effectivePermissions = useMemo(
    () =>
      Array.from(
        new Set([
          ...(Array.isArray(authUser?.permissions) ? authUser.permissions : []),
          ...(Array.isArray(authUser?.rolePermissions) ? authUser.rolePermissions : []),
          ...(Array.isArray(authUser?.additionalPermissions) ? authUser.additionalPermissions : []),
          ...(Array.isArray(authUser?.directPermissions) ? authUser.directPermissions : []),
        ]),
      ),
    [authUser],
  );

  const hasPermission = (permission: string): boolean => {
    if (effectivePermissions.includes('*') || effectivePermissions.includes('system.*')) {
      return true;
    }

    if (effectivePermissions.includes(permission)) {
      return true;
    }

    const [moduleName] = permission.split('.');
    return Boolean(moduleName && effectivePermissions.includes(`${moduleName}.*`));
  };

  const hasAnyPermission = (permissions: string[]): boolean =>
    permissions.some((permission) => hasPermission(permission));

  const canAccessOrganizations =
    normalizedRole === 'superadmin' ||
    hasAnyPermission(['organization.manage', 'organizations.read.all']) ||
    Boolean(authUser?.organizationId || authUser?.organization?._id || authUser?.organization?.id);
  const canAccessUsers =
    hasAnyPermission(['users.read.organization', 'users.read.all', 'team.manage']) ||
    ['superadmin', 'admin', 'management', 'branch_manager', 'fleet_manager', 'finance', 'compliance', 'hr_manager', 'hr_officer', 'hr_recruiter'].includes(normalizedRole);
  const canAccessWorkflows =
    hasAnyPermission(['workflows.read']) ||
    ['superadmin', 'admin', 'management'].includes(normalizedRole);
  const canAccessBlueprints =
    hasAnyPermission(['blueprints.read']) ||
    ['superadmin', 'admin', 'management', 'branch_manager', 'fleet_manager', 'finance', 'compliance', 'developer'].includes(normalizedRole);
  const canAccessPermissions =
    hasAnyPermission(['roles.manage']) ||
    ['superadmin', 'admin', 'management'].includes(normalizedRole);
  const canAccessProfiles =
    hasAnyPermission(['profiles.view.all', 'profile.view.all', 'profile.update.organization', 'profiles.update.hr']) ||
    ['superadmin', 'admin', 'management', 'hr_manager', 'hr_officer', 'hr_recruiter'].includes(normalizedRole);

  // Load data with timeout and error handling
  const loadDataWithTimeout = async <T,>(
    promise: Promise<T>,
    timeoutMs: number = 5000
  ): Promise<T | null> => {
    try {
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
      });
      
      const result = await Promise.race([promise, timeoutPromise]);
      return result;
    } catch (error) {
      console.warn('Service request failed:', error);
      return null;
    }
  };

  useEffect(() => {
    loadRealData();
  }, []);

  const loadRealData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const newServiceStatus: ServiceStatus = {
        users: !canAccessUsers,
        organizations: !canAccessOrganizations,
        blueprints: !canAccessBlueprints,
        workflows: !canAccessWorkflows,
        permissions: !canAccessPermissions,
        profiles: !canAccessProfiles,
      };
      
      // Load user statistics with timeout
      if (canAccessUsers) {
        try {
          const userStatsData = await loadDataWithTimeout(userService.getUserStatistics());
          if (userStatsData) {
            setUserStats({
              total: (userStatsData as any)?.total || 0,
              active: (userStatsData as any)?.active || 0
            });
            newServiceStatus.users = true;
          }
        } catch (userError) {
          console.error('Error loading user stats:', userError);
          setUserStats({ total: 0, active: 0 });
        }
      } else {
        setUserStats({ total: 0, active: 0 });
      }
      
      // Load organization statistics with timeout
      if (canAccessOrganizations) {
        try {
        const authUser = authService.getUser() as any;
        const rawRole = authUser?.role;
        const userRole =
          typeof rawRole === 'string'
            ? rawRole.toLowerCase()
            : String(rawRole?.name || '').toLowerCase();
        const organizationId =
          authUser?.organizationId ||
          authUser?.organization?._id ||
          authUser?.organization?.id;

        if (userRole === 'superadmin') {
          const orgStats = await loadDataWithTimeout(organizationService.getOrganizationStatistics());
          if (orgStats) {
            setOrganizationsStats({
              total: (orgStats as any)?.total || 0,
              active: (orgStats as any)?.active || 0
            });
            newServiceStatus.organizations = true;
          }
        } else if (organizationId) {
          const organization = await loadDataWithTimeout(
            organizationService.getOrganizationById(String(organizationId))
          );
          if (organization) {
            const normalizedOrg = organization as any;
            setOrganizationsStats({
              total: 1,
              active: normalizedOrg.status === 'active' ? 1 : 0
            });
            newServiceStatus.organizations = true;
          }
        }
        } catch (orgError) {
          console.error('Error loading organization stats:', orgError);
          setOrganizationsStats({ total: 0, active: 0 });
        }
      } else {
        setOrganizationsStats({ total: 0, active: 0 });
      }
      
      // Load blueprints count
      if (canAccessBlueprints) {
        try {
          const blueprintsResponse = await loadDataWithTimeout(blueprintsService.getBlueprints());
          if (blueprintsResponse) {
            let blueprintsData: any[] = [];
            if (Array.isArray(blueprintsResponse)) {
              blueprintsData = blueprintsResponse;
            }
            setBlueprintsCount(blueprintsData.length);
            newServiceStatus.blueprints = true;
          }
        } catch (blueprintsError) {
          console.error('Error loading blueprints:', blueprintsError);
          setBlueprintsCount(0);
        }
      } else {
        setBlueprintsCount(0);
      }
      
      // Load workflows count
      if (canAccessWorkflows) {
        try {
          const workflowsResponse = await loadDataWithTimeout(workflowService.getAllWorkflows());
          if (workflowsResponse) {
            let workflowsData: any[] = [];
            if (Array.isArray(workflowsResponse)) {
              workflowsData = workflowsResponse;
            } else if (workflowsResponse?.data && Array.isArray(workflowsResponse.data)) {
              workflowsData = workflowsResponse.data;
            }
            setWorkflowsCount(workflowsData.length);
            newServiceStatus.workflows = true;
          }
        } catch (workflowsError) {
          console.error('Error loading workflows:', workflowsError);
          setWorkflowsCount(0);
        }
      } else {
        setWorkflowsCount(0);
      }
      
      // Load permissions count
      if (canAccessPermissions) {
        try {
          const permissionsResponse = await loadDataWithTimeout(roleService.getAllPermissions());
          if (permissionsResponse) {
            let permissionsList: any[] = [];
            if (Array.isArray(permissionsResponse)) {
              permissionsList = permissionsResponse;
            } else if (permissionsResponse?.permissions && Array.isArray(permissionsResponse.permissions)) {
              permissionsList = permissionsResponse.permissions;
            }
            setPermissionsCount(permissionsList.length);
            newServiceStatus.permissions = true;
          }
        } catch (permissionsError) {
          console.error('Error loading permissions:', permissionsError);
          setPermissionsCount(0);
        }
      } else {
        setPermissionsCount(0);
      }

      // Load profiles count
      if (canAccessProfiles) {
        try {
          const profiles = await loadDataWithTimeout(profileService.getProfiles());
          if (profiles) {
            setProfilesCount(profiles.length);
            newServiceStatus.profiles = true;
          }
        } catch (profilesError) {
          console.error('Error loading profiles count:', profilesError);
          setProfilesCount(0);
        }
      } else {
        setProfilesCount(0);
      }

      setServiceStatus(newServiceStatus);
      
      // Check if all services failed
      const anyServiceWorking = Object.values(newServiceStatus).some(status => status);
      if (!anyServiceWorking) {
        setError('Unable to load settings data. Please try again later.');
      }
      
    } catch (error) {
      console.error('Error loading real data:', error);
      setError('Failed to load settings data');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', label: 'All Settings', icon: Grid, count: 19 },
    { id: 'featured', label: 'Most Used', icon: Sparkles, count: 6 },
    { id: 'administration', label: 'Administration', icon: Users, count: 7 },
    { id: 'automation', label: 'Automation', icon: Workflow, count: 4 },
    { id: 'security', label: 'Security', icon: ShieldCheck, count: 4 },
    { id: 'customization', label: 'Customization', icon: Palette, count: 2 },
    { id: 'communication', label: 'Communication', icon: Bell, count: 2 },
  ];

  // Get menu items dynamically based on fetched data
  const getMenuItems = useMemo((): MenuItem[] => [
    {
      id: 'organizations',
      label: 'Organizations',
      icon: Building2,
      href: '/settings/organizations',
      color: 'text-emerald-600',
      gradient: 'from-emerald-500 to-teal-500',
      badge: organizationsStats.total || 0,
      description: 'Manage organizations, subscriptions, and multi-tenant settings',
      category: 'administration',
      featured: true,
      visible: canAccessOrganizations,
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      href: '/settings/users',
      color: 'text-purple-600',
      gradient: 'from-purple-500 to-pink-500',
      badge: userStats.total,
      description: 'Manage system users, roles and permissions',
      category: 'administration',
      featured: true,
      visible: canAccessUsers,
    },
    {
      id: 'workflows',
      label: 'Workflow Automation',
      icon: Workflow,
      href: '/settings/workflows',
      color: 'text-pink-600',
      gradient: 'from-pink-500 to-rose-500',
      badge: workflowsCount,
      description: 'Create and manage automated workflows',
      category: 'automation',
      featured: true,
      visible: canAccessWorkflows,
    },
    {
      id: 'blueprints',
      label: 'Process Blueprints',
      icon: Layers,
      href: '/settings/blueprints',
      color: 'text-blue-600',
      gradient: 'from-blue-500 to-indigo-500',
      badge: blueprintsCount,
      description: 'Design and configure process templates',
      category: 'automation',
      featured: true,
      visible: canAccessBlueprints,
    },
    {
      id: 'permissions',
      label: 'Permissions Management',
      icon: Shield,
      href: '/settings/permissions',
      color: 'text-indigo-600',
      gradient: 'from-indigo-500 to-blue-500',
      badge: permissionsCount,
      description: 'Configure role-based access control and permissions',
      category: 'security',
      featured: true,
      visible: canAccessPermissions,
    },
    {
      id: 'profiles',
      label: 'Employee Profiles',
      icon: Users,
      href: '/settings/profiles',
      color: 'text-purple-600',
      gradient: 'from-purple-500 to-pink-500',
      badge: profilesCount,
      description: 'Manage employee profiles and information',
      category: 'administration',
      featured: true,
      visible: canAccessProfiles,
    },
    {
      id: 'system',
      label: 'System Settings',
      icon: Server,
      href: '/settings/system',
      color: 'text-gray-600',
      gradient: 'from-gray-500 to-gray-700',
      description: 'General system configuration and preferences',
      category: 'administration',
      featured: false,
    },
    {
      id: 'appearance',
      label: 'Appearance',
      icon: Palette,
      href: '/settings/appearance',
      color: 'text-teal-600',
      gradient: 'from-teal-500 to-emerald-500',
      description: 'Customize themes, layouts, and UI settings',
      category: 'customization',
      featured: false,
    },
    {
      id: 'integrations',
      label: 'Integrations',
      icon: Network,
      href: '/settings/integrations',
      color: 'text-orange-600',
      gradient: 'from-orange-500 to-amber-500',
      description: 'Manage third-party integrations and APIs',
      category: 'automation',
      featured: false,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      href: '/settings/notifications',
      color: 'text-yellow-600',
      gradient: 'from-yellow-500 to-amber-500',
      description: 'Configure email, SMS, and push notifications',
      category: 'communication',
      featured: false,
    }
  ], [
    userStats.total,
    organizationsStats.total,
    workflowsCount,
    blueprintsCount,
    permissionsCount,
    profilesCount,
    canAccessOrganizations,
    canAccessUsers,
    canAccessWorkflows,
    canAccessBlueprints,
    canAccessPermissions,
    canAccessProfiles,
  ]);

  const featuredItems = useMemo(
    () => getMenuItems.filter(item => item.featured && item.visible !== false),
    [getMenuItems],
  );
  
  const filteredMenuItems = useMemo(() => {
    return getMenuItems.filter(item => {
      if (item.visible === false) {
        return false;
      }

      const matchesSearch = !searchQuery || 
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = activeCategory === 'all' 
        ? true
        : activeCategory === 'featured'
        ? item.featured
        : item.category === activeCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory, getMenuItems]);

  const quickActions = useMemo(
    () =>
      [
        {
          id: 'add-user',
          label: 'Add User',
          icon: Users,
          color: 'border-purple-200 text-purple-700 hover:bg-purple-50',
          visible: canAccessUsers,
        },
        {
          id: 'add-organization',
          label: 'Add Organization',
          icon: Building2,
          color: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50',
          visible: canAccessOrganizations,
        },
        {
          id: 'create-workflow',
          label: 'Create Workflow',
          icon: Workflow,
          color: 'border-pink-200 text-pink-700 hover:bg-pink-50',
          visible: canAccessWorkflows,
        },
        {
          id: 'view-analytics',
          label: 'View Analytics',
          icon: BarChart,
          color: 'border-blue-200 text-blue-700 hover:bg-blue-50',
          visible: true,
        },
      ].filter((item) => item.visible !== false),
    [canAccessOrganizations, canAccessUsers, canAccessWorkflows],
  );

  const statsCards = useMemo(
    () =>
      [
        {
          id: 'organizations',
          label: 'Organizations',
          value: organizationsStats.total,
          icon: Building2,
          href: '/settings/organizations',
          color: 'bg-emerald-100 text-emerald-600',
          visible: canAccessOrganizations,
        },
        {
          id: 'users',
          label: 'Users',
          value: userStats.total,
          icon: Users,
          href: '/settings/users',
          color: 'bg-purple-100 text-purple-600',
          visible: canAccessUsers,
        },
        {
          id: 'workflows',
          label: 'Workflows',
          value: workflowsCount,
          icon: Workflow,
          href: '/settings/workflows',
          color: 'bg-pink-100 text-pink-600',
          visible: canAccessWorkflows,
        },
        {
          id: 'permissions',
          label: 'Permissions',
          value: permissionsCount,
          icon: Shield,
          href: '/settings/permissions',
          color: 'bg-indigo-100 text-indigo-600',
          visible: canAccessPermissions,
        },
      ].filter((item) => item.visible !== false),
    [
      organizationsStats.total,
      userStats.total,
      workflowsCount,
      permissionsCount,
      canAccessOrganizations,
      canAccessUsers,
      canAccessWorkflows,
      canAccessPermissions,
    ],
  );

  const simulateRefresh = async () => {
    setRefreshing(true);
    try {
      await loadRealData();
      showToast('Data refreshed successfully', 'success');
    } catch (error) {
      console.error('Error refreshing data:', error);
      showToast('Failed to refresh data', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleQuickAction = (action: string) => {
    switch(action) {
      case 'add-user':
        router.push('/settings/users?action=create');
        break;
      case 'create-workflow':
        router.push('/settings/workflows?action=create');
        break;
      case 'add-organization':
        router.push('/settings/organizations/create');
        break;
      case 'view-analytics':
        router.push('/settings/analytics');
        break;
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Search skeleton */}
        <div className="mb-6 max-w-2xl">
          <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>

        {/* Quick actions skeleton */}
        <div className="mb-8">
          <div className="h-4 w-24 bg-gray-200 rounded mb-3 animate-pulse"></div>
          <div className="flex gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 w-28 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>

        {/* Category filters skeleton */}
        <div className="mb-8">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(i => (
              <CategorySkeleton key={i} />
            ))}
          </div>
        </div>

        {/* Featured settings skeleton */}
        <div className="mb-8">
          <div className="h-6 w-32 bg-gray-200 rounded mb-4 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SettingsCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings Dashboard</h1>
            <p className="text-gray-600 mt-1">Configure and manage your core system settings</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              Operational
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <ErrorBanner message={error} onRetry={simulateRefresh} />
        )}

        {/* Search */}
        <div className="mb-6 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search all settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action.id)}
                  className={`inline-flex items-center gap-2 px-3 py-2 bg-white border rounded-lg text-sm font-medium ${action.color}`}
                >
                  <Icon className="h-4 w-4" />
                  {action.label}
                </button>
              );
            })}
            <button
              onClick={simulateRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.id}
              href={stat.href}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-2.5 ${stat.color} rounded-lg`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Category Filters */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  activeCategory === category.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {category.label}
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                  activeCategory === category.id
                    ? 'bg-blue-200 text-blue-800'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {category.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Featured Settings */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Core Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 bg-gradient-to-br ${item.gradient} bg-opacity-10 rounded-lg`}>
                    <Icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
                <h3 className="font-medium text-gray-900 mb-1">{item.label}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                <div className="flex items-center text-sm text-blue-600 font-medium">
                  Configure
                  <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* All Settings */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">All Settings</h2>
          {filteredMenuItems.length > 0 && (
            <span className="text-sm text-gray-500">
              {filteredMenuItems.length} settings
            </span>
          )}
        </div>

        {filteredMenuItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No settings found</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {searchQuery 
                ? `No settings match "${searchQuery}". Try a different term.`
                : 'No settings in this category.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Icon className="h-5 w-5 text-gray-600" />
                    </div>
                    {item.badge !== undefined && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">{item.label}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Help */}
      {/* <div className="pt-8 border-t border-gray-200">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Need help?</h3>
            <p className="text-gray-600 mb-4">
              Our documentation covers everything from basic configuration to advanced customization.
            </p>
            <div className="flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
                <BookOpen className="h-4 w-4" />
                Documentation
              </button>
              <button className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                <Headphones className="h-4 w-4" />
                Support
              </button>
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <h4 className="font-medium text-gray-900 mb-3">Quick Tips</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Start with <strong>Organizations</strong> for multi-tenant setup</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Use <strong>User Management</strong> to control access</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Automate tasks with <strong>Workflows</strong></span>
              </li>
            </ul>
          </div>
        </div>
      </div> */}
    </div>
  );
}
