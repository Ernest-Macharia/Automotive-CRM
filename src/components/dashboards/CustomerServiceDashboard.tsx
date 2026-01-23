'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  MessageSquare, 
  Phone, 
  Users, 
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Star,
  Calendar,
  FileText,
  Mail,
  Zap,
  RefreshCw,
  Loader2,
  Activity,
  Target,
  TrendingDown,
  AlertTriangle,
  User,
  Shield,
  Bell,
  ChevronRight,
  Headphones,
  MailCheck,
  ThumbsUp,
  Heart
} from 'lucide-react';
import { opportunityService, Opportunity } from '@/services/opportunityService';
import { createPermissionChecker } from '@/services/settings/roleService';

interface CustomerServiceDashboardProps {
  user: any;
}

interface CustomerTicket {
  id: string;
  opportunityId: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  issue: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'in_progress' | 'resolved' | 'escalated';
  createdAt: string;
  assignedTo?: string;
  lastResponse: string;
  source: 'phone' | 'email' | 'chat' | 'web';
  category: 'technical' | 'billing' | 'general' | 'complaint';
}

interface ServiceStats {
  openTickets: number;
  avgResponseTime: string;
  customerSatisfaction: number;
  resolvedToday: number;
  callsHandled: number;
  escalationRate: number;
  firstContactResolution: number;
  activeChats: number;
  avgResolutionTime: string;
  satisfactionTrend: 'up' | 'down' | 'stable';
  topIssues: Array<{category: string; count: number}>;
}

interface CustomerFeedback {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  opportunityId?: string;
  agent?: string;
}

