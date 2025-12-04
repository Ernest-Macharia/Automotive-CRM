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
  Search,
  Bell,
  Plus,
  Filter,
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
  ChevronRight,
  ChevronLeft,
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
} from 'lucide-react';

// Types
interface DashboardStats {
  opportunities: {
    total: number;
    open: number;
    closed: number;
    inProgress: number;
    byType: Array<{ _id: string; count: number }>;
    bySource: Array<{ _id: string | null; count: number }>;
  };
  financial: {
    totalRevenue: number;
    pendingInvoices: number;
    collectedPayments: number;
    averageDealSize: number;
    conversionRate: number;
  };
  performance: {
    hotLeads: number;
    warmLeads: number;
    coldLeads: number;
    responseTime: number;
    winRate: number;
    avgFollowUps: number;
  };
  recentOpportunities: any[];
}

function DashboardContent() {
  const [user, setUser] = useState(authService.getUser());
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'quarter'>('month');
  const [notifications, setNotifications] = useState(3);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const currentUser = authService.getUser();
    if (currentUser !== user) {
      setUser(currentUser);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [opportunitiesData, opportunitiesOverview] = await Promise.all([
        opportunityService.getAllOpportunities({}),
        opportunityService.getOpportunitiesOverview(),
      ]);

      const processedStats = processDashboardStats(
        Array.isArray(opportunitiesData) ? opportunitiesData : opportunitiesData?.data || [],
        opportunitiesOverview
      );
      
      setStats(processedStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setStats({
        opportunities: {
          total: 0,
          open: 0,
          closed: 0,
          inProgress: 0,
          byType: [],
          bySource: [],
        },
        financial: {
          totalRevenue: 0,
          pendingInvoices: 0,
          collectedPayments: 0,
          averageDealSize: 0,
          conversionRate: 0,
        },
        performance: {
          hotLeads: 0,
          warmLeads: 0,
          coldLeads: 0,
          responseTime: 0,
          winRate: 0,
          avgFollowUps: 0,
        },
        recentOpportunities: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const processDashboardStats = (
    opportunities: any[],
    overview: any
  ): DashboardStats => {
    const hotLeads = opportunities.filter(opp => 
      opp.leadScore?.tier === 'hot'
    ).length;
    
    const warmLeads = opportunities.filter(opp => 
      opp.leadScore?.tier === 'warm'
    ).length;
    
    const coldLeads = opportunities.filter(opp => 
      opp.leadScore?.tier === 'cold'
    ).length;

    const wonOpportunities = opportunities.filter(opp => opp.status === 'won');
    const totalRevenue = wonOpportunities.reduce((sum, opp) => 
      sum + (opp.leadScore?.commercial?.dealValue || 0), 0
    );
    
    const pendingInvoices = opportunities.filter(opp => 
      ['quotation', 'qualified'].includes(opp.status)
    ).length;
    
    const collectedPayments = wonOpportunities.length;

    const avgDealSize = wonOpportunities.length > 0 
      ? totalRevenue / wonOpportunities.length
      : 0;

    const conversionRate = opportunities.length > 0 
      ? (wonOpportunities.length / opportunities.length) * 100 
      : 0;

    const contactedOpps = opportunities.filter(opp => 
      ['contacted', 'qualified'].includes(opp.status)
    );
    const winRate = contactedOpps.length > 0
      ? (wonOpportunities.length / contactedOpps.length) * 100
      : 0;

    const recentOpportunities = opportunities
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);

    return {
      opportunities: {
        total: overview?.totalopportunities || opportunities.length,
        open: overview?.openopportunities || opportunities.filter(o => !['won', 'lost'].includes(o.status)).length,
        closed: overview?.closedopportunities || opportunities.filter(o => ['won', 'lost'].includes(o.status)).length,
        inProgress: overview?.inProgress || opportunities.filter(o => ['contacted', 'qualified', 'quotation'].includes(o.status)).length,
        byType: overview?.byType || [],
        bySource: overview?.bySource || [],
      },
      financial: {
        totalRevenue,
        pendingInvoices,
        collectedPayments,
        averageDealSize: avgDealSize,
        conversionRate,
      },
      performance: {
        hotLeads,
        warmLeads,
        coldLeads,
        responseTime: 24,
        winRate,
        avgFollowUps: 2.3,
      },
      recentOpportunities,
    };
  };

  const performanceScore = useMemo(() => {
    if (!stats) return 0;
    
    const { performance } = stats;
    const score = (
      (performance.winRate / 100) * 40 +
      (Math.min(performance.hotLeads, 20) / 20) * 30 +
      (Math.max(0, 48 - performance.responseTime) / 48) * 30
    );
    
    return Math.min(Math.round(score), 100);
  }, [stats]);

  const kpiCards = [
    {
      title: 'Total Opportunities',
      value: stats?.opportunities.total.toString() || '0',
      change: '+12%',
      trend: 'up',
      icon: TargetIcon,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50',
      borderColor: 'border-blue-100',
      metric: 'Active Pipeline',
      metricValue: stats?.opportunities.open.toString() || '0',
    },
    {
      title: 'Monthly Revenue',
      value: `Ksh ${(stats?.financial.totalRevenue || 0).toLocaleString()}`,
      change: '+23%',
      trend: 'up',
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50',
      borderColor: 'border-green-100',
      metric: 'Avg Deal Size',
      metricValue: `Ksh ${Math.round(stats?.financial.averageDealSize || 0).toLocaleString()}`,
    },
    {
      title: 'Hot Leads',
      value: stats?.performance.hotLeads.toString() || '0',
      change: '+18%',
      trend: 'up',
      icon: Zap,
      color: 'from-red-500 to-orange-500',
      bgColor: 'bg-gradient-to-br from-red-50 to-orange-50',
      borderColor: 'border-red-100',
      metric: 'Response Time',
      metricValue: `${Math.round(stats?.performance.responseTime || 0)}h`,
    },
    {
      title: 'Win Rate',
      value: `${Math.round(stats?.performance.winRate || 0)}%`,
      change: '+5%',
      trend: 'up',
      icon: Trophy,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50',
      borderColor: 'border-purple-100',
      metric: 'Conversion Rate',
      metricValue: `${Math.round(stats?.financial.conversionRate || 0)}%`,
    },
  ];

  const sourceData = stats?.opportunities.bySource || [];
  const topSources = sourceData.slice(0, 4);

  const getSourceColor = (source: string | null) => {
    switch (source) {
      case 'walk_in': return 'bg-blue-500';
      case 'website': return 'bg-green-500';
      case 'referral': return 'bg-purple-500';
      case 'manual': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };

  const getSourceIcon = (source: string | null) => {
    switch (source) {
      case 'walk_in': return <Users className="h-4 w-4" />;
      case 'website': return <Globe className="h-4 w-4" />;
      case 'referral': return <Heart className="h-4 w-4" />;
      case 'manual': return <User className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const formatSourceName = (source: string | null) => {
    if (!source) return 'Other';
    return source.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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

  const getOpportunityStageColor = (stage: string) => {
    switch (stage) {
      case 'new': return 'bg-blue-100 text-blue-600';
      case 'contacted': return 'bg-purple-100 text-purple-600';
      case 'qualified': return 'bg-amber-100 text-amber-600';
      case 'quotation': return 'bg-orange-100 text-orange-600';
      case 'won': return 'bg-green-100 text-green-600';
      case 'lost': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatAmount = (amount: number) => {
    return `Ksh ${amount.toLocaleString()}`;
  };

  const getAvatarColor = (type: string, score?: number) => {
    if (type === 'organization') return 'bg-purple-100 text-purple-600';
    if (!score) return 'bg-blue-100 text-blue-600';
    
    if (score >= 70) return 'bg-red-100 text-red-600';
    if (score >= 50) return 'bg-amber-100 text-amber-600';
    return 'bg-blue-100 text-blue-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-64 bg-gray-200 rounded" />
        </div>
        <div className="h-32 bg-gray-200 rounded-2xl" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 bg-gray-200 rounded-2xl" />
          <div className="h-64 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 truncate">Dashboard</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-gray-500 text-sm">
                Welcome back, <span className="font-semibold text-blue-600">{user?.firstName || 'Admin'}</span>! 
                {stats && (
                  <span className="ml-2">
                    You have <span className="font-semibold text-green-600">{stats.opportunities.open}</span> active opportunities.
                  </span>
                )}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg border border-gray-200 bg-white text-gray-600"
          >
            <Filter className="h-5 w-5" />
          </button>
          
          <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block md:flex md:items-center md:gap-3`}>
            <div className="flex flex-wrap items-center gap-2 mb-3 md:mb-0 md:bg-white md:border md:border-gray-200 md:rounded-xl md:p-1">
              {['today', 'week', 'month', 'quarter'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range as any)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex-1 md:flex-none ${
                    timeRange === range
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search dashboard..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 w-full"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <button className="relative p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                  <Bell className="h-5 w-5 text-gray-600" />
                  {notifications > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white font-medium">
                      {notifications}
                    </span>
                  )}
                </button>
                <button 
                  onClick={fetchDashboardData}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-4 md:p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-lg font-semibold mb-2">Your Performance Score</h2>
            <p className="text-gray-300 text-sm">Based on win rate, response time, and lead quality</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative">
              <div className="h-20 w-20 md:h-24 md:w-24">
                <svg className="h-full w-full" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${performanceScore}, 100`}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl md:text-2xl font-bold">{performanceScore}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-400" />
                <span className="text-sm">
                  <span className="font-semibold">{Math.round(stats?.performance.winRate || 0)}%</span> Win Rate
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-400" />
                <span className="text-sm">
                  <span className="font-semibold">{stats?.performance.hotLeads || 0}</span> Hot Leads
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock4 className="h-4 w-4 text-blue-400" />
                <span className="text-sm">
                  <span className="font-semibold">{Math.round(stats?.performance.responseTime || 0)}h</span> Avg Response
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, index) => {
          const Icon = card.icon;
          const isUp = card.trend === 'up';
          
          return (
            <div
              key={index}
              className={`${card.bgColor} rounded-2xl border ${card.borderColor} p-4 md:p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
            >
              <div className="flex items-start justify-between mb-3 md:mb-4">
                <div className={`p-2 md:p-3 rounded-xl bg-gradient-to-r ${card.color}`}>
                  <Icon className="h-4 w-4 md:h-5 md:w-5 text-white" />
                </div>
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/80 text-xs font-medium text-gray-600">
                  {isUp ? (
                    <>
                      <ArrowUpRight className="h-3 w-3 text-green-500" />
                      <span className="text-green-600">{card.change}</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="h-3 w-3 text-red-500" />
                      <span className="text-red-600">{card.change}</span>
                    </>
                  )}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">{card.title}</p>
                <p className="text-xl md:text-2xl font-bold text-gray-800 truncate">{card.value}</p>
              </div>
              <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-200/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 truncate">{card.metric}</span>
                  <span className="text-sm font-medium text-gray-700 truncate ml-2">{card.metricValue}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-4 md:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Opportunity Pipeline</h2>
              <p className="text-sm text-gray-500">Distribution across sales stages</p>
            </div>
            <div className="flex items-center gap-2 mt-3 sm:mt-0">
              <button className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-medium">
                Count
              </button>
              <button className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200">
                Value
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {['new', 'contacted', 'qualified', 'quotation', 'won', 'lost'].map((stage, index) => {
              const stageOpps = stats?.recentOpportunities.filter(opp => opp.status === stage) || [];
              const count = stageOpps.length;
              const totalValue = stageOpps.reduce((sum, opp) => 
                sum + (opp.leadScore?.commercial?.dealValue || 0), 0
              );
              const percentage = stats?.opportunities.total 
                ? Math.round((count / stats.opportunities.total) * 100)
                : 0;
              
              return (
                <div key={stage} className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium capitalize ${getOpportunityStageColor(stage)}`}>
                        {stage}
                      </span>
                      <span className="text-sm text-gray-500">{count} opportunities</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{percentage}%</span>
                      <span className="text-sm font-medium text-gray-700">{formatAmount(totalValue)}</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${getOpportunityStageColor(stage).split(' ')[0]}`}
                      style={{ width: `${Math.max(percentage, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Lead Sources</h2>
              <p className="text-sm text-gray-500">Where your opportunities come from</p>
            </div>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {topSources.map((source, index) => {
              const percentage = stats?.opportunities.total 
                ? Math.round((source.count / stats.opportunities.total) * 100)
                : 0;
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${getSourceColor(source._id).replace('bg-', 'bg-')} bg-opacity-10`}>
                        <div className={`p-1 rounded ${getSourceColor(source._id)}`}>
                          {getSourceIcon(source._id)}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {formatSourceName(source._id)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{percentage}%</span>
                      <span className="text-sm font-medium text-gray-700">{source.count}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${getSourceColor(source._id)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {sourceData.length > 4 && (
            <button className="w-full mt-4 py-2 text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all {sourceData.length} sources
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-4 md:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Recent Opportunities</h2>
              <p className="text-sm text-gray-500">Latest updates from your pipeline</p>
            </div>
            <div className="flex items-center gap-3 mt-3 sm:mt-0">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 text-sm font-medium hover:bg-gray-100">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filter</span>
              </button>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                View all
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {stats?.recentOpportunities.map((opp) => (
              <div
                key={opp._id}
                className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors group"
              >
                <div className={`p-2 rounded-lg ${getAvatarColor(opp.type, opp.leadScore?.totalScore)} flex-shrink-0`}>
                  {opp.type === 'organization' ? (
                    <Building className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-medium text-gray-800 truncate">{opp.subject}</h4>
                      <p className="text-sm text-gray-500 truncate">
                        {opp.customer?.name}
                        {opp.customer?.companyName && ` · ${opp.customer.companyName}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 whitespace-nowrap">{formatTimeAgo(opp.updatedAt)}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${getOpportunityStageColor(opp.status)}`}>
                        {opp.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {opp.leadScore?.totalScore && (
                      <div className="flex items-center gap-1">
                        <Target className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-600">Score: {opp.leadScore.totalScore}</span>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          opp.leadScore.tier === 'hot' ? 'bg-red-100 text-red-600' :
                          opp.leadScore.tier === 'warm' ? 'bg-amber-100 text-amber-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {opp.leadScore.tier}
                        </span>
                      </div>
                    )}
                    {opp.vehicles?.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Car className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-600">{opp.vehicles.length} vehicle(s)</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="p-1.5 hover:bg-green-50 rounded-lg text-green-500">
                    <MessageSquare className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-800">Quick Stats</h2>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">
              Live
            </span>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-800">Active Leads</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <div className="flex-1 h-1.5 rounded-full bg-blue-200 overflow-hidden">
                    <div className="h-full w-3/4 rounded-full bg-blue-500" />
                  </div>
                  <span className="text-xs text-gray-500">74% hot/warm</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-green-100 bg-green-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-800">Won Deals</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">
                  {Math.round((stats?.opportunities.total || 0) * (stats?.financial.conversionRate || 0) / 100)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <div className="flex-1 h-1.5 rounded-full bg-green-200 overflow-hidden">
                    <div className="h-full w-1/4 rounded-full bg-green-500" style={{ width: `${stats?.financial.conversionRate || 0}%` }} />
                  </div>
                  <span className="text-xs text-gray-500">{Math.round(stats?.financial.conversionRate || 0)}% rate</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-800">Lead Types</span>
              </div>
              <div className="space-y-2">
                {stats?.opportunities.byType.map((type, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {type._id === 'individual' ? 'Individual' : 'Organization'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">{type.count}</span>
                      <span className="text-xs text-gray-500">
                        {Math.round((type.count / (stats?.opportunities.total || 1)) * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-800">Urgent Alerts</span>
                <AlertCircle className="h-4 w-4 text-amber-500" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Leads with 48h no contact</span>
                  <span className="font-medium text-gray-800">3</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Quotes expiring soon</span>
                  <span className="font-medium text-gray-800">2</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Overdue follow-ups</span>
                  <span className="font-medium text-gray-800">5</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-3 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors group">
                <div className="flex items-center justify-between mb-1">
                  <Plus className="h-4 w-4 text-blue-600" />
                  <ArrowUpRight className="h-3 w-3 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs font-medium text-gray-700">New Opportunity</p>
              </button>
              <button className="p-3 rounded-xl bg-green-50 border border-green-100 hover:bg-green-100 transition-colors group">
                <div className="flex items-center justify-between mb-1">
                  <FileText className="h-4 w-4 text-green-600" />
                  <ArrowUpRight className="h-3 w-3 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs font-medium text-gray-700">Create Quote</p>
              </button>
              <button className="p-3 rounded-xl bg-purple-50 border border-purple-100 hover:bg-purple-100 transition-colors group">
                <div className="flex items-center justify-between mb-1">
                  <CalendarDays className="h-4 w-4 text-purple-600" />
                  <ArrowUpRight className="h-3 w-3 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs font-medium text-gray-700">Schedule Call</p>
              </button>
              <button className="p-3 rounded-xl bg-orange-50 border border-orange-100 hover:bg-orange-100 transition-colors group">
                <div className="flex items-center justify-between mb-1">
                  <LineChart className="h-4 w-4 text-orange-600" />
                  <ArrowUpRight className="h-3 w-3 text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs font-medium text-gray-700">View Reports</p>
              </button>
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