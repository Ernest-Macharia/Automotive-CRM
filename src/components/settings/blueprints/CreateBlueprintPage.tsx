// pages/settings/blueprints/create.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Minus
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { blueprintsService } from '@/services/settings/blueprintsService';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { ALL_MODULES, CRITERIA_TEMPLATES, FIELD_GROUPS } from '@/data/modulesData';

// Enhanced Types
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
  negate?: boolean;
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
  repeat?: boolean;
  repeatInterval?: number;
  repeatUnit?: 'hours' | 'days' | 'weeks';
  maxRepeats?: number;
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
  schedule?: {
    type: 'specific_time' | 'relative_to_field' | 'cron';
    value: any;
  };
  retry?: {
    enabled: boolean;
    attempts: number;
    interval: number;
  };
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
  parallelTransitions?: string[];
  allowedRoles: string[];
  actions: ActionForm[];
  isExpanded?: boolean;
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
  isExpanded?: boolean;
  isDefault?: boolean;
  canRevert?: boolean;
  canSkip?: boolean;
  requiresApproval?: boolean;
  approvalRoles: string[];
  approvalType: 'any' | 'all' | 'sequential';
  approvalConditions?: ConditionGroup;
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

interface ModuleCriteria {
  module: string;
  criteria: ConditionGroup;
  fields: ModuleField[];
  dependencies: FieldDependency[];
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
  fieldCriteria?: Record<string, any>;
  globalEscalationRules: EscalationRule[];
  globalPermissions: PermissionRule[];
  states: StateRule[];
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
  moduleCriteria?: ModuleCriteria[];
  fieldDependencies: FieldDependency[];
}

interface ModuleField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'datetime' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'textarea' | 'email' | 'phone' | 'url' | 'currency' | 'percentage' | 'rating' | 'file' | 'image' | 'relation' | 'formula' | 'lookup' | 'autocomplete';
  options?: string[];
  required?: boolean;
  searchable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  groupable?: boolean;
  defaultValue?: any;
  module?: string;
}

type StepType = 'basic' | 'criteria' | 'field_dependencies' | 'stages' | 'permissions' | 'escalations' | 'transitions' | 'design' | 'preview';

