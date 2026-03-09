'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Plus, Trash2, Save, X, ChevronDown, 
  ChevronRight, Loader2, GripVertical, Eye, 
  Settings, AlertCircle, Check, Workflow, Copy, 
  Download, Upload, Search, Filter, Clock, Users, 
  Mail, Calendar, Bell, Zap, Shield, Edit2, 
  ChevronLeft, FileText, Maximize2, Minimize2, 
  Grid, List, Lock, User, Target, Flag, Rocket, 
  Star, Folder, Package, Layers, Layout, GitBranch,
  Link2, AlertTriangle, Key, Archive, ShieldCheck,
  ShieldX, Sliders, StopCircle, RefreshCw, Minus,
  PanelLeftClose, PanelLeftOpen, PanelRightClose,
  PanelRightOpen, MoveVertical, ArrowRight,
  TrendingUp,
  Share2,
  MessageSquare,
  MessageCircle,
  Code
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { blueprintsService } from '@/services/settings/blueprintsService';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { ALL_MODULES, CRITERIA_TEMPLATES, FIELD_GROUPS } from '@/data/modulesData';

const BACKEND_BLUEPRINT_MODULES = new Set(['opportunities', 'quotes', 'invoices', 'payments']);

// Enhanced Types combining both components
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

interface FlowStage {
  id: string;
  name: string;
  type: 'stage' | 'decision' | 'action' | 'start' | 'end';
  status?: string;
  description?: string;
  color: string;
  icon: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: {
    allowedRoles?: string[];
    requiredFields?: string[];
    actions?: any[];
    conditions?: any[];
    escalation?: {
      enabled: boolean;
      trigger: 'before' | 'on' | 'after';
      timeValue: number;
      timeUnit: 'minutes' | 'hours' | 'days';
      action: string;
      assignTo?: string;
    };
    entryActions?: any[];
    exitActions?: any[];
    timeoutActions?: any[];
    isDefault?: boolean;
    canRevert?: boolean;
    canSkip?: boolean;
    requiresApproval?: boolean;
    approvalRoles?: string[];
    approvalType?: 'any' | 'all' | 'sequential';
    maxRecords?: number;
    permissions?: any[];
    states?: any[];
    outgoingTransitionEscalations?: {
      [transitionId: string]: TransitionEscalationConfig;
    };
  };
  order: number;
}

interface FlowTransition {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'manual' | 'automatic' | 'conditional' | 'parallel';
  label?: string;
  conditions?: any[];
  config?: {
    allowedRoles?: string[];
    delay?: number;
    actions?: any[];
    automaticDelay?: number;
    automaticDelayUnit?: 'minutes' | 'hours' | 'days';
    conditions?: ConditionGroup;
    escalation?: {
      enabled: boolean;
      trigger: 'before' | 'on' | 'after';
      timeValue: number;
      timeUnit: 'minutes' | 'hours' | 'days';
      action: string;
      assignTo?: string;
      notifyUsers?: string[];
      notifyRoles?: string[];
    };
  };
}

interface TransitionEscalationConfig {
  enabled: boolean;
  trigger: 'before' | 'on' | 'after';
  timeValue: number;
  timeUnit: 'minutes' | 'hours' | 'days';
  action: 'email' | 'notification' | 'task' | 'auto_assign' | 'auto_move' | 'custom';
  customActionId?: string;
  assignTo?: string;
  notifyUsers?: string[];
  notifyRoles?: string[];
  messageTemplate?: string;
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
  stages: FlowStage[];
  transitions: FlowTransition[];
  availableFields: string[];
  fieldCriteria?: Record<string, any>;
  globalEscalationRules: any[];
  globalPermissions: any[];
  states: any[];
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
  moduleCriteria?: any[];
  fieldDependencies: any[];
}

interface ActionTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (actionType: string) => void;
  title: string;
  isEntryAction?: boolean;
}

type StepType = 'basic' | 'criteria' | 'field_dependencies' | 'stages' | 'permissions' | 'escalations' | 'transitions' | 'design' | 'preview';

// Available state templates for canvas
const AVAILABLE_STATES = [
  {
    id: 'new',
    name: 'New',
    type: 'stage',
    status: 'new',
    color: 'blue',
    icon: 'bell',
    description: 'New record created',
    defaultConfig: {
      allowedRoles: ['admin', 'manager', 'sales_rep'],
      requiredFields: [],
      actions: []
    }
  },
  {
    id: 'prospecting',
    name: 'Prospecting',
    type: 'stage',
    status: 'prospecting',
    color: 'green',
    icon: 'target',
    description: 'Qualifying the lead',
    defaultConfig: {
      allowedRoles: ['admin', 'manager', 'sales_rep'],
      requiredFields: ['budget', 'timeline'],
      actions: []
    }
  },
  {
    id: 'appointment_scheduled',
    name: 'Appointment Scheduled',
    type: 'stage',
    status: 'appointment_scheduled',
    color: 'purple',
    icon: 'calendar',
    description: 'Meeting scheduled',
    defaultConfig: {
      allowedRoles: ['admin', 'manager', 'sales_rep'],
      requiredFields: ['appointment_date', 'appointment_type'],
      actions: []
    }
  },
  {
    id: 'qualified',
    name: 'Qualified',
    type: 'stage',
    status: 'qualified',
    color: 'emerald',
    icon: 'check-square',
    description: 'Record qualified',
    defaultConfig: {
      allowedRoles: ['admin', 'manager', 'sales_rep'],
      requiredFields: [],
      actions: []
    }
  },
  {
    id: 'lost',
    name: 'Lost',
    type: 'stage',
    status: 'lost',
    color: 'red',
    icon: 'x-square',
    description: 'Record lost',
    defaultConfig: {
      allowedRoles: ['admin', 'manager'],
      requiredFields: ['lost_reason'],
      actions: []
    }
  },
  {
    id: 'start',
    name: 'Start',
    type: 'start',
    color: 'blue',
    icon: 'play-circle',
    description: 'Start of workflow',
    defaultConfig: {}
  },
  {
    id: 'decision',
    name: 'Decision',
    type: 'decision',
    color: 'amber',
    icon: 'git-fork',
    description: 'Decision point',
    defaultConfig: {}
  },
  {
    id: 'action_email',
    name: 'Send Email',
    type: 'action',
    color: 'blue',
    icon: 'mail',
    description: 'Send email action',
    defaultConfig: {}
  },
  {
    id: 'action_task',
    name: 'Create Task',
    type: 'action',
    color: 'green',
    icon: 'check-square',
    description: 'Create follow-up task',
    defaultConfig: {}
  },
  {
    id: 'end',
    name: 'End',
    type: 'end',
    color: 'gray',
    icon: 'stop-circle',
    description: 'End of workflow',
    defaultConfig: {}
  }
];

const ESCALATION_ACTIONS = [
  { id: 'email', name: 'Send Email', icon: Mail },
  { id: 'notification', name: 'Send Notification', icon: Bell },
  { id: 'task', name: 'Create Task', icon: Check },
  { id: 'auto_assign', name: 'Auto Assign', icon: User },
  { id: 'auto_move', name: 'Auto Move to Next Stage', icon: ArrowRight },
  { id: 'custom', name: 'Custom Action', icon: Settings }
];

const TIME_UNITS = [
  { id: 'minutes', name: 'Minutes' },
  { id: 'hours', name: 'Hours' },
  { id: 'days', name: 'Days' }
];

const ESCALATION_TRIGGERS = [
  { id: 'before', name: 'Before', description: 'Trigger before time limit' },
  { id: 'on', name: 'On', description: 'Trigger exactly at time limit' },
  { id: 'after', name: 'After', description: 'Trigger after time limit' }
];

// Color mapping
const COLOR_CLASSES = {
  blue: 'bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200',
  green: 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200',
  red: 'bg-red-100 border-red-300 text-red-800 hover:bg-red-200',
  yellow: 'bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200',
  purple: 'bg-purple-100 border-purple-300 text-purple-800 hover:bg-purple-200',
  gray: 'bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200',
  emerald: 'bg-emerald-100 border-emerald-300 text-emerald-800 hover:bg-emerald-200',
  amber: 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200'
};

