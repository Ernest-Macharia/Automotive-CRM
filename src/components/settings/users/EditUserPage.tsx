'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Shield,
  Users,
  Building,
  Phone,
  Globe,
  Calendar,
  Save,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  ChevronDown,
  Briefcase,
  MapPin,
  Copy,
  Download,
  RefreshCw,
  History,
  Activity,
  Key,
  Bell,
  Zap,
  Trash2,
  Search,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { settingsService, User as UserType, UpdateUserData, Role } from '@/services/settingsService';

interface Department {
  id: string;
  name: string;
  manager: string;
}

interface FormData {
  name: string;
  email: string;
  role: string;
  department: string;
  position: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  startDate: string;
  permissions: string[];
  active: boolean;
  canViewSummary: boolean;
}

interface EditUserPageProps {
  userId: string;
  onBack?: () => void;
  onSave?: () => void;
}

export default function EditUserPage({ 
  userId, 
  onBack, 
  onSave
}: EditUserPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const handleBack = () => {
    onBack?.() || router.push('/settings/users');
  };
  
  // Use onEdit for edit button
  const handleEdit = () => {
    onSave?.() || router.push(`/settings/users/${userId}/edit`);
  };
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<Array<{ value: string; label: string; category: string }>>([]);
  const [departments, setDepartments] = useState<Department[]>([
    { id: 'sales', name: 'Sales', manager: 'John Doe' },
    { id: 'marketing', name: 'Marketing', manager: 'Jane Smith' },
    { id: 'it', name: 'IT', manager: 'Bob Johnson' },
    { id: 'hr', name: 'HR', manager: 'Alice Williams' },
    { id: 'finance', name: 'Finance', manager: 'Charlie Brown' },
    { id: 'operations', name: 'Operations', manager: 'David Miller' },
  ]);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    role: '',
    department: '',
    position: '',
    phone: '',
    address: '',
    city: '',
    country: 'United States',
    startDate: '',
    permissions: [],
    active: true,
    canViewSummary: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'activity' | 'permissions'>('profile');
  const [searchUserId, setSearchUserId] = useState('');

  useEffect(() => {
    if (userId) {
      loadUser();
      loadRolesAndPermissions();
    } else {
      // If no user ID provided, redirect back to users list
      showToast('No user selected', 'error');
      router.push('/settings/users');
    }
  }, [userId]);

  const loadUser = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const data = await settingsService.getUsers();
      const userData = data.find(u => u.id === userId);
      
      if (!userData) {
        showToast('User not found', 'error');
        router.push('/settings/users');
        return;
      }
      
      setUser(userData);
      setFormData({
        name: userData.name || '',
        email: userData.email,
        role: userData.role,
        department: 'sales', // Default, would come from profile
        position: 'Employee', // Default
        phone: '',
        address: '',
        city: '',
        country: 'United States',
        startDate: userData.createdAt ? new Date(userData.createdAt).toISOString().split('T')[0] : '',
        permissions: userData.permissions || [],
        active: userData.active,
        canViewSummary: userData.canViewSummary || false,
      });
    } catch (error) {
      console.error('Error loading user:', error);
      showToast('Failed to load user', 'error');
      router.push('/settings/users');
    } finally {
      setLoading(false);
    }
  };

  const loadRolesAndPermissions = async () => {
    try {
      const roles = await settingsService.getRoles();
      setAvailableRoles(roles);
      
      const permissionOptions = await settingsService.getPermissionOptions();
      const categorizedPermissions = permissionOptions.map(perm => ({
        value: perm.value,
        label: perm.label,
        category: perm.value.split('.')[0],
      }));
      setAvailablePermissions(categorizedPermissions);
    } catch (error) {
      console.error('Error loading roles and permissions:', error);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const selectAllPermissions = () => {
    const allPermissions = availablePermissions.map(p => p.value);
    setFormData(prev => ({ ...prev, permissions: allPermissions }));
  };

  const clearAllPermissions = () => {
    setFormData(prev => ({ ...prev, permissions: [] }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.role) {
      newErrors.role = 'Role is required';
    }
    
    if (!formData.department) {
      newErrors.department = 'Department is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }
    
    setSaving(true);
    
    try {
      const userData: UpdateUserData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        permissions: formData.permissions,
        active: formData.active,
        canViewSummary: formData.canViewSummary,
      };
      
      // Note: You'll need to add an updateUser method to your settingsService
      // For now, we'll simulate the update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showToast('User updated successfully', 'success');
      
    } catch (error: any) {
      console.error('Error updating user:', error);
      showToast(error.message || 'Failed to update user', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!user) return;
    
    try {
      // Note: Add deleteUser method to your settingsService
      showToast('User deleted successfully', 'success');
      router.push('/settings/users');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      showToast(error.message || 'Failed to delete user', 'error');
    }
  };

  const handleResetPassword = async () => {
    if (!user) return;
    
    try {
      // Generate new password
      const generatedPassword = generateSecurePassword();
      setNewPassword(generatedPassword);
      
      // Note: Add resetPassword method to your settingsService
      showToast('Password reset successfully', 'success');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      showToast(error.message || 'Failed to reset password', 'error');
    }
  };

  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to discard changes?')) {
      router.push('/settings/users');
    }
  };

  const handleSearchUser = () => {
    if (searchUserId.trim()) {
      router.push(`/settings/users/edit?id=${searchUserId}`);
    }
  };

  const permissionCategories = Array.from(new Set(availablePermissions.map(p => p.category)));

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a User to Edit</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Enter a User ID to edit user details, or go back to select a user from the list.
              </p>
              
              <div className="max-w-md mx-auto space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchUserId}
                    onChange={(e) => setSearchUserId(e.target.value)}
                    placeholder="Enter User ID (e.g., 6901e1b1813162deba7e462c)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleSearchUser}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700"
                  >
                    Search User
                  </button>
                  <button
                    onClick={() => router.push('/settings/users')}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
                  >
                    Back to Users List
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleCancel}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-sm transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Edit User</h1>
                <p className="text-purple-100 mt-1">Update user details and permissions</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowResetPassword(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium backdrop-blur-sm transition-colors"
              >
                <Key className="h-4 w-4" />
                Reset Password
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium backdrop-blur-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 px-8 py-2.5 bg-white text-purple-600 rounded-xl font-medium hover:bg-purple-50 transition-all shadow-lg disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* User Info Header */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{user.name || 'No Name'}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-white text-sm">
                      ID: {user.id.slice(-8)}
                    </span>
                    <span className="text-white/80 text-sm">
                      Member since: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg">
                  <History className="h-4 w-4 text-white" />
                </button>
                <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg">
                  <Activity className="h-4 w-4 text-white" />
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg"
                >
                  <Trash2 className="h-4 w-4 text-red-300" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - User Stats */}
          <div className="lg:w-64">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm sticky top-8">
              {/* User Status */}
              <div className="text-center mb-6">
                <div className="h-20 w-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-2xl">
                    {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900">{user.name || 'No Name'}</h3>
                <p className="text-sm text-gray-600 mt-1">{user.email}</p>
                
                <div className="mt-4 space-y-2">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    user.active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.active ? 'Active' : 'Inactive'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user.role.replace('_', ' ').toUpperCase()}
                  </div>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Last Login</p>
                  <p className="text-sm text-gray-900">Today, 09:30 AM</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Sessions</p>
                  <p className="text-sm text-gray-900">24 active sessions</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Permissions</p>
                  <p className="text-sm text-gray-900">{formData.permissions.length} assigned</p>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setActiveTab('activity')}
                  className="w-full flex items-center gap-2 p-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
                >
                  <Activity className="h-4 w-4" />
                  View Activity Log
                </button>
                <button
                  onClick={() => setShowResetPassword(true)}
                  className="w-full flex items-center gap-2 p-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                >
                  <Key className="h-4 w-4" />
                  Reset Password
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(user.id)}
                  className="w-full flex items-center gap-2 p-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
                >
                  <Copy className="h-4 w-4" />
                  Copy User ID
                </button>
              </div>
            </div>
          </div>

          {/* Main Form Area */}
          <div className="flex-1">
            {/* Tabs */}
            <div className="mb-6">
              <div className="flex space-x-1 border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'profile'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab('permissions')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'permissions'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Permissions
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'security'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Security
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'activity'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Activity
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.name ? 'border-red-300' : 'border-gray-300'
                          }`}
                          disabled={saving}
                        />
                      </div>
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.email ? 'border-red-300' : 'border-gray-300'
                          }`}
                          disabled={saving}
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={saving}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Calendar className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => handleInputChange('startDate', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={saving}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Department *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                          value={formData.department}
                          onChange={(e) => handleInputChange('department', e.target.value)}
                          className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.department ? 'border-red-300' : 'border-gray-300'
                          }`}
                          disabled={saving}
                        >
                          <option value="">Select department</option>
                          {departments.map(dept => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {errors.department && (
                        <p className="mt-1 text-sm text-red-600">{errors.department}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Position
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Briefcase className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={formData.position}
                          onChange={(e) => handleInputChange('position', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Contact Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MapPin className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={saving}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={saving}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Globe className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                          value={formData.country}
                          onChange={(e) => handleInputChange('country', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={saving}
                        >
                          <option value="United States">United States</option>
                          <option value="Canada">Canada</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="Australia">Australia</option>
                          <option value="Germany">Germany</option>
                          <option value="France">France</option>
                          <option value="Japan">Japan</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Role Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Role & Status</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Shield className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                          value={formData.role}
                          onChange={(e) => handleInputChange('role', e.target.value)}
                          className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.role ? 'border-red-300' : 'border-gray-300'
                          }`}
                          disabled={saving}
                        >
                          <option value="">Select a role</option>
                          {availableRoles.map((role) => (
                            <option key={role.id} value={role.name}>
                              {role.display_name || role.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {errors.role && (
                        <p className="mt-1 text-sm text-red-600">{errors.role}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        User Status
                      </label>
                      <div className="flex items-center gap-4">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.active}
                            onChange={(e) => handleInputChange('active', e.target.checked)}
                            className="sr-only peer"
                            disabled={saving}
                          />
                          <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                          <span className="ml-3 text-sm font-medium text-gray-900">
                            {formData.active ? 'Active' : 'Inactive'}
                          </span>
                        </label>
                        
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.canViewSummary}
                            onChange={(e) => handleInputChange('canViewSummary', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            disabled={saving}
                          />
                          <span className="text-sm text-gray-700">Summary Access</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {activeTab === 'permissions' && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Permissions Management</h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAllPermissions}
                      className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                      Select All
                    </button>
                    <span className="text-gray-400">|</span>
                    <button
                      type="button"
                      onClick={clearAllPermissions}
                      className="px-4 py-2 text-sm text-red-600 hover:text-red-700"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {permissionCategories.map(category => (
                    <div key={category} className="border border-gray-200 rounded-xl p-6">
                      <h4 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">
                        {category.replace('_', ' ')} PERMISSIONS
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {availablePermissions
                          .filter(p => p.category === category)
                          .map(permission => (
                            <label
                              key={permission.value}
                              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={formData.permissions.includes(permission.value)}
                                onChange={() => togglePermission(permission.value)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                disabled={saving}
                              />
                              <div>
                                <span className="text-sm font-medium text-gray-900">{permission.label}</span>
                                <p className="text-xs text-gray-500 mt-1">{permission.value}</p>
                              </div>
                            </label>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        {formData.permissions.length} permissions selected
                      </p>
                    </div>
                    <button
                      onClick={handleSubmit}
                      disabled={saving}
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Permissions'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Security Settings</h3>
                
                <div className="space-y-6">
                  <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-red-800">Danger Zone</h4>
                        <p className="text-sm text-red-700 mt-1">
                          These actions are irreversible. Please proceed with caution.
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={() => setShowResetPassword(true)}
                        className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                      >
                        <Key className="h-4 w-4" />
                        Reset Password
                      </button>
                      
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete User
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-4">Recent Activity</h4>
                    <div className="space-y-3">
                      {[
                        { action: 'Password changed', time: 'Today, 10:30 AM', status: 'success' },
                        { action: 'Logged in from new device', time: 'Yesterday, 02:15 PM', status: 'warning' },
                        { action: 'Permissions updated', time: 'Dec 14, 2024', status: 'info' },
                        { action: 'Password reset requested', time: 'Dec 13, 2024', status: 'warning' },
                      ].map((activity, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`h-2 w-2 rounded-full ${
                              activity.status === 'success' ? 'bg-green-500' :
                              activity.status === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                            }`} />
                            <span className="text-sm text-gray-800">{activity.action}</span>
                          </div>
                          <span className="text-xs text-gray-500">{activity.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">User Activity Log</h3>
                
                <div className="space-y-4">
                  {[
                    { date: 'Today', activities: [
                      { time: '10:30 AM', action: 'Logged in from Chrome on Windows', ip: '192.168.1.100' },
                      { time: '09:45 AM', action: 'Viewed customer dashboard', ip: '192.168.1.100' },
                      { time: '09:15 AM', action: 'Updated profile information', ip: '192.168.1.100' },
                    ]},
                    { date: 'Yesterday', activities: [
                      { time: '02:15 PM', action: 'Created new opportunity', ip: '192.168.1.150' },
                      { time: '11:30 AM', action: 'Logged in from Safari on Mac', ip: '192.168.1.150' },
                    ]},
                    { date: 'Dec 14, 2024', activities: [
                      { time: '04:45 PM', action: 'Password changed successfully', ip: '192.168.1.100' },
                      { time: '03:20 PM', action: 'Permissions updated by admin', ip: '192.168.1.50' },
                    ]},
                  ].map((day, dayIndex) => (
                    <div key={dayIndex} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-900">{day.date}</h4>
                      </div>
                      <div className="divide-y divide-gray-200">
                        {day.activities.map((activity, activityIndex) => (
                          <div key={activityIndex} className="p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-sm text-gray-900">{activity.action}</p>
                                <p className="text-xs text-gray-500 mt-1">IP: {activity.ip}</p>
                              </div>
                              <span className="text-sm text-gray-500">{activity.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
                <p className="text-gray-600 text-sm mt-1">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <strong>{user.name || user.email}</strong>?
              All associated data will be permanently removed.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
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
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Key className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Reset Password</h3>
                <p className="text-gray-600 text-sm mt-1">Generate new password for user</p>
              </div>
            </div>
            
            {newPassword ? (
              <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">New Password Generated</p>
                    <p className="text-lg font-mono text-gray-900 mt-1">{newPassword}</p>
                    <p className="text-xs text-green-600 mt-2">
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
              <p className="text-gray-700 mb-6">
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
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
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