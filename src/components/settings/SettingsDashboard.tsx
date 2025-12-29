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
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { userService } from '@/services/settings/userService';
import { blueprintsService } from '@/services/settings/blueprintsService';
import { workflowService } from '@/services/settings/workflowService';
import { roleService } from '@/services/settings/roleService';

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
}

// Skeleton Loading Components
const SettingsCardSkeleton = () => (
  <div className="bg-gradient-to-br from-white to-blue-50/30 border border-blue-100 rounded-xl p-5 animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="h-12 w-12 bg-gradient-to-r from-blue-200 to-purple-200 rounded-lg"></div>
      <div className="h-6 w-16 bg-blue-100 rounded-full"></div>
    </div>
    <div className="h-5 w-48 bg-gray-300/50 rounded mb-3"></div>
    <div className="h-10 w-full bg-gray-300/50 rounded mb-4"></div>
    <div className="flex items-center justify-between pt-4 border-t border-blue-100">
      <div className="h-4 w-20 bg-gray-300/50 rounded"></div>
      <div className="h-4 w-4 bg-gray-300/50 rounded"></div>
    </div>
  </div>
);

const StatsCardSkeleton = () => (
  <div className="bg-white rounded-2xl p-5 border border-gray-200/50 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="space-y-3">
        <div className="h-4 w-24 bg-gray-300/50 rounded"></div>
        <div className="h-8 w-16 bg-gray-300/50 rounded"></div>
      </div>
      <div className="h-12 w-12 bg-gradient-to-r from-blue-200 to-purple-200 rounded-xl"></div>
    </div>
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="h-3 w-32 bg-gray-300/50 rounded"></div>
    </div>
  </div>
);

const CategorySkeleton = () => (
  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 animate-pulse">
    <div className="h-4 w-4 bg-gray-300/50 rounded"></div>
    <div className="h-4 w-24 bg-gray-300/50 rounded"></div>
    <div className="h-4 w-8 bg-gray-300/50 rounded-full"></div>
  </div>
);

const FeaturedSettingsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 rounded-2xl p-6 animate-pulse">
        <div className="absolute top-0 right-0 p-2">
          <div className="h-8 w-8 bg-blue-100 rounded-lg"></div>
        </div>
        <div className="h-6 w-48 bg-gray-300/50 rounded mb-3"></div>
        <div className="h-12 w-full bg-gray-300/50 rounded mb-4"></div>
        <div className="h-4 w-32 bg-gray-300/50 rounded"></div>
      </div>
    ))}
  </div>
);

