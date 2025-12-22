'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { userService, User as UserType } from '@/services/settings/userService';

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

interface UserDetailsPageProps {
  userId: string;
  onBack?: () => void;
  onEdit?: () => void;
}

export default function UserDetailsPage({ 
  userId, 
  onBack, 
  onEdit 
}: UserDetailsPageProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
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

  const handleBack = () => {
    onBack?.() || router.push('/settings/users');
  };
  
  const handleEdit = () => {
    onEdit?.() || router.push(`/settings/users/${userId}/edit`);
  };


  const loadUserData = async () => {
    try {
      setLoading(true);
      const userData = await userService.getUser(userId);
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
      const updatedUser = await userService.updateUserSummaryAccess(user.id, !user.canViewSummary);
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
      admin: 'bg-red-500/10 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
      manager: 'bg-blue-500/10 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
      technician: 'bg-green-500/10 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
      sales_representative: 'bg-purple-500/10 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
      customer_success: 'bg-indigo-500/10 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800',
      finance: 'bg-amber-500/10 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
      operations: 'bg-gray-500/10 text-gray-700 border-gray-200 dark:bg-gray-700/50 dark:text-gray-300 dark:border-gray-600',
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
      color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-500/20',
      trend: '+2% this week'
    },
    {
      title: 'Sessions',
      value: '24',
      icon: Activity,
      color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-500/20',
      trend: 'Active now'
    },
    {
      title: 'Last Login',
      value: 'Today',
      icon: Clock,
      color: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-500/20',
      trend: '10:30 AM'
    },
    {
      title: 'Permissions',
      value: user?.permissions?.length || 0,
      icon: Shield,
      color: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-500/20',
      trend: 'Assigned'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading user...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-sm transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">User Details</h1>
                <p className="text-indigo-100 mt-1">View and manage user information</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium backdrop-blur-sm transition-colors"
              >
                <Edit className="h-4 w-4" />
                Edit User
              </button>
            </div>
          </div>
          
          {/* User Info */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {getInitials(user.name || user.email)}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{user.name || 'No Name'}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-indigo-200" />
                    <span className="text-white/90">{user.email}</span>
                  </div>
                  <span className="text-white/60">•</span>
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-white text-sm">
                    ID: {user.id.slice(-8)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar */}
          <div className="lg:w-64">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm sticky top-8">
              {/* User Avatar */}
              <div className="text-center mb-6">
                <div className="h-24 w-24 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-3xl">
                    {getInitials(user.name || user.email)}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{user.name || 'No Name'}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{user.email}</p>
                
                <div className="mt-4 space-y-2">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    user.active
                      ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'
                  }`}>
                    {user.active ? 'Active' : 'Inactive'}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.roleName)}`}>
                    {getRoleDisplayName(user.roleName)}
                  </div>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="space-y-4">
                {statCards.map((stat, index) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</span>
                      <stat.icon className={`h-4 w-4 ${stat.color.split(' ')[0]}`} />
                    </div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                    {stat.trend && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.trend}</p>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <button
                  onClick={() => setActiveTab('activity')}
                  className="w-full flex items-center gap-2 p-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Activity className="h-4 w-4" />
                  View Activity Log
                </button>
                <button
                  onClick={() => setShowResetPassword(true)}
                  className="w-full flex items-center gap-2 p-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                >
                  <Key className="h-4 w-4" />
                  Reset Password
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(user.id)}
                  className="w-full flex items-center gap-2 p-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  Copy User ID
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center gap-2 p-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete User
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Tabs */}
            <div className="mb-6">
              <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'overview'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('permissions')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'permissions'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  Permissions
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'activity'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  Activity
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* User Information Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">User Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Full Name</label>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="h-5 w-5 text-gray-400" />
                          <span className="text-gray-900 dark:text-white">{user.name || 'Not specified'}</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Email Address</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="h-5 w-5 text-gray-400" />
                          <span className="text-gray-900 dark:text-white">{user.email}</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Account Status</label>
                        <div className="flex items-center gap-2 mt-1">
                          {user.active ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          <span className={user.active ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
                            {user.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Role</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Shield className="h-5 w-5 text-gray-400" />
                          <span className="text-gray-900 dark:text-white">{getRoleDisplayName(user.roleName)}</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Account Created</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-5 w-5 text-gray-400" />
                          <span className="text-gray-900 dark:text-white">{formatDate(user.createdAt)}</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Summary Access</label>
                        <div className="flex items-center gap-2 mt-1">
                          {user.canViewSummary ? (
                            <Eye className="h-5 w-5 text-blue-500" />
                          ) : (
                            <EyeOff className="h-5 w-5 text-gray-400" />
                          )}
                          <span className={user.canViewSummary ? 'text-blue-700 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}>
                            {user.canViewSummary ? 'Granted' : 'Not Granted'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-300">User Status</h4>
                      <button
                        onClick={handleToggleStatus}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${
                          user.active
                            ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/30'
                            : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-500/20 dark:text-green-400 dark:hover:bg-green-500/30'
                        }`}
                      >
                        {user.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      {user.active 
                        ? 'User is currently active and can access the system.'
                        : 'User is inactive and cannot login to the system.'
                      }
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-purple-900 dark:text-purple-300">Summary Access</h4>
                      <button
                        onClick={handleToggleSummaryAccess}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${
                          user.canViewSummary
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-500/20 dark:text-gray-400 dark:hover:bg-gray-500/30'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:hover:bg-blue-500/30'
                        }`}
                      >
                        {user.canViewSummary ? 'Revoke Access' : 'Grant Access'}
                      </button>
                    </div>
                    <p className="text-sm text-purple-700 dark:text-purple-400">
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
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">User Permissions</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      {user.permissions?.length || 0} permission{user.permissions?.length !== 1 ? 's' : ''} assigned
                    </p>
                  </div>
                  <button
                    onClick={() => router.push(`/settings/users/edit?id=${user.id}&tab=permissions`)}
                    className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10 rounded-lg"
                  >
                    Edit Permissions
                  </button>
                </div>
                
                {user.permissions && user.permissions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {user.permissions.map((permission, index) => {
                      const parts = permission.split('.');
                      const action = parts[1] || 'access';
                      const module = parts[0] || 'general';
                      
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                        >
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                              {action.replace(/_/g, ' ')}
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">
                              {module.replace(/_/g, ' ')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Shield className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h4 className="text-gray-700 dark:text-gray-300 font-medium">No Permissions Assigned</h4>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                      This user doesn't have any specific permissions assigned.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Recent Activity</h3>
                
                {activityLogs.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h4 className="text-gray-700 dark:text-gray-300 font-medium">No Activity Found</h4>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">There's no activity recorded for this user yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activityLogs.map((activity) => (
                      <div key={activity.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-gray-900 dark:text-white">{activity.action}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {activity.timestamp}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">IP: {activity.ip}</span>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{activity.userAgent}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-500/20 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete User</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete <strong>{user.name || user.email}</strong>?
              All associated data will be permanently removed.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
                <Key className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reset Password</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Generate new password for user</p>
              </div>
            </div>
            
            {newPassword ? (
              <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-400">New Password Generated</p>
                    <p className="text-lg font-mono text-gray-900 dark:text-white mt-1">{newPassword}</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                      This password will be displayed only once. Make sure to save it.
                    </p>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(newPassword)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                  >
                    Copy
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                A new password will be generated for <strong>{user.name || user.email}</strong>.
                The user will need to change it on their first login.
              </p>
            )}
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowResetPassword(false);
                  setNewPassword('');
                }}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {newPassword ? 'Close' : 'Cancel'}
              </button>
              {!newPassword && (
                <button
                  onClick={handleResetPassword}
                  className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700"
                >
                  Generate New Password
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}