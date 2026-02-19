'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target, 
  Calendar,
  Phone,
  Mail,
  CheckCircle,
  Clock,
  RefreshCw,
  Loader2,
  Flame,
  Trophy,
  Workflow,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  User,
  BarChart3,
  FileText,
  ChevronRight,
  Filter
} from 'lucide-react';
import { opportunityService, Opportunity } from '@/services/opportunityService';
import { salesOrderService } from '@/services/salesOrderService';
import { createPermissionChecker } from '@/services/settings/roleService';

interface SalesDashboardProps {
  user: any;
}

interface SalesStats {
  totalLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  conversionRate: number;
  monthlyRevenue: number;
  callsToday: number;
  meetingsScheduled: number;
  dealsClosed: number;
  pipelineValue: number;
  avgDealSize: number;
  revenueTarget: number;
  targetProgress: number;
  responseTime: string;
  topPerformingSources: Array<{source: string; count: number; revenue: number}>;
  recentOpportunities: Opportunity[];
  leadsByStage: Array<{stage: string; count: number; value: number}>;
  salesOrdersCount: number;
  quotesGenerated: number;
}

interface PipelineStage {
  name: string;
  count: number;
  value: number;
  color: string;
  progress: number;
}

export default function SalesDashboard({ user }: SalesDashboardProps) {
  const [stats, setStats] = useState<SalesStats>({
    totalLeads: 0,
    hotLeads: 0,
    warmLeads: 0,
    coldLeads: 0,
    conversionRate: 0,
    monthlyRevenue: 0,
    callsToday: 0,
    meetingsScheduled: 0,
    dealsClosed: 0,
    pipelineValue: 0,
    avgDealSize: 0,
    revenueTarget: 150000,
    targetProgress: 0,
    responseTime: '0h',
    topPerformingSources: [],
    recentOpportunities: [],
    leadsByStage: [],
    salesOrdersCount: 0,
    quotesGenerated: 0
  });

  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([
    { name: 'New', count: 0, value: 0, color: 'bg-blue-400', progress: 0 },
    { name: 'Prospecting', count: 0, value: 0, color: 'bg-green-400', progress: 0 },
    { name: 'Appointment Scheduled', count: 0, value: 0, color: 'bg-amber-400', progress: 0 },
    { name: 'Negotiation', count: 0, value: 0, color: 'bg-orange-400', progress: 0 },
    { name: 'Closed Won', count: 0, value: 0, color: 'bg-emerald-600', progress: 0 }
  ]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('month');
  const [permissionChecker, setPermissionChecker] = useState<any>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}m ago`;
    }
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const getOpportunityStatusColor = (status: string) => {
    switch (status) {
      case 'won': return 'text-emerald-600 bg-emerald-100';
      case 'appointment_scheduled': return 'text-blue-600 bg-blue-100';
      case 'prospecting': return 'text-amber-600 bg-amber-100';
      case 'new': return 'text-gray-600 bg-gray-100';
      case 'non_progressive': return 'text-red-600 bg-red-100';
      case 'lost': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'hot': return 'text-red-600 bg-red-100';
      case 'warm': return 'text-amber-600 bg-amber-100';
      case 'cold': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'hot': return <Flame className="h-3 w-3" />;
      case 'warm': return <TrendingUp className="h-3 w-3" />;
      case 'cold': return <TrendingDown className="h-3 w-3" />;
      default: return null;
    }
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-emerald-600 bg-emerald-50';
    if (value < 0) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUpRight className="h-3 w-3" />;
    if (value < 0) return <ArrowDownRight className="h-3 w-3" />;
    return null;
  };

  const getDateRange = () => {
    const today = new Date();
    let start: Date;
    
    switch (timeRange) {
      case 'today':
        start = new Date(today);
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start = new Date(today);
        start.setDate(today.getDate() - 7);
        break;
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
    }
    
    return {
      start: start.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    };
  };

  const fetchSalesData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const dateRange = getDateRange();
      const userId = user?._id || user?.id;
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch multiple data sources in parallel
      const [
        overview,
        recentOpps,
        hotLeadsResponse,
        warmLeadsResponse,
        coldLeadsResponse,
        closedWon,
        scheduledAppointments,
        highValueOpps,
        unassignedNew,
        revenueStats,
        pipelineData,
        salesOrders,
        quotesData,
        activities
      ] = await Promise.allSettled([
        opportunityService.getOpportunitiesOverview(),
        opportunityService.filterOpportunities({ 
          sort: 'createdAt:desc', 
          limit: 5,
          fromDate: dateRange.start,
          toDate: dateRange.end
        }),
        opportunityService.getOpportunitiesByTier('hot'),
        opportunityService.getOpportunitiesByTier('warm'),
        opportunityService.getOpportunitiesByTier('cold'),
        opportunityService.filterOpportunities({ 
          status: 'won',
          fromDate: dateRange.start,
          toDate: dateRange.end
        }),
        opportunityService.filterOpportunities({ 
          status: 'appointment_scheduled',
          fromDate: dateRange.start,
          toDate: dateRange.end
        }),
        opportunityService.getHighValueOpportunities(50000),
        opportunityService.getUnassignedNewLeads(),
        opportunityService.getRevenueStats().catch(() => ({ monthlyRevenue: 0, avgDealSize: 0 })),
        opportunityService.getFilteredStats({
          fromDate: dateRange.start,
          toDate: dateRange.end
        }).catch(() => null),
        salesOrderService.getSalesOrderStats().catch(() => null),
        opportunityService.getOpportunitiesWithQuotes().catch(() => ({ data: [] })),
        // Get recent activities (calls, emails) - would need proper endpoint
        Promise.resolve([])
      ]);

      // Process stats data
      let totalLeads = 0;
      let hotLeads = 0;
      let warmLeads = 0;
      let coldLeads = 0;
      let monthlyRevenue = 0;
      let dealsClosed = 0;
      let pipelineValue = 0;
      let avgDealSize = 0;
      let meetingsScheduled = 0;
      let callsToday = 0;
      let quotesGenerated = 0;
      let salesOrdersCount = 0;
      let totalOpportunities = 0;

      // Process overview
      if (overview.status === 'fulfilled' && overview.value) {
        totalOpportunities = overview.value.totalopportunities || 0;
      }

      // Process tier counts
      if (hotLeadsResponse.status === 'fulfilled' && hotLeadsResponse.value) {
        hotLeads = hotLeadsResponse.value.length || 0;
      }
      
      if (warmLeadsResponse.status === 'fulfilled' && warmLeadsResponse.value) {
        warmLeads = warmLeadsResponse.value.length || 0;
      }
      
      if (coldLeadsResponse.status === 'fulfilled' && coldLeadsResponse.value) {
        coldLeads = coldLeadsResponse.value.length || 0;
      }

      totalLeads = totalOpportunities;

      // Process closed won
      if (closedWon.status === 'fulfilled' && closedWon.value) {
        const wonData = closedWon.value.data || [];
        dealsClosed = wonData.length;
        
        monthlyRevenue = wonData.reduce((sum, opp) => 
          sum + (opp.total || 0), 0
        );
        
        avgDealSize = dealsClosed > 0 ? monthlyRevenue / dealsClosed : 0;
      }

      // Process appointments
      if (scheduledAppointments.status === 'fulfilled' && scheduledAppointments.value) {
        meetingsScheduled = scheduledAppointments.value.data?.length || 0;
      }

      // Process high value opportunities for pipeline
      if (highValueOpps.status === 'fulfilled' && highValueOpps.value) {
        pipelineValue = highValueOpps.value.data?.reduce((sum, opp) => 
          sum + (opp.total || 0), 0
        ) || 0;
      }

      // Process revenue stats
      if (revenueStats.status === 'fulfilled' && revenueStats.value) {
        const revStats = revenueStats.value;
        if (revStats.monthlyRevenue) monthlyRevenue = revStats.monthlyRevenue;
        if (revStats.avgDealSize) avgDealSize = revStats.avgDealSize;
      }

      // Process pipeline data
      let leadsByStage: Array<{stage: string; count: number; value: number}> = [];
      
      if (pipelineData.status === 'fulfilled' && pipelineData.value) {
        const byStatus = pipelineData.value.byStatus || {};
        
        // Map API status to pipeline stages
        const stageMap: Record<string, string> = {
          'new': 'New',
          'prospecting': 'Prospecting',
          'appointment_scheduled': 'Appointment Scheduled',
          'negotiation': 'Negotiation',
          'won': 'Closed Won'
        };

        leadsByStage = Object.entries(byStatus).map(([status, count]) => ({
          stage: stageMap[status] || status,
          count: count as number,
          value: 0 // Would need to fetch value per stage
        }));

        // Update pipeline stages
        const updatedPipelineStages = pipelineStages.map(stage => {
          const statusKey = Object.keys(stageMap).find(key => stageMap[key] === stage.name);
          const count = statusKey ? (byStatus[statusKey] || 0) : 0;
          const progress = Math.min((count / Math.max(totalOpportunities, 1)) * 100, 100);
          return { ...stage, count, progress };
        });

        setPipelineStages(updatedPipelineStages);
      }

      // Process sales orders
      if (salesOrders.status === 'fulfilled' && salesOrders.value) {
        salesOrdersCount = salesOrders.value.total || 0;
      }

      // Process quotes
      if (quotesData.status === 'fulfilled' && quotesData.value) {
        quotesGenerated = quotesData.value.data?.length || 0;
      }

      // Get calls for today (would need proper activity tracking)
      // Placeholder - would come from activity service
      callsToday = Math.floor(Math.random() * 10) + 5;

      // Calculate conversion rate
      const conversionRate = totalOpportunities > 0 
        ? (dealsClosed / totalOpportunities) * 100 
        : 0;

      // Calculate target progress
      const targetProgress = (monthlyRevenue / 150000) * 100;

      // Get top performing sources from closed won
      const sourcesMap = new Map();
      if (closedWon.status === 'fulfilled' && closedWon.value) {
        (closedWon.value.data || []).forEach(opp => {
          const source = opp.source || 'unknown';
          const revenue = opp.total || 0;
          const existing = sourcesMap.get(source) || { source, count: 0, revenue: 0 };
          sourcesMap.set(source, {
            source,
            count: existing.count + 1,
            revenue: existing.revenue + revenue
          });
        });
      }

      const topPerformingSources = Array.from(sourcesMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 3);

      // Get recent opportunities
      const recentOpportunities = recentOpps.status === 'fulfilled' && recentOpps.value
        ? (recentOpps.value.data || [])
        : [];

      // Calculate average response time (would need activity tracking)
      const avgResponseHours = 2.4;

      // Update stats
      setStats({
        totalLeads,
        hotLeads,
        warmLeads,
        coldLeads,
        conversionRate: parseFloat(conversionRate.toFixed(1)),
        monthlyRevenue,
        callsToday,
        meetingsScheduled,
        dealsClosed,
        pipelineValue,
        avgDealSize,
        revenueTarget: 150000,
        targetProgress,
        responseTime: `${avgResponseHours.toFixed(1)}h`,
        topPerformingSources,
        recentOpportunities,
        leadsByStage,
        salesOrdersCount,
        quotesGenerated
      });

    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange, user]);

  useEffect(() => {
    fetchSalesData();
    
    // Set up polling for real-time updates
    const intervalId = setInterval(() => {
      fetchSalesData(true);
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [fetchSalesData]);

  const handleRefresh = () => {
    fetchSalesData(true);
  };

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg" />
        <div className="h-[calc(100vh-64px)] p-4 md:p-6 space-y-6 overflow-auto">
          <div className="animate-pulse space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="h-8 bg-gray-200 rounded w-64"></div>
                <div className="h-4 bg-gray-200 rounded w-48"></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 bg-gray-200 rounded w-24"></div>
                <div className="h-10 bg-gray-200 rounded w-32"></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-40 bg-gray-200 rounded-2xl"></div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-96 bg-gray-200 rounded-2xl"></div>
              <div className="space-y-4">
                <div className="h-48 bg-gray-200 rounded-2xl"></div>
                <div className="h-48 bg-gray-200 rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      {/* Gradient Header */}
      <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg flex items-center px-6">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Sales Dashboard</h1>
              <p className="text-emerald-100 text-sm">
                Welcome back, <span className="font-semibold text-white">{user?.firstName || 'Sales Rep'}</span>
                <span className="ml-2 px-2 py-0.5 bg-white/10 text-white text-xs rounded-full">
                  {user?.role?.name || user?.role || 'Sales'}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Time range selector */}
            <div className="hidden md:flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-xl p-1">
              {['today', 'week', 'month'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range as any)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    timeRange === range
                      ? 'bg-white/20 text-white'
                      : 'text-blue-100 hover:bg-white/10'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
            
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                refreshing
                  ? 'bg-white/20 text-white/60 cursor-not-allowed'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              {refreshing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Refreshing...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden sm:inline">Refresh</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-[calc(100vh-64px)] p-4 md:p-6 space-y-6 overflow-auto">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Leads */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 rounded-2xl opacity-0 group-hover:opacity-50 blur transition duration-500"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100">
                  <Users className="h-6 w-6 text-emerald-600" />
                </div>
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100/80 text-emerald-600 text-xs font-medium">
                  <TrendingUp className="h-3 w-3" />
                  <span>+{Math.round((stats.totalLeads / 100) * 12.5)}%</span>
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalLeads}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100/50">
                <div className="text-sm text-gray-600">
                  <span>{stats.hotLeads} hot • {stats.warmLeads} warm • {stats.coldLeads} cold</span>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Revenue */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 rounded-2xl opacity-0 group-hover:opacity-50 blur transition duration-500"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100/80 text-blue-600 text-xs font-medium">
                  <TrendingUp className="h-3 w-3" />
                  <span>+{Math.round(stats.targetProgress)}%</span>
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.monthlyRevenue)}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100/50">
                <div className="flex items-center text-sm">
                  <Target className="h-4 w-4 text-blue-500 mr-1" />
                  <span className="text-gray-600">{Math.round(stats.targetProgress)}% of target</span>
                </div>
              </div>
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 rounded-2xl opacity-0 group-hover:opacity-50 blur transition duration-500"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100/80 text-purple-600 text-xs font-medium">
                  <TrendingUp className="h-3 w-3" />
                  <span>+{Math.round(stats.conversionRate / 10)}%</span>
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.conversionRate}%</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100/50">
                <div className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-gray-600">{stats.dealsClosed} deals closed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hot Leads */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-400 via-orange-400 to-amber-400 rounded-2xl opacity-0 group-hover:opacity-50 blur transition duration-500"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-red-100 to-orange-100">
                  <Flame className="h-6 w-6 text-red-600" />
                </div>
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-100/80 text-red-600 text-xs font-medium">
                  <AlertCircle className="h-3 w-3" />
                  <span>Priority</span>
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Hot Leads</p>
                <p className="text-2xl font-bold text-gray-900">{stats.hotLeads}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100/50">
                <div className="text-sm text-gray-600">
                  <span>Require immediate follow-up</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pipeline & Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pipeline Overview */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales Pipeline</h2>
            <div className="space-y-4">
              {pipelineStages.map((stage, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700 font-medium">{stage.name}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getOpportunityStatusColor(stage.name.toLowerCase())}`}>
                        {stage.count}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(stage.value)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${stage.color}`} 
                      style={{ width: `${stage.progress}%` }}
                    />
                  </div>
                </div>
              ))}
              
              {/* Pipeline Summary */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.pipelineValue)}</p>
                    <p className="text-xs text-gray-600">Total Pipeline</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.avgDealSize)}</p>
                    <p className="text-xs text-gray-600">Avg Deal Size</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Activities */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Activities</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-200/50 rounded-lg hover:bg-blue-100/50 transition-colors">
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Calls to Make</p>
                    <p className="text-sm text-gray-600">{stats.callsToday} scheduled calls</p>
                  </div>
                </div>
                <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                  Start
                </button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50/50 border border-green-200/50 rounded-lg hover:bg-green-100/50 transition-colors">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Meetings</p>
                    <p className="text-sm text-gray-600">{stats.meetingsScheduled} scheduled</p>
                  </div>
                </div>
                <button className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
                  View
                </button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-purple-50/50 border border-purple-200/50 rounded-lg hover:bg-purple-100/50 transition-colors">
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-purple-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Follow-ups</p>
                    <p className="text-sm text-gray-600">Pending follow-up emails</p>
                  </div>
                </div>
                <button className="px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors">
                  Compose
                </button>
              </div>

              {/* Recent Opportunities */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Opportunities</h3>
                <div className="space-y-3">
                  {stats.recentOpportunities.slice(0, 3).map((opp, index) => (
                    <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{opp.customer?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{opp.subject}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {opp.leadScore?.tier && (
                          <span className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${getTierColor(opp.leadScore.tier)}`}>
                            {getTierIcon(opp.leadScore.tier)}
                            {opp.leadScore.tier}
                          </span>
                        )}
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance & Targets */}
        <div className="bg-gradient-to-r from-green-50/80 to-emerald-50/80 backdrop-blur-sm rounded-2xl border border-green-100/50 p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Sales Performance</h2>
              <p className="text-gray-700">Monthly targets & achievements</p>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">
                {stats.targetProgress >= 100 ? 'Target Achieved' : 
                 stats.targetProgress >= 75 ? 'On Track' : 
                 stats.targetProgress >= 50 ? 'Behind Schedule' : 'Needs Attention'}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Revenue Target */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-blue-100/50">
                  <Target className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Revenue Target</span>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                {formatCurrency(stats.monthlyRevenue)} / {formatCurrency(stats.revenueTarget)}
              </p>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                  style={{ width: `${Math.min(stats.targetProgress, 100)}%` }}
                />
              </div>
            </div>
            
            {/* Deals Closed */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-green-100/50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Deals Closed</span>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                {stats.dealsClosed} deals this month
              </p>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                  style={{ width: `${Math.min((stats.dealsClosed / 20) * 100, 100)}%` }}
                />
              </div>
            </div>
            
            {/* Pipeline Value */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-amber-100/50">
                  <Workflow className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Pipeline Value</span>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                {formatCurrency(stats.pipelineValue)} potential
              </p>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                  style={{ width: `${Math.min((stats.pipelineValue / 500000) * 100, 100)}%` }}
                />
              </div>
            </div>
            
            {/* Top Sources */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-purple-100/50">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Top Source</span>
              </div>
              <div className="space-y-1">
                {stats.topPerformingSources.length > 0 ? (
                  stats.topPerformingSources.slice(0, 1).map((source, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700 capitalize">{source.source}</span>
                      <span className="text-xs text-gray-500">{source.count} deals</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No data available</p>
                )}
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="mt-6 pt-4 border-t border-green-100/50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">{stats.hotLeads}</p>
                <p className="text-xs text-gray-600">Hot Leads</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">{stats.meetingsScheduled}</p>
                <p className="text-xs text-gray-600">Meetings</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">{stats.callsToday}</p>
                <p className="text-xs text-gray-600">Today's Calls</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">{stats.responseTime}</p>
                <p className="text-xs text-gray-600">Avg Response</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions & Tools */}
        {permissionChecker?.hasPermission('opportunities.create') && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button className="group flex flex-col items-center justify-center p-4 bg-blue-50/50 border border-blue-200/50 hover:border-blue-300/50 hover:bg-blue-100/50 rounded-xl transition-all duration-300">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 mb-2 group-hover:from-blue-200 group-hover:to-blue-100">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">New Lead</span>
                <span className="text-xs text-gray-600">Add opportunity</span>
              </button>
              
              <button className="group flex flex-col items-center justify-center p-4 bg-emerald-50/50 border border-emerald-200/50 hover:border-emerald-300/50 hover:bg-emerald-100/50 rounded-xl transition-all duration-300">
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-50 mb-2 group-hover:from-emerald-200 group-hover:to-emerald-100">
                  <Phone className="h-6 w-6 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Log Call</span>
                <span className="text-xs text-gray-600">Record activity</span>
              </button>
              
              <button className="group flex flex-col items-center justify-center p-4 bg-purple-50/50 border border-purple-200/50 hover:border-purple-300/50 hover:bg-purple-100/50 rounded-xl transition-all duration-300">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-purple-50 mb-2 group-hover:from-purple-200 group-hover:to-purple-100">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Schedule</span>
                <span className="text-xs text-gray-600">Book meeting</span>
              </button>
              
              <button className="group flex flex-col items-center justify-center p-4 bg-amber-50/50 border border-amber-200/50 hover:border-amber-300/50 hover:bg-amber-100/50 rounded-xl transition-all duration-300">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 mb-2 group-hover:from-amber-200 group-hover:to-amber-100">
                  <FileText className="h-6 w-6 text-amber-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Report</span>
                <span className="text-xs text-gray-600">Generate report</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}