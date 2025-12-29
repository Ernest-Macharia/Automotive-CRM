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
  Loader2,
  X,
  Clock,
  Layers,
  Activity,
  Bell,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { workflowService, Workflow } from '@/services/settings/workflowService';

// Skeleton Loading Components
const WorkflowCardSkeleton = () => (
  <div className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6 animate-pulse">
    <div className="flex items-start gap-4">
      <div className="h-5 w-5 bg-gradient-to-r from-blue-200 to-purple-200 rounded mt-1"></div>
      <div className="flex-1 space-y-3">
        <div className="h-6 w-48 bg-gray-300/50 rounded"></div>
        <div className="flex gap-2">
          <div className="h-6 w-24 bg-gray-300/50 rounded-full"></div>
          <div className="h-6 w-20 bg-gray-300/50 rounded-full"></div>
        </div>
        <div className="h-4 w-full bg-gray-300/50 rounded"></div>
        <div className="flex justify-between">
          <div className="h-4 w-32 bg-gray-300/50 rounded"></div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-8 bg-gray-300/50 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const StatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <div className="h-4 w-24 bg-gray-300/50 rounded"></div>
            <div className="h-8 w-16 bg-gray-300/50 rounded"></div>
          </div>
          <div className="h-12 w-12 bg-gradient-to-r from-blue-200 to-purple-200 rounded-xl"></div>
        </div>
        <div className="mt-4 pt-4 border-t border-blue-100/30">
          <div className="h-3 w-32 bg-gray-300/50 rounded"></div>
        </div>
      </div>
    ))}
  </div>
);

