'use client';

import { useState, useEffect } from 'react';
import {
  Workflow,
  Plus,
  Play,
  Pause,
  Edit,
  Trash2,
  Filter,
  Search,
  Calendar,
  Users,
  Bell,
  Mail,
  Zap,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { settingsService, Workflow as WorkflowType } from '@/services/settingsService';
import CreateWorkflowModal from './CreateWorkflowModal';

export default function WorkflowsManagement() {
  const { showToast } = useToast();
  
  const [workflows, setWorkflows] = useState<WorkflowType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowType | null>(null);
  
  const modules = ['leads', 'opportunities', 'quotes', 'customers', 'jobs'];

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getWorkflows();
      setWorkflows(data);
    } catch (error) {
      console.error('Error loading workflows:', error);
      showToast('Failed to load workflows', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = async (data: any) => {
    try {
      const newWorkflow = await settingsService.createWorkflow(data);
      setWorkflows(prev => [newWorkflow, ...prev]);
      showToast('Workflow created successfully', 'success');
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating workflow:', error);
      showToast('Failed to create workflow', 'error');
    }
  };

  const handleToggleStatus = async (workflow: WorkflowType) => {
    try {
      const updatedWorkflow = await settingsService.updateWorkflow(workflow.id, {
        isActive: !workflow.isActive,
      });
      setWorkflows(prev => prev.map(w => w.id === workflow.id ? updatedWorkflow : w));
      showToast(
        `Workflow ${workflow.isActive ? 'deactivated' : 'activated'} successfully`,
        'success'
      );
    } catch (error) {
      console.error('Error toggling workflow status:', error);
      showToast('Failed to update workflow status', 'error');
    }
  };

  const handleDeleteWorkflow = async (workflow: WorkflowType) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    
    try {
      await settingsService.deleteWorkflow(workflow.id);
      setWorkflows(prev => prev.filter(w => w.id !== workflow.id));
      showToast('Workflow deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting workflow:', error);
      showToast('Failed to delete workflow', 'error');
    }
  };

  const handleTestAutomation = async () => {
    try {
      await settingsService.testWorkflowAutomation();
      showToast('Automation test completed successfully', 'success');
    } catch (error) {
      console.error('Error testing automation:', error);
      showToast('Failed to test automation', 'error');
    }
  };

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = 
      workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflow.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesModule = filterModule === 'all' || workflow.module === filterModule;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' ? workflow.isActive : !workflow.isActive);
    
    return matchesSearch && matchesModule && matchesStatus;
  });

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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Workflow className="h-6 w-6 text-purple-500" />
            Workflow Automation
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Automate processes and trigger actions based on events
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleTestAutomation}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-sm hover:shadow"
          >
            <Play className="h-4 w-4" />
            Test Automation
          </button>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-sm hover:shadow"
          >
            <Plus className="h-4 w-4" />
            New Workflow
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium">Total Workflows</p>
              <p className="text-2xl font-bold text-purple-800">{workflows.length}</p>
            </div>
            <Workflow className="h-8 w-8 text-purple-500 opacity-70" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Active</p>
              <p className="text-2xl font-bold text-green-800">
                {workflows.filter(w => w.isActive).length}
              </p>
            </div>
            <Play className="h-8 w-8 text-green-500 opacity-70" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Lead Workflows</p>
              <p className="text-2xl font-bold text-blue-800">
                {workflows.filter(w => w.module === 'leads').length}
              </p>
            </div>
            <Zap className="h-8 w-8 text-blue-500 opacity-70" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 font-medium">Email Actions</p>
              <p className="text-2xl font-bold text-orange-800">
                {workflows.reduce((acc, w) => 
                  acc + w.actions.filter(a => a.actionType === 'sendEmail').length, 0
                )}
              </p>
            </div>
            <Mail className="h-8 w-8 text-orange-500 opacity-70" />
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
              placeholder="Search workflows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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

      {/* Workflows Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : filteredWorkflows.length === 0 ? (
        <div className="text-center py-12">
          <Workflow className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows found</h3>
          <p className="text-gray-500 mb-6">Create your first workflow to automate processes</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            <Plus className="h-4 w-4" />
            Create Workflow
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkflows.map((workflow) => {
            const ActionIcon = getActionIcon(workflow.actions[0]?.actionType);
            
            return (
              <div
                key={workflow.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {workflow.module}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {workflow.triggerEvent}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleToggleStatus(workflow)}
                      className={`p-1.5 rounded-full ${
                        workflow.isActive
                          ? 'text-green-600 bg-green-50 hover:bg-green-100'
                          : 'text-gray-400 bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      {workflow.isActive ? (
                        <Play className="h-4 w-4" />
                      ) : (
                        <Pause className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  
                  {workflow.description && (
                    <p className="text-sm text-gray-600 mb-4">{workflow.description}</p>
                  )}
                  
                  <div className="mb-4">
                    <h4 className="text-xs font-medium text-gray-500 mb-2">ACTIONS</h4>
                    <div className="flex flex-wrap gap-2">
                      {workflow.actions.slice(0, 3).map((action, index) => {
                        const Icon = getActionIcon(action.actionType);
                        return (
                          <div
                            key={index}
                            className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-md"
                          >
                            <Icon className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-700">{action.actionType}</span>
                          </div>
                        );
                      })}
                      {workflow.actions.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{workflow.actions.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      Created {new Date(workflow.createdAt).toLocaleDateString()}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedWorkflow(workflow)}
                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteWorkflow(workflow)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Workflow Modal */}
      <CreateWorkflowModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateWorkflow}
      />
    </div>
  );
}