'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Save, User, Mail, Phone, Building, Shield, 
  Key, UserPlus, Lock, Settings, Users, Car, Target, 
  FileText, DollarSign, BarChart, Handshake, Ticket,
  Clipboard, MessageSquare, Bell, Globe, Database,
  CheckCircle, XCircle, AlertCircle, Plus, Trash2
} from 'lucide-react';
import { userService, User as UserType } from '@/services/userService';
import { toast } from 'react-hot-toast';

interface CreateUserPageProps {
  availableRoles?: Array<{ value: string; label: string; description?: string }>;
  onBack?: () => void;
}

const CreateUserPage: React.FC<CreateUserPageProps> = ({ 
  availableRoles = [],
  onBack 
}) => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'technician',
    phone: '',
    department: '',
    permissions: [] as string[],
    active: true,
    canViewSummary: false,
  });

  const [isAdminRegister, setIsAdminRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permissionsList, setPermissionsList] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Fetch available permissions
  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      // This would come from your permissions service
      const permissions = [
        'jobs.read', 'jobs.create', 'jobs.update', 'jobs.delete',
        'users.read', 'users.create', 'users.update', 'users.delete',
        'invoices.read', 'invoices.create', 'invoices.update',
        'opportunities.read', 'opportunities.create', 'opportunities.update',
        'vehicles.read', 'vehicles.create', 'vehicles.update',
        'reports.read', 'reports.create',
        'settings.read', 'settings.update',
        'tickets.read', 'tickets.create', 'tickets.update',
      ];
      setPermissionsList(permissions);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  // Use availableRoles if provided, otherwise use default roles
  const roles = availableRoles && availableRoles.length > 0 
    ? availableRoles 
    : [
        { value: 'admin', label: 'Administrator', description: 'Full system access' },
        { value: 'management', label: 'Management', description: 'Management access' },
        { value: 'technician', label: 'Technician', description: 'Technical operations' },
        { value: 'sales_representative', label: 'Sales Representative', description: 'Sales and customer management' },
        { value: 'finance', label: 'Finance', description: 'Financial operations' },
        { value: 'compliance', label: 'Compliance', description: 'Compliance and auditing' },
        { value: 'customer_service', label: 'Customer Service', description: 'Customer support' },
      ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const getRoleDescription = (roleValue: string) => {
    const role = roles.find(r => r.value === roleValue);
    return role?.description || '';
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.name.trim()) errors.push('Name is required');
    if (!formData.email.trim()) errors.push('Email is required');
    if (!formData.password) errors.push('Password is required');
    if (formData.password.length < 8) errors.push('Password must be at least 8 characters');
    if (formData.password !== formData.confirmPassword) errors.push('Passwords do not match');
    if (!formData.role) errors.push('Role is required');

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    setLoading(true);
    try {
      // Prepare user data
      const userData = {
        name: formData.name || formData.email.split('@')[0],
        email: formData.email,
        password: formData.password,
        role: formData.role,
        active: formData.active,
        canViewSummary: formData.canViewSummary,
        ...(formData.phone && { phone: formData.phone }),
        ...(formData.department && { department: formData.department }),
        ...(isAdminRegister && formData.permissions.length > 0 && { permissions: formData.permissions }),
      };

      // Choose create or register based on mode
      let newUser;
      if (isAdminRegister) {
        newUser = await userService.registerUser(userData);
        toast.success('User registered successfully with admin privileges!');
      } else {
        newUser = await userService.createUser(userData);
        toast.success('User created successfully!');
      }

      // Redirect to the new user's profile
      router.push(`/clients/users/${newUser.id}`);
      
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      // Enhanced error handling
      if (error.message.includes('409')) {
        toast.error('A user with this email already exists');
      } else if (error.message.includes('401') || error.message.includes('403')) {
        toast.error('You do not have permission to create users');
      } else if (error.message.includes('400')) {
        toast.error('Invalid user data. Please check all fields');
      } else {
        toast.error(error.message || 'Failed to create user');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'technician',
      phone: '',
      department: '',
      permissions: [],
      active: true,
      canViewSummary: false,
    });
    setIsAdminRegister(false);
    setShowAdvanced(false);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push('/clients');
    }
  };

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
                <div className="p-2 bg-white/20 rounded-xl">
                  {isAdminRegister ? (
                    <Lock className="h-6 w-6 text-white" />
                  ) : (
                    <UserPlus className="h-6 w-6 text-white" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {isAdminRegister ? 'Register New User (Admin)' : 'Create New User'}
                  </h1>
                  <p className="text-indigo-100">
                    {isAdminRegister 
                      ? 'Admin-only registration with full permissions' 
                      : 'Create a new user account for your system'
                    }
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                disabled={loading}
                className="px-4 py-2 rounded-xl border border-white/30 text-white hover:bg-white/10 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Reset Form
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-white text-indigo-600 hover:bg-gray-50 text-sm font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    {isAdminRegister ? 'Registering...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {isAdminRegister ? 'Register User' : 'Create User'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Basic Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100/50">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <User className="h-5 w-5 text-indigo-600" />
                    Basic Information
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Fill in the basic details for the new user account
                  </p>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Full Name *
                        </div>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
                        placeholder="John Doe"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email Address *
                        </div>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
                        placeholder="john@example.com"
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4" />
                          Password *
                        </div>
                      </label>
                      <input
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
                        placeholder="••••••••"
                        minLength={8}
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        Must be at least 8 characters long
                      </p>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4" />
                          Confirm Password *
                        </div>
                      </label>
                      <input
                        type="password"
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
                        placeholder="••••••••"
                        minLength={8}
                      />
                    </div>

                    {/* Phone */}
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

                    {/* Department */}
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
                </div>
              </div>

              {/* Role Selection Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100/50">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-indigo-600" />
                    Role Assignment *
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Select the appropriate role for this user
                  </p>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {roles.map((role) => (
                      <label
                        key={role.value}
                        className={`flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          formData.role === role.value
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <input
                            type="radio"
                            name="role"
                            value={role.value}
                            checked={formData.role === role.value}
                            onChange={(e) => handleInputChange('role', e.target.value)}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm font-semibold text-gray-900">
                            {role.label}
                          </span>
                        </div>
                        {role.description && (
                          <p className="text-xs text-gray-600 mt-1">
                            {role.description}
                          </p>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Advanced Settings Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-indigo-600" />
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Advanced Settings</h2>
                        <p className="text-sm text-gray-600">Additional configuration options</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                    >
                      {showAdvanced ? 'Hide' : 'Show'} Advanced
                    </button>
                  </div>
                </div>
                
                {showAdvanced && (
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Account Status */}
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-900">
                              Account Status
                            </label>
                            <p className="text-xs text-gray-600 mt-1">
                              Set the initial status of the account
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
                              <span className="text-sm text-green-700 font-medium">Account will be active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-600">Account will be inactive</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Summary Access */}
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
                              <span className="text-sm text-indigo-700 font-medium">Summary access granted</span>
                            </>
                          ) : (
                            <>
                              <Key className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">No summary access</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Admin Registration Toggle */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-xl">
                        <div>
                          <label className="block text-sm font-medium text-indigo-900">
                            Admin Registration Mode
                          </label>
                          <p className="text-xs text-indigo-700 mt-1">
                            {isAdminRegister 
                              ? 'Full system access with custom permissions' 
                              : 'Standard user creation with role-based permissions'
                            }
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsAdminRegister(!isAdminRegister)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            isAdminRegister ? 'bg-indigo-600' : 'bg-gray-300'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            isAdminRegister ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    </div>

                    {/* Permissions Section (only for admin register mode) */}
                    {isAdminRegister && (
                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Custom Permissions
                        </label>
                        <p className="text-sm text-gray-600 mb-4">
                          Select specific permissions for this user (overrides role permissions)
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {permissionsList.map(permission => (
                            <label
                              key={permission}
                              className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={formData.permissions.includes(permission)}
                                onChange={() => togglePermission(permission)}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="text-sm text-gray-700 truncate">{permission}</span>
                            </label>
                          ))}
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            {formData.permissions.length} permission{formData.permissions.length !== 1 ? 's' : ''} selected
                          </span>
                          <button
                            type="button"
                            onClick={() => handleInputChange('permissions', [])}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Clear All
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Summary Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100/50">
                  <h2 className="text-lg font-semibold text-gray-900">Creation Summary</h2>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">User Type</span>
                      <span className="text-sm font-medium text-gray-900">
                        {isAdminRegister ? 'Admin User' : 'Standard User'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Selected Role</span>
                      <span className="text-sm font-medium text-gray-900">
                        {roles.find(r => r.value === formData.role)?.label || formData.role}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Account Status</span>
                      <span className={`text-sm font-medium ${formData.active ? 'text-green-600' : 'text-red-600'}`}>
                        {formData.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Summary Access</span>
                      <span className={`text-sm font-medium ${formData.canViewSummary ? 'text-indigo-600' : 'text-gray-600'}`}>
                        {formData.canViewSummary ? 'Granted' : 'Not Granted'}
                      </span>
                    </div>
                    
                    {isAdminRegister && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Custom Permissions</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formData.permissions.length}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-2">Ready to create user?</p>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 text-sm font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            {isAdminRegister ? 'Registering User...' : 'Creating User...'}
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4" />
                            {isAdminRegister ? 'Register User' : 'Create User'}
                          </>
                        )}
                      </button>
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
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 text-sm font-semibold border border-gray-200 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      {showAdvanced ? 'Hide' : 'Show'} Advanced
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setIsAdminRegister(!isAdminRegister)}
                      className="w-full px-4 py-3 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-sm font-semibold border border-indigo-200 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      {isAdminRegister ? (
                        <>
                          <User className="h-4 w-4" />
                          Switch to Standard
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          Switch to Admin
                        </>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleReset}
                      disabled={loading}
                      className="w-full px-4 py-3 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 text-sm font-semibold border border-red-200 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Reset Form
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleBack}
                      disabled={loading}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Cancel & Go Back
                    </button>
                  </div>
                </div>
              </div>

              {/* Help Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100/50">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-indigo-600" />
                    Help & Tips
                  </h2>
                </div>
                
                <div className="p-6">
                  <ul className="space-y-3 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5"></div>
                      <span>Required fields are marked with *</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5"></div>
                      <span>Password must be at least 8 characters long</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5"></div>
                      <span>User will receive an email notification</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5"></div>
                      <span>Admin registration requires special privileges</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserPage;