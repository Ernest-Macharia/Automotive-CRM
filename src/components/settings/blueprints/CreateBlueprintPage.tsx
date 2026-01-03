'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
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
  GripVertical,
  MoveVertical,
  Eye,
  Settings,
  AlertCircle,
  Check,
  ArrowUpDown,
  Workflow,
  Play,
  Pause,
  Edit2,
  Copy,
  Lock,
  Unlock,
  Share2,
  Download,
  Upload,
  Search,
  Filter,
  Grid,
  List,
  Maximize2,
  Minimize2,
  HelpCircle,
  Info,
  Shield,
  Globe,
  Key,
  Hash,
  Type,
  ToggleLeft,
  ToggleRight,
  Clock,
  Star,
  Tag,
  Folder,
  FileText,
  BarChart,
  PieChart,
  LineChart,
  TrendingUp,
  ArrowRight,
  ArrowLeft as ArrowLeftIcon,
  CheckCircle,
  Circle,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { blueprintsService } from '@/services/settings/blueprintsService';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

// Fix: Update ActionForm interface to allow boolean in params
interface ActionForm {
  id?: string;
  name?: string;
  enabled?: boolean;
  actionType: string;
  params: Record<string, any>; // Changed from Record<string, string> to Record<string, any>
}

interface StageForm {
  id?: string;
  name: string;
  order: number;
  allowedRoles: string[];
  entryActions: ActionForm[];
  exitActions: ActionForm[];
  isExpanded?: boolean;
  color?: string;
  icon?: string;
  description?: string;
}

// Step types
type StepType = 'basic' | 'stages' | 'design' | 'preview';

