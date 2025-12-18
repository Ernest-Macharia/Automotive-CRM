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
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { userService, CreateUserData } from '@/services/userService';
import { settingsService, Role } from '@/services/settingsService';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  permissions: string[];
  active: boolean;
  generatePassword: boolean;
  sendWelcomeEmail: boolean;
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
  const [availablePermissions, setAvailablePermissions] = useState<Array<{ value: string; label: string }>>([]);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    permissions: [],
    active: true,
    generatePassword: false,
    sendWelcomeEmail: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formStep, setFormStep] = useState(1);

  useEffect(() => {
    loadRolesAndPermissions();
  }, []);

  const loadRolesAndPermissions = async () => {
    try {
      const roles = await settingsService.getRoles();
      setAvailableRoles(roles);
      
      const permissionOptions = await settingsService.getPermissionOptions();
      setAvailablePermissions(permissionOptions);
    } catch (error) {
      console.error('Error loading roles and permissions:', error);
      showToast('Failed to load system data', 'error');
    }
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

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
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
    
    if (!formData.role) {
      newErrors.role = 'Role is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
        showToast('Please fix the errors in the form', 'error');
        setFormStep(1);
        return;
    }
    
    setLoading(true);
    
    try {
        // Prepare base user data
        const baseData: Omit<CreateUserData, 'password'> = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        permissions: formData.permissions,
        };
        
        // Prepare the complete user data
        const userData: CreateUserData = {
        ...baseData,
        };
        
        // Add password if applicable
        if (!formData.generatePassword) {
        // Manual password entry
        userData.password = formData.password;
        } else if (formData.sendWelcomeEmail) {
        // Generated password to be sent via email
        userData.password = formData.password;
        }
        // If generatePassword is true but sendWelcomeEmail is false,
        // we don't send password - system will generate and not reveal
        
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
      if (!formData.name.trim() || !formData.email || !formData.role) {
        showToast('Please fill in all required fields', 'error');
        return;
      }
    }
    setFormStep(prev => prev + 1);
  };

  const prevStep = () => {
    setFormStep(prev => prev - 1);
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

        <form onSubmit={handleSubmit} className="space-y-8">
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
                      value={formData.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 ${
                        errors.role ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                      }`}
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
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.role}
                    </p>
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
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Custom Permissions
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-2">
                    {availablePermissions.map((permission) => (
                      <label
                        key={permission.value}
                        className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(permission.value)}
                          onChange={() => togglePermission(permission.value)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{permission.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
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
                  
                  {/* <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">User Status</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formData.active ? 'User can login immediately' : 'User will be inactive'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => handleInputChange('active', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div> */}
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
                type="submit"
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