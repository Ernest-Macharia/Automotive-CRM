'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Eye,
  Copy,
  Tag,
  AlertCircle,
  Check,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { blueprintsService, Blueprint } from '@/services/settings/blueprintsService';
import React from 'react';

// Reuse the interfaces
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

// Available role options - get from service
const ROLE_OPTIONS = [
  'admin',
  'manager',
  'sales',
  'technician',
  'support',
  'viewer',
  'supervisor',
  'coordinator'
];

// Available action types
const ACTION_TYPES = [
  {
    type: 'sendEmail',
    label: 'Send Email',
    icon: Mail,
    color: 'bg-blue-100 text-blue-600',
    params: ['template', 'recipient', 'subject']
  },
  {
    type: 'createTask',
    label: 'Create Task',
    icon: Calendar,
    color: 'bg-green-100 text-green-600',
    params: ['title', 'assignee', 'dueDate']
  },
  {
    type: 'sendNotification',
    label: 'Send Notification',
    icon: Bell,
    color: 'bg-yellow-100 text-yellow-600',
    params: ['message', 'channel', 'priority']
  },
  {
    type: 'updateRecord',
    label: 'Update Record',
    icon: Zap,
    color: 'bg-purple-100 text-purple-600',
    params: ['field', 'value', 'condition']
  }
];

interface EditBlueprintPageProps {
  blueprintId: string;
}