export default function CreateBlueprintPage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [availableModules, setAvailableModules] = useState<string[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    module: '',
    description: '',
    isActive: true,
    stages: [] as StageForm[],
  });

  const [currentStep, setCurrentStep] = useState<StepType>('basic');
  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Module options with icons
  const modules = [
    { id: 'opportunities', name: 'Opportunities', icon: '💼' },
    { id: 'quotes', name: 'Quotes', icon: '📝' },
    { id: 'customers', name: 'Customers', icon: '👥' },
    { id: 'jobs', name: 'Jobs', icon: '🔧' },
    { id: 'inventory', name: 'Inventory', icon: '📦' },
    { id: 'projects', name: 'Projects', icon: '📊' },
    { id: 'tickets', name: 'Support Tickets', icon: '🎫' },
    { id: 'leads', name: 'Leads', icon: '🎯' },
  ];

  // Role categories
  const roleCategories = [
    {
      category: 'Administrative',
      roles: [
        { id: 'admin', name: 'Administrator', description: 'Full system access' },
        { id: 'supervisor', name: 'Supervisor', description: 'Team management access' },
        { id: 'manager', name: 'Manager', description: 'Department management' },
      ]
    },
    {
      category: 'Sales',
      roles: [
        { id: 'sales_rep', name: 'Sales Representative', description: 'Sales team member' },
        { id: 'account_exec', name: 'Account Executive', description: 'Key account management' },
        { id: 'sales_manager', name: 'Sales Manager', description: 'Sales team leadership' },
      ]
    },
    {
      category: 'Operations',
      roles: [
        { id: 'technician', name: 'Technician', description: 'Field service operations' },
        { id: 'dispatcher', name: 'Dispatcher', description: 'Job scheduling and dispatch' },
        { id: 'operations_manager', name: 'Operations Manager', description: 'Operations oversight' },
      ]
    },
    {
      category: 'Support',
      roles: [
        { id: 'support_agent', name: 'Support Agent', description: 'Customer support' },
        { id: 'customer_success', name: 'Customer Success', description: 'Customer relationship management' },
        { id: 'quality_assurance', name: 'Quality Assurance', description: 'Service quality monitoring' },
      ]
    },
    {
      category: 'Finance',
      roles: [
        { id: 'accountant', name: 'Accountant', description: 'Financial management' },
        { id: 'finance_manager', name: 'Finance Manager', description: 'Budget oversight' },
        { id: 'auditor', name: 'Auditor', description: 'Financial compliance' },
      ]
    },
  ];

  // Template options
  const blueprintTemplates = [
    { id: 'sales_pipeline', name: 'Sales Pipeline', icon: '📈', description: 'Standard sales process workflow' },
    { id: 'support_ticket', name: 'Support Ticket', icon: '🎫', description: 'Customer support ticket workflow' },
    { id: 'project_management', name: 'Project Management', icon: '📊', description: 'Project lifecycle management' },
    { id: 'recruitment', name: 'Recruitment', icon: '👥', description: 'Candidate hiring process' },
    { id: 'purchase_order', name: 'Purchase Order', icon: '📝', description: 'Procurement approval workflow' },
    { id: 'incident_response', name: 'Incident Response', icon: '🚨', description: 'Emergency incident handling' },
    { id: 'content_approval', name: 'Content Approval', icon: '✍️', description: 'Content review and approval process' },
    { id: 'customer_onboarding', name: 'Customer Onboarding', icon: '🚀', description: 'New customer setup process' },
  ];

  // Stage colors inspired by Zoho
  const stageColors = [
    { 
      id: 'blue', name: 'Blue Ocean', 
      bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', 
      darkBg: 'bg-blue-100'
    },
    { 
      id: 'green', name: 'Green Forest', 
      bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', 
      darkBg: 'bg-green-100'
    },
    { 
      id: 'purple', name: 'Purple Haze', 
      bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', 
      darkBg: 'bg-purple-100'
    },
    { 
      id: 'amber', name: 'Amber Sun', 
      bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', 
      darkBg: 'bg-amber-100'
    },
    { 
      id: 'rose', name: 'Rose Garden', 
      bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', 
      darkBg: 'bg-rose-100'
    },
    { 
      id: 'cyan', name: 'Cyan Sky', 
      bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', 
      darkBg: 'bg-cyan-100'
    },
    { 
      id: 'indigo', name: 'Indigo Night', 
      bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', 
      darkBg: 'bg-indigo-100'
    },
    { 
      id: 'emerald', name: 'Emerald Green', 
      bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', 
      darkBg: 'bg-emerald-100'
    },
  ];

  // Stage icon options
  const stageIcons = [
    { value: 'clipboard', icon: '📋', label: 'Clipboard' },
    { value: 'check-circle', icon: '✅', label: 'Check Circle' },
    { value: 'flag', icon: '🏁', label: 'Flag' },
    { value: 'star', icon: '⭐', label: 'Star' },
    { value: 'rocket', icon: '🚀', label: 'Rocket' },
    { value: 'target', icon: '🎯', label: 'Target' },
    { value: 'lightbulb', icon: '💡', label: 'Lightbulb' },
    { value: 'gear', icon: '⚙️', label: 'Gear' },
    { value: 'shield', icon: '🛡️', label: 'Shield' },
    { value: 'clock', icon: '⏰', label: 'Clock' },
    { value: 'bell', icon: '🔔', label: 'Bell' },
    { value: 'lock', icon: '🔒', label: 'Lock' },
    { value: 'unlock', icon: '🔓', label: 'Unlock' },
    { value: 'warning', icon: '⚠️', label: 'Warning' },
    { value: 'trophy', icon: '🏆', label: 'Trophy' },
    { value: 'dollar', icon: '💰', label: 'Dollar' },
    { value: 'message', icon: '💬', label: 'Message' },
    { value: 'phone', icon: '📞', label: 'Phone' },
    { value: 'email', icon: '📧', label: 'Email' },
    { value: 'calendar', icon: '📅', label: 'Calendar' },
  ];

  // Predefined stage templates
  const stageTemplates = [
    { 
      id: 'initial', 
      name: 'Initial Contact', 
      color: 'blue',
      icon: 'phone',
      description: 'First contact with prospect',
      entryActions: ['sendEmail'],
      exitActions: ['createTask']
    },
    { 
      id: 'qualification', 
      name: 'Qualification', 
      color: 'green',
      icon: 'target',
      description: 'Assess prospect needs and fit',
      entryActions: ['sendNotification'],
      exitActions: ['updateField']
    },
    { 
      id: 'proposal', 
      name: 'Proposal Sent', 
      color: 'purple',
      icon: 'clipboard',
      description: 'Proposal delivered to client',
      entryActions: ['sendEmail', 'createTask'],
      exitActions: ['assignRecord']
    },
    { 
      id: 'negotiation', 
      name: 'Negotiation', 
      color: 'amber',
      icon: 'message',
      description: 'Contract terms discussion',
      entryActions: ['sendNotification'],
      exitActions: ['webhook']
    },
    { 
      id: 'review', 
      name: 'Under Review', 
      color: 'cyan',
      icon: 'clock',
      description: 'Proposal being reviewed',
      entryActions: ['sendNotification'],
      exitActions: ['sendEmail']
    },
    { 
      id: 'approval', 
      name: 'Awaiting Approval', 
      color: 'indigo',
      icon: 'shield',
      description: 'Waiting for management approval',
      entryActions: ['sendNotification'],
      exitActions: ['createRecord']
    },
    { 
      id: 'closed_won', 
      name: 'Closed Won', 
      color: 'emerald',
      icon: 'trophy',
      description: 'Deal successfully closed',
      entryActions: ['sendEmail', 'createRecord'],
      exitActions: []
    },
    { 
      id: 'closed_lost', 
      name: 'Closed Lost', 
      color: 'rose',
      icon: 'warning',
      description: 'Deal lost to competition',
      entryActions: ['sendNotification', 'updateField'],
      exitActions: ['createTask']
    },
  ];

  const actionTypes = [
    { 
      value: 'sendEmail', 
      label: 'Send Email', 
      icon: Mail, 
      color: 'bg-blue-100 text-blue-600',
      description: 'Send email notification to users',
      category: 'Communication',
      params: [
        { key: 'templateId', label: 'Email Template', type: 'select', placeholder: 'Select template', options: ['welcome', 'notification', 'reminder'] },
        { key: 'to', label: 'Recipients', type: 'multiselect', placeholder: 'Select recipients', options: ['record.owner', 'record.createdBy', 'specific.email@domain.com'] },
        { key: 'subject', label: 'Subject', type: 'text', placeholder: 'Email subject' },
        { key: 'includeRecordLink', label: 'Include Record Link', type: 'checkbox', default: true },
      ]
    },
    { 
      value: 'createTask', 
      label: 'Create Task', 
      icon: Calendar, 
      color: 'bg-green-100 text-green-600',
      description: 'Create follow-up task',
      category: 'Tasks',
      params: [
        { key: 'title', label: 'Task Title', type: 'text', placeholder: 'e.g., Follow up on opportunity' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Task details...' },
        { key: 'assignTo', label: 'Assign To', type: 'select', placeholder: 'Select user/role', options: ['record.owner', 'stage.manager', 'specific.user'] },
        { key: 'dueDate', label: 'Due Date', type: 'select', placeholder: 'Set due date', options: ['1.day.after', '3.days.after', '1.week.after'] },
      ]
    },
    { 
      value: 'sendNotification', 
      label: 'Send Notification', 
      icon: Bell, 
      color: 'bg-purple-100 text-purple-600',
      description: 'Send in-app notification',
      category: 'Communication',
      params: [
        { key: 'message', label: 'Message', type: 'text', placeholder: 'Notification message' },
        { key: 'type', label: 'Type', type: 'select', placeholder: 'Select type', options: ['info', 'warning', 'success', 'error'] },
        { key: 'recipients', label: 'Recipients', type: 'multiselect', placeholder: 'Select recipients', options: ['record.team', 'department.head', 'all.admins'] },
      ]
    },
    { 
      value: 'updateField', 
      label: 'Update Field', 
      icon: Edit2, 
      color: 'bg-amber-100 text-amber-600',
      description: 'Update record field value',
      category: 'Data',
      params: [
        { key: 'field', label: 'Field Name', type: 'select', placeholder: 'Select field', options: ['status', 'priority', 'stage', 'owner'] },
        { key: 'value', label: 'New Value', type: 'text', placeholder: 'Enter new value' },
        { key: 'condition', label: 'Condition', type: 'textarea', placeholder: 'Optional condition (e.g., {{record.value}} > 1000)' },
      ]
    },
    { 
      value: 'assignRecord', 
      label: 'Assign Record', 
      icon: Users, 
      color: 'bg-indigo-100 text-indigo-600',
      description: 'Assign record to user or team',
      category: 'Assignment',
      params: [
        { key: 'assignTo', label: 'Assign To', type: 'select', placeholder: 'Select assignment', options: ['round.robin', 'by.load', 'specific.user', 'team.leader'] },
        { key: 'notifyAssignee', label: 'Notify Assignee', type: 'checkbox', default: true },
      ]
    },
    { 
      value: 'createRecord', 
      label: 'Create Record', 
      icon: FileText, 
      color: 'bg-cyan-100 text-cyan-600',
      description: 'Create related record',
      category: 'Data',
      params: [
        { key: 'module', label: 'Module', type: 'select', placeholder: 'Select module', options: ['tasks', 'notes', 'events', 'calls'] },
        { key: 'title', label: 'Record Title', type: 'text', placeholder: 'Title for new record' },
        { key: 'linkToParent', label: 'Link to Parent', type: 'checkbox', default: true },
      ]
    },
    { 
      value: 'webhook', 
      label: 'Webhook', 
      icon: Globe, 
      color: 'bg-rose-100 text-rose-600',
      description: 'Trigger external webhook',
      category: 'Integration',
      params: [
        { key: 'url', label: 'Webhook URL', type: 'text', placeholder: 'https://api.example.com/webhook' },
        { key: 'method', label: 'HTTP Method', type: 'select', placeholder: 'POST', options: ['POST', 'PUT', 'GET'] },
        { key: 'payload', label: 'Payload', type: 'textarea', placeholder: 'JSON payload template' },
      ]
    },
  ];

  // Step configuration
  const steps = [
    { id: 'basic', title: 'Basic Info', description: 'Set blueprint properties' },
    { id: 'stages', title: 'Stages', description: 'Add and configure stages' },
    { id: 'design', title: 'Design', description: 'Design workflow layout' },
    { id: 'preview', title: 'Preview', description: 'Review and save' },
  ];

  // Load modules and roles on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const modulesData = await blueprintsService.getAvailableModules();
        setAvailableModules(modulesData);
        
        const rolesData = await blueprintsService.getAvailableRoles();
        setAvailableRoles(rolesData);
        
        if (modulesData.length > 0 && !formData.module) {
          setFormData(prev => ({ ...prev, module: modulesData[0] }));
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setAvailableModules(modules.map(m => m.id));
        setAvailableRoles(roleCategories.flatMap(cat => cat.roles.map(r => r.id)));
      }
    };
    
    loadData();
  }, []);

  // Navigation functions
  const goToNextStep = () => {
    const stepOrder = steps.map(s => s.id);
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1] as StepType);
    }
  };

  const goToPreviousStep = () => {
    const stepOrder = steps.map(s => s.id);
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1] as StepType);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addStage = useCallback(() => {
    const colorIndex = formData.stages.length % stageColors.length;
    const iconIndex = formData.stages.length % stageIcons.length;
    const newStage: StageForm = {
      name: `Stage ${formData.stages.length + 1}`,
      order: formData.stages.length + 1,
      allowedRoles: [],
      entryActions: [],
      exitActions: [],
      isExpanded: true,
      color: stageColors[colorIndex].id,
      icon: stageIcons[iconIndex].value,
      description: '',
    };
    setFormData(prev => ({
      ...prev,
      stages: [...prev.stages, newStage]
    }));
    setSelectedStage(formData.stages.length);
  }, [formData.stages.length]);

  const duplicateStage = (index: number) => {
    const stageToDuplicate = formData.stages[index];
    const colorIndex = formData.stages.length % stageColors.length;
    const newStage: StageForm = {
      ...stageToDuplicate,
      name: `${stageToDuplicate.name} (Copy)`,
      order: formData.stages.length + 1,
      isExpanded: true,
      color: stageColors[colorIndex].id,
    };
    
    const newStages = [...formData.stages];
    newStages.splice(index + 1, 0, newStage);
    
    // Reorder all stages
    const reorderedStages = newStages.map((stage, i) => ({
      ...stage,
      order: i + 1,
    }));
    
    setFormData(prev => ({ ...prev, stages: reorderedStages }));
    setSelectedStage(index + 1);
    showToast('Stage duplicated successfully', 'success');
  };

  const updateStage = (index: number, field: keyof StageForm, value: any) => {
    const newStages = [...formData.stages];
    if (field === 'allowedRoles') {
      const currentRoles = newStages[index].allowedRoles;
      if (currentRoles.includes(value)) {
        newStages[index].allowedRoles = currentRoles.filter(role => role !== value);
      } else {
        newStages[index].allowedRoles = [...currentRoles, value];
      }
    } else {
      newStages[index] = { ...newStages[index], [field]: value };
    }
    setFormData(prev => ({ ...prev, stages: newStages }));
  };

  const toggleStageExpanded = (index: number) => {
    const newStages = [...formData.stages];
    newStages[index].isExpanded = !newStages[index].isExpanded;
    setFormData(prev => ({ ...prev, stages: newStages }));
  };

  const removeStage = (index: number) => {
    const newStages = formData.stages.filter((_, i) => i !== index);
    const reorderedStages = newStages.map((stage, i) => ({
      ...stage,
      order: i + 1,
    }));
    setFormData(prev => ({ ...prev, stages: reorderedStages }));
    if (selectedStage === index) setSelectedStage(null);
    showToast('Stage removed', 'info');
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(formData.stages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index + 1,
    }));
    
    setFormData(prev => ({ ...prev, stages: updatedItems }));
    if (selectedStage === result.source.index) {
      setSelectedStage(result.destination.index);
    }
  };

  const addAction = (stageIndex: number, type: 'entryActions' | 'exitActions', actionType?: string) => {
    const newStages = [...formData.stages];
    const selectedType = actionType || actionTypes[0].value;
    const selectedAction = actionTypes.find(a => a.value === selectedType);
    
    if (!selectedAction) return;
    
    const newAction: ActionForm = { 
      actionType: selectedType,
      params: selectedAction.params.reduce((acc, param) => ({
        ...acc,
        [param.key]: param.type === 'checkbox' ? (param.default || false) : ''
      }), {}) || {},
      name: `${selectedAction.label} Action`,
      enabled: true,
    };
    
    newStages[stageIndex][type] = [
      ...newStages[stageIndex][type],
      newAction
    ];
    setFormData(prev => ({ ...prev, stages: newStages }));
    showToast(`${selectedAction.label} action added`, 'success');
  };

  // Fix: Update the type for value parameter
  const updateAction = (
    stageIndex: number, 
    actionType: 'entryActions' | 'exitActions', 
    actionIndex: number, 
    field: string, 
    value: any
  ) => {
    const newStages = [...formData.stages];
    
    if (field === 'actionType') {
      const selectedAction = actionTypes.find(a => a.value === value);
      newStages[stageIndex][actionType][actionIndex] = { 
        actionType: value as string,
        params: selectedAction?.params.reduce((acc, param) => ({
          ...acc,
          [param.key]: param.type === 'checkbox' ? (param.default || false) : ''
        }), {}) || {},
        name: newStages[stageIndex][actionType][actionIndex].name || `${selectedAction?.label} Action`,
        enabled: newStages[stageIndex][actionType][actionIndex].enabled !== false,
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
    } else {
      newStages[stageIndex][actionType][actionIndex] = {
        ...newStages[stageIndex][actionType][actionIndex],
        [field]: value
      };
    }
    
    setFormData(prev => ({ ...prev, stages: newStages }));
  };

  const removeAction = (stageIndex: number, actionType: 'entryActions' | 'exitActions', actionIndex: number) => {
    const newStages = [...formData.stages];
    newStages[stageIndex][actionType] = newStages[stageIndex][actionType].filter((_, i) => i !== actionIndex);
    setFormData(prev => ({ ...prev, stages: newStages }));
    showToast('Action removed', 'info');
  };

  const toggleActionEnabled = (stageIndex: number, actionType: 'entryActions' | 'exitActions', actionIndex: number) => {
    const newStages = [...formData.stages];
    newStages[stageIndex][actionType][actionIndex] = {
      ...newStages[stageIndex][actionType][actionIndex],
      enabled: !newStages[stageIndex][actionType][actionIndex].enabled
    };
    setFormData(prev => ({ ...prev, stages: newStages }));
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!formData.name.trim()) {
      errors.push('Blueprint name is required');
    }
    
    if (!formData.module) {
      errors.push('Module is required');
    }
    
    if (formData.stages.length === 0) {
      errors.push('At least one stage is required');
    }
    
    for (const [index, stage] of formData.stages.entries()) {
      if (!stage.name.trim()) {
        errors.push(`Stage ${index + 1} must have a name`);
      }
      
      if (stage.allowedRoles.length === 0) {
        errors.push(`Stage "${stage.name}" must have at least one allowed role`);
      }
    }
    
    if (errors.length > 0) {
      showToast(errors[0], 'error');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Transform data to match backend CreateBlueprintDto exactly
      const blueprintData = {
        name: formData.name,
        module: formData.module,
        description: formData.description,
        isActive: formData.isActive,
        stages: formData.stages.map(stage => ({
          name: stage.name,
          order: stage.order,
          allowedRoles: stage.allowedRoles,
          color: stage.color,
          icon: stage.icon,
          description: stage.description,
          entryActions: stage.entryActions.map(action => ({
            actionType: action.actionType,
            params: action.params,
            name: action.name,
            enabled: action.enabled
          })),
          exitActions: stage.exitActions.map(action => ({
            actionType: action.actionType,
            params: action.params,
            name: action.name,
            enabled: action.enabled
          })),
        })),
      };
      
      console.log('🔍 FINAL DATA TO SEND (MATCHING BACKEND DTO):', 
        JSON.stringify(blueprintData, null, 2));
      
      await blueprintsService.createBlueprint(blueprintData);
      showToast('Blueprint created successfully!', 'success');
      router.push('/settings/blueprints');
    } catch (error: any) {
      console.error('❌ Error creating blueprint:', error);
      
      // Show more specific error messages
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.message) {
          showToast(`Backend error: ${errorData.message}`, 'error');
        } else if (errorData.error) {
          showToast(`Backend error: ${errorData.error}`, 'error');
        } else {
          showToast('Failed to create blueprint', 'error');
        }
      } else {
        showToast(error.message || 'Failed to create blueprint', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      router.push('/settings/blueprints');
    }
  };

  const getActionConfig = (actionType: string) => {
    return actionTypes.find(a => a.value === actionType) || actionTypes[0];
  };

  const getStageColor = (index: number) => {
    const colorId = formData.stages[index]?.color || stageColors[index % stageColors.length].id;
    return stageColors.find(c => c.id === colorId) || stageColors[0];
  };

  const getStageIcon = (stage: StageForm) => {
    const iconValue = stage.icon || stageIcons[0].value;
    return stageIcons.find(i => i.value === iconValue) || stageIcons[0];
  };

  const handleTestBlueprint = () => {
    showToast('Testing blueprint functionality...', 'info');
    // Implement test logic here
  };

  const handleExportBlueprint = () => {
    const exportData = {
      ...formData,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `blueprint-${formData.name || 'template'}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showToast('Blueprint exported successfully', 'success');
  };

  const loadTemplate = (templateId: string) => {
    const template = blueprintTemplates.find(t => t.id === templateId);
    if (!template) return;

    // Set basic info
    setFormData(prev => ({
      ...prev,
      name: template.name,
      description: template.description,
    }));

    // Load template-specific stages
    if (templateId === 'sales_pipeline') {
      const salesStages: StageForm[] = [
        {
          name: 'Lead',
          order: 1,
          allowedRoles: ['sales_rep', 'sales_manager'],
          entryActions: [],
          exitActions: [],
          color: 'blue',
          icon: 'target',
          description: 'Initial lead qualification',
          isExpanded: true,
        },
        {
          name: 'Qualified',
          order: 2,
          allowedRoles: ['sales_rep', 'account_exec', 'sales_manager'],
          entryActions: [],
          exitActions: [],
          color: 'green',
          icon: 'check-circle',
          description: 'Lead qualified and ready for contact',
          isExpanded: true,
        },
        {
          name: 'Proposal',
          order: 3,
          allowedRoles: ['account_exec', 'sales_manager'],
          entryActions: [],
          exitActions: [],
          color: 'purple',
          icon: 'clipboard',
          description: 'Proposal sent to client',
          isExpanded: true,
        },
        {
          name: 'Negotiation',
          order: 4,
          allowedRoles: ['account_exec', 'sales_manager', 'manager'],
          entryActions: [],
          exitActions: [],
          color: 'amber',
          icon: 'message',
          description: 'Contract negotiation phase',
          isExpanded: true,
        },
        {
          name: 'Closed Won',
          order: 5,
          allowedRoles: ['account_exec', 'sales_manager', 'admin'],
          entryActions: [],
          exitActions: [],
          color: 'emerald',
          icon: 'trophy',
          description: 'Deal successfully closed',
          isExpanded: true,
        },
      ];
      setFormData(prev => ({ ...prev, stages: salesStages }));
    }

    showToast(`"${template.name}" template loaded`, 'success');
    setCurrentStep('stages');
  };

  // Step 1: Basic Info
  const renderStepBasic = () => (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Basic Information</h2>
          <p className="text-gray-600">Set up the basic properties of your blueprint</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Blueprint Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              placeholder="e.g., Sales Pipeline"
              disabled={loading}
            />
            <p className="mt-1 text-sm text-gray-500">Give your blueprint a descriptive name</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Module *
            </label>
            <div className="relative">
              <select
                value={formData.module}
                onChange={(e) => handleInputChange('module', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pr-10"
                disabled={loading}
              >
                <option value="">Select a module</option>
                {modules.map(module => (
                  <option key={module.id} value={module.id}>
                    {module.icon} {module.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-5 w-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="mt-1 text-sm text-gray-500">Select which module this blueprint will apply to</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start from Template (Optional)
            </label>
            <div className="relative">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    loadTemplate(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pr-10"
                disabled={loading}
              >
                <option value="">Select a template to start from</option>
                {blueprintTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.icon} {template.name} - {template.description}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-5 w-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="mt-1 text-sm text-gray-500">Choose a pre-built template to speed up setup</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe what this blueprint does..."
              disabled={loading}
            />
            <p className="mt-1 text-sm text-gray-500">Optional description to help others understand this blueprint</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Blueprint Status</h4>
                <p className="text-xs text-gray-500">Activate to make it available</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="sr-only peer"
                  disabled={loading}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 2: Stages
  const renderStepStages = () => (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Configure Stages</h2>
              <p className="text-gray-600">Define the stages of your workflow</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      const template = stageTemplates.find(t => t.id === e.target.value);
                      if (template) {
                        const color = stageColors.find(c => c.id === template.color) || stageColors[0];
                        const icon = stageIcons.find(i => i.value === template.icon) || stageIcons[0];
                        const newStage: StageForm = {
                          name: template.name,
                          order: formData.stages.length + 1,
                          allowedRoles: ['admin', 'manager'],
                          entryActions: template.entryActions.map(action => ({
                            actionType: action,
                            params: {},
                            enabled: true
                          })),
                          exitActions: template.exitActions.map(action => ({
                            actionType: action,
                            params: {},
                            enabled: true
                          })),
                          color: template.color,
                          icon: template.icon,
                          description: template.description,
                          isExpanded: true,
                        };
                        setFormData(prev => ({
                          ...prev,
                          stages: [...prev.stages, newStage]
                        }));
                        setSelectedStage(formData.stages.length);
                        showToast(`Added "${template.name}" stage`, 'success');
                      }
                      e.target.value = '';
                    }
                  }}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pr-10"
                  disabled={loading}
                >
                  <option value="">+ Quick Add Stage</option>
                  {stageTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} - {template.description}
                    </option>
                  ))}
                </select>
                <ChevronDown className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              </div>
              <button
                onClick={addStage}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Add Custom Stage
              </button>
            </div>
          </div>
        </div>

        {formData.stages.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-2xl">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Workflow className="h-8 w-8 text-gray-400" />
            </div>
            <h4 className="text-xl font-medium text-gray-900 mb-2">No stages yet</h4>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start by adding stages to create your workflow. Each stage represents a step in your process.
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="relative">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      loadTemplate(e.target.value);
                    }
                  }}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pr-10"
                  disabled={loading}
                >
                  <option value="">Load Template</option>
                  {blueprintTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.icon} {template.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              </div>
              <button
                onClick={addStage}
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Add First Stage
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {formData.stages.map((stage, index) => {
              const color = getStageColor(index);
              const icon = getStageIcon(stage);
              return (
                <div
                  key={index}
                  className={`${color.bg} ${color.border} border-2 rounded-xl p-6 transition-all ${
                    selectedStage === index ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                  }`}
                  onClick={() => setSelectedStage(index)}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-start gap-4">
                      <div className={`h-12 w-12 rounded-full ${color.darkBg} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-2xl">{icon.icon}</span>
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={stage.name}
                          onChange={(e) => updateStage(index, 'name', e.target.value)}
                          className="text-xl font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 px-0 py-1 w-full"
                          placeholder="Stage name"
                          disabled={loading}
                        />
                        <textarea
                          value={stage.description || ''}
                          onChange={(e) => updateStage(index, 'description', e.target.value)}
                          rows={1}
                          className="mt-2 text-sm text-gray-600 bg-transparent border-none focus:outline-none focus:ring-0 px-0 py-1 w-full resize-none"
                          placeholder="Stage description (optional)"
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateStage(index);
                        }}
                        className="p-2 hover:bg-white/50 rounded-lg text-gray-600 hover:text-gray-900"
                        title="Duplicate stage"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeStage(index);
                        }}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-600 hover:text-red-700"
                        title="Delete stage"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Stage Configuration */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-700">Stage Configuration</h4>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Color Theme
                        </label>
                        <div className="relative">
                          <select
                            value={stage.color || 'blue'}
                            onChange={(e) => updateStage(index, 'color', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pr-10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {stageColors.map(color => (
                              <option key={color.id} value={color.id}>
                                {color.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Icon
                        </label>
                        <div className="relative">
                          <select
                            value={stage.icon || 'clipboard'}
                            onChange={(e) => updateStage(index, 'icon', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pr-10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {stageIcons.map(icon => (
                              <option key={icon.value} value={icon.value}>
                                {icon.icon} {icon.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Allowed Roles */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Allowed Roles</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {roleCategories.map(category => (
                          <div key={category.category} className="border border-gray-200 rounded-lg p-3">
                            <h5 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                              {category.category}
                            </h5>
                            <div className="space-y-2">
                              {category.roles.map(role => (
                                <label
                                  key={role.id}
                                  className="flex items-center justify-between p-2 hover:bg-white/50 rounded-lg cursor-pointer group"
                                >
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="checkbox"
                                      checked={stage.allowedRoles.includes(role.id)}
                                      onChange={() => updateStage(index, 'allowedRoles', role.id)}
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">{role.name}</div>
                                      <div className="text-xs text-gray-500">{role.description}</div>
                                    </div>
                                  </div>
                                  <Shield className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-700">Entry Actions</h4>
                          <div className="relative">
                            <select
                              onChange={(e) => {
                                e.stopPropagation();
                                if (e.target.value) {
                                  addAction(index, 'entryActions', e.target.value);
                                  e.target.value = '';
                                }
                              }}
                              className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 appearance-none pr-6 cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="">+ Add Action</option>
                              {actionTypes.map(type => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="h-3 w-3 absolute right-1 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>
                        {stage.entryActions.length > 0 ? (
                          <div className="space-y-2">
                            {stage.entryActions.map((action, i) => {
                              const config = getActionConfig(action.actionType);
                              const Icon = config.icon;
                              return (
                                <div key={i} className="bg-white rounded-lg p-3 border border-gray-200">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <div className={`p-1.5 rounded ${config.color}`}>
                                        <Icon className="h-3 w-3" />
                                      </div>
                                      <div>
                                        <div className="text-sm font-medium">{config.label}</div>
                                        <div className="text-xs text-gray-500">{config.category}</div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={action.enabled !== false}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            toggleActionEnabled(index, 'entryActions', i);
                                          }}
                                          className="sr-only peer"
                                        />
                                        <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                                      </label>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeAction(index, 'entryActions', i);
                                        }}
                                        className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-red-600"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {/* Action Parameters */}
                                  <div className="space-y-2">
                                    {config.params.map(param => (
                                      <div key={param.key}>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                          {param.label}
                                        </label>
                                        {param.type === 'select' ? (
                                          <div className="relative">
                                            <select
                                              value={String(action.params[param.key] || '')}
                                              onChange={(e) => updateAction(index, 'entryActions', i, `params.${param.key}`, e.target.value)}
                                              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent appearance-none pr-6"
                                              disabled={loading}
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <option value="">Select {param.label.toLowerCase()}</option>
                                              {param.options?.map(option => (
                                                <option key={option} value={option}>{option}</option>
                                              ))}
                                            </select>
                                            <ChevronDown className="h-3 w-3 text-gray-400 absolute right-1 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                                          </div>
                                        ) : param.type === 'checkbox' ? (
                                          <label className="flex items-center gap-2">
                                            <input
                                              type="checkbox"
                                              checked={Boolean(action.params[param.key])}
                                              onChange={(e) => updateAction(index, 'entryActions', i, `params.${param.key}`, e.target.checked)}
                                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                            <span className="text-xs text-gray-700">{param.placeholder}</span>
                                          </label>
                                        ) : param.type === 'textarea' ? (
                                          <textarea
                                            value={String(action.params[param.key] || '')}
                                            onChange={(e) => updateAction(index, 'entryActions', i, `params.${param.key}`, e.target.value)}
                                            rows={2}
                                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                            placeholder={param.placeholder}
                                            disabled={loading}
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                        ) : (
                                          <input
                                            type={param.type}
                                            value={String(action.params[param.key] || '')}
                                            onChange={(e) => updateAction(index, 'entryActions', i, `params.${param.key}`, e.target.value)}
                                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                            placeholder={param.placeholder}
                                            disabled={loading}
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-4 border-2 border-dashed border-gray-200 rounded-lg">
                            <p className="text-sm text-gray-400">No entry actions configured</p>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-700">Exit Actions</h4>
                          <div className="relative">
                            <select
                              onChange={(e) => {
                                e.stopPropagation();
                                if (e.target.value) {
                                  addAction(index, 'exitActions', e.target.value);
                                  e.target.value = '';
                                }
                              }}
                              className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 appearance-none pr-6 cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="">+ Add Action</option>
                              {actionTypes.map(type => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="h-3 w-3 absolute right-1 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>
                        {stage.exitActions.length > 0 ? (
                          <div className="space-y-2">
                            {stage.exitActions.map((action, i) => {
                              const config = getActionConfig(action.actionType);
                              const Icon = config.icon;
                              return (
                                <div key={i} className="bg-white rounded-lg p-3 border border-gray-200">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <div className={`p-1.5 rounded ${config.color}`}>
                                        <Icon className="h-3 w-3" />
                                      </div>
                                      <div>
                                        <div className="text-sm font-medium">{config.label}</div>
                                        <div className="text-xs text-gray-500">{config.category}</div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={action.enabled !== false}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            toggleActionEnabled(index, 'exitActions', i);
                                          }}
                                          className="sr-only peer"
                                        />
                                        <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                                      </label>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeAction(index, 'exitActions', i);
                                        }}
                                        className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-red-600"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {/* Action Parameters */}
                                  <div className="space-y-2">
                                    {config.params.map(param => (
                                      <div key={param.key}>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                          {param.label}
                                        </label>
                                        {param.type === 'select' ? (
                                          <div className="relative">
                                            <select
                                              value={String(action.params[param.key] || '')}
                                              onChange={(e) => updateAction(index, 'exitActions', i, `params.${param.key}`, e.target.value)}
                                              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent appearance-none pr-6"
                                              disabled={loading}
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <option value="">Select {param.label.toLowerCase()}</option>
                                              {param.options?.map(option => (
                                                <option key={option} value={option}>{option}</option>
                                              ))}
                                            </select>
                                            <ChevronDown className="h-3 w-3 text-gray-400 absolute right-1 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                                          </div>
                                        ) : param.type === 'checkbox' ? (
                                          <label className="flex items-center gap-2">
                                            <input
                                              type="checkbox"
                                              checked={Boolean(action.params[param.key])}
                                              onChange={(e) => updateAction(index, 'exitActions', i, `params.${param.key}`, e.target.checked)}
                                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                            <span className="text-xs text-gray-700">{param.placeholder}</span>
                                          </label>
                                        ) : param.type === 'textarea' ? (
                                          <textarea
                                            value={String(action.params[param.key] || '')}
                                            onChange={(e) => updateAction(index, 'exitActions', i, `params.${param.key}`, e.target.value)}
                                            rows={2}
                                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                            placeholder={param.placeholder}
                                            disabled={loading}
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                        ) : (
                                          <input
                                            type={param.type}
                                            value={String(action.params[param.key] || '')}
                                            onChange={(e) => updateAction(index, 'exitActions', i, `params.${param.key}`, e.target.value)}
                                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                            placeholder={param.placeholder}
                                            disabled={loading}
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-4 border-2 border-dashed border-gray-200 rounded-lg">
                            <p className="text-sm text-gray-400">No exit actions configured</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // Step 3: Design (Full Visualization)
  const renderStepDesign = () => (
    <div className="w-full h-full overflow-auto">
      <div className="min-w-max p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Workflow Design</h2>
          <p className="text-gray-600">Visualize and arrange your workflow stages</p>
        </div>

        {formData.stages.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-2xl">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Workflow className="h-8 w-8 text-gray-400" />
            </div>
            <h4 className="text-xl font-medium text-gray-900 mb-2">No stages to design</h4>
            <p className="text-gray-600 mb-6">Go back to the previous step to add stages</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex flex-col items-center">
              {/* Connection lines */}
              {formData.stages.slice(0, -1).map((_, index) => (
                <div
                  key={index}
                  className="absolute left-1/2 transform -translate-x-1/2"
                  style={{ top: `${index * 240 + 180}px`, width: '2px', height: '60px' }}
                >
                  <div className="h-full w-0.5 bg-gray-300 mx-auto"></div>
                  <ArrowUpDown className="h-5 w-5 text-gray-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
              ))}

              {/* Stages */}
              <Droppable droppableId="stages-vertical" direction="vertical">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-6"
                  >
                    {formData.stages.map((stage, index) => {
                      const color = getStageColor(index);
                      const icon = getStageIcon(stage);
                      return (
                        <Draggable
                          key={index}
                          draggableId={`stage-${index}`}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`${color.bg} ${color.border} border-2 rounded-xl shadow-sm transition-all hover:shadow-md w-96 ${
                                selectedStage === index ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                              }`}
                              onClick={() => setSelectedStage(index)}
                            >
                              {/* Drag handle */}
                              <div {...provided.dragHandleProps} className="absolute -left-10 top-1/2 transform -translate-y-1/2">
                                <GripVertical className="h-5 w-5 text-gray-400 hover:text-gray-600 cursor-move" />
                              </div>

                              <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className={`h-10 w-10 rounded-full ${color.darkBg} flex items-center justify-center`}>
                                      <span className="text-xl">{icon.icon}</span>
                                    </div>
                                    <div>
                                      <h3 className="text-lg font-semibold text-gray-900">{stage.name}</h3>
                                      <p className="text-sm text-gray-600">{stage.description || 'No description'}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs text-gray-500">
                                      {stage.allowedRoles.length} role{stage.allowedRoles.length !== 1 ? 's' : ''}
                                    </div>
                                  </div>
                                </div>

                                {/* Actions Summary */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="text-xs font-medium text-gray-700 mb-2">Entry Actions</h4>
                                    <div className="space-y-1">
                                      {stage.entryActions.slice(0, 3).map((action, i) => {
                                        const config = getActionConfig(action.actionType);
                                        return (
                                          <div key={i} className="flex items-center gap-2 text-xs bg-white/50 p-2 rounded">
                                            <div className={`p-1 rounded ${config.color}`}>
                                              <config.icon className="h-3 w-3" />
                                            </div>
                                            <span className="truncate">{config.label}</span>
                                            {!action.enabled && (
                                              <span className="text-gray-400">(off)</span>
                                            )}
                                          </div>
                                        );
                                      })}
                                      {stage.entryActions.length > 3 && (
                                        <div className="text-xs text-gray-500 text-center">
                                          +{stage.entryActions.length - 3} more
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="text-xs font-medium text-gray-700 mb-2">Exit Actions</h4>
                                    <div className="space-y-1">
                                      {stage.exitActions.slice(0, 3).map((action, i) => {
                                        const config = getActionConfig(action.actionType);
                                        return (
                                          <div key={i} className="flex items-center gap-2 text-xs bg-white/50 p-2 rounded">
                                            <div className={`p-1 rounded ${config.color}`}>
                                              <config.icon className="h-3 w-3" />
                                            </div>
                                            <span className="truncate">{config.label}</span>
                                            {!action.enabled && (
                                              <span className="text-gray-400">(off)</span>
                                            )}
                                          </div>
                                        );
                                      })}
                                      {stage.exitActions.length > 3 && (
                                        <div className="text-xs text-gray-500 text-center">
                                          +{stage.exitActions.length - 3} more
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </DragDropContext>
        )}
      </div>
    </div>
  );

  // Step 4: Preview
  const renderStepPreview = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Preview Blueprint</h2>
          <p className="text-gray-600">Review your blueprint before saving</p>
        </div>

        {/* Blueprint Summary */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Blueprint Details</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Name:</span>
                  <p className="font-medium">{formData.name || 'Untitled'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Module:</span>
                  <p className="font-medium">
                    {modules.find(m => m.id === formData.module)?.name || 'Not selected'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    formData.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {formData.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Description:</span>
                  <p className="font-medium">{formData.description || 'No description'}</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Stages:</span>
                  <span className="font-medium">{formData.stages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Actions:</span>
                  <span className="font-medium">
                    {formData.stages.reduce((acc, stage) => 
                      acc + stage.entryActions.length + stage.exitActions.length, 0
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Enabled Actions:</span>
                  <span className="font-medium">
                    {formData.stages.reduce((acc, stage) => 
                      acc + 
                      stage.entryActions.filter(a => a.enabled !== false).length + 
                      stage.exitActions.filter(a => a.enabled !== false).length, 0
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stages Preview */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Workflow Stages</h3>
          {formData.stages.map((stage, index) => {
            const color = getStageColor(index);
            const icon = getStageIcon(stage);
            return (
              <div key={index} className={`${color.bg} ${color.border} border-2 rounded-xl p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full ${color.darkBg} flex items-center justify-center`}>
                      <span className="text-xl">{icon.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{stage.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Users className="h-3 w-3 text-gray-500" />
                        <span className="text-xs text-gray-600">
                          {stage.allowedRoles.length} role{stage.allowedRoles.length !== 1 ? 's' : ''} allowed
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Stage {stage.order}</div>
                    <div className="text-xs text-gray-400">{stage.description}</div>
                  </div>
                </div>

                {/* Actions Preview */}
                <div className="grid grid-cols-2 gap-4">
                  {stage.entryActions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">When entering stage:</h4>
                      <div className="space-y-2">
                        {stage.entryActions.map((action, i) => {
                          const config = getActionConfig(action.actionType);
                          return (
                            <div key={i} className="bg-white rounded-lg p-3 border border-gray-200">
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`p-1 rounded ${config.color}`}>
                                  <config.icon className="h-3 w-3" />
                                </div>
                                <span className="text-sm font-medium">{config.label}</span>
                                {!action.enabled && (
                                  <span className="text-xs text-gray-400 ml-1">(disabled)</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600">{config.description}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {stage.exitActions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">When leaving stage:</h4>
                      <div className="space-y-2">
                        {stage.exitActions.map((action, i) => {
                          const config = getActionConfig(action.actionType);
                          return (
                            <div key={i} className="bg-white rounded-lg p-3 border border-gray-200">
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`p-1 rounded ${config.color}`}>
                                  <config.icon className="h-3 w-3" />
                                </div>
                                <span className="text-sm font-medium">{config.label}</span>
                                {!action.enabled && (
                                  <span className="text-xs text-gray-400 ml-1">(disabled)</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600">{config.description}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Current step content
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'basic':
        return renderStepBasic();
      case 'stages':
        return renderStepStages();
      case 'design':
        return renderStepDesign();
      case 'preview':
        return renderStepPreview();
      default:
        return renderStepBasic();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={loading}
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Create Blueprint</h1>
                <p className="text-sm text-gray-600">Step-by-step workflow creation</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportBlueprint}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
              <button
                onClick={handleTestBlueprint}
                disabled={loading || currentStep !== 'preview'}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="h-4 w-4" />
                Test
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || currentStep !== 'preview'}
                className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Blueprint
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Step Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 w-full">
              {steps.map((step, index) => {
                const isCompleted = steps.findIndex(s => s.id === currentStep) >= index;
                const isCurrent = step.id === currentStep;
                
                return (
                  <div key={step.id} className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                      } ${isCurrent ? 'ring-2 ring-blue-300 ring-offset-2' : ''}`}>
                        {isCompleted && !isCurrent ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <span className="text-sm font-medium">{index + 1}</span>
                        )}
                      </div>
                      <div className={`${isCurrent ? 'text-blue-600' : isCompleted ? 'text-gray-900' : 'text-gray-600'}`}>
                        <div className="text-sm font-medium">{step.title}</div>
                        <div className="text-xs">{step.description}</div>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`h-0.5 w-12 ${
                        steps.findIndex(s => s.id === currentStep) > index
                          ? 'bg-blue-600'
                          : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-8">
        {renderCurrentStep()}
      </div>

      {/* Step Navigation Footer */}
      <div className="bg-white border-t border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              {currentStep !== 'basic' && (
                <button
                  onClick={goToPreviousStep}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  Back
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                Step {steps.findIndex(s => s.id === currentStep) + 1} of {steps.length}
              </span>
              {currentStep !== 'preview' ? (
                <button
                  onClick={goToNextStep}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  Complete & Save
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}