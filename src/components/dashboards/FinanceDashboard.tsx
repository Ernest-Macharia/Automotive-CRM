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
import { invoiceService, Invoice, PAYMENT_STATUS, INVOICE_STATUS } from '@/services/invoiceService';
import { workOrderService } from '@/services/workOrderService';
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
  invoiceNumber: string;
  client: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'overdue' | 'paid';
  opportunityId: string;
  invoiceId: string;
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
  invoiceId?: string;
  category: string;
}

interface BudgetStatus {
  department: string;
  budget: number;
  spent: number;
  variance: number;
  forecast: number;
}

interface InvoiceStats {
  total: number;
  paid: number;
  unpaid: number;
  overdue: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
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
  const [invoiceStats, setInvoiceStats] = useState<InvoiceStats>({
    total: 0,
    paid: 0,
    unpaid: 0,
    overdue: 0,
    totalAmount: 0,
    paidAmount: 0,
    outstandingAmount: 0
  });
  
  const [showDetailedNumbers, setShowDetailedNumbers] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

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

  const calculateGrowth = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const fetchFinancialData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const dateRange = calculateTimeRange();
      
      // Calculate previous period for growth
      const prevDate = new Date(dateRange.start);
      prevDate.setMonth(prevDate.getMonth() - 1);
      const prevStart = prevDate.toISOString().split('T')[0];
      const prevEnd = dateRange.start;

      // Fetch multiple data sources in parallel
      const [
        // Current period invoices
        currentInvoicesResult,
        // Previous period invoices for growth
        previousInvoicesResult,
        // Paid invoices
        paidInvoicesResult,
        // Unpaid invoices
        unpaidInvoicesResult,
        // All opportunities for analysis
        opportunitiesResult,
        // Won opportunities
        wonOpportunitiesResult,
        // Service opportunities for breakdown
        serviceOpportunitiesResult,
        // High value opportunities
        highValueOpportunitiesResult,
        // Invoice statistics
        invoiceStatsResult,
        // Work orders for expense estimation
        workOrdersResult
      ] = await Promise.allSettled([
        // Current period invoices
        invoiceService.getAllInvoices({
          fromDate: dateRange.start,
          toDate: dateRange.end
        }),
        
        // Previous period invoices
        invoiceService.getAllInvoices({
          fromDate: prevStart,
          toDate: prevEnd
        }),
        
        // Paid invoices
        invoiceService.getInvoicesByPaymentStatus('paid'),
        
        // Unpaid invoices (pending + overdue)
        invoiceService.getAllInvoices({
          paymentStatus: 'unpaid'
        }),
        
        // All opportunities for analysis
        opportunityService.filterOpportunities({
          fromDate: dateRange.start,
          toDate: dateRange.end,
          sort: 'createdAt:desc',
          limit: 200
        }),
        
        // Won opportunities
        opportunityService.filterOpportunities({
          status: 'won',
          fromDate: dateRange.start,
          toDate: dateRange.end,
          limit: 100
        }),
        
        // Service opportunities for breakdown
        opportunityService.filterOpportunities({
          opportunityType: 'SERVICE',
          fromDate: dateRange.start,
          toDate: dateRange.end,
          sort: 'total:desc',
          limit: 50
        }),
        
        // High value opportunities
        opportunityService.getHighValueOpportunities(10000),
        
        // Invoice statistics
        invoiceService.getInvoiceStatistics(),
        
        // Work orders for expense estimation
        workOrderService.getAllWorkOrders({
          fromDate: dateRange.start,
          toDate: dateRange.end
        })
      ]);

      // Process invoices
      const currentInvoices: Invoice[] = currentInvoicesResult.status === 'fulfilled' 
        ? currentInvoicesResult.value 
        : [];
      
      const previousInvoices: Invoice[] = previousInvoicesResult.status === 'fulfilled' 
        ? previousInvoicesResult.value 
        : [];
      
      const paidInvoices: Invoice[] = paidInvoicesResult.status === 'fulfilled' 
        ? paidInvoicesResult.value 
        : [];
      
      const unpaidInvoices: Invoice[] = unpaidInvoicesResult.status === 'fulfilled' 
        ? unpaidInvoicesResult.value 
        : [];

      // Calculate revenue from paid invoices
      const revenue = paidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      
      // Calculate previous period revenue
      const previousRevenue = previousInvoices
        .filter(inv => inv.paymentStatus === 'paid')
        .reduce((sum, inv) => sum + (inv.total || 0), 0);

