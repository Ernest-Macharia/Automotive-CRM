'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  CreditCard,
  Banknote,
  Calculator,
  FileText,
  Calendar,
  Download,
  Filter,
  Eye,
  EyeOff,
  RefreshCw,
  Loader2,
  MoreVertical,
  BarChart3,
  LineChart,
  Wallet,
  Receipt,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  Wrench,
  Car,
  Package,
  Building,
  Zap
} from 'lucide-react';
import { opportunityService, Opportunity } from '@/services/opportunityService';
import { createPermissionChecker } from '@/services/settings/roleService';

interface FinanceDashboardProps {
  user: any;
}

interface FinancialMetrics {
  revenue: number;
  expenses: number;
  profit: number;
  cashFlow: number;
  accountsReceivable: number;
  accountsPayable: number;
  revenueGrowth: number;
  profitMargin: number;
  avgDealSize: number;
  customerLifetimeValue: number;
}

interface MonthlyRevenue {
  month: string;
  amount: number;
  growth: number;
  count: number;
}

interface ExpenseBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

interface RevenueSource {
  service: string;
  amount: number;
  growth: number;
  count: number;
  avgValue: number;
}

interface PaymentDue {
  id: string;
  client: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'overdue' | 'paid';
  opportunityId: string;
  daysOverdue?: number;
}

interface Transaction {
  id: string;
  type: 'revenue' | 'expense';
  description: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  opportunityId?: string;
  category: string;
}

interface BudgetStatus {
  department: string;
  budget: number;
  spent: number;
  variance: number;
  forecast: number;
}

