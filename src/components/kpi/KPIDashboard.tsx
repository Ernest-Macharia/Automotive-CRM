'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Target, TrendingUp, CheckCircle, Clock, AlertCircle, 
  BarChart3, Users, Calendar, Download, Plus, Filter,
  ChevronRight, ChevronDown, MoreVertical, Eye, Edit, Trash2,
  RefreshCw, Loader2, Sparkles, Activity, Award, Target as TargetIcon,
  TrendingDown, AlertTriangle, CheckCheck, LineChart
} from 'lucide-react';
import { kpiService, DashboardStats, Kpi } from '@/services/kpiService';
import { useToast } from '@/contexts/ToastContext';
import KPICreateModal from './KPICreateModal';

// Skeleton Loading Components
const StatsCardSkeleton = () => (
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100/50 p-6 animate-pulse">
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
);

const KPICardSkeleton = () => (
  <div className="p-4 border border-blue-100/50 rounded-lg bg-white/80 backdrop-blur-sm animate-pulse">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="h-4 w-4 bg-gray-300/50 rounded"></div>
        <div className="h-4 w-32 bg-gray-300/50 rounded"></div>
        <div className="h-6 w-16 bg-gray-300/50 rounded-full"></div>
      </div>
      <div className="h-4 w-4 bg-gray-300/50 rounded"></div>
    </div>
    <div className="h-4 w-full bg-gray-300/50 rounded mb-4"></div>
    <div className="space-y-3">
      <div>
        <div className="h-2 w-full bg-gray-300/50 rounded-full"></div>
      </div>
      <div className="flex items-center justify-between">
        <div className="h-3 w-48 bg-gray-300/50 rounded"></div>
        <div className="h-3 w-16 bg-gray-300/50 rounded"></div>
      </div>
    </div>
  </div>
);

