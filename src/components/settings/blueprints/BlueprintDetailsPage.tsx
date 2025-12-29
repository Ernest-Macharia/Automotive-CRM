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

// Skeleton Components
const DetailsSkeleton = () => (
  <div className="min-h-screen animate-pulse">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i}>
                  <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-2xl"></div>
              ))}
            </div>
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
              ))}
            </div>
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
      'bg-gradient-to-r from-blue-500 to-blue-600',
      'bg-gradient-to-r from-purple-500 to-purple-600',
      'bg-gradient-to-r from-cyan-500 to-cyan-600',
      'bg-gradient-to-r from-indigo-500 to-indigo-600',
      'bg-gradient-to-r from-violet-500 to-violet-600',
      'bg-gradient-to-r from-fuchsia-500 to-fuchsia-600',
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
      case 'sendEmail': return 'text-blue-600 bg-blue-100';
      case 'createTask': return 'text-green-600 bg-green-100';
      case 'sendNotification': return 'text-yellow-600 bg-yellow-100';
      case 'updateRecord': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <DetailsSkeleton />;
  }

  if (!blueprint) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Blueprint Not Found</h3>
          <p className="text-gray-600 mb-6">The blueprint you're looking for doesn't exist or has been deleted.</p>
          <button
            onClick={() => router.push('/settings/blueprints')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            Back to Blueprints
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/settings/blueprints')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Blueprint Details</h1>
              <p className="text-gray-600 mt-1">View workflow template and process stages</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleTestAutomation}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
            >
              <Play className="h-4 w-4" />
              Test Automation
            </button>
            <button
              onClick={handleDuplicate}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
            >
              <Copy className="h-4 w-4" />
              Duplicate
            </button>
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
          </div>
        </div>
        
        {/* Blueprint Info Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Layers className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{blueprint.name}</h2>
              <div className="flex items-center gap-4 mt-2">
                <span className="px-3 py-1 bg-gray-100 rounded-lg text-gray-700 text-sm font-medium">
                  {blueprint.module}
                </span>
                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  blueprint.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {blueprint.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="text-gray-500 text-sm">
                  {blueprint.stages.length} stages
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar */}
        <div className="lg:w-64">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm sticky top-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Blueprint Info</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Created</label>
                <p className="text-sm text-gray-900">{formatDate(blueprint.createdAt)}</p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Last Updated</label>
                <p className="text-sm text-gray-900">{formatDate(blueprint.updatedAt)}</p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Status</label>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    blueprint.isActive
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-gray-100 text-gray-800 border border-gray-200'
                  }`}>
                    {blueprint.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={handleToggleStatus}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {blueprint.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Module</label>
                <p className="text-sm font-medium text-blue-700 capitalize">{blueprint.module}</p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Stages</label>
                <p className="text-sm text-gray-900">{blueprint.stages.length} stages</p>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h4>
              <div className="space-y-3">
                <button
                  onClick={handleEdit}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  Edit Blueprint
                </button>
                <button
                  onClick={handleDuplicate}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-purple-600 hover:text-purple-700 font-medium hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  Duplicate
                </button>
                <button
                  onClick={handleTestAutomation}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-cyan-600 hover:text-cyan-700 font-medium hover:bg-cyan-50 rounded-lg transition-colors"
                >
                  <Sparkles className="h-4 w-4" />
                  Test Automation
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
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
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('stages')}
                className={`px-4 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'stages'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Stages
              </button>
              <button
                onClick={() => setActiveTab('usage')}
                className={`px-4 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'usage'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Usage
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                History
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Description */}
              {blueprint.description && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
                  <p className="text-gray-600">{blueprint.description}</p>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Total Stages</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{blueprint.stages.length}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl">
                      <Layers className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Actions</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {blueprint.stages.reduce((acc, stage) => 
                          acc + stage.entryActions.length + stage.exitActions.length, 0
                        )}
                      </p>
                    </div>
                    <div className="p-3 bg-cyan-50 rounded-xl">
                      <Zap className="h-6 w-6 text-cyan-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Avg Roles/Stage</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {blueprint.stages.length > 0 
                          ? Math.round(blueprint.stages.reduce((acc, stage) => 
                              acc + stage.allowedRoles.length, 0) / blueprint.stages.length
                            )
                          : 0
                        }
                      </p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-xl">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Module Info */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Module Information</h3>
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium">
                    {blueprint.module}
                  </div>
                  <p className="text-gray-600">
                    This blueprint is designed for the {blueprint.module} module workflow automation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stages' && (
            <div className="space-y-6">
              {blueprint.stages
                .sort((a, b) => a.order - b.order)
                .map((stage, index) => (
                  <div key={stage.id || index} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all">
                    {/* Stage Header */}
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold ${getStageColor(index)}`}>
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{stage.name}</h3>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-sm text-blue-600">Order: {stage.order}</span>
                              <span className="text-sm text-blue-600">
                                {stage.allowedRoles.length} role{stage.allowedRoles.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setExpandedStage(expandedStage === stage.id ? null : stage.id || index.toString())}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          {expandedStage === (stage.id || index.toString()) ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {/* Expanded Content */}
                    {expandedStage === (stage.id || index.toString()) && (
                      <div className="p-6 bg-gray-50">
                        {/* Allowed Roles */}
                        <div className="mb-6">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">Allowed Roles</h4>
                          <div className="flex flex-wrap gap-2">
                            {stage.allowedRoles.map((role, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Entry Actions */}
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="h-1 w-6 bg-green-500 rounded"></div>
                              <h4 className="text-sm font-semibold text-gray-700">Entry Actions</h4>
                              <span className="text-xs text-gray-500 ml-auto">
                                ({stage.entryActions.length})
                              </span>
                            </div>
                            {stage.entryActions.length > 0 ? (
                              <div className="space-y-3">
                                {stage.entryActions.map((action, idx) => {
                                  const ActionIcon = getActionIcon(action.actionType);
                                  return (
                                    <div
                                      key={idx}
                                      className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition-all"
                                    >
                                      <div className="flex items-center gap-3 mb-2">
                                        <div className={`p-2 rounded-lg ${getActionColor(action.actionType)}`}>
                                          <ActionIcon className="h-4 w-4" />
                                        </div>
                                        <span className="font-medium text-gray-900 capitalize">
                                          {action.actionType.replace(/([A-Z])/g, ' $1').trim()}
                                        </span>
                                      </div>
                                      {Object.keys(action.params).length > 0 && (
                                        <div className="mt-2">
                                          <p className="text-xs text-gray-500 mb-1">Parameters:</p>
                                          <pre className="text-xs bg-blue-50 p-2 rounded-lg overflow-x-auto border border-blue-100">
                                            {JSON.stringify(action.params, null, 2)}
                                          </pre>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="p-4 text-center border-2 border-dashed border-gray-300 rounded-xl bg-white">
                                <p className="text-sm text-blue-400">No entry actions defined</p>
                              </div>
                            )}
                          </div>
                          
                          {/* Exit Actions */}
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="h-1 w-6 bg-red-500 rounded"></div>
                              <h4 className="text-sm font-semibold text-gray-700">Exit Actions</h4>
                              <span className="text-xs text-gray-500 ml-auto">
                                ({stage.exitActions.length})
                              </span>
                            </div>
                            {stage.exitActions.length > 0 ? (
                              <div className="space-y-3">
                                {stage.exitActions.map((action, idx) => {
                                  const ActionIcon = getActionIcon(action.actionType);
                                  return (
                                    <div
                                      key={idx}
                                      className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition-all"
                                    >
                                      <div className="flex items-center gap-3 mb-2">
                                        <div className={`p-2 rounded-lg ${getActionColor(action.actionType)}`}>
                                          <ActionIcon className="h-4 w-4" />
                                        </div>
                                        <span className="font-medium text-gray-900 capitalize">
                                          {action.actionType.replace(/([A-Z])/g, ' $1').trim()}
                                        </span>
                                      </div>
                                      {Object.keys(action.params).length > 0 && (
                                        <div className="mt-2">
                                          <p className="text-xs text-gray-500 mb-1">Parameters:</p>
                                          <pre className="text-xs bg-blue-50 p-2 rounded-lg overflow-x-auto border border-blue-100">
                                            {JSON.stringify(action.params, null, 2)}
                                          </pre>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="p-4 text-center border-2 border-dashed border-gray-300 rounded-xl bg-white">
                                <p className="text-sm text-blue-400">No exit actions defined</p>
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
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="text-center py-12">
                <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Usage Analytics</h3>
                <p className="text-gray-600 mb-6">
                  Usage tracking for this blueprint will be available soon.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="text-2xl font-bold text-gray-900">0</div>
                    <div className="text-sm text-gray-500">Active Records</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <div className="text-2xl font-bold text-gray-900">0</div>
                    <div className="text-sm text-gray-500">Total Completions</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="text-center py-12">
                <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Change History</h3>
                <p className="text-gray-600">
                  Version history and change tracking will be available soon.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Blueprint</h3>
                <p className="text-gray-600 text-sm mt-1">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <strong className="text-red-600">{blueprint.name}</strong>?
              This blueprint will be permanently removed and cannot be recovered.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all"
              >
                Delete Blueprint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}