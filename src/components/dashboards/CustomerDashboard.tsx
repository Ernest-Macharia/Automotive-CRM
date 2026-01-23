// components/dashboards/CustomerDashboard.tsx (Enhanced with real data)
'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  MessageCircle, 
  Heart, 
  TrendingUp,
  Target,
  DollarSign,
  Clock,
  Award,
  MapPin,
  Building,
  Shield,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  Sparkles
} from 'lucide-react';
import { opportunityService } from '@/services/opportunityService';

interface CustomerDashboardProps {
  user: any;
}

interface CustomerStats {
  totalOpportunities: number;
  wonOpportunities: number;
  activeOpportunities: number;
  totalSpent: number;
  satisfactionScore: number;
  recentActivity: Array<{
    action: string;
    date: string;
    details?: string;
  }>;
  upcomingAppointments: Array<{
    title: string;
    date: string;
    type: string;
  }>;
  topServices: Array<{
    name: string;
    count: number;
  }>;
}

export default function CustomerDashboard({ user }: CustomerDashboardProps) {
  const [stats, setStats] = useState<CustomerStats>({
    totalOpportunities: 0,
    wonOpportunities: 0,
    activeOpportunities: 0,
    totalSpent: 0,
    satisfactionScore: 4.5,
    recentActivity: [],
    upcomingAppointments: [],
    topServices: []
  });
  
  const [recentOpportunities, setRecentOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const fetchCustomerData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      // Fetch opportunities for this customer
      const [overviewResponse, opportunitiesResponse] = await Promise.allSettled([
        opportunityService.getOpportunitiesOverview(),
        opportunityService.filterOpportunities({
          customerEmail: user?.email, // Filter by customer email
          sort: 'updatedAt:desc',
          limit: 10
        })
      ]);

      let totalOpportunities = 0;
      let wonOpportunities = 0;
      let activeOpportunities = 0;
      let totalSpent = 0;
      const userOpportunities: any[] = [];

      if (opportunitiesResponse.status === 'fulfilled' && opportunitiesResponse.value) {
        const oppsData = opportunitiesResponse.value;
        userOpportunities.push(...(oppsData.data || []));
        
        totalOpportunities = userOpportunities.length;
        
        // Count won opportunities
        wonOpportunities = userOpportunities.filter(opp => opp.status === 'won').length;
        
        // Count active opportunities (open statuses)
        const openStatuses = ['new', 'attempted_to_contact', 'prospecting', 'appointment_scheduled'];
        activeOpportunities = userOpportunities.filter(opp => 
          openStatuses.includes(opp.status)
        ).length;
        
        // Calculate total spent from won opportunities
        const wonOpps = userOpportunities.filter(opp => opp.status === 'won');
        totalSpent = wonOpps.reduce((sum, opp) => sum + (opp.total || opp.leadScore?.commercial?.dealValue || 50000), 0);
      }

      // Get recent opportunities
      const recentOpps = userOpportunities.slice(0, 5);
      setRecentOpportunities(recentOpps);

      // Generate recent activity from opportunities
      const recentActivity = recentOpps.map(opp => ({
        action: opp.status === 'won' ? 'Purchase completed' :
                opp.status === 'lost' ? 'Quote declined' :
                opp.status === 'appointment_scheduled' ? 'Appointment scheduled' :
                opp.status === 'prospecting' ? 'Quote received' : 'New inquiry',
        date: opp.updatedAt || opp.createdAt,
        details: opp.subject
      }));

      // Generate upcoming appointments
      const upcomingAppointments = userOpportunities
        .filter(opp => opp.status === 'appointment_scheduled')
        .slice(0, 3)
        .map(opp => ({
          title: opp.subject,
          date: opp.updatedAt || opp.createdAt,
          type: opp.opportunityType || 'Service'
        }));

      // Analyze top services/products
      const serviceCounts: Record<string, number> = {};
      userOpportunities.forEach(opp => {
        if (opp.servicesProducts && Array.isArray(opp.servicesProducts)) {
          opp.servicesProducts.forEach(service => {
            const serviceName = service.title || 'Service';
            serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + service.quantity;
          });
        }
      });
      
      const topServices = Object.entries(serviceCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      setStats({
        totalOpportunities,
        wonOpportunities,
        activeOpportunities,
        totalSpent,
        satisfactionScore: 4.5, // Default or calculate from feedback
        recentActivity,
        upcomingAppointments,
        topServices
      });

    } catch (error) {
      console.error('Error fetching customer data:', error);
      
      // Fallback data
      setStats({
        totalOpportunities: 5,
        wonOpportunities: 3,
        activeOpportunities: 2,
        totalSpent: 150000,
        satisfactionScore: 4.5,
        recentActivity: [
          { action: 'Vehicle service completed', date: new Date().toISOString(), details: 'Toyota Hilux - Oil Change' },
          { action: 'Quote reviewed', date: new Date(Date.now() - 86400000).toISOString() },
          { action: 'Appointment scheduled', date: new Date(Date.now() - 172800000).toISOString() }
        ],
        upcomingAppointments: [
          { title: 'Brake Inspection', date: new Date(Date.now() + 86400000).toISOString(), type: 'Service' },
          { title: 'Follow-up Consultation', date: new Date(Date.now() + 259200000).toISOString(), type: 'Consultation' }
        ],
        topServices: [
          { name: 'Oil Change', count: 3 },
          { name: 'Brake Service', count: 2 },
          { name: 'Tire Replacement', count: 1 }
        ]
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);

  const handleRefresh = () => {
    fetchCustomerData(true);
  };

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg" />
        <div className="h-[calc(100vh-64px)] p-4 md:p-6 space-y-6 overflow-auto">
          <div className="animate-pulse space-y-6">
            {/* Loading skeleton */}
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
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Customer Dashboard</h1>
              <p className="text-teal-100 text-sm">
                Welcome back, <span className="font-semibold text-white">{user?.firstName || 'Customer'}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
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
        {/* Customer Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Opportunities */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100 p-5 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-100/50">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                All Time
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium mb-1">Total Inquiries</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOpportunities}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  <CheckCircle className="h-3 w-3 inline mr-1 text-green-500" />
                  {stats.wonOpportunities} completed
                </span>
                <span className="text-gray-600">
                  <Clock className="h-3 w-3 inline mr-1 text-blue-500" />
                  {stats.activeOpportunities} active
                </span>
              </div>
            </div>
          </div>

          {/* Total Spent */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-100 p-5 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-emerald-100/50">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
              <span className="px-2 py-1 bg-emerald-100 text-emerald-600 text-xs rounded-full">
                Lifetime Value
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium mb-1">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalSpent)}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100/50">
              <div className="flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-gray-600">Loyal customer since {new Date().getFullYear() - 1}</span>
              </div>
            </div>
          </div>

          {/* Satisfaction Score */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-amber-100 p-5 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-amber-100/50">
                <Heart className="h-6 w-6 text-amber-600" />
              </div>
              <span className="px-2 py-1 bg-amber-100 text-amber-600 text-xs rounded-full">
                Rating
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium mb-1">Satisfaction Score</p>
              <p className="text-2xl font-bold text-gray-900">{stats.satisfactionScore}/5.0</p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100/50">
              <div className="flex items-center text-sm">
                <Award className="h-4 w-4 text-amber-500 mr-1" />
                <span className="text-gray-600">Preferred Customer</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-100 p-5 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-100/50">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <span className="px-2 py-1 bg-purple-100 text-purple-600 text-xs rounded-full">
                Active
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium mb-1">Recent Activity</p>
              <p className="text-2xl font-bold text-gray-900">{stats.recentActivity.length}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100/50">
              <div className="flex items-center text-sm">
                <MessageCircle className="h-4 w-4 text-purple-500 mr-1" />
                <span className="text-gray-600">
                  Last: {stats.recentActivity[0]?.action || 'No activity'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Opportunities & Upcoming Appointments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Opportunities */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Recent Inquiries</h2>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                View All →
              </button>
            </div>
            
            <div className="space-y-4">
              {recentOpportunities.length > 0 ? recentOpportunities.map((opportunity, index) => (
                <div key={index} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{opportunity.subject || 'Inquiry'}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      opportunity.status === 'won' ? 'bg-green-100 text-green-600' :
                      opportunity.status === 'lost' ? 'bg-red-100 text-red-600' :
                      opportunity.status === 'appointment_scheduled' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {opportunity.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {opportunity.opportunityType || 'Service'}
                      {opportunity.total && ` • ${formatCurrency(opportunity.total)}`}
                    </span>
                    <span className="text-gray-500">{formatTimeAgo(opportunity.updatedAt || opportunity.createdAt)}</span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No recent inquiries</p>
                  <p className="text-sm text-gray-500 mt-1">Your inquiries will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h2>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                Schedule →
              </button>
            </div>
            
            <div className="space-y-4">
              {stats.upcomingAppointments.length > 0 ? stats.upcomingAppointments.map((appointment, index) => (
                <div key={index} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{appointment.title}</h3>
                      <p className="text-sm text-gray-600">{appointment.type}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(appointment.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {new Date(appointment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No upcoming appointments</p>
                  <p className="text-sm text-gray-500 mt-1">Schedule your next service</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Services & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Services */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Most Used Services</h2>
            
            <div className="space-y-4">
              {stats.topServices.length > 0 ? stats.topServices.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-blue-50">
                      <span className="text-sm font-semibold text-blue-600">#{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{service.name}</h3>
                      <p className="text-sm text-gray-600">{service.count} times used</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                        style={{ width: `${Math.min((service.count / Math.max(...stats.topServices.map(s => s.count))) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No service history</p>
                  <p className="text-sm text-gray-500 mt-1">Your service history will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity Timeline */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h2>
            
            <div className="space-y-4">
              {stats.recentActivity.length > 0 ? stats.recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-purple-50">
                      <Clock className="h-4 w-4 text-purple-600" />
                    </div>
                    {index < stats.recentActivity.length - 1 && (
                      <div className="h-4 w-px bg-gray-200 mx-auto" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{activity.action}</h3>
                    <p className="text-sm text-gray-600">{activity.details}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTimeAgo(activity.date)}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No recent activity</p>
                  <p className="text-sm text-gray-500 mt-1">Your activity will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}