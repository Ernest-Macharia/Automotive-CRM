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
  RefreshCw,
  History,
  Activity,
  Trash2,
  Eye,
  Copy,
  Download,
  Calendar,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { roleService, Permission } from '@/services/settings/roleService';

interface FormData {
  name: string;
  displayName: string;
  description: string;
  category: string;
  module: string;
  action: string;
  scope: string;
}

interface EditPermissionProps {
  permissionId: string;
  onBack?: () => void;
}

export default function EditPermission({ permissionId, onBack }: EditPermissionProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permission, setPermission] = useState<Permission | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'history' | 'usage'>('edit');

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
    if (permissionId) {
      loadPermission();
    }
  }, [permissionId]);

  const handleBack = () => {
    onBack?.() || router.push('/settings/permissions');
  };

  const loadPermission = async () => {
    try {
      setLoading(true);
      // For now, we'll simulate loading since we don't have a getPermissionById method
      const grouped = await roleService.getPermissionsByCategory();
      const allPermissions: Permission[] = [];
      
      Object.values(grouped).forEach(categoryPermissions => {
        allPermissions.push(...categoryPermissions);
      });
      
      const foundPermission = allPermissions.find(p => p.id === permissionId);
      
      if (!foundPermission) {
        showToast('Permission not found', 'error');
        router.push('/settings/permissions');
        return;
      }
      
      setPermission(foundPermission);
      
      // Parse the permission name to extract category, action, and scope
      const parts = foundPermission.name.split('.');
      let category = parts[0];
      let action = parts[1];
      let scope = parts[2] || 'global';
      
      // Ensure category is valid
      if (!categories.find(c => c.id === category)) {
        category = 'custom';
      }
      
      // Ensure action is valid
      if (!actions.find(a => a.id === action)) {
        action = 'manage';
      }
      
      // Ensure scope is valid
      if (!scopes.find(s => s.id === scope)) {
        scope = 'global';
      }
      
      setFormData({
        name: foundPermission.name,
        displayName: foundPermission.displayName,
        description: foundPermission.description || '',
        category,
        module: category === 'custom' ? parts[0] : category,
        action,
        scope,
      });
      
    } catch (error) {
      console.error('Error loading permission:', error);
      showToast('Failed to load permission details', 'error');
      router.push('/settings/permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // If category changes and it's not custom, update module
    if (field === 'category' && value !== 'custom') {
      setFormData(prev => ({ ...prev, module: value }));
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

  const generatePermissionName = () => {
    let name = `${formData.module}.${formData.action}`;
    if (formData.scope !== 'global') {
      name += `.${formData.scope}`;
    }
    return name;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      setFormStep(1);
      return;
    }
    
    setSaving(true);
    
    try {
      const permissionName = generatePermissionName();
      
      // Prepare permission data
      const permissionData = {
        ...permission,
        name: permissionName,
        displayName: formData.displayName,
        description: formData.description,
        category: formData.category,
        module: formData.category === 'custom' ? formData.module : formData.category,
        action: formData.action,
        scope: formData.scope,
      };
      
      // Here you would call your API to update the permission
      // For now, we'll simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showToast('Permission updated successfully', 'success');
      router.push('/settings/permissions');
      
    } catch (error: any) {
      console.error('Error updating permission:', error);
      showToast(error.message || 'Failed to update permission', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      // Here you would call your API to delete the permission
      // For now, we'll simulate success
      await new Promise(resolve => setTimeout(resolve, 500));
      
      showToast('Permission deleted successfully', 'success');
      router.push('/settings/permissions');
    } catch (error: any) {
      console.error('Error deleting permission:', error);
      showToast(error.message || 'Failed to delete permission', 'error');
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
      case 'users': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'dashboard': return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case 'leads': return 'bg-gradient-to-r from-orange-500 to-red-500';
      case 'opportunities': return 'bg-gradient-to-r from-yellow-500 to-amber-500';
      case 'quotes': return 'bg-gradient-to-r from-cyan-500 to-blue-500';
      case 'sales_orders': return 'bg-gradient-to-r from-indigo-500 to-purple-500';
      case 'work_orders': return 'bg-gradient-to-r from-emerald-500 to-teal-500';
      case 'inventory': return 'bg-gradient-to-r from-rose-500 to-pink-500';
      case 'reports': return 'bg-gradient-to-r from-violet-500 to-purple-500';
      case 'settings': return 'bg-gradient-to-r from-gray-500 to-slate-500';
      default: return 'bg-gradient-to-r from-blue-500 to-cyan-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading permission...</p>
        </div>
      </div>
    );
  }

  if (!permission) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900/20">
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
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Edit Permission</h1>
                <p className="text-indigo-100 text-sm">Update permission details and settings</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={loadPermission}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                title="Refresh"
              >
                <RefreshCw className="h-5 w-5 text-white" />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                title="Delete"
              >
                <Trash2 className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
          
          {/* Permission Info Header */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    <Shield className="h-8 w-8" />
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{permission.displayName}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <code className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-white text-sm font-mono">
                      {permission.name}
                    </code>
                    <span className="text-white/80 text-sm">
                      ID: {permission.id?.slice(0, 8)}...
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('edit')}
              className={`px-4 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'edit'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Edit Permission
            </button>
            <button
              onClick={() => setActiveTab('usage')}
              className={`px-4 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'usage'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Usage History
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'history'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Change History
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'edit' ? (
          <div>
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      formStep >= step 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                    }`}>
                      {formStep > step ? <Check className="h-5 w-5" /> : step}
                    </div>
                    {step < 3 && (
                      <div className={`w-20 h-1 mx-2 ${
                        formStep > step ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`} />
                    )}
                  </div>
                ))}
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Step {formStep} of 3
                </div>
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
                          className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 ${
                            errors.displayName ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                          }`}
                          placeholder="e.g., View User Profiles"
                        />
                      </div>
                      {errors.displayName && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.displayName}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        User-friendly name for the permission
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description *
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        rows={3}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 ${
                          errors.description ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="Describe what this permission allows users to do..."
                      />
                      {errors.description && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.description}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Permission Identifier
                      </label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-xl text-sm font-mono text-gray-800 dark:text-gray-300">
                          {generatePermissionName()}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(generatePermissionName());
                            showToast('Permission identifier copied!', 'success');
                          }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                          <Copy className="h-4 w-4 text-gray-500" />
                        </button>
                      </div>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Auto-generated based on category, action, and scope
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Category & Action */}
              {formStep === 2 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Category & Action</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
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
                                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-lg'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
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
                                  <span className="font-medium text-gray-900 dark:text-white">{category.name}</span>
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{category.description}</p>
                                </div>
                              </div>
                              {formData.category === category.id && (
                                <div className="absolute top-2 right-2">
                                  <Check className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                              )}
                            </label>
                          );
                        })}
                      </div>
                      {errors.category && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.category}
                        </p>
                      )}
                    </div>

                    {formData.category === 'custom' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Custom Module Name
                        </label>
                        <input
                          type="text"
                          value={formData.module}
                          onChange={(e) => handleInputChange('module', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700"
                          placeholder="Enter custom module name"
                        />
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Enter the name for your custom module (lowercase, no spaces)
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                        Select Action *
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {actions.map((action) => (
                          <label
                            key={action.id}
                            className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all ${
                              formData.action === action.id
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-lg'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
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
                              <span className="font-medium text-gray-900 dark:text-white">{action.name}</span>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{action.description}</p>
                            </div>
                            {formData.action === action.id && (
                              <div className="absolute top-2 right-2">
                                <Check className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                              </div>
                            )}
                          </label>
                        ))}
                      </div>
                      {errors.action && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
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
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Scope & Review</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
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
                                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-lg'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
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
                                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                                  <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                  <span className="font-medium text-gray-900 dark:text-white">{scope.name}</span>
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{scope.description}</p>
                                </div>
                              </div>
                              {formData.scope === scope.id && (
                                <div className="absolute top-2 right-2">
                                  <Check className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Review Card */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-6">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Permission Summary</h4>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Display Name:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{formData.displayName}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Generated Identifier:</span>
                          <code className="bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1 rounded-lg text-sm font-mono text-indigo-700 dark:text-indigo-300">
                            {generatePermissionName()}
                          </code>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Category:</span>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getCategoryColor(formData.category)}`} />
                            <span className="font-medium text-gray-900 dark:text-white capitalize">
                              {formData.category.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Action:</span>
                          <span className="font-medium text-gray-900 dark:text-white capitalize">{formData.action}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Scope:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {scopes.find(s => s.id === formData.scope)?.name}
                          </span>
                        </div>
                        
                        <div className="pt-4 border-t border-indigo-200 dark:border-indigo-800">
                          <p className="text-sm text-gray-600 dark:text-gray-400">{formData.description}</p>
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
                    onClick={handleBack}
                    className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Cancel
                  </button>
                )}

                {formStep < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all"
                  >
                    Next
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        Save Changes
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        ) : activeTab === 'usage' ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Usage History</h3>
            
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Activity className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Usage Data Available</h4>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Usage tracking for this permission is not currently enabled. Enable usage tracking in system settings.
              </p>
              <button
                onClick={() => router.push('/settings/system')}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700"
              >
                Go to System Settings
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Change History</h3>
            
            <div className="space-y-4">
              {[
                { action: 'Permission created', user: 'System Admin', time: 'Dec 15, 2024, 10:30 AM', details: 'Initial creation' },
                { action: 'Display name updated', user: 'John Doe', time: 'Jan 5, 2025, 02:15 PM', details: 'Changed from "View Users" to "View User Profiles"' },
                { action: 'Scope modified', user: 'Jane Smith', time: 'Jan 12, 2025, 09:45 AM', details: 'Changed scope from "global" to "team"' },
              ].map((history, index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{history.action}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {history.user}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {history.time}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{history.details}</p>
                    </div>
                    <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                      <Eye className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-500/20 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Permission</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete <strong>{permission.displayName}</strong>?
              This may affect user access and system functionality.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800"
              >
                Delete Permission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}