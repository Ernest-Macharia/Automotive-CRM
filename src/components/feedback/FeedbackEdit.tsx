'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  MessageSquare, ArrowLeft, Save, X, Loader2,
  Tag, User, AlertCircle, CheckCircle, Clock,
  TrendingUp, Bug, Zap, Star, HelpCircle
} from 'lucide-react';
import { feedbackService, UpdateFeedbackData } from '@/services/feedbackService';
import { useToast } from '@/contexts/ToastContext';

interface FeedbackEditProps {
  feedbackId: string;
}

export default function FeedbackEdit({ feedbackId }: FeedbackEditProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    section: '',
    type: '',
    title: '',
    description: '',
    suggestion: '',
    status: 'new' as 'new' | 'reviewed' | 'in_progress' | 'resolved' | 'rejected' | 'duplicate',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    assignedTo: '',
    tags: [] as string[],
    newTag: '',
  });

  useEffect(() => {
    fetchFeedback();
    fetchMetadata();
    fetchUsers();
  }, [feedbackId]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const data = await feedbackService.getFeedbackById(feedbackId);
      
      setFormData({
        section: data.section,
        type: data.type,
        title: data.title,
        description: data.description,
        suggestion: data.suggestion || '',
        status: data.status,
        priority: data.priority,
        assignedTo: typeof data.assignedTo === 'string' ? data.assignedTo : data.assignedTo?._id || '',
        tags: data.tags || [],
        newTag: '',
      });
    } catch (error) {
      console.error('Error fetching feedback:', error);
      showToast('Failed to load feedback', 'error');
      router.push('/feedback');
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [sectionsData, typesData] = await Promise.all([
        feedbackService.getSections(),
        feedbackService.getTypes(),
      ]);
      
      setSections(sectionsData);
      setTypes(typesData);
    } catch (error) {
      console.error('Error loading metadata:', error);
    }
  };

  const fetchUsers = async () => {
    // Mock users - replace with actual API call
    setUsers([
      { _id: '1', name: 'John Doe', email: 'john@company.com' },
      { _id: '2', name: 'Jane Smith', email: 'jane@company.com' },
      { _id: '3', name: 'Mike Johnson', email: 'mike@company.com' },
      { _id: '', name: 'Unassigned', email: '' },
    ]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && formData.newTag.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(formData.newTag.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, prev.newTag.trim()],
          newTag: '',
        }));
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      const updateData: UpdateFeedbackData = {
        section: formData.section,
        type: formData.type,
        title: formData.title,
        description: formData.description,
        suggestion: formData.suggestion || undefined,
        status: formData.status,
        priority: formData.priority,
        assignedTo: formData.assignedTo || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
      };
      
      await feedbackService.updateFeedback(feedbackId, updateData);
      showToast('Feedback updated successfully!', 'success');
      router.push(`/feedback/${feedbackId}`);
      
    } catch (error: any) {
      console.error('Error updating feedback:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      showToast(`Failed to update feedback: ${errorMessage}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/feedback/${feedbackId}`);
  };

  const statusOptions = [
    { value: 'new', label: 'New', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'reviewed', label: 'Reviewed', color: 'bg-blue-100 text-blue-700' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-purple-100 text-purple-700' },
    { value: 'resolved', label: 'Resolved', color: 'bg-green-100 text-green-700' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700' },
    { value: 'duplicate', label: 'Duplicate', color: 'bg-gray-100 text-gray-700' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-700' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-700' },
    { value: 'high', label: 'High', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div className="p-2 bg-white/20 rounded-xl">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Edit Feedback</h1>
                <p className="text-blue-100 text-sm">Editing: {formData.title}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="max-w-4xl mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Edit Feedback Details</h2>
            
            {/* Basic Information */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section *
                  </label>
                  <select
                    name="section"
                    value={formData.section}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                    required
                  >
                    <option value="">Select a section</option>
                    {sections.map((section) => (
                      <option key={section.value} value={section.value}>
                        {section.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                    required
                  >
                    <option value="">Select a type</option>
                    {types.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suggestion
                </label>
                <textarea
                  name="suggestion"
                  value={formData.suggestion}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-none"
                />
              </div>

              {/* Status & Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {statusOptions.map((status) => (
                      <button
                        key={status.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, status: status.value as any }))}
                        className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                          formData.status === status.value
                            ? `${status.color} border-blue-500 ring-2 ring-blue-200`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {priorityOptions.map((priority) => (
                      <button
                        key={priority.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, priority: priority.value as any }))}
                        className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                          formData.priority === priority.value
                            ? `${priority.color} border-blue-500 ring-2 ring-blue-200`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {priority.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Assign To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign To
                </label>
                <select
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                >
                  {users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.name} {user.email ? `(${user.email})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-blue-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <input
                  type="text"
                  value={formData.newTag}
                  onChange={(e) => setFormData(prev => ({ ...prev, newTag: e.target.value }))}
                  onKeyDown={handleTagInput}
                  placeholder="Type a tag and press Enter"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}