export default function CustomerServiceDashboard({ user }: CustomerServiceDashboardProps) {
  const [tickets, setTickets] = useState<CustomerTicket[]>([]);
  const [stats, setStats] = useState<ServiceStats>({
    openTickets: 0,
    avgResponseTime: '15m',
    customerSatisfaction: 4.7,
    resolvedToday: 0,
    callsHandled: 0,
    escalationRate: 3.2,
    firstContactResolution: 82,
    activeChats: 0,
    avgResolutionTime: '2h 15m',
    satisfactionTrend: 'up',
    topIssues: []
  });
  const [recentFeedback, setRecentFeedback] = useState<CustomerFeedback[]>([]);
  const [assignedOpportunities, setAssignedOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [permissionChecker, setPermissionChecker] = useState<any>(null);

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100 border-red-200/50';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200/50';
      case 'medium': return 'text-amber-600 bg-amber-100 border-amber-200/50';
      case 'low': return 'text-blue-600 bg-blue-100 border-blue-200/50';
      default: return 'text-gray-600 bg-gray-100 border-gray-200/50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'text-emerald-600 bg-emerald-100 border-emerald-200/50';
      case 'in_progress': return 'text-blue-600 bg-blue-100 border-blue-200/50';
      case 'new': return 'text-gray-600 bg-gray-100 border-gray-200/50';
      case 'escalated': return 'text-purple-600 bg-purple-100 border-purple-200/50';
      default: return 'text-gray-600 bg-gray-100 border-gray-200/50';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'chat': return <MessageSquare className="h-4 w-4" />;
      case 'web': return <Activity className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical': return <Zap className="h-4 w-4" />;
      case 'billing': return <FileText className="h-4 w-4" />;
      case 'complaint': return <AlertTriangle className="h-4 w-4" />;
      default: return <Headphones className="h-4 w-4" />;
    }
  };

  const fetchServiceData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      // Get opportunities that need customer service attention
      const [
        newOpportunities,
        inProgressOpportunities,
        assignedOpportunitiesData,
        highPriorityOpportunities,
        recentClosedOpportunities
      ] = await Promise.all([
        // New opportunities that might need service attention
        opportunityService.filterOpportunities({
          status: 'new',
          'leadScore.priority': { $gt: 50 },
          sort: 'createdAt:desc',
          limit: 20
        } as any).catch(() => ({ data: [] })),
        
        // Opportunities in progress
        opportunityService.filterOpportunities({
          status: 'prospecting',
          sort: 'updatedAt:desc',
          limit: 10
        }).catch(() => ({ data: [] })),
        
        // Opportunities assigned to this user
        opportunityService.filterOpportunities({
          assignedTo: user?._id || user?.id,
          sort: 'createdAt:desc',
          limit: 10
        }).catch(() => ({ data: [] })),
        
        // High priority opportunities
        opportunityService.filterOpportunities({
          'leadScore.priority': { $gt: 70 },
          status: 'new',
          sort: 'leadScore.priority:desc',
          limit: 10
        } as any).catch(() => ({ data: [] })),
        
        // Recently closed opportunities for feedback
        opportunityService.filterOpportunities({
          status: 'won',
          sort: 'updatedAt:desc',
          limit: 20
        }).catch(() => ({ data: [] }))
      ]);

      // Process tickets from opportunities
      const processedTickets: CustomerTicket[] = [];
      
      // Convert high priority opportunities to tickets
      highPriorityOpportunities.data?.forEach(opp => {
        const ticket: CustomerTicket = {
          id: `TKT-${opp._id.slice(-6)}`,
          opportunityId: opp._id,
          customer: {
            name: opp.customer?.name || 'Unknown Customer',
            email: opp.customer?.email || '',
            phone: opp.customer?.phone
          },
          issue: opp.subject || 'Customer Inquiry',
          priority: opp.leadScore?.priority > 80 ? 'urgent' : 
                  opp.leadScore?.priority > 60 ? 'high' : 'medium',
          status: 'new',
          createdAt: opp.createdAt,
          lastResponse: opp.updatedAt || opp.createdAt,
          source: opp.source === 'call' ? 'phone' : 
                 opp.source === 'email' ? 'email' : 'web',
          category: 'general',
          assignedTo: opp.assignedTo?.name
        };
        processedTickets.push(ticket);
      });

      // Convert new opportunities to tickets
      newOpportunities.data?.slice(0, 5).forEach(opp => {
        const ticket: CustomerTicket = {
          id: `TKT-${opp._id.slice(-6)}`,
          opportunityId: opp._id,
          customer: {
            name: opp.customer?.name || 'Unknown Customer',
            email: opp.customer?.email || '',
            phone: opp.customer?.phone
          },
          issue: opp.subject || 'New Customer Inquiry',
          priority: 'medium',
          status: 'new',
          createdAt: opp.createdAt,
          lastResponse: opp.createdAt,
          source: opp.source === 'call' ? 'phone' : 
                 opp.source === 'email' ? 'email' : 'web',
          category: 'general'
        };
        processedTickets.push(ticket);
      });

      // Set assigned opportunities
      setAssignedOpportunities(assignedOpportunitiesData.data || []);

      // Calculate statistics
      const today = new Date().toISOString().split('T')[0];
      const resolvedToday = recentClosedOpportunities.data?.filter(opp => 
        opp.updatedAt?.includes(today)
      ).length || 0;

      // Analyze top issues from opportunities
      const issueCategories = new Map<string, number>();
      highPriorityOpportunities.data?.forEach(opp => {
        const category = opp.opportunityType === 'SERVICE' ? 'technical' : 'general';
        issueCategories.set(category, (issueCategories.get(category) || 0) + 1);
      });

      const topIssues = Array.from(issueCategories.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      // Process feedback from closed opportunities
      const processedFeedback: CustomerFeedback[] = recentClosedOpportunities.data
        ?.slice(0, 3)
        .map(opp => ({
          id: opp._id,
          customerName: opp.customer?.name || 'Customer',
          rating: 5, // Would come from actual feedback system
          comment: opp.notes?.length > 100 ? opp.notes.substring(0, 100) + '...' : 
                  (opp.notes || 'Great service, thank you!'),
          date: opp.updatedAt || opp.createdAt,
          opportunityId: opp._id,
          agent: opp.assignedTo?.name
        })) || [];

      // Update stats
      setStats({
        openTickets: processedTickets.length,
        avgResponseTime: '15m',
        customerSatisfaction: 4.7,
        resolvedToday,
        callsHandled: highPriorityOpportunities.data?.filter(opp => 
          opp.source === 'call'
        ).length || 0,
        escalationRate: 3.2,
        firstContactResolution: 82,
        activeChats: assignedOpportunitiesData.data?.length || 0,
        avgResolutionTime: '2h 15m',
        satisfactionTrend: 'up',
        topIssues
      });

      setTickets(processedTickets);
      setRecentFeedback(processedFeedback);

    } catch (error) {
      console.error('Error fetching service data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchServiceData();
    if (user?.permissions) {
      setPermissionChecker(createPermissionChecker(user.permissions));
    }
  }, [fetchServiceData, user]);

  const handleRefresh = () => {
    fetchServiceData(true);
  };

  const getRoleTitle = () => {
    const roleNames: Record<string, string> = {
      support: 'Support Agent',
      customer_service: 'Customer Service Representative',
      customer_experience: 'Customer Experience Specialist'
    };
    return roleNames[user?.role] || 'Customer Service';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-blue-500 via-purple-500 to-purple-600 shadow-lg" />
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
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 overflow-hidden">
      {/* Gradient Header */}
      <div className="h-16 bg-gradient-to-r from-blue-500 via-purple-500 to-purple-600 shadow-lg flex items-center px-6">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Headphones className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Customer Service Dashboard</h1>
              <p className="text-blue-100 text-sm">
                Welcome, <span className="font-semibold text-white">{user?.name || user?.email}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block px-3 py-1 rounded-full bg-white/20 text-white text-sm font-medium backdrop-blur-sm">
              {getRoleTitle()}
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
        {/* Service Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Open Tickets */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 rounded-2xl opacity-0 group-hover:opacity-50 blur transition duration-500"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-100 to-blue-100">
                  <AlertCircle className="h-6 w-6 text-cyan-600" />
                </div>
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-100/80 text-cyan-600 text-xs font-medium">
                  <Activity className="h-3 w-3" />
                  <span>Live</span>
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Open Tickets</p>
                <p className="text-2xl font-bold text-gray-900">{stats.openTickets}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100/50">
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 text-cyan-500 mr-1" />
                  <span className="text-gray-600">Avg. response: {stats.avgResponseTime}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Resolved Today */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 to-green-400 rounded-2xl opacity-0 group-hover:opacity-50 blur transition duration-500"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-100 to-green-100">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-600 text-xs font-medium">
                  <TrendingUp className="h-3 w-3" />
                  <span>Today</span>
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Resolved Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats.resolvedToday}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100/50">
                <div className="flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-emerald-500 mr-1" />
                  <span className="text-emerald-600 font-medium">Great work!</span>
                </div>
              </div>
            </div>
          </div>

          {/* Satisfaction Score */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl opacity-0 group-hover:opacity-50 blur transition duration-500"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100">
                  <Star className="h-6 w-6 text-amber-600" />
                </div>
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100/80 text-amber-600 text-xs font-medium">
                  {stats.satisfactionTrend === 'up' ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : stats.satisfactionTrend === 'down' ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : (
                    <Target className="h-3 w-3" />
                  )}
                  <span>{stats.satisfactionTrend === 'up' ? '+0.2' : 'Stable'}</span>
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Satisfaction</p>
                <p className="text-2xl font-bold text-gray-900">{stats.customerSatisfaction}<span className="text-lg text-gray-600">/5</span></p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100/50">
                <div className="flex items-center text-sm">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${
                        i < Math.floor(stats.customerSatisfaction) ? 'text-amber-500 fill-amber-500' : 'text-gray-300'
                      }`} />
                    ))}
                  </div>
                  <span className="ml-2 text-gray-600">94% positive</span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Chats */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-400 to-purple-400 rounded-2xl opacity-0 group-hover:opacity-50 blur transition duration-500"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100">
                  <MessageSquare className="h-6 w-6 text-violet-600" />
                </div>
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-violet-100/80 text-violet-600 text-xs font-medium">
                  <Zap className="h-3 w-3" />
                  <span>Active</span>
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Active Chats</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeChats}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100/50">
                <div className="flex items-center text-sm">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-violet-500 to-purple-500 h-1.5 rounded-full" style={{ 
                      width: `${Math.min((stats.activeChats / 12) * 100, 100)}%` 
                    }}></div>
                  </div>
                  <span className="ml-2 text-gray-600">{Math.round((stats.activeChats / 12) * 100)}% capacity</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Tickets */}
          <div className="bg-gradient-to-br from-white/90 to-blue-50/50 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Active Tickets</h2>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 text-sm bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-700 rounded-lg border border-cyan-200/50 font-medium">
                  All
                </button>
                <button className="px-3 py-1.5 text-sm bg-gradient-to-r from-red-50 to-pink-50 text-red-700 rounded-lg border border-red-200/50 font-medium">
                  High
                </button>
                <button className="px-3 py-1.5 text-sm bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 rounded-lg border border-amber-200/50 font-medium">
                  Medium
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              {tickets.length > 0 ? tickets.slice(0, 5).map((ticket, index) => (
                <div key={index} className="group p-4 bg-gradient-to-r from-white to-gray-50/50 border border-gray-200/50 rounded-xl hover:border-blue-200 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">
                        {ticket.id}
                      </span>
                      <span className={`px-3 py-1 text-xs rounded-full font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">{formatTimeAgo(ticket.createdAt)}</span>
                  </div>
                  
                  <div className="mb-3">
                    <h4 className="font-medium text-gray-900 mb-1">{ticket.customer.name}</h4>
                    <p className="text-sm text-gray-600">{ticket.issue}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        {getSourceIcon(ticket.source)}
                        <span>{ticket.source}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        {getCategoryIcon(ticket.category)}
                        <span className="capitalize">{ticket.category}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className={`text-sm font-medium px-3 py-1 rounded-full ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <button className="text-sm text-cyan-600 hover:text-cyan-700 font-medium">
                      Take Action
                    </button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No active tickets</p>
                  <p className="text-sm text-gray-500 mt-1">All caught up!</p>
                </div>
              )}
            </div>
            
            <button className="w-full mt-4 py-3 text-center text-sm font-medium bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 hover:text-cyan-800 hover:from-cyan-100 hover:to-blue-100 rounded-xl border border-cyan-200/50 transition-all duration-300">
              View All Tickets
            </button>
          </div>

          {/* Performance & Tools */}
          <div className="space-y-6">
            {/* Performance Stats */}
            <div className="bg-gradient-to-br from-white/90 to-purple-50/50 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Performance</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="group p-4 bg-gradient-to-br from-white to-gray-50/80 border border-gray-200/50 rounded-xl hover:border-green-200/50 transition-all duration-300">
                  <p className="text-sm text-gray-600 mb-2">First Contact Resolution</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {stats.firstContactResolution}%
                  </p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500 mr-1" />
                    <span className="text-sm text-emerald-600 font-medium">Target: 85%</span>
                  </div>
                </div>
                
                <div className="group p-4 bg-gradient-to-br from-white to-gray-50/80 border border-gray-200/50 rounded-xl hover:border-cyan-200/50 transition-all duration-300">
                  <p className="text-sm text-gray-600 mb-2">Avg. Resolution Time</p>
                  <p className="text-2xl font-bold text-cyan-600">
                    {stats.avgResolutionTime}
                  </p>
                  <div className="flex items-center mt-2">
                    <Clock className="h-4 w-4 text-cyan-500 mr-1" />
                    <span className="text-sm text-cyan-600 font-medium">Target: 2h</span>
                  </div>
                </div>
              </div>
              
              {/* Top Issues */}
              <div className="mt-6 pt-4 border-t border-gray-200/50">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Top Issues This Week</h3>
                <div className="space-y-2">
                  {stats.topIssues.map((issue, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">{issue.category}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full" style={{ 
                            width: `${(issue.count / Math.max(stats.openTickets, 1)) * 100}%` 
                          }}></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{issue.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Tools */}
            <div className="bg-gradient-to-br from-white/90 to-cyan-50/50 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <button className="group flex flex-col items-center justify-center p-4 bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200/50 hover:border-cyan-300/50 hover:from-cyan-100 hover:to-blue-100 rounded-xl transition-all duration-300">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-100 to-blue-100 mb-2">
                    <MessageSquare className="h-6 w-6 text-cyan-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">New Chat</span>
                  <span className="text-xs text-gray-600">Start support chat</span>
                </button>
                
                <button className="group flex flex-col items-center justify-center p-4 bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200/50 hover:border-emerald-300/50 hover:from-emerald-100 hover:to-green-100 rounded-xl transition-all duration-300">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-100 to-green-100 mb-2">
                    <Phone className="h-6 w-6 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Make Call</span>
                  <span className="text-xs text-gray-600">Call customer</span>
                </button>
                
                <button className="group flex flex-col items-center justify-center p-4 bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200/50 hover:border-violet-300/50 hover:from-violet-100 hover:to-purple-100 rounded-xl transition-all duration-300">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 mb-2">
                    <Mail className="h-6 w-6 text-violet-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Send Email</span>
                  <span className="text-xs text-gray-600">Compose email</span>
                </button>
                
                <button className="group flex flex-col items-center justify-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50 hover:border-amber-300/50 hover:from-amber-100 hover:to-orange-100 rounded-xl transition-all duration-300">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 mb-2">
                    <FileText className="h-6 w-6 text-amber-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Add Note</span>
                  <span className="text-xs text-gray-600">Update ticket</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Customer Feedback */}
        <div className="bg-gradient-to-br from-white/90 to-amber-50/30 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Customer Feedback</h2>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-rose-500" />
              <span className="text-sm text-rose-700 font-medium">{stats.customerSatisfaction}/5 Avg Rating</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentFeedback.length > 0 ? recentFeedback.map((feedback, index) => (
              <div key={index} className="group p-4 bg-gradient-to-br from-white to-gray-50/50 border border-gray-200/50 rounded-xl hover:border-amber-200/50 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${
                      feedback.rating >= 4 ? 'from-emerald-400 to-green-500' :
                      feedback.rating >= 3 ? 'from-amber-400 to-orange-500' :
                      'from-rose-400 to-pink-500'
                    } flex items-center justify-center`}>
                      <span className="text-white font-semibold text-sm">
                        {feedback.customerName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{feedback.customerName}</h4>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${
                            i < feedback.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'
                          }`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500 bg-gray-100/50 px-2 py-1 rounded-full">
                    {formatTimeAgo(feedback.date)}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600">{feedback.comment}</p>
                
                {feedback.agent && (
                  <div className="mt-3 pt-3 border-t border-gray-200/50">
                    <div className="flex items-center text-sm text-gray-500">
                      <User className="h-3 w-3 mr-1" />
                      <span>Agent: {feedback.agent}</span>
                    </div>
                  </div>
                )}
              </div>
            )) : (
              <div className="col-span-3 text-center py-8">
                <ThumbsUp className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No recent feedback</p>
                <p className="text-sm text-gray-500 mt-1">Feedback will appear here</p>
              </div>
            )}
          </div>
          
          {/* Feedback Stats */}
          <div className="mt-6 pt-6 border-t border-gray-200/50">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">
                  94%
                </p>
                <p className="text-sm text-gray-600">Satisfaction Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-cyan-600">
                  82%
                </p>
                <p className="text-sm text-gray-600">Would Recommend</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-violet-600">
                  {stats.avgResponseTime}
                </p>
                <p className="text-sm text-gray-600">Avg. Response Time</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}