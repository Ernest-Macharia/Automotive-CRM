'use client';

import { useState } from 'react';
import { X, Plus, Trash2, Layers, Users, Mail, Calendar } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

interface StageForm {
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

interface CreateBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: any) => void;
}

export default function CreateBlueprintModal({ isOpen, onClose, onCreate }: CreateBlueprintModalProps) {
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    module: 'opportunities',
    description: '',
    isActive: true,
    stages: [] as StageForm[],
  });

  const modules = [
    { value: 'opportunities', label: 'Opportunities' },
    { value: 'quotes', label: 'Quotes' },
    { value: 'customers', label: 'Customers' },
    { value: 'jobs', label: 'Jobs' },
    { value: 'inventory', label: 'Inventory' },
  ];

  const availableRoles = [
    'admin',
    'manager',
    'sales_representative',
    'technician',
    'customer_success',
    'finance',
    'operations',
  ];

  const actionTypes = [
    { value: 'sendEmail', label: 'Send Email', icon: Mail },
    { value: 'createTask', label: 'Create Task', icon: Calendar },
    { value: 'sendNotification', label: 'Send Notification' },
    { value: 'updateRecord', label: 'Update Record' },
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addStage = () => {
    const newStage: StageForm = {
      name: '',
      order: formData.stages.length + 1,
      allowedRoles: [],
      entryActions: [],
      exitActions: [],
    };
    setFormData(prev => ({
      ...prev,
      stages: [...prev.stages, newStage]
    }));
  };

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
      
      onCreate(blueprintData);
    } catch (error: any) {
      console.error('Error creating blueprint:', error);
      showToast(error.message || 'Failed to create blueprint', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        module: 'opportunities',
        description: '',
        isActive: true,
        stages: [],
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                  <Layers className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Create New Blueprint
                  </h3>
                  <p className="text-sm text-gray-600">
                    Define process stages and automation rules
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={loading}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-12rem)]">
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blueprint Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Opportunity Pipeline"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Module *
                  </label>
                  <select
                    value={formData.module}
                    onChange={(e) => handleInputChange('module', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    disabled={loading}
                  >
                    {modules.map(module => (
                      <option key={module.value} value={module.value}>
                        {module.label}
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
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Describe this blueprint and its purpose..."
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Stages */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Process Stages *
                    </label>
                    <p className="text-sm text-gray-500 mt-1">
                      Define the stages and rules for this workflow
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addStage}
                    className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100"
                    disabled={loading}
                  >
                    <Plus className="h-4 w-4" />
                    Add Stage
                  </button>
                </div>
                
                {formData.stages.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <Layers className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No stages added yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Add stages to define your workflow process
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.stages.map((stage, stageIndex) => (
                      <div key={stageIndex} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-green-700 font-semibold">{stageIndex + 1}</span>
                            </div>
                            <input
                              type="text"
                              value={stage.name}
                              onChange={(e) => updateStage(stageIndex, 'name', e.target.value)}
                              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium"
                              placeholder="Stage name"
                              disabled={loading}
                            />
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={stage.order}
                              onChange={(e) => updateStage(stageIndex, 'order', parseInt(e.target.value))}
                              className="w-20 px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                              min="1"
                              disabled={loading}
                            />
                            <button
                              type="button"
                              onClick={() => removeStage(stageIndex)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Allowed Roles */}
                        <div className="mb-4">
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Allowed Roles *
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {availableRoles.map((role) => (
                              <label
                                key={role}
                                className="inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={stage.allowedRoles.includes(role)}
                                  onChange={(e) => {
                                    const newRoles = e.target.checked
                                      ? [...stage.allowedRoles, role]
                                      : stage.allowedRoles.filter(r => r !== role);
                                    updateStage(stageIndex, 'allowedRoles', newRoles);
                                  }}
                                  className="h-3 w-3 text-green-600 focus:ring-green-500"
                                  disabled={loading}
                                />
                                <span className="text-xs text-gray-700">{role}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Entry Actions */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-medium text-gray-700">
                              Entry Actions (run when stage starts)
                            </label>
                            <button
                              type="button"
                              onClick={() => addAction(stageIndex, 'entryActions')}
                              className="text-xs text-blue-600 hover:text-blue-700"
                              disabled={loading}
                            >
                              + Add Action
                            </button>
                          </div>
                          
                          {stage.entryActions.length === 0 ? (
                            <p className="text-xs text-gray-400">No entry actions defined</p>
                          ) : (
                            <div className="space-y-2">
                              {stage.entryActions.map((action, actionIndex) => (
                                <div key={actionIndex} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                  <select
                                    value={action.actionType}
                                    onChange={(e) => updateAction(stageIndex, 'entryActions', actionIndex, 'actionType', e.target.value)}
                                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-xs"
                                    disabled={loading}
                                  >
                                    {actionTypes.map(type => (
                                      <option key={type.value} value={type.value}>
                                        {type.label}
                                      </option>
                                    ))}
                                  </select>
                                  
                                  {action.actionType === 'sendEmail' && (
                                    <input
                                      type="text"
                                      value={action.params.to || ''}
                                      onChange={(e) => updateAction(stageIndex, 'entryActions', actionIndex, 'params.to', e.target.value)}
                                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-xs"
                                      placeholder="Recipient email"
                                      disabled={loading}
                                    />
                                  )}
                                  
                                  {action.actionType === 'createTask' && (
                                    <input
                                      type="text"
                                      value={action.params.name || ''}
                                      onChange={(e) => updateAction(stageIndex, 'entryActions', actionIndex, 'params.name', e.target.value)}
                                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-xs"
                                      placeholder="Task name"
                                      disabled={loading}
                                    />
                                  )}
                                  
                                  <button
                                    type="button"
                                    onClick={() => removeAction(stageIndex, 'entryActions', actionIndex)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                    disabled={loading}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Exit Actions */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-medium text-gray-700">
                              Exit Actions (run when stage completes)
                            </label>
                            <button
                              type="button"
                              onClick={() => addAction(stageIndex, 'exitActions')}
                              className="text-xs text-blue-600 hover:text-blue-700"
                              disabled={loading}
                            >
                              + Add Action
                            </button>
                          </div>
                          
                          {stage.exitActions.length === 0 ? (
                            <p className="text-xs text-gray-400">No exit actions defined</p>
                          ) : (
                            <div className="space-y-2">
                              {stage.exitActions.map((action, actionIndex) => (
                                <div key={actionIndex} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                  <select
                                    value={action.actionType}
                                    onChange={(e) => updateAction(stageIndex, 'exitActions', actionIndex, 'actionType', e.target.value)}
                                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-xs"
                                    disabled={loading}
                                  >
                                    {actionTypes.map(type => (
                                      <option key={type.value} value={type.value}>
                                        {type.label}
                                      </option>
                                    ))}
                                  </select>
                                  
                                  {action.actionType === 'sendEmail' && (
                                    <input
                                      type="text"
                                      value={action.params.to || ''}
                                      onChange={(e) => updateAction(stageIndex, 'exitActions', actionIndex, 'params.to', e.target.value)}
                                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-xs"
                                      placeholder="Recipient email"
                                      disabled={loading}
                                    />
                                  )}
                                  
                                  {action.actionType === 'createTask' && (
                                    <input
                                      type="text"
                                      value={action.params.name || ''}
                                      onChange={(e) => updateAction(stageIndex, 'exitActions', actionIndex, 'params.name', e.target.value)}
                                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-xs"
                                      placeholder="Task name"
                                      disabled={loading}
                                    />
                                  )}
                                  
                                  <button
                                    type="button"
                                    onClick={() => removeAction(stageIndex, 'exitActions', actionIndex)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                    disabled={loading}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500"
                  disabled={loading}
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Blueprint is active and can be used
                </label>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Layers className="h-4 w-4" />
                    Create Blueprint
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}