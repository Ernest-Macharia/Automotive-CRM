'use client';

import { opportunityService, Opportunity, FilterParams, FilteredStats, ZohoOpportunityRecord } from '@/services/opportunityService';
import { useToast } from '@/contexts/ToastContext';
import { useState, useEffect, useRef, useCallback, useMemo, memo, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import { 
  Plus, Filter, CalendarDays, Search, MoreVertical, Phone, MessageCircle,
  Loader2, RefreshCw, AlertCircle, TrendingUp, TrendingDown, User, Building,
  ChevronLeft, ChevronRight, Briefcase, Car, FileText, DollarSign, Shield,
  Users, Target, BarChart3, Globe, Heart, Zap, Sparkles,
  Eye, Receipt, Wallet, ClipboardList, X, ChevronDown, Calendar, Star, Hash,
  Mail, Clock, TrendingUp as TrendingUpIcon, Award, CheckCircle, AlertTriangle,
  Trophy, Upload
} from 'lucide-react';
import ConfirmationModal from '@/components/opportunities/ConfirmationModal';
import { useOpportunityStatusUpdate } from '@/hooks/useOpportunityStatusUpdate';
import { OrganizationError } from '@/services/settings/organizationService';

type StageId = 'new' | 'attempted_to_contact' | 'prospecting' | 'appointment_scheduled' | 'non_progressive' | 'lost' | 'won';
type OpportunityStatusUpdateDetail = {
  opportunityId: string;
  newStatus: string;
  updatedAt?: string;
};

const stages: { id: StageId; label: string; pastelClass: string; borderColor: string }[] = [
  { 
    id: 'new', 
    label: 'New', 
    pastelClass: 'bg-blue-50/80 backdrop-blur-sm', 
    borderColor: 'border-blue-100' 
  },
  { 
    id: 'attempted_to_contact', 
    label: 'Attempted to Contact', 
    pastelClass: 'bg-indigo-50/80 backdrop-blur-sm', 
    borderColor: 'border-indigo-100' 
  },
  { 
    id: 'prospecting', 
    label: 'Prospecting', 
    pastelClass: 'bg-violet-50/80 backdrop-blur-sm', 
    borderColor: 'border-violet-100' 
  },
  { 
    id: 'appointment_scheduled', 
    label: 'Appointment Scheduled', 
    pastelClass: 'bg-purple-50/80 backdrop-blur-sm', 
    borderColor: 'border-purple-100' 
  },
  { 
    id: 'non_progressive', 
    label: 'Non Progressive', 
    pastelClass: 'bg-slate-50/80 backdrop-blur-sm', 
    borderColor: 'border-slate-100' 
  },
  { 
    id: 'lost', 
    label: 'Lost', 
    pastelClass: 'bg-rose-50/80 backdrop-blur-sm', 
    borderColor: 'border-rose-100' 
  },
  {
    id: 'won',
    label: 'Won',
    pastelClass: 'bg-emerald-50/80 backdrop-blur-sm',
    borderColor: 'border-emerald-100'
  },
];

const normalizeOpportunityStatus = (value?: string): StageId => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

  const compact = normalized.replace(/\s+/g, '');
  const statusMap: Record<string, StageId> = {
    new: 'new',
    open: 'new',
    attemptedtocontact: 'attempted_to_contact',
    attemptedcontact: 'attempted_to_contact',
    contacted: 'attempted_to_contact',
    prospecting: 'prospecting',
    appointmentscheduled: 'appointment_scheduled',
    scheduled: 'appointment_scheduled',
    nonprogressive: 'non_progressive',
    dormant: 'non_progressive',
    stalled: 'non_progressive',
    lost: 'lost',
    closedlost: 'lost',
    won: 'won',
    closedwon: 'won',
    closed: 'won',
  };

  return statusMap[compact] || 'new';
};

const resolveOpportunityStage = (opportunity: Partial<ExtendedOpportunity> | undefined): StageId => {
  return normalizeOpportunityStatus(
    opportunity?.status ||
    opportunity?.currentStage ||
    ''
  );
};

const normalizeSearchPhone = (value?: string): string | undefined => {
  const digits = String(value || '').replace(/\D+/g, '');
  return digits.length >= 7 ? digits : undefined;
};

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

const useColumnInfiniteScroll = (
  containerRef: React.RefObject<HTMLDivElement>,
  fetchMore: () => Promise<void>
) => {
  const [loading, setLoading] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef(false); // Prevent duplicate fetches
  const [showLoading, setShowLoading] = useState(false); 

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Debounce the scroll handler
      scrollTimeoutRef.current = setTimeout(() => {
        const { scrollTop, scrollHeight, clientHeight } = container;
        
        // Load more when user is near the bottom (100px from bottom)
        if (scrollTop + clientHeight >= scrollHeight - 100 && !loading && !isFetchingRef.current) {
          isFetchingRef.current = true;
          setLoading(true);
          setTimeout(() => setShowLoading(true), 300);
          fetchMore()
            .catch(error => {
              console.error('Error loading more opportunities:', error);
            })
            .finally(() => {
              setLoading(false);
              setShowLoading(false);
              isFetchingRef.current = false;
            });
        }
      }, 150);
    };

    container.addEventListener('scroll', handleScroll);
    
    // Cleanup
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      container.removeEventListener('scroll', handleScroll);
      isFetchingRef.current = false; // Reset on unmount
    };
  }, [containerRef, fetchMore, loading]);

  return { loading: showLoading, setLoading };
};

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
  computedStageColor?: string;
  computedAvatarColor?: string;
  computedTier?: string;
  computedChildCounts?: any;
}

function useDebounce<T extends (...args: any[]) => any>(
    callback: T, 
    delay: number
  ): (...args: Parameters<T>) => void {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    return useCallback(
      (...args: Parameters<T>) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          callback(...args);
        }, delay);
      },
      [callback, delay]
    );
  }

// Simple caching mechanism
const createCache = () => {
  const cache = new Map<string, { data: any; timestamp: number }>();
  const CACHE_DURATION = 60 * 60 * 1000;

  return {
    get: (key: string) => {
      const cached = cache.get(key);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        return cached.data;
      }
      return null;
    },
    set: (key: string, data: any) => {
      cache.set(key, { data, timestamp: Date.now() });
    },
    clear: () => cache.clear()
  };
};

const SkeletonCard = memo(() => (
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
));

SkeletonCard.displayName = 'SkeletonCard';

const SkeletonColumn = memo(() => (
  <div className="w-full md:w-72 lg:w-80 flex flex-col rounded-2xl bg-gray-50/80 backdrop-blur-sm border border-gray-200/50 p-4 h-[500px]">
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
));

SkeletonColumn.displayName = 'SkeletonColumn';