export default function EditBlueprintPage({ blueprintId }: EditBlueprintPageProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [availableModules, setAvailableModules] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    module: 'opportunities',
    description: '',
    isActive: true,
    stages: [] as StageForm[],
  });

  const [expandedStage, setExpandedStage] = useState<number | null>(null);

  useEffect(() => {
    if (blueprintId) {
      loadBlueprint();
    } else {
      showToast('No blueprint ID provided', 'error');
      router.push('/settings/blueprints');
    }
  }, [blueprintId]);

  const loadBlueprint = async () => {
    try {
      setLoading(true);
      const data = await blueprintsService.getBlueprint(blueprintId as string);
      setBlueprint(data);
      setFormData({
        name: data.name,
        module: data.module,
        description: data.description || '',
        isActive: data.isActive,
        stages: data.stages.map(stage => ({
          id: stage.id,
          name: stage.name,
          order: stage.order,
          allowedRoles: stage.allowedRoles,
          entryActions: stage.entryActions.map(action => ({
            actionType: action.actionType,
            params: action.params
          })),
          exitActions: stage.exitActions.map(action => ({
            actionType: action.actionType,
            params: action.params
          })),
        })),
      });
    } catch (error) {
      console.error('Error loading blueprint:', error);
      showToast('Failed to load blueprint', 'error');
      router.push('/settings/blueprints');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableModules = async () => {
    try {
      const modules = await blueprintsService.getAvailableModules();
      setAvailableModules(modules);
    } catch (error) {
      console.error('Error loading available modules:', error);
      setAvailableModules(['opportunities', 'quotes', 'customers', 'jobs', 'inventory', 'projects', 'tasks']);
    }
  };

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

  const toggleRole = (stageIndex: number, role: string) => {
    const newStages = [...formData.stages];
    const currentRoles = newStages[stageIndex].allowedRoles;
    
    if (currentRoles.includes(role)) {
      newStages[stageIndex].allowedRoles = currentRoles.filter(r => r !== role);
    } else {
      newStages[stageIndex].allowedRoles = [...currentRoles, role];
    }
    
    setFormData(prev => ({ ...prev, stages: newStages }));
  };

  const addAction = (stageIndex: number, type: 'entryActions' | 'exitActions', actionType: string = 'sendEmail') => {
    const newStages = [...formData.stages];
    newStages[stageIndex][type] = [
      ...newStages[stageIndex][type],
      { actionType, params: {} }
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

  const getActionIcon = (actionType: string) => {
    const action = ACTION_TYPES.find(a => a.type === actionType);
    return action ? action.icon : Mail;
  };

  const getActionColor = (actionType: string) => {
    const action = ACTION_TYPES.find(a => a.type === actionType);
    return action ? action.color : 'bg-blue-100 text-blue-600';
  };

  const getActionParams = (actionType: string) => {
    const action = ACTION_TYPES.find(a => a.type === actionType);
    return action ? action.params : [];
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
    
    setSaving(true);
    
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
      
      await blueprintsService.updateBlueprint(blueprintId as string, blueprintData);
      showToast('Blueprint updated successfully', 'success');
      router.push('/settings/blueprints');
    } catch (error: any) {
      console.error('Error updating blueprint:', error);
      showToast(error.message || 'Failed to update blueprint', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    if (!confirm('Create a copy of this blueprint?')) return;
    
    try {
      const duplicateData = {
        name: `${formData.name} (Copy)`,
        module: formData.module,
        description: formData.description,
        isActive: false,
        stages: formData.stages.map(stage => ({
          name: stage.name,
          order: stage.order,
          allowedRoles: stage.allowedRoles,
          entryActions: stage.entryActions,
          exitActions: stage.exitActions,
        })),
      };
      
      const newBlueprint = await blueprintsService.createBlueprint(duplicateData);
      showToast('Blueprint duplicated successfully', 'success');
      router.push(`/settings/blueprints/edit?id=${newBlueprint.id}`);
    } catch (error: any) {
      console.error('Error duplicating blueprint:', error);
      showToast(error.message || 'Failed to duplicate blueprint', 'error');
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to discard changes?')) {
      router.push('/settings/blueprints');
    }
  };

  const handleToggleActive = async () => {
    try {
      const newStatus = !formData.isActive;
      setFormData(prev => ({ ...prev, isActive: newStatus }));
      
      // Optionally save immediately
      if (blueprint) {
        await blueprintsService.updateBlueprint(blueprint.id, {
          isActive: newStatus,
        });
        showToast(`Blueprint ${newStatus ? 'activated' : 'deactivated'}`, 'success');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      showToast('Failed to update status', 'error');
    }
  };

  const handleTestAutomation = async () => {
    if (!blueprint) return;
    
    try {
      await blueprintsService.testBlueprintAutomation({
        name: blueprint.name,
        module: blueprint.module,
        stages: blueprint.stages.map(stage => ({
          name: stage.name,
          order: stage.order,
          allowedRoles: stage.allowedRoles,
          entryActions: stage.entryActions,
          exitActions: stage.exitActions,
        })),
      });
      showToast('Blueprint automation test completed successfully', 'success');
    } catch (error: any) {
      console.error('Error testing blueprint automation:', error);
      showToast(error.message || 'Failed to test blueprint automation', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading blueprint...</p>
        </div>
      </div>
    );
  }

  if (!blueprint) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Blueprint Not Found</h3>
          <p className="text-gray-600 mb-6">The blueprint you're trying to edit doesn't exist or has been deleted.</p>
          <button
            onClick={() => router.push('/settings/blueprints')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Back to Blueprints
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Blueprint</h1>
              <p className="text-gray-600 mt-1">Modify workflow template and process stages</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleTestAutomation}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Test Automation
            </button>
            <button
              onClick={handleDuplicate}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
            >
              <Copy className="h-4 w-4" />
              Duplicate
            </button>
            <button
              onClick={handleToggleActive}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors ${
                formData.isActive
                  ? 'bg-red-100 hover:bg-red-200 text-red-700'
                  : 'bg-green-100 hover:bg-green-200 text-green-700'
              }`}
            >
              {formData.isActive ? (
                <>
                  <X className="h-4 w-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Activate
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all disabled:opacity-50"
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
          </div>
        </div>
        
        {/* Blueprint Info */}
        <div className="pt-6 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-gray-100 rounded-lg text-gray-700 text-sm font-medium">
                  ID: {blueprint.id}
                </span>
                <span className="text-gray-600 text-sm">
                  Created: {new Date(blueprint.createdAt).toLocaleDateString()}
                </span>
                <span className="text-gray-600 text-sm">
                  Last updated: {new Date(blueprint.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                className="p-2 hover:bg-gray-100 rounded-lg"
                onClick={() => router.push(`/settings/blueprints/${blueprint.id}`)}
              >
                <Eye className="h-4 w-4 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Copy className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Sidebar - Blueprint Details */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Blueprint Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Created</label>
                <p className="text-sm text-gray-900">
                  {new Date(blueprint.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Last Updated</label>
                <p className="text-sm text-gray-900">
                  {new Date(blueprint.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Status</label>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    formData.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {formData.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={handleToggleActive}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {formData.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Stages</label>
                <p className="text-sm text-gray-900">{formData.stages.length} stages</p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Usage Count</label>
                <p className="text-sm text-gray-900">{(blueprint as any).usageCount || 0} records</p>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h4>
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/settings/blueprints/create?clone=${blueprintId}`)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  Clone to New Blueprint
                </button>
                <button
                  onClick={() => router.push(`/settings/blueprints/${blueprint.id}`)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </button>
                <button
                  onClick={handleTestAutomation}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:text-green-700 font-medium hover:bg-green-50 rounded-lg transition-colors"
                >
                  <Sparkles className="h-4 w-4" />
                  Test Automation
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Layers className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                  <p className="text-gray-600 text-sm mt-1">Update the basic properties of your blueprint</p>
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="e.g., Opportunity Pipeline"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Module *
                  </label>
                  <select
                    value={formData.module}
                    onChange={(e) => handleInputChange('module', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    disabled={saving}
                  >
                    {availableModules.map(module => (
                      <option key={module} value={module}>
                        {module.charAt(0).toUpperCase() + module.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Describe the purpose and usage of this blueprint..."
                    disabled={saving}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    This description will help other users understand when to use this blueprint.
                  </p>
                </div>
              </div>
            </div>

            {/* Stages Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Process Stages</h3>
                    <p className="text-gray-600 text-sm mt-1">Manage workflow stages and their rules</p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={addStage}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all"
                  disabled={saving}
                >
                  <Plus className="h-4 w-4" />
                  Add Stage
                </button>
              </div>
              
              {formData.stages.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-2xl">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Layers className="h-8 w-8 text-blue-600" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No stages added yet</h4>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Stages define the workflow steps for your blueprint. Add your first stage to get started.
                  </p>
                  <button
                    type="button"
                    onClick={addStage}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all"
                    disabled={saving}
                  >
                    <Plus className="h-5 w-5" />
                    Add First Stage
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {formData.stages.map((stage, stageIndex) => (
                    <div key={stageIndex} className="border border-gray-200 rounded-2xl overflow-hidden">
                      {/* Stage Header */}
                      <div className="bg-gray-50 p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold">{stageIndex + 1}</span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <input
                                  type="text"
                                  value={stage.name}
                                  onChange={(e) => updateStage(stageIndex, 'name', e.target.value)}
                                  className="text-lg font-semibold text-gray-900 bg-transparent border-none focus:ring-0 p-0 focus:outline-none focus:border-b-2 focus:border-blue-500"
                                  placeholder="Stage Name"
                                  disabled={saving}
                                />
                                <div className="flex items-center gap-2">
                                  <Tag className="h-4 w-4 text-gray-400" />
                                  <input
                                    type="number"
                                    value={stage.order}
                                    onChange={(e) => updateStage(stageIndex, 'order', parseInt(e.target.value) || 1)}
                                    className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-sm"
                                    min="1"
                                    disabled={saving}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setExpandedStage(expandedStage === stageIndex ? null : stageIndex)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              {expandedStage === stageIndex ? (
                                <ChevronDown className="h-5 w-5" />
                              ) : (
                                <ChevronRight className="h-5 w-5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeStage(stageIndex)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              disabled={saving}
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Stage Content (Expanded) */}
                      {expandedStage === stageIndex && (
                        <div className="p-6 bg-white">
                          {/* Allowed Roles */}
                          <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                              Allowed Roles *
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {ROLE_OPTIONS.map((role) => (
                                <button
                                  key={role}
                                  type="button"
                                  onClick={() => toggleRole(stageIndex, role)}
                                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    stage.allowedRoles.includes(role)
                                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                                  }`}
                                  disabled={saving}
                                >
                                  {role}
                                </button>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              Select which roles can access this stage. At least one role is required.
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Entry Actions */}
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <div className="h-2 w-6 bg-green-500 rounded"></div>
                                    Entry Actions
                                  </h4>
                                  <p className="text-xs text-gray-500">Triggered when entering this stage</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => addAction(stageIndex, 'entryActions')}
                                  className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition-colors"
                                  disabled={saving}
                                >
                                  <Plus className="h-3 w-3 inline mr-1" />
                                  Add Action
                                </button>
                              </div>
                              
                              {stage.entryActions.length === 0 ? (
                                <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-xl">
                                  <p className="text-sm text-gray-400">No entry actions defined</p>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {stage.entryActions.map((action, actionIndex) => (
                                    <div key={actionIndex} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                          <div className={`p-2 rounded-lg ${getActionColor(action.actionType)}`}>
                                            {getActionIcon(action.actionType) && 
                                              React.createElement(getActionIcon(action.actionType), { className: "h-4 w-4" })
                                            }
                                          </div>
                                          <span className="font-medium text-gray-900">
                                            {ACTION_TYPES.find(a => a.type === action.actionType)?.label || action.actionType}
                                          </span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => removeAction(stageIndex, 'entryActions', actionIndex)}
                                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                                          disabled={saving}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                      
                                      <div className="space-y-2">
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Action Type
                                          </label>
                                          <select
                                            value={action.actionType}
                                            onChange={(e) => updateAction(stageIndex, 'entryActions', actionIndex, 'actionType', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                            disabled={saving}
                                          >
                                            {ACTION_TYPES.map((actionType) => (
                                              <option key={actionType.type} value={actionType.type}>
                                                {actionType.label}
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                        
                                        {getActionParams(action.actionType).map((param) => (
                                          <div key={param}>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                              {param.charAt(0).toUpperCase() + param.slice(1)}
                                            </label>
                                            <input
                                              type="text"
                                              value={action.params[param] || ''}
                                              onChange={(e) => updateAction(stageIndex, 'entryActions', actionIndex, `params.${param}`, e.target.value)}
                                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                              placeholder={`Enter ${param}`}
                                              disabled={saving}
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {/* Exit Actions */}
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <div className="h-2 w-6 bg-red-500 rounded"></div>
                                    Exit Actions
                                  </h4>
                                  <p className="text-xs text-gray-500">Triggered when exiting this stage</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => addAction(stageIndex, 'exitActions')}
                                  className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
                                  disabled={saving}
                                >
                                  <Plus className="h-3 w-3 inline mr-1" />
                                  Add Action
                                </button>
                              </div>
                              
                              {stage.exitActions.length === 0 ? (
                                <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-xl">
                                  <p className="text-sm text-gray-400">No exit actions defined</p>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {stage.exitActions.map((action, actionIndex) => (
                                    <div key={actionIndex} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                          <div className={`p-2 rounded-lg ${getActionColor(action.actionType)}`}>
                                            {getActionIcon(action.actionType) && 
                                              React.createElement(getActionIcon(action.actionType), { className: "h-4 w-4" })
                                            }
                                          </div>
                                          <span className="font-medium text-gray-900">
                                            {ACTION_TYPES.find(a => a.type === action.actionType)?.label || action.actionType}
                                          </span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => removeAction(stageIndex, 'exitActions', actionIndex)}
                                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                                          disabled={saving}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                      
                                      <div className="space-y-2">
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Action Type
                                          </label>
                                          <select
                                            value={action.actionType}
                                            onChange={(e) => updateAction(stageIndex, 'exitActions', actionIndex, 'actionType', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                            disabled={saving}
                                          >
                                            {ACTION_TYPES.map((actionType) => (
                                              <option key={actionType.type} value={actionType.type}>
                                                {actionType.label}
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                        
                                        {getActionParams(action.actionType).map((param) => (
                                          <div key={param}>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                              {param.charAt(0).toUpperCase() + param.slice(1)}
                                            </label>
                                            <input
                                              type="text"
                                              value={action.params[param] || ''}
                                              onChange={(e) => updateAction(stageIndex, 'exitActions', actionIndex, `params.${param}`, e.target.value)}
                                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                              placeholder={`Enter ${param}`}
                                              disabled={saving}
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Discard Changes
              </button>
              
              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-3 px-10 py-3.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Saving Changes...
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
          </form>
        </div>
      </div>
    </div>
  );
}