export default function KPIDashboard() {
  const { showToast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentKPIs, setRecentKPIs] = useState<Kpi[]>([]);
  const [overdueKPIs, setOverdueKPIs] = useState<Kpi[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [kpisLoading, setKpisLoading] = useState(true);
  const [overdueLoading, setOverdueLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedView, setSelectedView] = useState<'all' | 'mine' | 'pending' | 'completed'>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedView]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setStatsLoading(true);
      setKpisLoading(true);
      setOverdueLoading(true);

      // Fetch all data in parallel
      const [statsData, recentData, overdueData] = await Promise.all([
        fetchStats(),
        fetchMyKPIs(),
        fetchOverdueKPIs()
      ]);
      
      setStats(statsData);
      setRecentKPIs(recentData);
      setOverdueKPIs(overdueData);
    } catch (error) {
      console.error('Error fetching KPI data:', error);
      showToast('Failed to load KPI data', 'error');
    } finally {
      setLoading(false);
      setStatsLoading(false);
      setKpisLoading(false);
      setOverdueLoading(false);
    }
  };

  const fetchStats = async (): Promise<DashboardStats> => {
    try {
      // Instead of calling getDashboardStats which doesn't exist, 
      // use getAllKpis and calculate locally
      const kpis = await kpiService.getMyKPIs();
      
      const now = new Date();
      const completedKpis = kpis.filter(k => k.status === 'completed');
      const pendingKpis = kpis.filter(k => k.status === 'pending');
      const inProgressKpis = kpis.filter(k => k.status === 'in_progress');
      
      // Calculate overdue KPIs
      const overdueKpis = kpis.filter(k => {
        if (k.status === 'completed' || k.status === 'cancelled') return false;
        if (!k.periodEnd) return false;
        return new Date(k.periodEnd) < now;
      });
      
      // Calculate average progress
      const avgProgress = kpis.length > 0 
        ? kpis.reduce((sum, kpi) => sum + kpiService.calculateKPIProgress(kpi), 0) / kpis.length
        : 0;
      
      return {
        totalKpis: kpis.length,
        completedKpis: completedKpis.length,
        pendingKpis: pendingKpis.length,
        inProgressKpis: inProgressKpis.length,
        overdueKpis: overdueKpis.length,
        recentKpis: Math.min(kpis.length, 5),
        completionRate: kpis.length > 0 ? (completedKpis.length / kpis.length) * 100 : 0,
        averageScore: avgProgress,
        averageCompletion: avgProgress,
        thisMonth: {
          created: 0, // You would need to filter by date for this
          completed: 0,
          overdue: 0
        }
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      // Return default stats
      return {
        totalKpis: 0,
        completedKpis: 0,
        pendingKpis: 0,
        inProgressKpis: 0,
        overdueKpis: 0,
        recentKpis: 0,
        completionRate: 0,
        averageScore: 0,
        averageCompletion: 0,
        thisMonth: {
          created: 0,
          completed: 0,
          overdue: 0
        }
      };
    }
  };

  const fetchMyKPIs = async (): Promise<Kpi[]> => {
    try {
      // Pass the selected view as status filter
      const statusMap = {
        'all': undefined,
        'mine': undefined,
        'pending': 'pending',
        'completed': 'completed'
      };
      
      const data = await kpiService.getMyKPIs({
        status: statusMap[selectedView]
      });
      
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching my KPIs:', error);
      showToast('Failed to fetch your KPIs', 'error');
      return [];
    }
  };

  const fetchOverdueKPIs = async (): Promise<Kpi[]> => {
    try {
      // Calculate overdue KPIs locally
      const kpis = await kpiService.getMyKPIs();
      const now = new Date();
      
      return kpis.filter(kpi => {
        if (kpi.status === 'completed' || kpi.status === 'cancelled') return false;
        if (!kpi.periodEnd) return false;
        return new Date(kpi.periodEnd) < now;
      }).map(kpi => ({
        ...kpi,
        status: 'overdue' as const
      }));
    } catch (error) {
      console.error('Error calculating overdue KPIs:', error);
      return [];
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    showToast('Dashboard refreshed', 'success', 2000);
  };

  const getStatusIcon = (status: Kpi['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'overdue': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled': return <AlertTriangle className="h-4 w-4 text-gray-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: Kpi['status']) => {
    const colors = {
      pending: 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-200',
      in_progress: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-200',
      completed: 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-200',
      overdue: 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-200',
      cancelled: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-200'
    };
    return colors[status] || colors.pending;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const calculateKPITrend = () => {
    if (!stats) return 0;
    
    const total = stats.totalKpis || 0;
    const completed = stats.completedKpis || 0;
    
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getPerformanceColor = (progress: number) => {
    if (progress >= 90) return 'text-green-600';
    if (progress >= 70) return 'text-blue-600';
    if (progress >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getFrequencyLabel = (frequency: Kpi['frequency']) => {
    const labels = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly',
      custom: 'Custom'
    };
    return labels[frequency] || frequency;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                <Target className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">KPI Dashboard</h1>
                <p className="text-blue-100/90 mt-1">
                  Track and manage performance metrics
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-sm transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-5 w-5 text-white ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="h-5 w-5" />
                New KPI
              </button>
            </div>
          </div>

          {/* View Tabs */}
          <div className="flex gap-2 mt-6">
            {['all', 'mine', 'pending', 'completed'].map((view) => (
              <button
                key={view}
                onClick={() => setSelectedView(view as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors backdrop-blur-sm ${
                  selectedView === view
                    ? 'bg-white text-blue-600'
                    : 'text-white/90 hover:bg-white/20'
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
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <StatsCardSkeleton key={i} />
            ))
          ) : (
            <>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100/50 p-6 hover:shadow-lg transition-all hover:scale-[1.02]">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg">
                    <TargetIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className={`text-sm font-medium ${calculateKPITrend() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {calculateKPITrend()}%
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-gray-900">{stats?.totalKpis || 0}</h3>
                <p className="text-sm text-gray-600">Total KPIs</p>
                <div className="mt-4 pt-4 border-t border-blue-100/30">
                  <div className="text-xs text-blue-600 font-medium">
                    <TrendingUp className="h-3 w-3 inline mr-1" />
                    Overall Performance
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100/50 p-6 hover:shadow-lg transition-all hover:scale-[1.02]">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-gradient-to-r from-green-100 to-green-200 rounded-lg">
                    <CheckCheck className="h-6 w-6 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-green-600">
                    +{stats?.thisMonth?.completed || 0} this month
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-gray-900">{stats?.completedKpis || 0}</h3>
                <p className="text-sm text-gray-600">Completed</p>
                <div className="mt-4 pt-4 border-t border-blue-100/30">
                  <div className="text-xs text-green-600 font-medium">
                    <CheckCircle className="h-3 w-3 inline mr-1" />
                    On track
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100/50 p-6 hover:shadow-lg transition-all hover:scale-[1.02]">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-lg">
                    <Activity className="h-6 w-6 text-yellow-600" />
                  </div>
                  <span className={`text-sm font-medium ${(stats?.inProgressKpis || 0) > 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {(stats?.inProgressKpis || 0) > 5 ? 'Attention needed' : 'Healthy'}
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-gray-900">{stats?.inProgressKpis || 0}</h3>
                <p className="text-sm text-gray-600">In Progress</p>
                <div className="mt-4 pt-4 border-t border-blue-100/30">
                  <div className="text-xs text-yellow-600 font-medium">
                    <Clock className="h-3 w-3 inline mr-1" />
                    Active tasks
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100/50 p-6 hover:shadow-lg transition-all hover:scale-[1.02]">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-gradient-to-r from-red-100 to-red-200 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <span className="text-sm font-medium text-red-600">
                    +{stats?.thisMonth?.overdue || 0} new
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-gray-900">{stats?.overdueKpis || 0}</h3>
                <p className="text-sm text-gray-600">Overdue</p>
                <div className="mt-4 pt-4 border-t border-blue-100/30">
                  <div className="text-xs text-red-600 font-medium">
                    <AlertTriangle className="h-3 w-3 inline mr-1" />
                    Requires attention
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent KPIs */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100/50 shadow-lg">
              <div className="p-6 border-b border-blue-100/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg">
                      <LineChart className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">Recent KPIs</h2>
                      <p className="text-sm text-gray-600 mt-1">Your recent performance metrics</p>
                    </div>
                  </div>
                  <Link
                    href="/kpi/list"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    View All <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              
              <div className="p-6">
                {kpisLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <KPICardSkeleton key={i} />
                    ))}
                  </div>
                ) : recentKPIs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-50 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Target className="h-8 w-8 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No KPIs found</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Create your first KPI to start tracking performance metrics
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                    >
                      <Plus className="h-5 w-5" />
                      Create First KPI
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentKPIs.slice(0, 5).map((kpi) => {
                      const progress = kpiService.calculateKPIProgress(kpi);
                      const statusColor = getStatusColor(kpi.status);
                      
                      return (
                        <div
                          key={kpi._id}
                          className="p-4 border border-blue-100/50 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-300 group bg-white/50 backdrop-blur-sm"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(kpi.status)}
                              <h3 className="font-medium text-gray-800 group-hover:text-blue-700 transition-colors">
                                {kpi.title}
                              </h3>
                              <span className={`px-2 py-1 text-xs rounded-full ${statusColor}`}>
                                {kpi.status.replace('_', ' ')}
                              </span>
                            </div>
                            <button className="p-1 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="h-4 w-4 text-blue-500" />
                            </button>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{kpi.description}</p>
                          
                          <div className="space-y-3">
                            {/* Progress Bar */}
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-500">Progress</span>
                                <span className={`font-medium ${getPerformanceColor(progress)}`}>
                                  {progress}%
                                </span>
                              </div>
                              <div className="h-2 bg-blue-100/50 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    progress >= 100 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                                    progress >= 70 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                                    progress >= 40 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                                                    'bg-gradient-to-r from-red-500 to-red-600'
                                  }`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1 text-blue-600">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(kpi.periodStart)} - {formatDate(kpi.periodEnd)}
                                </span>
                                <span className="px-2 py-1 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded text-xs">
                                  {getFrequencyLabel(kpi.frequency)}
                                </span>
                              </div>
                              <Link
                                href={`/kpi/${kpi._id}`}
                                className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                              >
                                View Details
                                <ChevronRight className="h-4 w-4" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Overdue KPIs & Quick Actions */}
          <div className="space-y-6">
            {/* Overdue KPIs */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100/50 shadow-lg">
              <div className="p-6 border-b border-blue-100/50">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-r from-red-100 to-red-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">Overdue KPIs</h2>
                    <p className="text-sm text-gray-600">Requires immediate attention</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {overdueLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-3 border border-red-200 bg-red-50/50 rounded-lg animate-pulse">
                        <div className="h-4 w-32 bg-red-200/50 rounded mb-2"></div>
                        <div className="h-3 w-full bg-red-200/50 rounded mb-2"></div>
                        <div className="h-3 w-24 bg-red-200/50 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : overdueKPIs.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-600">No overdue KPIs</p>
                    <p className="text-xs text-gray-500 mt-1">Great work!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {overdueKPIs.slice(0, 4).map((kpi) => {
                      const daysOverdue = Math.ceil(
                        (new Date().getTime() - new Date(kpi.periodEnd).getTime()) / (1000 * 60 * 60 * 24)
                      );
                      
                      return (
                        <div
                          key={kpi._id}
                          className="p-3 border border-red-200 bg-gradient-to-r from-red-50/50 to-red-100/30 rounded-lg hover:border-red-300 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-800 truncate">{kpi.title}</h4>
                            <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full">
                              {daysOverdue} days
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate mb-2">{kpi.description}</p>
                          <Link
                            href={`/kpi/${kpi._id}`}
                            className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium"
                          >
                            Update Progress
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100/50 shadow-lg">
              <div className="p-6 border-b border-blue-100/50">
                <h2 className="text-lg font-semibold text-gray-800">Quick Actions</h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-3">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="w-full flex items-center justify-between p-3 border border-blue-200 bg-white/50 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg group-hover:from-blue-200 group-hover:to-blue-300 transition-all">
                        <Plus className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-700">Create New KPI</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-blue-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </button>
                  
                  <Link
                    href="/kpi/templates"
                    className="w-full flex items-center justify-between p-3 border border-blue-200 bg-white/50 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg group-hover:from-purple-200 group-hover:to-purple-300 transition-all">
                        <BarChart3 className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="font-medium text-gray-700">Use Template</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-purple-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                  </Link>
                  
                  <Link
                    href="/kpi/reports"
                    className="w-full flex items-center justify-between p-3 border border-blue-200 bg-white/50 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-cyan-100 to-cyan-200 rounded-lg group-hover:from-cyan-200 group-hover:to-cyan-300 transition-all">
                        <Download className="h-4 w-4 text-cyan-600" />
                      </div>
                      <span className="font-medium text-gray-700">Generate Reports</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-cyan-400 group-hover:text-cyan-600 group-hover:translate-x-1 transition-all" />
                  </Link>

                  <Link
                    href="/kpi/analytics"
                    className="w-full flex items-center justify-between p-3 border border-blue-200 bg-white/50 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-indigo-100 to-indigo-200 rounded-lg group-hover:from-indigo-200 group-hover:to-indigo-300 transition-all">
                        <TrendingUp className="h-4 w-4 text-indigo-600" />
                      </div>
                      <span className="font-medium text-gray-700">View Analytics</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-indigo-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Performance Summary */}
            <div className="bg-gradient-to-br from-blue-50/80 to-purple-50/80 backdrop-blur-sm rounded-2xl border border-blue-100/50 shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
                  <Award className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Performance Summary</h3>
                  <p className="text-sm text-gray-600">Your overall performance</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completion Rate</span>
                  <span className={`text-sm font-medium ${calculateKPITrend() >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {calculateKPITrend()}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">On Time Delivery</span>
                  <span className={`text-sm font-medium ${(stats?.completedKpis || 0) >= (stats?.totalKpis || 0) * 0.8 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {((stats?.completedKpis || 0) / (stats?.totalKpis || 1) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg. Progress</span>
                  <span className={`text-sm font-medium ${(stats?.averageCompletion || 0) >= 80 ? 'text-green-600' : 'text-blue-600'}`}>
                    {stats?.averageCompletion?.toFixed(0) || 0}%
                  </span>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-blue-200/50">
                <div className="text-xs text-gray-500">
                  Updated just now • Based on {stats?.totalKpis || 0} KPIs
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