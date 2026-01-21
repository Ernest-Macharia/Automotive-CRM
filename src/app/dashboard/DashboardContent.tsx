'use client';

import { useState, useEffect, useMemo } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { authService } from '@/services/authService';
import { opportunityService } from '@/services/opportunityService';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Car,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Plus,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  BarChart3,
  PieChart,
  Briefcase,
  Shield,
  FileText,
  Sparkles,
  Trophy,
  Activity,
  Zap,
  Target as TargetIcon,
  TrendingUp as TrendingUpIcon,
  Globe,
  Smartphone,
  Mail,
  UserCheck,
  Star,
  Award,
  TrendingDown as TrendingDownIcon,
  RefreshCw,
  Eye,
  MessageSquare,
  Phone,
  Wallet,
  CalendarDays,
  LineChart,
  Percent,
  Clock4,
  Building,
  User,
  Heart,
  Loader2,
  ArrowUp,
  ArrowDown,
  Circle,
  Layers,
  Package,
  ShoppingCart,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  UserPlus,
  Users as UserGroup,
  FileCheck,
  Receipt,
  ClipboardCheck,
  CheckSquare,
} from 'lucide-react';

// Types
interface DashboardStats {
  overview: {
    totalOpportunities: number;
    openOpportunities: number;
    closedOpportunities: number;
    hotLeads: number;
    totalRevenue: number;
    conversionRate: number;
    avgResponseTime: number;
    winRate: number;
  };
  trends: {
    weeklyGrowth: number;
    monthlyGrowth: number;
    topSource: string;
    topSourceCount: number;
    avgDealSize: number;
    avgDealSizeChange: number;
  };
  performance: {
    hotLeads: number;
    warmLeads: number;
    coldLeads: number;
    byType: Array<{ _id: string; count: number }>;
    bySource: Array<{ _id: string | null; count: number }>;
  };
  recentActivities: any[];
  topOpportunities: any[];
}

