'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  ShieldPlus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Users,
  AlertCircle,
  CalendarDays,
  Lock,
  Unlock,
  FileText,
  Folder,
  Activity,
  TrendingUp,
  Sparkles,
  Grid,
  List,
  Key,
  Globe,
  Settings,
  Database,
  BarChart,
  ShoppingCart,
  Wrench,
  Phone,
  Mail,
  UserCheck,
  Download,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { roleService, PERMISSIONS, ROLES } from '@/services/settings/roleService';
import Link from 'next/link';

// Define Permission interface locally since it doesn't exist in the service
interface Permission {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  category: string;
  module: string;
  action: string;
  scope?: string;
}

interface PermissionFilters {
  category: string;
  status: string;
  search: string;
}

export default function PermissionsList() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [filteredPermissions, setFilteredPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Permission | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [filters, setFilters] = useState<PermissionFilters>({
    category: 'all',
    status: 'all',
    search: '',
  });

  const categories = [
    { id: 'all', name: 'All Categories', icon: Grid, color: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
    { id: 'users', name: 'User Management', icon: Users, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { id: 'dashboard', name: 'Dashboard', icon: BarChart, color: 'bg-gradient-to-r from-green-500 to-emerald-500' },
    { id: 'leads', name: 'Leads', icon: Phone, color: 'bg-gradient-to-r from-orange-500 to-red-500' },
    { id: 'opportunities', name: 'Opportunities', icon: TrendingUp, color: 'bg-gradient-to-r from-yellow-500 to-amber-500' },
    { id: 'quotes', name: 'Quotes', icon: FileText, color: 'bg-gradient-to-r from-cyan-500 to-blue-500' },
    { id: 'sales_orders', name: 'Sales Orders', icon: ShoppingCart, color: 'bg-gradient-to-r from-indigo-500 to-purple-500' },
    { id: 'work_orders', name: 'Work Orders', icon: Wrench, color: 'bg-gradient-to-r from-emerald-500 to-teal-500' },
    { id: 'inventory', name: 'Inventory', icon: Database, color: 'bg-gradient-to-r from-rose-500 to-pink-500' },
    { id: 'reports', name: 'Reports', icon: BarChart, color: 'bg-gradient-to-r from-violet-500 to-purple-500' },
    { id: 'settings', name: 'Settings', icon: Settings, color: 'bg-gradient-to-r from-gray-500 to-slate-500' },
  ];

  useEffect(() => {
    loadPermissions();
  }, []);

  useEffect(() => {
    filterPermissions();
  }, [permissions, filters]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      // Use getPermissionsGrouped which returns Record<string, string[]>
      const grouped = await roleService.getPermissionsGrouped();
      const allPermissions: Permission[] = [];
      
      Object.entries(grouped).forEach(([category, permissionStrings]) => {
        permissionStrings.forEach(permissionString => {
          const parts = permissionString.split('.');
          const module = parts[0];
          const action = parts[1];
          
          const permission: Permission = {
            id: permissionString,
            name: permissionString,
            displayName: roleService.formatPermission(permissionString),
            description: `Permission to ${action} ${module}`,
            category: module,
            module: module,
            action: action,
            scope: 'global'
          };
          
          allPermissions.push(permission);
        });
      });
      
      setPermissions(allPermissions);
    } catch (error) {
      console.error('Error loading permissions:', error);
      showToast('Failed to load permissions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterPermissions = () => {
    let result = [...permissions];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(permission => {
        const name = permission.name?.toLowerCase() || '';
        const displayName = permission.displayName?.toLowerCase() || '';
        const category = permission.category?.toLowerCase() || '';
        
        return (
          name.includes(searchTerm) ||
          displayName.includes(searchTerm) ||
          category.includes(searchTerm)
        );
      });
    }

    if (filters.category !== 'all') {
      result = result.filter(permission => permission.category === filters.category);
    }

    setFilteredPermissions(result);
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.icon || Folder;
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.color || 'bg-gradient-to-r from-gray-500 to-slate-500';
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create': return <UserCheck className="h-3 w-3" />;
      case 'read': return <Eye className="h-3 w-3" />;
      case 'update': return <Edit className="h-3 w-3" />;
      case 'delete': return <Trash2 className="h-3 w-3" />;
      case 'view': return <Eye className="h-3 w-3" />;
      case 'approve': return <CheckCircle className="h-3 w-3" />;
      case 'export': return <Download className="h-3 w-3" />;
      default: return <Activity className="h-3 w-3" />;
    }
  };

  const formatScope = (scope?: string) => {
    if (!scope) return 'Global';
    switch (scope) {
      case 'own': return 'Own Records';
      case 'team': return 'Team Records';
      case 'department': return 'Department';
      case 'global': return 'Global';
      default: return scope;
    }
  };

  const PermissionCard = ({ permission }: { permission: Permission }) => {
    const Icon = getCategoryIcon(permission.category);
    
    return (
      <div className="bg-gradient-to-br from-white via-white to-blue-50 dark:from-gray-800 dark:via-gray-800 dark:to-blue-900/20 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-300">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${getCategoryColor(permission.category)}`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                {permission.displayName}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                {permission.category.replace('_', ' ')} • {permission.action}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
              {formatScope(permission.scope)}
            </span>
          </div>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
          {permission.description || `Permission to ${permission.action} ${permission.category} records`}
        </p>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Identifier:</span>
            <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-mono text-gray-800 dark:text-gray-300">
              {permission.name}
            </code>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Module:</span>
            <span className="font-medium text-gray-900 dark:text-white capitalize">
              {permission.module}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Action:</span>
            <span className="font-medium text-gray-900 dark:text-white capitalize">
              {permission.action}
            </span>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/settings/permissions/${permission.id}`)}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all"
            >
              View Details
            </button>
            <button
              onClick={() => router.push(`/settings/permissions/${permission.id}/edit`)}
              className="p-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const PermissionTableRow = ({ permission }: { permission: Permission }) => {
    const Icon = getCategoryIcon(permission.category);
    
    return (
      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getCategoryColor(permission.category).replace('bg-gradient-to-r', 'bg')}`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{permission.displayName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{permission.name}</p>
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 capitalize">
            {permission.category.replace('_', ' ')}
          </span>
        </td>
        <td className="px-6 py-4">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 capitalize">
            {permission.action}
          </span>
        </td>
        <td className="px-6 py-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {formatScope(permission.scope)}
          </span>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/settings/permissions/${permission.id}`)}
              className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => router.push(`/settings/permissions/${permission.id}/edit`)}
              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(permission)}
              className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const stats = useMemo(() => ({
    total: permissions.length,
    byCategory: categories.reduce<Record<string, number>>((acc, category) => {
      acc[category.id] = permissions.filter(
        p => p.category === category.id
      ).length;
      return acc;
    }, {}),
    // Get all default permissions as a flat array
    defaultPermissions: Object.values(roleService.getDefaultPermissions()).flat(),
    custom: permissions.filter(
      p => !Object.values(roleService.getDefaultPermissions()).flat().includes(p.name)
    ).length,
    system: permissions.filter(
      p => Object.values(roleService.getDefaultPermissions()).flat().includes(p.name)
    ).length,
  }), [permissions, categories]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white truncate">Permissions Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 truncate">Manage system permissions and access controls</p>
          </div>
          
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'hover:bg-white/50 dark:hover:bg-gray-700/50'}`}
                title="Grid View"
              >
                <Grid className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'hover:bg-white/50 dark:hover:bg-gray-700/50'}`}
                title="List View"
              >
                <List className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            
            <button
              onClick={loadPermissions}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            
            <Link
              href="/settings/permissions/create"
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl whitespace-nowrap flex items-center gap-2"
            >
              <ShieldPlus className="h-5 w-5" />
              Add Permission
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm text-blue-700 dark:text-blue-400 truncate">Total Permissions</p>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-300 mt-1">{stats.total}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/20">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/20 border border-green-100 dark:border-green-800/30 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm text-green-700 dark:text-green-400 truncate">System Permissions</p>
                <p className="text-2xl font-bold text-green-800 dark:text-green-300 mt-1">{stats.system}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/20">
                <Key className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-900/20 border border-purple-100 dark:border-purple-800/30 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm text-purple-700 dark:text-purple-400 truncate">Custom Permissions</p>
                <p className="text-2xl font-bold text-purple-800 dark:text-purple-300 mt-1">{stats.custom}</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/20">
                <Settings className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-amber-50 dark:from-gray-800 dark:to-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm text-amber-700 dark:text-amber-400 truncate">Categories</p>
                <p className="text-2xl font-bold text-amber-800 dark:text-amber-300 mt-1">
                  {categories.filter(c => c.id !== 'all' && stats.byCategory[c.id] > 0).length}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/20">
                <Folder className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search permissions by name, category, or description..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent truncate"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap"
            >
              <Filter className="h-4 w-4" />
              Filters
              {showFilters ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {filteredPermissions.length} of {permissions.length} permissions
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 truncate"
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setFilters({ category: 'all', status: 'all', search: '' })}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Category Quick Filters */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilters(prev => ({ ...prev, category: 'all' }))}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filters.category === 'all'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All Categories
          </button>
          {categories
            .filter(c => c.id !== 'all' && stats.byCategory[c.id] > 0)
            .map(category => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setFilters(prev => ({ ...prev, category: category.id }))}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    filters.category === category.id
                      ? `${category.color.replace('bg-gradient-to-r', 'bg')} text-white shadow-lg`
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {category.name}
                  <span className="px-1.5 py-0.5 bg-white/20 dark:bg-black/20 rounded text-xs">
                    {stats.byCategory[category.id] || 0}
                  </span>
                </button>
              );
            })}
        </div>
      </div>

      {/* Permissions Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading permissions...</p>
        </div>
      ) : filteredPermissions.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="h-12 w-12 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No permissions found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            {filters.search ? 'Try adjusting your search query' : 'Create your first custom permission to get started'}
          </p>
          <Link
            href="/settings/permissions/create"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all whitespace-nowrap"
          >
            <ShieldPlus className="h-5 w-5" />
            Create New Permission
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPermissions.map((permission) => (
            <PermissionCard key={permission.id} permission={permission} />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Permission</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Scope</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPermissions.map((permission) => (
                  <PermissionTableRow key={permission.id} permission={permission} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-500/20 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Permission</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete <strong>{showDeleteConfirm.displayName}</strong>?
              This may affect user access and system functionality.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle delete logic here
                  setShowDeleteConfirm(null);
                }}
                className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800"
              >
                Delete Permission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}