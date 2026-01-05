'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Target, BarChart3, TrendingUp, Calendar, 
  Users, CheckCircle, Clock, AlertCircle, Edit, Download,
  Check, X, MessageSquare, ChevronRight
} from 'lucide-react';
import { kpiService } from '@/services/kpiService';
import { useToast } from '@/contexts/ToastContext';

// Define the KPI type to match the actual service return type
interface Kpi {
  _id?: string;
  title?: string;
  description?: string;
  status?: 'draft' | 'in_progress' | 'completed' | 'overdue';
  frequency?: string;
  periodStart?: string;
  periodEnd?: string;
  assignedTo?: any;
  role?: any;
  metrics?: Array<{
    name: string;
    description: string;
    targetValue: number;
    currentValue: number;
    unit: string;
    weight: number;
  }>;
  notes?: string;
  reviewNotes?: string;
  reviewedBy?: any;
  reviewedAt?: string;
  createdAt?: string;
  completedAt?: string;
}

export default function KPIDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [kpi, setKpi] = useState<Kpi | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingMetric, setUpdatingMetric] = useState<number | null>(null);
  const [metricValue, setMetricValue] = useState<number>(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchKPI(params.id as string);
    }
  }, [params.id]);

  const fetchKPI = async (id: string) => {
    try {
      setLoading(true);
      const data = await kpiService.getKpiById(id);
      setKpi(data);
    } catch (error) {
      console.error('Error fetching KPI:', error);
      showToast('Failed to load KPI details', 'error');
      router.push('/kpi');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMetric = async (index: number) => {
    if (!kpi || !kpi._id) return;
    
    try {
      setUpdatingMetric(index);
      await kpiService.updateKPIMetric(kpi._id, index, {
        currentValue: metricValue,
        notes
      });
      
      showToast('Metric updated successfully', 'success');
      fetchKPI(kpi._id);
      setUpdatingMetric(null);
      setMetricValue(0);
      setNotes('');
    } catch (error) {
      console.error('Error updating metric:', error);
      showToast('Failed to update metric', 'error');
    }
  };

  const handleCompleteKPI = async () => {
    if (!kpi || !kpi._id) return;
    
    try {
      await kpiService.completeKpi(kpi._id);
      showToast('KPI marked as completed', 'success');
      fetchKPI(kpi._id);
    } catch (error) {
      console.error('Error completing KPI:', error);
      showToast('Failed to complete KPI', 'error');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'text-green-600';
    if (progress >= 70) return 'text-blue-600';
    if (progress >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (status?: Kpi['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress': return <Clock className="h-5 w-5 text-blue-500" />;
      case 'overdue': return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!kpi) {
    return null;
  }

  const progress = kpiService.calculateKPIProgress(kpi);
  const statusColor = kpiService.getStatusColor(kpi.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(kpi.status)}
                  <h1 className="text-2xl font-bold text-gray-900">{kpi.title || 'Untitled KPI'}</h1>
                  <span className={`px-3 py-1 text-sm rounded-full ${statusColor}`}>
                    {kpi.status ? kpi.status.replace('_', ' ') : 'Unknown'}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mt-1">
                  {kpi.description || 'No description'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Download className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={() => kpi._id && router.push(`/kpi/${kpi._id}/edit`)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Overview & Metrics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Overview */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Progress Overview</h2>
              
              <div className="space-y-6">
                {/* Overall Progress */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                    <span className={`text-lg font-bold ${getProgressColor(progress)}`}>
                      {progress}%
                    </span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        progress >= 100 ? 'bg-green-500' :
                        progress >= 70 ? 'bg-blue-500' :
                        progress >= 40 ? 'bg-yellow-500' :
                                        'bg-red-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Metrics */}
                <div>
                  <h3 className="font-medium text-gray-800 mb-4">Metrics Breakdown</h3>
                  <div className="space-y-4">
                    {kpi.metrics?.map((metric, index) => {
                      const metricProgress = (metric.currentValue / metric.targetValue) * 100;
                      
                      return (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium text-gray-800">{metric.name}</h4>
                              <p className="text-sm text-gray-600">{metric.description}</p>
                            </div>
                            <div className="text-right">
                              <div className={`text-lg font-bold ${getProgressColor(metricProgress)}`}>
                                {metric.currentValue} / {metric.targetValue} {metric.unit}
                              </div>
                              <div className="text-sm text-gray-500">
                                Weight: {metric.weight}%
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  metricProgress >= 100 ? 'bg-green-500' :
                                  metricProgress >= 70 ? 'bg-blue-500' :
                                  metricProgress >= 40 ? 'bg-yellow-500' :
                                                      'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(metricProgress, 100)}%` }}
                              />
                            </div>
                            
                            {updatingMetric === index ? (
                              <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <input
                                    type="number"
                                    value={metricValue}
                                    onChange={(e) => setMetricValue(parseFloat(e.target.value) || 0)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                                    placeholder="Enter current value"
                                  />
                                  <button
                                    onClick={() => handleUpdateMetric(index)}
                                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => setUpdatingMetric(null)}
                                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                                <textarea
                                  value={notes}
                                  onChange={(e) => setNotes(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                  placeholder="Add notes (optional)"
                                  rows={2}
                                />
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                  Progress: {Math.round(metricProgress)}%
                                </span>
                                <button
                                  onClick={() => {
                                    setUpdatingMetric(index);
                                    setMetricValue(metric.currentValue);
                                  }}
                                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                  Update Progress
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes & Activity */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Notes & Activity</h2>
              
              <div className="space-y-4">
                {kpi.notes && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">KPI Notes</h4>
                    <p className="text-gray-600">{kpi.notes}</p>
                  </div>
                )}
                
                {kpi.reviewNotes && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                      <h4 className="font-medium text-gray-800">Review Notes</h4>
                    </div>
                    <p className="text-gray-600">{kpi.reviewNotes}</p>
                    {kpi.reviewedBy && (
                      <p className="text-sm text-gray-500 mt-2">
                        Reviewed by {typeof kpi.reviewedBy === 'object' ? kpi.reviewedBy.name : 'Manager'}
                        {kpi.reviewedAt && ` on ${formatDate(kpi.reviewedAt)}`}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Details & Actions */}
          <div className="space-y-6">
            {/* KPI Details */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">KPI Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Frequency</label>
                  <p className="text-gray-900">{kpiService.getFrequencyLabel(kpi.frequency)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Period</label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(kpi.periodStart)}</span>
                    <ChevronRight className="h-4 w-4" />
                    <span>{formatDate(kpi.periodEnd)}</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Assigned To</label>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {typeof kpi.assignedTo === 'object' && kpi.assignedTo?.name
                        ? kpi.assignedTo.name.charAt(0).toUpperCase()
                        : 'U'}
                    </div>
                    <div>
                      <p className="text-gray-900">
                        {typeof kpi.assignedTo === 'object' 
                          ? kpi.assignedTo?.name || 'Unknown User'
                          : 'Unknown User'}
                      </p>
                      {typeof kpi.assignedTo === 'object' && kpi.assignedTo?.email && (
                        <p className="text-sm text-gray-500">{kpi.assignedTo.email}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Role</label>
                  <p className="text-gray-900">
                    {typeof kpi.role === 'object' ? kpi.role?.name || 'Unknown' : kpi.role || 'Unknown'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-gray-900">{formatDate(kpi.createdAt)}</p>
                </div>
                
                {kpi.completedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Completed</label>
                    <p className="text-gray-900">{formatDate(kpi.completedAt)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
              
              <div className="space-y-3">
                {kpi.status === 'in_progress' && (
                  <button
                    onClick={handleCompleteKPI}
                    className="w-full flex items-center justify-between p-3 border border-green-200 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-gray-700">Mark as Completed</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                )}
                
                <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Download className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-gray-700">Export Report</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </button>
                
                <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-gray-700">Share with Team</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Progress Chart Preview */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Performance Trend</h2>
              <div className="h-48 bg-gradient-to-b from-gray-50 to-white rounded-lg border border-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Performance chart view</p>
                  <button className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View Detailed Analytics →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}