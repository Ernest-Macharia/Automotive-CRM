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
  ChevronRight,
  ChevronLeft,
  FolderOpen,
  Filter,
  Repeat,
  CalendarDays,
  Hash,
  Type,
  Key,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { workflowService } from '@/services/settings/workflowService';
import type { CreateWorkflowDto, WorkflowAction } from '@/services/settings/workflowService';

// Define types matching backend DTO
interface ScheduleConfig {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  time: string;
  daysOfWeek?: number[];
  daysOfMonth?: number[];
  customCron?: string;
}

interface AdditionalCriteria {
  timeRange?: {
    from: string;
    to: string;
  };
  userCriteria?: {
    roles?: string[];
    departments?: string[];
  };
  fieldCriteria?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
}

export default function CreateWorkflow() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Form data matching CreateWorkflowDto exactly
  const [formData, setFormData] = useState<CreateWorkflowDto>({
    name: '',
    module: 'opportunities',
    triggerEvent: 'onCreate',
    conditions: {},
    actions: [{
      actionType: 'sendEmail',
      params: {},
      executionOrder: 1,
      delayInMinutes: 0
    }],
    active: true,
    isScheduled: false,
    executionFrequency: 'immediate',
  });

  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
    type: 'daily',
    time: '09:00'
  });

  const [additionalCriteria, setAdditionalCriteria] = useState<AdditionalCriteria>({});
  
  const [conditions, setConditions] = useState<Record<string, any>>({});
  const [conditionField, setConditionField] = useState('');
  const [conditionOperator, setConditionOperator] = useState('equals');
  const [conditionValue, setConditionValue] = useState('');

  const [fieldCriteria, setFieldCriteria] = useState<Array<{
    field: string;
    operator: string;
    value: any;
  }>>([]);
  const [newFieldCriteria, setNewFieldCriteria] = useState({
    field: '',
    operator: 'equals',
    value: ''
  });

  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [userDepartments, setUserDepartments] = useState<string[]>([]);
  const [newRole, setNewRole] = useState('');
  const [newDepartment, setNewDepartment] = useState('');

  // Steps configuration
  const steps = [
    { id: 1, title: 'Basic Details', description: 'Workflow name and module' },
    { id: 2, title: 'Trigger & Conditions', description: 'When and how it runs' },
    { id: 3, title: 'Actions & Schedule', description: 'What it does and when' }
  ];

  // Modules exactly matching backend enum
  const modules = [
    { value: 'opportunities', label: 'Opportunities', icon: '💼' },
    { value: 'quotes', label: 'Quotes', icon: '📄' },
    { value: 'invoices', label: 'Invoices', icon: '🧾' },
    { value: 'payments', label: 'Payments', icon: '💰' },
    { value: 'leads', label: 'Leads', icon: '🎯' },
    { value: 'accounts', label: 'Accounts', icon: '🏢' },
    { value: 'contacts', label: 'Contacts', icon: '👤' },
  ];

  // Trigger events exactly matching backend enum
  const triggerEvents = [
    { 
      value: 'onCreate', 
      label: 'On Create', 
      icon: Plus,
      description: 'When a new record is created' 
    },
    { 
      value: 'onUpdate', 
      label: 'On Update', 
      icon: Repeat,
      description: 'When any field in record is updated' 
    },
    { 
      value: 'onDelete', 
      label: 'On Delete', 
      icon: Trash2,
      description: 'When a record is deleted' 
    },
    { 
      value: 'scheduled', 
      label: 'Scheduled', 
      icon: Clock,
      description: 'Run on a specific schedule' 
    },
    { 
      value: 'fieldUpdate', 
      label: 'Field Update', 
      icon: Hash,
      description: 'When specific field changes' 
    },
    { 
      value: 'stageChange', 
      label: 'Stage Change', 
      icon: FolderOpen,
      description: 'When record stage/progress changes' 
    },
  ];

  // Execution frequencies exactly matching backend enum
  const executionFrequencies = [
    { 
      value: 'immediate', 
      label: 'Immediate', 
      icon: Zap,
      description: 'Execute immediately when triggered' 
    },
    { 
      value: 'once', 
      label: 'Once', 
      icon: Calendar,
      description: 'Execute only once per record' 
    },
    { 
      value: 'every_time', 
      label: 'Every Time', 
      icon: Repeat,
      description: 'Execute every time trigger occurs' 
    },
    { 
      value: 'once_in_24_hours', 
      label: 'Once in 24 Hours', 
      icon: CalendarDays,
      description: 'Execute once per 24 hours per record' 
    },
  ];

  // Action types with proper structure
  const actionTypes = [
    { 
      value: 'sendEmail', 
      label: 'Send Email', 
      icon: Mail, 
      description: 'Send an email notification',
      paramFields: [
        { name: 'to', label: 'To Email', type: 'email', required: true },
        { name: 'subject', label: 'Subject', type: 'text', required: true },
        { name: 'body', label: 'Body', type: 'textarea', required: true },
        { name: 'template', label: 'Template Name', type: 'text', required: false },
        { name: 'cc', label: 'CC', type: 'text', required: false },
        { name: 'bcc', label: 'BCC', type: 'text', required: false }
      ]
    },
    { 
      value: 'sendNotification', 
      label: 'Send Notification', 
      icon: Bell, 
      description: 'Send in-app notification',
      paramFields: [
        { name: 'message', label: 'Message', type: 'text', required: true },
        { name: 'userId', label: 'User ID', type: 'text', required: false },
        { name: 'channel', label: 'Channel', type: 'text', required: false },
        { name: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high'], required: false }
      ]
    },
    { 
      value: 'createTask', 
      label: 'Create Task', 
      icon: Calendar, 
      description: 'Create a new task',
      paramFields: [
        { name: 'title', label: 'Task Title', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea', required: false },
        { name: 'assignedTo', label: 'Assigned To (User ID)', type: 'text', required: false },
        { name: 'dueDate', label: 'Due Date', type: 'date', required: false },
        { name: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high'], required: false }
      ]
    },
    { 
      value: 'updateRecord', 
      label: 'Update Record', 
      icon: Settings, 
      description: 'Update record fields',
      paramFields: [
        { name: 'field', label: 'Field Name', type: 'text', required: true },
        { name: 'value', label: 'New Value', type: 'text', required: true },
        { name: 'operation', label: 'Operation', type: 'select', options: ['set', 'increment', 'decrement'], required: false }
      ]
    },
    { 
      value: 'assignToUser', 
      label: 'Assign to User', 
      icon: Users, 
      description: 'Assign record to user',
      paramFields: [
        { name: 'userId', label: 'User ID', type: 'text', required: true },
        { name: 'role', label: 'Role', type: 'text', required: false },
        { name: 'notify', label: 'Notify User', type: 'checkbox', required: false }
      ]
    },
  ];

  const operators = [
    { value: 'equals', label: 'Equals', symbol: '=' },
    { value: 'notEquals', label: 'Not Equals', symbol: '≠' },
    { value: 'contains', label: 'Contains', symbol: '⊃' },
    { value: 'greaterThan', label: 'Greater Than', symbol: '>' },
    { value: 'lessThan', label: 'Less Than', symbol: '<' },
    { value: 'greaterThanOrEqual', label: 'Greater or Equal', symbol: '≥' },
    { value: 'lessThanOrEqual', label: 'Less or Equal', symbol: '≤' },
    { value: 'isSet', label: 'Is Set', symbol: '✓' },
    { value: 'isNotSet', label: 'Is Not Set', symbol: '✗' },
    { value: 'startsWith', label: 'Starts With', symbol: '→' },
    { value: 'endsWith', label: 'Ends With', symbol: '←' },
  ];

  const scheduleTypes = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'custom', label: 'Custom Cron' },
  ];

  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  // Step navigation
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Step validation
  const validateStep = (step: number): boolean => {
    const errors: string[] = [];

    switch (step) {
      case 1: // Basic Details
        if (!formData.name.trim()) {
          errors.push('Workflow name is required');
        }
        if (!formData.module) {
          errors.push('Module is required');
        }
        break;

      case 2: // Trigger & Conditions
        if (!formData.triggerEvent) {
          errors.push('Trigger event is required');
        }
        break;

      case 3: // Actions & Schedule
        if (formData.actions.length === 0) {
          errors.push('At least one action is required');
        }
        // Validate each action
        formData.actions.forEach((action, index) => {
          if (!action.actionType?.trim()) {
            errors.push(`Action ${index + 1}: Action type is required`);
          }
          if (action.delayInMinutes && action.delayInMinutes < 0) {
            errors.push(`Action ${index + 1}: Delay cannot be negative`);
          }
        });
        
        // Validate schedule if scheduled trigger
        if (formData.triggerEvent === 'scheduled' && !formData.isScheduled) {
          errors.push('Schedule configuration is required for scheduled triggers');
        }
        break;
    }

    setValidationErrors(errors);
    
    if (errors.length > 0) {
      showToast(`Please fix the following: ${errors.join(', ')}`, 'error');
      return false;
    }
    
    return true;
  };

  // Form handlers
  const handleInputChange = (field: keyof CreateWorkflowDto, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddAction = () => {
    const newAction: WorkflowAction = {
      actionType: 'sendEmail',
      params: {},
      executionOrder: formData.actions.length + 1,
      delayInMinutes: 0
    };
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, newAction]
    }));
  };

  const handleRemoveAction = (index: number) => {
    if (formData.actions.length > 1) {
      const newActions = [...formData.actions];
      newActions.splice(index, 1);
      // Reorder execution orders
      newActions.forEach((action, idx) => {
        action.executionOrder = idx + 1;
      });
      setFormData(prev => ({ ...prev, actions: newActions }));
    }
  };

  const handleActionChange = (index: number, field: keyof WorkflowAction, value: any) => {
    const newActions = [...formData.actions];
    newActions[index] = { ...newActions[index], [field]: value };
    
    // If action type changes, reset params
    if (field === 'actionType') {
      newActions[index].params = {};
    }
    
    setFormData(prev => ({ ...prev, actions: newActions }));
  };

  const handleParamsChange = (actionIndex: number, paramName: string, value: any) => {
    const newActions = [...formData.actions];
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
        [`${conditionField}.${conditionOperator}`]: conditionValue
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

  const handleAddFieldCriteria = () => {
    if (newFieldCriteria.field && newFieldCriteria.value) {
      setFieldCriteria(prev => [...prev, { ...newFieldCriteria }]);
      setNewFieldCriteria({ field: '', operator: 'equals', value: '' });
    }
  };

  const handleRemoveFieldCriteria = (index: number) => {
    setFieldCriteria(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddRole = () => {
    if (newRole.trim()) {
      setUserRoles(prev => [...prev, newRole.trim()]);
      setNewRole('');
    }
  };

  const handleRemoveRole = (index: number) => {
    setUserRoles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddDepartment = () => {
    if (newDepartment.trim()) {
      setUserDepartments(prev => [...prev, newDepartment.trim()]);
      setNewDepartment('');
    }
  };

  const handleRemoveDepartment = (index: number) => {
    setUserDepartments(prev => prev.filter((_, i) => i !== index));
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

  // Prepare final data for submission
  const prepareSubmitData = (): CreateWorkflowDto => {
    const submitData: CreateWorkflowDto = {
      name: formData.name,
      module: formData.module,
      triggerEvent: formData.triggerEvent,
      actions: formData.actions.map(action => ({
        actionType: action.actionType,
        params: action.params,
        executionOrder: action.executionOrder || 1,
        delayInMinutes: action.delayInMinutes || 0
      })),
      active: formData.active !== false, // Default to true
      executionFrequency: formData.executionFrequency || 'immediate',
    };

    // Add conditions if any
    if (Object.keys(conditions).length > 0) {
      submitData.conditions = conditions;
    }

    // Add schedule config if scheduled
    if (formData.isScheduled) {
      submitData.isScheduled = true;
      submitData.scheduleConfig = scheduleConfig;
    }

    // Add additional criteria if any
    const hasAdditionalCriteria = 
      (additionalCriteria.timeRange?.from || additionalCriteria.timeRange?.to) ||
      userRoles.length > 0 ||
      userDepartments.length > 0 ||
      fieldCriteria.length > 0;

    if (hasAdditionalCriteria) {
      submitData.additionalCriteria = {
        ...additionalCriteria,
        userCriteria: {
          ...(userRoles.length > 0 && { roles: userRoles }),
          ...(userDepartments.length > 0 && { departments: userDepartments })
        },
        ...(fieldCriteria.length > 0 && { fieldCriteria })
      };
    }

    return submitData;
  };

  // Final validation and submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) return;
    
    setSaving(true);
    
    try {
      const submitData = prepareSubmitData();
      console.log('Submitting workflow data:', submitData);
      
      // Validate with service
      const validation = await workflowService.validateWorkflowConfiguration(submitData);
      
      if (!validation.valid) {
        setValidationErrors(validation.errors);
        showToast(`Validation errors: ${validation.errors.join(', ')}`, 'error');
        if (validation.warnings.length > 0) {
          console.warn('Validation warnings:', validation.warnings);
        }
        return;
      }
      
      const createdWorkflow = await workflowService.createWorkflow(submitData);

      console.log('Created workflow object:', createdWorkflow);
        console.log('Workflow ID to redirect to:', createdWorkflow.id);
        
        // Ensure we have a valid ID before redirecting
        if (createdWorkflow && createdWorkflow.id) {
            showToast('Workflow created successfully', 'success');
            router.push(`/settings/workflows/${createdWorkflow.id}`);
        } else {
            throw new Error('Created workflow does not contain a valid ID');
        }
      
    } catch (error: any) {
      console.error('Error creating workflow:', error);
      showToast(error.message || 'Failed to create workflow', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (confirm('Are you sure? Any unsaved changes will be lost.')) {
      router.push('/settings/workflows');
    }
  };

  // Effect to update formData when conditions change
  useEffect(() => {
    if (Object.keys(conditions).length > 0) {
      setFormData(prev => ({ ...prev, conditions }));
    }
  }, [conditions]);

  // Effect to update additional criteria when fields change
  useEffect(() => {
    setAdditionalCriteria(prev => ({
      ...prev,
      userCriteria: {
        ...(userRoles.length > 0 && { roles: userRoles }),
        ...(userDepartments.length > 0 && { departments: userDepartments })
      },
      ...(fieldCriteria.length > 0 && { fieldCriteria })
    }));
  }, [userRoles, userDepartments, fieldCriteria]);

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
                Create New Workflow
              </h1>
              <p className="text-gray-600 mt-2">
                Automate processes with a multi-step configuration
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
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Create Workflow
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className={`flex flex-col items-center ${currentStep >= step.id ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center mb-2
                    ${currentStep >= step.id 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                      : 'bg-gray-100 text-gray-400'
                    }
                    ${currentStep === step.id ? 'ring-4 ring-blue-200' : ''}
                  `}>
                    {currentStep > step.id ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="font-bold">{step.id}</span>
                    )}
                  </div>
                  <span className="text-sm font-medium">{step.title}</span>
                  <span className="text-xs text-gray-500 mt-1">{step.description}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-4 ${currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="max-w-4xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-800">Please fix the following errors:</h3>
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        {/* Step 1: Basic Details */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Type className="h-5 w-5 text-blue-600" />
                Basic Information
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Workflow Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 border border-blue-200 bg-white/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Notify Sales Team on New Lead"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">Give your workflow a descriptive name</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Module *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {modules.map((module) => (
                      <button
                        key={module.value}
                        type="button"
                        onClick={() => handleInputChange('module', module.value)}
                        className={`p-4 rounded-xl border text-center transition-all ${
                          formData.module === module.value
                            ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300 text-blue-700 shadow-md'
                            : 'bg-white/50 border-blue-100 hover:bg-blue-50/50 hover:shadow-sm'
                        }`}
                      >
                        <div className="text-2xl mb-2">{module.icon}</div>
                        <div className="text-sm font-medium">{module.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleInputChange('active', true)}
                      className={`flex-1 p-4 rounded-xl border text-center transition-all ${
                        formData.active
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 text-green-700 shadow-md'
                          : 'bg-white/50 border-blue-100 hover:bg-green-50/50 hover:shadow-sm'
                      }`}
                    >
                      <Check className="h-6 w-6 mx-auto mb-2" />
                      <div className="font-medium">Active</div>
                      <div className="text-xs text-gray-600 mt-1">Will run automatically</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange('active', false)}
                      className={`flex-1 p-4 rounded-xl border text-center transition-all ${
                        !formData.active
                          ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300 text-gray-700 shadow-md'
                          : 'bg-white/50 border-blue-100 hover:bg-gray-50/50 hover:shadow-sm'
                      }`}
                    >
                      <X className="h-6 w-6 mx-auto mb-2" />
                      <div className="font-medium">Inactive</div>
                      <div className="text-xs text-gray-600 mt-1">Will not run</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-3 border border-blue-200 text-blue-700 rounded-xl hover:bg-blue-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Next: Trigger & Conditions
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Trigger & Conditions */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Filter className="h-5 w-5 text-blue-600" />
                Trigger & Conditions
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trigger Event *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {triggerEvents.map((trigger) => {
                      const Icon = trigger.icon;
                      return (
                        <label
                          key={trigger.value}
                          className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                            formData.triggerEvent === trigger.value
                              ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300 shadow-md'
                              : 'bg-white/50 border-blue-100 hover:bg-blue-50/50 hover:shadow-sm'
                          }`}
                        >
                          <input
                            type="radio"
                            name="triggerEvent"
                            value={trigger.value}
                            checked={formData.triggerEvent === trigger.value}
                            onChange={(e) => handleInputChange('triggerEvent', e.target.value)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Icon className="h-5 w-5 text-blue-600" />
                              <span className="font-medium text-gray-900">{trigger.label}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">{trigger.description}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Schedule toggle for scheduled trigger */}
                {formData.triggerEvent === 'scheduled' && (
                  <div className="p-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 border border-blue-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">Schedule Configuration</h3>
                        <p className="text-sm text-gray-600">Configure when this workflow should run</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isScheduled}
                          onChange={(e) => handleInputChange('isScheduled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        <span className="ml-3 text-sm font-medium text-gray-900">
                          {formData.isScheduled ? 'Enabled' : 'Disabled'}
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conditions (Optional)
                  </label>
                  <p className="text-sm text-gray-600 mb-4">Add conditions that must be met for the workflow to run</p>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <input
                          type="text"
                          value={conditionField}
                          onChange={(e) => setConditionField(e.target.value)}
                          placeholder="Field name"
                          className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white/50"
                        />
                        <p className="text-xs text-gray-500 mt-1">e.g., status, amount, priority</p>
                      </div>
                      <div>
                        <select
                          value={conditionOperator}
                          onChange={(e) => setConditionOperator(e.target.value)}
                          className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white/50"
                        >
                          {operators.map(op => (
                            <option key={op.value} value={op.value}>
                              {op.symbol} {op.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={conditionValue}
                          onChange={(e) => setConditionValue(e.target.value)}
                          placeholder="Value"
                          className="flex-1 px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white/50"
                        />
                        <button
                          type="button"
                          onClick={handleAddCondition}
                          className="px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {Object.keys(conditions).length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Current Conditions</h4>
                        <div className="space-y-2">
                          {Object.entries(conditions).map(([field, value]) => (
                            <div key={field} className="flex items-center justify-between p-3 bg-blue-50/50 rounded-lg">
                              <div className="text-sm">
                                <code className="font-mono text-blue-700 bg-blue-100 px-2 py-1 rounded">{field}</code>
                                <span className="text-gray-600 mx-2">=</span>
                                <span className="text-gray-900">{value}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveCondition(field)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Execution Frequency
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {executionFrequencies.map((freq) => {
                      const Icon = freq.icon;
                      return (
                        <label
                          key={freq.value}
                          className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                            formData.executionFrequency === freq.value
                              ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300 shadow-md'
                              : 'bg-white/50 border-blue-100 hover:bg-blue-50/50 hover:shadow-sm'
                          }`}
                        >
                          <input
                            type="radio"
                            name="executionFrequency"
                            value={freq.value}
                            checked={formData.executionFrequency === freq.value}
                            onChange={(e) => handleInputChange('executionFrequency', e.target.value)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Icon className="h-5 w-5 text-blue-600" />
                              <span className="font-medium text-gray-900">{freq.label}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">{freq.description}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center gap-2 px-6 py-3 border border-blue-200 text-blue-700 rounded-xl hover:bg-blue-50 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
                Back: Basic Details
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Next: Actions & Schedule
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Actions & Schedule */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {/* Actions Section */}
            <div className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                  Actions ({formData.actions.length})
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
                {formData.actions.map((action, index) => {
                  const actionConfig = actionTypes.find(a => a.value === action.actionType);
                  const ActionIcon = actionConfig?.icon || Settings;
                  
                  return (
                    <div key={index} className="border border-blue-100 rounded-xl p-4 bg-white/50">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-r from-blue-100 to-blue-50 rounded-lg">
                            <ActionIcon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              Action #{index + 1}: {actionConfig?.label || action.actionType}
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
                            disabled={formData.actions.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Action Type *
                          </label>
                          <select
                            value={action.actionType}
                            onChange={(e) => handleActionChange(index, 'actionType', e.target.value)}
                            className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white/50"
                            required
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
                            max={formData.actions.length}
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
                      {actionConfig?.paramFields && actionConfig.paramFields.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-xs font-medium text-gray-700 mb-3">Action Parameters</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {actionConfig.paramFields.map((param) => (
                              <div key={param.name}>
                                <label className="block text-xs font-medium text-gray-700 mb-2">
                                  {param.label} {param.required && '*'}
                                </label>
                                
                                {param.type === 'select' ? (
                                  <select
                                    value={action.params[param.name] || ''}
                                    onChange={(e) => handleParamsChange(index, param.name, e.target.value)}
                                    className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white/50"
                                    required={param.required}
                                  >
                                    <option value="">Select {param.label}</option>
                                    {param.options?.map(option => (
                                      <option key={option} value={option}>
                                        {option.charAt(0).toUpperCase() + option.slice(1)}
                                      </option>
                                    ))}
                                  </select>
                                ) : param.type === 'checkbox' ? (
                                  <label className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={!!action.params[param.name]}
                                      onChange={(e) => handleParamsChange(index, param.name, e.target.checked)}
                                      className="h-4 w-4 text-blue-600 rounded"
                                    />
                                    <span className="text-sm text-gray-700">{param.label}</span>
                                  </label>
                                ) : param.type === 'textarea' ? (
                                  <textarea
                                    value={action.params[param.name] || ''}
                                    onChange={(e) => handleParamsChange(index, param.name, e.target.value)}
                                    className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white/50"
                                    rows={3}
                                    required={param.required}
                                    placeholder={`Enter ${param.label.toLowerCase()}`}
                                  />
                                ) : (
                                  <input
                                    type={param.type}
                                    value={action.params[param.name] || ''}
                                    onChange={(e) => handleParamsChange(index, param.name, e.target.value)}
                                    className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white/50"
                                    required={param.required}
                                    placeholder={`Enter ${param.label.toLowerCase()}`}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* JSON editor for custom params */}
                      <div className="mt-4">
                        <details className="border border-blue-100 rounded-lg">
                          <summary className="px-3 py-2 bg-blue-50/50 text-sm font-medium text-blue-700 cursor-pointer">
                            Advanced Parameters (JSON)
                          </summary>
                          <div className="p-3">
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
                              rows={4}
                              className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white/50 font-mono text-xs"
                              placeholder='{"key": "value"}'
                            />
                            <p className="text-xs text-gray-500 mt-2">
                              Enter valid JSON for custom parameters
                            </p>
                          </div>
                        </details>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Schedule Configuration (only if scheduled trigger) */}
            {formData.triggerEvent === 'scheduled' && formData.isScheduled && (
              <div className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Schedule Configuration
                </h2>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Schedule Type *
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {scheduleTypes.map(type => (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setScheduleConfig(prev => ({ ...prev, type: type.value as any }))}
                            className={`p-3 rounded-xl border text-center transition-all ${
                              scheduleConfig.type === type.value
                                ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300 text-blue-700 shadow-md'
                                : 'bg-white/50 border-blue-100 hover:bg-blue-50/50 hover:shadow-sm'
                            }`}
                          >
                            <div className="text-sm font-medium">{type.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time *
                      </label>
                      <input
                        type="time"
                        value={scheduleConfig.time}
                        onChange={(e) => setScheduleConfig(prev => ({ ...prev, time: e.target.value }))}
                        className="w-full px-4 py-3 border border-blue-200 bg-white/50 rounded-xl"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-2">When to run the workflow</p>
                    </div>
                  </div>

                  {scheduleConfig.type === 'weekly' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Days of Week
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {daysOfWeek.map((day) => (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => handleDayToggle(day.value)}
                            className={`px-4 py-2 rounded-lg text-sm transition-all ${
                              scheduleConfig.daysOfWeek?.includes(day.value)
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                                : 'bg-white border border-blue-200 text-gray-700 hover:bg-blue-50 hover:shadow-sm'
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {scheduleConfig.type === 'monthly' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Days of Month
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              setScheduleConfig(prev => {
                                const days = prev.daysOfMonth || [];
                                const newDays = days.includes(day)
                                  ? days.filter(d => d !== day)
                                  : [...days, day];
                                return { ...prev, daysOfMonth: newDays };
                              });
                            }}
                            className={`w-10 h-10 rounded-lg text-sm transition-all ${
                              scheduleConfig.daysOfMonth?.includes(day)
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                                : 'bg-white border border-blue-200 text-gray-700 hover:bg-blue-50 hover:shadow-sm'
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
                        Cron Expression *
                      </label>
                      <input
                        type="text"
                        value={scheduleConfig.customCron || ''}
                        onChange={(e) => setScheduleConfig(prev => ({ ...prev, customCron: e.target.value }))}
                        placeholder="0 9 * * *"
                        className="w-full px-4 py-3 border border-blue-200 bg-white/50 rounded-xl font-mono"
                        required
                      />
                      <div className="mt-2 text-sm text-gray-600">
                        <p>Examples:</p>
                        <ul className="list-disc list-inside mt-1 text-xs">
                          <li><code>0 9 * * *</code> - Daily at 9 AM</li>
                          <li><code>0 0 * * 0</code> - Weekly on Sunday</li>
                          <li><code>0 0 1 * *</code> - Monthly on 1st day</li>
                          <li><code>*/15 * * * *</code> - Every 15 minutes</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional Criteria */}
            <div className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Key className="h-5 w-5 text-blue-600" />
                Additional Criteria (Optional)
              </h2>

              <div className="space-y-6">
                {/* Time Range */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Time Range</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">From</label>
                      <input
                        type="time"
                        value={additionalCriteria.timeRange?.from || ''}
                        onChange={(e) => setAdditionalCriteria(prev => ({
                          ...prev,
                          timeRange: { 
                            ...prev.timeRange,
                            from: e.target.value,
                            to: prev.timeRange?.to || ''
                          }
                        }))}
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">To</label>
                      <input
                        type="time"
                        value={additionalCriteria.timeRange?.to || ''}
                        onChange={(e) => setAdditionalCriteria(prev => ({
                          ...prev,
                          timeRange: { 
                            ...prev.timeRange,
                            from: prev.timeRange?.from || '',
                            to: e.target.value
                          }
                        }))}
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white/50"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Only run within this time range</p>
                </div>

                {/* User Criteria */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">User Criteria</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Roles</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                          placeholder="e.g., admin, manager"
                          className="flex-1 px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white/50"
                        />
                        <button
                          type="button"
                          onClick={handleAddRole}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                      {userRoles.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {userRoles.map((role, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                            >
                              {role}
                              <button
                                type="button"
                                onClick={() => handleRemoveRole(index)}
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Departments</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={newDepartment}
                          onChange={(e) => setNewDepartment(e.target.value)}
                          placeholder="e.g., sales, marketing"
                          className="flex-1 px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white/50"
                        />
                        <button
                          type="button"
                          onClick={handleAddDepartment}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                      {userDepartments.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {userDepartments.map((dept, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                            >
                              {dept}
                              <button
                                type="button"
                                onClick={() => handleRemoveDepartment(index)}
                                className="text-purple-500 hover:text-purple-700"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Field Criteria */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Field Criteria</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <input
                          type="text"
                          value={newFieldCriteria.field}
                          onChange={(e) => setNewFieldCriteria(prev => ({ ...prev, field: e.target.value }))}
                          placeholder="Field name"
                          className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white/50"
                        />
                      </div>
                      <div>
                        <select
                          value={newFieldCriteria.operator}
                          onChange={(e) => setNewFieldCriteria(prev => ({ ...prev, operator: e.target.value }))}
                          className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white/50"
                        >
                          {operators.map(op => (
                            <option key={op.value} value={op.value}>
                              {op.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newFieldCriteria.value}
                          onChange={(e) => setNewFieldCriteria(prev => ({ ...prev, value: e.target.value }))}
                          placeholder="Value"
                          className="flex-1 px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white/50"
                        />
                        <button
                          type="button"
                          onClick={handleAddFieldCriteria}
                          className="px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {fieldCriteria.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Current Field Criteria</h4>
                        <div className="space-y-2">
                          {fieldCriteria.map((criteria, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg">
                              <div className="text-sm">
                                <span className="font-medium text-gray-900">{criteria.field}</span>
                                <span className="text-gray-600 mx-2">
                                  {operators.find(op => op.value === criteria.operator)?.symbol || '='}
                                </span>
                                <span className="text-gray-700">{criteria.value}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveFieldCriteria(index)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center gap-2 px-6 py-3 border border-blue-200 text-blue-700 rounded-xl hover:bg-blue-50 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
                Back: Trigger & Conditions
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    Create Workflow
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Summary Preview */}
      {currentStep === 3 && (
        <div className="max-w-4xl mx-auto mt-8">
          <div className="bg-gradient-to-br from-blue-50/50 to-purple-50/50 border border-blue-100/50 rounded-2xl p-6">
            <h3 className="font-medium text-gray-900 mb-4">Workflow Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-medium text-gray-500 mb-2">Basic Info</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium text-blue-700">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Module:</span>
                    <span className="font-medium text-blue-700">
                      {modules.find(m => m.value === formData.module)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${formData.active ? 'text-green-700' : 'text-gray-700'}`}>
                      {formData.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-xs font-medium text-gray-500 mb-2">Trigger & Actions</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trigger:</span>
                    <span className="font-medium text-blue-700">
                      {triggerEvents.find(t => t.value === formData.triggerEvent)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Frequency:</span>
                    <span className="font-medium text-blue-700">
                      {executionFrequencies.find(f => f.value === formData.executionFrequency)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Actions:</span>
                    <span className="font-medium text-blue-700">{formData.actions.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}