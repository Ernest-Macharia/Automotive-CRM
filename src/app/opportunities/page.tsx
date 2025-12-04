'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import CreateOpportunityModal from '@/components/opportunities/CreateOpportunityModal';
import SuccessModal from '@/components/opportunities/SuccessModal';
import { opportunityService, Opportunity, CreateOpportunityData, OpportunitiesResponse, OpportunityStats } from '@/services/opportunityService';
import { useToast } from '@/contexts/ToastContext';
import { useState, useEffect, useRef } from 'react';
import { 
  Plus, Filter, CalendarDays, Search, MoreVertical, Phone, MessageCircle,
  Loader2, RefreshCw, AlertCircle, TrendingUp, TrendingDown, User, Building,
  ChevronLeft, ChevronRight, Briefcase, Car, FileText, DollarSign, Shield,
  Users, Target, BarChart3, Globe, Heart, Zap, Sparkles,
  Eye, Receipt, Wallet, ClipboardList
} from 'lucide-react';

type StageId = 'new' | 'contacted' | 'qualified' | 'quotation' | 'won' | 'lost';

const stages: { id: StageId; label: string; pastelClass: string; borderColor: string }[] = [
  { id: 'new', label: 'New', pastelClass: 'bg-blue-50', borderColor: 'border-blue-200' },
  { id: 'contacted', label: 'Contacted', pastelClass: 'bg-purple-50', borderColor: 'border-purple-200' },
  { id: 'qualified', label: 'Qualified', pastelClass: 'bg-amber-50', borderColor: 'border-amber-200' },
  { id: 'quotation', label: 'Quotation', pastelClass: 'bg-orange-50', borderColor: 'border-orange-200' },
  { id: 'won', label: 'Won', pastelClass: 'bg-green-50', borderColor: 'border-green-200' },
  { id: 'lost', label: 'Lost', pastelClass: 'bg-rose-50', borderColor: 'border-rose-200' },
];

interface OpportunityStatsData {
  totalopportunities: number;
  openopportunities: number;
  closedopportunities: number;
  inProgress: number;
  byType: Array<{
    _id: 'individual' | 'organization' | null;
    count: number;
  }>;
  bySource: Array<{
    _id: string | null;
    count: number;
  }>;
  lastUpdated: string;
}

const getSourceIcon = (source: string | null) => {
  switch (source) {
    case 'walk_in':
      return <Users className="h-3 w-3" />;
    case 'website':
      return <Globe className="h-3 w-3" />;
    case 'referral':
      return <Heart className="h-3 w-3" />;
    case 'manual':
      return <User className="h-3 w-3" />;
    default:
      return <Target className="h-3 w-3" />;
  }
};

