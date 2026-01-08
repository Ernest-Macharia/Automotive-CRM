'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Plus, Trash2, Save, X, ChevronDown, 
  ChevronRight, Loader2, GripVertical, MoveVertical,
  Eye, Settings, AlertCircle, Check, Workflow,
  Copy, Download, Upload, Search, Filter,
  Clock, Users, Mail, Calendar, Bell, Zap,
  Shield, Globe, Type, Hash, ToggleRight,
  ChevronLeft, FileText, BarChart, PieChart,
  Maximize2, Minimize2, HelpCircle, Grid,
  List, Lock, Unlock, Share2, Play,
  Pause, Edit2, ArrowRight, ArrowUpDown,
  Target, TrendingUp, Star, Tag, Folder,
  Upload as UploadIcon, Layers, AlertTriangle,
  Key, UserCheck, UserX, Database, Server,
  Cpu, Network, Terminal, Code, Wrench,
  RefreshCw, Package, Box, Layout, GitBranch,
  GitMerge, GitPullRequest, GitCommit, GitCompare,
  CornerDownRight, CornerDownLeft, SplitSquareVertical,
  SplitSquareHorizontal, Link2, Unlink, Wind,
  Archive, ShieldCheck, ShieldX, MessageSquare,
  ArchiveIcon, BellRing, CalendarCheck, CalendarX,
  Flag,
  Sliders,
  StopCircle,
  Rocket,
  User,
  Minus,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { blueprintsService, Blueprint } from '@/services/settings/blueprintsService';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { ALL_MODULES, CRITERIA_TEMPLATES, FIELD_GROUPS } from '@/data/modulesData';

// Enhanced Types matching create page
interface FieldCondition {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'greater_than_equal' | 'less_than' | 'less_than_equal' | 'contains' | 'not_contains' | 'is_empty' | 'is_not_empty' | 'starts_with' | 'ends_with' | 'between' | 'not_between' | 'in' | 'not_in' | 'changed_to' | 'changed_from' | 'changed';
  value: any;
  value2?: any;
  logicalOperator?: 'AND' | 'OR';
}

interface ConditionGroup {
  id: string;
  type: 'AND' | 'OR';
  conditions: (FieldCondition | ConditionGroup)[];
}

interface EscalationRule {
  id: string;
  name: string;
  type: 'on' | 'before' | 'after';
  triggerField: string;
  triggerValue: any;
  unit: 'minutes' | 'hours' | 'days' | 'business_days';
  duration: number;
  actions: ActionForm[];
  notify: string[];
}

interface StateRule {
  id: string;
  state: 'draft' | 'active' | 'inactive' | 'archived' | 'pending_review' | 'approved' | 'rejected';
  conditions: ConditionGroup;
  actions: ActionForm[];
  enterActions: ActionForm[];
  exitActions: ActionForm[];
  default?: boolean;
}

interface PermissionRule {
  id: string;
  field: string;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  required?: boolean;
  visible?: boolean;
  editable?: boolean;
  roles: string[];
  conditions?: ConditionGroup;
}

interface ActionForm {
  id?: string;
  name?: string;
  actionType: string;
  params: Record<string, any>;
  enabled?: boolean;
  executionOrder?: number;
  conditions?: ConditionGroup;
  delay?: number;
  delayUnit?: 'minutes' | 'hours' | 'days';
  timing?: 'immediate' | 'delayed' | 'scheduled';
}

interface StageTransition {
  id?: string;
  name: string;
  fromStage: string;
  toStage: string;
  type: 'manual' | 'automatic' | 'parallel' | 'conditional';
  conditions?: ConditionGroup;
  automaticDelay?: number;
  automaticDelayUnit?: 'minutes' | 'hours' | 'days';
  allowedRoles: string[];
  actions: ActionForm[];
  description?: string;
}

interface StageForm {
  id?: string;
  name: string;
  description?: string;
  order: number;
  color: string;
  icon: string;
  allowedRoles: string[];
  requiredFields: string[];
  entryActions: ActionForm[];
  exitActions: ActionForm[];
  timeout?: number;
  timeoutUnit?: 'minutes' | 'hours' | 'days';
  timeoutActions: ActionForm[];
  escalationRules: EscalationRule[];
  isDefault?: boolean;
  canRevert?: boolean;
  canSkip?: boolean;
  requiresApproval?: boolean;
  approvalRoles: string[];
  approvalType: 'any' | 'all' | 'sequential';
  maxRecords?: number;
  criteria?: ConditionGroup;
  permissions: PermissionRule[];
  states: StateRule[];
  autoAssign?: {
    enabled: boolean;
    type: 'round_robin' | 'load_balance' | 'specific_user' | 'by_field';
    value: any;
  };
}

