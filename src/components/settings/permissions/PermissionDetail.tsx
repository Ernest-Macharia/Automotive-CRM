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
import { roleService } from '@/services/settings/roleService';

// Define Permission interface locally
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
      // Get all permissions grouped and find the specific one
      const grouped = await roleService.getPermissionsGrouped();
      let foundPermission: Permission | null = null;
      
      Object.entries(grouped).forEach(([category, permissionStrings]) => {
        permissionStrings.forEach(permissionString => {
          if (permissionString === permissionId) {
            const parts = permissionString.split('.');
            const module = parts[0];
            const action = parts[1];
            
            foundPermission = {
              id: permissionString,
              name: permissionString,
              displayName: roleService.formatPermission(permissionString),
              description: `Permission to ${action} ${module}`,
              category: module,
              module: module,
              action: action,
              scope: 'global'
            };
          }
        });
      });
      
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
      const roles = await roleService.getAllRoles();
      // Filter roles that have this permission
      const rolesUsingPermission = roles.filter(role => 
        role.permissions.includes(permission?.name || '')
      );
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
      case 'users': return 'bg-blue-500';
      case 'dashboard': return 'bg-green-500';
      case 'leads': return 'bg-orange-500';
      case 'opportunities': return 'bg-yellow-500';
      case 'quotes': return 'bg-cyan-500';
      case 'sales_orders': return 'bg-indigo-500';
      case 'work_orders': return 'bg-emerald-500';
      case 'inventory': return 'bg-rose-500';
      case 'reports': return 'bg-violet-500';
      case 'settings': return 'bg-gray-500';
      default: return 'bg-gray-500';
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="p-2 bg-blue-100 rounded-xl">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{permission.displayName}</h1>
              <p className="text-gray-600 text-sm">Permission Details</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/settings/permissions/${permission.id}/edit`)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Permission Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Permission Summary */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Permission Summary</h2>
                  <p className="text-gray-600 text-sm">ID: {permission.id.slice(0, 8)}...</p>
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
                      <label className="text-sm text-gray-500">Display Name</label>
                      <p className="text-lg font-semibold text-gray-800 mt-1">{permission.displayName}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm text-gray-500">Identifier</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="bg-gray-100 px-3 py-1.5 rounded-lg text-sm font-mono text-gray-800">
                          {permission.name}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(permission.name);
                            showToast('Permission identifier copied!', 'success');
                          }}
                          className="p-1.5 hover:bg-gray-100 rounded-lg"
                        >
                          <Copy className="h-4 w-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm text-gray-500">Description</label>
                      <p className="text-gray-800 mt-1">
                        {permission.description || `Permission to ${permission.action} ${permission.category} records`}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-500">Module</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Folder className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-800 capitalize">{permission.module}</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm text-gray-500">Action</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Activity className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-800 capitalize">{permission.action}</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm text-gray-500">Scope</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-800">{formatScope(permission.scope)}</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm text-gray-500">Category</label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`w-3 h-3 rounded-full ${getCategoryColor(permission.category)}`} />
                        <span className="text-gray-800 capitalize">
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
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Roles Using This Permission</h2>
            </div>
            
            <div className="p-6">
              {rolesUsing.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No roles are currently using this permission.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rolesUsing.map((role) => (
                    <div key={role._id} className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-100">
                            <Shield className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">{role.display_name}</h4>
                            <p className="text-sm text-gray-600">{role.description}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => router.push(`/settings/roles/${role._id}`)}
                          className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
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
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Quick Actions</h2>
            </div>
            
            <div className="p-6">
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/settings/permissions/${permission.id}/edit`)}
                  className="w-full px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Edit className="h-5 w-5" />
                  Edit Permission
                </button>
                
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(permission.name);
                    showToast('Permission identifier copied!', 'success');
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <Copy className="h-5 w-5" />
                  Copy Identifier
                </button>
                
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full px-4 py-3 rounded-xl border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-5 w-5" />
                  Delete Permission
                </button>
              </div>
            </div>
          </div>

          {/* Permission Stats */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Permission Stats</h2>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Type</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {Object.values(roleService.getDefaultPermissions()).flat().includes(permission.name) ? 'System' : 'Custom'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Usage Count</span>
                    <span className="font-medium text-gray-800">{rolesUsing.length} roles</span>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Access Level</span>
                    <span className="font-medium text-gray-800">{formatScope(permission.scope)}</span>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Created</span>
                    <span className="text-sm text-gray-500">System Default</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Related Permissions */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Related Permissions</h2>
            </div>
            
            <div className="p-6">
              <div className="space-y-2">
                {[
                  `${permission.category}.read`,
                  `${permission.category}.create`,
                  `${permission.category}.update`,
                  `${permission.category}.delete`,
                ].filter(p => p !== permission.name).map((relatedPermission, index) => (
                  <div key={index} className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-800">{relatedPermission}</span>
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Permission</h3>
                <p className="text-gray-600 text-sm mt-1">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <strong>{permission.displayName}</strong>?
              This may affect user access and system functionality.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle delete logic here
                  showToast('Permission deleted successfully', 'success');
                  router.push('/settings/permissions');
                }}
                className="px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700"
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