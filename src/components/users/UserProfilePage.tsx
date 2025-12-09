'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Save, User, Mail, Phone, Building, Shield, 
  Key, Calendar, CheckCircle, XCircle, Edit, Eye, 
  Lock, Unlock, Settings, Users, Car, Target, FileText,
  DollarSign, BarChart, Handshake, Ticket, Package,
  ChevronRight, Trash2, AlertTriangle, RefreshCw,
  Clipboard, MessageSquare, Bell, Globe, Database,
  Activity, LogOut, Clock, Star, Award
} from 'lucide-react';
import DeleteUserModal from '@/components/users/DeleteUserModal';
import { userService, User as UserType } from '@/services/userService';
import { getPermissionInfo, PERMISSION_CATEGORIES } from '@/lib/permissions/mapping';
import { toast } from 'react-hot-toast';

interface UserProfilePageProps {
  userId: string;
  initialEditMode?: boolean;
  onBack?: () => void;
}

const UserProfilePage: React.FC<UserProfilePageProps> = ({ 
  userId, 
  initialEditMode = false,
  onBack 
}) => {
  const router = useRouter();

  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [formData, setFormData] = useState<any>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<
    Array<{ value: string; label: string; description?: string }>
  >([]);

  // Fetch user data
  useEffect(() => {
    if (userId) {
      fetchUserData();
      fetchAvailableRoles();
    }
  }, [userId]);

  useEffect(() => {
    setIsEditing(initialEditMode);
  }, [initialEditMode]);

  const fetchUserData = async () => {
    try {
        setLoading(true);
        const response = await userService.getAllUsers();
        
        // Try multiple ways to find the user
        const foundUser = response.data.find(u => 
        u.id === userId || 
        u._id === userId ||
        String(u.id) === String(userId) || 
        String(u._id) === String(userId)
        );
        
        // Debug log
        console.log('Looking for user with ID:', userId);
        console.log('Available users:', response.data.map(u => ({ 
        id: u.id, 
        _id: u._id,
        name: u.name 
        })));
        console.log('Found user:', foundUser);
        
        if (!foundUser) {
        toast.error('User not found');
        if (onBack) onBack();
        else router.push('/clients/users');
        return;
        }
        
        setUser(foundUser);
        setFormData({
        name: foundUser.name || '',
        email: foundUser.email || '',
        phone: foundUser.phone || '',
        department: foundUser.department || '',
        role: typeof foundUser.role === 'string' ? foundUser.role : foundUser.role?.name || '',
        active: foundUser.active || false,
        canViewSummary: foundUser.canViewSummary || false,
        });
    } catch (error) {
        toast.error('Failed to load user data');
        console.error('Error fetching user:', error);
        if (onBack) onBack();
        else router.push('/clients/users');
    } finally {
        setLoading(false);
    }
    };

  const fetchAvailableRoles = async () => {
    try {
      const response = await userService.getAllUsers();
      const roles = Array.from(new Set(response.data.map(user => {
        const role = user.role;
        if (!role) return null;
        
        if (typeof role === 'string') {
          return role;
        }
        
        if (typeof role === 'object') {
          return role.name || role.display_name;
        }
        
        return String(role);
      }))).filter(Boolean) as string[];
      
      setAvailableRoles(roles.map(role => ({
        value: role,
        label: role.split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      })));
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  // Helper functions
  const formatRoleName = (role: string | any): string => {
    if (!role) return 'Unknown';
    
    if (typeof role === 'string') {
      return role.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    
    if (typeof role === 'object') {
      return role.display_name || role.name || 'Unknown';
    }
    
    return String(role);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return 'Today at ' + date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } else if (diffDays === 1) {
        return 'Yesterday at ' + date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } else if (diffDays <= 7) {
        return `${diffDays} days ago`;
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
    } catch {
      return 'Invalid date';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case PERMISSION_CATEGORIES.USERS:
        return <Users className="h-4 w-4" />;
      case PERMISSION_CATEGORIES.JOBS:
        return <Clipboard className="h-4 w-4" />;
      case PERMISSION_CATEGORIES.VEHICLES:
        return <Car className="h-4 w-4" />;
      case PERMISSION_CATEGORIES.OPPORTUNITIES:
        return <Target className="h-4 w-4" />;
      case PERMISSION_CATEGORIES.QUOTES:
        return <FileText className="h-4 w-4" />;
      case PERMISSION_CATEGORIES.INVOICES:
        return <DollarSign className="h-4 w-4" />;
      case PERMISSION_CATEGORIES.DASHBOARD:
      case PERMISSION_CATEGORIES.REPORTS:
        return <BarChart className="h-4 w-4" />;
      case PERMISSION_CATEGORIES.SETTINGS:
        return <Settings className="h-4 w-4" />;
      case PERMISSION_CATEGORIES.PARTNERS:
        return <Handshake className="h-4 w-4" />;
      case PERMISSION_CATEGORIES.TICKETS:
        return <Ticket className="h-4 w-4" />;
      case PERMISSION_CATEGORIES.CHAT:
        return <MessageSquare className="h-4 w-4" />;
      case PERMISSION_CATEGORIES.NOTIFICATIONS:
        return <Bell className="h-4 w-4" />;
      case PERMISSION_CATEGORIES.SYSTEM:
        return <Globe className="h-4 w-4" />;
      case PERMISSION_CATEGORIES.DATA:
        return <Database className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const groupPermissionsByCategory = () => {
    if (!user?.permissions) return {};
    
    const grouped: Record<string, Array<{ key: string; label: string; description: string }>> = {};
    
    user.permissions.forEach(permissionKey => {
      const info = getPermissionInfo(permissionKey);
      if (!grouped[info.category]) {
        grouped[info.category] = [];
      }
      grouped[info.category].push({
        key: permissionKey,
        label: info.label,
        description: info.description
      });
    });
    
    return grouped;
  };

  const getRoleColor = (role: string | any) => {
    const roleName = formatRoleName(role).toLowerCase();
    
    if (roleName.includes('admin')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    } else if (roleName.includes('manager') || roleName.includes('management') || roleName.includes('director')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    } else if (roleName.includes('technician') || roleName.includes('engineer')) {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    } else if (roleName.includes('sales')) {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (roleName.includes('finance')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    } else if (roleName.includes('support') || roleName.includes('customer')) {
      return 'bg-teal-100 text-teal-800 border-teal-200';
    } else {
      return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Handlers
  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const updatedUser = await userService.updateUser(user.id, formData);
      setUser(updatedUser);
      setIsEditing(false);
      toast.success('User updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    
    try {
      const updatedUser = await userService.toggleUserStatus(user.id, !user.active);
      setUser(updatedUser);
      setFormData((prev: any) => ({ ...prev, active: updatedUser.active }));
      toast.success(`User ${updatedUser.active ? 'activated' : 'deactivated'} successfully!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user status');
    }
  };

  const handleToggleSummaryAccess = async () => {
    if (!user) return;
    
    try {
      const updatedUser = await userService.updateSummaryAccess(user.id, !user.canViewSummary);
      setUser(updatedUser);
      setFormData((prev: any) => ({ ...prev, canViewSummary: updatedUser.canViewSummary }));
      toast.success(`Summary access ${updatedUser.canViewSummary ? 'granted' : 'revoked'} successfully!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update summary access');
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    
    try {
      await userService.deleteUser(user.id);
      toast.success('User deleted successfully!');
      if (onBack) onBack();
      else router.push('/clients/users');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || '',
        role: typeof user.role === 'string' ? user.role : user.role?.name || '',
        active: user.active || false,
        canViewSummary: user.canViewSummary || false,
      });
    }
    setIsEditing(false);
  };

  const handleBack = () => {
    if (onBack) {
        onBack();
    } else {
        router.push('/clients/users');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="h-8 bg-indigo-500/30 rounded w-48"></div>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl p-6">
                  <div className="h-6 bg-gray-200 rounded w-32 mb-6"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => (
                      <div key={i}>
                        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                        <div className="h-10 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6">
                  <div className="h-6 bg-gray-200 rounded w-32 mb-6"></div>
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i}>
                        <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">User not found</h3>
          <p className="text-gray-600 mb-6">The user you're looking for doesn't exist</p>
          <button
            onClick={() => onBack ? onBack() : router.push('/clients/users')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  const groupedPermissions = groupPermissionsByCategory();
  const permissionCategories = Object.keys(groupedPermissions);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-gradient-to-br from-white/20 to-white/10 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {isEditing ? 'Edit User' : user.name}
                  </h1>
                  <p className="text-indigo-100">
                    {isEditing ? 'Update user information' : `User profile - ${user.email}`}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete User
              </button>
              
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 text-sm font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 rounded-xl bg-white text-indigo-600 hover:bg-gray-50 text-sm font-medium shadow-sm transition-colors flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit User
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - User Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Information Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <User className="h-5 w-5 text-indigo-600" />
                    User Information
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${user.active ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                      {user.active ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          Inactive
                        </span>
                      )}
                    </span>
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)} border`}>
                      <span className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        {formatRoleName(user.role)}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {isEditing ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Full Name
                          </div>
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
                          placeholder="John Doe"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email Address
                          </div>
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
                          placeholder="john@example.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Phone Number
                          </div>
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            Department
                          </div>
                        </label>
                        <input
                          type="text"
                          value={formData.department}
                          onChange={(e) => handleInputChange('department', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
                          placeholder="Engineering"
                        />
                      </div>
                    </div>

                    {/* Role Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Role
                        </div>
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {availableRoles.map((role) => (
                          <label
                            key={role.value}
                            className={`flex flex-col p-3 rounded-xl border-2 cursor-pointer transition-all ${
                              formData.role === role.value
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <input
                                type="radio"
                                name="role"
                                value={role.value}
                                checked={formData.role === role.value}
                                onChange={(e) => handleInputChange('role', e.target.value)}
                                className="text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="text-xs font-semibold text-gray-900 truncate">
                                {role.label}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Status Toggles */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-900">
                              Account Status
                            </label>
                            <p className="text-xs text-gray-600 mt-1">
                              Enable or disable user account
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleInputChange('active', !formData.active)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              formData.active ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              formData.active ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          {formData.active ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-green-700 font-medium">Account is active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-600">Account is inactive</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-900">
                              <div className="flex items-center gap-2">
                                <Key className="h-4 w-4" />
                                Summary Access
                              </div>
                            </label>
                            <p className="text-xs text-gray-600 mt-1">
                              Grant access to summary reports
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleInputChange('canViewSummary', !formData.canViewSummary)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              formData.canViewSummary ? 'bg-indigo-500' : 'bg-gray-300'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              formData.canViewSummary ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          {formData.canViewSummary ? (
                            <>
                              <Key className="h-4 w-4 text-indigo-500" />
                              <span className="text-sm text-indigo-700 font-medium">Access granted</span>
                            </>
                          ) : (
                            <>
                              <Key className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">Access not granted</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Full Name
                        </label>
                        <p className="text-sm font-medium text-gray-900 mt-2 flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          {user.name}
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email Address
                        </label>
                        <p className="text-sm font-medium text-gray-900 mt-2 flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {user.email}
                        </p>
                      </div>
                      
                      {user.phone && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Phone Number
                          </label>
                          <p className="text-sm font-medium text-gray-900 mt-2 flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            {user.phone}
                          </p>
                        </div>
                      )}
                      
                      {user.department && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Department
                          </label>
                          <p className="text-sm font-medium text-gray-900 mt-2 flex items-center gap-2">
                            <Building className="h-4 w-4 text-gray-400" />
                            {user.department}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User ID
                        </label>
                        <p className="text-sm font-mono text-gray-700 mt-2 break-all">
                          {user.id}
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Account Created
                        </label>
                        <p className="text-sm text-gray-900 mt-2">
                          {formatDate(user.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Permissions Card */}
            {user.permissions && user.permissions.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        Permissions ({user.permissions.length} total)
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Grouped by category for easier management
                      </p>
                    </div>
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 rounded-xl border border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        Manage Permissions
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="p-6">
                  {permissionCategories.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {permissionCategories.map(category => (
                        <div 
                          key={category}
                          className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
                        >
                          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                            <div className="p-1.5 bg-white rounded-lg border border-gray-300">
                              {getCategoryIcon(category)}
                            </div>
                            <div>
                              <h5 className="text-sm font-semibold text-gray-900">{category}</h5>
                              <p className="text-xs text-gray-500">
                                {groupedPermissions[category].length} permission{groupedPermissions[category].length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {groupedPermissions[category].map(perm => {
                              const info = getPermissionInfo(perm.key);
                              return (
                                <div 
                                  key={perm.key}
                                  className="flex items-center gap-2 p-2 rounded-lg bg-white border border-gray-100 hover:border-gray-200 transition-colors"
                                  title={perm.description}
                                >
                                  {info.icon ? (
                                    <info.icon className="w-3.5 h-3.5 text-gray-500" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">
                                      {perm.label}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">
                                      {perm.key}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No permissions assigned</p>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="mt-4 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-sm font-medium transition-colors"
                      >
                        Add Permissions
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Activity Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100/50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-indigo-600" />
                  Activity & Status
                </h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg border border-gray-200">
                        <Calendar className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Last Login</p>
                        <p className="text-xs text-gray-600">{formatDate(user.lastLogin)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg border border-gray-200">
                        <Clock className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Account Created</p>
                        <p className="text-xs text-gray-600">{formatDate(user.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg border border-gray-200">
                        <Star className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Status</p>
                        <p className="text-xs text-gray-600">{user.active ? 'Active account' : 'Inactive account'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg border border-gray-200">
                        <Award className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Access Level</p>
                        <p className="text-xs text-gray-600">{formatRoleName(user.role)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100/50">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-3">
                  <button
                    onClick={handleToggleStatus}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                      user.active
                        ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                        : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                    }`}
                  >
                    {user.active ? (
                      <>
                        <Lock className="h-4 w-4" />
                        Deactivate User
                      </>
                    ) : (
                      <>
                        <Unlock className="h-4 w-4" />
                        Activate User
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleToggleSummaryAccess}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                      user.canViewSummary
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                    }`}
                  >
                    <Key className="h-4 w-4" />
                    {user.canViewSummary ? 'Revoke Summary Access' : 'Grant Summary Access'}
                  </button>
                  
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 hover:from-indigo-100 hover:to-purple-100 text-sm font-semibold border border-indigo-200 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    {isEditing ? 'Cancel Edit' : 'Edit User'}
                  </button>
                  
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="w-full px-4 py-3 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 text-sm font-semibold border border-red-200 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete User
                  </button>
                  
                  <button
                    onClick={fetchUserData}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 text-sm font-semibold border border-gray-200 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh Data
                  </button>
                </div>
              </div>
            </div>

            {/* System Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100/50">
                <h2 className="text-lg font-semibold text-gray-900">System Information</h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">User Status</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Summary Access</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.canViewSummary ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-600'}`}>
                      {user.canViewSummary ? 'Granted' : 'Not Granted'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Permissions</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {user.permissions?.length || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Role Category</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatRoleName(user.role)}
                    </span>
                  </div>
                  
                  {user.department && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Department</span>
                      <span className="text-sm font-medium text-gray-900">
                        {user.department}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="text-center">
                    <span className="text-xs text-gray-500">User ID</span>
                    <p className="text-xs font-mono text-gray-700 mt-1 break-all bg-gray-50 p-2 rounded">
                      {user.id}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <DeleteUserModal
          user={user}
          onClose={() => setShowDeleteModal(false)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default UserProfilePage;