'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Layers,
  Users,
  Mail,
  Calendar,
  Bell,
  Zap,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { blueprintsService } from '@/services/settings/blueprintsService';

interface StageForm {
  id?: string;
  name: string;
  order: number;
  allowedRoles: string[];
  entryActions: ActionForm[];
  exitActions: ActionForm[];
}

interface ActionForm {
  actionType: string;
  params: Record<string, string>;
}

export default function CreateBlueprintPage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [availableModules, setAvailableModules] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    module: 'opportunities',
    description: '',
    isActive: true,
    stages: [] as StageForm[],
  });

  const [expandedStage, setExpandedStage] = useState<number | null>(null);

  useState(() => {
    const loadModules = async () => {
      try {
        const modules = await blueprintsService.getAvailableModules();
        setAvailableModules(modules);
      } catch (error) {
        console.error('Error loading available modules:', error);
        setAvailableModules(['opportunities', 'quotes', 'customers', 'jobs', 'inventory']);
      }
    };
    loadModules();
  });

  const availableRoles = [
    { value: 'admin', label: 'Administrator' },
    { value: 'manager', label: 'Manager' },
    { value: 'sales_representative', label: 'Sales Representative' },
    { value: 'technician', label: 'Technician' },
    { value: 'customer_success', label: 'Customer Success' },
    { value: 'finance', label: 'Finance' },
    { value: 'operations', label: 'Operations' },
  ];

  const actionTypes = [
    { value: 'sendEmail', label: 'Send Email', icon: Mail, color: 'bg-blue-100 text-blue-600' },
    { value: 'createTask', label: 'Create Task', icon: Calendar, color: 'bg-green-100 text-green-600' },
    { value: 'sendNotification', label: 'Send Notification', icon: Bell, color: 'bg-purple-100 text-purple-600' },
    { value: 'updateRecord', label: 'Update Record', icon: Zap, color: 'bg-yellow-100 text-yellow-600' },
    { value: 'assignToUser', label: 'Assign to User', icon: Users, color: 'bg-indigo-100 text-indigo-600' },
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addStage = useCallback(() => {
    const newStage: StageForm = {
      name: `Stage ${formData.stages.length + 1}`,
      order: formData.stages.length + 1,
      allowedRoles: [],
      entryActions: [],
      exitActions: [],
    };
    setFormData(prev => ({
      ...prev,
      stages: [...prev.stages, newStage]
    }));
    setExpandedStage(formData.stages.length);
  }, [formData.stages.length]);

  const updateStage = (index: number, field: keyof StageForm, value: any) => {
    const newStages = [...formData.stages];
    newStages[index] = { ...newStages[index], [field]: value };
    setFormData(prev => ({ ...prev, stages: newStages }));
  };

  const removeStage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      stages: prev.stages.filter((_, i) => i !== index)
    }));
  };

  const addAction = (stageIndex: number, type: 'entryActions' | 'exitActions') => {
    const newStages = [...formData.stages];
    newStages[stageIndex][type] = [
      ...newStages[stageIndex][type],
      { actionType: 'sendEmail', params: {} }
    ];
    setFormData(prev => ({ ...prev, stages: newStages }));
  };

  const updateAction = (stageIndex: number, actionType: 'entryActions' | 'exitActions', actionIndex: number, field: string, value: string) => {
    const newStages = [...formData.stages];
    if (field === 'actionType') {
      newStages[stageIndex][actionType][actionIndex] = { 
        actionType: value, 
        params: {} 
      };
    } else if (field.startsWith('params.')) {
      const paramField = field.replace('params.', '');
      newStages[stageIndex][actionType][actionIndex] = {
        ...newStages[stageIndex][actionType][actionIndex],
        params: { 
          ...newStages[stageIndex][actionType][actionIndex].params, 
          [paramField]: value 
        }
      };
    }
    setFormData(prev => ({ ...prev, stages: newStages }));
  };

  const removeAction = (stageIndex: number, actionType: 'entryActions' | 'exitActions', actionIndex: number) => {
    const newStages = [...formData.stages];
    newStages[stageIndex][actionType] = newStages[stageIndex][actionType].filter((_, i) => i !== actionIndex);
    setFormData(prev => ({ ...prev, stages: newStages }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      showToast('Blueprint name is required', 'error');
      return false;
    }
    
    if (!formData.module) {
      showToast('Module is required', 'error');
      return false;
    }
    
    if (formData.stages.length === 0) {
      showToast('At least one stage is required', 'error');
      return false;
    }
    
    for (const stage of formData.stages) {
      if (!stage.name.trim()) {
        showToast('All stages must have a name', 'error');
        return false;
      }
      
      if (stage.allowedRoles.length === 0) {
        showToast('Each stage must have at least one allowed role', 'error');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const blueprintData = {
        name: formData.name,
        module: formData.module,
        description: formData.description,
        isActive: formData.isActive,
        stages: formData.stages.map(stage => ({
          name: stage.name,
          order: stage.order,
          allowedRoles: stage.allowedRoles,
          entryActions: stage.entryActions,
          exitActions: stage.exitActions,
        })),
      };
      
      await blueprintsService.createBlueprint(blueprintData);
      showToast('Blueprint created successfully', 'success');
      router.push('/settings/blueprints');
    } catch (error: any) {
      console.error('Error creating blueprint:', error);
      showToast(error.message || 'Failed to create blueprint', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      router.push('/settings/blueprints');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleCancel}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-sm transition-colors hover:scale-110"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Create Blueprint</h1>
                <p className="text-blue-100/90 mt-1">Design a new workflow template and process stages</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium backdrop-blur-sm transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-2.5 bg-white text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    Create Blueprint
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Progress */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100/50 p-6 shadow-lg sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Blueprint Creation</h3>
              
              <div className="space-y-1">
                {[
                  { id: 1, label: 'Basic Information', status: 'completed' },
                  { id: 2, label: 'Process Stages', status: 'current' },
                  { id: 3, label: 'Review & Create', status: 'upcoming' },
                ].map((step) => (
                  <div key={step.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50/30 transition-colors">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      step.status === 'completed' 
                        ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-600 border border-green-200' 
                        : step.status === 'current'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                        : 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-400 border border-blue-200'
                    }`}>
                      {step.status === 'completed' ? '✓' : step.id}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{step.label}</div>
                      <div className="text-xs text-gray-500 capitalize">{step.status}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t border-blue-100/50">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Quick Tips</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">✓</div>
                    <span>Each stage requires at least one allowed role</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">✓</div>
                    <span>Entry actions run when a record enters the stage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">✓</div>
                    <span>Exit actions run when a record leaves the stage</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100/50 p-8 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                    <Layers className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                    <p className="text-gray-600 text-sm mt-1">Define the basic properties of your blueprint</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Blueprint Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-3 border border-blue-200 bg-white/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="e.g., Opportunity Pipeline"
                      disabled={loading}
                    />
                    <p className="mt-1 text-xs text-gray-500">Give your blueprint a descriptive name</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Module *
                    </label>
                    <div className="relative">
                      <select
                        value={formData.module}
                        onChange={(e) => handleInputChange('module', e.target.value)}
                        className="w-full px-4 py-3 border border-blue-200 bg-white/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none"
                        disabled={loading}
                      >
                        {availableModules.map(module => (
                          <option key={module} value={module}>
                            {module.charAt(0).toUpperCase() + module.slice(1)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400 pointer-events-none" />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Select the module this blueprint applies to</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-blue-200 bg-white/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Describe the purpose and usage of this blueprint..."
                      disabled={loading}
                    />
                    <p className="mt-1 text-xs text-gray-500">Optional description to help users understand this blueprint</p>
                  </div>
                </div>
              </div>

              {/* Status Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100/50 p-8 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Blueprint Status</h3>
                    <p className="text-gray-600 text-sm">Control whether this blueprint is active and usable</p>
                  </div>
                  
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => handleInputChange('isActive', e.target.checked)}
                      className="sr-only peer"
                      disabled={loading}
                    />
                    <div className="w-14 h-7 bg-blue-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-blue-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r from-blue-600 to-purple-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-900">
                      {formData.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-blue-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="px-8 py-3 border-2 border-blue-200 text-blue-700 bg-white/50 rounded-xl font-medium hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      showToast('Draft saved successfully', 'success');
                    }}
                    disabled={loading}
                    className="px-8 py-3 border-2 border-blue-600 text-blue-600 bg-white/50 rounded-xl font-medium hover:bg-blue-50 transition-colors disabled:opacity-50"
                  >
                    Save Draft
                  </button>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-3 px-10 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Creating Blueprint...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        Create Blueprint
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}