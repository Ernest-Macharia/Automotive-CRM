'use client';

import { useState } from 'react';
import { X, Plus, Trash2, Zap, Bell, Mail, Calendar, Users } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

interface Condition {
  field: string;
  operator: string;
  value: string;
}

interface ActionForm {
  actionType: string;
  params: Record<string, any>;
}

interface FormData {
  name: string;
  module: string;
  triggerEvent: string;
  description: string;
  isActive: boolean;
  conditions: Condition[];
  actions: ActionForm[];
}

interface CreateWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: any) => void;
}

export default function CreateWorkflowModal({ isOpen, onClose, onCreate }: CreateWorkflowModalProps) {
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    module: 'leads',
    triggerEvent: 'onCreate',
    description: '',
    isActive: true,
    conditions: [{ field: 'status', operator: 'equals', value: '' }],
    actions: [{ actionType: 'sendEmail', params: { to: '', subject: '', template: '' } }],
  });

  const modules = [
    { value: 'leads', label: 'Leads' },
    { value: 'opportunities', label: 'Opportunities' },
    { value: 'quotes', label: 'Quotes' },
    { value: 'customers', label: 'Customers' },
    { value: 'jobs', label: 'Jobs' },
    { value: 'inventory', label: 'Inventory' },
  ];

  const triggerEvents = [
    { value: 'onCreate', label: 'On Create' },
    { value: 'onUpdate', label: 'On Update' },
    { value: 'onDelete', label: 'On Delete' },
    { value: 'onStatusChange', label: 'On Status Change' },
    { value: 'onSchedule', label: 'On Schedule' },
  ];

  const actionTypes: Array<{
    value: string;
    label: string;
    icon: any;
    defaultParams: Record<string, string>;
  }> = [
    { value: 'sendEmail', label: 'Send Email', icon: Mail, defaultParams: { to: '', subject: '', template: '' } },
    { value: 'sendNotification', label: 'Send Notification', icon: Bell, defaultParams: { channel: '', message: '' } },
    { value: 'createTask', label: 'Create Task', icon: Calendar, defaultParams: { name: '', assignedTo: '', dueIn: '' } },
    { value: 'updateRecord', label: 'Update Record', icon: Zap, defaultParams: { field: '', value: '' } },
    { value: 'assignToUser', label: 'Assign to User', icon: Users, defaultParams: { userId: '', role: '' } },
  ];

  const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'notEquals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'greaterThan', label: 'Greater Than' },
    { value: 'lessThan', label: 'Less Than' },
    { value: 'isSet', label: 'Is Set' },
    { value: 'isNotSet', label: 'Is Not Set' },
  ];

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleConditionChange = (index: number, field: keyof Condition, value: string) => {
    const newConditions = [...formData.conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setFormData(prev => ({ ...prev, conditions: newConditions }));
  };

  const handleActionChange = (index: number, field: string, value: string) => {
    const newActions = [...formData.actions];
    
    if (field === 'actionType') {
      const actionType = actionTypes.find(a => a.value === value);
      newActions[index] = { 
        actionType: value, 
        params: actionType ? { ...actionType.defaultParams } : {} 
      };
    } else if (field.startsWith('params.')) {
      const paramField = field.replace('params.', '');
      newActions[index] = {
        ...newActions[index],
        params: { 
          ...newActions[index].params, 
          [paramField]: value 
        }
      };
    }
    
    setFormData(prev => ({ ...prev, actions: newActions }));
  };

  const addCondition = () => {
    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, { field: '', operator: 'equals', value: '' }]
    }));
  };

  const removeCondition = (index: number) => {
    if (formData.conditions.length > 1) {
      setFormData(prev => ({
        ...prev,
        conditions: prev.conditions.filter((_, i) => i !== index)
      }));
    }
  };

  const addAction = () => {
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, { 
        actionType: 'sendEmail', 
        params: { to: '', subject: '', template: '' } 
      }]
    }));
  };

  const removeAction = (index: number) => {
    if (formData.actions.length > 1) {
      setFormData(prev => ({
        ...prev,
        actions: prev.actions.filter((_, i) => i !== index)
      }));
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      showToast('Workflow name is required', 'error');
      return false;
    }
    
    if (!formData.module) {
      showToast('Module is required', 'error');
      return false;
    }
    
    if (!formData.triggerEvent) {
      showToast('Trigger event is required', 'error');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Transform form data to match API expected format
      const workflowData = {
        name: formData.name,
        module: formData.module,
        triggerEvent: formData.triggerEvent,
        description: formData.description,
        isActive: formData.isActive,
        conditions: formData.conditions.reduce((acc, condition) => {
          acc[condition.field] = condition.value;
          return acc;
        }, {} as Record<string, any>),
        actions: formData.actions.map(action => ({
          actionType: action.actionType,
          params: action.params
        }))
      };
      
      onCreate(workflowData);
    } catch (error: any) {
      console.error('Error creating workflow:', error);
      showToast(error.message || 'Failed to create workflow', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        module: 'leads',
        triggerEvent: 'onCreate',
        description: '',
        isActive: true,
        conditions: [{ field: 'status', operator: 'equals', value: '' }],
        actions: [{ actionType: 'sendEmail', params: { to: '', subject: '', template: '' } }],
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
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Create New Workflow
                  </h3>
                  <p className="text-sm text-gray-600">
                    Automate processes based on triggers and conditions
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
                    Workflow Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Notify on New Lead"
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={loading}
                  >
                    {modules.map(module => (
                      <option key={module.value} value={module.value}>
                        {module.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trigger Event *
                  </label>
                  <select
                    value={formData.triggerEvent}
                    onChange={(e) => handleInputChange('triggerEvent', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={loading}
                  >
                    {triggerEvents.map(event => (
                      <option key={event.value} value={event.value}>
                        {event.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.isActive ? 'active' : 'inactive'}
                    onChange={(e) => handleInputChange('isActive', e.target.value === 'active')}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={loading}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Describe what this workflow does..."
                  disabled={loading}
                />
              </div>

              {/* Conditions */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Conditions
                  </label>
                  <button
                    type="button"
                    onClick={addCondition}
                    className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700"
                  >
                    <Plus className="h-4 w-4" />
                    Add Condition
                  </button>
                </div>
                
                <div className="space-y-3">
                  {formData.conditions.map((condition, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={condition.field}
                          onChange={(e) => handleConditionChange(index, 'field', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="Field name"
                          disabled={loading}
                        />
                        <select
                          value={condition.operator}
                          onChange={(e) => handleConditionChange(index, 'operator', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                          disabled={loading}
                        >
                          {operators.map(op => (
                            <option key={op.value} value={op.value}>{op.label}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={condition.value}
                          onChange={(e) => handleConditionChange(index, 'value', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="Value"
                          disabled={loading}
                        />
                      </div>
                      {formData.conditions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCondition(index)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Actions
                  </label>
                  <button
                    type="button"
                    onClick={addAction}
                    className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700"
                    disabled={loading}
                  >
                    <Plus className="h-4 w-4" />
                    Add Action
                  </button>
                </div>
                
                <div className="space-y-4">
                  {formData.actions.map((action, index) => {
                    const actionConfig = actionTypes.find(a => a.value === action.actionType);
                    const ActionIcon = actionConfig?.icon || Zap;
                    
                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <ActionIcon className="h-5 w-5 text-purple-500" />
                            <span className="font-medium text-gray-800">
                              {actionConfig?.label || action.actionType}
                            </span>
                          </div>
                          {formData.actions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeAction(index)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-2">
                              Action Type
                            </label>
                            <select
                              value={action.actionType}
                              onChange={(e) => handleActionChange(index, 'actionType', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              disabled={loading}
                            >
                              {actionTypes.map(type => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          {action.actionType === 'sendEmail' && (
                            <>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-2">
                                  Recipient Email
                                </label>
                                <input
                                  type="email"
                                  value={action.params.to || ''}
                                  onChange={(e) => handleActionChange(index, 'params.to', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                  placeholder="user@example.com"
                                  disabled={loading}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-2">
                                  Subject
                                </label>
                                <input
                                  type="text"
                                  value={action.params.subject || ''}
                                  onChange={(e) => handleActionChange(index, 'params.subject', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                  placeholder="Email subject"
                                  disabled={loading}
                                />
                              </div>
                            </>
                          )}
                          
                          {action.actionType === 'createTask' && (
                            <div className="col-span-3">
                              <label className="block text-xs font-medium text-gray-700 mb-2">
                                Task Name
                              </label>
                              <input
                                type="text"
                                value={action.params.name || ''}
                                onChange={(e) => handleActionChange(index, 'params.name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                placeholder="Task description"
                                disabled={loading}
                              />
                            </div>
                          )}
                          
                          {action.actionType === 'updateRecord' && (
                            <>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-2">
                                  Field
                                </label>
                                <input
                                  type="text"
                                  value={action.params.field || ''}
                                  onChange={(e) => handleActionChange(index, 'params.field', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                  placeholder="Field to update"
                                  disabled={loading}
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="block text-xs font-medium text-gray-700 mb-2">
                                  Value
                                </label>
                                <input
                                  type="text"
                                  value={action.params.value || ''}
                                  onChange={(e) => handleActionChange(index, 'params.value', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                  placeholder="New value"
                                  disabled={loading}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
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
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Create Workflow
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