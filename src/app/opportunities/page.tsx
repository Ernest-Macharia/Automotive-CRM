'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { opportunityService, Opportunity, FilterParams } from '@/services/opportunityService';
import { useToast } from '@/contexts/ToastContext';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, Filter, CalendarDays, Search, MoreVertical, Phone, MessageCircle,
  Loader2, RefreshCw, AlertCircle, TrendingUp, TrendingDown, User, Building,
  ChevronLeft, ChevronRight, Briefcase, Car, FileText, DollarSign, Shield,
  Users, Target, BarChart3, Globe, Heart, Zap, Sparkles,
  Eye, Receipt, Wallet, ClipboardList, X, ChevronDown, Calendar, Star, Hash,
  Mail, Clock, TrendingUp as TrendingUpIcon, Award, CheckCircle, AlertTriangle,
  Trophy
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

const leadTiers = [
  { id: 'hot', label: 'Hot', color: 'bg-red-100 text-red-600' },
  { id: 'warm', label: 'Warm', color: 'bg-amber-100 text-amber-600' },
  { id: 'cold', label: 'Cold', color: 'bg-blue-100 text-blue-600' },
];

const sources = [
  { id: 'walk_in', label: 'Walk In', icon: Users },
  { id: 'website', label: 'Website', icon: Globe },
  { id: 'referral', label: 'Referral', icon: Heart },
  { id: 'manual', label: 'Manual', icon: User },
  { id: 'phone', label: 'Phone', icon: Phone },
  { id: 'email', label: 'Email', icon: Mail },
];

const opportunityTypes = [
  { id: 'individual', label: 'Individual' },
  { id: 'organization', label: 'Organization' },
];

const sortOptions = [
  { id: 'createdAt:desc', label: 'Newest First' },
  { id: 'createdAt:asc', label: 'Oldest First' },
  { id: 'leadScore.totalScore:desc', label: 'Highest Score' },
  { id: 'leadScore.totalScore:asc', label: 'Lowest Score' },
  { id: 'leadScore.priority:desc', label: 'Highest Priority' },
  { id: 'customer.name:asc', label: 'Customer Name (A-Z)' },
  { id: 'customer.name:desc', label: 'Customer Name (Z-A)' },
  { id: 'updatedAt:desc', label: 'Recently Updated' },
];

const quickFilters = [
  { id: 'hot_leads', label: 'Hot Leads', icon: Zap, color: 'bg-red-500' },
  { id: 'new_web', label: 'New Web Leads', icon: Globe, color: 'bg-blue-500' },
  { id: 'unassigned', label: 'Unassigned', icon: User, color: 'bg-amber-500' },
  { id: 'with_vehicles', label: 'With Vehicles', icon: Car, color: 'bg-green-500' },
  { id: 'this_month', label: 'This Month', icon: Calendar, color: 'bg-purple-500' },
  { id: 'high_priority', label: 'High Priority', icon: Target, color: 'bg-orange-500' },
];

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

const SkeletonCard = () => (
  <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/30 p-4 animate-pulse">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-gray-300/50" />
        <div className="space-y-2">
          <div className="h-4 w-32 bg-gray-300/50 rounded" />
          <div className="h-3 w-24 bg-gray-300/50 rounded" />
        </div>
      </div>
      <div className="h-4 w-8 bg-gray-300/50 rounded" />
    </div>
    <div className="flex gap-2 mb-3">
      <div className="h-6 w-16 bg-gray-300/50 rounded-lg" />
      <div className="h-6 w-20 bg-gray-300/50 rounded-lg" />
    </div>
    <div className="space-y-2 mb-3">
      <div className="h-2 w-full bg-gray-300/50 rounded" />
      <div className="h-2 w-3/4 bg-gray-300/50 rounded" />
    </div>
    <div className="flex justify-between">
      <div className="h-3 w-24 bg-gray-300/50 rounded" />
      <div className="flex gap-1">
        <div className="h-6 w-6 bg-gray-300/50 rounded-lg" />
        <div className="h-6 w-6 bg-gray-300/50 rounded-lg" />
      </div>
    </div>
  </div>
);

