'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Zap,
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Mail,
  Bell,
  Calendar,
  Users,
  Clock,
  X,
  AlertCircle,
  Check,
  Eye,
  Copy,
  Settings,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { workflowService } from '@/services/settings/workflowService';
import type { Workflow, UpdateWorkflowDto, WorkflowAction, ScheduleConfig, AdditionalCriteria } from '@/services/settings/workflowService';

interface EditWorkflowProps {
  workflowId: string;
}

export default function EditWorkflow({ workflowId }: EditWorkflowProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  
  const [formData, setFormData] = useState<UpdateWorkflowDto>({
    name: '',
    module: 'leads' as any,
    triggerEvent: 'onCreate' as any,
    actions: [],
    active: true,
    isScheduled: false,
    executionFrequency: 'immediate' as any,
  });

  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
    type: 'daily',
    time: '09:00'
  });

  const [additionalCriteria, setAdditionalCriteria] = useState<AdditionalCriteria>({
    fieldCriteria: []
  });

  const [conditionField, setConditionField] = useState('');
  const [conditionOperator, setConditionOperator] = useState('equals');
  const [conditionValue, setConditionValue] = useState('');
  const [conditions, setConditions] = useState<Record<string, any>>({});

  useEffect(() => {
    if (workflowId) {
      loadWorkflow();
    }
  }, [workflowId]);

  const loadWorkflow = async () => {
    try {
      setLoading(true);
      const data = await workflowService.getWorkflowById(workflowId);
      setWorkflow(data);
      
      // Initialize form data from workflow
      setFormData({
        name: data.name,
        module: data.module,
        triggerEvent: data.triggerEvent,
        actions: data.actions,
        active: data.active,
        isScheduled: data.isScheduled,
        executionFrequency: data.executionFrequency,
      });

      if (data.scheduleConfig) {
        setScheduleConfig(data.scheduleConfig);
      }

      if (data.conditions) {
        setConditions(data.conditions);
      }

      if (data.additionalCriteria) {
        setAdditionalCriteria(data.additionalCriteria);
      }
    } catch (error) {
      console.error('Error loading workflow:', error);
      showToast('Failed to load workflow', 'error');
      router.push('/settings/workflows');
    } finally {
      setLoading(false);
    }
  };

  const modules = [
    { value: 'opportunities', label: 'Opportunities', icon: '💼' },
    { value: 'quotes', label: 'Quotes', icon: '📄' },
    { value: 'invoices', label: 'Invoices', icon: '🧾' },
    { value: 'payments', label: 'Payments', icon: '💰' },
    { value: 'leads', label: 'Leads', icon: '🎯' },
    { value: 'accounts', label: 'Accounts', icon: '🏢' },
    { value: 'contacts', label: 'Contacts', icon: '👤' },
  ];

  const triggerEvents = [
    { value: 'onCreate', label: 'On Record Create', description: 'When a new record is created' },
    { value: 'onUpdate', label: 'On Record Update', description: 'When a record is updated' },
    { value: 'onDelete', label: 'On Record Delete', description: 'When a record is deleted' },
    { value: 'scheduled', label: 'Scheduled', description: 'Run on a schedule' },
    { value: 'fieldUpdate', label: 'Field Update', description: 'When specific field changes' },
    { value: 'stageChange', label: 'Stage Change', description: 'When record stage changes' },
  ];

  const actionTypes = [
    { value: 'sendEmail', label: 'Send Email', icon: Mail, description: 'Send an email notification' },
    { value: 'sendNotification', label: 'Send Notification', icon: Bell, description: 'Send in-app notification' },
    { value: 'createTask', label: 'Create Task', icon: Calendar, description: 'Create a new task' },
    { value: 'updateRecord', label: 'Update Record', icon: Settings, description: 'Update record fields' },
    { value: 'assignToUser', label: 'Assign to User', icon: Users, description: 'Assign record to user' },
  ];

  const executionFrequencies = [
    { value: 'immediate', label: 'Immediate', description: 'Execute immediately when triggered' },
    { value: 'once', label: 'Once', description: 'Execute only once per record' },
    { value: 'every_time', label: 'Every Time', description: 'Execute every time trigger occurs' },
    { value: 'once_in_24_hours', label: 'Once in 24 Hours', description: 'Execute once per 24 hours per record' },
  ];

  const scheduleTypes = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'custom', label: 'Custom Cron' },
  ];

  const operators = [
    { value: 'equals', label: 'Equals', symbol: '=' },
    { value: 'notEquals', label: 'Not Equals', symbol: '≠' },
    { value: 'contains', label: 'Contains', symbol: '⊃' },
    { value: 'greaterThan', label: 'Greater Than', symbol: '>' },
    { value: 'lessThan', label: 'Less Than', symbol: '<' },
    { value: 'isSet', label: 'Is Set', symbol: '✓' },
    { value: 'isNotSet', label: 'Is Not Set', symbol: '✗' },
  ];

  const handleInputChange = (field: keyof UpdateWorkflowDto, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddAction = () => {
    const newAction: WorkflowAction = {
      actionType: 'sendEmail',
      params: {},
      executionOrder: formData.actions!.length + 1,
      delayInMinutes: 0
    };
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions!, newAction]
    }));
  };

  const handleRemoveAction = (index: number) => {
    if (formData.actions!.length > 1) {
      const newActions = [...formData.actions!];
      newActions.splice(index, 1);
      // Reorder execution orders
      newActions.forEach((action, idx) => {
        action.executionOrder = idx + 1;
      });
      setFormData(prev => ({ ...prev, actions: newActions }));
    }
  };

  const handleActionChange = (index: number, field: keyof WorkflowAction, value: any) => {
    const newActions = [...formData.actions!];
    newActions[index] = { ...newActions[index], [field]: value };
    setFormData(prev => ({ ...prev, actions: newActions }));
  };

  const handleParamsChange = (actionIndex: number, paramName: string, value: string) => {
    const newActions = [...formData.actions!];
    newActions[actionIndex] = {
      ...newActions[actionIndex],
      params: {
        ...newActions[actionIndex].params,
        [paramName]: value
      }
    };
    setFormData(prev => ({ ...prev, actions: newActions }));
  };

  const handleAddCondition = () => {
    if (conditionField && conditionValue) {
      setConditions(prev => ({
        ...prev,
        [conditionField]: conditionValue
      }));
      setConditionField('');
      setConditionValue('');
    }
  };

  const handleRemoveCondition = (field: string) => {
    const newConditions = { ...conditions };
    delete newConditions[field];
    setConditions(newConditions);
  };

  const handleDayToggle = (day: number) => {
    setScheduleConfig(prev => {
      const days = prev.daysOfWeek || [];
      const newDays = days.includes(day)
        ? days.filter(d => d !== day)
        : [...days, day];
      return { ...prev, daysOfWeek: newDays };
    });
  };

  const validateForm = async () => {
    const errors = [];

    if (!formData.name?.trim()) {
      errors.push('Workflow name is required');
    }

    if (!formData.module) {
      errors.push('Module is required');
    }

    if (!formData.triggerEvent) {
      errors.push('Trigger event is required');
    }

    if (formData.actions?.length === 0) {
      errors.push('At least one action is required');
    }

    if (formData.triggerEvent === 'scheduled' && !formData.isScheduled) {
      errors.push('Scheduled trigger requires schedule configuration');
    }

    // Validate actions
    formData.actions?.forEach((action, index) => {
      if (!action.actionType.trim()) {
        errors.push(`Action ${index + 1}: Action type is required`);
      }
      if (action.delayInMinutes && action.delayInMinutes < 0) {
        errors.push(`Action ${index + 1}: Delay cannot be negative`);
      }
    });

    if (errors.length > 0) {
      showToast(errors.join(', '), 'error');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!(await validateForm())) return;
    
    setSaving(true);
    
    try {
      const updateData: UpdateWorkflowDto = {
        ...formData,
        conditions: Object.keys(conditions).length > 0 ? conditions : undefined,
        scheduleConfig: formData.isScheduled ? scheduleConfig : undefined,
        additionalCriteria: additionalCriteria.fieldCriteria && additionalCriteria.fieldCriteria.length > 0 
          ? additionalCriteria 
          : undefined,
      };

      const updatedWorkflow = await workflowService.updateWorkflow(workflowId, updateData);
      showToast('Workflow updated successfully', 'success');
      router.push(`/settings/workflows/${updatedWorkflow.id}`);
    } catch (error: any) {
      console.error('Error updating workflow:', error);
      showToast(error.message || 'Failed to update workflow', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (confirm('Are you sure? Any unsaved changes will be lost.')) {
      router.push(`/settings/workflows/${workflowId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30 p-6">
        <div className="text-center py-16">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Workflow Not Found</h2>
          <p className="text-gray-600 mb-8">The workflow you're trying to edit doesn't exist or has been deleted.</p>
          <button
            onClick={() => router.push('/settings/workflows')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Workflows
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-xl hover:bg-blue-50 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-blue-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                Edit Workflow: {workflow.name}
              </h1>
              <p className="text-gray-600 mt-2">
                Update workflow configuration and automation rules
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="px-4 py-2.5 border border-blue-200 bg-white/50 text-blue-700 rounded-xl hover:bg-blue-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
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
      </div>

      {/* Content - Same as CreateWorkflow but with current data */}
      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Basic Info & Actions */}
          <div className="lg:col-span-2 space-y-8">
            {/* Workflow Details Card */}
            <div className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                Workflow Details
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Workflow Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 border border-blue-200 bg-white/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Notify Sales Team on New Lead"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Module *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {modules.map((module) => (
                        <button
                          key={module.value}
                          type="button"
                          onClick={() => handleInputChange('module', module.value)}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            formData.module === module.value
                              ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300 text-blue-700'
                              : 'bg-white/50 border-blue-100 hover:bg-blue-50/50'
                          }`}
                        >
                          <div className="text-lg mb-1">{module.icon}</div>
                          <div className="text-xs font-medium">{module.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trigger Event *
                    </label>
                    <div className="space-y-2">
                      {triggerEvents.map((trigger) => (
                        <label
                          key={trigger.value}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            formData.triggerEvent === trigger.value
                              ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300'
                              : 'bg-white/50 border-blue-100 hover:bg-blue-50/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="triggerEvent"
                            value={trigger.value}
                            checked={formData.triggerEvent === trigger.value}
                            onChange={(e) => handleInputChange('triggerEvent', e.target.value)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="font-medium text-gray-900">{trigger.label}</div>
                            <div className="text-xs text-gray-600">{trigger.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Execution Frequency
                    </label>
                    <div className="space-y-2">
                      {executionFrequencies.map((freq) => (
                        <label
                          key={freq.value}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            formData.executionFrequency === freq.value
                              ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300'
                              : 'bg-white/50 border-blue-100 hover:bg-blue-50/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="executionFrequency"
                            value={freq.value}
                            checked={formData.executionFrequency === freq.value}
                            onChange={(e) => handleInputChange('executionFrequency', e.target.value)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="font-medium text-gray-900">{freq.label}</div>
                            <div className="text-xs text-gray-600">{freq.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleInputChange('active', true)}
                        className={`flex-1 p-3 rounded-xl border text-center transition-all ${
                          formData.active
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 text-green-700'
                            : 'bg-white/50 border-blue-100 hover:bg-green-50/50'
                        }`}
                      >
                        <Check className="h-5 w-5 mx-auto mb-1" />
                        <div className="text-sm font-medium">Active</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInputChange('active', false)}
                        className={`flex-1 p-3 rounded-xl border text-center transition-all ${
                          !formData.active
                            ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300 text-gray-700'
                            : 'bg-white/50 border-blue-100 hover:bg-gray-50/50'
                        }`}
                      >
                        <X className="h-5 w-5 mx-auto mb-1" />
                        <div className="text-sm font-medium">Inactive</div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Card */}
            <div className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                  Actions ({formData.actions?.length || 0})
                </h2>
                <button
                  type="button"
                  onClick={handleAddAction}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Action
                </button>
              </div>

              <div className="space-y-4">
                {formData.actions?.map((action, index) => {
                  const actionConfig = actionTypes.find(a => a.value === action.actionType);
                  const ActionIcon = actionConfig?.icon || Zap;
                  
                  return (
                    <div key={index} className="border border-blue-100 rounded-xl p-4 bg-white/50">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-r from-blue-100 to-blue-50 rounded-lg">
                            <ActionIcon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {actionConfig?.label || action.actionType}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {actionConfig?.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleRemoveAction(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            disabled={formData.actions!.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Action Type
                          </label>
                          <select
                            value={action.actionType}
                            onChange={(e) => handleActionChange(index, 'actionType', e.target.value)}
                            className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white/50"
                          >
                            {actionTypes.map(type => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Execution Order
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={action.executionOrder || index + 1}
                            onChange={(e) => handleActionChange(index, 'executionOrder', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white/50"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Delay (minutes)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={action.delayInMinutes || 0}
                            onChange={(e) => handleActionChange(index, 'delayInMinutes', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white/50"
                            placeholder="0 for immediate"
                          />
                        </div>
                      </div>

                      {/* Action-specific parameters */}
                      <div>
                        <h4 className="text-xs font-medium text-gray-700 mb-2">Parameters</h4>
                        {action.actionType === 'sendEmail' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                              type="text"
                              placeholder="Recipient Email"
                              value={action.params.to || ''}
                              onChange={(e) => handleParamsChange(index, 'to', e.target.value)}
                              className="px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white/50"
                            />
                            <input
                              type="text"
                              placeholder="Email Subject"
                              value={action.params.subject || ''}
                              onChange={(e) => handleParamsChange(index, 'subject', e.target.value)}
                              className="px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white/50"
                            />
                            <input
                              type="text"
                              placeholder="Template Name"
                              value={action.params.template || ''}
                              onChange={(e) => handleParamsChange(index, 'template', e.target.value)}
                              className="px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white/50"
                            />
                          </div>
                        )}

                        {action.actionType === 'createTask' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                              type="text"
                              placeholder="Task Name"
                              value={action.params.name || ''}
                              onChange={(e) => handleParamsChange(index, 'name', e.target.value)}
                              className="px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white/50"
                            />
                            <input
                              type="text"
                              placeholder="Assigned To (User ID)"
                              value={action.params.assignedTo || ''}
                              onChange={(e) => handleParamsChange(index, 'assignedTo', e.target.value)}
                              className="px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white/50"
                            />
                            <input
                              type="text"
                              placeholder="Due In (days)"
                              value={action.params.dueIn || ''}
                              onChange={(e) => handleParamsChange(index, 'dueIn', e.target.value)}
                              className="px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white/50"
                            />
                          </div>
                        )}

                        {action.actionType === 'updateRecord' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                              type="text"
                              placeholder="Field Name"
                              value={action.params.field || ''}
                              onChange={(e) => handleParamsChange(index, 'field', e.target.value)}
                              className="px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white/50"
                            />
                            <input
                              type="text"
                              placeholder="New Value"
                              value={action.params.value || ''}
                              onChange={(e) => handleParamsChange(index, 'value', e.target.value)}
                              className="px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white/50"
                            />
                          </div>
                        )}

                        {/* JSON editor for custom params */}
                        <div className="mt-4">
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Custom Parameters (JSON)
                          </label>
                          <textarea
                            value={JSON.stringify(action.params, null, 2)}
                            onChange={(e) => {
                              try {
                                const parsed = JSON.parse(e.target.value);
                                handleActionChange(index, 'params', parsed);
                              } catch {
                                // Invalid JSON, keep as is
                              }
                            }}
                            rows={3}
                            className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white/50 font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Conditions & Schedule */}
          <div className="space-y-8">
            {/* Conditions Card */}
            <div className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                Conditions
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={conditionField}
                    onChange={(e) => setConditionField(e.target.value)}
                    placeholder="Field name"
                    className="px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white/50"
                  />
                  <select
                    value={conditionOperator}
                    onChange={(e) => setConditionOperator(e.target.value)}
                    className="px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white/50"
                  >
                    {operators.map(op => (
                      <option key={op.value} value={op.value}>
                        {op.symbol} {op.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={conditionValue}
                    onChange={(e) => setConditionValue(e.target.value)}
                    placeholder="Value"
                    className="px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white/50"
                  />
                </div>
                
                <button
                  type="button"
                  onClick={handleAddCondition}
                  className="w-full py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-colors text-sm font-medium"
                >
                  <Plus className="h-4 w-4 inline mr-2" />
                  Add Condition
                </button>

                {Object.keys(conditions).length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-medium text-gray-700 mb-2">Current Conditions</h4>
                    <div className="space-y-2">
                      {Object.entries(conditions).map(([field, value]) => (
                        <div key={field} className="flex items-center justify-between p-2 bg-blue-50/50 rounded-lg">
                          <div className="text-sm">
                            <span className="font-medium text-blue-700">{field}</span>
                            <span className="text-gray-600 mx-2">=</span>
                            <span className="text-gray-900">{value}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveCondition(field)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Schedule Card */}
            <div className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Schedule
                </h2>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isScheduled}
                    onChange={(e) => handleInputChange('isScheduled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    {formData.isScheduled ? 'Scheduled' : 'Not Scheduled'}
                  </span>
                </label>
              </div>

              {formData.isScheduled && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Schedule Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {scheduleTypes.map(type => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setScheduleConfig(prev => ({ ...prev, type: type.value as any }))}
                          className={`p-3 rounded-xl border text-center ${
                            scheduleConfig.type === type.value
                              ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300 text-blue-700'
                              : 'bg-white/50 border-blue-100 hover:bg-blue-50/50'
                          }`}
                        >
                          <div className="text-sm font-medium">{type.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time
                    </label>
                    <input
                      type="time"
                      value={scheduleConfig.time}
                      onChange={(e) => setScheduleConfig(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white/50"
                    />
                  </div>

                  {scheduleConfig.type === 'weekly' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Days of Week
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => handleDayToggle(index)}
                            className={`px-3 py-1 rounded-lg text-sm ${
                              scheduleConfig.daysOfWeek?.includes(index)
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {scheduleConfig.type === 'custom' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cron Expression
                      </label>
                      <input
                        type="text"
                        value={scheduleConfig.customCron || ''}
                        onChange={(e) => setScheduleConfig(prev => ({ ...prev, customCron: e.target.value }))}
                        placeholder="0 9 * * *"
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white/50 font-mono"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Use standard cron syntax (e.g., "0 9 * * *" for daily at 9 AM)
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Additional Criteria Card */}
            <div className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Eye className="h-5 w-5 text-blue-600" />
                    Additional Criteria
                </h2>

                <div className="space-y-4">
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time Range
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <input
                        type="time"
                        placeholder="From"
                        value={additionalCriteria.timeRange?.from || ''}
                        onChange={(e) => setAdditionalCriteria(prev => ({
                            ...prev,
                            timeRange: { 
                            from: e.target.value,
                            to: prev.timeRange?.to || ''
                            }
                        }))}
                        className="px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white/50"
                        />
                        <input
                        type="time"
                        placeholder="To"
                        value={additionalCriteria.timeRange?.to || ''}
                        onChange={(e) => setAdditionalCriteria(prev => ({
                            ...prev,
                            timeRange: { 
                            from: prev.timeRange?.from || '',
                            to: e.target.value
                            }
                        }))}
                        className="px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white/50"
                        />
                    </div>
                    </div>

                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        User Criteria
                    </label>
                    <input
                        type="text"
                        placeholder="Roles (comma-separated)"
                        value={additionalCriteria.userCriteria?.roles?.join(', ') || ''}
                        onChange={(e) => setAdditionalCriteria(prev => ({
                        ...prev,
                        userCriteria: {
                            ...prev.userCriteria,
                            roles: e.target.value.split(',').map(r => r.trim()).filter(r => r)
                        }
                        }))}
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white/50"
                    />
                    </div>
                </div>
                </div>
          </div>
        </div>
      </form>
    </div>
  );
}