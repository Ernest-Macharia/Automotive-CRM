'use client';

import { useState, useEffect } from 'react';
import { 
  X, Plus, Trash2, Target, Calculator, 
  Check, AlertCircle, Users, Calendar,
  Loader2
} from 'lucide-react';
import { kpiService, KPIFormData, KPI_STATUS } from '@/services/kpiService';
import { useToast } from '@/contexts/ToastContext';

interface KPICreateModalProps {
  onClose: () => void;
  onSuccess: (data?: any) => void;
  initialData?: Partial<KPIFormData>;
}

const frequencyOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: 'Custom' }
];

const metricTypes = [
  { value: 'quantitative', label: 'Quantitative' },
  { value: 'qualitative', label: 'Qualitative' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'binary', label: 'Yes/No' },
  { value: 'scale', label: 'Scale' },
  { value: 'currency', label: 'Currency' }
];

// Mock users data - in real app, fetch from API
const mockUsers = [
  { id: 'user1', name: 'John Doe', role: 'Sales Manager' },
  { id: 'user2', name: 'Jane Smith', role: 'Marketing Specialist' },
  { id: 'user3', name: 'Bob Johnson', role: 'Support Lead' }
];

// Mock roles data
const mockRoles = [
  { id: 'sales', name: 'Sales Team' },
  { id: 'marketing', name: 'Marketing Team' },
  { id: 'support', name: 'Support Team' },
  { id: 'development', name: 'Development Team' }
];

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' }
];

const statusOptions = [
  { value: KPI_STATUS.DRAFT, label: 'Draft' },
  { value: KPI_STATUS.PENDING, label: 'Pending' },
  { value: KPI_STATUS.IN_PROGRESS, label: 'In Progress' }
];