export default function SettingsDashboard() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Real data states
  const [userStats, setUserStats] = useState<{ total: number; active: number }>({ total: 0, active: 0 });
  const [blueprintsCount, setBlueprintsCount] = useState(0);
  const [workflowsCount, setWorkflowsCount] = useState(0);
  const [permissionsCount, setPermissionsCount] = useState(0);
  const [stats, setStats] = useState({
    health: 98.5,
    activeSettings: 0,
    recentChanges: 0,
    pendingActions: 0,
  });

  useEffect(() => {
    loadRealData();
  }, []);

  const loadRealData = async () => {
    try {
      setLoading(true);
      
      // Load user statistics
      try {
        const userStatsData = await userService.getUserStatistics();
        console.log('User stats:', userStatsData);
        setUserStats({
          total: (userStatsData as any)?.total || 0,
          active: (userStatsData as any)?.active || 0
        });
      } catch (userError) {
        console.error('Error loading user stats:', userError);
        setUserStats({ total: 0, active: 0 });
      }
      
      // Load blueprints count
      try {
        const blueprintsResponse = await blueprintsService.getBlueprints();
        console.log('Blueprints response:', blueprintsResponse);
        
        // Handle different response structures with proper type assertions
        let blueprintsData: any[] = [];
        
        if (Array.isArray(blueprintsResponse)) {
          blueprintsData = blueprintsResponse;
        } else if (blueprintsResponse && typeof blueprintsResponse === 'object') {
          // Try different possible property names
          if ('data' in blueprintsResponse && Array.isArray(blueprintsResponse)) {
            blueprintsData = blueprintsResponse;
          } else if ('blueprints' in blueprintsResponse && Array.isArray((blueprintsResponse as any).blueprints)) {
            blueprintsData = (blueprintsResponse as any).blueprints;
          } else if ('items' in blueprintsResponse && Array.isArray((blueprintsResponse as any).items)) {
            blueprintsData = (blueprintsResponse as any).items;
          }
        }
        
        setBlueprintsCount(blueprintsData.length);
      } catch (blueprintsError) {
        console.error('Error loading blueprints:', blueprintsError);
        setBlueprintsCount(0);
      }
      
      // Load workflows count  
      try {
        const workflowsResponse = await workflowService.getAllWorkflows();
        console.log('Workflows response:', workflowsResponse);
        
        // Handle different response structures with proper type assertions
        let workflowsData: any[] = [];
        
        if (Array.isArray(workflowsResponse)) {
          workflowsData = workflowsResponse;
        } else if (workflowsResponse && typeof workflowsResponse === 'object') {
          // Try different possible property names
          if ('data' in workflowsResponse && Array.isArray(workflowsResponse.data)) {
            workflowsData = workflowsResponse.data;
          } else if ('workflows' in workflowsResponse && Array.isArray((workflowsResponse as any).workflows)) {
            workflowsData = (workflowsResponse as any).workflows;
          } else if ('items' in workflowsResponse && Array.isArray((workflowsResponse as any).items)) {
            workflowsData = (workflowsResponse as any).items;
          }
        }
        
        setWorkflowsCount(workflowsData.length);
      } catch (workflowsError) {
        console.error('Error loading workflows:', workflowsError);
        setWorkflowsCount(0);
      }
      
      // Load permissions count
      try {
        const permissionsResponse = await roleService.getAllPermissions();
        console.log('Permissions response:', permissionsResponse);
        
        // Handle different response structures with proper type assertions
        let permissionsList: any[] = [];
        
        if (Array.isArray(permissionsResponse)) {
          permissionsList = permissionsResponse;
        } else if (permissionsResponse && typeof permissionsResponse === 'object') {
          // Try different possible property names
          if ('permissions' in permissionsResponse && Array.isArray((permissionsResponse as any).permissions)) {
            permissionsList = (permissionsResponse as any).permissions;
          } else if ('data' in permissionsResponse && Array.isArray((permissionsResponse as any).data)) {
            permissionsList = (permissionsResponse as any).data;
          } else if ('items' in permissionsResponse && Array.isArray((permissionsResponse as any).items)) {
            permissionsList = (permissionsResponse as any).items;
          }
        }
        
        setPermissionsCount(permissionsList.length);
      } catch (permissionsError) {
        console.error('Error loading permissions:', permissionsError);
        setPermissionsCount(0);
      }
      
      // Calculate active settings
      const activeSettingsTotal = 
        (userStats.total || 0) + 
        blueprintsCount + 
        workflowsCount + 
        permissionsCount;
      
      setStats(prev => ({
        ...prev,
        activeSettings: activeSettingsTotal,
      }));
      
    } catch (error) {
      console.error('Error loading real data:', error);
      showToast('Failed to load settings data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', label: 'All Settings', icon: Grid, count: 18 },
    { id: 'featured', label: 'Most Used', icon: Sparkles, count: 4 },
    { id: 'administration', label: 'Administration', icon: Users, count: 6 },
    { id: 'automation', label: 'Automation', icon: Workflow, count: 4 },
    { id: 'security', label: 'Security', icon: ShieldCheck, count: 4 },
    { id: 'customization', label: 'Customization', icon: Palette, count: 2 },
    { id: 'communication', label: 'Communication', icon: Bell, count: 2 },
  ];

  // Get menu items dynamically based on fetched data
  const getMenuItems = useMemo((): MenuItem[] => [
    // Featured - Most Used
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
    },
    // Additional Settings
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
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart,
      href: '/settings/analytics',
      color: 'text-green-600',
      gradient: 'from-green-500 to-emerald-500',
      description: 'View system metrics and usage statistics',
      category: 'administration',
      featured: false,
    },
    {
      id: 'database',
      label: 'Database',
      icon: Database,
      href: '/settings/database',
      color: 'text-red-600',
      gradient: 'from-red-500 to-rose-500',
      description: 'Database configuration and maintenance',
      category: 'administration',
      featured: false,
    },
    {
      id: 'security',
      label: 'Security',
      icon: ShieldCheck,
      href: '/settings/security',
      color: 'text-blue-600',
      gradient: 'from-blue-500 to-cyan-500',
      description: 'Security policies, audit logs, and compliance',
      category: 'security',
      featured: false,
    },
    {
      id: 'api-keys',
      label: 'API Keys',
      icon: Key,
      href: '/settings/api-keys',
      color: 'text-violet-600',
      gradient: 'from-violet-500 to-purple-500',
      description: 'Manage API access keys and tokens',
      category: 'security',
      featured: false,
    },
    {
      id: 'internationalization',
      label: 'Internationalization',
      icon: Globe,
      href: '/settings/internationalization',
      color: 'text-cyan-600',
      gradient: 'from-cyan-500 to-blue-500',
      description: 'Language, currency, and regional settings',
      category: 'customization',
      featured: false,
    },
    {
      id: 'templates',
      label: 'Templates',
      icon: FileText,
      href: '/settings/templates',
      color: 'text-amber-600',
      gradient: 'from-amber-500 to-orange-500',
      description: 'Email, document, and message templates',
      category: 'communication',
      featured: false,
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: Zap,
      href: '/settings/performance',
      color: 'text-emerald-600',
      gradient: 'from-emerald-500 to-green-500',
      description: 'Performance optimization and caching',
      category: 'administration',
      featured: false,
    },
    {
      id: 'backups',
      label: 'Backups',
      icon: Database,
      href: '/settings/backups',
      color: 'text-rose-600',
      gradient: 'from-rose-500 to-pink-500',
      description: 'Backup configuration and restoration',
      category: 'security',
      featured: false,
    },
    {
      id: 'system-logs',
      label: 'System Logs',
      icon: Cpu,
      href: '/settings/system-logs',
      color: 'text-slate-600',
      gradient: 'from-slate-500 to-gray-500',
      description: 'View and analyze system activity logs',
      category: 'administration',
      featured: false,
    },
  ], [userStats.total, workflowsCount, blueprintsCount, permissionsCount]);

  const featuredItems = useMemo(() => getMenuItems.filter(item => item.featured), [getMenuItems]);

  const filteredMenuItems = useMemo(() => {
    return getMenuItems.filter(item => {
      const matchesSearch = searchQuery === '' || 
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
      case 'view-analytics':
        router.push('/settings/analytics');
        break;
    }
  };

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Dashboard Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Settings Dashboard</h2>
            <p className="text-gray-600 mt-1">Configure and manage your core system settings</p>
          </div>
          
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="h-10 w-48 bg-gray-300/50 rounded-lg"></div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-blue-200 text-blue-700 rounded-lg text-sm">
                <Activity className="h-4 w-4" />
                <span className="font-medium">System Status:</span>
                <span className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  Operational
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search all settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        {!loading && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleQuickAction('add-user')}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 hover:from-purple-100 hover:to-pink-100 rounded-xl text-sm font-medium transition-all border border-purple-200"
              >
                <Users className="h-4 w-4" />
                Add New User
              </button>
              <button
                onClick={() => handleQuickAction('create-workflow')}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-50 to-rose-50 text-pink-700 hover:from-pink-100 hover:to-rose-100 rounded-xl text-sm font-medium transition-all border border-pink-200"
              >
                <Workflow className="h-4 w-4" />
                Create Workflow
              </button>
              <button
                onClick={() => handleQuickAction('view-analytics')}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 hover:from-blue-100 hover:to-indigo-100 rounded-xl text-sm font-medium transition-all border border-blue-200"
              >
                <BarChart className="h-4 w-4" />
                View Analytics
              </button>
              <button
                onClick={simulateRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium transition-all border border-gray-300"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh Data'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards with Real Data */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Total Users',
              value: userStats.total,
              icon: Users,
              gradient: 'from-purple-500 to-pink-500',
              trend: `${userStats.active} active`,
              trendColor: 'text-green-600',
              href: '/settings/users',
            },
            {
              label: 'Workflows',
              value: workflowsCount,
              icon: Workflow,
              gradient: 'from-pink-500 to-rose-500',
              trend: 'Automated processes',
              trendColor: 'text-gray-600',
              href: '/settings/workflows',
            },
            {
              label: 'Blueprints',
              value: blueprintsCount,
              icon: Layers,
              gradient: 'from-blue-500 to-indigo-500',
              trend: 'Process templates',
              trendColor: 'text-gray-600',
              href: '/settings/blueprints',
            },
            {
              label: 'Permissions',
              value: permissionsCount,
              icon: Shield,
              gradient: 'from-indigo-500 to-blue-500',
              trend: 'Access controls',
              trendColor: 'text-gray-600',
              href: '/settings/permissions',
            },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Link
                href={stat.href}
                key={index}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-blue-100/50 hover:shadow-lg transition-all group block"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.gradient}/10 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-6 w-6 text-gray-700" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-blue-100">
                  <div className={`text-xs ${stat.trendColor} font-medium flex items-center justify-between`}>
                    <span>{stat.trend}</span>
                    <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Category Filters */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Categories</h3>
          {loading ? (
            <div className="h-4 w-32 bg-gray-300/50 rounded"></div>
          ) : (
            <div className="text-xs text-gray-500">
              {filteredMenuItems.length} of {getMenuItems.length} settings
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {loading ? (
            Array.from({ length: 7 }).map((_, i) => (
              <CategorySkeleton key={i} />
            ))
          ) : (
            categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeCategory === category.id
                      ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200 text-blue-700 shadow-sm'
                      : 'bg-white text-gray-700 hover:bg-blue-50 border border-blue-100 hover:border-blue-200'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${
                    activeCategory === category.id ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                  {category.label}
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                    activeCategory === category.id
                      ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700'
                      : 'bg-blue-50 text-blue-600'
                  }`}>
                    {category.count}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Featured Settings */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          Core Settings
        </h3>
        {loading ? (
          <FeaturedSettingsSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {featuredItems.map((item) => {
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`group relative bg-gradient-to-br from-white to-blue-50/30 border-2 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 overflow-hidden border-blue-200 hover:border-blue-400`}
                >
                  <div className="absolute top-0 right-0 p-2">
                    <div className={`p-1.5 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 group-hover:from-blue-100 group-hover:to-purple-100`}>
                      <Icon className={`h-4 w-4 text-blue-500 group-hover:text-blue-600`} />
                    </div>
                  </div>
                  
                  <div>
                    <div className={`text-lg font-semibold mb-2 text-gray-900`}>
                      {item.label}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">
                      {item.description}
                    </p>
                    
                    {item.badge !== undefined && (
                      <div className="flex items-center gap-1 mb-3">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        <span className="text-xs text-blue-600 font-medium">
                          {item.badge} {item.badge === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                    )}
                    
                    <div className={`flex items-center text-sm font-medium text-gray-500 group-hover:text-blue-600`}>
                      <span>Configure now</span>
                      <ChevronRight className="h-4 w-4 ml-1.5 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* All Settings Grid */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">All Settings</h3>
          {!loading && filteredMenuItems.length > 0 && (
            <div className="text-sm text-gray-500">
              Showing {filteredMenuItems.length} settings
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SettingsCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`group relative bg-gradient-to-br from-white to-blue-50/30 border rounded-xl p-5 hover:shadow-lg transition-all duration-200 overflow-hidden border-blue-100 hover:border-blue-300`}
                >
                  {/* Top Badges */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-2.5 rounded-lg bg-gradient-to-r ${item.gradient}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    
                    {item.badge !== undefined && (
                      <span className="px-2 py-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-700 text-xs font-medium rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  
                  {/* Content */}
                  <h3 className={`text-base font-semibold mb-2 text-gray-900`}>
                    {item.label}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {item.description}
                  </p>
                  
                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-blue-100">
                    <div className={`text-sm font-medium text-gray-500 group-hover:text-blue-600`}>
                      Configure
                    </div>
                    <ChevronRight className={`h-4 w-4 text-blue-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform`} />
                  </div>
                  
                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-purple-500/0 group-hover:via-blue-500/5 group-hover:to-purple-500/10 transition-all duration-300 pointer-events-none" />
                </Link>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredMenuItems.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No settings found</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {searchQuery 
                ? `No settings match your search for "${searchQuery}". Try a different term or browse by category.`
                : 'No settings available in this category.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>

      {/* Help Section */}
      {!loading && (
        <div className="mt-12 pt-8 border-t border-blue-200">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-blue-500" />
                Need help with core settings?
              </h3>
              <p className="text-gray-600 mb-6">
                Our documentation covers everything from basic configuration to advanced customization for your core system modules.
              </p>
              <div className="flex flex-wrap gap-3">
                <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:from-blue-100 hover:to-purple-100 rounded-xl text-sm font-medium transition-all">
                  <BookOpen className="h-4 w-4" />
                  View Documentation
                </button>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg rounded-xl text-sm font-medium transition-all">
                  <Headphones className="h-4 w-4" />
                  Contact Support
                </button>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-500" />
                Quick Tips
              </h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Start with User Management to set up your team</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Use Blueprints to define your business processes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Configure Workflows to automate repetitive tasks</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}