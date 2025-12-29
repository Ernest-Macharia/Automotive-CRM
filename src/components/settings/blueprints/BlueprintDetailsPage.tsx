'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Layers,
  Edit,
  Copy,
  Play,
  Pause,
  Trash2,
  Eye,
  Users,
  Mail,
  Calendar,
  Bell,
  Zap,
  ChevronDown,
  ChevronRight,
  Activity,
  TrendingUp,
  Clock,
  AlertCircle,
  Sparkles,
  FileText,
  Loader2,
  X,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { blueprintsService, Blueprint } from '@/services/settings/blueprintsService';

// ✨ Cleaner Skeleton
const DetailsSkeleton = () => (
  <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
    <div className="max-w-7xl mx-auto">
      <div className="animate-pulse">
        <div className="h-8 w-64 bg-gray-200 rounded mb-6"></div>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-64">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 w-full bg-gray-200 rounded"></div>
                <div className="h-4 w-4/5 bg-gray-200 rounded"></div>
                <div className="h-4 w-3/5 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <div className="bg-white border border-gray-200 rounded-xl p-5 h-96"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

interface BlueprintDetailsProps {
  blueprintId: string;
}

export default function BlueprintDetailsPage({ blueprintId }: BlueprintDetailsProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'stages' | 'usage' | 'history'>('overview');

  useEffect(() => {
    if (blueprintId) {
      loadBlueprint();
    } else {
      showToast('Invalid blueprint ID', 'error');
      router.push('/settings/blueprints');
    }
  }, [blueprintId]);

  // ✅ Keep all your existing logic functions unchanged
  const loadBlueprint = async () => {
    try {
      setLoading(true);
      const data = await blueprintsService.getBlueprint(blueprintId);
      setBlueprint(data);
    } catch (error) {
      console.error('Error loading blueprint:', error);
      showToast('Failed to load blueprint', 'error');
      router.push('/settings/blueprints');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/settings/blueprints/${blueprintId}/edit`);
  };

  const handleDuplicate = async () => {
    if (!blueprint) return;
    
    try {
      const duplicateData = {
        name: `${blueprint.name} (Copy)`,
        module: blueprint.module,
        description: blueprint.description,
        stages: blueprint.stages.map(stage => ({
          name: stage.name,
          order: stage.order,
          allowedRoles: [...stage.allowedRoles],
          entryActions: [...stage.entryActions],
          exitActions: [...stage.exitActions],
        })),
        isActive: false,
      };
      
      const newBlueprint = await blueprintsService.createBlueprint(duplicateData);
      showToast('Blueprint duplicated successfully', 'success');
      router.push(`/settings/blueprints/${newBlueprint.id}`);
    } catch (error: any) {
      console.error('Error duplicating blueprint:', error);
      showToast(error.message || 'Failed to duplicate blueprint', 'error');
    }
  };

  const handleToggleStatus = async () => {
    if (!blueprint) return;
    
    try {
      const updatedBlueprint = await blueprintsService.updateBlueprint(blueprint.id, {
        isActive: !blueprint.isActive,
      });
      setBlueprint(updatedBlueprint);
      showToast(
        `Blueprint ${blueprint.isActive ? 'deactivated' : 'activated'} successfully`,
        'success'
      );
    } catch (error: any) {
      console.error('Error toggling blueprint status:', error);
      showToast(error.message || 'Failed to update blueprint status', 'error');
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
          entryActions: stage.entryActions,
          exitActions: stage.exitActions,
        })),
      });
      showToast('Blueprint automation test completed successfully', 'success');
    } catch (error: any) {
      console.error('Error testing blueprint automation:', error);
      showToast(error.message || 'Failed to test blueprint automation', 'error');
    }
  };

  const getStageColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-cyan-500',
      'bg-indigo-500',
      'bg-violet-500',
      'bg-fuchsia-500',
    ];
    return colors[index % colors.length];
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'sendEmail': return Mail;
      case 'createTask': return Calendar;
      case 'sendNotification': return Bell;
      case 'updateRecord': return Zap;
      default: return Zap;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'sendEmail': return 'bg-blue-100 text-blue-700';
      case 'createTask': return 'bg-green-100 text-green-700';
      case 'sendNotification': return 'bg-yellow-100 text-yellow-700';
      case 'updateRecord': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading || !blueprintId) {
    return <DetailsSkeleton />;
  }

  if (!blueprint) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-red-100 rounded-full mb-4">
            <AlertCircle className="h-7 w-7 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Blueprint Not Found</h3>
          <p className="text-gray-600 mb-6">
            The blueprint you're looking for doesn't exist or has been deleted.
          </p>
          <button
            onClick={() => router.push('/settings/blueprints')}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Back to Blueprints
          </button>
        </div>
      </div>
    );
  }

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
              <h1 className="text-xl font-bold text-gray-900">Blueprint Details</h1>
              <p className="text-gray-600 text-sm">View workflow template and process stages</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleTestAutomation}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              <Play className="h-4 w-4" />
              Test
            </button>
            <button
              onClick={handleDuplicate}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              <Copy className="h-4 w-4" />
              Duplicate
            </button>
            <button
              onClick={handleEdit}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
            >
              <Edit className="h-4 w-4" />
              Edit
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
              <h2 className="text-lg font-semibold text-gray-900">{blueprint.name}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                  {blueprint.module}
                </span>
                <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                  blueprint.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {blueprint.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="text-sm text-gray-600">
                  {blueprint.stages.length} stage{blueprint.stages.length !== 1 ? 's' : ''}
                </span>
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
                <p className="text-gray-900">{formatDate(blueprint.createdAt)}</p>
              </div>
              
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Last Updated</div>
                <p className="text-gray-900">{formatDate(blueprint.updatedAt)}</p>
              </div>
              
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Status</div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    blueprint.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {blueprint.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={handleToggleStatus}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    {blueprint.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
              
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Module</div>
                <p className="font-medium text-blue-700">{blueprint.module}</p>
              </div>
              
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Stages</div>
                <p className="text-gray-900">{blueprint.stages.length}</p>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">Quick Actions</h4>
              <div className="space-y-2">
                <button
                  onClick={handleEdit}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit Blueprint
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
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Blueprint
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Tabs */}
          <div className="mb-6">
            <div className="flex space-x-1 border-b border-gray-200">
              {(['overview', 'stages', 'usage', 'history'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-2 text-sm font-medium border-b-2 ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {blueprint.description && (
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Description</h3>
                  <p className="text-gray-600 text-sm">{blueprint.description}</p>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Total Stages', value: blueprint.stages.length, icon: Layers, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { 
                    label: 'Total Actions', 
                    value: blueprint.stages.reduce((acc, stage) => acc + stage.entryActions.length + stage.exitActions.length, 0),
                    icon: Zap, 
                    color: 'text-cyan-600', 
                    bg: 'bg-cyan-50' 
                  },
                  { 
                    label: 'Avg Roles/Stage', 
                    value: blueprint.stages.length > 0 
                      ? Math.round(blueprint.stages.reduce((acc, stage) => acc + stage.allowedRoles.length, 0) / blueprint.stages.length)
                      : 0,
                    icon: Users, 
                    color: 'text-purple-600', 
                    bg: 'bg-purple-50' 
                  },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-600">{stat.label}</p>
                          <p className="text-lg font-bold text-gray-900 mt-1">{stat.value}</p>
                        </div>
                        <div className={`p-2 rounded-lg ${stat.bg}`}>
                          <Icon className={`h-4 w-4 ${stat.color}`} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Module Info */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Module Information</h3>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                    {blueprint.module}
                  </span>
                  <p className="text-sm text-gray-600">
                    This blueprint is designed for the {blueprint.module} module workflow automation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stages' && (
            <div className="space-y-5">
              {blueprint.stages
                .sort((a, b) => a.order - b.order)
                .map((stage, index) => (
                  <div key={stage.id || index} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    {/* Stage Header */}
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-white text-sm font-bold ${getStageColor(index)}`}>
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">{stage.name}</h3>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                              <span>Order: {stage.order}</span>
                              <span>•</span>
                              <span>
                                {stage.allowedRoles.length} role{stage.allowedRoles.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setExpandedStage(expandedStage === stage.id ? null : stage.id || index.toString())}
                          className="p-1 text-gray-500 hover:bg-gray-100 rounded"
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
                      <div className="p-4 bg-gray-50">
                        {/* Allowed Roles */}
                        <div className="mb-4">
                          <h4 className="text-xs font-medium text-gray-700 mb-2">Allowed Roles</h4>
                          <div className="flex flex-wrap gap-1">
                            {stage.allowedRoles.map((role, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-1 rounded text-[10px] font-medium bg-blue-100 text-blue-800"
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* Entry Actions */}
                          <div>
                            <div className="flex items-center gap-1.5 mb-2">
                              <div className="h-1 w-4 bg-green-500 rounded"></div>
                              <h4 className="text-xs font-medium text-gray-700">Entry Actions</h4>
                              <span className="text-[10px] text-gray-500 ml-auto">
                                ({stage.entryActions.length})
                              </span>
                            </div>
                            {stage.entryActions.length > 0 ? (
                              <div className="space-y-2">
                                {stage.entryActions.map((action, idx) => {
                                  const ActionIcon = getActionIcon(action.actionType);
                                  return (
                                    <div
                                      key={idx}
                                      className="p-3 bg-white border border-gray-200 rounded-lg"
                                    >
                                      <div className="flex items-center gap-2 mb-1">
                                        <div className={`p-1.5 rounded ${getActionColor(action.actionType)}`}>
                                          <ActionIcon className="h-3.5 w-3.5" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-900 capitalize">
                                          {action.actionType.replace(/([A-Z])/g, ' $1').trim()}
                                        </span>
                                      </div>
                                      {Object.keys(action.params).length > 0 && (
                                        <div className="mt-2">
                                          <p className="text-[10px] text-gray-500 mb-1">Parameters:</p>
                                          <pre className="text-[10px] bg-gray-100 p-2 rounded border border-gray-200 overflow-x-auto">
                                            {JSON.stringify(action.params, null, 2)}
                                          </pre>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="p-3 text-center border border-dashed border-gray-300 rounded-lg bg-white text-[10px] text-blue-500">
                                No entry actions defined
                              </div>
                            )}
                          </div>
                          
                          {/* Exit Actions */}
                          <div>
                            <div className="flex items-center gap-1.5 mb-2">
                              <div className="h-1 w-4 bg-red-500 rounded"></div>
                              <h4 className="text-xs font-medium text-gray-700">Exit Actions</h4>
                              <span className="text-[10px] text-gray-500 ml-auto">
                                ({stage.exitActions.length})
                              </span>
                            </div>
                            {stage.exitActions.length > 0 ? (
                              <div className="space-y-2">
                                {stage.exitActions.map((action, idx) => {
                                  const ActionIcon = getActionIcon(action.actionType);
                                  return (
                                    <div
                                      key={idx}
                                      className="p-3 bg-white border border-gray-200 rounded-lg"
                                    >
                                      <div className="flex items-center gap-2 mb-1">
                                        <div className={`p-1.5 rounded ${getActionColor(action.actionType)}`}>
                                          <ActionIcon className="h-3.5 w-3.5" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-900 capitalize">
                                          {action.actionType.replace(/([A-Z])/g, ' $1').trim()}
                                        </span>
                                      </div>
                                      {Object.keys(action.params).length > 0 && (
                                        <div className="mt-2">
                                          <p className="text-[10px] text-gray-500 mb-1">Parameters:</p>
                                          <pre className="text-[10px] bg-gray-100 p-2 rounded border border-gray-200 overflow-x-auto">
                                            {JSON.stringify(action.params, null, 2)}
                                          </pre>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="p-3 text-center border border-dashed border-gray-300 rounded-lg bg-white text-[10px] text-blue-500">
                                No exit actions defined
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}

          {activeTab === 'usage' && (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
              <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-900 mb-2">Usage Analytics</h3>
              <p className="text-gray-600 text-sm mb-4">
                Usage tracking for this blueprint will be available soon.
              </p>
              <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-lg font-bold text-gray-900">0</div>
                  <div className="text-[10px] text-gray-500">Active Records</div>
                </div>
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="text-lg font-bold text-gray-900">0</div>
                  <div className="text-[10px] text-gray-500">Total Completions</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-900 mb-2">Change History</h3>
              <p className="text-gray-600 text-sm">
                Version history and change tracking will be available soon.
              </p>
            </div>
          )}
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
              Are you sure you want to delete <strong className="text-red-600">{blueprint.name}</strong>?
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