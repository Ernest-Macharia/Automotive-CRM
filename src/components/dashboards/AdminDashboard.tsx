'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, 
  Shield, 
  Settings, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Database,
  Activity,
  Sparkles,
  RefreshCw,
  Loader2,
  Eye,
  Key,
  Bell,
  Server,
  Cpu,
  HardDrive,
  Network,
  Globe,
  Lock,
  UserPlus,
  UserCheck,
  AlertTriangle,
  Award,
  Zap,
  LineChart,
  PieChart,
  Download,
  Filter,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Cloud,
  Database as DatabaseIcon,
  Terminal,
  Wrench,
  Monitor,
  Mail,
  MessageSquare,
  Calendar,
  CreditCard,
  Receipt,
  Building,
  Smartphone,
  Home,
  Truck,
  Package,
  ShoppingBag,
  Headphones,
  Target,
  DollarSign,
  Car,
  User,
  Phone,
  Mail as MailIcon,
  Globe as GlobeIcon,
  Heart,
  CalendarDays,
  MessageCircle,
  Briefcase,
  Building2,
  Wallet,
  CreditCard as CreditCardIcon,
  Receipt as ReceiptIcon,
  FileCheck,
  ClipboardCheck,
  Trophy,
  Gauge,
  Fuel,
  Thermometer,
  Wrench as WrenchIcon,
  Settings as SettingsIcon,
  RotateCw,
  Award as AwardIcon
} from 'lucide-react';
import { authService } from '@/services/authService';
import { opportunityService } from '@/services/opportunityService';
import { userService } from '@/services/userService';
import { workOrderService } from '@/services/workOrderService';
import { salesOrderService } from '@/services/salesOrderService';
import { reportService } from '@/services/reportService';
import { createPermissionChecker } from '@/services/settings/roleService';

interface AdminDashboardProps {
  user: any;
}

interface Stats {
  // User Stats
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  userGrowth: number;
  
  // Opportunity Stats
  totalOpportunities: number;
  openOpportunities: number;
  closedOpportunities: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  totalRevenue: number;
  avgDealSize: number;
  conversionRate: number;
  winRate: number;
  
  // System Stats
  systemHealth: string;
  serverUptime: number;
  responseTime: number;
  apiCalls: number;
  errorRate: number;
  storageUsage: number;
  storageTotal: number;
  storagePercentage: number;
  activeSessions: number;
  cacheHitRate: number;
  
  // Performance Stats
  weeklyGrowth: number;
  monthlyGrowth: number;
  topSource: string;
  topSourceCount: number;
  
  // Vehicle Stats
  totalVehicles: number;
  vehiclesInService: number;
  completedServices: number;
  pendingServices: number;
  averageServiceTime: number;
  
  // Work Order Stats
  activeWorkOrders: number;
  delayedWorkOrders: number;
  completedWorkOrders: number;
  
  // Sales Order Stats
  totalSalesOrders: number;
  pendingSalesOrders: number;
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  lastChecked: string;
  services: {
    name: string;
    status: 'up' | 'down' | 'degraded';
    responseTime: number;
  }[];
}

interface UserActivity {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  ip: string;
  location: string;
  details?: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  change: number;
  target: number;
  unit: string;
  icon: React.ReactNode;
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const pathname = usePathname();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
    userGrowth: 0,
    
    totalOpportunities: 0,
    openOpportunities: 0,
    closedOpportunities: 0,
    hotLeads: 0,
    warmLeads: 0,
    coldLeads: 0,
    totalRevenue: 0,
    avgDealSize: 0,
    conversionRate: 0,
    winRate: 0,
    
    systemHealth: 'Healthy',
    serverUptime: 0,
    responseTime: 0,
    apiCalls: 0,
    errorRate: 0,
    storageUsage: 0,
    storageTotal: 0,
    storagePercentage: 0,
    activeSessions: 0,
    cacheHitRate: 0,
    
    weeklyGrowth: 0,
    monthlyGrowth: 0,
    topSource: 'website',
    topSourceCount: 0,
    
    totalVehicles: 0,
    vehiclesInService: 0,
    completedServices: 0,
    pendingServices: 0,
    averageServiceTime: 0,
    
    activeWorkOrders: 0,
    delayedWorkOrders: 0,
    completedWorkOrders: 0,
    
