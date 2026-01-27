// app/kpi/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Target, TrendingUp, CheckCircle, Clock, AlertCircle,
  BarChart3, Users, Calendar, Download, Plus,
  ChevronRight, MoreVertical, Eye, Edit,
  RefreshCw, Activity, Award,
  AlertTriangle, CheckCheck, LineChart, Search,
  Filter, FileText, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { kpiService, Kpi, KPI_STATUS } from '@/services/kpiService';
import { useToast } from '@/contexts/ToastContext';
import KPICreateModal from './KPICreateModal';

// Skeleton Loading Components
const StatsCardSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="space-y-3">
        <div className="h-4 w-24 bg-gray-200 rounded"></div>
        <div className="h-8 w-16 bg-gray-200 rounded"></div>
      </div>
      <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
    </div>
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="h-3 w-32 bg-gray-200 rounded"></div>
    </div>
  </div>
);

const KPICardSkeleton = () => (
  <div className="p-4 border border-gray-200 rounded-lg bg-white animate-pulse">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="h-4 w-4 bg-gray-200 rounded"></div>
        <div className="h-4 w-32 bg-gray-200 rounded"></div>
        <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
      </div>
      <div className="h-4 w-4 bg-gray-200 rounded"></div>
    </div>
    <div className="h-4 w-full bg-gray-200 rounded mb-4"></div>
    <div className="space-y-3">
      <div>
        <div className="h-2 w-full bg-gray-200 rounded-full"></div>
      </div>
      <div className="flex items-center justify-between">
        <div className="h-3 w-48 bg-gray-200 rounded"></div>
        <div className="h-3 w-16 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
);

