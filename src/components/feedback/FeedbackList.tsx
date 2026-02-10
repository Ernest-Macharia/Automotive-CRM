'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MessageSquare, Plus, Search, Filter, RefreshCw,
  Eye, Edit, Trash2, ThumbsUp, User, Tag,
  Loader2, AlertCircle, CheckCircle, Clock,
  TrendingUp, Bug, Zap, Star, HelpCircle
} from 'lucide-react';
import { feedbackService, Feedback, FEEDBACK_STATUS } from '@/services/feedbackService';
import { useToast } from '@/contexts/ToastContext';
import { format } from 'date-fns';

interface FeedbackListProps {
  mode?: 'admin' | 'public' | 'my' | 'assigned';
  initialFilters?: {
    status?: string;
    section?: string;
    type?: string;
    priority?: string;
  };
}

export default function FeedbackList({ mode = 'admin', initialFilters = {} }: FeedbackListProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: initialFilters.status || 'all',
    section: initialFilters.section || 'all',
    type: initialFilters.type || 'all',
    priority: initialFilters.priority || 'all',
    sort: 'newest',
  });
  
  const [stats, setStats] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'new', label: 'New', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'reviewed', label: 'Reviewed', color: 'bg-blue-100 text-blue-800' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-purple-100 text-purple-800' },
    { value: 'resolved', label: 'Resolved', color: 'bg-green-100 text-green-800' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
    { value: 'duplicate', label: 'Duplicate', color: 'bg-gray-100 text-gray-800' },
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
    { value: 'high', label: 'High', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' },
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'priority', label: 'Priority' },
  ];

  const fetchFeedbacks = useCallback(async () => {
    try {
      setLoading(true);
      
      let data: Feedback[] = [];
      
      switch (mode) {
        case 'admin':
          data = await feedbackService.getAllFeedback({
            ...(filters.status !== 'all' && { status: filters.status }),
            ...(filters.section !== 'all' && { section: filters.section }),
            ...(filters.type !== 'all' && { type: filters.type }),
            ...(filters.priority !== 'all' && { priority: filters.priority }),
            ...(searchTerm && { search: searchTerm }),
            sort: filters.sort,
          });
          break;
          
        case 'public':
          data = await feedbackService.getPublicFeedback({
            ...(filters.section !== 'all' && { section: filters.section }),
            ...(filters.type !== 'all' && { type: filters.type }),
            sort: filters.sort,
          });
          break;
          
        case 'my':
          data = await feedbackService.getMyFeedback();
          break;
          
        case 'assigned':
          data = await feedbackService.getAssignedToMe();
          break;
      }
      
      // Apply local filtering for search if needed
      if (searchTerm && mode !== 'admin') {
        data = data.filter(feedback =>
          feedback.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          feedback.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          feedback.suggestion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          feedback.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      
      setFeedbacks(data);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      showToast('Failed to load feedback', 'error');
    } finally {
      setLoading(false);
    }
  }, [mode, filters, searchTerm, showToast]);

  const fetchStats = useCallback(async () => {
    try {
      if (mode === 'admin') {
        const statsData = await feedbackService.getFeedbackStats();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [mode]);

  const fetchMetadata = useCallback(async () => {
    try {
      const [sectionsData, typesData] = await Promise.all([
        feedbackService.getSections(),
        feedbackService.getTypes(),
      ]);
      
      setSections([{ value: 'all', label: 'All Sections' }, ...sectionsData]);
      setTypes([{ value: 'all', label: 'All Types' }, ...typesData]);
    } catch (error) {
      console.error('Error loading metadata:', error);
    }
  }, []);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([fetchFeedbacks(), fetchStats(), fetchMetadata()]);
      showToast('Feedback refreshed', 'success');
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
    fetchStats();
    fetchMetadata();
  }, [fetchFeedbacks, fetchStats, fetchMetadata]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;
    
    try {
      await feedbackService.deleteFeedback(id);
      showToast('Feedback deleted successfully', 'success');
      fetchFeedbacks();
    } catch (error) {
      console.error('Error deleting feedback:', error);
      showToast('Failed to delete feedback', 'error');
    }
  };

  const handleVote = async (feedbackId: string) => {
    try {
      await feedbackService.voteFeedback(feedbackId);
      showToast('Vote recorded', 'success');
      fetchFeedbacks();
    } catch (error) {
      console.error('Error voting:', error);
      showToast('Failed to record vote', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <Bug className="h-4 w-4" />;
      case 'feature_request': return <Zap className="h-4 w-4" />;
      case 'improvement': return <TrendingUp className="h-4 w-4" />;
      case 'complaint': return <AlertCircle className="h-4 w-4" />;
      case 'compliment': return <Star className="h-4 w-4" />;
      case 'question': return <HelpCircle className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const SkeletonCard = () => (
    <div className="border border-gray-200 rounded-xl bg-white animate-pulse overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
          <div className="flex gap-1.5">
            <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
            <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
          </div>
        </div>
        
        <div className="h-3 w-full bg-gray-200 rounded mb-2"></div>
        <div className="h-3 w-3/4 bg-gray-200 rounded mb-4"></div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
            <div className="h-3 w-16 bg-gray-200 rounded"></div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
            <div className="h-3 w-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 bg-gray-50 flex items-center justify-between border-t border-gray-100">
        <div className="h-2 w-20 bg-gray-200 rounded"></div>
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
          <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="h-16 flex items-center px-6 flex-shrink-0 bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">
                {mode === 'admin' ? 'Feedback Management' :
                 mode === 'public' ? 'Feature Requests' :
                 mode === 'my' ? 'My Feedback' : 'Assigned to Me'}
              </h1>
              <p className="text-blue-100 text-xs">
                {mode === 'admin' ? 'Manage user feedback and feature requests' :
                 mode === 'public' ? 'View and vote on public feedback' :
                 mode === 'my' ? 'Your submitted feedback' : 'Feedback assigned to you'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors disabled:opacity-60"
              title="Refresh"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </button>
            
            {mode !== 'public' && (
              <Link
                href="/feedback/create"
                className="px-3 py-1.5 bg-white text-blue-600 font-medium rounded-lg hover:bg-gray-100 flex items-center gap-1.5 text-sm"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Feedback</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {/* Stats Cards (Admin only) */}
        {mode === 'admin' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Feedback', value: stats.total || 0, icon: MessageSquare, color: '#3b82f6' },
              { label: 'New', value: stats.new || 0, icon: Clock, color: '#f59e0b' },
              { label: 'In Progress', value: stats.in_progress || 0, icon: TrendingUp, color: '#8b5cf6' },
              { label: 'Resolved', value: stats.resolved || 0, icon: CheckCircle, color: '#10b981' },
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="text-xl font-bold text-gray-800">{item.value}</p>
                  </div>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: item.color + '20' }}>
                    <item.icon className="h-5 w-5" style={{ color: item.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 md:p-5 border-b border-gray-100 bg-gray-50">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search feedback..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                {mode !== 'public' && (
                  <div className="relative">
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="pl-3 pr-8 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                      disabled={loading}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <Filter className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                )}
                
                <div className="relative">
                  <select
                    value={filters.section}
                    onChange={(e) => setFilters(prev => ({ ...prev, section: e.target.value }))}
                    className="pl-3 pr-8 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                    disabled={loading || sections.length === 0}
                  >
                    {sections.map((section) => (
                      <option key={section.value} value={section.value}>
                        {section.label}
                      </option>
                    ))}
                  </select>
                  <Tag className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                
                <div className="relative">
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                    className="pl-3 pr-8 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                    disabled={loading || types.length === 0}
                  >
                    {types.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <MessageSquare className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                
                {mode !== 'public' && (
                  <div className="relative">
                    <select
                      value={filters.priority}
                      onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                      className="pl-3 pr-8 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                      disabled={loading}
                    >
                      {priorityOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <AlertCircle className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                )}
                
                <div className="relative">
                  <select
                    value={filters.sort}
                    onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}
                    className="pl-3 pr-8 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                    disabled={loading}
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <TrendingUp className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Feedback Grid */}
          <div className="p-4 md:p-5">
            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="text-center py-10">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mb-4">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-800 mb-1">No feedback found</h3>
                <p className="text-gray-500 text-sm mb-4 max-w-md mx-auto">
                  {searchTerm || filters.status !== 'all' || filters.section !== 'all' || filters.type !== 'all'
                    ? 'Try adjusting your search or filters.'
                    : mode === 'public' ? 'Be the first to submit feedback!'
                    : 'No feedback has been submitted yet.'}
                </p>
                <Link
                  href="/feedback/create"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Submit Feedback
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {feedbacks.map((feedback) => (
                  <div 
                    key={feedback._id} 
                    className="border border-gray-200 rounded-xl bg-white hover:shadow-md transition-shadow overflow-hidden flex flex-col"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(feedback.type)}
                          <h3 className="font-semibold text-gray-800 text-sm truncate flex-1">
                            {feedback.title}
                          </h3>
                        </div>
                        <div className="flex gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${feedbackService.getStatusColor(feedback.status)}`}>
                            {feedbackService.getStatusText(feedback.status)}
                          </span>
                          {mode !== 'public' && (
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${feedbackService.getPriorityColor(feedback.priority)}`}>
                              {feedback.priority.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                        {feedback.description}
                      </p>

                      {feedback.suggestion && (
                        <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-100">
                          <p className="text-xs font-medium text-blue-800 mb-1">Suggestion:</p>
                          <p className="text-xs text-blue-700 line-clamp-2">{feedback.suggestion}</p>
                        </div>
                      )}

                      {/* Meta */}
                      <div className="space-y-1.5 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Tag className="h-3 w-3 flex-shrink-0" />
                          <span>{feedbackService.getSectionDisplayName(feedback.section)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3 flex-shrink-0" />
                          <span>{feedback.userName || 'Anonymous'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span>{feedbackService.getRelativeTime(feedback.createdAt || '')}</span>
                        </div>
                      </div>

                      {/* Tags */}
                      {feedback.tags && feedback.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {feedback.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                          {feedback.tags.length > 3 && (
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded text-xs">
                              +{feedback.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="px-4 py-2.5 bg-gray-50 flex items-center justify-between border-t border-gray-100">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleVote(feedback.id)}
                          className="flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600"
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                          <span>{feedback.voteCount}</span>
                        </button>
                        
                        {feedback.comments && feedback.comments.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>{feedback.comments.length}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-1.5">
                        <Link
                          href={`/feedback/${feedback._id}`}
                          className="p-1.5 rounded hover:bg-gray-200 text-gray-600"
                          title="View"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                        
                        {mode === 'admin' && (
                          <>
                            <Link
                              href={`/feedback/${feedback._id}/edit`}
                              className="p-1.5 rounded hover:bg-gray-200 text-gray-600"
                              title="Edit"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Link>
                            <button
                              onClick={() => handleDelete(feedback._id!)}
                              className="p-1.5 rounded hover:bg-gray-200 text-gray-600"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status Summary (Admin only) */}
        {mode === 'admin' && stats?.bySection && (
        <div className="bg-white rounded-xl p-5 border border-gray-200">
            <h3 className="font-medium text-gray-800 mb-3">Feedback by Section</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {(() => {
                // Handle different possible structures
                const sectionsData = stats.bySection;
                
                if (Array.isArray(sectionsData)) {
                return sectionsData.map((item: any) => {
                    const sectionName = item._id || item.section || item.name || 'unknown';
                    const count = item.count || item.total || 0;
                    
                    return (
                    <div key={sectionName} className="p-3 rounded-lg bg-gray-50">
                        <div className="text-xs text-gray-600 capitalize mb-1">
                        {feedbackService.getSectionDisplayName(sectionName)}
                        </div>
                        <div className="text-lg font-semibold text-gray-800">{count}</div>
                    </div>
                    );
                });
                } else if (typeof sectionsData === 'object' && sectionsData !== null) {
                return Object.entries(sectionsData).map(([section, countOrObj]) => {
                    const count = typeof countOrObj === 'object' 
                    ? (countOrObj as any).count || (countOrObj as any).total || 0
                    : countOrObj;
                    
                    return (
                    <div key={section} className="p-3 rounded-lg bg-gray-50">
                        <div className="text-xs text-gray-600 capitalize mb-1">
                        {feedbackService.getSectionDisplayName(section)}
                        </div>
                        <div className="text-lg font-semibold text-gray-800">{count}</div>
                    </div>
                    );
                });
                }
                
                return null;
            })()}
            </div>
        </div>
        )}
      </div>
    </div>
  );
}