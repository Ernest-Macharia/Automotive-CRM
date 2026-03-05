'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Building, 
  TrendingUp, 
  DollarSign, 
  Users, 
  BarChart3,
  Target,
  FileText,
  Calendar,
  PieChart,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles,
  RefreshCw,
  Loader2,
  Award,
  TrendingDown
} from 'lucide-react';
import { opportunityService } from '@/services/opportunityService';

interface ManagementDashboardProps {
  user: any;
}

interface ManagementStats {
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  activeOpportunities: number;
  conversionRate: number;
  avgDealSize: number;
  winRate: number;
  topOpportunityTypes: Array<{
    type: string;
    count: number;
    revenue: number;
  }>;
  performanceTrends: {
    weekly: number[];
    monthly: number[];
  };
}

export default function ManagementDashboard({ user }: ManagementDashboardProps) {
  const [stats, setStats] = useState<ManagementStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    revenueGrowth: 0,
    activeOpportunities: 0,
    conversionRate: 0,
    avgDealSize: 0,
    winRate: 0,
    topOpportunityTypes: [],
    performanceTrends: {
      weekly: [0, 0, 0, 0, 0, 0, 0],
      monthly: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }
  });
  
  const [topOpportunities, setTopOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

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

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-emerald-600 bg-emerald-50';
    if (value < 0) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const fetchManagementData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      // Fetch all relevant data
      const [overviewResponse, filteredStatsResponse, revenueStatsResponse, topOppsResponse] = await Promise.allSettled([
        opportunityService.getOpportunitiesOverview(),
        opportunityService.getFilteredStats({}),
        opportunityService.getRevenueStats(),
        opportunityService.getTopOpportunities(5)
      ]);

      let totalRevenue = 0;
      let monthlyRevenue = 0;
      let activeOpportunities = 0;
      let totalOpportunities = 0;
      let wonOpportunities = 0;
      let openOpportunities = 0;
      const opportunityTypes: Record<string, { count: number; revenue: number }> = {};

      if (filteredStatsResponse.status === 'fulfilled' && filteredStatsResponse.value) {
        const filteredStats = filteredStatsResponse.value;
        totalOpportunities = filteredStats.total || 0;
        wonOpportunities = filteredStats.byStatus?.won || 0;
        activeOpportunities =
          (filteredStats.byStatus?.new || 0) +
          (filteredStats.byStatus?.attempted_to_contact || 0) +
          (filteredStats.byStatus?.prospecting || 0) +
          (filteredStats.byStatus?.appointment_scheduled || 0);
        openOpportunities = activeOpportunities;
      }

      // Process overview data
      if (overviewResponse.status === 'fulfilled' && overviewResponse.value) {
        const overview = overviewResponse.value;
        totalOpportunities = overview.totalopportunities || totalOpportunities;
        activeOpportunities = overview.openopportunities || activeOpportunities;
        
        // Update with overview data if available
        if (overview.byOpportunityType) {
          overview.byOpportunityType.forEach((type: any) => {
            if (type._id) {
              const count = type.count || 0;
              const estimatedRevenue =
                totalOpportunities > 0 ? (count / totalOpportunities) * totalRevenue : 0;
              opportunityTypes[type._id] = { count, revenue: estimatedRevenue };
            }
          });
        }
      }

      if (revenueStatsResponse.status === 'fulfilled' && revenueStatsResponse.value) {
        const revenueStats = revenueStatsResponse.value;
        totalRevenue = revenueStats.totalRevenue || totalRevenue;
      }

      // Calculate metrics
      const conversionRate = totalOpportunities > 0 ? (wonOpportunities / totalOpportunities) * 100 : 0;
      const winRate = openOpportunities > 0 ? (wonOpportunities / openOpportunities) * 100 : 0;
      const avgDealSize = wonOpportunities > 0 ? totalRevenue / wonOpportunities : 0;
      
      // Estimate monthly revenue (1/3 of total for demo purposes)
      monthlyRevenue = totalRevenue * 0.33;
      const revenueGrowth = 15.2; // Could calculate from historical data

      // Prepare top opportunity types
      const topOpportunityTypes = Object.entries(opportunityTypes)
        .map(([type, data]) => ({
          type,
          count: data.count,
          revenue: data.revenue
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 3);

      // Process top opportunities
      if (topOppsResponse.status === 'fulfilled' && topOppsResponse.value) {
        setTopOpportunities(topOppsResponse.value.slice(0, 5));
      } else {
        setTopOpportunities([]);
      }

      // Generate performance trends (simulated based on data)
      const weeklyTrends = Array(7).fill(0).map((_, i) => 
        Math.floor(totalRevenue / 30 * (0.8 + Math.random() * 0.4))
      );
      
      const monthlyTrends = Array(12).fill(0).map((_, i) => 
        Math.floor(totalRevenue / 12 * (0.7 + Math.random() * 0.6))
      );

      setStats({
        totalRevenue,
        monthlyRevenue,
        revenueGrowth,
        activeOpportunities,
        conversionRate,
        avgDealSize,
        winRate,
        topOpportunityTypes,
        performanceTrends: {
          weekly: weeklyTrends,
          monthly: monthlyTrends
        }
      });

    } catch (error) {
      console.error('Error fetching management data:', error);
      
      // Fallback data
      setStats({
        totalRevenue: 1250000,
        monthlyRevenue: 416667,
        revenueGrowth: 15.2,
        activeOpportunities: 24,
        conversionRate: 32,
        avgDealSize: 52000,
        winRate: 45,
        topOpportunityTypes: [
          { type: 'SERVICE', count: 45, revenue: 800000 },
          { type: 'SALE', count: 18, revenue: 350000 },
          { type: 'REPAIR', count: 12, revenue: 100000 }
        ],
        performanceTrends: {
          weekly: [45000, 52000, 48000, 51000, 55000, 49000, 53000],
          monthly: [380000, 410000, 390000, 420000, 400000, 430000, 450000, 440000, 460000, 480000, 470000, 500000]
        }
      });
      
      setTopOpportunities([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchManagementData();
  }, [fetchManagementData]);

  const handleRefresh = () => {
    fetchManagementData(true);
  };

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg" />
        <div className="h-[calc(100vh-64px)] p-4 md:p-6 space-y-6 overflow-auto">
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
              ))}
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
              <Building className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Management Dashboard</h1>
              <p className="text-teal-100 text-sm">
                Performance overview for <span className="font-semibold text-white">{user?.firstName || 'Management'}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Time range selector */}
            <div className="hidden md:flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-xl p-1">
              {['week', 'month', 'quarter', 'year'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range as any)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    timeRange === range
                      ? 'bg-white/20 text-white'
                      : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>

            {/* Refresh button */}
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
        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-100 p-5 hover:shadow-lg transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-emerald-100/50">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
              <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(stats.revenueGrowth)}`}>
                {stats.revenueGrowth > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : stats.revenueGrowth < 0 ? (
                  <TrendingDown className="h-3 w-3" />
                ) : null}
                <span>{formatPercentage(stats.revenueGrowth)}</span>
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Monthly</span>
                <span className="font-medium text-gray-700">
                  {formatCurrency(stats.monthlyRevenue)}
                </span>
              </div>
            </div>
          </div>

          {/* Active Opportunities */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100 p-5 hover:shadow-lg transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-100/50">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                Active
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium mb-1">Active Opportunities</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.activeOpportunities)}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Win Rate</span>
                <span className="font-medium text-gray-700">
                  {stats.winRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-amber-100 p-5 hover:shadow-lg transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-amber-100/50">
                <BarChart3 className="h-6 w-6 text-amber-600" />
              </div>
              <span className={`px-2 py-1 ${stats.conversionRate >= 30 ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'} text-xs rounded-full`}>
                {stats.conversionRate >= 30 ? 'Good' : 'Needs attention'}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium mb-1">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.conversionRate.toFixed(1)}%</p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Avg Deal Size</span>
                <span className="font-medium text-gray-700">
                  {formatCurrency(stats.avgDealSize)}
                </span>
              </div>
            </div>
          </div>

          {/* Performance Score */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-100 p-5 hover:shadow-lg transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-100/50">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <span className="px-2 py-1 bg-purple-100 text-purple-600 text-xs rounded-full">
                Score
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium mb-1">Performance Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {((stats.conversionRate + stats.winRate) / 2).toFixed(1)}/100
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100/50">
              <div className="flex items-center text-sm">
                <Sparkles className="h-4 w-4 text-purple-500 mr-1" />
                <span className="text-gray-600">Based on conversion & win rates</span>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Breakdown & Top Opportunities */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Breakdown */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Revenue Breakdown</h2>
              <div className="text-sm text-gray-600">
                By Opportunity Type
              </div>
            </div>
            
            <div className="space-y-6">
              {stats.topOpportunityTypes.length > 0 ? (
                <>
                  {/* Type breakdown */}
                  <div className="space-y-4">
                    {stats.topOpportunityTypes.map((type, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`h-3 w-3 rounded-full ${
                              index === 0 ? 'bg-blue-500' :
                              index === 1 ? 'bg-emerald-500' :
                              'bg-amber-500'
                            }`} />
                            <span className="text-sm font-medium text-gray-700">
                              {type.type.charAt(0) + type.type.slice(1).toLowerCase()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">{formatNumber(type.count)} deals</span>
                            <span className="text-sm font-medium text-gray-900">
                              {formatCurrency(type.revenue)}
                            </span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100/50 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              index === 0 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                              index === 1 ? 'bg-gradient-to-r from-emerald-500 to-green-500' :
                              'bg-gradient-to-r from-amber-500 to-yellow-500'
                            }`}
                            style={{ width: `${(type.revenue / stats.totalRevenue) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total revenue summary */}
                  <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Total Revenue from Top Categories</span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(stats.topOpportunityTypes.reduce((sum, type) => sum + type.revenue, 0))}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <PieChart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No revenue data available</p>
                  <p className="text-sm text-gray-500 mt-1">Revenue breakdown will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Top High-Value Opportunities */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 backdrop-blur-sm rounded-2xl border border-gray-200/30 p-5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Top Opportunities</h2>
                <p className="text-sm text-gray-600">Highest value deals</p>
              </div>
              <Award className="h-5 w-5 text-amber-500" />
            </div>
            
            <div className="space-y-4">
              {topOpportunities.length > 0 ? topOpportunities.map((opportunity, index) => (
                <div key={index} className="group p-3 bg-white/80 border border-gray-200/50 hover:border-blue-200/50 rounded-xl transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{opportunity.subject || 'Untitled'}</h3>
                      <p className="text-sm text-gray-600 truncate">
                        {opportunity.customer?.name || 'No Customer'}
                        {opportunity.customer?.companyName && ` • ${opportunity.customer.companyName}`}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600">
                      {opportunity.total ? formatCurrency(opportunity.total) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      opportunity.status === 'won' ? 'bg-green-100 text-green-600' :
                      opportunity.status === 'lost' ? 'bg-red-100 text-red-600' :
                      opportunity.status === 'appointment_scheduled' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {opportunity.status}
                    </span>
                    <span className="text-gray-500">
                      {opportunity.opportunityType || 'Service'}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No top opportunities found</p>
                  <p className="text-sm text-gray-500 mt-1">Create opportunities to see them here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance Trends */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Performance Trends</h2>
            <div className="flex items-center gap-2">
              {['week', 'month', 'quarter'].map((period) => (
                <button
                  key={period}
                  onClick={() => setTimeRange(period as any)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    timeRange === period
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-64">
            {/* Simple bar chart visualization */}
            <div className="flex items-end h-48 gap-1">
              {(timeRange === 'week' ? stats.performanceTrends.weekly : 
                timeRange === 'month' ? stats.performanceTrends.monthly.slice(0, 4) : 
                stats.performanceTrends.monthly).map((value, index) => {
                const maxValue = Math.max(...(timeRange === 'week' ? stats.performanceTrends.weekly : 
                  timeRange === 'month' ? stats.performanceTrends.monthly.slice(0, 4) : 
                  stats.performanceTrends.monthly));
                const height = (value / maxValue) * 100;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className={`w-full rounded-t-lg ${
                        index % 3 === 0 ? 'bg-gradient-to-t from-blue-500 to-cyan-500' :
                        index % 3 === 1 ? 'bg-gradient-to-t from-emerald-500 to-green-500' :
                        'bg-gradient-to-t from-purple-500 to-pink-500'
                      }`}
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-xs text-gray-500 mt-2">
                      {timeRange === 'week' ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'][index] :
                       timeRange === 'month' ? ['Week 1', 'Week 2', 'Week 3', 'Week 4'][index] :
                       `M${index + 1}`}
                    </span>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  Total {timeRange === 'week' ? 'weekly' : timeRange === 'month' ? 'monthly' : 'quarterly'} revenue:
                </span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(
                    (timeRange === 'week' ? stats.performanceTrends.weekly : 
                     timeRange === 'month' ? stats.performanceTrends.monthly.slice(0, 4) : 
                     stats.performanceTrends.monthly).reduce((a, b) => a + b, 0)
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