interface KanbanColumnProps {
  stage: typeof stages[0];
  opportunities: ExtendedOpportunity[];
  allOpportunities: ExtendedOpportunity[];
  onRecalculateScore: (id: string) => Promise<void>;
  getAvatarColor: (type: string, score?: number) => string;
  getLeadScoreTier: (score?: number) => string;
  getStageColor: (stage: StageId) => string;
  formatDate: (date: string) => string;
  getChildCounts: (opp: ExtendedOpportunity) => any;
  loading: boolean;
  setIsDragging: (dragging: boolean) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning', duration?: number) => void;
  refreshOpportunities: () => Promise<void>;
  onStatusUpdate: (opportunity: ExtendedOpportunity, newStatus: string) => Promise<{ success: boolean; needsLead?: boolean }>;
  columnLoading: boolean;
  loadMore: (stageId: StageId) => Promise<void>;
}

function KanbanColumn({
  stage,
  opportunities,
  allOpportunities,
  onRecalculateScore,
  getAvatarColor,
  getLeadScoreTier,
  getStageColor,
  formatDate,
  getChildCounts,
  loading,
  setIsDragging,
  showToast,
  refreshOpportunities,
  onStatusUpdate,
  columnLoading,
  loadMore,
}: KanbanColumnProps) {
  const CARD_HEIGHT = 228;
  const router = useRouter();
  const [dropping, setDropping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { loading: scrollLoading } = useColumnInfiniteScroll(
    containerRef,
    async () => {
      await loadMore(stage.id);
    }
  );

  const isLoading = columnLoading || scrollLoading;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!dropping) {
      setDropping(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    const relatedTarget = e.relatedTarget as HTMLElement;
    // Only set dropping to false if we're actually leaving the column
    if (!e.currentTarget.contains(relatedTarget)) {
      setDropping(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setDropping(false);
    
    const opportunityId = e.dataTransfer.getData('opportunityId');
    
    if (!opportunityId) return;

    const opportunity = allOpportunities.find(opp => opp._id === opportunityId);
    if (!opportunity || opportunity.status === stage.id) {
      if (opportunity) showToast('Already in this stage', 'info', 2000);
      return;
    }

    try {
      // Call the status update handler which will show the confirmation modal
      const result = await onStatusUpdate(opportunity, stage.id);
      
      // The modal will handle the rest, but we can refresh if successful
      if (result.success) {
        showToast(`Opportunity moved to ${stage.label}`, 'success', 2000);
        await refreshOpportunities();
      }
    } catch (error) {
      console.error('Error in drop handler:', error);
      // Ensure dragging state is cleared even on error
      setIsDragging(false);
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  // This is the key fix: Don't clear dragging state in handleDragEnd
  const handleDragEnd = useCallback(() => {
    // Only clear dropping state, not dragging state
    // Dragging state will be cleared after modal completes
    setDropping(false);
  }, []);

  // Effect to clean up if component unmounts during drag
  useEffect(() => {
    return () => {
      if (dropping) {
        setDropping(false);
      }
    };
  }, [dropping]);

  // Virtualized list for opportunities
  const VirtualizedOpportunityList = memo(({ opportunities: opps }: { opportunities: ExtendedOpportunity[] }) => {
    const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
    
    useEffect(() => {
      const updateVisibleRange = () => {
        if (!containerRef.current) return;
        
        const container = containerRef.current;
        const scrollTop = container.scrollTop;
        const containerHeight = container.clientHeight;
        const itemHeight = CARD_HEIGHT;
        
        const start = Math.max(0, Math.floor(scrollTop / itemHeight) - 2);
        const end = Math.min(
          opps.length,
          start + Math.ceil(containerHeight / itemHeight) + 4
        );
        
        setVisibleRange({ start, end });
      };
      
      const container = containerRef.current;
      if (container) {
        container.addEventListener('scroll', updateVisibleRange);
        updateVisibleRange(); // Initial calculation
        
        // Cleanup
        return () => container.removeEventListener('scroll', updateVisibleRange);
      }
    }, [opps.length]);
    
    if (opps.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">No opportunities in this stage</div>
          <div className="text-sm text-gray-500">Drag opportunities here or create new ones</div>
        </div>
      );
    }

    return (
      <div 
        ref={containerRef}
        className="h-full overflow-y-auto pr-1 scrollbar-thin"
      >
        <div style={{ height: `${opps.length * CARD_HEIGHT}px`, position: 'relative' }}>
          {opps.slice(visibleRange.start, visibleRange.end).map((opportunity, index) => {
            const actualIndex = visibleRange.start + index;
            return (
              <div
                key={opportunity._id}
                style={{
                  position: 'absolute',
                  top: `${actualIndex * CARD_HEIGHT}px`,
                  width: '100%',
                  height: `${CARD_HEIGHT}px`
                }}
              >
                <OpportunityCard
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
              </div>
            );
          })}
          {/* Loading spinner at the bottom */}
          {isLoading && opps.length > 0 && (
            <div 
              style={{
                position: 'absolute',
                top: `${opps.length * CARD_HEIGHT}px`,
                width: '100%',
              }}
              className="py-4 flex justify-center"
            >
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading more...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  });
  
  VirtualizedOpportunityList.displayName = 'VirtualizedOpportunityList';

  return (
    <div 
      className={`flex flex-col rounded-2xl transition-all duration-300 ${
        dropping 
          ? `${stage.pastelClass} border-2 ${stage.borderColor} scale-[1.02] shadow-lg` 
          : `${stage.pastelClass} border ${stage.borderColor}`
      } p-4 h-[500px]`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${getStageColor(stage.id)}`} />
          <h3 className="font-semibold text-gray-800">{stage.label}</h3>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-medium text-gray-600 transition-all hover:scale-110">
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              opportunities.length
            )}
          </span>
        </div>
        <button className="p-1 hover:bg-white/50 rounded-lg transition-colors" disabled={isLoading}>
          <MoreVertical className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      <div className="flex-1 min-h-0">
        {isLoading && opportunities.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <p className="text-sm text-gray-500">Loading opportunities...</p>
            </div>
          </div>
        ) : (
          <VirtualizedOpportunityList opportunities={opportunities} />
        )}
      </div>
    </div>
  );
}

interface OpportunityCardProps {
  opportunity: ExtendedOpportunity;
  onRecalculateScore: (id: string) => Promise<void>;
  getAvatarColor: (type: string, score?: number) => string;
  getLeadScoreTier: (score?: number) => string;
  formatDate: (date: string) => string;
  getStageColor: (stage: StageId) => string;
  getChildCounts: (opp: ExtendedOpportunity) => any;
  onDragStart: () => void;
  onDragEnd: () => void;
}

const OpportunityCard = memo(function OpportunityCard({
  opportunity,
  onRecalculateScore,
  getAvatarColor,
  getLeadScoreTier,
  formatDate,
  getStageColor,
  getChildCounts,
  onDragStart,
  onDragEnd
}: OpportunityCardProps) {
  const router = useRouter();
  const [isRecalculating, setIsRecalculating] = useState(false);
  
  // Memoize expensive computations
  const childCounts = useMemo(() => getChildCounts(opportunity), [opportunity, getChildCounts]);
  const avatarColor = useMemo(() => getAvatarColor(opportunity.type, opportunity.leadScore?.totalScore), 
    [opportunity.type, opportunity.leadScore?.totalScore, getAvatarColor]);
  const tier = useMemo(() => getLeadScoreTier(opportunity.leadScore?.totalScore), 
    [opportunity.leadScore?.totalScore, getLeadScoreTier]);
  const stageColor = useMemo(() => getStageColor(normalizeOpportunityStatus(opportunity.status)), 
    [opportunity.status, getStageColor]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    router.push(`/opportunities/details?id=${opportunity._id}`);
  }, [router, opportunity._id]);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.setData('opportunityId', opportunity._id);
    e.dataTransfer.setData('currentStatus', opportunity.status);
    e.dataTransfer.effectAllowed = 'move';
    onDragStart();
  }, [opportunity._id, opportunity.status, onDragStart]);

  const handleDragEnd = useCallback(() => {
    onDragEnd();
  }, [onDragEnd]);

  const handleRecalculateClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRecalculating(true);
    try {
      await onRecalculateScore(opportunity._id);
    } finally {
      setIsRecalculating(false);
    }
  }, [opportunity._id, onRecalculateScore]);

  const handleActionButtonClick = useCallback((e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    switch (action) {
      case 'call':
        if (opportunity.customer?.phone) {
          window.open(`tel:${opportunity.customer.phone}`, '_blank');
        }
        break;
      case 'message':
        break;
      case 'view':
        handleClick(e);
        break;
    }
  }, [opportunity.customer?.phone, handleClick]);

  const showNeedsLeadBadge = false;

  return (
    <div 
      data-id={opportunity._id}
      className="group bg-white/80 backdrop-blur-sm rounded-xl border border-white/30 p-3 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between mb-2 gap-2">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${avatarColor} transition-colors`}>
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
          <span className={`h-2 w-2 rounded-full ${stageColor}`} />
          {opportunity.leadScore?.totalScore && (
            <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
              {opportunity.leadScore.totalScore}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        <span className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors hover:scale-105 whitespace-nowrap ${
          opportunity.leadScore?.tier === 'hot' ? 'bg-red-100/80 text-red-600 hover:bg-red-200' :
          opportunity.leadScore?.tier === 'warm' ? 'bg-amber-100/80 text-amber-600 hover:bg-amber-200' :
          'bg-blue-100/80 text-blue-600 hover:bg-blue-200'
        }`}>
          {tier}
        </span>
        
        {opportunity.type === 'organization' && (
          <span className="px-2 py-1 rounded-lg bg-purple-50/80 text-purple-600 text-xs transition-colors hover:bg-purple-100/80 whitespace-nowrap">
            Organization
          </span>
        )}
      </div>

      {opportunity.leadScore && (
        <div className="mb-2">
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
            disabled={!opportunity.customer?.phone}
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
});

OpportunityCard.displayName = 'OpportunityCard';

export default function OpportunitiesContent() {
  const ZOHO_PAGE_SIZE = 50;
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
  const [filteredStats, setFilteredStats] = useState<FilteredStats | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const kanbanRef = useRef<HTMLDivElement>(null);
  const [creating, setCreating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const [importingCsv, setImportingCsv] = useState(false);
  const [pagination, setPagination] = useState<any>(null);
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);
  const [organizationError, setOrganizationError] = useState<string | null>(null);
  const [showZohoModal, setShowZohoModal] = useState(false);
  const [zohoSearch, setZohoSearch] = useState('');
  const [zohoStatus, setZohoStatus] = useState('');
  const [zohoData, setZohoData] = useState<ZohoOpportunityRecord[]>([]);
  const [zohoLoading, setZohoLoading] = useState(false);
  const [zohoError, setZohoError] = useState<string | null>(null);
  const [zohoPage, setZohoPage] = useState(1);
  const [zohoTotalPages, setZohoTotalPages] = useState(1);
  const [zohoTotal, setZohoTotal] = useState(0);
  const csvInputRef = useRef<HTMLInputElement>(null);
  
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
  

  // Create cache instance
  const cacheRef = useRef(createCache());
  
  // Use the opportunity status update hook at the top level
  const {
    updatingStatus,
    showGenericConfirm,
    genericMessage,
    onGenericConfirm,
    onGenericCancel,
    handleStatusUpdate
  } = useOpportunityStatusUpdate();

  // Memoize filter dependencies
  const memoizedFilters = useMemo(() => filters, [
    filters.status, filters.tier, filters.source, filters.type, 
    filters.search, filters.minScore, filters.maxScore, filters.fromDate,
    filters.toDate, filters.assignedTo, filters.sort, filters.page, filters.limit
  ]);

  const memoizedAdvancedFilters = useMemo(() => advancedFilters, [
    advancedFilters.multipleStatuses, advancedFilters.multipleSources,
    advancedFilters.hasVehicles, advancedFilters.hasQuotes,
    advancedFilters.hasJobCards, advancedFilters.isNurturing
  ]);

  const hasActiveFilters = useMemo(() => {
    const hasBasicFilters = Boolean(
      memoizedFilters.status ||
      memoizedFilters.source ||
      memoizedFilters.type ||
      memoizedFilters.tier ||
      memoizedFilters.opportunityType ||
      memoizedFilters.search ||
      memoizedFilters.minScore !== undefined ||
      memoizedFilters.maxScore !== undefined ||
      memoizedFilters.fromDate ||
      memoizedFilters.toDate ||
      memoizedFilters.minTotal !== undefined ||
      memoizedFilters.maxTotal !== undefined ||
      memoizedFilters.hasServicesProducts !== undefined ||
      memoizedFilters.hasVehicles !== undefined ||
      memoizedFilters.hasQuotes !== undefined ||
      memoizedFilters.hasJobCards !== undefined ||
      memoizedFilters.isNurturing !== undefined ||
      memoizedFilters.vehicleMake ||
      memoizedFilters.vehicleModel ||
      memoizedFilters.customerName ||
      memoizedFilters.customerEmail ||
      memoizedFilters.customerPhone ||
      memoizedFilters.subject ||
      memoizedFilters.priority !== undefined ||
      (memoizedFilters.assignedTo !== undefined &&
        memoizedFilters.assignedTo !== null &&
        memoizedFilters.assignedTo !== '')
    );

    const hasAdvancedFilters = Boolean(
      memoizedAdvancedFilters.multipleStatuses.length > 0 ||
      memoizedAdvancedFilters.multipleSources.length > 0 ||
      memoizedAdvancedFilters.hasVehicles !== undefined ||
      memoizedAdvancedFilters.hasQuotes !== undefined ||
      memoizedAdvancedFilters.hasJobCards !== undefined ||
      memoizedAdvancedFilters.isNurturing !== undefined
    );

    return hasBasicFilters || hasAdvancedFilters;
  }, [memoizedFilters, memoizedAdvancedFilters]);

  // Memoize helper functions
  const getAvatarColor = useCallback((type: string, score?: number) => {
    if (type === 'organization') return 'bg-purple-100 text-purple-600';
    if (!score) return 'bg-blue-100 text-blue-600';
    
    if (score >= 70) return 'bg-green-100 text-green-600';
    if (score >= 50) return 'bg-amber-100 text-amber-600';
    return 'bg-blue-100 text-blue-600';
  }, []);

  const getLeadScoreTier = useCallback((score?: number) => {
    if (!score) return 'Not Scored';
    if (score >= 70) return 'Hot';
    if (score >= 50) return 'Warm';
    return 'Cold';
  }, []);

  const getStageColor = useCallback((stage: StageId) => {
    switch (stage) {
      case 'new': return 'bg-gradient-to-r from-blue-400 to-blue-500';
      case 'attempted_to_contact': return 'bg-gradient-to-r from-purple-400 to-purple-500';
      case 'prospecting': return 'bg-gradient-to-r from-amber-400 to-amber-500';
      case 'appointment_scheduled': return 'bg-gradient-to-r from-orange-400 to-orange-500';
      case 'non_progressive': return 'bg-gradient-to-r from-gray-400 to-gray-500';
      case 'lost': return 'bg-gradient-to-r from-rose-400 to-rose-500';
      case 'won': return 'bg-gradient-to-r from-emerald-400 to-emerald-500';
    }
  }, []);

  const formatDate = useCallback((dateString: string) => {
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
  }, []);

  const getChildCounts = useCallback((opportunity: ExtendedOpportunity) => {
    return {
      vehicles: opportunity.vehicles?.length || 0,
      jobCards: opportunity.jobCards?.length || 0,
      waivers: opportunity.waivers?.length || 0,
      quotes: opportunity.quotes?.length || 0,
      invoices: opportunity.invoices?.length || 0,
      payments: opportunity.payments?.length || 0
    };
  }, []);

  const applyLocalStatusUpdate = useCallback((opportunityId: string, newStatus: string) => {
    setOpportunities(prev =>
      prev.map(opp =>
        opp._id === opportunityId
          ? {
              ...opp,
              updatedAt: new Date().toISOString(),
          status: normalizeOpportunityStatus(newStatus),
          computedStageColor: getStageColor(normalizeOpportunityStatus(newStatus)),
              computedAvatarColor: getAvatarColor(opp.type, opp.leadScore?.totalScore),
              computedTier: getLeadScoreTier(opp.leadScore?.totalScore),
              computedChildCounts: getChildCounts(opp),
            }
          : opp
      )
    );
  }, [getStageColor, getAvatarColor, getLeadScoreTier, getChildCounts]);

  const getStatusLabel = useCallback((status: string) => {
    const labels: Record<string, string> = {
      new: 'New',
      attempted_to_contact: 'Attempted to Contact',
      prospecting: 'Prospecting',
      appointment_scheduled: 'Appointment Scheduled',
      non_progressive: 'Non Progressive',
      lost: 'Lost'
    };
    return labels[status] || status;
  }, []);

  // Wrapper function for status updates that works with the hook
  const handleStatusUpdateWrapper = async (opportunity: ExtendedOpportunity, newStatus: string): Promise<{ success: boolean; needsLead?: boolean }> => {
    try {
      const result = await handleStatusUpdate(opportunity, newStatus, async (success: boolean) => {
        if (success) {
          showToast(`Opportunity moved to ${getStatusLabel(newStatus)}`, 'success', 2000);

          // Update local state immediately so card moves without waiting for refetch.
          applyLocalStatusUpdate(opportunity._id, newStatus);

          // Clear dragging state AFTER successful update
          setIsDragging(false);

          // FORCE clear ALL cache entries related to opportunities
          cacheRef.current.clear();

          // Refresh quietly in background (avoid blocking drop UX with full-page loading overlay).
          void fetchOpportunities(true, true);
        } else {
          // If modal was cancelled, clear dragging state
          setIsDragging(false);
        }
      });

      return result;
    } catch (error) {
      // Handle any errors and ensure dragging state is cleared
      setIsDragging(false);
      return { success: false };
    }
  };

  // Debounced search
  const debouncedSetSearch = useDebounce((search: string) => {
    const trimmedSearch = search.trim();
    const phoneSearch = normalizeSearchPhone(trimmedSearch);
    
    if (trimmedSearch.length >= 3 || trimmedSearch.length === 0) {
      setDebouncedSearch(trimmedSearch);
      
      if (trimmedSearch.length >= 3) {
        setSearchLoading(true);
        setFilters(prev => ({ 
          ...prev, 
          search: trimmedSearch,
          customerPhone: phoneSearch,
          page: 1 
        }));
      } else if (trimmedSearch.length === 0 && (filters.search || filters.customerPhone)) {
        setFilters(prev => ({ 
          ...prev, 
          search: undefined,
          customerPhone: undefined,
          page: 1 
        }));
      }
    }
  }, 500);

  useEffect(() => {
    debouncedSetSearch(searchQuery);
  }, [searchQuery, debouncedSetSearch]);

  const [columnLoading, setColumnLoading] = useState<Record<StageId, boolean>>({
    new: false,
    attempted_to_contact: false,
    prospecting: false,
    appointment_scheduled: false,
    non_progressive: false,
    lost: false,
    won: false,
  });

  const [stagePagination, setStagePagination] = useState<Record<StageId, { page: number; hasMore: boolean }>>({
    new: { page: 0, hasMore: true },
    attempted_to_contact: { page: 0, hasMore: true },
    prospecting: { page: 0, hasMore: true },
    appointment_scheduled: { page: 0, hasMore: true },
    non_progressive: { page: 0, hasMore: true },
    lost: { page: 0, hasMore: true },
    won: { page: 0, hasMore: true },
  });

  useEffect(() => {
  // Reset all stage pagination to page 0 so first column-scroll fetch starts from page 1.
    setStagePagination({
      new: { page: 0, hasMore: true },
      attempted_to_contact: { page: 0, hasMore: true },
      prospecting: { page: 0, hasMore: true },
      appointment_scheduled: { page: 0, hasMore: true },
      non_progressive: { page: 0, hasMore: true },
      lost: { page: 0, hasMore: true },
      won: { page: 0, hasMore: true },
    });
  }, [memoizedFilters, memoizedAdvancedFilters]);
  const loadMoreForStage = useCallback(async (stageId: StageId) => {
    if (columnLoading[stageId] || !stagePagination[stageId].hasMore) return;

    try {
      setColumnLoading(prev => ({ ...prev, [stageId]: true }));
      
      const nextPage = stagePagination[stageId].page + 1;
      
      const params: FilterParams = {
        ...filters,
        status: stageId,
        page: nextPage,
        limit: 20, // Load 20 at a time
      };

      const response = await opportunityService.getAllOpportunities(params);
      
      if (response.data.length > 0) {
        // Process new opportunities
        const processedOpportunities = response.data.map((opp: ExtendedOpportunity) => ({
          ...opp,
          status: resolveOpportunityStage(opp),
          computedStageColor: getStageColor(resolveOpportunityStage(opp)),
          computedAvatarColor: getAvatarColor(opp.type, opp.leadScore?.totalScore),
          computedTier: getLeadScoreTier(opp.leadScore?.totalScore),
          computedChildCounts: getChildCounts(opp)
        }));

        // Append to existing opportunities without duplicates
        setOpportunities(prev => {
          const existingIds = new Set(prev.map(opp => opp._id));
          const uniqueIncoming = processedOpportunities.filter(opp => !existingIds.has(opp._id));
          return uniqueIncoming.length > 0 ? [...prev, ...uniqueIncoming] : prev;
        });
        
        // Update pagination
        const totalPages = response.pagination?.totalPages;
        const hasMore = typeof totalPages === 'number'
          ? nextPage < totalPages
          : response.data.length >= 20;

        setStagePagination(prev => ({
          ...prev,
          [stageId]: {
            page: nextPage,
            hasMore
          }
        }));
      } else {
        // No more data
        setStagePagination(prev => ({
          ...prev,
          [stageId]: { ...prev[stageId], hasMore: false }
        }));
      }
    } catch (error) {
      console.error(`Error loading more for stage ${stageId}:`, error);
      // showToast(`Failed to load more opportunities for ${stageId}`, 'error', 3000);
    } finally {
      setColumnLoading(prev => ({ ...prev, [stageId]: false }));
    }
  }, [columnLoading, stagePagination, filters, getStageColor, getAvatarColor, getLeadScoreTier, getChildCounts, showToast]);

  // Optimized fetch opportunities WITHOUT lead checking
  const fetchOpportunities = useCallback(async (isRefresh = false, forceRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
        setStatsLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      setOrganizationError(null); // Clear any previous organization error
      
      const params: FilterParams = { ...memoizedFilters };

      if (memoizedAdvancedFilters.multipleStatuses.length > 0) {
        params.statuses = memoizedAdvancedFilters.multipleStatuses;
        delete params.status;
      }
      
      if (memoizedAdvancedFilters.multipleSources.length > 0) {
        params.sources = memoizedAdvancedFilters.multipleSources;
        delete params.source;
      }
      
      if (memoizedAdvancedFilters.hasVehicles !== undefined) {
        params.hasVehicles = memoizedAdvancedFilters.hasVehicles;
      }
      
      if (memoizedAdvancedFilters.hasQuotes !== undefined) {
        params.hasQuotes = memoizedAdvancedFilters.hasQuotes;
      }
      
      if (memoizedAdvancedFilters.hasJobCards !== undefined) {
        params.hasJobCards = memoizedAdvancedFilters.hasJobCards;
      }
      
      if (memoizedAdvancedFilters.isNurturing !== undefined) {
        params.isNurturing = memoizedAdvancedFilters.isNurturing;
      }
      
      // Check cache first - but skip if forceRefresh is true
      const cacheKey = `opportunities-${JSON.stringify(params)}`;
      const cachedData = !forceRefresh ? cacheRef.current.get(cacheKey) : null;
      
      if (cachedData && !isRefresh && !forceRefresh) {
        const {
          data,
          pagination: cachedPagination,
          stats: cachedStats,
          filteredStats: cachedFilteredStats,
        } = cachedData;
        
        // Pre-compute all values for opportunities
        const processedOpportunities = data.map((opp: ExtendedOpportunity) => ({
          ...opp,
          status: resolveOpportunityStage(opp),
          computedStageColor: getStageColor(resolveOpportunityStage(opp)),
          computedAvatarColor: getAvatarColor(opp.type, opp.leadScore?.totalScore),
          computedTier: getLeadScoreTier(opp.leadScore?.totalScore),
          computedChildCounts: getChildCounts(opp)
        }));
        
        setOpportunities(processedOpportunities);
        setPagination(cachedPagination);
        setStats(cachedStats);
        setFilteredStats(cachedFilteredStats || null);
        
        setLoading(false);
        setRefreshing(false);
        setStatsLoading(false);
        setSearchLoading(false);
        return;
      }
      
      const statsParams: FilterParams = { ...params };
      delete statsParams.page;
      delete statsParams.limit;

      // Fetch fresh data
      const [response, filteredStatsResponse] = await Promise.all([
        opportunityService.getAllOpportunities(params),
        opportunityService.getFilteredStats(statsParams).catch((error) => {
          console.warn('Failed to load filtered stats, falling back to response stats:', error);
          return null;
        }),
      ]);
      
      // Pre-compute all values for opportunities
      const processedOpportunities = response.data.map((opp: ExtendedOpportunity) => ({
        ...opp,
        status: resolveOpportunityStage(opp),
        computedStageColor: getStageColor(resolveOpportunityStage(opp)),
        computedAvatarColor: getAvatarColor(opp.type, opp.leadScore?.totalScore),
        computedTier: getLeadScoreTier(opp.leadScore?.totalScore),
        computedChildCounts: getChildCounts(opp)
      }));
      
      setOpportunities(processedOpportunities);
      setPagination(response.pagination);
      setFilteredStats(filteredStatsResponse);
      
      if (response.stats) {
        setStats(response.stats);
      }
      
      // Cache the response (unless forceRefresh)
      if (!forceRefresh) {
        cacheRef.current.set(cacheKey, {
          data: response.data,
          pagination: response.pagination,
          stats: response.stats,
          filteredStats: filteredStatsResponse,
        });
      }
      
    } catch (err: any) {
      console.error('Error fetching opportunities:', err);
      
      // Check if it's an OrganizationError
      if (err instanceof OrganizationError) {
        setOrganizationError(err.message);
        // Show specific toast message
        showToast('You do not have access to this organization', 'error', 5000);
        setError(null); // Clear general error
      } else {
        setError(err.message || 'Failed to fetch opportunities');
        setFilteredStats(null);
        showToast('Failed to load opportunities', 'error', 3000);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setStatsLoading(false);
      setSearchLoading(false);
    }
  }, [memoizedFilters, memoizedAdvancedFilters, hasActiveFilters, showToast, getAvatarColor, getLeadScoreTier, getStageColor, getChildCounts]);

  // Fetch overview stats
  const fetchOverview = useCallback(async () => {
    try {
      const cacheKey = 'opportunities-overview';
      const cached = cacheRef.current.get(cacheKey);
      
      if (cached) {
        setStats(cached);
        return;
      }
      
      const overview = await opportunityService.getOpportunitiesOverview();
      setStats(overview);
      cacheRef.current.set(cacheKey, overview);
    } catch (err) {
      console.error('Error fetching overview:', err);
    }
  }, []);
  const handleOrganizationAction = async (action: () => Promise<any>, errorMessage: string) => {
    try {
      setOrganizationError(null);
      await action();
    } catch (err) {
      if (err instanceof OrganizationError) {
        setOrganizationError(err.message);
        showToast(err.message, 'error', 5000);
      } else {
        showToast(errorMessage, 'error', 3000);
      }
    }
  };

  // Fetch data on mount and when filters change
  useEffect(() => {
    if (!activeQuickFilter) {
      fetchOpportunities();
    }
  }, [fetchOpportunities, activeQuickFilter]);

  useEffect(() => {
    const handleOpportunityStatusUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<OpportunityStatusUpdateDetail>;
      const detail = customEvent.detail;

      if (!detail?.opportunityId || !detail?.newStatus) return;

      applyLocalStatusUpdate(detail.opportunityId, detail.newStatus);
      cacheRef.current.clear();
      void fetchOpportunities(true, true);
    };

    window.addEventListener('opportunity-status-updated', handleOpportunityStatusUpdated as EventListener);
    return () => {
      window.removeEventListener('opportunity-status-updated', handleOpportunityStatusUpdated as EventListener);
    };
  }, [applyLocalStatusUpdate, fetchOpportunities]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Memoize computed opportunities by stage
  const opportunitiesByStage = useMemo(() => {
    const grouped = {} as Record<StageId, ExtendedOpportunity[]>;
    stages.forEach(stage => {
      grouped[stage.id] = opportunities.filter(opp => opp.status === stage.id);
    });
    return grouped;
  }, [opportunities]);

  // Card metrics should reflect backend aggregates, not only the loaded page.
  const cardMetrics = useMemo(() => {
    const useFilteredStats = !!filteredStats;
    const byTier = (useFilteredStats ? filteredStats?.byTier : undefined) || {};
    const byStatus = (useFilteredStats ? filteredStats?.byStatus : undefined) || {};

    const totalFromStats =
      typeof stats?.totalopportunities === 'number'
        ? stats.totalopportunities
        : typeof stats?.total === 'number'
          ? stats.total
          : undefined;
    const openFromStats =
      typeof stats?.openopportunities === 'number'
        ? stats.openopportunities
        : typeof stats?.open === 'number'
          ? stats.open
          : undefined;
    const hotFromStats =
      typeof stats?.hot === 'number'
        ? stats.hot
        : undefined;

    const total = useFilteredStats
      ? (filteredStats?.total ?? pagination?.total ?? opportunities.length)
      : (totalFromStats ?? pagination?.total ?? opportunities.length);

    const hotLeads = useFilteredStats
      ? (byTier.hot ?? byTier.HOT ?? 0)
      : (hotFromStats ?? 0);
    const wonCount = byStatus.won ?? 0;
    const lostCount = byStatus.lost ?? 0;
    const activeDeals = useFilteredStats
      ? Math.max(total - wonCount - lostCount, 0)
      : (openFromStats ?? Math.max(total - wonCount - lostCount, 0));
    const winRate = total > 0 ? Math.round((wonCount / total) * 100) : 0;

    return {
      total,
      hotLeads,
      activeDeals,
      winRate,
    };
  }, [hasActiveFilters, filteredStats, stats, pagination?.total, opportunities.length]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSearch = searchQuery.trim();
    const phoneSearch = normalizeSearchPhone(trimmedSearch);
    
    if (trimmedSearch.length >= 3) {
      setSearchLoading(true);
      setFilters(prev => ({ 
        ...prev, 
        search: trimmedSearch,
        customerPhone: phoneSearch,
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
    if (filters.search || filters.customerPhone) {
      setFilters(prev => ({ 
        ...prev, 
        search: undefined,
        customerPhone: undefined,
        page: 1 
      }));
    }
  };

  // Debounced filter change
  const debouncedFilterChange = useDebounce((key: keyof FilterParams, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  }, 300);

  const handleFilterChange = (key: keyof FilterParams, value: any) => {
    debouncedFilterChange(key, value);
  };

  const handleRecalculateScore = async (opportunityId: string) => {
    try {
      await opportunityService.recalculateLeadScore(opportunityId);
      // Invalidate cache
      cacheRef.current.clear();
      await fetchOpportunities();
      showToast('Lead score recalculated successfully', 'success', 2000);
    } catch (err) {
      console.error('Error recalculating score:', err);
      showToast('Failed to recalculate lead score', 'error', 3000);
    }
  };

  const handleImportCsv = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportingCsv(true);
      const preview = await opportunityService.previewCsvImport(file);
      const rowCount = preview?.totalRows ?? preview?.rows?.length ?? 0;
      const proceed = window.confirm(`Preview complete (${rowCount} rows). Continue import?`);
      if (!proceed) return;

      const result = await opportunityService.executeCsvImport(file);
      const imported = result?.importedCount ?? result?.created ?? result?.successCount ?? 0;
      showToast(`Opportunities CSV imported${imported ? `: ${imported} rows` : ''}`, 'success');
      cacheRef.current.clear();
      await Promise.all([fetchOpportunities(), fetchOverview()]);
    } catch (error) {
      console.error('Error importing opportunities CSV:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to import opportunities CSV';
      showToast(errorMessage, 'error');
    } finally {
      setImportingCsv(false);
      if (event.target) {
        event.target.value = '';
      }
    }
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
    cacheRef.current.clear();
  };

  const applyFilters = () => {
    setActiveQuickFilter(null);
    fetchOpportunities();
  };

  const handleBackfillUnassigned = async () => {
    const currentUser = authService.getUser();
    if (!currentUser?.id) {
      showToast('Unable to identify current user for backfill', 'error', 3000);
      return;
    }

    try {
      setBackfilling(true);

      let totalProcessed = 0;
      let totalSuccess = 0;
      let totalFailed = 0;
      let safetyCounter = 0;

      while (safetyCounter < 50) {
        safetyCounter += 1;

        const batch = await opportunityService.getOrphanedOpportunities({
          page: 1,
          limit: 100,
        });

        if (!batch.data.length) {
          break;
        }

        totalProcessed += batch.data.length;

        const results = await Promise.allSettled(
          batch.data.map((opportunity) =>
            opportunityService.reassignOpportunity(
              opportunity._id,
              currentUser.id,
              'Backfill assignment for historical unassigned opportunity'
            )
          )
        );

        const successCount = results.filter((result) => result.status === 'fulfilled').length;
        const failedCount = results.length - successCount;
        totalSuccess += successCount;
        totalFailed += failedCount;

        if (successCount === 0) {
          break;
        }
      }

      if (totalProcessed === 0) {
        showToast('No unassigned opportunities found to backfill', 'info', 3000);
        return;
      }

      cacheRef.current.clear();
      await fetchOpportunities(true, true);

      if (totalFailed > 0) {
        showToast(
          `Backfill completed: ${totalSuccess} assigned, ${totalFailed} failed`,
          'warning',
          5000
        );
      } else {
        showToast(`Backfill completed: ${totalSuccess} opportunity(ies) assigned`, 'success', 4000);
      }
    } catch (error) {
      console.error('Error backfilling unassigned opportunities:', error);
      showToast('Failed to backfill unassigned opportunities', 'error', 4000);
    } finally {
      setBackfilling(false);
    }
  };

  const fetchZohoData = useCallback(async (page = 1) => {
    try {
      setZohoLoading(true);
      setZohoError(null);
      const response = await opportunityService.fetchZohoOpportunityData({
        search: zohoSearch.trim() || undefined,
        status: zohoStatus || undefined,
        page,
        limit: ZOHO_PAGE_SIZE,
      });
      const data = response.data || [];
      const currentPage = response.page || page;
      const total = typeof response.total === 'number' ? response.total : data.length;
      const totalPages = response.totalPages || Math.max(1, Math.ceil(total / ZOHO_PAGE_SIZE));

      setZohoData(data);
      setZohoPage(currentPage);
      setZohoTotal(total);
      setZohoTotalPages(totalPages);
    } catch (error: any) {
      console.error('Error loading Zoho data:', error);
      setZohoError(error?.message || 'Failed to load Zoho data');
      setZohoData([]);
      setZohoTotal(0);
      setZohoTotalPages(1);
    } finally {
      setZohoLoading(false);
    }
  }, [zohoSearch, zohoStatus, ZOHO_PAGE_SIZE]);

  useEffect(() => {
    if (showZohoModal) {
      void fetchZohoData(1);
    }
  }, [showZohoModal, fetchZohoData]);

  // Check scroll buttons
  useEffect(() => {
    const checkScroll = () => {
      if (kanbanRef.current) {
        const needsScroll = kanbanRef.current.scrollWidth > kanbanRef.current.clientWidth;
        setShowScrollButtons(needsScroll);
      }
    };

    checkScroll();
    const resizeObserver = new ResizeObserver(checkScroll);
    if (kanbanRef.current) {
      resizeObserver.observe(kanbanRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, [opportunities]);

  const scrollKanban = (direction: 'left' | 'right') => {
    if (kanbanRef.current) {
      setScrolling(true);
      const container = kanbanRef.current;
      const scrollAmount = 400; // Fixed amount to scroll
      
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      
      // Reset scrolling state after animation
      setTimeout(() => setScrolling(false), 500);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle arrow keys if the kanban board is visible and user isn't in an input field
      const isInputActive = 
        e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement;
      
      if (isInputActive) return;
      
      if (e.key === 'ArrowLeft' && !scrolling && !loading && !creating) {
        e.preventDefault();
        scrollKanban('left');
      } else if (e.key === 'ArrowRight' && !scrolling && !loading && !creating) {
        e.preventDefault();
        scrollKanban('right');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scrolling, loading, creating]);

  const showSearchHelp = useMemo(() => {
    const trimmedSearch = searchQuery.trim();
    return trimmedSearch.length > 0 && trimmedSearch.length < 3;
  }, [searchQuery]);

  if (loading && !opportunities.length) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg flex items-center px-6 flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-white">Opportunities</h1>
                <p className="text-blue-100 text-sm">Loading opportunities...</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
          <div className="flex flex-col md:flex-row gap-4 animate-pulse">
            <div className="h-10 w-full md:w-96 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30" />
            <div className="flex gap-3">
              <div className="h-10 w-24 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30" />
              <div className="h-10 w-24 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30" />
              <div className="h-10 w-32 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30" />
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <div className="flex gap-4 pb-4 min-w-max">
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
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header - Fixed height */}
      <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg flex items-center px-6 flex-shrink-0">
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
                      {filteredStats?.total ?? stats.totalopportunities} total opportunities
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
          <div className="flex items-center gap-2">
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleImportCsv}
            />
            <button
              onClick={() => csvInputRef.current?.click()}
              disabled={importingCsv || loading || creating}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-50"
              title="Import CSV"
            >
              {importingCsv ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
            </button>
            <button 
              onClick={() => router.push('/opportunities/create')}
              disabled={loading || creating}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium shadow-sm transition-all disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Opportunity</span>
            </button>
            <button
              onClick={() => setShowZohoModal(true)}
              disabled={loading || creating}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium shadow-sm transition-all disabled:opacity-50"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Zoho Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Organization Error State */}
      {organizationError && (
        <div className="mx-4 md:mx-6 mt-4 p-6 rounded-xl bg-red-50/80 backdrop-blur-sm border border-red-200/50 flex items-start gap-4 animate-in fade-in slide-in-from-top-1 duration-300">
          <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
            <Shield className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-800 mb-1">Access Denied</h3>
            <p className="text-red-600 mb-3">{organizationError}</p>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/organizations')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                View My Organizations
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
          <button 
            onClick={() => setOrganizationError(null)}
            className="p-1 hover:bg-red-100 rounded-lg transition-colors"
          >
            <X className="h-4 w-4 text-red-600" />
          </button>
        </div>
      )}

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 space-y-6">
          {/* Search and Filters */}
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
                {/* <button
                  onClick={handleBackfillUnassigned}
                  disabled={backfilling || refreshing || loading || creating}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                    backfilling || refreshing || loading || creating
                      ? 'border-gray-200/50 bg-gray-50/50 text-gray-400 cursor-not-allowed'
                      : 'border-amber-200 bg-amber-50/70 text-amber-700 hover:bg-amber-100/70'
                  }`}
                  title="Assign historical unassigned opportunities to me"
                >
                  {backfilling ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="hidden sm:inline">Backfilling...</span>
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4" />
                      <span className="hidden sm:inline">Claim Unassigned</span>
                    </>
                  )}
                </button> */}

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

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4">
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

          {/* Stats Cards */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50/50 to-blue-100/30">
                <div className="p-2 rounded-lg bg-blue-100/50">
                  <Target className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Opportunities</p>
                  <p className="text-lg font-bold text-gray-900">{cardMetrics.total}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-green-50/50 to-green-100/30">
                <div className="p-2 rounded-lg bg-green-100/50">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Hot Leads</p>
                  <p className="text-lg font-bold text-gray-900">{cardMetrics.hotLeads}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-50/50 to-amber-100/30">
                <div className="p-2 rounded-lg bg-amber-100/50">
                  <Briefcase className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Deals</p>
                  <p className="text-lg font-bold text-gray-900">{cardMetrics.activeDeals}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-50/50 to-purple-100/30">
                <div className="p-2 rounded-lg bg-purple-100/50">
                  <Trophy className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Win Rate</p>
                  <p className="text-lg font-bold text-gray-900">{cardMetrics.winRate}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Kanban Section - Scrollable */}
          <div className="flex-1 min-h-0 relative">
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

            {/* Update the arrow buttons section */}
            {showScrollButtons && (
              <>
                <button
                  onClick={() => scrollKanban('left')}
                  disabled={scrolling || loading || creating}
                  className="hidden md:block absolute left-2 top-1/2 transform -translate-y-1/2 z-20 h-10 w-10 bg-white/95 backdrop-blur-sm border border-gray-300 rounded-full shadow-lg flex items-center justify-center hover:bg-white hover:scale-110 disabled:opacity-50 transition-all duration-200 group"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-700 group-hover:text-blue-600 transition-colors" />
                  <span className="sr-only">Scroll left</span>
                </button>
                <button
                  onClick={() => scrollKanban('right')}
                  disabled={scrolling || loading || creating}
                  className="hidden md:block absolute right-2 top-1/2 transform -translate-y-1/2 z-20 h-10 w-10 bg-white/95 backdrop-blur-sm border border-gray-300 rounded-full shadow-lg flex items-center justify-center hover:bg-white hover:scale-110 disabled:opacity-50 transition-all duration-200 group"
                >
                  <ChevronRight className="h-5 w-5 text-gray-700 group-hover:text-blue-600 transition-colors" />
                  <span className="sr-only">Scroll right</span>
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
              <div 
                className="absolute inset-0 border-4 border-dashed border-blue-400 bg-blue-50/20 z-10 rounded-2xl flex items-center justify-center pointer-events-none"
              >
                <div className="bg-white/80 backdrop-blur-sm px-6 py-4 rounded-xl shadow-lg border border-blue-200/50">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    <span className="font-medium text-blue-600">Drop opportunity here</span>
                  </div>
                </div>
              </div>
            )}

            {/* Kanban Board - Horizontal Scroll */}
            <div 
              ref={kanbanRef}
              className="h-[500px] overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pb-4"
              onScroll={() => setScrolling(true)}
            >
              <div className="flex gap-4 pb-4 min-w-max">
                {stages.map((stage) => (
                  <div key={stage.id} className="w-80 flex-shrink-0">
                    <KanbanColumn
                      stage={stage}
                      opportunities={opportunitiesByStage[stage.id] || []}
                      allOpportunities={opportunities}
                      onRecalculateScore={handleRecalculateScore}
                      getAvatarColor={getAvatarColor}
                      getLeadScoreTier={getLeadScoreTier}
                      getStageColor={getStageColor}
                      formatDate={formatDate}
                      getChildCounts={getChildCounts}
                      loading={loading || creating}
                      setIsDragging={setIsDragging}
                      showToast={showToast}
                      refreshOpportunities={fetchOpportunities}
                      onStatusUpdate={handleStatusUpdateWrapper}
                      columnLoading={columnLoading[stage.id]}
                      loadMore={loadMoreForStage}
                    />
                  </div>
                ))}
              </div>
            </div>
            
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

      {showZohoModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Zoho Opportunities</h2>
                <p className="text-sm text-gray-500">Browse `magcrm.opportunities` records where the source is Zoho.</p>
                <p className="text-xs text-gray-500 mt-1">Total records: {zohoTotal}</p>
              </div>
              <button
                onClick={() => setShowZohoModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-3">
                  <input
                    type="text"
                    value={zohoSearch}
                    onChange={(e) => setZohoSearch(e.target.value)}
                    placeholder="Search customer, phone, email, subject..."
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                  />
                  <select
                    value={zohoStatus}
                    onChange={(e) => setZohoStatus(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                  >
                    <option value="">All Statuses</option>
                    <option value="new">New</option>
                    <option value="attempted_to_contact">Attempted To Contact</option>
                    <option value="prospecting">Prospecting</option>
                    <option value="appointment_scheduled">Appointment Scheduled</option>
                    <option value="non_progressive">Non Progressive</option>
                    <option value="lost">Lost</option>
                    <option value="won">Won</option>
                  </select>
                  <button
                    onClick={() => void fetchZohoData(1)}
                    className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                    disabled={zohoLoading}
                  >
                    {zohoLoading ? 'Loading...' : 'Search'}
                  </button>
                </div>

                {zohoError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {zohoError}
                  </div>
                )}

                <div className="max-h-[420px] overflow-auto rounded-xl border border-gray-100">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 bg-gray-50 text-gray-600">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium">Subject</th>
                        <th className="text-left px-3 py-2 font-medium">Customer</th>
                        <th className="text-left px-3 py-2 font-medium">Phone</th>
                        <th className="text-left px-3 py-2 font-medium">Email</th>
                        <th className="text-left px-3 py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {zohoData.length === 0 && !zohoLoading ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-8 text-center text-gray-500">
                            No opportunity records found.
                          </td>
                        </tr>
                      ) : (
                        zohoData.map((row, idx) => (
                          <tr key={row.id || row._id || idx} className="border-t border-gray-100">
                            <td className="px-3 py-2 text-gray-800">{row.subject || '-'}</td>
                            <td className="px-3 py-2 text-gray-700">{row.customerName || row.name || '-'}</td>
                            <td className="px-3 py-2 text-gray-700">{row.phone || row.customerPhone || '-'}</td>
                            <td className="px-3 py-2 text-gray-700">{row.email || row.customerEmail || '-'}</td>
                            <td className="px-3 py-2 text-gray-700">{row.status || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Page {zohoPage} of {zohoTotalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => void fetchZohoData(Math.max(1, zohoPage - 1))}
                      disabled={zohoLoading || zohoPage <= 1}
                      className="px-3 py-1.5 rounded-lg border border-gray-200/50 bg-white/50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => void fetchZohoData(Math.min(zohoTotalPages, zohoPage + 1))}
                      disabled={zohoLoading || zohoPage >= zohoTotalPages}
                      className="px-3 py-1.5 rounded-lg border border-gray-200/50 bg-white/50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showGenericConfirm}
        onClose={onGenericCancel}
        onConfirm={onGenericConfirm}
        title="Confirm Status Change"
        message={genericMessage}
        confirmText="Confirm"
        cancelText="Cancel"
        type="warning"
      />
    </div>
  );
}