export default function FinanceDashboard({ user }: FinanceDashboardProps) {
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    revenue: 0,
    expenses: 0,
    profit: 0,
    cashFlow: 0,
    accountsReceivable: 0,
    accountsPayable: 0,
    revenueGrowth: 0,
    profitMargin: 0,
    avgDealSize: 0,
    customerLifetimeValue: 0
  });
  
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<ExpenseBreakdown[]>([]);
  const [revenueSources, setRevenueSources] = useState<RevenueSource[]>([]);
  const [upcomingPayments, setUpcomingPayments] = useState<PaymentDue[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus[]>([]);
  
  const [showDetailedNumbers, setShowDetailedNumbers] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const calculateTimeRange = () => {
    const today = new Date();
    let startDate: Date;
    
    switch (timeframe) {
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'quarter':
        const quarterMonth = Math.floor(today.getMonth() / 3) * 3;
        startDate = new Date(today.getFullYear(), quarterMonth, 1);
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    };
  };

  const getServiceIcon = (service: string) => {
    const serviceLower = service.toLowerCase();
    if (serviceLower.includes('maintenance') || serviceLower.includes('service')) {
      return <Wrench className="h-4 w-4" />;
    } else if (serviceLower.includes('repair')) {
      return <Car className="h-4 w-4" />;
    } else if (serviceLower.includes('sale') || serviceLower.includes('parts')) {
      return <Package className="h-4 w-4" />;
    } else if (serviceLower.includes('emergency')) {
      return <Zap className="h-4 w-4" />;
    } else if (serviceLower.includes('consult')) {
      return <Users className="h-4 w-4" />;
    }
    return <ShoppingBag className="h-4 w-4" />;
  };

  const fetchFinancialData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const dateRange = calculateTimeRange();
      
      // Fetch multiple data sources in parallel
      const [
        wonOpportunities,
        serviceOpportunities,
        allOpportunities,
        highValueOpportunities,
        recentTransactionsData,
        revenueStats
      ] = await Promise.all([
        // Won opportunities for revenue calculation
        opportunityService.filterOpportunities({
          status: 'won',
          fromDate: dateRange.start,
          toDate: dateRange.end,
          sort: 'createdAt:desc',
          limit: 100
        }).catch(() => ({ data: [] })),
        
        // Service opportunities for breakdown
        opportunityService.filterOpportunities({
          opportunityType: 'SERVICE',
          fromDate: dateRange.start,
          toDate: dateRange.end,
          sort: 'total:desc',
          limit: 50
        }).catch(() => ({ data: [] })),
        
        // All opportunities for trend analysis
        opportunityService.filterOpportunities({
          fromDate: dateRange.start,
          toDate: dateRange.end,
          sort: 'createdAt:desc',
          limit: 200
        }).catch(() => ({ data: [] })),
        
        // High value opportunities for top revenue
        opportunityService.getHighValueOpportunities(10000).catch(() => ({ data: [] })),
        
        // Recent transactions (mock for now - would come from invoice system)
        opportunityService.filterOpportunities({
          status: 'won',
          sort: 'updatedAt:desc',
          limit: 20
        }).catch(() => ({ data: [] })),
        
        // Revenue stats
        opportunityService.getRevenueStats().catch(() => ({ 
          monthlyRevenue: 0, 
          avgDealSize: 0,
          totalRevenue: 0
        }))
      ]);

      // Calculate revenue from won opportunities
      const revenue = wonOpportunities.data?.reduce((sum, opp) => 
        sum + (opp.total || 0), 0
      ) || 0;

      // Calculate previous period for growth
      const prevDate = new Date(dateRange.start);
      prevDate.setMonth(prevDate.getMonth() - 1);
      const prevStart = prevDate.toISOString().split('T')[0];
      
      const prevOpportunities = await opportunityService.filterOpportunities({
        status: 'won',
        fromDate: prevStart,
        toDate: dateRange.start,
        limit: 100
      }).catch(() => ({ data: [] }));

      const prevRevenue = prevOpportunities.data?.reduce((sum, opp) => 
        sum + (opp.total || 0), 0
      ) || 0;

      const revenueGrowth = prevRevenue > 0 
        ? ((revenue - prevRevenue) / prevRevenue) * 100 
        : 0;

      // Calculate expenses (mock data - would come from expense system)
      // For now, estimate as 75% of revenue
      const expenses = revenue * 0.75;
      const profit = revenue - expenses;
      const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

      // Calculate cash flow (mock - would come from cash flow analysis)
      const cashFlow = profit * 0.8;

      // Calculate accounts receivable from open opportunities
      const openOpportunities = await opportunityService.filterOpportunities({
        status: 'appointment_scheduled',
        fromDate: dateRange.start,
        toDate: dateRange.end,
        limit: 50
      }).catch(() => ({ data: [] }));

      const accountsReceivable = openOpportunities.data?.reduce((sum, opp) => 
        sum + (opp.total || 0), 0
      ) || 0;

      // Accounts payable (mock - would come from vendor system)
      const accountsPayable = expenses * 0.6;

      // Calculate average deal size
      const dealCount = wonOpportunities.data?.length || 1;
      const avgDealSize = revenue / dealCount;

      // Calculate monthly revenue trend
      const monthlyData: MonthlyRevenue[] = [];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() - i);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        
        const monthOpps = allOpportunities.data?.filter(opp => {
          const oppDate = new Date(opp.createdAt);
          return oppDate >= monthStart && oppDate <= monthEnd;
        }) || [];
        
        const monthRevenue = monthOpps.reduce((sum, opp) => sum + (opp.total || 0), 0);
        const prevMonthRevenue = i > 0 ? monthlyData[i-1]?.amount || 0 : 0;
        const growth = prevMonthRevenue > 0 ? ((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : 0;
        
        monthlyData.push({
          month: monthNames[monthDate.getMonth()],
          amount: monthRevenue,
          growth: parseFloat(growth.toFixed(1)),
          count: monthOpps.length
        });
      }

      // Calculate revenue sources by opportunity type
      const sourceMap = new Map<string, {amount: number, count: number}>();
      
      serviceOpportunities.data?.forEach(opp => {
        const type = opp.opportunityType || 'SERVICE';
        const existing = sourceMap.get(type) || { amount: 0, count: 0 };
        sourceMap.set(type, {
          amount: existing.amount + (opp.total || 0),
          count: existing.count + 1
        });
      });

      const revenueSourcesData: RevenueSource[] = Array.from(sourceMap.entries())
        .map(([service, data]) => ({
          service: service === 'SERVICE' ? 'Regular Maintenance' :
                  service === 'REPAIR' ? 'Repairs' :
                  service === 'SALE' ? 'Parts Sales' :
                  service === 'MAINTENANCE' ? 'Maintenance' :
                  service === 'INSPECTION' ? 'Inspections' : service,
          amount: data.amount,
          growth: 0, // Would need historical comparison
          count: data.count,
          avgValue: data.count > 0 ? data.amount / data.count : 0
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      // Expense breakdown (mock - would come from expense system)
      const expenseData: ExpenseBreakdown[] = [
        { category: 'Parts & Inventory', amount: expenses * 0.35, percentage: 35 },
        { category: 'Labor', amount: expenses * 0.23, percentage: 23 },
        { category: 'Operations', amount: expenses * 0.16, percentage: 16 },
        { category: 'Marketing', amount: expenses * 0.11, percentage: 11 },
        { category: 'Administration', amount: expenses * 0.08, percentage: 8 },
        { category: 'Other', amount: expenses * 0.07, percentage: 7 }
      ];

      // Upcoming payments from high value opportunities
      const payments: PaymentDue[] = highValueOpportunities.data?.slice(0, 4).map((opp, index) => {
        const dueDate = new Date(opp.createdAt);
        dueDate.setDate(dueDate.getDate() + 30);
        const isOverdue = dueDate < new Date();
        
        return {
          id: `INV-${opp._id.slice(-6)}`,
          client: opp.customer?.name || 'Unknown Client',
          amount: opp.total || 0,
          dueDate: dueDate.toISOString().split('T')[0],
          status: isOverdue ? 'overdue' : 'pending',
          opportunityId: opp._id,
          daysOverdue: isOverdue ? Math.floor((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : undefined
        };
      }) || [];

      // Recent transactions (mock from recent won opportunities)
      const transactions: Transaction[] = recentTransactionsData.data?.slice(0, 8).map((opp, index) => ({
        id: `TXN-${opp._id.slice(-6)}`,
        type: 'revenue',
        description: opp.subject || 'Service Revenue',
        amount: opp.total || 0,
        date: opp.createdAt.split('T')[0],
        status: 'completed',
        opportunityId: opp._id,
        category: opp.opportunityType || 'SERVICE'
      })) || [];

      // Budget status (mock - would come from budget system)
      const budgets: BudgetStatus[] = [
        { department: 'Parts & Inventory', budget: expenses * 0.4, spent: expenses * 0.35, variance: 12.5, forecast: expenses * 0.38 },
        { department: 'Labor', budget: expenses * 0.25, spent: expenses * 0.23, variance: 8.0, forecast: expenses * 0.24 },
        { department: 'Marketing', budget: expenses * 0.12, spent: expenses * 0.11, variance: 8.3, forecast: expenses * 0.115 },
        { department: 'Operations', budget: expenses * 0.18, spent: expenses * 0.16, variance: 11.1, forecast: expenses * 0.17 }
      ];

      // Update all state
      setMetrics({
        revenue,
        expenses,
        profit,
        cashFlow,
        accountsReceivable,
        accountsPayable,
        revenueGrowth: parseFloat(revenueGrowth.toFixed(1)),
        profitMargin: parseFloat(profitMargin.toFixed(1)),
        avgDealSize: parseFloat(avgDealSize.toFixed(0)),
        customerLifetimeValue: parseFloat((avgDealSize * 3).toFixed(0)) // Mock: 3x average deal
      });

      setMonthlyRevenue(monthlyData);
      setExpenseBreakdown(expenseData);
      setRevenueSources(revenueSourcesData);
      setUpcomingPayments(payments);
      setRecentTransactions(transactions);
      setBudgetStatus(budgets);

    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  const handleRefresh = () => {
    fetchFinancialData(true);
  };

  const getFinancialRoleTitle = () => {
    const roleTitles: Record<string, string> = {
      'finance': 'Finance Manager',
      'finance_director': 'Finance Director',
      'accountant': 'Accountant',
      'controller': 'Controller',
      'cfo': 'CFO',
    };
    return roleTitles[user?.role] || 'Finance Dashboard';
  };

  const getHighestRevenueMonth = () => {
    if (monthlyRevenue.length === 0) return { month: 'N/A', amount: 0 };
    return monthlyRevenue.reduce((max, current) => 
      current.amount > max.amount ? current : max
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50 overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 shadow-lg" />
        <div className="p-4 md:p-6 space-y-6 overflow-auto">
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
              <div className="h-96 bg-gray-200 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const highestMonth = getHighestRevenueMonth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50 overflow-hidden">
      {/* Gradient Header */}
      <div className="h-16 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 shadow-lg flex items-center px-6">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{getFinancialRoleTitle()}</h1>
              <p className="text-emerald-100 text-sm">
                Welcome back, <span className="font-semibold text-white">{user?.name || user?.email}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowDetailedNumbers(!showDetailedNumbers)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              {showDetailedNumbers ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              <span className="text-sm hidden sm:inline">
                {showDetailedNumbers ? 'Hide Details' : 'Show Details'}
              </span>
            </button>
            
            <div className="hidden md:flex items-center gap-2">
              <button 
                onClick={() => setTimeframe('month')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  timeframe === 'month' 
                    ? 'bg-white text-emerald-700 font-medium' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                Month
              </button>
              <button 
                onClick={() => setTimeframe('quarter')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  timeframe === 'quarter' 
                    ? 'bg-white text-emerald-700 font-medium' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                Quarter
              </button>
              <button 
                onClick={() => setTimeframe('year')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  timeframe === 'year' 
                    ? 'bg-white text-emerald-700 font-medium' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                Year
              </button>
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
      <div className="p-4 md:p-6 space-y-6 overflow-auto">
        {/* Key Financial Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue Card */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-2xl opacity-0 group-hover:opacity-50 blur transition duration-500"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-100/80 to-teal-100/80">
                  {metrics.revenueGrowth > 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-600" />
                  )}
                  <span className={`text-xs font-medium ${
                    metrics.revenueGrowth > 0 ? 'text-emerald-700' : 'text-red-700'
                  }`}>
                    {metrics.revenueGrowth > 0 ? '+' : ''}{metrics.revenueGrowth.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {showDetailedNumbers ? formatCurrency(metrics.revenue) : '••••••'}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100/50">
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 text-emerald-500 mr-1" />
                  <span className="text-gray-600">This {timeframe}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profit Card */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 rounded-2xl opacity-0 group-hover:opacity-50 blur transition duration-500"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100">
                  <Calculator className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-green-100/80 to-emerald-100/80">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs font-medium text-green-700">{metrics.profitMargin.toFixed(1)}% margin</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Net Profit</p>
                <p className="text-2xl font-bold text-gray-900">
                  {showDetailedNumbers ? formatCurrency(metrics.profit) : '••••••'}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100/50">
                <div className="flex items-center text-sm">
                  <Calculator className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-gray-600">{metrics.profitMargin.toFixed(1)}% margin</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cash Flow Card */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 rounded-2xl opacity-0 group-hover:opacity-50 blur transition duration-500"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-100 to-blue-100">
                  <Banknote className="h-6 w-6 text-cyan-600" />
                </div>
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-100/80 to-blue-100/80">
                  <Activity className="h-3 w-3 text-cyan-600" />
                  <span className="text-xs font-medium text-cyan-700">Positive</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Cash Flow</p>
                <p className="text-2xl font-bold text-gray-900">
                  {showDetailedNumbers ? formatCurrency(metrics.cashFlow) : '••••••'}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100/50">
                <div className="flex items-center text-sm">
                  <Banknote className="h-4 w-4 text-cyan-500 mr-1" />
                  <span className="text-emerald-600 font-medium">
                    {metrics.cashFlow > 0 ? 'Healthy' : 'Negative'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* AR/AP Summary */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 rounded-2xl opacity-0 group-hover:opacity-50 blur transition duration-500"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100">
                  <CreditCard className="h-6 w-6 text-violet-600" />
                </div>
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-violet-100/80 to-purple-100/80">
                  <Wallet className="h-3 w-3 text-violet-600" />
                  <span className="text-xs font-medium text-violet-700">
                    Net: {formatCurrency(metrics.accountsReceivable - metrics.accountsPayable)}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Accounts Receivable</p>
                  <p className="text-xl font-bold text-gray-900">
                    {showDetailedNumbers ? formatCurrency(metrics.accountsReceivable) : '••••••'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Accounts Payable</p>
                  <p className="text-xl font-bold text-gray-900">
                    {showDetailedNumbers ? formatCurrency(metrics.accountsPayable) : '••••••'}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100/50">
                <div className="flex items-center text-sm">
                  <Building className="h-4 w-4 text-violet-500 mr-1" />
                  <span className={`font-medium ${
                    metrics.accountsReceivable > metrics.accountsPayable 
                      ? 'text-emerald-600' 
                      : 'text-amber-600'
                  }`}>
                    {metrics.accountsReceivable > metrics.accountsPayable ? 'Positive' : 'Negative'} balance
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Detailed Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend Chart */}
          <div className="bg-gradient-to-br from-white/90 to-emerald-50/50 backdrop-blur-sm rounded-2xl border border-white/30 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Revenue Trend</h2>
              <div className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-emerald-500" />
                <span className="text-sm text-emerald-700 font-medium">Last 6 Months</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400"></div>
                  <span className="text-sm text-gray-700">Revenue</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">Highest: {formatCurrency(highestMonth.amount)}</span>
                  <span className="text-sm text-gray-600">Avg: {formatCurrency(
                    monthlyRevenue.reduce((sum, month) => sum + month.amount, 0) / Math.max(monthlyRevenue.length, 1)
                  )}</span>
                </div>
              </div>
              
              {/* Chart Bars */}
              <div className="h-48 flex items-end justify-between gap-2 pt-4">
                {monthlyRevenue.map((item, index) => {
                  const maxAmount = Math.max(...monthlyRevenue.map(m => m.amount));
                  return (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div className="relative w-full">
                        <div 
                          className="w-full bg-gradient-to-t from-emerald-400 to-teal-400 rounded-t-lg transition-all duration-300 hover:opacity-90"
                          style={{ height: `${(item.amount / maxAmount) * 100}%` }}
                        >
                          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-emerald-700">
                            {formatCurrency(item.amount)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-600 font-medium">{item.month}</div>
                      <div className={`text-xs font-medium ${
                        item.growth > 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {item.growth > 0 ? '+' : ''}{item.growth.toFixed(1)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="bg-gradient-to-br from-white/90 to-cyan-50/50 backdrop-blur-sm rounded-2xl border border-white/30 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Expense Breakdown</h2>
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-cyan-500" />
                <span className="text-sm text-cyan-700 font-medium">This {timeframe}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {expenseBreakdown.map((expense, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{expense.category}</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(expense.amount)}</span>
                  </div>
                  <div className="w-full bg-gradient-to-r from-gray-200 to-gray-300 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 rounded-full"
                      style={{ width: `${expense.percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{expense.percentage}% of total</span>
                    <span>{formatCurrency(expense.amount)}</span>
                  </div>
                </div>
              ))}
              
              <div className="pt-4 border-t border-gray-200/50">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">Total Expenses</span>
                  <span className="text-lg font-bold text-cyan-600">
                    {formatCurrency(metrics.expenses)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Transactions & Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Payments */}
          <div className="bg-gradient-to-br from-white/90 to-violet-50/50 backdrop-blur-sm rounded-2xl border border-white/30 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Payments</h2>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-violet-500" />
                <span className="text-sm text-violet-700 font-medium">Action Required</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {upcomingPayments.length > 0 ? upcomingPayments.map((payment, index) => (
                <div key={index} className="p-4 bg-gradient-to-r from-white to-gray-50/50 border border-gray-200/50 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        payment.status === 'overdue' 
                          ? 'bg-gradient-to-br from-red-100 to-pink-100' 
                          : 'bg-gradient-to-br from-amber-100 to-orange-100'
                      }`}>
                        <Receipt className={`h-5 w-5 ${
                          payment.status === 'overdue' ? 'text-red-600' : 'text-amber-600'
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{payment.id}</h4>
                        <p className="text-sm text-gray-600">{payment.client}</p>
                        {payment.daysOverdue && (
                          <p className="text-xs text-red-600 mt-1">{payment.daysOverdue} days overdue</p>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                      payment.status === 'overdue' 
                        ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border border-red-200/50' 
                        : 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border border-amber-200/50'
                    }`}>
                      {payment.status === 'overdue' ? 'Overdue' : 'Due ' + payment.dueDate}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900">
                      {showDetailedNumbers ? formatCurrency(payment.amount) : '••••••'}
                    </span>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 text-sm bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200/50 rounded-lg hover:border-emerald-300/50">
                        Mark Paid
                      </button>
                      <button className="px-3 py-1.5 text-sm bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border border-gray-200/50 rounded-lg hover:border-gray-300/50">
                        View
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No upcoming payments</p>
                  <p className="text-sm text-gray-500 mt-1">All payments are current</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-gradient-to-br from-white/90 to-green-50/50 backdrop-blur-sm rounded-2xl border border-white/30 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-500" />
                <span className="text-sm text-green-700 font-medium">Latest Activity</span>
              </div>
            </div>
            
            <div className="space-y-3">
              {recentTransactions.length > 0 ? recentTransactions.slice(0, 5).map((transaction, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200/50 rounded-xl hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      transaction.type === 'revenue' 
                        ? 'bg-gradient-to-br from-emerald-100 to-green-100' 
                        : 'bg-gradient-to-br from-red-100 to-pink-100'
                    }`}>
                      {transaction.type === 'revenue' ? (
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{transaction.description}</h4>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500">{transaction.id}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-500">{transaction.date}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-500 capitalize">{transaction.category}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`font-medium ${
                      transaction.type === 'revenue' ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'revenue' ? '+' : '-'}{showDetailedNumbers ? formatCurrency(transaction.amount) : '••••••'}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      transaction.status === 'completed' 
                        ? 'bg-gradient-to-r from-emerald-100/80 to-green-100/80 text-emerald-700' 
                        : transaction.status === 'pending'
                        ? 'bg-gradient-to-r from-amber-100/80 to-orange-100/80 text-amber-700'
                        : 'bg-gradient-to-r from-red-100/80 to-pink-100/80 text-red-700'
                    }`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No recent transactions</p>
                  <p className="text-sm text-gray-500 mt-1">Transactions will appear here</p>
                </div>
              )}
              
              {recentTransactions.length > 0 && (
                <button className="w-full mt-4 py-3 text-center text-sm font-medium bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 hover:text-emerald-800 hover:from-emerald-100 hover:to-green-100 rounded-xl border border-emerald-200/50 transition-all duration-300">
                  View All Transactions
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Budget & Revenue Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Budget Status */}
          <div className="bg-gradient-to-br from-white/90 to-blue-50/50 backdrop-blur-sm rounded-2xl border border-white/30 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Budget Status</h2>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                <span className="text-sm text-blue-700 font-medium">Department-wise</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {budgetStatus.map((budget, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{budget.department}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Spent: {formatCurrency(budget.spent)}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        budget.variance >= 0 
                          ? 'bg-gradient-to-r from-emerald-100/80 to-green-100/80 text-emerald-700' 
                          : 'bg-gradient-to-r from-red-100/80 to-pink-100/80 text-red-700'
                      }`}>
                        {budget.variance >= 0 ? 'Under' : 'Over'} {Math.abs(budget.variance).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gradient-to-r from-gray-200 to-gray-300 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        (budget.spent / budget.budget) <= 1
                          ? 'bg-gradient-to-r from-emerald-400 to-green-400'
                          : 'bg-gradient-to-r from-red-400 to-pink-400'
                      }`}
                      style={{ width: `${Math.min((budget.spent / budget.budget) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Budget: {formatCurrency(budget.budget)}</span>
                    <span>Forecast: {formatCurrency(budget.forecast)}</span>
                    <span>{((budget.spent / budget.budget) * 100).toFixed(1)}% utilized</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Revenue Sources */}
          <div className="bg-gradient-to-br from-white/90 to-amber-50/50 backdrop-blur-sm rounded-2xl border border-white/30 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Top Revenue Sources</h2>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-amber-500" />
                <span className="text-sm text-amber-700 font-medium">By Service Type</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {revenueSources.map((source, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-white to-gray-50/50 border border-gray-200/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      source.growth > 0 
                        ? 'bg-gradient-to-br from-emerald-100 to-green-100' 
                        : 'bg-gradient-to-br from-red-100 to-pink-100'
                    }`}>
                      {getServiceIcon(source.service)}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{source.service}</h4>
                      <p className="text-sm text-gray-600">{source.count} deals • Avg: {formatCurrency(source.avgValue)}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(source.amount)}</p>
                    <span className={`text-sm font-medium ${
                      source.growth > 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {source.growth > 0 ? '↑' : '↓'} {Math.abs(source.growth).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
              
              {/* Performance Summary */}
              <div className="mt-6 pt-4 border-t border-gray-200/50">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">
                      {formatCurrency(metrics.avgDealSize)}
                    </p>
                    <p className="text-sm text-gray-600">Avg Deal Size</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-600">
                      {revenueSources.length}
                    </p>
                    <p className="text-sm text-gray-600">Service Types</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-cyan-600">
                      {formatCurrency(metrics.customerLifetimeValue)}
                    </p>
                    <p className="text-sm text-gray-600">Customer LTV</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Footer */}
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Financial Reports & Analysis</h3>
              <p className="text-sm text-gray-600">Generate detailed financial insights and reports</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300">
                <Download className="h-4 w-4" />
                <span>Export Report</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all duration-300">
                <FileText className="h-4 w-4" />
                <span>Create Report</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl hover:from-gray-900 hover:to-black transition-all duration-300">
                <MoreVertical className="h-4 w-4" />
                <span>More</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}