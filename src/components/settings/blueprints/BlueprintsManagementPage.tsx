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
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Download,
  RefreshCw,
  X,
  MoreVertical
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { blueprintsService, Blueprint } from '@/services/settings/blueprintsService';

// ✨ Keep your improved skeletons
const BlueprintCardSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-2xl p-6 animate-pulse shadow-sm">
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
              <div key={i} className="h-9 w-9 bg-gray-200 rounded-lg"></div>
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
      <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm animate-pulse">
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
  // Add expandedRow state for kebab menu
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [integrationLoading, setIntegrationLoading] = useState(false);

  useEffect(() => {
    loadBlueprints();
  }, []);

  // Keep all your existing logic functions — no changes needed
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
      setExpandedRow(null);
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
      setExpandedRow(null);
    } catch (error) {
      console.error('Error testing blueprint automation:', error);
      showToast('Failed to test blueprint automation', 'error');
    }
  };

  const handleCheckEmailStatus = async () => {
    try {
      setIntegrationLoading(true);
      const result = await blueprintsService.getBlueprintEmailStatus();
      const statusText =
        result?.status ||
        result?.message ||
        (result?.configured ? 'Configured' : 'Not configured');
      showToast(`Blueprint email status: ${statusText}`, 'success');
    } catch (error) {
      console.error('Error checking blueprint email status:', error);
      showToast('Failed to check blueprint email status', 'error');
    } finally {
      setIntegrationLoading(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      setIntegrationLoading(true);
      await blueprintsService.testBlueprintEmail();
      showToast('Blueprint email test completed', 'success');
    } catch (error) {
      console.error('Error testing blueprint email:', error);
      showToast('Failed to test blueprint email', 'error');
    } finally {
      setIntegrationLoading(false);
    }
  };

  const handleSendTestNotification = async (blueprint: Blueprint) => {
    const recipient = prompt('Enter test recipient email');
    if (!recipient) return;

    try {
      setIntegrationLoading(true);
      await blueprintsService.sendTestBlueprintNotification({
        blueprintId: blueprint.id,
        module: blueprint.module,
        recipient,
        message: `Test notification for blueprint: ${blueprint.name}`,
      });
      showToast('Test blueprint notification sent', 'success');
      setExpandedRow(null);
    } catch (error) {
      console.error('Error sending test blueprint notification:', error);
      showToast('Failed to send test blueprint notification', 'error');
    } finally {
      setIntegrationLoading(false);
    }
  };

  const handleViewAllowedTransitions = async (blueprint: Blueprint) => {
    try {
      setIntegrationLoading(true);
      const transitions = await blueprintsService.getAllowedTransitions(blueprint.id);
      showToast(
        `Allowed transitions: ${Array.isArray(transitions) ? transitions.length : 0}`,
        'success'
      );
      setExpandedRow(null);
    } catch (error) {
      console.error('Error loading allowed transitions:', error);
      showToast('Failed to load allowed transitions', 'error');
    } finally {
      setIntegrationLoading(false);
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
      'bg-blue-500',
      'bg-purple-500',
      'bg-cyan-500',
      'bg-indigo-500',
      'bg-violet-500',
      'bg-fuchsia-500',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Layers className="h-6 w-6 text-blue-600" />
              Process Blueprints
            </h1>
            <p className="text-gray-600 mt-1">
              Design and manage workflow templates and process automation stages
            </p>
          </div>
          
	          <div className="flex gap-3">
	            <button
	              onClick={handleCheckEmailStatus}
	              disabled={integrationLoading}
	              className="flex items-center gap-2 px-3 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
	              aria-label="Check blueprint email status"
	            >
	              <Mail className="h-4 w-4" />
	              <span className="hidden sm:inline">Email Status</span>
	            </button>
	            <button
	              onClick={handleTestEmail}
	              disabled={integrationLoading}
	              className="flex items-center gap-2 px-3 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
	              aria-label="Test blueprint email"
	            >
	              <Mail className="h-4 w-4" />
	              <span className="hidden sm:inline">Test Email</span>
	            </button>
	            <button
	              onClick={handleRefresh}
	              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              aria-label="Refresh blueprints"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={handleCreateBlueprint}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
            >
              <Plus className="h-5 w-5" />
              New Blueprint
            </button>
          </div>
        </div>

        {/* Stats */}
        {loading ? (
          <StatsSkeleton />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Blueprints', value: blueprints.length, icon: Layers, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Active', value: blueprints.filter(b => b.isActive).length, icon: Play, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Opportunities', value: blueprints.filter(b => b.module === 'opportunities').length, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Avg Stages', value: blueprints.length ? Math.round(blueprints.reduce((acc, b) => acc + b.stages.length, 0) / blueprints.length) : 0, icon: Layers, color: 'text-cyan-600', bg: 'bg-cyan-50' },
            ].map((stat, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
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
                    {i === 0 ? '+12% from last month' : i === 1 ? `${((stat.value / blueprints.length) * 100).toFixed(0)}% of total` : i === 2 ? 'Most used module' : 'Per blueprint'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedBlueprints.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center h-8 w-8 bg-blue-100 text-blue-800 rounded-md font-medium">
              {selectedBlueprints.length}
            </span>
            <span className="text-sm text-blue-800 font-medium">
              {selectedBlueprints.length} selected
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
          <div className="lg:col-span-5">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search blueprints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
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
              <option value="opportunities">Opportunities</option>
              <option value="quotes">Quotes</option>
              <option value="invoices">Invoices</option>
              <option value="payments">Payments</option>
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
          
          <div className="lg:col-span-2 flex gap-2">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterModule('all');
                setFilterStatus('all');
                setSelectedBlueprints([]);
              }}
              className="flex-1 px-3 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Clear
            </button>
            <button
              className="flex-1 px-3 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Filter className="h-4 w-4 inline mr-1" /> Apply
            </button>
          </div>
        </div>
      </div>

      {/* Blueprints List */}
      {loading ? (
        <div className="space-y-5">
          {[1, 2, 3].map((i) => (
            <BlueprintCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredBlueprints.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center h-16 w-16 bg-blue-50 rounded-full mb-5">
            <Layers className="h-8 w-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No blueprints found</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            Create your first blueprint to define workflow templates and process automation.
          </p>
          <button
            onClick={handleCreateBlueprint}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm"
          >
            <Plus className="h-4 w-4" /> Create Blueprint
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredBlueprints.map((blueprint) => (
            <div
              key={blueprint.id}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex gap-4">
                  <input
                    type="checkbox"
                    checked={selectedBlueprints.includes(blueprint.id)}
                    onChange={() => handleSelectBlueprint(blueprint.id)}
                    className="mt-1 h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    aria-label={`Select ${blueprint.name}`}
                  />
                  
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{blueprint.name}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                            {blueprint.module}
                          </span>
                          <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                            blueprint.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {blueprint.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className="text-sm text-gray-600">
                            {blueprint.stages.length} stage{blueprint.stages.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {/* KEBAB MENU FOR SECONDARY ACTIONS */}
                      <div className="flex items-center gap-2">
                        {/* Primary Actions - with text */}
                        <button
                          onClick={() => handleEditBlueprint(blueprint.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          <Edit className="h-4 w-4" /> Edit
                        </button>

                        <button
                          onClick={() => handleToggleStatus(blueprint)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border ${
                            blueprint.isActive
                              ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                              : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                          }`}
                        >
                          {blueprint.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          {blueprint.isActive ? 'Deactivate' : 'Activate'}
                        </button>

                        {/* Kebab Menu */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedRow(expandedRow === blueprint.id ? null : blueprint.id);
                            }}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                            aria-haspopup="true"
                            aria-expanded={expandedRow === blueprint.id}
                            aria-label="More actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {expandedRow === blueprint.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setExpandedRow(null)}
                              />
                              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setExpandedRow(null);
                                    handleViewDetails(blueprint.id);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <ArrowRight className="h-4 w-4" />
                                  View Details
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setExpandedRow(null);
                                    handleTestAutomation(blueprint);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Play className="h-4 w-4" />
                                  Test Automation
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleViewAllowedTransitions(blueprint);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <ArrowRight className="h-4 w-4" />
                                  Allowed Transitions
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleSendTestNotification(blueprint);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Mail className="h-4 w-4" />
                                  Send Test Email
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setExpandedRow(null);
                                    handleDeleteBlueprint(blueprint);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setExpandedBlueprint(expandedBlueprint === blueprint.id ? null : blueprint.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                    >
                      {expandedBlueprint === blueprint.id ? (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          Hide stages
                        </>
                      ) : (
                        <>
                          <ChevronRight className="h-4 w-4" />
                          View stages ({blueprint.stages.length})
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Stages */}
                {expandedBlueprint === blueprint.id && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4">Process Stages</h4>
                    <div className="space-y-6">
                      {blueprint.stages
                        .sort((a, b) => a.order - b.order)
                        .map((stage, index) => (
                          <div key={stage.id} className="flex gap-4">
                            <div className="relative flex-shrink-0">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${getStageColor(index)}`}>
                                {index + 1}
                              </div>
                              {index < blueprint.stages.length - 1 && (
                                <div className="absolute top-9 bottom-0 left-3.5 w-0.5 bg-gray-200"></div>
                              )}
                            </div>
                            <div className="flex-1 bg-gray-50 p-4 rounded-xl">
                              <div className="flex flex-wrap justify-between gap-2 mb-3">
                                <h5 className="font-semibold text-gray-900">{stage.name}</h5>
                                <div className="flex gap-1">
                                  {stage.allowedRoles.map((role, i) => (
                                    <span key={i} className="px-2 py-1 bg-white border border-gray-300 text-xs rounded">
                                      {role}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Entry Actions */}
                                <div>
                                  <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-2">
                                    <span className="h-1 w-4 bg-green-500 rounded"></span>
                                    Entry Actions
                                  </p>
                                  {stage.entryActions.length > 0 ? (
                                    <div className="space-y-2">
                                      {stage.entryActions.map((action, i) => (
                                        <div key={i} className="flex items-start gap-2 p-2.5 bg-white border rounded-lg">
                                          {action.actionType === 'sendEmail' && <Mail className="h-4 w-4 text-blue-600 mt-0.5" />}
                                          {action.actionType === 'createTask' && <Calendar className="h-4 w-4 text-green-600 mt-0.5" />}
                                          <span className="text-sm text-gray-700">{action.actionType}</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-gray-500 italic">None</p>
                                  )}
                                </div>

                                {/* Exit Actions */}
                                <div>
                                  <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-2">
                                    <span className="h-1 w-4 bg-red-500 rounded"></span>
                                    Exit Actions
                                  </p>
                                  {stage.exitActions.length > 0 ? (
                                    <div className="space-y-2">
                                      {stage.exitActions.map((action, i) => (
                                        <div key={i} className="flex items-start gap-2 p-2.5 bg-white border rounded-lg">
                                          {action.actionType === 'sendEmail' && <Mail className="h-4 w-4 text-blue-600 mt-0.5" />}
                                          {action.actionType === 'createTask' && <Calendar className="h-4 w-4 text-green-600 mt-0.5" />}
                                          <span className="text-sm text-gray-700">{action.actionType}</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-gray-500 italic">None</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  Created {new Date(blueprint.createdAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleViewDetails(blueprint.id)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                >
                  View details <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