export default function KPIDashboard() {
  const { showToast } = useToast();
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalKpis: 0,
    completedKpis: 0,
    pendingKpis: 0,
    overdueKpis: 0,
    inProgressKpis: 0,
    completionRate: 0,
    averageScore: 0,
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedView, setSelectedView] = useState<'all' | 'active' | 'completed' | 'overdue'>('active');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedView]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get status filter based on selected view
      let statusFilter;
      switch (selectedView) {
        case 'active':
          // Include both in_progress and pending for active view
          statusFilter = [KPI_STATUS.IN_PROGRESS, KPI_STATUS.PENDING];
          break;
        case 'completed':
          statusFilter = [KPI_STATUS.COMPLETED, KPI_STATUS.APPROVED];
          break;
        case 'overdue':
          // First get all KPIs, then filter locally for overdue
          statusFilter = undefined;
          break;
        default:
          statusFilter = undefined;
      }
      
      // Fetch KPIs based on selected view
      let fetchedKpis: Kpi[] = [];
      if (statusFilter && statusFilter.length === 1) {
        fetchedKpis = await kpiService.getMyKPIs({
          status: statusFilter[0],
          limit: 20,
          sort: 'updatedAt:desc'
        });
      } else if (statusFilter && statusFilter.length > 1) {
        // For multiple statuses, we need to filter after fetching
        const allKpis = await kpiService.getMyKPIs({
          limit: 50,
          sort: 'updatedAt:desc'
        });
        fetchedKpis = allKpis.filter(kpi => statusFilter.includes(kpi.status as any));
      } else {
        fetchedKpis = await kpiService.getMyKPIs({
          limit: 20,
          sort: 'updatedAt:desc'
        });
      }
      
      // Additional filter for overdue if needed
      if (selectedView === 'overdue') {
        fetchedKpis = fetchedKpis.filter(kpi => kpiService.isKpiOverdue(kpi));
      }
      
      setKpis(fetchedKpis);
      calculateStats(fetchedKpis);
    } catch (error: any) {
      console.error('Error fetching KPI data:', error);
      showToast(error.message || 'Failed to load KPI data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (kpis: Kpi[]) => {
    const completedKpis = kpis.filter(k => 
      k.status === KPI_STATUS.COMPLETED || k.status === KPI_STATUS.APPROVED
    );
    const pendingKpis = kpis.filter(k => 
      k.status === KPI_STATUS.PENDING || k.status === KPI_STATUS.DRAFT
    );
    const inProgressKpis = kpis.filter(k => k.status === KPI_STATUS.IN_PROGRESS);
    const overdueKpis = kpis.filter(k => kpiService.isKpiOverdue(k));
    
    // Calculate average score from overallScore or progress
    const scores = kpis.map(kpi => kpi.overallScore || kpiService.calculateKpiProgress(kpi));
    const averageScore = scores.length > 0 
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;
    
    // Calculate completion rate based on completed vs total
    const completionRate = kpis.length > 0 
      ? (completedKpis.length / kpis.length) * 100
      : 0;
    
    setStats({
      totalKpis: kpis.length,
      completedKpis: completedKpis.length,
      pendingKpis: pendingKpis.length,
      overdueKpis: overdueKpis.length,
      inProgressKpis: inProgressKpis.length,
      completionRate,
      averageScore: Math.round(averageScore * 10) / 10,
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchDashboardData();
      showToast('Dashboard refreshed', 'success');
    } catch (error) {
      showToast('Failed to refresh data', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled locally in the filteredKpis calculation
  };

  const handleCreateKpi = async (data: any) => {
    try {
      // Convert modal data to service format
      const kpiData = {
        title: data.title,
        description: data.description,
        assignedTo: data.assignedTo,
        role: data.role,
        metrics: data.metrics.map((metric: any) => ({
          name: metric.name,
          description: metric.description,
          type: metric.type,
          targetValue: metric.targetValue,
          weight: metric.weight,
          unit: metric.unit
        })),
        frequency: data.frequency,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        status: data.status || KPI_STATUS.PENDING,
        priority: data.priority || 'medium',
        visibility: 'private' as const,
        isTemplate: data.isTemplate || false
      };
      
      await kpiService.createKPI(kpiData);
      showToast('KPI created successfully', 'success');
      setShowCreateModal(false);
      await fetchDashboardData();
    } catch (error: any) {
      console.error('Error creating KPI:', error);
      showToast(error.message || 'Failed to create KPI', 'error');
    }
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

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'bg-green-500';
    if (progress >= 70) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case KPI_STATUS.DRAFT:
        return { label: 'Draft', color: 'bg-gray-100 text-gray-800' };
      case KPI_STATUS.PENDING:
        return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
      case KPI_STATUS.IN_PROGRESS:
        return { label: 'In Progress', color: 'bg-blue-100 text-blue-800' };
      case KPI_STATUS.UNDER_REVIEW:
        return { label: 'Under Review', color: 'bg-purple-100 text-purple-800' };
      case KPI_STATUS.APPROVED:
        return { label: 'Approved', color: 'bg-green-100 text-green-800' };
      case KPI_STATUS.COMPLETED:
        return { label: 'Completed', color: 'bg-emerald-100 text-emerald-800' };
      case KPI_STATUS.OVERDUE:
        return { label: 'Overdue', color: 'bg-orange-100 text-orange-800' };
      case KPI_STATUS.REJECTED:
        return { label: 'Rejected', color: 'bg-red-100 text-red-800' };
      case KPI_STATUS.CANCELLED:
        return { label: 'Cancelled', color: 'bg-gray-100 text-gray-800' };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const getDaysRemainingDisplay = (kpi: Kpi) => {
    const daysRemaining = kpiService.calculateDaysRemaining(kpi.periodEnd);
    const isOverdue = kpiService.isKpiOverdue(kpi);
    
    if (isOverdue) {
      return {
        text: 'Overdue',
        color: 'bg-red-100 text-red-600'
      };
    }
    
    if (daysRemaining <= 0) {
      return {
        text: 'Due today',
        color: 'bg-yellow-100 text-yellow-600'
      };
    }
    
    if (daysRemaining <= 3) {
      return {
        text: `${daysRemaining}d left`,
        color: 'bg-red-100 text-red-600'
      };
    }
    
    if (daysRemaining <= 7) {
      return {
        text: `${daysRemaining}d left`,
        color: 'bg-yellow-100 text-yellow-600'
      };
    }
    
    return {
      text: `${daysRemaining}d left`,
      color: 'bg-green-100 text-green-600'
    };
  };

  // Filter KPIs based on search
  const filteredKpis = kpis.filter(kpi =>
    searchQuery === '' ||
    kpi.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    kpi.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    kpi.assignedTo?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">KPI Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Track and manage your key performance indicators
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search KPIs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full lg:w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </form>
              
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`p-2 rounded-lg transition-colors ${
                  refreshing 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title="Refresh"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                New KPI
              </button>
            </div>
          </div>

          {/* View Tabs */}
          <div className="flex gap-2 mt-6 overflow-x-auto pb-2">
            {[
              { id: 'active', label: 'Active', count: stats.inProgressKpis + stats.pendingKpis },
              { id: 'all', label: 'All', count: stats.totalKpis },
              { id: 'completed', label: 'Completed', count: stats.completedKpis },
              { id: 'overdue', label: 'Overdue', count: stats.overdueKpis },
            ].map(({ id, label, count }) => (
              <button
                key={id}
                onClick={() => setSelectedView(id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedView === id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {label}
                <span className={`px-2 py-0.5 text-xs rounded-full min-w-[24px] text-center ${
                  selectedView === id 
                    ? 'bg-blue-200 text-blue-700' 
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <StatsCardSkeleton key={i} />
            ))
          ) : (
            <>
              {/* Total KPIs */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-blue-600">
                    {stats.totalKpis} total
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{stats.totalKpis}</h3>
                <p className="text-sm text-gray-600">Total KPIs</p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    {stats.inProgressKpis} active • {stats.pendingKpis} pending
                  </div>
                </div>
              </div>

              {/* Completed */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCheck className="h-6 w-6 text-green-600" />
                  </div>
                  <span className={`text-sm font-medium ${
                    stats.completionRate >= 80 ? 'text-green-600' :
                    stats.completionRate >= 60 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {stats.completionRate.toFixed(1)}%
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{stats.completedKpis}</h3>
                <p className="text-sm text-gray-600">Completed</p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    Completion rate
                  </div>
                </div>
              </div>

              {/* In Progress */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Activity className="h-6 w-6 text-yellow-600" />
                  </div>
                  <span className={`text-sm font-medium ${
                    stats.inProgressKpis > 10 ? 'text-red-600' :
                    stats.inProgressKpis > 5 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {stats.inProgressKpis > 10 ? 'High' :
                     stats.inProgressKpis > 5 ? 'Moderate' :
                     'Normal'}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{stats.inProgressKpis}</h3>
                <p className="text-sm text-gray-600">In Progress</p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    Currently working on
                  </div>
                </div>
              </div>

              {/* Overdue */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <span className={`text-sm font-medium ${
                    stats.overdueKpis > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {stats.overdueKpis > 0 ? 'Attention needed' : 'On track'}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{stats.overdueKpis}</h3>
                <p className="text-sm text-gray-600">Overdue</p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    Requires immediate action
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* KPIs List */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Your KPIs</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredKpis.length} KPI{filteredKpis.length !== 1 ? 's' : ''} found
                  {searchQuery && ` for "${searchQuery}"`}
                </p>
              </div>
              <Link
                href="/kpi/list"
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <KPICardSkeleton key={i} />
                ))}
              </div>
            ) : filteredKpis.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No KPIs found</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {searchQuery 
                    ? `No KPIs found matching "${searchQuery}"`
                    : selectedView === 'active'
                    ? 'You have no active KPIs. Create one to get started!'
                    : `You have no ${selectedView} KPIs.`
                  }
                </p>
                {!searchQuery && selectedView === 'active' && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                    Create First KPI
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredKpis.slice(0, 10).map((kpi) => {
                  const progress = kpiService.calculateKpiProgress(kpi);
                  const isOverdue = kpiService.isKpiOverdue(kpi);
                  const statusDisplay = getStatusDisplay(kpi.status);
                  const daysRemainingDisplay = getDaysRemainingDisplay(kpi);
                  const score = kpi.overallScore || progress;
                  
                  return (
                    <div
                      key={kpi._id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${statusDisplay.color}`}>
                              {statusDisplay.label}
                            </span>
                            {isOverdue && (
                              <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                                Overdue
                              </span>
                            )}
                            <span className={`px-2 py-1 text-xs rounded-full ${daysRemainingDisplay.color}`}>
                              {daysRemainingDisplay.text}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {kpi.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {kpi.description || 'No description provided'}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <div className={`text-lg font-bold ${getScoreColor(score)}`}>
                            {score.toFixed(0)}%
                          </div>
                          <div className="text-xs text-gray-500">Score</div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {/* Progress Bar */}
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Progress</span>
                            <span className={`font-medium ${getScoreColor(progress)}`}>
                              {progress.toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${getProgressColor(progress)}`}
                              style={{ width: `${Math.min(100, progress)}%` }}
                            />
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {kpi.assignedTo?.name || 'Unassigned'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                Due {formatDate(kpi.periodEnd)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">
                              {kpiService.getFrequencyLabel(kpi.frequency)}
                            </span>
                            <Link
                              href={`/kpi/${kpi._id}`}
                              className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
                            >
                              View Details
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                <LineChart className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Average Score</h3>
                <p className="text-sm text-gray-600">Overall performance</p>
              </div>
            </div>
            <div className={`text-3xl font-bold ${getScoreColor(stats.averageScore)}`}>
              {stats.averageScore.toFixed(1)}%
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Completion Rate</h3>
                <p className="text-sm text-gray-600">KPI completion</p>
              </div>
            </div>
            <div className={`text-3xl font-bold ${
              stats.completionRate >= 80 ? 'text-green-600' :
              stats.completionRate >= 60 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {stats.completionRate.toFixed(1)}%
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Award className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Performance</h3>
                <p className="text-sm text-gray-600">Based on all KPIs</p>
              </div>
            </div>
            <div className={`text-3xl font-bold ${
              stats.averageScore >= 90 ? 'text-green-600' :
              stats.averageScore >= 80 ? 'text-blue-600' :
              stats.averageScore >= 70 ? 'text-yellow-600' :
              stats.averageScore >= 60 ? 'text-orange-600' :
              'text-red-600'
            }`}>
              {stats.averageScore >= 90 ? 'Excellent' :
               stats.averageScore >= 80 ? 'Good' :
               stats.averageScore >= 70 ? 'Average' :
               stats.averageScore >= 60 ? 'Needs Improvement' : 'Poor'}
            </div>
          </div>
        </div>
      </div>

      {/* Create KPI Modal */}
      {showCreateModal && (
        <KPICreateModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateKpi}
        />
      )}
    </div>
  );
}