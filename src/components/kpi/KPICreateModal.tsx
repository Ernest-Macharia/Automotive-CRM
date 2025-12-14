'use client';

import { useState, useEffect } from 'react';
import { 
  X, Plus, Trash2, Target, Calculator, 
  Check, AlertCircle, Users, Calendar
} from 'lucide-react';
import { kpiService, KPIFormData, KPIMetric } from '@/services/kpiService';
import { useToast } from '@/contexts/ToastContext';

interface KPICreateModalProps {
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Partial<KPIFormData>;
}

const frequencyOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' }
];

const metricTypes = [
  { value: 'quantitative', label: 'Quantitative' },
  { value: 'qualitative', label: 'Qualitative' },
  { value: 'percentage', label: 'Percentage' }
];

export default function KPICreateModal({ onClose, onSuccess, initialData }: KPICreateModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
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
        targetValue: 0,
        currentValue: 0,
        unit: '',
        weight: 0
      }
    ],
    frequency: 'monthly',
    periodStart: new Date().toISOString().split('T')[0],
    periodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    status: 'pending',
    isTemplate: false,
    distributeToSubordinates: false,
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        metrics: initialData.metrics || prev.metrics
      }));
    }
  }, [initialData]);

  const handleAddMetric = () => {
    setFormData(prev => ({
      ...prev,
      metrics: [
        ...prev.metrics,
        {
          name: '',
          description: '',
          type: 'quantitative',
          targetValue: 0,
          currentValue: 0,
          unit: '',
          weight: 0
        }
      ]
    }));
  };

  const handleRemoveMetric = (index: number) => {
    setFormData(prev => ({
      ...prev,
      metrics: prev.metrics.filter((_, i) => i !== index)
    }));
  };

  const handleMetricChange = (index: number, field: keyof KPIMetric, value: any) => {
    setFormData(prev => ({
      ...prev,
      metrics: prev.metrics.map((metric, i) => 
        i === index ? { ...metric, [field]: value } : metric
      )
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.assignedTo) newErrors.assignedTo = 'Assign to is required';
    if (!formData.role) newErrors.role = 'Role is required';
    
    const totalWeight = formData.metrics.reduce((sum, metric) => sum + (metric.weight || 0), 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      newErrors.metrics = `Total weight must be 100% (currently ${totalWeight}%)`;
    }
    
    formData.metrics.forEach((metric, index) => {
      if (!metric.name.trim()) {
        newErrors[`metric_${index}_name`] = 'Metric name is required';
      }
      if (metric.targetValue <= 0) {
        newErrors[`metric_${index}_target`] = 'Target value must be greater than 0';
      }
      if (metric.weight <= 0) {
        newErrors[`metric_${index}_weight`] = 'Weight must be greater than 0';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }
    
    setLoading(true);
    try {
      await kpiService.createKPI(formData);
      showToast('KPI created successfully', 'success');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating KPI:', error);
      showToast(error.message || 'Failed to create KPI', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 rounded-t-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Create New KPI</h2>
                  <p className="text-sm text-gray-600 mt-1">Define performance metrics and targets</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
          
          {/* Body */}
          <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      KPI Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.title ? 'border-red-300' : 'border-gray-200'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="e.g., Monthly Sales Performance"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.title}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frequency *
                    </label>
                    <select
                      value={formData.frequency}
                      onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value as any }))}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {frequencyOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.description ? 'border-red-300' : 'border-gray-200'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="Describe the KPI objectives and expectations..."
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.description}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Period Start *
                    </label>
                    <input
                      type="date"
                      value={formData.periodStart}
                      onChange={(e) => setFormData(prev => ({ ...prev, periodStart: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Period End *
                    </label>
                    <input
                      type="date"
                      value={formData.periodEnd}
                      onChange={(e) => setFormData(prev => ({ ...prev, periodEnd: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              
              {/* Metrics */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Metrics & Targets
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddMetric}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Add Metric
                  </button>
                </div>
                
                {errors.metrics && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {errors.metrics}
                    </p>
                  </div>
                )}
                
                <div className="space-y-4">
                  {formData.metrics.map((metric, index) => (
                    <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-800">Metric {index + 1}</h4>
                        {formData.metrics.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMetric(index)}
                            className="p-1 hover:bg-red-50 rounded text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
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
                            className={`w-full px-4 py-3 rounded-lg border ${
                              errors[`metric_${index}_name`] ? 'border-red-300' : 'border-gray-200'
                            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            placeholder="e.g., Sales Target"
                          />
                          {errors[`metric_${index}_name`] && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors[`metric_${index}_name`]}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Type
                          </label>
                          <select
                            value={metric.type}
                            onChange={(e) => handleMetricChange(index, 'type', e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            Unit
                          </label>
                          <input
                            type="text"
                            value={metric.unit}
                            onChange={(e) => handleMetricChange(index, 'unit', e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., units, %, dollars"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Weight (%) *
                          </label>
                          <input
                            type="number"
                            value={metric.weight}
                            onChange={(e) => handleMetricChange(index, 'weight', parseFloat(e.target.value) || 0)}
                            className={`w-full px-4 py-3 rounded-lg border ${
                              errors[`metric_${index}_weight`] ? 'border-red-300' : 'border-gray-200'
                            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            placeholder="e.g., 30"
                            min="0"
                            max="100"
                            step="1"
                          />
                          {errors[`metric_${index}_weight`] && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors[`metric_${index}_weight`]}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Target Value *
                          </label>
                          <input
                            type="number"
                            value={metric.targetValue}
                            onChange={(e) => handleMetricChange(index, 'targetValue', parseFloat(e.target.value) || 0)}
                            className={`w-full px-4 py-3 rounded-lg border ${
                              errors[`metric_${index}_target`] ? 'border-red-300' : 'border-gray-200'
                            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            placeholder="e.g., 100"
                            min="0"
                            step="0.01"
                          />
                          {errors[`metric_${index}_target`] && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors[`metric_${index}_target`]}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Value
                          </label>
                          <input
                            type="number"
                            value={metric.currentValue}
                            onChange={(e) => handleMetricChange(index, 'currentValue', parseFloat(e.target.value) || 0)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., 0"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                          </label>
                          <textarea
                            value={metric.description}
                            onChange={(e) => handleMetricChange(index, 'description', e.target.value)}
                            rows={2}
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Describe this metric..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Additional Settings */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Assignment & Settings
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign To *
                    </label>
                    <select
                      value={formData.assignedTo}
                      onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.assignedTo ? 'border-red-300' : 'border-gray-200'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    >
                      <option value="">Select user...</option>
                      {/* In real app, populate from users API */}
                      <option value="user1">John Doe (Sales Manager)</option>
                      <option value="user2">Jane Smith (Marketing)</option>
                    </select>
                    {errors.assignedTo && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.assignedTo}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.role ? 'border-red-300' : 'border-gray-200'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    >
                      <option value="">Select role...</option>
                      {/* In real app, populate from roles API */}
                      <option value="sales">Sales Team</option>
                      <option value="marketing">Marketing Team</option>
                      <option value="support">Support Team</option>
                    </select>
                    {errors.role && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.role}
                      </p>
                    )}
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Additional notes or instructions..."
                    />
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.distributeToSubordinates}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          distributeToSubordinates: e.target.checked 
                        }))}
                        className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Distribute to subordinates</span>
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isTemplate}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          isTemplate: e.target.checked 
                        }))}
                        className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Save as template</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 rounded-b-2xl p-6">
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Create KPI
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}