export default function KPICreateModal({ onClose, onSuccess, initialData }: KPICreateModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<string[]>([]);
  
  // Initialize with default values
  const [formData, setFormData] = useState<KPIFormData>({
    title: '',
    description: '',
    assignedTo: '',
    role: '',
    metrics: [
      {
        name: '',
        description: '',
        type: 'quantitative',
        targetValue: 100,
        currentValue: 0,
        unit: '',
        weight: 100
      }
    ],
    priority: '',
    frequency: 'monthly',
    periodStart: new Date().toISOString().split('T')[0],
    periodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    status: KPI_STATUS.PENDING,
    isTemplate: false,
    distributeToSubordinates: false,
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        // Ensure metrics are properly structured with defaults
        metrics: initialData.metrics?.map((m: any) => ({
          name: m.name || '',
          description: m.description || '',
          type: m.type || 'quantitative',
          targetValue: m.targetValue || 100,
          currentValue: m.currentValue || 0,
          unit: m.unit || '',
          weight: m.weight || 100
        })) || prev.metrics
      }));
    }
  }, [initialData]);

  // Calculate total weight
  const totalWeight = formData.metrics.reduce((sum, metric) => sum + (Number(metric.weight) || 0), 0);

  const handleAddMetric = () => {
    setFormData(prev => ({
      ...prev,
      metrics: [
        ...prev.metrics,
        {
          name: '',
          description: '',
          type: 'quantitative',
          targetValue: 100,
          currentValue: 0,
          unit: '',
          weight: Math.max(0, Math.floor((100 - totalWeight) / 2))
        }
      ]
    }));
  };

  const handleRemoveMetric = (index: number) => {
    if (formData.metrics.length <= 1) {
      showToast('At least one metric is required', 'error');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      metrics: prev.metrics.filter((_, i) => i !== index)
    }));
  };

  const handleMetricChange = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      metrics: prev.metrics.map((metric, i) => 
        i === index ? { ...metric, [field]: value } : metric
      )
    }));
    
    // Clear field error when user starts typing
    if (fieldErrors[`metric_${index}_${field}`]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`metric_${index}_${field}`];
        return newErrors;
      });
    }
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const formErrorsList: string[] = [];
    
    // Validate basic fields
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.description?.trim()) errors.description = 'Description is required';
    if (!formData.assignedTo) errors.assignedTo = 'Please select a user';
    if (!formData.role) errors.role = 'Please select a role';
    
    // Validate dates
    if (!formData.periodStart) errors.periodStart = 'Start date is required';
    if (!formData.periodEnd) errors.periodEnd = 'End date is required';
    if (formData.periodStart && formData.periodEnd) {
      const start = new Date(formData.periodStart);
      const end = new Date(formData.periodEnd);
      if (end <= start) {
        errors.periodEnd = 'End date must be after start date';
      }
    }
    
    // Validate metrics
    if (formData.metrics.length === 0) {
      formErrorsList.push('At least one metric is required');
    } else {
      // Validate using service method
      const validationErrors = kpiService.validateMetrics(formData.metrics);
      formErrorsList.push(...validationErrors);
      
      // Check individual metrics
      formData.metrics.forEach((metric, index) => {
        if (!metric.name.trim()) {
          errors[`metric_${index}_name`] = 'Metric name is required';
        }
        if (metric.weight <= 0) {
          errors[`metric_${index}_weight`] = 'Weight must be greater than 0';
        }
        if (metric.targetValue !== undefined && metric.targetValue <= 0) {
          errors[`metric_${index}_target`] = 'Target value must be greater than 0';
        }
        if (metric.type === 'percentage' && metric.targetValue && metric.targetValue > 100) {
          errors[`metric_${index}_target`] = 'Percentage target cannot exceed 100%';
        }
      });
    }
    
    setFieldErrors(errors);
    setFormErrors(formErrorsList);
    
    return Object.keys(errors).length === 0 && formErrorsList.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }
    
    setLoading(true);
    try {
      // Prepare the request data
      const requestData: KPIFormData = {
        title: formData.title.trim(),
        description: formData.description?.trim(),
        assignedTo: formData.assignedTo,
        role: formData.role,
        metrics: formData.metrics.map(metric => ({
          ...metric,
          weight: Number(metric.weight),
          targetValue: metric.targetValue !== undefined ? Number(metric.targetValue) : 0,
          currentValue: metric.currentValue !== undefined ? Number(metric.currentValue) : 0
        })),
        frequency: formData.frequency,
        periodStart: formData.periodStart,
        periodEnd: formData.periodEnd,
        status: formData.status,
        isTemplate: formData.isTemplate,
        distributeToSubordinates: formData.distributeToSubordinates,
        notes: formData.notes?.trim() || ''
      };
      
      // Use the service method
      const createdKpi = await kpiService.createKPI(requestData);
      showToast('KPI created successfully!', 'success');
      onSuccess(createdKpi);
      onClose();
    } catch (error: any) {
      console.error('Error creating KPI:', error);
      showToast(error.message || 'Failed to create KPI. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress for each metric
  const calculateMetricProgress = (metric: KPIFormData['metrics'][0]) => {
    if (!metric.targetValue || metric.currentValue === undefined) return 0;
    if (metric.targetValue === 0) return 0;
    return (metric.currentValue / metric.targetValue) * 100;
  };

  // Auto-distribute weights
  const autoDistributeWeights = () => {
    if (formData.metrics.length === 0) return;
    
    const equalWeight = Math.floor(100 / formData.metrics.length);
    const remainder = 100 - (equalWeight * formData.metrics.length);
    
    const updatedMetrics = formData.metrics.map((metric, index) => ({
      ...metric,
      weight: index === 0 ? equalWeight + remainder : equalWeight
    }));
    
    setFormData(prev => ({ ...prev, metrics: updatedMetrics }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {initialData ? 'Edit KPI' : 'Create New KPI'}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Define performance metrics and targets</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={loading}
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
          
          {/* Body */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            <form onSubmit={handleSubmit}>
              {formErrors.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Form Errors
                  </h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {formErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-4">Basic Information</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        KPI Title *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleFormChange('title', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          fieldErrors.title ? 'border-red-300' : 'border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        placeholder="e.g., Monthly Sales Performance"
                        disabled={loading}
                      />
                      {fieldErrors.title && (
                        <p className="mt-1 text-sm text-red-600">{fieldErrors.title}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description || ''}
                        onChange={(e) => handleFormChange('description', e.target.value)}
                        rows={3}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          fieldErrors.description ? 'border-red-300' : 'border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        placeholder="Describe the KPI objectives and expectations..."
                        disabled={loading}
                      />
                      {fieldErrors.description && (
                        <p className="mt-1 text-sm text-red-600">{fieldErrors.description}</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => handleFormChange('status', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={loading}
                        >
                          {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Frequency *
                        </label>
                        <select
                          value={formData.frequency}
                          onChange={(e) => handleFormChange('frequency', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={loading}
                        >
                          {frequencyOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Date *
                        </label>
                        <input
                          type="date"
                          value={formData.periodStart}
                          onChange={(e) => handleFormChange('periodStart', e.target.value)}
                          className={`w-full px-3 py-2 rounded-lg border ${
                            fieldErrors.periodStart ? 'border-red-300' : 'border-gray-300'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          disabled={loading}
                        />
                        {fieldErrors.periodStart && (
                          <p className="mt-1 text-sm text-red-600">{fieldErrors.periodStart}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          End Date *
                        </label>
                        <input
                          type="date"
                          value={formData.periodEnd}
                          onChange={(e) => handleFormChange('periodEnd', e.target.value)}
                          className={`w-full px-3 py-2 rounded-lg border ${
                            fieldErrors.periodEnd ? 'border-red-300' : 'border-gray-300'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          disabled={loading}
                        />
                        {fieldErrors.periodEnd && (
                          <p className="mt-1 text-sm text-red-600">{fieldErrors.periodEnd}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Metrics */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">Metrics & Targets</h3>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-600">
                        Total Weight: <span className={`font-medium ${
                          Math.abs(totalWeight - 100) < 0.01 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {totalWeight.toFixed(1)}%
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={autoDistributeWeights}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        disabled={loading || formData.metrics.length === 0}
                      >
                        Auto-distribute
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {formData.metrics.map((metric, index) => {
                      const progress = calculateMetricProgress(metric);
                      return (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium text-gray-800">Metric {index + 1}</h4>
                            <div className="flex items-center gap-3">
                              {metric.targetValue !== undefined && metric.currentValue !== undefined && (
                                <div className="text-sm text-gray-600">
                                  Progress: <span className="font-medium">
                                    {progress.toFixed(1)}%
                                  </span>
                                </div>
                              )}
                              {formData.metrics.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMetric(index)}
                                  className="p-1 hover:bg-red-50 rounded text-red-500"
                                  disabled={loading}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Metric Name *
                              </label>
                              <input
                                type="text"
                                value={metric.name}
                                onChange={(e) => handleMetricChange(index, 'name', e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border ${
                                  fieldErrors[`metric_${index}_name`] ? 'border-red-300' : 'border-gray-300'
                                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                placeholder="e.g., Sales Target"
                                disabled={loading}
                              />
                              {fieldErrors[`metric_${index}_name`] && (
                                <p className="mt-1 text-sm text-red-600">{fieldErrors[`metric_${index}_name`]}</p>
                              )}
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Type
                              </label>
                              <select
                                value={metric.type}
                                onChange={(e) => handleMetricChange(index, 'type', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={loading}
                              >
                                {metricTypes.map(type => (
                                  <option key={type.value} value={type.value}>
                                    {type.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                              </label>
                              <input
                                type="text"
                                value={metric.description || ''}
                                onChange={(e) => handleMetricChange(index, 'description', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Brief description of the metric"
                                disabled={loading}
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Unit
                              </label>
                              <input
                                type="text"
                                value={metric.unit || ''}
                                onChange={(e) => handleMetricChange(index, 'unit', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., units, %, $"
                                disabled={loading}
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Weight (%) *
                              </label>
                              <input
                                type="number"
                                value={metric.weight}
                                onChange={(e) => handleMetricChange(index, 'weight', e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border ${
                                  fieldErrors[`metric_${index}_weight`] ? 'border-red-300' : 'border-gray-300'
                                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                placeholder="e.g., 30"
                                min="0"
                                max="100"
                                step="1"
                                disabled={loading}
                              />
                              {fieldErrors[`metric_${index}_weight`] && (
                                <p className="mt-1 text-sm text-red-600">{fieldErrors[`metric_${index}_weight`]}</p>
                              )}
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Target Value *
                              </label>
                              <input
                                type="number"
                                value={metric.targetValue !== undefined ? metric.targetValue : ''}
                                onChange={(e) => handleMetricChange(index, 'targetValue', e.target.value ? Number(e.target.value) : undefined)}
                                className={`w-full px-3 py-2 rounded-lg border ${
                                  fieldErrors[`metric_${index}_target`] ? 'border-red-300' : 'border-gray-300'
                                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                placeholder={metric.type === 'percentage' ? 'e.g., 95' : 'e.g., 100'}
                                min="0"
                                step="0.01"
                                disabled={loading}
                              />
                              {fieldErrors[`metric_${index}_target`] && (
                                <p className="mt-1 text-sm text-red-600">{fieldErrors[`metric_${index}_target`]}</p>
                              )}
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Current Value
                              </label>
                              <input
                                type="number"
                                value={metric.currentValue !== undefined ? metric.currentValue : ''}
                                onChange={(e) => handleMetricChange(index, 'currentValue', e.target.value ? Number(e.target.value) : undefined)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={metric.type === 'percentage' ? 'e.g., 75' : 'e.g., 0'}
                                min="0"
                                step="0.01"
                                disabled={loading}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={handleAddMetric}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 rounded-lg"
                        disabled={loading}
                      >
                        <Plus className="h-4 w-4" />
                        Add Another Metric
                      </button>
                      
                      <div className="text-sm text-gray-500">
                        {formData.metrics.length} metric{formData.metrics.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Assignment */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-4">Assignment</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assign To *
                      </label>
                      <select
                        value={formData.assignedTo}
                        onChange={(e) => handleFormChange('assignedTo', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          fieldErrors.assignedTo ? 'border-red-300' : 'border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        disabled={loading}
                      >
                        <option value="">Select user...</option>
                        {mockUsers.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.role})
                          </option>
                        ))}
                      </select>
                      {fieldErrors.assignedTo && (
                        <p className="mt-1 text-sm text-red-600">{fieldErrors.assignedTo}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role *
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) => handleFormChange('role', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          fieldErrors.role ? 'border-red-300' : 'border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        disabled={loading}
                      >
                        <option value="">Select role...</option>
                        {mockRoles.map(role => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.role && (
                        <p className="mt-1 text-sm text-red-600">{fieldErrors.role}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority
                      </label>
                      <select
                        value={formData.priority || 'medium'}
                        onChange={(e) => handleFormChange('priority', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={loading}
                      >
                        {priorityOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Notes
                      </label>
                      <textarea
                        value={formData.notes || ''}
                        onChange={(e) => handleFormChange('notes', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Any additional instructions or context..."
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="md:col-span-2 flex items-center gap-6">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.distributeToSubordinates}
                          onChange={(e) => handleFormChange('distributeToSubordinates', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          disabled={loading}
                        />
                        <span className="text-sm text-gray-700">Distribute to subordinates</span>
                      </label>
                      
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.isTemplate}
                          onChange={(e) => handleFormChange('isTemplate', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          disabled={loading}
                        />
                        <span className="text-sm text-gray-700">Save as template</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      {initialData ? 'Update KPI' : 'Create KPI'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}