export default function WorkflowsDashboard() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTrigger, setFilterTrigger] = useState('all');
  const [expandedWorkflow, setExpandedWorkflow] = useState<string | null>(null);
  const [selectedWorkflows, setSelectedWorkflows] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadWorkflows();
    loadStats();
  }, []);

  const loadWorkflows = async () => {
    try {
        setLoading(true);
        const result = await workflowService.getAllWorkflows();
        setWorkflows(result.data || []);
        
    } catch (error) {
        console.error('Error loading workflows:', error);
        showToast('Failed to load workflows', 'error');
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
            byModule: {},
            byTriggerEvent: {},
            totalExecutions: 0
            });
        }
        };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadWorkflows(), loadStats()]);
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

  const getModuleColor = (module: string) => {
    const colors: Record<string, string> = {
      opportunities: 'from-blue-50 to-blue-100 text-blue-700 border-blue-200',
      leads: 'from-green-50 to-green-100 text-green-700 border-green-200',
      quotes: 'from-purple-50 to-purple-100 text-purple-700 border-purple-200',
      invoices: 'from-amber-50 to-amber-100 text-amber-700 border-amber-200',
      accounts: 'from-cyan-50 to-cyan-100 text-cyan-700 border-cyan-200',
      contacts: 'from-pink-50 to-pink-100 text-pink-700 border-pink-200',
      payments: 'from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200',
    };
    return colors[module] || 'from-gray-50 to-gray-100 text-gray-700 border-gray-200';
  };

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

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'sendEmail':
        return Mail;
      case 'sendNotification':
        return Bell;
      case 'createTask':
        return Calendar;
      case 'assignToUser':
        return Users;
      default:
        return Zap;
    }
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                <Zap className="h-6 w-6 text-white" />
              </div>
              Workflow Automation
            </h1>
            <p className="text-gray-600 mt-2">
              Automate processes and trigger actions based on events and conditions
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 border border-blue-200 bg-white/50 text-blue-700 rounded-xl hover:bg-blue-50 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleCreateWorkflow}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="h-5 w-5" />
              New Workflow
            </button>
          </div>
        </div>

        {/* Stats Cards with Skeleton */}
        {loading && !stats ? (
        <StatsSkeleton />
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6 hover:shadow-lg transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between">
                <div>
                <p className="text-sm text-gray-600 font-medium">Total Workflows</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.total || 0}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl">
                <Zap className="h-6 w-6 text-blue-600" />
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-100/30">
                <div className="text-xs text-blue-600 font-medium">
                <span className="text-green-600">+8%</span> from last week
                </div>
            </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6 hover:shadow-lg transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between">
                <div>
                <p className="text-sm text-gray-600 font-medium">Active</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats?.active || 0}
                </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl">
                <Play className="h-6 w-6 text-green-600" />
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-100/30">
                <div className="text-xs text-gray-500">
                {stats?.total ? ((stats.active / stats.total) * 100).toFixed(0) : 0}% of total
                </div>
            </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6 hover:shadow-lg transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between">
                <div>
                <p className="text-sm text-gray-600 font-medium">Scheduled</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats?.scheduled || 0}
                </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl">
                <Clock className="h-6 w-6 text-purple-600" />
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-100/30">
                <div className="text-xs text-gray-500">
                {stats?.total ? ((stats.scheduled / stats.total) * 100).toFixed(0) : 0}% of total
                </div>
            </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6 hover:shadow-lg transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between">
                <div>
                <p className="text-sm text-gray-600 font-medium">Total Executions</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats?.totalExecutions || 0}
                </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl">
                <Activity className="h-6 w-6 text-cyan-600" />
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-100/30">
                <div className="text-xs text-gray-500">
                Across all workflows
                </div>
            </div>
            </div>
        </div>
        )}
      </div>

      {/* Action Bar */}
      {selectedWorkflows.length > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50/80 to-purple-50/80 backdrop-blur-sm border border-blue-200/50 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-700 font-medium">{selectedWorkflows.length}</span>
            </div>
            <span className="text-sm text-blue-800 font-medium">
              {selectedWorkflows.length} workflow{selectedWorkflows.length !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50">
              <Download className="h-4 w-4 inline mr-2" />
              Export
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg text-sm font-medium hover:from-red-700 hover:to-red-800">
              <Trash2 className="h-4 w-4 inline mr-2" />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6 mb-8 shadow-lg">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400" />
              <input
                type="text"
                placeholder="Search workflows by name, module, or trigger..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-blue-200 bg-white/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-blue-400 hover:text-blue-600"
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
              className="w-full px-4 py-3 border border-blue-200 bg-white/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Modules</option>
              {modules.map(module => (
                <option key={module} value={module}>
                  {module.charAt(0).toUpperCase() + module.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="lg:col-span-2">
            <select
              value={filterTrigger}
              onChange={(e) => setFilterTrigger(e.target.value)}
              className="w-full px-4 py-3 border border-blue-200 bg-white/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Triggers</option>
              {triggerEvents.map(trigger => (
                <option key={trigger} value={trigger}>
                  {trigger.replace(/([A-Z])/g, ' $1').trim()}
                </option>
              ))}
            </select>
          </div>
          
          <div className="lg:col-span-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 border border-blue-200 bg-white/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
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
              className="w-full px-4 py-3 border border-blue-200 text-blue-700 bg-white/50 rounded-xl hover:bg-blue-50 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Workflows List */}
      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <WorkflowCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredWorkflows.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Zap className="h-12 w-12 text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No workflows found</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Create your first workflow to automate processes and trigger actions based on events
          </p>
          <button
            onClick={handleCreateWorkflow}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-base font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-5 w-5" />
            Create Workflow
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredWorkflows.map((workflow) => {
            const TriggerIcon = getTriggerIcon(workflow.triggerEvent);
            
            return (
              <div
                key={workflow.id}
                className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <input
                      type="checkbox"
                      checked={selectedWorkflows.includes(workflow.id)}
                      onChange={() => handleSelectWorkflow(workflow.id)}
                      className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-blue-300 rounded"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                            {workflow.name}
                          </h3>
                          <div className="flex items-center gap-3 mt-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${getModuleColor(workflow.module)}`}>
                              {workflow.module.charAt(0).toUpperCase() + workflow.module.slice(1)}
                            </span>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              workflow.active
                                ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200'
                                : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border border-gray-200'
                            }`}>
                              {workflow.active ? 'Active' : 'Inactive'}
                            </span>
                            <span className="inline-flex items-center gap-1 text-sm text-blue-600">
                              <TriggerIcon className="h-4 w-4" />
                              {workflow.triggerEvent.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleExecuteWorkflow(workflow)}
                            className="p-2.5 bg-gradient-to-r from-green-50 to-green-100 text-green-600 rounded-xl hover:from-green-100 hover:to-green-200 transition-all hover:scale-110"
                            title="Execute Now"
                          >
                            <Play className="h-5 w-5" />
                          </button>
                          
                          <button
                            onClick={() => handleTestWorkflow(workflow)}
                            className="p-2.5 bg-gradient-to-r from-cyan-50 to-cyan-100 text-cyan-600 rounded-xl hover:from-cyan-100 hover:to-cyan-200 transition-all hover:scale-110"
                            title="Test Workflow"
                          >
                            <Zap className="h-5 w-5" />
                          </button>
                          
                          <button
                            onClick={() => handleToggleStatus(workflow)}
                            className={`p-2.5 rounded-xl transition-all hover:scale-110 ${
                              workflow.active
                                ? 'bg-gradient-to-r from-red-50 to-red-100 text-red-600 hover:from-red-100 hover:to-red-200'
                                : 'bg-gradient-to-r from-green-50 to-green-100 text-green-600 hover:from-green-100 hover:to-green-200'
                            }`}
                            title={workflow.active ? 'Deactivate' : 'Activate'}
                          >
                            {workflow.active ? (
                              <Pause className="h-5 w-5" />
                            ) : (
                              <Play className="h-5 w-5" />
                            )}
                          </button>
                          
                          <button
                            onClick={() => handleEditWorkflow(workflow.id)}
                            className="p-2.5 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-600 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all hover:scale-110"
                            title="Edit Workflow"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          
                          <button
                            onClick={() => handleViewDetails(workflow.id)}
                            className="p-2.5 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all hover:scale-110"
                            title="View Details"
                          >
                            <ArrowRight className="h-5 w-5" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteWorkflow(workflow)}
                            className="p-2.5 bg-gradient-to-r from-red-50 to-red-100 text-red-600 rounded-xl hover:from-red-100 hover:to-red-200 transition-all hover:scale-110"
                            title="Delete Workflow"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mb-6">
                        <div className="text-sm text-gray-600">
                          {workflow.actions.length} action{workflow.actions.length !== 1 ? 's' : ''} • 
                          {workflow.isScheduled && ' Scheduled •'} 
                          Executed {workflow.executionCount || 0} time{workflow.executionCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setExpandedWorkflow(expandedWorkflow === workflow.id ? null : workflow.id)}
                        className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        {expandedWorkflow === workflow.id ? (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <ChevronRight className="h-4 w-4" />
                            View Details ({workflow.actions.length} actions)
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details View */}
                  {expandedWorkflow === workflow.id && (
                    <div className="mt-8 pt-8 border-t border-blue-100/50">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Actions Section */}
                        <div className="lg:col-span-2">
                          <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Actions</h4>
                          <div className="space-y-4">
                            {workflow.actions.map((action, index) => {
                              const ActionIcon = getActionIcon(action.actionType);
                              return (
                                <div key={index} className="flex items-start gap-4 p-4 bg-gradient-to-br from-blue-50/50 to-white border border-blue-100/50 rounded-xl">
                                  <div className="p-2 bg-gradient-to-r from-blue-100 to-blue-50 rounded-lg">
                                    <ActionIcon className="h-5 w-5 text-blue-600" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium text-gray-900">
                                        {action.actionType.replace(/([A-Z])/g, ' $1').trim()}
                                      </span>
                                      {action.delayInMinutes && (
                                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                          Delay: {action.delayInMinutes} min
                                        </span>
                                      )}
                                    </div>
                                    {Object.keys(action.params).length > 0 && (
                                      <div className="text-sm text-gray-600">
                                        <pre className="text-xs bg-gray-50 p-2 rounded-lg overflow-x-auto">
                                          {JSON.stringify(action.params, null, 2)}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Info Section */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Information</h4>
                          <div className="space-y-4">
                            <div className="p-4 bg-gradient-to-br from-blue-50/50 to-white border border-blue-100/50 rounded-xl">
                              <h5 className="text-xs font-medium text-gray-500 mb-2">Execution Info</h5>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Frequency:</span>
                                  <span className="font-medium text-blue-700">
                                    {workflow.executionFrequency.replace(/_/g, ' ')}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Executions:</span>
                                  <span className="font-medium text-blue-700">{workflow.executionCount}</span>
                                </div>
                                {workflow.lastExecution && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Last Run:</span>
                                    <span className="font-medium text-blue-700">
                                      {new Date(workflow.lastExecution).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {workflow.isScheduled && workflow.scheduleConfig && (
                              <div className="p-4 bg-gradient-to-br from-purple-50/50 to-white border border-purple-100/50 rounded-xl">
                                <h5 className="text-xs font-medium text-gray-500 mb-2">Schedule</h5>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Type:</span>
                                    <span className="font-medium text-purple-700 capitalize">
                                      {workflow.scheduleConfig.type}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Time:</span>
                                    <span className="font-medium text-purple-700">{workflow.scheduleConfig.time}</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="p-4 bg-gradient-to-br from-gray-50/50 to-white border border-gray-100/50 rounded-xl">
                              <h5 className="text-xs font-medium text-gray-500 mb-2">Metadata</h5>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Created:</span>
                                  <span className="text-gray-900">
                                    {new Date(workflow.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Updated:</span>
                                  <span className="text-gray-900">
                                    {new Date(workflow.updatedAt).toLocaleDateString()}
                                  </span>
                                </div>
                                {workflow.createdBy && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Created by:</span>
                                    <span className="text-gray-900">
                                      {workflow.createdBy.firstName} {workflow.createdBy.lastName}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Footer */}
                <div className="px-6 py-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-t border-blue-100/50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-blue-600">
                      Created {new Date(workflow.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                    <button
                      onClick={() => handleViewDetails(workflow.id)}
                      className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      View Full Details
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}