const getSourceColor = (source: string | null) => {
  switch (source) {
    case 'walk_in':
      return 'bg-blue-100 text-blue-600';
    case 'website':
      return 'bg-green-100 text-green-600';
    case 'referral':
      return 'bg-purple-100 text-purple-600';
    case 'manual':
      return 'bg-amber-100 text-amber-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

const formatSourceName = (source: string | null) => {
  if (!source) return 'Other';
  return source.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-gray-200" />
        <div className="space-y-2">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-3 w-24 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="h-4 w-8 bg-gray-200 rounded" />
    </div>
    <div className="flex gap-2 mb-3">
      <div className="h-6 w-16 bg-gray-200 rounded-lg" />
      <div className="h-6 w-20 bg-gray-200 rounded-lg" />
    </div>
    <div className="space-y-2 mb-3">
      <div className="h-2 w-full bg-gray-200 rounded" />
      <div className="h-2 w-3/4 bg-gray-200 rounded" />
    </div>
    <div className="flex justify-between">
      <div className="h-3 w-24 bg-gray-200 rounded" />
      <div className="flex gap-1">
        <div className="h-6 w-6 bg-gray-200 rounded-lg" />
        <div className="h-6 w-6 bg-gray-200 rounded-lg" />
      </div>
    </div>
  </div>
);

const SkeletonColumn = () => (
  <div className="w-full md:w-72 lg:w-80 flex flex-col rounded-2xl bg-gray-50 border border-gray-200 p-4 h-auto md:h-[calc(100vh-250px)] min-h-[400px] md:min-h-[500px]">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-gray-300" />
        <div className="h-5 w-24 bg-gray-300 rounded" />
        <div className="h-5 w-5 bg-gray-300 rounded-full" />
      </div>
      <div className="h-4 w-4 bg-gray-300 rounded" />
    </div>
    <div className="h-10 bg-gray-200/50 rounded-xl border border-dashed border-gray-300 mb-4" />
    <div className="space-y-3 flex-1 overflow-y-auto pr-1">
      {[1, 2, 3].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  </div>
);

const SkeletonStats = () => (
  <div className="flex flex-wrap items-center gap-3 mt-6 animate-pulse">
    <div className="h-8 w-24 bg-gray-200 rounded-full" />
    <div className="h-8 w-32 bg-gray-200 rounded-full" />
    <div className="h-8 w-28 bg-gray-200 rounded-full" />
    <div className="h-8 w-32 bg-gray-200 rounded-full" />
    <div className="h-8 w-28 bg-gray-200 rounded-full" />
    <div className="h-8 w-32 bg-gray-200 rounded-full" />
  </div>
);

interface ExtendedOpportunity extends Opportunity {
  invoices?: any[];
  payments?: any[];
  leadScore?: {
    totalScore: number;
    tier: 'hot' | 'warm' | 'cold';
    priority: number;
    lastCalculated: string;
    scoreChange?: number;
  };
}

function OpportunitiesContent() {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [opportunities, setOpportunities] = useState<ExtendedOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<OpportunityStatsData | null>(null);
  const [filter, setFilter] = useState<{ status?: string; tier?: string; source?: string; type?: string }>({});
  const [isDragging, setIsDragging] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const kanbanRef = useRef<HTMLDivElement>(null);
  const [showAllSources, setShowAllSources] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [createdOpportunity, setCreatedOpportunity] = useState<Opportunity | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchOpportunities = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
        setStatsLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      
      const params: any = {};
      if (filter.status) params.status = filter.status;
      if (filter.tier) params.tier = filter.tier;
      if (filter.source) params.source = filter.source;
      if (filter.type) params.type = filter.type;
      if (searchQuery) params.search = searchQuery;
      
      const [opportunitiesResponse, overviewResponse] = await Promise.all([
        opportunityService.getAllOpportunities(params),
        opportunityService.getOpportunitiesOverview()
      ]);
      
      let opportunitiesData: ExtendedOpportunity[] = [];
      
      if (Array.isArray(opportunitiesResponse)) {
        opportunitiesData = opportunitiesResponse as ExtendedOpportunity[];
      } else if (opportunitiesResponse.data && Array.isArray(opportunitiesResponse.data)) {
        opportunitiesData = opportunitiesResponse.data as ExtendedOpportunity[];
      } else if (opportunitiesResponse && typeof opportunitiesResponse === 'object') {
        const response = opportunitiesResponse as OpportunitiesResponse;
        opportunitiesData = response.data as ExtendedOpportunity[];
      } else {
        opportunitiesData = [];
      }
      
      setOpportunities(opportunitiesData);
      
      const statsData = overviewResponse as unknown as OpportunityStatsData;
      setStats(statsData);
      
    } catch (err: any) {
      console.error('Error fetching opportunities:', err);
      setError(err.message || 'Failed to fetch opportunities');
      showToast('Failed to load opportunities', 'error', 3000);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setStatsLoading(false);
    }
  };

  const handleCreateOpportunity = async (formData: any) => {
    try {
      setCreating(true);
      console.log('Form data received:', formData);

      const opportunityData = {
        type: formData.accountType,
        subject: formData.subject,
        status: 'new',
        source: formData.source,
        customer: {
          name: formData.accountType === 'organization' 
            ? formData.companyName 
            : `${formData.firstName} ${formData.lastName}`.trim(),
          ...(formData.email && { email: formData.email }),
          ...(formData.phone && { phone: formData.phone }),
          ...(formData.accountType === 'organization' && formData.companyName && { 
            companyName: formData.companyName 
          }),
        },
        ...(formData.notes && { notes: formData.notes }),
      };

      if (formData.vehicles && formData.vehicles.length > 0) {
        const validVehicles = formData.vehicles.filter((v: any) => 
          v.make.trim() && v.model.trim()
        );
        
        if (validVehicles.length > 0) {
          opportunityData.vehicles = validVehicles.map((v: any) => ({
            ...(v.vin && { vin: v.vin }),
            ...(v.registrationNumber && { registrationNumber: v.registrationNumber }),
            make: v.make,
            model: v.model,
            ...(v.year && { year: v.year }),
            ...(v.color && { color: v.color }),
          }));
        }
      }

      console.log('Sending opportunity data:', JSON.stringify(opportunityData, null, 2));

      const result = await opportunityService.createOpportunity(opportunityData);
      
      console.log('API Response:', result);
      
      setCreatedOpportunity(result);
      setIsCreateModalOpen(false);
      setIsSuccessModalOpen(true);
      
      showToast('Opportunity created successfully!', 'success', 3000);
      
      setTimeout(() => {
        fetchOpportunities();
      }, 1000);
      
    } catch (error: any) {
      console.error('Error creating opportunity:', error);
      
      let errorMessage = 'Failed to create opportunity. ';
      
      if (error.message.includes('Authentication failed')) {
        errorMessage += 'Please log in again.';
      } else if (error.message.includes('Network error')) {
        errorMessage += 'Please check your internet connection.';
      } else if (error.message.includes('API Error')) {
        errorMessage += `Server error: ${error.message}`;
      } else {
        errorMessage += 'Please try again.';
      }
      
      showToast(errorMessage, 'error', 5000);
    } finally {
      setCreating(false);
    }
  };

  const handleViewOpportunityDetails = () => {
    if (createdOpportunity) {
      console.log('Viewing opportunity:', createdOpportunity._id);
      showToast(`Redirecting to opportunity ${createdOpportunity.subject}`, 'info', 2000);
      setIsSuccessModalOpen(false);
    }
  };

  const handleCreateAnother = () => {
    setIsSuccessModalOpen(false);
    setIsCreateModalOpen(true);
  };

  const handleAssignToTeam = () => {
    if (createdOpportunity) {
      console.log('Assigning opportunity to team:', createdOpportunity._id);
      showToast(`Assigning opportunity to team...`, 'info', 2000);
      setIsSuccessModalOpen(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOpportunities();
  };

  const handleStatusChange = async (opportunityId: string, newStatus: StageId) => {
    try {
      await opportunityService.updateOpportunity(opportunityId, { status: newStatus });
      await fetchOpportunities();
      showToast('Opportunity status updated', 'success', 2000);
    } catch (err) {
      console.error('Error updating opportunity status:', err);
      showToast('Failed to update opportunity status', 'error', 3000);
    }
  };

  const handleRecalculateScore = async (opportunityId: string) => {
    try {
      await opportunityService.recalculateLeadScore(opportunityId);
      await fetchOpportunities();
      showToast('Lead score recalculated successfully', 'success', 2000);
    } catch (err) {
      console.error('Error recalculating score:', err);
      showToast('Failed to recalculate lead score', 'error', 3000);
    }
  };

  const getAvatarColor = (type: string, score?: number) => {
    if (type === 'organization') return 'bg-purple-100 text-purple-600';
    if (!score) return 'bg-blue-100 text-blue-600';
    
    if (score >= 70) return 'bg-green-100 text-green-600';
    if (score >= 50) return 'bg-amber-100 text-amber-600';
    return 'bg-blue-100 text-blue-600';
  };

  const getLeadScoreTier = (score?: number) => {
    if (!score) return 'Not Scored';
    if (score >= 70) return 'Hot';
    if (score >= 50) return 'Warm';
    return 'Cold';
  };

  const getStageColor = (stage: StageId) => {
    switch (stage) {
      case 'new': return 'bg-gradient-to-r from-blue-400 to-blue-500';
      case 'contacted': return 'bg-gradient-to-r from-purple-400 to-purple-500';
      case 'qualified': return 'bg-gradient-to-r from-amber-400 to-amber-500';
      case 'quotation': return 'bg-gradient-to-r from-orange-400 to-orange-500';
      case 'won': return 'bg-gradient-to-r from-green-400 to-green-500';
      case 'lost': return 'bg-gradient-to-r from-rose-400 to-rose-500';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      }
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    }
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getChildCounts = (opportunity: ExtendedOpportunity) => {
    return {
      vehicles: opportunity.vehicles?.length || 0,
      jobCards: opportunity.jobCards?.length || 0,
      waivers: opportunity.waivers?.length || 0,
      quotes: opportunity.quotes?.length || 0,
      invoices: opportunity.invoices?.length || 0,
      payments: opportunity.payments?.length || 0
    };
  };

  const calculateLeadScoreStats = () => {
    if (!opportunities.length) return { hot: 0, warm: 0, cold: 0 };
    
    const leadScores = opportunities
      .filter(opp => opp.leadScore?.totalScore)
      .map(opp => opp.leadScore?.totalScore || 0);
    
    const hot = leadScores.filter(score => score >= 70).length;
    const warm = leadScores.filter(score => score >= 50 && score < 70).length;
    const cold = leadScores.filter(score => score < 50).length;
    
    return { hot, warm, cold };
  };

  useEffect(() => {
    const checkScroll = () => {
      if (kanbanRef.current) {
        const needsScroll = kanbanRef.current.scrollWidth > kanbanRef.current.clientWidth;
        setShowScrollButtons(needsScroll);
      }
    };

    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [opportunities]);

  const scrollKanban = (direction: 'left' | 'right') => {
    if (kanbanRef.current) {
      const scrollAmount = 300;
      const newScrollLeft = kanbanRef.current.scrollLeft + 
        (direction === 'left' ? -scrollAmount : scrollAmount);
      
      kanbanRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
      
      setScrolling(true);
      setTimeout(() => setScrolling(false), 300);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [filter]);

  const leadScoreStats = calculateLeadScoreStats();
  const visibleSources = showAllSources 
    ? stats?.bySource || []
    : (stats?.bySource || []).slice(0, 3);

  if (loading && !opportunities.length) {
    return (
      <div className="min-h-screen p-4 md:p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-64 bg-gray-200 rounded" />
        </div>

        <div className="flex flex-col md:flex-row gap-4 animate-pulse">
          <div className="h-10 w-full md:w-96 bg-gray-200 rounded-xl" />
          <div className="flex gap-3">
            <div className="h-10 w-24 bg-gray-200 rounded-xl" />
            <div className="h-10 w-24 bg-gray-200 rounded-xl" />
            <div className="h-10 w-32 bg-gray-200 rounded-xl" />
          </div>
        </div>

        <SkeletonStats />

        <div className="pb-6 relative">
          <div className="kanban-container">
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 pb-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <SkeletonColumn key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Opportunities</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-gray-500 text-sm">
                {statsLoading ? (
                  <span className="inline-flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading stats...
                  </span>
                ) : stats ? (
                  <>
                    {stats.totalopportunities} total opportunities • 
                    <span className="ml-1 text-green-600">{stats.closedopportunities} closed</span> • 
                    <span className="ml-1 text-blue-600">{stats.openopportunities} open</span>
                  </>
                ) : (
                  'Track and manage your leads & deals'
                )}
              </p>
              {refreshing && (
                <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
              )}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative w-full sm:w-auto">
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search opportunities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 w-full"
                    disabled={loading || creating}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || creating}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                    loading || creating
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    'Search'
                  )}
                </button>
              </form>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => fetchOpportunities(true)}
                disabled={refreshing || loading || creating}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors flex-1 sm:flex-none ${
                  refreshing || loading || creating
                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
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
              <button 
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors flex-1 sm:flex-none"
                disabled={loading || creating}
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filter</span>
              </button>
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                disabled={loading || creating}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 text-sm font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Creating...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">New Opportunity</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-300">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Error loading opportunities</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
              <button 
                onClick={() => fetchOpportunities()}
                disabled={loading}
                className="mt-2 text-sm font-medium text-red-700 hover:text-red-800 flex items-center gap-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  'Try again'
                )}
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4 sm:mt-6">
          {statsLoading ? (
            <SkeletonStats />
          ) : stats ? (
            <>
              <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white border border-gray-200 text-xs sm:text-sm text-gray-600 transition-all hover:scale-105">
                <div className="flex items-center gap-1 sm:gap-2">
                  <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Total: {stats.totalopportunities}</span>
                </div>
              </div>
              
              <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white text-xs sm:text-sm font-medium shadow-sm">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Target className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Closed: {stats.closedopportunities}</span>
                </div>
              </div>
              
              <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs sm:text-sm font-medium shadow-sm">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Open: {stats.openopportunities}</span>
                </div>
              </div>
              
              {leadScoreStats.hot > 0 && (
                <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white text-xs sm:text-sm font-medium shadow-sm">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Hot Leads: {leadScoreStats.hot}</span>
                  </div>
                </div>
              )}
              
              {leadScoreStats.warm > 0 && (
                <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs sm:text-sm font-medium shadow-sm">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Target className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Warm Leads: {leadScoreStats.warm}</span>
                  </div>
                </div>
              )}
              
              <select 
                value={filter.status || ''}
                onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value || undefined }))}
                disabled={loading || creating}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white border border-gray-200 text-xs sm:text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all hover:border-blue-300 disabled:opacity-50"
              >
                <option value="">All Status</option>
                {stages.map(stage => (
                  <option key={stage.id} value={stage.id}>{stage.label}</option>
                ))}
              </select>
              
              <select 
                value={filter.type || ''}
                onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value || undefined }))}
                disabled={loading || creating}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white border border-gray-200 text-xs sm:text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all hover:border-blue-300 disabled:opacity-50"
              >
                <option value="">All Types</option>
                {stats.byType.map(type => (
                  <option key={type._id || 'other'} value={type._id || ''}>
                    {type._id ? type._id.charAt(0).toUpperCase() + type._id.slice(1) : 'Other'}
                  </option>
                ))}
              </select>
              
              <select 
                value={filter.source || ''}
                onChange={(e) => setFilter(prev => ({ ...prev, source: e.target.value || undefined }))}
                disabled={loading || creating}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white border border-gray-200 text-xs sm:text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all hover:border-blue-300 disabled:opacity-50"
              >
                <option value="">All Sources</option>
                {stats.bySource.map(source => (
                  <option key={source._id || 'other'} value={source._id || ''}>
                    {formatSourceName(source._id)}
                  </option>
                ))}
              </select>
            </>
          ) : null}
        </div>

        {stats && stats.bySource && stats.bySource.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Sources Breakdown</h3>
              {stats.bySource.length > 3 && (
                <button
                  onClick={() => setShowAllSources(!showAllSources)}
                  className="text-xs text-blue-500 hover:text-blue-600"
                >
                  {showAllSources ? 'Show less' : `Show all ${stats.bySource.length} sources`}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {visibleSources.map((source, index) => (
                <div
                  key={source._id || `source-${index}`}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all hover:scale-105 ${getSourceColor(source._id)}`}
                  title={`${formatSourceName(source._id)}: ${source.count} opportunities`}
                >
                  {getSourceIcon(source._id)}
                  <span>{formatSourceName(source._id)}</span>
                  <span className="ml-1 opacity-75">({source.count})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="pb-6 relative">
        {showScrollButtons && (
          <div className="md:hidden flex justify-center gap-2 mb-4">
            <button
              onClick={() => scrollKanban('left')}
              disabled={scrolling || loading || creating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>
            <button
              onClick={() => scrollKanban('right')}
              disabled={scrolling || loading || creating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-all"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {showScrollButtons && (
          <>
            <button
              onClick={() => scrollKanban('left')}
              disabled={scrolling || loading || creating}
              className="hidden md:block absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 z-10 h-10 w-10 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 transition-all"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => scrollKanban('right')}
              disabled={scrolling || loading || creating}
              className="hidden md:block absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-2 z-10 h-10 w-10 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 transition-all"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </>
        )}

        {loading && opportunities.length > 0 && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-20 flex items-center justify-center rounded-2xl">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-3" />
              <p className="text-gray-600">Updating opportunities...</p>
            </div>
          </div>
        )}

        {isDragging && (
          <div className="absolute inset-0 border-4 border-dashed border-blue-400 bg-blue-50/20 z-10 rounded-2xl flex items-center justify-center pointer-events-none">
            <div className="bg-white px-6 py-4 rounded-xl shadow-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                <span className="font-medium text-blue-600">Drop opportunity here</span>
              </div>
            </div>
          </div>
        )}

        <div 
          ref={kanbanRef}
          className="kanban-container overflow-x-auto scrollbar-hide scroll-smooth pb-4"
          onScroll={() => setScrolling(true)}
        >
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 pb-4 min-w-max">
            {stages.map((stage) => {
              const stageOpportunities = opportunities.filter(opp => opp.status === stage.id);
              
              return (
                <div key={stage.id} className="w-full md:w-72 lg:w-80 flex-shrink-0">
                  <KanbanColumn
                    stage={stage}
                    opportunities={stageOpportunities}
                    onStatusChange={handleStatusChange}
                    onRecalculateScore={handleRecalculateScore}
                    getAvatarColor={getAvatarColor}
                    getLeadScoreTier={getLeadScoreTier}
                    getStageColor={getStageColor}
                    formatDate={formatDate}
                    getChildCounts={getChildCounts}
                    loading={loading || creating}
                    setIsDragging={setIsDragging}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modals remain unchanged */}
      <CreateOpportunityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateOpportunity}
      />

      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        opportunity={createdOpportunity}
        onViewDetails={handleViewOpportunityDetails}
        onCreateAnother={handleCreateAnother}
        onAssignToTeam={handleAssignToTeam}
      />
    </div>
  );
}

function KanbanColumn({
  stage,
  opportunities,
  onStatusChange,
  onRecalculateScore,
  getAvatarColor,
  getLeadScoreTier,
  getStageColor,
  formatDate,
  getChildCounts,
  loading,
  setIsDragging
}: {
  stage: typeof stages[0];
  opportunities: ExtendedOpportunity[];
  onStatusChange: (id: string, status: StageId) => void;
  onRecalculateScore: (id: string) => void;
  getAvatarColor: (type: string, score?: number) => string;
  getLeadScoreTier: (score?: number) => string;
  getStageColor: (stage: StageId) => string;
  formatDate: (date: string) => string;
  getChildCounts: (opp: ExtendedOpportunity) => any;
  loading: boolean;
  setIsDragging: (dragging: boolean) => void;
}) {
  const [dropping, setDropping] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDropping(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDropping(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDropping(false);
    setIsDragging(false);
    
    const opportunityId = e.dataTransfer.getData('opportunityId');
    if (opportunityId) {
      const card = e.currentTarget.querySelector(`[data-id="${opportunityId}"]`);
      if (card) {
        card.classList.add('opacity-50');
      }
      
      await onStatusChange(opportunityId, stage.id);
      
      if (card) {
        card.classList.remove('opacity-50');
      }
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDropping(false);
  };

  return (
    <div 
      className={`flex flex-col rounded-2xl transition-all duration-300 ${
        dropping 
          ? `${stage.pastelClass} border-2 ${stage.borderColor} scale-[1.02] shadow-lg` 
          : `${stage.pastelClass} border ${stage.borderColor}`
      } p-4 h-auto md:h-[calc(100vh-250px)] min-h-[400px] md:min-h-[500px]`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${getStageColor(stage.id)}`} />
          <h3 className="font-semibold text-gray-800">{stage.label}</h3>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-medium text-gray-600 transition-all hover:scale-110">
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              opportunities.length
            )}
          </span>
        </div>
        <button className="p-1 hover:bg-white/50 rounded-lg transition-colors" disabled={loading}>
          <MoreVertical className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      <button 
        className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white/50 py-2.5 text-sm text-gray-500 hover:bg-white hover:border-gray-400 transition-all duration-200 disabled:opacity-50 cursor-not-allowed"
        disabled={true}
        title="Use the main 'New Opportunity' button above"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Add Opportunity</span>
      </button>

      <div className="space-y-3 flex-1 overflow-y-auto pr-1">
        {loading && opportunities.length === 0 ? (
          [1, 2].map((i) => (
            <div key={i} className="opacity-70">
              <SkeletonCard />
            </div>
          ))
        ) : opportunities.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">No opportunities in this stage</div>
            <div className="text-sm text-gray-500">Create opportunities using the button above</div>
          </div>
        ) : (
          opportunities.map((opportunity) => (
            <OpportunityCard
              key={opportunity._id}
              opportunity={opportunity}
              onRecalculateScore={onRecalculateScore}
              getAvatarColor={getAvatarColor}
              getLeadScoreTier={getLeadScoreTier}
              formatDate={formatDate}
              getStageColor={getStageColor}
              getChildCounts={getChildCounts}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
          ))
        )}
      </div>
    </div>
  );
}