// Icon mapping
const ICON_MAP = {
  bell: Bell,
  target: Target,
  calendar: Calendar,
  'check-square': Check,
  'x-square': X,
  'play-circle': Check,
  'git-fork': GitBranch,
  mail: Mail,
  'stop-circle': StopCircle,
  user: User,
  users: Users,
  shield: Shield,
  clock: Clock,
  flag: Flag,
  rocket: Rocket,
  star: Star,
  zap: Zap,
  key: Key,
  lock: Lock,
  eye: Eye,
  settings: Settings,
  edit: Edit2,
  trash: Trash2,
  copy: Copy,
  share: Share2,
  link: Link2,
  'arrow-right': ArrowRight,
  filter: Filter,
  search: Search,
  download: Download,
  upload: Upload,
  file: FileText,
  folder: Folder,
  package: Package,
  layers: Layers,
  layout: Layout,
  grid: Grid,
  list: List
};

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
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [selectedTransition, setSelectedTransition] = useState<string | null>(null);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [moduleFields, setModuleFields] = useState<any[]>([]);
  const [availableModules, setAvailableModules] = useState(ALL_MODULES);
  const [criteriaTemplates, setCriteriaTemplates] = useState<any[]>([]);

  // Flow builder states
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionSource, setConnectionSource] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  
  // Sidebar states
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedStageForAction, setSelectedStageForAction] = useState<string | null>(null);
  const [isEntryActionModal, setIsEntryActionModal] = useState(true);

  // Steps
  const steps = [
    { id: 'basic', title: 'Basic Info', description: 'Name, module & description' },
    { id: 'criteria', title: 'Criteria', description: 'Define record eligibility' },
    { id: 'field_dependencies', title: 'Field Dependencies', description: 'Set field visibility rules' },
    { id: 'design', title: 'Design', description: 'Visual workflow design' },
    { id: 'preview', title: 'Preview', description: 'Review & publish' },
  ];

  // Module options
  const moduleOptions = ALL_MODULES
    .filter(module => BACKEND_BLUEPRINT_MODULES.has(module.id))
    .map(module => {
    const getIcon = () => {
      switch (module.icon) {
        case 'TrendingUp': return TrendingUp;
        case 'User': return User;
        case 'FileText': return FileText;
        case 'UserCheck': return User;
        default: return FileText;
      }
    };
    
    return {
      id: module.id,
      name: module.name,
      icon: getIcon(),
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
  ];

  // Helper functions
  const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addConditionGroup = (type: 'AND' | 'OR' = 'AND'): ConditionGroup => ({
    id: generateId(),
    type,
    conditions: [],
  });

  const ActionTypeModal: React.FC<ActionTypeModalProps> = ({ 
    isOpen, 
    onClose, 
    onSelect, 
    title,
    isEntryAction = true 
  }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                Select an action type to add to this stage. Actions run {isEntryAction ? 'when a record enters' : 'when a record exits'} this stage.
              </p>
              
              <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
                {ACTION_TYPES.map(action => {
                  const ActionIcon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => {
                        onSelect(action.id);
                        onClose();
                      }}
                      className="p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full bg-${action.color}-100 flex items-center justify-center flex-shrink-0`}>
                          <ActionIcon className={`h-5 w-5 text-${action.color}-600`} />
                        </div>
                        <div>
                          <div className="font-medium text-sm text-gray-900">{action.name}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {isEntryAction ? 'Runs on entry' : 'Runs on exit'}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const addFieldCondition = (fieldName: string, operator: string, value: any): FieldCondition => ({
    id: generateId(),
    field: fieldName,
    operator: operator as FieldCondition['operator'],
    value,
    logicalOperator: 'AND',
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedTransition) {
      const transition = formData.transitions.find(t => t.id === selectedTransition);
    }
  }, [selectedTransition, formData.transitions]);

  useEffect(() => {
  }, [formData.transitions]);

  const loadInitialData = async () => {
    try {
      setAvailableModules(ALL_MODULES.filter(module => BACKEND_BLUEPRINT_MODULES.has(module.id)));
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
      
      const fields = module.fields.map(field => ({
        name: field.name,
        label: field.label,
        type: field.type,
        options: field.options,
        required: field.required,
        group: field.group,
      }));
      
      setModuleFields(fields);
      
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
        
        // Initialize with start and end stages
        const startStage: FlowStage = {
          id: generateId(),
          name: 'Start',
          type: 'start',
          color: 'blue',
          icon: 'play-circle',
          position: { x: 200, y: 300 },
          size: { width: 120, height: 80 },
          config: {},
          order: 1
        };
        
        const endStage: FlowStage = {
          id: generateId(),
          name: 'End',
          type: 'end',
          color: 'gray',
          icon: 'stop-circle',
          position: { x: 1000, y: 300 },
          size: { width: 120, height: 80 },
          config: {},
          order: 2
        };
        
        setFormData(prev => ({
          ...prev,
          stages: [startStage, endStage]
        }));
      }
    }
  };

  // Flow Builder functions
  const handleDragStartFromPalette = (e: React.DragEvent, state: any) => {
    e.dataTransfer.setData('application/flow-state', JSON.stringify(state));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDropOnCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffset.x) / zoomLevel;
    const y = (e.clientY - rect.top - panOffset.y) / zoomLevel;
    
    try {
      const stateData = e.dataTransfer.getData('application/flow-state');
      if (stateData) {
        const state = JSON.parse(stateData);
        
        const newStage: FlowStage = {
          id: generateId(),
          name: state.name,
          type: state.type,
          status: state.status,
          description: state.description,
          color: state.color,
          icon: state.icon,
          position: { x: x - 60, y: y - 40 },
          size: { width: 120, height: 80 },
          config: { ...state.defaultConfig },
          order: formData.stages.length + 1
        };
        
        setFormData(prev => ({
          ...prev,
          stages: [...prev.stages, newStage]
        }));
        
        showToast(`${state.name} added to canvas`, 'success');
      }
    } catch (error) {
      console.error('Error dropping state:', error);
    }
  };

  const handleStageDrag = (id: string, x: number, y: number) => {
    setFormData(prev => ({
      ...prev,
      stages: prev.stages.map(stage => 
        stage.id === id 
          ? { ...stage, position: { x, y } }
          : stage
      )
    }));
  };

  const handleStartConnection = (stageId: string) => {
    setIsConnecting(true);
    setConnectionSource(stageId);
    showToast(`Click on target stage to connect from ${formData.stages.find(s => s.id === stageId)?.name}`, 'info');
  };

  const handleCompleteConnection = (targetId: string) => {
    if (!connectionSource || connectionSource === targetId) {
      setIsConnecting(false);
      setConnectionSource(null);
      return;
    }

    const sourceStage = formData.stages.find(s => s.id === connectionSource);
    const targetStage = formData.stages.find(s => s.id === targetId);

    if (sourceStage && targetStage) {
      const newTransition: FlowTransition = {
        id: generateId(),
        sourceId: connectionSource,
        targetId: targetId,
        type: 'manual',
        label: `${sourceStage.name} → ${targetStage.name}`,
        config: {
          allowedRoles: ['admin', 'manager'],
          delay: 0,
          actions: []
        }
      };

      setFormData(prev => ({
        ...prev,
        transitions: [...prev.transitions, newTransition]
      }));

      showToast(`Connected ${sourceStage.name} to ${targetStage.name}`, 'success');
    }

    setIsConnecting(false);
    setConnectionSource(null);
  };

  const handleDeleteElement = (id: string) => {
    const isStage = formData.stages.some(s => s.id === id);
    
    if (isStage) {
      const updatedTransitions = formData.transitions.filter(
        t => t.sourceId !== id && t.targetId !== id
      );
      
      setFormData(prev => ({
        ...prev,
        stages: prev.stages.filter(s => s.id !== id),
        transitions: updatedTransitions
      }));
      
      showToast('Stage deleted', 'info');
    } else {
      setFormData(prev => ({
        ...prev,
        transitions: prev.transitions.filter(t => t.id !== id)
      }));
      
      showToast('Transition deleted', 'info');
    }
    
    if (selectedStage === id || selectedTransition === id) {
      setSelectedStage(null);
      setSelectedTransition(null);
    }
  };

  // Canvas control functions
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - lastMousePos.x;
      const deltaY = e.clientY - lastMousePos.y;
      
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.5, Math.min(2, zoomLevel * delta));
      setZoomLevel(newZoom);
    }
  };

  // Calculate connection path
  const calculateConnectionPath = (source: FlowStage, target: FlowStage) => {
    const startX = source.position.x + source.size.width;
    const startY = source.position.y + source.size.height / 2;
    const endX = target.position.x;
    const endY = target.position.y + target.size.height / 2;
    
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    
    return {
      path: `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`,
      arrowX: endX - 10,
      arrowY: endY,
      midX,
      midY
    };
  };

  // Stage configuration update
  const updateStage = (id: string, field: keyof FlowStage | 'config.allowedRoles' | 'config.requiresApproval', value: any) => {
    const newStages = [...formData.stages];
    const stageIndex = newStages.findIndex(s => s.id === id);
    
    if (stageIndex === -1) return;
    
    if (field === 'config.allowedRoles') {
      const currentRoles = newStages[stageIndex].config.allowedRoles || [];
      if (currentRoles.includes(value)) {
        newStages[stageIndex].config.allowedRoles = currentRoles.filter(role => role !== value);
      } else {
        newStages[stageIndex].config.allowedRoles = [...currentRoles, value];
      }
    } else if (field === 'config.requiresApproval') {
      newStages[stageIndex].config.requiresApproval = value;
    } else if (field.startsWith('config.')) {
      const configField = field.replace('config.', '');
      newStages[stageIndex].config = {
        ...newStages[stageIndex].config,
        [configField]: value
      };
    } else {
      newStages[stageIndex] = { ...newStages[stageIndex], [field]: value };
    }
    
    setFormData(prev => ({ ...prev, stages: newStages }));
  };

  // Validation
  const validateForm = () => {
    const errors: string[] = [];
    
    if (!formData.name.trim()) errors.push('Blueprint name is required');
    if (!formData.module) errors.push('Module is required');
    if (formData.stages.length < 2) errors.push('At least 2 stages are required (Start and End)');
    
    for (const stage of formData.stages) {
      if (!stage.name.trim()) errors.push(`Stage "${stage.name}" must have a name`);
      if (stage.type === 'stage' && (!stage.config?.allowedRoles || stage.config.allowedRoles.length === 0)) {
        errors.push(`Stage "${stage.name}" must have at least one allowed role`);
      }
    }
    
    if (errors.length > 0) {
      showToast(errors[0], 'error');
      return false;
    }
    
    return true;
  };

  // Save blueprint
  const saveBlueprint = async (asDraft = true) => {
    if (!validateForm()) return;
    
    const saveFunction = asDraft ? setSavingDraft : setLoading;
    saveFunction(true);
    
    try {
      // Helper function to create default stage config for blueprint
      const createBlueprintStageConfig = (stage: FlowStage) => ({
        allowedRoles: stage.config?.allowedRoles || ['admin'],
        requiredFields: stage.config?.requiredFields || [],
        actions: stage.config?.actions || [],
        conditions: stage.config?.conditions || [],
        escalation: stage.config?.escalation || undefined,
        entryActions: stage.config?.entryActions || [],
        exitActions: stage.config?.exitActions || [],
        timeoutActions: stage.config?.timeoutActions || [],
        isDefault: stage.config?.isDefault || false,
        canRevert: stage.config?.canRevert || false,
        canSkip: stage.config?.canSkip || false,
        requiresApproval: stage.config?.requiresApproval || false,
        approvalRoles: stage.config?.approvalRoles || [],
        approvalType: stage.config?.approvalType || 'any',
        maxRecords: stage.config?.maxRecords || undefined,
        permissions: stage.config?.permissions || [],
        states: stage.config?.states || [],
        outgoingTransitionEscalations: stage.config?.outgoingTransitionEscalations || {},
        status: stage.status || ''
      });

      // Convert flow stages to blueprint stages format
      const blueprintStages = formData.stages
        .filter(stage => stage.type !== 'start' && stage.type !== 'end')
        .map((stage, index) => ({
          name: stage.name,
          order: index + 1,
          allowedRoles: stage.config?.allowedRoles || ['admin'],
          entryActions: stage.config?.entryActions || [],
          exitActions: stage.config?.exitActions || [],
          config: createBlueprintStageConfig(stage)
        }));
      
      // Add start and end stages if they exist with proper config
      const startStage = formData.stages.find(s => s.type === 'start');
      const endStage = formData.stages.find(s => s.type === 'end');
      
      if (startStage) {
        blueprintStages.unshift({
          name: 'Start',
          order: 0,
          allowedRoles: ['admin'],
          entryActions: [],
          exitActions: [],
          config: createBlueprintStageConfig(startStage)
        });
      }
      
      if (endStage) {
        blueprintStages.push({
          name: 'End',
          order: blueprintStages.length + 1,
          allowedRoles: ['admin'],
          entryActions: [],
          exitActions: [],
          config: createBlueprintStageConfig(endStage)
        });
      }
      
      const stageById = new Map(formData.stages.map(stage => [stage.id, stage]));
      const allowedTransitions = formData.transitions
        .map(transition => {
          const sourceStage = stageById.get(transition.sourceId);
          const targetStage = stageById.get(transition.targetId);
          if (!sourceStage || !targetStage) return null;

          return {
            fromStage: sourceStage.name,
            toStage: targetStage.name,
            allowedRoles: transition.config?.allowedRoles || [],
            conditions: (transition.config?.conditions as Record<string, any>) || {},
          };
        })
        .filter(Boolean);

      const blueprintData = {
        name: formData.name,
        module: formData.module,
        description: formData.description,
        stages: blueprintStages,
        allowedTransitions,
        isActive: asDraft ? false : true
      };
      
      await blueprintsService.createBlueprint(blueprintData);
      
      showToast(`Blueprint ${asDraft ? 'saved as draft' : 'published'} successfully!`, 'success');
      
      if (!asDraft) {
        router.push('/settings/blueprints');
      }
    } catch (error) {
      console.error('Error saving blueprint:', error);
      showToast(`Failed to ${asDraft ? 'save draft' : 'publish blueprint'}`, 'error');
    } finally {
      saveFunction(false);
    }
  };

  // Step 1: Basic Info
  const renderStepBasic = () => (
    <div className="max-w-4xl mx-auto py-8">
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

  // Step 2: Criteria
  const renderStepCriteria = () => (
    <div className="max-w-7xl mx-auto py-8">
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
                        onClick={() => {
                          const criteria = addConditionGroup('AND');
                          criteria.conditions = template.conditions.map((cond: any) => 
                            addFieldCondition(cond.field, cond.operator, cond.value)
                          );
                          setFormData(prev => ({ ...prev, criteria }));
                          showToast(`Applied template: ${template.name}`, 'success');
                        }}
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
                          {formData.criteria.type === 'AND' ? 'AND' : 'OR'}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Criteria Group</h4>
                          <p className="text-sm text-gray-600">
                            {formData.criteria.conditions.length} condition
                            {formData.criteria.conditions.length !== 1 ? 's' : ''}
                          </p>
                        </div>
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
                            <div className="grid grid-cols-12 gap-3">
                              {/* Field Selector */}
                              <div className="col-span-4">
                                <label className="block text-xs font-medium text-gray-700 mb-2">
                                  Field
                                </label>
                                <select
                                  value={'field' in condition ? condition.field : ''}
                                  onChange={(e) => {
                                    const newCriteria = { ...formData.criteria! };
                                    if ('field' in newCriteria.conditions[index]) {
                                      (newCriteria.conditions[index] as FieldCondition).field = e.target.value;
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
                                  <option value="equals">Equals</option>
                                  <option value="not_equals">Not Equals</option>
                                  <option value="contains">Contains</option>
                                  <option value="not_contains">Not Contains</option>
                                  <option value="greater_than">Greater Than</option>
                                  <option value="less_than">Less Than</option>
                                </select>
                              </div>

                              {/* Value Input */}
                              <div className="col-span-3">
                                <label className="block text-xs font-medium text-gray-700 mb-2">
                                  Value
                                </label>
                                <input
                                  type="text"
                                  value={'field' in condition ? condition.value : ''}
                                  onChange={(e) => {
                                    const newCriteria = { ...formData.criteria! };
                                    if ('field' in newCriteria.conditions[index]) {
                                      (newCriteria.conditions[index] as FieldCondition).value = e.target.value;
                                    }
                                    setFormData(prev => ({ ...prev, criteria: newCriteria }));
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Enter value"
                                />
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
    <div className="max-w-6xl mx-auto py-8">
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
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    fieldDependencies: [...prev.fieldDependencies, {
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
                    }]
                  }));
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Dependency
              </button>
            </div>

            {formData.fieldDependencies.length === 0 ? (
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
                {formData.fieldDependencies.map((dependency, index) => (
                  <div key={dependency.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Target Field
                        </label>
                        <select
                          value={dependency.field}
                          onChange={(e) => {
                            const newDeps = [...formData.fieldDependencies];
                            newDeps[index].field = e.target.value;
                            setFormData(prev => ({ ...prev, fieldDependencies: newDeps }));
                          }}
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
                          Depends On Field
                        </label>
                        <select
                          value={dependency.dependsOn?.field || ''}
                          onChange={(e) => {
                            const newDeps = [...formData.fieldDependencies];
                            newDeps[index].dependsOn.field = e.target.value;
                            setFormData(prev => ({ ...prev, fieldDependencies: newDeps }));
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
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Condition
                        </label>
                        <select
                          value={dependency.dependsOn?.operator || 'equals'}
                          onChange={(e) => {
                            const newDeps = [...formData.fieldDependencies];
                            newDeps[index].dependsOn.operator = e.target.value;
                            setFormData(prev => ({ ...prev, fieldDependencies: newDeps }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="equals">Equals</option>
                          <option value="not_equals">Not Equals</option>
                          <option value="contains">Contains</option>
                          <option value="not_contains">Not Contains</option>
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
                            const newDeps = [...formData.fieldDependencies];
                            newDeps[index].dependsOn.value = e.target.value;
                            setFormData(prev => ({ ...prev, fieldDependencies: newDeps }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Value to compare"
                        />
                      </div>

                      <div className="flex items-center gap-4 pt-6">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={dependency.visible !== false}
                            onChange={(e) => {
                              const newDeps = [...formData.fieldDependencies];
                              newDeps[index].visible = e.target.checked;
                              setFormData(prev => ({ ...prev, fieldDependencies: newDeps }));
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Visible</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={dependency.required || false}
                            onChange={(e) => {
                              const newDeps = [...formData.fieldDependencies];
                              newDeps[index].required = e.target.checked;
                              setFormData(prev => ({ ...prev, fieldDependencies: newDeps }));
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Required</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end mt-4">
                      <button
                        onClick={() => {
                          const newDeps = formData.fieldDependencies.filter((_, i) => i !== index);
                          setFormData(prev => ({ ...prev, fieldDependencies: newDeps }));
                        }}
                        className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100"
                      >
                        Remove
                      </button>
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

  const ACTION_TYPES = [
    { id: 'notification', name: 'Send Notification', icon: Bell, color: 'blue' },
    { id: 'email', name: 'Send Email', icon: Mail, color: 'red' },
    { id: 'task', name: 'Create Task', icon: Check, color: 'green' },
    { id: 'webhook', name: 'Trigger Webhook', icon: Zap, color: 'purple' },
    { id: 'update_field', name: 'Update Field', icon: Edit2, color: 'amber' },
    { id: 'assign_user', name: 'Assign to User', icon: User, color: 'emerald' },
    { id: 'api_call', name: 'API Call', icon: Share2, color: 'indigo' },
    { id: 'sms', name: 'Send SMS', icon: MessageSquare, color: 'pink' },
    { id: 'slack', name: 'Send Slack Message', icon: MessageCircle, color: 'purple' },
    { id: 'approval', name: 'Request Approval', icon: Shield, color: 'orange' },
    { id: 'custom', name: 'Custom Script', icon: Code, color: 'gray' }
  ];

  // Helper function to create default escalation config
  const getDefaultEscalationConfig = () => ({
    enabled: true,
    trigger: 'after' as 'before' | 'on' | 'after',
    timeValue: 3,
    timeUnit: 'days' as 'minutes' | 'hours' | 'days',
    action: 'notification',
    assignTo: undefined as string | undefined
  });

  // Helper function to create default stage config
  const getDefaultStageConfig = () => ({
    allowedRoles: [] as string[],
    requiredFields: [] as string[],
    actions: [] as any[],
    conditions: [] as any[],
    escalation: undefined as any,
    entryActions: [] as any[],
    exitActions: [] as any[],
    timeoutActions: [] as any[],
    isDefault: false,
    canRevert: false,
    canSkip: false,
    requiresApproval: false,
    approvalRoles: [] as string[],
    approvalType: 'any' as 'any' | 'all' | 'sequential',
    maxRecords: undefined as number | undefined,
    permissions: [] as any[],
    states: [] as any[],
    outgoingTransitionEscalations: {} as Record<string, TransitionEscalationConfig>,
    status: ''
  });

  const updateTransition = (id: string, field: keyof FlowTransition | 'config.allowedRoles', value: any) => {
    const newTransitions = [...formData.transitions];
    const transitionIndex = newTransitions.findIndex(t => t.id === id);
    
    if (transitionIndex === -1) return;
    
    if (field === 'config.allowedRoles') {
      const currentConfig = newTransitions[transitionIndex].config || getDefaultTransitionConfig();
      const currentRoles = currentConfig.allowedRoles || [];
      
      if (currentRoles.includes(value)) {
        newTransitions[transitionIndex].config = {
          ...currentConfig,
          allowedRoles: currentRoles.filter(role => role !== value)
        };
      } else {
        newTransitions[transitionIndex].config = {
          ...currentConfig,
          allowedRoles: [...currentRoles, value]
        };
      }
    } else if (field.startsWith('config.')) {
      const configField = field.replace('config.', '');
      newTransitions[transitionIndex].config = {
        ...(newTransitions[transitionIndex].config || getDefaultTransitionConfig()),
        [configField]: value
      };
    } else {
      newTransitions[transitionIndex] = { ...newTransitions[transitionIndex], [field]: value };
    }
    
    setFormData(prev => ({ ...prev, transitions: newTransitions }));
  };

  // Helper function to create default transition config
  const getDefaultTransitionConfig = () => ({
    allowedRoles: [] as string[],
    delay: 0,
    actions: [] as any[],
    automaticDelay: 0,
    automaticDelayUnit: 'days' as 'minutes' | 'hours' | 'days',
    conditions: undefined as ConditionGroup | undefined,
    escalation: {
      enabled: false,
      trigger: 'after' as 'before' | 'on' | 'after',
      timeValue: 0,
      timeUnit: 'days' as 'minutes' | 'hours' | 'days',
      action: 'notification' as 'email' | 'notification' | 'task' | 'auto_assign' | 'auto_move' | 'custom',
      assignTo: undefined as string | undefined,
      notifyUsers: [] as string[],
      notifyRoles: [] as string[],
      messageTemplate: '',
      customActionId: undefined as string | undefined
    }
  });

  // Get default params for action type
  const getDefaultParamsForActionType = (actionType: string, stageName: string) => {
    switch (actionType) {
      case 'notification':
        return {
          title: `Record ${stageName}`,
          message: `Record has ${stageName.toLowerCase()}`,
          type: 'info',
          recipients: ['assigned_user', 'admin'],
          priority: 'medium'
        };
      case 'email':
        return {
          templateId: 'stage_notification',
          recipients: ['customer_email', 'assigned_user'],
          subject: `Update: ${stageName}`,
          variables: { stageName }
        };
      case 'task':
        return {
          title: `Follow-up for ${stageName}`,
          description: `Follow up on record in ${stageName} stage`,
          assignedTo: 'assigned_user',
          dueIn: 24,
          priority: 'medium'
        };
      case 'webhook':
        return {
          url: '',
          method: 'POST',
          headers: {},
          payload: { stage: stageName, action: 'entry' }
        };
      case 'update_field':
        return {
          field: 'status',
          value: stageName,
          condition: 'always'
        };
      case 'assign_user':
        return {
          assignTo: 'next_user_in_team',
          notify: true,
          reassignIfBusy: true
        };
      case 'api_call':
        return {
          endpoint: '',
          method: 'POST',
          headers: {},
          body: {},
          retryCount: 3
        };
      case 'sms':
        return {
          message: `Update: Record is now in ${stageName} stage`,
          recipients: ['customer_phone'],
          senderId: 'CRM'
        };
      case 'slack':
        return {
          channel: '#notifications',
          message: `:arrow_right: Record moved to *${stageName}*`,
          icon: ':office:'
        };
      case 'approval':
        return {
          approvers: ['manager', 'admin'],
          message: `Please approve record in ${stageName}`,
          timeout: 48
        };
      case 'custom':
        return {
          script: `// Custom action for ${stageName}`,
          variables: { stage: stageName }
        };
      default:
        return {};
    }
  };

  const handleAddTransitionEscalation = async (transitionId: string, stageId: string) => {
    
    try {
      const stage = formData.stages.find(s => s.id === stageId);
      if (!stage) {
        console.error('DEBUG: Stage not found:', stageId);
        return;
      }
      
      const transition = formData.transitions.find(t => t.id === transitionId);
      if (!transition) {
        console.error('DEBUG: Transition not found:', transitionId);
        return;
      }
      
      // Create default escalation config
      const escalationConfig: TransitionEscalationConfig = {
        enabled: true,
        trigger: 'after',
        timeValue: 3,
        timeUnit: 'days',
        action: 'notification',
        assignTo: undefined,
        notifyUsers: [],
        notifyRoles: ['admin', 'manager'],
        messageTemplate: '',
        customActionId: undefined
      };
      
      // Update transition config
      const updatedTransitions = formData.transitions.map(t => {
        if (t.id === transitionId) {
          const currentConfig = t.config || getDefaultTransitionConfig();
          return {
            ...t,
            config: {
              ...currentConfig,
              escalation: escalationConfig
            }
          };
        }
        return t;
      });
      
      // Update stage config to maintain consistency
      const updatedStages = formData.stages.map(s => {
        if (s.id === stageId) {
          const currentConfig = s.config || getDefaultStageConfig();
          return {
            ...s,
            config: {
              ...currentConfig,
              outgoingTransitionEscalations: {
                ...(currentConfig.outgoingTransitionEscalations || {}),
                [transitionId]: escalationConfig
              }
            }
          };
        }
        return s;
      });
      setFormData(prev => ({
        ...prev,
        stages: updatedStages,
        transitions: updatedTransitions
      }));
      
      // Select the transition to show escalation config in sidebar
      setSelectedTransition(transitionId);
      setSelectedStage(null);
      
      // Ensure sidebar is open
      if (!rightSidebarOpen) {
        setRightSidebarOpen(true);
      }
      
      // Force a re-render to ensure sidebar updates
      setTimeout(() => {
        setSelectedTransition(selectedTransition => transitionId);
      }, 50);
      
      showToast(`Added escalation to transition from ${stage.name}`, 'success');
      
    } catch (error) {
      console.error('DEBUG: Error in handleAddTransitionEscalation:', error);
      showToast('Failed to add escalation', 'error');
    }
  };

  // Function to fetch transitions from backend
  const fetchTransitionsFromBackend = async () => {
    try {
      // Example: const transitions = await transitionsService.getAllTransitions(formData.module);
      // This would populate your transitions from backend
      return [];
    } catch (error) {
      console.error('Error fetching transitions:', error);
      return [];
    }
  };

  // Helper function to add entry action with type selection
  const addEntryAction = (stageId: string, actionType?: string) => {
    const stage = formData.stages.find(s => s.id === stageId);
    if (!stage) return;

    const updatedStages = formData.stages.map(stage => {
      if (stage.id === stageId) {
        const currentConfig = stage.config || getDefaultStageConfig();
        return {
          ...stage,
          config: {
            ...currentConfig,
            entryActions: [
              ...(currentConfig.entryActions || []),
              {
                id: generateId(),
                actionType: actionType!,
                params: getDefaultParamsForActionType(actionType!, stage.name),
                conditions: [],
                enabled: true,
                order: (currentConfig.entryActions?.length || 0) + 1
              }
            ]
          }
        };
      }
      return stage;
    });
    
    setFormData(prev => ({ ...prev, stages: updatedStages }));
    showToast(`Added ${ACTION_TYPES.find(a => a.id === actionType)?.name || actionType} entry action`, 'success');
  };

  const addExitAction = (stageId: string, actionType?: string) => {
    const stage = formData.stages.find(s => s.id === stageId);
    if (!stage) return;

    const updatedStages = formData.stages.map(stage => {
      if (stage.id === stageId) {
        const currentConfig = stage.config || getDefaultStageConfig();
        return {
          ...stage,
          config: {
            ...currentConfig,
            exitActions: [
              ...(currentConfig.exitActions || []),
              {
                id: generateId(),
                actionType: actionType!,
                params: getDefaultParamsForActionType(actionType!, stage.name),
                conditions: [],
                enabled: true,
                order: (currentConfig.exitActions?.length || 0) + 1
              }
            ]
          }
        };
      }
      return stage;
    });
    
    setFormData(prev => ({ ...prev, stages: updatedStages }));
    showToast(`Added ${ACTION_TYPES.find(a => a.id === actionType)?.name || actionType} exit action`, 'success');
  };

  const showActionTypeSelector = (stageId: string, isEntryAction: boolean) => {
    setSelectedStageForAction(stageId);
    setIsEntryActionModal(isEntryAction);
    setActionModalOpen(true);
  };
const handleActionTypeSelected = (actionType: string) => {
  if (!selectedStageForAction) return;
  
  if (isEntryActionModal) {
    addEntryAction(selectedStageForAction, actionType);
  } else {
    addExitAction(selectedStageForAction, actionType);
  }
  
  setSelectedStageForAction(null);
};

  // Helper function to delete action
  const deleteAction = (stageId: string, actionType: 'entryActions' | 'exitActions', actionId: string) => {
    const updatedStages = formData.stages.map(stage => {
      if (stage.id === stageId && stage.config && stage.config[actionType]) {
        return {
          ...stage,
          config: {
            ...stage.config,
            [actionType]: stage.config[actionType]?.filter((action: any) => action.id !== actionId)
          }
        };
      }
      return stage;
    });
    
    setFormData(prev => ({ ...prev, stages: updatedStages }));
    showToast('Action removed', 'info');
  };

  // Helper function to update action params
  const updateAction = (stageId: string, actionType: 'entryActions' | 'exitActions', actionId: string, updates: any) => {
    const updatedStages = formData.stages.map(stage => {
      if (stage.id === stageId && stage.config && stage.config[actionType]) {
        return {
          ...stage,
          config: {
            ...stage.config,
            [actionType]: stage.config[actionType]?.map((action: any) => 
              action.id === actionId ? { ...action, ...updates } : action
            )
          }
        };
      }
      return stage;
    });
    
    setFormData(prev => ({ ...prev, stages: updatedStages }));
  };

  // Initialize transitions from backend on component mount
  useEffect(() => {
    if (currentStep === 'design' && formData.module) {
      fetchTransitionsFromBackend();
    }
  }, [currentStep, formData.module]);

  // Step 4: Design Workflow (Canvas)
const renderStepDesign = () => {

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Workflow Design</h1>
                <p className="text-sm text-gray-600">Drag and drop to design your workflow</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setZoomLevel(1)}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
              >
                Reset View
              </button>
              
              <button
                onClick={() => setIsConnecting(!isConnecting)}
                className={`px-3 py-1.5 rounded-lg font-medium ${isConnecting ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {isConnecting ? 'Connecting...' : 'Connect Mode'}
              </button>
              
              <button
                onClick={() => saveBlueprint(true)}
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

      {/* Main Content - Flow Builder */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - State Palette */}
        {leftSidebarOpen && (
          <div className="w-80 border-r border-gray-200 bg-white overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Available States</h2>
                <button
                  onClick={() => setLeftSidebarOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <PanelLeftClose className="h-4 w-4 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-3">
                {AVAILABLE_STATES.map((state) => {
                  const Icon = ICON_MAP[state.icon as keyof typeof ICON_MAP] || Settings;
                  const colorClass = COLOR_CLASSES[state.color as keyof typeof COLOR_CLASSES] || COLOR_CLASSES.blue;
                  
                  return (
                    <div
                      key={state.id}
                      draggable
                      onDragStart={(e) => handleDragStartFromPalette(e, state)}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-move transition-colors ${colorClass}`}
                    >
                      <div className="h-8 w-8 rounded-full bg-white/50 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{state.name}</div>
                        <div className="text-xs opacity-75 truncate">{state.description}</div>
                      </div>
                      <GripVertical className="h-4 w-4 flex-shrink-0 opacity-50" />
                    </div>
                  );
                })}
              </div>
              
              {/* Available Actions */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Available Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  {ACTION_TYPES.slice(0, 6).map((action) => {
                    const ActionIcon = action.icon;
                    return (
                      <div
                        key={action.id}
                        className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-center cursor-help"
                        title={action.name}
                      >
                        <div className={`h-8 w-8 mx-auto mb-1 rounded-full bg-${action.color}-100 flex items-center justify-center`}>
                          <ActionIcon className={`h-4 w-4 text-${action.color}-600`} />
                        </div>
                        <div className="text-xs text-gray-700 truncate">{action.name}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Drag stages to canvas, then add actions in sidebar
                </div>
              </div>
              
              {/* Escalation Configuration Quick View */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Escalation Settings</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                    <span>Purple arrows have escalations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-purple-600 flex items-center justify-center">
                      <span className="text-xs text-white">+</span>
                    </div>
                    <span>Click + to add escalation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-purple-600 flex items-center justify-center">
                      <span className="text-xs text-white">⏰</span>
                    </div>
                    <span>Click ⏰ to edit escalation</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col">
          {!leftSidebarOpen && (
            <button
              onClick={() => setLeftSidebarOpen(true)}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-white border border-gray-200 rounded-r-lg shadow-sm"
            >
              <PanelLeftOpen className="h-4 w-4 text-gray-500" />
            </button>
          )}
          
          {/* Canvas Container */}
          <div 
            ref={canvasRef}
            className="flex-1 relative overflow-auto bg-gradient-to-br from-gray-50 to-gray-100"
            onDrop={handleDropOnCanvas}
            onDragOver={(e) => e.preventDefault()}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{
              cursor: isPanning ? 'grabbing' : isConnecting ? 'crosshair' : 'default'
            }}
          >
            {/* Canvas Background Grid */}
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                  linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                `,
                backgroundSize: `${40 * zoomLevel}px ${40 * zoomLevel}px`,
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                transformOrigin: '0 0'
              }}
            >
              {/* Connection Lines SVG */}
              <svg
                ref={svgRef}
                className="absolute inset-0 pointer-events-none"
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                  transformOrigin: '0 0'
                }}
                width={2000}
                height={1200}
              >
                {/* Render only the connection lines and arrows in SVG */}
                {formData.transitions.map((transition) => {
                  const source = formData.stages.find(s => s.id === transition.sourceId);
                  const target = formData.stages.find(s => s.id === transition.targetId);
                  
                  if (!source || !target) return null;
                  
                  const { path, arrowX, arrowY, midX, midY } = calculateConnectionPath(source, target);
                  const sourceStage = formData.stages.find(s => s.id === transition.sourceId);
                  const stageEscalation = sourceStage?.config?.outgoingTransitionEscalations?.[transition.id];
                  const hasEscalation = transition.config?.escalation?.enabled || stageEscalation?.enabled;
                  
                  return (
                    <g key={transition.id}>
                      {/* Transition path */}
                      <path
                        d={path}
                        stroke={transition.type === 'automatic' ? '#10b981' : 
                              transition.type === 'conditional' ? '#f59e0b' :
                              hasEscalation ? '#8b5cf6' : '#3b82f6'}
                        strokeWidth={hasEscalation ? 3 : 2}
                        fill="none"
                        strokeDasharray={transition.type === 'automatic' ? '5,5' : 'none'}
                      />
                      
                      {/* Arrow head */}
                      <polygon
                        points={`${arrowX},${arrowY} ${arrowX - 8},${arrowY - 4} ${arrowX - 8},${arrowY + 4}`}
                        fill={transition.type === 'automatic' ? '#10b981' : 
                              transition.type === 'conditional' ? '#f59e0b' :
                              hasEscalation ? '#8b5cf6' : '#3b82f6'}
                      />
                      
                      {/* Transition label */}
                      {transition.label && (
                        <text
                          x={(source.position.x + source.size.width + target.position.x) / 2}
                          y={(source.position.y + target.position.y) / 2 - 20}
                          textAnchor="middle"
                          className={`text-xs font-medium pointer-events-none ${
                            hasEscalation ? 'fill-purple-700' : 'fill-gray-600'
                          }`}
                        >
                          {transition.label}
                        </text>
                      )}
                      
                      {/* Escalation time label if configured */}
                      {hasEscalation && (
                        <text
                          x={(source.position.x + source.size.width + target.position.x) / 2}
                          y={(source.position.y + target.position.y) / 2 + 25}
                          textAnchor="middle"
                          className="text-xs font-medium fill-purple-600 pointer-events-none"
                        >
                          {`${transition.config?.escalation?.timeValue || stageEscalation?.timeValue || 3} ${transition.config?.escalation?.timeUnit || stageEscalation?.timeUnit || 'days'}`}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                  transformOrigin: '0 0'
                }}
              >
                {formData.transitions.map((transition) => {
                  const source = formData.stages.find(s => s.id === transition.sourceId);
                  const target = formData.stages.find(s => s.id === transition.targetId);
                  
                  if (!source || !target) return null;
                  
                  const midX = (source.position.x + source.size.width + target.position.x) / 2;
                  const midY = (source.position.y + target.position.y) / 2;
                  
                  const sourceStage = formData.stages.find(s => s.id === transition.sourceId);
                  const stageEscalation = sourceStage?.config?.outgoingTransitionEscalations?.[transition.id];
                  const hasEscalation = transition.config?.escalation?.enabled || stageEscalation?.enabled;
                  
                  return (
                    <div
                      key={`plus-${transition.id}`}
                      className="absolute pointer-events-auto"
                      style={{
                        left: midX - 14,
                        top: midY - 14,
                      }}
                    >
                      {/* Plus/clock button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          
                          // Select the transition
                          setSelectedTransition(transition.id);
                          setSelectedStage(null);
                          
                          // Ensure sidebar is open
                          if (!rightSidebarOpen) {
                            setRightSidebarOpen(true);
                          }
                          
                          // Check if escalation already exists
                          if (!hasEscalation) {
                            handleAddTransitionEscalation(transition.id, transition.sourceId);
                          }
                        }}
                        className={`
                          flex items-center justify-center
                          w-8 h-8 rounded-full
                          border-2 border-white
                          shadow-md hover:scale-110 transition-transform
                          ${hasEscalation ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'}
                        `}
                        title={hasEscalation ? "Edit escalation" : "Add escalation"}
                      >
                        <span className="text-white text-xs font-bold">
                          {hasEscalation ? '⏰' : '+'}
                        </span>
                      </button>
                      
                      {/* Also make the entire transition line clickable */}
                      <div
                        className="absolute -left-8 -right-8 -top-8 -bottom-8 cursor-pointer opacity-0"
                        onClick={(e) => {
                          if (e.target === e.currentTarget) {
                            setSelectedTransition(transition.id);
                            setSelectedStage(null);
                            
                            if (!rightSidebarOpen) {
                              setRightSidebarOpen(true);
                            }
                          }
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Stages Container */}
              <div
                className="absolute"
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                  transformOrigin: '0 0'
                }}
              >
                {formData.stages.map((stage) => {
                  const Icon = ICON_MAP[stage.icon as keyof typeof ICON_MAP] || Settings;
                  const colorClass = COLOR_CLASSES[stage.color as keyof typeof COLOR_CLASSES] || COLOR_CLASSES.blue;
                  const isSelected = selectedStage === stage.id;
                  const isSource = connectionSource === stage.id;
                  const hasEntryActions = stage.config?.entryActions && stage.config.entryActions.length > 0;
                  const hasExitActions = stage.config?.exitActions && stage.config.exitActions.length > 0;
                  
                  return (
                    <div
                      key={stage.id}
                      className={`absolute border-2 rounded-xl shadow-lg transition-all ${colorClass} ${
                        isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                      } ${isSource ? 'ring-2 ring-green-500' : ''}`}
                      style={{
                        left: stage.position.x,
                        top: stage.position.y,
                        width: stage.size.width,
                        height: stage.size.height,
                        cursor: isConnecting ? 'crosshair' : 'move'
                      }}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/flow-stage-id', stage.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragEnd={(e) => {
                        if (!canvasRef.current) return;
                        
                        const rect = canvasRef.current.getBoundingClientRect();
                        const x = (e.clientX - rect.left - panOffset.x) / zoomLevel;
                        const y = (e.clientY - rect.top - panOffset.y) / zoomLevel;
                        
                        handleStageDrag(stage.id, x - stage.size.width / 2, y - stage.size.height / 2);
                      }}
                      onClick={() => {
                        if (isConnecting) {
                          if (connectionSource) {
                            handleCompleteConnection(stage.id);
                          } else {
                            handleStartConnection(stage.id);
                          }
                        } else {
                          setSelectedStage(stage.id);
                          setSelectedTransition(null);
                          
                          // OPEN THE SIDEBAR AUTOMATICALLY
                          if (!rightSidebarOpen) {
                            setRightSidebarOpen(true);
                          }
                          
                          // Force sidebar update
                          setTimeout(() => {
                            setSelectedStage(selectedStage => selectedStage);
                          }, 50);
                        }
                      }}
                    >
                      {/* Stage Content */}
                      <div className="p-3 h-full flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-6 w-6 rounded-full bg-white/50 flex items-center justify-center flex-shrink-0">
                            <Icon className="h-3 w-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{stage.name}</div>
                            {stage.status && (
                              <div className="text-xs opacity-75 truncate">
                                {stage.status.replace('_', ' ')}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Action indicators */}
                        {(hasEntryActions || hasExitActions) && (
                          <div className="flex gap-1 mb-2">
                            {hasEntryActions && (
                              <div className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                {stage.config!.entryActions!.length} entry
                              </div>
                            )}
                            {hasExitActions && (
                              <div className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                {stage.config!.exitActions!.length} exit
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Connection Points */}
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex gap-1">
                            <button
                              className="h-6 w-6 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-blue-50 hover:border-blue-400"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartConnection(stage.id);
                              }}
                              title="Create connection"
                            >
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          </div>
                          
                          <button
                            className="h-6 w-6 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-red-50 hover:border-red-400"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteElement(stage.id);
                            }}
                            title="Delete stage"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Canvas Controls Overlay */}
            <div className="absolute bottom-6 right-6 flex flex-col gap-2">
              <button
                onClick={() => setZoomLevel(1)}
                className="p-3 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50"
                title="Reset zoom"
              >
                <Target className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={() => {
                  const startStage = formData.stages.find(s => s.type === 'start');
                  if (startStage && canvasRef.current) {
                    const rect = canvasRef.current.getBoundingClientRect();
                    setPanOffset({
                      x: rect.width / 2 - startStage.position.x * zoomLevel - 60,
                      y: rect.height / 2 - startStage.position.y * zoomLevel - 40
                    });
                  }
                }}
                className="p-3 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50"
                title="Center view"
              >
                <Eye className="h-5 w-5 text-gray-600" />
              </button>
              <div className="p-3 bg-white rounded-lg shadow-lg border border-gray-200">
                <div className="text-xs text-gray-600 text-center">Zoom</div>
                <div className="text-sm font-medium text-center">{Math.round(zoomLevel * 100)}%</div>
              </div>
            </div>
            
            {/* Status Bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-white/90 border-t border-gray-200 px-4 py-2">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div>
                  {isConnecting ? (
                    <span className="text-blue-600 font-medium">
                      {connectionSource 
                        ? `Connecting from ${formData.stages.find(s => s.id === connectionSource)?.name} - Click target stage`
                        : 'Click on a stage to start connection'}
                    </span>
                  ) : (
                    <span>
                      {formData.stages.length} stages • {formData.transitions.length} connections • 
                      <span className="ml-2 text-purple-600">
                        {formData.transitions.filter(t => 
                          t.config?.escalation?.enabled || 
                          formData.stages.find(s => s.id === t.sourceId)?.config?.outgoingTransitionEscalations?.[t.id]?.enabled
                        ).length} escalations
                      </span>
                      <span className="ml-4 text-blue-600">
                        {formData.stages.filter(s => s.config?.entryActions && s.config.entryActions.length > 0).length} stages with entry actions
                      </span>
                      <span className="ml-4 text-green-600">
                        {formData.stages.filter(s => s.config?.exitActions && s.config.exitActions.length > 0).length} stages with exit actions
                      </span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                    <span className="text-xs">Escalation</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">
                      Drag: {panOffset.x.toFixed(0)}, {panOffset.y.toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Configuration */}
        {rightSidebarOpen && (
          <div className="w-96 border-l border-gray-200 bg-white overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedStage ? 'Stage Configuration' : 
                  selectedTransition ? (
                    (() => {
                      const transition = formData.transitions.find(t => t.id === selectedTransition);
                      const sourceStage = transition ? formData.stages.find(s => s.id === transition.sourceId) : null;
                      const targetStage = transition ? formData.stages.find(s => s.id === transition.targetId) : null;
                      return `Transition: ${sourceStage?.name || 'Unknown'} → ${targetStage?.name || 'Unknown'}`;
                    })()
                  ) : 
                  'Blueprint Info'}
                </h2>
                <button
                  onClick={() => setRightSidebarOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <PanelRightClose className="h-4 w-4 text-gray-500" />
                </button>
              </div>
              
              {selectedStage ? (
                (() => {
                  const stage = formData.stages.find(s => s.id === selectedStage);
                  if (!stage) return null;
                  
                  return (
                    <div className="space-y-6">
                      {/* Stage Info */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Stage Name
                        </label>
                        <input
                          type="text"
                          value={stage.name}
                          onChange={(e) => updateStage(stage.id, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={stage.description || ''}
                          onChange={(e) => updateStage(stage.id, 'description', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      {/* Status */}
                      {stage.type === 'stage' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                          </label>
                          <select
                            value={stage.status || ''}
                            onChange={(e) => updateStage(stage.id, 'status', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select Status</option>
                            <option value="new">New</option>
                            <option value="prospecting">Prospecting</option>
                            <option value="appointment_scheduled">Appointment Scheduled</option>
                            <option value="qualified">Qualified</option>
                            <option value="lost">Lost</option>
                          </select>
                        </div>
                      )}
                      
                      {/* Allowed Roles */}
                      {stage.type === 'stage' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Allowed Roles
                          </label>
                          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                            {roleOptions.map(role => (
                              <label key={role.id} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={stage.config?.allowedRoles?.includes(role.id) || false}
                                  onChange={() => updateStage(stage.id, 'config.allowedRoles', role.id)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">{role.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* ENTRY ACTIONS SECTION */}
                      {stage.type === 'stage' && (
                        <div className="border-t border-gray-200 pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium text-gray-900">Entry Actions</h3>
                            <div className="relative group">
                              <button
                                onClick={() => showActionTypeSelector(stage.id, true)}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                              >
                                <Plus className="h-3 w-3" />
                                Add Entry Action
                              </button>
                              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 hidden group-hover:block">
                                <div className="p-2">
                                  <div className="text-xs font-medium text-gray-700 mb-1">Select Action Type:</div>
                                  {ACTION_TYPES.map(action => {
                                    const ActionIcon = action.icon;
                                    return (
                                      <button
                                        key={action.id}
                                        onClick={() => addEntryAction(stage.id, action.id)}
                                        className="w-full text-left px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded flex items-center gap-2"
                                      >
                                        <div className={`h-5 w-5 rounded-full bg-${action.color}-100 flex items-center justify-center flex-shrink-0`}>
                                          <ActionIcon className={`h-3 w-3 text-${action.color}-600`} />
                                        </div>
                                        <span>{action.name}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {(stage.config?.entryActions || []).length === 0 ? (
                            <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                              <p className="text-sm text-gray-500">No entry actions</p>
                              <p className="text-xs text-gray-400 mt-1">
                                Actions run when record enters this stage
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {(stage.config?.entryActions || []).map((action, index) => {
                                const actionType = ACTION_TYPES.find(a => a.id === action.actionType);
                                const ActionIcon = actionType?.icon || Settings;
                                
                                return (
                                  <div key={action.id || index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <div className={`h-6 w-6 rounded-full bg-${actionType?.color || 'blue'}-100 flex items-center justify-center`}>
                                          <ActionIcon className={`h-3 w-3 text-${actionType?.color || 'blue'}-600`} />
                                        </div>
                                        <div>
                                          <div className="text-xs font-medium text-blue-700">
                                            {actionType?.name || action.actionType}
                                          </div>
                                          <div className="text-xs text-blue-600">
                                            Order: {action.order || index + 1}
                                          </div>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => deleteAction(stage.id, 'entryActions', action.id)}
                                        className="text-xs text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                    <div className="text-xs text-blue-600 mb-2">
                                      <pre className="whitespace-pre-wrap text-xs">
                                        {JSON.stringify(action.params, null, 2)}
                                      </pre>
                                    </div>
                                    <button
                                      onClick={() => {
                                        const newParams = prompt('Edit params (JSON format):', JSON.stringify(action.params, null, 2));
                                        if (newParams) {
                                          try {
                                            const parsedParams = JSON.parse(newParams);
                                            updateAction(stage.id, 'entryActions', action.id, { params: parsedParams });
                                            showToast('Action updated', 'success');
                                          } catch (error) {
                                            showToast('Invalid JSON format', 'error');
                                          }
                                        }
                                      }}
                                      className="text-xs text-blue-700 hover:text-blue-800"
                                    >
                                      Edit Action
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* EXIT ACTIONS SECTION */}
                      {stage.type === 'stage' && (
                        <div className="border-t border-gray-200 pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium text-gray-900">Exit Actions</h3>
                            <div className="relative group">
                              <button
                                onClick={() => showActionTypeSelector(stage.id, false)}
                                className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium"
                              >
                                <Plus className="h-3 w-3" />
                                Add Exit Action
                              </button>
                              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 hidden group-hover:block">
                                <div className="p-2">
                                  <div className="text-xs font-medium text-gray-700 mb-1">Select Action Type:</div>
                                  {ACTION_TYPES.map(action => {
                                    const ActionIcon = action.icon;
                                    return (
                                      <button
                                        key={action.id}
                                        onClick={() => addExitAction(stage.id, action.id)}
                                        className="w-full text-left px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded flex items-center gap-2"
                                      >
                                        <div className={`h-5 w-5 rounded-full bg-${action.color}-100 flex items-center justify-center flex-shrink-0`}>
                                          <ActionIcon className={`h-3 w-3 text-${action.color}-600`} />
                                        </div>
                                        <span>{action.name}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {(stage.config?.exitActions || []).length === 0 ? (
                            <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                              <p className="text-sm text-gray-500">No exit actions</p>
                              <p className="text-xs text-gray-400 mt-1">
                                Actions run when record exits this stage
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {(stage.config?.exitActions || []).map((action, index) => {
                                const actionType = ACTION_TYPES.find(a => a.id === action.actionType);
                                const ActionIcon = actionType?.icon || Settings;
                                
                                return (
                                  <div key={action.id || index} className="p-3 bg-green-50 rounded-lg border border-green-200">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <div className={`h-6 w-6 rounded-full bg-${actionType?.color || 'green'}-100 flex items-center justify-center`}>
                                          <ActionIcon className={`h-3 w-3 text-${actionType?.color || 'green'}-600`} />
                                        </div>
                                        <div>
                                          <div className="text-xs font-medium text-green-700">
                                            {actionType?.name || action.actionType}
                                          </div>
                                          <div className="text-xs text-green-600">
                                            Order: {action.order || index + 1}
                                          </div>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => deleteAction(stage.id, 'exitActions', action.id)}
                                        className="text-xs text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                    <div className="text-xs text-green-600 mb-2">
                                      <pre className="whitespace-pre-wrap text-xs">
                                        {JSON.stringify(action.params, null, 2)}
                                      </pre>
                                    </div>
                                    <button
                                      onClick={() => {
                                        const newParams = prompt('Edit params (JSON format):', JSON.stringify(action.params, null, 2));
                                        if (newParams) {
                                          try {
                                            const parsedParams = JSON.parse(newParams);
                                            updateAction(stage.id, 'exitActions', action.id, { params: parsedParams });
                                            showToast('Action updated', 'success');
                                          } catch (error) {
                                            showToast('Invalid JSON format', 'error');
                                          }
                                        }
                                      }}
                                      className="text-xs text-green-700 hover:text-green-800"
                                    >
                                      Edit Action
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Stage Escalations */}
                      {stage.config?.outgoingTransitionEscalations && Object.keys(stage.config.outgoingTransitionEscalations).length > 0 && (
                        <div className="pt-4 border-t border-gray-200">
                          <h3 className="text-sm font-medium text-gray-900 mb-3">Outgoing Escalations</h3>
                          <div className="space-y-2">
                            {Object.entries(stage.config.outgoingTransitionEscalations).map(([transitionId, escalation]) => {
                              const transition = formData.transitions.find(t => t.id === transitionId);
                              const targetStage = transition ? formData.stages.find(s => s.id === transition.targetId) : null;
                              
                              return (
                                <div key={transitionId} className="p-2 bg-purple-50 rounded-lg border border-purple-200">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="text-xs font-medium text-purple-700">
                                        To: {targetStage?.name || 'Unknown'}
                                      </div>
                                      <div className="text-xs text-purple-600">
                                        {escalation.timeValue} {escalation.timeUnit} {escalation.trigger}
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => {
                                        const updatedStages = formData.stages.map(s => {
                                          if (s.id === stage.id && s.config.outgoingTransitionEscalations) {
                                            const { [transitionId]: _, ...otherEscalations } = s.config.outgoingTransitionEscalations;
                                            return {
                                              ...s,
                                              config: {
                                                ...s.config,
                                                outgoingTransitionEscalations: otherEscalations
                                              }
                                            };
                                          }
                                          return s;
                                        });
                                        setFormData(prev => ({ ...prev, stages: updatedStages }));
                                      }}
                                      className="p-1 hover:bg-purple-100 rounded"
                                    >
                                      <Trash2 className="h-3 w-3 text-purple-600" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteElement(stage.id)}
                        className="w-full py-2.5 bg-red-100 text-red-600 rounded-lg font-medium hover:bg-red-200"
                      >
                        Delete Stage
                      </button>
                    </div>
                  );
                })()
              ) : selectedTransition ? (
                (() => {
                  const transition = formData.transitions.find(t => t.id === selectedTransition);
                  if (!transition) {
                    return (
                      <div className="text-center py-8">
                        <p className="text-gray-600">Transition not found</p>
                        <button
                          onClick={() => setSelectedTransition(null)}
                          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
                        >
                          Back
                        </button>
                      </div>
                    );
                  }
                  
                  const sourceStage = formData.stages.find(s => s.id === transition.sourceId);
                  const targetStage = formData.stages.find(s => s.id === transition.targetId);
                  const stageEscalation = sourceStage?.config?.outgoingTransitionEscalations?.[selectedTransition];
                  const hasEscalation = transition.config?.escalation?.enabled || stageEscalation?.enabled;
                  
                  return (
                    <div className="space-y-6">
                      {/* Transition Header - Always show even if no escalation */}
                      <div className={`p-4 rounded-lg border ${
                        hasEscalation ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'
                      }`}>
                        <div className={`text-sm ${hasEscalation ? 'text-purple-700' : 'text-blue-700'}`}>
                          <div className="font-medium mb-1">Connection:</div>
                          <div className="flex items-center justify-between">
                            <span>{sourceStage?.name || 'Unknown'} → {targetStage?.name || 'Unknown'}</span>
                            {hasEscalation && (
                              <span className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                                <Clock className="h-3 w-3" />
                                Escalation
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Always show basic transition settings */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Label
                        </label>
                        <input
                          type="text"
                          value={transition.label || ''}
                          onChange={(e) => {
                            const newTransitions = [...formData.transitions];
                            const index = newTransitions.findIndex(t => t.id === transition.id);
                            newTransitions[index].label = e.target.value;
                            setFormData(prev => ({ ...prev, transitions: newTransitions }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., Contact Made → Qualify"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Transition Type
                        </label>
                        <select
                          value={transition.type}
                          onChange={(e) => {
                            const newTransitions = [...formData.transitions];
                            const index = newTransitions.findIndex(t => t.id === transition.id);
                            newTransitions[index].type = e.target.value as any;
                            setFormData(prev => ({ ...prev, transitions: newTransitions }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="manual">Manual (User triggered)</option>
                          <option value="automatic">Automatic (Time-based)</option>
                          <option value="conditional">Conditional (Rule-based)</option>
                          <option value="parallel">Parallel (Multiple paths)</option>
                        </select>
                      </div>
                      
                      {/* Escalation Configuration Section - Always show, even if empty */}
                      <div className="border-t border-gray-200 pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-medium text-gray-900">Escalation Settings</h3>
                          <button
                            onClick={async () => {
                              try {
                                await handleAddTransitionEscalation(transition.id, transition.sourceId);
                              } catch (error) {
                                console.error('Error adding escalation:', error);
                              }
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                          >
                            <Plus className="h-3 w-3" />
                            {hasEscalation ? 'Edit Escalation' : 'Add Escalation'}
                          </button>
                        </div>
                        
                        {hasEscalation ? (
                          <div className="space-y-4">
                            {/* Enable/Disable Toggle */}
                            <div className="flex items-center justify-between">
                              <label className="text-sm text-gray-700">Enable Escalation</label>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={stageEscalation?.enabled ?? transition.config?.escalation?.enabled ?? true}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    const updatedTransitions = formData.transitions.map(t => {
                                      if (t.id === transition.id) {
                                        const currentConfig = t.config || getDefaultTransitionConfig();
                                        return {
                                          ...t,
                                          config: {
                                            ...currentConfig,
                                            escalation: {
                                              ...(currentConfig.escalation || {
                                                enabled: true,
                                                trigger: 'after',
                                                timeValue: 3,
                                                timeUnit: 'days',
                                                action: 'notification',
                                                assignTo: undefined,
                                                notifyUsers: [],
                                                notifyRoles: ['admin'],
                                                messageTemplate: ''
                                              }),
                                              enabled: checked
                                            }
                                          }
                                        };
                                      }
                                      return t;
                                    });
                                    
                                    // Also update stage config if it exists
                                    const updatedStages = formData.stages.map(s => {
                                      if (s.id === sourceStage?.id && s.config?.outgoingTransitionEscalations?.[transition.id]) {
                                        const updatedEscalations = {
                                          ...s.config.outgoingTransitionEscalations,
                                          [transition.id]: {
                                            ...s.config.outgoingTransitionEscalations[transition.id],
                                            enabled: checked
                                          }
                                        };
                                        return {
                                          ...s,
                                          config: {
                                            ...s.config,
                                            outgoingTransitionEscalations: updatedEscalations
                                          }
                                        };
                                      }
                                      return s;
                                    });
                                    
                                    setFormData(prev => ({
                                      ...prev,
                                      transitions: updatedTransitions,
                                      stages: updatedStages
                                    }));
                                  }}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                              </label>
                            </div>
                            
                            {/* Time Configuration */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Trigger
                                </label>
                                <select
                                  value={stageEscalation?.trigger || transition.config?.escalation?.trigger || 'after'}
                                  onChange={(e) => {
                                    const updatedTransitions = formData.transitions.map(t => {
                                      if (t.id === transition.id) {
                                        const currentConfig = t.config || getDefaultTransitionConfig();
                                        return {
                                          ...t,
                                          config: {
                                            ...currentConfig,
                                            escalation: {
                                              ...(currentConfig.escalation || getDefaultEscalationConfig()),
                                              trigger: e.target.value as 'before' | 'on' | 'after'
                                            }
                                          }
                                        };
                                      }
                                      return t;
                                    });
                                    
                                    const updatedStages = formData.stages.map(s => {
                                      if (s.id === sourceStage?.id && s.config.outgoingTransitionEscalations?.[transition.id]) {
                                        return {
                                          ...s,
                                          config: {
                                            ...s.config,
                                            outgoingTransitionEscalations: {
                                              ...s.config.outgoingTransitionEscalations,
                                              [transition.id]: {
                                                ...s.config.outgoingTransitionEscalations[transition.id],
                                                trigger: e.target.value as 'before' | 'on' | 'after'
                                              }
                                            }
                                          }
                                        };
                                      }
                                      return s;
                                    });
                                    
                                    setFormData(prev => ({
                                      ...prev,
                                      transitions: updatedTransitions,
                                      stages: updatedStages
                                    }));
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                                >
                                  {ESCALATION_TRIGGERS.map(trigger => (
                                    <option key={trigger.id} value={trigger.id}>
                                      {trigger.name}
                                    </option>
                                  ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                  {ESCALATION_TRIGGERS.find(t => t.id === (stageEscalation?.trigger || transition.config?.escalation?.trigger || 'after'))?.description}
                                </p>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Time
                                  </label>
                                  <input
                                    type="number"
                                    value={stageEscalation?.timeValue || transition.config?.escalation?.timeValue || 3}
                                    onChange={(e) => {
                                      const value = parseInt(e.target.value) || 0;
                                      const updatedTransitions = formData.transitions.map(t => {
                                        if (t.id === transition.id) {
                                          const currentConfig = t.config || getDefaultTransitionConfig();
                                          return {
                                            ...t,
                                            config: {
                                              ...currentConfig,
                                              escalation: {
                                                ...(currentConfig.escalation || getDefaultEscalationConfig()),
                                                timeValue: value
                                              }
                                            }
                                          };
                                        }
                                        return t;
                                      });
                                      
                                      const updatedStages = formData.stages.map(s => {
                                        if (s.id === sourceStage?.id && s.config.outgoingTransitionEscalations?.[transition.id]) {
                                          return {
                                            ...s,
                                            config: {
                                              ...s.config,
                                              outgoingTransitionEscalations: {
                                                ...s.config.outgoingTransitionEscalations,
                                                [transition.id]: {
                                                  ...s.config.outgoingTransitionEscalations[transition.id],
                                                  timeValue: value
                                                }
                                              }
                                            }
                                          };
                                        }
                                        return s;
                                      });
                                      
                                      setFormData(prev => ({
                                        ...prev,
                                        transitions: updatedTransitions,
                                        stages: updatedStages
                                      }));
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                                    min="0"
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Unit
                                  </label>
                                  <select
                                    value={stageEscalation?.timeUnit || transition.config?.escalation?.timeUnit || 'days'}
                                    onChange={(e) => {
                                      const updatedTransitions = formData.transitions.map(t => {
                                        if (t.id === transition.id) {
                                          const currentConfig = t.config || getDefaultTransitionConfig();
                                          return {
                                            ...t,
                                            config: {
                                              ...currentConfig,
                                              escalation: {
                                                ...(currentConfig.escalation || getDefaultEscalationConfig()),
                                                timeUnit: e.target.value as 'minutes' | 'hours' | 'days'
                                              }
                                            }
                                          };
                                        }
                                        return t;
                                      });
                                      
                                      const updatedStages = formData.stages.map(s => {
                                        if (s.id === sourceStage?.id && s.config.outgoingTransitionEscalations?.[transition.id]) {
                                          return {
                                            ...s,
                                            config: {
                                              ...s.config,
                                              outgoingTransitionEscalations: {
                                                ...s.config.outgoingTransitionEscalations,
                                                [transition.id]: {
                                                  ...s.config.outgoingTransitionEscalations[transition.id],
                                                  timeUnit: e.target.value as 'minutes' | 'hours' | 'days'
                                                }
                                              }
                                            }
                                          };
                                        }
                                        return s;
                                      });
                                      
                                      setFormData(prev => ({
                                        ...prev,
                                        transitions: updatedTransitions,
                                        stages: updatedStages
                                      }));
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                                  >
                                    {TIME_UNITS.map(unit => (
                                      <option key={unit.id} value={unit.id}>
                                        {unit.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                            
                            {/* Action Configuration */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Escalation Action
                              </label>
                              <select
                                value={stageEscalation?.action || transition.config?.escalation?.action || 'notification'}
                                onChange={(e) => {
                                  const updatedTransitions = formData.transitions.map(t => {
                                    if (t.id === transition.id) {
                                      const currentConfig = t.config || getDefaultTransitionConfig();
                                      return {
                                        ...t,
                                        config: {
                                          ...currentConfig,
                                          escalation: {
                                            ...(currentConfig.escalation || getDefaultEscalationConfig()),
                                            action: e.target.value
                                          }
                                        }
                                      };
                                    }
                                    return t;
                                  });
                                  
                                  const updatedStages = formData.stages.map(s => {
                                    if (s.id === sourceStage?.id && s.config.outgoingTransitionEscalations?.[transition.id]) {
                                      return {
                                        ...s,
                                        config: {
                                          ...s.config,
                                          outgoingTransitionEscalations: {
                                            ...s.config.outgoingTransitionEscalations,
                                            [transition.id]: {
                                              ...s.config.outgoingTransitionEscalations[transition.id],
                                              action: e.target.value as TransitionEscalationConfig['action']
                                            }
                                          }
                                        }
                                      };
                                    }
                                    return s;
                                  });
                                  
                                  setFormData(prev => ({
                                    ...prev,
                                    transitions: updatedTransitions,
                                    stages: updatedStages
                                  }));
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                              >
                                {ESCALATION_ACTIONS.map(action => {
                                  const ActionIcon = action.icon;
                                  return (
                                    <option key={action.id} value={action.id}>
                                      {action.name}
                                    </option>
                                  );
                                })}
                              </select>
                            </div>
                            
                            {/* Notify Roles */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Notify Roles
                              </label>
                              <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                                {roleOptions.map(role => (
                                  <label key={role.id} className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={stageEscalation?.notifyRoles?.includes(role.id) || 
                                              (stageEscalation?.notifyRoles?.length === 0 && role.id === 'admin') || 
                                              transition.config?.escalation?.assignTo === role.id}
                                      onChange={(e) => {
                                        const currentRoles = stageEscalation?.notifyRoles || ['admin'];
                                        let newRoles: string[];
                                        
                                        if (e.target.checked) {
                                          newRoles = [...currentRoles, role.id];
                                        } else {
                                          newRoles = currentRoles.filter(r => r !== role.id);
                                        }
                                        
                                        const updatedStages = formData.stages.map(s => {
                                          if (s.id === sourceStage?.id && s.config.outgoingTransitionEscalations?.[transition.id]) {
                                            return {
                                              ...s,
                                              config: {
                                                ...s.config,
                                                outgoingTransitionEscalations: {
                                                  ...s.config.outgoingTransitionEscalations,
                                                  [transition.id]: {
                                                    ...s.config.outgoingTransitionEscalations[transition.id],
                                                    notifyRoles: newRoles
                                                  }
                                                }
                                              }
                                            };
                                          }
                                          return s;
                                        });
                                        
                                        setFormData(prev => ({
                                          ...prev,
                                          stages: updatedStages
                                        }));
                                      }}
                                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                    />
                                    <span className="text-sm text-gray-700">{role.name}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            
                            {/* Remove Escalation Button */}
                            <button
                              onClick={() => {
                                // Remove escalation from stage config
                                const updatedStages = formData.stages.map(s => {
                                  if (s.id === sourceStage?.id && s.config.outgoingTransitionEscalations) {
                                    const { [transition.id]: _, ...otherEscalations } = s.config.outgoingTransitionEscalations;
                                    return {
                                      ...s,
                                      config: {
                                        ...s.config,
                                        outgoingTransitionEscalations: otherEscalations
                                      }
                                    };
                                  }
                                  return s;
                                });
                                
                                // Remove escalation from transition config
                                const updatedTransitions = formData.transitions.map(t => {
                                  if (t.id === transition.id && t.config) {
                                    const { escalation: _, ...otherConfig } = t.config;
                                    return {
                                      ...t,
                                      config: otherConfig
                                    };
                                  }
                                  return t;
                                });
                                
                                setFormData(prev => ({
                                  ...prev,
                                  stages: updatedStages,
                                  transitions: updatedTransitions
                                }));
                                
                                showToast('Escalation removed from transition', 'info');
                              }}
                              className="w-full py-2.5 bg-red-100 text-red-600 rounded-lg font-medium hover:bg-red-200 mt-4"
                            >
                              Remove Escalation
                            </button>
                          </div>
                        ) : (
                          <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                            <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">No escalation configured</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Click "Add Escalation" to configure escalation rules
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Delete Transition Button */}
                      <button
                        onClick={() => handleDeleteElement(transition.id)}
                        className="w-full py-2.5 bg-red-100 text-red-600 rounded-lg font-medium hover:bg-red-200"
                      >
                        Delete Transition
                      </button>
                    </div>
                  );
                })()
              ) : (
                // Blueprint Info (when nothing is selected)
                <div className="space-y-6">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-700">
                      <div className="font-medium mb-2">Instructions:</div>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <GripVertical className="h-3 w-3 text-blue-600" />
                          </div>
                          <span>Drag states from the sidebar onto the canvas</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <Link2 className="h-3 w-3 text-green-600" />
                          </div>
                          <span>Click connection points to link stages together</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <Plus className="h-3 w-3 text-purple-600" />
                          </div>
                          <span>Click + on arrows to add escalation rules</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <Clock className="h-3 w-3 text-amber-600" />
                          </div>
                          <span>Click ⏰ on arrows to edit escalation rules</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <ArrowRight className="h-3 w-3 text-blue-600" />
                          </div>
                          <span>Click on stages to configure entry/exit actions</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Flow Summary</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Blueprint Name:</span>
                        <span className="font-medium">{formData.name || 'Untitled'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Module:</span>
                        <span className="font-medium">
                          {moduleOptions.find(m => m.id === formData.module)?.name || 'Not selected'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Total Stages:</span>
                        <span className="font-medium">{formData.stages.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Total Transitions:</span>
                        <span className="font-medium">{formData.transitions.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Escalations:</span>
                        <span className="font-medium text-purple-600">
                          {formData.transitions.filter(t => 
                            t.config?.escalation?.enabled || 
                            formData.stages.find(s => s.id === t.sourceId)?.config?.outgoingTransitionEscalations?.[t.id]?.enabled
                          ).length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Stages with Entry Actions:</span>
                        <span className="font-medium text-blue-600">
                          {formData.stages.filter(s => s.config?.entryActions && s.config.entryActions.length > 0).length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Stages with Exit Actions:</span>
                        <span className="font-medium text-green-600">
                          {formData.stages.filter(s => s.config?.exitActions && s.config.exitActions.length > 0).length}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Tip</h4>
                    <p className="text-sm text-blue-700">
                      Configure entry actions to run when records enter a stage, and exit actions to run when they leave.
                      Set escalations on transitions to automatically notify users when records stay too long in a state.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {!rightSidebarOpen && (
          <button
            onClick={() => setRightSidebarOpen(true)}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-white border border-gray-200 rounded-l-lg shadow-sm"
          >
            <PanelRightOpen className="h-4 w-4 text-gray-500" />
          </button>
        )}
      </div>
    </div>
  );
};

  // Step 5: Preview
  const renderStepPreview = () => (
    <div className="max-w-6xl mx-auto py-8">
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
                  <span className="text-sm text-gray-600">Total Transitions:</span>
                  <span className="font-medium">{formData.transitions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Field Dependencies:</span>
                  <span className="font-medium">{formData.fieldDependencies.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Criteria Rules:</span>
                  <span className="font-medium">
                    {formData.criteria?.conditions?.length || 0}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active:</span>
                  <span className={`font-medium ${formData.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                    {formData.isActive ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Default:</span>
                  <span className={`font-medium ${formData.isDefault ? 'text-blue-600' : 'text-gray-600'}`}>
                    {formData.isDefault ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Version:</span>
                  <span className="font-medium">{formData.version}</span>
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
                onClick={() => saveBlueprint(true)}
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
                onClick={() => saveBlueprint(false)}
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
                  Review all stages, transitions, and configurations carefully. Once published, 
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
              <button
                onClick={() => saveBlueprint(true)}
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
      <div className="flex-1 overflow-auto">
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
                  onClick={() => saveBlueprint(false)}
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

      <ActionTypeModal
        isOpen={actionModalOpen}
        onClose={() => {
          setActionModalOpen(false);
          setSelectedStageForAction(null);
        }}
        onSelect={handleActionTypeSelected}
        title={isEntryActionModal ? "Add Entry Action" : "Add Exit Action"}
        isEntryAction={isEntryActionModal}
      />
    </div>
  );
}
