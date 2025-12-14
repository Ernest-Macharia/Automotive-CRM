'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Target, TrendingUp, CheckCircle, Clock, AlertCircle, 
  BarChart3, Users, Calendar, Download, Plus, Filter,
  ChevronRight, ChevronDown, MoreVertical, Eye, Edit, Trash2,
  RefreshCw
} from 'lucide-react';
import { kpiService, DashboardStats, KPI } from '@/services/kpiService';
import { useToast } from '@/contexts/ToastContext';
import KPICreateModal from './KPICreateModal';

export default function KPIDashboard() {
  const { showToast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentKPIs, setRecentKPIs] = useState<KPI[]>([]);
  const [overdueKPIs, setOverdueKPIs] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedView, setSelectedView] = useState<'all' | 'mine' | 'pending' | 'completed'>('all');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedView]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, recentData, overdueData] = await Promise.all([
        kpiService.getDashboardStats(),
        kpiService.getMyKPIs(),
        kpiService.getOverdueKPIs()
      ]);
      
      setStats(statsData);
      setRecentKPIs(recentData);
      setOverdueKPIs(overdueData);
    } catch (error) {
      console.error('Error fetching KPI data:', error);
      showToast('Failed to load KPI data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
    showToast('Dashboard refreshed', 'success', 2000);
  };

  const getStatusIcon = (status: KPI['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'overdue': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">KPI Reports</h1>
                <p className="text-gray-600 text-sm mt-1">
                  Track and manage performance metrics
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all"
              >
                <Plus className="h-4 w-4" />
                New KPI
              </button>
            </div>
          </div>

          {/* View Tabs */}
          <div className="flex gap-2 mt-4">
            {['all', 'mine', 'pending', 'completed'].map((view) => (
              <button
                key={view}
                onClick={() => setSelectedView(view as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedView === view
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-green-600">+12%</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats?.totalKPIs || 0}</h3>
            <p className="text-sm text-gray-600">Total KPIs</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-sm font-medium text-green-600">+8%</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats?.completedKPIs || 0}</h3>
            <p className="text-sm text-gray-600">Completed</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <span className="text-sm font-medium text-red-600">-3%</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats?.inProgressKPIs || 0}</h3>
            <p className="text-sm text-gray-600">In Progress</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <span className="text-sm font-medium text-red-600">+5%</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats?.overdueKPIs || 0}</h3>
            <p className="text-sm text-gray-600">Overdue</p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent KPIs */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">Recent KPIs</h2>
                    <p className="text-sm text-gray-600 mt-1">Your recent performance metrics</p>
                  </div>
                  <Link
                    href="/kpi/list"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    View All <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {recentKPIs.map((kpi) => {
                    const progress = kpiService.calculateKPIProgress(kpi);
                    const statusColor = kpiService.getStatusColor(kpi.status);
                    
                    return (
                      <div
                        key={kpi._id}
                        className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors group"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(kpi.status)}
                            <h3 className="font-medium text-gray-800">{kpi.title}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${statusColor}`}>
                              {kpi.status.replace('_', ' ')}
                            </span>
                          </div>
                          <button className="p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-4">{kpi.description}</p>
                        
                        <div className="space-y-3">
                          {/* Progress Bar */}
                          <div>
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Progress</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  progress >= 100 ? 'bg-green-500' :
                                  progress >= 70 ? 'bg-blue-500' :
                                  progress >= 40 ? 'bg-yellow-500' :
                                                  'bg-red-500'
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1 text-gray-600">
                                <Calendar className="h-3 w-3" />
                                {formatDate(kpi.periodStart)} - {formatDate(kpi.periodEnd)}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs ${statusColor}`}>
                                {kpiService.getFrequencyLabel(kpi.frequency)}
                              </span>
                            </div>
                            <Link
                              href={`/kpi/${kpi._id}`}
                              className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Overdue KPIs & Quick Actions */}
          <div className="space-y-6">
            {/* Overdue KPIs */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Overdue KPIs
                </h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {overdueKPIs.slice(0, 3).map((kpi) => (
                    <div
                      key={kpi._id}
                      className="p-3 border border-red-200 bg-red-50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-800">{kpi.title}</h4>
                        <span className="text-xs text-red-600 font-medium">
                          {Math.ceil((new Date().getTime() - new Date(kpi.periodEnd).getTime()) / (1000 * 60 * 60 * 24))} days
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{kpi.description}</p>
                      <Link
                        href={`/kpi/${kpi._id}`}
                        className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Update Progress →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800">Quick Actions</h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-3">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Plus className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-700">Create New KPI</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                  
                  <Link
                    href="/kpi/templates"
                    className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <BarChart3 className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="font-medium text-gray-700">Use Template</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </Link>
                  
                  <Link
                    href="/kpi/reports"
                    className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Download className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="font-medium text-gray-700">Generate Reports</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create KPI Modal */}
      {showCreateModal && (
        <KPICreateModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchDashboardData}
        />
      )}
    </div>
  );
}