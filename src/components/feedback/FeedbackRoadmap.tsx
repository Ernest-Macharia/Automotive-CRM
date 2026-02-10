'use client';

import { useState, useEffect } from 'react';
import {
  MessageSquare, Calendar, Users, TrendingUp,
  CheckCircle, Clock, AlertCircle, Filter, ThumbsUp
} from 'lucide-react';
import { feedbackService } from '@/services/feedbackService';
import { useToast } from '@/contexts/ToastContext';

export default function FeedbackRoadmap() {
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [filter, setFilter] = useState('feature_request');
  const [timeframe, setTimeframe] = useState('upcoming');

  useEffect(() => {
    fetchRoadmapFeedbacks();
  }, [filter, timeframe]);

  const fetchRoadmapFeedbacks = async () => {
    try {
      setLoading(true);
      // Fetch feedback with specific filters for roadmap
      const data = await feedbackService.getPublicFeedback({
        type: filter,
        sort: 'popular',
      });
      
      // Filter by status for roadmap
      const roadmapData = data.filter(feedback => 
        feedback.status === 'reviewed' || 
        feedback.status === 'in_progress' ||
        feedback.status === 'resolved'
      );
      
      setFeedbacks(roadmapData);
    } catch (error) {
      console.error('Error fetching roadmap feedback:', error);
      showToast('Failed to load roadmap', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getRoadmapStatus = (status: string, priority: string) => {
    switch (status) {
      case 'reviewed':
        return { label: 'Planned', color: 'bg-blue-100 text-blue-800', icon: Calendar };
      case 'in_progress':
        return { label: 'In Progress', color: 'bg-purple-100 text-purple-800', icon: TrendingUp };
      case 'resolved':
        return { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle };
      default:
        return { label: 'Under Review', color: 'bg-gray-100 text-gray-800', icon: Clock };
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs">High</span>;
      case 'critical':
        return <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs">Critical</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl p-4 border border-gray-200 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Product Roadmap</h1>
            <p className="text-gray-600">See what we're working on and what's coming next</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 appearance-none"
              >
                <option value="feature_request">Feature Requests</option>
                <option value="improvement">Improvements</option>
                <option value="bug">Bug Fixes</option>
                <option value="all">All Items</option>
              </select>
            </div>
            
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
            >
              <option value="upcoming">Upcoming</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Recently Completed</option>
            </select>
          </div>
        </div>

        {/* Roadmap Timeline */}
        <div className="space-y-6">
          {/* Timeline Header */}
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Planned</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-600">In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Completed</span>
              </div>
            </div>
          </div>

          {/* Roadmap Items */}
          <div className="space-y-4">
            {feedbacks.length === 0 ? (
              <div className="text-center py-10">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No roadmap items yet</h3>
                <p className="text-gray-500">Check back soon for updates on upcoming features!</p>
              </div>
            ) : (
              feedbacks.map((feedback) => {
                const statusInfo = getRoadmapStatus(feedback.status, feedback.priority);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <div
                    key={feedback._id}
                    className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-800">{feedback.title}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {feedback.description}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusInfo.color}`}>
                          <StatusIcon className="h-3 w-3 inline mr-1" />
                          {statusInfo.label}
                        </span>
                        {getPriorityBadge(feedback.priority)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <ThumbsUp className="h-4 w-4" />
                          <span>{feedback.voteCount} votes</span>
                        </div>
                        
                        {feedback.comments && feedback.comments.length > 0 && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <MessageSquare className="h-4 w-4" />
                            <span>{feedback.comments.length} comments</span>
                          </div>
                        )}
                        
                        <div className="text-sm text-gray-500">
                          {feedbackService.getRelativeTime(feedback.createdAt || '')}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        {feedbackService.getSectionDisplayName(feedback.section)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Legend */}
          <div className="mt-8 p-4 bg-gray-50 rounded-xl">
            <h4 className="font-medium text-gray-700 mb-3">Roadmap Legend</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <div>
                  <div className="font-medium text-gray-800">Planned</div>
                  <div className="text-sm text-gray-600">Features we plan to implement</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <div>
                  <div className="font-medium text-gray-800">In Progress</div>
                  <div className="text-sm text-gray-600">Currently being developed</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <div>
                  <div className="font-medium text-gray-800">Completed</div>
                  <div className="text-sm text-gray-600">Recently shipped features</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}