      // Calculate accounts receivable from unpaid invoices
      const accountsReceivable = unpaidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

      // Calculate revenue growth
      const revenueGrowth = calculateGrowth(revenue, previousRevenue);

      // Process work orders for expense estimation
      const workOrders = workOrdersResult.status === 'fulfilled' 
        ? workOrdersResult.value.data || [] 
        : [];

      // Calculate expenses (labor + parts from work orders)
      const expenses = workOrders.reduce((sum, wo) => {
        return sum + (wo.laborCost || 0) + (wo.partsCost || 0);
      }, 0);

      // Calculate profit
      const profit = revenue - expenses;
      const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

      // Calculate cash flow (simplified: revenue collected - expenses)
      const cashFlow = revenue * 0.8; // 80% of revenue as cash flow (placeholder)

      // Calculate accounts payable from pending work orders
      const pendingWorkOrders = workOrders.filter(wo => 
        wo.status !== 'completed' && wo.status !== 'cancelled'
      );
      const accountsPayable = pendingWorkOrders.reduce((sum, wo) => {
        return sum + (wo.laborCost || 0) + (wo.partsCost || 0);
      }, 0);

      // Process opportunities for deal size
      const opportunities = opportunitiesResult.status === 'fulfilled' 
        ? opportunitiesResult.value.data || [] 
        : [];

      const wonOpportunities = wonOpportunitiesResult.status === 'fulfilled'
        ? wonOpportunitiesResult.value.data || []
        : [];

      const dealCount = wonOpportunities.length || 1;
      const avgDealSize = revenue / dealCount;
      
      // Customer lifetime value (simplified: avg deal size * 3 years * repeat rate)
      const customerLTV = avgDealSize * 3 * 0.6; // 60% repeat rate assumption

