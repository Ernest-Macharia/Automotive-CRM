'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Mail,
  Shield,
  Calendar,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Key,
  History,
  Activity,
  Copy,
  Download,
  ExternalLink,
  Users,
  Phone,
  MapPin,
  Briefcase,
  Building,
  Globe,
  Clock,
  TrendingUp,
  AlertCircle,
  Lock,
  Unlock,
  UserPlus,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { userService, User as UserType, USER_ROLES } from '@/services/settings/userService';

// ✅ Keep all your interfaces and types unchanged
interface ActivityLog {
  id: string;
  action: string;
  timestamp: string;
  ip: string;
  userAgent: string;
}

interface StatCard {
  title: string;
  value: string | number;
  icon: any;
  color: string;
  trend?: string;
}

interface UserDetailProps {
  userId: string;
}

export default function UserDetailsPage({ userId }: UserDetailProps) {
  const router = useRouter();
  const { showToast } = useToast();

  // ✅ Keep all your state and logic exactly as-is
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'permissions'>('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    if (userId) {
      loadUserData();
      loadActivityLogs();
    }
  }, [userId]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const userData = await userService.getUserById(userId);
      setUser(userData);
    } catch (error) {
      console.error('Error loading user:', error);
      showToast('Failed to load user', 'error');
      router.push('/settings/users');
    } finally {
      setLoading(false);
    }
  };

  const loadActivityLogs = async () => {
    // Mock data - replace with actual API call
    setTimeout(() => {
      setActivityLogs([
        {
          id: '1',
          action: 'Logged in from Chrome on Windows',
          timestamp: 'Today, 10:30 AM',
          ip: '192.168.1.100',
          userAgent: 'Chrome/120.0.0.0'
        },
        {
          id: '2',
          action: 'Updated profile information',
          timestamp: 'Yesterday, 02:15 PM',
          ip: '192.168.1.100',
          userAgent: 'Chrome/120.0.0.0'
        },
        {
          id: '3',
          action: 'Viewed customer dashboard',
          timestamp: 'Dec 14, 2024',
          ip: '192.168.1.100',
          userAgent: 'Chrome/120.0.0.0'
        },
      ]);
    }, 500);
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    
    try {
      const updatedUser = await userService.updateUser(user.id, { active: !user.active });
      setUser(updatedUser);
      showToast(`User ${user.active ? 'deactivated' : 'activated'} successfully`, 'success');
    } catch (error: any) {
      console.error('Error toggling user status:', error);
      showToast(error.message || 'Failed to update user status', 'error');
    }
  };

  const handleToggleSummaryAccess = async () => {
    if (!user) return;
    
    try {
      const updatedUser = await userService.updateSummaryAccess(user.id, !user.canViewSummary);
      setUser(updatedUser);
      showToast(
        `Summary access ${user.canViewSummary ? 'revoked' : 'granted'} successfully`,
        'success'
      );
    } catch (error: any) {
      console.error('Error toggling summary access:', error);
      showToast(error.message || 'Failed to update summary access', 'error');
    }
  };

  const handleDeleteUser = async () => {
    if (!user) return;
    
    try {
      await userService.deleteUser(user.id);
      showToast('User deleted successfully', 'success');
      router.push('/settings/users');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      showToast(error.message || 'Failed to delete user', 'error');
    }
  };

  const handleResetPassword = () => {
    const generatedPassword = generateSecurePassword();
    setNewPassword(generatedPassword);
    showToast('Password generated successfully', 'success');
  };

  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      [USER_ROLES.ADMIN]: 'bg-red-500/10 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
      [USER_ROLES.MANAGEMENT]: 'bg-blue-500/10 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
      [USER_ROLES.TECHNICIAN]: 'bg-green-500/10 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
      [USER_ROLES.SALES_REPRESENTATIVE]: 'bg-purple-500/10 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
      'customer_success': 'bg-indigo-500/10 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800',
      'finance': 'bg-amber-500/10 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
      'operations': 'bg-gray-500/10 text-gray-700 border-gray-200 dark:bg-gray-700/50 dark:text-gray-300 dark:border-gray-600',
      [USER_ROLES.SUPPORT]: 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
      [USER_ROLES.CUSTOMER]: 'bg-stone-500/10 text-stone-700 border-stone-200 dark:bg-stone-900/30 dark:text-stone-400 dark:border-stone-800',
      [USER_ROLES.DEVELOPER]: 'bg-violet-500/10 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300';
  };

  const getInitials = (name: string | null | undefined): string => {
    if (!name || name.trim() === '') {
      return '??';
    }
    
    return name
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleDisplayName = (role: string): string => {
    if (!role || typeof role !== 'string') {
      return 'Unknown';
    }
    
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };
  
  const statCards: StatCard[] = [
    {
      title: 'Activity Score',
      value: '85%',
      icon: TrendingUp,
      color: 'text-green-600 bg-green-100',
      trend: '+2% this week'
    },
    {
      title: 'Sessions',
      value: '24',
      icon: Activity,
      color: 'text-blue-600 bg-blue-100',
      trend: 'Active now'
    },
    {
      title: 'Last Login',
      value: 'Today',
      icon: Clock,
      color: 'text-purple-600 bg-purple-100',
      trend: '10:30 AM'
    },
    {
      title: 'Permissions',
      value: user?.permissions?.length || 0,
      icon: Shield,
      color: 'text-amber-600 bg-amber-100',
      trend: 'Assigned'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/settings/users')}
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
              aria-label="Back to list"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">User Details</h1>
              <p className="text-gray-600 text-sm">View and manage user information</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/settings/users/${userId}/edit`)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar */}
        <div className="lg:w-64">
          <div className="bg-white border border-gray-200 rounded-xl p-5 sticky top-8">
            {/* User Avatar */}
            <div className="text-center mb-5">
              <div className="h-20 w-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold text-2xl">
                  {getInitials(user.name || user.email)}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 text-base">{user.name || 'No Name'}</h3>
              <p className="text-sm text-gray-600 truncate max-w-[180px]">{user.email}</p>
              
              <div className="mt-3 space-y-1.5">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  user.active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.active ? 'Active' : 'Inactive'}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  getRoleBadgeColor(userService.getUserRoleName(user)).split(' ')[0]
                }`}>
                  {getRoleDisplayName(userService.getUserRoleDisplayName(user))}
                </span>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="space-y-3">
              {statCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="p-2.5 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">{stat.title}</span>
                      <Icon className={`h-4 w-4 ${stat.color.split(' ')[0]}`} />
                    </div>
                    <p className="text-base font-semibold text-gray-900 mt-0.5">{stat.value}</p>
                    {stat.trend && (
                      <p className="text-[10px] text-gray-500 mt-0.5">{stat.trend}</p>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Quick Actions */}
            <div className="mt-5 pt-4 border-t border-gray-200 space-y-1.5">
              <button
                onClick={() => setActiveTab('activity')}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded transition-colors"
              >
                <Activity className="h-3.5 w-3.5" />
                View Activity Log
              </button>
              <button
                onClick={() => setShowResetPassword(true)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                <Key className="h-3.5 w-3.5" />
                Reset Password
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(user.id)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy User ID
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete User
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Tabs */}
          <div className="mb-6">
            <div className="flex space-x-1 border-b border-gray-200">
              {(['overview', 'permissions', 'activity'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-2 text-sm font-medium border-b-2 ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* User Information Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">User Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Full Name</div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">{user.name || 'Not specified'}</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Email Address</div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">{user.email}</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Account Status</div>
                      <div className="flex items-center gap-2">
                        {user.active ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`text-sm ${user.active ? 'text-green-700' : 'text-red-700'}`}>
                          {user.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Role</div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">{getRoleDisplayName(userService.getUserRoleDisplayName(user))}</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Account Created</div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">{formatDate(user.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Summary Access</div>
                      <div className="flex items-center gap-2">
                        {user.canViewSummary ? (
                          <Eye className="h-4 w-4 text-blue-500" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        )}
                        <span className={`text-sm ${user.canViewSummary ? 'text-blue-700' : 'text-gray-500'}`}>
                          {user.canViewSummary ? 'Granted' : 'Not Granted'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900">User Status</h4>
                    <button
                      onClick={handleToggleStatus}
                      className={`px-3 py-1.5 rounded text-xs font-medium ${
                        user.active
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {user.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-600">
                    {user.active 
                      ? 'User is currently active and can access the system.'
                      : 'User is inactive and cannot login to the system.'
                    }
                  </p>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900">Summary Access</h4>
                    <button
                      onClick={handleToggleSummaryAccess}
                      className={`px-3 py-1.5 rounded text-xs font-medium ${
                        user.canViewSummary
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {user.canViewSummary ? 'Revoke Access' : 'Grant Access'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-600">
                    {user.canViewSummary
                      ? 'User can view summary reports and analytics.'
                      : 'User cannot view summary reports.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">User Permissions</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {user.permissions?.length || 0} permission{user.permissions?.length !== 1 ? 's' : ''} assigned
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/settings/users/edit?id=${user.id}&tab=permissions`)}
                  className="px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded"
                >
                  Edit Permissions
                </button>
              </div>
              
              {user.permissions && user.permissions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {user.permissions.map((permission, index) => {
                    const parts = permission.split('.');
                    const action = parts[1] || 'access';
                    const module = parts[0] || 'general';
                    
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      >
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <div>
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {action.replace(/_/g, ' ')}
                          </span>
                          <p className="text-[10px] text-gray-500 mt-0.5 capitalize">
                            {module.replace(/_/g, ' ')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <h4 className="text-gray-700 font-medium text-sm">No Permissions Assigned</h4>
                  <p className="text-gray-500 text-xs mt-1">
                    This user doesn't have any specific permissions assigned.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Activity</h3>
              
              {activityLogs.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <h4 className="text-gray-700 font-medium text-sm">No Activity Found</h4>
                  <p className="text-gray-500 text-xs mt-1">There's no activity recorded for this user yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activityLogs.map((activity) => (
                    <div key={activity.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between text-xs">
                        <div>
                          <p className="text-gray-900">{activity.action}</p>
                          <div className="flex items-center gap-2 mt-1 text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {activity.timestamp}
                            </span>
                            <span>IP: {activity.ip}</span>
                          </div>
                        </div>
                        <span className="text-gray-500">{activity.userAgent}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl p-5 max-w-md w-full">
            <div className="flex items-start gap-2.5 mb-4">
              <div className="p-1.5 bg-red-100 rounded-lg mt-0.5">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-base">Delete User</h3>
                <p className="text-gray-600 text-xs mt-1">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 text-sm mb-5">
              Are you sure you want to delete <strong>{user.name || user.email}</strong>?
              All associated data will be permanently removed.
            </p>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl p-5 max-w-md w-full">
            <div className="flex items-start gap-2.5 mb-4">
              <div className="p-1.5 bg-blue-100 rounded-lg mt-0.5">
                <Key className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-base">Reset Password</h3>
                <p className="text-gray-600 text-xs mt-1">Generate new password for user</p>
              </div>
            </div>
            
            {newPassword ? (
              <div className="mb-5 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-green-800">New Password Generated</p>
                    <p className="font-mono text-gray-900 mt-1">{newPassword}</p>
                    <p className="text-[10px] text-green-600 mt-1">
                      This password will be displayed only once.
                    </p>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(newPassword)}
                    className="px-2.5 py-1 bg-green-600 text-white rounded text-xs font-medium"
                  >
                    Copy
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 text-sm mb-5">
                A new password will be generated for <strong>{user.name || user.email}</strong>.
                The user will need to change it on their first login.
              </p>
            )}
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowResetPassword(false);
                  setNewPassword('');
                }}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-sm"
              >
                {newPassword ? 'Close' : 'Cancel'}
              </button>
              {!newPassword && (
                <button
                  onClick={handleResetPassword}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm"
                >
                  Generate Password
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}