interface FieldDependency {
  id: string;
  field: string;
  dependsOn: {
    module: string;
    field: string;
    value: any;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'is_empty' | 'is_not_empty';
  };
  visible?: boolean;
  editable?: boolean;
  required?: boolean;
  defaultValue?: any;
  conditions?: ConditionGroup;
}

interface BlueprintFormData {
  name: string;
  module: string;
  moduleLabel?: string;
  layout?: string;
  description: string;
  isActive: boolean;
  isDefault: boolean;
  version: string;
  criteria?: ConditionGroup;
  stages: StageForm[];
  transitions: StageTransition[];
  availableFields: string[];
  globalEscalationRules: EscalationRule[];
  globalPermissions: PermissionRule[];
  states: StateRule[];
  fieldDependencies: FieldDependency[];
}

interface EditBlueprintPageProps {
  blueprintId: string;
}

export default function EditBlueprintPage({ blueprintId }: EditBlueprintPageProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [availableModules, setAvailableModules] = useState(ALL_MODULES);
  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [dragMode, setDragMode] = useState<'stages' | 'transitions'>('stages');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Initialize form data with all fields from create page
  const [formData, setFormData] = useState<BlueprintFormData>({
    name: '',
    module: '',
    moduleLabel: '',
    layout: 'default',
    description: '',
    isActive: true,
    isDefault: false,
    version: '1.0',
    criteria: undefined,
    stages: [],
    transitions: [],
    availableFields: [],
    globalEscalationRules: [],
    globalPermissions: [],
    states: [],
    fieldDependencies: [],
  });

  // Role options matching create page
  const roleOptions = [
    { id: 'admin', name: 'Administrator', description: 'Full system access' },
    { id: 'supervisor', name: 'Supervisor', description: 'Team management access' },
    { id: 'manager', name: 'Manager', description: 'Department management' },
    { id: 'sales_rep', name: 'Sales Representative', description: 'Sales team member' },
    { id: 'account_exec', name: 'Account Executive', description: 'Key account management' },
    { id: 'sales_manager', name: 'Sales Manager', description: 'Sales team leadership' },
    { id: 'technician', name: 'Technician', description: 'Field service operations' },
    { id: 'dispatcher', name: 'Dispatcher', description: 'Job scheduling and dispatch' },
    { id: 'operations_manager', name: 'Operations Manager', description: 'Operations oversight' },
    { id: 'support_agent', name: 'Support Agent', description: 'Customer support' },
    { id: 'customer_success', name: 'Customer Success', description: 'Customer relationship management' },
    { id: 'quality_assurance', name: 'Quality Assurance', description: 'Service quality monitoring' },
    { id: 'accountant', name: 'Accountant', description: 'Financial management' },
    { id: 'finance_manager', name: 'Finance Manager', description: 'Budget oversight' },
    { id: 'auditor', name: 'Auditor', description: 'Financial compliance' },
    { id: 'viewer', name: 'Viewer', description: 'Read-only access' },
    { id: 'editor', name: 'Editor', description: 'Edit access' },
    { id: 'approver', name: 'Approver', description: 'Approval permissions' },
  ];

  // Stage colors matching create page
  const stageColors = [
    { id: 'blue', name: 'Blue', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dark: 'bg-blue-600', light: 'bg-blue-100' },
    { id: 'green', name: 'Green', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', dark: 'bg-green-600', light: 'bg-green-100' },
    { id: 'red', name: 'Red', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dark: 'bg-red-600', light: 'bg-red-100' },
    { id: 'yellow', name: 'Yellow', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', dark: 'bg-yellow-600', light: 'bg-yellow-100' },
    { id: 'purple', name: 'Purple', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', dark: 'bg-purple-600', light: 'bg-purple-100' },
    { id: 'pink', name: 'Pink', bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', dark: 'bg-pink-600', light: 'bg-pink-100' },
    { id: 'indigo', name: 'Indigo', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', dark: 'bg-indigo-600', light: 'bg-indigo-100' },
    { id: 'gray', name: 'Gray', bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', dark: 'bg-gray-600', light: 'bg-gray-100' },
    { id: 'cyan', name: 'Cyan', bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', dark: 'bg-cyan-600', light: 'bg-cyan-100' },
    { id: 'orange', name: 'Orange', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', dark: 'bg-orange-600', light: 'bg-orange-100' },
  ];

  // Stage icons matching create page
  const stageIcons = [
    { value: 'target', icon: Target, label: 'Target' },
    { value: 'check-circle', icon: Check, label: 'Check Circle' },
    { value: 'flag', icon: Flag, label: 'Flag' },
    { value: 'star', icon: Star, label: 'Star' },
    { value: 'rocket', icon: Rocket, label: 'Rocket' },
    { value: 'clock', icon: Clock, label: 'Clock' },
    { value: 'calendar', icon: Calendar, label: 'Calendar' },
    { value: 'users', icon: Users, label: 'Users' },
    { value: 'user', icon: User, label: 'User' },
    { value: 'mail', icon: Mail, label: 'Mail' },
    { value: 'bell', icon: Bell, label: 'Bell' },
    { value: 'shield', icon: Shield, label: 'Shield' },
    { value: 'lock', icon: Lock, label: 'Lock' },
    { value: 'unlock', icon: Unlock, label: 'Unlock' },
    { value: 'key', icon: Key, label: 'Key' },
    { value: 'alert', icon: AlertCircle, label: 'Alert' },
    { value: 'zap', icon: Zap, label: 'Zap' },
    { value: 'trending-up', icon: TrendingUp, label: 'Trending Up' },
    { value: 'file-text', icon: FileText, label: 'File Text' },
  ];

  // Action types matching create page
  const actionTypes = [
    { 
      value: 'send_email', 
      label: 'Send Email', 
      icon: Mail,
      color: 'bg-blue-100 text-blue-600',
      description: 'Send email notification with templates',
      params: [
        { key: 'template', label: 'Email Template', type: 'select', options: ['welcome', 'notification', 'reminder', 'follow_up', 'approval', 'rejection', 'escalation'] },
        { key: 'recipients', label: 'Recipients', type: 'multiselect', options: ['owner', 'creator', 'team', 'customer', 'specific_users', 'roles'] },
        { key: 'subject', label: 'Subject', type: 'text' },
        { key: 'body', label: 'Body', type: 'textarea' },
      ]
    },
    { 
      value: 'create_task', 
      label: 'Create Task', 
      icon: Calendar,
      color: 'bg-green-100 text-green-600',
      description: 'Create a follow-up task',
      params: [
        { key: 'title', label: 'Task Title', type: 'text' },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'assignee', label: 'Assignee', type: 'select', options: ['owner', 'creator', 'specific_user', 'round_robin'] },
        { key: 'due_date', label: 'Due Date', type: 'select', options: ['today', 'tomorrow', 'next_week', 'custom', 'relative_to_field'] },
        { key: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high', 'urgent'] },
      ]
    },
    { 
      value: 'update_field', 
      label: 'Update Field', 
      icon: Edit2,
      color: 'bg-purple-100 text-purple-600',
      description: 'Update record field value',
      params: [
        { key: 'field', label: 'Field Name', type: 'select' },
        { key: 'value', label: 'New Value', type: 'text' },
        { key: 'condition', label: 'Condition', type: 'textarea' },
        { key: 'override_existing', label: 'Override Existing', type: 'checkbox' },
      ]
    },
    { 
      value: 'assign_record', 
      label: 'Assign Record', 
      icon: Users,
      color: 'bg-amber-100 text-amber-600',
      description: 'Assign record to user or team',
      params: [
        { key: 'assign_to', label: 'Assign To', type: 'select', options: ['round_robin', 'by_load', 'specific_user', 'team', 'owner', 'creator'] },
        { key: 'notify', label: 'Notify Assignee', type: 'checkbox' },
        { key: 'transfer_history', label: 'Transfer History', type: 'checkbox' },
      ]
    },
    { 
      value: 'notification', 
      label: 'Send Notification', 
      icon: Bell,
      color: 'bg-yellow-100 text-yellow-600',
      description: 'Send in-app notification',
      params: [
        { key: 'message', label: 'Notification Message', type: 'text' },
        { key: 'recipients', label: 'Recipients', type: 'multiselect' },
        { key: 'type', label: 'Notification Type', type: 'select', options: ['info', 'warning', 'success', 'error', 'urgent'] },
      ]
    },
  ];

  const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    if (blueprintId) {
      loadBlueprint();
    } else {
      showToast('Invalid blueprint ID', 'error');
      router.push('/settings/blueprints');
    }
  }, [blueprintId]);

  const loadBlueprint = async () => {
    try {
      setLoading(true);
      const data = await blueprintsService.getBlueprint(blueprintId);
      setBlueprint(data);
      
      // Find module info
      const moduleInfo = ALL_MODULES.find(m => m.id === data.module);
      
      // Transform backend data to match form structure
      const formData: BlueprintFormData = {
        name: data.name,
        module: data.module,
        moduleLabel: moduleInfo?.name || data.module,
        layout: 'default',
        description: data.description || '',
        isActive: data.isActive,
        isDefault: false,
        version: '1.0',
        criteria: undefined,
        stages: data.stages.map((stage, index) => ({
          id: stage.id,
          name: stage.name,
          description: '',
          order: stage.order,
          color: stageColors[index % stageColors.length].id,
          icon: stageIcons[index % stageIcons.length].value,
          allowedRoles: stage.allowedRoles,
          requiredFields: [],
          entryActions: stage.entryActions || [],
          exitActions: stage.exitActions || [],
          timeoutActions: [],
          escalationRules: [],
          isDefault: index === 0,
          canRevert: true,
          canSkip: false,
          requiresApproval: false,
          approvalRoles: [],
          approvalType: 'any',
          permissions: [],
          states: [],
        })),
        transitions: [],
        availableFields: [],
        globalEscalationRules: [],
        globalPermissions: [],
        states: [],
        fieldDependencies: [],
      };
      
      setFormData(formData);
    } catch (error) {
      console.error('Error loading blueprint:', error);
      showToast('Failed to load blueprint', 'error');
      router.push('/settings/blueprints');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateStage = (index: number, field: keyof StageForm, value: any) => {
    const newStages = [...formData.stages];
    if (field === 'allowedRoles' || field === 'approvalRoles') {
      const currentRoles = newStages[index][field] as string[];
      if (currentRoles.includes(value)) {
        newStages[index][field] = currentRoles.filter(role => role !== value) as any;
      } else {
        newStages[index][field] = [...currentRoles, value] as any;
      }
    } else {
      newStages[index] = { ...newStages[index], [field]: value };
    }
    setFormData(prev => ({ ...prev, stages: newStages }));
  };

  const addStage = () => {
    const newStage: StageForm = {
      id: generateId(),
      name: `Stage ${formData.stages.length + 1}`,
      description: '',
      order: formData.stages.length + 1,
      color: stageColors[formData.stages.length % stageColors.length].id,
      icon: stageIcons[formData.stages.length % stageIcons.length].value,
      allowedRoles: [],
      requiredFields: [],
      entryActions: [],
      exitActions: [],
      timeoutActions: [],
      escalationRules: [],
      isDefault: false,
      canRevert: true,
      canSkip: false,
      requiresApproval: false,
      approvalRoles: [],
      approvalType: 'any',
      maxRecords: undefined,
      permissions: [],
      states: [],
    };
    
    setFormData(prev => ({
      ...prev,
      stages: [...prev.stages, newStage]
    }));
    setSelectedStage(formData.stages.length);
    setExpandedStage(newStage.id);
  };

  const removeStage = (index: number) => {
    const newStages = formData.stages.filter((_, i) => i !== index);
    const reorderedStages = newStages.map((stage, i) => ({
      ...stage,
      order: i + 1,
    }));
    setFormData(prev => ({ ...prev, stages: reorderedStages }));
    if (selectedStage === index) setSelectedStage(null);
    if (expandedStage === formData.stages[index].id) setExpandedStage(null);
    showToast('Stage removed', 'info');
  };

  const duplicateStage = (index: number) => {
    const stageToDuplicate = formData.stages[index];
    const newStage: StageForm = {
      ...stageToDuplicate,
      id: generateId(),
      name: `${stageToDuplicate.name} (Copy)`,
      order: formData.stages.length + 1,
    };
    
    const newStages = [...formData.stages];
    newStages.splice(index + 1, 0, newStage);
    
    const reorderedStages = newStages.map((stage, i) => ({
      ...stage,
      order: i + 1,
    }));
    
    setFormData(prev => ({ ...prev, stages: reorderedStages }));
    setSelectedStage(index + 1);
    setExpandedStage(newStage.id);
    showToast('Stage duplicated', 'success');
  };

  const addAction = (stageIndex: number, type: 'entryActions' | 'exitActions' | 'timeoutActions', actionType?: string) => {
    const newStages = [...formData.stages];
    const selectedType = actionType || actionTypes[0].value;
    const selectedAction = actionTypes.find(a => a.value === selectedType);
    
    if (!selectedAction) return;
    
    const newAction: ActionForm = {
      id: generateId(),
      actionType: selectedType,
      params: selectedAction.params.reduce((acc, param) => ({
        ...acc,
        [param.key]: param.type === 'checkbox' ? false : ''
      }), {}),
      enabled: true,
      executionOrder: newStages[stageIndex][type].length + 1,
      name: `${selectedAction.label} Action`,
    };
    
    newStages[stageIndex][type] = [
      ...newStages[stageIndex][type],
      newAction
    ];
    setFormData(prev => ({ ...prev, stages: newStages }));
    showToast(`${selectedAction.label} action added`, 'success');
  };

  const updateAction = (
    stageIndex: number,
    actionType: 'entryActions' | 'exitActions' | 'timeoutActions',
    actionIndex: number,
    updates: Partial<ActionForm> | { field: string, value: any }
  ) => {
    const newStages = [...formData.stages];
    
    if ('field' in updates && updates.field) {
      const { field, value } = updates;
      if (field === 'actionType') {
        const selectedAction = actionTypes.find(a => a.value === value);
        newStages[stageIndex][actionType][actionIndex] = {
          actionType: value,
          params: selectedAction?.params.reduce((acc, param) => ({
            ...acc,
            [param.key]: param.type === 'checkbox' ? false : ''
          }), {}) || {},
          enabled: newStages[stageIndex][actionType][actionIndex].enabled !== false,
          executionOrder: newStages[stageIndex][actionType][actionIndex].executionOrder || 1,
          name: newStages[stageIndex][actionType][actionIndex].name || `${selectedAction?.label} Action`,
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
    } else {
      newStages[stageIndex][actionType][actionIndex] = {
        ...newStages[stageIndex][actionType][actionIndex],
        ...updates as Partial<ActionForm>
      };
    }
    
    setFormData(prev => ({ ...prev, stages: newStages }));
  };

  const removeAction = (stageIndex: number, actionType: 'entryActions' | 'exitActions' | 'timeoutActions', actionIndex: number) => {
    const newStages = [...formData.stages];
    newStages[stageIndex][actionType] = newStages[stageIndex][actionType].filter((_, i) => i !== actionIndex);
    setFormData(prev => ({ ...prev, stages: newStages }));
    showToast('Action removed', 'info');
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

  const getStageColor = (colorId: string) => {
    return stageColors.find(c => c.id === colorId) || stageColors[0];
  };

  const getActionIcon = (actionType: string) => {
    const action = actionTypes.find(a => a.value === actionType);
    return action ? action.icon : Zap;
  };

  const getActionColor = (actionType: string) => {
    const action = actionTypes.find(a => a.value === actionType);
    return action ? action.color : 'bg-gray-100 text-gray-600';
  };

  const getActionConfig = (actionType: string) => {
    return actionTypes.find(a => a.value === actionType);
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!formData.name.trim()) errors.push('Blueprint name is required');
    if (!formData.module) errors.push('Module is required');
    if (formData.stages.length === 0) errors.push('At least one stage is required');
    
    for (const [index, stage] of formData.stages.entries()) {
      if (!stage.name.trim()) errors.push(`Stage ${index + 1} must have a name`);
      if (stage.allowedRoles.length === 0) errors.push(`Stage "${stage.name}" must have at least one allowed role`);
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
    
    setSaving(true);
    
    try {
      // Transform form data to match backend DTO
      const blueprintData = {
        name: formData.name,
        module: formData.module,
        description: formData.description,
        isActive: formData.isActive,
        stages: formData.stages.map(stage => ({
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
      };
      
      console.log('Updating blueprint with data:', blueprintData);
      
      await blueprintsService.updateBlueprint(blueprintId, blueprintData);
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
    if (!blueprint) return;
    
    try {
      const duplicateData = {
        name: `${blueprint.name} (Copy)`,
        module: blueprint.module,
        description: blueprint.description || '',
        isActive: false,
        stages: blueprint.stages.map(stage => ({
          name: stage.name,
          order: stage.order,
          allowedRoles: stage.allowedRoles,
          entryActions: stage.entryActions.map(action => ({
            actionType: action.actionType,
            params: { ...action.params }
          })),
          exitActions: stage.exitActions.map(action => ({
            actionType: action.actionType,
            params: { ...action.params }
          })),
        })),
      };
      
      const newBlueprint = await blueprintsService.createBlueprint(duplicateData);
      showToast('Blueprint duplicated successfully', 'success');
      router.push(`/settings/blueprints/${newBlueprint.id}/edit`);
    } catch (error: any) {
      console.error('Error duplicating blueprint:', error);
      showToast(error.message || 'Failed to duplicate blueprint', 'error');
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
          entryActions: stage.entryActions || [],
          exitActions: stage.exitActions || [],
        })),
      });
      showToast('Blueprint automation test completed successfully', 'success');
    } catch (error: any) {
      console.error('Error testing blueprint automation:', error);
      showToast(error.message || 'Failed to test blueprint automation', 'error');
    }
  };

  const handleDelete = async () => {
    if (!blueprint) return;
    
    try {
      await blueprintsService.deleteBlueprint(blueprint.id);
      showToast('Blueprint deleted successfully', 'success');
      router.push('/settings/blueprints');
    } catch (error: any) {
      console.error('Error deleting blueprint:', error);
      showToast(error.message || 'Failed to delete blueprint', 'error');
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to discard changes?')) {
      router.push('/settings/blueprints');
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

  const moduleInfo = availableModules.find(m => m.id === formData.module);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/settings/blueprints')}
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
              aria-label="Back to list"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Edit Blueprint</h1>
              <p className="text-gray-600 text-sm">Modify workflow template and process stages</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleTestAutomation}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              <Sparkles className="h-4 w-4" />
              Test Automation
            </button>
            <button
              onClick={handleDuplicate}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              <Copy className="h-4 w-4" />
              Duplicate
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
        
        {/* Blueprint Header */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 bg-blue-600 rounded-lg flex items-center justify-center">
              <Layers className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">{formData.name}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                  {moduleInfo?.name || formData.module}
                </span>
                <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                  formData.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {formData.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="text-sm text-gray-600">
                  {formData.stages.length} stage{formData.stages.length !== 1 ? 's' : ''}
                </span>
                {formData.description && (
                  <span className="text-sm text-gray-600">• {formData.description}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar */}
        <div className="lg:w-64">
          <div className="bg-white border border-gray-200 rounded-xl p-5 sticky top-8">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Blueprint Info</h3>
            
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Created</div>
                <p className="text-gray-900">
                  {new Date(blueprint.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Last Updated</div>
                <p className="text-gray-900">
                  {new Date(blueprint.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Status</div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    formData.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {formData.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => handleInputChange('isActive', !formData.isActive)}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    {formData.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
              
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Module</div>
                <p className="font-medium text-blue-700">{moduleInfo?.name || formData.module}</p>
                {moduleInfo?.description && (
                  <p className="text-xs text-gray-600 mt-1">{moduleInfo.description}</p>
                )}
              </div>
              
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Stages</div>
                <p className="text-gray-900">{formData.stages.length}</p>
              </div>

              {blueprint.createdBy && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Created By</div>
                  <p className="text-gray-900">
                    {blueprint.createdBy.email || blueprint.createdBy.id || 'Unknown'}
                  </p>
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">Quick Actions</h4>
              <div className="space-y-2">
                <button
                  onClick={() => router.push(`/settings/blueprints/${blueprint.id}`)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View Details
                </button>
                <button
                  onClick={handleDuplicate}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-purple-600 hover:bg-purple-50 rounded transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Duplicate
                </button>
                <button
                  onClick={handleTestAutomation}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-cyan-600 hover:bg-cyan-50 rounded transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Test Automation
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form Content */}
        <div className="flex-1">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
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
                    required
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
                    required
                  >
                    {availableModules.map(module => (
                      <option key={module.id} value={module.id}>
                        {module.name}
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
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    This description will help other users understand when to use this blueprint.
                  </p>
                </div>
              </div>
            </div>

            {/* Process Stages */}
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
                  >
                    <Plus className="h-5 w-5" />
                    Add First Stage
                  </button>
                </div>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="stages" direction="vertical">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="space-y-6"
                      >
                        {formData.stages.map((stage, index) => {
                          const color = getStageColor(stage.color);
                          const Icon = stageIcons.find(i => i.value === stage.icon)?.icon || Settings;
                          
                          return (
                            <Draggable
                              key={stage.id || index}
                              draggableId={`stage-${index}`}
                              index={index}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`${color.bg} ${color.border} border-2 rounded-xl p-6 ${
                                    selectedStage === index ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                                  }`}
                                >
                                  {/* Stage Header */}
                                  <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-start gap-4">
                                      <div
                                        {...provided.dragHandleProps}
                                        className="mt-2 cursor-move"
                                      >
                                        <GripVertical className="h-5 w-5 text-gray-500" />
                                      </div>
                                      
                                      <div className={`h-12 w-12 rounded-full ${color.light} flex items-center justify-center flex-shrink-0`}>
                                        <Icon className="h-5 w-5" />
                                      </div>
                                      
                                      <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                          <input
                                            type="text"
                                            value={stage.name}
                                            onChange={(e) => updateStage(index, 'name', e.target.value)}
                                            className="text-xl font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 px-0 py-1 w-full"
                                            placeholder="Stage name"
                                          />
                                          {stage.isDefault && (
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                              Default
                                            </span>
                                          )}
                                        </div>
                                        <textarea
                                          value={stage.description || ''}
                                          onChange={(e) => updateStage(index, 'description', e.target.value)}
                                          rows={1}
                                          className="text-sm text-gray-600 bg-transparent border-none focus:outline-none focus:ring-0 px-0 py-1 w-full resize-none"
                                          placeholder="Stage description (optional)"
                                        />
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => duplicateStage(index)}
                                        className="p-2 hover:bg-white/50 rounded-lg text-gray-600 hover:text-gray-900"
                                      >
                                        <Copy className="h-4 w-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => removeStage(index)}
                                        className="p-2 hover:bg-red-50 rounded-lg text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setExpandedStage(expandedStage === stage.id ? null : stage.id || index.toString())}
                                        className="p-2 text-gray-500 hover:bg-gray-100 rounded"
                                      >
                                        {expandedStage === (stage.id || index.toString()) ? (
                                          <ChevronDown className="h-4 w-4" />
                                        ) : (
                                          <ChevronRight className="h-4 w-4" />
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {/* Expanded Content */}
                                  {expandedStage === (stage.id || index.toString()) && (
                                    <div className="border-t border-gray-200 pt-6">
                                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        {/* Left Column - Basic Settings */}
                                        <div className="space-y-6">
                                          <div>
                                            <h4 className="text-sm font-medium text-gray-700 mb-3">Stage Settings</h4>
                                            <div className="space-y-4">
                                              <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-2">
                                                  Color
                                                </label>
                                                <select
                                                  value={stage.color}
                                                  onChange={(e) => updateStage(index, 'color', e.target.value)}
                                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                >
                                                  {stageColors.map(color => (
                                                    <option key={color.id} value={color.id}>
                                                      {color.name}
                                                    </option>
                                                  ))}
                                                </select>
                                              </div>
                                              
                                              <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-2">
                                                  Icon
                                                </label>
                                                <select
                                                  value={stage.icon}
                                                  onChange={(e) => updateStage(index, 'icon', e.target.value)}
                                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                >
                                                  {stageIcons.map(icon => (
                                                    <option key={icon.value} value={icon.value}>
                                                      {icon.label}
                                                    </option>
                                                  ))}
                                                </select>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {/* Middle Column - Permissions & Roles */}
                                        <div className="space-y-6">
                                          <div>
                                            <h4 className="text-sm font-medium text-gray-700 mb-3">Role Access *</h4>
                                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                              {roleOptions.map(role => (
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
                                        </div>
                                        
                                        {/* Right Column - Actions */}
                                        <div className="space-y-6">
                                          {/* Entry Actions */}
                                          <div>
                                            <div className="flex items-center justify-between mb-3">
                                              <h4 className="text-sm font-medium text-gray-700">Entry Actions</h4>
                                              <div className="relative">
                                                <select
                                                  onChange={(e) => {
                                                    if (e.target.value) {
                                                      addAction(index, 'entryActions', e.target.value);
                                                      e.target.value = '';
                                                    }
                                                  }}
                                                  className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 appearance-none pr-6 cursor-pointer"
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
                                                  const ActionIcon = config?.icon || Bell;
                                                  return (
                                                    <div key={i} className="bg-white rounded-lg p-3 border border-gray-200">
                                                      <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                          <div className={`p-1.5 rounded ${config?.color || 'bg-gray-100'}`}>
                                                            <ActionIcon className="h-3 w-3" />
                                                          </div>
                                                          <div>
                                                            <div className="text-sm font-medium">{config?.label || action.actionType}</div>
                                                            <div className="text-xs text-gray-500">{config?.description}</div>
                                                          </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                          <label className="relative inline-flex items-center cursor-pointer">
                                                            <input
                                                              type="checkbox"
                                                              checked={action.enabled !== false}
                                                              onChange={(e) => {
                                                                updateAction(index, 'entryActions', i, { field: 'enabled', value: !action.enabled });
                                                              }}
                                                              className="sr-only peer"
                                                            />
                                                            <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                                                          </label>
                                                          <button
                                                            onClick={() => removeAction(index, 'entryActions', i)}
                                                            className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-red-600"
                                                          >
                                                            <Trash2 className="h-3 w-3" />
                                                          </button>
                                                        </div>
                                                      </div>
                                                      
                                                      {/* Action parameters */}
                                                      {config?.params && (
                                                        <div className="space-y-2 mt-3">
                                                          {config.params.map(param => (
                                                            <div key={param.key}>
                                                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                {param.label}
                                                              </label>
                                                              {param.type === 'select' ? (
                                                                <select
                                                                  value={action.params[param.key] || ''}
                                                                  onChange={(e) => updateAction(index, 'entryActions', i, { field: `params.${param.key}`, value: e.target.value })}
                                                                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                                >
                                                                  <option value="">Select {param.label.toLowerCase()}</option>
                                                                  {param.options?.map(option => (
                                                                    <option key={option} value={option}>{option}</option>
                                                                  ))}
                                                                </select>
                                                              ) : param.type === 'checkbox' ? (
                                                                <label className="flex items-center gap-2">
                                                                  <input
                                                                    type="checkbox"
                                                                    checked={Boolean(action.params[param.key])}
                                                                    onChange={(e) => updateAction(index, 'entryActions', i, { field: `params.${param.key}`, value: e.target.checked })}
                                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                  />
                                                                  <span className="text-xs text-gray-700">{param.label}</span>
                                                                </label>
                                                              ) : param.type === 'textarea' ? (
                                                                <textarea
                                                                  value={action.params[param.key] || ''}
                                                                  onChange={(e) => updateAction(index, 'entryActions', i, { field: `params.${param.key}`, value: e.target.value })}
                                                                  rows={2}
                                                                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                                  placeholder={param.label}
                                                                />
                                                              ) : (
                                                                <input
                                                                  type="text"
                                                                  value={action.params[param.key] || ''}
                                                                  onChange={(e) => updateAction(index, 'entryActions', i, { field: `params.${param.key}`, value: e.target.value })}
                                                                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                                  placeholder={param.label}
                                                                />
                                                              )}
                                                            </div>
                                                          ))}
                                                        </div>
                                                      )}
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
                                          
                                          {/* Exit Actions */}
                                          <div>
                                            <div className="flex items-center justify-between mb-3">
                                              <h4 className="text-sm font-medium text-gray-700">Exit Actions</h4>
                                              <div className="relative">
                                                <select
                                                  onChange={(e) => {
                                                    if (e.target.value) {
                                                      addAction(index, 'exitActions', e.target.value);
                                                      e.target.value = '';
                                                    }
                                                  }}
                                                  className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 appearance-none pr-6 cursor-pointer"
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
                                                  const ActionIcon = config?.icon || Bell;
                                                  return (
                                                    <div key={i} className="bg-white rounded-lg p-3 border border-gray-200">
                                                      <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                          <div className={`p-1.5 rounded ${config?.color || 'bg-gray-100'}`}>
                                                            <ActionIcon className="h-3 w-3" />
                                                          </div>
                                                          <div>
                                                            <div className="text-sm font-medium">{config?.label || action.actionType}</div>
                                                            <div className="text-xs text-gray-500">{config?.description}</div>
                                                          </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                          <label className="relative inline-flex items-center cursor-pointer">
                                                            <input
                                                              type="checkbox"
                                                              checked={action.enabled !== false}
                                                              onChange={(e) => {
                                                                updateAction(index, 'exitActions', i, { field: 'enabled', value: !action.enabled });
                                                              }}
                                                              className="sr-only peer"
                                                            />
                                                            <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                                                          </label>
                                                          <button
                                                            onClick={() => removeAction(index, 'exitActions', i)}
                                                            className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-red-600"
                                                          >
                                                            <Trash2 className="h-3 w-3" />
                                                          </button>
                                                        </div>
                                                      </div>
                                                      
                                                      {/* Action parameters */}
                                                      {config?.params && (
                                                        <div className="space-y-2 mt-3">
                                                          {config.params.map(param => (
                                                            <div key={param.key}>
                                                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                {param.label}
                                                              </label>
                                                              {param.type === 'select' ? (
                                                                <select
                                                                  value={action.params[param.key] || ''}
                                                                  onChange={(e) => updateAction(index, 'exitActions', i, { field: `params.${param.key}`, value: e.target.value })}
                                                                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                                >
                                                                  <option value="">Select {param.label.toLowerCase()}</option>
                                                                  {param.options?.map(option => (
                                                                    <option key={option} value={option}>{option}</option>
                                                                  ))}
                                                                </select>
                                                              ) : param.type === 'checkbox' ? (
                                                                <label className="flex items-center gap-2">
                                                                  <input
                                                                    type="checkbox"
                                                                    checked={Boolean(action.params[param.key])}
                                                                    onChange={(e) => updateAction(index, 'exitActions', i, { field: `params.${param.key}`, value: e.target.checked })}
                                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                  />
                                                                  <span className="text-xs text-gray-700">{param.label}</span>
                                                                </label>
                                                              ) : param.type === 'textarea' ? (
                                                                <textarea
                                                                  value={action.params[param.key] || ''}
                                                                  onChange={(e) => updateAction(index, 'exitActions', i, { field: `params.${param.key}`, value: e.target.value })}
                                                                  rows={2}
                                                                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                                  placeholder={param.label}
                                                                />
                                                              ) : (
                                                                <input
                                                                  type="text"
                                                                  value={action.params[param.key] || ''}
                                                                  onChange={(e) => updateAction(index, 'exitActions', i, { field: `params.${param.key}`, value: e.target.value })}
                                                                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                                  placeholder={param.label}
                                                                />
                                                              )}
                                                            </div>
                                                          ))}
                                                        </div>
                                                      )}
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
                                  )}
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
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
                      <Loader2 className="h-5 w-5 animate-spin" />
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl p-5 max-w-md w-full">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-1.5 bg-red-100 rounded-lg mt-0.5">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Delete Blueprint</h3>
                <p className="text-sm text-gray-600 mt-1">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 text-sm mb-5">
              Are you sure you want to delete <strong className="text-red-600">{formData.name}</strong>?
              This blueprint will be permanently removed.
            </p>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}