    totalSalesOrders: 0,
    pendingSalesOrders: 0,
  });

  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    status: 'healthy',
    message: 'All systems operational',
    lastChecked: new Date().toISOString(),
    services: []
  });

  const [recentActivities, setRecentActivities] = useState<UserActivity[]>([]);
  const [recentOpportunities, setRecentOpportunities] = useState<any[]>([]);
  const [topOpportunities, setTopOpportunities] = useState<any[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([
    { name: 'API Response Time', value: 0, change: 0, target: 200, unit: 'ms', icon: <Gauge className="h-4 w-4" /> },
    { name: 'Database Queries', value: 0, change: 0, target: 3000, unit: '/s', icon: <Database className="h-4 w-4" /> },
    { name: 'Cache Efficiency', value: 0, change: 0, target: 90, unit: '%', icon: <Zap className="h-4 w-4" /> },
    { name: 'Error Rate', value: 0, change: 0, target: 1, unit: '%', icon: <AlertCircle className="h-4 w-4" /> },
  ]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'quarter'>('month');

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const withTimeout = useCallback(<T,>(promise: Promise<T>, ms = 12000): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Request timed out')), ms);
      promise
        .then((value) => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }, []);

  const formatBytes = (gb: number) => {
    const bytes = gb * 1024 * 1024 * 1024;
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  const calculateGrowth = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const canFetchSLAStatusSummary = useCallback(() => {
    const effectivePermissions = Array.from(
      new Set(
        [
          ...(Array.isArray(user?.permissions) ? user.permissions : []),
          ...(Array.isArray(user?.additionalPermissions) ? user.additionalPermissions : []),
          ...(Array.isArray(user?.allPermissions) ? user.allPermissions : []),
          ...(Array.isArray(user?.role?.permissions) ? user.role.permissions : []),
        ].filter((permission): permission is string => typeof permission === 'string' && permission.trim().length > 0)
      )
    );

    if (effectivePermissions.length === 0) {
      return false;
    }

    const permissionChecker = createPermissionChecker(effectivePermissions);
    return permissionChecker.hasAnyPermission(['sla.view', 'sla.*', 'system.*']);
  }, [user]);

  const fetchAdminStats = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      // Get date range for previous period (for growth calculations)
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      
      const currentPeriodStart = firstDayOfMonth.toISOString().split('T')[0];
      const previousPeriodStart = firstDayOfLastMonth.toISOString().split('T')[0];
      const previousPeriodEnd = lastDayOfLastMonth.toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];
      const slaSummaryRequest = canFetchSLAStatusSummary()
        ? withTimeout(opportunityService.getSLAStatusSummary().catch(() => null))
        : Promise.resolve(null);

      // Fetch multiple data sources in parallel
      const [
        roleDashboardResponse,
        usersResponse,
        filteredStatsResponse,
        recentOpps,
        topOpps,
        workOrderStats,
        salesOrderStats,
        currentPeriodOpps,
        previousPeriodOpps,
        slaStats,
        lisSlaStats
      ] = await Promise.allSettled([
        withTimeout(reportService.getRoleDashboard({ from: currentPeriodStart, to: todayStr })),
        withTimeout(userService.getAllUsers()),
        withTimeout(opportunityService.getFilteredStats({})),
        withTimeout(opportunityService.getAllOpportunities({ sort: 'updatedAt:desc', limit: 5 })),
        withTimeout(opportunityService.getAllOpportunities({ sort: 'leadScore.totalScore:desc', limit: 3 })),
        withTimeout(workOrderService.getWorkOrderStats()),
        withTimeout(salesOrderService.getSalesOrderStats()),
        withTimeout(opportunityService.filterOpportunities({ 
          fromDate: currentPeriodStart, 
          toDate: todayStr 
        })),
        withTimeout(opportunityService.filterOpportunities({ 
          fromDate: previousPeriodStart, 
          toDate: previousPeriodEnd 
        })),
        slaSummaryRequest,
        withTimeout(opportunityService.getLISSLADashboardStats().catch(() => null))
      ]);

      // Process users data
      let totalUsers = 0;
      let activeUsers = 0;
      let pendingUsers = 0;
      let previousUsers = 0;

      if (usersResponse.status === 'fulfilled' && usersResponse.value) {
        const usersData = usersResponse.value;
        let usersArray: any[] = [];
        
        if (Array.isArray(usersData)) {
          usersArray = usersData;
        } else if (usersData && typeof usersData === 'object') {
          usersArray = (usersData as any)?.data || 
                      (usersData as any)?.users || 
                      (usersData as any)?.items || 
                      [];
        }

        totalUsers = usersArray.length || 0;
        activeUsers = usersArray.filter((u: any) => u.active || u.status === 'active').length || 0;
        pendingUsers = usersArray.filter((u: any) => u.status === 'pending').length || 0;
        
        // Calculate user growth (assuming we can get previous period data)
        // This is simplified - you might need to fetch user stats with date filters
        previousUsers = Math.max(1, totalUsers * 0.9); // Placeholder - replace with actual historical data
      }

      // Process opportunities data
      let totalOpportunities = 0;
      let openOpportunities = 0;
      let closedOpportunities = 0;
      let hotLeads = 0;
      let warmLeads = 0;
      let coldLeads = 0;
      let totalRevenue = 0;
      let topSourceCount = 0;
      let topSource = 'website';
      let currentPeriodTotal = 0;
      let previousPeriodTotal = 0;
      let avgDealSize = 0;
      let conversionRate = 0;
      let winRate = 0;

      if (roleDashboardResponse.status === 'fulfilled' && roleDashboardResponse.value) {
        const roleDashboard = roleDashboardResponse.value as any;
        const businessNumbers = roleDashboard.businessNumbers || {};
        totalOpportunities = Number(businessNumbers.totalOpportunities || totalOpportunities);
        openOpportunities = Number(businessNumbers.openPipelineCount || openOpportunities);
        const wonDealsCount = Number(businessNumbers.wonDealsCount || 0);
        closedOpportunities = wonDealsCount;
        totalRevenue = Number(
          businessNumbers.wonDealsValue ??
          businessNumbers.invoicesValue ??
          totalRevenue
        );
        conversionRate = Number(businessNumbers.opportunitiesToQuotes || 0);
        winRate = totalOpportunities > 0 ? (wonDealsCount / totalOpportunities) * 100 : 0;
        avgDealSize = wonDealsCount > 0 ? totalRevenue / wonDealsCount : 0;

        const roleActivities = Array.isArray(roleDashboard.recentActivities)
          ? roleDashboard.recentActivities
          : [];
        setRecentActivities(roleActivities.map((activity: any, index: number) => ({
          id: String(activity.id || activity._id || index),
          user: activity.type ? String(activity.type).replace(/_/g, ' ') : 'System',
          action: activity.title || 'Recent activity',
          timestamp: activity.createdAt || new Date().toISOString(),
          ip: '-',
          location: '-',
          details: activity.status || undefined,
        })));
      }

      if (filteredStatsResponse.status === 'fulfilled' && filteredStatsResponse.value) {
        const filteredStats = filteredStatsResponse.value;
        totalOpportunities = filteredStats.total || totalOpportunities;
        hotLeads = filteredStats.byTier?.hot || 0;
        warmLeads = filteredStats.byTier?.warm || 0;
        coldLeads = filteredStats.byTier?.cold || 0;

        const byStatus = filteredStats.byStatus || {};
        openOpportunities =
          (byStatus.new || 0) +
          (byStatus.attempted_to_contact || 0) +
          (byStatus.prospecting || 0) +
          (byStatus.appointment_scheduled || 0);
        closedOpportunities =
          (byStatus.won || 0) +
          (byStatus.lost || 0) +
          (byStatus.non_progressive || 0);

        const bySource = filteredStats.bySource || {};
        const topSourceEntry = Object.entries(bySource).sort((a, b) => Number(b[1]) - Number(a[1]))[0] || ['website', 0];
        topSource = topSourceEntry[0];
        topSourceCount = Number(topSourceEntry[1]) || 0;
      }

      // Process current period opportunities
      if (currentPeriodOpps.status === 'fulfilled' && currentPeriodOpps.value) {
        currentPeriodTotal = currentPeriodOpps.value.pagination?.total ?? (currentPeriodOpps.value.data || []).length;
      }

      // Process previous period opportunities
      if (previousPeriodOpps.status === 'fulfilled' && previousPeriodOpps.value) {
        previousPeriodTotal = previousPeriodOpps.value.pagination?.total ?? (previousPeriodOpps.value.data || []).length;
      }

      // Process overview data from scoped dashboard and filtered stats
      if (filteredStatsResponse.status === 'fulfilled' && filteredStatsResponse.value) {
        const wonOppsCount = filteredStatsResponse.value.byStatus?.won || 0;
        conversionRate = totalOpportunities > 0 ? (wonOppsCount / totalOpportunities) * 100 : conversionRate;
        winRate = totalOpportunities > 0 ? (wonOppsCount / totalOpportunities) * 100 : winRate;
        avgDealSize = wonOppsCount > 0 ? totalRevenue / wonOppsCount : avgDealSize;
      }

      // Process work order stats
      let activeWorkOrders = 0;
      let delayedWorkOrders = 0;
      let completedWorkOrders = 0;
      let totalVehicles = 0;
      let vehiclesInService = 0;
      let completedServices = 0;
      let pendingServices = 0;

      if (workOrderStats.status === 'fulfilled' && workOrderStats.value) {
        const stats = workOrderStats.value;
        activeWorkOrders = stats.total - (stats.byStatus?.find(s => s._id === 'completed')?.count || 0);
        delayedWorkOrders = stats.delayedOrders || 0;
        completedWorkOrders = stats.byStatus?.find(s => s._id === 'completed')?.count || 0;
        
        // Extract vehicle stats from work orders
        // This would need proper vehicle tracking - placeholder for now
        totalVehicles = 0; // Replace with actual vehicle count from vehicle service
        vehiclesInService = activeWorkOrders;
        completedServices = completedWorkOrders;
        pendingServices = activeWorkOrders;
      }

      // Process sales order stats
      let totalSalesOrders = 0;
      let pendingSalesOrders = 0;

      if (salesOrderStats.status === 'fulfilled' && salesOrderStats.value) {
        const stats = salesOrderStats.value;
        totalSalesOrders = stats.total || 0;
        pendingSalesOrders = stats.byStatus?.find(s => s._id === 'pending')?.count || 
                            stats.byStatus?.find(s => s._id === 'draft')?.count || 0;
      }

      // Process SLA stats for system health
      let slaCompliance = 0;
      let activeSessions = 0;
      let errorRate = 0.2; // Default - would come from monitoring service

      if (slaStats.status === 'fulfilled' && slaStats.value) {
        slaCompliance = slaStats.value.complianceRate || 99.9;
      }

      if (lisSlaStats.status === 'fulfilled' && lisSlaStats.value) {
        // Extract additional system metrics
      }

      // Process recent opportunities
      let recentOppsArray: any[] = [];
      if (recentOpps.status === 'fulfilled' && recentOpps.value) {
        recentOppsArray = recentOpps.value.data || [];
        setRecentOpportunities(recentOppsArray.slice(0, 5));
      }

      // Process top opportunities
      let topOppsArray: any[] = [];
      if (topOpps.status === 'fulfilled' && topOpps.value) {
        topOppsArray = topOpps.value.data || [];
        setTopOpportunities(topOppsArray.slice(0, 3));
      }

      const services: Array<{
        name: string;
        status: 'up' | 'degraded' | 'down';
        responseTime: number;
      }> = [
        { 
          name: 'API Gateway', 
          status: 'up' as const, 
          responseTime: 45
        },
        { 
          name: 'Database', 
          status: 'up' as const, 
          responseTime: 120
        },
        { 
          name: 'Cache Service', 
          status: 'up' as const, 
          responseTime: 12
        },
        { name: 'Storage', status: 'up' as const, responseTime: 85 },
        { name: 'Auth Service', status: 'up' as const, responseTime: 65 }
      ];
      if (roleDashboardResponse.status !== 'fulfilled') {
        setRecentActivities([]);
      }

      // Calculate growth percentages
      const userGrowth = calculateGrowth(totalUsers, previousUsers);
      const weeklyGrowth = calculateGrowth(currentPeriodTotal, previousPeriodTotal / 4); // Approx weekly
      const monthlyGrowth = calculateGrowth(currentPeriodTotal, previousPeriodTotal);

      // Update performance metrics with real data
      setPerformanceMetrics([
        { 
          name: 'API Response Time', 
          value: services.find(s => s.name === 'API Gateway')?.responseTime || 124, 
          change: -8, 
          target: 200, 
          unit: 'ms', 
          icon: <Gauge className="h-4 w-4" /> 
        },
        { 
          name: 'Database Queries', 
          value: 2450, 
          change: 12, 
          target: 3000, 
          unit: '/s', 
          icon: <Database className="h-4 w-4" /> 
        },
        { 
          name: 'Cache Efficiency', 
          value: 92.5, 
          change: 2.5, 
          target: 90, 
          unit: '%', 
          icon: <Zap className="h-4 w-4" /> 
        },
        { 
          name: 'Error Rate', 
          value: errorRate, 
          change: -0.1, 
          target: 1, 
          unit: '%', 
          icon: <AlertCircle className="h-4 w-4" /> 
        },
      ]);

      // Update all stats with real data
      setStats({
        totalUsers,
        activeUsers,
        pendingUsers,
        userGrowth,
        
        totalOpportunities,
        openOpportunities,
        closedOpportunities,
        hotLeads,
        warmLeads,
        coldLeads,
        totalRevenue,
        avgDealSize,
        conversionRate,
        winRate,
        
        systemHealth: services.every(s => s.status === 'up') ? 'Healthy' : 'Warning',
        serverUptime: slaCompliance,
        responseTime: services.reduce((acc, s) => acc + s.responseTime, 0) / services.length,
        apiCalls: 12450, // Replace with actual API metrics
        errorRate,
        storageUsage: 2.4, // Replace with actual storage metrics
        storageTotal: 3.2,
        storagePercentage: 75,
        activeSessions: 245, // Replace with actual session count
        cacheHitRate: 92.5,
        
        weeklyGrowth,
        monthlyGrowth,
        topSource,
        topSourceCount,
        
        totalVehicles,
        vehiclesInService,
        completedServices,
        pendingServices,
        averageServiceTime: 3.5, // Replace with actual average
        
        activeWorkOrders,
        delayedWorkOrders,
        completedWorkOrders,
        
        totalSalesOrders,
        pendingSalesOrders,
      });

      type ServiceStatus = 'up' | 'degraded' | 'down';

      const getServiceStatus = (isFulfilled: boolean): ServiceStatus => {
        return isFulfilled ? 'up' : 'degraded';
      };

      

      setSystemHealth({
        status: services.every(s => s.status === 'up') ? 'healthy' : 
                services.some(s => s.status === 'degraded') ? 'warning' : 'critical',
        message: services.every(s => s.status === 'up') ? 'All systems operational' : 
                 'Some systems experiencing issues',
        lastChecked: new Date().toISOString(),
        services
      });

    } catch (error) {
      console.error('Error fetching admin stats:', error);
      
      setStats(prev => ({
        ...prev,
        systemHealth: 'Degraded',
      }));
      
      setSystemHealth(prev => ({
        ...prev,
        status: 'warning',
        message: 'Unable to fetch all system metrics',
      }));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [canFetchSLAStatusSummary, withTimeout]);

  useEffect(() => {
    fetchAdminStats();
    
    // Set up polling for real-time updates
    const intervalId = setInterval(() => {
      fetchAdminStats(true);
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [fetchAdminStats]);

  const handleRefresh = () => {
    fetchAdminStats(true);
  };

   const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-blue-600 bg-blue-100'; // Changed from emerald to blue
      case 'warning': return 'text-amber-600 bg-amber-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getServiceStatusColor = (status: string) => {
    switch (status) {
      case 'up': return 'text-blue-600'; // Changed from emerald to blue
      case 'degraded': return 'text-amber-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getServiceStatusIcon = (status: string) => {
    switch (status) {
      case 'up': return <CheckCircle className="h-4 w-4" />;
      case 'degraded': return <AlertCircle className="h-4 w-4" />;
      case 'down': return <AlertTriangle className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-blue-600 bg-blue-50'; // Changed from emerald to blue
    if (value < 0) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUpRight className="h-3 w-3" />;
    if (value < 0) return <ArrowDownRight className="h-3 w-3" />;
    return null;
  };

  const Circle = ({ className }: { className?: string }) => (
    <div className={`h-4 w-4 rounded-full border border-gray-300 ${className}`} />
  );

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 shadow-lg" />
        <div className="h-[calc(100vh-64px)] p-4 md:p-6 space-y-6 overflow-auto">
          <div className="animate-pulse space-y-6">
            {/* Header skeleton */}
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

            {/* Stats grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-40 bg-gray-200 rounded-2xl"></div>
              ))}
            </div>

            {/* System health skeleton */}
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

  const getSourceIcon = (source: string | null) => {
    switch (source) {
      case 'walk_in': return <Users className="h-4 w-4" />;
      case 'website': return <Globe className="h-4 w-4" />;
      case 'referral': return <Heart className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'email': return <MailIcon className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'walk_in': return 'text-blue-600 bg-blue-100';
      case 'website': return 'text-blue-600 bg-blue-100';
      case 'referral': return 'text-blue-600 bg-blue-100';
      case 'phone': return 'text-blue-600 bg-blue-100';
      case 'email': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getOpportunityStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'text-blue-600 bg-blue-100';
      case 'attempted_to_contact': return 'text-purple-600 bg-purple-100';
      case 'prospecting': return 'text-amber-600 bg-amber-100';
      case 'appointment_scheduled': return 'text-orange-600 bg-orange-100';
      case 'non_progressive': return 'text-gray-600 bg-gray-100';
      case 'lost': return 'text-red-600 bg-red-100';
      case 'won': return 'text-blue-600 bg-blue-100'; // Changed from green to blue
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatSourceName = (source: string) => {
    return source.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const dashboardTabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <Gauge className="h-4 w-4" />,
      href: '/dashboard',
      isActive: pathname === '/dashboard',
    },
    {
      id: 'users',
      label: 'Users',
      icon: <Users className="h-4 w-4" />,
      href: '/settings/users',
      isActive: pathname.startsWith('/settings/users'),
    },
    {
      id: 'system',
      label: 'System',
      icon: <Server className="h-4 w-4" />,
      href: '/settings',
      isActive: pathname === '/settings',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <LineChart className="h-4 w-4" />,
      href: '/reports',
      isActive: pathname.startsWith('/reports'),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-50 overflow-hidden">
      {/* VIN17X Gradient Header - Automotive Blue Theme */}
      <div className="h-16 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 shadow-lg flex items-center px-6">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
              <Car className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                VIN<span className="text-blue-200">17X</span> Admin Dashboard
                <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                  v2.0
                </span>
              </h1>
              <p className="text-blue-200 text-sm">
                Welcome back, <span className="font-semibold text-white">{user?.firstName || 'Admin'}</span>
                <span className="ml-2 px-2 py-0.5 bg-blue-700/50 text-blue-200 text-xs rounded-full">
                  {user?.role?.name || 'System Administrator'}
                </span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Time range selector */}
            <div className="hidden md:flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-xl p-1">
              {['today', 'week', 'month', 'quarter'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range as any)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    timeRange === range
                      ? 'bg-white/20 text-white'
                      : 'text-blue-200 hover:bg-white/10'
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
                  <span className="hidden sm:inline">Refreshing</span>
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

      {/* Navigation Tabs */}
      <div className="px-6 pt-4">
        <div className="flex items-center gap-1 border-b border-gray-200">
          {dashboardTabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              prefetch
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                tab.isActive
                  ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 md:p-6 space-y-6 overflow-auto">
        {/* VIN17X Stats Overview - Automotive Focus */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Vehicles Card */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl opacity-0 group-hover:opacity-50 blur transition duration-500"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200">
                  <Car className="h-6 w-6 text-blue-600" />
                </div>
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 text-xs font-medium">
                  <TrendingUp className="h-3 w-3" />
                  <span>+{stats.weeklyGrowth}%</span>
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Total Vehicles</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalVehicles)}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <WrenchIcon className="h-3 w-3" />
                    <span>{formatNumber(stats.vehiclesInService)} in service</span>
                  </span>
                  <span className="text-sm font-medium text-blue-600">
                    {stats.pendingServices} pending
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Service Completion Card */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl opacity-0 group-hover:opacity-50 blur transition duration-500"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 text-xs font-medium">
                  <AwardIcon className="h-3 w-3" />
                  <span>96%</span>
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Completed Services</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.completedServices)}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg. service time</span>
                  <span className="text-sm font-medium text-gray-700">
                    {stats.averageServiceTime} hours
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Total Users Card */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl opacity-0 group-hover:opacity-50 blur transition duration-500"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 text-xs font-medium">
                  <UserPlus className="h-3 w-3" />
                  <span>+{stats.userGrowth}%</span>
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">System Users</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalUsers)}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <UserCheck className="h-3 w-3" />
                    <span>{formatNumber(stats.activeUsers)} active</span>
                  </span>
                  <span className="text-sm font-medium text-gray-700">
                    {formatNumber(stats.pendingUsers)} pending
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* System Health Card */}
          <div className="group relative">
            <div className={`absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-50 blur transition duration-500 ${
              systemHealth.status === 'healthy' ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
              systemHealth.status === 'warning' ? 'bg-gradient-to-r from-amber-400 to-orange-400' :
              'bg-gradient-to-r from-red-400 to-pink-400'
            }`}></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${
                  systemHealth.status === 'healthy' ? 'bg-gradient-to-br from-blue-100 to-blue-200' :
                  systemHealth.status === 'warning' ? 'bg-gradient-to-br from-amber-100 to-orange-100' :
                  'bg-gradient-to-br from-red-100 to-pink-100'
                }`}>
                  <Gauge className={`h-6 w-6 ${
                    systemHealth.status === 'healthy' ? 'text-blue-600' :
                    systemHealth.status === 'warning' ? 'text-amber-600' :
                    'text-red-600'
                  }`} />
                </div>
                <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                  getHealthStatusColor(systemHealth.status)
                }`}>
                  <Activity className="h-3 w-3" />
                  <span className="capitalize">{systemHealth.status}</span>
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">System Health</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">{systemHealth.status}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Uptime: {stats.serverUptime}%
                  </span>
                  <span className="text-sm font-medium text-gray-700">
                    {stats.responseTime}ms
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lead Distribution & Recent Opportunities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lead Distribution */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Lead Distribution</h2>
                <p className="text-sm text-gray-600">Opportunities by temperature tier</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Total: {formatNumber(stats.totalOpportunities)}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Hot Leads */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-gradient-to-r from-red-500 to-orange-500" />
                    <span className="text-sm font-medium text-gray-700">Hot Leads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{formatNumber(stats.hotLeads)}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {stats.totalOpportunities > 0 ? Math.round((stats.hotLeads / stats.totalOpportunities) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-gray-100/50 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-500"
                    style={{ width: `${stats.totalOpportunities > 0 ? (stats.hotLeads / stats.totalOpportunities) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Warm Leads */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500" />
                    <span className="text-sm font-medium text-gray-700">Warm Leads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{formatNumber(stats.warmLeads)}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {stats.totalOpportunities > 0 ? Math.round((stats.warmLeads / stats.totalOpportunities) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-gray-100/50 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-500"
                    style={{ width: `${stats.totalOpportunities > 0 ? (stats.warmLeads / stats.totalOpportunities) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Cold Leads */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Cold Leads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{formatNumber(stats.coldLeads)}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {stats.totalOpportunities > 0 ? Math.round((stats.coldLeads / stats.totalOpportunities) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-gray-100/50 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                    style={{ width: `${stats.totalOpportunities > 0 ? (stats.coldLeads / stats.totalOpportunities) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200/50">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Conversion Rate</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">{Math.round(stats.conversionRate)}%</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Win Rate</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">{Math.round(stats.winRate)}%</p>
              </div>
            </div>
          </div>

          {/* Recent Opportunities */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Recent Opportunities</h2>
                <p className="text-sm text-gray-600">Latest vehicle service opportunities</p>
              </div>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                View All →
              </button>
            </div>
            
            <div className="space-y-4">
              {recentOpportunities.length > 0 ? recentOpportunities.map((opportunity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50/50 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${getOpportunityStatusColor(opportunity.status)}`}>
                    {opportunity.status === 'won' ? (
                      <Trophy className="h-4 w-4" />
                    ) : opportunity.status === 'lost' ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{opportunity.subject || 'Untitled Service'}</h4>
                        <p className="text-sm text-gray-600 truncate">
                          {opportunity.customer?.name || 'No Customer'}
                          {opportunity.customer?.companyName && ` · ${opportunity.customer.companyName}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{formatTimeAgo(opportunity.updatedAt || opportunity.createdAt)}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getOpportunityStatusColor(opportunity.status)}`}>
                          {opportunity.status}
                        </span>
                      </div>
                    </div>
                    {opportunity.leadScore?.totalScore && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-600">Score: {opportunity.leadScore.totalScore}</span>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          opportunity.leadScore.tier === 'hot' ? 'bg-red-100/80 text-red-600' :
                          opportunity.leadScore.tier === 'warm' ? 'bg-amber-100/80 text-amber-600' :
                          'bg-blue-100/80 text-blue-600'
                        }`}>
                          {opportunity.leadScore.tier || 'cold'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <Car className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No recent opportunities</p>
                  <p className="text-sm text-gray-500 mt-1">Service opportunities will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Services & Top Opportunities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* VIN17X System Services Status */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">VIN17X System Services</h2>
                <p className="text-sm text-gray-600">Vehicle management system status</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getHealthStatusColor(systemHealth.status)}`}>
                  {systemHealth.status === 'healthy' ? 'All Systems Go' : 
                   systemHealth.status === 'warning' ? 'Degraded Performance' : 
                   'Critical Issues'}
                </span>
                <Clock className="h-4 w-4 text-gray-500" />
              </div>
            </div>
            
            <div className="space-y-4">
              {systemHealth.services.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getServiceStatusColor(service.status)}`}>
                      {service.status === 'up' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : service.status === 'degraded' ? (
                        <AlertCircle className="h-4 w-4" />
                      ) : (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{service.name}</h4>
                      <p className="text-xs text-gray-500">Last checked: {formatTimeAgo(systemHealth.lastChecked)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${getServiceStatusColor(service.status)}`}>
                      {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                    </p>
                    <p className="text-xs text-gray-500">{service.responseTime}ms</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200/50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Last system check: {formatTimeAgo(systemHealth.lastChecked)}
                </div>
                <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  View System Logs →
                </button>
              </div>
            </div>
          </div>

          {/* Top High-Value Service Opportunities */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 backdrop-blur-sm rounded-2xl border border-gray-200/30 p-5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Top Service Opportunities</h2>
                <p className="text-sm text-gray-600">Highest value vehicle services</p>
              </div>
              <Car className="h-5 w-5 text-blue-600" />
            </div>
            
            <div className="space-y-4">
              {topOpportunities.length > 0 ? topOpportunities.map((opportunity, index) => (
                <div key={index} className="group p-4 bg-white/80 border border-gray-200/50 hover:border-blue-200/50 rounded-xl transition-all duration-300">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-white font-semibold">
                        #{index + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{opportunity.subject || 'Untitled Service'}</h4>
                          <p className="text-sm text-gray-600 truncate">
                            {opportunity.customer?.name || 'No Customer'}
                            {opportunity.customer?.companyName && ` · ${opportunity.customer.companyName}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getOpportunityStatusColor(opportunity.status)}`}>
                            {opportunity.status}
                          </span>
                        </div>
                      </div>
                      
                      {opportunity.leadScore && (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                opportunity.leadScore.tier === 'hot' ? 'bg-red-100/80 text-red-600' :
                                opportunity.leadScore.tier === 'warm' ? 'bg-amber-100/80 text-amber-600' :
                                'bg-blue-100/80 text-blue-600'
                              }`}>
                                {opportunity.leadScore.tier || 'cold'} ({opportunity.leadScore.totalScore})
                              </span>
                              {opportunity.total && (
                                <span className="text-xs font-semibold text-blue-600">
                                  {formatCurrency(opportunity.total)}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              Priority: {opportunity.leadScore.priority || 'Normal'}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-gray-100/50 overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                              style={{ width: `${Math.min(opportunity.leadScore.totalScore || 0, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <Car className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No top service opportunities</p>
                  <p className="text-sm text-gray-500 mt-1">Create service opportunities to see them here</p>
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200/30">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Top Source: {formatSourceName(stats.topSource)}</span>
                <span className="text-sm font-medium text-gray-700">{stats.topSourceCount} opportunities</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent System Activities */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
                <p className="text-sm text-gray-600">Latest service and system events</p>
              </div>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                View All →
              </button>
            </div>
            
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50/50 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-blue-100/50">
                    <Activity className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{activity.action}</h4>
                        <p className="text-sm text-gray-600">By {activity.user}</p>
                        {activity.details && (
                          <p className="text-xs text-gray-500 mt-1">{activity.details}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</span>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                          {activity.location}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-4">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {activity.ip}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Admin Actions */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
                <p className="text-sm text-gray-600">Common VIN17X administrative tasks</p>
              </div>
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button className="group flex flex-col items-center justify-center p-4 bg-blue-50/50 border border-blue-200/50 hover:border-blue-300/50 hover:bg-blue-100/50 rounded-xl transition-all duration-300">
                <div className="p-3 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 mb-2 group-hover:from-blue-200 group-hover:to-blue-300">
                  <Car className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Add Vehicle</span>
                <span className="text-xs text-gray-600">Register new vehicle</span>
              </button>
              
              <button className="group flex flex-col items-center justify-center p-4 bg-blue-50/50 border border-blue-200/50 hover:border-blue-300/50 hover:bg-blue-100/50 rounded-xl transition-all duration-300">
                <div className="p-3 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 mb-2 group-hover:from-blue-200 group-hover:to-blue-300">
                  <WrenchIcon className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Create Job Card</span>
                <span className="text-xs text-gray-600">New service job card</span>
              </button>
              
              <button className="group flex flex-col items-center justify-center p-4 bg-blue-50/50 border border-blue-200/50 hover:border-blue-300/50 hover:bg-blue-100/50 rounded-xl transition-all duration-300">
                <div className="p-3 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 mb-2 group-hover:from-blue-200 group-hover:to-blue-300">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Service Report</span>
                <span className="text-xs text-gray-600">Generate service report</span>
              </button>
              
              <button className="group flex flex-col items-center justify-center p-4 bg-blue-50/50 border border-blue-200/50 hover:border-blue-300/50 hover:bg-blue-100/50 rounded-xl transition-all duration-300">
                <div className="p-3 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 mb-2 group-hover:from-blue-200 group-hover:to-blue-300">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Add Technician</span>
                <span className="text-xs text-gray-600">Add new technician</span>
              </button>
              
              <button className="group flex flex-col items-center justify-center p-4 bg-blue-50/50 border border-blue-200/50 hover:border-blue-300/50 hover:bg-blue-100/50 rounded-xl transition-all duration-300">
                <div className="p-3 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 mb-2 group-hover:from-blue-200 group-hover:to-blue-300">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Parts Inventory</span>
                <span className="text-xs text-gray-600">Manage spare parts</span>
              </button>
              
              <button className="group flex flex-col items-center justify-center p-4 bg-blue-50/50 border border-blue-200/50 hover:border-blue-300/50 hover:bg-blue-100/50 rounded-xl transition-all duration-300">
                <div className="p-3 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 mb-2 group-hover:from-blue-200 group-hover:to-blue-300">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Invoices</span>
                <span className="text-xs text-gray-600">Manage billing</span>
              </button>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">VIN17X Performance Metrics</h2>
              <p className="text-sm text-gray-600">System performance and resource utilization</p>
            </div>
            <div className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Real-time Monitoring</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {performanceMetrics.map((metric, index) => (
              <div key={index} className="p-4 bg-gradient-to-br from-white to-gray-50/50 border border-gray-200/50 rounded-xl hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${
                      metric.change > 0 ? 'bg-blue-100/50' : 'bg-red-100/50'
                    }`}>
                      {metric.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{metric.name}</span>
                  </div>
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getTrendColor(metric.change)}`}>
                    {getTrendIcon(metric.change)}
                    {metric.change > 0 ? '+' : ''}{metric.change}%
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {metric.value.toFixed(1)}{metric.unit}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Target: {metric.target}{metric.unit}</span>
                  <span className={`font-medium ${
                    metric.value <= metric.target ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    {Math.round((metric.value / metric.target) * 100)}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      metric.value <= metric.target ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-red-500 to-pink-500'
                    }`}
                    style={{ width: `${Math.min((metric.value / metric.target) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* VIN17X System Status Footer */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 backdrop-blur-sm rounded-2xl border border-blue-500/30 p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Car className="h-5 w-5" />
                VIN17X System Status
              </h3>
              <p className="text-sm text-blue-200">
                Last updated: {formatTimeAgo(systemHealth.lastChecked)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-sm text-blue-100">Operational</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                <span className="text-sm text-blue-100">Degraded</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                <span className="text-sm text-blue-100">Critical</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all border border-white/20">
                <Download className="h-4 w-4" />
                <span>Export Report</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white text-blue-700 rounded-xl hover:bg-blue-50 transition-all">
                <Settings className="h-4 w-4" />
                <span>System Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
