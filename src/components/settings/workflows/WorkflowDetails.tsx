'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Zap,
  ArrowLeft,
  Edit,
  Trash2,
  Play,
  Pause,
  Copy,
  History,
  Bell,
  Mail,
  Calendar,
  Users,
  Settings,
  Clock,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronRight,
  ExternalLink,
  BarChart,
  Download,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { workflowService } from '@/services/settings/workflowService';
import type { Workflow, WorkflowExecutionHistory, TestWorkflowResult } from '@/services/settings/workflowService';

interface WorkflowDetailsProps {
  workflowId: string;
}

export default function WorkflowDetails({ workflowId }: WorkflowDetailsProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<WorkflowExecutionHistory[]>([]);
  const [testResult, setTestResult] = useState<TestWorkflowResult | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showTestResults, setShowTestResults] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (workflowId) {
      loadWorkflow();
      loadHistory();
    }
  }, [workflowId]);

  const loadWorkflow = async () => {
    try {
      setLoading(true);
      const data = await workflowService.getWorkflowById(workflowId);
      setWorkflow(data);
    } catch (error) {
      console.error('Error loading workflow:', error);
      showToast('Failed to load workflow', 'error');
      router.push('/settings/workflows');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await workflowService.getWorkflowHistory(workflowId, 10);
      setHistory(data);
    } catch (error) {
      console.error('Error loading workflow history:', error);
    }
  };

  const handleToggleStatus = async () => {
    if (!workflow) return;
    
    try {
      const updatedWorkflow = await workflowService.toggleWorkflowStatus(workflow.id);
      setWorkflow(updatedWorkflow);
      showToast(
        `Workflow ${workflow.active ? 'deactivated' : 'activated'} successfully`,
        'success'
      );
    } catch (error) {
      console.error('Error toggling workflow status:', error);
      showToast('Failed to update workflow status', 'error');
    }
  };

  const handleExecute = async () => {
    if (!workflow) return;
    
    try {
      setExecuting(true);
      const result = await workflowService.executeWorkflow(workflow.id);
      showToast(`Workflow executed: ${result.message}`, 'success');
      await loadWorkflow(); // Refresh execution count
      await loadHistory(); // Refresh history
    } catch (error) {
      console.error('Error executing workflow:', error);
      showToast('Failed to execute workflow', 'error');
    } finally {
      setExecuting(false);
    }
  };

  const handleTest = async () => {
    if (!workflow) return;
    
    try {
      setTesting(true);
      const result = await workflowService.testWorkflowWithSampleData(workflow.id, workflow.module);
      setTestResult(result);
      setShowTestResults(true);
      showToast('Workflow test completed', 'success');
    } catch (error) {
      console.error('Error testing workflow:', error);
      showToast('Failed to test workflow', 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleClone = async () => {
    if (!workflow) return;
    
    try {
      const cloned = await workflowService.cloneWorkflow(workflow.id, `${workflow.name} (Copy)`);
      showToast('Workflow cloned successfully', 'success');
      router.push(`/settings/workflows/${cloned.id}/edit`);
    } catch (error) {
      console.error('Error cloning workflow:', error);
      showToast('Failed to clone workflow', 'error');
    }
  };

  const handleDelete = async () => {
    if (!workflow) return;
    
    if (!confirm('Are you sure you want to delete this workflow? This action cannot be undone.')) return;
    
    try {
      await workflowService.deleteWorkflow(workflow.id);
      showToast('Workflow deleted successfully', 'success');
      router.push('/settings/workflows');
    } catch (error) {
      console.error('Error deleting workflow:', error);
      showToast('Failed to delete workflow', 'error');
    }
  };

  const handleEdit = () => {
    if (workflow) {
      router.push(`/settings/workflows/${workflow.id}/edit`);
    }
  };

  const handleBack = () => {
    router.push('/settings/workflows');
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'sendEmail': return Mail;
      case 'sendNotification': return Bell;
      case 'createTask': return Calendar;
      case 'assignToUser': return Users;
      default: return Settings;
    }
  };

  const getTriggerIcon = (trigger: string) => {
    switch (trigger) {
      case 'onCreate': return Plus;
      case 'onUpdate': return Edit;
      case 'onDelete': return Trash2;
      case 'scheduled': return Clock;
      case 'fieldUpdate': return Activity;
      case 'stageChange': return BarChart;
      default: return Zap;
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
          <p className="text-gray-600 mb-8">The workflow you're looking for doesn't exist or has been deleted.</p>
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Workflows
          </button>
        </div>
      </div>
    );
  }

  const TriggerIcon = getTriggerIcon(workflow.triggerEvent);

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
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{workflow.name}</h1>
                  <div className="flex items-center gap-3 mt-2">
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
                    <span className="text-sm text-gray-600">
                      {workflow.module.charAt(0).toUpperCase() + workflow.module.slice(1)} Module
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleTest}
              disabled={testing}
              className="flex items-center gap-2 px-4 py-2.5 border border-blue-200 bg-white/50 text-blue-700 rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              {testing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              ) : (
                <Activity className="h-4 w-4" />
              )}
              Test
            </button>
            
            <button
              onClick={handleExecute}
              disabled={executing || !workflow.active}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-colors disabled:opacity-50"
            >
              {executing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Play className="h-4 w-4" />
              )}
              Execute Now
            </button>
            
            <button
              onClick={handleToggleStatus}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors ${
                workflow.active
                  ? 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200 hover:from-red-100 hover:to-red-200'
                  : 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200 hover:from-green-100 hover:to-green-200'
              }`}
            >
              {workflow.active ? (
                <>
                  <Pause className="h-4 w-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Activate
                </>
              )}
            </button>
            
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-colors"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Execution Count</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{workflow.executionCount || 0}</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Actions</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{workflow.actions.length}</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl">
                <Settings className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Last Execution</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {workflow.lastExecution 
                    ? new Date(workflow.lastExecution).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : 'Never'
                  }
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Created</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {new Date(workflow.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl">
                <Calendar className="h-6 w-6 text-cyan-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Workflow Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Actions Section */}
          <div className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                Actions ({workflow.actions.length})
              </h2>
              <button
                onClick={() => setShowTestResults(!showTestResults)}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
              >
                <Activity className="h-4 w-4" />
                {showTestResults ? 'Hide Test Results' : 'Show Test Results'}
              </button>
            </div>

            {showTestResults && testResult && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 border border-blue-200/50 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">Test Results</h3>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    testResult.conditionsMatch
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {testResult.conditionsMatch ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    Conditions {testResult.conditionsMatch ? 'Matched' : 'Not Matched'}
                  </div>
                </div>
                <div className="space-y-2">
                  {testResult.actions.map((action, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white/50 rounded-lg">
                      <span className="text-sm text-gray-700">{action.actionType}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        action.wouldExecute
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {action.wouldExecute ? 'Would Execute' : 'Would Not Execute'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {workflow.actions.map((action, index) => {
                const ActionIcon = getActionIcon(action.actionType);
                
                return (
                  <div key={index} className="border border-blue-100 rounded-xl p-4 bg-white/50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-blue-100 to-blue-50 rounded-lg">
                          <ActionIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {action.actionType.replace(/([A-Z])/g, ' $1').trim()}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              Order: {action.executionOrder || index + 1}
                            </span>
                            {action.delayInMinutes && action.delayInMinutes > 0 && (
                              <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                                Delay: {action.delayInMinutes} min
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {Object.keys(action.params).length > 0 && (
                      <div className="mt-3">
                        <h4 className="text-xs font-medium text-gray-700 mb-2">Parameters</h4>
                        <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-x-auto max-h-32 overflow-y-auto">
                          {JSON.stringify(action.params, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Schedule & Conditions Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {workflow.isScheduled && workflow.scheduleConfig && (
              <div className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Schedule Configuration
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium text-blue-700 capitalize">{workflow.scheduleConfig.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium text-blue-700">{workflow.scheduleConfig.time}</span>
                  </div>
                  {workflow.scheduleConfig.daysOfWeek && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Days:</span>
                      <span className="font-medium text-blue-700">
                        {workflow.scheduleConfig.daysOfWeek.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}
                      </span>
                    </div>
                  )}
                  {workflow.scheduleConfig.customCron && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cron:</span>
                      <code className="font-mono text-sm text-blue-700">{workflow.scheduleConfig.customCron}</code>
                    </div>
                  )}
                  {workflow.nextExecution && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Next Run:</span>
                      <span className="font-medium text-green-700">
                        {new Date(workflow.nextExecution).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {workflow.conditions && Object.keys(workflow.conditions).length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  Conditions
                </h2>
                <div className="space-y-2">
                  {Object.entries(workflow.conditions).map(([field, value]) => (
                    <div key={field} className="flex items-center justify-between p-2 bg-blue-50/50 rounded-lg">
                      <span className="font-medium text-blue-700">{field}</span>
                      <span className="text-gray-900">=</span>
                      <span className="text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Info & Actions */}
        <div className="space-y-8">
          {/* Info Card */}
          <div className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Workflow Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-medium text-gray-500 mb-2">Basic Info</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Module:</span>
                    <span className="font-medium text-blue-700">{workflow.module}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Trigger:</span>
                    <span className="font-medium text-blue-700">{workflow.triggerEvent}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Frequency:</span>
                    <span className="font-medium text-blue-700">{workflow.executionFrequency}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Scheduled:</span>
                    <span className={`font-medium ${workflow.isScheduled ? 'text-green-700' : 'text-gray-700'}`}>
                      {workflow.isScheduled ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-medium text-gray-500 mb-2">Timestamps</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Created:</span>
                    <span className="text-gray-900">{new Date(workflow.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Updated:</span>
                    <span className="text-gray-900">{new Date(workflow.updatedAt).toLocaleString()}</span>
                  </div>
                  {workflow.lastExecution && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Last Execution:</span>
                      <span className="text-gray-900">{new Date(workflow.lastExecution).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {workflow.createdBy && (
                <div>
                  <h3 className="text-xs font-medium text-gray-500 mb-2">Created By</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-700">
                        {workflow.createdBy.firstName?.[0]}{workflow.createdBy.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {workflow.createdBy.firstName} {workflow.createdBy.lastName}
                      </div>
                      <div className="text-xs text-gray-600">{workflow.createdBy.email}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions Card */}
          <div className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Quick Actions
            </h2>
            
            <div className="space-y-3">
              <button
                onClick={handleEdit}
                className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Edit className="h-4 w-4" />
                  <span>Edit Workflow</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </button>

              <button
                onClick={handleClone}
                className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Copy className="h-4 w-4" />
                  <span>Clone Workflow</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-cyan-50 to-cyan-100 text-cyan-700 rounded-xl hover:from-cyan-100 hover:to-cyan-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <History className="h-4 w-4" />
                  <span>View History</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </button>

              <button
                onClick={handleDelete}
                className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-red-100 text-red-700 rounded-xl hover:from-red-100 hover:to-red-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Workflow</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* History Card */}
          {showHistory && (
            <div className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <History className="h-5 w-5 text-blue-600" />
                  Execution History
                </h2>
                <button
                  onClick={loadHistory}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              {history.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No execution history yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((record, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50/50 rounded-lg">
                      <div className={`p-1.5 rounded ${
                        record.executionResult === 'success'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {record.executionResult === 'success' ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-900">Record {record.recordId.substring(0, 8)}...</span>
                          <span className="text-xs text-gray-500">
                            {new Date(record.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {record.actionsExecuted} actions executed
                          {record.errorMessage && ` • Error: ${record.errorMessage}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Import Plus for icons
import { Plus } from 'lucide-react';