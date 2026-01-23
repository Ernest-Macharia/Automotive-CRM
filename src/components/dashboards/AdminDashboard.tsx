// components/dashboards/AdminDashboard.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Trophy
} from 'lucide-react';
import { authService } from '@/services/authService';
import { opportunityService } from '@/services/opportunityService';
import { userService } from '@/services/userService';

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
  const [stats, setStats] = useState<Stats>({
    // User Stats
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
    userGrowth: 12.5,
    
    // Opportunity Stats
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
    
    // System Stats
    systemHealth: 'Healthy',
    serverUptime: 99.9,
    responseTime: 124,
    apiCalls: 12450,
    errorRate: 0.2,
    storageUsage: 2.4,
    storageTotal: 3.2,
    storagePercentage: 75,
    activeSessions: 245,
    cacheHitRate: 92.5,
    
    // Performance Stats
    weeklyGrowth: 12.5,
    monthlyGrowth: 24.8,
    topSource: 'website',
    topSourceCount: 0,
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
    { name: 'API Response Time', value: 124, change: -8, target: 200, unit: 'ms', icon: <Activity className="h-4 w-4" /> },
    { name: 'Database Queries', value: 2450, change: 12, target: 3000, unit: '/s', icon: <Database className="h-4 w-4" /> },
    { name: 'Cache Efficiency', value: 92.5, change: 2.5, target: 90, unit: '%', icon: <Zap className="h-4 w-4" /> },
    { name: 'Error Rate', value: 0.2, change: -0.1, target: 1, unit: '%', icon: <AlertCircle className="h-4 w-4" /> },
  ]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'system' | 'analytics'>('overview');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'quarter'>('week');

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
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const fetchAdminStats = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      // Fetch multiple data sources in parallel
      const [usersResponse, opportunitiesResponse, overviewResponse, recentOpps, topOpps] = await Promise.allSettled([
        userService.getAllUsers(),
        opportunityService.getAllOpportunities({ limit: 1000 }),
        opportunityService.getOpportunitiesOverview(),
        opportunityService.getAllOpportunities({ sort: 'updatedAt:desc', limit: 5 }),
        opportunityService.getAllOpportunities({ sort: 'leadScore.totalScore:desc', limit: 3 }),
      ]);

      // Process users data
      let totalUsers = 0;
      let activeUsers = 0;
      let pendingUsers = 0;

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

      if (opportunitiesResponse.status === 'fulfilled' && opportunitiesResponse.value) {
        const oppsData = opportunitiesResponse.value;
        const opportunities = oppsData.data || [];
        
        totalOpportunities = opportunities.length;
        
        // Count by status
        const openStatuses = ['new', 'attempted_to_contact', 'prospecting', 'appointment_scheduled'];
        const closedStatuses = ['won', 'lost', 'non_progressive'];
        
        openOpportunities = opportunities.filter((opp: any) => 
          openStatuses.includes(opp.status)
        ).length;
        
        closedOpportunities = opportunities.filter((opp: any) => 
          closedStatuses.includes(opp.status)
        ).length;

        // Count by tier
        hotLeads = opportunities.filter((opp: any) => 
          opp.leadScore?.tier === 'hot'
        ).length;
        
        warmLeads = opportunities.filter((opp: any) => 
          opp.leadScore?.tier === 'warm'
        ).length;
        
        coldLeads = opportunities.filter((opp: any) => 
          opp.leadScore?.tier === 'cold'
        ).length;

        // Calculate revenue from won opportunities
        const wonOpportunities = opportunities.filter((opp: any) => 
          opp.status === 'won'
        );
        
        totalRevenue = wonOpportunities.reduce((sum: number, opp: any) => {
          return sum + (opp.total || opp.leadScore?.commercial?.dealValue || opp.leadScore?.totalScore * 1000 || 50000);
        }, 0);

        // Find top source
        const sourceCounts: Record<string, number> = {};
        opportunities.forEach((opp: any) => {
          const source = opp.source || 'other';
          sourceCounts[source] = (sourceCounts[source] || 0) + 1;
        });
        
        const topSourceEntry = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0] || ['website', 0];
        topSource = topSourceEntry[0];
        topSourceCount = topSourceEntry[1];
      }

      // Process overview data
      let avgDealSize = 0;
      let conversionRate = 0;
      let winRate = 0;

      if (overviewResponse.status === 'fulfilled' && overviewResponse.value) {
        const overview = overviewResponse.value;
        
        totalOpportunities = overview.totalopportunities || totalOpportunities;
        openOpportunities = overview.openopportunities || openOpportunities;
        closedOpportunities = overview.closedopportunities || closedOpportunities;
        
        // Calculate conversion rate and win rate
        const wonOppsCount = opportunitiesResponse.status === 'fulfilled' ? 
          (opportunitiesResponse.value.data || []).filter((opp: any) => opp.status === 'won').length : 0;
        
        conversionRate = totalOpportunities > 0 ? (wonOppsCount / totalOpportunities) * 100 : 0;
        winRate = openOpportunities > 0 ? (wonOppsCount / openOpportunities) * 100 : 0;
        avgDealSize = totalRevenue > 0 ? totalRevenue / Math.max(wonOppsCount, 1) : 0;
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

      // Generate mock system health data
      const services = [
        { name: 'API Gateway', status: 'up' as const, responseTime: Math.floor(Math.random() * 50) + 10 },
        { name: 'Database', status: 'up' as const, responseTime: Math.floor(Math.random() * 150) + 50 },
        { name: 'File Storage', status: 'up' as const, responseTime: Math.floor(Math.random() * 100) + 30 },
        { name: 'Email Service', status: 'up' as const, responseTime: Math.floor(Math.random() * 300) + 100 },
        { name: 'Cache Service', status: 'up' as const, responseTime: Math.floor(Math.random() * 20) + 5 },
      ];

      // Generate mock activities
      const mockActivities: UserActivity[] = [
        {
          id: '1',
          user: 'John Doe',
          action: 'Logged into system',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          ip: '192.168.1.100',
          location: 'Nairobi, KE',
          details: 'Successful login from Chrome browser'
        },
        {
          id: '2',
          user: 'Jane Smith',
          action: 'Created new opportunity',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          ip: '192.168.1.101',
          location: 'Mombasa, KE',
          details: 'Opportunity #OPP-1234 for Toyota Hilux service'
        },
        {
          id: '3',
          user: 'System',
          action: 'Database backup completed',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          ip: '192.168.1.1',
          location: 'System',
          details: 'Daily backup completed successfully'
        },
        {
          id: '4',
          user: 'Admin User',
          action: 'Updated user permissions',
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          ip: '192.168.1.102',
          location: 'Kisumu, KE',
          details: 'Modified role permissions for sales team'
        },
        {
          id: '5',
          user: 'Security Bot',
          action: 'Security scan completed',
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          ip: '192.168.1.1',
          location: 'System',
          details: 'No security threats detected'
        }
      ];

      setRecentActivities(mockActivities);

      // Update all stats
      setStats({
        totalUsers,
        activeUsers,
        pendingUsers,
        userGrowth: 12.5,
        
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
        
        systemHealth: 'Healthy',
        serverUptime: 99.9,
        responseTime: 124,
        apiCalls: 12450,
        errorRate: 0.2,
        storageUsage: 2.4,
        storageTotal: 3.2,
        storagePercentage: 75,
        activeSessions: 245,
        cacheHitRate: 92.5,
        
        weeklyGrowth: 12.5,
        monthlyGrowth: 24.8,
        topSource,
        topSourceCount,
      });

      setSystemHealth({
        status: 'healthy',
        message: 'All systems operational',
        lastChecked: new Date().toISOString(),
        services
      });

    } catch (error) {
      console.error('Error fetching admin stats:', error);
      
      // Fallback to default data
      setStats(prev => ({
        ...prev,
        systemHealth: 'Degraded',
      }));
      
      setSystemHealth(prev => ({
        ...prev,
        status: 'warning',
        message: 'Unable to fetch all system metrics',
      }));
      
      // Show error in activities
      setRecentActivities(prev => [
        {
          id: 'error',
          user: 'System',
          action: 'Failed to fetch real-time data',
          timestamp: new Date().toISOString(),
          ip: '0.0.0.0',
          location: 'System',
          details: 'Using cached data for display'
        },
        ...prev.slice(0, 4)
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminStats();
  }, [fetchAdminStats]);

  const handleRefresh = () => {
    fetchAdminStats(true);
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-emerald-600 bg-emerald-100';
      case 'warning': return 'text-amber-600 bg-amber-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getServiceStatusColor = (status: string) => {
    switch (status) {
      case 'up': return 'text-emerald-600';
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
    if (value > 0) return 'text-emerald-600 bg-emerald-50';
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
      <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-blue-800 via-purple-900 to-black shadow-lg" />
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
      case 'website': return 'text-green-600 bg-green-100';
      case 'referral': return 'text-purple-600 bg-purple-100';
      case 'phone': return 'text-red-600 bg-red-100';
      case 'email': return 'text-cyan-600 bg-cyan-100';
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
      case 'won': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatSourceName = (source: string) => {
    return source.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 overflow-hidden">
      {/* Gradient Header */}
      <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg flex items-center px-6">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">System Administrator</h1>
              <p className="text-gray-300 text-sm">
                Welcome, <span className="font-semibold text-white">{user?.firstName || 'Admin'}</span>
                <span className="ml-2 px-2 py-0.5 bg-gray-700/50 text-gray-300 text-xs rounded-full">
                  {user?.role?.name || 'Administrator'}
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
          {[
            { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
            { id: 'users', label: 'Users', icon: <Users className="h-4 w-4" /> },
            { id: 'system', label: 'System', icon: <Server className="h-4 w-4" /> },
            { id: 'analytics', label: 'Analytics', icon: <LineChart className="h-4 w-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 md:p-6 space-y-6 overflow-auto">
        {/* System Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Users Card */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 rounded-2xl opacity-0 group-hover:opacity-50 blur transition duration-500"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-blue-100/80 to-indigo-100/80 text-blue-700 text-xs font-medium">
                  <UserPlus className="h-3 w-3" />
                  <span>+{stats.userGrowth}%</span>
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Total Users</p>
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
              systemHealth.status === 'healthy' ? 'bg-gradient-to-r from-emerald-400 to-green-400' :
              systemHealth.status === 'warning' ? 'bg-gradient-to-r from-amber-400 to-orange-400' :
              'bg-gradient-to-r from-red-400 to-pink-400'
            }`}></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${
                  systemHealth.status === 'healthy' ? 'bg-gradient-to-br from-emerald-100 to-green-100' :
                  systemHealth.status === 'warning' ? 'bg-gradient-to-br from-amber-100 to-orange-100' :
                  'bg-gradient-to-br from-red-100 to-pink-100'
                }`}>
                  <Server className="h-6 w-6 text-emerald-600" />
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

          {/* Total Opportunities Card */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 rounded-2xl opacity-0 group-hover:opacity-50 blur transition duration-500"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-100 to-blue-100">
                  <Target className="h-6 w-6 text-cyan-600" />
                </div>
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-100/80 to-blue-100/80 text-cyan-700 text-xs font-medium">
                  <TrendingUp className="h-3 w-3" />
                  <span>+{stats.weeklyGrowth}%</span>
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Total Opportunities</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalOpportunities)}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Open / Closed
                  </span>
                  <span className="text-sm font-medium text-gray-700">
                    {formatNumber(stats.openOpportunities)} / {formatNumber(stats.closedOpportunities)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Total Revenue Card */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 rounded-2xl opacity-0 group-hover:opacity-50 blur transition duration-500"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100">
                  <DollarSign className="h-6 w-6 text-violet-600" />
                </div>
                <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getTrendColor(stats.monthlyGrowth)}`}>
                  {getTrendIcon(stats.monthlyGrowth)}
                  <span>+{stats.monthlyGrowth}%</span>
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Avg Deal Size
                  </span>
                  <span className="text-sm font-medium text-gray-700">
                    {formatCurrency(stats.avgDealSize)}
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
                    <div className="h-3 w-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
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
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
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
                <p className="text-sm text-gray-600">Latest opportunities created</p>
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
                        <h4 className="font-medium text-gray-900 truncate">{opportunity.subject || 'Untitled Opportunity'}</h4>
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
                  <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No recent opportunities</p>
                  <p className="text-sm text-gray-500 mt-1">Opportunities will appear here as they're created</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Services & Top Opportunities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Services Status */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">System Services</h2>
                <p className="text-sm text-gray-600">Status of all system components</p>
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

          {/* Top High-Value Opportunities */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 backdrop-blur-sm rounded-2xl border border-gray-200/30 p-5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Top High-Value Opportunities</h2>
                <p className="text-sm text-gray-600">Highest scoring opportunities to focus on</p>
              </div>
              <Award className="h-5 w-5 text-amber-500" />
            </div>
            
            <div className="space-y-4">
              {topOpportunities.length > 0 ? topOpportunities.map((opportunity, index) => (
                <div key={index} className="group p-4 bg-white/80 border border-gray-200/50 hover:border-blue-200/50 rounded-xl transition-all duration-300">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white font-semibold">
                        #{index + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{opportunity.subject || 'Untitled'}</h4>
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
                                <span className="text-xs font-semibold text-green-600">
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
                              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
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
                  <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No top opportunities found</p>
                  <p className="text-sm text-gray-500 mt-1">Create opportunities to see them here</p>
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
                <h2 className="text-lg font-semibold text-gray-900">Recent System Activities</h2>
                <p className="text-sm text-gray-600">System-wide user actions and events</p>
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
                <p className="text-sm text-gray-600">Common administrative tasks</p>
              </div>
              <Zap className="h-5 w-5 text-blue-500" />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button className="group flex flex-col items-center justify-center p-4 bg-blue-50/50 border border-blue-200/50 hover:border-blue-300/50 hover:bg-blue-100/50 rounded-xl transition-all duration-300">
                <div className="p-3 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 mb-2 group-hover:from-blue-200 group-hover:to-blue-100">
                  <UserPlus className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Add User</span>
                <span className="text-xs text-gray-600">Create new user account</span>
              </button>
              
              <button className="group flex flex-col items-center justify-center p-4 bg-emerald-50/50 border border-emerald-200/50 hover:border-emerald-300/50 hover:bg-emerald-100/50 rounded-xl transition-all duration-300">
                <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-50 mb-2 group-hover:from-emerald-200 group-hover:to-emerald-100">
                  <Settings className="h-6 w-6 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">System Config</span>
                <span className="text-xs text-gray-600">Configure system settings</span>
              </button>
              
              <button className="group flex flex-col items-center justify-center p-4 bg-amber-50/50 border border-amber-200/50 hover:border-amber-300/50 hover:bg-amber-100/50 rounded-xl transition-all duration-300">
                <div className="p-3 rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 mb-2 group-hover:from-amber-200 group-hover:to-amber-100">
                  <FileText className="h-6 w-6 text-amber-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Generate Report</span>
                <span className="text-xs text-gray-600">Create system report</span>
              </button>
              
              <button className="group flex flex-col items-center justify-center p-4 bg-purple-50/50 border border-purple-200/50 hover:border-purple-300/50 hover:bg-purple-100/50 rounded-xl transition-all duration-300">
                <div className="p-3 rounded-lg bg-gradient-to-br from-purple-100 to-purple-50 mb-2 group-hover:from-purple-200 group-hover:to-purple-100">
                  <Database className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Backup</span>
                <span className="text-xs text-gray-600">Create system backup</span>
              </button>
              
              <button className="group flex flex-col items-center justify-center p-4 bg-red-50/50 border border-red-200/50 hover:border-red-300/50 hover:bg-red-100/50 rounded-xl transition-all duration-300">
                <div className="p-3 rounded-lg bg-gradient-to-br from-red-100 to-red-50 mb-2 group-hover:from-red-200 group-hover:to-red-100">
                  <Lock className="h-6 w-6 text-red-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Security Scan</span>
                <span className="text-xs text-gray-600">Run security audit</span>
              </button>
              
              <button className="group flex flex-col items-center justify-center p-4 bg-cyan-50/50 border border-cyan-200/50 hover:border-cyan-300/50 hover:bg-cyan-100/50 rounded-xl transition-all duration-300">
                <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-100 to-cyan-50 mb-2 group-hover:from-cyan-200 group-hover:to-cyan-100">
                  <Terminal className="h-6 w-6 text-cyan-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">API Keys</span>
                <span className="text-xs text-gray-600">Manage API access</span>
              </button>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Performance Metrics</h2>
              <p className="text-sm text-gray-600">System performance and resource utilization</p>
            </div>
            <div className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium text-blue-700">Real-time Monitoring</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {performanceMetrics.map((metric, index) => (
              <div key={index} className="p-4 bg-gradient-to-br from-white to-gray-50/50 border border-gray-200/50 rounded-xl hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${
                      metric.change > 0 ? 'bg-emerald-100/50' : 'bg-red-100/50'
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
                    metric.value <= metric.target ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {Math.round((metric.value / metric.target) * 100)}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      metric.value <= metric.target ? 'bg-gradient-to-r from-emerald-500 to-green-500' : 'bg-gradient-to-r from-red-500 to-pink-500'
                    }`}
                    style={{ width: `${Math.min((metric.value / metric.target) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Status Footer */}
        <div className="bg-gradient-to-r from-gray-800/5 via-gray-900/5 to-black/5 backdrop-blur-sm rounded-2xl border border-gray-200/30 p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900">System Status</h3>
              <p className="text-sm text-gray-600">
                Last updated: {formatTimeAgo(systemHealth.lastChecked)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-sm text-gray-700">Operational</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className="text-sm text-gray-700">Degraded</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-700">Critical</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all">
                <Download className="h-4 w-4" />
                <span>Export Data</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl hover:from-gray-900 hover:to-black transition-all">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}