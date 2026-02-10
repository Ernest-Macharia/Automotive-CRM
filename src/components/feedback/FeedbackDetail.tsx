'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare, ArrowLeft, Edit, Trash2, ThumbsUp,
  User, Mail, Phone, Tag, Calendar, Clock,
  Loader2, CheckCircle, AlertCircle, Zap,
  TrendingUp, Bug, Star, HelpCircle, Share2,
  Copy, ChevronDown, Send, Eye, EyeOff
} from 'lucide-react';
import { feedbackService, Feedback, FeedbackComment } from '@/services/feedbackService';
import { useToast } from '@/contexts/ToastContext';
import { format } from 'date-fns';

interface FeedbackDetailProps {
  feedbackId: string;
}

export default function FeedbackDetail({ feedbackId }: FeedbackDetailProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [showInternalComments, setShowInternalComments] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchFeedback();
    fetchUsers();
  }, [feedbackId]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const data = await feedbackService.getFeedbackById(feedbackId);
      setFeedback(data);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      showToast('Failed to load feedback details', 'error');
      router.push('/feedback');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    // Mock users - replace with actual API call
    setUsers([
      { _id: '1', name: 'John Doe', email: 'john@company.com', role: 'admin' },
      { _id: '2', name: 'Jane Smith', email: 'jane@company.com', role: 'support' },
      { _id: '3', name: 'Mike Johnson', email: 'mike@company.com', role: 'developer' },
    ]);
  };

  const handleStatusUpdate = async (status: string) => {
    try {
      setUpdating(true);
      await feedbackService.updateFeedback(feedbackId, { status: status as any });
      showToast(`Feedback marked as ${status.replace('_', ' ')}`, 'success');
      fetchFeedback();
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Failed to update status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handlePriorityUpdate = async (priority: string) => {
    try {
      setUpdating(true);
      await feedbackService.updateFeedback(feedbackId, { priority: priority as any });
      showToast(`Priority updated to ${priority}`, 'success');
      fetchFeedback();
    } catch (error) {
      console.error('Error updating priority:', error);
      showToast('Failed to update priority', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedUserId) {
      showToast('Please select a user', 'error');
      return;
    }

    try {
      setUpdating(true);
      await feedbackService.assignFeedback(feedbackId, selectedUserId);
      showToast('Feedback assigned successfully', 'success');
      setShowAssignModal(false);
      fetchFeedback();
    } catch (error) {
      console.error('Error assigning feedback:', error);
      showToast('Failed to assign feedback', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleVote = async () => {
    try {
      const result = await feedbackService.voteFeedback(feedbackId);
      showToast(result.voted ? 'Vote added' : 'Vote removed', 'success');
      fetchFeedback();
    } catch (error) {
      console.error('Error voting:', error);
      showToast('Failed to record vote', 'error');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      showToast('Please enter a comment', 'error');
      return;
    }

    try {
      setUpdating(true);
      await feedbackService.addComment(feedbackId, {
        content: newComment.trim(),
        isInternal: isInternalComment,
        userName: 'Current User', // Replace with actual user
        userEmail: 'user@example.com', // Replace with actual email
      });
      
      showToast('Comment added successfully', 'success');
      setNewComment('');
      setIsInternalComment(false);
      fetchFeedback();
      
      if (commentInputRef.current) {
        commentInputRef.current.focus();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      showToast('Failed to add comment', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;
    
    try {
      await feedbackService.deleteFeedback(feedbackId);
      showToast('Feedback deleted successfully', 'success');
      router.push('/feedback');
    } catch (error) {
      console.error('Error deleting feedback:', error);
      showToast('Failed to delete feedback', 'error');
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    showToast('Link copied to clipboard', 'success');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <Bug className="h-5 w-5 text-red-500" />;
      case 'feature_request': return <Zap className="h-5 w-5 text-yellow-500" />;
      case 'improvement': return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case 'complaint': return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'compliment': return <Star className="h-5 w-5 text-green-500" />;
      case 'question': return <HelpCircle className="h-5 w-5 text-purple-500" />;
      default: return <MessageSquare className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPpp');
    } catch {
      return 'Invalid date';
    }
  };

  const getCommentsToShow = () => {
    if (!feedback?.comments) return [];
    return feedback.comments.filter(comment => 
      !comment.isInternal || showInternalComments
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!feedback) return null;

  const commentsToShow = getCommentsToShow();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div className="p-2 bg-white/20 rounded-xl">
                {getTypeIcon(feedback.type)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{feedback.title}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    feedbackService.getStatusColor(feedback.status)
                  }`}>
                    {feedbackService.getStatusText(feedback.status)}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    feedbackService.getPriorityColor(feedback.priority)
                  }`}>
                    {feedback.priority.toUpperCase()}
                  </span>
                  <span className="text-blue-100 text-xs">
                    {feedbackService.getRelativeTime(feedback.createdAt || '')}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="p-2 hover:bg-white/20 rounded-xl text-white"
                title="Copy link"
              >
                <Copy className="h-5 w-5" />
              </button>
              <button
                onClick={() => router.push(`/feedback/${feedbackId}/edit`)}
                className="p-2 hover:bg-white/20 rounded-xl text-white"
                title="Edit"
              >
                <Edit className="h-5 w-5" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 hover:bg-white/20 rounded-xl text-red-300 hover:text-red-100"
                title="Delete"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Feedback Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Feedback Content */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    {getTypeIcon(feedback.type)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">
                      {feedbackService.getTypeDisplayName(feedback.type)}
                    </h2>
                    <p className="text-sm text-gray-600">
                      In {feedbackService.getSectionDisplayName(feedback.section)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleVote}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span className="font-medium">{feedback.voteCount}</span>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-line">{feedback.description}</p>
                </div>
              </div>

              {/* Suggestion */}
              {feedback.suggestion && (
                <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">Suggestion</h3>
                  <p className="text-blue-700 whitespace-pre-line">{feedback.suggestion}</p>
                </div>
              )}

              {/* Screenshot */}
              {feedback.screenshot && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Screenshot</h3>
                  <div className="rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={feedback.screenshot}
                      alt="Feedback screenshot"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              )}

              {/* Tags */}
              {feedback.tags && feedback.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {feedback.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-800">Comments</h2>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowInternalComments(!showInternalComments)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    {showInternalComments ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showInternalComments ? 'Hide Internal' : 'Show Internal'}
                  </button>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-4 mb-6">
                {commentsToShow.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No comments yet</p>
                  </div>
                ) : (
                  commentsToShow.map((comment, index) => (
                    <div
                      key={comment._id || index}
                      className={`p-4 rounded-xl ${
                        comment.isInternal
                          ? 'bg-purple-50 border border-purple-100'
                          : 'bg-gray-50 border border-gray-100'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {(comment.userName || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">
                              {comment.userName || 'Anonymous'}
                              {comment.isInternal && (
                                <span className="ml-2 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                                  Internal
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {comment.userEmail} • {formatDate(comment.createdAt || '')}
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700 whitespace-pre-line">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    Y
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">You</div>
                    <div className="text-xs text-gray-500">Add a comment...</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <textarea
                    ref={commentInputRef}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Type your comment here..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-none"
                  />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="internalComment"
                        checked={isInternalComment}
                        onChange={(e) => setIsInternalComment(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <label htmlFor="internalComment" className="text-sm text-gray-600">
                        Internal comment (visible to staff only)
                      </label>
                    </div>
                    
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || updating}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {updating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      {updating ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Status & Actions */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Status & Actions</h2>
              
              <div className="space-y-4">
                {/* Status */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Status</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'new', label: 'New', icon: Clock, color: 'bg-yellow-100 text-yellow-700' },
                      { value: 'reviewed', label: 'Reviewed', icon: Eye, color: 'bg-blue-100 text-blue-700' },
                      { value: 'in_progress', label: 'In Progress', icon: TrendingUp, color: 'bg-purple-100 text-purple-700' },
                      { value: 'resolved', label: 'Resolved', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
                    ].map((status) => (
                      <button
                        key={status.value}
                        type="button"
                        onClick={() => handleStatusUpdate(status.value)}
                        disabled={updating || feedback.status === status.value}
                        className={`px-3 py-2.5 rounded-lg flex flex-col items-center justify-center gap-1 border transition-all ${
                          feedback.status === status.value
                            ? `${status.color} border-blue-500 ring-2 ring-blue-200`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <status.icon className="h-4 w-4" />
                        <span className="text-xs font-medium">{status.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Priority</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'low', label: 'Low', color: 'bg-green-100 text-green-700' },
                      { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-700' },
                      { value: 'high', label: 'High', color: 'bg-yellow-100 text-yellow-700' },
                      { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700' },
                    ].map((priority) => (
                      <button
                        key={priority.value}
                        type="button"
                        onClick={() => handlePriorityUpdate(priority.value)}
                        disabled={updating || feedback.priority === priority.value}
                        className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                          feedback.priority === priority.value
                            ? `${priority.color} border-blue-500 ring-2 ring-blue-200`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {priority.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Assign */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Assigned To</h3>
                  {feedback.assignedTo ? (
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {typeof feedback.assignedTo === 'object' && feedback.assignedTo.name
                            ? feedback.assignedTo.name.charAt(0).toUpperCase()
                            : 'U'}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">
                            {typeof feedback.assignedTo === 'object'
                              ? feedback.assignedTo.name
                              : 'User'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {typeof feedback.assignedTo === 'object' && feedback.assignedTo.email}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowAssignModal(true)}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAssignModal(true)}
                      className="w-full py-2.5 text-center border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400"
                    >
                      + Assign to someone
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Details</h2>
              
              <div className="space-y-4">
                {/* Submitter Info */}
                {!feedback.isAnonymous && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Submitted By</h3>
                    <div className="space-y-2">
                      {feedback.userName && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>{feedback.userName}</span>
                        </div>
                      )}
                      {feedback.userEmail && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span>{feedback.userEmail}</span>
                        </div>
                      )}
                      {feedback.userPhone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{feedback.userPhone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Dates</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>Created: {formatDate(feedback.createdAt || '')}</span>
                    </div>
                    {feedback.updatedAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>Updated: {formatDate(feedback.updatedAt)}</span>
                      </div>
                    )}
                    {feedback.assignedAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>Assigned: {formatDate(feedback.assignedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Technical Info */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Technical Info</h3>
                  <div className="space-y-2 text-sm">
                    {feedback.currentUrl && (
                      <div className="truncate">
                        <div className="text-gray-500">URL:</div>
                        <div className="truncate text-blue-600">{feedback.currentUrl}</div>
                      </div>
                    )}
                    {feedback.browserInfo && (
                      <div>
                        <div className="text-gray-500">Browser:</div>
                        <div className="truncate">{feedback.browserInfo}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Assign Feedback</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select User
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                  >
                    <option value="">Select a user...</option>
                    {users.map(user => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssign}
                    disabled={!selectedUserId || updating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updating ? 'Assigning...' : 'Assign'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}