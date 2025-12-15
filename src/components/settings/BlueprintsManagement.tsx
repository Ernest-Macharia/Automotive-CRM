'use client';

import { useState, useEffect } from 'react';
import {
  Layers,
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
  Zap,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { settingsService, Blueprint } from '@/services/settingsService';
import CreateBlueprintModal from './CreateBlueprintModal';

export default function BlueprintsManagement() {
  const { showToast } = useToast();
  
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedBlueprint, setExpandedBlueprint] = useState<string | null>(null);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint | null>(null);
  
  const modules = ['opportunities', 'quotes', 'customers', 'jobs', 'inventory'];

  useEffect(() => {
    loadBlueprints();
  }, []);

  const loadBlueprints = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getBlueprints();
      setBlueprints(data);
    } catch (error) {
      console.error('Error loading blueprints:', error);
      showToast('Failed to load blueprints', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBlueprint = async (data: any) => {
    try {
      const newBlueprint = await settingsService.createBlueprint(data);
      setBlueprints(prev => [newBlueprint, ...prev]);
      showToast('Blueprint created successfully', 'success');
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating blueprint:', error);
      showToast('Failed to create blueprint', 'error');
    }
  };

  const handleToggleStatus = async (blueprint: Blueprint) => {
    try {
      const updatedBlueprint = await settingsService.updateBlueprint(blueprint.id, {
        isActive: !blueprint.isActive,
      });
      setBlueprints(prev => prev.map(b => b.id === blueprint.id ? updatedBlueprint : b));
      showToast(
        `Blueprint ${blueprint.isActive ? 'deactivated' : 'activated'} successfully`,
        'success'
      );
    } catch (error) {
      console.error('Error toggling blueprint status:', error);
      showToast('Failed to update blueprint status', 'error');
    }
  };

  const handleDeleteBlueprint = async (blueprint: Blueprint) => {
    if (!confirm('Are you sure you want to delete this blueprint? This action cannot be undone.')) return;
    
    try {
      await settingsService.deleteBlueprint(blueprint.id);
      setBlueprints(prev => prev.filter(b => b.id !== blueprint.id));
      showToast('Blueprint deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting blueprint:', error);
      showToast('Failed to delete blueprint', 'error');
    }
  };

  const handleTestAutomation = async (blueprint: Blueprint) => {
    try {
      await settingsService.testBlueprintAutomation({
        name: `Test: ${blueprint.name}`,
        module: blueprint.module,
        stages: blueprint.stages,
      });
      showToast('Blueprint automation test completed successfully', 'success');
    } catch (error) {
      console.error('Error testing blueprint automation:', error);
      showToast('Failed to test blueprint automation', 'error');
    }
  };

  const filteredBlueprints = blueprints.filter(blueprint => {
    const matchesSearch = 
      blueprint.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blueprint.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesModule = filterModule === 'all' || blueprint.module === filterModule;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' ? blueprint.isActive : !blueprint.isActive);
    
    return matchesSearch && matchesModule && matchesStatus;
  });

  const getStageColor = (index: number) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-purple-100 text-purple-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-red-100 text-red-800',
      'bg-indigo-100 text-indigo-800',
    ];
    return colors[index % colors.length];
  };

  const toggleExpandBlueprint = (blueprintId: string) => {
    setExpandedBlueprint(expandedBlueprint === blueprintId ? null : blueprintId);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Layers className="h-6 w-6 text-green-500" />
            Process Blueprints
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Design workflow templates and process stages
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-sm hover:shadow"
        >
          <Plus className="h-4 w-4" />
          New Blueprint
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-green-50 to-emerald-100 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Total Blueprints</p>
              <p className="text-2xl font-bold text-green-800">{blueprints.length}</p>
            </div>
            <Layers className="h-8 w-8 text-green-500 opacity-70" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Active</p>
              <p className="text-2xl font-bold text-blue-800">
                {blueprints.filter(b => b.isActive).length}
              </p>
            </div>
            <Play className="h-8 w-8 text-blue-500 opacity-70" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium">Opportunity Blueprints</p>
              <p className="text-2xl font-bold text-purple-800">
                {blueprints.filter(b => b.module === 'opportunities').length}
              </p>
            </div>
            <Users className="h-8 w-8 text-purple-500 opacity-70" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 font-medium">Average Stages</p>
              <p className="text-2xl font-bold text-orange-800">
                {blueprints.length > 0 
                  ? Math.round(blueprints.reduce((acc, b) => acc + b.stages.length, 0) / blueprints.length)
                  : 0
                }
              </p>
            </div>
            <Layers className="h-8 w-8 text-orange-500 opacity-70" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search blueprints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Modules</option>
            {modules.map(module => (
              <option key={module} value={module}>
                {module.charAt(0).toUpperCase() + module.slice(1)}
              </option>
            ))}
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
          
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterModule('all');
              setFilterStatus('all');
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Blueprints List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : filteredBlueprints.length === 0 ? (
        <div className="text-center py-12">
          <Layers className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No blueprints found</h3>
          <p className="text-gray-500 mb-6">Create your first blueprint to define process workflows</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all"
          >
            <Plus className="h-4 w-4" />
            Create Blueprint
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBlueprints.map((blueprint) => (
            <div
              key={blueprint.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{blueprint.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {blueprint.module}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          blueprint.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {blueprint.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    
                    {blueprint.description && (
                      <p className="text-sm text-gray-600 mb-3">{blueprint.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>
                        {blueprint.stages.length} stage{blueprint.stages.length !== 1 ? 's' : ''}
                      </span>
                      <span>•</span>
                      <span>
                        Created {new Date(blueprint.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => toggleExpandBlueprint(blueprint.id)}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title={expandedBlueprint === blueprint.id ? 'Collapse' : 'Expand'}
                    >
                      {expandedBlueprint === blueprint.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleTestAutomation(blueprint)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Test Automation"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleToggleStatus(blueprint)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        blueprint.isActive
                          ? 'text-red-600 hover:bg-red-50'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={blueprint.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {blueprint.isActive ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => setSelectedBlueprint(blueprint)}
                      className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Edit Blueprint"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteBlueprint(blueprint)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Blueprint"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Stages View */}
                {expandedBlueprint === blueprint.id && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4">Process Stages</h4>
                    <div className="relative">
                      {/* Connection Line */}
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                      
                      <div className="space-y-4">
                        {blueprint.stages
                          .sort((a, b) => a.order - b.order)
                          .map((stage, index) => (
                            <div key={stage.id} className="relative flex items-start">
                              {/* Stage Number */}
                              <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getStageColor(index)}`}>
                                <span className="text-sm font-semibold">{index + 1}</span>
                              </div>
                              
                              {/* Stage Content */}
                              <div className="ml-6 flex-1">
                                <div className="bg-gray-50 rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <div>
                                      <h5 className="font-medium text-gray-900">{stage.name}</h5>
                                      <p className="text-xs text-gray-500">Order: {stage.order}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {stage.allowedRoles.map((role, idx) => (
                                        <span
                                          key={idx}
                                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700"
                                        >
                                          {role}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Entry Actions */}
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 mb-2">Entry Actions</p>
                                      {stage.entryActions.length > 0 ? (
                                        <div className="space-y-2">
                                          {stage.entryActions.map((action, idx) => (
                                            <div
                                              key={idx}
                                              className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200"
                                            >
                                              {action.actionType === 'sendEmail' && (
                                                <Mail className="h-3 w-3 text-blue-500" />
                                              )}
                                              {action.actionType === 'createTask' && (
                                                <Calendar className="h-3 w-3 text-green-500" />
                                              )}
                                              <span className="text-xs text-gray-700">
                                                {action.actionType}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-xs text-gray-400">No entry actions</p>
                                      )}
                                    </div>
                                    
                                    {/* Exit Actions */}
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 mb-2">Exit Actions</p>
                                      {stage.exitActions.length > 0 ? (
                                        <div className="space-y-2">
                                          {stage.exitActions.map((action, idx) => (
                                            <div
                                              key={idx}
                                              className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200"
                                            >
                                              {action.actionType === 'sendEmail' && (
                                                <Mail className="h-3 w-3 text-blue-500" />
                                              )}
                                              {action.actionType === 'createTask' && (
                                                <Calendar className="h-3 w-3 text-green-500" />
                                              )}
                                              <span className="text-xs text-gray-700">
                                                {action.actionType}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-xs text-gray-400">No exit actions</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Blueprint Modal */}
      <CreateBlueprintModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateBlueprint}
      />
    </div>
  );
}