export default function CreateBlueprintPage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
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
    fieldCriteria: {},
    globalEscalationRules: [],
    globalPermissions: [],
    states: [],
    moduleCriteria: [],
    fieldDependencies: [],
  });

  const [currentStep, setCurrentStep] = useState<StepType>('basic');
  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  const [selectedTransition, setSelectedTransition] = useState<number | null>(null);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [showFieldSelector, setShowFieldSelector] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [expandedCriteria, setExpandedCriteria] = useState<string[]>([]);
  const [dragMode, setDragMode] = useState<'stages' | 'transitions'>('stages');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'flow'>('flow');
  const [isMaximized, setIsMaximized] = useState(false);
  const [fieldDependencies, setFieldDependencies] = useState<FieldDependency[]>([]);
  const [moduleFields, setModuleFields] = useState<ModuleField[]>([]);
  const [availableModules, setAvailableModules] = useState(ALL_MODULES);
  const [criteriaTemplates, setCriteriaTemplates] = useState<any[]>([]);

  // Enhanced steps matching Zoho
  const steps = [
    { id: 'basic', title: 'Basic Info', description: 'Name, module & description' },
    { id: 'criteria', title: 'Criteria', description: 'Define record eligibility' },
    { id: 'field_dependencies', title: 'Field Dependencies', description: 'Set field visibility rules' },
    { id: 'stages', title: 'Stages', description: 'Configure workflow stages' },
    { id: 'permissions', title: 'Permissions', description: 'Set field & role access' },
    { id: 'escalations', title: 'Escalations', description: 'Configure escalation rules' },
    { id: 'transitions', title: 'Transitions', description: 'Define stage transitions' },
    { id: 'design', title: 'Design', description: 'Visual workflow design' },
    { id: 'preview', title: 'Preview', description: 'Review & publish' },
  ];

  // Module options
  const moduleOptions = ALL_MODULES.map(module => {
    const getIcon = () => {
      switch (module.icon) {
        case 'TrendingUp': return TrendingUp;
        case 'User': return User;
        case 'FileText': return FileText;
        case 'UserCheck': return UserCheck;
        default: return FileText;
      }
    };
    
    return {
      id: module.id,
      name: module.name,
      icon: getIcon(), // This is for UI display only
      description: module.description,
      layouts: module.layouts,
      fields: module.fields
    };
  });

  // Role options
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

  // Field operators
  const fieldOperators = [
    { value: 'equals', label: 'Equals', types: ['text', 'number', 'date', 'select', 'email', 'phone', 'currency', 'percentage'] },
    { value: 'not_equals', label: 'Not Equals', types: ['text', 'number', 'date', 'select', 'email', 'phone', 'currency', 'percentage'] },
    { value: 'greater_than', label: 'Greater Than', types: ['number', 'date', 'datetime', 'currency', 'percentage'] },
    { value: 'greater_than_equal', label: 'Greater Than or Equal', types: ['number', 'date', 'datetime', 'currency', 'percentage'] },
    { value: 'less_than', label: 'Less Than', types: ['number', 'date', 'datetime', 'currency', 'percentage'] },
    { value: 'less_than_equal', label: 'Less Than or Equal', types: ['number', 'date', 'datetime', 'currency', 'percentage'] },
    { value: 'contains', label: 'Contains', types: ['text', 'textarea', 'email'] },
    { value: 'not_contains', label: 'Does Not Contain', types: ['text', 'textarea', 'email'] },
    { value: 'starts_with', label: 'Starts With', types: ['text', 'textarea', 'email'] },
    { value: 'ends_with', label: 'Ends With', types: ['text', 'textarea', 'email'] },
    { value: 'is_empty', label: 'Is Empty', types: ['text', 'number', 'date', 'select', 'email', 'phone', 'textarea'] },
    { value: 'is_not_empty', label: 'Is Not Empty', types: ['text', 'number', 'date', 'select', 'email', 'phone', 'textarea'] },
    { value: 'between', label: 'Between', types: ['number', 'date', 'datetime', 'currency', 'percentage'] },
    { value: 'not_between', label: 'Not Between', types: ['number', 'date', 'datetime', 'currency', 'percentage'] },
    { value: 'in', label: 'In List', types: ['select', 'multiselect'] },
    { value: 'not_in', label: 'Not In List', types: ['select', 'multiselect'] },
    { value: 'changed_to', label: 'Changed To', types: ['text', 'number', 'date', 'select', 'email', 'phone', 'currency', 'percentage'] },
    { value: 'changed_from', label: 'Changed From', types: ['text', 'number', 'date', 'select', 'email', 'phone', 'currency', 'percentage'] },
    { value: 'changed', label: 'Changed', types: ['text', 'number', 'date', 'select', 'email', 'phone', 'currency', 'percentage'] },
  ];

  // Stage colors
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
    { id: 'teal', name: 'Teal', bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', dark: 'bg-teal-600', light: 'bg-teal-100' },
    { id: 'amber', name: 'Amber', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dark: 'bg-amber-600', light: 'bg-amber-100' },
    { id: 'emerald', name: 'Emerald', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dark: 'bg-emerald-600', light: 'bg-emerald-100' },
    { id: 'violet', name: 'Violet', bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', dark: 'bg-violet-600', light: 'bg-violet-100' },
    { id: 'fuchsia', name: 'Fuchsia', bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', text: 'text-fuchsia-700', dark: 'bg-fuchsia-600', light: 'bg-fuchsia-100' },
    { id: 'rose', name: 'Rose', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', dark: 'bg-rose-600', light: 'bg-rose-100' },
  ];

  // Stage icons
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
    { value: 'alert-triangle', icon: AlertTriangle, label: 'Alert Triangle' },
    { value: 'help', icon: HelpCircle, label: 'Help' },
    { value: 'zap', icon: Zap, label: 'Zap' },
    { value: 'trending-up', icon: TrendingUp, label: 'Trending Up' },
    { value: 'bar-chart', icon: BarChart, label: 'Bar Chart' },
    { value: 'pie-chart', icon: PieChart, label: 'Pie Chart' },
    { value: 'file-text', icon: FileText, label: 'File Text' },
    { value: 'folder', icon: Folder, label: 'Folder' },
    { value: 'package', icon: Package, label: 'Package' },
    { value: 'box', icon: Box, label: 'Box' },
    { value: 'layers', icon: Layers, label: 'Layers' },
    { value: 'layout', icon: Layout, label: 'Layout' },
    { value: 'grid', icon: Grid, label: 'Grid' },
    { value: 'list', icon: List, label: 'List' },
    { value: 'eye', icon: Eye, label: 'Eye' },
    { value: 'settings', icon: Settings, label: 'Settings' },
    { value: 'sliders', icon: Sliders, label: 'Sliders' },
    { value: 'filter', icon: Filter, label: 'Filter' },
    { value: 'search', icon: Search, label: 'Search' },
    { value: 'download', icon: Download, label: 'Download' },
    { value: 'upload', icon: Upload, label: 'Upload' },
    { value: 'share', icon: Share2, label: 'Share' },
    { value: 'link', icon: Link2, label: 'Link' },
    { value: 'unlink', icon: Unlink, label: 'Unlink' },
    { value: 'copy', icon: Copy, label: 'Copy' },
    { value: 'edit', icon: Edit2, label: 'Edit' },
    { value: 'trash', icon: Trash2, label: 'Trash' },
    { value: 'save', icon: Save, label: 'Save' },
    { value: 'play', icon: Play, label: 'Play' },
    { value: 'pause', icon: Pause, label: 'Pause' },
    { value: 'stop', icon: StopCircle, label: 'Stop' },
    { value: 'refresh', icon: RefreshCw, label: 'Refresh' },
    { value: 'chevron-right', icon: ChevronRight, label: 'Chevron Right' },
    { value: 'chevron-left', icon: ChevronLeft, label: 'Chevron Left' },
    { value: 'arrow-right', icon: ArrowRight, label: 'Arrow Right' },
    { value: 'arrow-left', icon: ArrowLeft, label: 'Arrow Left' },
    { value: 'maximize', icon: Maximize2, label: 'Maximize' },
    { value: 'minimize', icon: Minimize2, label: 'Minimize' },
    { value: 'plus', icon: Plus, label: 'Plus' },
    { value: 'minus', icon: Minus, label: 'Minus' },
    { value: 'x', icon: X, label: 'X' },
  ];

  // State types
  const stateTypes = [
    { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: FileText },
    { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800', icon: Check },
    { value: 'inactive', label: 'Inactive', color: 'bg-red-100 text-red-800', icon: X },
    { value: 'archived', label: 'Archived', color: 'bg-purple-100 text-purple-800', icon: Archive },
    { value: 'pending_review', label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    { value: 'approved', label: 'Approved', color: 'bg-blue-100 text-blue-800', icon: ShieldCheck },
    { value: 'rejected', label: 'Rejected', color: 'bg-rose-100 text-rose-800', icon: ShieldX },
  ];

  // Escalation types
  const escalationTypes = [
    { value: 'on', label: 'On', description: 'Trigger exactly when condition met' },
    { value: 'before', label: 'Before', description: 'Trigger before deadline' },
    { value: 'after', label: 'After', description: 'Trigger after deadline passed' },
  ];

  // Enhanced action types
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
      value: 'escalate', 
      label: 'Escalate Record', 
      icon: AlertTriangle,
      color: 'bg-red-100 text-red-600',
      description: 'Escalate to higher authority',
      params: [
        { key: 'escalate_to', label: 'Escalate To', type: 'select', options: ['manager', 'supervisor', 'specific_role', 'specific_user'] },
        { key: 'reason', label: 'Reason', type: 'textarea' },
        { key: 'priority', label: 'Priority', type: 'select', options: ['high', 'urgent', 'critical'] },
        { key: 'deadline', label: 'Response Deadline', type: 'select', options: ['1_hour', '4_hours', '8_hours', '24_hours'] },
      ]
    },
    { 
      value: 'approval', 
      label: 'Approval Process', 
      icon: Shield,
      color: 'bg-indigo-100 text-indigo-600',
      description: 'Initiate approval process',
      params: [
        { key: 'approvers', label: 'Approvers', type: 'multiselect' },
        { key: 'deadline', label: 'Approval Deadline', type: 'select', options: ['1_day', '2_days', '3_days', '1_week', 'custom'] },
        { key: 'approval_type', label: 'Approval Type', type: 'select', options: ['any', 'all', 'sequential'] },
        { key: 'conditions', label: 'Approval Conditions', type: 'textarea' },
        { key: 'on_approve', label: 'On Approve', type: 'select', options: ['move_to_next', 'update_field', 'send_notification'] },
        { key: 'on_reject', label: 'On Reject', type: 'select', options: ['move_back', 'update_field', 'send_notification'] },
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
    { 
      value: 'delay', 
      label: 'Delay Action', 
      icon: Clock,
      color: 'bg-gray-100 text-gray-600',
      description: 'Delay execution for specified time',
      params: [
        { key: 'duration', label: 'Delay Duration', type: 'number' },
        { key: 'unit', label: 'Time Unit', type: 'select', options: ['minutes', 'hours', 'days', 'business_days'] },
        { key: 'resume_action', label: 'Action After Delay', type: 'select' },
        { key: 'cancel_on', label: 'Cancel On', type: 'select', options: ['manual', 'field_change', 'stage_change'] },
      ]
    },
    { 
      value: 'condition', 
      label: 'Conditional Logic', 
      icon: GitBranch,
      color: 'bg-teal-100 text-teal-600',
      description: 'Execute actions based on conditions',
      params: [
        { key: 'condition_type', label: 'Condition Type', type: 'select', options: ['if_then', 'if_then_else', 'switch', 'complex'] },
        { key: 'conditions', label: 'Conditions', type: 'textarea' },
        { key: 'actions', label: 'Actions', type: 'textarea' },
        { key: 'else_actions', label: 'Else Actions', type: 'textarea' },
      ]
    },
    { 
      value: 'data_validation', 
      label: 'Data Validation', 
      icon: Check,
      color: 'bg-emerald-100 text-emerald-600',
      description: 'Validate data before proceeding',
      params: [
        { key: 'validation_rules', label: 'Validation Rules', type: 'textarea' },
        { key: 'error_message', label: 'Error Message', type: 'text' },
        { key: 'on_error', label: 'On Error Action', type: 'select', options: ['stop', 'continue', 'notify', 'revert'] },
        { key: 'severity', label: 'Severity', type: 'select', options: ['warning', 'error', 'blocking'] },
      ]
    },
  ];

  // Helper functions
  const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addConditionGroup = (type: 'AND' | 'OR' = 'AND'): ConditionGroup => {
    return {
      id: generateId(),
      type,
      conditions: [],
    };
  };

  const addFieldCondition = (fieldName: string, operator: string, value: any): FieldCondition => {
    return {
      id: generateId(),
      field: fieldName,
      operator: operator as FieldCondition['operator'],
      value,
      logicalOperator: 'AND',
    };
  };

  const addEscalationRule = (): EscalationRule => {
    return {
      id: generateId(),
      name: 'New Escalation Rule',
      type: 'on',
      triggerField: '',
      triggerValue: '',
      unit: 'hours',
      duration: 24,
      actions: [],
      notify: [],
    };
  };

  const addStateRule = (): StateRule => {
    return {
      id: generateId(),
      state: 'active',
      conditions: addConditionGroup(),
      actions: [],
      enterActions: [],
      exitActions: [],
    };
  };

  const addPermissionRule = (): PermissionRule => {
    return {
      id: generateId(),
      field: '',
      create: true,
      read: true,
      update: true,
      delete: false,
      visible: true,
      editable: true,
      roles: [],
    };
  };

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setAvailableModules(ALL_MODULES);
      setAvailableRoles(roleOptions.map(r => r.id));
      if (formData.module) {
        await loadModuleFields(formData.module);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      showToast('Failed to load initial data', 'error');
    }
  };

  const loadModuleFields = async (moduleId: string) => {
    try {
      const module = ALL_MODULES.find(m => m.id === moduleId);
      if (!module) return;
      
      // Convert fields to proper ModuleField type
      const fields: ModuleField[] = module.fields.map(field => ({
        name: field.name,
        label: field.label,
        type: field.type as ModuleField['type'],
        options: field.options,
        required: field.required,
        group: field.group,
        module: 'module' in field ? field.module : undefined
      }));
      
      setModuleFields(fields);
      
      // Set available fields
      setFormData(prev => ({ 
        ...prev, 
        availableFields: fields.map(f => f.name),
        moduleCriteria: [{
          module: moduleId,
          criteria: undefined,
          fields: fields,
          dependencies: []
        }]
      }));
      
      // Load criteria templates for this module
      const templates = CRITERIA_TEMPLATES[moduleId as keyof typeof CRITERIA_TEMPLATES] || [];
      setCriteriaTemplates(templates);
      
    } catch (error) {
      console.error('Error loading module fields:', error);
      showToast('Failed to load module fields', 'error');
    }
  };

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

  const goToStep = (step: StepType) => {
    setCurrentStep(step);
  };

  // Form handlers
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'module' && value) {
      const module = moduleOptions.find(m => m.id === value);
      if (module) {
        setFormData(prev => ({ 
          ...prev, 
          moduleLabel: module.name,
          layout: module.layouts?.[0] || 'default'
        }));
        loadModuleFields(value);
      }
    }
  };

  const validateFieldDependencies = () => {
    const errors: string[] = [];
    
    fieldDependencies.forEach((dep, index) => {
      if (!dep.field) {
        errors.push(`Dependency ${index + 1}: Target field is required`);
      }
      if (!dep.dependsOn.field) {
        errors.push(`Dependency ${index + 1}: Depends on field is required`);
      }
      if (dep.dependsOn.operator !== 'is_empty' && dep.dependsOn.operator !== 'is_not_empty' && !dep.dependsOn.value) {
        errors.push(`Dependency ${index + 1}: Value is required for operator "${dep.dependsOn.operator}"`);
      }
    });
    
    if (errors.length > 0) {
      showToast(errors[0], 'error');
      return false;
    }
    
    return true;
  };

  // Stage management
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
      isExpanded: true,
      isDefault: formData.stages.length === 0,
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

  const duplicateStage = (index: number) => {
    const stageToDuplicate = formData.stages[index];
    const newStage: StageForm = {
      ...stageToDuplicate,
      id: generateId(),
      name: `${stageToDuplicate.name} (Copy)`,
      order: formData.stages.length + 1,
      isExpanded: true,
    };
    
    const newStages = [...formData.stages];
    newStages.splice(index + 1, 0, newStage);
    
    const reorderedStages = newStages.map((stage, i) => ({
      ...stage,
      order: i + 1,
    }));
    
    setFormData(prev => ({ ...prev, stages: reorderedStages }));
    setSelectedStage(index + 1);
    showToast('Stage duplicated', 'success');
  };

  // Action management
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

  const removeAction = (stageIndex: number, actionType: 'entryActions' | 'exitActions' | 'timeoutActions', actionIndex: number) => {
    const newStages = [...formData.stages];
    newStages[stageIndex][actionType] = newStages[stageIndex][actionType].filter((_, i) => i !== actionIndex);
    setFormData(prev => ({ ...prev, stages: newStages }));
    showToast('Action removed', 'info');
  };

  const addFieldDependency = () => {
    const newDependency: FieldDependency = {
      id: generateId(),
      field: '',
      dependsOn: {
        module: formData.module,
        field: '',
        value: '',
        operator: 'equals'
      },
      visible: true,
      editable: true,
      required: false
    };
    setFieldDependencies([...fieldDependencies, newDependency]);
  };

  const updateFieldDependency = (index: number, field: keyof FieldDependency | 'dependsOn.field' | 'dependsOn.value' | 'dependsOn.operator', value: any) => {
    const updated = [...fieldDependencies];
    
    if (field.startsWith('dependsOn.')) {
      const dependsOnField = field.replace('dependsOn.', '');
      updated[index] = {
        ...updated[index],
        dependsOn: {
          ...updated[index].dependsOn,
          [dependsOnField]: value
        }
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value
      };
    }
    
    setFieldDependencies(updated);
  };

  const removeFieldDependency = (index: number) => {
    const updated = fieldDependencies.filter((_, i) => i !== index);
    setFieldDependencies(updated);
    showToast('Field dependency removed', 'info');
  };

  // Transition management
  const addTransition = () => {
    if (formData.stages.length < 2) {
      showToast('Need at least 2 stages to create a transition', 'error');
      return;
    }
    
    const newTransition: StageTransition = {
      id: generateId(),
      name: `Transition ${formData.transitions.length + 1}`,
      fromStage: formData.stages[0]?.name || '',
      toStage: formData.stages[1]?.name || '',
      type: 'manual',
      conditions: undefined,
      automaticDelay: undefined,
      automaticDelayUnit: 'days',
      parallelTransitions: [],
      allowedRoles: [],
      actions: [],
      isExpanded: true,
      description: '',
    };
    
    setFormData(prev => ({
      ...prev,
      transitions: [...prev.transitions, newTransition]
    }));
    setSelectedTransition(formData.transitions.length);
  };

  const updateTransition = (index: number, field: keyof StageTransition, value: any) => {
    const newTransitions = [...formData.transitions];
    if (field === 'allowedRoles') {
      const currentRoles = newTransitions[index].allowedRoles;
      if (currentRoles.includes(value)) {
        newTransitions[index].allowedRoles = currentRoles.filter(role => role !== value);
      } else {
        newTransitions[index].allowedRoles = [...currentRoles, value];
      }
    } else {
      newTransitions[index] = { ...newTransitions[index], [field]: value };
    }
    setFormData(prev => ({ ...prev, transitions: newTransitions }));
  };

  const removeTransition = (index: number) => {
    const newTransitions = formData.transitions.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, transitions: newTransitions }));
    if (selectedTransition === index) setSelectedTransition(null);
    showToast('Transition removed', 'info');
  };

  // Drag and drop
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    if (dragMode === 'stages') {
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
    } else {
      const items = Array.from(formData.transitions);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      
      setFormData(prev => ({ ...prev, transitions: items }));
      if (selectedTransition === result.source.index) {
        setSelectedTransition(result.destination.index);
      }
    }
  };

  // Validation
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

  const applyCriteriaTemplate = (template: any) => {
    const criteria: ConditionGroup = {
      id: generateId(),
      type: 'AND',
      conditions: template.conditions.map((cond: any) => ({
        id: generateId(),
        field: cond.field,
        operator: cond.operator,
        value: cond.value,
        value2: cond.value2,
        logicalOperator: 'AND'
      }))
    };

    setFormData(prev => ({ ...prev, criteria }));
    showToast(`Applied template: ${template.name}`, 'success');
  };

  // Save functions
  const saveDraft = async () => {
    if (!validateForm()) return;
    
    setSavingDraft(true);
    try {
      const blueprintData = {
        ...formData,
        fieldDependencies,
        isPublished: false,
        status: 'draft',
      };
      
      await blueprintsService.createBlueprint(blueprintData);
      showToast('Blueprint saved as draft', 'success');
    } catch (error) {
      console.error('Error saving draft:', error);
      showToast('Failed to save draft', 'error');
    } finally {
      setSavingDraft(false);
    }
  };

  const publishBlueprint = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const blueprintData = {
        ...formData,
        isPublished: true,
        status: 'published',
        publishedAt: new Date(),
      };
      
      await blueprintsService.createBlueprint(blueprintData);
      showToast('Blueprint published successfully!', 'success');
      setIsPublished(true);
      router.push('/settings/blueprints');
    } catch (error) {
      console.error('Error publishing blueprint:', error);
      showToast('Failed to publish blueprint', 'error');
    } finally {
      setLoading(false);
    }
  };

  const exportBlueprint = () => {
    const exportData = {
      ...formData,
      exportedAt: new Date().toISOString(),
      version: '1.0',
      exportType: 'blueprint',
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `blueprint-${formData.name || 'template'}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showToast('Blueprint exported', 'success');
  };

  const importBlueprint = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        setFormData(importedData);
        showToast('Blueprint imported successfully', 'success');
      } catch (error) {
        showToast('Failed to import blueprint', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Add this function before renderStepCriteria
  const renderValueInput = (condition: FieldCondition, index: number) => {
    const field = moduleFields.find(f => f.name === condition.field);
    
    if (!field) {
      return (
        <input
          type="text"
          value={condition.value || ''}
          onChange={(e) => {
            const newCriteria = { ...formData.criteria! };
            const fieldCondition = newCriteria.conditions[index] as FieldCondition;
            fieldCondition.value = e.target.value;
            setFormData(prev => ({ ...prev, criteria: newCriteria }));
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter value"
        />
      );
    }

    switch (field.type) {
      case 'select':
      case 'multiselect':
        return (
          <select
            value={condition.value || ''}
            onChange={(e) => {
              const newCriteria = { ...formData.criteria! };
              const fieldCondition = newCriteria.conditions[index] as FieldCondition;
              fieldCondition.value = e.target.value;
              setFormData(prev => ({ ...prev, criteria: newCriteria }));
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select {field.label}</option>
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <select
            value={condition.value || ''}
            onChange={(e) => {
              const newCriteria = { ...formData.criteria! };
              const fieldCondition = newCriteria.conditions[index] as FieldCondition;
              fieldCondition.value = e.target.value === 'true';
              setFormData(prev => ({ ...prev, criteria: newCriteria }));
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );

      case 'date':
      case 'datetime':
        return (
          <div className="space-y-2">
            <select
              value={condition.value?.startsWith('RELATIVE:') ? 'relative' : 'specific'}
              onChange={(e) => {
                const newCriteria = { ...formData.criteria! };
                const fieldCondition = newCriteria.conditions[index] as FieldCondition;
                fieldCondition.value = e.target.value === 'relative' ? 'RELATIVE:TODAY' : '';
                setFormData(prev => ({ ...prev, criteria: newCriteria }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="specific">Specific Date</option>
              <option value="relative">Relative Date</option>
            </select>
            
            {condition.value?.startsWith('RELATIVE:') ? (
              <select
                value={condition.value.replace('RELATIVE:', '')}
                onChange={(e) => {
                  const newCriteria = { ...formData.criteria! };
                  const fieldCondition = newCriteria.conditions[index] as FieldCondition;
                  fieldCondition.value = `RELATIVE:${e.target.value}`;
                  setFormData(prev => ({ ...prev, criteria: newCriteria }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="TODAY">Today</option>
                <option value="YESTERDAY">Yesterday</option>
                <option value="TOMORROW">Tomorrow</option>
                <option value="THIS_WEEK">This Week</option>
                <option value="LAST_WEEK">Last Week</option>
                <option value="NEXT_WEEK">Next Week</option>
                <option value="THIS_MONTH">This Month</option>
                <option value="LAST_MONTH">Last Month</option>
                <option value="NEXT_MONTH">Next Month</option>
              </select>
            ) : (
              <input
                type={field.type === 'date' ? 'date' : 'datetime-local'}
                value={condition.value || ''}
                onChange={(e) => {
                  const newCriteria = { ...formData.criteria! };
                  const fieldCondition = newCriteria.conditions[index] as FieldCondition;
                  fieldCondition.value = e.target.value;
                  setFormData(prev => ({ ...prev, criteria: newCriteria }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            )}
          </div>
        );

      case 'number':
      case 'currency':
      case 'percentage':
        return (
          <input
            type="number"
            value={condition.value || ''}
            onChange={(e) => {
              const newCriteria = { ...formData.criteria! };
              const fieldCondition = newCriteria.conditions[index] as FieldCondition;
              fieldCondition.value = parseFloat(e.target.value) || 0;
              setFormData(prev => ({ ...prev, criteria: newCriteria }));
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter number"
          />
        );

      case 'rating':
        return (
          <select
            value={condition.value || ''}
            onChange={(e) => {
              const newCriteria = { ...formData.criteria! };
              const fieldCondition = newCriteria.conditions[index] as FieldCondition;
              fieldCondition.value = parseInt(e.target.value);
              setFormData(prev => ({ ...prev, criteria: newCriteria }));
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Rating</option>
            {[1, 2, 3, 4, 5].map(rating => (
              <option key={rating} value={rating}>{rating} Star{rating !== 1 ? 's' : ''}</option>
            ))}
          </select>
        );

      default:
        return (
          <input
            type="text"
            value={condition.value || ''}
            onChange={(e) => {
              const newCriteria = { ...formData.criteria! };
              const fieldCondition = newCriteria.conditions[index] as FieldCondition;
              fieldCondition.value = e.target.value;
              setFormData(prev => ({ ...prev, criteria: newCriteria }));
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter value"
          />
        );
    }
  };

  // Step 1: Basic Info
  const renderStepBasic = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Module</h2>
          <p className="text-gray-600">Select which module this blueprint will apply to</p>
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
              required
            />
            <p className="mt-1 text-sm text-gray-500">Give your blueprint a descriptive name</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Module *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {moduleOptions.map(module => (
                <button
                  key={module.id}
                  type="button"
                  onClick={() => handleInputChange('module', module.id)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    formData.module === module.id
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div>
                      <div className="font-medium text-gray-900">{module.name}</div>
                      <div className="text-xs text-gray-500">{module.description}</div>
                    </div>
                  </div>
                  {formData.module === module.id && (
                    <div className="text-sm text-blue-600 font-medium">Selected</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe what this blueprint does..."
            />
            <p className="mt-1 text-sm text-gray-500">Optional description to help others understand this blueprint</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 2: Criteria (Enhanced with Zoho-like conditions)
  const renderStepCriteria = () => (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Define Criteria</h2>
          <p className="text-gray-600">Define which records are associated with this blueprint using advanced conditions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Quick Templates */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Quick Templates</h3>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    {formData.moduleLabel}
                  </span>
                </div>
                
                {criteriaTemplates.length > 0 ? (
                  <div className="space-y-3">
                    {criteriaTemplates.map((template, index) => (
                      <button
                        key={index}
                        onClick={() => applyCriteriaTemplate(template)}
                        className="w-full text-left p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200">
                            <Filter className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">{template.name}</h4>
                            <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-blue-600 font-medium">Apply Template</span>
                              <ArrowRight className="h-3 w-3 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Filter className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No templates available for this module</p>
                    <p className="text-sm text-gray-400 mt-1">Create custom criteria instead</p>
                  </div>
                )}

                {/* Module Fields Reference */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Available Fields</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {moduleFields.map((field) => (
                      <div key={field.name} className="flex items-center justify-between p-2 hover:bg-white rounded">
                        <div>
                          <span className="text-sm font-medium text-gray-900">{field.label}</span>
                          <span className="text-xs text-gray-500 ml-2">({field.type})</span>
                        </div>
                        <Tag className="h-3 w-3 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Field Groups */}
                {FIELD_GROUPS && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Field Groups</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(FIELD_GROUPS).slice(0, 5).map(([key, label]) => (
                        <span
                          key={key}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Criteria Builder */}
          <div className="lg:col-span-2">
            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Advanced Criteria Builder</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Define conditions that determine which records qualify for this blueprint
                  </p>
                </div>
                <div className="flex gap-2">
                  {!formData.criteria ? (
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, criteria: addConditionGroup('AND') }))}
                      className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                      Start Building Criteria
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const newCondition = addFieldCondition('', 'equals', '');
                          const newCriteria = { ...formData.criteria! };
                          newCriteria.conditions.push(newCondition);
                          setFormData(prev => ({ ...prev, criteria: newCriteria }));
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4" />
                        Add Condition
                      </button>
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, criteria: undefined }))}
                        className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                        Clear All
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {!formData.criteria ? (
                <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl">
                  <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Filter className="h-10 w-10 text-gray-400" />
                  </div>
                  <h4 className="text-xl font-medium text-gray-900 mb-2">No criteria defined</h4>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    All records in the {formData.moduleLabel?.toLowerCase() || 'selected'} module will be eligible for this blueprint.
                  </p>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, criteria: addConditionGroup('AND') }))}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                  >
                    Define Criteria
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Criteria Group Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                          {formData.criteria.type === 'AND' ? (
                            <div className="flex items-center">
                              <span className="font-bold">AND</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <span className="font-bold">OR</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Criteria Group</h4>
                          <p className="text-sm text-gray-600">
                            {formData.criteria.conditions.length} condition
                            {formData.criteria.conditions.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const newCriteria = { ...formData.criteria! };
                            newCriteria.type = newCriteria.type === 'AND' ? 'OR' : 'AND';
                            setFormData(prev => ({ ...prev, criteria: newCriteria }));
                          }}
                          className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                        >
                          Switch to {formData.criteria.type === 'AND' ? 'OR' : 'AND'}
                        </button>
                      </div>
                    </div>

                    {/* Conditions List */}
                    <div className="space-y-4">
                      {formData.criteria.conditions.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                          <p className="text-gray-500">No conditions yet</p>
                          <p className="text-sm text-gray-400 mt-1">Add conditions to define your criteria</p>
                        </div>
                      ) : (
                        formData.criteria.conditions.map((condition, index) => (
                          <div key={condition.id} className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-start gap-3">
                              <div className="mt-1">
                                <div className="h-6 w-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-xs font-medium">
                                  {index + 1}
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="grid grid-cols-12 gap-3">
                                  {/* Field Selector */}
                                  <div className="col-span-3">
                                    <label className="block text-xs font-medium text-gray-700 mb-2">
                                      Field
                                    </label>
                                    <select
                                      value={'field' in condition ? condition.field : ''}
                                      onChange={(e) => {
                                        const newCriteria = { ...formData.criteria! };
                                        if ('field' in newCriteria.conditions[index]) {
                                          const fieldCondition = newCriteria.conditions[index] as FieldCondition;
                                          const selectedField = moduleFields.find(f => f.name === e.target.value);
                                          fieldCondition.field = e.target.value;
                                          // Reset value if field type changes
                                          if (selectedField?.type === 'select' && !selectedField.options?.includes(fieldCondition.value)) {
                                            fieldCondition.value = '';
                                          }
                                        }
                                        setFormData(prev => ({ ...prev, criteria: newCriteria }));
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                    >
                                      <option value="">Select Field</option>
                                      {moduleFields.map(field => (
                                        <option key={`criteria-field-${field.name}`} value={field.name}>
                                          {field.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Operator Selector */}
                                  <div className="col-span-3">
                                    <label className="block text-xs font-medium text-gray-700 mb-2">
                                      Operator
                                    </label>
                                    <select
                                      value={'field' in condition ? condition.operator : ''}
                                      onChange={(e) => {
                                        const newCriteria = { ...formData.criteria! };
                                        if ('field' in newCriteria.conditions[index]) {
                                          (newCriteria.conditions[index] as FieldCondition).operator = e.target.value as FieldCondition['operator'];
                                        }
                                        setFormData(prev => ({ ...prev, criteria: newCriteria }));
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                    >
                                      <option value="">Select Operator</option>
                                      {fieldOperators.map(op => (
                                        <option key={op.value} value={op.value}>
                                          {op.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Value Input - Dynamic based on field type */}
                                  <div className="col-span-4">
                                    <label className="block text-xs font-medium text-gray-700 mb-2">
                                      Value
                                    </label>
                                    {'field' in condition && renderValueInput(condition, index)}
                                  </div>

                                  {/* Actions */}
                                  <div className="col-span-2 flex items-end">
                                    <button
                                      onClick={() => {
                                        const newCriteria = { ...formData.criteria! };
                                        newCriteria.conditions = newCriteria.conditions.filter((_, i) => i !== index);
                                        setFormData(prev => ({ ...prev, criteria: newCriteria }));
                                      }}
                                      className="w-full px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>

                                {/* Field description */}
                                {'field' in condition && condition.field && (
                                  <div className="mt-3">
                                    <div className="text-xs text-gray-500">
                                      {(() => {
                                        const field = moduleFields.find(f => f.name === condition.field);
                                        if (!field) return null;
                                        return (
                                          <div className="flex items-center gap-2">
                                            <span>Type: {field.type}</span>
                                            {field.required && (
                                              <span className="text-red-500">• Required</span>
                                            )}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Condition Button */}
                    <div className="mt-6">
                      <button
                        onClick={() => {
                          const newCondition = addFieldCondition('', 'equals', '');
                          const newCriteria = { ...formData.criteria! };
                          newCriteria.conditions.push(newCondition);
                          setFormData(prev => ({ ...prev, criteria: newCriteria }));
                        }}
                        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Plus className="h-4 w-4" />
                          Add Another Condition
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Advanced Features Panel */}
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Advanced Features</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <GitBranch className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-900">Nested Groups</h5>
                            <p className="text-sm text-gray-600">Create complex AND/OR logic with subgroups</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const newGroup = addConditionGroup('AND');
                            const newCriteria = { ...formData.criteria! };
                            newCriteria.conditions.push(newGroup);
                            setFormData(prev => ({ ...prev, criteria: newCriteria }));
                          }}
                          className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                        >
                          Add Nested Group
                        </button>
                      </div>

                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-900">Date Functions</h5>
                            <p className="text-sm text-gray-600">Use relative dates like "Today", "Last Week"</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const newCondition = addFieldCondition('', 'greater_than', 'TODAY()');
                            const newCriteria = { ...formData.criteria! };
                            newCriteria.conditions.push(newCondition);
                            setFormData(prev => ({ ...prev, criteria: newCriteria }));
                          }}
                          className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                        >
                          Add Date Condition
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Summary Preview */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">Criteria Summary</h4>
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Preview</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="text-sm text-gray-700 space-y-2">
                        {formData.criteria.conditions.map((condition, index) => (
                          <div key={index} className="flex items-center gap-2">
                            {index > 0 && (
                              <span className="text-blue-600 font-medium">{formData.criteria.type}</span>
                            )}
                            {'field' in condition && condition.field && (
                              <span>
                                <span className="font-medium">{moduleFields.find(f => f.name === condition.field)?.label || condition.field}</span>
                                {' '}
                                <span className="text-gray-600">{condition.operator}</span>
                                {' '}
                                <span className="text-blue-600">"{condition.value}"</span>
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                        {formData.criteria.conditions.length} condition
                        {formData.criteria.conditions.length !== 1 ? 's' : ''} • 
                        Records must match all conditions ({formData.criteria.type} logic)
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 3: Field Dependencies
  const renderStepFieldDependencies = () => (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Field Dependencies</h2>
          <p className="text-gray-600">Define field visibility and behavior based on other field values</p>
        </div>

        <div className="space-y-6">
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Field Dependency Rules</h3>
              <button
                onClick={addFieldDependency}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Dependency
              </button>
            </div>

            {fieldDependencies.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <GitBranch className="h-8 w-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No field dependencies defined</h4>
                <p className="text-gray-600 mb-4 max-w-md mx-auto">
                  Field dependencies control field visibility and behavior based on other field values.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {fieldDependencies.map((dependency, index) => (
                  <div key={dependency.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                          <Link2 className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Dependency {index + 1}</h4>
                          <span className="text-xs text-gray-500">Field: {dependency.field}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeFieldDependency(index)}
                          className="p-1 hover:bg-red-50 rounded text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Target Field
                        </label>
                        <select
                          value={dependency.field}
                          onChange={(e) => updateFieldDependency(index, 'field', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Field</option>
                          {moduleFields.map(field => (
                            <option key={field.name} value={field.name}>
                              {field.label} ({field.type})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Dependency Type
                        </label>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={dependency.visible !== false}
                              onChange={(e) => updateFieldDependency(index, 'visible', e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Visible</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={dependency.editable !== false}
                              onChange={(e) => updateFieldDependency(index, 'editable', e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Editable</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={dependency.required || false}
                              onChange={(e) => updateFieldDependency(index, 'required', e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Required</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Depends On Field
                        </label>
                        <select
                          value={dependency.dependsOn?.field || ''}
                          onChange={(e) => {
                            const updated = [...fieldDependencies];
                            updated[index].dependsOn.field = e.target.value;
                            setFieldDependencies(updated);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Field</option>
                          {moduleFields.map(field => (
                            <option key={field.name} value={field.name}>
                              {field.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Condition
                        </label>
                        <select
                          value={dependency.dependsOn?.operator || 'equals'}
                          onChange={(e) => {
                            const updated = [...fieldDependencies];
                            updated[index].dependsOn.operator = e.target.value as any;
                            setFieldDependencies(updated);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="equals">Equals</option>
                          <option value="not_equals">Not Equals</option>
                          <option value="contains">Contains</option>
                          <option value="not_contains">Not Contains</option>
                          <option value="is_empty">Is Empty</option>
                          <option value="is_not_empty">Is Not Empty</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Value
                        </label>
                        <input
                          type="text"
                          value={dependency.dependsOn?.value || ''}
                          onChange={(e) => {
                            const updated = [...fieldDependencies];
                            updated[index].dependsOn.value = e.target.value;
                            setFieldDependencies(updated);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Value to compare"
                        />
                      </div>
                    </div>

                    {dependency.dependsOn?.field && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                        <div className="text-sm text-blue-700">
                          <span className="font-medium">Rule:</span> Field "{dependency.field}" will be
                          {dependency.visible !== false ? ' visible' : ' hidden'} and
                          {dependency.editable !== false ? ' editable' : ' read-only'} when
                          "{dependency.dependsOn.field}" {dependency.dependsOn.operator} "{dependency.dependsOn.value}"
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-start gap-3">
                <div>
                  <h4 className="text-sm font-medium text-purple-900">Field Dependency Examples</h4>
                  <ul className="text-sm text-purple-700 mt-2 space-y-1">
                    <li>• Show "Technical Details" field only when "Service Type" equals "Repair"</li>
                    <li>• Make "PO Number" required when "Payment Terms" equals "Net 30"</li>
                    <li>• Hide "Campaign" field when "Lead Source" equals "Referral"</li>
                    <li>• Disable editing of "Amount" field when "Status" equals "Closed"</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Module Criteria */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Module Cross-References</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Linked Module Fields</h4>
                    <p className="text-sm text-gray-600">Fields that reference other modules</p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    Auto-detected
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {moduleFields
                    .filter(field => field.type === 'lookup' && field.module)
                    .map(field => (
                      <div key={field.name} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div>
                          <span className="text-sm font-medium text-gray-900">{field.label}</span>
                          <span className="text-xs text-gray-500 ml-2">→ {field.module}</span>
                        </div>
                        <Link2 className="h-4 w-4 text-gray-400" />
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 4: Stages Configuration
  const renderStepStages = () => (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Configure Stages</h2>
              <p className="text-gray-600">Define the stages of your workflow with advanced configurations</p>
            </div>
            <button
              onClick={addStage}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Stage
            </button>
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
            <button
              onClick={addStage}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
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
                    const color = stageColors.find(c => c.id === stage.color) || stageColors[0];
                    const Icon = stageIcons.find(i => i.value === stage.icon)?.icon || Settings;
                    
                    return (
                      <Draggable
                        key={stage.id}
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
                                  onClick={() => duplicateStage(index)}
                                  className="p-2 hover:bg-white/50 rounded-lg text-gray-600 hover:text-gray-900"
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => removeStage(index)}
                                  className="p-2 hover:bg-red-50 rounded-lg text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            
                            {/* Stage Configuration Tabs */}
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
                                      
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-2">
                                          Timeout Settings
                                        </label>
                                        <div className="flex gap-2">
                                          <input
                                            type="number"
                                            value={stage.timeout || ''}
                                            onChange={(e) => updateStage(index, 'timeout', e.target.value ? parseInt(e.target.value) : undefined)}
                                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Duration"
                                            min="1"
                                          />
                                          <select
                                            value={stage.timeoutUnit || 'days'}
                                            onChange={(e) => updateStage(index, 'timeoutUnit', e.target.value)}
                                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                          >
                                            <option value="minutes">Minutes</option>
                                            <option value="hours">Hours</option>
                                            <option value="days">Days</option>
                                          </select>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Maximum time a record can stay in this stage</p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Approval Settings */}
                                  <div>
                                    <div className="flex items-center justify-between mb-3">
                                      <h4 className="text-sm font-medium text-gray-700">Approval Settings</h4>
                                      <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={stage.requiresApproval}
                                          onChange={(e) => updateStage(index, 'requiresApproval', e.target.checked)}
                                          className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                      </label>
                                    </div>
                                    
                                    {stage.requiresApproval && (
                                      <div className="space-y-3 bg-white p-3 rounded-lg border border-gray-200">
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-2">
                                            Approval Type
                                          </label>
                                          <select
                                            value={stage.approvalType}
                                            onChange={(e) => updateStage(index, 'approvalType', e.target.value)}
                                            className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                          >
                                            <option value="any">Any Approver</option>
                                            <option value="all">All Approvers</option>
                                            <option value="sequential">Sequential Approval</option>
                                          </select>
                                        </div>
                                        
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-2">
                                            Approval Roles
                                          </label>
                                          <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                                            {roleOptions.slice(0, 5).map(role => (
                                              <label key={role.id} className="flex items-center gap-2">
                                                <input
                                                  type="checkbox"
                                                  checked={stage.approvalRoles.includes(role.id)}
                                                  onChange={() => updateStage(index, 'approvalRoles', role.id)}
                                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-xs text-gray-700">{role.name}</span>
                                              </label>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Middle Column - Permissions & Roles */}
                                <div className="space-y-6">
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-3">Role Access</h4>
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
                                  
                                  {/* Required Fields */}
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-3">Required Fields</h4>
                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                      {moduleFields.map(field => (
                                        <label key={field.name} className="flex items-center gap-2">
                                          <input
                                            type="checkbox"
                                            checked={stage.requiredFields.includes(field.name)}
                                            onChange={() => {
                                              const newStages = [...formData.stages];
                                              if (newStages[index].requiredFields.includes(field.name)) {
                                                newStages[index].requiredFields = newStages[index].requiredFields.filter(f => f !== field.name);
                                              } else {
                                                newStages[index].requiredFields.push(field.name);
                                              }
                                              setFormData(prev => ({ ...prev, stages: newStages }));
                                            }}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                          />
                                          <span className="text-xs text-gray-700">{field.label}</span>
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
                                          const config = actionTypes.find(a => a.value === action.actionType);
                                          const Icon = config?.icon || Bell;
                                          return (
                                            <div key={i} className="bg-white rounded-lg p-3 border border-gray-200">
                                              <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                  <div className={`p-1.5 rounded ${config?.color || 'bg-gray-100'}`}>
                                                    <Icon className="h-3 w-3" />
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
                                          const config = actionTypes.find(a => a.value === action.actionType);
                                          const Icon = config?.icon || Bell;
                                          return (
                                            <div key={i} className="bg-white rounded-lg p-3 border border-gray-200">
                                              <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                  <div className={`p-1.5 rounded ${config?.color || 'bg-gray-100'}`}>
                                                    <Icon className="h-3 w-3" />
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
    </div>
  );

  // Step 5: Permissions
  const renderStepPermissions = () => (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Field Permissions</h2>
          <p className="text-gray-600">Configure who can view and edit specific fields</p>
        </div>

        <div className="space-y-6">
          {/* Global Permissions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Global Field Permissions</h3>
              <button
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    globalPermissions: [...prev.globalPermissions, addPermissionRule()]
                  }));
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200"
              >
                <Plus className="h-4 w-4" />
                Add Permission
              </button>
            </div>

            {formData.globalPermissions.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500">No global permissions defined</p>
                <p className="text-sm text-gray-400 mt-1">Add permission rules to control field access across all stages</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.globalPermissions.map((permission, index) => (
                  <div key={permission.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Lock className="h-5 w-5 text-gray-500" />
                        <h4 className="font-medium text-gray-900">Permission {index + 1}</h4>
                      </div>
                      <button
                        onClick={() => {
                          const newPermissions = formData.globalPermissions.filter((_, i) => i !== index);
                          setFormData(prev => ({ ...prev, globalPermissions: newPermissions }));
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Field
                        </label>
                        <select
                          value={permission.field}
                          onChange={(e) => {
                            const newPermissions = [...formData.globalPermissions];
                            newPermissions[index].field = e.target.value;
                            setFormData(prev => ({ ...prev, globalPermissions: newPermissions }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Field</option>
                          {moduleFields.map(field => (
                            <option key={`perm-field-${field.name}`} value={field.name}>
                              {field.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Allowed Roles
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {roleOptions.map(role => (
                            <label
                              key={`perm-role-${role.id}`}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 rounded-md text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={permission.roles.includes(role.id)}
                                onChange={(e) => {
                                  const newPermissions = [...formData.globalPermissions];
                                  if (e.target.checked) {
                                    newPermissions[index].roles.push(role.id);
                                  } else {
                                    newPermissions[index].roles = newPermissions[index].roles.filter(r => r !== role.id);
                                  }
                                  setFormData(prev => ({ ...prev, globalPermissions: newPermissions }));
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span>{role.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mt-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={permission.create}
                          onChange={(e) => {
                            const newPermissions = [...formData.globalPermissions];
                            newPermissions[index].create = e.target.checked;
                            setFormData(prev => ({ ...prev, globalPermissions: newPermissions }));
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Create</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={permission.read}
                          onChange={(e) => {
                            const newPermissions = [...formData.globalPermissions];
                            newPermissions[index].read = e.target.checked;
                            setFormData(prev => ({ ...prev, globalPermissions: newPermissions }));
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Read</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={permission.update}
                          onChange={(e) => {
                            const newPermissions = [...formData.globalPermissions];
                            newPermissions[index].update = e.target.checked;
                            setFormData(prev => ({ ...prev, globalPermissions: newPermissions }));
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Update</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={permission.delete}
                          onChange={(e) => {
                            const newPermissions = [...formData.globalPermissions];
                            newPermissions[index].delete = e.target.checked;
                            setFormData(prev => ({ ...prev, globalPermissions: newPermissions }));
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Delete</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Step 6: Escalations
  const renderStepEscalations = () => (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Escalation Rules</h2>
          <p className="text-gray-600">Configure escalation rules for overdue or critical items</p>
        </div>

        <div className="space-y-6">
          {/* Global Escalations */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Global Escalation Rules</h3>
              <button
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    globalEscalationRules: [...prev.globalEscalationRules, addEscalationRule()]
                  }));
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200"
              >
                <Plus className="h-4 w-4" />
                Add Escalation
              </button>
            </div>

            {formData.globalEscalationRules.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500">No escalation rules defined</p>
                <p className="text-sm text-gray-400 mt-1">Add rules to escalate overdue or critical items</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.globalEscalationRules.map((escalation, index) => (
                  <div key={escalation.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-gray-500" />
                        <div>
                          <h4 className="font-medium text-gray-900">{escalation.name}</h4>
                          <span className={`text-xs px-2 py-1 rounded ${
                            escalation.type === 'on' 
                              ? 'bg-blue-100 text-blue-700'
                              : escalation.type === 'before'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {escalation.type.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const newEscalations = formData.globalEscalationRules.filter((_, i) => i !== index);
                          setFormData(prev => ({ ...prev, globalEscalationRules: newEscalations }));
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Trigger Field
                        </label>
                        <select
                          value={escalation.triggerField}
                          onChange={(e) => {
                            const newEscalations = [...formData.globalEscalationRules];
                            newEscalations[index].triggerField = e.target.value;
                            setFormData(prev => ({ ...prev, globalEscalationRules: newEscalations }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Field</option>
                          {moduleFields.filter(f => f.type === 'date' || f.type === 'datetime').map(field => (
                            <option key={`escalation-field-${field.name}`} value={field.name}>
                              {field.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Escalation Type
                        </label>
                        <select
                          value={escalation.type}
                          onChange={(e) => {
                            const newEscalations = [...formData.globalEscalationRules];
                            newEscalations[index].type = e.target.value as EscalationRule['type'];
                            setFormData(prev => ({ ...prev, globalEscalationRules: newEscalations }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        >
                          {escalationTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label} - {type.description}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Duration
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={escalation.duration}
                            onChange={(e) => {
                              const newEscalations = [...formData.globalEscalationRules];
                              newEscalations[index].duration = parseInt(e.target.value) || 0;
                              setFormData(prev => ({ ...prev, globalEscalationRules: newEscalations }));
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            min="1"
                          />
                          <select
                            value={escalation.unit}
                            onChange={(e) => {
                              const newEscalations = [...formData.globalEscalationRules];
                              newEscalations[index].unit = e.target.value as EscalationRule['unit'];
                              setFormData(prev => ({ ...prev, globalEscalationRules: newEscalations }));
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="minutes">Minutes</option>
                            <option value="hours">Hours</option>
                            <option value="days">Days</option>
                            <option value="business_days">Business Days</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Trigger Value
                        </label>
                        <input
                          type="text"
                          value={escalation.triggerValue}
                          onChange={(e) => {
                            const newEscalations = [...formData.globalEscalationRules];
                            newEscalations[index].triggerValue = e.target.value;
                            setFormData(prev => ({ ...prev, globalEscalationRules: newEscalations }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., Pending, Overdue, etc."
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Escalation Actions
                        </label>
                        <button
                          onClick={() => {
                            const newEscalations = [...formData.globalEscalationRules];
                            const action: ActionForm = {
                              id: generateId(),
                              actionType: 'notification',
                              params: {},
                              enabled: true,
                              executionOrder: newEscalations[index].actions.length + 1,
                            };
                            newEscalations[index].actions.push(action);
                            setFormData(prev => ({ ...prev, globalEscalationRules: newEscalations }));
                          }}
                          className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          + Add Action
                        </button>
                      </div>
                      {escalation.actions.length > 0 ? (
                        <div className="space-y-2">
                          {escalation.actions.map((action, actionIndex) => (
                            <div key={actionIndex} className="bg-white p-2 rounded border border-gray-200">
                              <div className="flex items-center justify-between">
                                <span className="text-sm">{action.actionType}</span>
                                <button
                                  onClick={() => {
                                    const newEscalations = [...formData.globalEscalationRules];
                                    newEscalations[index].actions = newEscalations[index].actions.filter((_, i) => i !== actionIndex);
                                    setFormData(prev => ({ ...prev, globalEscalationRules: newEscalations }));
                                  }}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No actions defined for this escalation</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Step 7: Transitions (Enhanced)
  const renderStepTransitions = () => (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Define Transitions</h2>
              <p className="text-gray-600">Configure how records move between stages</p>
            </div>
            <button
              onClick={addTransition}
              disabled={formData.stages.length < 2}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              Add Transition
            </button>
          </div>
        </div>

        {formData.transitions.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-2xl">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <GitBranch className="h-8 w-8 text-gray-400" />
            </div>
            <h4 className="text-xl font-medium text-gray-900 mb-2">No transitions yet</h4>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Transitions define how records move between stages. Add at least 2 stages first.
            </p>
            {formData.stages.length < 2 ? (
              <button
                onClick={() => setCurrentStep('stages')}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Go to Stages
              </button>
            ) : (
              <button
                onClick={addTransition}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Add First Transition
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {formData.transitions.map((transition, index) => (
              <div key={transition.id} className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <input
                          type="text"
                          value={transition.name}
                          onChange={(e) => updateTransition(index, 'name', e.target.value)}
                          className="text-xl font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 px-0 py-1 w-full"
                          placeholder="Transition name"
                        />
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          transition.type === 'manual' 
                            ? 'bg-blue-100 text-blue-700'
                            : transition.type === 'automatic'
                            ? 'bg-green-100 text-green-700'
                            : transition.type === 'parallel'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {transition.type}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-4">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            From Stage
                          </label>
                          <select
                            value={transition.fromStage}
                            onChange={(e) => updateTransition(index, 'fromStage', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select from stage</option>
                            {formData.stages.map(stage => (
                              <option key={`from-${stage.id}-${stage.name}`} value={stage.name}>
                                {stage.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="mt-6">
                          <ArrowRight className="h-5 w-5 text-gray-400" />
                        </div>
                        
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            To Stage
                          </label>
                          <select
                            value={transition.toStage}
                            onChange={(e) => updateTransition(index, 'toStage', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select to stage</option>
                            {formData.stages.map(stage => (
                              <option key={`to-${stage.id}-${stage.name}`} value={stage.name}>
                                {stage.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => removeTransition(index)}
                      className="p-2 hover:bg-red-50 rounded-lg text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-700">Transition Settings</h4>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Transition Type
                      </label>
                      <select
                        value={transition.type}
                        onChange={(e) => updateTransition(index, 'type', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="manual">Manual Transition</option>
                        <option value="automatic">Automatic Transition</option>
                        <option value="parallel">Parallel Transition</option>
                        <option value="conditional">Conditional Transition</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {transition.type === 'manual' && 'Users manually trigger this transition'}
                        {transition.type === 'automatic' && 'System automatically triggers this transition after specified time'}
                        {transition.type === 'parallel' && 'Multiple transitions can occur simultaneously'}
                        {transition.type === 'conditional' && 'Transition only occurs when conditions are met'}
                      </p>
                    </div>
                    
                    {transition.type === 'automatic' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Automatic Delay
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={transition.automaticDelay || ''}
                            onChange={(e) => updateTransition(index, 'automaticDelay', e.target.value ? parseInt(e.target.value) : undefined)}
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Duration"
                            min="1"
                          />
                          <select
                            value={transition.automaticDelayUnit || 'days'}
                            onChange={(e) => updateTransition(index, 'automaticDelayUnit', e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="minutes">Minutes</option>
                            <option value="hours">Hours</option>
                            <option value="days">Days</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Allowed Roles</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {roleOptions.map(role => (
                        <label
                          key={role.id}
                          className="flex items-center justify-between p-2 hover:bg-white/50 rounded-lg cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={transition.allowedRoles.includes(role.id)}
                              onChange={() => updateTransition(index, 'allowedRoles', role.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{role.name}</div>
                              <div className="text-xs text-gray-500">{role.description}</div>
                            </div>
                          </div>
                          <UserCheck className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Step 8: Design Workflow (Enhanced)
  const renderStepDesign = () => (
    <div className="w-full h-full">
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Design Workflow</h2>
            <p className="text-gray-600">Visualize and arrange your workflow stages</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDragMode('stages')}
                className={`px-3 py-1.5 rounded-lg font-medium text-sm ${
                  dragMode === 'stages' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Stages
              </button>
              <button
                onClick={() => setDragMode('transitions')}
                className={`px-3 py-1.5 rounded-lg font-medium text-sm ${
                  dragMode === 'transitions' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Transitions
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${
                  viewMode === 'list' 
                    ? 'bg-gray-100 text-gray-700' 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <List className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${
                  viewMode === 'grid' 
                    ? 'bg-gray-100 text-gray-700' 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('flow')}
                className={`p-2 rounded-lg ${
                  viewMode === 'flow' 
                    ? 'bg-gray-100 text-gray-700' 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Workflow className="h-5 w-5" />
              </button>
            </div>
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
            >
              {isMaximized ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {formData.stages.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-2xl">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Workflow className="h-8 w-8 text-gray-400" />
            </div>
            <h4 className="text-xl font-medium text-gray-900 mb-2">No stages to design</h4>
            <p className="text-gray-600 mb-6">Go back to the previous step to add stages</p>
            <button
              onClick={() => setCurrentStep('stages')}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Go to Stages
            </button>
          </div>
        ) : viewMode === 'flow' ? (
          <div className={`bg-white rounded-xl border border-gray-200 p-8 ${isMaximized ? 'min-h-[600px]' : ''}`}>
            <div className="relative">
              <div className="flex flex-wrap gap-8 justify-center">
                {formData.stages.map((stage, index) => {
                  const color = stageColors.find(c => c.id === stage.color) || stageColors[0];
                  const Icon = stageIcons.find(i => i.value === stage.icon)?.icon || Settings;
                  
                  return (
                    <div key={stage.id} className="relative">
                      <div className={`${color.bg} ${color.border} border-2 rounded-xl p-6 w-64 shadow-sm`}>
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`h-10 w-10 rounded-full ${color.light} flex items-center justify-center`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Users className="h-3 w-3 text-gray-500" />
                              <span className="text-xs text-gray-600">
                                {stage.allowedRoles.length} role{stage.allowedRoles.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Enhanced stage info */}
                        <div className="space-y-2 text-xs">
                          {stage.entryActions.length > 0 && (
                            <div className="text-gray-500">
                              <span className="font-medium">Entry:</span> {stage.entryActions.length} action{stage.entryActions.length !== 1 ? 's' : ''}
                            </div>
                          )}
                          {stage.requiresApproval && (
                            <div className="text-amber-500">
                              <Shield className="inline h-3 w-3 mr-1" />
                              Requires Approval
                            </div>
                          )}
                          {stage.timeout && (
                            <div className="text-red-500">
                              <Clock className="inline h-3 w-3 mr-1" />
                              Timeout: {stage.timeout} {stage.timeoutUnit}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {index < formData.stages.length - 1 && (
                        <>
                          <div className="absolute -right-8 top-1/2 transform -translate-y-1/2">
                            <div className="h-0.5 w-8 bg-gray-300"></div>
                          </div>
                          
                          <div className="absolute -right-9 top-1/2 transform -translate-y-1/2">
                            <ArrowRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Transitions visualization */}
              {formData.transitions.length > 0 && (
                <div className="mt-12">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Transitions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {formData.transitions.map((transition, index) => (
                      <div key={transition.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                              transition.type === 'manual' ? 'bg-blue-100 text-blue-600' :
                              transition.type === 'automatic' ? 'bg-green-100 text-green-600' :
                              transition.type === 'parallel' ? 'bg-purple-100 text-purple-600' :
                              'bg-yellow-100 text-yellow-600'
                            }`}>
                              {transition.type === 'manual' && <UserCheck className="h-4 w-4" />}
                              {transition.type === 'automatic' && <Clock className="h-4 w-4" />}
                              {transition.type === 'parallel' && <GitMerge className="h-4 w-4" />}
                              {transition.type === 'conditional' && <GitBranch className="h-4 w-4" />}
                            </div>
                            <span className="font-medium text-gray-900">{transition.name}</span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          {transition.fromStage} → {transition.toStage}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {formData.stages.map((stage, index) => {
              const color = stageColors.find(c => c.id === stage.color) || stageColors[0];
              const Icon = stageIcons.find(i => i.value === stage.icon)?.icon || Settings;
              
              return (
                <div key={stage.id} className={`${color.bg} ${color.border} border-2 rounded-xl p-6`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`h-12 w-12 rounded-full ${color.light} flex items-center justify-center`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                      <div className="text-sm text-gray-600 mt-1">{stage.description || 'No description'}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Allowed Roles:</span>
                      <span className="font-medium">{stage.allowedRoles.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Entry Actions:</span>
                      <span className="font-medium">{stage.entryActions.length}</span>
                    </div>
                    {stage.requiresApproval && (
                      <div className="flex items-center justify-between text-amber-600">
                        <span>Requires Approval</span>
                        <Shield className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {formData.stages.map((stage, index) => {
              const color = stageColors.find(c => c.id === stage.color) || stageColors[0];
              const Icon = stageIcons.find(i => i.value === stage.icon)?.icon || Settings;
              
              return (
                <div key={stage.id} className={`${color.bg} ${color.border} border-2 rounded-xl p-6`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full ${color.light} flex items-center justify-center`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                        <div className="text-sm text-gray-600 mt-1">{stage.description || 'No description'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Stage {stage.order}</div>
                      <div className="text-xs text-gray-400">
                        {stage.allowedRoles.length} role{stage.allowedRoles.length !== 1 ? 's' : ''} allowed
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

  // Step 9: Preview & Publish
  const renderStepPreview = () => (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Preview Blueprint</h2>
          <p className="text-gray-600">Review your blueprint before publishing</p>
        </div>

        {/* Blueprint Summary */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    {moduleOptions.find(m => m.id === formData.module)?.name || 'Not selected'}
                  </p>
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
                  <span className="text-sm text-gray-600">Total Transitions:</span>
                  <span className="font-medium">{formData.transitions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Actions:</span>
                  <span className="font-medium">
                    {formData.stages.reduce((acc, stage) => 
                      acc + stage.entryActions.length + stage.exitActions.length + (stage.timeoutActions?.length || 0), 0
                    )}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Features</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Permissions:</span>
                  <span className="font-medium">{formData.globalPermissions.length} rules</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Escalations:</span>
                  <span className="font-medium">{formData.globalEscalationRules.length} rules</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Publish Options */}
        <div className="border-t border-gray-200 pt-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Activate blueprint immediately</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => handleInputChange('isDefault', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Set as default for module</span>
              </label>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={exportBlueprint}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
              
              <button
                onClick={saveDraft}
                disabled={savingDraft}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50"
              >
                {savingDraft ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Draft
                  </>
                )}
              </button>
              
              <button
                onClick={publishBlueprint}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Publish Blueprint
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-900">Before Publishing</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Review all stages, transitions, and actions carefully. Once published, 
                  the blueprint will be active and start processing records according to your configuration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'basic':
        return renderStepBasic();
      case 'criteria':
        return renderStepCriteria();
      case 'field_dependencies':
        return renderStepFieldDependencies();
      case 'stages':
        return renderStepStages();
      case 'permissions':
        return renderStepPermissions();
      case 'escalations':
        return renderStepEscalations();
      case 'transitions':
        return renderStepTransitions();
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
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/settings/blueprints')}
                className="p-2 hover:bg-gray-100 rounded-lg"
                disabled={loading || savingDraft}
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Create Blueprint</h1>
                <p className="text-sm text-gray-600">Design workflow automation for {formData.moduleLabel || 'selected module'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={importBlueprint}
                  className="hidden"
                  id="import-blueprint"
                />
                <label
                  htmlFor="import-blueprint"
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 cursor-pointer"
                >
                  <Upload className="h-4 w-4" />
                  Import
                </label>
              </div>
              
              <button
                onClick={exportBlueprint}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
              
              <button
                onClick={saveDraft}
                disabled={savingDraft}
                className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {savingDraft ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Draft
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Step Progress */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center gap-8 overflow-x-auto">
            {steps.map((step, index) => {
              const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
              const isCurrent = step.id === currentStep;
              
              return (
                <button
                  key={step.id}
                  onClick={() => goToStep(step.id as StepType)}
                  className="flex items-center gap-3 min-w-max"
                  disabled={loading || savingDraft}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    isCompleted
                      ? 'bg-green-100 text-green-600'
                      : isCurrent
                      ? 'bg-blue-600 text-white ring-2 ring-blue-300 ring-offset-2'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  <div className={`text-left ${
                    isCurrent ? 'text-blue-600' : isCompleted ? 'text-gray-900' : 'text-gray-600'
                  }`}>
                    <div className="text-sm font-medium">{step.title}</div>
                    <div className="text-xs">{step.description}</div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-0.5 w-8 ${
                      steps.findIndex(s => s.id === currentStep) > index
                        ? 'bg-green-300'
                        : 'bg-gray-200'
                    }`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {renderCurrentStep()}
      </div>

      {/* Step Navigation */}
      <div className="bg-white border-t border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              {currentStep !== 'basic' && (
                <button
                  onClick={goToPreviousStep}
                  disabled={loading || savingDraft}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
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
                  disabled={loading || savingDraft}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={publishBlueprint}
                  disabled={loading || savingDraft}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  Publish Blueprint
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}