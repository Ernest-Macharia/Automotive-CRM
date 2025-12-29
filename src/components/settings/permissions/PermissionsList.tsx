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
  MoreVertical,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { roleService, PERMISSIONS, ROLES } from '@/services/settings/roleService';
import Link from 'next/link';

// ✅ Keep your interfaces unchanged
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
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);

  const [filters, setFilters] = useState<PermissionFilters>({
    category: 'all',
    status: 'all',
    search: '',
  });

  // ✅ Keep your categories — just updated UI below
  const categories = [
    { id: 'all', name: 'All Categories', icon: Grid, color: 'bg-blue-500' },
    { id: 'users', name: 'User Management', icon: Users, color: 'bg-purple-500' },
    { id: 'dashboard', name: 'Dashboard', icon: BarChart, color: 'bg-green-500' },
    { id: 'leads', name: 'Leads', icon: Phone, color: 'bg-orange-500' },
    { id: 'opportunities', name: 'Opportunities', icon: TrendingUp, color: 'bg-yellow-500' },
    { id: 'quotes', name: 'Quotes', icon: FileText, color: 'bg-cyan-500' },
    { id: 'sales_orders', name: 'Sales Orders', icon: ShoppingCart, color: 'bg-indigo-500' },
    { id: 'work_orders', name: 'Work Orders', icon: Wrench, color: 'bg-emerald-500' },
    { id: 'inventory', name: 'Inventory', icon: Database, color: 'bg-rose-500' },
    { id: 'reports', name: 'Reports', icon: BarChart, color: 'bg-violet-500' },
    { id: 'settings', name: 'Settings', icon: Settings, color: 'bg-gray-500' },
  ];

  useEffect(() => {
    loadPermissions();
  }, []);

  useEffect(() => {
    filterPermissions();
  }, [permissions, filters]);

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.action-menu-container')) {
        setActiveActionMenu(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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

  const handleViewDetails = (permission: Permission) => {
    router.push(`/settings/permissions/${permission.id}`);
  };

  const handleEdit = (permission: Permission) => {
    router.push(`/settings/permissions/${permission.id}/edit`);
  };

  const handleDelete = (permission: Permission) => {
    setShowDeleteConfirm(permission);
  };

  const toggleActionMenu = (permissionId: string) => {
    setActiveActionMenu(activeActionMenu === permissionId ? null : permissionId);
  };

  const ActionMenu = ({ permission }: { permission: Permission }) => {
    if (activeActionMenu !== permission.id) return null;

    return (
      <div className="absolute right-0 top-6 z-50 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
        <button
          onClick={() => handleViewDetails(permission)}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <Eye className="h-4 w-4" />
          View Details
        </button>
        <button
          onClick={() => handleEdit(permission)}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <Edit className="h-4 w-4" />
          Edit Permission
        </button>
        <button
          onClick={() => handleDelete(permission)}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
          Delete Permission
        </button>
        <div className="border-t border-gray-200 my-1"></div>
        <button
          onClick={() => {
            // Clone permission functionality
            showToast('Clone functionality not implemented yet', 'info');
            setActiveActionMenu(null);
          }}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <Activity className="h-4 w-4" />
          Clone Permission
        </button>
      </div>
    );
  };

  const PermissionCard = ({ permission }: { permission: Permission }) => {
    const Icon = getCategoryIcon(permission.category);
    const color = getCategoryColor(permission.category).replace('bg-gradient-to-r from-', 'bg-').replace(' to-', ' ');
    
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow relative action-menu-container">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${color}`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-base">{permission.displayName}</h3>
              <p className="text-xs text-gray-600 mt-0.5">
                {permission.category.replace('_', ' ')} • {permission.action}
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
            {formatScope(permission.scope)}
          </span>
        </div>
        
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {permission.description || `Permission to ${permission.action} ${permission.category} records`}
        </p>
        
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Identifier:</span>
            <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-800">
              {permission.name}
            </code>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Module:</span>
            <span className="font-medium text-gray-900 capitalize">{permission.module}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Action:</span>
            <span className="font-medium text-gray-900 capitalize">{permission.action}</span>
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-200 flex gap-2">
          <button
            onClick={() => handleViewDetails(permission)}
            className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
          >
            View Details
          </button>
          <div className="relative action-menu-container">
            <button
              onClick={() => toggleActionMenu(permission.id)}
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
              aria-label="More actions"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            <ActionMenu permission={permission} />
          </div>
        </div>
      </div>
    );
  };

  // ✅ Updated: Permission Table Row with action menu dropdown
  const PermissionTableRow = ({ permission }: { permission: Permission }) => {
    const Icon = getCategoryIcon(permission.category);
    const color = getCategoryColor(permission.category).replace('bg-gradient-to-r from-', 'bg-').replace(' to-', ' ');
    
    return (
      <tr className="border-b border-gray-200 hover:bg-gray-50">
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded ${color}`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{permission.displayName}</p>
              <p className="text-xs text-gray-600">{permission.name}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full capitalize">
            {permission.category.replace('_', ' ')}
          </span>
        </td>
        <td className="px-4 py-3">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">
            {permission.action}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {formatScope(permission.scope)}
        </td>
        <td className="px-4 py-3 relative action-menu-container">
          <div className="flex gap-2">
            <button
              onClick={() => handleViewDetails(permission)}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleEdit(permission)}
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
            <div className="relative">
              <button
                onClick={() => toggleActionMenu(permission.id)}
                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                aria-label="More actions"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              <ActionMenu permission={permission} />
            </div>
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
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Permissions Management</h1>
            <p className="text-gray-600 mt-1">Manage system permissions and access controls</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                aria-label="Grid view"
              >
                <Grid className="h-4 w-4 text-gray-600" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                aria-label="List view"
              >
                <List className="h-4 w-4 text-gray-600" />
              </button>
            </div>
            
            <button
              onClick={loadPermissions}
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
              aria-label="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            
            <Link
              href="/settings/permissions/create"
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
            >
              <ShieldPlus className="h-4 w-4" />
              Add Permission
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Permissions', value: stats.total, icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'System Permissions', value: stats.system, icon: Key, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Custom Permissions', value: stats.custom, icon: Settings, color: 'text-purple-600', bg: 'bg-purple-50' },
            { 
              label: 'Categories', 
              value: categories.filter(c => c.id !== 'all' && stats.byCategory[c.id] > 0).length,
              icon: Folder, 
              color: 'text-amber-600', 
              bg: 'bg-amber-50' 
            },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-600">{stat.label}</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search permissions..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}  
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <Filter className="h-4 w-4" />
              Filters
              {showFilters ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
          
          <div className="text-sm text-gray-600">
            {filteredPermissions.length} of {permissions.length} permissions
          </div>
        </div>

        {showFilters && (
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setFilters({ category: 'all', status: 'all', search: '' })}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
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
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              filters.category === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${
                    filters.category === category.id
                      ? `${category.color.replace('bg-', 'bg-')} text-white`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {category.name}
                  <span className="px-1.5 py-0.5 bg-white/30 rounded text-[10px]">
                    {stats.byCategory[category.id] || 0}
                  </span>
                </button>
              );
            })}
        </div>
      </div>

      {/* Permissions Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading permissions...</p>
        </div>
      ) : filteredPermissions.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
            <Shield className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No permissions found</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            {filters.search ? 'Try a different search term' : 'Create your first permission to get started'}
          </p>
          <Link
            href="/settings/permissions/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg"
          >
            <ShieldPlus className="h-4 w-4" />
            Create Permission
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPermissions.map((permission) => (
            <PermissionCard key={permission.id} permission={permission} />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Permission</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Scope</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPermissions.map((permission) => (
                  <PermissionTableRow key={permission.id} permission={permission} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl p-5 max-w-md w-full">
            <div className="flex items-start gap-2.5 mb-4">
              <div className="p-1.5 bg-red-100 rounded-lg mt-0.5">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Delete Permission</h3>
                <p className="text-gray-600 text-sm mt-1">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 text-sm mb-5">
              Are you sure you want to delete <strong>{showDeleteConfirm.displayName}</strong>?
              This may affect user access and system functionality.
            </p>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Your delete logic would go here
                  setShowDeleteConfirm(null);
                }}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}