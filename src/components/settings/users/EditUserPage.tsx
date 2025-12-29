'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Shield,
  Save,
  Key,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  X,
  Trash2,
  Search,
  Building,
  Phone,
  Globe,
  Calendar,
  Briefcase,
  MapPin,
  ShieldCheck,
  PlusCircle,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { 
  userService, 
  User as UserType, 
  UpdateUserData, 
  USER_ROLES,
  USER_PERMISSIONS 
} from '@/services/settings/userService';
import { roleService } from '@/services/settings/roleService';

interface FormData {
  name: string;
  email: string;
  roleName: string;
  department: string;
  position: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  startDate: string;
  active: boolean;
  canViewSummary: boolean;
  generatePassword: boolean;
  password: string;
  confirmPassword: string;
}

interface PermissionOption {
  value: string;
  label: string;
  category: string;
}

interface UserEditProps {
  userId: string;
}

export default function EditUserPage({ userId }: UserEditProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Array<{ 
    id: string; 
    name: string; 
    display_name: string; 
    description?: string; 
  }>>([]);
  const [availablePermissions, setAvailablePermissions] = useState<PermissionOption[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  
  const departments = [
    { id: 'sales', name: 'Sales', manager: 'John Doe' },
    { id: 'marketing', name: 'Marketing', manager: 'Jane Smith' },
    { id: 'it', name: 'IT', manager: 'Bob Johnson' },
    { id: 'hr', name: 'HR', manager: 'Alice Williams' },
    { id: 'finance', name: 'Finance', manager: 'Charlie Brown' },
    { id: 'operations', name: 'Operations', manager: 'David Miller' },
  ];

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    roleName: '',
    department: '',
    position: '',
    phone: '',
    address: '',
    city: '',
    country: 'United States',
    startDate: '',
    active: true,
    canViewSummary: false,
    generatePassword: false,
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [formStep, setFormStep] = useState(1);
  const [searchUserId, setSearchUserId] = useState('');

  useEffect(() => {
    if (userId) {
      loadUser();
      loadRolesAndPermissions();
    } else {
      showToast('No user selected', 'error');
      router.push('/settings/users');
    }
  }, [userId]);

  const loadUser = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const userData = await userService.getUserById(userId);
      if (!userData) {
        showToast('User not found', 'error');
        router.push('/settings/users');
        return;
      }
      setUser(userData);
      
      setFormData({
        name: userData.name || '',
        email: userData.email,
        roleName: userService.getUserRoleName(userData),
        department: 'sales',
        position: 'Employee',
        phone: '',
        address: '',
        city: '',
        country: 'United States',
        startDate: userData.createdAt ? new Date(userData.createdAt).toISOString().split('T')[0] : '',
        active: userData.active,
        canViewSummary: userData.canViewSummary || false,
        generatePassword: false,
        password: '',
        confirmPassword: '',
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
      // Load roles using roleService
      const roles = await roleService.getAllRoles();
      const formattedRoles = roles.map(role => ({
        id: role.id || role._id || '',
        name: role.name,
        display_name: role.display_name || role.name,
        description: role.description || undefined,
      }));
      setAvailableRoles(formattedRoles);
      
      // Load permissions using userService
      const permissionsResponse = await userService.getAvailablePermissions();
      const formattedPermissions = permissionsResponse.permissions.map(permission => {
        const parts = permission.split('.');
        const category = parts[0] || 'general';
        const label = formatPermissionLabel(permission);
        return { value: permission, label, category };
      });
      setAvailablePermissions(formattedPermissions);
    } catch (error) {
      console.error('Error loading roles and permissions:', error);
      setAvailablePermissions(getDefaultPermissions());
    }
  };

  const getDefaultPermissions = (): PermissionOption[] => {
    return [
      { value: USER_PERMISSIONS.USERS_CREATE, label: 'Create Users', category: 'users' },
      { value: USER_PERMISSIONS.USERS_READ, label: 'Read Users', category: 'users' },
      { value: USER_PERMISSIONS.USERS_UPDATE, label: 'Update Users', category: 'users' },
      { value: USER_PERMISSIONS.USERS_DELETE, label: 'Delete Users', category: 'users' },
      { value: USER_PERMISSIONS.DASHBOARD_VIEW, label: 'View Dashboard', category: 'dashboard' },
      { value: 'leads.create', label: 'Create Leads', category: 'leads' },
      { value: 'leads.read', label: 'Read Leads', category: 'leads' },
      { value: 'leads.update', label: 'Update Leads', category: 'leads' },
      { value: 'leads.delete', label: 'Delete Leads', category: 'leads' },
      { value: 'quotes.create', label: 'Create Quotes', category: 'quotes' },
      { value: 'quotes.read', label: 'Read Quotes', category: 'quotes' },
      { value: 'quotes.update', label: 'Update Quotes', category: 'quotes' },
      { value: 'work_orders.create', label: 'Create Work Orders', category: 'work_orders' },
      { value: 'work_orders.read', label: 'Read Work Orders', category: 'work_orders' },
      { value: 'work_orders.update', label: 'Update Work Orders', category: 'work_orders' },
      { value: 'reports.generate', label: 'Generate Reports', category: 'reports' },
      { value: 'reports.view', label: 'View Reports', category: 'reports' },
    ];
  };

  const formatPermissionLabel = (permission: string): string => {
    const parts = permission.split('.');
    if (parts.length >= 2) {
      const [entity, action] = parts;
      const actionLabel = action.charAt(0).toUpperCase() + action.slice(1);
      const entityLabel = entity.split('_').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      return `${actionLabel} ${entityLabel}`;
    }
    return permission;
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    if (field === 'generatePassword' && value) {
      const generatedPassword = generateSecurePassword();
      setFormData(prev => ({
        ...prev,
        password: generatedPassword,
        confirmPassword: generatedPassword
      }));
    } else if (field === 'generatePassword' && !value) {
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));
    }
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
    
    if (formData.generatePassword) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    if (!formData.roleName) {
      newErrors.roleName = 'Role is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      setFormStep(1);
      return;
    }
    
    setSaving(true);
    
    try {
      const userData: UpdateUserData = {
        name: formData.name,
        email: formData.email,
        role: formData.roleName,
        active: formData.active,
        canViewSummary: formData.canViewSummary,
      };
      
      await userService.updateUser(userId, userData);
      showToast('User updated successfully', 'success');
      setTimeout(() => {
        router.push(`/settings/users/${userId}`);
      }, 1500);
    } catch (error: any) {
      console.error('Error updating user:', error);
      showToast(error.message || 'Failed to update user', 'error');
    } finally {
      setSaving(false);
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
    setShowResetPassword(true);
    showToast('Password generated successfully', 'success');
  };

  const nextStep = () => {
    if (formStep === 1) {
      if (!formData.name.trim() || !formData.email || !formData.roleName) {
        showToast('Please fill in all required fields', 'error');
        return;
      }
    }
    setFormStep(prev => prev + 1);
  };

  const prevStep = () => {
    setFormStep(prev => prev - 1);
  };

  const permissionCategories = Array.from(new Set(availablePermissions.map(p => p.category)));

  if (!userId) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  onClick={() => router.push(`/settings/users/edit?id=${searchUserId}`)}
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
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/settings/users/${userId}`)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit User</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Update user details and permissions</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleResetPassword}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
            >
              <Key className="h-4 w-4" />
              Reset Password
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </button>
          </div>
        </div>
        
        {/* User Info Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">
                {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user.name || 'No Name'}</h2>
              <div className="flex items-center gap-4 mt-2">
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 text-sm">
                  ID: {user.id.slice(-8)}
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  Member since: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          {[1, 2].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                formStep >= step
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              }`}>
                {formStep > step ? <Check className="h-5 w-5" /> : step}
              </div>
              {step < 2 && (
                <div className={`w-20 h-1 mx-2 ${
                  formStep > step ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                }`} />
              )}
            </div>
          ))}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Step {formStep} of 2
          </div>
        </div>
      </div>

      <form className="space-y-8">
        {/* Step 1: Basic Info */}
        {formStep === 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Basic Information</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 ${
                      errors.name ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="John Doe"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 ${
                      errors.email ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="john.doe@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    value={formData.roleName}
                    onChange={(e) => handleInputChange('roleName', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 ${
                      errors.roleName ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <option value="">Select a role</option>
                    {availableRoles.map((role) => (
                      <option key={role.id || role.name} value={role.name}>
                        {role.display_name || role.name}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.roleName && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.roleName}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="flex items-center gap-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => handleInputChange('active', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      {formData.active ? (
                        <>
                          <UserCheck className="h-4 w-4 text-green-500" />
                          Active
                        </>
                      ) : (
                        <>
                          <UserX className="h-4 w-4 text-red-500" />
                          Inactive
                        </>
                      )}
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.canViewSummary}
                      onChange={(e) => handleInputChange('canViewSummary', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Summary Access</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Security */}
        {formStep === 2 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Security Settings</h3>
            <div className="space-y-6">
              <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-500/10 dark:to-orange-500/10 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  <div>
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-300">Password Reset</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                      You can reset the user's password or leave it unchanged
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                <input
                  type="checkbox"
                  id="generatePassword"
                  checked={formData.generatePassword}
                  onChange={(e) => handleInputChange('generatePassword', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="generatePassword" className="text-sm text-gray-700 dark:text-gray-300">
                  Reset user password
                </label>
              </div>
              {formData.generatePassword && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Password *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Key className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className={`w-full pl-10 pr-10 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 ${
                          errors.password ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Key className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 ${
                          errors.confirmPassword ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="Confirm new password"
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {formData.generatePassword && formData.password && (
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-400">Generated Password</p>
                      <p className="text-lg font-mono text-gray-900 dark:text-white mt-1">{formData.password}</p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                        This password will be displayed only once. Make sure to save it.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(formData.password)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
              
              <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800 dark:text-red-300">Danger Zone</h4>
                    <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                      These actions are irreversible. Please proceed with caution.
                    </p>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setShowResetPassword(true)}
                        className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-red-300 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      >
                        <Key className="h-4 w-4" />
                        Generate New Password
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete User
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          {formStep > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.push(`/settings/users/${userId}`)}
              className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          )}

          {formStep < 2 ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Next
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Update User
                </>
              )}
            </button>
          )}
        </div>
      </form>

      {/* Reset Password Modal */}
      {showResetPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
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
                The user will need to change it on their next login.
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
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
    </div>
  );
}