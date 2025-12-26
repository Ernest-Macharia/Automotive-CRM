'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  ArrowRight,
  Download,
  Upload,
  RefreshCw,
  Loader2,
  X,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { blueprintsService, Blueprint } from '@/services/settings/blueprintsService';

// Skeleton Loading Components
const BlueprintCardSkeleton = () => (
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

export default function BlueprintsManagementPage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedBlueprint, setExpandedBlueprint] = useState<string | null>(null);
  const [selectedBlueprints, setSelectedBlueprints] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBlueprints();
  }, []);

  const loadBlueprints = async () => {
    try {
      setLoading(true);
      const data = await blueprintsService.getBlueprints();
      setBlueprints(data);
    } catch (error) {
      console.error('Error loading blueprints:', error);
      showToast('Failed to load blueprints', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBlueprints();
    setRefreshing(false);
    showToast('Blueprints refreshed successfully', 'success');
  };

  const handleCreateBlueprint = () => {
    router.push('/settings/blueprints/create');
  };

  const handleViewDetails = (id: string) => {
    if (!id || id === 'undefined') {
      showToast('Invalid blueprint ID', 'error');
      return;
    }
    router.push(`/settings/blueprints/${id}`);
  };

  const handleEditBlueprint = (id: string) => {
    if (!id || id === 'undefined') {
      showToast('Invalid blueprint ID', 'error');
      return;
    }
    router.push(`/settings/blueprints/${id}/edit`);
  };

  const handleToggleStatus = async (blueprint: Blueprint) => {
    try {
      const updatedBlueprint = await blueprintsService.updateBlueprint(blueprint.id, {
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
      await blueprintsService.deleteBlueprint(blueprint.id);
      setBlueprints(prev => prev.filter(b => b.id !== blueprint.id));
      showToast('Blueprint deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting blueprint:', error);
      showToast('Failed to delete blueprint', 'error');
    }
  };

  const handleTestAutomation = async (blueprint: Blueprint) => {
    try {
      await blueprintsService.testBlueprintAutomation({
        name: `Test: ${blueprint.name}`,
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
    } catch (error) {
      console.error('Error testing blueprint automation:', error);
      showToast('Failed to test blueprint automation', 'error');
    }
  };

  const handleSelectAll = () => {
    if (selectedBlueprints.length === blueprints.length) {
      setSelectedBlueprints([]);
    } else {
      setSelectedBlueprints(blueprints.map(b => b.id));
    }
  };

  const handleSelectBlueprint = (id: string) => {
    setSelectedBlueprints(prev =>
      prev.includes(id)
        ? prev.filter(blueprintId => blueprintId !== id)
        : [...prev, id]
    );
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
      'bg-gradient-to-r from-blue-500 to-blue-600',
      'bg-gradient-to-r from-purple-500 to-purple-600',
      'bg-gradient-to-r from-cyan-500 to-cyan-600',
      'bg-gradient-to-r from-indigo-500 to-indigo-600',
      'bg-gradient-to-r from-violet-500 to-violet-600',
      'bg-gradient-to-r from-fuchsia-500 to-fuchsia-600',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                <Layers className="h-6 w-6 text-white" />
              </div>
              Process Blueprints
            </h1>
            <p className="text-gray-600 mt-2">
              Design and manage workflow templates and process automation stages
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
              onClick={handleCreateBlueprint}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="h-5 w-5" />
              New Blueprint
            </button>
          </div>
        </div>

        {/* Stats Cards with Skeleton */}
        {loading ? (
          <StatsSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6 hover:shadow-lg transition-all hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Blueprints</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{blueprints.length}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl">
                  <Layers className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-blue-100/30">
                <div className="text-xs text-blue-600 font-medium">
                  <span className="text-green-600">+12%</span> from last month
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6 hover:shadow-lg transition-all hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Active</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {blueprints.filter(b => b.isActive).length}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl">
                  <Play className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-blue-100/30">
                <div className="text-xs text-gray-500">
                  {((blueprints.filter(b => b.isActive).length / blueprints.length) * 100).toFixed(0)}% of total
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6 hover:shadow-lg transition-all hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Opportunities</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {blueprints.filter(b => b.module === 'opportunities').length}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-blue-100/30">
                <div className="text-xs text-gray-500">
                  Most used module
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6 hover:shadow-lg transition-all hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Avg Stages</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {blueprints.length > 0 
                      ? Math.round(blueprints.reduce((acc, b) => acc + b.stages.length, 0) / blueprints.length)
                      : 0
                    }
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl">
                  <Layers className="h-6 w-6 text-cyan-600" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-blue-100/30">
                <div className="text-xs text-gray-500">
                  Per blueprint
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Bar */}
      {selectedBlueprints.length > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50/80 to-purple-50/80 backdrop-blur-sm border border-blue-200/50 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-700 font-medium">{selectedBlueprints.length}</span>
            </div>
            <span className="text-sm text-blue-800 font-medium">
              {selectedBlueprints.length} blueprint{selectedBlueprints.length !== 1 ? 's' : ''} selected
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
          <div className="lg:col-span-5">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400" />
              <input
                type="text"
                placeholder="Search blueprints by name, description, or module..."
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
              <option value="opportunities">Opportunities</option>
              <option value="quotes">Quotes</option>
              <option value="customers">Customers</option>
              <option value="jobs">Jobs</option>
              <option value="inventory">Inventory</option>
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
          
          <div className="lg:col-span-2 flex gap-2">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterModule('all');
                setFilterStatus('all');
                setSelectedBlueprints([]);
              }}
              className="flex-1 px-4 py-3 border border-blue-200 text-blue-700 bg-white/50 rounded-xl hover:bg-blue-50 transition-colors"
            >
              Clear
            </button>
            <button
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
            >
              <Filter className="h-5 w-5 inline mr-2" />
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Blueprints List */}
      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <BlueprintCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredBlueprints.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Layers className="h-12 w-12 text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No blueprints found</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Create your first blueprint to define workflow templates and process automation
          </p>
          <button
            onClick={handleCreateBlueprint}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-base font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-5 w-5" />
            Create Blueprint
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredBlueprints.map((blueprint) => (
            <div
              key={blueprint.id}
              className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group"
            >
              <div className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <input
                    type="checkbox"
                    checked={selectedBlueprints.includes(blueprint.id)}
                    onChange={() => handleSelectBlueprint(blueprint.id)}
                    className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-blue-300 rounded"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                          {blueprint.name}
                        </h3>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200">
                            {blueprint.module.charAt(0).toUpperCase() + blueprint.module.slice(1)}
                          </span>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            blueprint.isActive
                              ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200'
                              : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border border-gray-200'
                          }`}>
                            {blueprint.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className="text-sm text-blue-600">
                            {blueprint.stages.length} stage{blueprint.stages.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(blueprint.id)}
                          className="p-2.5 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all hover:scale-110"
                          title="View Details"
                        >
                          <ArrowRight className="h-5 w-5" />
                        </button>
                        
                        <button
                          onClick={() => handleTestAutomation(blueprint)}
                          className="p-2.5 bg-gradient-to-r from-cyan-50 to-cyan-100 text-cyan-600 rounded-xl hover:from-cyan-100 hover:to-cyan-200 transition-all hover:scale-110"
                          title="Test Automation"
                        >
                          <Play className="h-5 w-5" />
                        </button>
                        
                        <button
                          onClick={() => handleToggleStatus(blueprint)}
                          className={`p-2.5 rounded-xl transition-all hover:scale-110 ${
                            blueprint.isActive
                              ? 'bg-gradient-to-r from-red-50 to-red-100 text-red-600 hover:from-red-100 hover:to-red-200'
                              : 'bg-gradient-to-r from-green-50 to-green-100 text-green-600 hover:from-green-100 hover:to-green-200'
                          }`}
                          title={blueprint.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {blueprint.isActive ? (
                            <Pause className="h-5 w-5" />
                          ) : (
                            <Play className="h-5 w-5" />
                          )}
                        </button>
                        
                        <button
                          onClick={() => handleEditBlueprint(blueprint.id)}
                          className="p-2.5 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-600 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all hover:scale-110"
                          title="Edit Blueprint"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteBlueprint(blueprint)}
                          className="p-2.5 bg-gradient-to-r from-red-50 to-red-100 text-red-600 rounded-xl hover:from-red-100 hover:to-red-200 transition-all hover:scale-110"
                          title="Delete Blueprint"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    
                    {blueprint.description && (
                      <p className="text-gray-600 mb-6">{blueprint.description}</p>
                    )}
                    
                    <button
                      onClick={() => setExpandedBlueprint(expandedBlueprint === blueprint.id ? null : blueprint.id)}
                      className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      {expandedBlueprint === blueprint.id ? (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          Hide Stages
                        </>
                      ) : (
                        <>
                          <ChevronRight className="h-4 w-4" />
                          View Stages ({blueprint.stages.length})
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Stages View */}
                {expandedBlueprint === blueprint.id && (
                  <div className="mt-8 pt-8 border-t border-blue-100/50">
                    <h4 className="text-sm font-semibold text-gray-700 mb-6 uppercase tracking-wider">Process Stages</h4>
                    <div className="relative">
                      {/* Timeline Line */}
                      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-indigo-500"></div>
                      
                      <div className="space-y-8">
                        {blueprint.stages
                          .sort((a, b) => a.order - b.order)
                          .map((stage, index) => (
                            <div key={stage.id} className="relative flex items-start">
                              {/* Stage Number */}
                              <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-lg ${getStageColor(index)}`}>
                                {index + 1}
                              </div>
                              
                              {/* Stage Content */}
                              <div className="ml-8 flex-1">
                                <div className="bg-gradient-to-br from-blue-50/50 to-white border border-blue-100/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                  <div className="flex items-start justify-between mb-4">
                                    <div>
                                      <h5 className="font-bold text-gray-900 text-lg">{stage.name}</h5>
                                      <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                          Order: {stage.order}
                                        </span>
                                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                          {stage.allowedRoles.length} role{stage.allowedRoles.length !== 1 ? 's' : ''}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {stage.allowedRoles.map((role, idx) => (
                                        <span
                                          key={idx}
                                          className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200"
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
                                        <div className="h-1 w-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded"></div>
                                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Entry Actions</p>
                                      </div>
                                      {stage.entryActions.length > 0 ? (
                                        <div className="space-y-2">
                                          {stage.entryActions.map((action, idx) => (
                                            <div
                                              key={idx}
                                              className="flex items-center gap-3 p-3 bg-white border border-blue-100 rounded-xl hover:border-green-200 hover:bg-green-50/30 transition-colors"
                                            >
                                              {action.actionType === 'sendEmail' && (
                                                <div className="p-2 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                                                  <Mail className="h-4 w-4 text-blue-600" />
                                                </div>
                                              )}
                                              {action.actionType === 'createTask' && (
                                                <div className="p-2 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                                                  <Calendar className="h-4 w-4 text-green-600" />
                                                </div>
                                              )}
                                              <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">{action.actionType}</p>
                                                {Object.keys(action.params).length > 0 && (
                                                  <p className="text-xs text-gray-500 mt-1 truncate">
                                                    {JSON.stringify(action.params)}
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="p-4 text-center border-2 border-dashed border-blue-200 rounded-xl">
                                          <p className="text-sm text-blue-400">No entry actions defined</p>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Exit Actions */}
                                    <div>
                                      <div className="flex items-center gap-2 mb-3">
                                        <div className="h-1 w-6 bg-gradient-to-r from-red-500 to-pink-500 rounded"></div>
                                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Exit Actions</p>
                                      </div>
                                      {stage.exitActions.length > 0 ? (
                                        <div className="space-y-2">
                                          {stage.exitActions.map((action, idx) => (
                                            <div
                                              key={idx}
                                              className="flex items-center gap-3 p-3 bg-white border border-blue-100 rounded-xl hover:border-red-200 hover:bg-red-50/30 transition-colors"
                                            >
                                              {action.actionType === 'sendEmail' && (
                                                <div className="p-2 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                                                  <Mail className="h-4 w-4 text-blue-600" />
                                                </div>
                                              )}
                                              {action.actionType === 'createTask' && (
                                                <div className="p-2 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                                                  <Calendar className="h-4 w-4 text-green-600" />
                                                </div>
                                              )}
                                              <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">{action.actionType}</p>
                                                {Object.keys(action.params).length > 0 && (
                                                  <p className="text-xs text-gray-500 mt-1 truncate">
                                                    {JSON.stringify(action.params)}
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="p-4 text-center border-2 border-dashed border-blue-200 rounded-xl">
                                          <p className="text-sm text-blue-400">No exit actions defined</p>
                                        </div>
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
              
              {/* Footer */}
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-t border-blue-100/50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-blue-600">
                    Created {new Date(blueprint.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  <button
                    onClick={() => handleViewDetails(blueprint.id)}
                    className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    View Details
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}