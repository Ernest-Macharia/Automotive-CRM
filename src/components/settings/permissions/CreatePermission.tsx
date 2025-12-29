'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Shield,
  Save,
  AlertCircle,
  Check,
  FileText,
  Users,
  BarChart,
  Database,
  Settings,
  TrendingUp,
  ShoppingCart,
  Wrench,
  Phone,
  Mail,
  Folder,
  Globe,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { roleService } from '@/services/settings/roleService';

interface FormData {
  name: string;
  displayName: string;
  description: string;
  category: string;
  module: string;
  action: string;
  scope: string;
}

export default function CreatePermission() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    displayName: '',
    description: '',
    category: 'users',
    module: 'users',
    action: 'read',
    scope: 'global',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formStep, setFormStep] = useState(1);
  const [generatedName, setGeneratedName] = useState('');

  const categories = [
    { id: 'users', name: 'User Management', icon: Users, description: 'User and role management permissions' },
    { id: 'dashboard', name: 'Dashboard', icon: BarChart, description: 'Dashboard and analytics access' },
    { id: 'leads', name: 'Leads', icon: TrendingUp, description: 'Lead management permissions' },
    { id: 'opportunities', name: 'Opportunities', icon: TrendingUp, description: 'Opportunity management permissions' },
    { id: 'quotes', name: 'Quotes', icon: FileText, description: 'Quote creation and management' },
    { id: 'sales_orders', name: 'Sales Orders', icon: ShoppingCart, description: 'Sales order processing' },
    { id: 'work_orders', name: 'Work Orders', icon: Wrench, description: 'Work order management' },
    { id: 'inventory', name: 'Inventory', icon: Database, description: 'Inventory management' },
    { id: 'reports', name: 'Reports', icon: BarChart, description: 'Report generation and viewing' },
    { id: 'settings', name: 'Settings', icon: Settings, description: 'System settings access' },
    { id: 'custom', name: 'Custom', icon: Settings, description: 'Custom application modules' },
  ];

  const actions = [
    { id: 'create', name: 'Create', description: 'Create new records' },
    { id: 'read', name: 'Read', description: 'View records' },
    { id: 'update', name: 'Update', description: 'Modify existing records' },
    { id: 'delete', name: 'Delete', description: 'Remove records' },
    { id: 'approve', name: 'Approve', description: 'Approve records' },
    { id: 'export', name: 'Export', description: 'Export data' },
    { id: 'import', name: 'Import', description: 'Import data' },
    { id: 'manage', name: 'Manage', description: 'Full management access' },
    { id: 'view', name: 'View', description: 'View only access' },
    { id: 'execute', name: 'Execute', description: 'Execute actions' },
  ];

  const scopes = [
    { id: 'global', name: 'Global', description: 'Access across entire system', icon: Globe },
    { id: 'own', name: 'Own Records', description: 'Access only to own records', icon: Users },
    { id: 'team', name: 'Team Records', description: 'Access to team records', icon: Users },
    { id: 'department', name: 'Department', description: 'Access within department', icon: Folder },
  ];

  useEffect(() => {
    generatePermissionName();
  }, [formData.category, formData.action, formData.scope]);

  const generatePermissionName = () => {
    let name = `${formData.category}.${formData.action}`;
    if (formData.scope !== 'global') {
      name += `.${formData.scope}`;
    }
    setGeneratedName(name);
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.action) {
      newErrors.action = 'Action is required';
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
      // Prepare permission data
      const permissionData = {
        id: generatedName,
        name: generatedName,
        displayName: formData.displayName,
        description: formData.description,
        category: formData.category,
        module: formData.category === 'custom' ? formData.module : formData.category,
        action: formData.action,
        scope: formData.scope,
      };
      
      // Here you would call your API to create the permission
      // For now, we'll simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showToast('Permission created successfully', 'success');
      router.push('/settings/permissions');
      
    } catch (error: any) {
      console.error('Error creating permission:', error);
      showToast(error.message || 'Failed to create permission', 'error');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (formStep === 1) {
      if (!formData.displayName.trim() || !formData.description.trim()) {
        showToast('Please fill in all required fields', 'error');
        return;
      }
    }
    setFormStep(prev => prev + 1);
  };

  const prevStep = () => {
    setFormStep(prev => prev - 1);
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.icon || Settings;
  };

  const getCategoryColor = (categoryId: string) => {
    switch (categoryId) {
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
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                formStep >= step 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {formStep > step ? <Check className="h-5 w-5" /> : step}
              </div>
              {step < 3 && (
                <div className={`w-20 h-1 mx-2 ${
                  formStep > step ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
          <div className="text-sm text-gray-600">
            Step {formStep} of 3
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Basic Info */}
          {formStep === 1 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Shield className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => handleInputChange('displayName', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.displayName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="e.g., View User Profiles"
                    />
                  </div>
                  {errors.displayName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.displayName}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    User-friendly name for the permission
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.description ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Describe what this permission allows users to do..."
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Category & Action */}
          {formStep === 2 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Category & Action</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Select Category *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((category) => {
                      const Icon = category.icon;
                      return (
                        <label
                          key={category.id}
                          className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all ${
                            formData.category === category.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="category"
                            value={category.id}
                            checked={formData.category === category.id}
                            onChange={(e) => handleInputChange('category', e.target.value)}
                            className="sr-only"
                          />
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${getCategoryColor(category.id)}`}>
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <span className="font-medium text-gray-900">{category.name}</span>
                              <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                            </div>
                          </div>
                          {formData.category === category.id && (
                            <div className="absolute top-2 right-2">
                              <Check className="h-5 w-5 text-blue-600" />
                            </div>
                          )}
                        </label>
                      );
                    })}
                  </div>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.category}
                    </p>
                  )}
                </div>

                {formData.category === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Module Name
                    </label>
                    <input
                      type="text"
                      value={formData.module}
                      onChange={(e) => handleInputChange('module', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter custom module name"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Enter the name for your custom module (lowercase, no spaces)
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Select Action *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {actions.map((action) => (
                      <label
                        key={action.id}
                        className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all ${
                          formData.action === action.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="action"
                          value={action.id}
                          checked={formData.action === action.id}
                          onChange={(e) => handleInputChange('action', e.target.value)}
                          className="sr-only"
                        />
                        <div>
                          <span className="font-medium text-gray-900">{action.name}</span>
                          <p className="text-sm text-gray-500 mt-1">{action.description}</p>
                        </div>
                        {formData.action === action.id && (
                          <div className="absolute top-2 right-2">
                            <Check className="h-5 w-5 text-blue-600" />
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                  {errors.action && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.action}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Scope & Review */}
          {formStep === 3 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Scope & Review</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Select Scope *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {scopes.map((scope) => {
                      const Icon = scope.icon;
                      return (
                        <label
                          key={scope.id}
                          className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all ${
                            formData.scope === scope.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="scope"
                            value={scope.id}
                            checked={formData.scope === scope.id}
                            onChange={(e) => handleInputChange('scope', e.target.value)}
                            className="sr-only"
                          />
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-blue-100">
                              <Icon className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <span className="font-medium text-gray-900">{scope.name}</span>
                              <p className="text-sm text-gray-500 mt-1">{scope.description}</p>
                            </div>
                          </div>
                          {formData.scope === scope.id && (
                            <div className="absolute top-2 right-2">
                              <Check className="h-5 w-5 text-blue-600" />
                            </div>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Review Card */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Permission Summary</h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Display Name:</span>
                      <span className="font-medium text-gray-900">{formData.displayName}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Generated Identifier:</span>
                      <code className="bg-blue-100 px-3 py-1 rounded-lg text-sm font-mono text-blue-700">
                        {generatedName}
                      </code>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Category:</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getCategoryColor(formData.category)}`} />
                        <span className="font-medium text-gray-900 capitalize">
                          {formData.category.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Action:</span>
                      <span className="font-medium text-gray-900 capitalize">{formData.action}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Scope:</span>
                      <span className="font-medium text-gray-900">
                        {scopes.find(s => s.id === formData.scope)?.name}
                      </span>
                    </div>
                    
                    <div className="pt-4 border-t border-blue-200">
                      <p className="text-sm text-gray-600">{formData.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            {formStep > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push('/settings/permissions')}
                className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Cancel
              </button>
            )}

            {formStep < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all"
              >
                Next
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-3 px-8 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5" />
                    Create Permission
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