      // Calculate monthly revenue trend
      const monthlyData: MonthlyRevenue[] = [];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() - i);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        
        const monthInvoices = currentInvoices.filter(inv => {
          const invDate = new Date(inv.createdAt || '');
          return invDate >= monthStart && invDate <= monthEnd && inv.paymentStatus === 'paid';
        });
        
        const monthRevenue = monthInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        
        // Previous month for growth
        const prevMonthStart = new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1);
        const prevMonthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth(), 0);
        
        const prevMonthInvoices = currentInvoices.filter(inv => {
          const invDate = new Date(inv.createdAt || '');
          return invDate >= prevMonthStart && invDate <= prevMonthEnd && inv.paymentStatus === 'paid';
        });
        
        const prevMonthRevenue = prevMonthInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        const growth = calculateGrowth(monthRevenue, prevMonthRevenue);
        
        monthlyData.push({
          month: monthNames[monthDate.getMonth()],
          amount: monthRevenue,
          growth: parseFloat(growth.toFixed(1)),
          count: monthInvoices.length
        });
      }

      // Calculate revenue sources by opportunity type
      const sourceMap = new Map<string, {amount: number, count: number}>();
      
      const serviceOpps = serviceOpportunitiesResult.status === 'fulfilled'
        ? serviceOpportunitiesResult.value.data || []
        : [];

      serviceOpps.forEach(opp => {
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

      // Expense breakdown (based on work order costs)
      const laborCost = workOrders.reduce((sum, wo) => sum + (wo.laborCost || 0), 0);
      const partsCost = workOrders.reduce((sum, wo) => sum + (wo.partsCost || 0), 0);
      
      // Allocate remaining expenses proportionally (would need actual expense data)
      const remainingExpenses = expenses - laborCost - partsCost;
      
      const expenseData: ExpenseBreakdown[] = [
        { category: 'Parts & Inventory', amount: partsCost, percentage: (partsCost / expenses) * 100 },
        { category: 'Labor', amount: laborCost, percentage: (laborCost / expenses) * 100 },
        { category: 'Operations', amount: remainingExpenses * 0.4, percentage: ((remainingExpenses * 0.4) / expenses) * 100 },
        { category: 'Marketing', amount: remainingExpenses * 0.3, percentage: ((remainingExpenses * 0.3) / expenses) * 100 },
        { category: 'Administration', amount: remainingExpenses * 0.2, percentage: ((remainingExpenses * 0.2) / expenses) * 100 },
        { category: 'Other', amount: remainingExpenses * 0.1, percentage: ((remainingExpenses * 0.1) / expenses) * 100 }
      ];

      // Filter expense data to remove zeros and sort
      const filteredExpenseData = expenseData
        .filter(e => e.amount > 0)
        .sort((a, b) => b.amount - a.amount);

      // Process upcoming payments (unpaid invoices with due dates)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const payments: PaymentDue[] = unpaidInvoices
        .filter(inv => inv.dueDate) // Only invoices with due dates
        .map(inv => {
          const dueDate = new Date(inv.dueDate!);
          const isOverdue = dueDate < today && inv.paymentStatus !== 'paid';
          const daysOverdue = isOverdue 
            ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
            : undefined;
          
          // Get client name from opportunity if available
          let clientName = 'Unknown Client';
          if (inv.opportunityId && typeof inv.opportunityId === 'object') {
            clientName = inv.opportunityId.customer?.name || 
                        inv.opportunityId.subject || 
                        'Unknown Client';
          }

          // Explicitly type the status
          const status: 'overdue' | 'pending' = isOverdue ? 'overdue' : 'pending';

          return {
            id: inv.id || inv._id || '',
            invoiceNumber: inv.invoiceNumber,
            client: clientName,
            amount: inv.total || 0,
            dueDate: inv.dueDate!.split('T')[0],
            status, // Now properly typed
            opportunityId: typeof inv.opportunityId === 'string' 
              ? inv.opportunityId 
              : inv.opportunityId?._id || '',
            invoiceId: inv.id || inv._id || '',
            daysOverdue
          };
        })
        .sort((a, b) => {
          // Sort by overdue first, then by due date
          if (a.status === 'overdue' && b.status !== 'overdue') return -1;
          if (a.status !== 'overdue' && b.status === 'overdue') return 1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        })
        .slice(0, 5); // Top 5

      // Process recent transactions from paid invoices
      const transactions: Transaction[] = paidInvoices
        .sort((a, b) => {
          const dateA = new Date(a.paidAt || a.updatedAt || a.createdAt || '').getTime();
          const dateB = new Date(b.paidAt || b.updatedAt || b.createdAt || '').getTime();
          return dateB - dateA;
        })
        .slice(0, 8)
        .map(inv => {
          let description = 'Invoice Payment';
          if (inv.opportunityId && typeof inv.opportunityId === 'object') {
            description = inv.opportunityId.subject || 'Service Revenue';
          }

          return {
            id: `TXN-${inv.invoiceNumber}`,
            type: 'revenue' as const,
            description,
            amount: inv.total || 0,
            date: (inv.paidAt || inv.createdAt || '').split('T')[0],
            status: 'completed' as const,
            opportunityId: typeof inv.opportunityId === 'string' 
              ? inv.opportunityId 
              : inv.opportunityId?._id,
            invoiceId: inv.id || inv._id,
            category: 'SERVICE' // Would need actual category
          };
        });

      // Calculate invoice statistics
      const totalInvoices = currentInvoices.length;
      const paidCount = paidInvoices.length;
      const unpaidCount = unpaidInvoices.length;
      
      // Calculate overdue count
      const overdueCount = unpaidInvoices.filter(inv => {
        if (!inv.dueDate) return false;
        const dueDate = new Date(inv.dueDate);
        return dueDate < today;
      }).length;

      setInvoiceStats({
        total: totalInvoices,
        paid: paidCount,
        unpaid: unpaidCount,
        overdue: overdueCount,
        totalAmount: currentInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
        paidAmount: revenue,
        outstandingAmount: accountsReceivable
      });

      // Budget status (mock for now - would come from budget system)
      const budgets: BudgetStatus[] = [
        { 
          department: 'Parts & Inventory', 
          budget: expenses * 0.4, 
          spent: partsCost, 
          variance: ((expenses * 0.4 - partsCost) / (expenses * 0.4)) * 100, 
          forecast: expenses * 0.38 
        },
        { 
          department: 'Labor', 
          budget: expenses * 0.25, 
          spent: laborCost, 
          variance: ((expenses * 0.25 - laborCost) / (expenses * 0.25)) * 100, 
          forecast: expenses * 0.24 
        },
        { 
          department: 'Marketing', 
          budget: expenses * 0.12, 
          spent: expenseData.find(e => e.category === 'Marketing')?.amount || 0, 
          variance: 8.3, 
          forecast: expenses * 0.115 
        },
        { 
          department: 'Operations', 
          budget: expenses * 0.18, 
          spent: expenseData.find(e => e.category === 'Operations')?.amount || 0, 
          variance: 11.1, 
          forecast: expenses * 0.17 
        }
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
        customerLifetimeValue: parseFloat(customerLTV.toFixed(0))
      });

      setMonthlyRevenue(monthlyData);
      setExpenseBreakdown(filteredExpenseData);
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
    
    // Set up polling for real-time updates
    const intervalId = setInterval(() => {
      fetchFinancialData(true);
    }, 60000); // Refresh every minute
    
    return () => clearInterval(intervalId);
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
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Paid Invoices: {invoiceStats.paid}</span>
                  <span className="text-gray-600">Total: {formatCurrency(invoiceStats.paidAmount)}</span>
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

          {/* Accounts Receivable Card */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 rounded-2xl opacity-0 group-hover:opacity-50 blur transition duration-500"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100">
                  <Receipt className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-100/80 to-orange-100/80">
                  <AlertCircle className="h-3 w-3 text-amber-600" />
                  <span className="text-xs font-medium text-amber-700">{invoiceStats.unpaid} pending</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Accounts Receivable</p>
                <p className="text-2xl font-bold text-gray-900">
                  {showDetailedNumbers ? formatCurrency(metrics.accountsReceivable) : '••••••'}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{invoiceStats.overdue} overdue</span>
                  <span className="text-red-600 font-medium">{formatCurrency(invoiceStats.outstandingAmount)}</span>
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
                  <span className={`text-xs font-medium ${
                    metrics.cashFlow > 0 ? 'text-cyan-700' : 'text-red-700'
                  }`}>
                    {metrics.cashFlow > 0 ? 'Positive' : 'Negative'}
                  </span>
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
                  <span className={`font-medium ${
                    metrics.cashFlow > 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {metrics.cashFlow > 0 ? 'Healthy' : 'Negative'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-emerald-50/80 to-green-50/80 backdrop-blur-sm rounded-xl border border-white/30 p-4">
            <p className="text-sm text-emerald-700 font-medium mb-1">Total Invoices</p>
            <p className="text-2xl font-bold text-gray-900">{invoiceStats.total}</p>
            <p className="text-xs text-gray-600 mt-1">{formatCurrency(invoiceStats.totalAmount)} total value</p>
          </div>
          <div className="bg-gradient-to-br from-green-50/80 to-emerald-50/80 backdrop-blur-sm rounded-xl border border-white/30 p-4">
            <p className="text-sm text-green-700 font-medium mb-1">Paid Invoices</p>
            <p className="text-2xl font-bold text-gray-900">{invoiceStats.paid}</p>
            <p className="text-xs text-gray-600 mt-1">{formatCurrency(invoiceStats.paidAmount)} collected</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/80 backdrop-blur-sm rounded-xl border border-white/30 p-4">
            <p className="text-sm text-amber-700 font-medium mb-1">Unpaid Invoices</p>
            <p className="text-2xl font-bold text-gray-900">{invoiceStats.unpaid}</p>
            <p className="text-xs text-gray-600 mt-1">{formatCurrency(invoiceStats.outstandingAmount)} outstanding</p>
          </div>
          <div className="bg-gradient-to-br from-red-50/80 to-pink-50/80 backdrop-blur-sm rounded-xl border border-white/30 p-4">
            <p className="text-sm text-red-700 font-medium mb-1">Overdue</p>
            <p className="text-2xl font-bold text-gray-900">{invoiceStats.overdue}</p>
            <p className="text-xs text-red-600 mt-1">Requires immediate attention</p>
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
                  const maxAmount = Math.max(...monthlyRevenue.map(m => m.amount), 1);
                  return (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div className="relative w-full">
                        <div 
                          className="w-full bg-gradient-to-t from-emerald-400 to-teal-400 rounded-t-lg transition-all duration-300 hover:opacity-90"
                          style={{ height: `${Math.max((item.amount / maxAmount) * 100, 5)}%` }}
                        >
                          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-emerald-700 whitespace-nowrap">
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
                    <span>{expense.percentage.toFixed(1)}% of total</span>
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
                        <h4 className="font-medium text-gray-900">{payment.invoiceNumber}</h4>
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
                      {payment.status === 'overdue' ? 'Overdue' : `Due ${payment.dueDate}`}
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
                  <p className="text-sm text-gray-500 mt-1">All invoices are paid</p>
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