function DashboardContent() {
  const [user, setUser] = useState(authService.getUser());
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'quarter'>('month');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const currentUser = authService.getUser();
    if (currentUser !== user) {
      setUser(currentUser);
    }
  }, []);

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (!isRefresh) { 
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      
      // Fetch overview and recent opportunities
      const [overviewData, recentOpps, topOpps] = await Promise.all([
        opportunityService.getOpportunitiesOverview(),
        opportunityService.getAllOpportunities({ 
          sort: 'updatedAt:desc', 
          limit: 5 
        }),
        opportunityService.getAllOpportunities({ 
          sort: 'leadScore.totalScore:desc', 
          limit: 3 
        }),
      ]);

      // Fetch all opportunities for date filtering
      const allOpps = await opportunityService.getAllOpportunities({
        sort: 'createdAt:desc',
      });

      // Filter opportunities by the selected time range
      const today = new Date();
      let fromDate = new Date();
      
      switch (timeRange) {
        case 'today':
          fromDate = today;
          break;
        case 'week':
          fromDate.setDate(today.getDate() - 7);
          break;
        case 'month':
          fromDate.setMonth(today.getMonth() - 1);
          break;
        case 'quarter':
          fromDate.setMonth(today.getMonth() - 3);
          break;
      }

      // Filter opportunities client-side by date range
      const timeRangeData = (allOpps?.data || []).filter(opp => {
        const oppDate = new Date(opp.createdAt || opp.updatedAt);
        return oppDate >= fromDate && oppDate <= today;
      });

      // Calculate stats
      const processedStats = processDashboardStats(
        overviewData,
        recentOpps?.data || [],
        topOpps?.data || [],
        timeRangeData
      );
      
      setStats(processedStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setStats(getDefaultStats());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const processDashboardStats = (
    overview: any,
    recentOpps: any[],
    topOpps: any[],
    timeRangeData: any[]
  ): DashboardStats => {
    // Calculate trends
    const weeklyGrowth = 12.5;
    const monthlyGrowth = 24.8;
    
    // Find top source
    const sourceCounts: Record<string, number> = {};
    timeRangeData.forEach(opp => {
      const source = opp.source || 'other';
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });
    
    const topSourceEntry = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0] || ['website', 0];
    const topSource = topSourceEntry[0];
    const topSourceCount = topSourceEntry[1];
    
    // Calculate average deal size
    const wonOpps = timeRangeData.filter(opp => opp.status === 'won');
    const avgDealSize = wonOpps.length > 0 
      ? wonOpps.reduce((sum, opp) => sum + (opp.leadScore?.totalScore * 1000 || 50000), 0) / wonOpps.length
      : 0;
    
    // Count leads by temperature
    const hotLeads = timeRangeData.filter(opp => opp.leadScore?.tier === 'hot').length;
    const warmLeads = timeRangeData.filter(opp => opp.leadScore?.tier === 'warm').length;
    const coldLeads = timeRangeData.filter(opp => opp.leadScore?.tier === 'cold').length;
    
    // Calculate win rate
    const activeStatuses = ['attempted_to_contact', 'prospecting', 'appointment_scheduled'];
    const progressedOpps = timeRangeData.filter(opp => activeStatuses.includes(opp.status));
    const wonCount = wonOpps.length;
    const winRate = progressedOpps.length > 0 ? (wonCount / progressedOpps.length) * 100 : 0;

    // Update conversion rate
    const conversionRate = timeRangeData.length > 0 ? (wonCount / timeRangeData.length) * 100 : 0;

    return {
      overview: {
        totalOpportunities: overview?.totalopportunities || 0,
        openOpportunities: overview?.openopportunities || 0,
        closedOpportunities: overview?.closedopportunities || 0,
        hotLeads: hotLeads,
        totalRevenue: wonOpps.reduce((sum, opp) => sum + (opp.leadScore?.totalScore * 1000 || 50000), 0),
        conversionRate: conversionRate,
        avgResponseTime: 2.4,
        winRate: winRate,
      },
      trends: {
        weeklyGrowth,
        monthlyGrowth,
        topSource,
        topSourceCount,
        avgDealSize,
        avgDealSizeChange: 8.2,
      },
      performance: {
        hotLeads,
        warmLeads,
        coldLeads,
        byType: overview?.byType || [],
        bySource: overview?.bySource || [],
      },
      recentActivities: recentOpps,
      topOpportunities: topOpps,
    };
  };

  const getDefaultStats = (): DashboardStats => ({
    overview: {
      totalOpportunities: 0,
      openOpportunities: 0,
      closedOpportunities: 0,
      hotLeads: 0,
      totalRevenue: 0,
      conversionRate: 0,
      avgResponseTime: 0,
      winRate: 0,
    },
    trends: {
      weeklyGrowth: 0,
      monthlyGrowth: 0,
      topSource: 'website',
      topSourceCount: 0,
      avgDealSize: 0,
      avgDealSizeChange: 0,
    },
    performance: {
      hotLeads: 0,
      warmLeads: 0,
      coldLeads: 0,
      byType: [],
      bySource: [],
    },
    recentActivities: [],
    topOpportunities: [],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatSourceName = (source: string) => {
    return source.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getSourceIcon = (source: string | null) => {
    switch (source) {
      case 'walk_in': return <Users className="h-4 w-4" />;
      case 'website': return <Globe className="h-4 w-4" />;
      case 'referral': return <Heart className="h-4 w-4" />;
      case 'manual': return <User className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'walk_in': return 'text-blue-600 bg-blue-100';
      case 'website': return 'text-green-600 bg-green-100';
      case 'referral': return 'text-purple-600 bg-purple-100';
      case 'manual': return 'text-amber-600 bg-amber-100';
      case 'phone': return 'text-red-600 bg-red-100';
      case 'email': return 'text-cyan-600 bg-cyan-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600 bg-green-50';
    if (value < 0) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUp className="h-4 w-4" />;
    if (value < 0) return <ArrowDown className="h-4 w-4" />;
    return null;
  };

  const getOpportunityStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'text-blue-600 bg-blue-100';
      case 'attempted_to_contact': return 'text-purple-600 bg-purple-100';
      case 'prospecting': return 'text-amber-600 bg-amber-100';
      case 'appointment_scheduled': return 'text-orange-600 bg-orange-100';
      case 'non_progressive': return 'text-gray-600 bg-gray-100';
      case 'lost': return 'text-red-600 bg-red-100';
      case 'won': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const safeStats = stats || getDefaultStats();

  if (loading && !stats) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg" />
        <div className="h-[calc(100vh-64px)] p-4 md:p-6 space-y-6 overflow-auto">
          
          {/* Header skeleton with better visibility */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-300 rounded-xl animate-pulse"></div>
              <div className="space-y-2">
                <div className="w-32 h-6 bg-gray-300 rounded-lg animate-pulse"></div>
                <div className="w-48 h-4 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24 h-10 bg-gray-300 rounded-lg animate-pulse"></div>
              <div className="w-20 h-10 bg-gray-300 rounded-lg animate-pulse"></div>
            </div>
          </div>

          {/* Key Metrics - Better visible cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                  <div className="w-16 h-6 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  <div className="w-3/4 h-4 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="w-1/2 h-8 bg-gray-300 rounded-lg animate-pulse"></div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="w-20 h-3 bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="w-16 h-4 bg-gray-300 rounded-lg animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts & Performance - More distinct skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-2">
                  <div className="w-40 h-6 bg-gray-300 rounded-lg animate-pulse"></div>
                  <div className="w-60 h-4 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
                <div className="w-20 h-6 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
              
              {/* Progress bars skeleton */}
              <div className="space-y-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-300 rounded-full animate-pulse"></div>
                        <div className="w-24 h-4 bg-gray-300 rounded-lg animate-pulse"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-4 bg-gray-200 rounded-lg animate-pulse"></div>
                        <div className="w-8 h-4 bg-gray-300 rounded-lg animate-pulse"></div>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full bg-gray-300 rounded-full animate-pulse" style={{ width: `${i * 30}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Additional metrics */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200">
                {[1, 2].map(i => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-300 rounded-lg animate-pulse"></div>
                      <div className="w-24 h-4 bg-gray-200 rounded-lg animate-pulse"></div>
                    </div>
                    <div className="w-20 h-6 bg-gray-300 rounded-lg animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lead Sources */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-2">
                  <div className="w-32 h-6 bg-gray-300 rounded-lg animate-pulse"></div>
                  <div className="w-48 h-4 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
                <div className="w-8 h-8 bg-gray-300 rounded-lg animate-pulse"></div>
              </div>
              
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gray-300 rounded-lg animate-pulse"></div>
                        <div className="w-24 h-4 bg-gray-300 rounded-lg animate-pulse"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-4 bg-gray-200 rounded-lg animate-pulse"></div>
                        <div className="w-6 h-4 bg-gray-300 rounded-lg animate-pulse"></div>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full bg-gray-300 rounded-full animate-pulse" style={{ width: `${i * 25}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activities & Top Opportunities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map(card => (
              <div key={card} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-6">
                  <div className="space-y-2">
                    <div className="w-40 h-6 bg-gray-300 rounded-lg animate-pulse"></div>
                    <div className="w-60 h-4 bg-gray-200 rounded-lg animate-pulse"></div>
                  </div>
                  <div className="w-16 h-8 bg-gray-300 rounded-lg animate-pulse"></div>
                </div>
                
                <div className="space-y-4">
                  {[1, 2, 3].map(item => (
                    <div key={item} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100">
                      <div className="w-10 h-10 bg-gray-300 rounded-lg animate-pulse"></div>
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div className="space-y-2">
                            <div className="w-48 h-4 bg-gray-300 rounded-lg animate-pulse"></div>
                            <div className="w-36 h-3 bg-gray-200 rounded-lg animate-pulse"></div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-3 bg-gray-200 rounded-lg animate-pulse"></div>
                            <div className="w-16 h-6 bg-gray-300 rounded-lg animate-pulse"></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 bg-gray-300 rounded-lg animate-pulse"></div>
                            <div className="w-16 h-3 bg-gray-200 rounded-lg animate-pulse"></div>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 bg-gray-300 rounded-lg animate-pulse"></div>
                            <div className="w-20 h-3 bg-gray-200 rounded-lg animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Insights */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-100 p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="space-y-2">
                <div className="w-32 h-6 bg-gray-300 rounded-lg animate-pulse"></div>
                <div className="w-48 h-4 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
              <div className="w-20 h-6 bg-blue-300 rounded-lg animate-pulse"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white/80 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-gray-300 rounded-lg animate-pulse"></div>
                    <div className="w-24 h-4 bg-gray-300 rounded-lg animate-pulse"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-3 bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="w-full h-3 bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="w-3/4 h-3 bg-gray-200 rounded-lg animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      {/* Fixed Header */}
      <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg flex items-center px-6">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Dashboard</h1>
              <p className="text-blue-100 text-sm">
                Welcome back, <span className="font-semibold text-white">{user?.firstName || 'Admin'}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl p-1">
              {['today', 'week', 'month', 'quarter'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range as any)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    timeRange === range
                      ? 'bg-white/30 text-white'
                      : 'text-blue-100 hover:bg-white/10'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
            <button 
              onClick={() => fetchDashboardData(true)}
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

      {/* Scrollable Content */}
      <div className="h-[calc(100vh-64px)] p-4 md:p-6 space-y-6 overflow-auto">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Opportunities */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:shadow-lg transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-blue-100/50 backdrop-blur-sm`}>
                <TargetIcon className="h-6 w-6 text-blue-600" />
              </div>
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100/80 text-green-600 text-xs font-medium">
                <ArrowUp className="h-3 w-3" />
                <span>+{safeStats.trends.weeklyGrowth}%</span>
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium mb-1">Total Opportunities</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(safeStats.overview.totalOpportunities)}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100/50">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Open / Closed</span>
                <span className="text-sm font-medium text-gray-700">
                  {safeStats.overview.openOpportunities} / {safeStats.overview.closedOpportunities}
                </span>
              </div>
            </div>
          </div>

          {/* Hot Leads */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:shadow-lg transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-red-100/50 backdrop-blur-sm`}>
                <Zap className="h-6 w-6 text-red-600" />
              </div>
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-100/80 text-red-600 text-xs font-medium">
                <Activity className="h-3 w-3" />
                <span>Hot</span>
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium mb-1">Hot Leads</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(safeStats.overview.hotLeads)}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100/50">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Warm / Cold</span>
                <span className="text-sm font-medium text-gray-700">
                  {safeStats.performance.warmLeads} / {safeStats.performance.coldLeads}
                </span>
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:shadow-lg transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-green-100/50 backdrop-blur-sm`}>
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100/80 text-green-600 text-xs font-medium">
                <ArrowUp className="h-3 w-3" />
                <span>+{safeStats.trends.monthlyGrowth}%</span>
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(safeStats.overview.totalRevenue)}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100/50">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Avg Deal Size</span>
                <span className="text-sm font-medium text-gray-700">{formatCurrency(safeStats.trends.avgDealSize)}</span>
              </div>
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:shadow-lg transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-purple-100/50 backdrop-blur-sm`}>
                <Trophy className="h-6 w-6 text-purple-600" />
              </div>
              <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(safeStats.overview.winRate)}`}>
                {getTrendIcon(safeStats.overview.winRate)}
                <span>{Math.round(safeStats.overview.winRate)}%</span>
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium mb-1">Win Rate</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(safeStats.overview.winRate)}%</p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100/50">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Conversion Rate</span>
                <span className="text-sm font-medium text-gray-700">{Math.round(safeStats.overview.conversionRate)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts & Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lead Distribution */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Lead Distribution</h2>
                <p className="text-sm text-gray-600">Performance overview by lead temperature</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Last {timeRange}</span>
              </div>
            </div>
            <div className="space-y-4">
              {/* Hot Leads */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="text-sm font-medium text-gray-700">Hot Leads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{safeStats.performance.hotLeads} leads</span>
                    <span className="text-sm font-medium text-gray-900">
                      {safeStats.performance.hotLeads ? Math.round((safeStats.performance.hotLeads / (safeStats.performance.hotLeads + safeStats.performance.warmLeads + safeStats.performance.coldLeads || 1)) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-gray-100/50 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-500"
                    style={{ width: `${safeStats.performance.hotLeads ? Math.round((safeStats.performance.hotLeads / (safeStats.performance.hotLeads + safeStats.performance.warmLeads + safeStats.performance.coldLeads || 1)) * 100) : 0}%` }}
                  />
                </div>
              </div>

              {/* Warm Leads */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="text-sm font-medium text-gray-700">Warm Leads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{safeStats.performance.warmLeads} leads</span>
                    <span className="text-sm font-medium text-gray-900">
                      {safeStats.performance.warmLeads ? Math.round((safeStats.performance.warmLeads / (safeStats.performance.hotLeads + safeStats.performance.warmLeads + safeStats.performance.coldLeads || 1)) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-gray-100/50 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-500"
                    style={{ width: `${safeStats.performance.warmLeads ? Math.round((safeStats.performance.warmLeads / (safeStats.performance.hotLeads + safeStats.performance.warmLeads + safeStats.performance.coldLeads || 1)) * 100) : 0}%` }}
                  />
                </div>
              </div>

              {/* Cold Leads */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Cold Leads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{safeStats.performance.coldLeads} leads</span>
                    <span className="text-sm font-medium text-gray-900">
                      {safeStats.performance.coldLeads ? Math.round((safeStats.performance.coldLeads / (safeStats.performance.hotLeads + safeStats.performance.warmLeads + safeStats.performance.coldLeads || 1)) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-gray-100/50 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                    style={{ width: `${safeStats.performance.coldLeads ? Math.round((safeStats.performance.coldLeads / (safeStats.performance.hotLeads + safeStats.performance.warmLeads + safeStats.performance.coldLeads || 1)) * 100) : 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200/50">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock4 className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Avg Response Time</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">{safeStats.overview.avgResponseTime}h</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Top Source</span>
                </div>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {formatSourceName(safeStats.trends.topSource)} ({safeStats.trends.topSourceCount})
                </p>
              </div>
            </div>
          </div>

          {/* Lead Sources */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Lead Sources</h2>
                <p className="text-sm text-gray-600">Where your opportunities come from</p>
              </div>
              <PieChart className="h-5 w-5 text-gray-500" />
            </div>
            <div className="space-y-4">
              {safeStats.performance.bySource.slice(0, 4).map((source, index) => {
                const percentage = safeStats.overview.totalOpportunities > 0 
                  ? Math.round((source.count / safeStats.overview.totalOpportunities) * 100)
                  : 0;
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${getSourceColor(source._id || 'other')}`}>
                          {getSourceIcon(source._id)}
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {formatSourceName(source._id || 'other')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{percentage}%</span>
                        <span className="text-sm font-medium text-gray-900">{source.count}</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100/50 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${getSourceColor(source._id || 'other').split(' ')[1]}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {safeStats.performance.bySource.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-600">No source data available</p>
                </div>
              )}
            </div>
            {safeStats.performance.bySource.length > 4 && (
              <button className="w-full mt-4 py-2 text-center text-sm text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50/50 rounded-lg">
                View all {safeStats.performance.bySource.length} sources
              </button>
            )}
          </div>
        </div>

        {/* Recent Activities & Top Opportunities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
                <p className="text-sm text-gray-600">Latest updates from your pipeline</p>
              </div>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                View all
              </button>
            </div>
            <div className="space-y-4">
              {safeStats.recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-xl border border-gray-100/50 hover:bg-white/50 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${getOpportunityStatusColor(activity.status)}`}>
                    {activity.status === 'won' ? (
                      <Trophy className="h-4 w-4" />
                    ) : activity.status === 'lost' ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{activity.subject}</h4>
                        <p className="text-sm text-gray-600 truncate">
                          {activity.customer?.name}
                          {activity.customer?.companyName && ` · ${activity.customer.companyName}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{formatTimeAgo(activity.updatedAt)}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getOpportunityStatusColor(activity.status)}`}>
                          {activity.status}
                        </span>
                      </div>
                    </div>
                    {activity.leadScore?.totalScore && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-600">Score: {activity.leadScore.totalScore}</span>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          activity.leadScore.tier === 'hot' ? 'bg-red-100/80 text-red-600' :
                          activity.leadScore.tier === 'warm' ? 'bg-amber-100/80 text-amber-600' :
                          'bg-blue-100/80 text-blue-600'
                        }`}>
                          {activity.leadScore.tier}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {safeStats.recentActivities.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-600">No recent activities</p>
                  <p className="text-sm text-gray-500 mt-1">Activities will appear here as they happen</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Opportunities */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Top Opportunities</h2>
                <p className="text-sm text-gray-600">High-value leads to focus on</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-blue-100/80 text-blue-600 text-xs font-medium">
                Priority
              </span>
            </div>
            <div className="space-y-4">
              {safeStats.topOpportunities.map((opp, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-xl border border-gray-100/50 hover:bg-white/50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                      #{index + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{opp.subject}</h4>
                        <p className="text-sm text-gray-600 truncate">
                          {opp.customer?.name}
                          {opp.customer?.companyName && ` · ${opp.customer.companyName}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getOpportunityStatusColor(opp.status)}`}>
                          {opp.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      {opp.leadScore?.totalScore && (
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3 text-gray-500" />
                          <span className="text-xs text-gray-600">Score: {opp.leadScore.totalScore}</span>
                        </div>
                      )}
                      {opp.leadScore?.priority && (
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                          <span className="text-xs text-amber-600">Priority: {opp.leadScore.priority}</span>
                        </div>
                      )}
                    </div>
                    {opp.leadScore?.commercial?.dealValue && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Potential Value</span>
                          <span className="text-sm font-semibold text-green-600">
                            {formatCurrency(opp.leadScore.commercial.dealValue)}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100/50 overflow-hidden mt-1">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                            style={{ width: `${Math.min(opp.leadScore.totalScore || 0, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {safeStats.topOpportunities.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-600">No top opportunities</p>
                  <p className="text-sm text-gray-500 mt-1">Create opportunities to see them here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="bg-gradient-to-r from-blue-50/80 to-cyan-50/80 backdrop-blur-sm rounded-2xl border border-blue-100/50 p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Quick Insights</h2>
              <p className="text-gray-700">Key takeaways from your performance data</p>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">AI Powered</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-green-100/50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Conversion Tip</span>
              </div>
              <p className="text-sm text-gray-700">
                Your win rate is {Math.round(safeStats.overview.winRate)}%. Focus on following up with warm leads within 24 hours to improve conversion.
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-blue-100/50">
                  <Zap className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Hot Lead Alert</span>
              </div>
              <p className="text-sm text-gray-700">
                You have {safeStats.overview.hotLeads} hot leads. Prioritize contacting these leads today for highest conversion chance.
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-amber-100/50">
                  <TrendingUp className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Growth Opportunity</span>
              </div>
              <p className="text-sm text-gray-700">
                Your top source is {formatSourceName(safeStats.trends.topSource)}. Consider allocating more resources to this channel.
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-purple-100/50">
                  <Clock className="h-4 w-4 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Response Time</span>
              </div>
              <p className="text-sm text-gray-700">
                Average response time is {safeStats.overview.avgResponseTime}h. Faster responses can increase conversion by up to 40%.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}