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
  Calendar as CalendarIcon,
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

// Extend the CreateWorkflowDto type locally to include description and onCreateOrUpdate
interface ExtendedCreateWorkflowDto extends Omit<CreateWorkflowDto, 'triggerEvent'> {
  description?: string;
  triggerEvent: CreateWorkflowDto['triggerEvent'] | 'onCreateOrUpdate';
}

export default function CreateWorkflow() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Form data - using extended type locally
  const [formData, setFormData] = useState<ExtendedCreateWorkflowDto>({
    name: '',
    module: 'leads', // Default to leads based on screenshot
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
  
  // Condition state
  const [conditionField, setConditionField] = useState('');
  const [conditionOperator, setConditionOperator] = useState('equals');
  const [conditionValue, setConditionValue] = useState('');
  const [dateConditionValue, setDateConditionValue] = useState('');
  
  // New: Filter conditions for WHEN section
  const [filterCondition, setFilterCondition] = useState<'all' | 'matching'>('all');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [showFieldDropdown, setShowFieldDropdown] = useState(false);

  // Steps configuration - Simplified to match Zoho's flow
  const steps = [
    { id: 1, title: 'Rule Details', description: 'Name and module selection' },
    { id: 2, title: 'When', description: 'Trigger and conditions' },
    { id: 3, title: 'Actions', description: 'Instant and scheduled actions' }
  ];

  // Modules exactly matching backend enum - Updated order
  const modules = [
    { value: 'leads', label: 'Leads', icon: '🎯' },
    { value: 'opportunities', label: 'Opportunities', icon: '💼' },
    { value: 'accounts', label: 'Accounts', icon: '🏢' },
    { value: 'contacts', label: 'Contacts', icon: '👤' },
    { value: 'quotes', label: 'Quotes', icon: '📄' },
    { value: 'invoices', label: 'Invoices', icon: '🧾' },
    { value: 'payments', label: 'Payments', icon: '💰' },
  ];

  // Trigger events - Simplified to match Zoho's options
  const triggerEvents = [
    { 
      value: 'onCreate', 
      label: 'On Create', 
      description: 'When a new record is created' 
    },
    { 
      value: 'onUpdate', 
      label: 'On Update', 
      description: 'When a record is edited' 
    },
    { 
      value: 'onCreateOrUpdate', 
      label: 'On Create or Edit', 
      description: 'When a record is created or edited' 
    },
    { 
      value: 'onDelete', 
      label: 'On Delete', 
      description: 'When a record is deleted' 
    },
    { 
      value: 'scheduled', 
      label: 'Date/Time Field', 
      description: 'Based on date/time field value' 
    },
  ];

  // New: Trigger based on options (from screenshot)
  const triggerBasedOn = [
    { value: 'record_action', label: 'Record action', icon: '📝' },
    { value: 'datetime_field', label: 'Date/Time field', icon: CalendarIcon },
    { value: 'record_score', label: 'Record Score', icon: '⭐' },
    { value: 'record_notes', label: 'Record Notes', icon: '📝' },
  ];

  // Record action types (from screenshot)
  const recordActions = [
    { value: 'create_or_edit', label: 'Create or Edit', description: 'When a record is created or edited' },
    { value: 'create', label: 'Create', description: 'When a record is created' },
    { value: 'edit', label: 'Edit', description: 'When a record is edited' },
    { value: 'delete', label: 'Delete', description: 'When a record is deleted' },
  ];

  // Field options for conditions (sample - should be dynamic based on module)
  const fieldOptions = [
    { value: 'status', label: 'Status', type: 'text' },
    { value: 'country', label: 'Country', type: 'text' },
    { value: 'converted_deal', label: 'Converted Deal', type: 'boolean' },
    { value: 'created_by', label: 'Created By', type: 'user' },
    { value: 'created_time', label: 'Created Time', type: 'datetime' },
    { value: 'appointment_scheduled_date', label: 'Appointment Scheduled Date', type: 'datetime' },
  ];

  // Operators based on field type
  const getOperatorsForField = (fieldType: string) => {
    const baseOperators = [
      { value: 'equals', label: 'Equals', symbol: '=' },
      { value: 'not_equals', label: 'Not Equals', symbol: '≠' },
      { value: 'contains', label: 'Contains', symbol: '⊃' },
    ];

    if (fieldType === 'datetime') {
      return [
        { value: 'equals', label: 'Is', symbol: '=' },
        { value: 'not_equals', label: 'Is Not', symbol: '≠' },
        { value: 'before', label: 'Before', symbol: '<' },
        { value: 'after', label: 'After', symbol: '>' },
        { value: 'within', label: 'Within', symbol: '±' },
      ];
    }

    return baseOperators;
  };

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
      case 1: // Rule Details
        if (!formData.name.trim()) {
          errors.push('Rule name is required');
        }
        if (!formData.module) {
          errors.push('Module is required');
        }
        break;

      case 2: // When
        if (!formData.triggerEvent) {
          errors.push('Trigger is required');
        }
        break;

      case 3: // Actions
        if (formData.actions.length === 0) {
          errors.push('At least one action is required');
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
  const handleInputChange = (field: keyof ExtendedCreateWorkflowDto, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // New: Handle WHEN section changes
  const handleTriggerBasedOnChange = (value: string) => {
    if (value === 'datetime_field') {
      setFormData(prev => ({ 
        ...prev, 
        triggerEvent: 'scheduled',
        isScheduled: true 
      }));
    } else if (value === 'record_action') {
      setFormData(prev => ({ 
        ...prev, 
        triggerEvent: 'onCreateOrUpdate', // Default for record action
        isScheduled: false 
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        triggerEvent: 'onCreate', // Default
        isScheduled: false 
      }));
    }
  };

  const handleRecordActionChange = (value: string) => {
    const triggerMap: Record<string, ExtendedCreateWorkflowDto['triggerEvent']> = {
      'create_or_edit': 'onCreateOrUpdate',
      'create': 'onCreate',
      'edit': 'onUpdate',
      'delete': 'onDelete',
    };
    
    if (triggerMap[value]) {
      handleInputChange('triggerEvent', triggerMap[value]);
    }
  };

  // Handle condition field selection
  const handleConditionFieldSelect = (fieldValue: string) => {
    setConditionField(fieldValue);
    const field = fieldOptions.find(f => f.value === fieldValue);
    if (field?.type === 'datetime') {
      setConditionOperator('equals'); // Default for date fields
    }
    setShowFieldDropdown(false);
  };

  // Add condition
  const handleAddCondition = () => {
    if (conditionField && (conditionValue || dateConditionValue)) {
      const value = conditionField.includes('date') ? dateConditionValue : conditionValue;
      const newCondition = { 
        field: conditionField, 
        operator: conditionOperator, 
        value 
      };
      
      setFormData(prev => ({
        ...prev,
        conditions: {
          ...prev.conditions,
          [`${conditionField}_${Date.now()}`]: newCondition
        }
      }));
      
      // Reset fields
      setConditionField('');
      setConditionValue('');
      setDateConditionValue('');
    }
  };

  // Remove condition
  const handleRemoveCondition = (key: string) => {
    const newConditions = { ...formData.conditions };
    delete newConditions[key];
    setFormData(prev => ({ ...prev, conditions: newConditions }));
  };

  // Handle filter condition change
  const handleFilterConditionChange = (value: 'all' | 'matching') => {
    setFilterCondition(value);
    if (value === 'all') {
      // Clear conditions when selecting "All Leads"
      setFormData(prev => ({ ...prev, conditions: {} }));
    }
  };

  // Handle field selection for filter
  const handleFieldToggle = (fieldValue: string) => {
    if (selectedFields.includes(fieldValue)) {
      setSelectedFields(prev => prev.filter(f => f !== fieldValue));
    } else {
      setSelectedFields(prev => [...prev, fieldValue]);
    }
  };

  // Handle date condition value change
  const handleDateConditionChange = (value: string) => {
    setDateConditionValue(value);
    // If it's a datetime field, set to IS operator by default
    if (conditionField.includes('date') && !conditionOperator) {
      setConditionOperator('equals');
    }
  };

  // Action handlers (from original code)
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
      newActions.forEach((action, idx) => {
        action.executionOrder = idx + 1;
      });
      setFormData(prev => ({ ...prev, actions: newActions }));
    }
  };

  const handleActionChange = (index: number, field: keyof WorkflowAction, value: any) => {
    const newActions = [...formData.actions];
    newActions[index] = { ...newActions[index], [field]: value };
    
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

  // Prepare final data for submission - Convert to CreateWorkflowDto
  const prepareSubmitData = (): CreateWorkflowDto => {
    // Map onCreateOrUpdate to onCreate for backend compatibility
    const backendTriggerEvent = formData.triggerEvent === 'onCreateOrUpdate' 
      ? 'onCreate' 
      : (formData.triggerEvent as CreateWorkflowDto['triggerEvent']);

    const submitData: CreateWorkflowDto = {
      name: formData.name,
      module: formData.module,
      triggerEvent: backendTriggerEvent,
      actions: formData.actions.map(action => ({
        actionType: action.actionType,
        params: action.params,
        executionOrder: action.executionOrder || 1,
        delayInMinutes: action.delayInMinutes || 0
      })),
      active: formData.active !== false,
      executionFrequency: formData.executionFrequency || 'immediate',
    };

    // Add conditions if any
    if (Object.keys(formData.conditions).length > 0) {
      submitData.conditions = formData.conditions;
    }

    // Add schedule config if scheduled
    if (formData.isScheduled) {
      submitData.isScheduled = true;
      submitData.scheduleConfig = scheduleConfig;
    }

    return submitData;
  };

  // Check if trigger is a record action (not scheduled)
  const isRecordActionTrigger = formData.triggerEvent !== 'scheduled';

  // Final validation and submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) return;
    
    setSaving(true);
    
    try {
      const submitData = prepareSubmitData();
      
      const validation = await workflowService.validateWorkflowConfiguration(submitData);
      
      if (!validation.valid) {
        setValidationErrors(validation.errors);
        showToast(`Validation errors: ${validation.errors.join(', ')}`, 'error');
        return;
      }
      
      const createdWorkflow = await workflowService.createWorkflow(submitData);
      
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

  // Get selected field type for operator selection
  const selectedFieldType = fieldOptions.find(f => f.value === conditionField)?.type || 'text';

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
                Create New Rule
              </h1>
              <p className="text-gray-600 mt-2">
                Automate processes with conditional workflows
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
                  Save Rule
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
        {/* Step 1: Rule Details */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Type className="h-5 w-5 text-blue-600" />
                Rule Details
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Module *
                  </label>
                  <div className="relative">
                    <select
                      value={formData.module}
                      onChange={(e) => handleInputChange('module', e.target.value)}
                      className="w-full px-4 py-3 border border-blue-200 bg-white/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                      required
                    >
                      <option value="">Select Module</option>
                      {modules.map((module) => (
                        <option key={module.value} value={module.value}>
                          {module.icon} {module.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <ChevronRight className="h-5 w-5 text-gray-400 rotate-90" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rule Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 border border-blue-200 bg-white/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter rule name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-4 py-3 border border-blue-200 bg-white/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe what this rule does"
                    rows={3}
                  />
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
                Next: When
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: WHEN */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                WHEN
              </h2>
              
              <div className="space-y-6">
                {/* Trigger based on - like Zoho */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Execute this workflow rule based on
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {triggerBasedOn.map((trigger) => (
                      <button
                        key={trigger.value}
                        type="button"
                        onClick={() => handleTriggerBasedOnChange(trigger.value)}
                        className={`p-4 rounded-xl border text-center transition-all ${
                          (trigger.value === 'record_action' && isRecordActionTrigger) ||
                          (trigger.value === 'datetime_field' && formData.triggerEvent === 'scheduled')
                            ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300 text-blue-700 shadow-md'
                            : 'bg-white/50 border-blue-100 hover:bg-blue-50/50 hover:shadow-sm'
                        }`}
                      >
                        <div className="text-lg mb-2">
                          {typeof trigger.icon === 'string' ? trigger.icon : <trigger.icon className="h-5 w-5 mx-auto" />}
                        </div>
                        <div className="text-sm font-medium">{trigger.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Record Action Selection - like Zoho screenshot */}
                {isRecordActionTrigger && (
                  <div className="border-t border-blue-100 pt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Record action
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {recordActions.map((action) => {
                        const isSelected = 
                          (action.value === 'create_or_edit' && formData.triggerEvent === 'onCreateOrUpdate') ||
                          (action.value === 'create' && formData.triggerEvent === 'onCreate') ||
                          (action.value === 'edit' && formData.triggerEvent === 'onUpdate') ||
                          (action.value === 'delete' && formData.triggerEvent === 'onDelete');
                        
                        return (
                          <label
                            key={action.value}
                            className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300 shadow-md'
                                : 'bg-white/50 border-blue-100 hover:bg-blue-50/50 hover:shadow-sm'
                            }`}
                          >
                            <input
                              type="radio"
                              name="recordAction"
                              value={action.value}
                              checked={isSelected}
                              onChange={() => handleRecordActionChange(action.value)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <span className="font-medium text-gray-900">{action.label}</span>
                              <p className="text-xs text-gray-600 mt-1">{action.description}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Condition Description */}
                <div className="p-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 border border-blue-200 rounded-xl">
                  <p className="text-sm text-gray-700">
                    {formData.triggerEvent === 'scheduled' ? (
                      'This rule will be executed based on the selected date/time field.'
                    ) : (
                      `This rule will be executed when a ${modules.find(m => m.value === formData.module)?.label?.toLowerCase() || 'record'} is ${recordActions.find(a => {
                        if (formData.triggerEvent === 'onCreateOrUpdate') return a.value === 'create_or_edit';
                        if (formData.triggerEvent === 'onCreate') return a.value === 'create';
                        if (formData.triggerEvent === 'onUpdate') return a.value === 'edit';
                        return false;
                      })?.label?.toLowerCase() || 'modified'} to meet the condition (if any).`
                    )}
                  </p>
                </div>

                {/* Filter Condition - like Zoho */}
                <div className="border-t border-blue-100 pt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">
                    Which {modules.find(m => m.value === formData.module)?.label?.toLowerCase() || 'records'} would you like to apply the rule to?
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="filterCondition"
                          checked={filterCondition === 'all'}
                          onChange={() => handleFilterConditionChange('all')}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">All {modules.find(m => m.value === formData.module)?.label || 'Records'}</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="filterCondition"
                          checked={filterCondition === 'matching'}
                          onChange={() => handleFilterConditionChange('matching')}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{modules.find(m => m.value === formData.module)?.label || 'Records'} matching certain conditions</span>
                      </label>
                    </div>

                    {/* Condition Builder - Only show when "matching" is selected */}
                    {filterCondition === 'matching' && (
                      <div className="mt-4 p-4 bg-white/50 border border-blue-100 rounded-xl">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Add Condition</h4>
                        
                        {/* Field Selection with Dropdown */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowFieldDropdown(!showFieldDropdown)}
                              className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white text-left flex items-center justify-between"
                            >
                              {conditionField ? (
                                <span className="text-gray-900">
                                  {fieldOptions.find(f => f.value === conditionField)?.label || conditionField}
                                </span>
                              ) : (
                                <span className="text-gray-500">Select Field</span>
                              )}
                              <ChevronRight className="h-4 w-4 text-gray-400 rotate-90" />
                            </button>
                            
                            {showFieldDropdown && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-blue-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                                {fieldOptions.map((field) => (
                                  <button
                                    key={field.value}
                                    type="button"
                                    onClick={() => handleConditionFieldSelect(field.value)}
                                    className="w-full px-3 py-2 text-left hover:bg-blue-50 text-sm"
                                  >
                                    {field.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Operator Selection */}
                          <div>
                            <select
                              value={conditionOperator}
                              onChange={(e) => setConditionOperator(e.target.value)}
                              className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white"
                            >
                              {getOperatorsForField(selectedFieldType).map(op => (
                                <option key={op.value} value={op.value}>
                                  {op.symbol} {op.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Value Input - Dynamic based on field type */}
                          <div className="flex gap-2">
                            {selectedFieldType === 'datetime' ? (
                              <input
                                type="datetime-local"
                                value={dateConditionValue}
                                onChange={(e) => handleDateConditionChange(e.target.value)}
                                className="flex-1 px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white"
                                placeholder="Select date and time"
                              />
                            ) : (
                              <input
                                type={selectedFieldType === 'boolean' ? 'text' : 'text'}
                                value={conditionValue}
                                onChange={(e) => setConditionValue(e.target.value)}
                                className="flex-1 px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white"
                                placeholder="Enter value"
                              />
                            )}
                            <button
                              type="button"
                              onClick={handleAddCondition}
                              className="px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Current Conditions */}
                        {Object.keys(formData.conditions).length > 0 && (
                          <div className="mt-4">
                            <h5 className="text-xs font-medium text-gray-700 mb-2">Current Conditions</h5>
                            <div className="space-y-2">
                              {Object.entries(formData.conditions).map(([key, condition]: [string, any]) => (
                                <div key={key} className="flex items-center justify-between p-3 bg-blue-50/50 rounded-lg">
                                  <div className="text-sm">
                                    <span className="font-medium text-blue-700">
                                      {fieldOptions.find(f => f.value === condition.field)?.label || condition.field}
                                    </span>
                                    <span className="text-gray-600 mx-2">
                                      {getOperatorsForField(selectedFieldType).find(op => op.value === condition.operator)?.symbol || '='}
                                    </span>
                                    <span className="text-gray-900">{condition.value}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCondition(key)}
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
                Back: Rule Details
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Next: Actions
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Actions - Simplified to match Zoho */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {/* Actions Section */}
            <div className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                Actions
              </h2>

              {/* Instant Actions */}
              <div className="mb-8">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Instant Actions</h3>
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
                                {actionConfig?.label || action.actionType}
                              </h3>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAction(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            disabled={formData.actions.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Action Type Selection */}
                        <div className="mb-4">
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Action Type *
                          </label>
                          <select
                            value={action.actionType}
                            onChange={(e) => handleActionChange(index, 'actionType', e.target.value)}
                            className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white"
                            required
                          >
                            {actionTypes.map(type => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Delay Configuration - Like Zoho's "Execute X Hour(s) after Rule Trigger Time" */}
                        <div className="mb-4">
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Execution Delay
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Execute</span>
                            <input
                              type="number"
                              min="0"
                              value={action.delayInMinutes || 0}
                              onChange={(e) => handleActionChange(index, 'delayInMinutes', parseInt(e.target.value))}
                              className="w-20 px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white"
                              placeholder="0"
                            />
                            <select
                              value="hours"
                              className="px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white"
                            >
                              <option value="minutes">Minute(s)</option>
                              <option value="hours">Hour(s)</option>
                              <option value="days">Day(s)</option>
                            </select>
                            <span className="text-sm text-gray-600">→ Rule Trigger Time</span>
                          </div>
                        </div>

                        {/* Action Parameters - Simplified for common actions */}
                        {action.actionType === 'sendEmail' && (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-2">
                                To Email
                              </label>
                              <input
                                type="email"
                                value={action.params.to || ''}
                                onChange={(e) => handleParamsChange(index, 'to', e.target.value)}
                                className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white"
                                placeholder="recipient@example.com"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-2">
                                Subject
                              </label>
                              <input
                                type="text"
                                value={action.params.subject || ''}
                                onChange={(e) => handleParamsChange(index, 'subject', e.target.value)}
                                className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white"
                                placeholder="Email subject"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Add Action Button */}
                <button
                  type="button"
                  onClick={handleAddAction}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Action
                </button>
              </div>

              {/* Scheduled Actions - Only show for date/time triggers */}
              {formData.triggerEvent === 'scheduled' && (
                <div className="border-t border-blue-100 pt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Scheduled Actions</h3>
                  <div className="p-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 border border-blue-200 rounded-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Schedule Type
                        </label>
                        <select
                          value={scheduleConfig.type}
                          onChange={(e) => setScheduleConfig(prev => ({ ...prev, type: e.target.value as any }))}
                          className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Time
                        </label>
                        <input
                          type="time"
                          value={scheduleConfig.time}
                          onChange={(e) => setScheduleConfig(prev => ({ ...prev, time: e.target.value }))}
                          className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center gap-2 px-6 py-3 border border-blue-200 text-blue-700 rounded-xl hover:bg-blue-50 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
                Back: When
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Creating Rule...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    Save Rule
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Summary Preview - Simplified */}
      {currentStep === 3 && (
        <div className="max-w-4xl mx-auto mt-8">
          <div className="bg-gradient-to-br from-blue-50/50 to-purple-50/50 border border-blue-100/50 rounded-2xl p-6">
            <h3 className="font-medium text-gray-900 mb-4">Rule Summary</h3>
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
                </div>
              </div>
              
              <div>
                <h4 className="text-xs font-medium text-gray-500 mb-2">Trigger & Actions</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trigger:</span>
                    <span className="font-medium text-blue-700">
                      {formData.triggerEvent === 'scheduled' ? 'Date/Time Field' : 
                       recordActions.find(a => {
                         if (formData.triggerEvent === 'onCreateOrUpdate') return a.value === 'create_or_edit';
                         if (formData.triggerEvent === 'onCreate') return a.value === 'create';
                         if (formData.triggerEvent === 'onUpdate') return a.value === 'edit';
                         if (formData.triggerEvent === 'onDelete') return a.value === 'delete';
                         return false;
                       })?.label || formData.triggerEvent}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Conditions:</span>
                    <span className="font-medium text-blue-700">
                      {filterCondition === 'all' ? 'All records' : `${Object.keys(formData.conditions).length} condition(s)`}
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

// Keep the existing actionTypes array from your original code
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
    ]
  },
  { 
    value: 'sendNotification', 
    label: 'Send Notification', 
    icon: Bell, 
    description: 'Send in-app notification',
    paramFields: [
      { name: 'message', label: 'Message', type: 'text', required: true },
    ]
  },
  { 
    value: 'createTask', 
    label: 'Create Task', 
    icon: Calendar, 
    description: 'Create a new task',
    paramFields: [
      { name: 'title', label: 'Task Title', type: 'text', required: true },
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
    ]
  },
];