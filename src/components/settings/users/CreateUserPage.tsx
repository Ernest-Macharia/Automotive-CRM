'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Shield,
  Key,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  X,
  UserPlus,
  ShieldCheck,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { userService, RegisterUserData, USER_ROLES } from '@/services/settings/userService';
import { roleService } from '@/services/settings/roleService';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  roleName: string;
  active: boolean;
  generatePassword: boolean;
  sendWelcomeEmail: boolean;
}

interface RoleOption {
  id: string;
  name: string;
  display_name: string;
  description?: string;
}

export default function CreateUserPage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<RoleOption[]>([]);
  const [rolesLoaded, setRolesLoaded] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    roleName: USER_ROLES.ADMIN,
    active: true,
    generatePassword: false,
    sendWelcomeEmail: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formStep, setFormStep] = useState(1);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const roles = await roleService.getAllRoles();

      const formattedRoles = roles.map(role => ({
        id: role.id || role._id || '',
        name: role.name,
        display_name: role.display_name || role.name,
        description: role.description || undefined,
      }));
      
      setAvailableRoles(formattedRoles);
      setRolesLoaded(true);
      
      if (roles.length === 0) {
        showToast('No roles found. Please create roles first.', 'warning');
      }
      
    } catch (error) {
      console.error('Error loading roles:', error);
      showToast('Failed to load roles', 'error');
      setAvailableRoles([]);
      setRolesLoaded(true);
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
    const length = 12;
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
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
    
    setLoading(true);
    
    try {
      const userData: RegisterUserData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.generatePassword ? formData.password : formData.password,
        roleName: formData.roleName,
      };
      
      const newUser = await userService.registerUser(userData);
      
      showToast('User created successfully!', 'success');

      if (formData.generatePassword && !formData.sendWelcomeEmail) {
        setTimeout(() => {
          showToast(`Generated password: ${userData.password}`, 'info', 10000);
        }, 1000);
      }
      
      setTimeout(() => {
        router.push('/settings/users');
      }, 1500);
      
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      let errorMessage = 'Failed to create user';
      
      if (error.message) {
        errorMessage = error.message;
        
        if (errorMessage.includes('Only admin')) {
          errorMessage = 'You need administrator privileges to create users';
        } else if (errorMessage.includes('already exists')) {
          errorMessage = 'A user with this email already exists';
        } else if (errorMessage.includes('Role') && errorMessage.includes('not found')) {
          const roleMatch = errorMessage.match(/Role "([^"]+)" not found/);
          const roleName = roleMatch ? roleMatch[1] : formData.roleName;
          errorMessage = `Role "${roleName}" was not found. Available roles: ${availableRoles.map(r => r.display_name).join(', ')}`;
        } else if (errorMessage.includes('Missing required')) {
          errorMessage = 'Please fill in all required fields';
        } else if (errorMessage.includes('Invalid email')) {
          errorMessage = 'Please enter a valid email address';
        } else if (errorMessage.includes('Password must be at least')) {
          errorMessage = 'Password must be at least 8 characters long';
        }
      }
      
      showToast(errorMessage, 'error');
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/settings/users')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New User</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Add a new user to your system</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
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
                    disabled={!rolesLoaded}
                  >
                    <option value="">Select a role</option>
                    {availableRoles.length === 0 ? (
                      <option value="" disabled>Loading roles...</option>
                    ) : (
                      availableRoles.map((role) => (
                        <option key={role.id || role.name} value={role.name}>
                          {role.display_name || role.name}
                        </option>
                      ))
                    )}
                  </select>
                  {!rolesLoaded && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
                {errors.roleName && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.roleName}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Security */}
        {formStep === 2 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
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
                        placeholder="Enter password (min 8 characters)"
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

        {/* Step 3: Review & Settings */}
        {formStep === 3 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Review & Settings</h3>
            
            <div className="space-y-8">
              {/* User Summary */}
              <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">User Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formData.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formData.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Role</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {availableRoles.find(r => r.name === formData.roleName)?.display_name || formData.roleName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                    <p className="font-medium text-green-600 dark:text-green-400">Active</p>
                  </div>
                </div>
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
                      Send welcome email
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      User will receive email with login credentials and instructions
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
  );
}