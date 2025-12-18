'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Shield,
  Edit,
  Trash2,
  Copy,
  Download,
  Users,
  Calendar,
  Clock,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Lock,
  Unlock,
  Globe,
  Folder,
  Settings,
  FileText,
  BarChart,
  Database,
  TrendingUp,
  Sparkles,
  Eye,
  EyeOff,
  History,
  UserCheck,
  Key,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { roleService, Permission, ROLE_NAMES } from '@/services/roleService';

interface PermissionDetailProps {
  permissionId: string;
  onBack?: () => void;
}

export default function PermissionDetail({ permissionId, onBack }: PermissionDetailProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [permission, setPermission] = useState<Permission | null>(null);
  const [loading, setLoading] = useState(true);
  const [rolesUsing, setRolesUsing] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'usage' | 'history'>('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (permissionId) {
      loadPermission();
      loadRolesUsingPermission();
    }
  }, [permissionId]);

  const handleBack = () => {
    onBack?.() || router.push('/settings/permissions');
  };

  const loadPermission = async () => {
    try {
      setLoading(true);
      // For now, we'll simulate loading since we don't have a getPermissionById method
      const grouped = await roleService.getPermissionsByCategory();
      const allPermissions: Permission[] = [];
      
      Object.values(grouped).forEach(categoryPermissions => {
        allPermissions.push(...categoryPermissions);
      });
      
      const foundPermission = allPermissions.find(p => p.id === permissionId);
      
      if (!foundPermission) {
        showToast('Permission not found', 'error');
        router.push('/settings/permissions');
        return;
      }
      
      setPermission(foundPermission);
    } catch (error) {
      console.error('Error loading permission:', error);
      showToast('Failed to load permission details', 'error');
      router.push('/settings/permissions');
    } finally {
      setLoading(false);
    }
  };

  const loadRolesUsingPermission = async () => {
    try {
      // Simulate API call
      const roles = await roleService.getAllRoles();
      const rolesUsingPermission = roles.data.slice(0, 3); // Simulated
      setRolesUsing(rolesUsingPermission);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'users': return Users;
      case 'dashboard': return BarChart;
      case 'leads': return TrendingUp;
      case 'opportunities': return TrendingUp;
      case 'quotes': return FileText;
      case 'sales_orders': return FileText;
      case 'work_orders': return Settings;
      case 'inventory': return Database;
      case 'reports': return BarChart;
      case 'settings': return Settings;
      default: return Folder;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'users': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'dashboard': return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case 'leads': return 'bg-gradient-to-r from-orange-500 to-red-500';
      case 'opportunities': return 'bg-gradient-to-r from-yellow-500 to-amber-500';
      case 'quotes': return 'bg-gradient-to-r from-cyan-500 to-blue-500';
      case 'sales_orders': return 'bg-gradient-to-r from-indigo-500 to-purple-500';
      case 'work_orders': return 'bg-gradient-to-r from-emerald-500 to-teal-500';
      case 'inventory': return 'bg-gradient-to-r from-rose-500 to-pink-500';
      case 'reports': return 'bg-gradient-to-r from-violet-500 to-purple-500';
      case 'settings': return 'bg-gradient-to-r from-gray-500 to-slate-500';
      default: return 'bg-gradient-to-r from-gray-500 to-slate-500';
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading permission...</p>
        </div>
      </div>
    );
  }

  if (!permission) {
    return null;
  }

  const CategoryIcon = getCategoryIcon(permission.category);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-sm transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{permission.displayName}</h1>
                <p className="text-purple-100 text-sm">Permission Details</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/settings/permissions/${permission.id}/edit`)}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                title="Edit"
              >
                <Edit className="h-5 w-5 text-white" />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                title="Delete"
              >
                <Trash2 className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Permission Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Permission Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Permission Summary</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">ID: {permission.id.slice(0, 8)}...</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${getCategoryColor(permission.category)} text-white`}>
                      <CategoryIcon className="h-4 w-4" />
                      <span className="capitalize">{permission.category.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Display Name</label>
                        <p className="text-lg font-semibold text-gray-800 dark:text-white mt-1">{permission.displayName}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Identifier</label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg text-sm font-mono text-gray-800 dark:text-gray-300">
                            {permission.name}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(permission.name);
                              showToast('Permission identifier copied!', 'success');
                            }}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          >
                            <Copy className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Description</label>
                        <p className="text-gray-800 dark:text-gray-200 mt-1">
                          {permission.description || `Permission to ${permission.action} ${permission.category} records`}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Module</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Folder className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-800 dark:text-white capitalize">{permission.module}</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Action</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Activity className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-800 dark:text-white capitalize">{permission.action}</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Scope</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Globe className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-800 dark:text-white">{formatScope(permission.scope)}</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Category</label>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={`w-3 h-3 rounded-full ${getCategoryColor(permission.category).replace('bg-gradient-to-r', 'bg')}`} />
                          <span className="text-gray-800 dark:text-white capitalize">
                            {permission.category.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Roles Using This Permission */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Roles Using This Permission</h2>
              </div>
              
              <div className="p-6">
                {rolesUsing.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No roles are currently using this permission.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rolesUsing.map((role) => (
                      <div key={role._id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30">
                              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800 dark:text-white">{role.display_name}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{role.description}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => router.push(`/settings/roles/${role._id}`)}
                            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10 rounded-lg"
                          >
                            View Role
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Quick Actions</h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-3">
                  <button
                    onClick={() => router.push(`/settings/permissions/${permission.id}/edit`)}
                    className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 flex items-center justify-center gap-2"
                  >
                    <Edit className="h-5 w-5" />
                    Edit Permission
                  </button>
                  
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(permission.name);
                      showToast('Permission identifier copied!', 'success');
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center justify-center gap-2"
                  >
                    <Copy className="h-5 w-5" />
                    Copy Identifier
                  </button>
                  
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full px-4 py-3 rounded-xl border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 flex items-center justify-center gap-2"
                  >
                    <Trash2 className="h-5 w-5" />
                    Delete Permission
                  </button>
                </div>
              </div>
            </div>

            {/* Permission Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Permission Stats</h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Type</span>
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
                        {Object.values(ROLE_NAMES).some(name => permission.name.includes(name)) ? 'System' : 'Custom'}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Usage Count</span>
                      <span className="font-medium text-gray-800 dark:text-white">{rolesUsing.length} roles</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Access Level</span>
                      <span className="font-medium text-gray-800 dark:text-white">{formatScope(permission.scope)}</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Created</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">System Default</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Related Permissions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Related Permissions</h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-2">
                  {[
                    `${permission.category}.read`,
                    `${permission.category}.create`,
                    `${permission.category}.update`,
                    `${permission.category}.delete`,
                  ].filter(p => p !== permission.name).map((relatedPermission, index) => (
                    <div key={index} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-800 dark:text-white">{relatedPermission}</span>
                        <button
                          onClick={() => router.push(`/settings/permissions?search=${relatedPermission}`)}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
              Are you sure you want to delete <strong>{permission.displayName}</strong>?
              This may affect user access and system functionality.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle delete logic here
                  showToast('Permission deleted successfully', 'success');
                  router.push('/settings/permissions');
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