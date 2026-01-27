'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Target, Calendar, User, Star, TrendingUp, TrendingDown, Filter, Search, Plus, Edit, Eye, CheckCircle, Clock, AlertCircle, FileText, MessageSquare } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { hrService, PerformancePlan } from '@/services/settings/hrService';

interface HRPerformancePlansProps {
  planId?: string;
}

export default function HRPerformancePlans({ planId }: HRPerformancePlansProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<PerformancePlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PerformancePlan | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comments: '',
    achievements: [''],
    areasForImprovement: [''],
    actionPlan: '',
  });

  useEffect(() => {
    if (planId) {
      loadPlanDetails();
    } else {
      loadAllPlans();
    }
  }, [planId]);

  const loadAllPlans = async () => {
    try {
      setLoading(true);
      const data = await hrService.getPerformancePlans();
      setPlans(data);
    } catch (error) {
      console.error('Error loading performance plans:', error);
      showToast('Failed to load performance plans', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadPlanDetails = async () => {
    try {
      setLoading(true);
      const allPlans = await hrService.getPerformancePlans();
      const plan = allPlans.find(p => p.id === planId);
      setSelectedPlan(plan || null);
    } catch (error) {
      console.error('Error loading plan details:', error);
      showToast('Failed to load plan details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'terminated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingColor = (rating: number) => {
    return hrService.getRatingColor(rating);
  };

  const getRatingIcon = (rating: number) => {
    return hrService.getRatingIcon(rating);
  };

  const formatDate = (dateString?: string) => {
    return hrService.formatDate(dateString);
  };

  const handleAddReview = async () => {
    if (!selectedPlan) return;

    try {
      // This would typically call an API endpoint to add a review
      const newReview = {
        reviewDate: new Date().toISOString().split('T')[0],
        reviewer: 'HR Manager', // This would be the current user
        rating: reviewData.rating,
        comments: reviewData.comments,
        achievements: reviewData.achievements.filter(a => a.trim() !== ''),
        areasForImprovement: reviewData.areasForImprovement.filter(a => a.trim() !== ''),
        actionPlan: reviewData.actionPlan,
        completed: true,
      };

      showToast('Performance review added successfully', 'success');
      setShowReviewModal(false);
      setReviewData({
        rating: 5,
        comments: '',
        achievements: [''],
        areasForImprovement: [''],
        actionPlan: '',
      });

      // Refresh the data
      if (planId) {
        loadPlanDetails();
      } else {
        loadAllPlans();
      }
    } catch (error) {
      console.error('Error adding review:', error);
      showToast('Failed to add review', 'error');
    }
  };

  const addArrayItem = (field: 'achievements' | 'areasForImprovement') => {
    setReviewData(prev => ({
      ...prev,
      [field]: [...prev[field], ''],
    }));
  };

  const updateArrayItem = (field: 'achievements' | 'areasForImprovement', index: number, value: string) => {
    setReviewData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item),
    }));
  };

  const removeArrayItem = (field: 'achievements' | 'areasForImprovement', index: number) => {
    setReviewData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = searchTerm === '' || 
      plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (plan.employeeProfile?.name || plan.employee).toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && plan.status === filterStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Loading performance plans...</p>
      </div>
    );
  }

  if (planId && selectedPlan) {
    const averageRating = selectedPlan.reviews && selectedPlan.reviews.length > 0
      ? selectedPlan.reviews.reduce((sum, review) => sum + review.rating, 0) / selectedPlan.reviews.length
      : 0;
    
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{selectedPlan.title}</h2>
            <p className="text-gray-600 mt-1">
              {selectedPlan.employeeProfile?.name || selectedPlan.employee} • 
              {selectedPlan.status === 'active' ? ' Active' : ` ${selectedPlan.status}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReviewModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Review
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Plan Overview</h3>
                  <p className="text-gray-600 mt-1">Performance improvement plan details</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedPlan.status)}`}>
                  {selectedPlan.status}
                </span>
              </div>

              <p className="text-gray-700 mb-6">{selectedPlan.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Employee</p>
                  <p className="font-medium text-gray-900">
                    {selectedPlan.employeeProfile?.name || selectedPlan.employee}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">HR Manager</p>
                  <p className="font-medium text-gray-900">
                    {selectedPlan.hrManager?.name || 'Not assigned'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Start Date</p>
                  <p className="font-medium text-gray-900">{formatDate(selectedPlan.startDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">End Date</p>
                  <p className="font-medium text-gray-900">{formatDate(selectedPlan.endDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Review Frequency</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {selectedPlan.reviewFrequency || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Plan Status</p>
                  <p className="font-medium text-gray-900 capitalize">{selectedPlan.status}</p>
                </div>
              </div>

              {selectedPlan.hrManagerNotes && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">HR Manager Notes</p>
                  <p className="text-gray-700">{selectedPlan.hrManagerNotes}</p>
                </div>
              )}

              {selectedPlan.employeeFeedback && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Employee Feedback</p>
                  <p className="text-gray-700">{selectedPlan.employeeFeedback}</p>
                </div>
              )}
            </div>

            {selectedPlan.goals && selectedPlan.goals.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Goals & Objectives</h3>
                <div className="space-y-3">
                  {selectedPlan.goals.map((goal, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center mt-0.5">
                        <Target className="h-3 w-3 text-white" />
                      </div>
                      <p className="text-gray-700">{goal}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-blue-600">Average Rating</p>
                <Star className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-blue-900">
                  {averageRating.toFixed(1)}
                </span>
                <span className={`px-2 py-1 text-xs rounded ${getRatingColor(averageRating)}`}>
                  {getRatingIcon(averageRating)}
                </span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                Based on {selectedPlan.reviews?.length || 0} reviews
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-green-600">Time Remaining</p>
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-900">
                {selectedPlan.endDate ? (
                  (() => {
                    const today = new Date();
                    const endDate = new Date(selectedPlan.endDate);
                    const diffTime = endDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return `${Math.max(0, diffDays)} days`;
                  })()
                ) : 'Ongoing'}
              </p>
              <p className="text-sm text-green-700 mt-1">
                Ends {formatDate(selectedPlan.endDate)}
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-purple-600">Progress Status</p>
                {selectedPlan.status === 'active' && <TrendingUp className="h-5 w-5 text-purple-600" />}
                {selectedPlan.status === 'completed' && <CheckCircle className="h-5 w-5 text-purple-600" />}
                {selectedPlan.status === 'terminated' && <TrendingDown className="h-5 w-5 text-purple-600" />}
              </div>
              <p className="text-2xl font-bold text-purple-900 capitalize">{selectedPlan.status}</p>
              <p className="text-sm text-purple-700 mt-1">
                {selectedPlan.outcome ? `Outcome: ${selectedPlan.outcome}` : 'In progress'}
              </p>
            </div>

            {selectedPlan.reviews && selectedPlan.reviews.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Recent Reviews</h4>
                <div className="space-y-3">
                  {selectedPlan.reviews.slice(0, 3).map((review, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`px-2 py-1 text-xs rounded ${getRatingColor(review.rating)}`}>
                          {getRatingIcon(review.rating)}
                        </span>
                        <span className="text-xs text-gray-600">{formatDate(review.reviewDate)}</span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">{review.comments}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {selectedPlan.reviews && selectedPlan.reviews.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Reviews</h3>
            <div className="space-y-4">
              {selectedPlan.reviews.map((review, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900">Review #{index + 1}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDate(review.reviewDate)} • By {review.reviewer}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded ${getRatingColor(review.rating)}`}>
                        {getRatingIcon(review.rating)} ({review.rating.toFixed(1)})
                      </span>
                      {review.completed && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </div>

                  {review.comments && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-1">Comments</p>
                      <p className="text-gray-700">{review.comments}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {review.achievements && review.achievements.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Achievements</p>
                        <ul className="space-y-1">
                          {review.achievements.map((achievement, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle className="h-3 w-3 text-green-600 mt-0.5" />
                              <span className="text-sm text-gray-700">{achievement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {review.areasForImprovement && review.areasForImprovement.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Areas for Improvement</p>
                        <ul className="space-y-1">
                          {review.areasForImprovement.map((area, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <AlertCircle className="h-3 w-3 text-yellow-600 mt-0.5" />
                              <span className="text-sm text-gray-700">{area}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {review.actionPlan && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">Action Plan</p>
                      <p className="text-gray-700">{review.actionPlan}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Performance Review</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating (1-5)
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setReviewData(prev => ({ ...prev, rating }))}
                        className={`flex-1 py-2 rounded-lg border ${
                          reviewData.rating === rating
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <Star className="h-4 w-4" />
                          {rating}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comments
                  </label>
                  <textarea
                    value={reviewData.comments}
                    onChange={(e) => setReviewData(prev => ({ ...prev, comments: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Add your comments about this performance review..."
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Achievements
                    </label>
                    <button
                      type="button"
                      onClick={() => addArrayItem('achievements')}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Add Achievement
                    </button>
                  </div>
                  <div className="space-y-2">
                    {reviewData.achievements.map((achievement, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={achievement}
                          onChange={(e) => updateArrayItem('achievements', index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Enter an achievement"
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem('achievements', index)}
                          className="p-1 text-red-600 hover:text-red-800"
                          disabled={reviewData.achievements.length === 1}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Areas for Improvement
                    </label>
                    <button
                      type="button"
                      onClick={() => addArrayItem('areasForImprovement')}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Add Area
                    </button>
                  </div>
                  <div className="space-y-2">
                    {reviewData.areasForImprovement.map((area, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={area}
                          onChange={(e) => updateArrayItem('areasForImprovement', index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Enter area for improvement"
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem('areasForImprovement', index)}
                          className="p-1 text-red-600 hover:text-red-800"
                          disabled={reviewData.areasForImprovement.length === 1}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action Plan
                  </label>
                  <textarea
                    value={reviewData.actionPlan}
                    onChange={(e) => setReviewData(prev => ({ ...prev, actionPlan: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={2}
                    placeholder="Recommended action plan for improvement..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddReview}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Add Review
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // All plans view
  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Performance Plans</h2>
            <p className="text-gray-600 mt-1">Manage employee performance improvement plans</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search plans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Plans</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="terminated">Terminated</option>
            </select>
            
            <button
              onClick={() => router.push('/hr/performance/create')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Plan
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Timeline</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rating</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Reviews</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlans.map((plan, index) => {
              const averageRating = plan.reviews && plan.reviews.length > 0
                ? plan.reviews.reduce((sum, review) => sum + review.rating, 0) / plan.reviews.length
                : 0;
              
              return (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{plan.title}</p>
                      <p className="text-sm text-gray-600 line-clamp-1">{plan.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-gray-900">{plan.employeeProfile?.name || plan.employee}</p>
                        <p className="text-sm text-gray-600">ID: {plan.employee}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="flex items-center gap-1 text-sm text-gray-900">
                        <Calendar className="h-3 w-3" />
                        {formatDate(plan.startDate)}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(plan.endDate)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(plan.status)}`}>
                      {plan.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded ${getRatingColor(averageRating)}`}>
                        {getRatingIcon(averageRating)}
                      </span>
                      <span className="font-medium text-gray-900">
                        {averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-900">{plan.reviews?.length || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/hr/performance/${plan.id}`)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/hr/performance/${plan.id}/edit`)}
                        className="p-1 text-green-600 hover:text-green-800"
                        title="Edit Plan"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/hr/performance/${plan.id}/reviews`)}
                        className="p-1 text-purple-600 hover:text-purple-800"
                        title="View Reviews"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredPlans.length === 0 && (
        <div className="py-12 text-center">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-gray-700 font-medium">No performance plans found</h3>
          <p className="text-gray-500 text-sm mt-1">
            {searchTerm ? 'Try a different search term' : 'No performance plans available'}
          </p>
          <button
            onClick={() => router.push('/hr/performance/create')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create First Plan
          </button>
        </div>
      )}
    </div>
  );
}