function OpportunityCard({
  opportunity,
  onRecalculateScore,
  getAvatarColor,
  getLeadScoreTier,
  formatDate,
  getStageColor,
  getChildCounts,
  onDragStart,
  onDragEnd
}: {
  opportunity: ExtendedOpportunity;
  onRecalculateScore: (id: string) => void;
  getAvatarColor: (type: string, score?: number) => string;
  getLeadScoreTier: (score?: number) => string;
  formatDate: (date: string) => string;
  getStageColor: (stage: StageId) => string;
  getChildCounts: (opp: ExtendedOpportunity) => any;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const [isRecalculating, setIsRecalculating] = useState(false);
  const childCounts = getChildCounts(opportunity);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('opportunityId', opportunity._id);
    onDragStart();
  };

  const handleRecalculateClick = async () => {
    setIsRecalculating(true);
    try {
      await onRecalculateScore(opportunity._id);
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <div 
      data-id={opportunity._id}
      className="group bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-move active:cursor-grabbing hover:-translate-y-0.5"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
    >
      {/* Opportunity Header - Improved spacing */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${getAvatarColor(opportunity.type, opportunity.leadScore?.totalScore)} transition-colors`}>
            {opportunity.type === 'organization' ? (
              <Building className="h-4 w-4" />
            ) : (
              <User className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-gray-800 text-sm truncate" title={opportunity.subject}>
              {opportunity.subject}
            </h4>
            <p className="text-gray-500 text-xs truncate mt-0.5" title={`${opportunity.customer.name}${opportunity.customer.companyName ? ` · ${opportunity.customer.companyName}` : ''}`}>
              {opportunity.customer.name}
              {opportunity.customer.companyName && ` · ${opportunity.customer.companyName}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className={`h-2 w-2 rounded-full ${getStageColor(opportunity.status)}`} />
          {opportunity.leadScore?.totalScore && (
            <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
              {opportunity.leadScore.totalScore}
            </span>
          )}
        </div>
      </div>

      {/* Tags & Score - Better wrapping */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors hover:scale-105 whitespace-nowrap ${
          opportunity.leadScore?.tier === 'hot' ? 'bg-red-100 text-red-600 hover:bg-red-200' :
          opportunity.leadScore?.tier === 'warm' ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' :
          'bg-blue-100 text-blue-600 hover:bg-blue-200'
        }`}>
          {getLeadScoreTier(opportunity.leadScore?.totalScore)}
        </span>
        
        {opportunity.type === 'organization' && (
          <span className="px-2 py-1 rounded-lg bg-purple-50 text-purple-600 text-xs transition-colors hover:bg-purple-100 whitespace-nowrap">
            Organization
          </span>
        )}
        
        {/* Child item counts - Improved layout */}
        <div className="flex items-center gap-1">
          {childCounts.vehicles > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs whitespace-nowrap">
              <Car className="h-3 w-3 flex-shrink-0" />
              {childCounts.vehicles}
            </span>
          )}
          {childCounts.quotes > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 text-green-600 text-xs whitespace-nowrap">
              <FileText className="h-3 w-3 flex-shrink-0" />
              {childCounts.quotes}
            </span>
          )}
          {childCounts.jobCards > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-50 text-orange-600 text-xs whitespace-nowrap">
              <ClipboardList className="h-3 w-3 flex-shrink-0" />
              {childCounts.jobCards}
            </span>
          )}
        </div>
      </div>

      {/* Lead Score Info - Fixed width issues */}
      {opportunity.leadScore && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500 whitespace-nowrap">Lead Score</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700 whitespace-nowrap">
                {opportunity.leadScore.totalScore}
              </span>
              {opportunity.leadScore.scoreChange !== undefined && opportunity.leadScore.scoreChange !== 0 && (
                <span className={`flex items-center gap-0.5 ${opportunity.leadScore.scoreChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {opportunity.leadScore.scoreChange > 0 ? (
                    <TrendingUp className="h-3 w-3 flex-shrink-0" />
                  ) : (
                    <TrendingDown className="h-3 w-3 flex-shrink-0" />
                  )}
                  <span className="text-xs whitespace-nowrap">
                    {Math.abs(opportunity.leadScore.scoreChange)}
                  </span>
                </span>
              )}
            </div>
          </div>
          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                opportunity.leadScore.totalScore >= 70 ? 'bg-green-500' :
                opportunity.leadScore.totalScore >= 50 ? 'bg-amber-500' :
                'bg-blue-500'
              }`}
              style={{ width: `${Math.min(opportunity.leadScore.totalScore, 100)}%` }}
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs mt-1 gap-1">
            <span className="text-gray-400 truncate">
              Priority: {opportunity.leadScore.priority}
            </span>
            <button 
              onClick={handleRecalculateClick}
              disabled={isRecalculating}
              className="text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1 transition-colors disabled:opacity-50 justify-end sm:justify-start"
            >
              {isRecalculating ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />
                  <span className="whitespace-nowrap">Calculating...</span>
                </>
              ) : (
                <span className="whitespace-nowrap">Recalculate</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Child items summary - Better wrapping */}
      {(childCounts.vehicles > 0 || childCounts.jobCards > 0 || childCounts.quotes > 0 || 
        childCounts.invoices > 0 || childCounts.payments > 0) && (
        <div className="flex flex-wrap items-center gap-2 mb-3 text-xs text-gray-500">
          {childCounts.vehicles > 0 && (
            <span className="flex items-center gap-1 whitespace-nowrap">
              <Car className="h-3 w-3 flex-shrink-0" />
              {childCounts.vehicles} vehicle{childCounts.vehicles !== 1 ? 's' : ''}
            </span>
          )}
          {childCounts.jobCards > 0 && (
            <span className="flex items-center gap-1 whitespace-nowrap">
              <Briefcase className="h-3 w-3 flex-shrink-0" />
              {childCounts.jobCards} job{childCounts.jobCards !== 1 ? 's' : ''}
            </span>
          )}
          {childCounts.quotes > 0 && (
            <span className="flex items-center gap-1 whitespace-nowrap">
              <FileText className="h-3 w-3 flex-shrink-0" />
              {childCounts.quotes} quote{childCounts.quotes !== 1 ? 's' : ''}
            </span>
          )}
          {childCounts.invoices > 0 && (
            <span className="flex items-center gap-1 whitespace-nowrap">
              <Receipt className="h-3 w-3 flex-shrink-0" />
              {childCounts.invoices} invoice{childCounts.invoices !== 1 ? 's' : ''}
            </span>
          )}
          {childCounts.payments > 0 && (
            <span className="flex items-center gap-1 whitespace-nowrap">
              <Wallet className="h-3 w-3 flex-shrink-0" />
              {childCounts.payments} payment{childCounts.payments !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* Opportunity Footer - Better spacing */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="text-xs text-gray-500 truncate">
          <span className="font-medium">Updated:</span> {formatDate(opportunity.updatedAt)}
          {opportunity.assignedTo && (
            <span className="ml-1 sm:ml-2">• Assigned</span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button 
            className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 transition-all hover:scale-110"
            title="Call"
          >
            <Phone className="h-4 w-4" />
          </button>
          <button 
            className="p-1.5 hover:bg-green-50 rounded-lg text-green-500 transition-all hover:scale-110"
            title="Message"
          >
            <MessageCircle className="h-4 w-4" />
          </button>
          <button 
            className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-500 transition-all hover:scale-110"
            title="View details"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OpportunitiesPage() {
  return (
    <ProtectedRoute>
      <OpportunitiesContent />
    </ProtectedRoute>
  );
}