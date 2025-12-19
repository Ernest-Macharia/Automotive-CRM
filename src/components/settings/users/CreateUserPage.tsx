'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  UserPlus,
  ChevronRight,
  KeyRound,
  ShieldCheck,
  PlusCircle,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { userService, CreateUserData } from '@/services/userService';
import { settingsService, Role } from '@/services/settingsService';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  roleName: string;
  rolePermissions: string[];
  additionalPermissions: string[];
  active: boolean;
  generatePassword: boolean;
  sendWelcomeEmail: boolean;
}

interface PermissionOption {
  value: string;
  label: string;
}

interface PermissionsResponse {
  permissions?: string[];
}

interface CreateUserPageProps {
  onBack?: () => void;
}

export default function CreateUserPage({ onBack }: CreateUserPageProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const handleBack = () => {
    onBack?.() || router.push('/settings/users');
  };
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<PermissionOption[]>([]);
  const [selectedRoleDetails, setSelectedRoleDetails] = useState<Role | null>(null);
  const [loadingRolePermissions, setLoadingRolePermissions] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    roleName: '',
    rolePermissions: [],
    additionalPermissions: [],
    active: true,
    generatePassword: false,
    sendWelcomeEmail: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formStep, setFormStep] = useState(1);

  useEffect(() => {
    loadRolesAndPermissions();
  }, []);

  useEffect(() => {
    // When role changes, fetch role permissions
    if (formData.roleName) {
      fetchRolePermissions(formData.roleName);
    } else {
      setSelectedRoleDetails(null);
      setFormData(prev => ({ ...prev, rolePermissions: [] }));
    }
  }, [formData.roleName]);

  const loadRolesAndPermissions = async () => {
    try {
      // Use getRoles instead of getAllRoles
      const roles = await settingsService.getRoles();
      setAvailableRoles(Array.isArray(roles) ? roles : [roles]);
      
      // Load all available permissions for additional selection
      try {
        // Try to get permissions from the /roles/permissions endpoint
        const allPermissionsResponse = await settingsService.getPermissionOptions() as any;
        const permissionOptions: PermissionOption[] = [];
        
        if (Array.isArray(allPermissionsResponse)) {
          // If response is an array of strings
          allPermissionsResponse.forEach((permission: string) => {
            permissionOptions.push({
              value: permission,
              label: formatPermissionLabel(permission),
            });
          });
        } else if (allPermissionsResponse && allPermissionsResponse.permissions && Array.isArray(allPermissionsResponse.permissions)) {
          // If response has a permissions property with array
          allPermissionsResponse.permissions.forEach((permission: string) => {
            permissionOptions.push({
              value: permission,
              label: formatPermissionLabel(permission),
            });
          });
        } else if (allPermissionsResponse && typeof allPermissionsResponse === 'object') {
          // If response is an array of objects
          Object.entries(allPermissionsResponse).forEach(([key, value]) => {
            if (typeof value === 'string') {
              permissionOptions.push({
                value: value,
                label: formatPermissionLabel(value),
              });
            }
          });
        }
        
        if (permissionOptions.length > 0) {
          setAvailablePermissions(permissionOptions);
        } else {
          // If no permissions found, use default permissions
          setAvailablePermissions(getDefaultPermissions());
        }
      } catch (permError) {
        console.error('Error loading permissions:', permError);
        // If permission endpoint fails, use default permissions
        setAvailablePermissions(getDefaultPermissions());
      }
    } catch (error) {
      console.error('Error loading roles and permissions:', error);
      showToast('Failed to load system data', 'error');
    }
  };

  const getDefaultPermissions = (): PermissionOption[] => {
    return [
      { value: 'users.create', label: 'Create Users' },
      { value: 'users.read', label: 'Read Users' },
      { value: 'users.update', label: 'Update Users' },
      { value: 'users.delete', label: 'Delete Users' },
      { value: 'dashboard.view', label: 'View Dashboard' },
      { value: 'leads.create', label: 'Create Leads' },
      { value: 'leads.read', label: 'Read Leads' },
      { value: 'leads.update', label: 'Update Leads' },
      { value: 'leads.delete', label: 'Delete Leads' },
      { value: 'quotes.create', label: 'Create Quotes' },
      { value: 'quotes.read', label: 'Read Quotes' },
      { value: 'quotes.update', label: 'Update Quotes' },
      { value: 'work_orders.create', label: 'Create Work Orders' },
      { value: 'work_orders.read', label: 'Read Work Orders' },
      { value: 'work_orders.update', label: 'Update Work Orders' },
      { value: 'reports.generate', label: 'Generate Reports' },
      { value: 'reports.view', label: 'View Reports' },
    ];
  };

  const fetchRolePermissions = async (roleName: string) => {
    try {
      setLoadingRolePermissions(true);
      
      // Find the selected role from available roles
      const role = availableRoles.find(r => r.name === roleName);
      if (role) {
        setSelectedRoleDetails(role);
        
        // If role has permissions array, use it
        const permissions = role.permissions || [];
        setFormData(prev => ({
          ...prev,
          rolePermissions: permissions,
          // Clear additional permissions that might be included in role permissions
          additionalPermissions: prev.additionalPermissions.filter(
            p => !permissions.includes(p)
          ),
        }));
      } else {
        try {
          // Try to fetch role details from API using POST /roles/find
          const roleDetails = await fetch('/api/v1/roles/find', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: roleName }),
          });
          
          if (roleDetails.ok) {
            const roleData = await roleDetails.json();
            setSelectedRoleDetails(roleData);
            
            const permissions = roleData.permissions || [];
            setFormData(prev => ({
              ...prev,
              rolePermissions: permissions,
              additionalPermissions: prev.additionalPermissions.filter(
                p => !permissions.includes(p)
              ),
            }));
          } else {
            console.warn(`Role ${roleName} not found via API`);
            // If role not found via API, set default permissions based on role name
            const defaultPermissions = getDefaultPermissionsForRole(roleName);
            setFormData(prev => ({
              ...prev,
              rolePermissions: defaultPermissions,
              additionalPermissions: prev.additionalPermissions.filter(
                p => !defaultPermissions.includes(p)
              ),
            }));
          }
        } catch (apiError) {
          console.error('Error fetching role from API:', apiError);
          // Fallback to default permissions
          const defaultPermissions = getDefaultPermissionsForRole(roleName);
          setFormData(prev => ({
            ...prev,
            rolePermissions: defaultPermissions,
            additionalPermissions: prev.additionalPermissions.filter(
              p => !defaultPermissions.includes(p)
            ),
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      showToast('Failed to load role permissions', 'error');
    } finally {
      setLoadingRolePermissions(false);
    }
  };

  const getDefaultPermissionsForRole = (roleName: string): string[] => {
    // Default permissions based on common role names
    const rolePermissions: Record<string, string[]> = {
      'admin': ['users.create', 'users.read', 'users.update', 'users.delete', 'dashboard.view', 'reports.generate', 'reports.view'],
      'sales_manager': ['leads.create', 'leads.read', 'leads.update', 'quotes.create', 'quotes.read', 'quotes.update', 'dashboard.view', 'reports.view'],
      'sales_rep': ['leads.create', 'leads.read.own', 'leads.update.own', 'quotes.create', 'quotes.read.own', 'quotes.update.own', 'dashboard.view'],
      'technician': ['work_orders.read.assigned', 'work_orders.update.assigned', 'dashboard.view'],
      'technical_manager': ['work_orders.create', 'work_orders.read', 'work_orders.update', 'dashboard.view', 'reports.view'],
    };
    
    return rolePermissions[roleName] || ['dashboard.view'];
  };

  const formatPermissionLabel = (permission: string): string => {
    // Convert "users.create" to "Create Users"
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

  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const toggleAdditionalPermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      additionalPermissions: prev.additionalPermissions.includes(permission)
        ? prev.additionalPermissions.filter(p => p !== permission)
        : [...prev.additionalPermissions, permission]
    }));
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
    
    if (!formData.generatePassword) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        newErrors.password = 'Password must include uppercase, lowercase, and numbers';
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    if (!formData.roleName) {
      newErrors.role = 'Role is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // In your handleSubmit function in CreateUserPage
  const handleSubmit = async () => {
    
    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      setFormStep(1);
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare user data WITHOUT permissions
      // Backend will assign permissions based on the role
      const userData: CreateUserData = {
        name: formData.name,
        email: formData.email,
        roleName: formData.roleName,
      };
      
      // Only add password if applicable
      if (!formData.generatePassword) {
        userData.password = formData.password;
      } else if (formData.sendWelcomeEmail) {
        userData.password = formData.password;
      }
      
      const newUser = await userService.createUser(userData);
      showToast('User created successfully', 'success');
      
      router.push('/settings/users');
      
    } catch (error: any) {
      console.error('Error creating user:', error);
      showToast(error.message || 'Failed to create user', 'error');
    } finally {
      setLoading(false);
    }
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

  // Get permissions that are available for additional selection
  const getAvailableAdditionalPermissions = (): PermissionOption[] => {
    return availablePermissions.filter(
      permission => !formData.rolePermissions.includes(permission.value)
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/settings/users')}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-sm transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Create New User</h1>
                <p className="text-blue-100 mt-1">Add a new user to your CRM system</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                formStep >= step 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              }`}>
                {formStep > step ? <Check className="h-5 w-5" /> : step}
              </div>
              {step < 3 && (
                <div className={`w-20 h-1 mx-2 ${
                  formStep > step ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                }`} />
              )}
            </div>
          ))}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Step {formStep} of 3
          </div>
        </div>

        <form className="space-y-8">
          {/* Step 1: Basic Info */}
          {formStep === 1 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
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
                        errors.role ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      disabled={loadingRolePermissions}
                    >
                      <option value="">Select a role</option>
                      {availableRoles.map((role) => (
                        <option key={role.id || role._id} value={role.name}>
                          {role.display_name || role.name}
                        </option>
                      ))}
                    </select>
                    {loadingRolePermissions && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                  {errors.role && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.role}
                    </p>
                  )}

                  {/* Role Description */}
                  {selectedRoleDetails && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-800 rounded-lg">
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-800 dark:text-blue-300">
                            {selectedRoleDetails.display_name || selectedRoleDetails.name}
                          </h4>
                          {selectedRoleDetails.description && (
                            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                              {selectedRoleDetails.description}
                            </p>
                          )}
                          {formData.rolePermissions.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-blue-800 dark:text-blue-300">
                                Includes {formData.rolePermissions.length} permission(s)
                              </p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {formData.rolePermissions.slice(0, 3).map((permission: string) => (
                                  <span
                                    key={permission}
                                    className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full"
                                  >
                                    {formatPermissionLabel(permission)}
                                  </span>
                                ))}
                                {formData.rolePermissions.length > 3 && (
                                  <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full">
                                    +{formData.rolePermissions.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Security */}
          {formStep === 2 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Security Settings</h3>
              
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                  <input
                    type="checkbox"
                    id="generatePassword"
                    checked={formData.generatePassword}
                    onChange={(e) => handleInputChange('generatePassword', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="generatePassword" className="text-sm text-gray-700 dark:text-gray-300">
                    Auto-generate secure password
                  </label>
                </div>
                
                {!formData.generatePassword && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Password *
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
                          placeholder="Enter password"
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
                          placeholder="Confirm password"
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
              </div>
            </div>
          )}

          {/* Step 3: Permissions & Settings */}
          {formStep === 3 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Permissions & Settings</h3>
              
              <div className="space-y-8">
                {/* Role Permissions Section */}
                {selectedRoleDetails && formData.rolePermissions.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Role Permissions ({formData.rolePermissions.length})
                      </h4>
                      <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                        Auto-assigned
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      These permissions are automatically included with the {selectedRoleDetails.display_name || selectedRoleDetails.name} role
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                      {formData.rolePermissions.map((permission: string) => {
                        const permissionOption = availablePermissions.find(p => p.value === permission);
                        return (
                          <div
                            key={permission}
                            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 rounded-lg"
                          >
                            <ShieldCheck className="h-4 w-4 text-green-500 dark:text-green-400" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {permissionOption?.label || formatPermissionLabel(permission)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Additional Permissions Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <PlusCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Additional Permissions
                      </h4>
                      {formData.additionalPermissions.length > 0 && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full">
                          {formData.additionalPermissions.length} added
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Add extra permissions beyond what's included in the role
                  </p>
                  
                  {getAvailableAdditionalPermissions().length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                      <Shield className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-400">
                        No additional permissions available. The selected role already includes all permissions.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                      {getAvailableAdditionalPermissions().map((permission: PermissionOption) => (
                        <label
                          key={permission.value}
                          className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                            formData.additionalPermissions.includes(permission.value)
                              ? 'border-purple-300 dark:border-purple-500 bg-purple-50 dark:bg-purple-500/10'
                              : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-500/5'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.additionalPermissions.includes(permission.value)}
                            onChange={() => toggleAdditionalPermission(permission.value)}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {permission.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Email Settings */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-800">
                    <input
                      type="checkbox"
                      id="sendWelcomeEmail"
                      checked={formData.sendWelcomeEmail}
                      onChange={(e) => handleInputChange('sendWelcomeEmail', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <label htmlFor="sendWelcomeEmail" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Send welcome email with login instructions
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        User will receive email with login credentials
                      </p>
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
                onClick={() => router.push('/settings/users')}
                className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            )}

            {formStep < 3 ? (
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
                disabled={loading}
                className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" />
                    Create User
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}