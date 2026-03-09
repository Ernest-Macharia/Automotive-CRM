'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Zap,
  Plus,
  Play,
  Pause,
  Edit,
  Trash2,
  Filter,
  Search,
  Users,
  Mail,
  Calendar,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Download,
  RefreshCw,
  X,
  Clock,
  Layers,
  Activity,
  Bell,
  MoreVertical
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { workflowService, Workflow } from '@/services/settings/workflowService';

// ✨ Keep your clean skeletons
const WorkflowCardSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse shadow-sm">
    <div className="flex gap-4">
      <div className="h-5 w-5 bg-blue-100 rounded mt-1"></div>
      <div className="flex-1 space-y-3">
        <div className="h-5 w-1/3 bg-gray-200 rounded"></div>
        <div className="flex gap-2">
          <div className="h-5 w-20 bg-gray-200 rounded-full"></div>
          <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
        </div>
        <div className="h-4 w-full bg-gray-200 rounded"></div>
        <div className="flex justify-between">
          <div className="h-4 w-1/4 bg-gray-200 rounded"></div>
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={`skeleton-${i}`} className="h-8 w-8 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const StatsSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
    {[1, 2, 3, 4].map((i) => (
      <div key={`stat-skeleton-${i}`} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm animate-pulse">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
            <div className="h-6 w-12 bg-gray-200 rounded"></div>
          </div>
          <div className="h-10 w-10 bg-blue-100 rounded-lg"></div>
        </div>
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="h-3 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    ))}
  </div>
);

// ✅ Component for each workflow with independent state
const WorkflowCard = ({ 
  workflow, 
  isExpanded, 
  onToggleExpand,
  onViewDetails,
  onEdit,
  onToggleStatus,
  onTest,
  onExecute,
  onDelete,
  isSelected,
  onSelect,
  isMenuOpen, // ✅ Changed from expandedRow to isMenuOpen
  onToggleMenu // ✅ Changed from setExpandedRow to onToggleMenu
}: {
  workflow: Workflow;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onViewDetails: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
  onTest: () => void;
  onExecute: () => void;
  onDelete: () => void;
  isSelected: boolean;
  onSelect: () => void;
  isMenuOpen: boolean; // ✅ Changed: boolean instead of string|null
  onToggleMenu: () => void; // ✅ Changed: simpler toggle function
}) => {
  const getTriggerIcon = (trigger: string) => {
    const icons: Record<string, any> = {
      onCreate: Plus,
      onUpdate: Edit,
      onDelete: Trash2,
      scheduled: Clock,
      fieldUpdate: Activity,
      stageChange: Layers,
    };
    return icons[trigger] || Zap;
  };
  
  const TriggerIcon = getTriggerIcon(workflow.triggerEvent);
  const getModuleColor = (module: string) => {
    const colors: Record<string, string> = {
      opportunities: 'bg-blue-100 text-blue-800',
      leads: 'bg-green-100 text-green-800',
      quotes: 'bg-purple-100 text-purple-800',
      invoices: 'bg-amber-100 text-amber-800',
      accounts: 'bg-cyan-100 text-cyan-800',
      contacts: 'bg-pink-100 text-pink-800',
      payments: 'bg-emerald-100 text-emerald-800',
    };
    return colors[module] || 'bg-gray-100 text-gray-800';
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'sendEmail': return Mail;
      case 'sendNotification': return Bell;
      case 'createTask': return Calendar;
      case 'assignToUser': return Users;
      default: return Zap;
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(`.menu-container-${workflow.id}`)) {
        if (isMenuOpen) {
          onToggleMenu();
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [workflow.id, isMenuOpen, onToggleMenu]);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex gap-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="mt-1 h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            aria-label={`Select ${workflow.name}`}
          />

          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{workflow.name}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${getModuleColor(workflow.module)}`}>
                    {workflow.module}
                  </span>
                  <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                    workflow.active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {workflow.active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <TriggerIcon className="h-4 w-4" />
                    {workflow.triggerEvent.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
              </div>

              {/* ✅ PRIMARY ACTIONS + KEBAB MENU */}
              <div className="flex items-center gap-2">
                {/* Edit */}
                <button
                  onClick={onEdit}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <Edit className="h-4 w-4" /> Edit
                </button>

                {/* Toggle Status */}
                <button
                  onClick={onToggleStatus}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border ${
                    workflow.active
                      ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                      : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                  }`}
                >
                  {workflow.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {workflow.active ? 'Deactivate' : 'Activate'}
                </button>

                {/* Kebab Menu for secondary actions */}
                <div className={`relative menu-container-${workflow.id}`}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleMenu();
                    }}
                    className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                    aria-haspopup="true"
                    aria-expanded={isMenuOpen}
                    aria-label="More actions"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          onToggleMenu();
                          onViewDetails();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <ArrowRight className="h-4 w-4" />
                        View Details
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          onToggleMenu();
                          onTest();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Zap className="h-4 w-4" />
                        Test Workflow
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          onToggleMenu();
                          onExecute();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Play className="h-4 w-4" />
                        Execute Now
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          onToggleMenu();
                          onDelete();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              {workflow.actions.length} action{workflow.actions.length !== 1 ? 's' : ''} • 
              {workflow.isScheduled && ' Scheduled • '} 
              Executed {workflow.executionCount || 0} time{workflow.executionCount !== 1 ? 's' : ''}
            </p>

            <button
              onClick={onToggleExpand}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
            >
              {isExpanded ? (
                <>
                  <ChevronDown className="h-4 w-4" /> Hide details
                </>
              ) : (
                <>
                  <ChevronRight className="h-4 w-4" /> View details ({workflow.actions.length} actions)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Actions */}
              <div className="lg:col-span-2 space-y-4">
                <h4 className="text-sm font-semibold text-gray-700">Actions</h4>
                {workflow.actions.map((action, idx) => {
                  const ActionIcon = getActionIcon(action.actionType);
                  return (
                    <div key={`${workflow.id}-action-${idx}`} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <ActionIcon className="h-5 w-5 text-gray-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {action.actionType.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        {action.delayInMinutes && (
                          <span className="text-xs bg-white px-2 py-1 rounded mt-1 inline-block">
                            Delay: {action.delayInMinutes} min
                          </span>
                        )}
                        {action.params && Object.keys(action.params).length > 0 && (
                          <pre className="text-xs bg-white p-2 mt-2 rounded overflow-x-auto max-w-full">
                            {JSON.stringify(action.params, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Info */}
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h5 className="text-xs font-medium text-gray-500 mb-2">Execution Info</h5>
                  <p className="text-sm"><span className="text-gray-600">Frequency:</span> {workflow.executionFrequency?.replace(/_/g, ' ') || '—'}</p>
                  <p className="text-sm"><span className="text-gray-600">Executions:</span> {workflow.executionCount || 0}</p>
                  {workflow.lastExecution && (
                    <p className="text-sm"><span className="text-gray-600">Last Run:</span> {new Date(workflow.lastExecution).toLocaleDateString()}</p>
                  )}
                </div>
                {workflow.createdBy && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h5 className="text-xs font-medium text-gray-500 mb-2">Created by</h5>
                    <p className="text-sm">{workflow.createdBy.firstName} {workflow.createdBy.lastName}</p>
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  Created: {new Date(workflow.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function WorkflowsDashboard() {
  const router = useRouter();
  const { showToast } = useToast();

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTrigger, setFilterTrigger] = useState('all');
  const [selectedWorkflows, setSelectedWorkflows] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [templatesCount, setTemplatesCount] = useState(0);
  const [availableActionsCount, setAvailableActionsCount] = useState(0);
  const [availableModulesCount, setAvailableModulesCount] = useState(0);
  
  // ✅ Independent state management for each workflow
  const [expandedWorkflows, setExpandedWorkflows] = useState<Record<string, boolean>>({});
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({}); // ✅ Renamed for clarity

  useEffect(() => {
    loadWorkflows();
    loadStats();
    loadWorkflowMetadata();
  }, []);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const result = await workflowService.getAllWorkflows();
      const workflowsArray = Array.isArray(result) ? result : result?.data || [];
      
      // Ensure each workflow has a unique ID
      const validatedWorkflows = workflowsArray.map((workflow, index) => ({
        ...workflow,
        id: workflow.id || `temp-id-${index}-${Date.now()}`
      }));
      
      setWorkflows(validatedWorkflows);
    } catch (error) {
      console.error('Error loading workflows:', error);
      showToast('Failed to load workflows', 'error');
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await workflowService.getWorkflowStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading workflow stats:', error);
      setStats({
        total: 0,
        active: 0,
        inactive: 0,
        scheduled: 0,
        totalExecutions: 0,
      });
    }
  };

  const loadWorkflowMetadata = async () => {
    try {
      const [templates, actions, modulesMeta] = await Promise.all([
        workflowService.getWorkflowTemplates().catch(() => []),
        workflowService.getAvailableActions().catch(() => []),
        workflowService.getAvailableModulesAndEvents().catch(() => ({})),
      ]);

      setTemplatesCount(Array.isArray(templates) ? templates.length : 0);
      setAvailableActionsCount(Array.isArray(actions) ? actions.length : 0);

      const modulesList = Array.isArray(modulesMeta)
        ? modulesMeta
        : Array.isArray(modulesMeta?.supportedModules)
          ? modulesMeta.supportedModules
        : Array.isArray(modulesMeta?.modules)
          ? modulesMeta.modules
          : modulesMeta && typeof modulesMeta === 'object'
            ? Object.keys(modulesMeta)
            : [];
      setAvailableModulesCount(modulesList.length);
    } catch (error) {
      console.error('Error loading workflow metadata:', error);
      setTemplatesCount(0);
      setAvailableActionsCount(0);
      setAvailableModulesCount(0);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadWorkflows(), loadStats(), loadWorkflowMetadata()]);
    setRefreshing(false);
    showToast('Workflows refreshed successfully', 'success');
  };

  const handleCreateWorkflow = () => {
    router.push('/settings/workflows/create');
  };

  const handleViewDetails = (id: string) => {
    if (!id || id === 'undefined') {
      showToast('Invalid workflow ID', 'error');
      return;
    }
    router.push(`/settings/workflows/${id}`);
  };

  const handleEditWorkflow = (id: string) => {
    if (!id || id === 'undefined') {
      showToast('Invalid workflow ID', 'error');
      return;
    }
    router.push(`/settings/workflows/${id}/edit`);
  };

  const handleToggleStatus = async (workflow: Workflow) => {
    try {
      const updatedWorkflow = await workflowService.toggleWorkflowStatus(workflow.id);
      setWorkflows(prev => prev.map(w => w.id === workflow.id ? updatedWorkflow : w));
      loadStats(); // Refresh stats after status change
      showToast(
        `Workflow ${workflow.active ? 'deactivated' : 'activated'} successfully`,
        'success'
      );
    } catch (error) {
      console.error('Error toggling workflow status:', error);
      showToast('Failed to update workflow status', 'error');
    }
  };

  const handleDeleteWorkflow = async (workflow: Workflow) => {
    if (!confirm('Are you sure you want to delete this workflow? This action cannot be undone.')) return;
    
    try {
      await workflowService.deleteWorkflow(workflow.id);
      setWorkflows(prev => prev.filter(w => w.id !== workflow.id));
      // Clean up state
      setExpandedWorkflows(prev => {
        const newState = { ...prev };
        delete newState[workflow.id];
        return newState;
      });
      setExpandedMenus(prev => {
        const newState = { ...prev };
        delete newState[workflow.id];
        return newState;
      });
      setSelectedWorkflows(prev => prev.filter(id => id !== workflow.id));
      loadStats(); // Refresh stats after deletion
      showToast('Workflow deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting workflow:', error);
      showToast('Failed to delete workflow', 'error');
    }
  };

  const handleTestWorkflow = async (workflow: Workflow) => {
    try {
      const result = await workflowService.testWorkflowWithSampleData(workflow.id, workflow.module);
      showToast(`Workflow test completed: ${result.conditionsMatch ? 'Conditions matched' : 'Conditions not matched'}`, 
                result.conditionsMatch ? 'success' : 'warning');
    } catch (error) {
      console.error('Error testing workflow:', error);
      showToast('Failed to test workflow', 'error');
    }
  };

  const handleExecuteWorkflow = async (workflow: Workflow) => {
    try {
      const result = await workflowService.executeWorkflow(workflow.id);
      showToast(`Workflow executed: ${result.message}`, 'success');
      loadWorkflows(); // Refresh to update execution count
    } catch (error) {
      console.error('Error executing workflow:', error);
      showToast('Failed to execute workflow', 'error');
    }
  };

  const handleSelectAll = () => {
    if (selectedWorkflows.length === workflows.length) {
      setSelectedWorkflows([]);
    } else {
      setSelectedWorkflows(workflows.map(w => w.id));
    }
  };

  const handleSelectWorkflow = (id: string) => {
    setSelectedWorkflows(prev =>
      prev.includes(id)
        ? prev.filter(workflowId => workflowId !== id)
        : [...prev, id]
    );
  };

  const toggleExpandedWorkflow = (id: string) => {
    setExpandedWorkflows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleMenu = (id: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch =
      workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflow.module.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesModule = filterModule === 'all' || workflow.module === filterModule;
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' ? workflow.active : !workflow.active);
    const matchesTrigger = filterTrigger === 'all' || workflow.triggerEvent === filterTrigger;

    return matchesSearch && matchesModule && matchesStatus && matchesTrigger;
  });

  const modules = [
    'opportunities', 'quotes', 'invoices', 'payments', 'leads', 'accounts', 'contacts'
  ];

  const triggerEvents = [
    'onCreate', 'onUpdate', 'onDelete', 'scheduled', 'fieldUpdate', 'stageChange'
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Zap className="h-6 w-6 text-blue-600" />
              Workflow Automation
            </h1>
            <p className="text-gray-600 mt-1">
              Automate processes and trigger actions based on events and conditions
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={handleCreateWorkflow}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="h-5 w-5" />
              New Workflow
            </button>
            <button
              onClick={async () => {
                try {
                  const templates = await workflowService.getWorkflowTemplates();
                  if (!templates.length) {
                    showToast('No workflow templates available', 'info');
                    return;
                  }
                  const firstTemplate = templates[0];
                  const created = await workflowService.createWorkflowFromTemplate(
                    firstTemplate.id || firstTemplate._id || String(firstTemplate.name || 'default'),
                    {},
                  );
                  showToast('Workflow created from template', 'success');
                  await loadWorkflows();
                  router.push(`/settings/workflows/${created.id || created._id}`);
                } catch (error) {
                  console.error('Error creating workflow from template:', error);
                  showToast('Failed to create workflow from template', 'error');
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Layers className="h-5 w-5" />
              Use Template
            </button>
          </div>
        </div>

        {/* Stats */}
        {loading && !stats ? (
          <StatsSkeleton />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Workflows', value: stats?.total || 0, icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Active', value: stats?.active || 0, icon: Play, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Scheduled', value: stats?.scheduled || 0, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Total Executions', value: stats?.totalExecutions || 0, icon: Activity, color: 'text-cyan-600', bg: 'bg-cyan-50' },
            ].map((stat, i) => (
              <div key={`stat-${i}`} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    {i === 0 ? '+8% from last week' : 
                     i === 1 ? `${stats?.total ? ((stats.active / stats.total) * 100).toFixed(0) : 0}% of total` :
                     i === 2 ? `${stats?.total ? ((stats.scheduled / stats.total) * 100).toFixed(0) : 0}% of total` :
                     'Across all workflows'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <p className="text-sm text-gray-600">Templates</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{templatesCount}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <p className="text-sm text-gray-600">Available Actions</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{availableActionsCount}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <p className="text-sm text-gray-600">Available Modules</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{availableModulesCount}</p>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedWorkflows.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center h-8 w-8 bg-blue-100 text-blue-800 rounded-md font-medium">
              {selectedWorkflows.length}
            </span>
            <span className="text-sm text-blue-800 font-medium">
              {selectedWorkflows.length} selected
            </span>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
              <Download className="h-4 w-4 inline mr-1" /> Export
            </button>
            <button className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
              <Trash2 className="h-4 w-4 inline mr-1" /> Delete
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-8 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search workflows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-3">
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Modules</option>
              {modules.map(module => (
                <option key={`module-${module}`} value={module}>
                  {module.charAt(0).toUpperCase() + module.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={filterTrigger}
              onChange={(e) => setFilterTrigger(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Triggers</option>
              {triggerEvents.map(trigger => (
                <option key={`trigger-${trigger}`} value={trigger}>
                  {trigger.replace(/([A-Z])/g, ' $1').trim()}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="lg:col-span-1 flex gap-2">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterModule('all');
                setFilterTrigger('all');
                setFilterStatus('all');
                setSelectedWorkflows([]);
              }}
              className="w-full px-3 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Workflows List */}
      {loading ? (
        <div className="space-y-5">
          {[1, 2, 3].map((i) => (
            <WorkflowCardSkeleton key={`loading-${i}`} />
          ))}
        </div>
      ) : filteredWorkflows.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center h-16 w-16 bg-blue-50 rounded-full mb-5">
            <Zap className="h-8 w-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No workflows found</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            Create your first workflow to automate processes and trigger actions.
          </p>
          <button
            onClick={handleCreateWorkflow}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm"
          >
            <Plus className="h-4 w-4" /> Create Workflow
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredWorkflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              isExpanded={!!expandedWorkflows[workflow.id]}
              onToggleExpand={() => toggleExpandedWorkflow(workflow.id)}
              onViewDetails={() => handleViewDetails(workflow.id)}
              onEdit={() => handleEditWorkflow(workflow.id)}
              onToggleStatus={() => handleToggleStatus(workflow)}
              onTest={() => handleTestWorkflow(workflow)}
              onExecute={() => handleExecuteWorkflow(workflow)}
              onDelete={() => handleDeleteWorkflow(workflow)}
              isSelected={selectedWorkflows.includes(workflow.id)}
              onSelect={() => handleSelectWorkflow(workflow.id)}
              isMenuOpen={!!expandedMenus[workflow.id]}
              onToggleMenu={() => toggleMenu(workflow.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