const SkeletonColumn = () => (
  <div className="w-full md:w-72 lg:w-80 flex flex-col rounded-2xl bg-gray-50/80 backdrop-blur-sm border border-gray-200/50 p-4 h-auto md:h-[calc(100vh-250px)] min-h-[400px] md:min-h-[500px]">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-gray-400/50" />
        <div className="h-5 w-24 bg-gray-400/50 rounded" />
        <div className="h-5 w-5 bg-gray-400/50 rounded-full" />
      </div>
      <div className="h-4 w-4 bg-gray-400/50 rounded" />
    </div>
    <div className="h-10 bg-gray-300/50 rounded-xl border border-dashed border-gray-400/50 mb-4" />
    <div className="space-y-3 flex-1 overflow-y-auto pr-1">
      {[1, 2, 3].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  </div>
);

function OpportunitiesContent() {
  const { showToast } = useToast();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [opportunities, setOpportunities] = useState<ExtendedOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const kanbanRef = useRef<HTMLDivElement>(null);
  const [creating, setCreating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState<any>(null);
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<FilterParams>({
    status: undefined,
    tier: undefined,
    source: undefined,
    type: undefined,
    search: undefined,
    minScore: undefined,
    maxScore: undefined,
    fromDate: undefined,
    toDate: undefined,
    assignedTo: undefined,
    sort: 'createdAt:desc',
    page: 1,
    limit: 100,
  });
  
  const [advancedFilters, setAdvancedFilters] = useState({
    showAdvanced: false,
    multipleStatuses: [] as string[],
    multipleSources: [] as string[],
    hasVehicles: undefined as boolean | undefined,
    hasQuotes: undefined as boolean | undefined,
    hasJobCards: undefined as boolean | undefined,
    isNurturing: undefined as boolean | undefined,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmedSearch = searchQuery.trim();
      
      if (trimmedSearch.length >= 3 || trimmedSearch.length === 0) {
        setDebouncedSearch(trimmedSearch);
        
        if (trimmedSearch.length >= 3) {
          setSearchLoading(true);
          setFilters(prev => ({ 
            ...prev, 
            search: trimmedSearch,
            page: 1 
          }));
        } else if (trimmedSearch.length === 0 && filters.search) {
          setFilters(prev => ({ 
            ...prev, 
            search: undefined,
            page: 1 
          }));
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, filters.search]);

  const fetchOpportunities = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
        setStatsLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      
      const params: FilterParams = { ...filters };
      
      if (advancedFilters.multipleStatuses.length > 0) {
        params.statuses = advancedFilters.multipleStatuses;
        delete params.status;
      }
      
      if (advancedFilters.multipleSources.length > 0) {
        params.sources = advancedFilters.multipleSources;
        delete params.source;
      }
      
      if (advancedFilters.hasVehicles !== undefined) {
        params.hasVehicles = advancedFilters.hasVehicles;
      }
      
      if (advancedFilters.hasQuotes !== undefined) {
        params.hasQuotes = advancedFilters.hasQuotes;
      }
      
      if (advancedFilters.hasJobCards !== undefined) {
        params.hasJobCards = advancedFilters.hasJobCards;
      }
      
      if (advancedFilters.isNurturing !== undefined) {
        params.isNurturing = advancedFilters.isNurturing;
      }
      
      const response = await opportunityService.getAllOpportunities(params);
      
      setOpportunities(response.data || []);
      setPagination(response.pagination);
      
      if (response.stats) {
        setStats(response.stats);
      }
      
    } catch (err: any) {
      console.error('Error fetching opportunities:', err);
      setError(err.message || 'Failed to fetch opportunities');
      showToast('Failed to load opportunities', 'error', 3000);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setStatsLoading(false);
      setSearchLoading(false);
    }
  }, [filters, advancedFilters, showToast]);

  useEffect(() => {
    if (!activeQuickFilter) {
      fetchOpportunities();
    }
  }, [filters, fetchOpportunities, activeQuickFilter]);

  const fetchOverview = useCallback(async () => {
    try {
      const overview = await opportunityService.getOpportunitiesOverview();
      setStats(overview);
    } catch (err) {
      console.error('Error fetching overview:', err);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSearch = searchQuery.trim();
    
    if (trimmedSearch.length >= 3) {
      setSearchLoading(true);
      setFilters(prev => ({ 
        ...prev, 
        search: trimmedSearch,
        page: 1 
      }));
      setActiveQuickFilter(null);
    } else if (trimmedSearch.length > 0 && trimmedSearch.length < 3) {
      showToast('Please enter at least 3 characters to search', 'info', 2000);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    if (filters.search) {
      setFilters(prev => ({ 
        ...prev, 
        search: undefined,
        page: 1 
      }));
    }
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

  const handleFilterChange = (key: keyof FilterParams, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleMultipleStatusToggle = (status: string) => {
    setAdvancedFilters(prev => {
      const newStatuses = prev.multipleStatuses.includes(status)
        ? prev.multipleStatuses.filter(s => s !== status)
        : [...prev.multipleStatuses, status];
      
      return { ...prev, multipleStatuses: newStatuses };
    });
  };

  const handleMultipleSourceToggle = (source: string) => {
    setAdvancedFilters(prev => {
      const newSources = prev.multipleSources.includes(source)
        ? prev.multipleSources.filter(s => s !== source)
        : [...prev.multipleSources, source];
      
      return { ...prev, multipleSources: newSources };
    });
  };

  const handleQuickFilter = (filterId: string) => {
    setActiveQuickFilter(filterId);
    setFilters({
      status: undefined,
      tier: undefined,
      source: undefined,
      type: undefined,
      search: undefined,
      minScore: undefined,
      maxScore: undefined,
      fromDate: undefined,
      toDate: undefined,
      assignedTo: undefined,
      sort: 'createdAt:desc',
      page: 1,
      limit: 100,
    });
    
    setAdvancedFilters({
      showAdvanced: false,
      multipleStatuses: [],
      multipleSources: [],
      hasVehicles: undefined,
      hasQuotes: undefined,
      hasJobCards: undefined,
      isNurturing: undefined,
    });
    
    switch (filterId) {
      case 'hot_leads':
        opportunityService.getHotLeadsWithHighScores().then(response => {
          setOpportunities(response.data || []);
          setPagination(response.pagination);
          if (response.stats) setStats(response.stats);
        });
        break;
      case 'new_web':
        opportunityService.getNewWebLeads().then(response => {
          setOpportunities(response.data || []);
          setPagination(response.pagination);
          if (response.stats) setStats(response.stats);
        });
        break;
      case 'unassigned':
        opportunityService.getUnassignedNewLeads().then(response => {
          setOpportunities(response.data || []);
          setPagination(response.pagination);
          if (response.stats) setStats(response.stats);
        });
        break;
      case 'with_vehicles':
        opportunityService.getOpportunitiesWithVehicles().then(response => {
          setOpportunities(response.data || []);
          setPagination(response.pagination);
          if (response.stats) setStats(response.stats);
        });
        break;
      case 'this_month':
        opportunityService.getThisMonthsOpportunities().then(response => {
          setOpportunities(response.data || []);
          setPagination(response.pagination);
          if (response.stats) setStats(response.stats);
        });
        break;
      case 'high_priority':
        opportunityService.getHotPriorityOpportunities().then(response => {
          setOpportunities(response.data || []);
          setPagination(response.pagination);
          if (response.stats) setStats(response.stats);
        });
        break;
    }
  };

  const handleClearFilters = () => {
    setFilters({
      status: undefined,
      tier: undefined,
      source: undefined,
      type: undefined,
      search: undefined,
      minScore: undefined,
      maxScore: undefined,
      fromDate: undefined,
      toDate: undefined,
      assignedTo: undefined,
      sort: 'createdAt:desc',
      page: 1,
      limit: 100,
    });
    setAdvancedFilters({
      showAdvanced: false,
      multipleStatuses: [],
      multipleSources: [],
      hasVehicles: undefined,
      hasQuotes: undefined,
      hasJobCards: undefined,
      isNurturing: undefined,
    });
    setSearchQuery('');
    setDebouncedSearch('');
    setActiveQuickFilter(null);
  };

  const applyFilters = () => {
    setActiveQuickFilter(null);
    fetchOpportunities();
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

  const leadScoreStats = calculateLeadScoreStats();
  const hasActiveFilters = filters.status || filters.tier || filters.source || filters.type || 
    filters.minScore || filters.maxScore || filters.fromDate || filters.toDate || 
    filters.assignedTo || advancedFilters.multipleStatuses.length > 0 ||
    advancedFilters.multipleSources.length > 0 || advancedFilters.hasVehicles !== undefined ||
    advancedFilters.hasQuotes !== undefined || advancedFilters.hasJobCards !== undefined ||
    advancedFilters.isNurturing !== undefined;

  const showSearchHelp = useMemo(() => {
    const trimmedSearch = searchQuery.trim();
    return trimmedSearch.length > 0 && trimmedSearch.length < 3;
  }, [searchQuery]);

  if (loading && !opportunities.length) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg" />
        <div className="h-[calc(100vh-64px)] p-4 md:p-6 space-y-6 overflow-auto">
          <div className="flex flex-col md:flex-row gap-4 animate-pulse">
            <div className="h-10 w-full md:w-96 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30" />
            <div className="flex gap-3">
              <div className="h-10 w-24 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30" />
              <div className="h-10 w-24 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30" />
              <div className="h-10 w-32 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30" />
            </div>
          </div>

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
              <Target className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white">Opportunities</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-blue-100 text-sm">
                  {statsLoading ? (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading stats...
                    </span>
                  ) : stats ? (
                    <>
                      {stats.totalopportunities || opportunities.length} total opportunities
                    </>
                  ) : (
                    'Track and manage your leads & deals'
                  )}
                </p>
                {refreshing && (
                  <Loader2 className="h-3 w-3 animate-spin text-blue-200" />
                )}
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => router.push('/opportunities/create')}
            disabled={loading || creating}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium shadow-sm transition-all disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Opportunity</span>
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="h-[calc(100vh-64px)] p-4 md:p-6 space-y-6 overflow-auto">
        {/* Search and Filter Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex-1">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search opportunities, customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 w-full transition-all"
                  disabled={loading || creating}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    disabled={loading || creating}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {showSearchHelp && (
                  <div className="absolute top-full left-0 right-0 mt-1 px-3 py-1.5 bg-amber-50/80 backdrop-blur-sm border border-amber-200/50 rounded-lg text-xs text-amber-700">
                    Type at least 3 characters to search
                  </div>
                )}
              </form>
              {debouncedSearch.length >= 3 && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50/80 backdrop-blur-sm text-blue-600 rounded-lg">
                    <Search className="h-3 w-3" />
                    <span>Searching for: "{debouncedSearch}"</span>
                    <button
                      onClick={handleClearSearch}
                      className="ml-2 text-blue-400 hover:text-blue-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  {searchLoading && (
                    <div className="flex items-center gap-1 text-gray-500">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Searching...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => fetchOpportunities(true)}
                disabled={refreshing || loading || creating}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                  refreshing || loading || creating
                    ? 'border-gray-200/50 bg-gray-50/50 text-gray-400 cursor-not-allowed'
                    : 'border-gray-200 bg-white/50 text-gray-600 hover:bg-white'
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
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-white/50 text-gray-600 hover:bg-white text-sm font-medium transition-colors relative"
                disabled={loading || creating}
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filter</span>
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 rounded-xl bg-red-50/80 backdrop-blur-sm border border-red-200/50 flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-300">
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

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4">
            {quickFilters.map((filter) => {
              const Icon = filter.icon;
              const isActive = activeQuickFilter === filter.id;
              
              return (
                <button
                  key={filter.id}
                  onClick={() => handleQuickFilter(filter.id)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-sm transition-all hover:scale-105 flex items-center gap-1 sm:gap-2 ${
                    isActive 
                      ? `bg-gradient-to-r ${filter.color} text-white` 
                      : 'bg-white/50 border border-gray-200/50 text-gray-600 hover:bg-white'
                  }`}
                >
                  <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>{filter.label}</span>
                </button>
              );
            })}
            
            {hasActiveFilters && (
              <button 
                onClick={handleClearFilters}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gray-100/50 text-gray-600 text-xs sm:text-sm font-medium hover:bg-gray-200/50 transition-all flex items-center gap-1 sm:gap-2"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Clear All</span>
              </button>
            )}
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-800">Advanced Filters</h3>
                <div className="flex items-center gap-2">
                  {searchQuery && (
                    <div className="text-xs text-gray-500">
                      Search: "{searchQuery}"
                    </div>
                  )}
                  <button 
                    onClick={() => setAdvancedFilters(prev => ({ ...prev, showAdvanced: !prev.showAdvanced }))}
                    className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
                  >
                    {advancedFilters.showAdvanced ? 'Show Basic' : 'Show Advanced'}
                    <ChevronDown className={`h-3 w-3 transition-transform ${advancedFilters.showAdvanced ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Basic Filters */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Status</label>
                  <select 
                    value={filters.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                  >
                    <option value="">All Statuses</option>
                    {stages.map(stage => (
                      <option key={stage.id} value={stage.id}>{stage.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Lead Tier</label>
                  <select 
                    value={filters.tier || ''}
                    onChange={(e) => handleFilterChange('tier', e.target.value || undefined)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                  >
                    <option value="">All Tiers</option>
                    {leadTiers.map(tier => (
                      <option key={tier.id} value={tier.id}>{tier.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Source</label>
                  <select 
                    value={filters.source || ''}
                    onChange={(e) => handleFilterChange('source', e.target.value || undefined)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                  >
                    <option value="">All Sources</option>
                    {sources.map(source => {
                      const Icon = source.icon;
                      return (
                        <option key={source.id} value={source.id}>
                          {source.label}
                        </option>
                      );
                    })}
                </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Sort By</label>
                  <select 
                    value={filters.sort || 'createdAt:desc'}
                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                  >
                    {sortOptions.map(option => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                </div>
                
                {/* Advanced Filters */}
                {advancedFilters.showAdvanced && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">Date From</label>
                      <input
                        type="date"
                        value={filters.fromDate || ''}
                        onChange={(e) => handleFilterChange('fromDate', e.target.value || undefined)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">Date To</label>
                      <input
                        type="date"
                        value={filters.toDate || ''}
                        onChange={(e) => handleFilterChange('toDate', e.target.value || undefined)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">Min Score</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={filters.minScore || ''}
                        onChange={(e) => handleFilterChange('minScore', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                        placeholder="0"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">Max Score</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={filters.maxScore || ''}
                        onChange={(e) => handleFilterChange('maxScore', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                        placeholder="100"
                      />
                    </div>
                    
                    {/* Multiple Statuses */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-2">Multiple Statuses</label>
                      <div className="flex flex-wrap gap-2">
                        {stages.map(stage => (
                          <button
                            key={stage.id}
                            type="button"
                            onClick={() => handleMultipleStatusToggle(stage.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              advancedFilters.multipleStatuses.includes(stage.id)
                                ? 'bg-blue-100/80 text-blue-600 border border-blue-200/50'
                                : 'bg-gray-100/50 text-gray-600 hover:bg-gray-200/50'
                            }`}
                          >
                            {stage.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Multiple Sources */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-2">Multiple Sources</label>
                      <div className="flex flex-wrap gap-2">
                        {sources.map(source => (
                          <button
                            key={source.id}
                            type="button"
                            onClick={() => handleMultipleSourceToggle(source.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              advancedFilters.multipleSources.includes(source.id)
                                ? 'bg-green-100/80 text-green-600 border border-green-200/50'
                                : 'bg-gray-100/50 text-gray-600 hover:bg-gray-200/50'
                            }`}
                          >
                            {source.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Boolean Filters */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-2">Additional Filters</label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setAdvancedFilters(prev => ({ 
                            ...prev, 
                            hasVehicles: prev.hasVehicles === true ? undefined : true 
                          }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            advancedFilters.hasVehicles === true
                              ? 'bg-blue-100/80 text-blue-600 border border-blue-200/50'
                              : 'bg-gray-100/50 text-gray-600 hover:bg-gray-200/50'
                          }`}
                        >
                          Has Vehicles
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdvancedFilters(prev => ({ 
                            ...prev, 
                            hasQuotes: prev.hasQuotes === true ? undefined : true 
                          }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            advancedFilters.hasQuotes === true
                              ? 'bg-green-100/80 text-green-600 border border-green-200/50'
                              : 'bg-gray-100/50 text-gray-600 hover:bg-gray-200/50'
                          }`}
                        >
                          Has Quotes
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdvancedFilters(prev => ({ 
                            ...prev, 
                            isNurturing: prev.isNurturing === true ? undefined : true 
                          }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            advancedFilters.isNurturing === true
                              ? 'bg-purple-100/80 text-purple-600 border border-purple-200/50'
                              : 'bg-gray-100/50 text-gray-600 hover:bg-gray-200/50'
                          }`}
                        >
                          Is Nurturing
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200/50 flex items-center gap-2">
                <button
                  onClick={applyFilters}
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all"
                >
                  Apply Filters
                </button>
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 bg-gray-200/50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300/50 transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-4 py-2 bg-transparent text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100/50 ml-auto"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50/50 to-blue-100/30">
              <div className="p-2 rounded-lg bg-blue-100/50">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Leads</p>
                <p className="text-lg font-bold text-gray-900">{opportunities.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-green-50/50 to-green-100/30">
              <div className="p-2 rounded-lg bg-green-100/50">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Hot Leads</p>
                <p className="text-lg font-bold text-gray-900">{leadScoreStats.hot}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-50/50 to-amber-100/30">
              <div className="p-2 rounded-lg bg-amber-100/50">
                <Briefcase className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Deals</p>
                <p className="text-lg font-bold text-gray-900">
                  {opportunities.filter(o => !['won', 'lost'].includes(o.status)).length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-50/50 to-purple-100/30">
              <div className="p-2 rounded-lg bg-purple-100/50">
                <Trophy className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Win Rate</p>
                <p className="text-lg font-bold text-gray-900">
                  {opportunities.length > 0 
                    ? Math.round((opportunities.filter(o => o.status === 'won').length / opportunities.length) * 100)
                    : 0
                  }%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="pb-6 relative">
          {/* Mobile scroll buttons */}
          {showScrollButtons && (
            <div className="md:hidden flex justify-center gap-2 mb-4">
              <button
                onClick={() => scrollKanban('left')}
                disabled={scrolling || loading || creating}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:bg-white disabled:opacity-50 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </button>
              <button
                onClick={() => scrollKanban('right')}
                disabled={scrolling || loading || creating}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:bg-white disabled:opacity-50 transition-all"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Desktop scroll buttons */}
          {showScrollButtons && (
            <>
              <button
                onClick={() => scrollKanban('left')}
                disabled={scrolling || loading || creating}
                className="hidden md:block absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 z-10 h-10 w-10 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-full shadow-lg flex items-center justify-center hover:bg-white disabled:opacity-50 transition-all"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={() => scrollKanban('right')}
                disabled={scrolling || loading || creating}
                className="hidden md:block absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-2 z-10 h-10 w-10 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-full shadow-lg flex items-center justify-center hover:bg-white disabled:opacity-50 transition-all"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </>
          )}

          {loading && opportunities.length > 0 && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-20 flex items-center justify-center rounded-2xl">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-3" />
                <p className="text-gray-600">Updating opportunities...</p>
              </div>
            </div>
          )}

          {isDragging && (
            <div className="absolute inset-0 border-4 border-dashed border-blue-400 bg-blue-50/20 z-10 rounded-2xl flex items-center justify-center pointer-events-none">
              <div className="bg-white/80 backdrop-blur-sm px-6 py-4 rounded-xl shadow-lg border border-blue-200/50">
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
          
          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Showing {opportunities.length} of {pagination.total} opportunities
                {pagination.page && pagination.totalPages && (
                  <span> (Page {pagination.page} of {pagination.totalPages})</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleFilterChange('page', Math.max(1, (pagination.page || 1) - 1))}
                  disabled={!pagination.page || pagination.page <= 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200/50 bg-white/50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {(() => {
                    if (!pagination.totalPages) return null;
                    
                    const pages = [];
                    const currentPage = pagination.page || 1;
                    const totalPages = pagination.totalPages;
                    
                    if (totalPages <= 5) {
                      for (let i = 1; i <= totalPages; i++) {
                        pages.push(i);
                      }
                    } else {
                      pages.push(1);
                      if (currentPage > 3) pages.push('...');
                      
                      const start = Math.max(2, currentPage - 1);
                      const end = Math.min(totalPages - 1, currentPage + 1);
                      
                      for (let i = start; i <= end; i++) {
                        if (!pages.includes(i)) pages.push(i);
                      }
                      
                      if (currentPage < totalPages - 2) pages.push('...');
                      pages.push(totalPages);
                    }
                    
                    return pages.map((pageNum, index) => (
                      pageNum === '...' ? (
                        <span key={`ellipsis-${index}`} className="px-2 text-gray-400">...</span>
                      ) : (
                        <button
                          key={pageNum}
                          onClick={() => handleFilterChange('page', pageNum)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                            currentPage === pageNum
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm'
                              : 'border border-gray-200/50 bg-white/50 text-gray-600 hover:bg-white hover:border-gray-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    ));
                  })()}
                </div>
                <button
                  onClick={() => handleFilterChange('page', Math.min(pagination.totalPages || 1, (pagination.page || 1) + 1))}
                  disabled={!pagination.page || pagination.page >= pagination.totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-200/50 bg-white/50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
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
  const router = useRouter();
  const [isRecalculating, setIsRecalculating] = useState(false);
  const childCounts = getChildCounts(opportunity);

  const handleClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    // Navigate to your details page - using the id as a query parameter
    router.push(`/opportunities/details?id=${opportunity._id}`);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('opportunityId', opportunity._id);
    onDragStart();
  };

  const handleRecalculateClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRecalculating(true);
    try {
      await onRecalculateScore(opportunity._id);
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleActionButtonClick = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    // Handle different actions here
    switch (action) {
      case 'call':
        console.log('Call customer:', opportunity.customer.phone);
        break;
      case 'message':
        console.log('Message customer');
        break;
      case 'view':
        handleClick(e);
        break;
    }
  };

  return (
    <div 
      data-id={opportunity._id}
      className="group bg-white/80 backdrop-blur-sm rounded-xl border border-white/30 p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onClick={handleClick}
    >
      {/* Opportunity Header */}
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
            <p className="text-gray-600 text-xs truncate mt-0.5" title={`${opportunity.customer.name}${opportunity.customer.companyName ? ` · ${opportunity.customer.companyName}` : ''}`}>
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

      {/* Tags & Score */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors hover:scale-105 whitespace-nowrap ${
          opportunity.leadScore?.tier === 'hot' ? 'bg-red-100/80 text-red-600 hover:bg-red-200' :
          opportunity.leadScore?.tier === 'warm' ? 'bg-amber-100/80 text-amber-600 hover:bg-amber-200' :
          'bg-blue-100/80 text-blue-600 hover:bg-blue-200'
        }`}>
          {getLeadScoreTier(opportunity.leadScore?.totalScore)}
        </span>
        
        {opportunity.type === 'organization' && (
          <span className="px-2 py-1 rounded-lg bg-purple-50/80 text-purple-600 text-xs transition-colors hover:bg-purple-100/80 whitespace-nowrap">
            Organization
          </span>
        )}
        
        {/* Child item counts */}
        <div className="flex items-center gap-1">
          {childCounts.vehicles > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50/80 text-blue-600 text-xs whitespace-nowrap">
              <Car className="h-3 w-3 flex-shrink-0" />
              {childCounts.vehicles}
            </span>
          )}
          {childCounts.quotes > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50/80 text-green-600 text-xs whitespace-nowrap">
              <FileText className="h-3 w-3 flex-shrink-0" />
              {childCounts.quotes}
            </span>
          )}
          {childCounts.jobCards > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-50/80 text-orange-600 text-xs whitespace-nowrap">
              <ClipboardList className="h-3 w-3 flex-shrink-0" />
              {childCounts.jobCards}
            </span>
          )}
        </div>
      </div>

      {/* Lead Score Info */}
      {opportunity.leadScore && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-600 whitespace-nowrap">Lead Score</span>
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
          <div className="h-1.5 w-full bg-gray-200/50 rounded-full overflow-hidden">
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
            <span className="text-gray-500 truncate">
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

      {/* Child items summary */}
      {(childCounts.vehicles > 0 || childCounts.jobCards > 0 || childCounts.quotes > 0 || 
        childCounts.invoices > 0 || childCounts.payments > 0) && (
        <div className="flex flex-wrap items-center gap-2 mb-3 text-xs text-gray-600">
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

      {/* Opportunity Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="text-xs text-gray-600 truncate">
          <span className="font-medium">Updated:</span> {formatDate(opportunity.updatedAt)}
          {opportunity.assignedTo && (
            <span className="ml-1 sm:ml-2">• Assigned</span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button 
            onClick={(e) => handleActionButtonClick(e, 'call')}
            className="p-1.5 hover:bg-blue-50/50 rounded-lg text-blue-500 transition-all hover:scale-110"
            title="Call"
          >
            <Phone className="h-4 w-4" />
          </button>
          <button 
            onClick={(e) => handleActionButtonClick(e, 'message')}
            className="p-1.5 hover:bg-green-50/50 rounded-lg text-green-500 transition-all hover:scale-110"
            title="Message"
          >
            <MessageCircle className="h-4 w-4" />
          </button>
          <button 
            onClick={(e) => handleActionButtonClick(e, 'view')}
            className="p-1.5 hover:bg-gray-50/50 rounded-lg text-gray-500 transition-all hover:scale-110"
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